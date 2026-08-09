"use client";

import { useEffect, useState } from "react";
import { Container } from "@/app/components/Container";
import { Wordmark } from "@/app/components/Logo";
import { ThemeToggle } from "@/app/components/ThemeToggle";

const NAV = [
  ["Career checker", "/checker"],
  ["Methodology", "/methodology"],
  ["About", "/about"],
];

export function Header() {
  const [open, setOpen] = useState(false);

  // Escape closes the menu. Links are plain anchors, so navigating away
  // unmounts it anyway — this only covers the dismiss-without-choosing case.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-border-soft bg-background/80 backdrop-blur">
      <Container>
        <div className="grid h-16 grid-cols-3 items-center">
          <div className="justify-self-start">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="site-nav"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border-soft text-ink transition-all duration-200 hover:scale-105 hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {open ? <CloseIcon /> : <BurgerIcon />}
            </button>
          </div>

          <a
            href="/"
            aria-label="Stable Future — home"
            className="justify-self-center transition-transform duration-200 hover:scale-105"
          >
            <Wordmark className="h-7 text-ink" />
          </a>

          <div className="justify-self-end">
            <ThemeToggle />
          </div>
        </div>

        {open && (
          <nav
            id="site-nav"
            className="flex flex-col gap-1 border-t border-border-soft py-3"
          >
            {NAV.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="rounded-md px-2 py-2 text-sm font-bold text-ink transition-colors hover:bg-surface-alt hover:text-accent-strong"
              >
                {label}
              </a>
            ))}
          </nav>
        )}
      </Container>
    </header>
  );
}

function BurgerIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
