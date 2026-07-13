import { ArrowUpRight } from "lucide-react";
import type { AnchorHTMLAttributes, ReactNode } from "react";

type ExternalAnchorProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
};

export function ExternalAnchor({ children, className = "", ...props }: ExternalAnchorProps) {
  return (
    <a
      target="_blank"
      rel="noreferrer noopener"
      className={`inline-flex min-h-10 items-center gap-2 border border-[var(--line)] bg-[var(--panel-soft)] px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--muted)] transition-colors hover:border-[var(--accent-soft)] hover:text-[var(--accent)] ${className}`}
      {...props}
    >
      {children}
      <ArrowUpRight aria-hidden="true" className="size-3.5" />
    </a>
  );
}
