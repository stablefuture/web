import type { InterestData, Job, Profile } from '../assessment/model';

export const SKILLS = [
  {id:'2.A.1.a',label:'Understanding information',scenario:'Read a page of instructions and pick out the key points.'},
  {id:'2.A.1.b',label:'Listening',scenario:'Listen to someone explain a problem and check you understand.'},
  {id:'2.A.1.c',label:'Writing',scenario:'Write a clear message explaining an idea.'},
  {id:'2.A.1.d',label:'Speaking',scenario:'Explain an idea to a small group.'},
  {id:'2.A.1.e',label:'Working with numbers',scenario:'Use numbers to compare two options.'},
  {id:'2.A.2.a',label:'Thinking critically',scenario:'Compare two claims and decide which has better evidence.'},
  {id:'2.B.1.a',label:'Understanding people',scenario:'Notice how someone is feeling and respond thoughtfully.'},
  {id:'2.B.2.i',label:'Solving problems',scenario:'Break a tricky problem into smaller steps.'},
] as const;
export const PREFERENCES = [
  {id:'outdoors',label:'Working outdoors',source:'4.C.2.a.1.c'},
  {id:'team',label:'Working in a team',source:'4.C.1.b.1.e'},
  {id:'people',label:'Frequent contact with people',source:'4.C.1.a.4'},
  {id:'autonomy',label:'Freedom to make decisions',source:'4.C.3.a.4'},
  {id:'pressure',label:'Working to tight deadlines',source:'4.C.3.d.1'},
  {id:'helping',label:'Helping and caring for others',source:'4.A.4.a.5'},
  {id:'improving',label:'Improving how things work',source:'2.B.4.g + 2.B.4.h'},
  {id:'pay',label:'Higher pay',source:'UK SOC4 pay'},
  {id:'openings',label:'More job openings',source:'UK SOC4 openings'},
  {id:'ai',label:'Lower AI risk',source:'Current AI risk'},
] as const;
export const CONFIDENCE = ['Not at all','A little','Somewhat','Quite','Very confident'];
export const PREFERENCE_LABELS = ['Must have','Prefer','Flexible','Avoid','Must avoid'];
export type Journey = {points:Record<string,number>; confidence:Record<string,number>; preferences:Record<string,number>};
export type Evidence = {meta:{version:string}; careers:Record<string,{skills:Record<string,number>; work:Record<string,number>}>};
export const emptyJourney = ():Journey=>({points:{},confidence:{},preferences:{}});
export function stages(areaCount:number){const allocation=61+areaCount,skills=allocation+1,preferences=skills+SKILLS.length,education=preferences+PREFERENCES.length;return {allocation,skills,preferences,education};}
export function section(step:number,areaCount:number){const s=stages(areaCount);return step===0?'start':step<=60?'activities':step<s.skills?'interests':step<s.preferences?'skills':step<s.education?'preferences':'education';}
export function allocationValid(j:Journey,p:Profile,areas:InterestData['areas']){const selected=areas.filter(a=>p.specificInterests[a.id]==='pursue');return selected.length===0||selected.reduce((n,a)=>n+(j.points[a.id]??0),0)===10;}
export function journeyComplete(j:Journey,p:Profile,areas:InterestData['areas']){return areas.every(a=>['pursue','avoid'].includes(p.specificInterests[a.id]))&&allocationValid(j,p,areas)&&SKILLS.every(s=>j.confidence[s.id]!==undefined)&&PREFERENCES.every(v=>j.preferences[v.id]!==undefined);}
export function readJourney(raw:unknown,areas:InterestData['areas'],p:Profile):Journey {
  const result=emptyJourney(); if(!raw||typeof raw!=='object')return result;
  const v=raw as Partial<Journey>;
  for(const a of areas){const n=v.points?.[a.id];if(p.specificInterests[a.id]==='pursue'&&Number.isInteger(n)&&n!>=0&&n!<=10)result.points[a.id]=n!;}
  if(Object.values(result.points).reduce((a,b)=>a+b,0)>10)result.points={};
  for(const s of SKILLS){const n=v.confidence?.[s.id];if(Number.isInteger(n)&&n!>=0&&n!<=5)result.confidence[s.id]=n!;}
  for(const s of PREFERENCES){const n=v.preferences?.[s.id];if(Number.isInteger(n)&&n!>=1&&n!<=5)result.preferences[s.id]=n!;}
  return result;
}
export function workValue(job:Job,id:string,e:Evidence|null,jobs:Job[]):number|null {
  if(id==='ai')return job.exposure==null||job.substitution==null?null:1-Math.sqrt(job.exposure*job.substitution)/100;
  if(id==='pay'||id==='openings'){const field=id==='pay'?'salary':'openings',value=job[field];if(value==null)return null;const known=[...new Map(jobs.filter(j=>j[field]!=null).map(j=>[j.soc4??j.id,j[field]!])).values()];return known.length?known.filter(n=>n<=value).length/known.length:null;}
  return e?.careers[job.id]?.work[id]??null;
}
export function preferenceFit(job:Job,j:Journey,e:Evidence|null,jobs:Job[]){
  let sum=0,count=0; const notes:string[]=[];
  for(const p of PREFERENCES){const answer=j.preferences[p.id];if(!answer||answer===3)continue;const v=workValue(job,p.id,e,jobs);if(v===null)continue;sum+=(3-answer)*(v-.5)*2;count++;
    if((answer===1&&v<.35)||(answer===5&&v>.65))notes.push(`${p.label}: may conflict with your ${answer===1?'must have':'must avoid'}.`);
  }
  return {modifier:count?sum/count*5:0,notes};
}
export function weightedInterest(j:Journey,p:Profile,data:InterestData,job:Job){
 const values=data.profiles[job.id]?.specific;let sum=0,total=0;
 data.areas.forEach((a,i)=>{const n=p.specificInterests[a.id]==='pursue'?(j.points[a.id]??0):0;if(n){total+=n;if(values?.[i]!=null)sum+=n*values[i]!/100;}});
 return total?sum/total:0;
}
