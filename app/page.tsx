import { Button } from "@/app/components/Button";
import { Container } from "@/app/components/Container";
import { Section } from "@/app/components/Section";
import { VSL_URL } from "@/app/config";

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

const STEPS = [
  {
    n: "1",
    title: "Apply",
    body: "Answer a few questions about your child. It takes about 60 seconds.",
  },
  {
    n: "2",
    title: "Strategy call",
    body: "A free 30-minute call where we map the situation and tell you honestly what we'd do.",
  },
  {
    n: "3",
    title: "The plan",
    body: "You leave with a clear, prioritised plan for your child — whether or not we work together after.",
  },
];

const FAQS = [
  {
    q: "How much does this cost?",
    a: "Less than a year of private tutoring, and far less than the cost of the wrong university course or career path. We'll talk specifics on the call, once we both know it's a fit.",
  },
  {
    q: "Is this for my child or for me?",
    a: "Both. You make the decision; your child does the work. The call is with you; the plan is for them.",
  },
  {
    q: "My child already gets good grades — do we still need this?",
    a: "Grades matter less than they used to. This is about what comes after the grades: the skills, projects and choices that decide whether your child stands out in an AI-shaped market.",
  },
  {
    q: "What happens on the free call?",
    a: "We look at your child's current path and tell you honestly what we'd change. No pressure and no obligation — you leave with a clear next step either way.",
  },
  {
    q: "What ages do you work with?",
    a: "Years 9 to 13 (ages 13–18) — the window where subject and skill choices compound the most.",
  },
];

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <Section as="section" className="bg-white">
        <Container narrow>
          <div className="flex flex-col items-center gap-8 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-700">
              For parents of Year 9–13 students
            </span>

            <h1 className="max-w-3xl text-4xl font-extrabold text-ink sm:text-5xl lg:text-6xl">
              Give your teenager an unfair advantage in an AI-shaped world.
            </h1>

            <p className="max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
              Most careers advice was written before ChatGPT. We give you a
              clear, honest plan for the subjects, skills and choices that will
              still matter when your child enters the workforce.
            </p>

            <VideoEmbed />

            <div className="mt-2 flex flex-col gap-4 sm:flex-row">
              <Button href="/apply" size="lg">
                Apply for a free strategy call →
              </Button>
            </div>

            <p className="text-sm text-muted">
              Free 30-minute call · No obligation · A clear plan either way
            </p>
          </div>
        </Container>
      </Section>

      {/* Problem */}
      <Section className="bg-surface-alt">
        <Container narrow>
          <div className="flex flex-col gap-8">
            <h2 className="max-w-2xl text-3xl font-extrabold text-ink sm:text-4xl">
              The ground is shifting under your child&apos;s feet.
            </h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {PROBLEMS.map((p) => (
                <div
                  key={p}
                  className="rounded-2xl border border-brand-100 bg-white p-6 text-foreground leading-relaxed"
                >
                  {p}
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* What you get */}
      <Section className="bg-white">
        <Container>
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div className="flex flex-col gap-6">
              <h2 className="text-3xl font-extrabold text-ink sm:text-4xl">
                A clear plan, built around your child.
              </h2>
              <p className="text-lg leading-relaxed text-muted">
                We give parents a clear, honest picture of which skills and
                paths have staying power — and which ones don&apos;t — then turn
                it into something you can act on.
              </p>
              <ul className="flex flex-col gap-3">
                {OUTCOMES.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckIcon className="mt-1 h-5 w-5 shrink-0 text-brand-700" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-4 rounded-2xl border border-brand-100 bg-surface-alt p-8 shadow-xl">
              <p className="text-lg font-semibold leading-snug text-ink">
                &ldquo;Within one session, we had a clear plan. My son is now
                doing projects that will actually matter in five years — not
                just A-levels that AI can replace overnight.&rdquo;
              </p>
              <p className="text-sm font-medium text-muted">
                — Parent of a Year 12 student, Manchester
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* How it works */}
      <Section className="bg-surface-alt">
        <Container>
          <div className="flex flex-col gap-10">
            <h2 className="text-3xl font-extrabold text-ink sm:text-4xl">
              How it works
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              {STEPS.map((step) => (
                <div key={step.n} className="flex flex-col gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-950 font-extrabold text-white">
                    {step.n}
                  </span>
                  <h3 className="text-xl font-extrabold text-ink">
                    {step.title}
                  </h3>
                  <p className="leading-relaxed text-muted">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* Guarantee — replace with the conditional services guarantee when ready */}
      <Section tight className="bg-brand-950 text-white">
        <Container narrow>
          <div className="flex flex-col items-center gap-5 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-300">
              Our guarantee
            </span>
            <p className="max-w-2xl text-2xl font-extrabold leading-snug sm:text-3xl">
              Show up to your call and you&apos;ll leave with a clear, concrete
              next step for your child — or we&apos;ve wasted our time, not
              yours. The call is free either way.
            </p>
          </div>
        </Container>
      </Section>

      {/* Scarcity */}
      <Section tight className="bg-white">
        <Container narrow>
          <p className="text-center text-base leading-relaxed text-muted">
            We work with a limited number of families at a time, so every plan
            gets proper attention. If the calendar&apos;s open, you can book.
          </p>
        </Container>
      </Section>

      {/* FAQ */}
      <Section className="bg-surface-alt">
        <Container narrow>
          <div className="flex flex-col gap-8">
            <h2 className="text-3xl font-extrabold text-ink sm:text-4xl">
              Questions parents ask
            </h2>
            <div className="flex flex-col gap-3">
              {FAQS.map((faq) => (
                <details
                  key={faq.q}
                  className="group rounded-xl border border-brand-100 bg-white p-5"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-ink">
                    {faq.q}
                    <span className="ml-4 text-brand-700 transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 leading-relaxed text-muted">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* Final CTA */}
      <Section className="bg-brand-950 text-white">
        <Container narrow>
          <div className="flex flex-col items-center gap-8 text-center">
            <h2 className="text-3xl font-extrabold sm:text-4xl">
              Give your child a head start.
            </h2>
            <p className="max-w-lg text-lg leading-relaxed text-brand-200">
              Answer a few questions and book your free strategy call. We&apos;ll
              tell you honestly what we&apos;d do — no upsell, no fluff.
            </p>
            <Button
              href="/apply"
              size="lg"
              className="border-0 bg-white text-brand-950 hover:bg-brand-100"
            >
              Apply now →
            </Button>
            <p className="text-sm text-brand-300">
              Free 30-minute call · No obligation
            </p>
          </div>
        </Container>
      </Section>

      {/* Footer */}
      <footer className="bg-ink py-8 text-white/60">
        <Container>
          <div className="flex flex-col items-center justify-between gap-4 text-sm sm:flex-row">
            <span className="font-bold text-white">Stable Future</span>
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
  if (!VSL_URL) return null;
  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl shadow-2xl">
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

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}
