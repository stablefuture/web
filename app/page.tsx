import { Checker } from "@/app/checker/Checker";
import { Container } from "@/app/components/Container";
import { Section } from "@/app/components/Section";
import { Wordmark } from "@/app/components/Logo";

export default function Home() {
  return (
    <main>
      {/* Logo sits inline with the fixed ThemeToggle (top-right, in layout). */}
      <Wordmark className="fixed left-6 top-6 z-50 h-8 text-ink" />

      {/* Hero + checker */}
      <Section as="section">
        <Container>
          <div className="flex flex-col gap-8">
            <div className="flex flex-col items-center gap-5 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-accent-strong">
                If you're thinking about early careers...
              </span>
              <h1 className="max-w-3xl text-4xl font-extrabold uppercase leading-[0.95] tracking-tight text-ink sm:text-5xl lg:text-6xl">
                is that path{" "}
                <span className="inline-block bg-accent px-3 py-0.5 text-on-accent">
                  future-proof?
                </span>
              </h1>
            </div>

            <p className="mx-auto max-w-xl text-center text-lg leading-relaxed text-muted">
              Search any job, degree or apprenticeship. See its pay, openings,
              competition and AI exposure from real UK data, not opinion.
            </p>

            <Checker />
          </div>
        </Container>
      </Section>
    </main>
  );
}
