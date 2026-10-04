'use client';
import { useEffect, useState } from 'react';
import s from './pathfinder.module.css';

type Group = {oneOf:string[];minGrade?:string};
type Course = {id:string;provider:string;course:string;entryYear:number;sourceUrl:string;offerGrades:string[];requiredGroups:Group[];alternativeRoutes?:{routeType?:string;requiredGroups:Group[]}[];notes?:string;evidenceSummary:string;subjectRequirementStatus?:string};
type Subject = {admissions:{requiredBySomeCourses:string[];requiredSubjectEvidence:Record<string,string[]>;courseIds:string[];alternativeSubjectGroups:{oneOf:string[];courseId:string;routeIndex:number}[];routeSpecificRequiredSubjectEvidence:Record<string,{courseId:string;routeIndex:number}[]>}};
type StudyData = {subjects:Record<string,Subject>;courses:Record<string,Course>};
const label=(value:string)=>value==='mathematics'?'Maths':value==='further mathematics'?'Further Maths':value.charAt(0).toUpperCase()+value.slice(1);
const subjects=(groups:Group[])=>groups.map(g=>`${g.oneOf.map(label).join(' or ')}${g.minGrade?` at ${g.minGrade}`:''}`).join('; plus ');

export default function StudyChoices({id}:{id:string}) {
 const [data,setData]=useState<StudyData|null>(null),[failed,setFailed]=useState(false);
 useEffect(()=>{let live=true;fetch('/pathfinder-study-options.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(d=>{if(live)setData(d);}).catch(()=>{if(live)setFailed(true);});return()=>{live=false;};},[]);
 const subject=data?.subjects[id]?.admissions;
 if(!data&&!failed)return <p className={s.questionHint}>Loading A-level choices…</p>;
 if(failed)return <section className={s.studyChoices}><h3>A-level choices</h3><p className={s.questionHint}>The requirements couldn’t load. Please try again, or check the university’s course page.</p></section>;
 if(!subject?.courseIds.length)return <section className={s.studyChoices}><h3>A-level choices</h3><p className={s.questionHint}>We haven’t checked the subject requirements here yet. Check the courses you’re considering before choosing your A-levels.</p></section>;
 const required=subject.requiredBySomeCourses;
 const examples=subject.courseIds.flatMap(key=>data?.courses[key]?[data.courses[key]]:[]);
 const alternatives=[...new Map(subject.alternativeSubjectGroups.map(g=>[[...g.oneOf].sort().join('|'),g])).values()];
 const routeSpecific=Object.keys(subject.routeSpecificRequiredSubjectEvidence);
 return <section className={s.studyChoices} aria-label="A-level choices">
  <h3>A-level choices</h3>
  {required.length>0?<><p className={s.studyLabel}>Required by some courses</p><ul className={s.studySubjects}>{required.map(name=><li key={name}>{label(name)}</li>)}</ul></>:<p className={s.questionHint}>Check each course’s subject choices below.</p>}
  {(alternatives.length>0||routeSpecific.length>0)&&<details className={s.sourceNotes}><summary>Alternative subject choices</summary>{alternatives.map(g=><p key={[...g.oneOf].sort().join('|')}>{g.oneOf.map(label).join(' or ')}</p>)}{routeSpecific.length>0&&<p>Some entry routes also require {routeSpecific.map(label).join(', ')}.</p>}<p className={s.questionHint}>These are choices from different courses. Check the combinations below.</p></details>}
  <details className={s.sourceNotes}><summary>Check {examples.length} course {examples.length===1?'example':'examples'}</summary>{examples.map(c=><div className={s.studyCourse} key={c.id}><strong>{c.course}</strong><span>{c.provider} · {c.entryYear} entry</span><p><strong>{c.offerGrades.join('')}</strong>{c.requiredGroups.length?` · including ${subjects(c.requiredGroups)}`:c.subjectRequirementStatus==='explicit_none'?' · No specific A-level subjects required.':' · Check subject choices with the university.'}</p>{c.notes&&<p className={s.questionHint}>{c.notes}</p>}<a href={c.sourceUrl} target="_blank" rel="noreferrer">Check all entry requirements ↗</a></div>)}</details>
  <p className={s.questionHint}>Requirements vary by university. These examples are a starting point, not a full list or an entry guarantee.</p>
 </section>;
}
