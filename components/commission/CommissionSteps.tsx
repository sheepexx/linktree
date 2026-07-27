"use client";

import Link from "next/link";
import type { FormEvent, RefObject } from "react";

import {
  FormStatus,
  OptionCard,
  OptionSection,
  SelectField,
  StepActions,
  StepHeading,
  TextAreaField,
  TextField,
} from "@/components/commission/FormControls";
import type {
  CommissionFormState,
  FieldErrors,
  FormChangeHandler,
} from "@/components/commission/formTypes";
import { VerificationCode } from "@/components/commission/VerificationCode";
import {
  commissionConfig,
  type CommissionTypeId,
  type ConceptCount,
  type RevisionCount,
} from "@/data/commissions";
import { formatPrice } from "@/lib/commission/pricing";
import type { VerificationChallengeResponse } from "@/lib/commission/types";

type SharedStepProps = {
  headingRef: RefObject<HTMLHeadingElement | null>;
};

export function TypeStep({
  value,
  onChange,
  onNext,
  headingRef,
}: SharedStepProps & {
  value: CommissionTypeId;
  onChange: (value: CommissionTypeId) => void;
  onNext: () => void;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onNext();
      }}
    >
      <StepHeading
        eyebrow="01 / Start here"
        title="What are we making?"
        description="Pick the closest starting point. If your idea sits between categories, choose Custom request and describe it in the next step."
        headingRef={headingRef}
      />
      <fieldset>
        <legend className="sr-only">Commission type</legend>
        <div className="space-y-9">
          {commissionConfig.commissionGroups.map((group) => {
            const options = commissionConfig.commissionTypes.filter(
              (option) => option.group === group.id,
            );

            return (
              <section key={group.id} aria-labelledby={`commission-group-${group.id}`}>
                <h3
                  id={`commission-group-${group.id}`}
                  className="text-sm font-semibold"
                >
                  {group.label}
                </h3>
                <p className="mt-1 text-xs text-muted">{group.description}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {options.map((option) => {
                    const index = commissionConfig.commissionTypes.findIndex(
                      (entry) => entry.id === option.id,
                    );

                    return (
                      <OptionCard
                        key={option.id}
                        name="commissionType"
                        value={option.id}
                        checked={value === option.id}
                        onChange={() => onChange(option.id)}
                        title={option.label}
                        description={option.description}
                        meta={`from ${formatPrice(option.price.min)}`}
                        marker={String(index + 1).padStart(2, "0")}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </fieldset>
      <StepActions nextLabel="shape the details" />
    </form>
  );
}

export function DetailsStep({
  form,
  errors,
  formMessage,
  headingRef,
  onChange,
  onBack,
  onNext,
}: SharedStepProps & {
  form: CommissionFormState;
  errors: FieldErrors;
  formMessage: string;
  onChange: FormChangeHandler;
  onBack: () => void;
  onNext: (event: FormEvent) => void;
}) {
  return (
    <form onSubmit={onNext} noValidate>
      <StepHeading
        eyebrow="02 / The brief"
        title="Give the idea some shape."
        description="A little context goes a long way. These choices set the estimate; the written brief helps me understand the direction."
        headingRef={headingRef}
      />

      <div className="space-y-10">
        <OptionSection
          legend="What is it for?"
          hint="This helps set the usage scope."
          error={errors.intendedUse}
        >
          <div className="grid gap-3 sm:grid-cols-3" data-field="intendedUse" tabIndex={-1}>
            {commissionConfig.intendedUses.map((option) => (
              <OptionCard
                key={option.id}
                name="intendedUse"
                value={option.id}
                checked={form.intendedUse === option.id}
                onChange={() => onChange("intendedUse", option.id)}
                title={option.label}
                description={option.description}
                compact
              />
            ))}
          </div>
        </OptionSection>

        <OptionSection
          legend="How worked should it feel?"
          hint="Choose the visual density you have in mind."
          error={errors.complexity}
        >
          <div className="grid gap-3 sm:grid-cols-3" data-field="complexity" tabIndex={-1}>
            {commissionConfig.complexities.map((option) => (
              <OptionCard
                key={option.id}
                name="complexity"
                value={option.id}
                checked={form.complexity === option.id}
                onChange={() => onChange("complexity", option.id)}
                title={option.label}
                description={option.description}
                compact
              />
            ))}
          </div>
        </OptionSection>

        <div className="grid gap-6 sm:grid-cols-2">
          <SelectField
            id="concepts"
            label="Concept directions"
            hint="Distinct ideas to choose from."
            value={form.concepts}
            error={errors.concepts}
            onChange={(value) => onChange("concepts", Number(value) as ConceptCount)}
          >
            {commissionConfig.conceptOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </SelectField>
          <SelectField
            id="revisions"
            label="Revision rounds"
            hint="A round can include a grouped set of notes."
            value={form.revisions}
            error={errors.revisions}
            onChange={(value) => onChange("revisions", Number(value) as RevisionCount)}
          >
            {commissionConfig.revisionOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </SelectField>
        </div>

        <OptionSection
          legend="Final delivery"
          hint="Choose the most useful file format."
          error={errors.outputFormat}
        >
          <div className="grid gap-3 sm:grid-cols-2" data-field="outputFormat" tabIndex={-1}>
            {commissionConfig.outputFormats.map((option) => (
              <OptionCard
                key={option.id}
                name="outputFormat"
                value={option.id}
                checked={form.outputFormat === option.id}
                onChange={() => onChange("outputFormat", option.id)}
                title={option.label}
                description={option.description}
                compact
              />
            ))}
          </div>
        </OptionSection>

        {form.commissionType === "banner" && (
          <OptionSection
            legend="Banner size preset"
            hint="Choose a platform preset, then adjust the size below if needed."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {commissionConfig.bannerPresets.map((preset) => {
                const selected = form.dimensions === preset.dimensions;

                return (
                  <button
                    key={preset.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onChange("dimensions", preset.dimensions)}
                    className={`min-h-28 border p-4 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-paper ${
                      selected
                        ? "border-accent bg-[#f7f0eb]"
                        : "border-line hover:border-muted"
                    }`}
                  >
                    <span className="block text-sm font-semibold">
                      {preset.label}
                    </span>
                    <span className="mt-1 block text-xs font-medium text-accent">
                      {preset.dimensions}
                    </span>
                    <span className="mt-2 block text-xs leading-relaxed text-muted">
                      {preset.note}
                    </span>
                  </button>
                );
              })}
            </div>
          </OptionSection>
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          <TextField
            id="dimensions"
            label="Size or dimensions"
            hint="Pixels, aspect ratio, or print size."
            placeholder="e.g. 3000 × 3000 px"
            value={form.dimensions}
            maxLength={commissionConfig.limits.dimensions.max}
            error={errors.dimensions}
            onChange={(value) => onChange("dimensions", value)}
            required
          />
          <TextField
            id="deliveryDate"
            label="Preferred delivery date"
            hint="Optional. Leave blank if timing is flexible."
            type="date"
            minOffsetDays={commissionConfig.rushPricing.at(-1)!.minDays}
            value={form.deliveryDate}
            error={errors.deliveryDate}
            onChange={(value) => onChange("deliveryDate", value)}
          />
        </div>

        <label
          data-field="commercialUse"
          className={`flex cursor-pointer items-start gap-4 border p-5 transition-colors ${
            form.commercialUse ? "border-accent bg-[#f7f0eb]" : "border-line hover:border-muted"
          }`}
        >
          <input
            type="checkbox"
            checked={form.commercialUse}
            onChange={(event) => onChange("commercialUse", event.target.checked)}
            className="mt-0.5 size-4 accent-[#a55233]"
          />
          <span>
            <span className="block text-sm font-semibold">
              {commissionConfig.commercialUse.label}
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-muted">
              {commissionConfig.commercialUse.description} Adds{" "}
              {commissionConfig.commercialUse.percentage}% to the subtotal.
            </span>
          </span>
        </label>

        <TextAreaField
          id="projectDescription"
          label="Tell me about the project"
          hint={
            form.commissionType === "character-art"
              ? `Start by saying whether you want character art, fanart, or VTuber art. Then include the subject, mood, colors, and must-have elements. ${commissionConfig.limits.projectDescription.min} character minimum.`
              : `What should it communicate? Include the subject, mood, colors, text, or must-have elements. ${commissionConfig.limits.projectDescription.min} character minimum.`
          }
          placeholder="The artwork is for… I want it to feel… Please include…"
          rows={7}
          value={form.projectDescription}
          maxLength={commissionConfig.limits.projectDescription.max}
          error={errors.projectDescription}
          showCount
          onChange={(value) => onChange("projectDescription", value)}
          required
        />

        <TextAreaField
          id="referenceLinks"
          label="Reference links"
          hint={`Optional. Add one public http(s) link per line, up to ${commissionConfig.limits.referenceLinks}.`}
          placeholder={"https://…\nhttps://…"}
          rows={4}
          value={form.referenceLinks}
          error={errors.referenceLinks}
          onChange={(value) => onChange("referenceLinks", value)}
        />

        <TextAreaField
          id="additionalNotes"
          label="Anything else?"
          hint="Optional constraints, context, or things to avoid."
          placeholder="A few final notes…"
          rows={4}
          value={form.additionalNotes}
          maxLength={commissionConfig.limits.additionalNotes}
          error={errors.additionalNotes}
          showCount
          onChange={(value) => onChange("additionalNotes", value)}
        />
      </div>

      <FormStatus message={formMessage} />
      <StepActions onBack={onBack} nextLabel="add contact details" />
    </form>
  );
}

export function ContactStep({
  form,
  errors,
  formMessage,
  isSending,
  apiUnavailable,
  headingRef,
  onChange,
  onBack,
  onNext,
}: SharedStepProps & {
  form: CommissionFormState;
  errors: FieldErrors;
  formMessage: string;
  isSending: boolean;
  apiUnavailable: boolean;
  onChange: FormChangeHandler;
  onBack: () => void;
  onNext: (event: FormEvent) => void;
}) {
  return (
    <form onSubmit={onNext} noValidate>
      <StepHeading
        eyebrow="03 / Stay in touch"
        title="Where should I reply?"
        description="Email is the only required personal detail. You can also add the social handle you check most often."
        headingRef={headingRef}
      />

      <div className="space-y-8">
        <TextField
          id="email"
          label="Email address"
          hint="Used for verification and your request confirmation."
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          error={errors.email}
          onChange={(value) => onChange("email", value)}
          required
        />

        <TextField
          id="discord"
          label="Discord username"
          hint="Optional, unless you choose Discord as your preferred contact."
          autoComplete="off"
          placeholder="yourname"
          value={form.discord}
          maxLength={commissionConfig.limits.discord}
          error={errors.discord}
          onChange={(value) => onChange("discord", value)}
        />

        <OptionSection
          legend="Preferred contact"
          hint="Where should I follow up after reviewing the request?"
          error={errors.preferredContact}
        >
          <div
            className="grid grid-cols-1 gap-3 sm:grid-cols-3"
            data-field="preferredContact"
            tabIndex={-1}
          >
            {(["email", "discord", "other"] as const).map((contact) => (
              <OptionCard
                key={contact}
                name="preferredContact"
                value={contact}
                checked={form.preferredContact === contact}
                onChange={() => {
                  onChange("preferredContact", contact);
                  if (contact !== "other") {
                    onChange("otherPlatform", "");
                    onChange("otherContact", "");
                  }
                }}
                title={
                  contact === "email"
                    ? "Email"
                    : contact === "discord"
                      ? "Discord"
                      : "Other"
                }
                compact
              />
            ))}
          </div>
        </OptionSection>

        {form.preferredContact === "other" && (
          <div className="grid gap-6 border-l-2 border-accent pl-5 sm:grid-cols-2">
            <TextField
              id="otherPlatform"
              label="Platform"
              placeholder="e.g. Instagram"
              value={form.otherPlatform}
              maxLength={commissionConfig.limits.otherPlatform}
              error={errors.otherPlatform}
              onChange={(value) => onChange("otherPlatform", value)}
            />
            <TextField
              id="otherContact"
              label="Username or profile link"
              placeholder="@yourname"
              value={form.otherContact}
              maxLength={commissionConfig.limits.otherContact}
              error={errors.otherContact}
              onChange={(value) => onChange("otherContact", value)}
            />
          </div>
        )}
      </div>

      <div className="mt-8 border border-line bg-[#f7f4ef] p-5 text-sm leading-relaxed text-muted">
        <span className="font-medium text-ink">Next: a quick email check.</span>{" "}
        I&apos;ll send a four-digit code that expires in{" "}
        {commissionConfig.verification.expiresInMinutes} minutes. No account needed.
      </div>
      <FormStatus message={formMessage} />
      <StepActions
        onBack={onBack}
        nextLabel={
          apiUnavailable
            ? "continue to verification"
            : isSending
              ? "sending code…"
              : "send verification code"
        }
        disabled={isSending}
      />
    </form>
  );
}

export function VerifyStep({
  email,
  code,
  challenge,
  isSending,
  isVerifying,
  resendSeconds,
  expirySeconds,
  retrySeconds,
  message,
  error,
  apiUnavailable,
  headingRef,
  onCodeChange,
  onResend,
  onBack,
  onVerify,
}: SharedStepProps & {
  email: string;
  code: string;
  challenge: VerificationChallengeResponse | null;
  isSending: boolean;
  isVerifying: boolean;
  resendSeconds: number;
  expirySeconds: number;
  retrySeconds: number;
  message: string;
  error?: string;
  apiUnavailable: boolean;
  onCodeChange: (value: string) => void;
  onResend: () => void;
  onBack: () => void;
  onVerify: (event: FormEvent) => void;
}) {
  const expired = Boolean(challenge) && expirySeconds === 0;

  return (
    <form onSubmit={onVerify} noValidate>
      <StepHeading
        eyebrow="04 / Email check"
        title="Check your inbox."
        description={`Enter the four-digit code sent to ${email || "your email address"}. It may take a minute to arrive.`}
        headingRef={headingRef}
      />

      {apiUnavailable ? (
        <div className="border border-accent/30 bg-[#f7f0eb] p-6">
          <p className="font-semibold">Online requests are not connected yet.</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Email verification needs the commission API before requests can be sent.
            You can keep your estimate and reach out through one of the portfolio
            contact links in the meantime.
          </p>
          <Link
            href="/#links"
            className="mt-5 inline-block text-sm font-semibold underline decoration-accent decoration-2 underline-offset-4"
          >
            open contact links
          </Link>
        </div>
      ) : (
        <>
          <VerificationCode
            value={code}
            onChange={onCodeChange}
            disabled={isVerifying || !challenge || expired}
            invalid={Boolean(error)}
            describedBy={error ? "verification-code-error" : undefined}
          />
          {error && (
            <p
              id="verification-code-error"
              className="mt-3 break-words text-sm text-accent [overflow-wrap:anywhere]"
              role="alert"
            >
              {error}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            {challenge && !expired ? (
              <span className="text-muted">
                Code expires in{" "}
                <span className="font-medium tabular-nums text-ink">
                  {timeLabel(expirySeconds)}
                </span>
              </span>
            ) : challenge ? (
              <span className="font-medium text-accent">That code has expired.</span>
            ) : (
              <span className="text-muted">
                {isSending ? "Sending your code…" : "No active code yet."}
              </span>
            )}
            <span aria-hidden="true" className="hidden text-line sm:inline">
              /
            </span>
            <button
              type="button"
              onClick={onResend}
              disabled={isSending || resendSeconds > 0}
              className="font-medium underline decoration-line underline-offset-4 transition-colors hover:decoration-accent disabled:cursor-not-allowed disabled:no-underline disabled:opacity-60"
            >
              {isSending
                ? "sending…"
                : resendSeconds > 0
                  ? `resend in ${resendSeconds}s`
                  : expired
                    ? "send a new code"
                    : "resend code"}
            </button>
          </div>

          <FormStatus message={message} />
        </>
      )}

      <StepActions
        onBack={onBack}
        nextLabel={
          isVerifying
            ? "checking code…"
            : retrySeconds > 0
              ? `try again in ${retrySeconds}s`
              : "verify & review"
        }
        disabled={
          apiUnavailable ||
          isVerifying ||
          retrySeconds > 0 ||
          !challenge ||
          expired ||
          code.length !== commissionConfig.verification.codeLength
        }
        backDisabled={isSending || isVerifying}
      />
    </form>
  );
}

function timeLabel(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}
