'use client';

import Link from 'next/link';
import posthog from 'posthog-js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BANDS } from '../lib/exposure-bands.mjs';
import { searchMatches } from '../lib/pathSearch';
import styles from './career-check.module.css';

type Path = { id: string; kind: string; title: string; aka?: string[]; sectors?: (string | { id: string; label: string })[] };
type JobGroup = { id: string; title: string; members: { id: string; title: string }[] };
type Catalogue = { paths: Path[]; jobGroups: JobGroup[] };

const KINDS = [
  { kind: '', title: 'All' },
  { kind: 'degree', title: 'Degrees' },
  { kind: 'apprenticeship', title: 'Apprenticeships' },
  { kind: 'job', title: 'Jobs' },
];
const KIND_ORDER: Record<string, number> = { degree: 0, apprenticeship: 1, job: 2 };
const kindLabel = (kind: string) => kind === 'degree' ? 'Degree' : kind === 'apprenticeship' ? 'Apprenticeship' : 'Job';
// One tap adds these. Chosen because parents ask about them most often.
const HINTS = ['Psychology', 'Electrician', 'Law', 'Software developer', 'Medicine', 'Marketing'];
const MAX = 3;

function track(event: string, props?: Record<string, unknown>) {
  try { if ((posthog as unknown as { __loaded?: boolean }).__loaded) posthog.capture(event, props); } catch {}
}

function PathIcon({ kind }: { kind: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{kind === 'degree' ? <><path d="m3 9 9-5 9 5-9 5-9-5Z" /><path d="M6 11v6c4 3 8 3 12 0v-6M21 9v7" /></> : kind === 'apprenticeship' ? <><path d="m14 5 5 5M4 20l4-1L20 7l-3-3L5 16l-1 4Z" /><path d="m5 16 3 3" /></> : kind === 'job' ? <><rect x="3" y="7" width="18" height="13" rx="3" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12c6 4 12 4 18 0M12 12v4" /></> : <><circle cx="12" cy="12" r="8" /><path d="M12 8v8M8 12h8" /></>}</svg>;
}

// Three paths rise to the sun; each chosen path lights one of them.
function Horizon({ count }: { count: number }) {
  const paths = ['M90 640 C 260 560, 470 430, 600 150', 'M600 640 C 600 520, 600 330, 600 150', 'M1110 640 C 940 560, 730 430, 600 150'];
  return <svg className={styles.horizon} viewBox="0 0 1200 640" aria-hidden="true">
    <defs>
      <radialGradient id="cc-sun" cx="42%" cy="38%" r="65%"><stop offset="0" stopColor="#ffd59a" /><stop offset=".5" stopColor="#ff9447" /><stop offset="1" stopColor="#f0622a" /></radialGradient>
      <radialGradient id="cc-glow"><stop offset="0" stopColor="#ffb36b" stopOpacity=".5" /><stop offset="1" stopColor="#ffb36b" stopOpacity="0" /></radialGradient>
    </defs>
    <circle cx="600" cy="150" r="190" fill="url(#cc-glow)" className={styles.glow} />
    {paths.map((d, i) => <g key={d} className={i < count ? styles.pathOn : styles.pathOff}>
      <path d={d} className={styles.pathBase} pathLength={1} />
      <path d={d} className={styles.pathLit} pathLength={1} />
      <path d={d} className={styles.pathFlow} pathLength={1} />
    </g>)}
    <circle cx="600" cy="150" r="44" fill="url(#cc-sun)" className={styles.sun} />
  </svg>;
}

function LockedMeter() {
  return <span className={styles.locked} aria-label="Score shown in your report">
    {BANDS.map((b) => <i key={b.key} style={{ background: b.tint }} />)}
    <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3.5" y="7" width="9" height="6.5" rx="1.5" fill="currentColor" /><path d="M5.5 7V5.2a2.5 2.5 0 0 1 5 0V7" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
  </span>;
}

export default function CareerCheck({ testing = false }: { testing?: boolean }) {
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [reload, setReload] = useState(0);
  const [kind, setKind] = useState('');
  const [sector, setSector] = useState('');
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState<Path[]>([]);
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  // Soft opt-in (PECR): follow-up emails unless the parent ticks the opt-out box.
  const [optOut, setOptOut] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');
  const [hint, setHint] = useState(0);
  const emailRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/lead-magnet/search.json', { signal: controller.signal }).then((r) => { if (!r.ok) throw new Error(); return r.json(); }).then((data) => {
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
  const pool = useMemo(() => {
    const group = kind === 'job' && sector ? catalogue?.jobGroups.find((g) => g.id === sector) : null;
    const ids = group ? new Set(group.members.map((m) => m.id)) : null;
    return (catalogue?.paths ?? [])
      .filter((p) => (!kind || p.kind === kind) && (!sector || (kind === 'job' ? ids?.has(p.id) : p.sectors?.some((s) => (typeof s === 'string' ? s : s.id) === sector))))
      .sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || a.title.localeCompare(b.title));
  }, [catalogue, kind, sector]);
  // Nothing is listed until the visitor types or picks a path type.
  const browsing = !query.trim() && !sector && !kind;
  const results = useMemo(() => browsing ? [] : searchMatches(pool, query, (p) => p.title, (p) => p.aka ?? []).slice(0, 60), [pool, query, browsing]);
  const full = selected.length >= MAX;
  const locked = status === 'sending';

  function choose(path: Path) {
    if (selected.some((p) => p.id === path.id) || full || locked) return;
    const next = [...selected, path];
    setSelected(next); setStatus('idle'); setError(''); setQuery(''); setActive(0);
    track('career_check_path_added', { kind: path.kind, count: next.length });
    if (next.length === MAX) window.setTimeout(() => emailRef.current?.focus({ preventScroll: true }), 50);
  }
  function remove(id: string) { setSelected(selected.filter((p) => p.id !== id)); setStatus('idle'); setError(''); }
  function onKey(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!results.length) return;
    if (event.key === 'ArrowDown') { event.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    if (event.key === 'ArrowUp') { event.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    if (event.key === 'Enter') { event.preventDefault(); const hit = results[active]?.item; if (hit) choose(hit); }
  }
  // Test mode only: the preview route is switched off in production, so reports arrive by email.
  const preview = `/api/career-results?${selected.map((p) => `id=${encodeURIComponent(p.id)}`).join('&')}`;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (testing || !selected.length || locked) return;
    setError(''); setStatus('sending');
    track('career_check_requested', { count: selected.length });
    try {
      const response = await fetch('/api/career-results', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: selected.map((p) => p.id), email, website, marketing: !optOut }) });
      const data = await response.json();
      if (!response.ok || data.ok !== true) throw new Error(data.error || 'We could not send your report. Please try again.');
      setError(data.warning || ''); setStatus('sent');
      track('career_check_sent', { count: selected.length });
    } catch (e) { setStatus('idle'); setError(e instanceof Error ? e.message : 'We could not send your report. Please try again.'); }
  }

  const item = (path: Path, extra = '') => {
    const added = selected.some((p) => p.id === path.id);
    return <button type="button" key={path.id} className={`${styles.option} ${extra}`} data-kind={path.kind} data-added={added || undefined} disabled={added || full || locked} onClick={() => choose(path)} aria-label={`${added ? 'Added' : 'Add'} ${path.title}, ${kindLabel(path.kind)}`}>
      <span className={styles.optionIcon}><PathIcon kind={path.kind} /></span>
      <span className={styles.optionText}><strong>{path.title}</strong><small>{kindLabel(path.kind)}</small></span>
      <span className={styles.plus} aria-hidden="true">{added ? '✓' : '+'}</span>
    </button>;
  };

  return <main className={styles.page} data-landing>
    <div className={styles.sky} aria-hidden="true"><Horizon count={selected.length} /></div>
    <header className={styles.bar}>
      <Link href="/" className={styles.brand} aria-label="Stable Future home">stable future <span aria-hidden="true">↗</span></Link>
      <span className={styles.barNote}><b /> Free · 2 minutes</span>
    </header>

    <section className={styles.hero}>
      <p className={styles.eyebrow}>The free AI career check for parents</p>
      <h1>How exposed is your son or daughter’s <em>career path</em> to AI?</h1>
      <p className={styles.lede}>Pick up to three degrees, apprenticeships, or jobs. We’ll email you a clear report: how much of the work AI can do, and what to do about it.</p>
    </section>

    <div className={styles.app}>
      <section className={styles.finder} aria-labelledby="finder-title">
        <div className={styles.stepHead}>
          <span className={styles.stepNo}>1</span>
          <h2 id="finder-title">Choose up to 3 paths</h2>
          <span className={styles.dots} aria-label={`${selected.length} of ${MAX} chosen`}>{Array.from({ length: MAX }, (_, i) => <i key={i} data-on={i < selected.length || undefined} />)}</span>
        </div>

        <label className={styles.search}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" /><path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          <span className={styles.srOnly}>Search degrees, apprenticeships, and jobs</span>
          <input ref={searchRef} type="search" value={query} onChange={(e) => { setQuery(e.target.value); setActive(0); }} onKeyDown={onKey} placeholder={full ? 'All three chosen' : `Try “${HINTS[hint]}”`} autoComplete="off" disabled={full || locked} aria-controls="cc-results" />
          {query && <button type="button" className={styles.clear} onClick={() => { setQuery(''); searchRef.current?.focus(); }} aria-label="Clear search">×</button>}
        </label>

        <div className={styles.kinds} role="group" aria-label="Path type">
          {KINDS.map((k) => <button type="button" key={k.kind || 'all'} aria-pressed={kind === k.kind} onClick={() => { setKind(k.kind); setSector(''); setActive(0); }}>{k.kind && <PathIcon kind={k.kind} />}{k.title}</button>)}
          {kind && areas.length > 0 && <select aria-label={kind === 'degree' ? 'Subject group' : kind === 'apprenticeship' ? 'Apprenticeship route' : 'Career group'} value={sector} onChange={(e) => { setSector(e.target.value); setActive(0); }}>
            <option value="">{kind === 'degree' ? 'All subjects' : kind === 'apprenticeship' ? 'All routes' : 'All career groups'}</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>}
        </div>

        <div id="cc-results" className={styles.results} aria-live="polite">
          {loadError ? <div className={styles.empty}>We couldn’t load the paths. <button type="button" onClick={() => { setLoadError(false); setReload(reload + 1); }}>Try again</button></div>
            : !catalogue ? <div className={styles.skeleton}>{Array.from({ length: 6 }, (_, i) => <i key={i} />)}</div>
            : browsing ? null : <>
              <p className={styles.listLabel}>{results.length ? `${results.length === 60 ? '60+' : results.length} ${results.length === 1 ? 'match' : 'matches'}` : 'No matches yet'}</p>
              <div className={styles.list} role="list">{results.map(({ item: p, via }, i) => <div role="listitem" key={p.id} data-active={i === active || undefined} onMouseEnter={() => setActive(i)}>{item(p)}{via && <span className={styles.via}>Also called {via}</span>}</div>)}</div>
              {!results.length && <p className={styles.empty}>Try a shorter word, or another path type.</p>}
            </>}
        </div>
      </section>

      <aside className={styles.report} ref={formRef} aria-labelledby="report-title">
        <div className={styles.reportCard}>
          {status === 'sent' ? <div className={styles.sent} role="status">
            <div className={styles.sentSun} aria-hidden="true"><i /><i /><i /></div>
            <h2>Check your inbox.</h2>
            <p>Your report is on its way to <strong>{email}</strong>. If it isn’t there in a minute, look in spam or promotions.</p>
            {error && <p className={styles.warning}>{error}</p>}
            <div className={styles.nextStep}>
              <p className={styles.nextEyebrow}>Want a plan, not just a report?</p>
              <p>Ben will help you build a Plan A, B and Z the whole family is happy with. <strong>We only work with 10 families a month.</strong></p>
              <Link className={styles.cta} href="/#advice">Get advice: pick a time <span aria-hidden="true">→</span></Link>
            </div>
            <button type="button" className={styles.again} onClick={() => { setStatus('idle'); setSelected([]); setError(''); }}>Check different paths</button>
          </div> : <>
            <div className={styles.stepHead}>
              <span className={styles.stepNo}>2</span>
              <h2 id="report-title">Your report</h2>
              <span className={styles.ready} data-on={selected.length > 0 || undefined}>{selected.length ? 'Ready to send' : 'Waiting for a path'}</span>
            </div>
            {selected.length > 0 && <ol className={styles.slots}>
              {selected.map((p) => <li key={p.id} className={styles.slot} data-kind={p.kind}>
                <span className={styles.optionIcon}><PathIcon kind={p.kind} /></span>
                <span className={styles.slotText}><small>{kindLabel(p.kind)}</small><strong>{p.title}</strong><LockedMeter /></span>
                <button type="button" onClick={() => remove(p.id)} disabled={locked} aria-label={`Remove ${p.title}`}>×</button>
              </li>)}
            </ol>}

            {testing ? <div className={styles.form}><p className={styles.testNote}>Test mode · no emails or signups</p><a className={styles.cta} href={selected.length ? preview : undefined} aria-disabled={!selected.length} target="_blank" rel="noreferrer">View results <span aria-hidden="true">↗</span></a></div>
              : <form className={styles.form} onSubmit={submit} data-ready={selected.length > 0 || undefined}>
                <label htmlFor="career-email">Where should we send it?</label>
                <input ref={emailRef} id="career-email" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} required disabled={locked} />
                <div className={styles.honeypot} aria-hidden="true"><label>Website<input name="website" value={website} onChange={(e) => setWebsite(e.target.value)} autoComplete="off" tabIndex={-1} /></label></div>
                <label className={styles.optIn}><input type="checkbox" checked={optOut} onChange={(e) => setOptOut(e.target.checked)} disabled={locked} /><span>We’ll also send a few short emails on helping your son or daughter plan their career. Tick here if you’d rather not receive these. You can unsubscribe any time.</span></label>
                <button className={styles.cta} type="submit" disabled={!selected.length || locked}>{locked ? 'Sending your report…' : selected.length ? 'Email my free report' : 'Choose a path first'} <span aria-hidden="true">→</span></button>
                {error && <p className={styles.error} role="alert">{error}</p>}
                <p className={styles.fine}>We use your email to send the report and any follow-ups. <a href="/privacy">Privacy notice</a></p>
              </form>}
          </>}
        </div>
      </aside>
    </div>

    {selected.length > 0 && status !== 'sent' && <button type="button" className={styles.mobileBar} onClick={() => { formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); window.setTimeout(() => emailRef.current?.focus({ preventScroll: true }), 450); }}>
      <span>{selected.length} of {MAX} chosen</span><strong>Get my report →</strong>
    </button>}

    <section className={styles.explain} aria-labelledby="explain-title">
      <h2 id="explain-title">What’s in the report</h2>
      <div className={styles.scale} aria-label="The five exposure bands">{BANDS.map((b) => <span key={b.key} style={{ background: b.bg, color: b.ink }}>{b.label}</span>)}</div>
      <div className={styles.tiles}>
        <article><b>01</b><h3>An exposure band for each path</h3><p>From very low to very high, ranked against 1,182 UK jobs.</p></article>
        <article><b>02</b><h3>Where each path leads</h3><p>The careers a degree, apprenticeship, or jobs sector leads to, each with an AI exposure score.</p></article>
        <article><b>03</b><h3>The tasks inside the job</h3><p>The three most important tasks, and whether AI can help with them today.</p></article>
        <article><b>04</b><h3>What to do next</h3><p>Making a Plan A, B and Z, and getting the right advice.</p></article>
      </div>
      <div className={styles.short}>
        <p className={styles.listLabel}>Why it matters</p>
        <ol>
          <li><strong>Jobs are made of tasks.</strong></li>
          <li><strong>AI exposure measures how much of a job’s tasks AI can do, compared with other jobs.</strong></li>
          <li><strong>Higher exposure is linked to fewer entry-level jobs.</strong> AI is doing the tasks juniors used to do. <a href="https://digitaleconomy.stanford.edu/project/indicators/canaries-dashboard/" target="_blank" rel="noopener">Stanford Digital Economy Lab</a></li>
          <li><strong>AI is improving faster each year,</strong> and companies are starting to use it at scale. <a href="https://epoch.ai/" target="_blank" rel="noopener">Epoch AI</a></li>
        </ol>
      </div>
      <div className={styles.byline}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/ben-grime.jpg" alt="" width={56} height={63} />
        <p><strong>Made by Ben Grime,</strong> a former AI Consultant with an MSc in Data Science. Scores use ONS task data for every UK job. They describe exposure, not the chance of losing a job.</p>
      </div>
    </section>
  </main>;
}
