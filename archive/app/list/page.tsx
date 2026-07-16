import type { Metadata } from "next";
import { NewsletterForm } from "@/app/components/NewsletterForm";

export const metadata: Metadata = {
  title: "Human advice for the AI era — Stable Future",
  description:
    "Career advice for parents and teens: uni vs apprenticeships, the entry-level job market, and AI. Free.",
};

const STATS = [
  {
    figure: "140",
    label: "applications per graduate job, a record high",
    source: "Institute for Student Employers, 2025",
  },
  {
    figure: "1 in 7",
    label: "young people not earning or learning (NEET)",
    source: "Department for Work and Pensions, 2026",
  },
  {
    figure: "71%",
    label: "of hiring managers choose AI skills over seniority",
    source: "Microsoft & LinkedIn Annual Report, 2024",
  },
];

export default function ListPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-16 px-6 py-16 text-center">
      <div className="flex max-w-2xl flex-col items-center gap-6">
        <h1 className="text-4xl font-extrabold uppercase leading-[0.95] tracking-tight text-ink sm:text-5xl">
          Human advice{" "}
          <span className="inline-block bg-accent px-3 py-0.5 text-on-accent">
            for the AI era
          </span>
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
          Career advice for parents and teens: uni vs apprenticeships, the
          entry-level job market, and AI.
        </p>
        <NewsletterForm
          source="list"
          submitLabel="Subscribe free"
          note="No spam. Unsubscribe anytime."
        />
      </div>

      <div className="grid max-w-3xl gap-8 sm:grid-cols-3">
        {STATS.map((s) => (
          <div key={s.figure} className="flex flex-col gap-1">
            <span className="text-4xl font-extrabold text-accent-strong">
              {s.figure}
            </span>
            <span className="text-sm font-medium text-ink">{s.label}</span>
            <span className="text-xs text-muted">{s.source}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
