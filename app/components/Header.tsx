import Link from "next/link";
import { Button } from "@/app/components/Button";
import { Container } from "@/app/components/Container";
import { ThemeToggle } from "@/app/components/ThemeToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border-soft bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <Container>
        {/* Three-column grid keeps APPLY NOW dead-centre regardless of side widths. */}
        <div className="grid h-16 grid-cols-[auto_1fr_auto] items-center">
          <div className="flex justify-start">
            <Link
              href="/"
              className="text-base font-extrabold tracking-tight text-ink sm:text-lg"
              aria-label="Stable Future — home"
            >
              {/* Wordmark; future logo slot. */}
              Stable Future
            </Link>
          </div>
          <div className="flex justify-center">
            <Button href="/apply" size="md" className="uppercase tracking-wide whitespace-nowrap">
              Apply Now
            </Button>
          </div>
          <div className="flex justify-end">
            <ThemeToggle />
          </div>
        </div>
      </Container>
    </header>
  );
}
