import type { Metadata } from "next";
import { Apprenticeships } from "@/app/apprenticeships/Apprenticeships";
import { Container } from "@/app/components/Container";
import { Section } from "@/app/components/Section";
import { Wordmark } from "@/app/components/Logo";

export const metadata: Metadata = {
  title: "Which apprenticeships actually finish? — Stable Future",
  description:
    "Compare every UK apprenticeship on completion rate, pay and who's hiring near you. Built from Department for Education data on 1.9m apprenticeship starts.",
};

export default function ApprenticeshipsPage() {
  return (
    <main>
      <Section as="section">
        <Container>
          <div className="flex flex-col gap-8">
            <div className="flex flex-col items-center gap-5 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-accent-strong">
                Choosing an apprenticeship
              </span>
              <h1 className="max-w-3xl text-4xl font-extrabold uppercase leading-[0.95] tracking-tight text-ink sm:text-5xl lg:text-6xl">
                Not every apprenticeship{" "}
                <span className="inline-block bg-accent px-3 py-0.5 text-on-accent">
                  gets finished
                </span>
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
                Two apprenticeships with the same title can differ by 50 points on whether
                people actually complete them. Here&apos;s every one in England, ranked on the
                numbers the brochures leave out — and who takes on apprentices near you.
              </p>
            </div>

            <Apprenticeships />
          </div>
        </Container>
      </Section>

      <Section as="section" tight className="border-t border-border-soft bg-surface-alt">
        <Container narrow>
          <div className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-muted">
            <p>
              Completion rates are published per apprenticeship, never per employer — so this
              shows which apprenticeships get finished, not which companies finish them.
              Openings are adverts posted between August 2022 and February 2026, not live
              vacancies. Check anything that matters before acting on it.
            </p>
            <p className="mt-4">
              Built from Department for Education statistics: apprenticeship achievement
              rates, 1.9m starts, and 242,842 vacancy adverts. Contains public sector
              information licensed under the{" "}
              <a
                href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-ink"
              >
                Open Government Licence v3.0
              </a>
              .
            </p>
          </div>
        </Container>
      </Section>

      <footer className="border-t border-border-soft bg-background py-8 text-muted">
        <Container>
          <div className="flex flex-col items-center justify-between gap-4 text-sm sm:flex-row">
            <Wordmark className="h-7 text-ink" />
            <span>© {new Date().getFullYear()} Stable Future. All rights reserved.</span>
          </div>
        </Container>
      </footer>
    </main>
  );
}
