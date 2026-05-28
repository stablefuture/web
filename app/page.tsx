import { Button } from "@/app/components/Button";
import { Comparison } from "@/app/components/Comparison";
import { Container } from "@/app/components/Container";
import { Section } from "@/app/components/Section";
import { SCARCITY_ENABLED, SCARCITY_TEXT, VSL_URL } from "@/app/config";

const PROBLEMS = [
  "The careers advice they're getting is out of date. School guidance assumes a job market that's already changing fast.",
  "AI is reshaping entry-level work. The roles graduates used to start in are the first ones being automated.",
  "Good grades are no longer enough. Employers increasingly hire for judgement, initiative and real projects — things exams don't measure.",
  "Most parents feel all this but can't act on it. The worry is real; the next step isn't obvious.",
];

const OUTCOMES = [
  "An honest assessment of your child's current trajectory.",
  "Subject and course choices that hold their value.",
  "The practical AI skills employers actually reward.",
  "A concrete 6-month action plan you can start this week.",
];

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <Section as="section">
        <Container narrow>
          <div className="flex flex-col items-center gap-8 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-accent-strong">
              For parents of Year 9–13 students
            </span>

            <h1 className="max-w-4xl text-4xl font-extrabold uppercase leading-[0.95] tracking-tight text-ink sm:text-6xl lg:text-7xl">
              Give your teenager an unfair{" "}
              <span className="inline-block bg-accent px-3 py-0.5 text-on-accent">
                advantage
              </span>{" "}
              in an AI-shaped world.
            </h1>

            <p className="max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
              Most careers advice was written before ChatGPT. We give you a
              clear, honest plan for the subjects, skills and choices that will
              still matter when your child enters the workforce.
            </p>

            <VideoEmbed />

            <div className="mt-2 flex flex-col items-center gap-3">
              <Button href="/apply" size="lg" className="uppercase tracking-wide">
                Apply now →
              </Button>
              <p className="text-sm text-muted">
                Free 30-minute call · No obligation
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* Interactive comparison */}
      <Section className="bg-surface-alt">
        <Container narrow>
          <div className="flex flex-col gap-10">
            <h2 className="text-center text-3xl font-extrabold uppercase tracking-tight text-ink sm:text-4xl">
              Two paths from here.
            </h2>
            <Comparison problems={PROBLEMS} outcomes={OUTCOMES} />
          </div>
        </Container>
      </Section>

      {/* Payoff */}
      <Section as="section">
        <Container narrow>
          <h2 className="text-center text-4xl font-extrabold uppercase leading-[0.95] tracking-tight text-ink sm:text-5xl lg:text-6xl">
            All you do:{" "}
            <span className="inline-block whitespace-nowrap bg-accent px-3 py-0.5 text-on-accent">
              show up
            </span>{" "}
            to the call.
          </h2>
        </Container>
      </Section>

      {/* Scarcity — gated by SCARCITY_ENABLED in app/config.ts */}
      {SCARCITY_ENABLED && (
        <Section tight className="bg-surface-alt">
          <Container narrow>
            <p className="text-center text-base leading-relaxed text-muted sm:text-lg">
              {SCARCITY_TEXT}
            </p>
          </Container>
        </Section>
      )}

      {/* Final CTA */}
      <Section className="bg-surface-alt">
        <Container narrow>
          <div className="flex flex-col items-center gap-8 text-center">
            <h2 className="text-3xl font-extrabold uppercase tracking-tight text-ink sm:text-4xl">
              Give your child a head start.
            </h2>
            <p className="max-w-lg text-lg leading-relaxed text-muted">
              Answer a few questions and book your free strategy call. We&apos;ll
              tell you honestly what we&apos;d do — no upsell, no fluff.
            </p>
            <Button href="/apply" size="lg" className="uppercase tracking-wide">
              Apply now →
            </Button>
            <p className="text-sm text-muted">
              Free 30-minute call · No obligation
            </p>
          </div>
        </Container>
      </Section>

      {/* Footer */}
      <footer className="border-t border-border-soft bg-background py-8 text-muted">
        <Container>
          <div className="flex flex-col items-center justify-between gap-4 text-sm sm:flex-row">
            <span className="font-extrabold text-ink">Stable Future</span>
            <span>
              © {new Date().getFullYear()} Stable Future. All rights reserved.
            </span>
          </div>
        </Container>
      </footer>
    </main>
  );
}

function VideoEmbed() {
  // The accent-glow halo is purple in dark, transparent in light — same class is
  // safe in both themes.
  const glow = "shadow-[0_0_80px_-10px_var(--accent-glow)]";
  if (!VSL_URL) {
    return (
      <div
        className={`flex aspect-video w-full items-center justify-center rounded-2xl border border-border-soft bg-surface-alt ${glow}`}
        aria-label="Video placeholder"
      >
        <span className="text-sm font-medium uppercase tracking-widest text-muted">
          Video coming soon
        </span>
      </div>
    );
  }
  return (
    <div className={`aspect-video w-full overflow-hidden rounded-2xl ${glow}`}>
      <iframe
        src={VSL_URL}
        title="Stable Future"
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
