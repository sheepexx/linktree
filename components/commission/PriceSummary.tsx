import { commissionConfig } from "@/data/commissions";
import {
  formatEstimate,
  formatPrice,
} from "@/lib/commission/pricing";
import type { CommissionEstimate } from "@/lib/commission/types";

type PriceSummaryProps = {
  estimate: CommissionEstimate;
  compact?: boolean;
};

function LineAmount({
  min,
  max,
  currency,
  isBase = false,
}: {
  min: number;
  max: number;
  currency: string;
  isBase?: boolean;
}) {
  if (min === 0 && max === 0) {
    return <span className="text-muted">included</span>;
  }

  const amount =
    min === max
      ? formatPrice(min, currency)
      : `${formatPrice(min, currency)}–${formatPrice(max, currency)}`;

  return <span>{isBase ? amount : `+${amount}`}</span>;
}

export function PriceSummary({ estimate, compact = false }: PriceSummaryProps) {
  if (compact) {
    return (
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-3 [&::-webkit-details-marker]:hidden">
          <span>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
              live estimate
            </span>
            <span
              className="mt-0.5 block text-lg font-semibold tracking-tight"
              aria-live="polite"
              aria-atomic="true"
            >
              {formatEstimate(estimate)}
            </span>
          </span>
          <span className="flex items-center gap-2 text-xs font-medium text-muted">
            breakdown
            <span aria-hidden="true" className="text-base transition-transform group-open:rotate-45">
              +
            </span>
          </span>
        </summary>
        <div className="border-t border-line px-6 py-4">
          <PriceLines estimate={estimate} />
        </div>
      </details>
    );
  }

  return (
    <aside aria-label="Estimated price" className="border border-line bg-paper">
      <div className="border-b border-line px-6 py-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          live estimate
        </p>
        <p
          className="mt-2 text-3xl font-semibold tracking-tight"
          aria-live="polite"
          aria-atomic="true"
        >
          {formatEstimate(estimate)}
        </p>
        <p className="mt-2 text-xs text-muted">{estimate.currency} · estimated total</p>
      </div>
      <div className="px-6 py-5">
        <PriceLines estimate={estimate} />
      </div>
    </aside>
  );
}

function PriceLines({ estimate }: { estimate: CommissionEstimate }) {
  return (
    <>
      <ul className="space-y-3 text-xs">
        {estimate.lines.map((line) => (
          <li key={line.id} className="flex items-start justify-between gap-4">
            <span className="min-w-0">
              <span className="block break-words font-medium text-ink [overflow-wrap:anywhere]">
                {line.label}
              </span>
              {line.detail && <span className="mt-0.5 block text-muted">{line.detail}</span>}
            </span>
            <span className="shrink-0 font-medium text-ink">
              <LineAmount
                min={line.min}
                max={line.max}
                currency={estimate.currency}
                isBase={line.id === "type"}
              />
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-5 border-t border-line pt-4 text-[11px] leading-relaxed text-muted">
        {commissionConfig.estimateDisclaimer}
      </p>
    </>
  );
}
