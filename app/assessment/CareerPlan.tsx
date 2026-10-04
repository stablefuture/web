"use client";

import { useState } from "react";
import { linkedRoutes, MODEL_VERSION, type Job } from "./model";
import { chooseUnit, exposureText, formatDate, planPrompts, planText, PLAN_KEY, SLOTS, SLOT_LABELS, type CareerPlan, type PlanChoice, type Slot } from "./career-plan";
import styles from "./career-plan.module.css";

const descriptions = {
  A: "The direction you most want to take.",
  B: "A different route you would willingly take.",
  Z: "A practical way to earn if A and B do not work out.",
};
const kind = (unit: Job) => unit.path === "jobs" ? "Career" : unit.path === "degrees" ? "Degree subject" : `Apprenticeship · level ${unit.level}`;
const pay = (unit: Job) => unit.salary == null ? "Not available" : `£${Math.round(unit.salary).toLocaleString("en-GB")}`;

export function Exposure({ unit }: { unit?: Job }) {
  const value = unit?.path === "jobs" ? unit.exposure : null;
  return <div className={styles.exposure}>
    <div><span>AI exposure</span><strong>{value == null ? "Not available" : `${value}/100`}</strong></div>
    {value != null && <div className={styles.scale} role="img" aria-label={`Relative AI exposure ${value} out of 100`}><i style={{ left: `${Math.max(0, Math.min(100, value))}%` }} /></div>}
    <small>{unit?.path !== "jobs" ? "A course has no single career exposure score." : value == null ? "Missing evidence does not mean low exposure." : "Lower → higher · not a chance of job loss"}</small>
  </div>;
}

function ChoicePicker({ slot, units, savedIds, onChoose }: { slot: Slot; units: Job[]; savedIds: string[]; onChoose: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const [path, setPath] = useState("jobs");
  const tokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const candidates = units.filter(unit => unit.path === path);
  const found = tokens.length ? candidates.filter(unit => tokens.every(token => [unit.label, ...(unit.aka ?? [])].some(label => label.toLowerCase().includes(token)))) : candidates.filter(unit => savedIds.includes(unit.id));
  const matches = found.slice(0, 8);
  return <div className={styles.picker}>
    <label>Type of option<select value={path} onChange={e => { setPath(e.target.value); setQuery(""); }}><option value="jobs">Careers</option><option value="degrees">Degrees</option><option value="apprenticeships">Apprenticeships</option></select></label>
    <label>Find an option for {slot}<input type="search" value={query} maxLength={100} onChange={e => setQuery(e.target.value)} placeholder={path === "jobs" ? "e.g. software, nursing, electrician" : "Search by subject or title"} /></label>
    {!tokens.length && <p>{matches.length ? "From your saved careers" : "Search to choose a career or training route."}</p>}
    <ul className={styles.matches}>{matches.map(unit => <li key={unit.id}><button onClick={() => onChoose(unit.id)}><span>{unit.label}<small>{kind(unit)}</small></span><span aria-hidden>＋</span></button></li>)}</ul>
    {tokens.length > 0 && !matches.length && <p role="status">No matches. Try a broader search.</p>}
    {found.length > 8 && <p>Showing 8 of {found.length}. Refine your search to see other options.</p>}
  </div>;
}

export function PlanBuilder({ plan, setPlan, units, savedIds, onExplore, onBrowse, onClearSaved }: {
  plan: CareerPlan; setPlan: (plan: CareerPlan) => void; units: Job[]; savedIds: string[];
  onExplore: (id: string) => void; onBrowse: () => void; onClearSaved: () => void;
}) {
  const [editing, setEditing] = useState<Slot | null>(null);
  const [status, setStatus] = useState("");
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);
  const prompts = planPrompts(plan, units);
  const count = SLOTS.filter(slot => units.some(u => u.id === plan.choices[slot].unitId)).length;
  const updateChoice = (slot: Slot, patch: Partial<PlanChoice>) => setPlan({ ...plan, choices: { ...plan.choices, [slot]: { ...plan.choices[slot], ...patch } } });
  const changed = savedSnapshot !== null && savedSnapshot !== JSON.stringify(plan);

  function save() {
    try {
      localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
      setSavedSnapshot(JSON.stringify(plan));
      setStatus("Plan saved on this device. Save again after making changes.");
    } catch { setStatus("This browser could not save the plan. Download a copy to keep it."); }
  }
  function download() {
    const date = new Date().toLocaleDateString("en-GB");
    const url = URL.createObjectURL(new Blob([planText(plan, units, MODEL_VERSION, date)], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url; link.download = "my-pathfinder-plan.txt"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <section className={styles.builder} aria-labelledby="plan-title">
    <header className={styles.heading}><div><span className={styles.eyebrow}>YOUR NEXT CHAPTER</span><h2 id="plan-title">One direction. Options if it changes.</h2><p>Choose your A, B, and Z. Compare them below, then decide what to do next.</p></div><span className={styles.count}>{count} of 3 chosen</span></header>
    <div className={styles.choices}>{SLOTS.map(slot => {
      const choice = plan.choices[slot];
      const unit = units.find(u => u.id === choice.unitId);
      const routes = unit?.path === "jobs" ? linkedRoutes(unit, units) : [];
      return <article key={slot} className={styles.choice} aria-label={`Plan ${slot}`}>
        <header><span className={styles.letter}>{slot}</span><div><h3>{SLOT_LABELS[slot]}</h3><p>{descriptions[slot]}</p></div></header>
        {(!unit || editing === slot) ? <>
          {choice.unitId && !unit && <p role="status">Your saved choice is no longer in this data. Please review it.</p>}
          <ChoicePicker slot={slot} units={units} savedIds={savedIds} onChoose={id => { setPlan(chooseUnit(plan, slot, id)); setEditing(null); }} />
          {unit && <button className={styles.link} onClick={() => setEditing(null)}>Keep current choice</button>}
        </> : <>
          <span className={styles.kind}>{kind(unit)}</span><h4>{unit.label}</h4>
          <div className={styles.choiceActions}>{unit.path === "jobs" && <button className={styles.link} onClick={() => onExplore(unit.id)}>Explore the work ↗</button>}<button className={styles.link} onClick={() => setEditing(slot)}>Change {slot}</button><button className={styles.link} onClick={() => setPlan(chooseUnit(plan, slot, ""))}>Clear {slot}</button></div>
          <Exposure unit={unit} />
          {unit.path === "jobs" && <label>Possible training route<select value={choice.routeId} onChange={e => updateChoice(slot, { routeId: e.target.value })}><option value="">Not chosen / direct entry</option>{routes.map(route => <option key={route.id} value={route.id}>{route.label}{route.level ? ` · level ${route.level}` : ""}</option>)}</select><small>Links are starting points. Check the actual course or employer requirements.</small></label>}
          <label>Why this fits me<textarea maxLength={600} rows={3} placeholder="What interests you about the work?" value={choice.reason} onChange={e => updateChoice(slot, { reason: e.target.value })} /></label>
          <details className={styles.checks}><summary>Check access and when to reconsider</summary>
            <label>Entry, time, and cost<textarea maxLength={600} rows={3} placeholder={slot === "Z" ? "How soon could you earn? What training would you need?" : "Subjects, grades, training, cost, or location to check"} value={choice.entryCheck} onChange={e => updateChoice(slot, { entryCheck: e.target.value })} /></label>
            <label>When I would reconsider<textarea maxLength={600} rows={3} placeholder="e.g. if I cannot find suitable places, or work experience changes my view" value={choice.reviewTrigger} onChange={e => updateChoice(slot, { reviewTrigger: e.target.value })} /></label>
          </details>
        </>}
      </article>;
    })}</div>
    {prompts.length > 0 && <aside className={styles.prompts}><h3>Worth thinking about</h3><ul>{prompts.map(prompt => <li key={prompt}>{prompt}</li>)}</ul><p>You can keep your choices. Use these prompts for a conversation with a parent or adviser.</p></aside>}
    {count > 0 && <div className={styles.comparison}><h3>Compare your options</h3><div className={styles.tableScroll} tabIndex={0} role="region" aria-label="Compare A, B, and Z"><table><thead><tr><th scope="col">What to compare</th>{SLOTS.map(slot => <th scope="col" key={slot}>{slot} · {SLOT_LABELS[slot]}</th>)}</tr></thead><tbody>
      {["Choice", "AI exposure", "Typical UK annual pay", "Entry, time, and cost", "When to reconsider"].map((row, index) => <tr key={row}><th scope="row">{row}</th>{SLOTS.map(slot => { const choice = plan.choices[slot]; const unit = units.find(u => u.id === choice.unitId); return <td key={slot}>{index === 0 ? unit?.label ?? "Not chosen" : index === 1 ? exposureText(unit) : index === 2 ? unit?.path === "jobs" ? pay(unit) : "Depends on the career" : index === 3 ? choice.entryCheck || "To check" : choice.reviewTrigger || "To decide"}</td>; })}</tr>)}
    </tbody></table></div><p>Pay covers wider UK job groups and different career stages. It is not starting pay. Training routes do not have one career exposure score.</p></div>}
    <section className={styles.action}><div><span className={styles.eyebrow}>MAKE IT PRACTICAL</span><h3>What will you do next?</h3><p>Choose one small action: check a course, speak to someone doing the work, or arrange work experience.</p></div><div>
      <label>My next action<textarea rows={3} maxLength={600} placeholder="I will…" value={plan.nextAction} onChange={e => setPlan({ ...plan, nextAction: e.target.value })} /></label>
      <div className={styles.dates}><label>Do this by<input type="date" value={plan.actionDate} onChange={e => setPlan({ ...plan, actionDate: e.target.value })} /></label><label>Review my plan on<input type="date" value={plan.reviewDate} onChange={e => setPlan({ ...plan, reviewDate: e.target.value })} /></label></div>
    </div></section>
    <footer className={styles.save}><h3>Keep your plan</h3><p>Save a copy to discuss with someone you trust. A draft is fine — you can come back to it.</p>
      <div className={styles.buttons}><button className={styles.primary} onClick={() => window.print()}>Print / save as PDF</button><button onClick={download}>Download text</button><button onClick={save}>Save on this device</button></div>
      <p className={styles.privacy}>Device saving is optional. Anyone using this browser could reopen the saved plan. On a shared school computer, download your copy instead. Your assessment answers are not included in the device save.</p>
      <p role="status">{changed ? "You have changes since your last save on this device." : status}</p>
      <div className={styles.choiceActions}><button className={styles.link} onClick={onBrowse}>← Explore more careers</button><button className={styles.link} onClick={() => { onClearSaved(); setSavedSnapshot(null); setStatus(""); }}>Remove saved copy from this device</button></div>
    </footer>
  </section>;
}

export function PlanReport({ plan, units }: { plan: CareerPlan; units: Job[] }) {
  return <div className={styles.report} data-pathfinder-print>
    <header><span>STABLE FUTURE · PATHFINDER</span><h1>My career plan</h1><p>Prepared {new Date().toLocaleDateString("en-GB")} · A plan to review as I learn more.</p></header>
    {SLOTS.map(slot => {
      const choice = plan.choices[slot]; const unit = units.find(u => u.id === choice.unitId); const route = units.find(u => u.id === choice.routeId);
      return <section key={slot}><h2>{slot} — {SLOT_LABELS[slot]}</h2><h3>{unit?.label ?? (choice.unitId ? "Choice needs review" : "Not chosen yet")}</h3>{route && <p>Via: {route.label}</p>}<p>AI exposure: {exposureText(unit)}</p><dl><dt>Why this fits me</dt><dd>{choice.reason || "To explore"}</dd><dt>Entry, time, and cost</dt><dd>{choice.entryCheck || "To check"}</dd><dt>When I would reconsider</dt><dd>{choice.reviewTrigger || "To decide"}</dd></dl>{unit?.path === "jobs" && <p>Occupation source: <a href={`https://www.onetonline.org/link/summary/${encodeURIComponent(unit.id.slice(5))}`}>{unit.label} · O*NET</a></p>}{(route?.sources ?? unit?.sources ?? []).slice(0, 2).map(s => <p key={s.url}><a href={s.url}>{s.label}</a></p>)}</section>;
    })}
    <section><h2>My next action</h2><p>{plan.nextAction || "Not chosen yet"}</p><p>Do this by: {formatDate(plan.actionDate)}<br />Review my plan: {formatDate(plan.reviewDate)}</p></section>
    {planPrompts(plan, units).length > 0 && <section><h2>Questions to discuss</h2><ul>{planPrompts(plan, units).map(p => <li key={p}>{p}</li>)}</ul></section>}
    <footer>Evidence model: {MODEL_VERSION}. O*NET 30.0 occupations and tasks; Stable Future mappings and AI scores. Scores describe relative exposure, not a probability of job loss. This prototype does not establish personal suitability or course eligibility. Check current entry requirements with the provider or employer.</footer>
  </div>;
}
