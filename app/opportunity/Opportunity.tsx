'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import s from './opportunity.module.css';

// The scanner runs on AWS Lambda (github.com/benjamingrime/opportunity-scanner); the page calls it directly.
const API = process.env.NEXT_PUBLIC_SCANNER_API ?? 'https://ictspu6re6wbsompxkhkikz3vu0mfzey.lambda-url.eu-north-1.on.aws';

type Bucket = 'E1' | 'E2' | 'E0';
const BUCKETS: { key: Bucket; label: string; what: string }[] = [
  { key: 'E1', label: 'Buy and train', what: 'An off-the-shelf assistant (ChatGPT, Copilot) could halve the time at equal quality' },
  { key: 'E2', label: 'Build', what: 'It would take software or an agent connected to your systems' },
  { key: 'E0', label: 'People stay central', what: 'AI can’t halve the time' },
];

type Role = { id: string; title: string; headcount: number; department: string | null };
type Step =
  | { kind: 'search'; pattern: string; total: number; top: { soc: string; role: string; titles: number }[] }
  | { kind: 'read'; soc: string; title: string };
type Mapped = { id: string; soc: string | null; role: string | null; confidence: number; reason: string; sure: boolean; searches: string[] };
type Candidate = { soc: string; title: string };
type Review = { question: string; roles: { id: string; title: string; reason: string; candidates: Candidate[] }[] };
type Ranked = { soc: string; title: string; people: number; share: number; hours_each: number; hours: number };
type Report = {
  roles: (Role & { soc: string | null; role: string | null; chosen_by: 'model' | 'person'; confidence: number; hours_each: Record<Bucket, number> | null })[];
  scan: { headcount: number; task_hours_per_week: number; firm: { shares: Record<Bucket, number>; hours: Record<Bucket, number> }; quick_wins: Ranked[]; build_candidates: Ranked[]; index: string } | null;
  warnings: string[];
  model: string;
};
type Status = { id: string; status: 'needs_review'; review: Review } | { id: string; status: 'done'; report: Report };
type Answer = { question: string; answer?: string; tools?: string[]; unsupported?: string[]; error?: string };
type Phase = 'start' | 'mapping' | 'review' | 'scoring' | 'done';

const pct = (x: number) => `${Math.round(x * 100)}%`;
const n = (x: number) => x.toLocaleString('en-GB', { maximumFractionDigits: 1 });

function describe(step: Step) {
  if (step.kind === 'read') return `Read the tasks of ${step.soc} ${step.title}`;
  const top = step.top[0];
  return `Searched job titles for “${step.pattern}”: ${step.total.toLocaleString('en-GB')} found${top ? `, most under ${top.soc} ${top.role}` : ''}`;
}

const TOOL_NAMES: Record<string, string> = {
  get_role: 'an occupation’s tasks', grep_titles: 'job titles', compare_roles: 'a comparison of occupations',
  scan: 'a scan', list_roles: 'the list of occupations', company: 'your results',
};

// The questions agent answers in light Markdown: paragraphs, "- " lists and **bold**.
function Rich({ text }: { text: string }) {
  const inline = (line: string) => line.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <b key={i}>{part}</b> : part));
  return text.trim().split(/\n\s*\n/).map((block, i) => {
    const lines = block.split('\n');
    const items = lines.filter((l) => /^\s*[-*] /.test(l));
    if (items.length && items.length >= lines.length - 1) {
      const head = lines.find((l) => !/^\s*[-*] /.test(l));
      return <div key={i}>{head && <p>{inline(head)}</p>}<ul>{items.map((l, j) => <li key={j}>{inline(l.replace(/^\s*[-*] /, ''))}</li>)}</ul></div>;
    }
    return <p key={i}>{lines.map((l, j) => <span key={j}>{j > 0 && <br />}{inline(l.replace(/^#+ /, ''))}</span>)}</p>;
  });
}

async function problem(res: Response) {
  if (res.status === 429) return 'The demo has reached today’s limit. Please try again tomorrow, or book a call.';
  try { const body = await res.json(); return typeof body.detail === 'string' ? body.detail : 'Something went wrong. Please try again.'; }
  catch { return 'Something went wrong. Please try again.'; }
}

export default function Opportunity() {
  const [csv, setCsv] = useState('');
  const [phase, setPhase] = useState<Phase>('start');
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [steps, setSteps] = useState<Record<string, Step[]>>({});
  const [mapped, setMapped] = useState<Record<string, Mapped>>({});
  const [review, setReview] = useState<Review | null>(null);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [report, setReport] = useState<Report | null>(null);
  const [runId, setRunId] = useState('');
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [asking, setAsking] = useState(false);
  const agentRef = useRef<HTMLElement>(null);

  function settle(st: Status) {
    setRunId(st.id);
    if (st.status === 'needs_review') {
      setReview(st.review);
      setChoices(Object.fromEntries(st.review.roles.map((r) => [r.id, r.candidates[0]?.soc ?? ''])));
      setPhase('review');
    } else {
      setReport(st.report);
      setPhase('done');
    }
  }

  async function run(text: string) {
    setCsv(text);
    setError(''); setWarnings([]); setRoles([]); setSteps({}); setMapped({}); setReview(null); setReport(null); setAnswers([]);
    setPhase('mapping');
    requestAnimationFrame(() => agentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    try {
      const res = await fetch(`${API}/api/assess/stream`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ csv: text }) });
      if (!res.ok || !res.body) throw new Error(await problem(res));
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finished = false;
      for (;;) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const lines = buffer.split('\n');
        buffer = done ? '' : lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim()) continue;
          const e = JSON.parse(line);
          if (e.event === 'roles') { setRoles(e.roles); setWarnings(e.warnings); }
          else if (e.event === 'step') setSteps((cur) => ({ ...cur, [e.role]: [...(cur[e.role] ?? []), e] }));
          else if (e.event === 'mapped') setMapped((cur) => ({ ...cur, [e.id]: e }));
          else if (e.event === 'status') { finished = true; settle(e); }
          else if (e.event === 'error') throw new Error(e.detail);
        }
        if (done) break;
      }
      if (!finished) throw new Error('The connection closed before the agent finished. Please try again.');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPhase('start');
    }
  }

  async function submitReview() {
    setPhase('scoring'); setError('');
    try {
      const res = await fetch(`${API}/api/assess/${runId}/review`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ choices }) });
      if (!res.ok) throw new Error(await problem(res));
      settle(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPhase('review');
    }
  }

  async function ask(q: string) {
    if (q.trim().length < 3 || asking) return;
    setAsking(true); setQuestion('');
    try {
      const res = await fetch(`${API}/api/ask`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q, assessment: runId }) });
      if (!res.ok) throw new Error(await problem(res));
      const body = await res.json();
      setAnswers((cur) => [{ question: q, ...body }, ...cur]);
    } catch (err) {
      setAnswers((cur) => [{ question: q, error: err instanceof Error ? err.message : String(err) }, ...cur]);
    } finally {
      setAsking(false);
    }
  }

  async function example() {
    const res = await fetch('/opportunity-example.csv');
    run(await res.text());
  }

  async function upload(file: File | undefined) {
    if (file) run(await file.text());
  }

  const mappedCount = Object.keys(mapped).length;
  const unsure = Object.values(mapped).filter((m) => !m.sure).length;
  const stage = { start: 0, mapping: roles.length ? 2 : 1, review: 3, scoring: 4, done: 5 }[phase];
  const busy = phase === 'mapping' || phase === 'scoring';

  return (
    <main className={s.page}>
      <header className={s.top}>
        <Link className={s.brand} href="/">Stable Future</Link>
        <a href="/call">Book a call</a>
      </header>

      <section className={s.hero}>
        <p className={s.eyebrow}>For employers · Free demo</p>
        <h1>Where could AI help with your team’s work?</h1>
        <p className={s.lede}>Upload your list of roles. An AI agent matches each job title to a UK occupation, shows its working, and asks you when it isn’t sure. Then you see how your staff’s working time splits across tasks AI could help with.</p>
      </section>

      <section className={s.card} aria-labelledby="start">
        <h2 id="start" className={s.cardTitle}><span className={s.no}>1</span>Your roles</h2>
        <div className={s.startGrid}>
          <div>
            <button className={s.primary} onClick={example} disabled={busy}>Try an example firm</button>
            <p className={s.small}>A 142-person law firm with 40 roles. Takes about 30 seconds.</p>
          </div>
          <div>
            <label className={s.upload}>
              <input type="file" accept=".csv,text/csv" disabled={busy} onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} />
              <span>Upload a CSV</span>
            </label>
            <p className={s.small}>Columns: <b>Job title</b>, and optionally <b>Headcount</b>, <b>Department</b> and <b>Description</b>. Up to 60 roles. <a href="/opportunity-example.csv" download>Example file</a>.</p>
          </div>
        </div>
        <details className={s.paste}>
          <summary>Or paste the CSV</summary>
          <textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={6} placeholder={'Job title,Headcount\nPayroll administrator,2\nPartner,4'} />
          <button className={s.secondary} onClick={() => run(csv)} disabled={busy || csv.trim().length < 5}>Scan these roles</button>
        </details>
        <p className={s.privacy}>Roles only, not people: leave out names and emails. Columns that look like personal data are dropped before anything reaches the AI. Runs are kept for 30 days so you can come back to a review, then deleted.</p>
        {error && <p className={s.error} role="alert">{error}</p>}
      </section>

      {phase !== 'start' && (
        <section className={s.card} ref={agentRef} aria-labelledby="agent" aria-busy={busy}>
          <h2 id="agent" className={s.cardTitle}><span className={s.no}>2</span>The agent at work</h2>
          <ol className={s.stages}>
            {['Read the file', `Match each role${roles.length ? ` (${mappedCount}/${roles.length})` : ''}`, `You check${unsure && stage > 2 ? ` ${unsure}` : ''} unsure ones`, 'Scan the tasks'].map((label, i) => (
              <li key={label} data-state={stage > i + 1 ? 'done' : stage === i + 1 ? 'now' : 'todo'}>{label}</li>
            ))}
          </ol>
          <p className={s.small}>For each role, the agent searches the 30,000 job titles in the ONS coding index, reads the tasks of close occupations, then picks one and says how sure it is. Code, not the AI, does the reading of the file and the scan.</p>
          {warnings.map((w) => <p key={w} className={s.warn}>{w}</p>)}
          <ul className={s.roles}>
            {roles.map((r) => {
              const m = mapped[r.id];
              const st = steps[r.id] ?? [];
              return (
                <li key={r.id} data-state={m ? (m.sure ? 'sure' : 'unsure') : 'working'}>
                  <details>
                    <summary>
                      <span className={s.roleTitle}>{r.title}<small>{n(r.headcount)} {r.headcount === 1 ? 'person' : 'people'}{r.department ? ` · ${r.department}` : ''}</small></span>
                      <span className={s.roleStatus}>
                        {m ? (
                          <>
                            <span className={s.badge} data-sure={m.sure}>{m.sure ? 'Sure' : 'Check'} · {pct(m.confidence)}</span>
                            <span>{m.soc ? `${m.soc} ${m.role}` : 'No match'}</span>
                          </>
                        ) : (
                          <span className={s.live}><i aria-hidden="true" />{st.length ? describe(st[st.length - 1]) : 'Thinking…'}</span>
                        )}
                      </span>
                    </summary>
                    <ol className={s.trace}>
                      {st.map((x, i) => <li key={i}>{describe(x)}</li>)}
                      {m && <li><b>Chose {m.soc ?? 'nothing'}</b>: {m.reason}</li>}
                    </ol>
                  </details>
                </li>
              );
            })}
          </ul>
          {phase === 'mapping' && !roles.length && <p className={s.live}><i aria-hidden="true" />Reading the file…</p>}
        </section>
      )}

      {review && (phase === 'review' || phase === 'scoring') && (
        <section className={s.card} aria-labelledby="review">
          <h2 id="review" className={s.cardTitle}><span className={s.no}>3</span>Your check</h2>
          <p className={s.small}>The agent wasn’t sure about these, so it has paused for you. Pick the closest occupation. Its first choice is selected.</p>
          <div className={s.reviewList}>
            {review.roles.map((r) => (
              <fieldset key={r.id}>
                <legend>{r.title}</legend>
                <p className={s.reason}>{r.reason}</p>
                {r.candidates.map((c) => (
                  <label key={c.soc} className={s.choice}>
                    <input type="radio" name={r.id} value={c.soc} checked={choices[r.id] === c.soc} onChange={() => setChoices((cur) => ({ ...cur, [r.id]: c.soc }))} />
                    <span><b>{c.soc}</b> {c.title}</span>
                  </label>
                ))}
              </fieldset>
            ))}
          </div>
          <button className={s.primary} onClick={submitReview} disabled={phase === 'scoring'}>{phase === 'scoring' ? 'Scanning…' : 'Continue to the scan'}</button>
          {error && <p className={s.error} role="alert">{error}</p>}
        </section>
      )}

      {report?.scan && (
        <section className={s.card} aria-labelledby="results">
          <h2 id="results" className={s.cardTitle}><span className={s.no}>4</span>Where your staff’s time goes</h2>
          <p className={s.small}>Across {n(report.scan.headcount)} people. Hours are total hours a week spent on each kind of task, assuming full-time staff. They are not hours AI would save.</p>
          <div className={s.bar} role="img" aria-label={BUCKETS.map((b) => `${b.label} ${pct(report.scan!.firm.shares[b.key])}`).join(', ')}>
            {BUCKETS.map((b) => <span key={b.key} data-b={b.key} style={{ width: pct(report.scan!.firm.shares[b.key]) }} />)}
          </div>
          <div className={s.legend}>
            {BUCKETS.map((b) => (
              <div key={b.key}>
                <span className={s.dot} data-b={b.key} />
                <b>{pct(report.scan!.firm.shares[b.key])}</b>
                <strong>{b.label}</strong>
                <small>{n(report.scan!.firm.hours[b.key])} hours a week. {b.what}.</small>
              </div>
            ))}
          </div>
          <div className={s.lists}>
            <div>
              <h3>Quick wins: buy and train</h3>
              <ol>{report.scan.quick_wins.slice(0, 5).map((r) => <li key={r.soc}>{r.title}<small>{n(r.people)} people · {n(r.hours_each)} hours a week each ({pct(r.share)})</small></li>)}</ol>
            </div>
            <div>
              <h3>Worth a project: build</h3>
              <ol>{report.scan.build_candidates.slice(0, 5).map((r) => <li key={r.soc}>{r.title}<small>{n(r.people)} people · {n(r.hours_each)} hours a week each ({pct(r.share)})</small></li>)}</ol>
            </div>
          </div>
          <details className={s.mapTable}>
            <summary>How each of your roles was matched</summary>
            <table>
              <thead><tr><th>Your role</th><th>UK occupation</th><th>Chosen by</th></tr></thead>
              <tbody>{report.roles.map((r) => <tr key={r.id}><td>{r.title}</td><td>{r.soc ? `${r.soc} ${r.role}` : 'Not matched'}</td><td>{r.chosen_by === 'person' ? 'You' : `Agent (${pct(r.confidence)})`}</td></tr>)}</tbody>
            </table>
          </details>
        </section>
      )}

      {report?.scan && (
        <section className={s.card} aria-labelledby="ask">
          <h2 id="ask" className={s.cardTitle}><span className={s.no}>5</span>Ask about your results</h2>
          <p className={s.small}>A second agent answers from the same data, using tools to look up roles and tasks. Every number in its answer is checked against what the tools returned.</p>
          <form className={s.askForm} onSubmit={(e) => { e.preventDefault(); ask(question); }}>
            <input value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={500} placeholder="Which tasks take paralegals the most time?" aria-label="Your question" />
            <button className={s.primary} disabled={asking || question.trim().length < 3}>{asking ? 'Thinking…' : 'Ask'}</button>
          </form>
          <div className={s.chips}>
            {['Which of our roles has the most buy-and-train work?', 'What could legal secretaries use an assistant for?', 'Compare our associates with our paralegals'].map((q) => (
              <button key={q} type="button" onClick={() => ask(q)} disabled={asking}>{q}</button>
            ))}
          </div>
          {answers.map((a, i) => (
            <div key={answers.length - i} className={s.answer}>
              <p className={s.q}>{a.question}</p>
              {a.error ? <p className={s.error}>{a.error}</p> : (
                <>
                  <div className={s.a}><Rich text={a.answer ?? ''} /></div>
                  <p className={s.small}>
                    Looked up: {a.tools?.length ? [...new Set(a.tools)].map((t) => TOOL_NAMES[t] ?? t).join(', ') : 'nothing'}.{' '}
                    {a.unsupported?.length ? `Check these numbers, which didn’t match the data: ${a.unsupported.join(', ')}.` : 'Every number matched the data.'}
                  </p>
                </>
              )}
            </div>
          ))}
        </section>
      )}

      {phase === 'done' && (
        <section className={s.cta}>
          <h2>Want to turn this into a plan?</h2>
          <p>This is a starting point: it shows where to look, not what you’ll save. On a call we’ll go through your results and pick the first things to try.</p>
          <a className={s.primary} href="/call">Book a free call</a>
        </section>
      )}

      <footer className={s.foot}>
        <p>How it works: job titles are matched to UK SOC 2020 occupations using the ONS coding index, linked to US O*NET tasks, each labelled by whether AI could halve its time (Eloundou et al., “GPTs are GPTs”). Time per task follows Hatgis-Kessell et al. (2026). It describes typical jobs, not yours, and says nothing about jobs lost. {report ? `Model: ${report.model.split(':').pop()}.` : ''}</p>
        <p>Contains public sector information licensed under the Open Government Licence v3.0. Includes information from O*NET 31.0 by USDOL/ETA, used under CC BY 4.0. <a href="https://github.com/benjamingrime/opportunity-scanner">Source code</a>.</p>
      </footer>
    </main>
  );
}
