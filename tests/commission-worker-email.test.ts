import assert from "node:assert/strict";
import test from "node:test";

import { calculateEstimate } from "../lib/commission/pricing";
import type { CommissionSubmission } from "../lib/commission/types";
import {
  buildCustomerConfirmationEmail,
  buildOwnerNotificationEmail,
  buildVerificationEmail,
  ResendEmailProvider,
  type EmailBrand,
} from "../worker/src/email";

const NOW = new Date("2026-08-01T12:00:00.000Z");
const BRAND: EmailBrand = {
  name: 'sheep <script>alert("brand")</script> & friends',
  siteUrl: 'https://sheepex.org/?ref="<unsafe>&value',
  from: "commissions@sheepex.org",
  replyTo: "reply@sheepex.org",
};

function maliciousSubmission(): CommissionSubmission {
  return {
    commissionType: "cover",
    intendedUse: "creator",
    complexity: "detailed",
    concepts: 2,
    revisions: 2,
    outputFormat: "high-res",
    dimensions: '<img src=x onerror="alert(1)">',
    deliveryDate: "2026-08-11",
    commercialUse: true,
    projectDescription:
      'Please include <script>alert("project")</script> & "quoted" details.',
    additionalNotes: "Avoid <b>unsafe</b> markup & keep the typography clean.",
    referenceLinks: ["https://example.com/?q=<reference>&kind=art"],
    email: "artist@example.com",
    discord: "artist<script>",
    preferredContact: "other",
    otherPlatform: 'Platform "one"',
    otherContact: "<profile>&handle",
  };
}

test("verification email includes HTML and text while escaping interpolated HTML", () => {
  const email = buildVerificationEmail(
    "artist@example.com",
    '1234</div><script>alert("code")</script>',
    10,
    "challenge-123",
    BRAND,
  );

  assert.equal(email.to, "artist@example.com");
  assert.equal(email.idempotencyKey, "verification-challenge-123");
  assert.match(email.subject, /verification code/i);
  assert.match(email.html, /^<!doctype html>/);
  assert.match(email.text, /Your verification code is:/);
  assert.match(email.text, /expires in 10 minutes/i);
  assert.equal(email.html.includes("<script>"), false);
  assert.match(
    email.html,
    /1234&lt;\/div&gt;&lt;script&gt;alert\(&quot;code&quot;\)&lt;\/script&gt;/,
  );
  assert.match(
    email.html,
    /sheep &lt;script&gt;alert\(&quot;brand&quot;\)&lt;\/script&gt; &amp; friends/,
  );
  assert.equal(email.html.includes(BRAND.siteUrl), false);
  assert.match(email.html, /&quot;&lt;unsafe&gt;&amp;value/);
});

test("Resend uses Cloudflare's global fetch with the correct receiver", async () => {
  const originalFetch = globalThis.fetch;
  const mockFetch = function (this: unknown): Promise<Response> {
    assert.equal(this, globalThis);
    return Promise.resolve(new Response(null, { status: 200 }));
  } as typeof fetch;

  globalThis.fetch = mockFetch;
  try {
    const provider = new ResendEmailProvider({
      apiKey: "test-api-key",
      from: "commissions@sheepex.org",
    });

    await provider.send({
      to: "delivered@resend.dev",
      subject: "Test verification",
      html: "<p>Test verification</p>",
      text: "Test verification",
      idempotencyKey: "test-global-fetch-receiver",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("customer and owner emails contain complete HTML/text summaries and escape user data", () => {
  const submission = maliciousSubmission();
  const estimate = calculateEstimate(submission, NOW);
  const requestId = "SXP-20260801-TESTABCD";

  const customer = buildCustomerConfirmationEmail(
    requestId,
    submission,
    estimate,
    BRAND,
  );
  const owner = buildOwnerNotificationEmail(
    "owner@example.com",
    requestId,
    submission,
    estimate,
    BRAND,
  );

  assert.equal(customer.to, submission.email);
  assert.equal(owner.to, "owner@example.com");
  assert.equal(customer.idempotencyKey, `commission-${requestId}-customer`);
  assert.equal(owner.idempotencyKey, `commission-${requestId}-owner`);

  for (const message of [customer, owner]) {
    assert.match(message.html, /^<!doctype html>/);
    assert.match(message.html, new RegExp(requestId));
    assert.match(message.html, /Estimated total/);
    assert.match(message.text, new RegExp(requestId));
    assert.match(message.text, /Estimated total:/);
    assert.equal(message.html.includes("<script>"), false);
    assert.equal(message.html.includes("<img src=x"), false);
    assert.match(
      message.html,
      /&lt;script&gt;alert\(&quot;project&quot;\)&lt;\/script&gt; &amp; &quot;quoted&quot;/,
    );
    assert.match(message.html, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
    assert.equal(message.text.includes(submission.projectDescription), true);
  }

  assert.match(customer.text, /final quote/i);
  assert.match(customer.text, /preferred social platform/i);
  assert.match(owner.text, /Contact\nEmail: artist@example\.com/);
  assert.match(owner.text, /Discord: artist<script>/);
  assert.match(owner.text, /Other contact: Platform "one": <profile>&handle/);
});
