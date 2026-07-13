export default function Loading() {
  return (
    <div className="grid min-h-[60vh] place-items-center px-6" role="status" aria-live="polite">
      <div className="w-full max-w-xs border border-[var(--line)] bg-[var(--panel)] p-4 shadow-[4px_4px_0_var(--shadow)]">
        <div className="mb-3 flex items-center justify-between gap-4 font-mono text-[11px] text-[var(--muted)]">
          <span>opening archive...</span>
          <span className="blink-cursor" aria-hidden="true">_</span>
        </div>
        <div className="h-2 overflow-hidden border border-[var(--line-bright)] bg-[var(--canvas-deep)]">
          <div className="loading-step h-full w-1/3 bg-[var(--accent)]" />
        </div>
      </div>
    </div>
  );
}
