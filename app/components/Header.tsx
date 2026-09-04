import Link from "next/link";
import { Container } from "@/app/components/Container";
import { Mark, Wordmark } from "@/app/components/Logo";
import { ThemeToggle } from "@/app/components/ThemeToggle";

const NAV = [
  ["Career checker", "/checker"],
  ["Graduate destinations", "/destinations"],
  ["Methodology", "/methodology"],
  ["About", "/about"],
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border-soft bg-background/80 backdrop-blur">
      <Container>
        {/* Mobile: wordmark and toggle on one row, nav wrapping under it.
            From sm: one row, mark then nav left, wordmark in the middle, toggle right. */}
        <div className="flex flex-col gap-1 py-3 sm:grid sm:min-h-16 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-6 sm:py-2">
          <div className="flex items-center justify-between sm:contents">
            <Link
              href="/"
              aria-label="Stable Future — home"
              className="transition-transform duration-200 hover:scale-105 sm:order-2 sm:justify-self-center"
            >
              <Wordmark className="h-7 text-ink" />
            </Link>
            <div className="sm:order-3 sm:justify-self-end">
              <ThemeToggle />
            </div>
          </div>

          <nav aria-label="Primary" className="-mx-3 flex flex-wrap items-center gap-1 sm:order-1 sm:mx-0">
            <Link
              href="/"
              aria-label="Stable Future — home"
              className="mr-2 hidden transition-transform duration-200 hover:scale-105 sm:block"
            >
              <Mark className="h-8 text-ink" />
            </Link>
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
        </div>
      </Container>
    </header>
  );
}
