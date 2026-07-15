"use client";

import { useState } from "react";

const navItems = [
  { label: "art / gfx", href: "#art" },
  { label: "osu!", href: "#osu" },
  { label: "projects", href: "#projects" },
  { label: "links", href: "#links" },
] as const;

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper">
      <div className="mx-auto flex h-16 w-full max-w-[1100px] items-center justify-between px-6">
        <a href="#top" className="text-lg font-semibold tracking-tight">
          sheepex_
        </a>
        <nav aria-label="site sections" className="hidden items-center gap-8 sm:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-muted transition-colors hover:text-ink"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
          className="-mr-2 px-2 py-2 text-sm font-medium sm:hidden"
        >
          {menuOpen ? "close" : "menu"}
        </button>
      </div>
      {menuOpen && (
        <nav
          id="mobile-menu"
          aria-label="site sections"
          className="border-t border-line sm:hidden"
        >
          <div className="mx-auto flex w-full max-w-[1100px] flex-col px-6 py-4">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="py-3 text-lg"
              >
                {item.label}
              </a>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
