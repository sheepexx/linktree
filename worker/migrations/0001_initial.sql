PRAGMA foreign_keys = ON;

CREATE TABLE verification_send_state (
  email_key TEXT PRIMARY KEY,
  next_send_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE verification_challenges (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  email_key TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  resend_available_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  consumed_at INTEGER,
  invalidated_at INTEGER,
  issued_token_hash TEXT UNIQUE,
  CHECK (expires_at > created_at),
  CHECK (resend_available_at > created_at)
);

CREATE INDEX verification_challenges_email_created
  ON verification_challenges(email_key, created_at DESC);

CREATE TABLE verification_tokens (
  token_hash TEXT PRIMARY KEY,
  challenge_id TEXT NOT NULL UNIQUE
    REFERENCES verification_challenges(id) ON DELETE RESTRICT,
  email TEXT NOT NULL,
  email_key TEXT NOT NULL,
  issued_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  consumed_at INTEGER,
  consumption_id TEXT UNIQUE,
  CHECK (expires_at > issued_at)
);

CREATE INDEX verification_tokens_expiry
  ON verification_tokens(expires_at);

CREATE TABLE rate_limit_counters (
  scope TEXT NOT NULL,
  identifier_hash TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL CHECK (count > 0),
  expires_at INTEGER NOT NULL,
  PRIMARY KEY (scope, identifier_hash, window_start)
);

CREATE INDEX rate_limit_counters_expiry
  ON rate_limit_counters(expires_at);

CREATE TABLE commission_requests (
  request_id TEXT PRIMARY KEY,
  idempotency_key_hash TEXT NOT NULL UNIQUE,
  request_hash TEXT NOT NULL,
  verification_token_hash TEXT NOT NULL UNIQUE
    REFERENCES verification_tokens(token_hash) ON DELETE RESTRICT,
  verification_challenge_id TEXT NOT NULL
    REFERENCES verification_challenges(id) ON DELETE RESTRICT,
  email TEXT NOT NULL,
  submission_json TEXT NOT NULL,
  estimate_json TEXT NOT NULL,
  estimate_currency TEXT NOT NULL,
  estimate_min INTEGER NOT NULL CHECK (estimate_min >= 0),
  estimate_max INTEGER NOT NULL CHECK (estimate_max >= estimate_min),
  verified_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  customer_email_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (customer_email_status IN ('pending', 'sending', 'sent', 'failed')),
  owner_email_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (owner_email_status IN ('pending', 'sending', 'sent', 'failed')),
  customer_email_attempts INTEGER NOT NULL DEFAULT 0
    CHECK (customer_email_attempts >= 0),
  owner_email_attempts INTEGER NOT NULL DEFAULT 0
    CHECK (owner_email_attempts >= 0),
  customer_email_next_attempt_at INTEGER,
  owner_email_next_attempt_at INTEGER,
  customer_email_last_attempt_at INTEGER,
  owner_email_last_attempt_at INTEGER
);

CREATE INDEX commission_requests_email_created
  ON commission_requests(email, created_at DESC);

CREATE INDEX commission_requests_created
  ON commission_requests(created_at DESC);

CREATE INDEX commission_requests_customer_delivery_due
  ON commission_requests(
    customer_email_status,
    customer_email_next_attempt_at,
    customer_email_attempts
  );

CREATE INDEX commission_requests_owner_delivery_due
  ON commission_requests(
    owner_email_status,
    owner_email_next_attempt_at,
    owner_email_attempts
  );
