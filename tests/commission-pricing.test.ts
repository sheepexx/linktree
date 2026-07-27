import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateEstimate,
  formatEstimate,
  formatPrice,
  getDaysUntil,
  getRushPrice,
} from "../lib/commission/pricing";
import type { CommissionDetails } from "../lib/commission/types";

const NOW = new Date("2026-01-01T18:45:00.000Z");

function pricingDetails(
  overrides: Partial<CommissionDetails> = {},
): CommissionDetails {
  return {
    commissionType: "character-art",
    intendedUse: "personal",
    complexity: "clean",
    concepts: 1,
    revisions: 1,
    outputFormat: "digital",
    dimensions: "1920 x 1080",
    deliveryDate: "",
    commercialUse: false,
    projectDescription: "A sufficiently detailed project description.",
    additionalNotes: "",
    referenceLinks: [],
    ...overrides,
  };
}

test("calculateEstimate preserves the base price range", () => {
  const estimate = calculateEstimate(pricingDetails(), NOW);

  assert.deepEqual(
    { currency: estimate.currency, min: estimate.min, max: estimate.max },
    { currency: "USD", min: 2_000, max: 5_000 },
  );
  assert.deepEqual(
    estimate.lines.map(({ id, min, max }) => ({ id, min, max })),
    [
      { id: "type", min: 2_000, max: 5_000 },
      { id: "use", min: 0, max: 0 },
      { id: "complexity", min: 0, max: 0 },
      { id: "concepts", min: 0, max: 0 },
      { id: "revisions", min: 0, max: 0 },
      { id: "format", min: 0, max: 0 },
    ],
  );
});

test("calculateEstimate adds option modifiers, rush pricing, and commercial usage", () => {
  const estimate = calculateEstimate(
    pricingDetails({
      commissionType: "thumbnail",
      intendedUse: "creator",
      complexity: "detailed",
      concepts: 2,
      revisions: 2,
      outputFormat: "high-res",
      deliveryDate: "2026-01-08",
      commercialUse: true,
    }),
    NOW,
  );

  assert.deepEqual(
    estimate.lines.map(({ id, min, max }) => ({ id, min, max })),
    [
      { id: "type", min: 3_000, max: 4_000 },
      { id: "use", min: 500, max: 1_000 },
      { id: "complexity", min: 1_000, max: 1_500 },
      { id: "concepts", min: 1_000, max: 1_000 },
      { id: "revisions", min: 500, max: 500 },
      { id: "format", min: 500, max: 500 },
      { id: "deadline", min: 1_000, max: 1_000 },
      { id: "commercial", min: 975, max: 1_275 },
    ],
  );
  assert.deepEqual(
    { min: estimate.min, max: estimate.max },
    { min: 8_475, max: 10_775 },
  );
});

test("commercial usage excludes the fixed rush fee from its subtotal", () => {
  const estimate = calculateEstimate(
    pricingDetails({
      commissionType: "custom",
      intendedUse: "release",
      complexity: "advanced",
      concepts: 3,
      revisions: 3,
      outputFormat: "print",
      deliveryDate: "2026-01-04",
      commercialUse: true,
    }),
    NOW,
  );

  const commercial = estimate.lines.find((line) => line.id === "commercial");
  const usageSubtotal = estimate.lines
    .filter((line) => line.id !== "commercial" && line.id !== "deadline")
    .reduce(
      (total, line) => ({
        min: total.min + line.min,
        max: total.max + line.max,
      }),
      { min: 0, max: 0 },
    );

  assert.deepEqual(commercial, {
    id: "commercial",
    label: "Commercial usage",
    detail: "15% usage fee",
    min: Math.round(usageSubtotal.min * 0.15),
    max: Math.round(usageSubtotal.max * 0.15),
  });
  assert.equal(estimate.min, usageSubtotal.min + 1_000 + commercial!.min);
  assert.equal(estimate.max, usageSubtotal.max + 1_000 + commercial!.max);
});

test("rush pricing adds a fixed ten dollars at seven days or less", () => {
  const standardTier = getRushPrice("2026-01-09", NOW);
  assert.deepEqual(
    standardTier && {
      label: standardTier.label,
      price: standardTier.price,
    },
    {
      label: "Standard timing",
      price: { min: 0, max: 0 },
    },
  );

  const sevenDayTier = getRushPrice("2026-01-08", NOW);
  assert.deepEqual(
    sevenDayTier && {
      label: sevenDayTier.label,
      price: sevenDayTier.price,
    },
    {
      label: "Rush order (7 days or less)",
      price: { min: 1_000, max: 1_000 },
    },
  );

  const threeDayTier = getRushPrice("2026-01-04", NOW);
  assert.deepEqual(
    threeDayTier && {
      label: threeDayTier.label,
      price: threeDayTier.price,
    },
    {
      label: "Rush order (7 days or less)",
      price: { min: 1_000, max: 1_000 },
    },
  );

  assert.equal(getRushPrice("2026-01-03", NOW), null);

  const standard = calculateEstimate(
    pricingDetails({ deliveryDate: "2026-01-09" }),
    NOW,
  );
  assert.equal(
    standard.lines.some((line) => line.id === "deadline"),
    false,
  );
});

test("getDaysUntil validates calendar dates and compares UTC calendar days", () => {
  assert.equal(getDaysUntil("2026-01-02", NOW), 1);
  assert.equal(
    getDaysUntil("2026-01-01", new Date("2026-01-01T23:59:59.999Z")),
    0,
  );
  assert.equal(getDaysUntil("2024-02-29", new Date("2024-02-26T12:00:00Z")), 3);
  assert.equal(getDaysUntil("2025-02-29", NOW), null);
  assert.equal(getDaysUntil("2026-13-01", NOW), null);
  assert.equal(getDaysUntil("01/02/2026", NOW), null);
  assert.equal(getDaysUntil("", NOW), null);
});

test("calculateEstimate rejects unknown option identifiers", () => {
  assert.throws(
    () =>
      calculateEstimate(
        {
          ...pricingDetails(),
          commissionType: "unknown",
        } as unknown as CommissionDetails,
        NOW,
      ),
    /Unknown commission option: unknown/,
  );

  assert.throws(
    () =>
      calculateEstimate(
        {
          ...pricingDetails(),
          concepts: "1",
        } as unknown as CommissionDetails,
        NOW,
      ),
    /Unknown commission option: 1/,
  );
});

test("price formatting handles fixed prices and ranges", () => {
  assert.equal(formatPrice(2_000), "$20");
  assert.equal(
    formatEstimate({
      currency: "USD",
      min: 2_000,
      max: 2_000,
      lines: [],
    }),
    "$20",
  );
  assert.equal(
    formatEstimate({
      currency: "USD",
      min: 2_000,
      max: 2_500,
      lines: [],
    }),
    "$20–$25",
  );
});
