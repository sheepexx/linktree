import assert from "node:assert/strict";
import test from "node:test";

import { calculateEstimate } from "../lib/commission/pricing";
import type {
  ApiErrorResponse,
  CommissionEstimate,
  CommissionSubmission,
  VerificationChallengeResponse,
  VerificationSuccessResponse,
} from "../lib/commission/types";
import type {
  EmailProvider,
  OutgoingEmail,
} from "../worker/src/email";
import { createWorker } from "../worker/src/index";
import type {
  D1Database,
  D1PreparedStatement,
  D1Result,
  D1Value,
  Env,
  ExecutionContext,
  ScheduledController,
} from "../worker/src/runtime-types";

const NOW = new Date("2026-08-01T12:00:00.000Z");
const NOW_SECONDS = Math.floor(NOW.getTime() / 1_000);
const VERIFICATION_SECRET =
  "verification-secret-material-for-tests-123456789";
const TOKEN_SECRET = "token-secret-material-for-tests-123456789";

class HarnessStatement implements D1PreparedStatement {
  constructor(
    private readonly database: HarnessD1,
    readonly sql: string,
    readonly values: D1Value[] = [],
  ) {}

  bind(...values: D1Value[]): D1PreparedStatement {
    return new HarnessStatement(this.database, this.sql, values);
  }

  async first<T = Record<string, unknown>>(): Promise<T | null> {
    this.database.firsts.push(this);
    return (await this.database.onFirst(this)) as T | null;
  }

  async run<T = Record<string, unknown>>(): Promise<D1Result<T>> {
    this.database.runs.push(this);
    return (await this.database.onRun(this)) as D1Result<T>;
  }

  async all<T = Record<string, unknown>>(): Promise<D1Result<T>> {
    this.database.alls.push(this);
    return (await this.database.onAll(this)) as D1Result<T>;
  }
}

class HarnessD1 implements D1Database {
  readonly firsts: HarnessStatement[] = [];
  readonly runs: HarnessStatement[] = [];
  readonly alls: HarnessStatement[] = [];
  readonly batches: HarnessStatement[][] = [];

  onFirst: (
    statement: HarnessStatement,
  ) => unknown | Promise<unknown> = (statement) => {
    throw new Error(`Unexpected D1 first(): ${normalizeSql(statement.sql)}`);
  };

  onRun: (
    statement: HarnessStatement,
  ) => D1Result | Promise<D1Result> = (statement) => {
    throw new Error(`Unexpected D1 run(): ${normalizeSql(statement.sql)}`);
  };

  onAll: (
    statement: HarnessStatement,
  ) => D1Result | Promise<D1Result> = (statement) => {
    throw new Error(`Unexpected D1 all(): ${normalizeSql(statement.sql)}`);
  };

  onBatch: (
    statements: HarnessStatement[],
  ) => D1Result[] | Promise<D1Result[]> = (statements) => {
    throw new Error(
      `Unexpected D1 batch(): ${statements
        .map((statement) => normalizeSql(statement.sql))
        .join(" | ")}`,
    );
  };

  prepare(query: string): D1PreparedStatement {
    return new HarnessStatement(this, query);
  }

  async batch<T = Record<string, unknown>>(
    statements: D1PreparedStatement[],
  ): Promise<D1Result<T>[]> {
    const captured = statements.map((statement) => {
      assert.equal(statement instanceof HarnessStatement, true);
      return statement as HarnessStatement;
    });
    this.batches.push(captured);
    return (await this.onBatch(captured)) as D1Result<T>[];
  }
}

class CapturingProvider implements EmailProvider {
  readonly messages: OutgoingEmail[] = [];

  constructor(private readonly fail = false) {}

  async send(message: OutgoingEmail): Promise<void> {
    this.messages.push(message);
    if (this.fail) throw new Error("Injected email failure");
  }
}

function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, " ").trim();
}

function changedResult(): D1Result {
  return {
    success: true,
    meta: { changes: 1, rows_written: 1 },
  };
}

function baseEnv(database: D1Database): Env {
  return {
    DB: database,
    ALLOWED_ORIGINS: "https://sheepex.org",
    BRAND_NAME: "sheepex_",
    SITE_URL: "https://sheepex.org",
    EMAIL_FROM: "sheepex commissions <commissions@sheepex.org>",
    EMAIL_REPLY_TO: "commissions@sheepex.org",
    COMMISSION_OWNER_EMAIL: "owner@example.com",
    RESEND_API_KEY: "resend-secret",
    VERIFICATION_HMAC_SECRET: VERIFICATION_SECRET,
    TOKEN_HMAC_SECRET: TOKEN_SECRET,
    VERIFICATION_TOKEN_TTL_MINUTES: "15",
  };
}

function validSubmission(): CommissionSubmission {
  return {
    commissionType: "thumbnail",
    intendedUse: "creator",
    complexity: "detailed",
    concepts: 2,
    revisions: 2,
    outputFormat: "high-res",
    dimensions: "1920 x 1080",
    deliveryDate: "2026-08-11",
    commercialUse: true,
    projectDescription:
      "A polished cover composition with layered type and detailed lighting.",
    additionalNotes: "Keep the focal point clear.",
    referenceLinks: ["https://example.com/reference"],
    email: "artist@example.com",
    discord: "sheep_artist",
    preferredContact: "email",
    otherPlatform: "",
    otherContact: "",
  };
}

function streamRequest(chunks: Uint8Array[]): Request {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  });

  return new Request(
    "https://commissions-api.example.com/v1/verification/send",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://sheepex.org",
      },
      body: stream as BodyInit,
      duplex: "half",
    } as RequestInit & { duplex: "half" },
  );
}

test("a chunked oversized body without Content-Length is rejected with 413", async () => {
  const database = new HarnessD1();
  const worker = createWorker({ now: () => NOW });
  const request = streamRequest([
    new Uint8Array(16_000).fill(0x20),
    new Uint8Array(16_001).fill(0x20),
  ]);

  assert.equal(request.headers.has("Content-Length"), false);
  const response = await worker.fetch(request, baseEnv(database));
  const body = (await response.json()) as ApiErrorResponse;

  assert.equal(response.status, 413);
  assert.equal(body.error.code, "request_too_large");
  assert.equal(database.firsts.length, 0);
  assert.equal(database.runs.length, 0);
  assert.equal(database.batches.length, 0);
});

test("malformed UTF-8 is rejected deterministically with 400", async () => {
  const database = new HarnessD1();
  const worker = createWorker({ now: () => NOW });
  const prefix = new TextEncoder().encode('{"email":"artist');
  const suffix = new TextEncoder().encode('@example.com"}');
  const request = streamRequest([
    prefix,
    new Uint8Array([0xc3, 0x28]),
    suffix,
  ]);

  const response = await worker.fetch(request, baseEnv(database));
  const body = (await response.json()) as ApiErrorResponse;

  assert.equal(response.status, 400);
  assert.equal(body.error.code, "invalid_encoding");
  assert.equal(database.firsts.length, 0);
  assert.equal(database.runs.length, 0);
});

test("a crafted non-string preferredContact returns validation issues instead of crashing", async () => {
  const database = new HarnessD1();
  const worker = createWorker({ now: () => NOW });
  const submission: Record<string, unknown> = {
    ...validSubmission(),
    preferredContact: {
      toString: null,
      valueOf: null,
    },
  };
  const request = new Request(
    "https://commissions-api.example.com/v1/commissions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "crafted-contact-123",
        Origin: "https://sheepex.org",
      },
      body: JSON.stringify({
        submission,
        verificationToken: "v".repeat(43),
      }),
    },
  );

  const response = await worker.fetch(request, baseEnv(database));
  const body = (await response.json()) as ApiErrorResponse;

  assert.equal(response.status, 422);
  assert.equal(body.error.code, "validation_failed");
  assert.equal(
    body.error.issues?.some((issue) => issue.field === "preferredContact"),
    true,
  );
  assert.equal(database.firsts.length, 0);
  assert.equal(database.runs.length, 0);
});

test("resending creates an independent challenge and leaves an earlier delivered code usable", async () => {
  type Challenge = {
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
  };

  const database = new HarnessD1();
  const challenges = new Map<string, Challenge>();
  const cooldowns = new Map<string, number>();
  const provider = new CapturingProvider();
  const codes = ["1111", "2222"];
  let now = NOW;

  database.onFirst = (statement) => {
    const sql = normalizeSql(statement.sql);
    if (sql.includes("INSERT INTO rate_limit_counters")) {
      return { count: 1 };
    }
    if (sql.includes("INSERT INTO verification_send_state")) {
      const emailKey = String(statement.values[0]);
      const nextSendAt = Number(statement.values[1]);
      const claimTime = Number(statement.values[3]);
      const existing = cooldowns.get(emailKey);
      if (existing !== undefined && existing > claimTime) return null;
      cooldowns.set(emailKey, nextSendAt);
      return { next_send_at: nextSendAt };
    }
    if (
      sql.includes("FROM verification_challenges") &&
      sql.includes("WHERE id = ?")
    ) {
      return challenges.get(String(statement.values[0])) ?? null;
    }
    throw new Error(`Unexpected resend first(): ${sql}`);
  };
  database.onRun = (statement) => {
    const sql = normalizeSql(statement.sql);
    if (sql.includes("INSERT INTO verification_challenges")) {
      const challenge: Challenge = {
        id: String(statement.values[0]),
        email: String(statement.values[1]),
        email_key: String(statement.values[2]),
        code_hash: String(statement.values[3]),
        created_at: Number(statement.values[4]),
        expires_at: Number(statement.values[5]),
        resend_available_at: Number(statement.values[6]),
        attempts: 0,
        consumed_at: null,
        invalidated_at: null,
        issued_token_hash: null,
      };
      challenges.set(challenge.id, challenge);
      return changedResult();
    }
    throw new Error(`Unexpected resend run(): ${sql}`);
  };
  database.onBatch = (statements) => {
    assert.equal(statements.length, 2);
    assert.match(statements[0].sql, /UPDATE verification_challenges/);
    assert.match(statements[1].sql, /INSERT INTO verification_tokens/);
    return statements.map(() => changedResult());
  };

  const worker = createWorker({
    now: () => now,
    emailProviderFactory: () => provider,
    verificationCodeGenerator: () => {
      const code = codes.shift();
      assert.ok(code);
      return code;
    },
    opaqueTokenGenerator: () => "t".repeat(43),
  });
  const env = baseEnv(database);

  async function sendCode(): Promise<VerificationChallengeResponse> {
    const response = await worker.fetch(
      new Request(
        "https://commissions-api.example.com/v1/verification/send",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: "https://sheepex.org",
            "CF-Connecting-IP": "203.0.113.9",
          },
          body: JSON.stringify({ email: "artist@example.com" }),
        },
      ),
      env,
    );
    assert.equal(response.status, 201);
    return (await response.json()) as VerificationChallengeResponse;
  }

  const first = await sendCode();
  now = new Date(NOW.getTime() + 61_000);
  const second = await sendCode();

  assert.notEqual(first.challengeId, second.challengeId);
  assert.equal(provider.messages.length, 2);
  assert.match(provider.messages[0].text, /1111/);
  assert.match(provider.messages[1].text, /2222/);
  assert.equal(challenges.get(first.challengeId)?.invalidated_at, null);
  assert.equal(
    database.runs.some((statement) =>
      /SET\s+invalidated_at\s*=/.test(normalizeSql(statement.sql)),
    ),
    false,
  );

  const verificationResponse = await worker.fetch(
    new Request(
      "https://commissions-api.example.com/v1/verification/verify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://sheepex.org",
          "CF-Connecting-IP": "203.0.113.9",
        },
        body: JSON.stringify({
          challengeId: first.challengeId,
          code: "1111",
        }),
      },
    ),
    env,
  );
  const verified =
    (await verificationResponse.json()) as VerificationSuccessResponse;

  assert.equal(verificationResponse.status, 200);
  assert.equal(verified.verificationToken, "t".repeat(43));
});

test("scheduled recovery retries a failed customer email with backoff and runs bounded cleanup", async () => {
  const requestId = "SXP-20260801-RETRY123";
  const submission = validSubmission();
  const estimate: CommissionEstimate = calculateEstimate(submission, NOW);
  const provider = new CapturingProvider(true);
  const database = new HarnessD1();

  database.onAll = (statement) => {
    const sql = normalizeSql(statement.sql);
    assert.match(sql, /FROM commission_requests/);
    assert.deepEqual(statement.values, [
      5,
      NOW_SECONDS,
      NOW_SECONDS - 15 * 60,
      5,
      NOW_SECONDS,
      NOW_SECONDS - 15 * 60,
      20,
    ]);
    return {
      success: true,
      results: [
        {
          request_id: requestId,
          submission_json: JSON.stringify(submission),
          estimate_json: JSON.stringify(estimate),
          customer_email_status: "failed",
          owner_email_status: "sent",
        },
      ],
      meta: { rows_read: 1 },
    };
  };
  database.onFirst = (statement) => {
    const sql = normalizeSql(statement.sql);
    assert.match(sql, /customer_email_status = 'sending'/);
    assert.deepEqual(statement.values, [
      NOW_SECONDS,
      requestId,
      5,
      NOW_SECONDS,
      NOW_SECONDS - 15 * 60,
    ]);
    return { attempts: 2 };
  };
  database.onRun = (statement) => {
    const sql = normalizeSql(statement.sql);
    assert.match(sql, /customer_email_status = \?/);
    return changedResult();
  };
  database.onBatch = (statements) => {
    assert.equal(statements.length, 4);
    return statements.map(() => changedResult());
  };

  const worker = createWorker({
    now: () => NOW,
    emailProviderFactory: () => provider,
  });
  const pending: Promise<unknown>[] = [];
  const context: ExecutionContext = {
    waitUntil(promise) {
      pending.push(promise);
    },
    passThroughOnException() {},
  };
  const controller: ScheduledController = {
    cron: "*/5 * * * *",
    scheduledTime: NOW.getTime(),
    noRetry() {},
  };

  worker.scheduled(controller, baseEnv(database), context);
  assert.equal(pending.length, 1);
  await Promise.all(pending);

  assert.equal(provider.messages.length, 1);
  assert.equal(provider.messages[0].to, submission.email);
  assert.equal(
    provider.messages[0].idempotencyKey,
    `commission-${requestId}-customer`,
  );
  assert.equal(database.runs.length, 1);
  assert.deepEqual(database.runs[0].values, [
    "failed",
    NOW_SECONDS + 5 * 60,
    requestId,
    2,
  ]);

  assert.equal(database.batches.length, 1);
  const cleanup = database.batches[0];
  assert.equal(cleanup.length, 4);
  assert.match(cleanup[0].sql, /DELETE FROM rate_limit_counters/);
  assert.deepEqual(cleanup[0].values, [NOW_SECONDS]);
  assert.match(cleanup[1].sql, /DELETE FROM verification_send_state/);
  assert.deepEqual(cleanup[1].values, [NOW_SECONDS]);
  assert.match(cleanup[2].sql, /DELETE FROM verification_tokens/);
  assert.match(cleanup[2].sql, /NOT EXISTS/);
  assert.deepEqual(cleanup[2].values, [NOW_SECONDS]);
  assert.match(cleanup[3].sql, /DELETE FROM verification_challenges/);
  assert.match(cleanup[3].sql, /NOT EXISTS/);
  assert.deepEqual(cleanup[3].values, [NOW_SECONDS]);
});
