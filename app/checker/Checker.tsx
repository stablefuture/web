"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import { LABELS, TOOLTIPS } from "./copy";
import { JobMap } from "./Map";
import { SECTOR_LABEL } from "./sectors";
import { band, Dot, riskWord } from "@/app/lib/bands";

export type Path = "jobs" | "degrees" | "apprenticeships";

export type Unit = {
  id: string;
  path: Path;
  label: string;
  aka?: string[];
  sectors: string[];
  roles?: number[];
  level?: string;
  unresolved?: boolean;
  exposure: number | null;
  substitution: number | null;
  risk: number | null;
  salary: number | null;
  openings: number | null;
  growth?: number | null;
  entrants?: number | null;
  competition?: number | null;
};

type Sector = { id: string; label: string };
type V3 = { sectors: Record<Path, Sector[]>; units: Unit[] };

const PATHS: Path[] = ["jobs", "degrees", "apprenticeships"];
const TYPE: Record<Path, string> = {
  jobs: "Job",
  degrees: "Degree",
  apprenticeships: "Apprenticeship",
};
const GROUP: Record<Path, string> = {
  jobs: "Jobs",
  degrees: "Degrees",
  apprenticeships: "Apprenticeships",
};
const PICK: Record<Path, string> = {
  jobs: "Choose a job sector",
  degrees: "Choose a degree area",
  apprenticeships: "Choose an apprenticeship route",
};

// Shown before anything is chosen, so the first screen is not empty.
const EXAMPLES: [string, Path, string][] = [
  ["Accountant", "jobs", "Chartered and certified accountants"],
  ["Nurse", "jobs", "Other nursing professionals"],
  ["Psychology degree", "degrees", "Psychology"],
  ["Software apprenticeship", "apprenticeships", "Software developer"],
];

const money = (v: number) => `£${v.toLocaleString("en-GB")}`;
const count = (v: number) => v.toLocaleString("en-GB");
const pct = (v: number) => `${v > 0 ? "+" : ""}${v}%`;
const typeOf = (u: Unit) => `${TYPE[u.path]}${u.level ? ` · Level ${u.level}` : ""}`;

const words = (s: string) =>
  s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).map((w) => w.replace(/s$/, ""));

const HINT: Record<string, Path> = {
  job: "jobs",
  degree: "degrees",
  course: "degrees",
  apprenticeship: "apprenticeships",
};

type Hit = { unit: Unit; via: string | null };

// Every typed word must start a word in the title, so "robotics engineer" does
// not drag in every engineer. A word like "degree" narrows the path instead.
// A job's O*NET titles count too, one rank lower, so "web developer" reaches
// the unit group it sits in and the hit says which title matched.
function search(units: Unit[], q: string): Hit[] {
  const all = words(q);
  const want = all.map((w) => HINT[w]).find(Boolean) ?? null;
  const toks = all.filter((w) => !HINT[w]);
  if (!toks.length) return [];
  const full = toks.join(" ");
  const score = (label: string) => {
    const lw = words(label);
    const l = lw.join(" ");
    return l === full ? 3
      : l.startsWith(full) ? 2
      : toks.every((t) => lw.some((w) => w.startsWith(t))) ? 1
      : 0;
  };
  const hits: [Hit, number][] = [];
  for (const u of units) {
    if (want && u.path !== want) continue;
    const own = score(u.label);
    if (own) { hits.push([{ unit: u, via: null }, own]); continue; }
    const via = (u.aka ?? []).find((a) => score(a) > 0);
    if (via) hits.push([{ unit: u, via }, 0.5]);
  }
  return hits
    .sort((a, b) => b[1] - a[1] || a[0].unit.label.length - b[0].unit.label.length)
    .slice(0, 8)
    .map(([h]) => h);
}

export function Checker() {
  const [data, setData] = useState<V3 | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sector, setSector] = useState("");
  const [browse, setBrowse] = useState<Path>("jobs");
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/v3.json").then((r) => r.json()).then(setData).catch(() => setData(null));
    // The chosen unit lives in the URL so a parent can send the link on.
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setSelectedId(new URLSearchParams(window.location.search).get("id"));
  }, []);

  const select = (id: string) => {
    setSelectedId(id);
    window.history.replaceState(null, "", `?id=${encodeURIComponent(id)}`);
    requestAnimationFrame(() =>
      resultRef.current?.scrollIntoView({ block: "start", behavior: "smooth" }),
    );
  };
  const clear = () => {
    setSelectedId(null);
    window.history.replaceState(null, "", window.location.pathname);
  };

  const jobs = useMemo(() => data?.units.filter((u) => u.path === "jobs") ?? [], [data]);
  const byId = useMemo(
    () => new Map<string, Unit>((data?.units ?? []).map((u) => [u.id, u])),
    [data],
  );
  const selected = (selectedId && byId.get(selectedId)) || null;

  // The jobs a degree or apprenticeship leads to: where its AI figures come from.
  const related = useMemo(
    () =>
      selected && selected.path !== "jobs"
        ? (selected.roles ?? [])
            .map((i) => jobs[i])
            .filter(Boolean)
            .sort((a, b) => (b.openings ?? -1) - (a.openings ?? -1))
        : [],
    [selected, jobs],
  );
  const relatedIds = useMemo(() => new Set(related.map((r) => r.id)), [related]);

  // Every job a sector reaches: its own jobs, or the jobs its degrees or
  // apprenticeships lead to. Lit on the map so a sector can be browsed.
  const sectorUnits = useMemo(
    () => (sector && data ? data.units.filter((u) => u.sectors.includes(sector)) : []),
    [data, sector],
  );
  const sectorJobs = useMemo(() => {
    const ids = new Set<string>();
    for (const u of sectorUnits) {
      if (u.path === "jobs") ids.add(u.id);
      else for (const i of u.roles ?? []) if (jobs[i]) ids.add(jobs[i].id);
    }
    return ids;
  }, [sectorUnits, jobs]);

  if (!data) return <p className="py-16 text-center text-muted">Loading…</p>;

  const sectorLabel =
    SECTOR_LABEL[sector] ??
    PATHS.flatMap((p) => data.sectors[p]).find((s) => s.id === sector)?.label ??
    "";
  const lit = relatedIds.size ? relatedIds : sectorJobs;
  const litNote =
    !relatedIds.size && sector
      ? `The ${sectorJobs.size} jobs ${sectorLabel} leads to are lit.`
      : null;
  return (
    <div className="flex flex-col gap-10 lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start lg:gap-14">
      <div className="flex flex-col gap-8">
        <Search units={data.units} onPick={(u) => select(u.id)} />

        {!selected && (
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
            Try:
            {EXAMPLES.map(([text, path, label]) => {
              const u = data.units.find((x) => x.path === path && x.label === label);
              return u ? (
                <button
                  key={u.id}
                  onClick={() => select(u.id)}
                  className="rounded-full border border-border-soft px-3 py-1 text-ink transition hover:border-accent-strong hover:text-accent-strong"
                >
                  {text}
                </button>
              ) : null;
            })}
          </p>
        )}

        {selected && (
          <Result
            ref={resultRef}
            unit={selected}
            related={related}
            onPick={(u) => select(u.id)}
            onClear={clear}
          />
        )}

        <div className="flex flex-col gap-3 text-sm text-muted">
          <div className="flex items-baseline justify-between gap-3">
            <span id="browse-label">Or browse, most job openings first</span>
            {sector && (
              <button
                type="button"
                onClick={() => setSector("")}
                className="text-xs text-accent-strong hover:underline"
              >
                Clear
              </button>
            )}
          </div>
          <div role="group" aria-labelledby="browse-label" className="flex gap-1 rounded-lg bg-surface-alt p-1">
            {PATHS.map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={browse === p}
                onClick={() => { setBrowse(p); setSector(""); }}
                className={`flex-1 rounded-md px-2 py-1.5 text-sm transition ${
                  browse === p ? "bg-background font-semibold text-ink shadow-sm" : "text-muted hover:text-ink"
                }`}
              >
                {GROUP[p]}
              </button>
            ))}
          </div>
          <select
            aria-label={PICK[browse]}
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="rounded-xl border border-border-soft bg-surface-alt px-4 py-3 text-base text-ink outline-none transition focus:border-accent-strong"
          >
            <option value="">{PICK[browse]}</option>
            {data.sectors[browse].map((s) => (
              <option key={s.id} value={s.id}>{SECTOR_LABEL[s.id] ?? s.label}</option>
            ))}
          </select>
        </div>

        {sector && (
          <SectorList
            title={sectorLabel}
            units={sectorUnits}
            selectedId={selectedId}
            onPick={(u) => select(u.id)}
          />
        )}
      </div>

      <div className="lg:sticky lg:top-24">
        <JobMap jobs={jobs} selected={selected} lit={lit} litNote={litNote} onSelect={select} />
      </div>
    </div>
  );
}

function Search({ units, onPick }: { units: Unit[]; onPick: (u: Unit) => void }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const hits = useMemo(() => search(units, q), [units, q]);
  const show = open && q.trim().length > 0;

  const pick = (h: Hit) => {
    onPick(h.unit);
    setQ("");
    setOpen(false);
    setActive(-1);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, hits.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && hits.length) {
      e.preventDefault();
      pick(hits[Math.max(active, 0)]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <input
        type="search"
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(-1); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKeyDown}
        placeholder="Job, degree or apprenticeship"
        aria-label="Search a job, degree or apprenticeship"
        role="combobox"
        aria-expanded={show}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        className="w-full rounded-xl border border-border-soft bg-surface-alt px-5 py-4 text-base text-ink outline-none sm:text-lg transition focus:border-accent-strong focus:ring-2 focus:ring-accent/40"
      />
      {show && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-border-soft bg-background shadow-lg"
        >
          {hits.map(({ unit: u, via }, i) => (
            <li key={u.id} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
              <button
                type="button"
                tabIndex={-1}
                onMouseDown={() => pick({ unit: u, via })}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm ${
                  i === active ? "bg-surface-alt" : ""
                }`}
              >
                <span className="min-w-0 truncate text-ink">
                  {u.label}
                  {via && <span className="text-muted"> · includes {via}</span>}
                </span>
                <span className="shrink-0 text-xs text-muted">{typeOf(u)}</span>
              </button>
            </li>
          ))}
          {hits.length === 0 && (
            <li className="px-4 py-3 text-sm text-muted">Nothing by that name. Try a shorter word.</li>
          )}
        </ul>
      )}
    </div>
  );
}

function Result({
  ref, unit, related, onPick, onClear,
}: {
  ref: React.Ref<HTMLDivElement>;
  unit: Unit;
  related: Unit[];
  onPick: (u: Unit) => void;
  onClear: () => void;
}) {
  // Sector growth only means something for a job: a degree or a standard
  // feeds several occupations at once.
  const facts: [string][] = [
    ["salary"], ["competition"], ["openings"], ["entrants"],
    ...(unit.path === "jobs" ? ([["growth"]] as [string][]) : []),
  ];
  const risk = unit.risk == null ? null : riskWord(unit.risk);

  return (
    <div ref={ref} className="flex scroll-mt-24 flex-col gap-7 rounded-2xl border border-border-soft p-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">{typeOf(unit)}</p>
          <button
            type="button"
            onClick={onClear}
            aria-label="Close this result"
            className="-mr-2 -mt-1 rounded-md px-2 py-1 text-xs text-muted transition hover:text-ink"
          >
            Close ×
          </button>
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-ink">{unit.label}</h2>
        {unit.aka && unit.aka.length > 0 && (
          <p className="text-sm text-muted">
            Includes {unit.aka.slice(0, 5).join(", ")}
            {unit.aka.length > 5 ? ` and ${unit.aka.length - 5} more` : ""}
          </p>
        )}
        {risk && unit.risk != null ? (
          <p className="mt-1 flex items-center gap-2 text-lg">
            <Dot tone={risk.tone} />
            <strong className="text-ink">{risk.word}</strong>
            <span className="text-muted">{unit.risk} out of 100</span>
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted">
            No AI figures: no scored occupation sits underneath this one.
          </p>
        )}
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Job market</p>
        <dl className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-surface-alt px-4 py-4">
            <dt className="text-xs text-muted">{LABELS.salary}</dt>
            <dd className="text-2xl font-extrabold text-ink">
              {unit.salary == null ? "—" : money(unit.salary)}
            </dd>
          </div>
          <div className="rounded-xl bg-surface-alt px-4 py-4">
            <dt className="text-xs text-muted">{LABELS.competition}</dt>
            <dd className="text-ink">
              <span className="text-2xl font-extrabold">{unit.competition ?? "—"}</span>
              {unit.competition != null && <span className="text-sm text-muted"> per opening</span>}
            </dd>
            {unit.entrants != null && unit.openings != null && (
              <dd className="mt-1 text-xs text-muted">
                {count(unit.entrants)} entrants for {count(unit.openings)} openings a year
              </dd>
            )}
          </div>
        </dl>
        {unit.path === "jobs" && unit.growth != null && (
          <p className="mt-2 text-xs text-muted">{LABELS.growth} {pct(unit.growth)}</p>
        )}
        <details className="mt-3 text-sm text-muted">
          <summary className="cursor-pointer hover:text-ink">What these numbers mean</summary>
          <dl className="mt-2 flex flex-col gap-2">
            {facts.map(([k]) => (
              <div key={k}>
                <dt className="font-semibold text-ink">{LABELS[k]}</dt>
                <dd>{TOOLTIPS[k]}</dd>
              </div>
            ))}
          </dl>
        </details>
      </div>

      {unit.exposure != null && unit.substitution != null && (
        <div className="flex flex-col gap-5">
          <Meter label={LABELS.exposure} value={unit.exposure} help={TOOLTIPS.exposure} />
          <Meter label={LABELS.substitution} value={unit.substitution} help={TOOLTIPS.substitution} />
        </div>
      )}

      {related.length > 0 && <Related roles={related} onPick={onPick} />}
    </div>
  );
}

function Meter({ label, value, help }: { label: string; value: number; help: string }) {
  const b = band(value);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-semibold text-ink">{label}</span>
        <span className="flex items-center gap-2 text-sm">
          <Dot tone={b.tone} />
          <span className="text-muted">{b.word}</span>
          <span className="font-bold text-ink">{value}</span>
        </span>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        className="h-2 w-full overflow-hidden rounded-full bg-border-soft/40"
      >
        <div className="h-full rounded-full bg-accent-strong" style={{ width: `${value}%` }} />
      </div>
      <p className="text-xs text-muted">{help}</p>
    </div>
  );
}

function Openings({ n }: { n: number | null }) {
  return (
    <span className="whitespace-nowrap text-right text-xs tabular-nums text-muted">
      {n == null ? "—" : `${count(n)} a year`}
    </span>
  );
}

function RiskTag({ risk }: { risk: number | null }) {
  if (risk == null) return <span className="text-xs text-muted">—</span>;
  const w = riskWord(risk);
  return (
    <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs text-muted">
      <Dot tone={w.tone} />
      {w.word} · {risk}
    </span>
  );
}

function Related({ roles, onPick }: { roles: Unit[]; onPick: (u: Unit) => void }) {
  const [all, setAll] = useState(false);
  const shown = all ? roles : roles.slice(0, 8);
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">Jobs this leads to</p>
      <p className="mb-2 text-xs text-muted">
        {roles.length} jobs, most job openings first. The AI figures above are the average of these.
      </p>
      <ul className="divide-y divide-border-soft/60">
        {shown.map((r) => (
          <li key={r.id}>
            <button
              onClick={() => onPick(r)}
              className="grid w-full grid-cols-[minmax(0,1fr)_5.5rem_7.5rem] items-center gap-3 py-2 text-left text-sm hover:text-accent-strong"
            >
              <span className="min-w-0 truncate text-ink">{r.label}</span>
              <Openings n={r.openings} />
              <RiskTag risk={r.risk} />
            </button>
          </li>
        ))}
      </ul>
      {roles.length > 8 && (
        <button onClick={() => setAll(!all)} className="mt-2 text-xs text-accent-strong hover:underline">
          {all ? "Show fewer" : `Show all ${roles.length}`}
        </button>
      )}
    </div>
  );
}

function SectorList({
  title, units, selectedId, onPick,
}: {
  title: string;
  units: Unit[];
  selectedId: string | null;
  onPick: (u: Unit) => void;
}) {
  const rows = [...units].sort((a, b) => (b.openings ?? -1) - (a.openings ?? -1));
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-semibold text-ink">{title}</h3>
        <span className="text-xs text-muted">{rows.length}</span>
      </div>
      <ul className="max-h-[60vh] divide-y divide-border-soft/60 overflow-y-auto rounded-xl border border-border-soft">
        {rows.map((u) => (
          <li key={u.id}>
            <button
              onClick={() => onPick(u)}
              aria-current={u.id === selectedId || undefined}
              className={`grid w-full grid-cols-[minmax(0,1fr)_5.5rem_7.5rem] items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-surface-alt ${
                u.id === selectedId ? "bg-surface-alt" : ""
              }`}
            >
              <span className="min-w-0 truncate text-ink">
                {u.label}
                {u.level && <span className="text-muted"> · L{u.level}</span>}
              </span>
              <Openings n={u.openings} />
              <RiskTag risk={u.risk} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
