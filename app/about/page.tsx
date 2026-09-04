import { Container } from "@/app/components/Container";
import { Section } from "@/app/components/Section";

export const metadata = {
  title: "About | Stable Future",
  description:
    "Why Stable Future exists, who builds it, and how we help parents guide teenagers towards work that lasts through the AI transition.",
  alternates: { canonical: "/about" },
};

export default function About() {
  return (
    <main>
      <Section as="section">
        <Container narrow>
          <div className="flex flex-col gap-10">
            <header className="flex flex-col gap-4">
              <span className="text-xs font-bold uppercase tracking-widest text-accent-strong">
                About
              </span>
              <h1 className="text-4xl font-extrabold uppercase leading-[0.95] tracking-tight text-ink sm:text-5xl">
                Preparing young people for the AI job market
              </h1>
              <p className="text-lg leading-relaxed text-muted">
                Stable Future is an AI advisory service for parents and students. 
                We use labour market research to help families
                choose paths that remain stable as AI reshapes entry-level work.
              </p>
            </header>

            <section className="flex flex-col gap-4">
              <h2 className="text-2xl font-extrabold tracking-tight text-ink">
                Why we exist
              </h2>
              <div className="flex flex-col gap-4 text-base leading-relaxed text-muted">
                <p>
                  AI will affect entry-level work first. There is already early evidence of this.
                  Junior roles often involve structured, reviewable tasks
                  current models handle well. AI also has a lot of the codified knowledge and reasoning
                  students gain in schools and university, but not much of the experiential knowledge 
                  gained with years of experience.
                </p>
                <p>
                  Meanwhile, the advice available to families has not moved.
                  Careers guidance still leans on interest questionnaires and
                  reputation, neither of which inform them about how the
                  labour market and the world of work is changing. A student can do
                  everything right and still walk into a shrinking field.
                </p>
                <p>
                  We think the best way to tackle this problem is with research: take the best data,
                  analyse it, and make it available to everyone. 
                  That is what the{" "}
                  <a
                    href="/checker"
                    className="underline underline-offset-4 hover:text-ink"
                  >
                    career checker
                  </a>{" "}
                  does.
                </p>
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <h2 className="text-2xl font-extrabold tracking-tight text-ink">
                How we work
              </h2>
              <div className="flex flex-col gap-4 text-base leading-relaxed text-muted">
                <p>
                  We publish our sources and our assumptions, including the ones
                  that weaken our conclusions. Every forecast is logged with its
                  date and model version so it can be scored later against what
                  actually happened. We use this to improve our models over time.
                </p>
                <p>
                  We also avoid fear-mongering. Without a doubt, the AI transition will be
                  disruptive. But disruption is not the same as total collapse, and
                  panic makes for bad decisions.
                </p>
              </div>
            </section>

            <section className="flex flex-col gap-6">
              <h2 className="text-2xl font-extrabold tracking-tight text-ink">
                Who we are
              </h2>
              <div className="grid gap-10 sm:grid-cols-[13rem_1fr] sm:items-start">
                <figure className="mx-auto w-56 sm:mx-0 sm:w-full">
                  <div className="relative">
                    {/* Offset accent block behind the photo, so it sits on the
                        page rather than in it. */}
                    <div aria-hidden className="absolute inset-0 -translate-x-3 -translate-y-3 rounded-2xl bg-accent/20" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/ben-grime.jpg"
                      alt="Ben Grime"
                      width={797}
                      height={900}
                      className="relative w-full rounded-2xl"
                    />
                  </div>
                  <figcaption className="mt-4 text-sm leading-snug">
                    <span className="block font-semibold text-ink">Ben Grime</span>
                    <span className="text-muted">Founder</span>
                  </figcaption>
                </figure>
                <div className="flex flex-col gap-4 text-base leading-relaxed text-muted">
                  <p>
                    Stable Future was founded by Ben Grime, an AI consultant based in
                    the UK with a BA in Maths and Philosophy and an MSc in
                    Data Science.
                  </p>
                  <p>
                    After two years as an AI Engineer, Ben left to work on the
                    problems society will face in the AI era.
                  </p>
                </div>
              </div>
            </section>

            <section className="border-t border-border-soft pt-8">
              <a
                href="/checker"
                className="text-sm text-muted underline underline-offset-4 hover:text-ink"
              >
                ← Back to the checker
              </a>
            </section>
          </div>
        </Container>
      </Section>
    </main>
  );
}
