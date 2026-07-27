# Commission API Worker

This directory is a separately deployable Cloudflare Worker for the commission
request page. It uses the shared configuration, validation, and pricing logic in
`../data/commissions.ts` and `../lib/commission/`.

## What it provides

- `POST /v1/verification/send`
- `POST /v1/verification/verify`
- `POST /v1/commissions`
- `GET /v1/health`
- a scheduled recovery and cleanup job every five minutes

Verification codes are generated with Web Crypto, expire after ten minutes,
allow five attempts, and are stored only as domain-separated HMAC digests. A
successful verification returns a random, HMAC-at-rest token with a default
15-minute lifetime. D1 transactions make both code use and token use single-use.
Fixed-window limits cover both hashed IP and hashed email identifiers.
Resends create an independent challenge, so a successfully delivered earlier
code remains usable until its own expiry or single use.

Commission submissions are sanitized with the shared server validator and
priced again on the server. The verified email must match the submitted email.
Each verified token can create one request. `Idempotency-Key` also prevents
duplicate requests and safely replays the original response for an identical
retry.

Customer confirmations and owner notifications use durable delivery state in
D1. The request performs one immediate delivery attempt. The scheduled handler
then retries only unsent recipients, using the same Resend idempotency key on
every attempt. Retries use bounded backoff and stop after five attempts. The
same job removes expired rate-limit counters and send cooldowns, plus expired
verification records that are not referenced by a commission request.

## Cloudflare setup

1. Install this package:

   ```sh
   cd worker
   npm install
   ```

2. Copy `wrangler.toml.example` to `wrangler.toml`.

3. Create D1 and paste the returned database ID into `wrangler.toml`:

   ```sh
   npx wrangler d1 create sheepex-commissions
   ```

4. Apply the migration:

   ```sh
   npm run db:migrate:remote
   ```

5. Add the three secrets. Use two different randomly generated values of at
   least 32 bytes for the HMAC secrets:

   ```sh
   npx wrangler secret put RESEND_API_KEY
   npx wrangler secret put VERIFICATION_HMAC_SECRET
   npx wrangler secret put TOKEN_HMAC_SECRET
   ```

6. Review the non-secret variables in `wrangler.toml`, then deploy:

   ```sh
   npm run deploy
   ```

The `[triggers]` entry in the template installs a five-minute cron. Keep this
enabled so transient confirmation and owner-notification failures recover.

For local development, copy `.dev.vars.example` to `.dev.vars`, apply the local
migration with `npm run db:migrate:local`, and run `npm run dev`.

## Environment

Required secrets:

- `RESEND_API_KEY`: Resend API key.
- `VERIFICATION_HMAC_SECRET`: at least 32 random bytes; hashes verification
  codes and rate-limit identifiers.
- `TOKEN_HMAC_SECRET`: a different secret of at least 32 random bytes; hashes
  verified tokens and idempotency keys.

Required Worker variables:

- `ALLOWED_ORIGINS`: comma-separated exact origins. Wildcards are ignored.
- `EMAIL_FROM`: a sender on a domain verified in Resend.
- `COMMISSION_OWNER_EMAIL`: recipient for the private owner notification.

Optional Worker variables:

- `EMAIL_REPLY_TO`
- `BRAND_NAME` (defaults to `sheepex_`)
- `SITE_URL` (defaults to `https://sheepex.org`)
- `VERIFICATION_TOKEN_TTL_MINUTES` (defaults to 15 and is clamped to 5–30)

The frontend should use the deployed Worker origin as its commission API base
URL. No provider key, owner address, verification code, or raw token is logged
or returned outside its intended one-time response.

## Additional production protection

The API applies origin checks, fixed-window IP/email limits, resend cooldowns,
and bounded verification attempts. As an additional abuse-control layer,
enable Cloudflare WAF/bot protection for the Worker route. For higher-risk
traffic, add a Turnstile challenge to `POST /v1/verification/send` and validate
its token in the Worker before sending email. This remains a recommended
deployment hardening step because application-level rate limits alone do not
absorb large distributed bot traffic.

## API contract

### Send a code

```http
POST /v1/verification/send
Content-Type: application/json

{"email":"customer@example.com"}
```

Success (`201`):

```json
{
  "challengeId": "uuid",
  "expiresAt": "2026-07-27T12:10:00.000Z",
  "resendAvailableAt": "2026-07-27T12:01:00.000Z"
}
```

### Verify a code

```http
POST /v1/verification/verify
Content-Type: application/json

{"challengeId":"uuid","code":"0123"}
```

Success (`200`):

```json
{
  "verificationToken": "opaque-base64url-token",
  "expiresAt": "2026-07-27T12:15:00.000Z"
}
```

Useful verification errors include `verification_invalid`,
`verification_expired`, `verification_replaced`, `verification_used`,
`verification_attempts_exceeded`, `verification_resend_cooldown`, and
`rate_limited`.

### Submit a request

```http
POST /v1/commissions
Content-Type: application/json
Idempotency-Key: 2ba7a1bb-4345-4759-82cc-7a7ef881e189

{
  "submission": {
    "...": "the complete CommissionSubmission object"
  },
  "verificationToken": "opaque-base64url-token"
}
```

Success is `201`; an identical idempotent replay is `200` and includes
`Idempotency-Replayed: true`.

```json
{
  "requestId": "SXP-20260727-ABCDEFGH",
  "submittedAt": "2026-07-27T12:00:00.000Z",
  "estimate": {
    "currency": "USD",
    "min": 6500,
    "max": 8500,
    "lines": []
  },
  "summary": {},
  "confirmationPending": true
}
```

`confirmationPending` is present only when the customer confirmation email was
not accepted by the provider. Owner-notification delivery state is private.
Provider error details are never included in frontend responses.

All error responses use:

```json
{
  "error": {
    "code": "stable_machine_code",
    "message": "Safe customer-facing message",
    "retryAfter": 60,
    "issues": []
  }
}
```

`retryAfter` and `issues` are included only when relevant.
