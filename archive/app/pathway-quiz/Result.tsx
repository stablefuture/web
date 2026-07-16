// Result panel — shown after the quiz scores.
// Lifted from the v0 smoke page; tightened for the parent-facing audience.

import { Button } from "@/app/components/Button";
import { BOOKING_URL } from "@/app/config";
import type { Tier, Verdict } from "@/lib/scoring/types";

const TIER_LABEL: Record<1 | 2 | 3 | 4, string> = {
  1: "Strong path",
  2: "Solid path",
  3: "Hedge — proceed with caution",
  4: "High risk — rethink",
};

const TIER_TONE: Record<1 | 2 | 3 | 4, string> = {
  1: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100",
  2: "bg-lime-100 text-lime-900 dark:bg-lime-900 dark:text-lime-100",
  3: "bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100",
  4: "bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100",
};

export function Result({ verdict }: { verdict: Verdict }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Header — tier + AI-risk score side-by-side */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
        <div
          className={`flex-1 rounded-xl p-5 ${TIER_TONE[verdict.tier]}`}
        >
          <div className="text-xs uppercase tracking-widest opacity-80">
            Verdict
          </div>
          <div className="mt-1 text-3xl font-extrabold leading-tight">
            {TIER_LABEL[verdict.tier]}
          </div>
          <div className="mt-1 text-sm opacity-80">Tier {verdict.tier} / 4</div>
        </div>
        <div className="flex-1 rounded-xl border border-border-soft bg-surface-alt p-5">
          <div className="text-xs uppercase tracking-widest text-muted">
            AI-displacement risk
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-5xl font-extrabold text-ink">
              {verdict.exposureScore}
            </span>
            <span className="text-lg text-muted">/ 10</span>
          </div>
          <div className="mt-1 text-sm text-muted">
            {verdict.exposureScore <= 2
              ? "Resistant to AI displacement."
              : verdict.exposureScore <= 5
              ? "Some AI exposure; partial moat."
              : verdict.exposureScore <= 7
              ? "Materially AI-exposed."
              : "In the firing line."}
          </div>
        </div>
      </div>

      {/* What we read */}
      <div className="rounded-xl border border-border-soft bg-background p-5">
        <div className="text-xs uppercase tracking-widest text-muted">
          What we read
        </div>
        <div className="mt-1 text-lg font-semibold text-ink">
          {verdict.label}
        </div>
        {verdict.freeText &&
          (verdict.freeText.sector || verdict.freeText.job) && (
            <div className="mt-1 text-sm italic text-muted">
              You typed:{" "}
              {[verdict.freeText.sector, verdict.freeText.job]
                .filter(Boolean)
                .join(" · ")}
            </div>
          )}

        <ul className="mt-4 flex flex-col gap-3 text-sm leading-relaxed text-ink">
          {verdict.rationale.bullets.map((b, i) => (
            <li
              key={i}
              className="flex gap-2"
              dangerouslySetInnerHTML={{
                __html: `<span>•</span><span>${renderBoldMarkdown(b)}</span>`,
              }}
            />
          ))}
        </ul>
      </div>

      {/* CTA — only shown to higher-risk verdicts (Tier 3+). Solid paths
          don't need a call; pushing one to them is a brand mismatch. */}
      {verdict.tier >= 3 ? <BookCallPanel /> : <NoActionPanel tier={verdict.tier} />}
    </div>
  );
}

function BookCallPanel() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl bg-surface-alt p-6 text-center">
      <h2 className="text-2xl font-extrabold uppercase tracking-tight text-ink sm:text-3xl">
        Get a free 30-min strategy call
      </h2>
      <p className="max-w-md text-muted">
        We&apos;ll review your child&apos;s specific situation and give you a
        concrete plan. No upsell, no fluff.
      </p>
      {BOOKING_URL ? (
        <Button href={BOOKING_URL} size="lg" className="mt-2 uppercase">
          Book your call →
        </Button>
      ) : (
        <p className="text-sm italic text-muted">
          (Booking link not yet configured — set BOOKING_URL in app/config.ts)
        </p>
      )}
    </div>
  );
}

function NoActionPanel({ tier }: { tier: Tier }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl bg-surface-alt p-6 text-center">
      <h2 className="text-2xl font-extrabold uppercase tracking-tight text-ink sm:text-3xl">
        {tier === 1 ? "You're on a strong path" : "This is a solid path"}
      </h2>
      <p className="max-w-md text-muted">
        No action needed today. Bookmark this page and re-take the quiz if
        anything changes — new subject, new offer, change of direction. We
        update the rubric as the AI job market evolves.
      </p>
    </div>
  );
}

function renderBoldMarkdown(s: string): string {
  return escapeHtml(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
