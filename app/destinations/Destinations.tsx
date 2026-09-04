"use client";

import { useEffect, useRef, useState } from "react";

import { band, Dot } from "@/app/lib/bands";
import { loadError } from "@/app/lib/loadError";
import { type Sort, SortButton, sortRows } from "@/app/lib/sort";

type Section = { sec: string; share: number; count: number; earn: number | null; other?: boolean };
type Industry = { name: string; count: number; earn: number | null };
type Slice = { total: number; sections: Section[]; groups: Record<string, Industry[]> };
type Role = {
  id: string; label: string; risk: number | null;
  exposure: number | null; substitution: number | null; salary: number | null;
  openings: number | null; entrants: number | null;
  competition: number | null;
};
type Group = {
  id: string; name: string; full: string; n: number;
  exposure: number | null; substitution: number | null; risk: number | null; roles: Role[];
};
type Subject = {
  id: string;
  label: string;
  cah1_label: string | null;
  pay: Record<string, Record<string, number | null>>;
  occupations: number[] | null;
};
type Data = {
  meta: { quals: [string, string][]; yags: string[]; fig12_year: string };
  groups: Group[];
  subjects: Subject[];
};
type Industries = Record<string, Record<string, Slice>>;

// Plain-English gloss for the nine SOC 2020 major groups, after ONS.
const GLOSS: Record<string, string> = {
  "1": "Running a team, department or business",
  "2": "Graduate-level roles: doctors, engineers, teachers, lawyers, analysts",
  "3": "Technical and support roles: technicians, paralegals, marketing and HR assistants",
  "4": "Office work: administrators, receptionists, clerks",
  "5": "Hands-on trades: electricians, chefs, mechanics",
  "6": "Care workers, nursery staff, hairdressers, fitness",
  "7": "Retail, sales and call centres",
  "8": "Drivers, machine operators, assembly",
  "9": "Entry-level manual work: warehouse, cleaning, hospitality",
};

const DEFAULT = "all";
// One, five and ten years on. Three years is in the data but adds little.
const YEARS = ["1", "5", "10"];
// How much shows before "Show all": enough for a snapshot, not a wall.
const TOP = 5;
// Pay to the nearest hundred, shares to the nearest percent: a snapshot, not a ledger.
const gbp = (n: number | null) => (n == null ? "—" : `£${(Math.round(n / 100) * 100).toLocaleString("en-GB")}`);
const count = (n: number) => n.toLocaleString("en-GB");
const yearsLabel = (y: string) => (y === "1" ? "1 year" : `${y} years`);
// "Psychology graduates" reads as "psychology graduates" mid-sentence, but
// "English studies" and "MBA" keep their capitals.
const midSentence = (s: string) =>
  /^[A-Z]{2,}/.test(s) || /^(English|Celtic)\b/.test(s) ? s : s[0].toLowerCase() + s.slice(1);

export function Destinations() {
  const [data, setData] = useState<Data | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState(DEFAULT);
  const [qual, setQual] = useState("First degree");
  const [yag, setYag] = useState("5");
  // Industry slices are 50 KB a subject, so they load per subject and stay cached.
  const [industries, setIndustries] = useState<Record<string, Industries>>({});

  useEffect(() => {
    // A failed load must say so: setting data to null looks exactly like a
    // load still in flight, and the page sat on "Loading…" for ever.
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 15000);
    fetch("/destinations/index.json", { signal: ctl.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`index.json ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((e) => setFailed(loadError(e)))
      .finally(() => clearTimeout(timer));
    const s = new URLSearchParams(window.location.search).get("subject");
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    if (s) setSubjectId(s);
  }, []);

  const subjectFile = data
    ? (data.subjects.find((s) => s.id === subjectId) ??
       data.subjects.find((s) => s.id === DEFAULT) ?? data.subjects[0]).id
    : null;
  useEffect(() => {
    if (!subjectFile || industries[subjectFile]) return;
    fetch(`/destinations/${subjectFile}.json`)
      .then((r) => r.json())
      .then((j: { industries: Industries }) =>
        setIndustries((cur) => ({ ...cur, [subjectFile]: j.industries })))
      .catch(() => {});
  }, [subjectFile, industries]);

  const choose = (id: string) => {
    setSubjectId(id);
    window.history.replaceState(null, "", `?subject=${encodeURIComponent(id)}`);
  };

  if (!data)
    return failed ? (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-ink">The graduate data did not load. {failed}</p>
        <p className="text-sm text-muted">
          Check your connection and reload the page. If it keeps failing, a
          content blocker or a private-browsing setting may be stopping the
          download.
        </p>
      </div>
    ) : (
      <p className="py-16 text-center text-muted">Loading…</p>
    );

  const subject =
    data.subjects.find((s) => s.id === subjectId) ??
    data.subjects.find((s) => s.id === DEFAULT) ?? data.subjects[0];

  // Fall back when the chosen cell is empty for this subject (MBA has no first
  // degree; small subjects lose the 10-year cell).
  const has = (q: string, y: string) => subject.pay[q]?.[y] != null;
  const q = has(qual, yag) ? qual : data.meta.quals.map(([id]) => id).find((id) => has(id, yag)) ?? qual;
  const y = has(q, yag) ? yag : YEARS.find((id) => has(q, id)) ?? yag;
  const slice = industries[subject.id]?.[q]?.[y] ?? null;
  const who = subject.id === "all" ? "graduates" : `${midSentence(subject.label)} graduates`;

  const occ = subject.occupations;
  const rows = occ
    ? data.groups.map((g, i) => ({ g, share: occ[i] })).sort((a, b) => b.share - a.share)
    : [];

  return (
    <div className="flex flex-col gap-10">
      {/* Two columns. Left: pick a subject, then what it pays and who hires
          them - each answer under the control that changes it. Right: the kinds
          of job they do and the AI risk of each, all nine groups at once. */}
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start lg:gap-x-10">
        <div className="flex flex-col gap-6">
          <label className="flex flex-col gap-2 text-sm text-muted">
            Degree subject
            <select
              value={subject.id}
              onChange={(e) => choose(e.target.value)}
              className="rounded-xl border border-border-soft bg-surface-alt px-4 py-3 text-base font-semibold text-ink outline-none transition focus:border-accent-strong"
            >
              {data.subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </label>

          <Panel title="Compare outcomes">
            <div className="mb-3 flex gap-1 rounded-lg bg-surface-alt p-1" role="group" aria-label="Years after graduating">
              {YEARS.map((yy) => (
                <button
                  key={yy}
                  type="button"
                  aria-pressed={yy === y}
                  onClick={() => setYag(yy)}
                  className={`flex-1 rounded-md px-2 py-1.5 text-sm transition ${
                    yy === y ? "bg-background font-semibold text-ink shadow-sm" : "text-muted hover:text-ink"
                  }`}
                >
                  {yearsLabel(yy)}
                </button>
              ))}
            </div>
            <ul className="divide-y divide-border-soft/40">
              {data.meta.quals
                .filter(([id]) => subject.pay[id]?.[y] != null)
                .map(([id, label]) => {
                  const on = id === q;
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        aria-pressed={on}
                        onClick={() => setQual(id)}
                        className={`flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left text-sm transition ${
                          on ? "bg-accent-strong text-on-accent" : "text-ink hover:bg-surface-alt"
                        }`}
                      >
                        <span className={on ? "font-semibold" : ""}>{label}</span>
                        <span className="font-bold tabular-nums">{gbp(subject.pay[id][y])}</span>
                      </button>
                    </li>
                  );
                })}
            </ul>
          </Panel>

          {/* Always rendered, so the column never reflows while a subject's
              industries load. */}
          <Panel title={`Industries ${who} work in`}>
            {slice ? <IndustryList slice={slice} /> : <p className="text-sm text-muted">Loading…</p>}
          </Panel>
        </div>

        {occ && (
          <Panel title={`Jobs ${who} do, and their AI risk`}>
            <GroupList rows={rows} />
          </Panel>
        )}
      </div>

      <details className="text-sm leading-relaxed text-muted">
        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider hover:text-ink">
          Where this data comes from
        </summary>
        <div className="mt-3 flex flex-col gap-2">
          <p>
            <strong className="text-ink">Pay and industries</strong>: DfE{" "}
            <a href="https://explore-education-statistics.service.gov.uk/find-statistics/graduate-labour-market-outcomes-leo/2023-24" target="_blank" rel="noopener" className="underline underline-offset-4 hover:text-ink">
              Longitudinal Education Outcomes 2023/24
            </a>
            , tax records not a survey. Industry is the employer&rsquo;s sector, not
            the job. Typical pay is the graduate-weighted average of median earnings
            in the industries inside each division; the expanded rows show the true
            medians. Industries under 1% are grouped as Other.
          </p>
          <p>
            <strong className="text-ink">Kind of job</strong>: HESA Graduate Outcomes,{" "}
            <a href="https://www.hesa.ac.uk/data-and-analysis/sb275/figure-12" target="_blank" rel="noopener" className="underline underline-offset-4 hover:text-ink">
              SB275 Figure 12
            </a>
            . Undergraduates in work, all UK providers. HESA rounds shares to whole
            percent and publishes them for broad subject groups only.
          </p>
          <p>
            <strong className="text-ink">AI risk</strong>: the{" "}
            <a href="/checker" className="underline underline-offset-4 hover:text-ink">career checker</a>
            &rsquo;s score for each SOC 2020 job, weighted by openings within each
            group. Expanding a group lists the jobs inside it with the same score.
          </p>
        </div>
      </details>
    </div>
  );
}

function Panel({
  title, className = "", children,
}: {
  title: string; className?: string; children: React.ReactNode;
}) {
  return (
    <section className={`flex flex-col gap-3 rounded-2xl border border-border-soft p-5 ${className}`}>
      <h2 className="text-lg font-extrabold tracking-tight text-ink">{title}</h2>
      {children}
    </section>
  );
}

// A row that opens is marked so; a 16-year-old should not have to guess.
function Chevron({ open }: { open: boolean }) {
  return (
    <span aria-hidden className="w-3 shrink-0 text-xs text-muted">{open ? "▾" : "▸"}</span>
  );
}

// Folding a long list scrolls its top back into view, so the reader is not
// left at the bottom of a page that just got shorter.
function ShowAll({
  all, total, top, box, onToggle,
}: {
  all: boolean; total: number; top: number; box: React.RefObject<HTMLDivElement | null>; onToggle: () => void;
}) {
  if (total <= top) return null;
  const toggle = () => {
    onToggle();
    // After the fold has laid out, so the jump lands on the shorter page.
    if (all) requestAnimationFrame(() => box.current?.scrollIntoView({ block: "start" }));
  };
  return (
    <button onClick={toggle} className="mt-2 self-start text-xs text-accent-strong hover:underline">
      {all ? "Show less" : `Show all ${total}`}
    </button>
  );
}

function Risk({ risk }: { risk: number | null }) {
  if (risk == null) return <span className="shrink-0 text-xs text-muted">—</span>;
  return (
    <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs tabular-nums text-muted">
      <Dot tone={band(risk).tone} />
      {risk}
    </span>
  );
}

// The share sits on the name's own line; the bar and the count hang under it.
function Share({ share }: { share: number }) {
  return <span className="shrink-0 font-bold tabular-nums text-accent-strong">{Math.round(share)}%</span>;
}

function IndustryList({ slice }: { slice: Slice }) {
  const [all, setAll] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const shown = all ? slice.sections : slice.sections.slice(0, TOP);
  return (
    <div ref={box} className="flex scroll-mt-24 flex-col">
      <ul>
        {shown.map((s) => {
          const inside = slice.groups[s.sec] ?? [];
          const isOpen = open === s.sec;
          return (
            <li key={s.sec} className="border-b border-border-soft/60 last:border-0">
              <button
                onClick={() => setOpen(isOpen ? null : s.sec)}
                disabled={!inside.length}
                aria-expanded={isOpen}
                className="flex w-full min-w-0 flex-col gap-1 py-2.5 text-left enabled:hover:bg-surface-alt/60"
              >
                <span className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-baseline gap-1.5">
                    <Chevron open={isOpen} />
                    <Share share={s.share} />
                    <span className="min-w-0 break-words font-semibold text-ink">{s.sec}</span>
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-muted">{gbp(s.earn)}</span>
                </span>
                <span className="ml-[18px] h-2.5 rounded-r-[3px] bg-border-soft/30">
                  <span
                    className={`block h-full rounded-r-[3px] ${
                      // Other is a residual, not one industry, so it never
                      // takes the accent even when it is the longest bar.
                      s.other ? "bg-muted/25" : "bg-accent/40"
                    }`}
                    style={{ width: `${s.share}%` }}
                  />
                </span>
                <span className="ml-[18px] text-xs text-muted">{count(s.count)} graduates</span>
              </button>
              {isOpen && (
                <ul className="mb-2 ml-[18px] text-sm">
                  {inside.map((i) => (
                    <li key={i.name} className="flex items-center justify-between gap-3 py-1">
                      <span className="min-w-0 break-words text-ink">{i.name}</span>
                      <span className="flex shrink-0 gap-3 text-xs text-muted">
                        <span>{count(i.count)} grads</span>
                        <span className="w-14 text-right">{gbp(i.earn)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
      <ShowAll all={all} total={slice.sections.length} top={TOP} box={box} onToggle={() => setAll(!all)} />
    </div>
  );
}

function GroupList({ rows }: { rows: { g: Group; share: number }[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort<"risk">>(null);
  // All nine SOC major groups, always. There are only nine, and hiding four of
  // them behind "show all" hid the low-risk trades a parent came to find.
  const shown = sortRows(rows, sort, (r) => r.g.risk);
  return (
    <div className="flex flex-col">
      <div className="flex justify-end border-b border-border-soft/60 pb-1">
        <SortButton k="risk" label="AI risk" sort={sort} onSort={setSort} align="right" />
      </div>
      <ul>
        {shown.map(({ g, share }) => {
          const isOpen = open === g.id;
          return (
            <li key={g.id} className="border-b border-border-soft/60 last:border-0">
              <button
                onClick={() => setOpen(isOpen ? null : g.id)}
                aria-expanded={isOpen}
                className="flex w-full min-w-0 flex-col gap-1 py-2.5 text-left hover:bg-surface-alt/60"
              >
                <span className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-baseline gap-1.5">
                    <Chevron open={isOpen} />
                    <Share share={share} />
                    <span className="min-w-0 break-words font-semibold text-ink">{g.name}</span>
                  </span>
                  <Risk risk={g.risk} />
                </span>
                <span className="ml-[18px] h-2.5 rounded-r-[3px] bg-border-soft/30">
                  <span
                    className="block h-full rounded-r-[3px] bg-accent/40"
                    style={{ width: `${share}%` }}
                  />
                </span>
                <span className="ml-[18px] text-xs text-muted">{GLOSS[g.id]}</span>
              </button>
              {isOpen && (
                <div className="mb-2 ml-[18px]">
                  <p className="mb-1 text-xs text-muted">
                    {g.n} jobs, most job openings first.
                  </p>
                  <RoleList roles={g.roles} limit={TOP} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

type NumKey = "exposure" | "substitution" | "salary" | "openings" | "entrants" | "competition";
const FACTS: [NumKey, string, (v: number) => string][] = [
  ["exposure", "AI learnability", (v) => `${v} / 100`],
  ["substitution", "AI substitution", (v) => `${v} / 100`],
  ["salary", "Salary", (v) => gbp(v)],
  ["openings", "Yearly openings", (v) => count(v)],
  ["entrants", "Entrants a year", (v) => count(v)],
  ["competition", "Competition", (v) => `${v} per opening`],
];

const ROLE_ROW = "grid grid-cols-[minmax(0,1fr)_3.5rem] items-center gap-x-2";

// A job row that opens in place to the checker's figures, so nobody has to
// leave the page to see one job.
function RoleList({ roles, limit }: { roles: Role[]; limit: number }) {
  const [all, setAll] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort<"risk">>(null);
  const box = useRef<HTMLDivElement>(null);
  const rows = sortRows(roles, sort, (r) => r.risk);
  const shown = all ? rows : rows.slice(0, limit);
  return (
    <div ref={box} className="flex scroll-mt-24 flex-col">
      <div className={`${ROLE_ROW} border-b border-border-soft/40 pb-1`}>
        <span />
        <SortButton k="risk" label="AI risk" sort={sort} onSort={setSort} align="right" />
      </div>
      <ul className="divide-y divide-border-soft/40">
        {shown.map((r) => {
          const isOpen = open === r.id;
          return (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : r.id)}
                aria-expanded={isOpen}
                className={`${ROLE_ROW} w-full min-w-0 py-2 text-left text-sm hover:text-accent-strong`}
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <Chevron open={isOpen} />
                  <span className="min-w-0 break-words text-ink">{r.label}</span>
                </span>
                <Risk risk={r.risk} />
              </button>
              {isOpen && (
                <div className="mb-3 ml-[18px] rounded-xl bg-surface-alt px-4 py-3">
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
                    {FACTS.map(([k, label, fmt]) => (
                      <div key={k}>
                        <dt className="text-xs text-muted">{label}</dt>
                        <dd className="font-bold text-ink">{r[k] == null ? "—" : fmt(r[k])}</dd>
                      </div>
                    ))}
                  </dl>
                  <a
                    href={`/checker?id=${encodeURIComponent(r.id)}`}
                    className="mt-3 inline-block text-xs text-accent-strong hover:underline"
                  >
                    Open in the checker →
                  </a>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <ShowAll all={all} total={roles.length} top={limit} box={box} onToggle={() => setAll(!all)} />
    </div>
  );
}
