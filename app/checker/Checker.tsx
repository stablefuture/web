"use client";

import { useEffect, useMemo, useState } from "react";
import { BookCall } from "@/app/components/BookCall";

// ---- shapes (mirror jobs/pipeline/build.py output) -------------------------
type Indicator = {
  raw?: number | null;
  normalised: number | null;
  note?: string;
  trend_pct?: number | null;
  single_source?: boolean;
};
type Entity = {
  id: string;
  type: "job" | "degree" | "apprenticeship";
  label: string;
  level?: string;
  route?: string;
  indicators: Record<string, Indicator | null>;
};
type IndicatorMeta = {
  label: string;
  higher_is: "better" | "worse";
  source: string;
  estimate?: boolean;
};
type SearchRow = { id: string; type: Entity["type"]; label: string; keywords: string[] };
type Data = {
  meta: { counts: Record<string, number>; indicators: Record<string, IndicatorMeta> };
  jobs: Entity[];
  degrees: Entity[];
  apprenticeships: Entity[];
  search: SearchRow[];
};

const TYPE_LABEL: Record<Entity["type"], string> = {
  job: "Job",
  degree: "Degree",
  apprenticeship: "Apprenticeship",
};

// Order indicators are shown per entity type; missing ones are skipped.
const ORDER: Record<Entity["type"], string[]> = {
  job: ["salary", "demand", "ai_exposure", "elasticity"],
  degree: ["supply", "grad_ft_employment", "grad_unemployment", "salary", "ai_exposure", "elasticity"],
  apprenticeship: ["salary", "demand", "supply", "ai_exposure", "elasticity"],
};

const EXAMPLES = ["Electrician", "Law", "Nursing", "Software developer", "Plumber", "Accountant", "Journalist"];

export function Checker() {
  const [data, setData] = useState<Data | null>(null);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/data.json")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  const byId = useMemo(() => {
    const m = new Map<string, Entity>();
    if (data) for (const e of [...data.jobs, ...data.degrees, ...data.apprenticeships]) m.set(e.id, e);
    return m;
  }, [data]);

  const results = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const toks = q.split(/\s+/);
    const scored: { row: SearchRow; score: number }[] = [];
    for (const row of data.search) {
      const label = row.label.toLowerCase();
      let score = 0;
      if (label === q) score = 100;
      else if (label.startsWith(q)) score = 80;
      else if (label.includes(q)) score = 60;
      else if (toks.every((t) => label.includes(t) || row.keywords.some((k) => k.includes(t)))) score = 40;
      else if (row.keywords.some((k) => k.includes(q))) score = 30;
      if (score) scored.push({ row, score });
    }
    scored.sort((a, b) => b.score - a.score || a.row.label.length - b.row.label.length);
    return scored.slice(0, 8).map((s) => s.row);
  }, [data, query]);

  const selected = selectedId ? byId.get(selectedId) ?? null : null;

  return (
    <div className="flex flex-col gap-6">
      {/* search box */}
      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedId(null);
          }}
          placeholder={data ? "Search a job, degree or apprenticeship…" : "Loading…"}
          disabled={!data}
          className="w-full rounded-xl border border-border-soft bg-surface-alt px-5 py-4 text-lg text-ink outline-none transition focus:border-accent-strong focus:ring-2 focus:ring-accent/40 disabled:opacity-60"
          aria-label="Search a job, degree or apprenticeship"
        />

        {/* live results dropdown */}
        {query && !selected && (
          <ul className="mt-2 overflow-hidden rounded-xl border border-border-soft bg-background shadow-lg">
            {results.length === 0 && (
              <li className="px-5 py-4 text-muted">No match. Try a job title, subject or trade.</li>
            )}
            {results.map((r) => (
              <li key={r.id}>
                <button
                  onClick={() => setSelectedId(r.id)}
                  className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left transition hover:bg-surface-alt"
                >
                  <span className="text-ink">{r.label}</span>
                  <TypeChip type={r.type} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* example chips when idle */}
      {!query && !selected && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted">Try:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => setQuery(ex)}
              className="rounded-full border border-border-soft bg-surface-alt px-3 py-1 text-sm text-ink transition hover:border-accent-strong"
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {/* selected entity panel */}
      {selected && data && (
        <EntityPanel
          entity={selected}
          meta={data.meta.indicators}
          onBack={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

function TypeChip({ type }: { type: Entity["type"] }) {
  return (
    <span className="shrink-0 rounded-full border border-border-soft bg-surface-alt px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-muted">
      {TYPE_LABEL[type]}
    </span>
  );
}

function EntityPanel({
  entity,
  meta,
  onBack,
}: {
  entity: Entity;
  meta: Record<string, IndicatorMeta>;
  onBack: () => void;
}) {
  const rows = ORDER[entity.type]
    .map((key) => ({ key, ind: entity.indicators[key], m: meta[key] }))
    .filter((r) => r.ind && r.m && r.ind.normalised != null);

  return (
    <div className="sf-fade-in flex flex-col gap-6 rounded-2xl border border-border-soft bg-surface-alt p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <TypeChip type={entity.type} />
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            {entity.label}
          </h2>
          {entity.type === "apprenticeship" && (entity.level || entity.route) && (
            <p className="mt-1 text-sm text-muted">
              {entity.route}
              {entity.level ? ` · Level ${entity.level}` : ""}
            </p>
          )}
        </div>
        <button onClick={onBack} className="shrink-0 text-sm text-muted underline hover:text-ink">
          ← New search
        </button>
      </div>

      <div className="flex flex-col divide-y divide-border-soft">
        {rows.map((r) => (
          <IndicatorRow key={r.key} ind={r.ind!} m={r.m!} />
        ))}
      </div>

      {/* CTA */}
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border-soft bg-background p-6 text-center">
        <p className="max-w-md text-muted">
          This is the broad picture. Want to know what it means for{" "}
          <span className="text-ink">your</span> child specifically?
        </p>
        <BookCall size="md" />
      </div>
    </div>
  );
}

function IndicatorRow({ ind, m }: { ind: Indicator; m: IndicatorMeta }) {
  const n = ind.normalised ?? 0;
  // goodness: bar always reads "longer = better for the individual"
  const goodness = m.higher_is === "worse" ? 100 - n : n;
  const color =
    goodness >= 66 ? "#16a34a" : goodness >= 33 ? "#d97706" : "#dc2626";

  return (
    <div className="flex flex-col gap-1.5 py-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-semibold text-ink">
          {m.label}
          {m.estimate && (
            <span className="ml-2 rounded bg-surface-alt px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
              estimate
            </span>
          )}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-border-soft">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${Math.max(goodness, 3)}%`, backgroundColor: color }}
        />
      </div>
      {ind.note && <p className="text-sm text-muted">{ind.note}</p>}
      <p className="text-xs text-muted/70">Source: {m.source}</p>
    </div>
  );
}
