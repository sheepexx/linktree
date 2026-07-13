import { FileQuestion, Home } from "lucide-react";
import Link from "next/link";

import { Window } from "@/components/ui/Window";

export default function NotFound() {
  return (
    <div className="grid min-h-[65vh] place-items-center">
      <Window title="404.txt" eyebrow="missing file" className="w-full max-w-lg">
        <div className="p-6 text-center sm:p-10">
          <FileQuestion aria-hidden="true" className="mx-auto size-8 text-[var(--accent)]" />
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">this file wandered off.</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[var(--muted)]">
            it may be unfinished, renamed, or hiding in a folder that does not exist yet.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex min-h-11 items-center gap-2 border border-[var(--accent-soft)] bg-[var(--accent)] px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--canvas-deep)]"
          >
            <Home aria-hidden="true" className="size-3.5" />
            return home
          </Link>
        </div>
      </Window>
    </div>
  );
}
