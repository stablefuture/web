import Link from "next/link";
import { Container } from "@/app/components/Container";
import { Wordmark } from "@/app/components/Logo";
import { ThemeToggle } from "@/app/components/ThemeToggle";

const NAV = [
  ["Career checker", "/checker"],
  ["Methodology", "/methodology"],
  ["About", "/about"],
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border-soft bg-background/80 backdrop-blur">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              aria-label="Stable Future — home"
              className="transition-transform duration-200 hover:scale-105"
            >
              <Wordmark className="h-7 text-ink" />
            </Link>
            <nav aria-label="Primary" className="flex items-center gap-1">
              {NAV.map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  className="rounded-md px-3 py-2 text-sm font-bold text-ink transition-colors hover:text-accent-strong"
                >
                  {label}
                </a>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </Container>
    </header>
  );
}
