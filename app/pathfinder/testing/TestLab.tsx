'use client';
import { useState } from 'react';
import Link from 'next/link';
import Pathfinder from '../Pathfinder';
import fixtures from './profiles-b.json';
import type { TestProfile } from './types';
import s from '../pathfinder.module.css';
// The audit runner validates these generated JSON fixtures before they are used.
const profiles=fixtures as unknown as TestProfile[];
const choices=['P28','P38','P45'].map(id=>{const profile=profiles.find(p=>p.id===id);if(!profile)throw new Error(`Missing test profile ${id}`);return profile;});
const labels=['Practical & hands-on','Creative & musical','Science & environment'];
export default function TestLab(){
 const [selected,setSelected]=useState(choices[0]);
 const [revision,setRevision]=useState(0);
 return <div className={s.testLab} data-pathfinder><section className={s.testPanel} aria-label="Synthetic profile testing"><div className={s.testHeading}><div><span className={s.eyebrow}>Local testing · fictional people</span><h1>Try three different futures.</h1></div><Link href="/pathfinder">Back to the quiz ↗</Link></div><p>Open a complete profile and explore its options. Test changes stay here; your saved quiz is untouched.</p><div className={s.testChoices}>{choices.map((p,i)=><button key={p.id} aria-pressed={p.id===selected.id} className={p.id===selected.id?s.selected:''} onClick={()=>{setSelected(p);setRevision(n=>n+1);}}><small>{labels[i]}</small><strong>{p.name}, {p.age}</strong><span>{p.summary}</span><em>{p.id===selected.id?'Reload this profile ↻':'Open profile ↗'}</em></button>)}</div><details className={s.testInputs}><summary>What’s in {selected.name.split(' ')[0]}’s profile?</summary><p>Study plan: {selected.profile.educationPlan}. {selected.expected.notes}</p><p>Expected areas to explore: {selected.expected.goodFits.join(', ')}.</p><p>Areas that may fit less well: {selected.expected.poorFits.join(', ')}.</p><p>These are test hypotheses, not predetermined answers. The recommendations below use the same code and data as the student quiz.</p></details></section><Pathfinder key={`${selected.id}-${revision}`} testProfile={selected}/></div>;
}
