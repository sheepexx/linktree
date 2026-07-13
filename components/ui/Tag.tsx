import type { ReactNode } from "react";

type TagProps = {
  children: ReactNode;
  tone?: "default" | "accent" | "signal" | "warning";
};

const toneClasses = {
  default: "border-[var(--line)] bg-[var(--panel-soft)] text-[var(--muted)]",
  accent: "border-[var(--accent-soft)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent)]",
  signal: "border-[var(--signal-soft)] bg-[color-mix(in_srgb,var(--signal)_9%,transparent)] text-[var(--signal)]",
  warning: "border-[color-mix(in_srgb,var(--warning)_50%,var(--line))] bg-[color-mix(in_srgb,var(--warning)_8%,transparent)] text-[var(--warning)]",
};

export function Tag({ children, tone = "default" }: TagProps) {
  return (
    <span className={`inline-flex min-h-6 items-center border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}
