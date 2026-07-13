"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

export type CommandItem = {
  label: string;
  href: string;
  hint?: string;
  keywords?: string[];
};

type CommandPaletteProps = {
  open: boolean;
  items: CommandItem[];
  onClose: () => void;
};

export function CommandPalette({ open, items, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return items;
    return items.filter((item) =>
      [item.label, item.hint, ...(item.keywords ?? [])]
        .filter(Boolean)
        .some((part) => part!.toLowerCase().includes(value)),
    );
  }, [items, query]);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const frame = window.requestAnimationFrame(() => {
      setQuery("");
      inputRef.current?.focus();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      previousFocus?.focus();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[90] grid place-items-start overflow-y-auto bg-[rgba(3,5,6,0.78)] px-4 py-4 backdrop-blur-[2px] sm:pb-6 sm:pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="command-title"
            className="window-panel flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col overflow-hidden bg-[var(--panel)] sm:max-h-[76vh]"
            initial={{ opacity: 0, y: -8, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.985 }}
            transition={{ duration: 0.14 }}
          >
            <div className="flex items-center gap-3 border-b border-[var(--line)] bg-[var(--panel-raised)] px-4 py-3">
              <Search aria-hidden="true" className="size-4 text-[var(--accent)]" />
              <h2 id="command-title" className="pixel-label flex-1 text-[var(--ink)]">
                open file / jump somewhere
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close command palette"
                className="grid size-9 place-items-center border border-[var(--line)] text-[var(--muted)] hover:border-[var(--line-bright)] hover:text-[var(--ink)]"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </div>

            <label className="sr-only" htmlFor="command-search">
              Search destinations
            </label>
            <input
              ref={inputRef}
              id="command-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter" || !filtered[0]) return;
                event.preventDefault();
                router.push(filtered[0].href);
                onClose();
              }}
              placeholder="type a section or file name..."
              className="min-h-12 w-full border-b border-[var(--line)] bg-[var(--canvas-deep)] px-4 font-mono text-sm text-[var(--ink)] placeholder:text-[var(--quiet)] focus-visible:outline-offset-[-2px]"
            />

            <div className="soft-scrollbar min-h-0 flex-1 overflow-y-auto p-2">
              {filtered.length ? (
                <ul>
                  {filtered.map((item, index) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className="group flex min-h-12 items-center gap-3 border border-transparent px-3 py-2 hover:border-[var(--line)] hover:bg-[var(--panel-raised)]"
                      >
                        <span className="w-6 font-mono text-[9px] text-[var(--quiet)]">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="flex-1 font-mono text-xs font-semibold text-[var(--ink)]">
                          {item.label}
                          {item.hint ? (
                            <span className="ml-2 font-normal text-[var(--quiet)]">{item.hint}</span>
                          ) : null}
                        </span>
                        <ArrowRight
                          aria-hidden="true"
                          className="size-3.5 text-[var(--quiet)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--accent)]"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="p-6 text-center font-mono text-xs text-[var(--quiet)]">
                  no matching file. it might still be unfinished.
                </p>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-[var(--line)] bg-[var(--panel-soft)] px-4 py-2 font-mono text-[9px] uppercase tracking-wider text-[var(--quiet)]">
              <span>enter to open</span>
              <span>esc to close</span>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
