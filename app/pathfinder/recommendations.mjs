import { rankJobs } from '../assessment/model.ts';
import { weightedInterest, preferenceFit } from './journey.ts';
import { risk, searchRank } from './logic.ts';
import { routeTitle } from '../assessment/presentation.ts';

/** The same pipeline powers the student view and the offline synthetic audit.
 * @param {import('../assessment/model').Job[]} units
 * @param {import('../assessment/model').InterestData} data
 * @param {import('../assessment/model').Profile} profile
 * @param {import('./journey').Journey} journey
 * @param {import('./journey').Evidence|null} evidence
 */
export function recommendationRows(units, data, profile, journey, evidence) {
  const jobs = units.filter(u => u.path === 'jobs');
  return rankJobs(jobs, data, {...profile, specificInterests: {}}, units)
    .map(row => {
      const priorities = weightedInterest(journey, profile, data, row.job);
      const preferences = preferenceFit(row.job, journey, evidence, jobs);
      const avoidPenalty=Object.values(journey.points).some(n=>n>0)?Math.max(0,...data.areas.map((a,i)=>profile.specificInterests[a.id]==='avoid'?(data.profiles[row.job.id]?.specific?.[i]??0)/100*10:0)):0;
      return {...row,avoidPenalty,conflictPenalty:5*preferences.notes.length, weightedSpecificFit: priorities, preferenceModifier: preferences.modifier,
        preferenceConflicts: preferences.notes,
        score: row.riasecFit * 60 + 40 * priorities + row.zoneBonus + preferences.modifier - 5 * preferences.notes.length - avoidPenalty};
    })
    .sort((a,b) => Number(b.target)-Number(a.target) || b.score-a.score);
}
/** Order cards by recommendations, retaining original choices and search relevance.
 * @param {import('../assessment/model').Job[]} units
 * @param {ReturnType<typeof recommendationRows>} rows
 * @param {Map<string,import('../assessment/model').Job[]>} links
 * @param {string[]} targetIds
 * @param {string} path
 * @param {string} query
 * @param {boolean} complete
 */
export function recommendationCards(units, rows, links, targetIds, path, query='', complete=true) {
  const ranks=new Map(rows.map((row,i)=>[row.job.id,i]));
  const scores=new Map(rows.map(row=>[row.job.id,row.score]));
  const rank=unit=>unit.path==='jobs'?(ranks.get(unit.id)??10000):routeRank(unit);
  function routeRank(unit) {
    const related=(links.get(unit.id)??[]).filter(j=>scores.has(j.id));
    if(!related.length)return 10000;
    let sum=0,total=0;
    for(const j of related){const relation=unit.routeRelations?.[j.id.replace('onet:','')];const weight=relation==='direct'?2:relation==='conditional'?.5:1;sum+=(scores.get(j.id)??0)*weight;total+=weight;}
    return -sum/total;
  }
  const ordered=units.filter(u=>u.studentVisible!==false&&u.path===path&&searchRank(u,query)>=0).sort((a,b)=>
    Number(targetIds.includes(b.id))-Number(targetIds.includes(a.id)) || searchRank(b,query)-searchRank(a,query) ||
    (complete?rank(a)-rank(b):Number(risk(b)!==null)-Number(risk(a)!==null)) ||
    routeTitle(a.label,a.path).localeCompare(routeTitle(b.label,b.path)));
  if(path!=='jobs'||query.trim()||!complete)return ordered;
  // Keep two examples per UK group near the top; all others remain available.
  const counts=new Map(),first=[],rest=[];
  for(const unit of ordered){const group=unit.soc4??unit.id;const count=counts.get(group)??0;
    if(first.length<12&&(count<2||targetIds.includes(unit.id))){first.push(unit);counts.set(group,count+1);}else rest.push(unit);
  }
  return [...first,...rest];
}
