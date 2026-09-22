"use client";

import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/app/components/Button";

const TO = "ben@stablefuture.uk";

const OPTIONS = [
  {
    id: "school",
    label: "I know a school",
    subject: "Introduction to a school that may want careers advice",
    body: `Hi Ben,

I know a school that may value Stable Future's careers advice.

School:
Best contact:
The best way to contact them:
A little context:

Thanks,`,
  },
  {
    id: "family",
    label: "I know a family",
    subject: "Introduction to a family who may want careers advice",
    body: `Hi Ben,

I know a family who may value Stable Future's careers advice.

Their name:
The best way to contact them:
A little context:

Thanks,`,
  },
  {
    id: "my-family",
    label: "My family / children",
    subject: "Careers advice for my family or children",
    body: `Hi Ben,

I'd like to hear how Stable Future could help my family or children.

Their age or school year:
What we would like help with:
A little context:

Thanks,`,
  },
] as const;

type TalkOption = (typeof OPTIONS)[number];

export function TalkForm() {
  const [selected, setSelected] = useState<TalkOption>(OPTIONS[0]);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string>(OPTIONS[0].body);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const emailLink = useMemo(
    () =>
      `mailto:${TO}?subject=${encodeURIComponent(selected.subject)}&body=${encodeURIComponent(message)}`,
    [message, selected.subject],
  );

  function choose(option: TalkOption) {
    setSelected(option);
    setMessage(option.body);
    setStatus("idle");
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");

    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/talk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          message,
          subject: selected.subject,
          website: form.get("website"),
        }),
      });

      setStatus(response.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col gap-7">
      <div className="grid gap-3 sm:grid-cols-3" aria-label="Choose a message draft">
        {OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => choose(option)}
            aria-pressed={selected.id === option.id}
            className={`rounded-md border-2 px-4 py-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              selected.id === option.id
                ? "border-accent-strong bg-accent-strong text-on-accent"
                : "border-border-soft text-ink hover:border-accent-strong"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <form onSubmit={send} className="flex flex-col gap-5 rounded-md border border-border-soft bg-surface-alt p-5 sm:p-7">
        <div className="hidden" aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <label className="flex flex-col gap-2 text-sm font-bold text-ink">
          Your email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="rounded-md border border-border-soft bg-background px-4 py-3 font-normal text-ink outline-none focus:border-accent-strong focus:ring-2 focus:ring-accent"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-bold text-ink">
          Your message
          <textarea
            required
            rows={12}
            maxLength={5000}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="resize-y rounded-md border border-border-soft bg-background px-4 py-3 font-normal leading-relaxed text-ink outline-none focus:border-accent-strong focus:ring-2 focus:ring-accent"
          />
        </label>

        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <Button type="submit" size="lg" disabled={status === "sending"}>
            {status === "sending" ? "Sending…" : "Send to Ben"}
          </Button>
          <a className="text-sm font-bold text-accent-strong underline underline-offset-4" href={emailLink}>
            Open in my email app instead
          </a>
        </div>

        <div aria-live="polite" className="min-h-6 text-sm text-muted">
          {status === "sent" && "Thanks — your message has reached Ben."}
          {status === "error" && "That did not send. Please use the email link instead."}
        </div>
      </form>
    </div>
  );
}
