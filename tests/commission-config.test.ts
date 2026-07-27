import assert from "node:assert/strict";
import test from "node:test";

import { commissionConfig } from "../data/commissions";

test("commission offerings group related artwork into one later-specified choice", () => {
  assert.deepEqual(
    commissionConfig.commissionTypes.map(({ group, id, label }) => ({
      group,
      id,
      label,
    })),
    [
      { group: "art", id: "character-art", label: "Character art" },
      {
        group: "art",
        id: "original-character",
        label: "Original characters",
      },
      { group: "gfx", id: "banner", label: "Banner" },
      { group: "gfx", id: "thumbnail", label: "Thumbnails" },
      {
        group: "gfx",
        id: "streaming-assets",
        label: "Streaming assets",
      },
      { group: "custom", id: "custom", label: "Custom request" },
    ],
  );
  assert.match(
    commissionConfig.commissionTypes.find(({ id }) => id === "character-art")!
      .description,
    /Character art, fanart, or VTuber art/,
  );
});

test("base prices stay fixed while add-ons rise progressively", () => {
  assert.deepEqual(
    commissionConfig.commissionTypes.map(({ id, price }) => ({ id, price })),
    [
      { id: "character-art", price: { min: 2000, max: 5000 } },
      { id: "original-character", price: { min: 3000, max: 4000 } },
      { id: "banner", price: { min: 2500, max: 3000 } },
      { id: "thumbnail", price: { min: 3000, max: 4000 } },
      { id: "streaming-assets", price: { min: 3500, max: 5000 } },
      { id: "custom", price: { min: 3500, max: 5000 } },
    ],
  );

  assert.deepEqual(
    {
      intendedUses: commissionConfig.intendedUses.map(({ id, price }) => ({
        id,
        price,
      })),
      complexities: commissionConfig.complexities.map(({ id, price }) => ({
        id,
        price,
      })),
      concepts: commissionConfig.conceptOptions.map(({ id, price }) => ({
        id,
        price,
      })),
      revisions: commissionConfig.revisionOptions.map(({ id, price }) => ({
        id,
        price,
      })),
      outputFormats: commissionConfig.outputFormats.map(({ id, price }) => ({
        id,
        price,
      })),
      commercialUsePercentage: commissionConfig.commercialUse.percentage,
    },
    {
      intendedUses: [
        { id: "personal", price: { min: 0, max: 0 } },
        { id: "creator", price: { min: 600, max: 1200 } },
        { id: "release", price: { min: 1300, max: 2000 } },
      ],
      complexities: [
        { id: "clean", price: { min: 0, max: 0 } },
        { id: "detailed", price: { min: 1200, max: 1800 } },
        { id: "advanced", price: { min: 2500, max: 4000 } },
      ],
      concepts: [
        { id: 1, price: { min: 0, max: 0 } },
        { id: 2, price: { min: 1100, max: 1100 } },
        { id: 3, price: { min: 2300, max: 2300 } },
      ],
      revisions: [
        { id: 1, price: { min: 0, max: 0 } },
        { id: 2, price: { min: 600, max: 600 } },
        { id: 3, price: { min: 1300, max: 1300 } },
      ],
      outputFormats: [
        { id: "digital", price: { min: 0, max: 0 } },
        { id: "high-res", price: { min: 600, max: 600 } },
        { id: "print", price: { min: 1200, max: 1800 } },
        { id: "source", price: { min: 2000, max: 2800 } },
      ],
      commercialUsePercentage: 18,
    },
  );

  const concepts = commissionConfig.conceptOptions;
  const revisions = commissionConfig.revisionOptions;
  assert.ok(concepts[2].price.min - concepts[1].price.min > concepts[1].price.min);
  assert.ok(revisions[2].price.min - revisions[1].price.min > revisions[1].price.min);
});

test("banner presets use the requested and platform-recommended dimensions", () => {
  assert.deepEqual(
    commissionConfig.bannerPresets.map(({ id, dimensions }) => ({
      id,
      dimensions,
    })),
    [
      { id: "twitch", dimensions: "1200 × 480 px" },
      { id: "youtube", dimensions: "2560 × 1440 px" },
      { id: "osu", dimensions: "2000 × 500 px" },
      { id: "discord", dimensions: "680 × 240 px" },
    ],
  );
  assert.match(
    commissionConfig.bannerPresets.find(({ id }) => id === "youtube")!.note,
    /1235 × 338 px/,
  );
});

test("rush pricing is a fixed ten dollars from three through seven days", () => {
  assert.deepEqual(commissionConfig.rushPricing, [
    {
      minDays: 8,
      label: "Standard timing",
      price: { min: 0, max: 0 },
    },
    {
      minDays: 3,
      label: "Rush order (7 days or less)",
      price: { min: 1000, max: 1000 },
    },
  ]);
});
