import type { ReactNode } from "react";

export function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-16 border-t border-line">
      <div className="mx-auto w-full max-w-[1100px] px-6 py-20 md:py-28">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {title}
        </h2>
        {description && (
          <p className="mt-3 max-w-xl leading-relaxed text-muted">
            {description}
          </p>
        )}
        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}
