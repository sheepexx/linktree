import { FileQuestion } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="checkerboard grid min-h-52 place-items-center border border-dashed border-[var(--line-bright)] p-6 text-center">
      <div className="max-w-xs border border-[var(--line)] bg-[var(--panel)] p-4 shadow-[3px_3px_0_var(--shadow)]">
        <FileQuestion aria-hidden="true" className="mx-auto mb-3 size-5 text-[var(--quiet)]" />
        <p className="font-mono text-[11px] font-semibold text-[var(--ink)]">{title}</p>
        <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{description}</p>
      </div>
    </div>
  );
}
