import { Container } from "@/app/components/Container";
import { Section } from "@/app/components/Section";
import { TalkForm } from "./TalkForm";

export const metadata = {
  title: "Make an introduction | Stable Future",
  description:
    "Introduce a school or family, or ask for advice for your own family.",
  alternates: { canonical: "/talk" },
};

export default function TalkPage() {
  return (
    <main>
      <Section as="section" className="min-h-[70vh]">
        <Container narrow>
          <div className="flex flex-col gap-8">
            <header className="flex flex-col gap-4 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-accent-strong">
                Let&apos;s talk
              </p>
              <h1 className="text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
                How can we help?
              </h1>
              <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted">
                Choose an option, edit the draft, and send it straight to Ben.
              </p>
            </header>

            <TalkForm />
          </div>
        </Container>
      </Section>
    </main>
  );
}
