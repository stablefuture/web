"use client";

import { useState, type ChangeEvent, type ReactNode } from "react";
import { draftOutreach } from "@/app/actions/outreach";

// ---- shape -----------------------------------------------------------------
type Goal =
  | "work_experience"
  | "insight_day"
  | "weekend_job"
  | "apprenticeship"
  | "volunteering";

type Form = {
  goal: Goal;
  name: string;
  year: string;
  school: string;
  sector: string;
  org: string;
  person: string;
  reason: string;
  about: string;
  availability: string;
  email: string;
};

const EMPTY: Form = {
  goal: "work_experience",
  name: "",
  year: "",
  school: "",
  sector: "",
  org: "",
  person: "",
  reason: "",
  about: "",
  availability: "",
  email: "",
};

// ---- copy tables (keyed on the ask) ----------------------------------------
const GOALS: { id: Goal; label: string }[] = [
  { id: "work_experience", label: "Work experience" },
  { id: "insight_day", label: "Insight / shadow day" },
  { id: "weekend_job", label: "Weekend or holiday job" },
  { id: "apprenticeship", label: "Apprenticeship enquiry" },
  { id: "volunteering", label: "Volunteering" },
];

const ASK: Record<Goal, string> = {
  work_experience: "a short work experience placement with your team",
  insight_day: "an insight day, or the chance to shadow someone for a day",
  weekend_job: "any weekend or holiday work you might have",
  apprenticeship: "a short chat about apprenticeship routes into your field",
  volunteering: "any volunteering I could help with",
};

const SUBJECT_TOPIC: Record<Goal, string> = {
  work_experience: "work experience enquiry",
  insight_day: "insight day enquiry",
  weekend_job: "weekend / holiday work",
  apprenticeship: "apprenticeship enquiry",
  volunteering: "volunteering enquiry",
};

const FOLLOW_TOPIC: Record<Goal, string> = {
  work_experience: "work experience",
  insight_day: "an insight or shadow day",
  weekend_job: "weekend or holiday work",
  apprenticeship: "apprenticeship routes",
  volunteering: "volunteering",
};

const CHECKLIST = [
  "Ask a parent to read it before you send.",
  "Double-check the name and email of the person you're writing to.",
  "Send from a sensible address — firstname.lastname, not a nickname.",
  "Attach your CV if you have one, or offer to send it.",
  "Keep it this short. Shorter messages get read.",
  "Give it a week, then send the follow-up once. Don't chase more than that.",
];

// ---- template engine -------------------------------------------------------
function subjectLine(f: Form): string {
  const who = f.year ? `Year ${f.year} student` : "Student";
  const tail = f.sector.trim() ? ` (${f.sector.trim()})` : "";
  return `${who} — ${SUBJECT_TOPIC[f.goal]}${tail}`;
}

function greetingFor(f: Form): string {
  return f.person.trim() ? `Dear ${f.person.trim()},` : "Hello,";
}

function emailBody(f: Form): string {
  const name = f.name.trim() || "[your name]";
  const who = f.year ? `a Year ${f.year} student` : "a student";
  const school = f.school.trim() ? ` at ${f.school.trim()}` : "";
  const sector = f.sector.trim() || "[your field]";
  const ask =
    f.goal === "apprenticeship" && f.sector.trim()
      ? `a short chat about apprenticeship routes into ${f.sector.trim()}`
      : ASK[f.goal];

  const paras = [
    `My name is ${name} and I'm ${who}${school}. I'm really interested in ${sector}, and I'm writing to ask whether you'd consider offering me ${ask}.`,
    `I'm reaching out to ${f.org.trim() || "you"} in particular because ${
      f.reason.trim() || "[one specific reason you chose them]"
    }.`,
    f.about.trim() ? `A little about me: ${f.about.trim()}.` : "",
    `I'm available ${
      f.availability.trim() || "[when you're free]"
    } and happy to fit around whatever suits you — even a single day or a short call would mean a great deal.`,
    "Thank you for taking the time to read this. I'd gladly send my CV or any other details you need.",
  ].filter(Boolean);

  const signoff = `Kind regards,\n${name}${f.email.trim() ? `\n${f.email.trim()}` : ""}`;
  return `${greetingFor(f)}\n\n${paras.join("\n\n")}\n\n${signoff}`;
}

function followUp(f: Form): string {
  const name = f.name.trim() || "[your name]";
  return `${greetingFor(f)}\n\nI wrote to you last week about ${FOLLOW_TOPIC[f.goal]} and know how busy things get, so this is just a gentle nudge. I'm still very keen, and happy to work around whatever is easiest for you.\n\nThank you,\n${name}`;
}

// ---- small local helpers ---------------------------------------------------
const INPUT =
  "w-full rounded-xl border border-border-soft bg-surface-alt px-4 py-3 text-ink outline-none transition focus:border-accent-strong focus:ring-2 focus:ring-accent/40";

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-bold text-ink">
        {label}
        {required && <span className="text-accent-strong"> *</span>}
      </span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}

function PreviewCard({
  title,
  onCopy,
  copied,
  children,
}: {
  title: string;
  onCopy: () => void;
  copied: boolean;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border-soft bg-background p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold uppercase tracking-wide text-muted">{title}</h3>
        <button
          type="button"
          onClick={onCopy}
          className="rounded-md border border-accent-strong px-3 py-1.5 text-xs font-bold text-accent-strong transition hover:bg-accent-strong/10"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
      {children}
    </div>
  );
}

// ---- tool ------------------------------------------------------------------
type AiDraft = { subject: string; email: string; followUp: string };

export function Outreach() {
  const [f, setF] = useState<Form>(EMPTY);
  const [copied, setCopied] = useState<string>("");
  const [ai, setAi] = useState<AiDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Any change to the inputs invalidates the AI draft — fall back to the live
  // template so the preview never shows a draft that no longer matches the form.
  const patch = (p: Partial<Form>) => {
    setF((s) => ({ ...s, ...p }));
    setAi(null);
    setErr("");
  };
  const set =
    (k: keyof Form) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      patch({ [k]: e.target.value } as Partial<Form>);

  const copy = (key: string, text: string) => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(text).then(
      () => {
        setCopied(key);
        setTimeout(() => setCopied(""), 1800);
      },
      () => {}
    );
  };

  const canWrite = f.name.trim() !== "" && f.sector.trim() !== "" && f.reason.trim() !== "";
  const writeWithAI = async () => {
    if (!canWrite || loading) return;
    setLoading(true);
    setErr("");
    const r = await draftOutreach(f);
    setLoading(false);
    if (r.ok) setAi({ subject: r.subject, email: r.email, followUp: r.followUp });
    else setErr(r.error);
  };

  const subject = ai?.subject ?? subjectLine(f);
  const body = ai?.email ?? emailBody(f);
  const nudge = ai?.followUp ?? followUp(f);

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
      {/* FORM */}
      <form className="flex flex-col gap-5" onSubmit={(e) => e.preventDefault()}>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-bold text-ink">What are you asking for?</legend>
          <div className="flex flex-wrap gap-2">
            {GOALS.map((g) => {
              const on = f.goal === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => patch({ goal: g.id })}
                  aria-pressed={on}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    on
                      ? "border-accent-strong bg-accent-strong text-on-accent"
                      : "border-border-soft bg-surface-alt text-muted hover:border-accent-strong/50 hover:text-ink"
                  }`}
                >
                  {g.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <Field label="Your name" required>
          <input className={INPUT} value={f.name} onChange={set("name")} placeholder="e.g. Amara Okafor" />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="School year">
            <select className={INPUT} value={f.year} onChange={set("year")}>
              <option value="">Prefer not to say</option>
              <option value="10">Year 10</option>
              <option value="11">Year 11</option>
              <option value="12">Year 12</option>
              <option value="13">Year 13</option>
            </select>
          </Field>
          <Field label="School (optional)">
            <input className={INPUT} value={f.school} onChange={set("school")} placeholder="e.g. Manchester Grammar" />
          </Field>
        </div>

        <Field label="Field you're interested in" required>
          <input
            className={INPUT}
            value={f.sector}
            onChange={set("sector")}
            placeholder="e.g. architecture, veterinary, software"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Who you're writing to">
            <input className={INPUT} value={f.org} onChange={set("org")} placeholder="e.g. Foster + Partners" />
          </Field>
          <Field label="Named person (if you have one)">
            <input className={INPUT} value={f.person} onChange={set("person")} placeholder="e.g. Ms Patel" />
          </Field>
        </div>

        <Field
          label="Why this place? One specific reason"
          required
          hint="This is what turns a template into a real message. What do you admire, or why them?"
        >
          <input
            className={INPUT}
            value={f.reason}
            onChange={set("reason")}
            placeholder="e.g. I loved your Bloomberg building and want to learn how you design for sustainability"
          />
        </Field>

        <Field label="One relevant thing you've done (optional)" hint="A project, subject, club or prior experience.">
          <input
            className={INPUT}
            value={f.about}
            onChange={set("about")}
            placeholder="e.g. I built a model bridge for DT and got a Distinction"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="When you're available (optional)">
            <input
              className={INPUT}
              value={f.availability}
              onChange={set("availability")}
              placeholder="e.g. the week of 14 July, or any Saturday"
            />
          </Field>
          <Field label="Your email (optional)">
            <input
              className={INPUT}
              type="email"
              value={f.email}
              onChange={set("email")}
              placeholder="you@example.com"
            />
          </Field>
        </div>
      </form>

      {/* LIVE PREVIEW */}
      <div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={writeWithAI}
            disabled={!canWrite || loading}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-accent-strong px-6 font-bold tracking-tight text-on-accent shadow-sm transition hover:shadow-lg disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? "Writing…" : ai ? "Rewrite with AI" : "Write with AI ✨"}
          </button>
          {err ? (
            <p className="text-xs text-red-600 dark:text-red-400">{err}</p>
          ) : ai ? (
            <p className="text-xs text-muted">✨ Written with AI — edit any field to start again.</p>
          ) : (
            <p className="text-xs text-muted">
              {canWrite
                ? "Turns your details into a natural, ready-to-send email."
                : "Add your name, field and a reason, then let AI write it."}
            </p>
          )}
        </div>

        <PreviewCard title="Your email" onCopy={() => copy("email", `Subject: ${subject}\n\n${body}`)} copied={copied === "email"}>
          <p className="mb-3 border-b border-border-soft pb-3 text-sm">
            <span className="font-semibold text-muted">Subject: </span>
            <span className="text-ink">{subject}</span>
          </p>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{body}</div>
        </PreviewCard>

        <PreviewCard
          title="Follow-up (send once, ~a week later)"
          onCopy={() => copy("nudge", nudge)}
          copied={copied === "nudge"}
        >
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{nudge}</div>
        </PreviewCard>

        <div className="rounded-2xl border border-border-soft bg-surface-alt p-6">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-accent-strong">Before you send</h3>
          <ul className="flex flex-col gap-2 text-sm text-muted">
            {CHECKLIST.map((c) => (
              <li key={c} className="flex gap-2">
                <span className="text-accent-strong">✓</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
