"use client";

import Link from "next/link";
import { useState } from "react";
import { Container } from "@/app/components/Container";
import { Wordmark } from "@/app/components/Logo";
import { ThemeToggle } from "@/app/components/ThemeToggle";

const NAV = [
  ["Career checker", "/checker"],
  ["Graduate destinations", "/destinations"],
  ["About", "/about"],
];

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-border-soft bg-background/80 backdrop-blur">
      <Container wide>
        {/* Mobile: menu button left, wordmark centred, toggle right, nav in a
            panel under the bar. From sm: one row, wordmark then nav on the
            left, toggle right. */}
        <div className="relative flex min-h-14 items-center justify-between py-2 sm:min-h-16 sm:gap-6">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border-soft text-ink transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:hidden"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-5 w-5" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
          <Link
            href="/"
            aria-label="Stable Future — home"
            className="absolute left-1/2 -translate-x-1/2 transition-transform duration-200 hover:scale-105 sm:static sm:translate-x-0"
          >
            <Wordmark className="h-7 text-ink" />
          </Link>
          <nav aria-label="Primary" className="hidden items-center gap-1 sm:mr-auto sm:flex">
            {NAV.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-bold text-ink transition-colors hover:text-accent-strong"
              >
                {label}
              </a>
            ))}
          </nav>
          <ThemeToggle />
        </div>
        {open && (
          <nav id="mobile-nav" aria-label="Primary" className="flex flex-col border-t border-border-soft py-2 sm:hidden">
            {NAV.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="rounded-md px-3 py-2.5 text-base font-bold text-ink transition-colors hover:text-accent-strong"
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
