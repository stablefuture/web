"use client";

import { useEffect, useId, useRef, useState } from "react";
import { band, linkedRoutes, type Job, type Profile } from "./model";
import styles from "./exploration.module.css";
import { compactSalary as money, rankRoutes, routeTitle, routeCount } from './presentation';
import { band as exposureBand, Dot } from '../lib/bands';

const score = (n: number | null) => n == null ? "Not available" : `${n}/100`;
const aiAdvice = (n: number | null) => n == null || n < 40 ? null : n >= 70 ? "AI skills are essential" : "AI skills are desirable";
type Task = { id: string; text: string; score: number | null; importance: number | null; core: boolean };
type Occupation = { code: string; title: string; description: string; risk: number | null; exposure: number | null; substitution: number | null; rawExposure: number | null; tasks: Task[]; context: {name: string; value: number}[]; source: string };
type JobDetail = { id: string; occupations: Occupation[] };
type Standard = { description: string; duration: number | null; source: string; version: string; updated: string; status: string; degree: string; recognition: string; notice: string; startingSalary: {median: number; sample: number; period: string} | null; requirements: {employer: string; date: string; items: {qualification: string; subject: string; grade: string}[]}[] };

function useData<T>(url: string) {
  const [state, setState] = useState<{url: string; data?: T; error?: string}>({url});
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch(url, {signal: controller.signal}).then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => setState({url, data})).catch(() => { if (!controller.signal.aborted) setState({url, error: "This detail could not load."}); });
    return () => controller.abort();
  }, [url, attempt]);
  return {data: state.url === url ? state.data : undefined, error: state.url === url ? state.error : undefined, retry: () => setAttempt(n => n + 1)};
}

function Loading({error, retry}: {error?: string; retry: () => void}) {
  return error ? <p role="alert">{error} <button onClick={retry}>Try again</button></p> : <p role="status" className={styles.muted}>Loading details…</p>;
}

function External({href, children}: {href: string; children: React.ReactNode}) {
  return /^https?:\/\//.test(href) ? <a href={href} target="_blank" rel="noreferrer">{children} ↗</a> : null;
}

function Advice({exposure}: {exposure: number | null}) {
  const text = aiAdvice(exposure);
  return text ? <p className={styles.advice}><span>Stable Future guidance</span>{text}</p> : null;
}

function Hint({label, children}: {label: string; children: React.ReactNode}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return <span className={styles.hint} onMouseLeave={() => setOpen(false)}><button type="button" aria-label={`About ${label}`} aria-expanded={open} aria-describedby={open ? id : undefined} onMouseEnter={() => setOpen(true)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} onClick={() => setOpen(true)} onKeyDown={e => {if(e.key === 'Escape') {e.preventDefault(); e.stopPropagation(); setOpen(false);}}}>ⓘ</button>{open && <span id={id} role="tooltip">{children}</span>}</span>;
}

export function CareerCard({job, routes, saved, target, onOpen, onSave, onHide}: {job: Job; routes: Job[]; saved: boolean; target: boolean; onOpen: () => void; onSave: () => void; onHide: () => void}) {
  return <article className={styles.card}>
    <div className={styles.cardTop}><span>{target ? "YOUR TARGET" : saved ? "SAVED CAREER" : "EXPLORE A CAREER"}</span><div className={styles.controls}>
      <button onClick={onSave} aria-pressed={saved} aria-label={`${saved ? "Unsave" : "Save"} ${job.label}`}>{saved ? "✓ Saved" : "+ Save"}</button>
      <button onClick={onHide} aria-label={`Remove ${job.label}`}>×</button></div></div>
    <h3><button className={styles.openCard} onClick={onOpen}>{job.label}</button></h3>
    <dl className={styles.headline}><div><dt>AI risk</dt><dd data-band={band(job.risk)}><Dot tone={job.risk == null ? 'none' : exposureBand(job.risk).tone}/>{score(job.risk)}</dd></div><div><dt>Typical annual salary</dt><dd>{money(job.salary)}</dd></div></dl>
    <div className={styles.routePreview}>{["apprenticeships", "degrees"].map(path => { const items = rankRoutes(routes.filter(r => r.path === path)); return <div key={path}><span>{path === "degrees" ? "University" : "Apprenticeships"}</span><ul>{items.slice(0,2).map(r => <li key={r.id}>{routeTitle(r.label, r.path)}{r.level && <small>Level {r.level}</small>}</li>)}</ul>{items.length > 2 && <p>+ {items.length - 2} more</p>}{!items.length && <p>No route listed yet.</p>}</div>; })}</div>
    <span className={styles.explore}>Explore this career <span aria-hidden>↗</span></span>
  </article>;
}

function TaskView({detail, job, technical = false}: {detail: JobDetail; job: Job; technical?: boolean}) {
  const [code, setCode] = useState(detail.occupations[0]?.code ?? "");
  const [all, setAll] = useState(false);
  const occupation = detail.occupations.find(o => o.code === code) ?? detail.occupations[0];
  if (!occupation) return <p className={styles.muted}>A description and task breakdown are not available for this job in the current source.</p>;
  const tasks = all ? occupation.tasks : occupation.tasks.slice(0, 5);
  return <>
    {!technical && <>
    {detail.occupations.length > 1 && <label className={styles.select}>This job group includes<select value={code} onChange={e => {setCode(e.target.value); setAll(false);}}>{detail.occupations.map(o => <option key={o.code} value={o.code}>{o.title}</option>)}</select></label>}
    <p className={styles.description}>{occupation.description}</p>
    <div className={styles.sectionHeading}><h3>What you would do</h3><span>{occupation.tasks.length} tasks</span></div>
    <ul className={styles.tasks}>{tasks.map(t => <li key={t.id}><p>{t.text}</p></li>)}</ul>
    {occupation.tasks.length > 5 && <button className={styles.textButton} onClick={() => setAll(v => !v)}>{all ? "Show fewer tasks" : `Show all ${occupation.tasks.length} tasks`}</button>}
    </>}
    {technical && (occupation.rawExposure != null ? <details className={styles.calculation}><summary>How the AI risk score is calculated</summary>
      <p>Risk combines AI learnability ({score(occupation.exposure)}) and AI substitution ({score(occupation.substitution)}). We take the square root of their product and round it: {occupation.exposure} × {occupation.substitution} → <strong>{score(occupation.risk)}</strong>. This is not a probability of job loss.</p>
      <p>AI substitution reflects how readily AI could replace people, using the work context, including physical and interpersonal demands. The task table below explains the learnability component, not the whole risk score.</p>
      <p>For AI learnability, each task has an AI training feasibility rating. We weight tasks by their importance, then rank the result against other occupations. This score belongs to the displayed O*NET occupation.</p>
      <p className={styles.muted}>Importance measures how important a task is to the job, not the share of working time. Task ratings and the final 0–100 score use different scales.</p>
      <div className={styles.tableWrap}><table><thead><tr><th>Task</th><th>Task rating</th><th>Importance</th></tr></thead><tbody>{occupation.tasks.map(t => <tr key={t.id}><td>{t.text}</td><td>{t.score?.toFixed(2) ?? "Not scored"}</td><td>{t.importance?.toFixed(2) ?? "Not available"}</td></tr>)}</tbody></table></div>
      <p>Weighted task rating: <strong>{occupation.rawExposure.toFixed(3)}</strong>. Relative exposure for {occupation.title}: <strong>{occupation.exposure}/100</strong>.</p>
      {detail.occupations.length > 1 && <p>Mapped occupation scores: {detail.occupations.map(o => `${o.title} (${o.exposure})`).join("; ")}. Their rounded mean gives <strong>{job.exposure}/100</strong>.</p>}
      <p className={styles.muted}>These O*NET descriptions and tasks describe US occupations mapped to a UK job group. Exposure is a relative model score, not a probability of job loss.</p>
      <External href={occupation.source}>O*NET occupation source</External>
    </details> : <p className={styles.muted}>No task-based AI exposure score is available for this occupation. We do not substitute a neighbouring job’s score.</p>)}
  </>;
}

function DegreeDetail({route}: {route: Job}) {
  return <div className={styles.degreeDetails}>
    <p>Check entry requirements and course content before choosing a degree.</p>
    {route.routeNote && <details className={styles.routeScope}><summary>Further training or a specialism may be needed</summary><p>{route.routeNote}</p></details>}
    {route.sources?.slice(0,1).map(source => <p key={source.url}><External href={source.url}>Find courses</External></p>)}
  </div>;
}

function StandardDetail({route, standard}: {route: Job; standard?: Standard}) {
  if (!standard) return <p className={styles.muted}>Further details are not available in the current standard snapshot.</p>;
  const s = standard;
  return <div className={styles.standardDetails}>
    <p>{s.description}</p><Advice exposure={route.exposure}/>
    <dl className={styles.facts}><div><dt>Training</dt><dd>Level {route.level}{s.duration ? ` · ${s.duration} months` : ""}</dd></div><div><dt>Starting pay</dt><dd>{s.startingSalary ? `${money(s.startingSalary.median)} a year` : "Set by the employer"}</dd></div></dl>
    {s.startingSalary && <p className={styles.muted}>Median across {s.startingSalary.sample} adverts with fixed annual pay, {s.startingSalary.period}. Excludes adverts listing only minimum wage or “competitive” pay. England.</p>}
    <h4>Required to enter</h4><p>Employers set their own entry requirements. These examples show essential qualifications in past adverts for this standard.</p>
    {s.requirements.length ? s.requirements.map((r, i) => <details className={styles.requirement} key={i}><summary>{r.employer}<small>{r.date}</small></summary><ul>{r.items.map((item, j) => <li key={j}>{item.subject} · {item.qualification} · grade {item.grade}</li>)}</ul></details>) : <p className={styles.muted}>No employer entry requirements are available in this snapshot.</p>}
    {s.recognition && <p>Professional recognition: {s.recognition}</p>}
    <External href={s.source}>Full apprenticeship standard</External>
    <details className={styles.source}><summary>Sources and data</summary>Skills England · England · version {s.version} · updated {s.updated}. Pay and entry examples: <External href="https://explore-education-statistics.service.gov.uk/find-statistics/apprenticeships">DfE apprenticeship data</External>. Historical adverts, not current vacancies.</details>
  </div>;
}

function RouteDetail({route, standards, error, retry}: {route: Job; standards?: Record<string, Standard>; error?: string; retry: () => void}) {
  const [open, setOpen] = useState(false);
  const count = routeCount(route);
  return <details className={styles.route} onToggle={e => setOpen(e.currentTarget.open)}><summary><span>{routeTitle(route.label, route.path)}</span><small>{route.path === "degrees" ? `${count == null ? '—' : count.toLocaleString('en-GB')} courses` : `Level ${route.level} · ${count == null ? 'Starts unavailable' : `${count.toLocaleString('en-GB')} starts`}`}</small></summary>{open && (route.path === "degrees" ? <DegreeDetail route={route}/> : standards ? <StandardDetail route={route} standard={standards[route.id]}/> : <Loading error={error} retry={retry}/>)}</details>;
}

export function CareerExplorer({job, units, profile, reason, saved, onSave, onClose}: {job: Job; units: Job[]; profile: Profile; reason: string; saved: boolean; onSave: () => void; onClose: () => void}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const {data: detail, error, retry} = useData<JobDetail>(job.detailUrl ?? `/exploration/jobs/${job.id.slice(5)}.json`);
  const {data: standards, error: standardError, retry: retryStandards} = useData<{standards: Record<string, Standard>}>("/exploration/apprenticeships.json");
  const [routeTab, setRouteTab] = useState(profile.route === "University" ? "degrees" : "apprenticeships");
  const routes = rankRoutes(linkedRoutes(job, units));
  const available = routes.filter(r => r.path === routeTab);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.showModal();
    return () => {document.body.style.overflow = overflow; previous?.focus();};
  }, []);
  return <dialog ref={dialog} className={styles.dialog} aria-labelledby="career-title" onCancel={e => {e.preventDefault(); onClose();}} onClick={e => {if(e.target === e.currentTarget) onClose();}}>
    <div className={styles.dialogInner}>
      <div className={styles.dialogTop}><span>CAREER EXPLORER</span><button onClick={onClose} aria-label="Close career explorer">Close ×</button></div>
      <header className={styles.dialogHeader}><h2 id="career-title">{job.label}</h2><button className={styles.saveButton} onClick={onSave} aria-pressed={saved}>{saved ? "✓ Saved" : "+ Save career"}</button></header>
      <p className={styles.reason}>{reason}</p>
      <dl className={styles.heroStats}><div><dt>AI risk <Hint label="AI risk">Combines how readily AI can learn the work with how readily it could substitute for people. This is a relative score, not a percentage chance of losing a job.</Hint></dt><dd data-band={band(job.risk)}><Dot tone={job.risk == null ? 'none' : exposureBand(job.risk).tone}/>{score(job.risk)}</dd></div><div><dt>Typical annual salary <Hint label="salary">Pay across career stages, not starting pay. This figure covers a wider group of similar UK jobs.</Hint></dt><dd>{money(job.salary)}</dd></div><div><dt>UK group openings · 2031 <Hint label="openings">Estimated openings in one year, including replacing people who leave. Covers a wider group of jobs, not just this title or current vacancies.</Hint></dt><dd>{job.openings == null ? 'Not available' : Math.round(job.openings).toLocaleString('en-GB')}</dd></div></dl>
      <p className={styles.muted}>{job.ukGroup ? `Pay and openings group: ${job.ukGroup}.` : 'UK group figures are unavailable.'}</p><Advice exposure={job.exposure}/>
      <section className={styles.section}>{detail ? <TaskView detail={detail} job={job}/> : <Loading error={error} retry={retry}/>}</section>
      <section className={styles.section}><h3>Paths into this career</h3><div className={styles.tabs} role="group" aria-label="Education route">{["apprenticeships", "degrees"].map(path => <button key={path} aria-pressed={routeTab === path} onClick={() => setRouteTab(path)}>{path === "degrees" ? "University" : "Apprenticeships"} <small>{routes.filter(r => r.path === path).length}</small></button>)}</div>
        <p className={styles.muted}>{routeTab === 'degrees' ? 'Most widely offered first' : 'Most starts first'} <Hint label="route order">{routeTab === 'degrees' ? 'Estimated course families across providers, not places or a measure of job demand. Check that a course teaches the specialism you need.' : `People starting this apprenticeship in England in ${routes.find(r => r.startsYear)?.startsYear?.replace(/^(\d{4})(\d{2})$/, '$1/$2') ?? 'the latest recorded year'}, of all ages. These are not current vacancies. Missing counts appear last.`}</Hint></p>
        {available.map(route => <RouteDetail key={route.id} route={route} standards={standards?.standards} error={standardError} retry={retryStandards}/>)}
        {!available.length && <p className={styles.muted}>No {routeTab === "degrees" ? "degree subjects" : "apprenticeship standards"} are linked to this career in the current data.</p>}
      </section>
      <footer className={styles.source}><details><summary>Sources, training requirements, and how we work this out</summary>
        {detail && <TaskView detail={detail} job={job} technical/>}
        <p>Salary and openings use UK occupational groups rather than this exact O*NET title. Openings combine replacement demand and net employment change for 2031; do not add the same group across several jobs. {job.salaryScope?.fallback && `Salary uses ${job.salaryScope.level} ${job.salaryScope.code}.`}</p>
        <p>Degree counts use Discover Uni course families matched to HECoS subjects. Apprenticeship starts use DfE standard-level data for England; missing values are not zero.</p>
        {routes.map(r => <details key={r.id}><summary>{routeTitle(r.label)}</summary>{r.routeNote && <p>{r.routeNote}</p>}{r.sources?.map(s => <p key={s.url}><External href={s.url}>{s.label}</External></p>)}</details>)}
      </details><p>Descriptions and tasks: <External href="https://www.onetcenter.org/database.html">O*NET 30.0</External> · <External href="https://www.onetcenter.org/license_db.html">CC BY 4.0</External>. UK job mappings and AI scores by Stable Future. Degree links show subject routes, not a guarantee that every course qualifies you for this job.</p></footer>
    </div>
  </dialog>;
}
