import { Container } from "@/app/components/Container";
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
      <section className="pb-8 pt-4 lg:pb-12 lg:pt-6">
        <Container>
          <Destinations />
        </Container>
      </section>
    </main>
  );
}
