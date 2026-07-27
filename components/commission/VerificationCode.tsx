"use client";

import {
  type ClipboardEvent,
  type KeyboardEvent,
  useRef,
} from "react";

import { commissionConfig } from "@/data/commissions";

type VerificationCodeProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
};

const CODE_LENGTH = commissionConfig.verification.codeLength;

export function VerificationCode({
  value,
  onChange,
  disabled = false,
  invalid = false,
  describedBy,
}: VerificationCodeProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: CODE_LENGTH }, (_, index) => value[index] ?? "");

  function updateDigit(index: number, rawValue: string) {
    const incoming = rawValue.replace(/\D/g, "");
    if (!incoming) {
      const next = [...digits];
      next[index] = "";
      onChange(next.join("").slice(0, CODE_LENGTH));
      return;
    }

    const next = [...digits];
    incoming
      .slice(0, CODE_LENGTH - index)
      .split("")
      .forEach((digit, offset) => {
        next[index + offset] = digit;
      });
    onChange(next.join("").slice(0, CODE_LENGTH));
    refs.current[Math.min(index + incoming.length, CODE_LENGTH - 1)]?.focus();
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      event.preventDefault();
      const next = [...digits];
      next[index - 1] = "";
      onChange(next.join(""));
      refs.current[index - 1]?.focus();
    } else if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      refs.current[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      event.preventDefault();
      refs.current[index + 1]?.focus();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pasted) return;
    event.preventDefault();
    onChange(pasted);
    refs.current[Math.min(pasted.length, CODE_LENGTH) - 1]?.focus();
  }

  return (
    <div
      className="flex gap-3 sm:gap-4"
      onPaste={handlePaste}
      aria-label="Four-digit verification code"
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            refs.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          pattern="[0-9]*"
          maxLength={index === 0 ? CODE_LENGTH : 1}
          data-field={index === 0 ? "verificationCode" : undefined}
          value={digit}
          onChange={(event) => updateDigit(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onFocus={(event) => event.currentTarget.select()}
          disabled={disabled}
          aria-label={`Digit ${index + 1} of ${CODE_LENGTH}`}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className="size-14 border border-line bg-transparent text-center text-2xl font-semibold outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-50 sm:size-16"
        />
      ))}
    </div>
  );
}
