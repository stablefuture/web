"use client";
import { useMemo, useState } from "react";
import { decisionLabel, proposalLabels, inHumanShortlist, reviewState, type Decision, type ReviewRow } from "./review-model";
import styles from "./viewer.module.css";

export default function Queue({rows, initialDecisions}: {rows: ReviewRow[]; initialDecisions: Decision[]}) {
  const [decisions, setDecisions] = useState(initialDecisions);
  const [kind, setKind] = useState("degree");
  const [status, setStatus] = useState("open");
  const [scope, setScope] = useState("priority");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const states = useMemo(() => new Map(rows.map(r => [r.id, reviewState(r, decisions)])), [rows, decisions]);
  const scoped = rows.filter(r => r.kind === kind && (scope === "all" || inHumanShortlist(r)));
  const filtered = scoped.filter(r =>
    (status === "all" || (status === "open" ? ["pending", "changed"].includes(states.get(r.id)!) : states.get(r.id) === status)) &&
    `${r.title} ${r.code} ${r.jobs.map(j => `${j.title} ${j.code}`).join(" ")}`.toLowerCase().includes(query.trim().toLowerCase()));
  const row = filtered.find(r => r.id === selected) ?? filtered[0];
  const history = row ? decisions.filter(d => d.id === row.id) : [];
  const labels = row ? proposalLabels(row) : null;
  const completed = scoped.filter(r => ["accept", "reject"].includes(states.get(r.id)!)).length;
  const deferred = scoped.filter(r => states.get(r.id) === "defer").length;
  function resetSelection() { setSelected(""); setNote(""); setMessage(""); }
  async function save(action: Decision["action"], target = row, text = note) {
    if (!target || busy) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/mapping-review/decisions", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({id: target.id, fingerprint: target.fingerprint, action, note: text})});
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setDecisions(old => [...old, result]); setNote("");
      const index = filtered.findIndex(r => r.id === target.id);
      setSelected(filtered[index + 1]?.id ?? filtered[index - 1]?.id ?? "");
      setMessage(`Saved to local file: ${target.title} — ${decisionLabel(target, result)}.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Save failed. Please retry."); }
    finally { setBusy(false); }
  }
  function exportReviews() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(decisions, null, 2)], {type: "application/json"}));
    const a = document.createElement("a"); a.href = url; a.download = "mapping-review-decisions.json"; a.click(); URL.revokeObjectURL(url);
  }
  return <main className={styles.page}>
    <p className={styles.eyebrow}>LOCAL REVIEW · SAVED TO FILE · NOT PUBLISHED</p>
    <h1>Review training routes</h1>
    <p>Choose the outcome you want. Your decision is saved separately; it does not change the original proposal or live recommendations.</p>
    <div className={styles.notice}>Previously used accept/reject? Check the outcome shown under “Your saved decision”. Nothing has been automatically reversed. Related work remains related, and option-specific links remain conditional.</div>
    <div className={styles.actions}><button disabled={busy} onClick={()=>{setStatus("all");resetSelection();}}>Show saved decisions to check or correct</button></div>
    <div className={styles.controls}>
      <label>Mapping<select disabled={busy} value={kind} onChange={e=>{setKind(e.target.value);resetSelection();}}><option value="degree">Degrees → O*NET</option><option value="apprenticeship">Apprenticeships → O*NET</option></select></label>
      <label>Queue<select disabled={busy} value={scope} onChange={e=>{setScope(e.target.value);resetSelection();}}><option value="priority">{kind === "degree" ? "Human shortlist — 50 proposed removals" : "Human shortlist — unresolved / disputed"}</option><option value="all">Full audit — optional spot checks</option></select></label>
      <label>Status<select disabled={busy} value={status} onChange={e=>{setStatus(e.target.value);resetSelection();}}><option value="open">Awaiting review / changed source</option><option value="defer">Deferred</option><option value="accept">Accepted</option><option value="reject">Rejected</option><option value="all">All statuses</option></select></label>
      <label>Search<input disabled={busy} value={query} onChange={e=>{setQuery(e.target.value);resetSelection();}} placeholder="Toxicology, ST code, or job title"/></label>
    </div>
    <div className={styles.actions}><span>{scoped.length} total · {completed} reviewed · {deferred} deferred · {filtered.length} shown</span><button disabled={busy || !filtered.length} onClick={()=>{setSelected(filtered[Math.floor(Math.random()*filtered.length)].id);setNote("");}}>Random spot check</button><button onClick={exportReviews}>Export decisions</button></div>
    <p role="status" aria-live="polite" className={styles.saveStatus}>{message || "Decisions survive reloads and browser changes on this machine. Source changes reopen affected reviews."}</p>
    <div className={styles.workspace}>
      <nav className={styles.sidebar} aria-label="Review queue">{filtered.slice(0, 250).map(r=><button disabled={busy} key={r.id} aria-current={r.id===row?.id ? "true":undefined} onClick={()=>{setSelected(r.id);setNote("");}}><small>{r.code} · {r.proposal === "remove" ? "Proposed removal" : r.proposal === "review" ? "Needs judgement" : "Proposed keep"} · {states.get(r.id)}</small><strong>{r.title}</strong><small>{r.jobs.map(j=>j.title).join(" · ") || "No direct match"}</small></button>)}{filtered.length>250 && <p>Showing the first 250. Search to narrow the list, or use Random spot check across all {filtered.length}.</p>}</nav>
      {row ? <section className={styles.detail} aria-label="Selected proposal">
        <p className={styles.eyebrow}>{row.code} · {states.get(row.id)}</p><h2>{row.title}</h2><p>{row.relation}</p>
        <div className={styles.decisionComparison}>
          <section className={styles.originalProposal} aria-label="Original proposal"><h3>Original proposal</h3><strong>{labels?.original}</strong><p>{row.title} → {row.jobs.map(j=>j.title).join("; ") || "No direct O*NET match"}</p><small>This is the proposal you were asked to review, not your choice.</small></section>
          <section className={styles.savedDecision} aria-label="Your saved decision"><h3>Your saved decision</h3><strong>{decisionLabel(row, history.at(-1))}</strong>{history.at(-1)?.note && <p className={styles.preserve}>{history.at(-1)?.note}</p>}<p>To correct this, choose the intended outcome below. The earlier decision stays in history.</p></section>
        </div>
        {states.get(row.id)==="changed" && <p className={styles.notice}>The evidence or proposal changed since your last decision. Please review again.</p>}
        <p className={styles.preserve}>{row.rationale || "No additional reviewer note."}</p>
        <ul className={styles.links}>{row.jobs.map(j=><li key={j.code}><strong>{j.title}</strong><small>{j.code}</small><p>{j.description}</p><details><summary>O*NET tasks ({j.tasks.length})</summary>{j.tasks.length ? <ul>{j.tasks.map((t,i)=><li key={i}>{t}</li>)}</ul> : <p>No task evidence supplied.</p>}</details><a href={`https://www.onetonline.org/link/summary/${j.code}`} target="_blank" rel="noreferrer">O*NET source ↗</a></li>)}</ul>
        {!row.jobs.length && <p className={styles.notice}>No direct match proposed. Accept confirms no match; reject requests a different mapping.</p>}
        <details open><summary>Training evidence and conditions</summary>{row.evidence.length ? row.evidence.map((e,i)=><p className={styles.preserve} key={i}>{e}</p>) : <p>No supporting training occurrence supplied. Inspect the reviewer note and source before deciding.</p>}{row.sources.map(s=><p key={s.url}><a className={styles.sourceLink} href={s.url} target="_blank" rel="noreferrer">{s.label} ↗</a></p>)}</details>
        <label className={styles.note}>Optional note — correction, condition, or reason<textarea disabled={busy} maxLength={4000} value={note} onChange={e=>setNote(e.target.value)} /></label>
        <h3>What should happen to this mapping?</h3>
        <div className={styles.actions}><button disabled={busy} onClick={()=>save("accept")}>{labels?.accept}</button><button disabled={busy} onClick={()=>save("reject")}>{labels?.reject}</button><button disabled={busy} onClick={()=>save("defer")}>Decide later</button>{history.length>0 && <button disabled={busy} onClick={()=>save("reset")}>Reopen review</button>}</div>
        {!!history.length && <details className={styles.sources}><summary>Decision history ({history.length})</summary>{history.toReversed().map((d,i)=><p key={i}>{d.at} · {decisionLabel(row,d)}<br/><small>Recorded action: {d.action}</small><br/>{d.note}</p>)}</details>}
      </section> : <section className={styles.detail}><h2>No proposals in this queue</h2><p>Change the status or scope to find deferred reviews or spot-check unflagged links.</p></section>}
    </div>
  </main>;
}
