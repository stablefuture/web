'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { searchMatches } from '../lib/pathSearch';
import styles from './career-check.module.css';

type Path = { id: string; kind: string; title: string; aka?: string[]; sectors?: (string | { id: string; label: string })[] };
type JobGroup = { id: string; title: string; members: { id: string; title: string }[] };
type Catalogue = { paths: Path[]; jobGroups: JobGroup[] };
const tabs = [{ kind: 'degree', title: 'Degrees', hint: 'Try psychology or engineering' }, { kind: 'apprenticeship', title: 'Apprenticeships', hint: 'Try nursing or electrician' }, { kind: 'job', title: 'Jobs', hint: 'Try designer or accountant' }];
const kindLabel = (kind: string) => kind === 'degree' ? 'Degree' : kind === 'apprenticeship' ? 'Apprenticeship' : 'Job';

function PathIcon({ kind }: { kind: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{kind === 'degree' ? <><path d="m3 9 9-5 9 5-9 5-9-5Z" /><path d="M6 11v6c4 3 8 3 12 0v-6M21 9v7" /></> : kind === 'apprenticeship' ? <><path d="m14 5 5 5M4 20l4-1L20 7l-3-3L5 16l-1 4Z" /><path d="m5 16 3 3" /></> : <><rect x="3" y="7" width="18" height="13" rx="3" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12c6 4 12 4 18 0M12 12v4" /></>}</svg>;
}

export default function CareerCheck({ testing = false }: { testing?: boolean }) {
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [kind, setKind] = useState('degree');
  const [query, setQuery] = useState('');
  const [sector, setSector] = useState('');
  const [selected, setSelected] = useState<Path[]>([]);
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/lead-magnet/search.json', { signal: controller.signal }).then((response) => { if (!response.ok) throw new Error(); return response.json(); }).then((data) => { if (!Array.isArray(data.paths) || !Array.isArray(data.jobGroups)) throw new Error(); setCatalogue(data); setLoadError(false); }).catch((e) => { if (e.name !== 'AbortError') setLoadError(true); });
    return () => controller.abort();
  }, [reload]);
  const options = useMemo(() => {
    if (!catalogue) return [];
    if (kind === 'job') return catalogue.jobGroups.map((g) => ({ id: g.id, label: g.title })).sort((a, b) => a.label.localeCompare(b.label));
    const found = new Map<string, string>();
    catalogue.paths.filter((p) => p.kind === kind).forEach((p) => p.sectors?.forEach((s) => found.set(typeof s === 'string' ? s : s.id, typeof s === 'string' ? s : s.label)));
    return [...found].map(([id, label]) => ({ id, label })).sort((a, b) => a.label.localeCompare(b.label));
  }, [catalogue, kind]);
  const pool = useMemo(() => {
    const group = kind === 'job' && sector ? catalogue?.jobGroups.find((g) => g.id === sector) : null;
    const ids = group ? new Set(group.members.map((m) => m.id)) : null;
    return (catalogue?.paths ?? []).filter((p) => p.kind === kind && (!sector || (kind === 'job' ? ids?.has(p.id) : p.sectors?.some((s) => (typeof s === 'string' ? s : s.id) === sector)))).sort((a, b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id));
  }, [catalogue, kind, sector]);
  const results = useMemo(() => searchMatches(pool, query, (p) => p.title, (p) => p.aka ?? []), [pool, query]);
  const choose = (path: Path) => { if (selected.some((p) => p.id === path.id) || selected.length >= 3 || status === 'sending') return; setSelected([...selected, path]); setStatus('idle'); setError(''); };
  const preview = `/api/career-results?${selected.map((p) => `id=${encodeURIComponent(p.id)}`).join('&')}`;
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (testing) return; if (!selected.length || status === 'sending') return;
    setError(''); setStatus('sending');
    try {
      const response = await fetch('/api/career-results', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: selected.map((p) => p.id), email, website }) });
      const data = await response.json();
      if (!response.ok || data.ok !== true) throw new Error(data.error || 'We could not send your report. Please try again.');
      setError(data.warning || '');
      setStatus('sent');
    } catch (e) { setStatus('idle'); setError(e instanceof Error ? e.message : 'We could not send your report. Please try again.'); }
  }
  return <main className={styles.page}>
    <div className={styles.wrap}>
      <Link href="/" className={styles.brand} aria-label="Stable Future home">stable future <span aria-hidden="true">↗</span></Link>
      <header className={styles.intro}><h1>What does AI mean<br />for <em>your child&apos;s future?</em></h1></header>
      <div className={styles.layout}>
        <section className={styles.searchCard} data-kind={kind} aria-label="Add your paths">
          <div className={styles.cardHeading}><span className={styles.step}>1</span><h2>Add your paths</h2><span className={styles.small}>Mix and match</span></div>
          <div className={styles.tabs} role="tablist" aria-label="Path type">{tabs.map((tab) => <button key={tab.kind} id={`tab-${tab.kind}`} role="tab" aria-selected={kind === tab.kind} aria-controls="path-results" className={kind === tab.kind ? styles.activeTab : ''} onClick={() => { setKind(tab.kind); setQuery(''); setSector(''); }}><PathIcon kind={tab.kind} />{tab.title}</button>)}</div>
          <div className={styles.finderControls}>
            <select aria-label={kind === 'degree' ? 'Subject group' : kind === 'apprenticeship' ? 'Apprenticeship route' : 'Career group'} value={sector} onChange={(event) => setSector(event.target.value)}>
              <option value="">{kind === 'degree' ? 'All subjects' : kind === 'apprenticeship' ? 'All routes' : 'All career groups'}</option>
              {options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
            </select>
            <span aria-hidden="true">or</span>
            <input aria-label={`Search ${tabs.find((tab) => tab.kind === kind)?.title.toLowerCase()}`} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search..." autoComplete="off" />
          </div>
          <div id="path-results" role="tabpanel" aria-labelledby={`tab-${kind}`} className={styles.results}>
            {loadError ? <div className={styles.empty}>We couldn’t load the paths.<button onClick={() => { setLoadError(false); setReload(reload + 1); }}>Try again</button></div> : !catalogue ? <p className={styles.empty}>Loading your options…</p> : <>
              <p className={styles.resultCount} aria-live="polite">{results.length === pool.length ? `${pool.length} paths` : `${results.length} of ${pool.length} paths`}</p>
              {results.map(({ item: path, via }) => { const added = selected.some((p) => p.id === path.id); return <button key={path.id} className={`${styles.result} ${added ? styles.added : ''}`} disabled={added || selected.length >= 3 || status === 'sending'} onClick={() => choose(path)} aria-label={`${added ? 'Selected' : 'Add'} ${path.title}`}><span>{path.title}{via && <small className={styles.alias}>{via}</small>}</span><span className={styles.addIcon} aria-hidden="true">{added ? '✓' : '+'}</span></button>; })}
              {!results.length && <p className={styles.empty}>No matches yet. Try a shorter name or another path type.</p>}
            </>}
          </div>

        </section>
        <aside className={styles.side}>
          <section className={styles.shortlist} aria-label="Your shortlist"><div className={styles.cardHeading}><span className={styles.step}>2</span><h2>Your shortlist</h2><span className={styles.counter} key={selected.length} aria-live="polite">{selected.length} <span>/ 3</span></span></div>
            {selected.length > 0 && <div className={styles.slots}>{selected.map((path) => <div key={path.id} className={styles.selected} data-kind={path.kind}><span className={styles.pathIcon}><PathIcon kind={path.kind} /></span><div><span>{kindLabel(path.kind)}</span><strong>{path.title}</strong></div><button disabled={status === 'sending'} onClick={() => { setSelected(selected.filter((p) => p.id !== path.id)); setStatus('idle'); setError(''); }} aria-label={`Remove ${path.title}`}>×</button></div>)}</div>}

            {selected.length === 3 && <p className={styles.limit} role="status">Your three choices are ready. Remove one to swap it.</p>}
            <div className={styles.divider} />
            {testing ? <div><p className={styles.testNote}>Test mode · No emails or signups</p><a className={styles.send} href={selected.length ? preview : undefined} aria-disabled={!selected.length} target="_blank" rel="noreferrer">View results <span aria-hidden="true">↗</span></a></div> : <>
            {status === 'sent' ? <div className={styles.success} role="status"><span>✓</span><h3>Your report is on its way.</h3><p>We’ve sent it for delivery to <strong>{email}</strong>. Check your spam folder if it doesn’t arrive.</p><a href={preview} target="_blank" rel="noreferrer">Read it here, too →</a><button onClick={() => setStatus('idle')}>Use a different email</button>{error && <p role="status">{error}</p>}</div> : <form onSubmit={submit}>
              <label className={styles.emailLabel} htmlFor="career-email">Where shall we send your results?</label><input id="career-email" className={styles.email} type="email" autoComplete="email" placeholder="Your email address" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} required disabled={status === 'sending'} />
              <div className={styles.honeypot} aria-hidden="true"><label>Website<input name="website" value={website} onChange={(event) => setWebsite(event.target.value)} autoComplete="off" tabIndex={-1} /></label></div>
              <button className={styles.send} type="submit" disabled={!selected.length || status === 'sending'}>{status === 'sending' ? 'Sending your report…' : 'Check these careers'}<span aria-hidden="true">→</span></button>

              <p className={styles.signupNote}>Includes Stable Future emails. Unsubscribe anytime.</p>
              {error && <p className={styles.error} role="alert">{error}</p>}
              {selected.length > 0 && <a className={styles.preview} href={preview} target="_blank" rel="noreferrer">Preview your report ↗</a>}
            </form>}
            </>}
          </section>
        </aside>
      </div>
    </div>
  </main>;
}
