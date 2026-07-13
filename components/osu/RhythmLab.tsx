"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

type LaneKey = "d" | "f" | "j" | "k";

type Lane = {
  key: LaneKey;
  label: string;
  accent: string;
  activeBorder: string;
};

const WINDOW_MS = 2_000;

const LANES: readonly Lane[] = [
  {
    key: "d",
    label: "D",
    accent: "bg-[var(--accent)]",
    activeBorder: "border-[var(--accent)]",
  },
  {
    key: "f",
    label: "F",
    accent: "bg-[var(--signal)]",
    activeBorder: "border-[var(--signal)]",
  },
  {
    key: "j",
    label: "J",
    accent: "bg-[var(--signal)]",
    activeBorder: "border-[var(--signal)]",
  },
  {
    key: "k",
    label: "K",
    accent: "bg-[var(--accent)]",
    activeBorder: "border-[var(--accent)]",
  },
] as const;

const EMPTY_COUNTS: Record<LaneKey, number> = { d: 0, f: 0, j: 0, k: 0 };
const EMPTY_ACTIVE: Record<LaneKey, boolean> = {
  d: false,
  f: false,
  j: false,
  k: false,
};

function laneFromKeyboardEvent(event: KeyboardEvent): LaneKey | null {
  const code = event.code.toLowerCase();
  const key = event.key.toLowerCase();
  const candidate = code.startsWith("key") ? code.slice(3) : key;

  return candidate === "d" ||
    candidate === "f" ||
    candidate === "j" ||
    candidate === "k"
    ? candidate
    : null;
}

export function RhythmLab() {
  const titleId = useId();
  const helpId = useId();
  const windowNoteId = useId();
  const labRef = useRef<HTMLElement>(null);
  const [totalPresses, setTotalPresses] = useState(0);
  const [lanePresses, setLanePresses] =
    useState<Record<LaneKey, number>>(EMPTY_COUNTS);
  const [activeLanes, setActiveLanes] =
    useState<Record<LaneKey, boolean>>(EMPTY_ACTIVE);
  const [currentKps, setCurrentKps] = useState(0);
  const [bestKps, setBestKps] = useState(0);

  const pressTimesRef = useRef<number[]>([]);
  const heldKeysRef = useRef(new Set<LaneKey>());

  const setLaneActive = useCallback((lane: LaneKey, active: boolean) => {
    setActiveLanes((current) =>
      current[lane] === active ? current : { ...current, [lane]: active },
    );
  }, []);

  const recordPress = useCallback((lane: LaneKey) => {
    const now = performance.now();
    const recentPresses = pressTimesRef.current.filter(
      (timestamp) => now - timestamp < WINDOW_MS,
    );

    recentPresses.push(now);
    pressTimesRef.current = recentPresses;

    const nextKps = recentPresses.length / (WINDOW_MS / 1_000);
    setCurrentKps(nextKps);
    setBestKps((best) => Math.max(best, nextKps));
    setTotalPresses((total) => total + 1);
    setLanePresses((counts) => ({
      ...counts,
      [lane]: counts[lane] + 1,
    }));
  }, []);

  useEffect(() => {
    const updateRate = window.setInterval(() => {
      const now = performance.now();
      const recentPresses = pressTimesRef.current.filter(
        (timestamp) => now - timestamp < WINDOW_MS,
      );

      pressTimesRef.current = recentPresses;
      setCurrentKps(recentPresses.length / (WINDOW_MS / 1_000));
    }, 100);

    return () => window.clearInterval(updateRate);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;

      const target = event.target as HTMLElement | null;
      if (!labRef.current?.contains(target)) return;
      if (
        target?.isContentEditable ||
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT"
      ) {
        return;
      }

      const lane = laneFromKeyboardEvent(event);
      if (!lane || heldKeysRef.current.has(lane)) return;

      event.preventDefault();
      heldKeysRef.current.add(lane);
      setLaneActive(lane, true);
      recordPress(lane);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const lane = laneFromKeyboardEvent(event);
      if (!lane) return;

      heldKeysRef.current.delete(lane);
      setLaneActive(lane, false);
    };

    const releaseAllKeys = () => {
      heldKeysRef.current.clear();
      setActiveLanes(EMPTY_ACTIVE);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", releaseAllKeys);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", releaseAllKeys);
    };
  }, [recordPress, setLaneActive]);

  const resetSession = () => {
    pressTimesRef.current = [];
    heldKeysRef.current.clear();
    setTotalPresses(0);
    setLanePresses(EMPTY_COUNTS);
    setActiveLanes(EMPTY_ACTIVE);
    setCurrentKps(0);
    setBestKps(0);
  };

  return (
    <section
      ref={labRef}
      tabIndex={0}
      aria-labelledby={titleId}
      aria-describedby={helpId}
      className="relative border border-[var(--line)] bg-[var(--panel)] p-4 text-[var(--ink)] shadow-[4px_4px_0_var(--shadow)] sm:p-5"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--line-bright)] to-transparent"
      />

      <div className="relative flex flex-col gap-5">
        <header className="flex items-start justify-between gap-5">
          <div>
            <p className="mb-2 font-mono text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[var(--quiet)]">
              input study / 02
            </p>
            <h2
              id={titleId}
              className="text-xl font-medium tracking-tight text-[var(--ink)] sm:text-2xl"
            >
              rhythm lab
            </h2>
            <p
              id={helpId}
              className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]"
            >
              Focus this panel, then tap the lanes or use D, F, J and K. Each physical press counts once.
            </p>
          </div>

          <button
            type="button"
            onClick={resetSession}
            className="shrink-0 border border-[var(--line)] bg-[var(--panel-soft)] px-3 py-2 font-mono text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--muted)] transition-colors hover:border-[var(--line-bright)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--signal)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--panel)] motion-reduce:transition-none"
          >
            Reset
          </button>
        </header>

        <dl className="grid grid-cols-3 divide-x divide-[var(--line)] border-y border-[var(--line)] bg-[var(--panel-soft)] py-3">
          <div className="px-4">
            <dt className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.16em] text-[var(--quiet)]">
              Presses
            </dt>
            <dd className="mt-1 font-mono text-xl tabular-nums text-[var(--ink)] sm:text-2xl">
              {totalPresses}
            </dd>
          </div>
          <div className="px-4">
            <dt className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.16em] text-[var(--quiet)]">
              KPS
            </dt>
            <dd className="mt-1 font-mono text-xl tabular-nums text-[var(--signal)] sm:text-2xl">
              {currentKps.toFixed(1)}
            </dd>
          </div>
          <div className="px-4">
            <dt className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.16em] text-[var(--quiet)]">
              Best
            </dt>
            <dd className="mt-1 font-mono text-xl tabular-nums text-[var(--ink)] sm:text-2xl">
              {bestKps.toFixed(1)}
            </dd>
          </div>
        </dl>

        <div
          role="group"
          aria-label="Four-key rhythm input"
          aria-describedby={`${helpId} ${windowNoteId}`}
          className="grid grid-cols-4 gap-1.5 sm:gap-2"
        >
          {LANES.map((lane) => {
            const isActive = activeLanes[lane.key];

            return (
              <button
                key={lane.key}
                type="button"
                aria-label={`${lane.label} lane, ${lanePresses[lane.key]} presses`}
                onPointerDown={(event) => {
                  if (
                    !event.isPrimary ||
                    (event.pointerType === "mouse" && event.button !== 0)
                  ) {
                    return;
                  }
                  setLaneActive(lane.key, true);
                  recordPress(lane.key);
                }}
                onPointerUp={() => setLaneActive(lane.key, false)}
                onPointerCancel={() => setLaneActive(lane.key, false)}
                onPointerLeave={() => setLaneActive(lane.key, false)}
                onClick={(event) => {
                  // Pointer input is counted on pointerdown; detail 0 covers
                  // keyboard and assistive-technology button activation.
                  if (event.detail === 0) recordPress(lane.key);
                }}
                className={`group relative h-40 touch-manipulation select-none overflow-hidden border bg-[var(--panel-soft)] text-left outline-none transition duration-100 active:translate-y-px focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-[var(--signal)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--panel)] motion-reduce:transform-none motion-reduce:transition-none sm:h-48 ${
                  isActive
                    ? `${lane.activeBorder} -translate-y-px bg-[var(--panel-raised)]`
                    : "border-[var(--line)] hover:border-[var(--line-bright)] hover:bg-[var(--panel-raised)]"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-x-1/2 top-5 h-[calc(100%-5.5rem)] w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[var(--line)] to-[var(--line-bright)]"
                />
                <span
                  aria-hidden="true"
                  className={`absolute left-1/2 top-5 h-1.5 w-1.5 -translate-x-1/2 transition-transform duration-100 motion-reduce:transition-none ${
                    lane.accent
                  } ${isActive ? "scale-[1.65]" : "scale-100"}`}
                />
                <span className="absolute inset-x-0 bottom-3 flex flex-col items-center gap-2">
                  <span
                    aria-hidden="true"
                    className={`grid h-10 w-10 place-items-center border font-mono text-sm font-bold transition duration-100 motion-reduce:transform-none motion-reduce:transition-none sm:h-11 sm:w-11 ${
                      isActive
                        ? "translate-y-px border-[var(--ink)] bg-[var(--ink)] text-[var(--canvas-deep)]"
                        : "border-[var(--line-bright)] bg-[var(--canvas-deep)] text-[var(--muted)] group-hover:text-[var(--ink)]"
                    }`}
                  >
                    {lane.label}
                  </span>
                  <span className="font-mono text-[0.6rem] tabular-nums text-[var(--quiet)]">
                    {lanePresses[lane.key].toString().padStart(2, "0")}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-4 text-xs text-[var(--quiet)]">
          <p id={windowNoteId}>KPS uses a rolling two-second window.</p>
          <p
            aria-hidden="true"
            className="font-mono tracking-[0.18em] text-[var(--quiet)]"
          >
            D F / J K
          </p>
        </div>
      </div>
    </section>
  );
}

export default RhythmLab;
