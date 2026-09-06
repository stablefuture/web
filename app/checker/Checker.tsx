"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { LABELS, TOOLTIPS } from "./copy";
import { JobMap } from "./Map";
import { SECTOR_LABEL } from "./sectors";
import { band, Dot, type Tone } from "@/app/lib/bands";
import { loadError } from "@/app/lib/loadError";
import { type Sort, SortButton, sortRows } from "@/app/lib/sort";

export type Path = "jobs" | "degrees" | "apprenticeships";

export type Unit = {
  id: string;
  path: Path;
  label: string;
  aka?: string[];
  sectors: string[];
  roles?: number[];
  related_roles?: number[];
  level?: string;
  unresolved?: boolean;
  exposure: number | null;
  substitution: number | null;
  risk: number | null;
  salary: number | null;
  openings: number | null;
};

type Sector = { id: string; label: string };
type V3 = { sectors: Record<Path, Sector[]>; units: Unit[] };
// One history entry: the pick and the finder that led to it.
type Nav = { id: string | null; tab: Path; sector: string; q: string };

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
const byLabelThenId = <T extends { label: string; id: string }>(a: T, b: T) =>
  a.label.localeCompare(b.label) || a.id.localeCompare(b.id);

const words = (s: string) =>
  s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).map((w) => w.replace(/s$/, ""));

type Row = { unit: Unit; via: string | null };
type LeadKind = "trains_for" | "related_to" | null;
export type LeadRow = { unit: Unit; relation: LeadKind };

const leadKindRank: Record<Exclude<LeadKind, null>, number> = {
  trains_for: 0,
  related_to: 1,
};

function compareNullable(a: number | null, b: number | null, direction: "asc" | "desc"): number {
  if (a == null) return b == null ? 0 : 1;
  if (b == null) return -1;
  return direction === "asc" ? a - b : b - a;
}

// Keep the full classification visible, but make a job that appears in both
// groups a single Trains for row. This is the default order for paths which
// lead to jobs; the table's figure buttons can still apply a different sort.
export function sortLeadRows(rows: LeadRow[]): LeadRow[] {
  return [...rows].sort((a, b) =>
    (a.relation ? leadKindRank[a.relation] : 2)
    - (b.relation ? leadKindRank[b.relation] : 2)
    || compareNullable(a.unit.risk, b.unit.risk, "asc")
    || compareNullable(a.unit.salary, b.unit.salary, "desc")
    || a.unit.label.localeCompare(b.unit.label)
    || a.unit.id.localeCompare(b.unit.id),
  );
}

export function leadsFor(unit: Unit, jobs: Unit[]): LeadRow[] {
  if (unit.path === "jobs") {
    return jobs
      .filter((job) => job.id !== unit.id && job.sectors[0] === unit.sectors[0])
      .map((job) => ({ unit: job, relation: null }));
  }
  const trainsFor = new Set(unit.roles ?? []);
  const relatedTo = new Set(unit.related_roles ?? []);
  return [...new Set([...trainsFor, ...relatedTo])]
    .map((index) => ({ index, unit: jobs[index] }))
    .filter((row): row is { index: number; unit: Unit } => Boolean(row.unit))
    .map(({ index, unit: job }) => ({
      unit: job,
      relation: trainsFor.has(index) ? "trains_for" as const : "related_to" as const,
    }));
}

// Every typed word must start a word in the title, so "robotics engineer" does
// not drag in every engineer. A job's O*NET titles count too, one rank lower,
// so "web developer" reaches the unit group it sits in and the row says which
// title matched. Ties keep the order they came in.
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
  const hits: [Row, number, number][] = [];
  units.forEach((unit, i) => {
    const own = score(unit.label);
    if (own) { hits.push([{ unit, via: null }, own, i]); return; }
    const via = (unit.aka ?? []).find((a) => score(a) > 0);
    if (via) hits.push([{ unit, via }, 0.5, i]);
  });
  hits.sort((a, b) => b[1] - a[1] || a[2] - b[2]);
  return hits.map(([r]) => r);
}

export function Checker() {
  const [data, setData] = useState<V3 | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [tab, setTab] = useState<Path>("jobs");
  const [sector, setSector] = useState("");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // The unit a job was opened from (a degree's or standard's list), so a
  // reader can get back to it.
  const [prevId, setPrevId] = useState<string | null>(null);
  // The row under the pointer, marked on the map.
  const [hoverId, setHoverId] = useState<string | null>(null);

  // Everything on this page comes from one file, so a load that fails has to
  // say so. It used to fall back to null, which is what an unfinished load
  // looks like, and the page sat on "Loading…" for ever with nothing to act on.
  const load = useCallback(() => {
    // The chosen unit lives in the URL so a parent can send the link on.
    const id = new URLSearchParams(window.location.search).get("id");
    // A request that never settles is the same silent hang by another route.
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 15000);
    fetch("/v3.json", { signal: ctl.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`v3.json ${r.status}`);
        return r.json();
      })
      .then((d: V3) => {
        setData(d);
        setSelectedId(id);
        const u = id ? d.units.find((x) => x.id === id) : null;
        const nav: Nav = { id: u ? u.id : null, tab: u ? u.path : "jobs", sector: "", q: "" };
        setTab(nav.tab);
        // History is a convenience, never a reason to lose a loaded board.
        try {
          window.history.replaceState(nav, "");
        } catch {}
      })
      .catch((e) => setFailed(loadError(e)))
      .finally(() => clearTimeout(timer));
  }, []);

  useEffect(() => {
    load();
    // Back restores the pick and the finder as they were.
    const onPop = (e: PopStateEvent) => {
      const n = e.state as Nav | null;
      if (!n) return;
      setSelectedId(n.id);
      setTab(n.tab);
      setSector(n.sector);
      setQ(n.q);
      setPrevId(null);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [load]);

  const jobs = useMemo(() => data?.units.filter((u) => u.path === "jobs") ?? [], [data]);
  const byId = useMemo(
    () => new Map<string, Unit>((data?.units ?? []).map((u) => [u.id, u])),
    [data],
  );

  const go = (id: string | null) => {
    setSelectedId(id);
    const nav: Nav = { id, tab, sector, q };
    try {
      // Save the finder before leaving this entry, including edits made
      // since the page loaded, so Back restores the search that led here.
      window.history.replaceState({ id: selectedId, tab, sector, q } satisfies Nav, "");
      window.history.pushState(nav, "", id ? `?id=${encodeURIComponent(id)}` : window.location.pathname);
    } catch {
      // History can be unavailable; the selected result must still work.
    }
  };
  // On a phone the result sits under the finder, off-screen. A pick brings it
  // into view; on a laptop it is already beside the list, so nothing moves.
  const resultRef = useRef<HTMLDivElement>(null);
  const select = (id: string) => {
    if (id !== selectedId) setPrevId(selectedId);
    go(id);
    if (window.matchMedia("(max-width: 1023px)").matches) {
      resultRef.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start",
      });
    }
  };
  const back = () => window.history.back();
  const clear = () => {
    setPrevId(null);
    go(null);
  };

  const selected = (selectedId && byId.get(selectedId)) || null;
  const prev = (prevId && byId.get(prevId)) || null;
  const hover = (hoverId && byId.get(hoverId)) || null;

  // What the chosen path leads to. A degree or apprenticeship: the jobs its AI
  // figures are the average of. A job: the other jobs in its sector.
  const leads = useMemo<LeadRow[]>(() => {
    if (!selected) return [];
    const list = leadsFor(selected, jobs);
    return selected.path === "jobs" ? list.sort((a, b) => byOpenings(a.unit, b.unit)) : sortLeadRows(list);
  }, [selected, jobs]);

  // The finder's rows: this path, this sector, this search; A to Z.
  const pool = useMemo(
    () =>
      (data?.units ?? [])
        .filter((u) => u.path === tab && (!sector || u.sectors.includes(sector)))
        .sort(byLabelThenId),
    [data, tab, sector],
  );
  // Every job the chosen sector reaches: its own jobs, or the jobs its degrees
  // or apprenticeships lead to. A pick narrows the lit dots to what it leads to.
  const lit = useMemo(() => {
    if (selected) return new Set(leads.map(({ unit }) => unit.id));
    const ids = new Set<string>();
    if (!sector) return ids;
    for (const u of pool) {
      if (u.path === "jobs") ids.add(u.id);
      else {
        const indexes = [...new Set([...(u.roles ?? []), ...(u.related_roles ?? [])])];
        for (const i of indexes) if (jobs[i]) ids.add(jobs[i].id);
      }
    }
    return ids;
  }, [selected, leads, sector, pool, jobs]);
  const rows = useMemo(() => filter(pool, q), [pool, q]);

  if (!data) {
    if (!failed) return <p className="py-16 text-center text-muted">Loading…</p>;
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-ink">The career data did not load. {failed}</p>
        <p className="text-sm text-muted">
          Check your connection and try again. If it keeps failing, a content
          blocker or a private-browsing setting may be stopping the download.
        </p>
        <button
          type="button"
          onClick={() => { setFailed(null); load(); }}
          className="rounded-lg border border-border-soft px-4 py-2 text-sm font-semibold text-accent-strong transition hover:bg-surface-alt"
        >
          Try again
        </button>
      </div>
    );
  }

  const options = data.sectors[tab].map((s) => ({ id: s.id, label: SECTOR_LABEL[s.id] ?? s.label }));
  options.sort(byLabelThenId);
  const sectorOf = (u: Unit) => {
    const id = u.sectors[0];
    return SECTOR_LABEL[id] ?? PATHS.flatMap((p) => data.sectors[p]).find((s) => s.id === id)?.label ?? "";
  };

  // Laptop: the finder down the left; on the right the card beside the map,
  // and under them the jobs the path leads to. A phone stacks the same order.
  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[36rem_minmax(0,1fr)] lg:items-start lg:gap-x-8">
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
        <div className="grid items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <div className="relative min-w-0">
            <select
              aria-label="Sector"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="min-h-11 w-full min-w-0 appearance-none rounded-xl border border-border-soft bg-surface-alt py-2.5 pl-3 pr-8 text-base text-ink outline-none transition focus:border-accent-strong sm:text-sm"
            >
              <option value="">All sectors</option>
              {options.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
            <span aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">▾</span>
          </div>
          <span aria-hidden className="text-center text-[11px] font-semibold uppercase tracking-wider text-muted">or</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search..."
            aria-label={`Search ${GROUP[tab].toLowerCase()}`}
            autoComplete="off"
            className="min-h-11 min-w-0 rounded-xl border border-border-soft bg-surface-alt px-3 py-2.5 text-base text-ink outline-none transition focus:border-accent-strong focus:ring-2 focus:ring-accent/40 sm:text-sm"
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

      <div className="flex flex-col gap-4">
        <div ref={resultRef} className="grid items-start scroll-mt-16 gap-6 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <Card unit={selected} prev={prev} onBack={back} onClear={clear} />
          <div className="flex items-center justify-center rounded-2xl border border-border-soft p-3">
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
  unit, prev, onBack, onClear,
}: {
  unit: Unit | null;
  prev: Unit | null;
  onBack: () => void;
  onClear: () => void;
}) {
  const tone = (v: number | null | undefined): Tone => (v == null ? "none" : band(v).tone);
  const ink = unit ? "text-ink" : "text-muted";
  return (
    <div className="flex h-fit min-w-0 flex-col gap-3 rounded-2xl border border-border-soft p-3 sm:p-4">
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
        {unit && unit.risk == null && (
          <p className="mt-1 text-sm text-muted">
            No AI figures: no scored occupation sits underneath this one.
          </p>
        )}
      </div>

      <dl className={`grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 ${ink}`}>
        <Fact label="AI risk">
          <Score v={unit ? unit.risk : 0} tone={unit ? tone(unit.risk) : "none"} />
        </Fact>
        <Fact label={LABELS.salary}>
          <span className="text-2xl font-extrabold">
            {unit ? (unit.salary == null ? "—" : money(unit.salary)) : "£0"}
          </span>
        </Fact>
      </dl>

      <details className="text-sm text-muted">
        <summary className="cursor-pointer hover:text-ink">What these numbers mean</summary>
        <dl className="mt-2 flex flex-col gap-2">
          <div>
            <dt className="font-semibold text-ink">AI risk</dt>
            <dd>{TOOLTIPS.risk}</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">{LABELS.salary}</dt>
            <dd>{TOOLTIPS.salary}</dd>
          </div>
        </dl>
      </details>
    </div>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-surface-alt px-4 py-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

// A 0 to 100 score with its colour; grey when there is no figure yet.
function Score({ v, tone }: { v: number | null; tone: Tone }) {
  return (
    <span className="flex items-center gap-2">
      <Dot tone={tone} />
      <span className="text-2xl font-extrabold">{v ?? "—"}</span>
      <span className="text-sm text-muted">/ 100</span>
    </span>
  );
}

type Col = "salary" | "risk";
// Fixed tracks for the two figure columns; the name takes the rest and wraps,
// so the list never grows past its box on a phone. The wide leads panel puts
// more air between the two figures.
const ROW = "grid grid-cols-[minmax(0,1fr)_4.25rem_3.25rem] items-center gap-3";
const WIDE_ROW = "grid grid-cols-[minmax(0,1fr)_4.25rem_3.25rem] items-center gap-3 sm:gap-8";

// Column labels over a job list: salary and risk, each sortable.
function Cols({
  sort, onSort, wide = false, className = "",
}: {
  sort: Sort<Col>; onSort: (s: Sort<Col>) => void; wide?: boolean; className?: string;
}) {
  return (
    <div className={`flex justify-end ${wide ? "gap-3 sm:gap-8" : "gap-3"} ${className}`}>
      <SortButton k="salary" label="Salary" sort={sort} onSort={onSort} className="min-w-[4.25rem]" />
      <SortButton k="risk" label="AI risk" sort={sort} onSort={onSort} className="w-[3.25rem]" />
    </div>
  );
}

function SalaryCell({ salary }: { salary: number | null }) {
  return (
    <span className="whitespace-nowrap text-xs tabular-nums text-muted">
      {salary == null ? "—" : money(salary)}
    </span>
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

// The finder's table: as tall as the rows it holds, capped so 674
// apprenticeship standards take no more room than four degrees.
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
    <div className="mt-2 flex flex-col gap-1">
      <div className="flex items-end justify-between gap-3 px-4">
        <span className="text-xs text-muted">
          {rows.length === total ? `${count(total)} ${what}` : `${count(rows.length)} of ${count(total)} ${what}`}
        </span>
        <Cols sort={sort} onSort={setSort} />
      </div>
      <ul className="max-h-[21rem] divide-y divide-border-soft/60 overflow-y-auto rounded-xl border border-border-soft">
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
              <SalaryCell salary={u.salary} />
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
  rows: LeadRow[];
  sector: string;
  onPick: (u: Unit) => void;
  onHover: (id: string | null) => void;
}) {
  const [sort, setSort] = useState<Sort<Col>>(null);
  const sorted = sortRows(rows, sort, (row, k) => row.unit[k]);
  const job = unit?.path === "jobs";
  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-border-soft p-4 sm:p-5">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
          {job ? "Similar jobs" : "Jobs this leads to"}
        </h3>
        <p className="text-xs text-muted">
          {!unit
            ? "Pick a path to see the jobs it leads to, or the jobs like it."
            : job
              ? `${rows.length} other jobs in ${sector}, biggest first.`
              : `${rows.length} jobs: Trains for first, then lower AI risk and higher salary. The AI figures above are the average of these.`}
        </p>
      </div>
      {rows.length > 0 && (
        <>
          <Cols sort={sort} onSort={setSort} wide className="pb-1" />
          <ul className="max-h-[20rem] divide-y divide-border-soft/60 overflow-y-auto">
            {sorted.map((r) => (
              <li key={r.unit.id}>
                <button
                  onClick={() => onPick(r.unit)}
                  {...hoverProps(r.unit.id, onHover)}
                  className={`${WIDE_ROW} w-full py-2 text-left text-sm hover:text-accent-strong`}
                >
                  <span className="min-w-0 break-words text-ink">
                    {r.unit.label}
                    {r.relation && (
                      <span className="ml-2 inline-block rounded bg-brand-100 px-1.5 py-0.5 align-middle text-[11px] font-semibold leading-none text-accent-strong">
                        {r.relation === "trains_for" ? "Trains for" : "Related to"}
                      </span>
                    )}
                  </span>
                  <SalaryCell salary={r.unit.salary} />
                  <RiskTag risk={r.unit.risk} />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
