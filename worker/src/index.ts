import { commissionConfig } from "../../data/commissions";
import { calculateEstimate } from "../../lib/commission/pricing";
import type {
  ApiErrorResponse,
  CommissionEstimate,
  CommissionRequestResponse,
  CommissionSubmission,
  ValidationIssue,
} from "../../lib/commission/types";
import {
  validateCommissionSubmission,
  validateEmail,
} from "../../lib/commission/validation";
import {
  buildCustomerConfirmationEmail,
  buildOwnerNotificationEmail,
  buildVerificationEmail,
  type EmailBrand,
  type EmailProvider,
  ResendEmailProvider,
} from "./email";
import type {
  D1Database,
  D1Result,
  Env,
  ExecutionContext,
  ScheduledController,
} from "./runtime-types";
import {
  constantTimeEqual,
  createCommissionRequestId,
  hasAttemptsRemaining,
  hmacHex,
  isChallengeExpired,
  normalizeEmail,
  randomOpaqueToken,
  randomVerificationCode,
  sha256Hex,
} from "./security";

const MAX_JSON_BYTES = 32_000;
const CODE_EXPIRY_SECONDS =
  commissionConfig.verification.expiresInMinutes * 60;
const RESEND_COOLDOWN_SECONDS =
  commissionConfig.verification.resendCooldownSeconds;
const MAX_VERIFICATION_ATTEMPTS =
  commissionConfig.verification.maxAttempts;
const MAX_EMAIL_DELIVERY_ATTEMPTS = 5;
const EMAIL_DELIVERY_CLAIM_SECONDS = 15 * 60;
const EMAIL_RECOVERY_BATCH_SIZE = 20;
const EMAIL_RECOVERY_CONCURRENCY = 4;
const EMAIL_RETRY_DELAYS_SECONDS = [60, 5 * 60, 30 * 60, 2 * 60 * 60] as const;

type DeliveryStatus = "pending" | "sending" | "sent" | "failed";
type DeliveryKind = "customer" | "owner";

export const RATE_LIMITS = {
  verificationSendIp: {
    scope: "verification-send-ip",
    maximum: 20,
    windowSeconds: 3_600,
  },
  verificationSendEmail: {
    scope: "verification-send-email",
    maximum: 5,
    windowSeconds: 3_600,
  },
  verificationCheckIp: {
    scope: "verification-check-ip",
    maximum: 50,
    windowSeconds: 600,
  },
  verificationCheckEmail: {
    scope: "verification-check-email",
    maximum: 15,
    windowSeconds: 600,
  },
  submissionIp: {
    scope: "commission-submit-ip",
    maximum: 20,
    windowSeconds: 3_600,
  },
  submissionEmail: {
    scope: "commission-submit-email",
    maximum: 10,
    windowSeconds: 3_600,
  },
} as const;

interface ChallengeRow {
  id: string;
  email: string;
  email_key: string;
  code_hash: string;
  created_at: number;
  expires_at: number;
  resend_available_at: number;
  attempts: number;
  consumed_at: number | null;
  invalidated_at: number | null;
  issued_token_hash: string | null;
}

interface VerificationTokenRow {
  token_hash: string;
  challenge_id: string;
  email: string;
  email_key: string;
  issued_at: number;
  expires_at: number;
  consumed_at: number | null;
  consumption_id: string | null;
}

interface CommissionRow {
  request_id: string;
  request_hash: string;
  verification_token_hash: string;
  submission_json: string;
  estimate_json: string;
  created_at: number;
  customer_email_status: DeliveryStatus;
  owner_email_status: DeliveryStatus;
}

interface CommissionDeliveryRow {
  request_id: string;
  submission_json: string;
  estimate_json: string;
  customer_email_status: DeliveryStatus;
  owner_email_status: DeliveryStatus;
}

interface RateLimit {
  scope: string;
  maximum: number;
  windowSeconds: number;
}

interface ErrorOptions {
  issues?: ValidationIssue[];
  retryAfter?: number;
  headers?: HeadersInit;
}

class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly options: ErrorOptions = {},
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export interface WorkerDependencies {
  now?: () => Date;
  emailProviderFactory?: (env: Env) => EmailProvider;
  verificationCodeGenerator?: () => string;
  opaqueTokenGenerator?: () => string;
  requestIdGenerator?: (now: Date) => string;
}

interface ResolvedDependencies {
  now: () => Date;
  emailProviderFactory: (env: Env) => EmailProvider;
  verificationCodeGenerator: () => string;
  opaqueTokenGenerator: () => string;
  requestIdGenerator: (now: Date) => string;
}

function resolveDependencies(
  dependencies: WorkerDependencies,
): ResolvedDependencies {
  return {
    now: dependencies.now ?? (() => new Date()),
    emailProviderFactory:
      dependencies.emailProviderFactory ??
      ((env) =>
        new ResendEmailProvider({
          apiKey: env.RESEND_API_KEY,
          from: env.EMAIL_FROM,
          replyTo: env.EMAIL_REPLY_TO,
        })),
    verificationCodeGenerator:
      dependencies.verificationCodeGenerator ?? randomVerificationCode,
    opaqueTokenGenerator:
      dependencies.opaqueTokenGenerator ?? randomOpaqueToken,
    requestIdGenerator:
      dependencies.requestIdGenerator ?? createCommissionRequestId,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unixSeconds(date: Date): number {
  return Math.floor(date.getTime() / 1_000);
}

function isoFromUnix(seconds: number): string {
  return new Date(seconds * 1_000).toISOString();
}

function resultChanges(result: D1Result): number {
  return Number(result.meta.changes ?? result.meta.rows_written ?? 0);
}

function readTokenTtlSeconds(value: string | undefined): number {
  const minutes = Number(value ?? "15");
  if (!Number.isFinite(minutes)) return 15 * 60;
  return Math.round(Math.min(30, Math.max(5, minutes)) * 60);
}

function getClientIp(request: Request): string {
  return (
    request.headers.get("CF-Connecting-IP")?.trim() ||
    request.headers.get("X-Real-IP")?.trim() ||
    "unknown"
  );
}

function configuredOrigins(env: Env): Set<string> {
  const origins = new Set<string>();

  for (const entry of (env.ALLOWED_ORIGINS ?? "").split(",")) {
    const candidate = entry.trim();
    if (!candidate || candidate === "*") continue;
    try {
      const parsed = new URL(candidate);
      if (parsed.protocol === "https:" || parsed.protocol === "http:") {
        origins.add(parsed.origin);
      }
    } catch {
      // Invalid configuration entries are ignored rather than widening access.
    }
  }

  return origins;
}

function requestOrigin(
  request: Request,
  env: Env,
): { allowedOrigin: string | null; denied: boolean } {
  const origin = request.headers.get("Origin");
  if (!origin) return { allowedOrigin: null, denied: false };
  if (origin === "null") return { allowedOrigin: null, denied: true };

  return configuredOrigins(env).has(origin)
    ? { allowedOrigin: origin, denied: false }
    : { allowedOrigin: null, denied: true };
}

function secureResponse(
  response: Response,
  allowedOrigin: string | null,
): Response {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store");
  headers.set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
  headers.set("Cross-Origin-Resource-Policy", "cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");

  if (allowedOrigin) {
    headers.set("Access-Control-Allow-Origin", allowedOrigin);
    headers.append("Vary", "Origin");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function jsonResponse(value: unknown, status = 200, headers?: HeadersInit): Response {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(value), {
    status,
    headers: responseHeaders,
  });
}

function errorResponse(error: HttpError): Response {
  const body: ApiErrorResponse = {
    error: {
      code: error.code,
      message: error.message,
      ...(error.options.retryAfter !== undefined
        ? { retryAfter: error.options.retryAfter }
        : {}),
      ...(error.options.issues ? { issues: error.options.issues } : {}),
    },
  };
  const headers = new Headers(error.options.headers);
  if (error.options.retryAfter !== undefined) {
    headers.set("Retry-After", String(error.options.retryAfter));
  }
  return jsonResponse(body, error.status, headers);
}

async function readJson(request: Request): Promise<unknown> {
  const contentType = request.headers.get("Content-Type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) {
    throw new HttpError(
      415,
      "unsupported_media_type",
      "Send the request as application/json.",
    );
  }

  const contentLength = Number(request.headers.get("Content-Length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_JSON_BYTES) {
    try {
      await request.body?.cancel();
    } catch {
      // The size error is authoritative even if the peer already closed.
    }
    throw new HttpError(413, "request_too_large", "The request is too large.");
  }

  const reader = request.body?.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let raw = "";
  let receivedBytes = 0;

  if (reader) {
    try {
      while (true) {
        const result = await reader.read();
        if (result.done) break;

        receivedBytes += result.value.byteLength;
        if (receivedBytes > MAX_JSON_BYTES) {
          try {
            await reader.cancel();
          } catch {
            // Reject immediately even if stream cancellation itself fails.
          }
          throw new HttpError(
            413,
            "request_too_large",
            "The request is too large.",
          );
        }

        try {
          raw += decoder.decode(result.value, { stream: true });
        } catch {
          try {
            await reader.cancel();
          } catch {
            // The malformed-encoding response remains safe and deterministic.
          }
          throw new HttpError(
            400,
            "invalid_encoding",
            "The request body must be valid UTF-8.",
          );
        }
      }

      try {
        raw += decoder.decode();
      } catch {
        throw new HttpError(
          400,
          "invalid_encoding",
          "The request body must be valid UTF-8.",
        );
      }
    } catch (error) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(
        400,
        "invalid_body",
        "The request body could not be read.",
      );
    } finally {
      reader.releaseLock();
    }
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new HttpError(400, "invalid_json", "The request body is not valid JSON.");
  }
}

async function identifierHash(
  env: Env,
  kind: "email" | "ip",
  value: string,
): Promise<string> {
  return hmacHex(
    env.VERIFICATION_HMAC_SECRET,
    `rate-limit-${kind}`,
    value,
  );
}

async function enforceFixedWindow(
  db: D1Database,
  identifier: string,
  limit: RateLimit,
  nowSeconds: number,
): Promise<void> {
  const windowStart =
    Math.floor(nowSeconds / limit.windowSeconds) * limit.windowSeconds;
  const windowEnd = windowStart + limit.windowSeconds;
  const result = await db
    .prepare(
      `INSERT INTO rate_limit_counters (
          scope, identifier_hash, window_start, count, expires_at
        ) VALUES (?, ?, ?, 1, ?)
        ON CONFLICT(scope, identifier_hash, window_start)
        DO UPDATE SET count = count + 1
        WHERE rate_limit_counters.count < ?
        RETURNING count`,
    )
    .bind(
      limit.scope,
      identifier,
      windowStart,
      windowEnd + limit.windowSeconds,
      limit.maximum,
    )
    .first<{ count: number }>();

  if (!result) {
    const retryAfter = Math.max(1, windowEnd - nowSeconds);
    throw new HttpError(
      429,
      "rate_limited",
      "Too many requests. Please try again later.",
      { retryAfter },
    );
  }
}

async function enforceIpLimit(
  request: Request,
  env: Env,
  limit: RateLimit,
  nowSeconds: number,
): Promise<void> {
  const key = await identifierHash(env, "ip", getClientIp(request));
  await enforceFixedWindow(env.DB, key, limit, nowSeconds);
}

async function enforceEmailLimit(
  env: Env,
  emailKey: string,
  limit: RateLimit,
  nowSeconds: number,
): Promise<void> {
  await enforceFixedWindow(env.DB, emailKey, limit, nowSeconds);
}

function emailBrand(env: Env): EmailBrand {
  return {
    name: env.BRAND_NAME?.trim() || "sheepex_",
    siteUrl: env.SITE_URL?.trim() || "https://sheepex.org",
    from: env.EMAIL_FROM,
    ...(env.EMAIL_REPLY_TO ? { replyTo: env.EMAIL_REPLY_TO } : {}),
  };
}

async function releaseSendCooldown(
  env: Env,
  emailKey: string,
  expectedNextSendAt: number,
  nowSeconds: number,
  challengeId?: string,
): Promise<void> {
  try {
    const statements = [
      ...(challengeId
        ? [
            env.DB
              .prepare(
                `UPDATE verification_challenges
                 SET invalidated_at = ?
                 WHERE id = ?
                   AND consumed_at IS NULL
                   AND invalidated_at IS NULL`,
              )
              .bind(nowSeconds, challengeId),
          ]
        : []),
      env.DB
        .prepare(
          `UPDATE verification_send_state
           SET next_send_at = ?, updated_at = ?
           WHERE email_key = ? AND next_send_at = ?`,
        )
        .bind(nowSeconds, nowSeconds, emailKey, expectedNextSendAt),
    ];
    await env.DB.batch(statements);
  } catch {
    // Preserve the original delivery/database error without exposing internals.
  }
}

async function handleVerificationSend(
  request: Request,
  env: Env,
  dependencies: ResolvedDependencies,
): Promise<Response> {
  const body = await readJson(request);
  if (!isRecord(body)) {
    throw new HttpError(400, "invalid_request", "Enter a valid email address.");
  }

  const rawEmail = typeof body.email === "string" ? body.email : "";
  const emailIssue = validateEmail(rawEmail);
  if (emailIssue) {
    throw new HttpError(400, "invalid_email", emailIssue, {
      issues: [{ field: "email", message: emailIssue }],
    });
  }

  const email = normalizeEmail(rawEmail);
  const now = dependencies.now();
  const nowSeconds = unixSeconds(now);
  const emailKey = await identifierHash(env, "email", email);

  await enforceIpLimit(
    request,
    env,
    RATE_LIMITS.verificationSendIp,
    nowSeconds,
  );
  await enforceEmailLimit(
    env,
    emailKey,
    RATE_LIMITS.verificationSendEmail,
    nowSeconds,
  );

  let provider: EmailProvider;
  try {
    provider = dependencies.emailProviderFactory(env);
  } catch {
    throw new HttpError(
      503,
      "verification_unavailable",
      "Email verification is temporarily unavailable. Please try again.",
    );
  }

  const resendAvailableAt = nowSeconds + RESEND_COOLDOWN_SECONDS;
  const cooldownClaim = await env.DB
    .prepare(
      `INSERT INTO verification_send_state (
          email_key, next_send_at, updated_at
        ) VALUES (?, ?, ?)
        ON CONFLICT(email_key)
        DO UPDATE SET
          next_send_at = excluded.next_send_at,
          updated_at = excluded.updated_at
        WHERE verification_send_state.next_send_at <= ?
        RETURNING next_send_at`,
    )
    .bind(emailKey, resendAvailableAt, nowSeconds, nowSeconds)
    .first<{ next_send_at: number }>();

  if (!cooldownClaim) {
    const state = await env.DB
      .prepare(
        `SELECT next_send_at
         FROM verification_send_state
         WHERE email_key = ?`,
      )
      .bind(emailKey)
      .first<{ next_send_at: number }>();
    const retryAfter = Math.max(
      1,
      (state?.next_send_at ?? resendAvailableAt) - nowSeconds,
    );
    throw new HttpError(
      429,
      "verification_resend_cooldown",
      "Please wait before requesting another code.",
      { retryAfter },
    );
  }

  const challengeId = crypto.randomUUID();
  const code = dependencies.verificationCodeGenerator();
  const expiresAt = nowSeconds + CODE_EXPIRY_SECONDS;
  const codeHash = await hmacHex(
    env.VERIFICATION_HMAC_SECRET,
    "verification-code",
    `${challengeId}\0${email}\0${code}`,
  );

  try {
    await env.DB
      .prepare(
        `INSERT INTO verification_challenges (
           id, email, email_key, code_hash, created_at, expires_at,
           resend_available_at, attempts
         ) VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      )
      .bind(
        challengeId,
        email,
        emailKey,
        codeHash,
        nowSeconds,
        expiresAt,
        resendAvailableAt,
      )
      .run();
  } catch {
    await releaseSendCooldown(
      env,
      emailKey,
      resendAvailableAt,
      nowSeconds,
    );
    throw new HttpError(
      503,
      "verification_unavailable",
      "Email verification is temporarily unavailable. Please try again.",
    );
  }

  try {
    await provider.send(
      buildVerificationEmail(
        email,
        code,
        commissionConfig.verification.expiresInMinutes,
        challengeId,
        emailBrand(env),
      ),
    );
  } catch {
    await releaseSendCooldown(
      env,
      emailKey,
      resendAvailableAt,
      nowSeconds,
      challengeId,
    );
    throw new HttpError(
      502,
      "verification_delivery_failed",
      "The verification email could not be sent. Please try again.",
    );
  }

  return jsonResponse(
    {
      challengeId,
      expiresAt: isoFromUnix(expiresAt),
      resendAvailableAt: isoFromUnix(resendAvailableAt),
    },
    201,
  );
}

function challengeStateError(
  challenge: ChallengeRow | null,
  nowSeconds: number,
): HttpError {
  if (!challenge) {
    return new HttpError(
      400,
      "verification_invalid",
      "The verification code is invalid.",
    );
  }
  if (challenge.consumed_at !== null) {
    return new HttpError(
      409,
      "verification_used",
      "This verification code has already been used.",
    );
  }
  if (
    !hasAttemptsRemaining(challenge.attempts, MAX_VERIFICATION_ATTEMPTS)
  ) {
    return new HttpError(
      429,
      "verification_attempts_exceeded",
      "Too many incorrect attempts. Request a new code.",
    );
  }
  if (challenge.invalidated_at !== null) {
    return new HttpError(
      409,
      "verification_replaced",
      "This code was replaced. Use the most recent verification email.",
    );
  }
  if (isChallengeExpired(challenge.expires_at, nowSeconds)) {
    return new HttpError(
      410,
      "verification_expired",
      "This verification code has expired. Request a new one.",
    );
  }
  return new HttpError(
    400,
    "verification_invalid",
    "The verification code is invalid.",
  );
}

async function loadChallenge(
  db: D1Database,
  challengeId: string,
): Promise<ChallengeRow | null> {
  return db
    .prepare(
      `SELECT
         id, email, email_key, code_hash, created_at, expires_at,
         resend_available_at, attempts, consumed_at, invalidated_at,
         issued_token_hash
       FROM verification_challenges
       WHERE id = ?`,
    )
    .bind(challengeId)
    .first<ChallengeRow>();
}

async function handleVerificationVerify(
  request: Request,
  env: Env,
  dependencies: ResolvedDependencies,
): Promise<Response> {
  const body = await readJson(request);
  if (!isRecord(body)) {
    throw new HttpError(
      400,
      "invalid_request",
      "Enter the four-digit verification code.",
    );
  }

  const challengeId =
    typeof body.challengeId === "string" ? body.challengeId.trim() : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      challengeId,
    ) ||
    !new RegExp(`^\\d{${commissionConfig.verification.codeLength}}$`).test(
      code,
    )
  ) {
    throw new HttpError(
      400,
      "verification_invalid",
      "Enter the four-digit verification code.",
    );
  }

  const nowSeconds = unixSeconds(dependencies.now());
  await enforceIpLimit(
    request,
    env,
    RATE_LIMITS.verificationCheckIp,
    nowSeconds,
  );

  const challenge = await loadChallenge(env.DB, challengeId);
  if (!challenge) throw challengeStateError(null, nowSeconds);

  await enforceEmailLimit(
    env,
    challenge.email_key,
    RATE_LIMITS.verificationCheckEmail,
    nowSeconds,
  );

  if (
    challenge.consumed_at !== null ||
    challenge.invalidated_at !== null ||
    isChallengeExpired(challenge.expires_at, nowSeconds) ||
    !hasAttemptsRemaining(challenge.attempts, MAX_VERIFICATION_ATTEMPTS)
  ) {
    throw challengeStateError(challenge, nowSeconds);
  }

  const submittedHash = await hmacHex(
    env.VERIFICATION_HMAC_SECRET,
    "verification-code",
    `${challengeId}\0${challenge.email}\0${code}`,
  );

  if (!constantTimeEqual(submittedHash, challenge.code_hash)) {
    const attempted = await env.DB
      .prepare(
        `UPDATE verification_challenges
         SET
           attempts = attempts + 1,
           invalidated_at = CASE
             WHEN attempts + 1 >= ? THEN ?
             ELSE invalidated_at
           END
         WHERE id = ?
           AND consumed_at IS NULL
           AND invalidated_at IS NULL
           AND expires_at > ?
           AND attempts < ?
         RETURNING attempts`,
      )
      .bind(
        MAX_VERIFICATION_ATTEMPTS,
        nowSeconds,
        challengeId,
        nowSeconds,
        MAX_VERIFICATION_ATTEMPTS,
      )
      .first<{ attempts: number }>();

    if (!attempted) {
      throw challengeStateError(
        await loadChallenge(env.DB, challengeId),
        nowSeconds,
      );
    }
    if (
      !hasAttemptsRemaining(
        attempted.attempts,
        MAX_VERIFICATION_ATTEMPTS,
      )
    ) {
      throw challengeStateError(
        await loadChallenge(env.DB, challengeId),
        nowSeconds,
      );
    }

    throw new HttpError(
      400,
      "verification_invalid",
      "That code is not correct. Try again.",
    );
  }

  const rawToken = dependencies.opaqueTokenGenerator();
  const tokenHash = await hmacHex(
    env.TOKEN_HMAC_SECRET,
    "verification-token",
    rawToken,
  );
  const tokenExpiresAt =
    nowSeconds + readTokenTtlSeconds(env.VERIFICATION_TOKEN_TTL_MINUTES);

  const results = await env.DB.batch([
    env.DB
      .prepare(
        `UPDATE verification_challenges
         SET
           attempts = attempts + 1,
           consumed_at = ?,
           issued_token_hash = ?
         WHERE id = ?
           AND code_hash = ?
           AND consumed_at IS NULL
           AND invalidated_at IS NULL
           AND expires_at > ?
           AND attempts < ?`,
      )
      .bind(
        nowSeconds,
        tokenHash,
        challengeId,
        submittedHash,
        nowSeconds,
        MAX_VERIFICATION_ATTEMPTS,
      ),
    env.DB
      .prepare(
        `INSERT INTO verification_tokens (
           token_hash, challenge_id, email, email_key, issued_at, expires_at
         )
         SELECT ?, id, email, email_key, ?, ?
         FROM verification_challenges
         WHERE id = ?
           AND issued_token_hash = ?
           AND consumed_at = ?`,
      )
      .bind(
        tokenHash,
        nowSeconds,
        tokenExpiresAt,
        challengeId,
        tokenHash,
        nowSeconds,
      ),
  ]);

  if (resultChanges(results[0]) !== 1 || resultChanges(results[1]) !== 1) {
    throw challengeStateError(
      await loadChallenge(env.DB, challengeId),
      nowSeconds,
    );
  }

  return jsonResponse({
    verificationToken: rawToken,
    expiresAt: isoFromUnix(tokenExpiresAt),
  });
}

function validateIdempotencyKey(value: string | null): string {
  const key = value?.trim() ?? "";
  if (
    key.length < 8 ||
    key.length > 128 ||
    !/^[A-Za-z0-9._:-]+$/.test(key)
  ) {
    throw new HttpError(
      400,
      "invalid_idempotency_key",
      "Send a unique Idempotency-Key header (8–128 safe characters).",
    );
  }
  return key;
}

function parseStoredCommission(row: CommissionRow): CommissionRequestResponse {
  const summary = JSON.parse(row.submission_json) as CommissionSubmission;
  const estimate = JSON.parse(row.estimate_json) as CommissionEstimate;
  const confirmationPending =
    row.customer_email_status !== "sent";

  return {
    requestId: row.request_id,
    submittedAt: isoFromUnix(row.created_at),
    estimate,
    summary,
    ...(confirmationPending ? { confirmationPending: true } : {}),
  };
}

async function loadCommissionByIdempotency(
  db: D1Database,
  idempotencyHash: string,
): Promise<CommissionRow | null> {
  return db
    .prepare(
      `SELECT
         request_id, request_hash, verification_token_hash,
         submission_json, estimate_json, created_at,
         customer_email_status, owner_email_status
       FROM commission_requests
       WHERE idempotency_key_hash = ?`,
    )
    .bind(idempotencyHash)
    .first<CommissionRow>();
}

function idempotentResponse(
  row: CommissionRow,
  tokenHash: string,
  requestHash: string,
): Response {
  if (
    !constantTimeEqual(row.verification_token_hash, tokenHash) ||
    !constantTimeEqual(row.request_hash, requestHash)
  ) {
    throw new HttpError(
      409,
      "idempotency_conflict",
      "That Idempotency-Key was already used for a different request.",
    );
  }

  return jsonResponse(parseStoredCommission(row), 200, {
    "Idempotency-Replayed": "true",
  });
}

const DELIVERY_COLUMNS = {
  customer: {
    status: "customer_email_status",
    attempts: "customer_email_attempts",
    nextAttempt: "customer_email_next_attempt_at",
    lastAttempt: "customer_email_last_attempt_at",
  },
  owner: {
    status: "owner_email_status",
    attempts: "owner_email_attempts",
    nextAttempt: "owner_email_next_attempt_at",
    lastAttempt: "owner_email_last_attempt_at",
  },
} as const;

function deliveryRetryDelay(attempts: number): number | null {
  if (attempts >= MAX_EMAIL_DELIVERY_ATTEMPTS) return null;
  return EMAIL_RETRY_DELAYS_SECONDS[
    Math.min(attempts - 1, EMAIL_RETRY_DELAYS_SECONDS.length - 1)
  ];
}

async function currentDeliveryStatus(
  db: D1Database,
  requestId: string,
  kind: DeliveryKind,
): Promise<DeliveryStatus | null> {
  const columns = DELIVERY_COLUMNS[kind];
  const row = await db
    .prepare(
      `SELECT ${columns.status} AS status
       FROM commission_requests
       WHERE request_id = ?`,
    )
    .bind(requestId)
    .first<{ status: DeliveryStatus }>();
  return row?.status ?? null;
}

async function attemptCommissionEmail(
  db: D1Database,
  provider: EmailProvider | null,
  requestId: string,
  kind: DeliveryKind,
  message: Parameters<EmailProvider["send"]>[0],
  nowSeconds: number,
): Promise<boolean> {
  const columns = DELIVERY_COLUMNS[kind];
  const staleClaimBefore = nowSeconds - EMAIL_DELIVERY_CLAIM_SECONDS;
  const claim = await db
    .prepare(
      `UPDATE commission_requests
       SET
         ${columns.status} = 'sending',
         ${columns.attempts} = ${columns.attempts} + 1,
         ${columns.lastAttempt} = ?,
         ${columns.nextAttempt} = NULL
       WHERE request_id = ?
         AND ${columns.status} <> 'sent'
         AND ${columns.attempts} < ?
         AND (
           (
             ${columns.status} <> 'sending'
             AND (
               ${columns.nextAttempt} IS NULL
               OR ${columns.nextAttempt} <= ?
             )
           )
           OR (
             ${columns.status} = 'sending'
             AND (
               ${columns.lastAttempt} IS NULL
               OR ${columns.lastAttempt} <= ?
             )
           )
         )
       RETURNING ${columns.attempts} AS attempts`,
    )
    .bind(
      nowSeconds,
      requestId,
      MAX_EMAIL_DELIVERY_ATTEMPTS,
      nowSeconds,
      staleClaimBefore,
    )
    .first<{ attempts: number }>();

  if (!claim) {
    return (await currentDeliveryStatus(db, requestId, kind)) === "sent";
  }

  let sent = false;
  if (provider) {
    try {
      await provider.send(message);
      sent = true;
    } catch {
      sent = false;
    }
  }

  const retryDelay = sent ? null : deliveryRetryDelay(claim.attempts);
  try {
    await db
      .prepare(
        `UPDATE commission_requests
         SET
           ${columns.status} = ?,
           ${columns.nextAttempt} = ?
         WHERE request_id = ?
           AND ${columns.status} = 'sending'
           AND ${columns.attempts} = ?`,
      )
      .bind(
        sent ? "sent" : "failed",
        retryDelay === null ? null : nowSeconds + retryDelay,
        requestId,
        claim.attempts,
      )
      .run();
  } catch {
    // A stale "sending" claim is safely retried with the same provider key.
  }

  return sent;
}

async function sendInitialCommissionEmail(
  db: D1Database,
  provider: EmailProvider | null,
  requestId: string,
  kind: DeliveryKind,
  message: Parameters<EmailProvider["send"]>[0],
  nowSeconds: number,
): Promise<boolean> {
  const columns = DELIVERY_COLUMNS[kind];
  let sent = false;
  if (provider) {
    try {
      await provider.send(message);
      sent = true;
    } catch {
      sent = false;
    }
  }

  const retryDelay = sent ? null : deliveryRetryDelay(1);
  try {
    await db
      .prepare(
        `UPDATE commission_requests
         SET
           ${columns.status} = ?,
           ${columns.attempts} = ${columns.attempts} + 1,
           ${columns.lastAttempt} = ?,
           ${columns.nextAttempt} = ?
         WHERE request_id = ?
           AND ${columns.status} <> 'sent'`,
      )
      .bind(
        sent ? "sent" : "failed",
        nowSeconds,
        retryDelay === null ? null : nowSeconds + retryDelay,
        requestId,
      )
      .run();
  } catch {
    // Cron recovers a still-pending row with the same provider idempotency key.
  }

  return sent;
}

async function deliverCommissionEmails(
  env: Env,
  dependencies: ResolvedDependencies,
  requestId: string,
  submission: CommissionSubmission,
  estimate: CommissionEstimate,
  nowSeconds: number,
): Promise<{ customerSent: boolean; ownerSent: boolean }> {
  let provider: EmailProvider | null = null;
  try {
    provider = dependencies.emailProviderFactory(env);
  } catch {
    provider = null;
  }

  const brand = emailBrand(env);
  const customerMessage = buildCustomerConfirmationEmail(
    requestId,
    submission,
    estimate,
    brand,
  );
  const ownerMessage = buildOwnerNotificationEmail(
    env.COMMISSION_OWNER_EMAIL,
    requestId,
    submission,
    estimate,
    brand,
  );

  const [customerSent, ownerSent] = await Promise.all([
    sendInitialCommissionEmail(
      env.DB,
      provider,
      requestId,
      "customer",
      customerMessage,
      nowSeconds,
    ),
    sendInitialCommissionEmail(
      env.DB,
      provider,
      requestId,
      "owner",
      ownerMessage,
      nowSeconds,
    ),
  ]);
  return { customerSent, ownerSent };
}

async function runWithConcurrency(
  tasks: Array<() => Promise<void>>,
  concurrency: number,
): Promise<void> {
  let nextIndex = 0;
  const worker = async (): Promise<void> => {
    while (nextIndex < tasks.length) {
      const task = tasks[nextIndex];
      nextIndex += 1;
      await task();
    }
  };

  await Promise.all(
    Array.from(
      { length: Math.min(concurrency, tasks.length) },
      () => worker(),
    ),
  );
}

async function markMalformedDeliveryPermanent(
  db: D1Database,
  requestId: string,
): Promise<void> {
  try {
    await db
      .prepare(
        `UPDATE commission_requests
         SET
           customer_email_status = CASE
             WHEN customer_email_status = 'sent' THEN 'sent'
             ELSE 'failed'
           END,
           owner_email_status = CASE
             WHEN owner_email_status = 'sent' THEN 'sent'
             ELSE 'failed'
           END,
           customer_email_attempts = CASE
             WHEN customer_email_status = 'sent'
               THEN customer_email_attempts
             ELSE ?
           END,
           owner_email_attempts = CASE
             WHEN owner_email_status = 'sent'
               THEN owner_email_attempts
             ELSE ?
           END,
           customer_email_next_attempt_at = NULL,
           owner_email_next_attempt_at = NULL
         WHERE request_id = ?`,
      )
      .bind(
        MAX_EMAIL_DELIVERY_ATTEMPTS,
        MAX_EMAIL_DELIVERY_ATTEMPTS,
        requestId,
      )
      .run();
  } catch {
    // A later cron can safely attempt the same bounded recovery again.
  }
}

async function recoverCommissionEmails(
  env: Env,
  dependencies: ResolvedDependencies,
  nowSeconds: number,
): Promise<void> {
  const staleClaimBefore = nowSeconds - EMAIL_DELIVERY_CLAIM_SECONDS;
  const due = await env.DB
    .prepare(
      `SELECT
         request_id, submission_json, estimate_json,
         customer_email_status, owner_email_status
       FROM commission_requests
       WHERE (
         customer_email_status <> 'sent'
         AND customer_email_attempts < ?
         AND (
           (
             customer_email_status <> 'sending'
             AND (
               customer_email_next_attempt_at IS NULL
               OR customer_email_next_attempt_at <= ?
             )
           )
           OR (
             customer_email_status = 'sending'
             AND (
               customer_email_last_attempt_at IS NULL
               OR customer_email_last_attempt_at <= ?
             )
           )
         )
       ) OR (
         owner_email_status <> 'sent'
         AND owner_email_attempts < ?
         AND (
           (
             owner_email_status <> 'sending'
             AND (
               owner_email_next_attempt_at IS NULL
               OR owner_email_next_attempt_at <= ?
             )
           )
           OR (
             owner_email_status = 'sending'
             AND (
               owner_email_last_attempt_at IS NULL
               OR owner_email_last_attempt_at <= ?
             )
           )
         )
       )
       ORDER BY created_at ASC
       LIMIT ?`,
    )
    .bind(
      MAX_EMAIL_DELIVERY_ATTEMPTS,
      nowSeconds,
      staleClaimBefore,
      MAX_EMAIL_DELIVERY_ATTEMPTS,
      nowSeconds,
      staleClaimBefore,
      EMAIL_RECOVERY_BATCH_SIZE,
    )
    .all<CommissionDeliveryRow>();

  let provider: EmailProvider | null = null;
  try {
    provider = dependencies.emailProviderFactory(env);
  } catch {
    provider = null;
  }

  const tasks: Array<() => Promise<void>> = [];
  for (const row of due.results ?? []) {
    let submission: CommissionSubmission;
    let estimate: CommissionEstimate;
    try {
      submission = JSON.parse(row.submission_json) as CommissionSubmission;
      estimate = JSON.parse(row.estimate_json) as CommissionEstimate;
    } catch {
      tasks.push(async () => {
        await markMalformedDeliveryPermanent(env.DB, row.request_id);
      });
      continue;
    }

    const brand = emailBrand(env);
    if (row.customer_email_status !== "sent") {
      const message = buildCustomerConfirmationEmail(
        row.request_id,
        submission,
        estimate,
        brand,
      );
      tasks.push(async () => {
        await attemptCommissionEmail(
          env.DB,
          provider,
          row.request_id,
          "customer",
          message,
          nowSeconds,
        );
      });
    }
    if (row.owner_email_status !== "sent") {
      const message = buildOwnerNotificationEmail(
        env.COMMISSION_OWNER_EMAIL,
        row.request_id,
        submission,
        estimate,
        brand,
      );
      tasks.push(async () => {
        await attemptCommissionEmail(
          env.DB,
          provider,
          row.request_id,
          "owner",
          message,
          nowSeconds,
        );
      });
    }
  }

  await runWithConcurrency(tasks, EMAIL_RECOVERY_CONCURRENCY);
}

async function cleanExpiredWorkerState(
  db: D1Database,
  nowSeconds: number,
): Promise<void> {
  await db.batch([
    db
      .prepare(
        `DELETE FROM rate_limit_counters
         WHERE rowid IN (
           SELECT rowid
           FROM rate_limit_counters
           WHERE expires_at <= ?
           LIMIT 1000
         )`,
      )
      .bind(nowSeconds),
    db
      .prepare(
        `DELETE FROM verification_send_state
         WHERE rowid IN (
           SELECT rowid
           FROM verification_send_state
           WHERE next_send_at <= ?
           LIMIT 1000
         )`,
      )
      .bind(nowSeconds),
    db
      .prepare(
        `DELETE FROM verification_tokens
         WHERE rowid IN (
           SELECT token.rowid
           FROM verification_tokens AS token
           WHERE token.expires_at <= ?
             AND NOT EXISTS (
               SELECT 1
               FROM commission_requests AS request
               WHERE request.verification_token_hash = token.token_hash
             )
           LIMIT 500
         )`,
      )
      .bind(nowSeconds),
    db
      .prepare(
        `DELETE FROM verification_challenges
         WHERE rowid IN (
           SELECT challenge.rowid
           FROM verification_challenges AS challenge
           WHERE challenge.expires_at <= ?
             AND NOT EXISTS (
               SELECT 1
               FROM verification_tokens AS token
               WHERE token.challenge_id = challenge.id
             )
             AND NOT EXISTS (
               SELECT 1
               FROM commission_requests AS request
               WHERE request.verification_challenge_id = challenge.id
             )
           LIMIT 500
         )`,
      )
      .bind(nowSeconds),
  ]);
}

async function runScheduledTasks(
  env: Env,
  dependencies: ResolvedDependencies,
): Promise<void> {
  const nowSeconds = unixSeconds(dependencies.now());
  try {
    await recoverCommissionEmails(env, dependencies, nowSeconds);
  } finally {
    await cleanExpiredWorkerState(env.DB, nowSeconds);
  }
}

async function handleCommissionSubmission(
  request: Request,
  env: Env,
  dependencies: ResolvedDependencies,
): Promise<Response> {
  const idempotencyKey = validateIdempotencyKey(
    request.headers.get("Idempotency-Key"),
  );
  const body = await readJson(request);
  if (!isRecord(body)) {
    throw new HttpError(400, "invalid_request", "The request data is invalid.");
  }

  const verificationToken =
    typeof body.verificationToken === "string"
      ? body.verificationToken.trim()
      : "";
  if (!/^[A-Za-z0-9_-]{43}$/.test(verificationToken)) {
    throw new HttpError(
      401,
      "verification_token_invalid",
      "Verify your email again before submitting.",
    );
  }

  const now = dependencies.now();
  const nowSeconds = unixSeconds(now);
  const validation = validateCommissionSubmission(body.submission, now);
  if (!validation.success) {
    throw new HttpError(
      422,
      "validation_failed",
      "Check the highlighted request details.",
      { issues: validation.issues },
    );
  }

  const submission = validation.data;
  const estimate = calculateEstimate(submission, now);
  const submissionJson = JSON.stringify(submission);
  const estimateJson = JSON.stringify(estimate);
  const [idempotencyHash, tokenHash, requestHash] = await Promise.all([
    hmacHex(
      env.TOKEN_HMAC_SECRET,
      "commission-idempotency",
      idempotencyKey,
    ),
    hmacHex(
      env.TOKEN_HMAC_SECRET,
      "verification-token",
      verificationToken,
    ),
    sha256Hex(submissionJson),
  ]);

  const existing = await loadCommissionByIdempotency(
    env.DB,
    idempotencyHash,
  );
  if (existing) return idempotentResponse(existing, tokenHash, requestHash);

  await enforceIpLimit(
    request,
    env,
    RATE_LIMITS.submissionIp,
    nowSeconds,
  );

  const token = await env.DB
    .prepare(
      `SELECT
         token_hash, challenge_id, email, email_key, issued_at, expires_at,
         consumed_at, consumption_id
       FROM verification_tokens
       WHERE token_hash = ?`,
    )
    .bind(tokenHash)
    .first<VerificationTokenRow>();

  if (!token || isChallengeExpired(token.expires_at, nowSeconds)) {
    throw new HttpError(
      401,
      "verification_token_invalid",
      "Email verification expired. Verify your email again.",
    );
  }
  if (token.consumed_at !== null) {
    throw new HttpError(
      409,
      "verification_token_used",
      "This verified session has already submitted a request.",
    );
  }
  if (!constantTimeEqual(token.email, submission.email)) {
    throw new HttpError(
      403,
      "verified_email_mismatch",
      "Submit with the same email address that you verified.",
    );
  }

  await enforceEmailLimit(
    env,
    token.email_key,
    RATE_LIMITS.submissionEmail,
    nowSeconds,
  );

  const requestId = dependencies.requestIdGenerator(now);
  let results: D1Result[];

  try {
    results = await env.DB.batch([
      env.DB
        .prepare(
          `UPDATE verification_tokens
           SET consumed_at = ?, consumption_id = ?
           WHERE token_hash = ?
             AND consumed_at IS NULL
             AND expires_at > ?
             AND email = ?`,
        )
        .bind(
          nowSeconds,
          requestId,
          tokenHash,
          nowSeconds,
          submission.email,
        ),
      env.DB
        .prepare(
          `INSERT INTO commission_requests (
             request_id, idempotency_key_hash, request_hash,
             verification_token_hash, verification_challenge_id, email,
             submission_json, estimate_json, estimate_currency,
             estimate_min, estimate_max, verified_at, created_at
           )
           SELECT
             ?, ?, ?, token_hash, challenge_id, email, ?, ?, ?, ?, ?,
             issued_at, ?
           FROM verification_tokens
           WHERE token_hash = ? AND consumption_id = ?`,
        )
        .bind(
          requestId,
          idempotencyHash,
          requestHash,
          submissionJson,
          estimateJson,
          estimate.currency,
          estimate.min,
          estimate.max,
          nowSeconds,
          tokenHash,
          requestId,
        ),
    ]);
  } catch {
    const raced = await loadCommissionByIdempotency(
      env.DB,
      idempotencyHash,
    );
    if (raced) return idempotentResponse(raced, tokenHash, requestHash);
    throw new HttpError(
      503,
      "submission_unavailable",
      "The request could not be saved. Please try again.",
    );
  }

  if (resultChanges(results[0]) !== 1 || resultChanges(results[1]) !== 1) {
    const raced = await loadCommissionByIdempotency(
      env.DB,
      idempotencyHash,
    );
    if (raced) return idempotentResponse(raced, tokenHash, requestHash);
    throw new HttpError(
      409,
      "verification_token_used",
      "This verified session has already submitted a request.",
    );
  }

  const delivery = await deliverCommissionEmails(
    env,
    dependencies,
    requestId,
    submission,
    estimate,
    nowSeconds,
  );
  const confirmationPending = !delivery.customerSent;
  const response: CommissionRequestResponse = {
    requestId,
    submittedAt: now.toISOString(),
    estimate,
    summary: submission,
    ...(confirmationPending ? { confirmationPending: true } : {}),
  };

  return jsonResponse(response, 201);
}

function methodNotAllowed(methods: string): never {
  throw new HttpError(405, "method_not_allowed", "Method not allowed.", {
    headers: { Allow: methods },
  });
}

async function routeRequest(
  request: Request,
  env: Env,
  dependencies: ResolvedDependencies,
): Promise<Response> {
  const url = new URL(request.url);
  const path =
    url.pathname.length > 1 && url.pathname.endsWith("/")
      ? url.pathname.slice(0, -1)
      : url.pathname;

  if (path === "/v1/health") {
    if (request.method !== "GET") methodNotAllowed("GET, OPTIONS");
    return jsonResponse({ ok: true });
  }
  if (path === "/v1/verification/send") {
    if (request.method !== "POST") methodNotAllowed("POST, OPTIONS");
    return handleVerificationSend(request, env, dependencies);
  }
  if (path === "/v1/verification/verify") {
    if (request.method !== "POST") methodNotAllowed("POST, OPTIONS");
    return handleVerificationVerify(request, env, dependencies);
  }
  if (path === "/v1/commissions") {
    if (request.method !== "POST") methodNotAllowed("POST, OPTIONS");
    return handleCommissionSubmission(request, env, dependencies);
  }
  throw new HttpError(404, "not_found", "Endpoint not found.");
}

export function createWorker(dependencies: WorkerDependencies = {}) {
  const resolved = resolveDependencies(dependencies);

  return {
    async fetch(
      request: Request,
      env: Env,
    ): Promise<Response> {
      const origin = requestOrigin(request, env);

      if (origin.denied) {
        return secureResponse(
          errorResponse(
            new HttpError(
              403,
              "origin_not_allowed",
              "This origin is not allowed.",
            ),
          ),
          null,
        );
      }

      if (request.method === "OPTIONS") {
        const headers = new Headers({
          "Access-Control-Allow-Headers":
            "Content-Type, Idempotency-Key",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Max-Age": "86400",
        });
        return secureResponse(
          new Response(null, { status: 204, headers }),
          origin.allowedOrigin,
        );
      }

      try {
        return secureResponse(
          await routeRequest(request, env, resolved),
          origin.allowedOrigin,
        );
      } catch (error) {
        const response =
          error instanceof HttpError
            ? errorResponse(error)
            : errorResponse(
                new HttpError(
                  500,
                  "internal_error",
                  "Something went wrong. Please try again.",
                ),
              );
        return secureResponse(response, origin.allowedOrigin);
      }
    },
    scheduled(
      controller: ScheduledController,
      env: Env,
      context: ExecutionContext,
    ): void {
      void controller.cron;
      context.waitUntil(runScheduledTasks(env, resolved));
    },
  };
}

export default createWorker();
