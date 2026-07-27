"use client";

import Link from "next/link";
import type { FormEvent, RefObject } from "react";

import {
  FormStatus,
  ReviewGrid,
  ReviewSection,
  StepActions,
  StepHeading,
} from "@/components/commission/FormControls";
import type { Step } from "@/components/commission/formTypes";
import { commissionConfig } from "@/data/commissions";
import {
  formatEstimate,
  formatPrice,
} from "@/lib/commission/pricing";
import type {
  CommissionEstimate,
  CommissionRequestResponse,
  CommissionSubmission,
} from "@/lib/commission/types";

export function ReviewStep({
  submission,
  estimate,
  formMessage,
  isSubmitting,
  retrySeconds,
  apiUnavailable,
  headingRef,
  onEdit,
  onBack,
  onSubmit,
}: {
  submission: CommissionSubmission;
  estimate: CommissionEstimate;
  formMessage: string;
  isSubmitting: boolean;
  retrySeconds: number;
  apiUnavailable: boolean;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onEdit: (step: Step) => void;
  onBack: () => void;
  onSubmit: (event: FormEvent) => void;
}) {
  const contactLabel =
    submission.preferredContact === "email"
      ? submission.email
      : submission.preferredContact === "discord"
        ? submission.discord
        : `${submission.otherPlatform}: ${submission.otherContact}`;

  return (
    <form onSubmit={onSubmit}>
      <StepHeading
        eyebrow="05 / Final check"
        title="Ready when you are."
        description="Review the brief below. Sending this request does not commit you to a purchase, and no payment is taken."
        headingRef={headingRef}
      />

      <div className="space-y-4">
        <ReviewSection
          title="Commission"
          onEdit={() => onEdit(0)}
          editingDisabled={isSubmitting}
        >
          <ReviewGrid
            rows={[
              [
                "Type",
                optionLabel(
                  commissionConfig.commissionTypes,
                  submission.commissionType,
                ),
              ],
            ]}
          />
        </ReviewSection>

        <ReviewSection
          title="Project details"
          onEdit={() => onEdit(1)}
          editingDisabled={isSubmitting}
        >
          <ReviewGrid
            rows={[
              [
                "Use",
                optionLabel(commissionConfig.intendedUses, submission.intendedUse),
              ],
              [
                "Complexity",
                optionLabel(commissionConfig.complexities, submission.complexity),
              ],
              [
                "Delivery",
                optionLabel(commissionConfig.outputFormats, submission.outputFormat),
              ],
              ["Concepts", `${submission.concepts}`],
              ["Revisions", `${submission.revisions}`],
              ["Dimensions", submission.dimensions],
              ["Preferred date", friendlyDate(submission.deliveryDate)],
              ["Commercial use", submission.commercialUse ? "Yes" : "No"],
            ]}
          />
          <div className="mt-5 border-t border-line pt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Brief
            </p>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed [overflow-wrap:anywhere]">
              {submission.projectDescription}
            </p>
          </div>
          {submission.referenceLinks.length > 0 && (
            <div className="mt-5 border-t border-line pt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                References
              </p>
              <ul className="mt-2 space-y-1">
                {submission.referenceLinks.map((link) => (
                  <li key={link} className="min-w-0">
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-sm underline decoration-line underline-offset-4 hover:decoration-accent"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {submission.additionalNotes && (
            <div className="mt-5 border-t border-line pt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Additional notes
              </p>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed [overflow-wrap:anywhere]">
                {submission.additionalNotes}
              </p>
            </div>
          )}
        </ReviewSection>

        <ReviewSection
          title="Contact"
          onEdit={() => onEdit(2)}
          editingDisabled={isSubmitting}
        >
          <ReviewGrid
            rows={[
              ["Email", submission.email],
              ["Preferred reply", contactLabel],
            ]}
          />
          <p className="mt-4 flex items-center gap-2 text-xs font-medium text-[#486f4e]">
            <span
              aria-hidden="true"
              className="flex size-5 items-center justify-center rounded-full bg-[#e6efe5]"
            >
              ✓
            </span>
            Email verified
          </p>
        </ReviewSection>

        <div className="border border-ink bg-ink p-6 text-paper">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-paper/60">
                estimated total
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">
                {formatEstimate(estimate)}
              </p>
            </div>
            <span className="text-xs text-paper/60">{estimate.currency}</span>
          </div>
          <ul className="mt-5 space-y-2 border-t border-paper/15 pt-5 text-xs">
            {estimate.lines.map((line) => (
              <li key={line.id} className="flex justify-between gap-4">
                <span className="text-paper/70">{line.label}</span>
                <span>
                  {line.min === 0 && line.max === 0
                    ? "included"
                    : line.min === line.max
                      ? `${line.id === "type" ? "" : "+"}${formatPrice(line.min)}`
                      : `${line.id === "type" ? "" : "+"}${formatPrice(line.min)}–${formatPrice(line.max)}`}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[11px] leading-relaxed text-paper/60">
            {commissionConfig.estimateDisclaimer}
          </p>
        </div>
      </div>

      <FormStatus message={formMessage} />
      <StepActions
        onBack={onBack}
        nextLabel={
          apiUnavailable
            ? "sending unavailable"
            : isSubmitting
              ? "sending request…"
              : retrySeconds > 0
                ? `try again in ${retrySeconds}s`
              : "send commission request"
        }
        disabled={isSubmitting || apiUnavailable || retrySeconds > 0}
        backDisabled={isSubmitting}
      />
      <p className="mt-4 text-center text-xs leading-relaxed text-muted">
        By sending, you confirm the brief is accurate and agree to be contacted about
        this request.
      </p>
    </form>
  );
}

export function SuccessStep({
  result,
  onRestart,
  headingRef,
}: {
  result: CommissionRequestResponse;
  onRestart: () => void;
  headingRef: RefObject<HTMLHeadingElement | null>;
}) {
  return (
    <div className="mx-auto max-w-2xl py-2 lg:col-span-2">
      <div className="flex size-14 items-center justify-center rounded-full bg-[#e6efe5] text-xl text-[#486f4e]">
        ✓
      </div>
      <p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
        Request received
      </p>
      <h2
        id="commission-step-heading"
        ref={headingRef}
        tabIndex={-1}
        className="mt-2 text-4xl font-semibold tracking-tight outline-none md:text-5xl"
      >
        Your idea is in the queue.
      </h2>
      <p className="mt-4 max-w-xl break-words leading-relaxed text-muted [overflow-wrap:anywhere]">
        {result.confirmationPending ? (
          <>
            Thanks for the thoughtful brief. {commissionConfig.responseTime} Your request
            is safely recorded, though the confirmation email is taking a little longer
            than usual.
          </>
        ) : (
          <>
            Thanks for the thoughtful brief. {commissionConfig.responseTime} A confirmation
            has been sent to {result.summary.email}.
          </>
        )}
      </p>

      <div className="mt-10 border border-line">
        <div className="flex flex-col gap-4 border-b border-line bg-[#f7f4ef] p-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted">
              request ID
            </p>
            <p className="mt-2 break-all text-xl font-semibold tracking-tight">
              {result.requestId}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs text-muted">estimated total</p>
            <p className="mt-1 text-xl font-semibold">
              {formatEstimate(result.estimate)}
            </p>
          </div>
        </div>
        <div className="grid gap-px bg-line sm:grid-cols-3">
          <SuccessDatum
            label="Commission"
            value={optionLabel(
              commissionConfig.commissionTypes,
              result.summary.commissionType,
            )}
          />
          <SuccessDatum
            label="Delivery"
            value={friendlyDate(result.summary.deliveryDate)}
          />
          <SuccessDatum
            label="Submitted"
            value={new Intl.DateTimeFormat("en-US", {
              dateStyle: "medium",
            }).format(new Date(result.submittedAt))}
          />
        </div>
      </div>

      {result.confirmationPending && (
        <p className="mt-5 border-l-2 border-accent pl-4 text-sm leading-relaxed text-muted">
          Your request is safely recorded, but the confirmation email is delayed. Keep
          the request ID above for reference.
        </p>
      )}

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="bg-ink px-6 py-3 text-center text-sm font-medium text-paper transition-opacity hover:opacity-80"
        >
          return to portfolio
        </Link>
        <button
          type="button"
          onClick={onRestart}
          className="border border-line px-6 py-3 text-sm font-medium transition-colors hover:border-ink"
        >
          start another request
        </button>
      </div>
    </div>
  );
}

function SuccessDatum({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-paper p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium">{value}</p>
    </div>
  );
}

function optionLabel<T extends string | number>(
  options: readonly { id: T; label: string }[],
  value: T,
) {
  return options.find((option) => option.id === value)?.label ?? String(value);
}

function friendlyDate(value: string) {
  if (!value) return "Flexible";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}
