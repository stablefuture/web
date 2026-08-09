"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { LABELS, PATHS, TOOLTIPS } from "./copy";
import { Scatter } from "./Scatter";

export type Path = "jobs" | "degrees" | "apprenticeships";

export type Unit = {
  id: string;
  path: Path;
  label: string;
  sectors: string[];
  roles?: number[];
  level?: string;
  unresolved?: boolean;
  exposure: number | null;
  substitution: number | null;
  risk: number | null;
  risk_raw: number | null;
  salary: number | null;
  openings: number | null;
  growth?: number | null;
  entrants?: number | null;
  competition?: number | null;
};

type Sector = { id: string; label: string };
type V3 = {
  meta: { counts: Record<Path, number> };
  sectors: Record<Path, Sector[]>;
  units: Unit[];
};

const STORE = "sf-v3-board";

const UNIT_WORD: Record<Path, string> = {
  jobs: "job",
  degrees: "degree",
  apprenticeships: "apprenticeship",
};

const fmtMoney = (v: number) => `£${v.toLocaleString("en-GB")}`;
const fmtCount = (v: number) => v.toLocaleString("en-GB");
const fmtPct = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v)}%`;

export function Board() {
  const [data, setData] = useState<V3 | null>(null);

  const [path, setPath] = useState<Path | null>("jobs");
  const [sector, setSector] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);

  const cardRefs = useRef(new Map<string, HTMLDivElement>());

  // ---- load -------------------------------------------------------------
  useEffect(() => {
    fetch("/v3.json").then((r) => r.json()).then(setData).catch(() => setData(null));
  }, []);

  // ---- persistence: the chosen path, sector and name, nothing else -------
  // Restored after mount rather than in a lazy initialiser on purpose:
  // localStorage does not exist during the server render, so initialising from
  // it would either crash or hydrate a different tree than the server sent.
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(STORE) ?? "null");
      if (s) {
        // Only restore a path the board still has. A stale or corrupt value
        // (e.g. a renamed path id) would make data.sectors[path] undefined and
        // crash the render, with reload looping on the same bad state.
        /* eslint-disable-next-line react-hooks/set-state-in-effect */
        setPath(PATHS.some((p) => p.id === s.path) ? s.path : "jobs");
        setSector(s.sector ?? null);
        setName(s.name ?? "");
        setSelectedId(s.selectedId ?? null);
      }
    } catch {
      /* corrupt or unavailable storage just means a fresh board */
    }
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored) return;
    try {
      localStorage.setItem(
        STORE,
        JSON.stringify({ path, sector, name, selectedId }),
      );
    } catch {
      /* private mode / quota: the board still works, it just won't persist */
    }
  }, [restored, path, sector, name, selectedId]);

  // ---- derived ----------------------------------------------------------
  const pathUnits = useMemo(
    () => (data && path ? data.units.filter((u) => u.path === path) : []),
    [data, path],
  );

  const jobUnits = useMemo(
    () => (data ? data.units.filter((u) => u.path === "jobs") : []),
    [data],
  );

  const rolesOf = useCallback(
    (u: Unit) =>
      (u.roles ?? [])
        .map((i) => jobUnits[i])
        .filter(Boolean)
        .sort((a, b) => (a.risk ?? 101) - (b.risk ?? 101)),
    [jobUnits],
  );

  const sectorLabel = useMemo(
    () => (data && path && sector
      ? data.sectors[path].find((s) => s.id === sector)?.label ?? null
      : null),
    [data, path, sector],
  );

  // Name search: find a specific thing you can already name. Matched token by
  // token with a crude plural strip, not as a substring — nobody types a label
  // exactly, and "sports science" has to reach "Sport and exercise sciences".
  // Every word typed must land somewhere in the title, so "robotics engineer"
  // does not drag in every engineer.
  const nameTokens = useMemo(
    () => name.trim().toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
      .map((w) => w.replace(/s$/, "")),
    [name],
  );

  const nameScore = useCallback((label: string) => {
    if (!nameTokens.length) return 0;
    const q = name.trim().toLowerCase();
    const l = label.toLowerCase();
    if (l === q) return 100;
    if (l.startsWith(q)) return 80;
    const words = l.split(/[^a-z0-9]+/).filter(Boolean).map((w) => w.replace(/s$/, ""));
    return nameTokens.every((t) => words.some((w) => w.startsWith(t))) ? 60 : 0;
  }, [name, nameTokens]);

  const nameIds = useMemo(() => {
    if (!name.trim()) return null;
    return new Set(pathUnits.filter((u) => nameScore(u.label) > 0).map((u) => u.id));
  }, [name, pathUnits, nameScore]);

  // Where else that name exists, so "robotics engineer" typed on the jobs board
  // still tells you there is an apprenticeship called that.
  const nameElsewhere = useMemo(() => {
    if (!data || !name.trim() || (nameIds?.size ?? 0) > 0) return [];
    return (["apprenticeships", "degrees", "jobs"] as Path[]).filter(
      (p) => p !== path && data.units.some((u) => u.path === p && nameScore(u.label) > 0),
    );
  }, [data, name, path, nameIds, nameScore]);

  // Sector chooses the part of the map; the name search finds one thing. Each
  // one added narrows.
  const { rows, fallbackNote } = useMemo(() => {
    const inSector = (u: Unit) => !sector || u.sectors.includes(sector);
    const inName = (u: Unit) => !nameIds || nameIds.has(u.id);
    let out = pathUnits.filter((u) => inSector(u) && inName(u));
    let note: string | null = null;
    if (!out.length && sector) {
      // A student who picks Legal and searches a name that lives elsewhere has
      // just learned something useful. An empty panel would throw it away. The
      // sector is the constraint that gives way, because it describes the map,
      // not the person.
      const without = pathUnits.filter(inName);
      if (without.length) {
        out = without;
        note = `Nothing in ${sectorLabel} matches that. Here's what does.`;
      }
    }

    const sorted = [...out].sort((a, b) => {
      if (a.risk_raw == null) return 1;
      if (b.risk_raw == null) return -1;
      if (a.risk_raw !== b.risk_raw) return a.risk_raw - b.risk_raw;
      // 33 occupations sit at exactly exposure 0, so sqrt(0 x substitution)
      // ties them all at risk 0 whatever their substitution. Break the tie on
      // substitution rather than leaving the order arbitrary — display only,
      // the risk figure itself is untouched.
      return (a.substitution ?? 0) - (b.substitution ?? 0);
    });
    return { rows: sorted, fallbackNote: note };
  }, [sector, nameIds, pathUnits, sectorLabel]);

  const highlighted = useMemo(
    () => (sector || nameIds ? new Set(rows.map((u) => u.id)) : null),
    [sector, nameIds, rows],
  );

  // ---- actions ----------------------------------------------------------
  // Opening a role from a degree's card moves the board to the jobs path with
  // that role selected. The other filters are cleared because a sector id and a
  // subject name mean nothing on the jobs board and would silently filter the
  // role you just asked for out of view.
  const jumpToRole = (id: string) => {
    setPath("jobs");
    setSector(null);
    setName("");
    setSelectedId(id);
    requestAnimationFrame(() =>
      cardRefs.current.get(id)?.scrollIntoView({ block: "center", behavior: "smooth" }),
    );
  };

  const select = (id: string) => {
    setSelectedId((cur) => (cur === id ? null : id));
    requestAnimationFrame(() =>
      cardRefs.current.get(id)?.scrollIntoView({ block: "nearest", behavior: "smooth" }),
    );
  };

  // ---- render -----------------------------------------------------------
  if (!data) {
    return <p className="py-16 text-center text-muted">Loading the board…</p>;
  }

  const sectors = path ? data.sectors[path] : [];

  return (
    <div className="flex flex-col gap-10">
      {/* controls: the path choice gates everything, so it leads and sits
          centred; the name and sector filters sit under it. */}
      <div className="flex flex-col gap-4">
        <select
          value={path ?? ""}
          onChange={(e) => {
            setPath(e.target.value as Path);
            setSector(null);
            setSelectedId(null);
          }}
          aria-label="Path"
          className="mx-auto w-full max-w-xs rounded-xl border border-border-soft bg-surface-alt px-4 py-3 text-center font-semibold text-ink outline-none transition focus:border-accent-strong"
        >
          {PATHS.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            value={name}
            onChange={(e) => { setName(e.target.value); setSelectedId(null); }}
            disabled={!path}
            placeholder={path ? `Find a ${UNIT_WORD[path]} by name` : "Find by name"}
            aria-label="Find by name"
            className="w-full rounded-xl border border-border-soft bg-surface-alt px-4 py-3 text-ink outline-none transition focus:border-accent-strong focus:ring-2 focus:ring-accent/40 disabled:opacity-50"
          />
          <SectorPicker
            sectors={sectors}
            value={sector}
            label={sectorLabel}
            disabled={!path}
            onChange={(id) => { setSector(id); setSelectedId(null); }}
          />
        </div>
      </div>

      {(sector || name.trim()) && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {name.trim() && <Chip onClear={() => setName("")}>“{name.trim()}”</Chip>}
          {sector && (
            <Chip onClear={() => setSector(null)}>{sectorLabel}</Chip>
          )}
        </div>
      )}

      {!path ? (
        <div className="rounded-xl border border-dashed border-border-soft px-6 py-16 text-center">
          <p className="text-lg text-ink">Pick a path to see what is on the board.</p>
          <p className="mt-2 text-sm text-muted">
            {data.meta.counts.apprenticeships} apprenticeships,{" "}
            {data.meta.counts.degrees} degrees, {data.meta.counts.jobs} jobs.
          </p>
        </div>
      ) : (
        // Table left, graph right on desktop; graph above the table on mobile.
        <div className="flex flex-col gap-12 lg:grid lg:grid-cols-2 lg:items-start lg:gap-14">
          <div className="order-1 lg:order-2 lg:sticky lg:top-6">
            <Scatter
              units={pathUnits}
              highlighted={highlighted}
              selectedId={selectedId}
              onSelect={select}
            />
          </div>

          <div className="order-2 flex flex-col gap-3 lg:order-1">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm text-muted">
                {rows.length} {UNIT_WORD[path]} title{rows.length === 1 ? "" : "s"}
              </p>
            </div>
            {fallbackNote && (
              <p className="rounded-lg border border-border-soft bg-surface-alt px-4 py-3 text-sm text-ink">
                {fallbackNote}
              </p>
            )}
            {rows.length === 0 && (
              <div className="rounded-lg border border-border-soft px-4 py-6 text-sm">
                <p className="text-ink">
                  Nothing here matches “{name.trim()}”.
                </p>
                {nameElsewhere.length > 0 && (
                  <p className="mt-2 text-muted">
                    There is one under{" "}
                    {nameElsewhere.map((p) => PATHS.find((x) => x.id === p)!.label).join(" and ")}
                    {" "}— switch path above.
                  </p>
                )}
              </div>
            )}
            <div className="flex max-h-[70vh] flex-col gap-2 overflow-y-auto pr-1">
              {rows.map((u) => (
                <Card
                  key={u.id}
                  unit={u}
                  open={u.id === selectedId}
                  onToggle={() => select(u.id)}
                  register={(el) => {
                    if (el) cardRefs.current.set(u.id, el);
                    else cardRefs.current.delete(u.id);
                  }}
                  relatedRoles={u.path === "jobs" ? [] : rolesOf(u)}
                  onJump={jumpToRole}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Chip({ children, onClear }: { children: React.ReactNode; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border-soft bg-surface-alt px-3 py-1 text-ink">
      {children}
      <button onClick={onClear} aria-label="Clear" className="text-muted hover:text-ink">
        ✕
      </button>
    </span>
  );
}

// Autocomplete over the sectors for the chosen path, populated on first press.
// Hand-rolled so it can be driven by keyboard: arrow keys move a highlight held
// on the input (not focus, which the blur-close would drop), Enter picks it, and
// the combobox roles let a screen reader announce the same.
function SectorPicker({
  sectors, value, label, disabled, onChange,
}: {
  sectors: Sector[];
  value: string | null;
  label: string | null;
  disabled: boolean;
  onChange: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [active, setActive] = useState(-1);
  const listId = useId();
  const listRef = useRef<HTMLUListElement>(null);

  const shown = useMemo(() => {
    const q = text.trim().toLowerCase();
    return q ? sectors.filter((s) => s.label.toLowerCase().includes(q)) : sectors;
  }, [sectors, text]);

  // One flat list so the "All sectors" reset is reachable by arrow keys too.
  const items = useMemo(() => {
    const base: { id: string | null; label: string }[] =
      value ? [{ id: null, label: "All sectors" }] : [];
    return base.concat(shown.map((s) => ({ id: s.id, label: s.label })));
  }, [value, shown]);

  // Keep the highlighted row in view when arrowing through a long list.
  useEffect(() => {
    if (active < 0) return;
    listRef.current?.querySelector(`[data-i="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const commit = (id: string | null) => { onChange(id); setOpen(false); setText(""); };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) { setOpen(true); setActive(0); return; }
      setActive((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (open && active >= 0 && active < items.length) {
        e.preventDefault();
        commit(items[active].id);
      }
    } else if (e.key === "Escape") {
      if (open) { e.preventDefault(); setOpen(false); }
    }
  };

  return (
    <div className="relative">
      <input
        value={open ? text : label ?? ""}
        disabled={disabled}
        onFocus={() => { setOpen(true); setText(""); setActive(-1); }}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        // A fresh filter clears the highlight so it never points at a stale row.
        onChange={(e) => { setText(e.target.value); setActive(-1); }}
        onKeyDown={onKeyDown}
        placeholder="Sector"
        aria-label="Sector"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          active >= 0 && active < items.length ? `${listId}-${active}` : undefined
        }
        className="w-full rounded-xl border border-border-soft bg-surface-alt px-4 py-3 text-ink outline-none transition focus:border-accent-strong focus:ring-2 focus:ring-accent/40 disabled:opacity-50"
      />
      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-border-soft bg-background shadow-lg"
        >
          {items.map((it, i) => (
            <li
              key={it.id ?? "__all__"}
              id={`${listId}-${i}`}
              data-i={i}
              role="option"
              aria-selected={it.id === value}
            >
              <button
                type="button"
                tabIndex={-1}
                onMouseDown={() => commit(it.id)}
                onMouseEnter={() => setActive(i)}
                className={`w-full px-4 py-2.5 text-left text-sm hover:bg-surface-alt ${
                  i === active ? "bg-surface-alt" : ""
                } ${
                  it.id === null
                    ? "text-muted"
                    : it.id === value
                      ? "font-semibold text-accent-strong"
                      : "text-ink"
                }`}
              >
                {it.label}
              </button>
            </li>
          ))}
          {shown.length === 0 && (
            <li className="px-4 py-3 text-sm text-muted">No sector by that name.</li>
          )}
        </ul>
      )}
    </div>
  );
}

function Card({
  unit, open, onToggle, register, relatedRoles, onJump,
}: {
  unit: Unit;
  open: boolean;
  onToggle: () => void;
  register: (el: HTMLDivElement | null) => void;
  relatedRoles: Unit[];
  onJump: (id: string) => void;
}) {
  const ai: [string, string][] = [
    ["exposure", unit.exposure == null ? "—" : `${unit.exposure}/100`],
    ["substitution", unit.substitution == null ? "—" : `${unit.substitution}/100`],
    ["risk", unit.risk == null ? "—" : `${unit.risk}/100`],
  ];
  const market: [string, string][] = [
    ["salary", unit.salary == null ? "—" : fmtMoney(unit.salary)],
    ["openings", unit.openings == null ? "—" : `${fmtCount(unit.openings)} a year`],
    // Sector growth is only meaningful for a job: a degree or a standard feeds
    // several occupations at once, so there is no one sector to grow.
    ...(unit.path === "jobs"
      ? ([["growth", unit.growth == null ? "—" : fmtPct(unit.growth)]] as [string, string][])
      : []),
    ["entrants", unit.entrants == null ? "—" : `${fmtCount(unit.entrants)} a year`],
    ["competition", unit.competition == null ? "—" : `${unit.competition} per opening`],
  ];

  return (
    <div
      ref={register}
      className={`rounded-xl border transition ${
        open ? "border-accent-strong bg-surface-alt" : "border-border-soft hover:border-accent/50"
      }`}
    >
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="min-w-0">
          <span className="block truncate font-medium text-ink">{unit.label}</span>
          {unit.level && (
            <span className="block text-xs text-muted">Level {unit.level}</span>
          )}
        </span>
        <span className="shrink-0 text-xs tabular-nums text-muted">
          {unit.risk == null ? "—" : `risk ${unit.risk}`}
        </span>
      </button>

      {open && (
        <div className="flex flex-col gap-4 border-t border-border-soft px-4 py-4">
          <Group
            title="AI impact"
            rows={ai}
            empty={unit.unresolved ? "No scored occupation sits underneath this one, so the AI figures are left blank rather than shown as zero." : null}
          />
          <Group title="Job market" rows={market} empty={null} />
          {relatedRoles.length > 0 && (
            <RelatedRoles roles={relatedRoles} onJump={onJump} />
          )}
        </div>
      )}
    </div>
  );
}

// The occupations this degree or standard leads to. This is where the AI figures
// on the card above actually come from, so it is also the answer to "why does my
// subject read like that" — least at risk first, and each one opens on the jobs
// board.
function RelatedRoles({ roles, onJump }: { roles: Unit[]; onJump: (id: string) => void }) {
  const [all, setAll] = useState(false);
  const shown = all ? roles : roles.slice(0, 10);
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        Roles this leads to
      </p>
      <p className="mb-1 text-xs text-muted">
        {roles.length} job{roles.length === 1 ? "" : "s"}, least at risk
        first. These are what the figures above are averaged from.
      </p>
      {shown.map((r) => (
        <button
          key={r.id}
          onClick={() => onJump(r.id)}
          className="flex w-full items-center justify-between gap-3 border-b border-border-soft/60 py-2 text-left text-sm last:border-0 hover:text-accent-strong"
        >
          <span className="min-w-0 truncate text-ink">{r.label}</span>
          <span className="shrink-0 tabular-nums text-muted">
            {r.risk == null ? "—" : `risk ${r.risk}`}
          </span>
        </button>
      ))}
      {roles.length > shown.length && (
        <button
          onClick={() => setAll(true)}
          className="mt-1 self-start text-xs text-accent-strong hover:underline"
        >
          Show all {roles.length}
        </button>
      )}
    </div>
  );
}

function Group({
  title, hint, rows, empty,
}: {
  title: string;
  hint?: string;
  rows: [string, string][];
  empty: string | null;
}) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
      {hint && <p className="mb-1 text-xs text-muted">{hint}</p>}
      {empty && <p className="mb-1 text-xs text-muted">{empty}</p>}
      {rows.map(([k, v]) => (
        <div key={k} className="border-b border-border-soft/60 last:border-0">
          {/* The whole row is the control: pressing the cell or the ? both
              show the same explanation. */}
          <button
            onClick={() => setOpenKey((c) => (c === k ? null : k))}
            aria-expanded={openKey === k}
            className="flex w-full items-center justify-between gap-3 py-2 text-left text-sm"
          >
            <span className="flex items-center gap-1.5 text-muted">
              <span
                aria-hidden
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold ${
                  openKey === k
                    ? "border-accent-strong text-accent-strong"
                    : "border-border-soft text-muted"
                }`}
              >
                ?
              </span>
              {LABELS[k]}
            </span>
            <span className="tabular-nums font-medium text-ink">{v}</span>
          </button>
          {openKey === k && (
            <p className="pb-3 text-xs leading-relaxed text-muted">{TOOLTIPS[k]}</p>
          )}
        </div>
      ))}
    </div>
  );
}
