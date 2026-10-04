'use client';
import { useEffect, useState } from 'react';
import type { Job } from '../assessment/model';
import s from './pathfinder.module.css';
import StudyChoices from './StudyChoices';
type Measure={subject:string|null;aggregation:string;population:number|null;years:string;responseRate:number|null;median?:number;workStudy?:number};
type Course={id:string;title:string;provider:string;source:string;discoverUni:string;salary:Measure|null;salary5:Measure|null;employment:Measure|null};
type Dataset={subject:string;snapshot:string;courses:Course[];exactCourseIds?:string[]};
function scope(m:Measure){return `${m.aggregation?.endsWith('4')?'Course group':`Wider subject group`} · ${m.years||'years unavailable'} · ${m.population==null?'group size unavailable':`${m.population} graduates`}${m.responseRate==null?'':` · ${m.responseRate}% response rate`}`;}
export default function CourseEvidence({unit}:{unit:Job}){
 const [loaded,setLoaded]=useState<{id:string;data:Dataset|null}|null>(null),[query,setQuery]=useState(''),[limit,setLimit]=useState(6),[wider,setWider]=useState(false);
 const code=unit.cah3?.code;
 useEffect(()=>{let live=true;if(code)Promise.all([fetch(`/exploration/degrees/${code.replace(/^CAH/,'')}.json`).then(r=>{if(!r.ok)throw Error();return r.json();}),fetch('/pathfinder-study-options.json').then(r=>{if(!r.ok)throw Error();return r.json();})]).then(([data,study])=>{if(live)setLoaded({id:unit.id,data:{...data,exactCourseIds:study.subjects[unit.id]?.codedCourseIds??[]}});}).catch(()=>{if(live)setLoaded({id:unit.id,data:null});});return()=>{live=false;};},[code,unit.id]);
 const data=loaded?.id===unit.id?loaded.data:null;
 if(!code||loaded?.id===unit.id&&!data)return <div className={s.prose}><StudyChoices id={unit.id}/><h3>Courses</h3><p>We don’t have course details for this subject yet.</p><a href="https://discoveruni.gov.uk/" target="_blank" rel="noreferrer">Explore Discover Uni ↗</a></div>;
 if(!data)return <div className={s.prose}><StudyChoices id={unit.id}/><p>Loading courses…</p></div>;
 const terms=unit.label.toLowerCase().split(/[^a-z]+/).filter(t=>t.length>2&&!['and','the','with','studies'].includes(t)).map(t=>t.replace(/s$/,''));
 const exactIds=new Set(data.exactCourseIds??[]);
 const relevance=(c:Course)=>c.title.trim().toLowerCase().replace(/^['"]|['"]$/g,'')===unit.label.toLowerCase()?100:terms.filter(t=>c.title.toLowerCase().includes(t)).length;
 const uniqueByTitle=new Map<string,Course>();
 for(const c of data.courses){const key=`${c.provider.toLowerCase()}|${c.title.toLowerCase()}`,previous=uniqueByTitle.get(key);if(!previous||exactIds.has(c.id)&&!exactIds.has(previous.id))uniqueByTitle.set(key,c);}
 const unique=[...uniqueByTitle.values()];
 const ordered=unique.filter(c=>`${c.title} ${c.provider}`.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>Number(exactIds.has(b.id))-Number(exactIds.has(a.id))||relevance(b)-relevance(a)||Number(!!b.employment)+Number(!!b.salary)-Number(!!a.employment)-Number(!!a.salary)||a.title.localeCompare(b.title)||a.provider.localeCompare(b.provider));
 const exact=ordered.filter(c=>exactIds.has(c.id));
 const close=exact.length?exact:ordered.filter(c=>relevance(c)>0);
 const candidates=!query.trim()&&!wider&&close.length?close:ordered;
 const seen=new Set<string>(),first:Course[]=[],rest:Course[]=[];
 for(const course of candidates){if(first.length<6&&!seen.has(course.provider)){first.push(course);seen.add(course.provider);}else rest.push(course);}
 const courses=[...first,...rest];
 return <div className={s.prose}><StudyChoices id={unit.id}/><h3>Courses to explore</h3><p className={s.questionHint}>{!wider&&exact.length?'Courses recorded under this subject, including joint degrees.':'Related course examples. Check that they cover the subject you want.'}</p><label className={s.courseSearch}>Find a course or university<input value={query} onChange={e=>{setQuery(e.target.value);setLimit(6);}} placeholder="Course or university…"/></label>{!courses.length&&<p>No courses found. Try another subject or university.</p>}{courses.slice(0,limit).map(c=><details key={c.id} className={s.courseRecord}><summary><strong>{c.title}</strong><span>{c.provider}</span></summary><div>{[[c.salary,'Earnings 15 months after graduation'],[c.salary5,'Earnings 5 years after graduation'],[c.employment,'Working or studying after 15 months']].map(([raw,label])=>{const m=raw as Measure|null;return <div className={s.courseMeasure} key={String(label)}><span>{String(label)}</span><strong>{m?.median!=null?`£${m.median.toLocaleString('en-GB')}`:m?.workStudy!=null?`${m.workStudy}%`:'Not published'}</strong>{m&&<details><summary>About this figure</summary><small>{scope(m)}</small></details>}</div>;})}<p className={s.questionHint}>These outcomes describe earlier graduates, sometimes across a wider subject group. They do not predict your earnings or compare like-for-like cohorts.</p><a href={c.discoverUni} target="_blank" rel="noreferrer">More course details ↗</a>{/^https?:\/\//.test(c.source)&&<p><a href={c.source} target="_blank" rel="noreferrer">Check course content and entry requirements ↗</a></p>}</div></details>)}{courses.length>limit&&<button className={s.secondary} onClick={()=>setLimit(n=>n+6)}>Show more courses</button>}{!query.trim()&&!wider&&close.length>0&&close.length<ordered.length&&<button className={s.textButton} onClick={()=>{setWider(true);setLimit(6);}}>Explore related subjects ↗</button>}<p className={s.questionHint}>Course data: <a href="https://www.hesa.ac.uk/support/tools-and-downloads/unistats" target="_blank" rel="noreferrer">Discover Uni dataset</a>, adapted for this view under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>. Updated {data.snapshot}. Check the university for current entry requirements. These figures may cover a wider subject group; they are not a course quality ranking.</p></div>;
}
