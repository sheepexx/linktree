import assert from "node:assert/strict";
import test from "node:test";

import type {
  CommissionRequestResponse,
  CommissionSubmission,
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
} from "../worker/src/runtime-types";
import { hmacHex } from "../worker/src/security";

const NOW = new Date("2026-08-01T12:00:00.000Z");
const NOW_SECONDS = Math.floor(NOW.getTime() / 1_000);
const REQUEST_ID = "SXP-20260801-TESTABCD";
const VERIFICATION_TOKEN = "v".repeat(43);
const IDEMPOTENCY_KEY = "commission-attempt-123";
const TOKEN_SECRET = "token-secret-material-for-tests-123456789";
const VERIFICATION_SECRET =
  "verification-secret-material-for-tests-123456789";

type VerificationTokenRow = {
  token_hash: string;
  challenge_id: string;
  email: string;
  email_key: string;
  issued_at: number;
  expires_at: number;
  consumed_at: number | null;
  consumption_id: string | null;
};

class FakeStatement implements D1PreparedStatement {
  constructor(
    private readonly database: FakeD1,
    readonly sql: string,
    readonly values: D1Value[] = [],
  ) {}

  bind(...values: D1Value[]): D1PreparedStatement {
    return new FakeStatement(this.database, this.sql, values);
  }

  async first<T = Record<string, unknown>>(): Promise<T | null> {
    return this.database.first(this) as T | null;
  }

  async run<T = Record<string, unknown>>(): Promise<D1Result<T>> {
    this.database.runs.push(this);
    return {
      success: true,
      meta: { changes: 1, rows_written: 1 },
    };
  }

  async all<T = Record<string, unknown>>(): Promise<D1Result<T>> {
    return {
      success: true,
      results: [],
      meta: { changes: 0, rows_read: 0 },
    };
  }
}

class FakeD1 implements D1Database {
  readonly prepared: FakeStatement[] = [];
  readonly batches: FakeStatement[][] = [];
  readonly runs: FakeStatement[] = [];

  constructor(private readonly token: VerificationTokenRow) {}

  prepare(query: string): D1PreparedStatement {
    const statement = new FakeStatement(this, query);
    this.prepared.push(statement);
    return statement;
  }

  first(statement: FakeStatement): unknown {
    const sql = statement.sql.replace(/\s+/g, " ").trim();

    if (
      sql.includes("FROM commission_requests") &&
      sql.includes("WHERE idempotency_key_hash = ?")
    ) {
      return null;
    }
    if (sql.includes("INSERT INTO rate_limit_counters")) {
      return { count: 1 };
    }
    if (
      sql.includes("FROM verification_tokens") &&
      sql.includes("WHERE token_hash = ?")
    ) {
      assert.equal(statement.values[0], this.token.token_hash);
      return this.token;
    }

    throw new Error(`Unexpected fake D1 first() query: ${sql}`);
  }

  async batch<T = Record<string, unknown>>(
    statements: D1PreparedStatement[],
  ): Promise<D1Result<T>[]> {
    const captured = statements.map((statement) => {
      assert.equal(statement instanceof FakeStatement, true);
      return statement as FakeStatement;
    });
    this.batches.push(captured);
    return captured.map(() => ({
      success: true,
      meta: { changes: 1, rows_written: 1 },
    }));
  }
}

class CapturingEmailProvider implements EmailProvider {
  readonly messages: OutgoingEmail[] = [];

  async send(message: OutgoingEmail): Promise<void> {
    this.messages.push(message);
  }
}

function submissionInput(): CommissionSubmission {
  return {
    commissionType: "cover",
    intendedUse: "creator",
    complexity: "detailed",
    concepts: 2,
    revisions: 2,
    outputFormat: "high-res",
    dimensions: "  1920   x   1080  ",
    deliveryDate: "2026-08-11",
    commercialUse: true,
    projectDescription:
      "  A polished cover composition with layered type and detailed lighting.  ",
    additionalNotes: "  Keep the focal point clear.  ",
    referenceLinks: [
      " https://example.com/reference-one ",
      "https://example.org/reference-two",
    ],
    email: " ARTIST@Example.COM ",
    discord: "  sheep   artist  ",
    preferredContact: "other",
    otherPlatform: "  Art   Station  ",
    otherContact: "  @sheep   profile  ",
  };
}

test("POST /v1/commissions persists a verified request, prices it on the server, and sends both emails", async () => {
  const tokenHash = await hmacHex(
    TOKEN_SECRET,
    "verification-token",
    VERIFICATION_TOKEN,
  );
  const database = new FakeD1({
    token_hash: tokenHash,
    challenge_id: "challenge-123",
    email: "artist@example.com",
    email_key: "email-key-hash",
    issued_at: NOW_SECONDS - 60,
    expires_at: NOW_SECONDS + 600,
    consumed_at: null,
    consumption_id: null,
  });
  const emailProvider = new CapturingEmailProvider();
  const env: Env = {
    DB: database,
    ALLOWED_ORIGINS: "https://sheepex.org",
    BRAND_NAME: "sheepex_",
    SITE_URL: "https://sheepex.org",
    EMAIL_FROM: "sheepex commissions <commissions@sheepex.org>",
    EMAIL_REPLY_TO: "commissions@sheepex.org",
    COMMISSION_OWNER_EMAIL: "owner@example.com",
    RESEND_API_KEY: "resend-secret-that-must-never-leak",
    VERIFICATION_HMAC_SECRET: VERIFICATION_SECRET,
    TOKEN_HMAC_SECRET: TOKEN_SECRET,
    VERIFICATION_TOKEN_TTL_MINUTES: "15",
  };
  const worker = createWorker({
    now: () => NOW,
    emailProviderFactory: () => emailProvider,
    requestIdGenerator: () => REQUEST_ID,
  });
  const request = new Request(
    "https://commissions-api.example.com/v1/commissions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": IDEMPOTENCY_KEY,
        Origin: "https://sheepex.org",
        "CF-Connecting-IP": "203.0.113.42",
      },
      body: JSON.stringify({
        submission: submissionInput(),
        verificationToken: VERIFICATION_TOKEN,
        estimate: { currency: "USD", min: 1, max: 1, lines: [] },
      }),
    },
  );

  const response = await worker.fetch(request, env);
  const responseText = await response.text();
  const body = JSON.parse(responseText) as CommissionRequestResponse;

  assert.equal(response.status, 201);
  assert.equal(
    response.headers.get("Access-Control-Allow-Origin"),
    "https://sheepex.org",
  );
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(body.requestId, REQUEST_ID);
  assert.equal(body.submittedAt, NOW.toISOString());
  assert.equal(body.confirmationPending, undefined);
  assert.deepEqual(
    { currency: body.estimate.currency, min: body.estimate.min, max: body.estimate.max },
    { currency: "USD", min: 36_000, max: 50_250 },
  );
  assert.equal(
    body.estimate.lines.some(
      (line) =>
        line.id === "deadline" && line.min === 4_500 && line.max === 6_500,
    ),
    true,
  );
  assert.equal(
    body.estimate.lines.some(
      (line) =>
        line.id === "commercial" &&
        line.min === 12_000 &&
        line.max === 16_750,
    ),
    true,
  );

  assert.deepEqual(body.summary, {
    commissionType: "cover",
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
    referenceLinks: [
      "https://example.com/reference-one",
      "https://example.org/reference-two",
    ],
    email: "artist@example.com",
    discord: "sheep artist",
    preferredContact: "other",
    otherPlatform: "Art Station",
    otherContact: "@sheep profile",
  });

  assert.equal(database.batches.length, 1);
  const persistence = database.batches[0];
  assert.equal(persistence.length, 2);
  const [consumeToken, insertRequest] = persistence;
  assert.match(consumeToken.sql, /UPDATE verification_tokens/);
  assert.match(insertRequest.sql, /INSERT INTO commission_requests/);
  assert.equal(consumeToken.values[2], tokenHash);
  assert.equal(consumeToken.values.includes(VERIFICATION_TOKEN), false);

  const expectedIdempotencyHash = await hmacHex(
    TOKEN_SECRET,
    "commission-idempotency",
    IDEMPOTENCY_KEY,
  );
  assert.equal(insertRequest.values[0], REQUEST_ID);
  assert.equal(insertRequest.values[1], expectedIdempotencyHash);
  assert.notEqual(insertRequest.values[1], IDEMPOTENCY_KEY);
  assert.deepEqual(
    JSON.parse(String(insertRequest.values[3])),
    body.summary,
  );
  assert.deepEqual(
    JSON.parse(String(insertRequest.values[4])),
    body.estimate,
  );
  assert.deepEqual(insertRequest.values.slice(5, 8), [
    "USD",
    36_000,
    50_250,
  ]);

  assert.equal(emailProvider.messages.length, 2);
  const customerEmail = emailProvider.messages.find(
    (message) => message.to === "artist@example.com",
  );
  const ownerEmail = emailProvider.messages.find(
    (message) => message.to === "owner@example.com",
  );
  assert.ok(customerEmail);
  assert.ok(ownerEmail);
  for (const message of [customerEmail, ownerEmail]) {
    assert.match(message.subject, new RegExp(REQUEST_ID));
    assert.match(message.html, new RegExp(REQUEST_ID));
    assert.match(message.text, new RegExp(REQUEST_ID));
    assert.match(message.text, /Estimated total: \$360–\$503/);
  }

  assert.equal(database.runs.length, 2);
  assert.deepEqual(
    database.runs
      .map((statement) => ({
        status: statement.values[0],
        sql: statement.sql,
      }))
      .sort((left, right) => left.sql.localeCompare(right.sql))
      .map(({ status }) => status),
    ["sent", "sent"],
  );
  assert.equal(
    database.runs.every((statement) =>
      /customer_email_status|owner_email_status/.test(statement.sql),
    ),
    true,
  );

  const observableSurface = JSON.stringify({
    response: responseText,
    email: emailProvider.messages,
    batches: database.batches.map((batch) =>
      batch.map(({ sql, values }) => ({ sql, values })),
    ),
    runs: database.runs.map(({ sql, values }) => ({ sql, values })),
  });
  for (const secret of [
    VERIFICATION_TOKEN,
    IDEMPOTENCY_KEY,
    TOKEN_SECRET,
    VERIFICATION_SECRET,
    env.RESEND_API_KEY,
  ]) {
    assert.equal(
      observableSurface.includes(secret),
      false,
      `observable output leaked secret: ${secret}`,
    );
  }
});
