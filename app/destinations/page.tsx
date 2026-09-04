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
      <section className="pb-12 pt-6 lg:pb-16 lg:pt-8">
        <Container>
          <div className="flex flex-col gap-6">
            <h1 className="text-center text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Where <span className="text-accent-strong">graduates</span> actually end up
            </h1>
            <Destinations />
          </div>
        </Container>
      </section>
    </main>
  );
}
