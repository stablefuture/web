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
        <div className="relative grid h-16 grid-cols-3 items-center">
          <nav aria-label="Primary" className="flex items-center justify-self-start gap-1">
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

          <Link
            href="/"
            aria-label="Stable Future — home"
            className="justify-self-center transition-transform duration-200 hover:scale-105"
          >
            <Wordmark className="h-7 text-ink" />
          </Link>

          <div className="justify-self-end">
            <ThemeToggle />
          </div>
        </div>
      </Container>
    </header>
  );
}
