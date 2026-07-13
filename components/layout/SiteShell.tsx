"use client";

import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "framer-motion";
import { Palette, Radio, Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { messages } from "@/data/messages";
import { easterEggs } from "@/data/easter-eggs";
import { navigation } from "@/data/navigation";
import { status } from "@/data/status";
import { defaultThemeId, themeById, themes, type ThemeId } from "@/data/themes";

import { CommandPalette } from "./CommandPalette";
import { SiteFooter } from "./SiteFooter";

type SiteShellProps = {
  children: ReactNode;
};

function isTypingTarget(target: EventTarget | null) {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
}

export function SiteShell({ children }: SiteShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [commandOpen, setCommandOpen] = useState(false);
  const [themeId, setThemeId] = useState<ThemeId>(defaultThemeId);
  const [storageReady, setStorageReady] = useState(false);
  const [hiddenThemeUnlocked, setHiddenThemeUnlocked] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const typedKeys = useRef("");
  const typedKeysAt = useRef(0);
  const sequenceKeys = useRef<string[]>([]);
  const sequenceKeysAt = useRef(0);
  const logoClicks = useRef(0);
  const logoClicksAt = useRef(0);

  const availableThemes = useMemo(
    () => themes.filter((theme) => !theme.hidden || hiddenThemeUnlocked),
    [hiddenThemeUnlocked],
  );

  const paletteItems = useMemo(
    () =>
      navigation.map((item) => ({
        label: item.label,
        href: item.href,
        hint: item.pathLabel,
        keywords: [item.id, item.shortLabel, item.icon, item.isSecret ? "secret hidden folder" : ""],
      })),
    [],
  );

  const unlockArchiveTheme = useCallback(() => {
    setHiddenThemeUnlocked(true);
    window.localStorage.setItem("sheepex-theme-unlocked", "1");
    setNotice("archive palette found // theme menu updated");
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const saved = window.localStorage.getItem("sheepex-theme") as ThemeId | null;
      const unlocked = window.localStorage.getItem("sheepex-theme-unlocked") === "1";
      if (unlocked || pathname === "/unknown") setHiddenThemeUnlocked(true);
      if (saved && themes.some((theme) => theme.id === saved && (!theme.hidden || unlocked || pathname === "/unknown"))) {
        setThemeId(saved);
      }
      setStorageReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    const selectedTheme = themeById[themeId];
    const root = document.documentElement;
    document.documentElement.dataset.theme = themeId;
    root.style.setProperty("--canvas", selectedTheme.colors.canvas);
    root.style.setProperty("--canvas-deep", selectedTheme.colors.canvas);
    root.style.setProperty("--panel", selectedTheme.colors.surface);
    root.style.setProperty("--panel-raised", selectedTheme.colors.surfaceRaised);
    root.style.setProperty("--panel-soft", selectedTheme.colors.surface);
    root.style.setProperty("--ink", selectedTheme.colors.text);
    root.style.setProperty("--muted", selectedTheme.colors.textMuted);
    root.style.setProperty("--quiet", selectedTheme.colors.textMuted);
    root.style.setProperty("--accent", selectedTheme.colors.accent);
    root.style.setProperty("--accent-soft", `${selectedTheme.colors.accent}80`);
    root.style.setProperty("--signal", selectedTheme.colors.accentSecondary);
    root.style.setProperty("--signal-soft", `${selectedTheme.colors.accentSecondary}70`);
    root.style.setProperty("--line", selectedTheme.colors.border);
    root.style.setProperty("--line-bright", selectedTheme.colors.textMuted);
    root.style.setProperty("--warning", selectedTheme.colors.warning);
    root.style.setProperty("--shadow", selectedTheme.colors.canvas);
    if (storageReady) window.localStorage.setItem("sheepex-theme", themeId);
  }, [storageReady, themeId]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const anotherModalIsOpen = Boolean(document.querySelector('[role="dialog"][aria-modal="true"]'));
      if (anotherModalIsOpen && !commandOpen) return;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((open) => !open);
        return;
      }

      if (anotherModalIsOpen) return;

      if (isTypingTarget(event.target)) return;

      const shortcutTarget = event.altKey && !event.ctrlKey && !event.metaKey
        ? navigation.find((item) => item.shortcut === `alt+${event.key.toLowerCase()}`)
        : undefined;
      if (shortcutTarget) {
        event.preventDefault();
        router.push(shortcutTarget.href);
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const now = performance.now();
      const typedEgg = easterEggs.find((egg) => egg.trigger.type === "typed-sequence");

      if (event.key.length === 1) {
        if (typedEgg?.trigger.type === "typed-sequence" && now - typedKeysAt.current > typedEgg.trigger.timeoutMs) {
          typedKeys.current = "";
        }
        typedKeysAt.current = now;
        typedKeys.current = `${typedKeys.current}${event.key.toLowerCase()}`.slice(-12);
        if (
          typedEgg?.trigger.type === "typed-sequence" &&
          typedKeys.current.endsWith(typedEgg.trigger.sequence.toLowerCase()) &&
          typedEgg.effect.type === "open-section"
        ) {
          const sectionId = typedEgg.effect.sectionId;
          const target = navigation.find((item) => item.id === sectionId);
          if (target) {
            typedKeys.current = "";
            setNotice("sequence accepted // opening optional folder");
            router.push(target.href);
          }
        }
      }

      const keyEgg = easterEggs.find((egg) => egg.trigger.type === "key-sequence");
      if (keyEgg?.trigger.type === "key-sequence") {
        if (now - sequenceKeysAt.current > keyEgg.trigger.timeoutMs) sequenceKeys.current = [];
        sequenceKeysAt.current = now;
        sequenceKeys.current = [...sequenceKeys.current, event.key].slice(-keyEgg.trigger.keys.length);
        const matches = keyEgg.trigger.keys.every((key, index) => sequenceKeys.current[index] === key);
        if (matches && keyEgg.effect.type === "unlock-theme") {
          unlockArchiveTheme();
          setThemeId(keyEgg.effect.themeId);
          sequenceKeys.current = [];
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [commandOpen, router, unlockArchiveTheme]);

  useEffect(() => {
    const onThemeRequest = (event: Event) => {
      const requested = (event as CustomEvent<ThemeId>).detail;
      if (!themes.some((theme) => theme.id === requested)) return;
      if (themeById[requested].hidden) unlockArchiveTheme();
      setThemeId(requested);
      setNotice(`palette changed // ${requested}`);
    };
    window.addEventListener("sheepex:set-theme", onThemeRequest);
    return () => window.removeEventListener("sheepex:set-theme", onThemeRequest);
  }, [unlockArchiveTheme]);

  const chooseTheme = (nextTheme: ThemeId) => {
    setThemeId(nextTheme);
    setNotice(`palette changed // ${nextTheme}`);
  };

  const cycleTheme = () => {
    const index = availableThemes.findIndex((theme) => theme.id === themeId);
    chooseTheme(availableThemes[(index + 1 + availableThemes.length) % availableThemes.length]?.id ?? defaultThemeId);
  };

  const closeCommand = useCallback(() => setCommandOpen(false), []);

  const onLogoClick = () => {
    const logoEgg = easterEggs.find((egg) => egg.trigger.type === "logo-clicks");
    const clickTarget = logoEgg?.trigger.type === "logo-clicks" ? logoEgg.trigger.count : 5;
    const now = performance.now();
    if (logoEgg?.trigger.type === "logo-clicks" && now - logoClicksAt.current > logoEgg.trigger.timeoutMs) {
      logoClicks.current = 0;
    }
    logoClicksAt.current = now;
    logoClicks.current += 1;
    if (logoClicks.current >= clickTarget) {
      logoClicks.current = 0;
      if (logoEgg?.effect.type === "show-message") setNotice(logoEgg.effect.message);
    }
  };

  return (
    <MotionConfig reducedMotion="user">
    <div id="top" className="min-h-screen">
      <a
        href="#main-content"
        className="fixed left-3 top-3 z-[110] -translate-y-24 border border-[var(--signal)] bg-[var(--canvas-deep)] px-4 py-3 font-mono text-xs text-[var(--ink)] focus:translate-y-0"
      >
        skip to content
      </a>

      <header className="fixed inset-x-0 top-0 z-50 flex h-10 items-center border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--canvas-deep)_96%,transparent)] px-3 backdrop-blur-sm md:pl-[15.5rem]">
        <div className="flex min-w-0 flex-1 items-center gap-3 font-mono text-[9px] uppercase tracking-[0.11em] text-[var(--quiet)]">
          <span className="hidden sm:inline">archive://sheepex_</span>
          <span className="hidden h-3 w-px bg-[var(--line)] sm:block" />
          <span className="truncate text-[var(--muted)]">
            {navigation.find((item) => item.href === pathname)?.pathLabel ?? pathname}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-[var(--quiet)] sm:flex">
            <span className="status-light" aria-hidden="true" />
            {status.onlineState}
          </span>
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="flex min-h-8 items-center gap-2 border border-[var(--line)] bg-[var(--panel-soft)] px-2.5 font-mono text-[9px] uppercase tracking-wider text-[var(--muted)] hover:border-[var(--line-bright)] hover:text-[var(--ink)]"
            aria-label="Open command palette"
          >
            <Search aria-hidden="true" className="size-3" />
            <span className="hidden sm:inline">find</span>
            <kbd className="hidden border border-[var(--line)] bg-[var(--canvas-deep)] px-1 py-0.5 text-[8px] text-[var(--quiet)] lg:inline">
              ctrl k
            </kbd>
          </button>
          <button
            type="button"
            onClick={cycleTheme}
            className="grid size-8 place-items-center border border-[var(--line)] bg-[var(--panel-soft)] text-[var(--muted)] hover:border-[var(--line-bright)] hover:text-[var(--ink)] md:hidden"
            aria-label={`Change theme. Current theme: ${themeId}`}
          >
            <Palette aria-hidden="true" className="size-3.5" />
          </button>
        </div>
      </header>

      <aside className="fixed inset-y-0 left-0 z-60 hidden w-[15rem] flex-col border-r border-[var(--line)] bg-[color-mix(in_srgb,var(--canvas-deep)_97%,transparent)] md:flex">
        <div className="flex h-28 items-end border-b border-[var(--line)] p-4">
          <button
            type="button"
            onClick={onLogoClick}
            className="group text-left"
            aria-label="SHEEPEX home mark. Repeated clicks reveal an optional message."
          >
            <span className="mb-2 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--quiet)]">
              <Radio aria-hidden="true" className="size-3 text-[var(--signal)]" /> personal archive
            </span>
            <span className="block text-2xl font-bold tracking-[-0.07em] text-[var(--ink)] transition-colors group-hover:text-[var(--accent)]">
              SHEEPEX<span className="text-[var(--accent)]">_</span>
            </span>
          </button>
        </div>

        <nav aria-label="Primary navigation" className="soft-scrollbar flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {navigation.map((item, index) => {
              const active = pathname === item.href;
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`group flex min-h-11 items-center gap-3 border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.09em] transition-colors ${
                      active
                        ? "border-[var(--accent-soft)] bg-[color-mix(in_srgb,var(--accent)_12%,var(--panel-soft))] text-[var(--ink)]"
                        : "border-transparent text-[var(--muted)] hover:border-[var(--line)] hover:bg-[var(--panel-soft)] hover:text-[var(--ink)]"
                    }`}
                  >
                    <span className={`w-5 text-[9px] ${active ? "text-[var(--accent)]" : "text-[var(--quiet)]"}`}>
                      {String(index).padStart(2, "0")}
                    </span>
                    <span className="flex-1">{item.label}</span>
                    <span className="text-[8px] text-[var(--quiet)] group-hover:text-[var(--accent)]">
                      {item.isSecret ? "[?]" : item.shortcut}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-[var(--line)] p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="pixel-label text-[var(--quiet)]">palette</span>
            <Palette aria-hidden="true" className="size-3 text-[var(--quiet)]" />
          </div>
          <div className="grid grid-cols-2 gap-1" role="group" aria-label="Choose color theme">
            {availableThemes.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => chooseTheme(theme.id)}
                aria-pressed={themeId === theme.id}
                className={`min-h-9 border px-2 text-left font-mono text-[8px] uppercase tracking-wider ${
                  themeId === theme.id
                    ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--canvas-deep)]"
                    : "border-[var(--line)] bg-[var(--panel-soft)] text-[var(--quiet)] hover:border-[var(--line-bright)] hover:text-[var(--ink)]"
                }`}
                title={theme.description}
              >
                {theme.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-60 border-t border-[var(--line)] bg-[color-mix(in_srgb,var(--canvas-deep)_98%,transparent)] md:hidden"
      >
        <ul className="soft-scrollbar flex snap-x overflow-x-auto px-1 py-1">
          {navigation.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.id} className="min-w-[4.4rem] flex-1 snap-start">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-14 flex-col items-center justify-center gap-1 border px-2 font-mono text-[8px] uppercase tracking-wider ${
                    active
                      ? "border-[var(--accent-soft)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]"
                      : "border-transparent text-[var(--quiet)]"
                  }`}
                >
                  <span aria-hidden="true">{item.isSecret ? "[?]" : item.pathLabel.slice(0, 2)}</span>
                  <span>{item.shortLabel}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="min-h-screen pt-10 md:pl-[15rem]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={pathname}
            id="main-content"
            tabIndex={-1}
            className="mx-auto w-full max-w-[92rem] px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10"
            initial={reduceMotion ? false : { opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -3 }}
            transition={{ duration: 0.14 }}
          >
            {children}
            <SiteFooter messages={messages.footer} lastUpdated={status.lastUpdated} />
          </motion.main>
        </AnimatePresence>
      </div>

      <CommandPalette open={commandOpen} items={paletteItems} onClose={closeCommand} />

      <AnimatePresence>
        {notice ? (
          <motion.div
            role="status"
            className="fixed bottom-20 right-4 z-[80] max-w-xs border border-[var(--accent-soft)] bg-[var(--panel-raised)] px-4 py-3 font-mono text-[10px] text-[var(--ink)] shadow-[4px_4px_0_var(--shadow)] md:bottom-5"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
          >
            {notice}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
    </MotionConfig>
  );
}
