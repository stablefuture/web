import { readFileSync,writeFileSync,mkdirSync } from 'node:fs';
import { resolve,dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { initialProfile,STAGES,EDUCATION_PLANS,interests,similarity } from '../app/assessment/model.ts';
import { SKILLS,PREFERENCES,journeyComplete,preferenceFit } from '../app/pathfinder/journey.ts';
import { recommendationRows,recommendationCards } from '../app/pathfinder/recommendations.mjs';
import { makeLinks,risk,stats } from '../app/pathfinder/logic.ts';
const web=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>JSON.parse(readFileSync(resolve(web,p),'utf8'));
const profiles=['a','b'].flatMap(s=>read(`app/pathfinder/testing/profiles-${s}.json`));
const relations=read('public/pathfinder-route-evidence.json').relations;
const units=read('public/assessment-careers.json').units.map(u=>({...u,routeRelations:relations[u.id]}));
const data=read('public/assessment-direct-interests.json');
const evidence=read('public/pathfinder-profile-evidence.json');
const byId=new Map(units.map(u=>[u.id,u]));
const links=makeLinks(units),jobs=units.filter(u=>u.path==='jobs');
assert.equal(profiles.length,50);assert.equal(new Set(profiles.map(p=>p.id)).size,50);
function validate(p){
 const message=p.id;assert.equal(p.profile.answers.length,60,message);assert(p.profile.answers.every(v=>Number.isInteger(v)&&v>=1&&v<=5),message);
 assert(STAGES.includes(p.profile.stage),message);assert(p.profile.educationPlan in EDUCATION_PLANS,message);
 assert.equal(Object.keys(p.profile.specificInterests).length,data.areas.length,message);
 for(const a of data.areas)assert(['pursue','avoid'].includes(p.profile.specificInterests[a.id]),`${message} ${a.id}`);
 for(const [id,n] of Object.entries(p.journey.points)){assert(data.areas.some(a=>a.id===id)&&p.profile.specificInterests[id]==='pursue',message);assert(Number.isInteger(n)&&n>=0&&n<=10,message);}
 assert.equal(Object.values(p.journey.points).reduce((a,b)=>a+b,0),data.areas.some(a=>p.profile.specificInterests[a.id]==='pursue')?10:0,message);
 for(const s of SKILLS)assert(Number.isInteger(p.journey.confidence[s.id])&&p.journey.confidence[s.id]>=0&&p.journey.confidence[s.id]<=5,`${message} confidence`);
 for(const s of PREFERENCES)assert(Number.isInteger(p.journey.preferences[s.id])&&p.journey.preferences[s.id]>=1&&p.journey.preferences[s.id]<=5,`${message} preferences`);
 assert(p.profile.targetIds.every(id=>byId.has(id)),`${message} target`);assert(journeyComplete(p.journey,p.profile,data.areas),message);
}
profiles.forEach(validate);
const results=profiles.map(test=>{
 const p={...initialProfile,...test.profile};const rows=recommendationRows(units,data,p,test.journey,evidence),rowById=new Map(rows.map(r=>[r.job.id,r]));
 const vector=interests(p.answers);const flat=Math.max(...vector)-Math.min(...vector)<6;
 function info(unit){
   const destinations=unit.path==='jobs'?[unit]:links.get(unit.id)??[];
   const best=destinations.map(j=>rowById.get(j.id)).filter(Boolean).sort((a,b)=>rows.indexOf(a)-rows.indexOf(b))[0];
   const match=destinations.flatMap(j=>data.profiles[j.id]?[Math.round(similarity(vector,data.profiles[j.id].interests)*100)]:[]);
   const row=rowById.get(unit.id),st=stats(unit,links);
   return {id:unit.id,label:unit.label,originalChoice:p.targetIds.includes(unit.id),interestMatch:!flat&&match.length?Math.max(...match):null,rankScore:row?.score??null,scoreParts:row?{riasec:row.riasecFit*60,specific:row.weightedSpecificFit*40,openings:0,avoidPenalty:row.avoidPenalty,conflictPenalty:row.conflictPenalty,education:row.zoneBonus,preferences:row.preferenceModifier}:null,jobZone:data.profiles[unit.id]?.jobZone??null,ranked:!!row,risk:unit.path==='jobs'?risk(unit):st.risk,salary:unit.salary,openings:unit.openings,conflicts:unit.path==='jobs'?preferenceFit(unit,test.journey,evidence,jobs).notes:[],missingWorkEvidence:unit.path==='jobs'?PREFERENCES.filter(pref=>!['pay','openings','ai'].includes(pref.id)&&test.journey.preferences[pref.id]!==3&&evidence.careers[unit.id]?.work[pref.id]==null).map(p=>p.id):[],bestRankedDestination:best?{id:best.job.id,label:best.job.label,rank:rows.indexOf(best)+1}:null,linkedDestinations:destinations.length,level:unit.level??null};
 }
 const cards=Object.fromEntries(['jobs','degrees','apprenticeships'].map(path=>[path,recommendationCards(units,rows,links,p.targetIds,path).slice(0,10).map(info)]));
 const allJobCards=recommendationCards(units,rows,links,p.targetIds,'jobs');
 return {...test,riasecSums:vector,flatInterestProfile:flat,rankingEligibleCount:rows.length,displayedCareerCount:allJobCards.length,unrankedCareersStillDisplayed:allJobCards.filter(j=>!rowById.has(j.id)).length,top:cards,top30CareerIds:allJobCards.slice(0,30).map(j=>j.id)};
});
const careerTop=results.flatMap(p=>p.top.jobs), routeTop=results.flatMap(p=>[...p.top.degrees,...p.top.apprenticeships]);
const counts={};for(const c of careerTop)counts[c.label]=(counts[c.label]??0)+1;
const summary={profiles:results.length,topCareerSlots:careerTop.length,uniqueTop10Careers:new Set(careerTop.map(c=>c.id)).size,profilesWithTop10PreferenceConflict:results.filter(p=>p.top.jobs.some(c=>c.conflicts.length)).length,top10CareerSlotsWithPreferenceConflict:careerTop.filter(c=>c.conflicts.length).length,top10CareerSlotsMissingRisk:careerTop.filter(c=>c.risk==null).length,top10CareerSlotsMissingSalary:careerTop.filter(c=>c.salary==null).length,top10CareerSlotsMissingOpenings:careerTop.filter(c=>c.openings==null).length,top10RoutesWithNoRankedDestination:routeTop.filter(c=>!c.bestRankedDestination).length,mostFrequentTop10:Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,20)};
const out=resolve(web,process.env.PATHFINDER_AUDIT_OUT??'../docs/research/pathfinder-profile-audit');mkdirSync(out,{recursive:true});
writeFileSync(resolve(out,'results.json'),JSON.stringify({meta:{date:'2026-09-27',generator:'Two gpt-6-luna agents, high reasoning',fixturesSha256:createHash('sha256').update(JSON.stringify(profiles)).digest('hex'),method:'Synthetic diagnostic cases, not representative users or validated effectiveness. Exact displayed ordering from shared recommendations.mjs; ranking as implemented at the time of this run.',topN:10},summary,results},null,2)+'\n');
let md='# Pathfinder: 50 synthetic profiles — raw results\n\nThese are diagnostic fictional cases, not user research. Full answers, score components, source gaps, and route destinations are in `results.json`.\n\n';
for(const r of results){md+=`## ${r.id} — ${r.name}, ${r.age}\n\n${r.summary}\n\nStudy plan: ${r.profile.educationPlan}. Expected families: ${r.expected.goodFits.join('; ')}. Avoided families: ${r.expected.poorFits.join('; ')}. ${r.expected.notes}\n\n`;
 for(const [path,cards]of Object.entries(r.top)){md+=`### ${path}\n\n| Rank | Option | Interest /100 | Flags / best destination |\n|---|---|---|---|\n`;cards.forEach((c,i)=>{md+=`| ${i+1} | ${c.label.replaceAll('|','/')} | ${c.interestMatch??'unknown'} | ${[c.originalChoice?'Original choice':'',...c.conflicts,c.risk==null?'AI risk missing':'',path!=='jobs'?(c.bestRankedDestination?.label??'No ranked destination'):''].filter(Boolean).join('; ')} |\n`;});md+='\n';}
}
writeFileSync(resolve(out,'raw-results.md'),md);console.log(JSON.stringify(summary,null,2));
