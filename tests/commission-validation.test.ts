import assert from "node:assert/strict";
import test from "node:test";

import {
  validateCommissionSubmission,
  validateEmail,
} from "../lib/commission/validation";

const NOW = new Date("2026-01-01T18:45:00.000Z");

function validSubmission(overrides: Record<string, unknown> = {}) {
  return {
    commissionType: "avatar",
    intendedUse: "personal",
    complexity: "clean",
    concepts: 1,
    revisions: 1,
    outputFormat: "digital",
    dimensions: "1920 x 1080",
    deliveryDate: "2026-01-22",
    commercialUse: false,
    projectDescription: "A sufficiently detailed project description.",
    additionalNotes: "",
    referenceLinks: [],
    email: "artist@example.com",
    discord: "",
    preferredContact: "email",
    otherPlatform: "",
    otherContact: "",
    ...overrides,
  };
}

function issueFields(input: unknown): string[] {
  const result = validateCommissionSubmission(input, NOW);
  assert.equal(result.success, false);
  return result.issues.map((issue) => issue.field);
}

test("non-object request bodies are rejected", () => {
  for (const input of [null, undefined, "request", 42, []]) {
    assert.deepEqual(validateCommissionSubmission(input, NOW), {
      success: false,
      issues: [{ field: "form", message: "The request data is invalid." }],
    });
  }
});

test("unknown and incorrectly typed option identifiers are rejected", () => {
  const fields = issueFields(
    validSubmission({
      commissionType: "portrait",
      intendedUse: "business",
      complexity: "extreme",
      concepts: "1",
      revisions: 4,
      outputFormat: "psd",
    }),
  );

  assert.deepEqual(fields, [
    "commissionType",
    "intendedUse",
    "complexity",
    "concepts",
    "revisions",
    "outputFormat",
  ]);
});

test("required text fields and their configured limits are enforced", () => {
  assert.deepEqual(
    issueFields(
      validSubmission({
        dimensions: " ",
        projectDescription: "too short",
      }),
    ),
    ["dimensions", "projectDescription"],
  );

  assert.deepEqual(
    issueFields(
      validSubmission({
        dimensions: "x".repeat(101),
        projectDescription: "x".repeat(2_001),
        additionalNotes: "x".repeat(1_201),
        discord: "x".repeat(65),
        otherPlatform: "x".repeat(41),
        otherContact: "x".repeat(201),
      }),
    ),
    [
      "dimensions",
      "projectDescription",
      "additionalNotes",
      "discord",
      "otherPlatform",
      "otherContact",
    ],
  );
});

test("email validation rejects missing or malformed values", () => {
  assert.equal(validateEmail(" Person@Example.COM "), null);
  assert.equal(validateEmail(""), "Enter your email address.");
  assert.equal(validateEmail(null), "Enter your email address.");
  assert.equal(validateEmail("person@example"), "Enter a valid email address.");
  assert.equal(
    validateEmail(`${"a".repeat(245)}@example.com`),
    "Enter a valid email address.",
  );
});

test("email remains required for every preferred contact method", () => {
  for (const preferredContact of ["email", "discord", "other"]) {
    const overrides: Record<string, unknown> = {
      email: "",
      preferredContact,
    };
    if (preferredContact === "discord") overrides.discord = "sheep";
    if (preferredContact === "other") {
      overrides.otherPlatform = "Mastodon";
      overrides.otherContact = "@sheep@example.social";
    }

    assert.equal(
      issueFields(validSubmission(overrides)).includes("email"),
      true,
    );
  }
});

test("preferred contact conditionally requires its matching details", () => {
  assert.deepEqual(
    issueFields(
      validSubmission({ preferredContact: "discord", discord: " \t " }),
    ),
    ["discord"],
  );
  assert.deepEqual(
    issueFields(
      validSubmission({
        preferredContact: "other",
        otherPlatform: "",
        otherContact: "",
      }),
    ),
    ["otherPlatform", "otherContact"],
  );
  assert.deepEqual(
    issueFields(validSubmission({ preferredContact: "carrier-pigeon" })),
    ["preferredContact"],
  );

  const emailContact = validateCommissionSubmission(
    validSubmission({
      preferredContact: "email",
      discord: "",
      otherPlatform: "",
      otherContact: "",
    }),
    NOW,
  );
  assert.equal(emailContact.success, true);
});

test("delivery dates must be real dates at least three days away", () => {
  assert.deepEqual(
    issueFields(validSubmission({ deliveryDate: "2026-02-30" })),
    ["deliveryDate"],
  );
  assert.deepEqual(
    issueFields(validSubmission({ deliveryDate: "2026-01-03" })),
    ["deliveryDate"],
  );

  assert.equal(
    validateCommissionSubmission(
      validSubmission({ deliveryDate: "2026-01-04" }),
      NOW,
    ).success,
    true,
  );
  assert.equal(
    validateCommissionSubmission(validSubmission({ deliveryDate: "" }), NOW)
      .success,
    true,
  );
});

test("reference links accept only bounded http and https URLs", () => {
  const unsafeValues = [
    "ftp://example.com/reference.png",
    "javascript:alert(1)",
    "/relative/reference.png",
    "not a URL",
    `https://example.com/${"x".repeat(500)}`,
  ];

  for (const referenceLinks of unsafeValues) {
    assert.deepEqual(
      issueFields(validSubmission({ referenceLinks })),
      ["referenceLinks"],
    );
  }

  assert.deepEqual(
    issueFields(
      validSubmission({
        referenceLinks: Array.from(
          { length: 6 },
          (_, index) => `https://example.com/${index}`,
        ),
      }),
    ),
    ["referenceLinks"],
  );

  assert.equal(
    validateCommissionSubmission(
      validSubmission({
        referenceLinks:
          "https://example.com/reference.png\r\nhttp://assets.example.org/art?id=1",
      }),
      NOW,
    ).success,
    true,
  );
});

test("a valid submission is sanitized and normalized", () => {
  const result = validateCommissionSubmission(
    validSubmission({
      dimensions: "  １９２０   ×   １０８０\u0007  ",
      deliveryDate: " 2026-01-22 ",
      commercialUse: true,
      projectDescription:
        "  A detailed commission concept.\r\nSecond line.   \r\n\r\n\r\n\r\nLast line.  ",
      additionalNotes: "  Notes\twith   spacing.\u0000  ",
      referenceLinks:
        " https://example.com/reference.png \r\n\r\n http://assets.example.org/art ",
      email: " ARTIST@Example.COM ",
      discord: "  sheep   artist ",
      preferredContact: "other",
      otherPlatform: "  Artist   Platform ",
      otherContact: "  @sheep   profile ",
      ignoredServerField: "<script>trusted = true</script>",
    }),
    NOW,
  );

  assert.equal(result.success, true);
  if (!result.success) return;

  assert.deepEqual(result.data, {
    commissionType: "avatar",
    intendedUse: "personal",
    complexity: "clean",
    concepts: 1,
    revisions: 1,
    outputFormat: "digital",
    dimensions: "1920 × 1080",
    deliveryDate: "2026-01-22",
    commercialUse: true,
    projectDescription:
      "A detailed commission concept.\nSecond line.\n\n\nLast line.",
    additionalNotes: "Notes\twith   spacing.",
    referenceLinks: [
      "https://example.com/reference.png",
      "http://assets.example.org/art",
    ],
    email: "artist@example.com",
    discord: "sheep artist",
    preferredContact: "other",
    otherPlatform: "Artist Platform",
    otherContact: "@sheep profile",
  });
  assert.equal("ignoredServerField" in result.data, false);
});

test("commercial use must be supplied as a boolean", () => {
  for (const commercialUse of ["true", 1, "on", null]) {
    assert.deepEqual(
      issueFields(validSubmission({ commercialUse })),
      ["commercialUse"],
    );
  }

  const missing: Record<string, unknown> = validSubmission();
  delete missing.commercialUse;
  assert.deepEqual(issueFields(missing), ["commercialUse"]);

  for (const commercialUse of [false, true]) {
    const result = validateCommissionSubmission(
      validSubmission({ commercialUse }),
      NOW,
    );
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.commercialUse, commercialUse);
    }
  }
});
