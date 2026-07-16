"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Container } from "@/app/components/Container";
import { Section } from "@/app/components/Section";
import { submitQuiz, type QuizResult } from "@/app/actions/quiz";
import { Result } from "./Result";
import type { Direction } from "@/lib/scoring/types";

// Form options derived server-side from the rubric and passed in as props.
export type FormOptions = {
  sectorsByDirection: Record<
    Direction,
    { id: string; label: string }[]
  >;
  jobsBySector: Record<string, string[]>;
};

type Answers = {
  schoolYear: string;
  direction: Direction | "";
  sector: string; // sector_id | "unsure" | "other" | ""
  sectorOther: string;
  job: string; // typed/picked job, "unsure", "other", or ""
  jobOther: string;
  schoolName: string;
  schoolPostcode: string;
};

const EMPTY: Answers = {
  schoolYear: "",
  direction: "",
  sector: "",
  sectorOther: "",
  job: "",
  jobOther: "",
  schoolName: "",
  schoolPostcode: "",
};

const SCHOOL_YEARS = ["Year 9", "Year 10", "Year 11", "Year 12", "Year 13"];

const DIRECTIONS: { id: Direction; label: string }[] = [
  { id: "uni", label: "University" },
  { id: "apprenticeship", label: "Apprenticeship" },
  { id: "leaving_for_work", label: "Leaving school for work" },
  { id: "undecided", label: "Undecided" },
  { id: "other", label: "Other" },
];

// Directions where Q3 (sector) and Q4 (job) are skipped.
const SHORT_CIRCUIT: Direction[] = ["undecided", "other"];

export function Quiz({ options }: { options: FormOptions }) {
  const [step, setStep] = useState(0);
  const [a, setA] = useState<Answers>(EMPTY);
  const [quizId, setQuizId] = useState("");
  const [state, formAction, isPending] = useActionState<QuizResult | null, FormData>(
    submitQuiz,
    null
  );

  // Generate / restore a functional UUID (localStorage, not a cookie — no
  // banner needed under PECR strictly-necessary exemption).
  useEffect(() => {
    if (typeof window === "undefined") return;
    let id = window.localStorage.getItem("sf_quiz_id");
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem("sf_quiz_id", id);
    }
    setQuizId(id);
  }, []);

  // Step indices: 0=year, 1=direction, 2=sector, 3=job, 4=school, 5=submit/result.
  // For "undecided"/"other" directions, skip 2 and 3.
  const steps = useMemo(() => {
    const base = ["year", "direction"];
    if (a.direction && !SHORT_CIRCUIT.includes(a.direction as Direction)) {
      base.push("sector", "job");
    }
    base.push("school");
    return base;
  }, [a.direction]);
  const totalSteps = steps.length; // 3 (short-circuit) or 5
  const stepName = steps[step] ?? "submit";
  // Fill to 100% when on the last step (school) so the bar reads "done" at submit.
  const progress = Math.round((step / (totalSteps - 1)) * 100);

  // Reset downstream answers when going back / changing direction.
  function set<K extends keyof Answers>(key: K, value: Answers[K]) {
    setA((prev) => ({ ...prev, [key]: value }));
  }
  function advance() {
    setStep((s) => s + 1);
  }
  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  // Validity check per step before advance is enabled.
  const canAdvance = (() => {
    switch (stepName) {
      case "year":
        return a.schoolYear !== "";
      case "direction":
        return a.direction !== "";
      case "sector":
        if (a.sector === "other") return a.sectorOther.trim().length > 0;
        return a.sector !== "";
      case "job":
        if (a.job === "other") return a.jobOther.trim().length > 0;
        return a.job !== "";
      case "school":
        return a.schoolName.trim().length > 0 && a.schoolPostcode.trim().length > 0;
      default:
        return false;
    }
  })();

  // After successful submit, render the result panel.
  if (state?.ok) {
    return (
      <main className="min-h-screen bg-surface-alt">
        <Header />
        <Section className="bg-surface-alt">
          <Container narrow>
            <div className="mx-auto w-full max-w-2xl">
              <Result verdict={state.verdict} />
            </div>
          </Container>
        </Section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface-alt">
      <Header />
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

            <div className="flex flex-col gap-6">
              {step > 0 && (
                <button
                  type="button"
                  onClick={back}
                  className="self-start text-sm font-medium text-muted hover:text-ink"
                >
                  ← Back
                </button>
              )}

              {stepName === "year" && (
                <StepYear
                  value={a.schoolYear}
                  onChoose={(v) => {
                    set("schoolYear", v);
                    advance();
                  }}
                />
              )}

              {stepName === "direction" && (
                <StepDirection
                  value={a.direction}
                  onChoose={(v) => {
                    set("direction", v);
                    // Reset downstream so sector/job/school are fresh.
                    setA((prev) => ({
                      ...prev,
                      direction: v,
                      sector: "",
                      sectorOther: "",
                      job: "",
                      jobOther: "",
                    }));
                    advance();
                  }}
                />
              )}

              {stepName === "sector" && a.direction && (
                <StepSector
                  direction={a.direction}
                  options={options.sectorsByDirection[a.direction] ?? []}
                  sector={a.sector}
                  sectorOther={a.sectorOther}
                  setSector={(v) => set("sector", v)}
                  setSectorOther={(v) => set("sectorOther", v)}
                  onAdvance={advance}
                  canAdvance={canAdvance}
                />
              )}

              {stepName === "job" && a.direction && a.sector && (
                <StepJob
                  sectorLabel={
                    options.sectorsByDirection[a.direction]?.find(
                      (s) => s.id === a.sector
                    )?.label ?? "your area"
                  }
                  jobOptions={options.jobsBySector[a.sector] ?? []}
                  job={a.job}
                  jobOther={a.jobOther}
                  setJob={(v) => set("job", v)}
                  setJobOther={(v) => set("jobOther", v)}
                  onAdvance={advance}
                  canAdvance={canAdvance}
                />
              )}

              {stepName === "school" && (
                <form action={formAction} className="flex flex-col gap-6">
                  <input type="hidden" name="quizId" value={quizId} />
                  <input type="hidden" name="schoolYear" value={a.schoolYear} />
                  <input type="hidden" name="direction" value={a.direction} />
                  <input type="hidden" name="sector" value={a.sector} />
                  <input
                    type="hidden"
                    name="sectorOther"
                    value={a.sectorOther}
                  />
                  <input type="hidden" name="job" value={a.job} />
                  <input type="hidden" name="jobOther" value={a.jobOther} />

                  <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">
                    Which school do they attend?
                  </h1>
                  <p className="text-muted leading-relaxed">
                    Helps us tailor regional advice. We don&apos;t contact the
                    school.
                  </p>

                  <Field
                    id="schoolName"
                    label="School name"
                    name="schoolName"
                    value={a.schoolName}
                    onChange={(v) => set("schoolName", v)}
                    placeholder="e.g. King's College London Maths School"
                    required
                  />
                  <Field
                    id="schoolPostcode"
                    label="School postcode"
                    name="schoolPostcode"
                    value={a.schoolPostcode}
                    onChange={(v) => set("schoolPostcode", v.toUpperCase())}
                    placeholder="e.g. SE1 7HU"
                    required
                  />

                  {state && !state.ok && (
                    <p className="text-sm text-red-600" aria-live="polite">
                      {state.error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isPending || !canAdvance}
                    className="mt-2 h-14 w-full rounded-md bg-accent-strong text-lg font-bold text-on-accent transition-all hover:bg-accent disabled:opacity-60"
                  >
                    {isPending ? "Scoring…" : "Get my result"}
                  </button>
                  <p className="text-center text-xs text-muted">
                    No email or phone needed. Answers stored anonymously.
                  </p>
                </form>
              )}
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}

// ─────────────── header ───────────────

function Header() {
  return (
    <header className="border-b border-border-soft bg-background">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <a href="/" className="text-lg font-extrabold tracking-tight text-ink">
            Stable Future
          </a>
          <span className="text-sm text-muted">Pathway quiz · 90 seconds</span>
        </div>
      </Container>
    </header>
  );
}

// ─────────────── step components ───────────────

function StepYear({
  value,
  onChoose,
}: {
  value: string;
  onChoose: (v: string) => void;
}) {
  return (
    <>
      <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">
        What year is your child in?
      </h1>
      <div className="flex flex-col gap-3">
        {SCHOOL_YEARS.map((y) => (
          <OptionButton key={y} selected={value === y} onClick={() => onChoose(y)}>
            {y}
          </OptionButton>
        ))}
      </div>
    </>
  );
}

function StepDirection({
  value,
  onChoose,
}: {
  value: Direction | "";
  onChoose: (v: Direction) => void;
}) {
  return (
    <>
      <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">
        What&apos;s their direction after school?
      </h1>
      <div className="flex flex-col gap-3">
        {DIRECTIONS.map((d) => (
          <OptionButton
            key={d.id}
            selected={value === d.id}
            onClick={() => onChoose(d.id)}
          >
            {d.label}
          </OptionButton>
        ))}
      </div>
    </>
  );
}

function StepSector({
  direction,
  options,
  sector,
  sectorOther,
  setSector,
  setSectorOther,
  onAdvance,
  canAdvance,
}: {
  direction: Direction;
  options: { id: string; label: string }[];
  sector: string;
  sectorOther: string;
  setSector: (v: string) => void;
  setSectorOther: (v: string) => void;
  onAdvance: () => void;
  canAdvance: boolean;
}) {
  const dropdownValue =
    sector && sector !== "unsure" && sector !== "other" ? sector : "";

  return (
    <>
      <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">
        {direction === "uni"
          ? "What subject are they considering?"
          : direction === "apprenticeship"
          ? "What apprenticeship area?"
          : "What kind of work are they considering?"}
      </h1>

      <div className="flex flex-col gap-2">
        <label htmlFor="sector-select" className="text-sm font-semibold text-ink">
          Choose from the list
        </label>
        <select
          id="sector-select"
          value={dropdownValue}
          onChange={(e) => setSector(e.target.value)}
          className="h-12 w-full rounded-md border border-border-soft bg-background px-4 text-base text-ink focus:border-transparent focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="">— Select —</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <RadioRow
        label="I'm not sure yet"
        checked={sector === "unsure"}
        onChange={() => setSector("unsure")}
      />
      <RadioRow
        label="Other (not listed)"
        checked={sector === "other"}
        onChange={() => setSector("other")}
      >
        {sector === "other" && (
          <input
            type="text"
            value={sectorOther}
            onChange={(e) => setSectorOther(e.target.value)}
            placeholder="Tell us what they're studying / interested in"
            className="mt-2 h-11 w-full rounded-md border border-border-soft bg-background px-4 text-base text-ink placeholder:text-muted focus:border-transparent focus:outline-none focus:ring-2 focus:ring-accent"
            autoFocus
          />
        )}
      </RadioRow>

      <NextButton onClick={onAdvance} disabled={!canAdvance} />
    </>
  );
}

function StepJob({
  sectorLabel,
  jobOptions,
  job,
  jobOther,
  setJob,
  setJobOther,
  onAdvance,
  canAdvance,
}: {
  sectorLabel: string;
  jobOptions: string[];
  job: string;
  jobOther: string;
  setJob: (v: string) => void;
  setJobOther: (v: string) => void;
  onAdvance: () => void;
  canAdvance: boolean;
}) {
  const typedValue = job && job !== "unsure" && job !== "other" ? job : "";

  return (
    <>
      <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">
        What specific job within {sectorLabel.toLowerCase()}?
      </h1>
      <p className="text-muted leading-relaxed">
        Start typing — we&apos;ll suggest matches.
      </p>

      <div className="flex flex-col gap-2">
        <label htmlFor="job-input" className="text-sm font-semibold text-ink">
          Job title
        </label>
        <input
          id="job-input"
          type="text"
          list="job-options"
          value={typedValue}
          onChange={(e) => setJob(e.target.value)}
          placeholder="e.g. Civil engineer"
          className="h-12 w-full rounded-md border border-border-soft bg-background px-4 text-base text-ink placeholder:text-muted focus:border-transparent focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <datalist id="job-options">
          {jobOptions.map((j) => (
            <option key={j} value={j} />
          ))}
        </datalist>
      </div>

      <RadioRow
        label="I'm not sure yet"
        checked={job === "unsure"}
        onChange={() => setJob("unsure")}
      />
      <RadioRow
        label="Other (not in the list)"
        checked={job === "other"}
        onChange={() => setJob("other")}
      >
        {job === "other" && (
          <input
            type="text"
            value={jobOther}
            onChange={(e) => setJobOther(e.target.value)}
            placeholder="Tell us the specific job"
            className="mt-2 h-11 w-full rounded-md border border-border-soft bg-background px-4 text-base text-ink placeholder:text-muted focus:border-transparent focus:outline-none focus:ring-2 focus:ring-accent"
            autoFocus
          />
        )}
      </RadioRow>

      <NextButton onClick={onAdvance} disabled={!canAdvance} />
    </>
  );
}

// ─────────────── primitives ───────────────

function OptionButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border-2 px-5 py-4 text-left text-base font-medium transition-all ${
        selected
          ? "border-accent-strong bg-surface-alt text-ink"
          : "border-border-soft bg-background text-ink hover:border-accent"
      }`}
    >
      {children}
    </button>
  );
}

function RadioRow({
  label,
  checked,
  onChange,
  children,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  children?: React.ReactNode;
}) {
  return (
    <label
      className={`flex cursor-pointer flex-col rounded-xl border-2 px-5 py-3 transition-all ${
        checked
          ? "border-accent-strong bg-surface-alt"
          : "border-border-soft bg-background hover:border-accent"
      }`}
    >
      <span className="flex items-center gap-3 text-base font-medium text-ink">
        <span
          className={`h-4 w-4 rounded-full border-2 transition-all ${
            checked
              ? "border-accent-strong bg-accent-strong"
              : "border-border-soft"
          }`}
          aria-hidden
        />
        <input
          type="radio"
          checked={checked}
          onChange={onChange}
          className="sr-only"
        />
        {label}
      </span>
      {children}
    </label>
  );
}

function NextButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mt-2 h-12 w-full rounded-md bg-accent-strong text-base font-bold text-on-accent transition-all hover:bg-accent disabled:opacity-50"
    >
      Next →
    </button>
  );
}

function Field({
  id,
  label,
  name,
  value,
  onChange,
  placeholder,
  required,
}: {
  id: string;
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="h-12 w-full rounded-md border border-border-soft bg-background px-4 text-base text-ink placeholder:text-muted focus:border-transparent focus:outline-none focus:ring-2 focus:ring-accent"
      />
    </div>
  );
}
