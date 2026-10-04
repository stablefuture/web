'use client';

import { useEffect, useState } from 'react';
import { BANDS } from '../lib/exposure-bands.mjs';
import { ADVICE, CALL_URL, FAMILIES, JOBS, SOURCES } from './content';
import { reducedMotion, useInView } from './motion';
import s from './parts.module.css';

/* An org pyramid whose junior rows turn into AI as the stages advance. */
const ROWS = [1, 3, 5, 7];
// Which people become AI at each stage, counted from the bottom row.
const AI_AT: Record<number, number[][]> = { 0: [[], [], [], []], 1: [[], [], [], [0, 1, 2, 4, 5]], 2: [[], [], [1, 3], [0, 1, 2, 3, 4, 5]] };
export function Pyramid({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const [stage, setStage] = useState(0);
  const [auto, setAuto] = useState(true);
  const [ref, inView] = useInView<HTMLDivElement>(0.4);
  useEffect(() => {
    if (!inView || !auto || reducedMotion()) return;
    const id = window.setInterval(() => setStage((v) => (v + 1) % 3), 3400);
    return () => window.clearInterval(id);
  }, [inView, auto]);
  return <div className={s.pyramid} data-tone={tone} ref={ref}>
    <div className={s.people} aria-hidden="true">
      {ROWS.map((n, r) => <div key={r} className={s.row} data-row={r}>
        {Array.from({ length: n }, (_, i) => {
          const ai = AI_AT[stage][r].includes(i);
          const rising = stage === 2 && r === 3 && i === 6;
          return <span key={i} className={s.person} data-ai={ai || undefined} data-rise={rising || undefined} style={{ transitionDelay: `${i * 70}ms` }}>
            <svg viewBox="0 0 24 24"><circle cx="12" cy="7.5" r="4.2" /><path d="M3.5 22c0-5 3.8-8.2 8.5-8.2s8.5 3.2 8.5 8.2Z" /></svg>
            <b>AI</b>
          </span>;
        })}
      </div>)}
      <div className={s.rowLabels}><span>Leaders</span><span>Managers</span><span>Experienced</span><span>Juniors</span></div>
    </div>
    <div className={s.stages} role="tablist" aria-label="How AI changes a team">
      {JOBS.pyramid.map((p, i) => <button key={p.label} role="tab" aria-selected={stage === i} onClick={() => { setAuto(false); setStage(i); }}>
        <b>{p.label}</b><span>{p.text}</span>
      </button>)}
    </div>
  </div>;
}

/* Five bright exposure bands. */
export function BandScale({ compact = false }: { compact?: boolean }) {
  return <div className={s.scale} data-compact={compact || undefined}>
    {BANDS.map((b, i) => <span key={b.key} style={{ background: b.bg, color: b.ink, animationDelay: `${i * 90}ms` }}>{b.label}</span>)}
  </div>;
}

/* Three paths branching from the student to Plans A, B, and Z. */
export function AbzPaths({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const [ref, inView] = useInView<HTMLDivElement>(0.35);
  return <div className={s.abz} data-tone={tone} data-in={inView || undefined} ref={ref}>
    <svg viewBox="0 0 600 300" aria-hidden="true">
      <path d="M40 150 C 200 150, 260 50, 430 50" pathLength={1} />
      <path d="M40 150 C 200 150, 260 150, 430 150" pathLength={1} />
      <path d="M40 150 C 200 150, 260 250, 430 250" pathLength={1} />
      <circle cx="40" cy="150" r="16" className={s.origin} />
    </svg>
    <span className={s.you}>Your child</span>
    <ol>
      {FAMILIES.plans.map((p) => <li key={p.key} data-plan={p.key}><b>{p.key}</b><div><strong>{p.title}</strong><span>{p.text}</span></div></li>)}
    </ol>
  </div>;
}

export function Cite({ source }: { source: keyof typeof SOURCES }) {
  return <a className={s.cite} href={SOURCES[source].href} target="_blank" rel="noopener">{SOURCES[source].label}</a>;
}

/* The "Get advice" form. */
export function AdviceForm({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const [values, setValues] = useState({ name: '', email: '', phone: '', situation: '', website: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');
  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValues({ ...values, [key]: e.target.value });
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'sending') return;
    setStatus('sending'); setError('');
    try {
      const response = await fetch('/api/advice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok !== true) throw new Error(data.error || 'We could not send your message. Please try again.');
      setStatus('sent');
    } catch (err) { setStatus('idle'); setError(err instanceof Error ? err.message : 'We could not send your message. Please try again.'); }
  }
  if (status === 'sent') return <div className={s.form} data-tone={tone} role="status">
    <div className={s.thanks}><span aria-hidden="true" /><h3>Thank you, {values.name.split(' ')[0] || 'and welcome'}.</h3><p>Ben will reply to you personally. Keep an eye on your inbox.</p></div>
  </div>;
  const busy = status === 'sending';
  return <form className={s.form} data-tone={tone} onSubmit={submit}>
    <div className={s.pair}>
      <label><span>Your name</span><input value={values.name} onChange={set('name')} autoComplete="name" required maxLength={100} disabled={busy} /></label>
      <label><span>Phone</span><input value={values.phone} onChange={set('phone')} type="tel" inputMode="tel" autoComplete="tel" required maxLength={30} disabled={busy} /></label>
    </div>
    <label><span>Email</span><input value={values.email} onChange={set('email')} type="email" inputMode="email" autoComplete="email" required maxLength={254} disabled={busy} /></label>
    <label><span>Your child’s situation</span><textarea value={values.situation} onChange={set('situation')} placeholder={ADVICE.placeholder} rows={4} required minLength={10} maxLength={3000} disabled={busy} /></label>
    <div className={s.honeypot} aria-hidden="true"><label>Website<input value={values.website} onChange={set('website')} tabIndex={-1} autoComplete="off" /></label></div>
    <button type="submit" disabled={busy}>{busy ? 'Sending…' : ADVICE.button}<span aria-hidden="true">→</span></button>
    {error && <p className={s.error} role="alert">{error}</p>}
    <p className={s.fine}>We only use these details to reply to you. <a href="/privacy">Privacy notice</a>. {ADVICE.bookInstead} <a href={CALL_URL}>{ADVICE.bookLink}</a>.</p>
  </form>;
}
