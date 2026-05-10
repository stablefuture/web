"use client";

import { useActionState } from "react";
import { Button } from "@/app/components/Button";
import { Container } from "@/app/components/Container";
import { Section } from "@/app/components/Section";
import { captureEmail } from "@/app/actions/leads";
import type { LeadResult } from "@/app/actions/leads";

const BENEFITS = [
  "The 5 skills that will still be valued in 2030 — and the ones that won't",
  "Which A-level and GCSE subjects genuinely signal intelligence to employers",
  "How to use AI as a learning accelerator, not a shortcut",
  "A 6-month action plan you can start this week",
  "What universities and top employers are actually looking for right now",
];

const initialState: LeadResult | null = null;

export default function GuidePage() {
  const [state, formAction, isPending] = useActionState(captureEmail, initialState);

  return (
    <main>
      <header className="border-b border-brand-100 bg-white">
        <Container>
          <div className="flex h-16 items-center justify-between">
            <a href="/" className="text-lg font-extrabold tracking-tight text-brand-950">
              Stable Future
            </a>
            <Button href="/#book" size="md">
              Book a Free Call
            </Button>
          </div>
        </Container>
      </header>

      <Section className="bg-white">
        <Container narrow>
          <div className="grid lg:grid-cols-2 gap-14 items-start">
            {/* Left col: pitch */}
            <div className="flex flex-col gap-6">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-700">
                Free guide
              </span>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-ink">
                Is your teenager actually prepared for the AI job market?
              </h1>
              <p className="text-lg text-muted leading-relaxed">
                Download our free 20-page guide and get a clear picture of
                what&apos;s changing, what matters, and what your child can do
                right now.
              </p>
              <ul className="flex flex-col gap-3 mt-2">
                {BENEFITS.map((b) => (
                  <li key={b} className="flex items-start gap-3">
                    <CheckIcon className="mt-1 w-5 h-5 text-brand-700 shrink-0" />
                    <span className="text-foreground text-sm">{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right col: form */}
            <div className="bg-surface-alt border border-brand-100 rounded-2xl p-8 flex flex-col gap-6">
              {state?.ok ? (
                <ThankYou />
              ) : (
                <>
                  <h2 className="text-2xl font-extrabold text-ink">
                    Get the free guide
                  </h2>
                  <p className="text-muted text-sm">
                    Enter your email and we&apos;ll send it straight over.
                    No spam, ever.
                  </p>
                  <form action={formAction} className="flex flex-col gap-4">
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
                        className="h-11 w-full rounded-md border border-brand-200 px-4 text-base text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-950 focus:border-transparent"
                      />
                    </div>
                    {state && !state.ok && (
                      <p className="text-sm text-red-600">{state.error}</p>
                    )}
                    <button
                      type="submit"
                      disabled={isPending}
                      className="h-12 w-full rounded-md bg-brand-950 text-white font-bold text-base hover:bg-brand-900 transition-all disabled:opacity-60"
                    >
                      {isPending ? "Sending…" : "Send me the guide →"}
                    </button>
                    <p className="text-xs text-muted text-center">
                      We&apos;ll never share your email with anyone.
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </Container>
      </Section>

      <footer className="bg-ink text-white/60 py-8">
        <Container>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
            <span className="font-bold text-white">Stable Future</span>
            <span>© {new Date().getFullYear()} Stable Future. All rights reserved.</span>
          </div>
        </Container>
      </footer>
    </main>
  );
}

function ThankYou() {
  return (
    <div className="flex flex-col items-center text-center gap-4 py-4">
      <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center">
        <CheckIcon className="w-6 h-6 text-brand-700" />
      </div>
      <h2 className="text-2xl font-extrabold text-ink">Guide on its way!</h2>
      <p className="text-muted text-sm max-w-xs">
        Check your inbox in the next few minutes. While you wait —
      </p>
      <Button href="/#book" size="md" className="mt-2">
        Book a free strategy call
      </Button>
      {/* Placeholder download link — replace with real asset URL */}
      <a
        href="#"
        className="text-sm text-brand-700 underline underline-offset-2 hover:text-brand-950"
      >
        Download now (placeholder)
      </a>
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
