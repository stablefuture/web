import type { Job, InterestData } from '../assessment/model';
import { destinations, risk } from './logic';
export const defaults = { sector:'', area:'', match:0, conflicts:false, fit:5, pay:0, ai:0, openings:0, metric:'risk' };
export type Exploration = typeof defaults;
const groups:Record<string,string>={'11':'Managers and directors','21':'Science, research, and engineering professionals','22':'Health professionals','23':'Teaching professionals','24':'Business, media, and public service professionals','31':'Science and engineering technicians','32':'Health and social care support professionals','33':'Protective services','34':'Culture, media, and sport','35':'Business and public service support professionals','41':'Administration','42':'Secretarial work','51':'Agriculture and related trades','52':'Metal, electrical, and electronic trades','53':'Construction trades','54':'Textiles, printing, and other trades','61':'Caring services','62':'Leisure, travel, and personal services','63':'Community and civil enforcement','71':'Sales','72':'Customer service','81':'Process, plant, and machine work','82':'Transport and mobile machinery','91':'Elementary trades and related work','92':'Elementary administration and services'};
export function sectorLabel(key:string,units:Job[]){return key.startsWith('soc2:')?groups[key.slice(5)]??key:key.startsWith('route:')?key.slice(6):units.find(j=>j.sectors.includes(key)&&j.cah2)?.cah2?.label??key;}
const mean=(values:(number|null|undefined)[])=>{const known=values.filter((v):v is number=>v!=null&&Number.isFinite(v));return known.length?known.reduce((a,b)=>a+b,0)/known.length:null;};
export function exploreCards(cards:Job[], units:Job[], links:Map<string,Job[]>, data:InterestData, matches:Map<string,number>, rows:Map<string,{score:number;preferenceConflicts:string[]}>, options:Exploration){
 const area=data.areas.findIndex(a=>a.id===options.area);
 const filtered=cards.filter(u=>{
  const jobs=destinations(u,links);
  return (!options.sector||u.sectors.includes(options.sector))&&(!options.match||(matches.get(u.id)??-1)>=options.match)&&
   (!options.area||jobs.some(j=>(data.profiles[j.id]?.specific?.[area]??-1)>=50))&&
   (!options.conflicts||(jobs.length>0&&jobs.every(j=>rows.has(j.id)&&!rows.get(j.id)!.preferenceConflicts.length)));
 });
 if(!options.pay&&!options.ai&&!options.openings)return filtered;
 const jobs=units.filter(j=>j.path==='jobs');
 const percentile=(value:number|null,key:'salary'|'openings')=>{
  if(value===null)return 0; // Unknown earns no evidence for a chosen priority.
  const groups=new Map<string,number>();for(const j of jobs){const v=j[key];if(v!==null)groups.set(j.soc4??j.id,v);}
  const values=[...groups.values()];return values.length?100*values.filter(v=>v<=value).length/values.length:0;
 };
 const score=(u:Job)=>{
  const js=destinations(u,links), uk=[...new Map(js.map(j=>[j.soc4??j.id,j])).values()];
  const ai=mean(js.map(j=>options.metric==='exposure'?j.exposure:risk(j)));
  return options.fit*(mean(js.map(j=>rows.get(j.id)?.score))??0)+options.pay*percentile(mean(uk.map(j=>j.salary)),'salary')+options.openings*percentile(mean(uk.map(j=>j.openings)),'openings')+options.ai*(ai===null?0:100-ai);
 };
 const scores=new Map(filtered.map(j=>[j.id,score(j)]));
 return filtered.sort((a,b)=>scores.get(b.id)!-scores.get(a.id)!);
}
