"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import { LABELS, TOOLTIPS } from "./copy";
import { JobMap } from "./Map";
import { SECTOR_LABEL } from "./sectors";
import { band, Dot, riskWord } from "@/app/lib/bands";
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
const PICK: Record<Path, string> = {
  jobs: "Choose a job sector",
  degrees: "Choose a degree area",
  apprenticeships: "Choose an apprenticeship route",
};

const money = (v: number) => `£${v.toLocaleString("en-GB")}`;
const count = (v: number) => v.toLocaleString("en-GB");
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
  // Jobs first, then degrees, then apprenticeships; best match within each.
  // Each path keeps a few slots so a wide job match ("account") cannot push
  // the degree and the apprenticeship out of the eight shown.
  hits.sort((a, b) => b[1] - a[1] || a[0].unit.label.length - b[0].unit.label.length);
  const SLOTS: Record<Path, number> = { jobs: 4, degrees: 2, apprenticeships: 2 };
  const kept = new Set<Hit>();
  for (const p of PATHS)
    for (const [h] of hits.filter(([h]) => h.unit.path === p).slice(0, SLOTS[p])) kept.add(h);
  for (const [h] of hits) if (kept.size < 8) kept.add(h);
  const rank = (h: Hit) => PATHS.indexOf(h.unit.path);
  return [...kept].sort((a, b) => rank(a) - rank(b));
}

export function Checker() {
  const [data, setData] = useState<V3 | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sector, setSector] = useState("");
  const [browse, setBrowse] = useState<Path>("jobs");
  // The unit a job was opened from (a degree's or standard's list), so a
  // reader can get back to it.
  const [prevId, setPrevId] = useState<string | null>(null);
  // The row under the pointer, ringed on the map.
  const [hoverId, setHoverId] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // The chosen unit lives in the URL so a parent can send the link on.
    const id = new URLSearchParams(window.location.search).get("id");
    fetch("/v3.json")
      .then((r) => r.json())
      .then((d: V3) => {
        setData(d);
        setSelectedId(id);
        const u = id ? d.units.find((x) => x.id === id) : null;
        if (u) {
          setBrowse(u.path);
          setSector(u.sectors[0] ?? "");
        }
      })
      .catch(() => setData(null));
  }, []);

  const jobs = useMemo(() => data?.units.filter((u) => u.path === "jobs") ?? [], [data]);
  const byId = useMemo(
    () => new Map<string, Unit>((data?.units ?? []).map((u) => [u.id, u])),
    [data],
  );

  // Choosing a unit also opens its sector in the browse list, so the similar
  // options sit under the result and light up on the map.
  const show = (id: string) => {
    setSelectedId(id);
    const u = byId.get(id);
    if (u) {
      setBrowse(u.path);
      setSector(u.sectors[0] ?? "");
    }
    window.history.replaceState(null, "", `?id=${encodeURIComponent(id)}`);
    requestAnimationFrame(() =>
      resultRef.current?.scrollIntoView({ block: "start", behavior: "smooth" }),
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
  const options = data.sectors[browse].map((s) => ({ id: s.id, label: SECTOR_LABEL[s.id] ?? s.label }));
  // Job sectors keep ONS code order (managers down to elementary), which
  // means something; degree areas do not, so they go A to Z.
  if (browse === "degrees") options.sort((a, b) => a.label.localeCompare(b.label));

  const map = <JobMap jobs={jobs} selected={selected} hover={hover} lit={sectorJobs} />;

  // Laptop: search, browse and the sector list down the left; the card on the
  // right. Phone: search, browse, then the card, then the list, so a reader
  // picks a path, reads it, and browses the rest of its sector underneath.
  return (
    <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[22rem_minmax(0,1fr)] lg:grid-rows-[auto_auto_1fr] lg:items-start lg:gap-x-12 lg:gap-y-6">
      <Search units={data.units} onPick={(u) => select(u.id)} />

      <div className="flex flex-col gap-3 text-sm text-muted">
        <div className="flex items-baseline justify-between gap-3">
          <span id="browse-label">Or browse</span>
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
          className="w-full rounded-xl border border-border-soft bg-surface-alt px-4 py-3 text-base text-ink outline-none transition focus:border-accent-strong"
        >
          <option value="">{PICK[browse]}</option>
          {options.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="lg:col-start-2 lg:row-span-3 lg:row-start-1">
        {selected ? (
          <Result
            ref={resultRef}
            unit={selected}
            related={related}
            prev={prev}
            map={map}
            onPick={(u) => select(u.id)}
            onHover={setHoverId}
            onBack={back}
            onClear={clear}
          />
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-border-soft p-5 sm:p-6">
            <div className="w-full max-w-xs">{map}</div>
            <p className="text-center text-sm text-muted">
              Pick a job, degree or apprenticeship to see its figures here.
            </p>
          </div>
        )}
      </div>

      {sector && (
        <SectorList
          title={sectorLabel}
          units={sectorUnits}
          selectedId={selectedId}
          onPick={(u) => select(u.id)}
          onHover={setHoverId}
        />
      )}
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
        placeholder="Search..."
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
  ref, unit, related, prev, map, onPick, onHover, onBack, onClear,
}: {
  ref: React.Ref<HTMLDivElement>;
  unit: Unit;
  related: Unit[];
  prev: Unit | null;
  map: React.ReactNode;
  onPick: (u: Unit) => void;
  onHover: (id: string | null) => void;
  onBack: () => void;
  onClear: () => void;
}) {
  const risk = unit.risk == null ? null : riskWord(unit.risk);
  const hasAi = unit.exposure != null && unit.substitution != null;

  return (
    <div ref={ref} className="flex scroll-mt-24 flex-col gap-6 rounded-2xl border border-border-soft p-5 sm:p-6">
      {/* The map sits beside the headline and figures from md up, under them
          on a phone, so the path is always seen next to where it sits. */}
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_16rem]">
      <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">{typeOf(unit)}</p>
          {prev && (
            <button
              type="button"
              onClick={onBack}
              className="-mt-1 ml-auto min-w-0 truncate rounded-md px-2 py-1 text-xs text-accent-strong transition hover:underline"
            >
              ← Back to {prev.label}
            </button>
          )}
          <button
            type="button"
            onClick={onClear}
            aria-label="Close this result"
            className="-mr-2 -mt-1 shrink-0 rounded-md px-2 py-1 text-xs text-muted transition hover:text-ink"
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

      <dl className="grid grid-cols-2 gap-3">
        <Fact label={LABELS.salary}>
          <span className="text-2xl font-extrabold">{unit.salary == null ? "—" : money(unit.salary)}</span>
        </Fact>
        <Fact label={LABELS.competition}>
          <span className="text-2xl font-extrabold">{unit.competition ?? "—"}</span>
          {unit.competition != null && <span className="text-sm text-muted"> per opening</span>}
        </Fact>
        <Fact label={LABELS.exposure}>
          <Score v={unit.exposure} />
        </Fact>
        <Fact label={LABELS.substitution}>
          <Score v={unit.substitution} />
        </Fact>
      </dl>
      </div>
      <div className="mx-auto w-full max-w-xs md:mx-0 md:max-w-none">{map}</div>
      </div>

      <div>
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
                {unit.entrants != null && unit.openings != null && (
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
                {hasAi && " The AI risk above combines these two scores."}
              </dd>
            </div>
          </dl>
        </details>
      </div>

      {related.length > 0 && <Related roles={related} onPick={onPick} onHover={onHover} />}
    </div>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-surface-alt px-4 py-4">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-ink">{children}</dd>
    </div>
  );
}

// A 0 to 100 score with its colour and band, so the card reads without the map.
function Score({ v }: { v: number | null }) {
  if (v == null) return <span className="text-2xl font-extrabold">—</span>;
  const b = band(v);
  return (
    <span className="flex items-center gap-2">
      <Dot tone={b.tone} />
      <span className="text-2xl font-extrabold">{v}</span>
      <span className="text-sm text-muted">{b.word}</span>
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

// Pointer or keyboard focus on a row rings that job on the map.
const hoverProps = (id: string, onHover: (id: string | null) => void) => ({
  onMouseEnter: () => onHover(id),
  onMouseLeave: () => onHover(null),
  onFocus: () => onHover(id),
  onBlur: () => onHover(null),
});

function Related({
  roles, onPick, onHover,
}: {
  roles: Unit[];
  onPick: (u: Unit) => void;
  onHover: (id: string | null) => void;
}) {
  const [all, setAll] = useState(false);
  const [sort, setSort] = useState<Sort<Col>>(null);
  const rows = sortRows(roles, sort, (u, k) => u[k]);
  const shown = all ? rows : rows.slice(0, 8);
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">Jobs this leads to</p>
      <p className="mb-2 text-xs text-muted">
        {roles.length} jobs, most job openings first. The AI figures above are the average of these.
      </p>
      <Cols sort={sort} onSort={setSort} className="pb-1" />
      <ul className="divide-y divide-border-soft/60">
        {shown.map((r) => (
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
      {roles.length > 8 && (
        <button onClick={() => setAll(!all)} className="mt-2 text-xs text-accent-strong hover:underline">
          {all ? "Show fewer" : `Show all ${roles.length}`}
        </button>
      )}
    </div>
  );
}

function SectorList({
  title, units, selectedId, onPick, onHover,
}: {
  title: string;
  units: Unit[];
  selectedId: string | null;
  onPick: (u: Unit) => void;
  onHover: (id: string | null) => void;
}) {
  const [sort, setSort] = useState<Sort<Col>>(null);
  const base = [...units].sort((a, b) => (b.openings ?? -1) - (a.openings ?? -1));
  const rows = sortRows(base, sort, (u, k) => u[k]);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-semibold text-ink">{title}</h3>
        <span className="text-xs text-muted">{rows.length}</span>
      </div>
      <Cols sort={sort} onSort={setSort} className="px-4" />
      <ul className="max-h-[60vh] divide-y divide-border-soft/60 overflow-y-auto rounded-xl border border-border-soft">
        {rows.map((u) => (
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
