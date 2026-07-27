# Commission request setup

The public flow is exported at `/commission/` with the rest of the Next.js
site. Security-sensitive work runs in the separately deployed Cloudflare Worker
under `worker/`, because GitHub Pages cannot safely generate email codes, keep
secrets, or persist requests.

## Edit options and prices

All customer-facing choices, USD price ranges, rush tiers, commercial-use
percentage, field limits, and verification timings live in:

```text
data/commissions.ts
```

The browser and Worker both use the same pricing and validation functions, but
the Worker always validates the submission and recalculates the estimate before
saving it. The checked-in amounts are starter USD estimates and should be
reviewed before launch.

## Connect the frontend

Set the public Worker origin without a trailing slash:

```dotenv
NEXT_PUBLIC_COMMISSION_API_URL=https://your-worker.example.com
```

Use `.env.local` for local Next.js development. For the existing GitHub Pages
workflow, create a GitHub Actions repository variable named
`NEXT_PUBLIC_COMMISSION_API_URL`; `.github/workflows/pages.yml` passes it to the
static build.

## Deploy the API

Follow [`worker/README.md`](worker/README.md) to create the D1 database, apply
the migration, configure Resend, add Worker secrets, and deploy. The required
server-side configuration is:

- `RESEND_API_KEY`
- `VERIFICATION_HMAC_SECRET`
- `TOKEN_HMAC_SECRET`
- `ALLOWED_ORIGINS`
- `EMAIL_FROM`
- `COMMISSION_OWNER_EMAIL`

`EMAIL_REPLY_TO`, `BRAND_NAME`, `SITE_URL`, and
`VERIFICATION_TOKEN_TTL_MINUTES` are optional. `worker/wrangler.toml.example`
documents the non-secret defaults; never commit `worker/.dev.vars` or the real
HMAC/API secrets.

Resend must verify the domain used by `EMAIL_FROM`. If the API is deployed on a
different origin, that exact frontend origin must remain in `ALLOWED_ORIGINS`.

## Storage and delivery

D1 stores the normalized brief, contact details, server-calculated estimate,
request ID, verification linkage, timestamps, and customer/owner email delivery
status. Request IDs use the form `SXP-YYYYMMDD-XXXXXXXX`.

An accepted request remains saved even if an email provider call fails. The
success response marks a customer confirmation as pending without exposing
provider details. A five-minute Worker cron retries customer and owner email
delivery with bounded backoff and stable provider idempotency keys; delivery
status remains available in D1.

Application-level origin checks, cooldowns, and IP/email limits are included.
For production, also enable Cloudflare WAF/bot protection on the Worker route;
Turnstile on the verification-send endpoint is recommended if distributed bot
traffic becomes a concern.

The current static stack has no secure upload or malware-scanning pipeline, so
the form accepts up to five public `http(s)` reference links instead of file
uploads. Add uploads only with private object storage, signed upload URLs,
content-type/size enforcement, and a retention policy.

## Verification commands

From the repository root:

```sh
npm test
npm run lint
npm run typecheck
npm run build
```

From `worker/` after installing its development dependencies:

```sh
npm run typecheck
```
