import type { Metadata } from "next";
import { Outreach } from "@/app/outreach/Outreach";
import { Container } from "@/app/components/Container";
import { Section } from "@/app/components/Section";
import { Wordmark } from "@/app/components/Logo";

export const metadata: Metadata = {
  title: "Work experience outreach — Stable Future",
  description:
    "Write a message that gets your teen work experience, an insight day or an apprenticeship — real, personalised outreach, not a job board.",
};

export default function OutreachPage() {
  return (
    <main>
      {/* Hero + tool */}
      <Section as="section">
        <Container>
          <div className="flex flex-col gap-8">
            <div className="flex flex-col items-center gap-5 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-accent-strong">
                Your applications toolkit
              </span>
              <h1 className="max-w-3xl text-4xl font-extrabold uppercase leading-[0.95] tracking-tight text-ink sm:text-5xl lg:text-6xl">
                Land the experience{" "}
                <span className="inline-block bg-accent px-3 py-0.5 text-on-accent">
                  no one advertises
                </span>
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
                You know the direction you&apos;re heading. Now go get the
                real-world experience. Tell us who you&apos;re approaching and
                we&apos;ll help you write a message that gets a yes.
              </p>
            </div>

            <Outreach />
          </div>
        </Container>
      </Section>

      {/* Safeguarding note */}
      <Section as="section" tight className="border-t border-border-soft bg-surface-alt">
        <Container narrow>
          <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-muted">
            Nothing here is sent for you. The message is written for you to check
            and send yourself. Only contact places you and a parent have researched
            together, and always have a parent read it before it goes.
          </p>
        </Container>
      </Section>

      <footer className="border-t border-border-soft bg-background py-8 text-muted">
        <Container>
          <div className="flex flex-col items-center justify-between gap-4 text-sm sm:flex-row">
            <Wordmark className="h-7 text-ink" />
            <span>© {new Date().getFullYear()} Stable Future. All rights reserved.</span>
          </div>
        </Container>
      </footer>
    </main>
  );
}
