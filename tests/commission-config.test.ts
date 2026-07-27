import assert from "node:assert/strict";
import test from "node:test";

import { commissionConfig } from "../data/commissions";

test("commission offerings are grouped into the requested art and GFX services", () => {
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
      { group: "art", id: "fanart", label: "Fanart" },
      { group: "art", id: "vtuber-art", label: "VTuber art" },
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
  assert.equal(commissionConfig.commercialUse.percentage, 15);
});
