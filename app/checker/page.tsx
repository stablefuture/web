import { Board } from "@/app/checker/Board";
import { Container } from "@/app/components/Container";
import { Section } from "@/app/components/Section";

export const metadata = {
  title: "Career checker | Check how AI impacts your career path",
  description:
    "Every apprenticeship, degree and job in the UK, scored on how much of the work AI could learn to do and how likely employers are to replace it.",
  alternates: { canonical: "/checker" },
};

export default function CheckerPage() {
  return (
    <main>
      <Section as="section">
        <Container>
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <h1 className="max-w-3xl text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                Check how AI impacts your career path
              </h1>
              <div className="flex max-w-2xl flex-col gap-3 text-lg leading-relaxed text-muted">
                <p>Two things decide whether AI replaces a worker:</p>
                <ol className="flex list-decimal flex-col gap-2 pl-6 marker:font-semibold marker:text-ink">
                  <li>
                    <strong className="font-semibold text-ink">AI Learnability</strong>:
                    how much of the work could AI learn to do?
                  </li>
                  <li>
                    <strong className="font-semibold text-ink">Substitution</strong>:
                    what&rsquo;s the practical likelihood that employers replace
                    workers with AI?
                  </li>
                </ol>
              </div>
            </div>
            <Board />
          </div>
        </Container>
      </Section>
    </main>
  );
}
