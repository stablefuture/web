import { Container } from "@/app/components/Container";
import { Section } from "@/app/components/Section";
import { Destinations } from "@/app/destinations/Destinations";

export const metadata = {
  title: "Where graduates end up | Stable Future",
  description:
    "Pick a degree subject and see what it pays one to ten years on, which industries hire its graduates, what kind of jobs they take, and how exposed those jobs are to AI.",
  alternates: { canonical: "/destinations" },
};

export default function DestinationsPage() {
  return (
    <main>
      <Section as="section">
        <Container>
          <div className="flex flex-col gap-10">
            <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Where graduates actually end up
            </h1>
            <Destinations />
          </div>
        </Container>
      </Section>
    </main>
  );
}
