"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookCall } from "@/app/components/BookCall";
import { Container } from "@/app/components/Container";
import { Mark } from "@/app/components/Logo";
import { ThemeToggle } from "@/app/components/ThemeToggle";

export function Header() {
  // The home page leads with the checker and /list is a single-CTA page:
  // neither needs the header's book-a-call button.
  const pathname = usePathname();
  const showCta = pathname !== "/" && pathname !== "/list";

  return (
    <header className="sticky top-0 z-40 border-b border-border-soft bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <Container>
        {/* Equal 1fr side columns keep the CTA dead-centre on the page. */}
        <div className="grid h-16 grid-cols-[1fr_auto_1fr] items-center">
          <div className="flex justify-start">
            <Link
              href="/"
              className="text-ink transition-opacity hover:opacity-70"
              aria-label="Stable Future — home"
            >
              <Mark className="h-9 text-ink" />
            </Link>
          </div>
          <div className="flex justify-center">
            {showCta && <BookCall size="md" className="whitespace-nowrap" />}
          </div>
          <div className="flex justify-end">
            <ThemeToggle />
          </div>
        </div>
      </Container>
    </header>
  );
}
