export const commissionConfig = {
  currency: "USD",
  locale: "en-US",
  estimateDisclaimer:
    "This is an estimated price. The final quote may change depending on the full project requirements.",
  responseTime: "I usually reply within 2–3 days.",
  commissionGroups: [
    {
      id: "art",
      label: "Art",
      description: "Character-focused illustrations and artwork.",
    },
    {
      id: "gfx",
      label: "GFX",
      description: "Graphics for channels, videos, and streams.",
    },
    {
      id: "custom",
      label: "Custom requests",
      description: "Ideas that do not fit neatly into another category.",
    },
  ],
  commissionTypes: [
    {
      id: "character-art",
      group: "art",
      label: "Character art",
      description: "A polished illustration focused on one or more characters.",
      price: { min: 2000, max: 2500 },
    },
    {
      id: "original-character",
      group: "art",
      label: "Original characters",
      description: "Artwork or visual development for your own character.",
      price: { min: 3000, max: 4000 },
    },
    {
      id: "fanart",
      group: "art",
      label: "Fanart",
      description: "Artwork inspired by an existing character or series.",
      price: { min: 2000, max: 2500 },
    },
    {
      id: "vtuber-art",
      group: "art",
      label: "VTuber art",
      description: "Character artwork created for a VTuber identity or channel.",
      price: { min: 3500, max: 5000 },
    },
    {
      id: "banner",
      group: "gfx",
      label: "Banner",
      description: "A wide graphic for Twitch, YouTube, osu!, or Discord.",
      price: { min: 2500, max: 3000 },
    },
    {
      id: "thumbnail",
      group: "gfx",
      label: "Thumbnails",
      description: "A clear, eye-catching thumbnail for a video or feature.",
      price: { min: 3000, max: 4000 },
    },
    {
      id: "streaming-assets",
      group: "gfx",
      label: "Streaming assets",
      description: "Visual assets for a stream, such as panels or overlays.",
      price: { min: 3500, max: 5000 },
    },
    {
      id: "custom",
      group: "custom",
      label: "Custom request",
      description: "A tailored request that does not fit the listed options.",
      price: { min: 3500, max: 5000 },
    },
  ],
  bannerPresets: [
    {
      id: "twitch",
      label: "Twitch profile banner",
      dimensions: "1200 × 480 px",
      note: "Recommended profile banner size.",
    },
    {
      id: "youtube",
      label: "YouTube channel banner",
      dimensions: "2560 × 1440 px",
      note: "Keep text and logos inside the 1235 × 338 px safe area.",
    },
    {
      id: "osu",
      label: "osu! banner",
      dimensions: "2000 × 500 px",
      note: "Wide osu! profile banner format.",
    },
    {
      id: "discord",
      label: "Discord profile banner",
      dimensions: "680 × 240 px",
      note: "Current minimum profile banner size.",
    },
  ],
  intendedUses: [
    {
      id: "personal",
      label: "Personal",
      description: "For your own profile or personal project.",
      price: { min: 0, max: 0 },
    },
    {
      id: "creator",
      label: "Creator / channel",
      description: "For a public channel, stream, video, or community.",
      price: { min: 500, max: 1000 },
    },
    {
      id: "release",
      label: "Release / campaign",
      description: "For a promoted release, event, or campaign.",
      price: { min: 1000, max: 1500 },
    },
  ],
  complexities: [
    {
      id: "clean",
      label: "Clean",
      description: "Focused composition with restrained effects.",
      price: { min: 0, max: 0 },
    },
    {
      id: "detailed",
      label: "Detailed",
      description: "More layers, effects, and fine visual treatment.",
      price: { min: 1000, max: 1500 },
    },
    {
      id: "advanced",
      label: "Advanced",
      description: "Complex compositing and a highly worked finish.",
      price: { min: 2000, max: 3500 },
    },
  ],
  conceptOptions: [
    { id: 1, label: "1 concept", price: { min: 0, max: 0 } },
    { id: 2, label: "2 concepts", price: { min: 1000, max: 1000 } },
    { id: 3, label: "3 concepts", price: { min: 1500, max: 1500 } },
  ],
  revisionOptions: [
    { id: 1, label: "1 revision", price: { min: 0, max: 0 } },
    { id: 2, label: "2 revisions", price: { min: 500, max: 500 } },
    { id: 3, label: "3 revisions", price: { min: 1000, max: 1000 } },
  ],
  outputFormats: [
    {
      id: "digital",
      label: "Web / digital",
      description: "A finished PNG or JPG sized for digital use.",
      price: { min: 0, max: 0 },
    },
    {
      id: "high-res",
      label: "High resolution",
      description: "A larger export suitable for flexible digital use.",
      price: { min: 500, max: 500 },
    },
    {
      id: "print",
      label: "Print ready",
      description: "High-resolution export prepared for print production.",
      price: { min: 1000, max: 1500 },
    },
    {
      id: "source",
      label: "Editable source file",
      description: "Layered working file plus the finished export.",
      price: { min: 1500, max: 2000 },
    },
  ],
  commercialUse: {
    label: "Commercial usage",
    description: "For paid promotion, products, client work, or monetized use.",
    percentage: 15,
  },
  rushPricing: [
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
  ],
  limits: {
    projectDescription: { min: 20, max: 2000 },
    dimensions: { min: 2, max: 100 },
    additionalNotes: 1200,
    referenceLinks: 5,
    referenceLinkLength: 500,
    discord: 64,
    otherPlatform: 40,
    otherContact: 200,
  },
  verification: {
    codeLength: 4,
    expiresInMinutes: 10,
    resendCooldownSeconds: 60,
    maxAttempts: 5,
  },
} as const;

export type CommissionTypeId =
  (typeof commissionConfig.commissionTypes)[number]["id"];
export type IntendedUseId =
  (typeof commissionConfig.intendedUses)[number]["id"];
export type ComplexityId =
  (typeof commissionConfig.complexities)[number]["id"];
export type ConceptCount =
  (typeof commissionConfig.conceptOptions)[number]["id"];
export type RevisionCount =
  (typeof commissionConfig.revisionOptions)[number]["id"];
export type OutputFormatId =
  (typeof commissionConfig.outputFormats)[number]["id"];
