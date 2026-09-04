import { Checker } from "@/app/checker/Checker";
import { Container } from "@/app/components/Container";
import { Section } from "@/app/components/Section";

export const metadata = {
  title: "Career checker | Check your career path against AI",
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
            <h1 className="max-w-3xl text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Check your <span className="text-accent-strong">career path</span> against{" "}
              <span className="text-accent-strong">AI</span>
            </h1>
            <Checker />
          </div>
        </Container>
      </Section>
    </main>
  );
}
