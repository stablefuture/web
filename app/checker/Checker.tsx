"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { LABELS, TOOLTIPS } from "./copy";
import { JobMap } from "./Map";
import { SECTOR_LABEL } from "./sectors";
import { band, Dot, type Tone } from "@/app/lib/bands";
import { type Sort, SortButton, sortRows } from "@/app/lib/sort";

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

// Pay to the nearest hundred: a snapshot, not a payslip.
const money = (v: number) => `£${(Math.round(v / 100) * 100).toLocaleString("en-GB")}`;
const count = (v: number) => v.toLocaleString("en-GB");
const typeOf = (u: Unit) => `${TYPE[u.path]}${u.level ? ` · Level ${u.level}` : ""}`;
const byOpenings = (a: Unit, b: Unit) => (b.openings ?? -1) - (a.openings ?? -1);

const words = (s: string) =>
  s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).map((w) => w.replace(/s$/, ""));

type Row = { unit: Unit; via: string | null };

// Every typed word must start a word in the title, so "robotics engineer" does
// not drag in every engineer. A job's O*NET titles count too, one rank lower,
// so "web developer" reaches the unit group it sits in and the row says which
// title matched.
function filter(units: Unit[], q: string): Row[] {
  const toks = words(q);
  if (!toks.length) return units.map((unit) => ({ unit, via: null }));
  const full = toks.join(" ");
  const score = (label: string) => {
    const lw = words(label);
    const l = lw.join(" ");
    return l === full ? 3
      : l.startsWith(full) ? 2
      : toks.every((t) => lw.some((w) => w.startsWith(t))) ? 1
      : 0;
  };
  const hits: [Row, number][] = [];
  for (const unit of units) {
    const own = score(unit.label);
    if (own) { hits.push([{ unit, via: null }, own]); continue; }
    const via = (unit.aka ?? []).find((a) => score(a) > 0);
    if (via) hits.push([{ unit, via }, 0.5]);
  }
  hits.sort((a, b) => b[1] - a[1] || byOpenings(a[0].unit, b[0].unit));
  return hits.map(([r]) => r);
}

export function Checker() {
  const [data, setData] = useState<V3 | null>(null);
  const [tab, setTab] = useState<Path>("jobs");
  const [sector, setSector] = useState("");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // The unit a job was opened from (a degree's or standard's list), so a
  // reader can get back to it.
  const [prevId, setPrevId] = useState<string | null>(null);
  // The row under the pointer, marked on the map.
  const [hoverId, setHoverId] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // The chosen unit lives in the URL so a parent can send the link on.
    const id = new URLSearchParams(window.location.search).get("id");
    fetch("/v3.json")
      .then((r) => r.json())
      .then((d: V3) => {
        setData(d);
        setSelectedId(id);
        const u = id ? d.units.find((x) => x.id === id) : null;
        if (u) setTab(u.path);
      })
      .catch(() => setData(null));
  }, []);

  const jobs = useMemo(() => data?.units.filter((u) => u.path === "jobs") ?? [], [data]);
  const byId = useMemo(
    () => new Map<string, Unit>((data?.units ?? []).map((u) => [u.id, u])),
    [data],
  );

  const show = (id: string) => {
    setSelectedId(id);
    window.history.replaceState(null, "", `?id=${encodeURIComponent(id)}`);
    requestAnimationFrame(() =>
      cardRef.current?.scrollIntoView({ block: "start", behavior: "smooth" }),
    );
  };
  const select = (id: string) => {
    if (id !== selectedId) setPrevId(selectedId);
    show(id);
  };
  const back = () => {
    if (prevId) show(prevId);
    setPrevId(null);
  };
  const clear = () => {
    setSelectedId(null);
    setPrevId(null);
    window.history.replaceState(null, "", window.location.pathname);
  };

  const selected = (selectedId && byId.get(selectedId)) || null;
  const prev = (prevId && byId.get(prevId)) || null;
  const hover = (hoverId && byId.get(hoverId)) || null;

  // What the chosen path leads to. A degree or apprenticeship: the jobs its AI
  // figures are the average of. A job: the other jobs in its sector.
  const leads = useMemo<Unit[]>(() => {
    if (!selected) return [];
    const list =
      selected.path === "jobs"
        ? jobs.filter((u) => u.id !== selected.id && u.sectors[0] === selected.sectors[0])
        : (selected.roles ?? []).map((i) => jobs[i]).filter(Boolean);
    return [...list].sort(byOpenings);
  }, [selected, jobs]);
  const lit = useMemo(() => new Set(leads.map((u) => u.id)), [leads]);

  // The finder's rows: this path, this sector, this search.
  const pool = useMemo(
    () =>
      (data?.units ?? [])
        .filter((u) => u.path === tab && (!sector || u.sectors.includes(sector)))
        .sort(byOpenings),
    [data, tab, sector],
  );
  const rows = useMemo(() => filter(pool, q), [pool, q]);

  if (!data) return <p className="py-16 text-center text-muted">Loading…</p>;

  const options = data.sectors[tab].map((s) => ({ id: s.id, label: SECTOR_LABEL[s.id] ?? s.label }));
  // Job sectors keep ONS code order (managers down to elementary), which
  // means something; degree areas do not, so they go A to Z.
  if (tab === "degrees") options.sort((a, b) => a.label.localeCompare(b.label));
  const sectorOf = (u: Unit) => {
    const id = u.sectors[0];
    return SECTOR_LABEL[id] ?? PATHS.flatMap((p) => data.sectors[p]).find((s) => s.id === id)?.label ?? "";
  };

  // Laptop: the finder down the left; on the right the card beside the map,
  // and under them the jobs the path leads to. A phone stacks the same order.
  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[24rem_minmax(0,1fr)] lg:items-start lg:gap-x-10">
      <section aria-label="Find a path" className="flex flex-col gap-3">
        <div role="group" aria-label="Path" className="flex gap-1 rounded-lg bg-surface-alt p-1">
          {PATHS.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={tab === p}
              onClick={() => { setTab(p); setSector(""); }}
              className={`flex-1 rounded-md px-2 py-1.5 text-sm transition ${
                tab === p ? "bg-background font-semibold text-ink shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              {GROUP[p]}
            </button>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <select
            aria-label="Sector"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="min-w-0 rounded-xl border border-border-soft bg-surface-alt px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent-strong"
          >
            <option value="">All sectors</option>
            {options.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search..."
            aria-label={`Search ${GROUP[tab].toLowerCase()}`}
            autoComplete="off"
            className="min-w-0 rounded-xl border border-border-soft bg-surface-alt px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent-strong focus:ring-2 focus:ring-accent/40"
          />
        </div>
        <Table
          rows={rows}
          total={pool.length}
          path={tab}
          selectedId={selectedId}
          onPick={(u) => select(u.id)}
          onHover={setHoverId}
        />
      </section>

      <div className="flex flex-col gap-6">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_20rem]">
          <Card ref={cardRef} unit={selected} prev={prev} onBack={back} onClear={clear} />
          <div className="flex justify-center rounded-2xl border border-border-soft p-4">
            <div className="w-full max-w-xs md:max-w-none">
              <JobMap jobs={jobs} selected={selected} hover={hover} lit={lit} />
            </div>
          </div>
        </div>
        <Leads
          unit={selected}
          rows={leads}
          sector={selected ? sectorOf(selected) : ""}
          onPick={(u) => select(u.id)}
          onHover={setHoverId}
        />
      </div>
    </div>
  );
}

// The chosen path's figures. With nothing chosen it shows its own shape in
// grey, so the page reads the same before and after a pick.
function Card({
  ref, unit, prev, onBack, onClear,
}: {
  ref: React.Ref<HTMLDivElement>;
  unit: Unit | null;
  prev: Unit | null;
  onBack: () => void;
  onClear: () => void;
}) {
  const tone = (v: number | null | undefined): Tone => (v == null ? "none" : band(v).tone);
  const hasAi = unit != null && unit.exposure != null && unit.substitution != null;
  const ink = unit ? "text-ink" : "text-muted";
  return (
    <div ref={ref} className="flex scroll-mt-24 flex-col gap-5 rounded-2xl border border-border-soft p-5 sm:p-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            {unit ? typeOf(unit) : "Job, degree or apprenticeship"}
          </p>
          {prev && (
            <button
              type="button"
              onClick={onBack}
              className="-mt-1 ml-auto min-w-0 truncate rounded-md px-2 py-1 text-xs text-accent-strong transition hover:underline"
            >
              ← Back to {prev.label}
            </button>
          )}
          {unit && (
            <button
              type="button"
              onClick={onClear}
              aria-label="Clear this result"
              className="-mr-2 -mt-1 shrink-0 rounded-md px-2 py-1 text-xs text-muted transition hover:text-ink"
            >
              Clear ×
            </button>
          )}
        </div>
        <h2 className={`text-2xl font-extrabold tracking-tight ${ink}`}>
          {unit ? unit.label : "Pick one from the list"}
        </h2>
        {unit && unit.aka && unit.aka.length > 0 && (
          <p className="text-sm text-muted">
            Includes {unit.aka.slice(0, 5).join(", ")}
            {unit.aka.length > 5 ? ` and ${unit.aka.length - 5} more` : ""}
          </p>
        )}
        {unit && unit.risk == null ? (
          <p className="mt-1 text-sm text-muted">
            No AI figures: no scored occupation sits underneath this one.
          </p>
        ) : (
          <p className={`mt-1 flex items-center gap-2 text-lg ${ink}`}>
            <Dot tone={tone(unit?.risk)} />
            <strong>Risk:</strong> {unit?.risk ?? 0} / 100
          </p>
        )}
      </div>

      <dl className={`grid grid-cols-2 gap-3 ${ink}`}>
        <Fact label={LABELS.salary}>
          <span className="text-2xl font-extrabold">
            {unit ? (unit.salary == null ? "—" : money(unit.salary)) : "£0"}
          </span>
        </Fact>
        <Fact label={LABELS.competition}>
          <span className="text-2xl font-extrabold">{unit ? (unit.competition ?? "—") : 0}</span>
          <span className="text-sm text-muted"> per opening</span>
        </Fact>
        <Fact label={LABELS.exposure}>
          <Score v={unit ? unit.exposure : 0} />
        </Fact>
        <Fact label={LABELS.substitution}>
          <Score v={unit ? unit.substitution : 0} />
        </Fact>
      </dl>

      <details className="text-sm text-muted">
        <summary className="cursor-pointer hover:text-ink">What these numbers mean</summary>
        <dl className="mt-2 flex flex-col gap-2">
          <div>
            <dt className="font-semibold text-ink">{LABELS.salary}</dt>
            <dd>{TOOLTIPS.salary}</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">{LABELS.competition}</dt>
            <dd>
              {TOOLTIPS.competition}
              {unit && unit.entrants != null && unit.openings != null && (
                <> Here, {count(unit.entrants)} entrants a year for {count(unit.openings)} openings.</>
              )}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">{LABELS.exposure}</dt>
            <dd>{TOOLTIPS.exposure}</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">{LABELS.substitution}</dt>
            <dd>
              {TOOLTIPS.substitution}
              {hasAi && " The risk above combines these two scores."}
            </dd>
          </div>
        </dl>
      </details>
    </div>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-surface-alt px-4 py-4">
      <dt className="text-xs text-muted">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

// A 0 to 100 score with its colour; grey when there is no figure yet.
function Score({ v }: { v: number | null }) {
  return (
    <span className="flex items-center gap-2">
      <Dot tone={v == null ? "none" : band(v).tone} />
      <span className="text-2xl font-extrabold">{v ?? "—"}</span>
      <span className="text-sm text-muted">/ 100</span>
    </span>
  );
}

function Openings({ n }: { n: number | null }) {
  return (
    <span className="whitespace-nowrap text-right text-xs tabular-nums text-muted">
      {n == null ? "—" : count(Math.round(n / 100) * 100)}
    </span>
  );
}

type Col = "openings" | "risk";
// Fixed tracks for the two figure columns; the name takes the rest and wraps,
// so the list never grows past its box on a phone.
const ROW = "grid grid-cols-[minmax(0,1fr)_5rem_3.25rem] items-center gap-3";

// Column labels over a job list: openings and risk, each sortable.
function Cols({ sort, onSort, className = "" }: { sort: Sort<Col>; onSort: (s: Sort<Col>) => void; className?: string }) {
  return (
    <div className={`flex justify-end gap-3 ${className}`}>
      <SortButton k="openings" label="Yearly openings" sort={sort} onSort={onSort} align="right" className="min-w-[5rem]" />
      <SortButton k="risk" label="AI risk" sort={sort} onSort={onSort} className="w-[3.25rem]" />
    </div>
  );
}

function RiskTag({ risk }: { risk: number | null }) {
  if (risk == null) return <span className="text-xs text-muted">—</span>;
  return (
    <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs tabular-nums text-muted">
      <Dot tone={band(risk).tone} />
      {risk}
    </span>
  );
}

// Pointer or keyboard focus on a row marks that path on the map.
const hoverProps = (id: string, onHover: (id: string | null) => void) => ({
  onMouseEnter: () => onHover(id),
  onMouseLeave: () => onHover(null),
  onFocus: () => onHover(id),
  onBlur: () => onHover(null),
});

// The finder's table: a fixed box that scrolls, so 674 apprenticeship
// standards take no more room than four degrees.
function Table({
  rows, total, path, selectedId, onPick, onHover,
}: {
  rows: Row[];
  total: number;
  path: Path;
  selectedId: string | null;
  onPick: (u: Unit) => void;
  onHover: (id: string | null) => void;
}) {
  const [sort, setSort] = useState<Sort<Col>>(null);
  const sorted = sortRows(rows, sort, (r, k) => r.unit[k]);
  const what = GROUP[path].toLowerCase();
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-end justify-between gap-3 px-4">
        <span className="text-xs text-muted">
          {rows.length === total ? `${count(total)} ${what}` : `${count(rows.length)} of ${count(total)} ${what}`}
        </span>
        <Cols sort={sort} onSort={setSort} />
      </div>
      <ul className="h-[26rem] divide-y divide-border-soft/60 overflow-y-auto rounded-xl border border-border-soft">
        {sorted.map(({ unit: u, via }) => (
          <li key={u.id}>
            <button
              onClick={() => onPick(u)}
              aria-current={u.id === selectedId || undefined}
              {...hoverProps(u.id, onHover)}
              className={`${ROW} w-full px-4 py-2.5 text-left text-sm hover:bg-surface-alt ${
                u.id === selectedId ? "bg-surface-alt" : ""
              }`}
            >
              <span className="min-w-0 break-words text-ink">
                {u.label}
                {u.level && <span className="text-muted"> · L{u.level}</span>}
                {via && <span className="text-muted"> · includes {via}</span>}
              </span>
              <Openings n={u.openings} />
              <RiskTag risk={u.risk} />
            </button>
          </li>
        ))}
        {sorted.length === 0 && (
          <li className="px-4 py-3 text-sm text-muted">Nothing by that name. Try a shorter word.</li>
        )}
      </ul>
    </div>
  );
}

// Under the card: the jobs a degree or apprenticeship leads to, or the jobs
// like the chosen job. These are the dots lit on the map.
function Leads({
  unit, rows, sector, onPick, onHover,
}: {
  unit: Unit | null;
  rows: Unit[];
  sector: string;
  onPick: (u: Unit) => void;
  onHover: (id: string | null) => void;
}) {
  const [sort, setSort] = useState<Sort<Col>>(null);
  const sorted = sortRows(rows, sort, (u, k) => u[k]);
  const job = unit?.path === "jobs";
  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-border-soft p-5 sm:p-6">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
          {job ? "Similar jobs" : "Jobs this leads to"}
        </h3>
        <p className="text-xs text-muted">
          {!unit
            ? "Pick a path to see the jobs it leads to, or the jobs like it."
            : job
              ? `${rows.length} other jobs in ${sector}, most openings first.`
              : `${rows.length} jobs, most openings first. The AI figures above are the average of these.`}
        </p>
      </div>
      {rows.length > 0 && (
        <>
          <Cols sort={sort} onSort={setSort} className="pb-1" />
          <ul className="max-h-[24rem] divide-y divide-border-soft/60 overflow-y-auto">
            {sorted.map((r) => (
              <li key={r.id}>
                <button
                  onClick={() => onPick(r)}
                  {...hoverProps(r.id, onHover)}
                  className={`${ROW} w-full py-2 text-left text-sm hover:text-accent-strong`}
                >
                  <span className="min-w-0 break-words text-ink">{r.label}</span>
                  <Openings n={r.openings} />
                  <RiskTag risk={r.risk} />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
