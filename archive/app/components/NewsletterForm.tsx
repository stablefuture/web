"use client";

import { useActionState } from "react";
import {
  subscribeToNewsletter,
  type NewsletterResult,
} from "@/app/actions/newsletter";

const initialState: NewsletterResult | null = null;

export function NewsletterForm({
  source = "newsletter",
  submitLabel = "Join",
  note = "Unsubscribe anytime.",
}: {
  source?: string;
  submitLabel?: string;
  note?: string;
}) {
  const [state, formAction, isPending] = useActionState(
    subscribeToNewsletter,
    initialState
  );

  if (state?.ok) {
    return (
      <p className="text-sm text-ink" aria-live="polite">
        Almost there — check your inbox to confirm your subscription.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex w-full max-w-md flex-col gap-2">
      <input type="hidden" name="source" value={source} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          aria-label="Email address"
          className="h-12 w-full rounded-md border border-border-soft bg-background px-4 text-base text-ink placeholder:text-muted focus:border-transparent focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          type="submit"
          disabled={isPending}
          className="h-12 shrink-0 rounded-md bg-accent-strong px-6 font-bold text-on-accent transition-all hover:bg-accent disabled:opacity-60"
        >
          {isPending ? "…" : submitLabel}
        </button>
      </div>
      {state && !state.ok && (
        <p className="text-sm text-red-600" aria-live="polite">
          {state.error}
        </p>
      )}
      <p className="text-xs text-muted">{note}</p>
    </form>
  );
}
