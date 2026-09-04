import { Checker } from "@/app/checker/Checker";
import { Container } from "@/app/components/Container";
import { Section } from "@/app/components/Section";

export const metadata = {
  title: "Career checker | Check any career against AI",
  description:
    "Search any UK job, degree or apprenticeship. See how much of the work AI could learn to do, how likely employers are to replace people, and the pay, openings and competition behind it.",
  alternates: { canonical: "/checker" },
};

export default function CheckerPage() {
  return (
    <main>
      <Section as="section">
        <Container>
          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-4">
              <h1 className="max-w-3xl text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                Check any career against AI
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-muted">
                Search a job, degree or apprenticeship. We score how much of the
                work AI could learn to do, and how likely employers are to
                replace people with it. Then we show the pay, openings and
                competition behind it.
              </p>
            </div>
            <Checker />
          </div>
        </Container>
      </Section>
    </main>
  );
}
