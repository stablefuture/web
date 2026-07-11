"use client";

import { useEffect, useMemo, useState } from "react";
import { BookCall } from "@/app/components/BookCall";

// ---- shapes (mirror jobs/pipeline/build.py output) -------------------------
type Ind = { raw?: number | null; normalised?: number | null; note?: string;
             grads?: number; starts?: number; openings?: number } | null;
type Entity = {
  id: string;
  type: "job" | "degree" | "apprenticeship";
  label: string;
  category?: string;
  soc4?: string;
  openings?: number | null;
  grads?: number;
  linked_soc4?: string[] | string | null;
  level?: string;
  route?: string;
  keywords: string[];
  indicators: Record<string, Ind>;
};
type Meta = { label: string; higher_is: "better" | "worse"; source: string; estimate?: boolean };
type SearchRow = { id: string; type: Entity["type"]; label: string; keywords: string[] };
type Data = {
  meta: { counts: Record<string, number>; indicators: Record<string, Meta> };
  jobs: Entity[];
  degrees: Entity[];
  apprenticeships: Entity[];
  search: SearchRow[];
};

const TYPE_LABEL: Record<Entity["type"], string> = {
  job: "Occupation",
  degree: "Degree",
  apprenticeship: "Apprenticeship",
};

const EXAMPLES = ["Biology", "Law", "Nursing", "Software", "Plumbing", "Psychology", "Electrician"];

// ---- formatting + colour ---------------------------------------------------
const GREEN = "#16a34a", AMBER = "#d97706", RED = "#dc2626";
const fmtSalary = (v?: number | null) => (v ? `£${Math.round(v / 1000)}k` : "—");
const fmtOpenings = (v?: number | null) =>
  v == null ? "—" : v >= 1000 ? `${(v / 1000).toFixed(1)}K` : `${Math.round(v)}`;
const colorFor = (goodness: number) => (goodness >= 66 ? GREEN : goodness >= 33 ? AMBER : RED);
// competition: fuller/greener = fewer entrants per opening (ratio 3+ = maxed)
const compGoodness = (ratio: number) => 100 - Math.min(100, (ratio / 3) * 100);
const aiLabel = (n: number) =>
  n >= 80 ? "Very high" : n >= 60 ? "High" : n >= 40 ? "Moderate" : n >= 20 ? "Low" : "Very low";

// definitions for the "?" tooltips
const DEFS: Record<string, string> = {
  salary: "Median full-time gross annual pay for the occupation (ONS ASHE). For a degree, the average across the occupations it feeds.",
  openings: "Projected job openings per year = new jobs (growth) + people leaving/retiring. A modelled estimate, not a live vacancy count.",
  competition: "Graduates (or apprentice starts) entering each year for every projected opening. Fewer per opening = better prospects. A rough relative guide — many graduates work outside their exact field.",
  ai_exposure: "How exposed the day-to-day tasks are to automation by AI — averaged from two independent 2025–26 research estimates. Higher = more exposed.",
  elasticity: "As AI makes the work cheaper, does the field grow (more demand) or shrink? A model estimate — it matters most where AI exposure is high.",
};

export function Checker() {
  const [data, setData] = useState<Data | null>(null);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/data.json").then((r) => r.json()).then(setData).catch(() => setData(null));
  }, []);

  const byId = useMemo(() => {
    const m = new Map<string, Entity>();
    if (data) for (const e of [...data.jobs, ...data.degrees, ...data.apprenticeships]) m.set(e.id, e);
    return m;
  }, [data]);
  const jobByCode = useMemo(() => {
    const m = new Map<string, Entity>();
    if (data) for (const j of data.jobs) m.set(j.soc4!, j);
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
      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelectedId(null); }}
          placeholder={data ? "Search a job, degree or apprenticeship…" : "Loading…"}
          disabled={!data}
          className="w-full rounded-xl border border-border-soft bg-surface-alt px-5 py-4 text-lg text-ink outline-none transition focus:border-accent-strong focus:ring-2 focus:ring-accent/40 disabled:opacity-60"
          aria-label="Search a job, degree or apprenticeship"
        />
        {query && !selected && (
          <ul className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-border-soft bg-background shadow-lg">
            {results.length === 0 && (
              <li className="px-5 py-4 text-muted">No match. Try a subject, job title or trade.</li>
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

      {!query && !selected && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted">Try:</span>
          {EXAMPLES.map((ex) => (
            <button key={ex} onClick={() => setQuery(ex)}
              className="rounded-full border border-border-soft bg-surface-alt px-3 py-1 text-sm text-ink transition hover:border-accent-strong">
              {ex}
            </button>
          ))}
        </div>
      )}

      {selected && data && (
        <EntityView
          entity={selected}
          data={data}
          jobByCode={jobByCode}
          onSelect={setSelectedId}
          onBack={() => { setSelectedId(null); setQuery(""); }}
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

function InfoTip({ text, source }: { text: string; source?: string }) {
  return (
    <span className="group relative inline-flex align-middle">
      <button type="button" aria-label="What does this mean?"
        className="flex h-4 w-4 items-center justify-center rounded-full border border-border-soft text-[10px] font-semibold text-muted transition hover:border-accent-strong hover:text-accent-strong">
        ?
      </button>
      <span role="tooltip"
        className="pointer-events-none absolute left-0 top-6 z-30 w-60 rounded-lg border border-border-soft bg-background p-3 text-left text-xs font-normal normal-case leading-relaxed opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
        <span className="block text-ink">{text}</span>
        {source && <span className="mt-1.5 block text-muted">Source: {source}</span>}
      </span>
    </span>
  );
}

// ---- entity view: summary cards + sortable occupations table ---------------
type Row = {
  job: Entity;
  salary: number | null;
  openings: number | null;
  ai: number | null;
  competition: number | null; // grads/starts per opening, when there is an entrant pool
};
type SortKey = "label" | "salary" | "openings" | "competition" | "ai";

function EntityView({
  entity, data, jobByCode, onSelect, onBack,
}: {
  entity: Entity;
  data: Data;
  jobByCode: Map<string, Entity>;
  onSelect: (id: string) => void;
  onBack: () => void;
}) {
  const [view, setView] = useState<"relevant" | "all">("relevant");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "openings", dir: -1 });
  useEffect(() => { setView("relevant"); setSort({ key: "openings", dir: -1 }); }, [entity.id]);

  const pool = entity.type === "degree" ? entity.grads
    : entity.type === "apprenticeship" ? entity.indicators.competition?.starts ?? null : null;

  const linked = useMemo(() => {
    const codes = Array.isArray(entity.linked_soc4)
      ? entity.linked_soc4
      : entity.linked_soc4 ? [entity.linked_soc4] : [];
    if (entity.type === "job") {
      const g = entity.soc4!.slice(0, 3);
      return data.jobs.filter((j) => j.soc4!.slice(0, 3) === g);
    }
    return codes.map((c) => jobByCode.get(c)).filter(Boolean) as Entity[];
  }, [entity, data, jobByCode]);

  const rowFor = (job: Entity): Row => {
    const openings = job.openings ?? null;
    return {
      job,
      salary: job.indicators.salary?.raw ?? null,
      openings,
      ai: job.indicators.ai_exposure?.normalised ?? null,
      competition: pool && openings ? pool / openings : null,
    };
  };

  const rows = useMemo(() => {
    const base = view === "all" ? data.jobs : linked;
    const r = base.map(rowFor);
    const v = (x: Row) =>
      sort.key === "label" ? x.job.label.toLowerCase() : (x[sort.key] ?? -Infinity);
    return [...r].sort((a, b) => {
      const av = v(a), bv = v(b);
      if (av < bv) return -1 * sort.dir;
      if (av > bv) return 1 * sort.dir;
      return 0;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, linked, data, sort, pool]);

  const totalOpenings = linked.reduce((s, j) => s + (j.openings ?? 0), 0);
  const comp = entity.indicators.competition;
  const ai = entity.indicators.ai_exposure?.normalised ?? null;
  const el = entity.indicators.elasticity;

  return (
    <div className="sf-fade-in flex flex-col gap-6">
      {/* header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <TypeChip type={entity.type} />
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{entity.label}</h2>
          <p className="mt-1 text-sm text-muted">
            {entity.category || (entity.type === "apprenticeship" ? entity.route : "")}
            {entity.type === "apprenticeship" && entity.level ? ` · Level ${entity.level}` : ""}
          </p>
        </div>
        <button onClick={onBack} className="shrink-0 text-sm text-muted underline hover:text-ink">← New search</button>
      </div>

      {/* summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {entity.type === "job" ? (
          <>
            <Card label="Entry salary" k="salary" value={fmtSalary(entity.indicators.salary?.raw)} />
            <Card label="Openings" k="openings" value={`${fmtOpenings(entity.openings)}/yr`} />
            <Card label="AI exposure" k="ai_exposure" value={ai != null ? `${ai}` : "—"}
              sub={ai != null ? aiLabel(ai) : ""} color={ai != null ? colorFor(100 - ai) : undefined} />
          </>
        ) : (
          <>
            <Card label={entity.type === "degree" ? "Openings in linked fields" : "Advertised wage"}
              k={entity.type === "degree" ? "openings" : "salary"}
              value={entity.type === "degree" ? `${fmtOpenings(totalOpenings)}/yr` : fmtSalary(entity.indicators.salary?.raw)} />
            <Card label="Competition" k="competition"
              value={comp?.raw != null ? `${comp.raw}×` : "—"}
              sub={comp?.raw != null ? "per opening" : ""}
              color={comp?.raw != null ? colorFor(compGoodness(comp.raw)) : undefined} />
            <Card label={entity.type === "degree" ? "Avg salary" : "AI exposure"}
              k={entity.type === "degree" ? "salary" : "ai_exposure"}
              value={entity.type === "degree" ? fmtSalary(entity.indicators.salary?.raw)
                : (ai != null ? `${ai}` : "—")}
              sub={entity.type === "degree" ? "linked occupations" : (ai != null ? aiLabel(ai) : "")}
              color={entity.type === "degree" ? undefined : (ai != null ? colorFor(100 - ai) : undefined)} />
          </>
        )}
      </div>

      {/* elasticity line (our differentiator) — dimmed where AI exposure is low */}
      {el?.note && (
        <div className="rounded-xl border border-border-soft bg-surface-alt p-4"
          style={ai != null ? { opacity: 0.5 + 0.5 * (ai / 100) } : undefined}>
          <p className="text-sm">
            <span className="font-semibold text-ink">Demand elasticity</span>
            <span className="ml-2 rounded bg-background px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">estimate</span>
            <InfoTip text={DEFS.elasticity} source={data.meta.indicators.elasticity?.source} />
            <span className="ml-1 text-muted"> — {el.note}</span>
          </p>
        </div>
      )}

      {/* related occupations table */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Toggle active={view === "relevant"} onClick={() => setView("relevant")}>
            {entity.type === "job" ? "Similar" : "Relevant"} ({linked.length})
          </Toggle>
          <Toggle active={view === "all"} onClick={() => setView("all")}>All jobs ({data.jobs.length})</Toggle>
        </div>

        <OccupationTable
          rows={rows}
          showCompetition={pool != null && view === "relevant"}
          sort={sort}
          onSort={(key) => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : -1 }))}
          onSelect={onSelect}
          metaIndicators={data.meta.indicators}
        />
      </div>

      {/* CTA */}
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border-soft bg-surface-alt p-6 text-center">
        <p className="max-w-md text-muted">
          The data shows the shape of it. A call turns it into a plan for <span className="text-ink">your</span> child.
        </p>
        <BookCall size="md" />
      </div>
    </div>
  );
}

function Card({ label, k, value, sub, color }: {
  label: string; k: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div className="rounded-xl border border-border-soft bg-surface-alt p-5">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
        <InfoTip text={DEFS[k] ?? ""} />
      </div>
      <div className="mt-1 text-3xl font-extrabold tracking-tight" style={{ color: color ?? "var(--ink)" }}>
        {value}
      </div>
      {sub && <div className="text-xs text-muted">{sub}</div>}
    </div>
  );
}

function Toggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
        active ? "bg-accent-strong text-on-accent" : "border border-border-soft text-muted hover:text-ink"
      }`}>
      {children}
    </button>
  );
}

function OccupationTable({
  rows, showCompetition, sort, onSort, onSelect, metaIndicators,
}: {
  rows: Row[];
  showCompetition: boolean;
  sort: { key: SortKey; dir: 1 | -1 };
  onSort: (k: SortKey) => void;
  onSelect: (id: string) => void;
  metaIndicators: Record<string, Meta>;
}) {
  const Arrow = ({ k }: { k: SortKey }) => (
    <span className="ml-1 text-[10px] text-accent-strong">{sort.key === k ? (sort.dir === 1 ? "▲" : "▼") : ""}</span>
  );
  const Th = ({ k, label, meta, right }: { k: SortKey; label: string; meta?: string; right?: boolean }) => (
    <th className={`px-3 py-2 ${right ? "text-right" : "text-left"}`}>
      <button onClick={() => onSort(k)} className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted hover:text-ink">
        {label}<Arrow k={k} />
      </button>
      {meta && <InfoTip text={DEFS[meta] ?? ""} source={metaIndicators[meta]?.source} />}
    </th>
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-border-soft">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border-soft bg-surface-alt">
            <Th k="label" label="Occupation" />
            <Th k="salary" label="Salary" meta="salary" right />
            <Th k="openings" label="Openings" meta="openings" right />
            {showCompetition && <Th k="competition" label="Competition" meta="competition" right />}
            <Th k="ai" label="AI risk" meta="ai_exposure" right />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={5} className="px-3 py-6 text-center text-muted">No linked occupations resolved.</td></tr>
          )}
          {rows.map((r) => (
            <tr key={r.job.id}
              onClick={() => onSelect(r.job.id)}
              className="cursor-pointer border-b border-border-soft/60 transition last:border-0 hover:bg-surface-alt">
              <td className="px-3 py-3">
                <div className="font-medium text-ink">{r.job.label}</div>
                <div className="text-xs text-muted">{r.job.category}</div>
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-ink">{fmtSalary(r.salary)}</td>
              <td className="px-3 py-3 text-right tabular-nums text-ink">{fmtOpenings(r.openings)}</td>
              {showCompetition && (
                <td className="px-3 py-3 text-right tabular-nums">
                  <Dot color={r.competition != null ? colorFor(compGoodness(r.competition)) : "transparent"} />
                  <span className="text-ink">{r.competition != null ? `${r.competition.toFixed(1)}×` : "—"}</span>
                </td>
              )}
              <td className="px-3 py-3 text-right tabular-nums">
                {r.ai != null ? (
                  <>
                    <Dot color={colorFor(100 - r.ai)} />
                    <span className="text-ink">{r.ai}</span>
                    <span className="ml-1 text-xs text-muted">{aiLabel(r.ai)}</span>
                  </>
                ) : <span className="text-muted">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return <span className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle" style={{ backgroundColor: color }} />;
}
