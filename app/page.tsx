import { Button } from "@/app/components/Button";
import { Container } from "@/app/components/Container";
import { Section } from "@/app/components/Section";

export default function Home() {
  return (
    <main>
      {/* Nav */}
      <header className="border-b border-brand-100 bg-white">
        <Container>
          <div className="flex h-16 items-center justify-between">
            <span className="text-lg font-extrabold tracking-tight text-brand-950">
              Stable Future
            </span>
            <Button href="#book" size="md">
              Book a Free Call
            </Button>
          </div>
        </Container>
      </header>

      {/* Hero */}
      <Section as="section" className="bg-white">
        <Container narrow>
          <div className="flex flex-col items-center text-center gap-8">
            {/* VSL placeholder */}
            <div className="w-full aspect-video bg-ink rounded-xl flex items-center justify-center shadow-2xl">
              <div className="flex flex-col items-center gap-3 text-white/60">
                <PlayIcon className="w-16 h-16" />
                <span className="text-sm font-medium uppercase tracking-widest">
                  Video coming soon
                </span>
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-ink max-w-2xl">
              Your teenager&apos;s career is already being disrupted by AI.
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-muted max-w-xl leading-relaxed">
              We help parents of Y10–13 students make confident decisions so
              their children land on the right side of the AI job market.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 mt-2">
              <Button href="#book" size="lg">
                Book a Free Strategy Call
              </Button>
              <Button href="/guide" variant="secondary" size="lg">
                Get the Free Guide
              </Button>
            </div>

            <p className="text-sm text-muted">
              No obligation. 30 minutes. Clarity guaranteed.
            </p>
          </div>
        </Container>
      </Section>

      {/* Social proof strip */}
      <Section tight className="bg-brand-950 text-white">
        <Container>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-10 text-center">
            <Stat number="87%" label="of jobs will be transformed by AI within 10 years" />
            <div className="hidden sm:block w-px h-12 bg-white/20" />
            <Stat number="Y10–13" label="the critical window to build future-proof skills" />
            <div className="hidden sm:block w-px h-12 bg-white/20" />
            <Stat number="Free" label="initial strategy call — no strings attached" />
          </div>
        </Container>
      </Section>

      {/* What we do */}
      <Section className="bg-surface-alt">
        <Container>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="flex flex-col gap-6">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-ink">
                We help your child become AI-proof — not AI-replaced.
              </h2>
              <p className="text-lg text-muted leading-relaxed">
                Most careers advice for teenagers was written before ChatGPT
                existed. We give parents a clear, honest picture of which skills
                and paths have staying power — and which ones don&apos;t.
              </p>
              <ul className="flex flex-col gap-3">
                {[
                  "Personalised assessment of your child's current trajectory",
                  "Subject and course choices that hold their value",
                  "Practical AI skills that employers actually want",
                  "A concrete 6-month action plan you can start this week",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckIcon className="mt-1 w-5 h-5 text-brand-700 shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col gap-4 border border-brand-100">
              <p className="text-lg font-semibold text-ink leading-snug">
                &ldquo;Within one session, we had a clear plan. My son is now
                doing projects that will actually matter in five years — not
                just A-levels that AI can replace overnight.&rdquo;
              </p>
              <p className="text-sm text-muted font-medium">— Parent of a Year 12 student, Manchester</p>
            </div>
          </div>
        </Container>
      </Section>

      {/* Book a call */}
      <Section id="book" className="bg-brand-950 text-white">
        <Container narrow>
          <div className="flex flex-col items-center text-center gap-8">
            <h2 className="text-3xl sm:text-4xl font-extrabold">
              Book your free 30-minute strategy call
            </h2>
            <p className="text-lg text-brand-200 max-w-lg leading-relaxed">
              We&apos;ll look at your child&apos;s current path and tell you honestly
              what we think. No upsell. No fluff.
            </p>
            {/* Booking embed placeholder */}
            <div className="w-full max-w-md bg-white/10 border border-white/20 rounded-xl p-8 flex flex-col items-center gap-4">
              <p className="text-sm text-brand-200 uppercase tracking-widest font-medium">
                Booking calendar
              </p>
              <p className="text-white/60 text-sm text-center">
                Calendly / TidyCal embed goes here.
                <br />
                Replace this placeholder with your booking link.
              </p>
              <Button
                href="#"
                size="lg"
                className="bg-white text-brand-950 hover:bg-brand-100 border-0"
              >
                Schedule Now →
              </Button>
            </div>
          </div>
        </Container>
      </Section>

      {/* Footer */}
      <footer className="bg-ink text-white/60 py-8">
        <Container>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
            <span className="font-bold text-white">Stable Future</span>
            <span>© {new Date().getFullYear()} Stable Future. All rights reserved.</span>
          </div>
        </Container>
      </footer>
    </main>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-3xl font-extrabold text-white">{number}</span>
      <span className="text-brand-300 text-sm max-w-[160px]">{label}</span>
    </div>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14Z" />
    </svg>
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
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 12.75l6 6 9-13.5"
      />
    </svg>
  );
}
