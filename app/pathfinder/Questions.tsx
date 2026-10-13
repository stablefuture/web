'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { QUESTIONS } from '../assessment/model';
import { AI_FEEL, AREAS, DEBT, IDEAS, LIKE, MOVE, NEXT, PREFERENCE, PREFERENCES, REFLECT, STAGES, VALUES, emptyAnswers } from './questions.mjs';
import PathSearch, { PathIcon, pathLabel, type Path } from './PathSearch';
import s from './questions.module.css';

type Answers = Omit<ReturnType<typeof emptyAnswers>, 'picks' | 'values' | 'areaVotes' | 'areas' | 'avoidAreas' | 'topAreas' | 'preferences' | 'reflect' | 'next'> & {
  picks: Path[]; values: string[]; areaVotes: Record<string, 1 | -1>; areas: string[]; avoidAreas: string[]; topAreas: string[];
  preferences: Record<string, number>; reflect: Record<string, string>; next: Record<string, 1 | -1>;
};
type Screen =
  | { kind: 'welcome' | 'about' | 'ideas' | 'values' | 'areasMore' | 'top' | 'study' | 'life' | 'ai' | 'worth' | 'extra' | 'goal' | 'done' }
  | { kind: 'intro'; title: string; text: string }
  | { kind: 'activity' | 'area' | 'pref'; i: number };

const KEY = 'pathfinder-questions-v5';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Shown in the sections overview, so students (and Ben) can see the whole route.
const SECTIONS: { title: string; kinds: Screen['kind'][]; text: string }[] = [
  { title: 'About you', kinds: ['about', 'ideas', 'values'], text: `Your name and school year, any careers you have in mind, and your top 3 of ${VALUES.length} things that matter in a job.` },
  { title: 'What you enjoy', kinds: ['activity'], text: `${QUESTIONS.length} quick activities, each from “Not at all” to “A lot”.` },
  { title: 'Your interests', kinds: ['area', 'areasMore', 'top'], text: `Tick or cross ${AREAS.length} areas, then rank your top 3.` },
  { title: 'Your working life', kinds: ['pref'], text: `${PREFERENCES.length} things a job might involve, from “Must avoid” to “Must have”.` },
  { title: 'Next steps', kinds: ['study', 'life', 'ai', 'worth', 'extra', 'goal'], text: 'Your subjects, the routes you’d consider or rule out, moving and debt, AI, what would make work feel worth it, and where you’d like to be at 30.' },
];
// Locally, every section is open for checking. Live, students can revisit sections they have reached.
const OPEN_ALL = process.env.NODE_ENV !== 'production';
const screens: Screen[] = [
  { kind: 'welcome' }, { kind: 'about' }, { kind: 'ideas' }, { kind: 'values' },
  { kind: 'intro', title: 'What would you enjoy doing?', text: 'Sixty quick ones. Go with your gut. You don’t need to have tried it.' },
  ...QUESTIONS.map((_, i) => ({ kind: 'activity' as const, i })),
  { kind: 'intro', title: 'Which areas interest you?', text: 'Tick or cross each one. You’ll pick favourites after.' },
  ...AREAS.map((_, i) => ({ kind: 'area' as const, i })),
  { kind: 'areasMore' }, { kind: 'top' },
  { kind: 'intro', title: 'What kind of working life suits you?', text: 'Ten things a job might involve.' },
  ...PREFERENCES.map((_, i) => ({ kind: 'pref' as const, i })),
  { kind: 'study' }, { kind: 'life' }, { kind: 'ai' }, { kind: 'worth' }, { kind: 'extra' }, { kind: 'goal' }, { kind: 'done' },
];
const counted = screens.filter(x => x.kind !== 'welcome' && x.kind !== 'intro' && x.kind !== 'done');
// Where each section starts (at its intro, if it has one) and ends in the screen list.
const RANGES = SECTIONS.map(({ kinds }) => {
  const first = screens.findIndex(x => kinds.includes(x.kind));
  const last = screens.length - 1 - [...screens].reverse().findIndex(x => kinds.includes(x.kind));
  return { start: screens[first - 1]?.kind === 'intro' ? first - 1 : first, last };
});
const sectionAt = (i: number) => RANGES.findIndex(r => i >= r.start && i <= r.last);
const areaLabel = (id: string) => AREAS.find(([x]) => x === id)?.[1] ?? id;

function Choices({ options, value, onPick, wide }: { options: readonly string[]; value: string; onPick: (v: string) => void; wide?: boolean }) {
  return <div className={wide ? s.chipsWide : s.chips}>{options.map(o => <button type="button" key={o} aria-pressed={value === o} className={value === o ? s.on : ''} onClick={() => onPick(o)}>{o}</button>)}</div>;
}

export default function Questions() {
  const [a, setA] = useState<Answers>(() => emptyAnswers(QUESTIONS.length) as Answers);
  const [step, setStep] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const [overview, setOverview] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const screen = screens[Math.min(step, screens.length - 1)];
  const set = (patch: Partial<Answers>) => setA(prev => ({ ...prev, ...patch }));

  // Restore a saved draft after hydration; the server render cannot read localStorage.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try { const saved = JSON.parse(localStorage.getItem(KEY) || 'null'); if (saved?.a?.activities?.length === QUESTIONS.length) { setA({ ...(emptyAnswers(QUESTIONS.length) as Answers), ...saved.a }); setStep(saved.step || 0); setFurthest(Math.max(saved.furthest || 0, saved.step || 0)); } } catch { /* start fresh */ }
    const k = new URLSearchParams(window.location.search).get('k');
    if (k) { setA(prev => ({ ...prev, k })); window.history.replaceState(null, '', '/pathfinder'); }
    setLoaded(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  useEffect(() => { if (!loaded || screen.kind === 'done') return; try { localStorage.setItem(KEY, JSON.stringify({ a, step, furthest })); } catch { /* private mode */ } }, [a, step, furthest, loaded, screen.kind]);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); window.scrollTo({ top: 0 }); }, [step]);
  useEffect(() => { const d = dialog.current; if (!d) return; if (overview && !d.open) d.showModal(); if (!overview && d.open) d.close(); }, [overview]);

  // The "pick more areas" screen only appears when fewer than three were ticked.
  const go = (n: number, ticked = a.areas.length) => {
    setError('');
    let target = Math.max(0, Math.min(n, screens.length - 1));
    if (screens[target].kind === 'areasMore' && ticked >= 3) target += target > step ? 1 : -1;
    setStep(target); setFurthest(f => Math.max(f, target));
  };
  const next = () => go(step + 1);
  const later = (fn: () => void) => window.setTimeout(fn, 160);

  function vote(id: string, v: 1 | -1) {
    const areaVotes = { ...a.areaVotes, [id]: v };
    const ids = AREAS.map(([x]) => x), areas = ids.filter(x => areaVotes[x] === 1);
    set({ areaVotes, areas, avoidAreas: ids.filter(x => areaVotes[x] === -1), topAreas: a.topAreas.filter(x => areas.includes(x)) });
    return areas.length;
  }

  const scale = screen.kind === 'activity' ? LIKE : screen.kind === 'pref' ? PREFERENCE : null;
  const current = screen.kind === 'activity' ? a.activities[screen.i] : screen.kind === 'pref' ? a.preferences[PREFERENCES[screen.i][0]] ?? 0 : 0;
  function choose(n: number) {
    if (screen.kind === 'activity') { const activities = [...a.activities]; activities[screen.i] = n; set({ activities }); }
    if (screen.kind === 'pref') set({ preferences: { ...a.preferences, [PREFERENCES[screen.i][0]]: n } });
    later(() => go(step + 1));
  }
  function tickArea(v: 1 | -1) {
    if (screen.kind !== 'area') return;
    const ticked = vote(AREAS[screen.i][0], v);
    later(() => go(step + 1, ticked));
  }
  useEffect(() => {
    if (!scale && screen.kind !== 'area') return;
    const onKey = (e: KeyboardEvent) => {
      if (overview || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.metaKey || e.ctrlKey) return;
      if (screen.kind === 'area') { if (e.key === 'ArrowLeft' || e.key === '1') tickArea(-1); if (e.key === 'ArrowRight' || e.key === '2') tickArea(1); return; }
      const n = Number(e.key); if (scale && n >= 1 && n <= scale.length) choose(n);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const ready: Record<string, boolean> = {
    about: !!a.name.trim() && (!!a.k || EMAIL.test(a.email.trim())) && !!a.stage,
    ideas: !!a.ideas && (a.ideas === 'Not yet' || a.picks.length > 0 || !!a.ideasText.trim()),
    values: a.values.length === 3, areasMore: a.areas.length >= 3, top: a.topAreas.length === 3, life: !!a.move && !!a.debt, ai: !!a.ai,
  };
  const canContinue = ready[screen.kind] ?? true;

  async function submit() {
    setSending(true); setError('');
    try {
      const response = await fetch('/api/pathfinder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...a, picks: a.picks.map(({ id, kind, title }) => ({ id, kind, title })) }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Something went wrong. Please try again.');
      try { localStorage.removeItem(KEY); } catch { /* fine */ }
      next();
    } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.'); }
    finally { setSending(false); }
  }

  const progress = screen.kind === 'done' ? 1 : counted.filter(x => screens.indexOf(x) < step).length / counted.length;
  const sectionIndex = sectionAt(step);
  const section = SECTIONS[sectionIndex]?.title ?? '';
  const nav = (label = 'Continue', action = next, disabled = !canContinue) => <div className={s.nav}>
    {step > 1 && <button type="button" className={s.back} onClick={() => go(step - 1)}>← Back</button>}
    <button type="button" className={s.primary} disabled={disabled} onClick={action}>{label} <span aria-hidden="true">→</span></button>
  </div>;
  const rank = (items: string[], chosen: string[], label: (x: string) => string, onChange: (v: string[]) => void) =>
    <div className={s.rank}>{items.map(x => { const n = chosen.indexOf(x); return <button type="button" key={x} aria-pressed={n >= 0} className={n >= 0 ? s.on : ''} onClick={() => onChange(n >= 0 ? chosen.filter(y => y !== x) : chosen.length < 3 ? [...chosen, x] : chosen)}>{n >= 0 && <b>{n + 1}</b>}{label(x)}</button>; })}</div>;
  // The same list appears in the left-hand rail (wide screens) and the Sections dialog (with details).
  // A section is ticked only when every required answer in it is given, not when it is visited.
  const complete = [
    ready.about && ready.ideas && ready.values,
    a.activities.every(Boolean),
    AREAS.every(([id]) => a.areaVotes[id]) && a.areas.length >= 3 && a.topAreas.length === 3,
    PREFERENCES.every(([id]) => a.preferences[id]),
    !!a.move && !!a.debt && !!a.ai,
  ];
  const sectionList = (className: string, detail: boolean) => <ol className={className}>{SECTIONS.map((x, i) => {
    const r = RANGES[i], here = i === sectionIndex, done = !here && complete[i];
    return <li key={x.title} data-state={here ? 'here' : done ? 'done' : 'next'}>
      <button type="button" aria-current={here ? 'step' : undefined} disabled={!OPEN_ALL && r.start > furthest} onClick={() => { setOverview(false); go(r.start); }}>
        <b aria-hidden="true">{complete[i] ? '✓' : i + 1}</b>
        <span><strong>{x.title}{detail && here && <em>You’re here</em>}{complete[i] && <span className={s.srOnly}> (done)</span>}</strong>{detail && <small>{x.text}</small>}</span>
      </button>
    </li>;
  })}</ol>;
  const areaId = screen.kind === 'area' ? AREAS[screen.i][0] : '';

  return (
    <main className={s.page}>
      <header className={s.bar}>
        <Link className={s.brand} href="/">Stable Future</Link>
        {screen.kind !== 'welcome' && screen.kind !== 'done' && <div className={s.progressWrap}>
          <span>{section}</span>
          <div className={s.progress} role="progressbar" aria-label="Progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}><i style={{ width: `${progress * 100}%` }} /></div>
          <span>{Math.round(progress * 100)}%</span>
        </div>}
        {screen.kind !== 'done' && <button type="button" className={s.sectionsButton} onClick={() => setOverview(true)} aria-haspopup="dialog" aria-label="Sections">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1" fill="currentColor" /><circle cx="4.5" cy="12" r="1" fill="currentColor" /><circle cx="4.5" cy="18" r="1" fill="currentColor" /></svg>
          <span>Sections</span>
        </button>}
      </header>
      <dialog ref={dialog} className={s.overview} onClose={() => setOverview(false)} onClick={e => { if (e.target === e.currentTarget) setOverview(false); }} aria-labelledby="pf-overview-title">
        <div className={s.overviewBody}>
          <div className={s.overviewHead}>
            <h2 id="pf-overview-title">What’s in Pathfinder</h2>
            <button type="button" className={s.close} onClick={() => setOverview(false)} aria-label="Close">×</button>
          </div>
          <p>{['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven'][SECTIONS.length]} parts. Your answers save on this device as you go, so you can stop and come back.</p>
          {sectionList(s.sections, true)}
        </div>
      </dialog>
      {screen.kind !== 'done' && <nav className={s.rail} aria-label="Sections">{sectionList(s.railList, false)}</nav>}
      {loaded && <section className={s.stage} key={step}>
        {screen.kind === 'welcome' && <div className={s.welcome}>
          <span className={s.eyebrow}>Pathfinder</span>
          <h1 ref={heading} tabIndex={-1}>Let’s find work that suits you.</h1>
          {a.activities.some(Boolean) && <p className={s.note}>Welcome back. Your answers so far are saved.</p>}
          <button type="button" className={s.primary} onClick={next}>Start <span aria-hidden="true">→</span></button>
        </div>}

        {screen.kind === 'about' && <div className={s.form}>
          <h1 ref={heading} tabIndex={-1}>First, a little about you.</h1>
          <label className={s.field}><span>Your first name</span><input value={a.name} maxLength={60} autoComplete="given-name" onChange={e => set({ name: e.target.value })} /></label>
          {!a.k && <label className={s.field}><span>Your parent or carer’s email</span><small>The one they used to sign up, so Ben can match your answers.</small><input type="email" value={a.email} maxLength={254} autoComplete="off" onChange={e => set({ email: e.target.value })} /></label>}
          <fieldset className={s.group}><legend>Where are you in education?</legend><Choices options={STAGES} value={a.stage} onPick={v => set({ stage: v })} /></fieldset>
          {nav()}
        </div>}

        {screen.kind === 'ideas' && <div className={s.form}>
          <h1 ref={heading} tabIndex={-1}>Any careers in mind?</h1>
          <Choices options={IDEAS} value={a.ideas} onPick={v => set({ ideas: v })} wide />
          {a.ideas && a.ideas !== 'Not yet' && <>
            <div className={s.field}><span>Add the jobs, degrees, or apprenticeships you’re thinking about</span><PathSearch selected={a.picks} max={10} onChoose={p => set({ picks: [...a.picks, p] })} /></div>
            {a.picks.length > 0 && <ul className={s.picked}>{a.picks.map(p => <li key={p.id} data-kind={p.kind}><span className={s.pickIcon}><PathIcon kind={p.kind} /></span><span><strong>{p.title}</strong><small>{pathLabel(p)}</small></span><button type="button" aria-label={`Remove ${p.title}`} onClick={() => set({ picks: a.picks.filter(x => x.id !== p.id) })}>×</button></li>)}</ul>}
            <label className={s.field}><span>What draws you to {a.picks.length > 1 ? 'them' : 'it'}? (optional)</span><small>Or describe ideas you couldn’t find.</small><textarea rows={3} value={a.ideasText} maxLength={2000} onChange={e => set({ ideasText: e.target.value })} placeholder="e.g. I like working out why people do things." /></label>
          </>}
          {nav()}
        </div>}

        {screen.kind === 'values' && <div className={s.form}>
          <h1 ref={heading} tabIndex={-1}>What matters most in a career?</h1>
          <p className={s.lede}>Tap your top three, most important first.</p>
          {rank(VALUES.map(([id]) => id), a.values, id => VALUES.find(([x]) => x === id)?.[1] ?? id, values => set({ values }))}
          {nav()}
        </div>}

        {screen.kind === 'intro' && <div className={s.intro}>
          <span className={s.eyebrow}>{section}</span>
          <h1 ref={heading} tabIndex={-1}>{screen.title}</h1>
          <p>{screen.text}</p>
          {nav('Let’s go', next, false)}
        </div>}

        {scale && 'i' in screen && <div className={s.question}>
          <span className={s.eyebrow}>{screen.kind === 'activity' ? 'Would you enjoy this?' : 'In a job, how do you feel about…'}</span>
          <h1 ref={heading} tabIndex={-1}>{screen.kind === 'activity' ? QUESTIONS[screen.i][0] : PREFERENCES[screen.i][1]}</h1>
          <div className={s.scale} data-count={scale.length}>{scale.map((label, i) => <button type="button" key={label} aria-pressed={current === i + 1} className={current === i + 1 ? s.on : ''} onClick={() => choose(i + 1)}><kbd>{i + 1}</kbd>{label}</button>)}</div>
          <div className={s.nav}><button type="button" className={s.back} onClick={() => go(step - 1)}>← Back</button>{current > 0 && <button type="button" className={s.back} onClick={next}>Next →</button>}</div>
        </div>}

        {screen.kind === 'area' && <div className={s.question}>
          <span className={s.eyebrow}>Would you like to explore this? · {screen.i + 1} of {AREAS.length}</span>
          <h1 ref={heading} tabIndex={-1}>{AREAS[screen.i][1]}</h1>
          <div className={s.binary}>
            {([[-1, '×', 'Not for me'], [1, '✓', 'Interested']] as const).map(([v, glyph, label]) => <button type="button" key={v} data-v={v} aria-pressed={a.areaVotes[areaId] === v} className={a.areaVotes[areaId] === v ? s.on : ''} onClick={() => tickArea(v)}><span aria-hidden="true">{glyph}</span>{label}</button>)}
          </div>
          <div className={s.nav}><button type="button" className={s.back} onClick={() => go(step - 1)}>← Back</button>{a.areaVotes[areaId] && <button type="button" className={s.back} onClick={next}>Next →</button>}</div>
        </div>}

        {screen.kind === 'areasMore' && <div className={s.form}>
          <h1 ref={heading} tabIndex={-1}>Pick at least three.</h1>
          <p className={s.lede}>You ticked {a.areas.length || 'none'}. Choose the ones closest to what you might enjoy.</p>
          <div className={s.grid}>{AREAS.map(([id, label]) => { const on = a.areas.includes(id); return <button type="button" key={id} aria-pressed={on} className={on ? s.on : ''} onClick={() => vote(id, on ? -1 : 1)}>{label}</button>; })}</div>
          {nav(a.areas.length >= 3 ? 'Continue' : `Choose ${3 - a.areas.length} more`)}
        </div>}

        {screen.kind === 'top' && <div className={s.form}>
          <h1 ref={heading} tabIndex={-1}>Which draw you most?</h1>
          <p className={s.lede}>Tap your top three, favourite first.</p>
          {rank(a.areas, a.topAreas, areaLabel, topAreas => set({ topAreas }))}
          {nav()}
        </div>}

        {screen.kind === 'study' && <div className={s.form}>
          <h1 ref={heading} tabIndex={-1}>What are you studying?</h1>
          <label className={s.field}><span>Subjects and grades</span><small>Current, predicted, or final. Rough is fine.</small><textarea rows={4} value={a.subjects} maxLength={2000} onChange={e => set({ subjects: e.target.value })} placeholder="e.g. A levels: Psychology (predicted A), Sociology (B), English Lit (B). GCSEs: mostly 6s and 7s." /></label>
          <fieldset className={s.group}><legend>What could you do next?</legend><small className={s.hint}>Tick any you’d consider. Cross any you’d rule out.</small>
            <div className={s.ticks}>{NEXT.map(option => <div key={option} className={s.tickRow}><span>{option}</span>
              {([[-1, '×', 'Rule out'], [1, '✓', 'Consider']] as const).map(([v, glyph, label]) => <button type="button" key={v} data-v={v} aria-label={`${label}: ${option}`} aria-pressed={a.next[option] === v} className={a.next[option] === v ? s.on : ''} onClick={() => { const choice = { ...a.next }; if (choice[option] === v) delete choice[option]; else choice[option] = v; set({ next: choice }); }}>{glyph}</button>)}
            </div>)}</div>
          </fieldset>
          {nav()}
        </div>}

        {screen.kind === 'life' && <div className={s.form}>
          <h1 ref={heading} tabIndex={-1}>A couple of practical ones.</h1>
          <fieldset className={s.group}><legend>Would you move away for study or work?</legend><Choices options={MOVE} value={a.move} onPick={v => set({ move: v })} wide /></fieldset>
          <fieldset className={s.group}><legend>How do you feel about student debt?</legend><Choices options={DEBT} value={a.debt} onPick={v => set({ debt: v })} wide /></fieldset>
          {nav()}
        </div>}

        {screen.kind === 'ai' && <div className={s.form}>
          <h1 ref={heading} tabIndex={-1}>How do you feel about AI and your future work?</h1>
          <div className={s.scale} data-count={AI_FEEL.length}>{AI_FEEL.map((label, i) => <button type="button" key={label} aria-pressed={a.ai === label} className={a.ai === label ? s.on : ''} onClick={() => set({ ai: label })}><kbd>{i + 1}</kbd>{label}</button>)}</div>
          <label className={s.field}><span>Why? (optional)</span><textarea rows={3} value={a.aiText} maxLength={2000} onChange={e => set({ aiText: e.target.value })} /></label>
          {nav()}
        </div>}

        {screen.kind === 'worth' && <div className={s.form}>
          <h1 ref={heading} tabIndex={-1}>What would make work feel worth it?</h1>
          <p className={s.lede}>Answer any that spark a thought. A sentence or two is plenty.</p>
          {REFLECT.map(([id, question, hint]) => <label key={id} className={s.field}><span>{question}</span><small>{hint}</small><textarea rows={2} value={a.reflect[id] ?? ''} maxLength={1000} onChange={e => set({ reflect: { ...a.reflect, [id]: e.target.value } })} /></label>)}
          {nav(Object.values(a.reflect).some(v => v.trim()) ? 'Continue' : 'Skip')}
        </div>}

        {screen.kind === 'extra' && <div className={s.form}>
          <h1 ref={heading} tabIndex={-1}>Anything else Ben should know?</h1>
          <p className={s.lede}>Worries, hopes, things you’re good at, what your family thinks. Anything helps.</p>
          <label className={s.field}><span className={s.srOnly}>Your answer</span><textarea rows={6} value={a.extra} maxLength={3000} onChange={e => set({ extra: e.target.value })} /></label>
          {nav(a.extra.trim() ? 'Continue' : 'Skip')}
        </div>}

        {screen.kind === 'goal' && <div className={s.form}>
          <h1 ref={heading} tabIndex={-1}>Last one: picture yourself at 30.</h1>
          <p className={s.lede}>What does a good life look like? Where are you, what are you doing, what matters?</p>
          <label className={s.field}><span className={s.srOnly}>Your answer</span><textarea rows={6} value={a.goal} maxLength={2000} onChange={e => set({ goal: e.target.value })} placeholder="A few sentences is plenty." /></label>
          {error && <p className={s.error} role="alert">{error}</p>}
          {nav(sending ? 'Sending…' : 'Send my answers', submit, sending)}
        </div>}

        {screen.kind === 'done' && <div className={s.welcome}>
          <span className={s.eyebrow}>All done</span>
          <h1 ref={heading} tabIndex={-1}>Thank you{a.name ? `, ${a.name.trim().split(' ')[0]}` : ''}.</h1>
          <p>Ben has your answers. He’ll go through them and email your parent or carer to arrange your results call.</p>
        </div>}
      </section>}
    </main>
  );
}
