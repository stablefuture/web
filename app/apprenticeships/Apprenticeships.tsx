"use client";

import { useEffect, useMemo, useState, useCallback } from "react";

type Std = {
  code: string; name: string; ssa: string; level: string | null; route: string | null;
  sector: string | null; duration: number | null; funding: number | null; hours: number | null;
  status: string | null; link: string | null;
  ach: number | null; ach_hist: Record<string, number>;
  ach16: number | null; ach16_hist: Record<string, number>;
  leavers: number | null; leavers16: number | null;
  starts: Record<string, number>; starts_total: number; starts_u19: number;
  vac: number; months: Record<string, number>;
  wage: number | null; wage_year: string | null;
  q: string; qc: string; qt: string;
};
type HireRow = [string, string, string, number, number | null, string];
type Meta = {
  standards: number; employers: number; with_ach: number; vac_total: number;
  ach_years: string[]; start_years: string[]; posted_to: string;
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_KEYS = ["01","02","03","04","05","06","07","08","09","10","11","12"];

const fmt = (n: number | null | undefined) => n == null ? "—" : n.toLocaleString("en-GB");
const gbp = (n: number | null | undefined) => n == null ? "—" : "£" + n.toLocaleString("en-GB");
const pct = (n: number | null | undefined) => n == null ? "—" : n.toFixed(1) + "%";
const ay = (y: string) => y.slice(2, 4) + "/" + y.slice(4, 6);

// England's all-apprenticeship average sat ~60% in 2023/24, so colour relative to that
// rather than an absolute pass mark.
function band(r: number | null) {
  if (r == null) return "text-muted";
  if (r >= 65) return "text-emerald-700 dark:text-emerald-400";
  if (r >= 50) return "text-amber-700 dark:text-amber-400";
  return "text-rose-700 dark:text-rose-400";
}

// Crude suffix stripping so "marketing" matches "Marketer" and "engineering" matches
// "Engineer". Good enough for job titles; not worth a real stemmer.
const stem = (w: string) => w.replace(/(ings?|ers?|ed|s)$/, "");
const words = (s: string) => s.toLowerCase().match(/[a-z0-9]+/g) ?? [];

/** Score a standard against query terms. Name beats sector beats advert titles. */
function score(r: Std, terms: string[]) {
  const fields: [Set<string>, number][] = [
    [new Set(words(r.q).map(stem)), 100],
    [new Set(words(r.qc).map(stem)), 20],
    [new Set(words(r.qt).map(stem)), 5],
  ];
  let total = 0;
  for (const t of terms) {
    let best = 0;
    for (const [set, w] of fields) {
      for (const b of set) if (b.startsWith(t)) { best = Math.max(best, w); break; }
    }
    if (!best) return 0;   // every term must hit something
    total += best;
  }
  return total;
}

function Bars({ data, keys, mode }: {
  data: Record<string, number>; keys?: string[]; mode: "pc" | "n" | "mo";
}) {
  const ks = keys ?? Object.keys(data).sort();
  const vals = ks.map(k => data[k] ?? 0);
  if (!ks.length || !vals.some(v => v)) return <p className="text-sm text-muted">No data.</p>;
  // Rates get a fixed 0-100 scale so a 53% vs 60% gap reads as the small gap it is;
  // counts scale to their own max.
  const max = mode === "pc" ? 100 : Math.max(...vals, 1);
  const peak = Math.max(...vals);
  return (
    <div className="flex items-end gap-1.5">
      {ks.map((k, i) => (
        <div key={k} className="flex flex-1 flex-col justify-end">
          <span className="text-center text-[10px] tabular-nums text-ink">
            {mode === "pc" ? pct(vals[i]) : fmt(Math.round(vals[i]))}
          </span>
          <span
            className={`block rounded-t bg-accent ${vals[i] === peak && mode !== "pc" ? "opacity-100" : "opacity-70"}`}
            style={{ height: Math.max(3, (vals[i] / max) * 56) }}
          />
          <span className="mt-1 text-center text-[10px] text-muted">
            {mode === "mo" ? MONTHS[+k - 1] : k.length === 6 ? ay(k) : k}
          </span>
        </div>
      ))}
    </div>
  );
}

const inputCls =
  "rounded-lg border border-border-soft bg-background px-3 py-2 text-sm text-ink " +
  "outline-none focus:border-accent focus:ring-2 focus:ring-accent/30";
const thCls =
  "sticky top-0 z-10 cursor-pointer whitespace-nowrap border-b border-border-soft " +
  "bg-background px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted";
const tdCls = "border-b border-border-soft px-3 py-2.5 align-middle";

export function Apprenticeships() {
  const [std, setStd] = useState<Std[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [hire, setHire] = useState<HireRow[] | null>(null);
  const [tab, setTab] = useState<"std" | "hire">("std");
  const [open, setOpen] = useState<Std | null>(null);

  const [q, setQ] = useState("");
  const [level, setLevel] = useState("");
  // A standard with 10 leavers can show 100% completion, which is noise, not a
  // recommendation. Default to a sample big enough to mean something.
  const [minL, setMinL] = useState("50");
  const [sort, setSort] = useState<keyof Std>("starts_total");
  const [dir, setDir] = useState<"asc" | "desc">("desc");

  const [hq, setHq] = useState("");
  const [hloc, setHloc] = useState("");

  useEffect(() => {
    fetch("/apprenticeships-standards.json")
      .then(r => r.json())
      .then(d => { setStd(d.rows); setMeta(d.meta); })
      .catch(() => setStd([]));
  }, []);

  const loadHire = useCallback(async () => {
    if (hire) return;
    const d = await (await fetch("/apprenticeships-hiring.json")).json();
    setHire(d.rows);
  }, [hire]);

  const rows = useMemo(() => {
    const terms = words(q).map(stem);
    let out = std;
    if (terms.length) {
      out = out
        .map(r => [score(r, terms), r] as [number, Std])
        .filter(([s]) => s > 0)
        .sort((a, b) => b[0] - a[0] || b[1].starts_total - a[1].starts_total)
        .map(([, r]) => r);
    }
    if (level) out = out.filter(r => r.level === level);
    if (minL) out = out.filter(r => (r.leavers ?? 0) >= +minL);
    if (sort && !terms.length) {
      const d = dir === "asc" ? 1 : -1;
      out = [...out].sort((a, b) => {
        const x = a[sort] as number | string | null, y = b[sort] as number | string | null;
        if (typeof x === "string" && typeof y === "string") return x.localeCompare(y) * d;
        if (x == null) return 1;
        if (y == null) return -1;   // nulls always last
        return ((x as number) - (y as number)) * d;
      });
    }
    return out;
  }, [std, q, level, minL, sort, dir]);

  // The location box searches within one apprenticeship, so resolve the typed text to
  // the single best-matching standard first.
  const hstd = useMemo(() => {
    const terms = words(hq).map(stem);
    if (!terms.length) return null;
    const hit = std
      .map(r => [score(r, terms), r] as [number, Std])
      .filter(([s]) => s > 0)
      .sort((a, b) => b[0] - a[0] || b[1].vac - a[1].vac)[0];
    return hit ? hit[1] : null;
  }, [std, hq]);

  const hireRows = useMemo(() => {
    if (!hire || !hstd) return [];
    const loc = hloc.toLowerCase().trim();
    return hire
      .filter(r => r[0] === hstd.code && (!loc || r[1].toLowerCase().includes(loc)))
      .sort((a, b) => b[3] - a[3] || b[5].localeCompare(a[5]));
  }, [hire, hstd, hloc]);

  const levels = useMemo(
    () => [...new Set(std.map(r => r.level).filter(Boolean))].sort() as string[], [std]);

  const head = (k: keyof Std, label: string, num = false) => (
    <th
      className={`${thCls} ${num ? "text-right" : ""} ${sort === k ? "text-ink" : ""}`}
      onClick={() => {
        setDir(sort === k && dir === "desc" ? "asc" : "desc");
        setSort(k); setQ("");
      }}
    >
      {label}{sort === k ? (dir === "asc" ? " ↑" : " ↓") : ""}
    </th>
  );

  if (!meta) return <p className="py-16 text-center text-muted">Loading…</p>;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs leading-relaxed text-muted">
        {fmt(meta.standards)} apprenticeships ({fmt(meta.with_ach)} with completion data) ·{" "}
        {fmt(meta.employers)} employers · {fmt(meta.vac_total)} openings · completion{" "}
        {ay(meta.ach_years[0])}–{ay(meta.ach_years.at(-1)!)} · starts{" "}
        {ay(meta.start_years[0])}–{ay(meta.start_years.at(-1)!)} · openings to {meta.posted_to}
      </p>

      <div className="flex gap-1 border-b border-border-soft">
        {([["std", "Apprenticeships"], ["hire", "Who's hiring"]] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={async () => { if (k === "hire") await loadHire(); setTab(k); }}
            className={`border-b-2 px-3.5 py-2 text-sm font-medium transition-colors ${
              tab === k ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "std" ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search" value={q} onChange={e => setQ(e.target.value)}
              placeholder="Search, e.g. marketing…"
              className={`${inputCls} min-w-[240px] flex-1`}
            />
            <select value={level} onChange={e => setLevel(e.target.value)} className={inputCls}>
              <option value="">All levels</option>
              {levels.map(l => <option key={l}>{l}</option>)}
            </select>
            <select
              value={minL} onChange={e => setMinL(e.target.value)} className={inputCls}
              title="A standard with only a handful of leavers can show 100% completion."
            >
              {[0, 50, 100, 500].map(n =>
                <option key={n} value={n}>{n ? `Min ${n} leavers` : "Any sample size"}</option>)}
            </select>
            <span className="ml-auto text-xs text-muted">
              {rows.length > 250 ? `Top 250 of ${fmt(rows.length)}` : `${fmt(rows.length)} results`}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {head("name", "Apprenticeship")}
                  {head("sector", "Sector")}
                  {head("ach", "Completion", true)}
                  {head("ach16", "Completion 16–18", true)}
                  {head("leavers", "Leavers", true)}
                  {head("starts_total", "Starts (6yr)", true)}
                  {head("vac", "Openings", true)}
                  {head("wage", "Median wage", true)}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 250).map(r => (
                  <tr
                    key={r.code} onClick={() => setOpen(r)}
                    className="cursor-pointer hover:bg-surface-alt"
                  >
                    <td className={tdCls}>
                      <span className="font-medium text-ink">{r.name}</span>
                      {r.level && (
                        <span className="ml-2 whitespace-nowrap rounded-full bg-surface-alt px-2 py-0.5 text-[11px] text-muted">
                          {r.level}
                        </span>
                      )}
                    </td>
                    <td className={`${tdCls} text-muted`}>{r.sector ?? r.route ?? "—"}</td>
                    <td className={`${tdCls} text-right font-semibold tabular-nums ${band(r.ach)}`}>{pct(r.ach)}</td>
                    <td className={`${tdCls} text-right font-semibold tabular-nums ${band(r.ach16)}`}>{pct(r.ach16)}</td>
                    <td className={`${tdCls} text-right tabular-nums text-muted`}>{fmt(r.leavers)}</td>
                    <td className={`${tdCls} text-right tabular-nums`}>{fmt(r.starts_total)}</td>
                    <td className={`${tdCls} text-right tabular-nums`}>{fmt(r.vac)}</td>
                    <td className={`${tdCls} text-right tabular-nums`}>
                      {gbp(r.wage)}
                      {r.wage_year && <span className="ml-1 text-[11px] text-muted">{r.wage_year}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && <p className="py-12 text-center text-muted">No matches.</p>}
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search" value={hq} onChange={e => setHq(e.target.value)}
              placeholder="Apprenticeship, e.g. marketing…"
              className={`${inputCls} min-w-[220px] flex-1`}
            />
            <input
              type="search" value={hloc} onChange={e => setHloc(e.target.value)}
              placeholder="Town, e.g. Manchester"
              className={`${inputCls} min-w-[180px] flex-1`}
            />
            <span className="ml-auto text-xs text-muted">
              {hstd && hireRows.length > 300
                ? `Top 300 of ${fmt(hireRows.length)}`
                : hstd ? `${fmt(hireRows.length)} employers` : ""}
            </span>
          </div>

          {!hstd ? (
            <p className="py-16 text-center text-muted">
              Type an apprenticeship to see which employers take on apprentices — and where.
              {hq && <><br />No apprenticeship matches “{hq}”.</>}
            </p>
          ) : !hireRows.length ? (
            <p className="py-16 text-center text-muted">
              No employers found for {hstd.name}{hloc && ` near “${hloc}”`}.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className={thCls}>Employer</th>
                    <th className={thCls}>Town</th>
                    <th className={`${thCls} text-right`}>Openings posted</th>
                    <th className={`${thCls} text-right`}>Typical wage</th>
                    <th className={`${thCls} text-right`}>Last posted</th>
                  </tr>
                </thead>
                <tbody>
                  {hireRows.slice(0, 300).map((r, i) => (
                    <tr key={i} className="hover:bg-surface-alt">
                      <td className={`${tdCls} font-medium text-ink`}>{r[2]}</td>
                      <td className={`${tdCls} text-muted`}>{r[1]}</td>
                      <td className={`${tdCls} text-right tabular-nums`}>{fmt(r[3])}</td>
                      <td className={`${tdCls} text-right tabular-nums`}>{gbp(r[4])}</td>
                      <td className={`${tdCls} text-right tabular-nums text-muted`}>{r[5] || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                {hstd.name} · employers who advertised between Aug 2022 and Feb {meta.posted_to.slice(0, 4)}.
                These are past openings, not live vacancies — use them to see who takes on
                apprentices near you, then approach them yourself.
              </p>
            </div>
          )}
        </>
      )}

      {open && <Detail r={open} onClose={() => setOpen(null)} onHiring={async () => {
        await loadHire(); setHq(open.name); setTab("hire"); setOpen(null);
      }} />}
    </div>
  );
}

function Detail({ r, onClose, onHiring }: { r: Std; onClose: () => void; onHiring: () => void }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [onClose]);

  const kv = (k: string, v: React.ReactNode, cls = "") => (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted">{k}</div>
      <div className={`text-lg font-semibold tabular-nums ${cls}`}>{v}</div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-xl border border-border-soft bg-background"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border-soft p-5">
          <div>
            <h2 className="text-lg font-semibold text-ink">{r.name}</h2>
            <p className="mt-0.5 text-sm text-muted">
              {[r.level, r.sector ?? r.route, r.code].filter(Boolean).join(" · ")}
              {r.status && !r.status.includes("Approved") && (
                <span className="text-amber-700 dark:text-amber-400"> · {r.status}</span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md bg-surface-alt px-2.5 py-1 text-sm text-ink hover:opacity-80"
          >
            Close
          </button>
        </div>

        <div className="max-h-[62vh] overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {kv("Completion", pct(r.ach), band(r.ach))}
            {kv("Completion 16–18", pct(r.ach16), band(r.ach16))}
            {kv(`Median wage ${r.wage_year ?? ""}`, gbp(r.wage))}
            {kv("Typical week", r.hours ? `${r.hours} hrs` : "—")}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            Completion = of those who finished or left in 2023/24, the share who achieved.
            Based on {fmt(r.leavers)} leavers
            {r.leavers16 != null && `, ${fmt(r.leavers16)} of them aged 16–18`}.
            {r.leavers != null && r.leavers < 100 &&
              <strong className="text-ink"> Small sample — treat with caution.</strong>}
          </p>

          <h3 className="mb-2 mt-6 text-[11px] uppercase tracking-wider text-muted">Completion rate by year</h3>
          <Bars data={r.ach_hist} mode="pc" />

          <h3 className="mb-2 mt-6 text-[11px] uppercase tracking-wider text-muted">Starts by academic year</h3>
          <Bars data={r.starts} mode="n" />
          <p className="mt-2 text-xs text-muted">
            {fmt(r.starts_u19)} of {fmt(r.starts_total)} starts were under 19
            ({r.starts_total ? Math.round((r.starts_u19 / r.starts_total) * 100) : 0}%).
          </p>

          <h3 className="mb-2 mt-6 text-[11px] uppercase tracking-wider text-muted">When openings get posted</h3>
          <Bars data={r.months} keys={MONTH_KEYS} mode="mo" />
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Average adverts per month across Aug 2022 – Feb 2026, so months with fewer years
            of data aren&apos;t understated. Use it to time an application.
          </p>

          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <button onClick={onHiring} className="font-medium text-accent-strong dark:text-accent hover:underline">
              See who hires for this near you →
            </button>
            {r.link && (
              <a
                href={r.link} target="_blank" rel="noopener noreferrer"
                className="text-muted hover:underline"
              >
                Standard on gov.uk ↗
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
