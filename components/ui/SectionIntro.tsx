import type { ReactNode } from "react";

type SectionIntroProps = {
  index: string;
  title: string;
  description: string;
  aside?: ReactNode;
};

export function SectionIntro({ index, title, description, aside }: SectionIntroProps) {
  return (
    <header className="mb-7 grid gap-5 border-b border-[var(--line)] pb-6 md:grid-cols-[1fr_auto] md:items-end">
      <div>
        <div className="mb-3 flex items-center gap-3">
          <span className="pixel-label text-[var(--accent)]">{index}</span>
          <span className="h-px w-10 bg-[var(--line-bright)]" aria-hidden="true" />
          <span className="font-mono text-[10px] text-[var(--quiet)]">/archive</span>
        </div>
        <h1 className="text-balance text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)] sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-base">
          {description}
        </p>
      </div>
      {aside ? <div>{aside}</div> : null}
    </header>
  );
}
