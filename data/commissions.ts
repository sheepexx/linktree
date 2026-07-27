export const commissionConfig = {
  currency: "USD",
  locale: "en-US",
  estimateDisclaimer:
    "This is an estimated price. The final quote may change depending on the full project requirements.",
  responseTime: "I usually reply within 2–3 days.",
  commissionTypes: [
    {
      id: "avatar",
      label: "Avatar / icon",
      description: "A polished profile image for social or community accounts.",
      price: { min: 6500, max: 8500 },
    },
    {
      id: "banner",
      label: "Banner / header",
      description: "A wide-format graphic for a profile, channel, or community.",
      price: { min: 7500, max: 10500 },
    },
    {
      id: "cover",
      label: "Cover artwork",
      description: "Artwork or GFX for a release, map, video, or feature.",
      price: { min: 9500, max: 14000 },
    },
    {
      id: "custom",
      label: "Custom GFX",
      description: "Something more tailored that does not fit the other options.",
      price: { min: 11000, max: 17000 },
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
      price: { min: 1500, max: 2500 },
    },
    {
      id: "release",
      label: "Release / campaign",
      description: "For a promoted release, event, or campaign.",
      price: { min: 3000, max: 4500 },
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
      price: { min: 3000, max: 5000 },
    },
    {
      id: "advanced",
      label: "Advanced",
      description: "Complex compositing and a highly worked finish.",
      price: { min: 7000, max: 11000 },
    },
  ],
  conceptOptions: [
    { id: 1, label: "1 concept", price: { min: 0, max: 0 } },
    { id: 2, label: "2 concepts", price: { min: 2500, max: 2500 } },
    { id: 3, label: "3 concepts", price: { min: 4500, max: 4500 } },
  ],
  revisionOptions: [
    { id: 1, label: "1 revision", price: { min: 0, max: 0 } },
    { id: 2, label: "2 revisions", price: { min: 1500, max: 1500 } },
    { id: 3, label: "3 revisions", price: { min: 3000, max: 3000 } },
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
      price: { min: 1500, max: 1500 },
    },
    {
      id: "print",
      label: "Print ready",
      description: "High-resolution export prepared for print production.",
      price: { min: 3000, max: 4000 },
    },
    {
      id: "source",
      label: "Editable source file",
      description: "Layered working file plus the finished export.",
      price: { min: 4000, max: 6000 },
    },
  ],
  commercialUse: {
    label: "Commercial usage",
    description: "For paid promotion, products, client work, or monetized use.",
    percentage: 50,
  },
  rushPricing: [
    {
      minDays: 21,
      label: "Flexible timing",
      price: { min: 0, max: 0 },
    },
    {
      minDays: 14,
      label: "2–3 week delivery",
      price: { min: 2000, max: 3000 },
    },
    {
      minDays: 7,
      label: "1–2 week rush",
      price: { min: 4500, max: 6500 },
    },
    {
      minDays: 3,
      label: "Under 1 week rush",
      price: { min: 8000, max: 12000 },
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
