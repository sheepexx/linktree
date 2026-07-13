"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

type SiteFooterProps = {
  messages: readonly string[];
  lastUpdated: string;
};

export function SiteFooter({ messages, lastUpdated }: SiteFooterProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (messages.length < 2) return;
    const timeout = window.setTimeout(() => {
      setMessageIndex(Math.floor(Math.random() * messages.length));
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [messages.length]);

  return (
    <footer className="mt-12 border-t border-[var(--line)] py-6 pb-24 md:pb-6">
      <div className="flex flex-col gap-4 font-mono text-[10px] text-[var(--quiet)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="font-semibold tracking-[0.14em] text-[var(--ink)]">SHEEPEX</span>
          <span>© {new Date().getFullYear()}</span>
          <span>updated: {lastUpdated}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (messages.length > 1) setMessageIndex((current) => (current + 1) % messages.length);
            }}
            className="text-left hover:text-[var(--accent)]"
            title="Show another footer message"
          >
            {messages[messageIndex] ?? "still a work in progress"}
          </button>
          <a
            href="#top"
            aria-label="Back to top"
            className="grid size-9 place-items-center border border-[var(--line)] text-[var(--muted)] hover:border-[var(--line-bright)] hover:text-[var(--ink)]"
          >
            <ArrowUp aria-hidden="true" className="size-3.5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
