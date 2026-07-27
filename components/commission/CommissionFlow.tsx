"use client";

import Link from "next/link";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ContactStep,
  DetailsStep,
  TypeStep,
  VerifyStep,
} from "@/components/commission/CommissionSteps";
import { PriceSummary } from "@/components/commission/PriceSummary";
import {
  ReviewStep,
  SuccessStep,
} from "@/components/commission/ReviewSteps";
import type {
  CommissionFormState,
  FieldErrors,
  Step,
  SubmissionField,
} from "@/components/commission/formTypes";
import { commissionConfig } from "@/data/commissions";
import { calculateEstimate } from "@/lib/commission/pricing";
import type {
  ApiErrorResponse,
  CommissionRequestResponse,
  CommissionSubmission,
  ValidationIssue,
  VerificationChallengeResponse,
  VerificationSuccessResponse,
} from "@/lib/commission/types";
import { validateCommissionSubmission } from "@/lib/commission/validation";

const API_BASE = (process.env.NEXT_PUBLIC_COMMISSION_API_URL ?? "").replace(/\/+$/, "");

const interactiveStepLabels = [
  "Type",
  "Details",
  "Contact",
  "Verify",
  "Review",
] as const;

const initialForm: CommissionFormState = {
  commissionType: "character-art",
  intendedUse: "personal",
  complexity: "clean",
  concepts: 1,
  revisions: 1,
  outputFormat: "digital",
  dimensions: "",
  deliveryDate: "",
  commercialUse: false,
  projectDescription: "",
  additionalNotes: "",
  referenceLinks: "",
  email: "",
  discord: "",
  preferredContact: "email",
  otherPlatform: "",
  otherContact: "",
};

const detailFields = new Set<SubmissionField>([
  "intendedUse",
  "complexity",
  "concepts",
  "revisions",
  "outputFormat",
  "dimensions",
  "deliveryDate",
  "commercialUse",
  "projectDescription",
  "additionalNotes",
  "referenceLinks",
]);

const contactFields = new Set<SubmissionField>([
  "email",
  "discord",
  "preferredContact",
  "otherPlatform",
  "otherContact",
]);

function stepForField(field: ValidationIssue["field"]): Step {
  if (field === "commissionType") return 0;
  if (contactFields.has(field as SubmissionField)) return 2;
  return 1;
}

function toSubmission(form: CommissionFormState): CommissionSubmission {
  return {
    ...form,
    referenceLinks: form.referenceLinks
      .split(/\r?\n/)
      .map((link) => link.trim())
      .filter(Boolean),
  };
}

function toFormState(submission: CommissionSubmission): CommissionFormState {
  return {
    ...submission,
    referenceLinks: submission.referenceLinks.join("\n"),
  };
}

function makeErrorMap(issues: ValidationIssue[]): FieldErrors {
  return issues.reduce<FieldErrors>((map, issue) => {
    if (!map[issue.field]) map[issue.field] = issue.message;
    return map;
  }, {});
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function secondsUntil(value: string, now: number) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.ceil((parsed - now) / 1_000)) : 0;
}

function isTerminalVerificationError(code = "") {
  const normalized = code.toLowerCase();
  return [
    "expired",
    "attempt",
    "used",
    "consumed",
    "replaced",
    "challenge_not_found",
    "invalid_challenge",
  ].some((part) => normalized.includes(part));
}

async function apiRequest<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, init);
  const payload = (await response.json().catch(() => null)) as
    | T
    | ApiErrorResponse
    | null;

  if (!response.ok) {
    const apiError = payload as ApiErrorResponse | null;
    const error = new Error(
      apiError?.error?.message || "Something went wrong. Please try again.",
    ) as Error & { api?: ApiErrorResponse["error"]; status?: number };
    error.api = apiError?.error;
    error.status = response.status;
    throw error;
  }

  if (!payload) throw new Error("The server returned an empty response.");
  return payload as T;
}

function createIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `commission-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function CommissionFlow() {
  const [step, setStep] = useState<Step>(0);
  const [form, setForm] = useState<CommissionFormState>(initialForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formMessage, setFormMessage] = useState("");

  const [challenge, setChallenge] = useState<VerificationChallengeResponse | null>(null);
  const [challengeEmail, setChallengeEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [verificationExpiresAt, setVerificationExpiresAt] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [cooldownUntil, setCooldownUntil] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationRetryUntil, setVerificationRetryUntil] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitRetryUntil, setSubmitRetryUntil] = useState("");
  const [clock, setClock] = useState(() => Date.now());
  const [result, setResult] = useState<CommissionRequestResponse | null>(null);
  const idempotencyKey = useRef("");
  const verificationOperation = useRef(0);
  const submissionOperation = useRef(0);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const submission = toSubmission(form);
  const estimate = calculateEstimate(submission);
  const apiUnavailable = !API_BASE;

  const invalidateVerification = useCallback(() => {
    verificationOperation.current += 1;
    setChallenge(null);
    setChallengeEmail("");
    setVerificationCode("");
    setVerificationToken("");
    setVerificationExpiresAt("");
    setVerifiedEmail("");
    setCooldownUntil("");
    setVerificationRetryUntil("");
    setIsSendingCode(false);
    setIsVerifying(false);
  }, []);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }, [step]);

  useEffect(() => {
    const challengeExpiry = Date.parse(challenge?.expiresAt ?? "") || 0;
    const cooldownExpiry = Date.parse(cooldownUntil) || 0;
    const verificationRetryExpiry = Date.parse(verificationRetryUntil) || 0;
    const submitRetryExpiry = Date.parse(submitRetryUntil) || 0;
    const finalTick = Math.max(
      challengeExpiry,
      cooldownExpiry,
      verificationRetryExpiry,
      submitRetryExpiry,
    );
    if (finalTick <= Date.now()) return;

    const timer = window.setInterval(() => {
      const next = Date.now();
      setClock(next);
      if (next >= finalTick) window.clearInterval(timer);
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [
    challenge,
    cooldownUntil,
    submitRetryUntil,
    verificationRetryUntil,
  ]);

  const resendAt = cooldownUntil || challenge?.resendAvailableAt || "";
  const resendSeconds = resendAt ? secondsUntil(resendAt, clock) : 0;
  const expirySeconds = challenge ? secondsUntil(challenge.expiresAt, clock) : 0;
  const verificationRetrySeconds = verificationRetryUntil
    ? secondsUntil(verificationRetryUntil, clock)
    : 0;
  const submitRetrySeconds = submitRetryUntil
    ? secondsUntil(submitRetryUntil, clock)
    : 0;

  function updateField<K extends keyof CommissionFormState>(
    field: K,
    value: CommissionFormState[K],
  ) {
    if (field === "email" && value !== form.email) {
      invalidateVerification();
    }
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
    setFormMessage("");
  }

  function verificationIsCurrent(email: string) {
    const expiry = Date.parse(verificationExpiresAt);
    return (
      Boolean(verificationToken) &&
      verifiedEmail === normalizeEmail(email) &&
      Number.isFinite(expiry) &&
      expiry > Date.now() + 5_000
    );
  }

  function focusField(field: string) {
    window.setTimeout(() => {
      document.querySelector<HTMLElement>(`[data-field="${field}"]`)?.focus();
    }, 0);
  }

  function validateFields(fields: Set<SubmissionField>) {
    const validation = validateCommissionSubmission(submission);
    if (validation.success) {
      setErrors({});
      return true;
    }

    const relevant = validation.issues.filter(
      (issue) => issue.field === "form" || fields.has(issue.field as SubmissionField),
    );
    if (relevant.length === 0) {
      setErrors({});
      return true;
    }

    setErrors(makeErrorMap(relevant));
    setFormMessage("Please check the highlighted fields.");
    focusField(relevant[0].field);
    return false;
  }

  function goToStep(nextStep: Step) {
    submissionOperation.current += 1;
    setIsSubmitting(false);
    setErrors({});
    setFormMessage("");
    setStep(nextStep);
  }

  function handleDetailsNext(event: FormEvent) {
    event.preventDefault();
    if (validateFields(detailFields)) goToStep(2);
  }

  const sendVerificationCode = useCallback(async (email: string) => {
    if (!API_BASE) {
      setFormMessage(
        "Online requests are not connected yet. Please use the contact links on the portfolio for now.",
      );
      return;
    }
    const operation = ++verificationOperation.current;
    setIsSendingCode(true);
    setFormMessage("");
    setErrors((current) => ({ ...current, verificationCode: undefined }));
    try {
      const sent = await apiRequest<VerificationChallengeResponse>(
        "/v1/verification/send",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        },
      );
      if (operation !== verificationOperation.current) return;
      setChallenge(sent);
      setChallengeEmail(email);
      setCooldownUntil(sent.resendAvailableAt);
      setVerificationCode("");
      setClock(Date.now());
      setFormMessage(`A four-digit code was sent to ${email}.`);
    } catch (caught) {
      if (operation !== verificationOperation.current) return;
      const error = caught as Error & { api?: ApiErrorResponse["error"] };
      if (error.api?.retryAfter) {
        setCooldownUntil(
          new Date(Date.now() + error.api.retryAfter * 1_000).toISOString(),
        );
        setClock(Date.now());
      }
      setFormMessage(error.message);
    } finally {
      if (operation === verificationOperation.current) {
        setIsSendingCode(false);
      }
    }
  }, []);

  useEffect(() => {
    if (step !== 4 || !verificationToken || !verificationExpiresAt) return;
    const email = normalizeEmail(form.email);
    if (!email || verifiedEmail !== email) return;

    const remaining = Date.parse(verificationExpiresAt) - Date.now();
    const timer = window.setTimeout(() => {
      invalidateVerification();
      setStep(3);
      setFormMessage("Your email verification expired. A fresh code is on its way.");
      void sendVerificationCode(email);
    }, Math.max(remaining, 0));

    return () => window.clearTimeout(timer);
  }, [
    form.email,
    invalidateVerification,
    sendVerificationCode,
    step,
    verificationExpiresAt,
    verificationToken,
    verifiedEmail,
  ]);

  function handleContactNext(event: FormEvent) {
    event.preventDefault();
    const validated = validateCommissionSubmission(submission);
    if (!validated.success) {
      const first = validated.issues[0];
      setErrors(makeErrorMap(validated.issues));
      setFormMessage("Please check the highlighted fields.");
      setStep(stepForField(first.field));
      focusField(first.field);
      return;
    }

    setForm(toFormState(validated.data));
    const email = validated.data.email;
    if (verificationIsCurrent(email)) {
      goToStep(4);
      return;
    }

    if (verificationToken) invalidateVerification();
    goToStep(3);
    const activeChallenge =
      challenge &&
      challengeEmail === email &&
      secondsUntil(challenge.expiresAt, Date.now()) > 0;
    if (!activeChallenge) void sendVerificationCode(email);
  }

  async function handleVerify(event: FormEvent) {
    event.preventDefault();
    if (verificationCode.length !== commissionConfig.verification.codeLength) {
      setErrors({ verificationCode: "Enter all four digits from the email." });
      focusField("verificationCode");
      return;
    }
    if (!challenge || challengeEmail !== normalizeEmail(form.email)) {
      setErrors({ verificationCode: "Request a new code for this email address." });
      return;
    }
    if (!API_BASE) {
      setFormMessage(
        "Online requests are not connected yet. Please use the contact links on the portfolio for now.",
      );
      return;
    }
    if (verificationRetrySeconds > 0) {
      setErrors({
        verificationCode: `Please wait ${verificationRetrySeconds} seconds before trying again.`,
      });
      return;
    }

    const operation = ++verificationOperation.current;
    setIsVerifying(true);
    setErrors({});
    setFormMessage("");
    try {
      const verified = await apiRequest<VerificationSuccessResponse>(
        "/v1/verification/verify",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: normalizeEmail(form.email),
            challengeId: challenge.challengeId,
            code: verificationCode,
          }),
        },
      );
      if (operation !== verificationOperation.current) return;
      setVerificationToken(verified.verificationToken);
      setVerificationExpiresAt(verified.expiresAt);
      setVerifiedEmail(normalizeEmail(form.email));
      setVerificationRetryUntil("");
      goToStep(4);
    } catch (caught) {
      if (operation !== verificationOperation.current) return;
      const error = caught as Error & { api?: ApiErrorResponse["error"] };
      const retryAfter = error.api?.retryAfter;
      if (retryAfter) {
        setVerificationRetryUntil(
          new Date(Date.now() + retryAfter * 1_000).toISOString(),
        );
        setClock(Date.now());
      }
      if (isTerminalVerificationError(error.api?.code)) {
        setChallenge(null);
        setChallengeEmail("");
      }
      setErrors({
        verificationCode: isTerminalVerificationError(error.api?.code)
          ? `${error.message} Send a new code to continue.`
          : error.message,
      });
      setVerificationCode("");
      focusField("verificationCode");
    } finally {
      if (operation === verificationOperation.current) {
        setIsVerifying(false);
      }
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const validated = validateCommissionSubmission(submission);
    if (!validated.success) {
      const first = validated.issues[0];
      setErrors(makeErrorMap(validated.issues));
      setFormMessage("Some details need another look before this can be sent.");
      setStep(stepForField(first.field));
      focusField(first.field);
      return;
    }

    if (!verificationIsCurrent(validated.data.email)) {
      const hadVerification = Boolean(verificationToken);
      invalidateVerification();
      setStep(3);
      setFormMessage(
        hadVerification
          ? "Your email verification expired. A fresh code is on its way."
          : "Please verify this email address before submitting.",
      );
      void sendVerificationCode(validated.data.email);
      return;
    }
    if (!API_BASE) {
      setFormMessage(
        "Online requests are not connected yet. Please use the contact links on the portfolio for now.",
      );
      return;
    }
    if (submitRetrySeconds > 0) {
      setFormMessage(`Please wait ${submitRetrySeconds} seconds before trying again.`);
      return;
    }

    if (!idempotencyKey.current) {
      idempotencyKey.current = createIdempotencyKey();
    }
    const operation = ++submissionOperation.current;
    setIsSubmitting(true);
    setFormMessage("");
    try {
      const created = await apiRequest<CommissionRequestResponse>(
        "/v1/commissions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": idempotencyKey.current,
          },
          body: JSON.stringify({
            submission: validated.data,
            verificationToken,
          }),
        },
      );
      if (operation !== submissionOperation.current) return;
      setResult(created);
      setStep(5);
    } catch (caught) {
      if (operation !== submissionOperation.current) return;
      const error = caught as Error & { api?: ApiErrorResponse["error"] };
      const issues = error.api?.issues;
      const code = error.api?.code.toLowerCase() ?? "";
      let message = error.message;
      if (error.api?.retryAfter) {
        setSubmitRetryUntil(
          new Date(Date.now() + error.api.retryAfter * 1_000).toISOString(),
        );
        setClock(Date.now());
        message = `${message} Try again in ${error.api.retryAfter} seconds.`;
      }
      if (issues?.length) {
        const first = issues[0];
        idempotencyKey.current = "";
        setErrors(makeErrorMap(issues));
        setStep(stepForField(first.field));
        focusField(first.field);
      } else if (code.includes("verification")) {
        idempotencyKey.current = "";
        invalidateVerification();
        setStep(3);
        message = `${error.message} A fresh verification code is on its way.`;
        void sendVerificationCode(validated.data.email);
      } else if (code.includes("idempotency")) {
        if (
          code.includes("conflict") ||
          code.includes("mismatch") ||
          code.includes("invalid")
        ) {
          idempotencyKey.current = "";
        }
      }
      setFormMessage(message);
    } finally {
      if (operation === submissionOperation.current) {
        setIsSubmitting(false);
      }
    }
  }

  function restart() {
    setForm(initialForm);
    setErrors({});
    setFormMessage("");
    invalidateVerification();
    submissionOperation.current += 1;
    setIsSubmitting(false);
    setResult(null);
    setSubmitRetryUntil("");
    idempotencyKey.current = "";
    setStep(0);
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <CommissionHeader />

      <main>
        <div className="border-b border-line">
          <div className="mx-auto w-full max-w-[1160px] px-6 py-10 md:py-14">
            <div className="flex items-end justify-between gap-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                  commission studio
                </p>
                <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
                  Let&apos;s make something that feels like yours.
                </h1>
                <p className="mt-4 max-w-2xl leading-relaxed text-muted">
                  Shape the brief one step at a time. You&apos;ll get a live estimate
                  before sending anything.
                </p>
              </div>
              <span
                aria-hidden="true"
                className="hidden select-none text-8xl font-semibold leading-none tracking-[-0.08em] text-line lg:block"
              >
                01
              </span>
            </div>
          </div>
        </div>

        {step < 5 && <Progress currentStep={step} />}

        {apiUnavailable && step < 5 && (
          <div className="border-b border-line bg-[#f4eee8]" role="status">
            <div className="mx-auto flex w-full max-w-[1160px] flex-col gap-2 px-6 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span>
                Online sending is not connected yet. You can still explore every option and
                calculate an estimate.
              </span>
              <Link
                href="/#links"
                className="shrink-0 font-medium underline decoration-accent underline-offset-4"
              >
                contact another way
              </Link>
            </div>
          </div>
        )}

        {step < 5 && (
          <div className="sticky top-16 z-30 border-b border-line bg-paper/95 backdrop-blur-sm lg:hidden">
            <PriceSummary estimate={estimate} compact />
          </div>
        )}

        <div className="mx-auto grid w-full max-w-[1160px] grid-cols-1 gap-12 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16 lg:py-16">
          <section
            key={step}
            aria-labelledby="commission-step-heading"
            className="min-w-0 motion-safe:animate-[page-fade_.25s_ease]"
          >
            {step === 0 && (
              <TypeStep
                headingRef={headingRef}
                value={form.commissionType}
                onChange={(value) => updateField("commissionType", value)}
                onNext={() => goToStep(1)}
              />
            )}
            {step === 1 && (
              <DetailsStep
                headingRef={headingRef}
                form={form}
                errors={errors}
                formMessage={formMessage}
                onChange={updateField}
                onBack={() => goToStep(0)}
                onNext={handleDetailsNext}
              />
            )}
            {step === 2 && (
              <ContactStep
                headingRef={headingRef}
                form={form}
                errors={errors}
                formMessage={formMessage}
                isSending={isSendingCode}
                apiUnavailable={apiUnavailable}
                onChange={updateField}
                onBack={() => goToStep(1)}
                onNext={handleContactNext}
              />
            )}
            {step === 3 && (
              <VerifyStep
                headingRef={headingRef}
                email={normalizeEmail(form.email)}
                code={verificationCode}
                challenge={challenge}
                isSending={isSendingCode}
                isVerifying={isVerifying}
                resendSeconds={resendSeconds}
                expirySeconds={expirySeconds}
                retrySeconds={verificationRetrySeconds}
                message={formMessage}
                error={errors.verificationCode}
                apiUnavailable={apiUnavailable}
                onCodeChange={(value) => {
                  setVerificationCode(value);
                  setErrors((current) => ({
                    ...current,
                    verificationCode: undefined,
                  }));
                }}
                onResend={() => void sendVerificationCode(normalizeEmail(form.email))}
                onBack={() => goToStep(2)}
                onVerify={handleVerify}
              />
            )}
            {step === 4 && (
              <ReviewStep
                headingRef={headingRef}
                submission={submission}
                estimate={estimate}
                formMessage={formMessage}
                isSubmitting={isSubmitting}
                retrySeconds={submitRetrySeconds}
                apiUnavailable={apiUnavailable}
                onEdit={goToStep}
                onBack={() => goToStep(2)}
                onSubmit={handleSubmit}
              />
            )}
            {step === 5 && result && (
              <SuccessStep
                headingRef={headingRef}
                result={result}
                onRestart={restart}
              />
            )}
          </section>

          {step < 5 && (
            <div className="hidden lg:block">
              <div className="sticky top-24">
                <PriceSummary estimate={estimate} />
                <p className="mt-4 text-xs leading-relaxed text-muted">
                  No payment is taken here. After reviewing your request, I&apos;ll get
                  back to you with timing and a final quote.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-[1160px] flex-col gap-2 px-6 py-8 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>sheepex_ · commission requests</span>
          <Link href="/" className="transition-colors hover:text-ink">
            back to portfolio
          </Link>
        </div>
      </footer>
    </div>
  );
}

function CommissionHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full max-w-[1160px] items-center justify-between px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          sheepex_
        </Link>
        <Link
          href="/"
          className="group flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink"
        >
          <span aria-hidden="true" className="transition-transform group-hover:-translate-x-1">
            ←
          </span>
          portfolio
        </Link>
      </div>
    </header>
  );
}

function Progress({ currentStep }: { currentStep: number }) {
  return (
    <nav aria-label="Commission request progress" className="border-b border-line">
      <div className="mx-auto w-full max-w-[1160px] px-6">
        <div className="h-px bg-line">
          <div
            className="h-px bg-accent transition-[width] duration-300 motion-reduce:transition-none"
            style={{
              width: `${((currentStep + 1) / interactiveStepLabels.length) * 100}%`,
            }}
          />
        </div>
        <ol className="grid grid-cols-5">
          {interactiveStepLabels.map((label, index) => {
            const active = index === currentStep;
            const complete = index < currentStep;
            return (
              <li
                key={label}
                aria-current={active ? "step" : undefined}
                className={`py-4 text-center text-[10px] font-semibold uppercase tracking-[0.14em] sm:text-xs ${
                  active ? "text-ink" : complete ? "text-accent" : "text-muted"
                }`}
              >
                <span className="sm:hidden">
                  <span aria-hidden="true">{index + 1}</span>
                  <span className="sr-only">
                    Step {index + 1}: {label}
                    {active ? ", current step" : complete ? ", completed" : ""}
                  </span>
                </span>
                <span className="hidden sm:inline">
                  {complete ? "✓ " : `${index + 1}. `}
                  {label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
