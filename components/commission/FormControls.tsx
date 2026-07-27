"use client";

import {
  type RefObject,
  type ReactNode,
  useEffect,
  useId,
  useRef,
} from "react";

import type { SubmissionField } from "@/components/commission/formTypes";

export function StepHeading({
  eyebrow,
  title,
  description,
  headingRef,
}: {
  eyebrow: string;
  title: string;
  description: string;
  headingRef: RefObject<HTMLHeadingElement | null>;
}) {
  return (
    <div className="mb-9">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
        {eyebrow}
      </p>
      <h2
        id="commission-step-heading"
        ref={headingRef}
        tabIndex={-1}
        className="mt-2 text-3xl font-semibold tracking-tight outline-none md:text-4xl"
      >
        {title}
      </h2>
      <p className="mt-3 max-w-2xl break-words leading-relaxed text-muted">
        {description}
      </p>
    </div>
  );
}

export function OptionCard({
  name,
  value,
  checked,
  onChange,
  title,
  description,
  meta,
  marker,
  compact = false,
}: {
  name: string;
  value: string | number;
  checked: boolean;
  onChange: () => void;
  title: string;
  description?: string;
  meta?: string;
  marker?: string;
  compact?: boolean;
}) {
  return (
    <label
      className={`relative flex min-w-0 cursor-pointer flex-col border transition-colors focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 focus-within:ring-offset-paper ${
        compact ? "min-h-28 p-4" : "min-h-48 p-5"
      } ${
        checked
          ? "border-accent bg-[#f7f0eb]"
          : "border-line bg-paper hover:border-muted"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only peer"
      />
      <span className="flex items-start justify-between gap-4">
        {marker ? (
          <span className="text-xs font-semibold tracking-[0.14em] text-muted">
            {marker}
          </span>
        ) : (
          <span
            aria-hidden="true"
            className={`mt-0.5 size-3 rounded-full border ${
              checked ? "border-accent bg-accent ring-2 ring-accent/15" : "border-muted"
            }`}
          />
        )}
        {meta && <span className="text-xs font-medium text-muted">{meta}</span>}
      </span>
      <span
        className={`${compact ? "mt-4" : "mt-auto"} block break-words text-sm font-semibold`}
      >
        {title}
      </span>
      {description && (
        <span className="mt-1.5 block break-words text-xs leading-relaxed text-muted">
          {description}
        </span>
      )}
    </label>
  );
}

export function OptionSection({
  legend,
  hint,
  error,
  children,
}: {
  legend: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  const descriptionId = useId();
  const hintId = hint ? `${descriptionId}-hint` : undefined;
  const errorId = error ? `${descriptionId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ");

  return (
    <fieldset aria-describedby={describedBy || undefined}>
      <legend className="text-sm font-semibold">{legend}</legend>
      {hint && (
        <p id={hintId} className="mt-1 text-xs text-muted">
          {hint}
        </p>
      )}
      <div className="mt-4">{children}</div>
      {error && (
        <p id={errorId} className="mt-2 text-xs text-accent" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

export function TextField({
  id,
  label,
  value,
  onChange,
  hint,
  error,
  type = "text",
  placeholder,
  autoComplete,
  maxLength,
  minOffsetDays,
  required,
}: {
  id: SubmissionField;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  type?: "text" | "email" | "date";
  placeholder?: string;
  autoComplete?: string;
  maxLength?: number;
  minOffsetDays?: number;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (minOffsetDays === undefined || !inputRef.current) return;
    const now = new Date();
    const minimum = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + minOffsetDays,
      ),
    );
    const year = minimum.getUTCFullYear();
    const month = String(minimum.getUTCMonth() + 1).padStart(2, "0");
    const day = String(minimum.getUTCDate()).padStart(2, "0");
    inputRef.current.min = `${year}-${month}-${day}`;
  }, [minOffsetDays]);

  const describedBy = [hint ? `${id}-hint` : "", error ? `${id}-error` : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
        {required && <span className="ml-1 text-accent" aria-hidden="true">*</span>}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-xs leading-relaxed text-muted">
          {hint}
        </p>
      )}
      <input
        ref={inputRef}
        id={id}
        data-field={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={maxLength}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy || undefined}
        className={`mt-3 w-full border bg-transparent px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted/60 focus:ring-2 focus:ring-accent/15 ${
          error ? "border-accent" : "border-line focus:border-accent"
        }`}
      />
      {error && (
        <p id={`${id}-error`} className="mt-2 text-xs text-accent" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextAreaField({
  id,
  label,
  value,
  onChange,
  hint,
  error,
  placeholder,
  rows,
  maxLength,
  showCount,
  required,
}: {
  id: SubmissionField;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  placeholder?: string;
  rows: number;
  maxLength?: number;
  showCount?: boolean;
  required?: boolean;
}) {
  const describedBy = [
    hint ? `${id}-hint` : "",
    showCount && maxLength ? `${id}-count` : "",
    error ? `${id}-error` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-sm font-semibold">
          {label}
          {required && <span className="ml-1 text-accent" aria-hidden="true">*</span>}
        </label>
        {showCount && maxLength && (
          <span
            id={`${id}-count`}
            className="text-[11px] tabular-nums text-muted"
          >
            {value.length} / {maxLength}
          </span>
        )}
      </div>
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-xs leading-relaxed text-muted">
          {hint}
        </p>
      )}
      <textarea
        id={id}
        data-field={id}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy || undefined}
        className={`mt-3 w-full resize-y border bg-transparent px-4 py-3 text-sm leading-relaxed outline-none transition-colors placeholder:text-muted/60 focus:ring-2 focus:ring-accent/15 ${
          error ? "border-accent" : "border-line focus:border-accent"
        }`}
      />
      {error && (
        <p id={`${id}-error`} className="mt-2 text-xs text-accent" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function SelectField({
  id,
  label,
  hint,
  value,
  onChange,
  error,
  children,
}: {
  id: SubmissionField;
  label: string;
  hint?: string;
  value: string | number;
  onChange: (value: string) => void;
  error?: string;
  children: ReactNode;
}) {
  const describedBy = [hint ? `${id}-hint` : "", error ? `${id}-error` : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-muted">
          {hint}
        </p>
      )}
      <select
        id={id}
        data-field={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy || undefined}
        className={`mt-3 w-full appearance-none border bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-accent/15 ${
          error ? "border-accent" : "border-line focus:border-accent"
        }`}
      >
        {children}
      </select>
      {error && (
        <p id={`${id}-error`} className="mt-2 text-xs text-accent" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function StepActions({
  onBack,
  nextLabel,
  disabled = false,
  backDisabled = false,
}: {
  onBack?: () => void;
  nextLabel: string;
  disabled?: boolean;
  backDisabled?: boolean;
}) {
  return (
    <div
      className={`mt-10 flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row ${
        onBack ? "sm:justify-between" : "sm:justify-end"
      }`}
    >
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          disabled={backDisabled}
          className="px-5 py-3 text-sm font-medium text-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-45"
        >
          ← back
        </button>
      )}
      <button
        type="submit"
        disabled={disabled}
        className="bg-ink px-6 py-3 text-sm font-medium text-paper transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-45"
      >
        {nextLabel} <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}

export function FormStatus({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p
      className="mt-6 break-words border-l-2 border-accent bg-[#f7f0eb] px-4 py-3 text-sm leading-relaxed [overflow-wrap:anywhere]"
      role="status"
      aria-live="polite"
    >
      {message}
    </p>
  );
}

export function ReviewSection({
  title,
  onEdit,
  children,
  editingDisabled = false,
}: {
  title: string;
  onEdit: () => void;
  children: ReactNode;
  editingDisabled?: boolean;
}) {
  return (
    <section className="min-w-0 border border-line p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between border-b border-line pb-4">
        <h3 className="font-semibold">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          disabled={editingDisabled}
          className="text-xs font-medium text-muted underline decoration-line underline-offset-4 transition-colors hover:text-ink hover:decoration-accent disabled:cursor-not-allowed disabled:opacity-45"
        >
          edit
        </button>
      </div>
      {children}
    </section>
  );
}

export function ReviewGrid({ rows }: { rows: Array<[string, string]> }) {
  return (
    <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            {label}
          </dt>
          <dd className="mt-1 break-words text-sm font-medium [overflow-wrap:anywhere]">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
