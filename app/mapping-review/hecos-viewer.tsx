"use client";

import {useMemo, useState} from "react";
import {currentReviews, type Subject, type Job, type Mapping, type HumanReview, type HumanLink, type NoRouteAnalysis} from "./hecos-model";
import styles from "./viewer.module.css";
import ui from "./hecos.module.css";

const reason = (s: Subject) => {
  const r = s.review.resolution ?? s.review.second ?? s.review.first;
  return r?.noMappingReason || r?.resolutionReason || r?.availabilityReason || "No supported route recorded.";
};
export default function HecosViewer({subjects, jobs, initialReviews, analysis}: {subjects: Subject[]; jobs: Job[]; initialReviews: HumanReview[]; analysis: NoRouteAnalysis}) {
  const [mode, setMode] = useState<"approved" | "needs_review" | "no_direct_route">("approved");
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("");
  const [reasonFilter, setReasonFilter] = useState("");
  const [filter, setFilter] = useState("pending");
  const [selected, setSelected] = useState("");
  const [reviews, setReviews] = useState(initialReviews);
  const [message, setMessage] = useState("");
  const [undo, setUndo] = useState<HumanReview | null>(null);
  const [saving, setSaving] = useState(false);
  const latest = useMemo(() => currentReviews(reviews, subjects), [reviews, subjects]);
  const catalogue = useMemo(() => new Map(jobs.map(j => [j.code, j])), [jobs]);
  const uncertain = subjects.filter(s => s.status === "needs_review");
  const done = uncertain.filter(s => ["propose", "approve", "exclude"].includes(latest[s.code]?.action)).length;
  const later = uncertain.filter(s => latest[s.code]?.action === "defer").length;
  const rows = subjects.filter(s => s.status === mode && (!area || s.cah1.code === area))
    .filter(s => mode !== "no_direct_route" || !reasonFilter || analysis.subjects.find(x=>x.code===s.code)?.reason_code===reasonFilter)
    .filter(s => mode !== "needs_review" || filter === "all" || (filter === "pending" ? !latest[s.code] : filter === "later" ? latest[s.code]?.action === "defer" : ["propose", "approve", "exclude"].includes(latest[s.code]?.action)))
    .filter(s => `${s.term} ${s.code} ${s.cah3.label} ${[...s.mappings, ...(s.candidateMappings ?? [])].map(m => `${m.onetCode} ${catalogue.get(m.onetCode)?.title}`).join(" ")}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a,b) => a.term.localeCompare(b.term));
  const active = rows.find(s => s.code === selected) ?? rows[0];
  async function persist(review: Omit<HumanReview, "at">) {
    setSaving(true); setMessage("");
    try {
      const response = await fetch("/mapping-review/hecos-decisions", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(review)});
      const value = await response.json();
      if (!response.ok) throw new Error(value.error);
      setReviews(r => [...r, value]);
      setUndo(review.action === "reset" ? null : value);
      setMessage(review.action === "reset" ? "Review undone. The subject is back in the queue." : review.action === "propose" ? "Choices saved for evidence checking. Career results are unchanged." : "Saved locally. Career results are unchanged until these reviews are applied.");
      if (review.action !== "reset") {
        const index = rows.findIndex(s => s.code === review.code);
        setSelected((rows[index + 1] ?? rows[index - 1])?.code ?? "");
      } else { setFilter("pending"); setSelected(review.code); }
    } catch (e) { setMessage(e instanceof Error ? e.message : "Save failed. Try again."); }
    finally { setSaving(false); }
  }
  return <main className={styles.page}>
    <p className={styles.eyebrow}>HECoS → O*NET · LOCAL RESEARCH TOOL</p>
    <h1>Degree subject mappings</h1>
    <p>Standard HECoS names. CAH groups subjects only; it supplies no job links.</p>
    <div className={ui.modes} aria-label="Subject views">
      {([['approved','Approved mappings'],['needs_review','Review uncertainties'],['no_direct_route','No supported route']] as const).map(([key,label]) => <button key={key} aria-pressed={mode===key} disabled={saving} onClick={() => {setMode(key);setSelected("");setQuery("");setArea("");}}>{label} <strong>{subjects.filter(s=>s.status===key).length}</strong></button>)}
    </div>
    {mode === "needs_review" ? <div className={styles.notice}><strong>{done} of {uncertain.length} reviewed · {later} left for later · {uncertain.length-done-later} remaining</strong><br/>Each item is one subject, not one job link. All are currently excluded from results. Suggestions below are unapproved. Saving a review does not publish it.</div> : mode === "approved" ? <p className={styles.notice}>Browse the mappings currently used in career results. Search by subject, job title, or code. Conditional routes show the extra requirements.</p> : <p className={styles.notice}>No supported route means the saved evidence did not establish a specific training link. It does not mean no career options or poor employment prospects.</p>}
    <div className={styles.controls}>
      <label>Search subjects or jobs<input value={query} onChange={e=>{setQuery(e.target.value);setSelected("");}} placeholder="e.g. nuclear, toxicology, translator"/></label>
      <label>Subject area<select value={area} onChange={e=>{setArea(e.target.value);setSelected("");}}><option value="">All areas</option>{[...new Map(subjects.map(s=>[s.cah1.code,s.cah1])).values()].sort((a,b)=>a.label.localeCompare(b.label)).map(a=><option key={a.code} value={a.code}>{a.label}</option>)}</select></label>
      {mode === "no_direct_route" && <label>Main reason<select value={reasonFilter} onChange={e=>{setReasonFilter(e.target.value);setSelected("");}}><option value="">All reasons (166)</option>{analysis.taxonomy.map(t=><option value={t.code} key={t.code}>{t.label} ({analysis.counts[t.code]})</option>)}</select></label>}
      {mode === "needs_review" && <label>Queue<select value={filter} onChange={e=>{setFilter(e.target.value);setSelected("");}}><option value="pending">Remaining</option><option value="later">Left for later</option><option value="reviewed">Reviewed</option><option value="all">All 43 subjects</option></select></label>}
    </div>
    <div className={ui.feedback} role="status">{message}{undo && <button disabled={saving} onClick={()=>persist({...undo,action:"reset",links:[],note:"",evidenceUrl:""})}>Undo last review</button>}</div>
    <p className={styles.stats}>{rows.length} subjects shown{active ? ` · ${rows.findIndex(s=>s.code===active.code)+1} of ${rows.length}` : ""}</p>
    <div className={styles.workspace}>
      <aside className={styles.sidebar} aria-label="Subjects">{rows.map(s=><button disabled={saving} key={s.code} aria-current={active?.code===s.code ? "true" : undefined} onClick={()=>setSelected(s.code)}><small>{s.code} · {s.cah1.label}</small><strong>{s.term}</strong><small>{mode === "approved" ? `${s.mappings.length} job ${s.mappings.length===1 ? "link" : "links"}` : latest[s.code]?.action === "approve" ? "You approved links · not yet applied" : latest[s.code]?.action === "exclude" ? "You kept excluded" : latest[s.code]?.action === "defer" ? "Left for later" : ""}</small></button>)}</aside>
      {active ? <SubjectDetail key={`${active.code}:${latest[active.code]?.at ?? ''}`} subject={active} jobs={jobs} catalogue={catalogue} saved={latest[active.code]} saving={saving} onSave={persist}/> : <section className={styles.detail}><h2>{mode === "needs_review" && filter === "pending" ? "No subjects remaining in this view" : "No matching subjects"}</h2><p>Change the filters{later ? " or open Left for later" : ""}.</p></section>}
    </div>
  </main>;
}

function SubjectDetail({subject:s, jobs, catalogue, saved, saving, onSave}: {subject:Subject; jobs:Job[]; catalogue:Map<string,Job>; saved?:HumanReview; saving:boolean; onSave:(r:Omit<HumanReview,"at">)=>Promise<void>}) {
  const reviewing = s.status === "needs_review";
  const proposals = [...new Map((s.candidateMappings ?? []).map(m=>[m.onetCode,m])).values()];
  const [links,setLinks] = useState<HumanLink[]>(saved?.links ?? []);
  const [note,setNote] = useState(saved?.note ?? "");
  const [search,setSearch] = useState("");
  const approvalHint = !links.length ? "Select a suggested job, or add an occupation, to save your choices." : "";
  function add(m:Mapping) {setLinks(v=>v.some(l=>l.onetCode===m.onetCode) ? v : [...v,{onetCode:m.onetCode,relation:"unverified",conditions:""}]);}
  function submit(action:HumanReview["action"]) {return onSave({code:s.code,fingerprint:s.fingerprint,action,links:action==="propose" ? links : [],note,evidenceUrl:saved?.evidenceUrl ?? ""});}
  return <section className={styles.detail}>
    <span className={styles.eyebrow}>HECoS {s.code} · {s.cah3.label}</span><h2>{s.term}</h2><p>{s.definition}</p>{s.scopeNote && <p className={ui.muted}>{s.scopeNote}</p>}
    {reviewing && <div className={styles.decisionComparison}>
      <div className={styles.originalProposal}><h3>Current map · unchanged</h3><strong>EXCLUDED</strong><p>No job links appear in career results. The reviewers could not confirm the route.</p></div>
      <div className={styles.savedDecision}><h3>Your saved review</h3><strong>{!saved ? "Not reviewed" : saved.action==="propose" ? `${saved.links.length} job choices · awaiting evidence` : saved.action==="approve" ? `Approve ${saved.links.length} job link(s)` : saved.action==="exclude" ? "Keep excluded" : "Left for later"}</strong>{saved && <><p>{saved.note}</p><small>Saved {new Date(saved.at).toLocaleString("en-GB")} · not applied to results</small></>}</div>
    </div>}
    {s.status !== "approved" && <><h3>Why no route was published</h3><p className={styles.preserve}>{reason(s)}</p></>}
    {s.status === "approved" && <><h3>Approved job links</h3>{s.mappings.map(m=><MappingCard key={m.onetCode} mapping={m} subject={s} job={catalogue.get(m.onetCode)}/>)}</>}
    <details className={ui.evidence}><summary>Course evidence and counts</summary><p>{s.availability.codedCourseRecords} explicitly coded records · {s.availability.titleMatchedRecords} title matches · {s.availability.distinctUnionCourseRecords} distinct records overall.</p><p>{s.availability.caveat} These are course records, not places or vacancies.</p><ul>{s.courseExamples.map((c,i)=><li key={i}><a href={c.url} target="_blank" rel="noreferrer">{c.title} ↗</a></li>)}</ul><details><summary>All saved source links and reviewer reasons</summary>{s.sources.filter(x=>x.url).map(source=><p key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.id} ↗</a>{source.error && " · page could not be fetched"}</p>)}{Object.entries(s.review).map(([pass,r])=><div key={pass}><h4>{pass}</h4><p>{r.availabilityReason}</p><p>{r.noMappingReason}</p><p>{r.resolutionReason}</p></div>)}</details></details>
    {reviewing && <>
      <h3>Suggested jobs to check</h3><p>Just choose the jobs you think fit. I’ll check course evidence, job tasks, and any extra training afterwards. Nothing is selected by default.</p>
      {proposals.length ? proposals.map(m=><div key={m.onetCode}><MappingCard mapping={m} subject={s} job={catalogue.get(m.onetCode)}/><button className={ui.select} disabled={saving || links.some(l=>l.onetCode===m.onetCode)} onClick={()=>add(m)}>{links.some(l=>l.onetCode===m.onetCode) ? "Selected below" : "Select this job"}</button></div>) : <p>No reviewer suggested a supported job. Keep excluded, or search for a specific occupation below.</p>}
      <label className={styles.note}>Add a different O*NET occupation<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search job title or O*NET code"/></label>
      {search.trim().length>=2 && <ul className={ui.searchResults}>{jobs.filter(j=>`${j.title} ${j.code}`.toLowerCase().includes(search.toLowerCase())).slice(0,12).map(j=><li key={j.code}><button disabled={saving || links.some(l=>l.onetCode===j.code)} onClick={()=>{add({onetCode:j.code,relation:"conditional",conditions:""});setSearch("");}}>{j.title} · {j.code}</button></li>)}</ul>}
      <h3>Your proposed map · {links.length} selected</h3>
      {!links.length && <p>No jobs selected. “Keep excluded” leaves the subject without a route.</p>}
      {links.map(l=><div className={ui.linkEditor} key={l.onetCode}><strong>{catalogue.get(l.onetCode)?.title} · {l.onetCode}</strong><p>{catalogue.get(l.onetCode)?.description}</p><details><summary>Occupation tasks{l.conditions ? " and earlier scope note" : ""}</summary>{l.conditions && <p>{l.conditions}</p>}<ul>{catalogue.get(l.onetCode)?.tasks?.slice(0,8).map(t=><li key={t}>{t}</li>)}</ul></details><button onClick={()=>setLinks(v=>v.filter(x=>x.onetCode!==l.onetCode))} disabled={saving}>Remove this job from my selection</button></div>)}
      <details><summary>Add a note (optional)</summary><label className={styles.note}>Anything you want me to check<textarea value={note} onChange={e=>setNote(e.target.value)} maxLength={4000} placeholder="Optional — just selecting the jobs is enough."/></label></details>
      {links.length>2 && <p className={styles.notice}>I’ll check the justification for more than two job links in the evidence pass.</p>}
      <p role="status">{saving ? "Saving your review…" : approvalHint}</p>
      <div className={styles.actions}><button aria-busy={saving} disabled={saving || !!approvalHint} onClick={()=>submit("propose")}>Save {links.length || "selected"} job choice(s) & next</button><button disabled={saving} onClick={()=>submit("exclude")}>Keep excluded & next</button><button disabled={saving} onClick={()=>submit("defer")}>Leave for later & next</button>{saved && <button disabled={saving} onClick={()=>submit("reset")}>Undo this review</button>}</div>
      <p className={ui.muted}>These are review decisions, not verified new evidence. Applying them to career results is a separate step.</p>
    </>}
  </section>;
}

function MappingCard({mapping:m,subject:s,job}: {mapping:Mapping;subject:Subject;job?:Job}) {
  return <article className={ui.mapping}><span className={styles.tag}>{m.relation === "direct" ? "Direct subject route" : "Conditional route"}</span><h4>{job?.title ?? m.onetCode}</h4><small>{m.onetCode}{m.source ? ` · suggested by ${m.source} review` : ""}</small><p>{m.rationale}</p>{(m.conditions || m.qualificationCaveat) && <p className={styles.notice}>{m.conditions || m.qualificationCaveat}</p>}<details><summary>Why this link? Evidence and tasks</summary>{m.evidence?.map((e,i)=><blockquote key={i}><p>“{e.quote}”</p>{s.sources.find(x=>x.id===e.sourceId)?.url && <a target="_blank" rel="noreferrer" href={s.sources.find(x=>x.id===e.sourceId)!.url}>Source ↗</a>}</blockquote>)}<ul>{m.onetTasks?.map(t=><li key={t}>{t}</li>)}</ul></details></article>;
}
