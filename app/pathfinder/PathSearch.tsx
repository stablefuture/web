'use client';
// The Career Check search (app/career-check/CareerCheck.tsx), with its styles, for picking paths
// inside Pathfinder. Degrees here are HECoS subjects (public/pathfinder-search.json).
import { useEffect, useMemo, useRef, useState } from 'react';
import { searchMatches } from '../lib/pathSearch';
import styles from '../career-check/career-check.module.css';

export type Path = { id: string; kind: string; title: string; aka?: string[]; level?: number | string; sectors?: (string | { id: string; label: string })[] };
type JobGroup = { id: string; title: string; members: { id: string; title: string }[] };
type Catalogue = { paths: Path[]; jobGroups: JobGroup[] };

const KINDS = [
  { kind: '', title: 'All' },
  { kind: 'degree', title: 'Degrees' },
  { kind: 'apprenticeship', title: 'Apprenticeships' },
  { kind: 'job', title: 'Jobs' },
];
const KIND_ORDER: Record<string, number> = { degree: 0, apprenticeship: 1, job: 2 };
export const kindLabel = (kind: string) => kind === 'degree' ? 'Degree' : kind === 'apprenticeship' ? 'Apprenticeship' : 'Job';
export const pathLabel = (p: Path) => p.level ? `${kindLabel(p.kind)} · Level ${p.level}` : kindLabel(p.kind);
const LEVELS: Record<string, string> = { 2: 'GCSE', 3: 'A level', 4: 'HNC', 5: 'foundation degree', 6: 'bachelor’s degree', 7: 'master’s degree' };
const HINTS = ['Psychology', 'Electrician', 'Law', 'Software developer', 'Medicine', 'Marketing'];

export function PathIcon({ kind }: { kind: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{kind === 'degree' ? <><path d="m3 9 9-5 9 5-9 5-9-5Z" /><path d="M6 11v6c4 3 8 3 12 0v-6M21 9v7" /></> : kind === 'apprenticeship' ? <><path d="m14 5 5 5M4 20l4-1L20 7l-3-3L5 16l-1 4Z" /><path d="m5 16 3 3" /></> : kind === 'job' ? <><rect x="3" y="7" width="18" height="13" rx="3" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12c6 4 12 4 18 0M12 12v4" /></> : <><circle cx="12" cy="12" r="8" /><path d="M12 8v8M8 12h8" /></>}</svg>;
}

export default function PathSearch({ selected, onChoose, max }: { selected: Path[]; onChoose: (p: Path) => void; max: number }) {
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [reload, setReload] = useState(0);
  const [kind, setKind] = useState('');
  const [sector, setSector] = useState('');
  const [level, setLevel] = useState('');
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [hint, setHint] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/pathfinder-search.json', { signal: controller.signal }).then((r) => { if (!r.ok) throw new Error(); return r.json(); }).then((data) => {
      if (!Array.isArray(data.paths) || !Array.isArray(data.jobGroups)) throw new Error();
      setCatalogue(data); setLoadError(false);
    }).catch((e) => { if (e.name !== 'AbortError') setLoadError(true); });
    return () => controller.abort();
  }, [reload]);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setHint((h) => (h + 1) % HINTS.length), 2600);
    return () => window.clearInterval(timer);
  }, []);

  const areas = useMemo(() => {
    if (!catalogue || !kind) return [];
    if (kind === 'job') return catalogue.jobGroups.map((g) => ({ id: g.id, label: g.title })).sort((a, b) => a.label.localeCompare(b.label));
    const found = new Map<string, string>();
    catalogue.paths.filter((p) => p.kind === kind).forEach((p) => p.sectors?.forEach((s) => found.set(typeof s === 'string' ? s : s.id, typeof s === 'string' ? s : s.label)));
    return [...found].map(([id, label]) => ({ id, label })).sort((a, b) => a.label.localeCompare(b.label));
  }, [catalogue, kind]);
  const levels = useMemo(() => [...new Set((catalogue?.paths ?? []).filter((p) => p.kind === 'apprenticeship' && p.level).map((p) => String(p.level)))].sort(), [catalogue]);
  const pool = useMemo(() => {
    const group = kind === 'job' && sector ? catalogue?.jobGroups.find((g) => g.id === sector) : null;
    const ids = group ? new Set(group.members.map((m) => m.id)) : null;
    return (catalogue?.paths ?? [])
      .filter((p) => (!kind || p.kind === kind) && (!level || String(p.level) === level) && (!sector || (kind === 'job' ? ids?.has(p.id) : p.sectors?.some((s) => (typeof s === 'string' ? s : s.id) === sector))))
      .sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || a.title.localeCompare(b.title));
  }, [catalogue, kind, sector, level]);
  const browsing = !query.trim() && !sector && !kind;
  const results = useMemo(() => browsing ? [] : searchMatches(pool, query, (p) => p.title, (p) => p.aka ?? []).slice(0, 60), [pool, query, browsing]);
  const full = selected.length >= max;

  function choose(path: Path) {
    if (selected.some((p) => p.id === path.id) || full) return;
    onChoose(path); setQuery(''); setActive(0);
  }
  function onKey(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!results.length) return;
    if (event.key === 'ArrowDown') { event.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    if (event.key === 'ArrowUp') { event.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    if (event.key === 'Enter') { event.preventDefault(); const hit = results[active]?.item; if (hit) choose(hit); }
  }
  const item = (path: Path) => {
    const added = selected.some((p) => p.id === path.id);
    return <button type="button" key={path.id} className={styles.option} data-kind={path.kind} data-added={added || undefined} disabled={added || full} onClick={() => choose(path)} aria-label={`${added ? 'Added' : 'Add'} ${path.title}, ${pathLabel(path)}`}>
      <span className={styles.optionIcon}><PathIcon kind={path.kind} /></span>
      <span className={styles.optionText}><strong>{path.title}</strong><small>{pathLabel(path)}</small></span>
      <span className={styles.plus} aria-hidden="true">{added ? '✓' : '+'}</span>
    </button>;
  };

  return <div>
    <label className={styles.search}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" /><path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
      <span className={styles.srOnly}>Search degrees, apprenticeships, and jobs</span>
      <input ref={searchRef} type="search" value={query} onChange={(e) => { setQuery(e.target.value); setActive(0); }} onKeyDown={onKey} placeholder={full ? `All ${max} chosen` : `Try “${HINTS[hint]}”`} autoComplete="off" disabled={full} aria-controls="pf-results" />
      {query && <button type="button" className={styles.clear} onClick={() => { setQuery(''); searchRef.current?.focus(); }} aria-label="Clear search">×</button>}
    </label>
    <div className={styles.kinds} role="group" aria-label="Path type">
      {KINDS.map((k) => <button type="button" key={k.kind || 'all'} aria-pressed={kind === k.kind} onClick={() => { setKind(k.kind); setSector(''); setLevel(''); setActive(0); }}>{k.kind && <PathIcon kind={k.kind} />}{k.title}</button>)}
    </div>
    {kind && (areas.length > 0 || (kind === 'apprenticeship' && levels.length > 0)) && <div className={styles.filters}>
      {areas.length > 0 && <select aria-label={kind === 'degree' ? 'Subject group' : kind === 'apprenticeship' ? 'Apprenticeship route' : 'Sector'} value={sector} onChange={(e) => { setSector(e.target.value); setActive(0); }}>
        <option value="">{kind === 'degree' ? 'All subjects' : kind === 'apprenticeship' ? 'All routes' : 'All sectors'}</option>
        {areas.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
      </select>}
      {kind === 'apprenticeship' && levels.length > 0 && <select aria-label="Apprenticeship level" value={level} onChange={(e) => { setLevel(e.target.value); setActive(0); }}>
        <option value="">All levels</option>
        {levels.map((l) => <option key={l} value={l}>Level {l}{LEVELS[l] ? ` (${LEVELS[l]})` : ''}</option>)}
      </select>}
    </div>}
    <div id="pf-results" className={styles.results} aria-live="polite">
      {loadError ? <div className={styles.empty}>We couldn’t load the paths. <button type="button" onClick={() => { setLoadError(false); setReload(reload + 1); }}>Try again</button></div>
        : !catalogue ? <div className={styles.skeleton}>{Array.from({ length: 6 }, (_, i) => <i key={i} />)}</div>
        : browsing ? null : <>
          <p className={styles.listLabel}>{results.length ? `${results.length === 60 ? '60+' : results.length} ${results.length === 1 ? 'match' : 'matches'}` : 'No matches yet'}</p>
          <div className={styles.list} role="list">{results.map(({ item: p, via }, i) => <div role="listitem" key={p.id} data-active={i === active || undefined} onMouseEnter={() => setActive(i)}>{item(p)}{via && <span className={styles.via}>Also called {via}</span>}</div>)}</div>
          {!results.length && <p className={styles.empty}>Try a shorter word, or another path type.</p>}
        </>}
    </div>
  </div>;
}
