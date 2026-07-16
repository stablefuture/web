"use client";

import { useActionState, useState } from "react";
import { Container } from "@/app/components/Container";
import { Section } from "@/app/components/Section";
import { Button } from "@/app/components/Button";
import { submitApplication } from "@/app/actions/leads";
import type { LeadResult } from "@/app/actions/leads";
import { BOOKING_URL } from "@/app/config";

type Step = {
  id: string;
  question: string;
  options: string[];
};

const STEPS: Step[] = [
  {
    id: "year",
    question: "What year is your child in?",
    options: ["Year 9", "Year 10", "Year 11", "Year 12", "Year 13"],
  },
  {
    id: "worry",
    question: "What worries you most right now?",
    options: [
      "Choosing the right subjects or path",
      "Whether their plan survives AI",
      "They're drifting — no real direction",
      "Falling behind their peers",
    ],
  },
  {
    id: "direction",
    question: "How clear is their direction today?",
    options: ["They have a clear plan", "They have some idea", "No idea yet"],
  },
  {
    id: "readiness",
    question:
      "If we handed you a concrete plan, are you ready to act this year?",
    options: [
      "Yes — ready to invest in getting this right",
      "Maybe — I'd need to see it first",
      "Just exploring for now",
    ],
  },
];

const initialState: LeadResult | null = null;

export default function ApplyPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [contactName, setContactName] = useState("");
  const [state, formAction, isPending] = useActionState(
    submitApplication,
    initialState
  );

  function choose(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setStep((s) => s + 1);
  }

  const onContactStep = step === STEPS.length;
  // Progress fills to 100% by the contact/submit screen: divide by the number
  // of questions, so the contact step (step === STEPS.length) reads full.
  const progress = Math.round((step / STEPS.length) * 100);

  return (
    <main className="min-h-screen bg-surface-alt">
      <header className="border-b border-border-soft bg-background">
        <Container>
          <div className="flex h-16 items-center justify-between">
            <a
              href="/"
              className="text-lg font-extrabold tracking-tight text-ink"
            >
              Stable Future
            </a>
            <span className="text-sm text-muted">Takes 60 seconds</span>
          </div>
        </Container>
      </header>

      <Section className="bg-surface-alt">
        <Container narrow>
          <div className="mx-auto w-full max-w-xl">
            {/* Progress */}
            <div className="mb-10 h-1.5 w-full overflow-hidden rounded-full bg-border-soft">
              <div
                className="h-full rounded-full bg-accent-strong transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            {state?.ok ? (
              <Confirmation name={contactName} />
            ) : onContactStep ? (
              <div className="flex flex-col gap-6">
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="self-start text-sm font-medium text-muted hover:text-ink"
                >
                  ← Back
                </button>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-ink">
                  Last step — where do we send your next steps?
                </h1>
                <p className="text-muted leading-relaxed">
                  We&apos;ll review your answers and get you booked in for a free
                  strategy call. No obligation.
                </p>
                <form action={formAction} className="flex flex-col gap-4">
                  <input
                    type="hidden"
                    name="answers"
                    value={JSON.stringify(answers)}
                  />
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="name"
                      className="text-sm font-semibold text-ink"
                    >
                      Your first name
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      placeholder="Jane"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="h-12 w-full rounded-md border border-border-soft bg-background px-4 text-base text-ink placeholder:text-muted focus:border-transparent focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="email"
                      className="text-sm font-semibold text-ink"
                    >
                      Email address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      className="h-12 w-full rounded-md border border-border-soft bg-background px-4 text-base text-ink placeholder:text-muted focus:border-transparent focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  {state && !state.ok && (
                    <p className="text-sm text-red-600" aria-live="polite">
                      {state.error}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={isPending}
                    className="mt-2 h-14 w-full rounded-md bg-accent-strong text-lg font-bold text-on-accent transition-all hover:bg-accent disabled:opacity-60"
                  >
                    {isPending ? "Submitting…" : "Submit application"}
                  </button>
                  <p className="text-center text-xs text-muted">
                    We&apos;ll never share your details. Unsubscribe anytime.
                  </p>
                </form>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {step > 0 && (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s - 1)}
                    className="self-start text-sm font-medium text-muted hover:text-ink"
                  >
                    ← Back
                  </button>
                )}
                <h1 className="text-3xl sm:text-4xl font-extrabold text-ink">
                  {STEPS[step].question}
                </h1>
                <div className="flex flex-col gap-3">
                  {STEPS[step].options.map((option) => {
                    const selected = answers[STEPS[step].id] === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => choose(STEPS[step].id, option)}
                        className={`w-full rounded-xl border-2 px-5 py-4 text-left text-base font-medium transition-all ${
                          selected
                            ? "border-accent-strong bg-surface-alt text-ink"
                            : "border-border-soft bg-background text-ink hover:border-accent"
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </Container>
      </Section>
    </main>
  );
}

function Confirmation({ name }: { name?: string }) {
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/15">
        <CheckIcon className="h-7 w-7 text-accent" />
      </div>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-ink">
        {name ? `Thank you, ${name}.` : "Application received."}
      </h1>
      {BOOKING_URL ? (
        <>
          <p className="max-w-md text-muted leading-relaxed">
            Your application is in. Book your free strategy call now and
            we&apos;ll review your answers before we speak.
          </p>
          <Button href={BOOKING_URL} size="lg" className="mt-2">
            Book your call →
          </Button>
        </>
      ) : (
        <p className="max-w-md text-muted leading-relaxed">
          Your application is in. We&apos;ll review your answers and email you
          within one working day to arrange your free strategy call.
        </p>
      )}
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}
