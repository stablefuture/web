"use client";

import { useEffect, useState } from "react";
import {
  type Occupation,
  type Tracker,
  competitionWord,
  exposureBand,
  fmtPct,
  nowcastWord,
} from "./tracker";

/** Tracker indicators for one occupation, appended below the checker panel.
 *  Every indicator stands alone — there is no combined score by design. */
export function TrackerPanel({ soc4 }: { soc4: string }) {
  const [data, setData] = useState<Tracker | null>(null);

  useEffect(() => {
    fetch("/tracker.json")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  const occ = data?.occupations.find((o) => o.soc4 === soc4);
  if (!occ) return null;

  return (
    <section className="flex flex-col gap-4 border-t border-border-soft pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-extrabold tracking-tight text-ink">
          How this occupation is changing
        </h3>
        <a href="/methodology" className="text-sm text-muted underline hover:text-ink">
          How we work this out
        </a>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Nowcast occ={occ} />
        <Exposure occ={occ} />
      </div>

      <Competition occ={occ} />

      <p className="text-xs leading-relaxed text-muted">
        {data!.meta.no_composite_note} Updated {data!.meta.generated}.
      </p>
    </section>
  );
}

function Tile({
  title,
  children,
  footnote,
}: {
  title: string;
  children: React.ReactNode;
  footnote?: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border-soft bg-surface-alt p-5">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted">
        {title}
      </div>
      {children}
      {footnote && <p className="text-xs leading-relaxed text-muted">{footnote}</p>}
    </div>
  );
}

const TONE: Record<string, string> = {
  good: "#16a34a",
  flat: "var(--ink)",
  bad: "#dc2626",
  muted: "var(--muted)",
};

function Nowcast({ occ }: { occ: Occupation }) {
  const { pct_dev } = occ.nowcast;
  const { word, tone } = nowcastWord(pct_dev);
  return (
    <Tile
      title="Hiring vs its pre-2023 trend"
      footnote="Share of all UK job adverts, against where its own 2018–2022 trend pointed. Adverts are an early signal, not employment."
    >
      <div className="text-3xl font-extrabold tracking-tight" style={{ color: TONE[tone] }}>
        {word}
      </div>
      <div className="text-sm text-muted">
        {pct_dev == null ? "Series too thin to read" : `${fmtPct(pct_dev)} vs trend`}
      </div>
    </Tile>
  );
}

function Exposure({ occ }: { occ: Occupation }) {
  const g = occ.exposure.gamma;
  const band = g != null ? exposureBand(g) : null;
  return (
    <Tile
      title="AI learnability"
      footnote="How much of the day-to-day work a language model could already do, from human ratings of this occupation's tasks. Learnability is not the same as jobs disappearing."
    >
      <div
        className="text-3xl font-extrabold tracking-tight"
        style={{ color: band?.color ?? "var(--ink)" }}
      >
        {band ? band.label : "—"}
      </div>
      <div className="text-sm text-muted">
        {g == null ? "No task ratings for this occupation" : `${Math.round(g * 100)}% of tasks exposed`}
      </div>
    </Tile>
  );
}

/** Competition barely moves across entry years (398 of 412 occupations shift
 *  under 10% between 2027 and 2035), so a year-by-year chart would imply a
 *  trend the model cannot actually resolve. We show the level, its uncertainty
 *  range, and the direction in words; the full path stays in the table. */
function Competition({ occ }: { occ: Occupation }) {
  const path = occ.competition;
  if (!path?.length) return null;
  const first = path[0];
  const last = path[path.length - 1];
  const change = first.central > 0 ? (last.central / first.central - 1) * 100 : 0;
  const drift =
    Math.abs(change) < 5
      ? `and stays about there through ${last.year}`
      : change < 0
        ? `easing to ${last.central.toFixed(1)}× by ${last.year}`
        : `rising to ${last.central.toFixed(1)}× by ${last.year}`;

  return (
    <Tile
      title="People entering, per opening"
      footnote="Projected entrants (graduates allocated by what graduates actually go on to do, plus apprentices) divided by projected annual openings. The range covers the uncertainty in both."
    >
      <div className="flex flex-wrap items-baseline gap-x-3">
        <span className="text-3xl font-extrabold tracking-tight text-ink">
          {first.central.toFixed(1)}×
        </span>
        <span className="text-base font-semibold text-muted">
          {competitionWord(first.central)} in {first.year}
        </span>
      </div>
      <div className="text-sm text-muted">
        Range {first.p10.toFixed(1)}–{first.p90.toFixed(1)}×, {drift}.
      </div>

      <table className="sr-only">
        <caption>Entrants per opening by entry year</caption>
        <thead>
          <tr>
            <th>Entry year</th>
            <th>Central</th>
            <th>Low</th>
            <th>High</th>
          </tr>
        </thead>
        <tbody>
          {path.map((p) => (
            <tr key={p.year}>
              <td>{p.year}</td>
              <td>{p.central}</td>
              <td>{p.p10}</td>
              <td>{p.p90}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Tile>
  );
}
