import type { ButtonHTMLAttributes, ReactNode } from "react";

type PixelButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  active?: boolean;
};

export function PixelButton({ children, active = false, className = "", ...props }: PixelButtonProps) {
  return (
    <button
      type="button"
      data-active={active || undefined}
      aria-pressed={active}
      className={`min-h-10 border px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] transition-[background-color,border-color,color,transform] hover:-translate-y-px data-[active]:border-[var(--accent)] data-[active]:bg-[var(--accent)] data-[active]:text-[var(--canvas-deep)] ${active ? "" : "border-[var(--line)] bg-[var(--panel-soft)] text-[var(--muted)] hover:border-[var(--line-bright)] hover:text-[var(--ink)]"} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
