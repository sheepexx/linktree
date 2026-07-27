import { commissionConfig } from "../../data/commissions";
import type {
  CommissionDetails,
  CommissionEstimate,
  PriceAmount,
  PriceLine,
} from "./types";

type PricedOption = {
  id: string | number;
  label: string;
  price: PriceAmount;
};

function findOption<T extends PricedOption>(
  options: readonly T[],
  id: string | number,
): T {
  const option = options.find((entry) => entry.id === id);
  if (!option) throw new Error(`Unknown commission option: ${String(id)}`);
  return option;
}

export function getDaysUntil(date: string, now = new Date()): number | null {
  if (!date) return null;
  const parsed = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!parsed) return null;

  const year = Number(parsed[1]);
  const month = Number(parsed[2]);
  const day = Number(parsed[3]);
  const target = Date.UTC(year, month - 1, day);
  const normalized = new Date(target);

  if (
    normalized.getUTCFullYear() !== year ||
    normalized.getUTCMonth() !== month - 1 ||
    normalized.getUTCDate() !== day
  ) {
    return null;
  }

  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  return Math.ceil((target - today) / 86_400_000);
}

export function getRushPrice(
  deliveryDate: string,
  now = new Date(),
): { label: string; price: PriceAmount } | null {
  const days = getDaysUntil(deliveryDate, now);
  if (days === null) return null;

  const tier =
    commissionConfig.rushPricing.find((entry) => days >= entry.minDays) ?? null;
  return tier ? { label: tier.label, price: tier.price } : null;
}

export function calculateEstimate(
  details: Pick<
    CommissionDetails,
    | "commissionType"
    | "intendedUse"
    | "complexity"
    | "concepts"
    | "revisions"
    | "outputFormat"
    | "deliveryDate"
    | "commercialUse"
  >,
  now = new Date(),
): CommissionEstimate {
  const type = findOption(
    commissionConfig.commissionTypes,
    details.commissionType,
  );
  const intendedUse = findOption(
    commissionConfig.intendedUses,
    details.intendedUse,
  );
  const complexity = findOption(
    commissionConfig.complexities,
    details.complexity,
  );
  const concepts = findOption(
    commissionConfig.conceptOptions,
    details.concepts,
  );
  const revisions = findOption(
    commissionConfig.revisionOptions,
    details.revisions,
  );
  const output = findOption(
    commissionConfig.outputFormats,
    details.outputFormat,
  );
  const rush = getRushPrice(details.deliveryDate, now);

  const lines: PriceLine[] = [
    { id: "type", label: type.label, detail: "Base estimate", ...type.price },
    {
      id: "use",
      label: intendedUse.label,
      detail: "Intended use",
      ...intendedUse.price,
    },
    {
      id: "complexity",
      label: complexity.label,
      detail: "Visual complexity",
      ...complexity.price,
    },
    {
      id: "concepts",
      label: concepts.label,
      detail: "Concept options",
      ...concepts.price,
    },
    {
      id: "revisions",
      label: revisions.label,
      detail: "Revision rounds",
      ...revisions.price,
    },
    {
      id: "format",
      label: output.label,
      detail: "Delivery format",
      ...output.price,
    },
  ];

  if (rush && (rush.price.min > 0 || rush.price.max > 0)) {
    lines.push({
      id: "deadline",
      label: rush.label,
      detail: "Delivery timing",
      ...rush.price,
    });
  }

  const subtotal = lines.reduce(
    (sum, line) => ({
      min: sum.min + line.min,
      max: sum.max + line.max,
    }),
    { min: 0, max: 0 },
  );

  if (details.commercialUse) {
    const percentage = commissionConfig.commercialUse.percentage;
    lines.push({
      id: "commercial",
      label: commissionConfig.commercialUse.label,
      detail: `${percentage}% usage fee`,
      min: Math.round((subtotal.min * percentage) / 100),
      max: Math.round((subtotal.max * percentage) / 100),
    });
  }

  const total = lines.reduce(
    (sum, line) => ({
      min: sum.min + line.min,
      max: sum.max + line.max,
    }),
    { min: 0, max: 0 },
  );

  return {
    currency: commissionConfig.currency,
    min: total.min,
    max: total.max,
    lines,
  };
}

export function formatPrice(
  amountInCents: number,
  currency: string = commissionConfig.currency,
): string {
  return new Intl.NumberFormat(commissionConfig.locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amountInCents / 100);
}

export function formatEstimate(estimate: CommissionEstimate): string {
  const minimum = formatPrice(estimate.min, estimate.currency);
  const maximum = formatPrice(estimate.max, estimate.currency);
  return estimate.min === estimate.max ? minimum : `${minimum}–${maximum}`;
}
