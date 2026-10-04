"use client";
import {useState} from "react";
import {FAMILIAR_JOBS, reverseSummary, type ReverseJob} from "./reverse-model";
import styles from "./viewer.module.css";
import ui from "./reverse.module.css";

export default function ReverseViewer({jobs}: {jobs:ReverseJob[]}) {
  const [view,setView]=useState("familiar");
  const [search,setSearch]=useState("");
  const [code,setCode]=useState("");
  const [sort,setSort]=useState("links");
  const [conditionalOnly,setConditionalOnly]=useState(false);
  const summary=reverseSummary(jobs);
  const flagged=jobs.filter(j=>j.flags.some(f=>!f.resolved)).length;
  const resolved=jobs.filter(j=>j.flags.some(f=>f.resolved)).length;
  const rows=jobs.filter(j=>view==="familiar"?FAMILIAR_JOBS.has(j.code):view==="flags"?j.flags.some(f=>!f.resolved):view==="resolved"?j.flags.some(f=>f.resolved):view==="linked"?j.degrees.length:view==="missing"?!j.degrees.length:true)
    .filter(j=>!conditionalOnly || (j.degrees.length>0 && j.degrees.every(d=>d.mapping.relation==="conditional")))
    .filter(j=>`${j.title} ${j.code} ${j.ukGroup ?? ""} ${j.degrees.map(d=>d.term).join(" ")}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b)=>sort==="name"?a.title.localeCompare(b.title):sort==="areas"?new Set(b.degrees.map(d=>d.area)).size-new Set(a.degrees.map(d=>d.area)).size || b.degrees.length-a.degrees.length:b.degrees.length-a.degrees.length || a.title.localeCompare(b.title));
  const active=rows.find(j=>j.code===code) ?? rows[0];
  const index=active?rows.findIndex(j=>j.code===active.code):-1;
  function changeView(next:string) {setView(next);setCode("");setSearch("");setConditionalOnly(false);}
  return <main className={styles.page}>
    <p className={styles.eyebrow}>REVERSE CHECK · 1+ COURSE FAMILIES · READ ONLY</p>
    <h1>Jobs → degree subjects</h1>
    <p>Scan familiar jobs, then inspect the short list of possible outliers. These are degree subjects, not individual university courses.</p>
    <div className={ui.stats}><div><strong>{summary.subjects}</strong>approved subjects</div><div><strong>{summary.links}</strong>subject–job links</div><div><strong>{summary.linkedJobs}</strong>jobs with degree links</div><div><strong>{summary.median}</strong>median subjects per linked job</div></div>
    <div className={ui.overview}><section><h2>How broad are the maps?</h2>{summary.distribution.map(d=><div className={ui.bar} key={d.label}><span>{d.label} subjects</span><meter min={0} max={summary.linkedJobs} value={d.count}/><strong>{d.count} jobs</strong></div>)}</section><section><h2>Scope of the links</h2><p><strong>{summary.direct}</strong> direct · <strong>{summary.conditional}</strong> conditional<br/>Widest job: <strong>{summary.max}</strong> subjects.</p><p>Unlinked jobs are not automatically errors: many use apprenticeships or experience. Your newly selected links remain separate until evidence checking is complete.</p></section></div>
    <div className={styles.actions} aria-label="Reverse review views">{[["familiar","20 familiar jobs"],["flags",`${flagged} open spot-checks`],["resolved",`${resolved} resolved checks`],["linked",`${summary.linkedJobs} linked jobs`],["missing","No approved degree link"],["all","All jobs"]].map(([key,label])=><button key={key} aria-pressed={view===key} onClick={()=>changeView(key)}>{label}</button>)}</div>
    <p className={styles.notice}>{view==="familiar"?"A curated sample of familiar occupations, not a ranking by UK employment. Start here for a quick sense of whether the routes look sensible.":view==="flags"?"A short, evidence-based inspection list. Flags are questions to check, not confirmed mapping errors. No new review queue or automatic changes.":"Search by job title, degree subject, or O*NET code. The broadest maps appear first by default."}</p>
    <div className={styles.controls}><label>Search jobs or linked subjects<input value={search} onChange={e=>{setSearch(e.target.value);setCode("");}} placeholder="e.g. nurse, engineer, glass"/></label><label>Order<select value={sort} onChange={e=>setSort(e.target.value)}><option value="links">Most degree subjects first</option><option value="areas">Widest subject-area spread</option><option value="name">Job title A–Z</option></select></label><label className={styles.check}><input type="checkbox" checked={conditionalOnly} onChange={e=>setConditionalOnly(e.target.checked)}/>Only jobs with conditional routes only</label></div>
    <p>{rows.length} jobs shown{active?` · ${index+1} of ${rows.length}`:""}</p>
    <div className={styles.workspace}><aside className={styles.sidebar} aria-label="Jobs">{rows.map(j=><button key={j.code} aria-current={active?.code===j.code?"true":undefined} onClick={()=>setCode(j.code)}><strong>{j.title}</strong><small>{j.degrees.length} degree subjects · {j.apprenticeships} apprenticeship standards{j.flags.some(f=>!f.resolved)?" · check":j.flags.length?" · resolved":""}</small></button>)}</aside>
      {active?<section className={styles.detail} key={active.code}>
        <div className={styles.actions}><button disabled={index===0} onClick={()=>setCode(rows[index-1].code)}>← Previous job</button><button disabled={index===rows.length-1} onClick={()=>setCode(rows[index+1].code)}>Next job →</button></div>
        <p className={styles.eyebrow}>{active.code}</p><h2>{active.title}</h2><p>{active.description}</p>
        {active.flags.map((f,i)=><div className={styles.notice} key={i}><strong>{f.resolved?"Resolved check":f.severity==="gap"?"Coverage question":"Scope check"}</strong><p>{f.reason}</p></div>)}
        <details className={ui.context}><summary>Job tasks and UK demand context</summary><ul>{active.tasks?.slice(0,8).map(t=><li key={t}>{t}</li>)}</ul><p>{active.openings===null?"No UK openings estimate available.":`${active.openings.toLocaleString("en-GB")} projected annual openings in 2031 for the UK group: ${active.ukGroup ?? active.soc4}.`}</p><p>This is a shared SOC-group estimate, not a count for this exact job or for new graduates. Do not add it across sibling O*NET jobs.</p></details>
        <h3>Approved degree subjects ({active.degrees.length})</h3>
        {!active.degrees.length && <p>No approved subject link. {active.apprenticeships?`${active.apprenticeships} apprenticeship standards are linked.`:"No linked apprenticeship standard in this dataset either."} This may reflect the normal entry route or a mapping gap.</p>}
        {active.degrees.map(d=><article key={d.code} className={ui.degree} data-flagged={active.flags.some(f=>f.subjectCodes.includes(d.code))}><div className={ui.degreeTitle}><h4>{d.term}</h4><span>{d.mapping.relation==="direct"?"Direct":"Conditional"}</span></div><small>{d.code} · {d.area} · {d.families ?? "Unknown"} estimated course families</small>{(d.mapping.conditions || d.mapping.qualificationCaveat)&&<p className={styles.notice}>{d.mapping.conditions || d.mapping.qualificationCaveat}</p>}<details><summary>Evidence for this subject → job link</summary><p>{d.mapping.rationale}</p><p>{d.definition}</p>{d.mapping.evidence?.map((e,i)=><blockquote key={i}><p>“{e.quote}”</p>{d.sources.find(s=>s.id===e.sourceId)?.url&&<a href={d.sources.find(s=>s.id===e.sourceId)!.url} target="_blank" rel="noreferrer">Official source ↗</a>}</blockquote>)}<ul>{d.mapping.onetTasks?.map(t=><li key={t}>{t}</li>)}</ul></details></article>)}
        {!!active.pending.length&&<div className={styles.originalProposal}><h3>Your selected subjects · awaiting evidence</h3><ul>{active.pending.map(s=><li key={s.code}>{s.term} · {s.code}</li>)}</ul><p>Not included in the approved link counts above.</p></div>}
      </section>:<section className={styles.detail}><h2>No matching jobs</h2><p>Try All jobs or clear the filters.</p></section>}
    </div>
  </main>;
}
