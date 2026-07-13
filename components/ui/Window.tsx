import type { HTMLAttributes, ReactNode } from "react";

type WindowProps = HTMLAttributes<HTMLElement> & {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  as?: "section" | "article" | "div";
  children: ReactNode;
};

export function Window({
  title,
  eyebrow,
  action,
  as: Component = "section",
  children,
  className = "",
  ...props
}: WindowProps) {
  return (
    <Component className={`window-panel ${className}`} {...props}>
      <div className="flex min-h-9 items-center gap-3 border-b border-[var(--line)] bg-[var(--panel-raised)] px-3 py-2">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="size-2 border border-[var(--line-bright)] bg-[var(--accent)]" />
          <span className="size-2 border border-[var(--line-bright)] bg-[var(--panel)]" />
          <span className="size-2 border border-[var(--line-bright)] bg-[var(--signal-soft)]" />
        </div>
        <div className="min-w-0 flex-1">
          {eyebrow ? (
            <span className="mr-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--quiet)]">
              {eyebrow}
            </span>
          ) : null}
          <span className="font-mono text-[11px] font-semibold tracking-wide text-[var(--ink)]">
            {title}
          </span>
        </div>
        {action}
      </div>
      {children}
    </Component>
  );
}
