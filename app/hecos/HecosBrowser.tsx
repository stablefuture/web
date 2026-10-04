"use client";

import { useMemo, useState } from "react";

type Group = { code: string; label: string };
type Subject = {
  code: string;
  term: string;
  definition: string;
  scopeNote: string;
  administrative: boolean;
  cah1: Group;
  cah2: Group;
  cah3: Group;
  discoverUniCourses: number;
};

const PAGE_SIZE = 60;

export function HecosBrowser({ subjects }: { subjects: Subject[] }) {
  const [query, setQuery] = useState("");
  const [cah1, setCah1] = useState("all");
  const [usage, setUsage] = useState("all");
  const [sort, setSort] = useState("alphabetical");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const cah1Groups = useMemo(
    () => Array.from(new Map(subjects.map((subject) => [subject.cah1.code, subject.cah1])).values()).sort((a, b) => a.label.localeCompare(b.label)),
    [subjects],
  );

  const filtered = useMemo(() => {
    const words = query.toLocaleLowerCase("en-GB").trim().split(/\s+/).filter(Boolean);
    const rows = subjects.filter((subject) => {
      const haystack = [
        subject.code,
        subject.term,
        subject.definition,
        subject.scopeNote,
        subject.cah1.label,
        subject.cah2.label,
        subject.cah3.label,
      ].join(" ").toLocaleLowerCase("en-GB");
      return words.every((word) => haystack.includes(word))
        && (cah1 === "all" || subject.cah1.code === cah1)
        && (usage === "all" || (usage === "used" ? subject.discoverUniCourses > 0 : subject.discoverUniCourses === 0));
    });
    return rows.sort((a, b) => sort === "usage"
      ? b.discoverUniCourses - a.discoverUniCourses || a.term.localeCompare(b.term)
      : a.term.localeCompare(b.term));
  }, [subjects, query, cah1, usage, sort]);

  function changeFilter(change: () => void) {
    change();
    setVisible(PAGE_SIZE);
  }

  return (
    <section className="mt-10" aria-label="HECoS subject browser">
      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm md:grid-cols-2 xl:grid-cols-4">
        <label className="xl:col-span-2">
          <span className="mb-2 block text-sm font-medium text-slate-800">Search subjects</span>
          <input
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            type="search"
            value={query}
            onChange={(event) => changeFilter(() => setQuery(event.target.value))}
            placeholder="Try computer science, climate, 100366…"
          />
        </label>
        <label>
          <span className="mb-2 block text-sm font-medium text-slate-800">Broad subject</span>
          <select
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            value={cah1}
            onChange={(event) => changeFilter(() => setCah1(event.target.value))}
          >
            <option value="all">All broad subjects</option>
            {cah1Groups.map((group) => <option key={group.code} value={group.code}>{group.label}</option>)}
          </select>
        </label>
        <label>
          <span className="mb-2 block text-sm font-medium text-slate-800">Seen in HECoS field</span>
          <select
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            value={usage}
            onChange={(event) => changeFilter(() => setUsage(event.target.value))}
          >
            <option value="all">All entries</option>
            <option value="used">Seen in snapshot</option>
            <option value="unused">Not seen in snapshot</option>
          </select>
        </label>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-slate-600"><strong className="font-semibold text-slate-950">{filtered.length.toLocaleString("en-GB")}</strong> entries</p>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          Sort
          <select
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-950"
            value={sort}
            onChange={(event) => changeFilter(() => setSort(event.target.value))}
          >
            <option value="alphabetical">A–Z</option>
            <option value="usage">Most snapshot records</option>
          </select>
        </label>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {filtered.slice(0, visible).map((subject) => (
          <article key={subject.code} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">{subject.term}</h2>
                <p className="mt-1 font-mono text-xs text-slate-500">{subject.code}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                {subject.administrative && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-900">Admin code</span>}
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
                  {subject.discoverUniCourses.toLocaleString("en-GB")} snapshot {subject.discoverUniCourses === 1 ? "record" : "records"}
                </span>
              </div>
            </div>
            {subject.definition && <p className="mt-4 leading-7 text-slate-700">{subject.definition}</p>}
            {subject.administrative && !subject.definition && <p className="mt-4 leading-7 text-slate-600">A reporting code, not a standard HECoS subject term.</p>}
            <dl className="mt-5 grid gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Detailed group</dt>
                <dd className="mt-1 font-medium text-slate-900">{subject.cah3.label} <span className="font-mono text-xs text-slate-500">{subject.cah3.code}</span></dd>
              </div>
              <div>
                <dt className="text-slate-500">Broad group</dt>
                <dd className="mt-1 font-medium text-slate-900">{subject.cah1.label} <span className="font-mono text-xs text-slate-500">{subject.cah1.code}</span></dd>
              </div>
            </dl>
            {subject.scopeNote && (
              <details className="mt-4 text-sm text-slate-600">
                <summary className="cursor-pointer font-medium text-slate-800">Scope note</summary>
                <p className="mt-2 leading-6">{subject.scopeNote}</p>
              </details>
            )}
          </article>
        ))}
      </div>

      {filtered.length === 0 && <p className="mt-10 rounded-xl bg-slate-50 p-8 text-center text-slate-600">No subjects match those filters.</p>}
      {visible < filtered.length && (
        <div className="mt-8 text-center">
          <button
            className="rounded-lg bg-slate-950 px-5 py-3 font-medium text-white transition hover:bg-slate-800"
            type="button"
            onClick={() => setVisible((count) => count + PAGE_SIZE)}
          >
            Show {Math.min(PAGE_SIZE, filtered.length - visible)} more
          </button>
        </div>
      )}
    </section>
  );
}
