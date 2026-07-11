import { Checker } from "@/app/checker/Checker";
import { Container } from "@/app/components/Container";
import { Section } from "@/app/components/Section";
import { Wordmark } from "@/app/components/Logo";

export default function Home() {
  return (
    <main>
      {/* Hero + checker */}
      <Section as="section">
        <Container>
          <div className="flex flex-col gap-8">
            <div className="flex flex-col items-center gap-5 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-accent-strong">
                For parents of Year 10–13 students
              </span>
              <h1 className="max-w-3xl text-4xl font-extrabold uppercase leading-[0.95] tracking-tight text-ink sm:text-5xl lg:text-6xl">
                Is your path{" "}
                <span className="inline-block bg-accent px-3 py-0.5 text-on-accent">
                  future-proof?
                </span>
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
                Search any job, degree or apprenticeship. See its pay, openings,
                competition and AI exposure from real UK data, not opinion.
              </p>
            </div>

            <Checker />
          </div>
        </Container>
      </Section>

      {/* How to read it */}
      <Section className="bg-surface-alt" tight>
        <Container narrow>
          <p className="text-center text-sm leading-relaxed text-muted">
            Competition and openings are modelled estimates. A call turns the figures into a plan.
          </p>
        </Container>
      </Section>

      {/* Footer */}
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
