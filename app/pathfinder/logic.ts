import type { Job } from '../assessment/model';

export type PlanSlot = { main: string | null; attached: string[] };
export type Plan = Record<'A' | 'B' | 'Z', PlanSlot>;
export const emptyPlan = (): Plan => ({ A: { main: null, attached: [] }, B: { main: null, attached: [] }, Z: { main: null, attached: [] } });
export const keys = ['A', 'B', 'Z'] as const;
export type SlotKey = typeof keys[number];
export const validScore = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
export function risk(job: Job): number | null {
  return validScore(job.exposure) && validScore(job.substitution) ? Math.sqrt(job.exposure * job.substitution) : null;
}
export function makeLinks(units: Job[]) {
  const links = new Map<string, Job[]>();
  const byId = new Map(units.map(unit => [unit.id, unit]));
  for (const route of units.filter(u => u.path !== 'jobs')) {
    if (route.path === 'degrees' && route.status !== 'approved') continue;
    const jobs = [...new Set(route.onetCodes ?? [])].flatMap(code => {
      const job = byId.get(`onet:${code}`);
      return job ? [job] : [];
    });
    links.set(route.id, jobs);
    for (const job of jobs) links.set(job.id, [...(links.get(job.id) ?? []), route]);
  }
  return links;
}
export function destinations(unit: Job, links: Map<string, Job[]>) { return unit.path === 'jobs' ? [unit] : links.get(unit.id) ?? []; }
export function range(values: (number | null | undefined)[]) {
  const available = values.filter((v): v is number => v != null && Number.isFinite(v));
  return { min: available.length ? Math.min(...available) : null, max: available.length ? Math.max(...available) : null, missing: values.length - available.length, total: values.length };
}
export function stats(unit: Job, links: Map<string, Job[]>) {
  const jobs = destinations(unit, links);
  // Openings are SOC4 group proxies: never count the same group twice.
  const groups = new Map<string, number>();
  for (const job of jobs) if (job.soc4 && job.openings != null) groups.set(job.soc4, job.openings);
  return { risk: range(jobs.map(risk)), salary: range(jobs.map(j => j.salary)), openings: groups.size ? [...groups.values()].reduce((a,b) => a+b,0) : null, groups: groups.size, missingOpenings: jobs.some(j => !j.soc4 || j.openings == null) };
}
export function planRisk(plan: Plan, byId: Map<string, Job>, links: Map<string, Job[]>) {
  const ranges = keys.map(key => {
    const slot = plan[key], main = slot.main ? byId.get(slot.main) : undefined;
    if (!main) return { min:null, max:null, missing:1, total:0 };
    const jobs = main.path !== 'jobs' && slot.attached.length ? slot.attached.flatMap(id => { const j=byId.get(id); return j && j.path==='jobs' ? [j] : []; }) : destinations(main,links);
    return range(jobs.map(risk));
  });
  const complete = ranges.every(r => r.total > 0 && r.missing === 0 && r.min !== null);
  if (!complete) return { state:'unknown' as const, min:null, max:null };
  const min=ranges.reduce((s,r)=>s+r.min!,0), max=ranges.reduce((s,r)=>s+r.max!,0);
  return { state:min>200?'high' as const:max>200?'possible' as const:'okay' as const, min,max };
}
export function putInSlot(plan: Plan, slot: SlotKey, id: string): Plan {
  return { ...plan, [slot]: { main:id, attached:[] } };
}
export function attach(plan: Plan, slot: SlotKey, id: string, links: Map<string, Job[]>): Plan {
  const current=plan[slot];
  if (!current.main || !links.get(current.main)?.some(j=>j.id===id)) return plan;
  return {...plan,[slot]:{...current,attached:current.attached.includes(id)?current.attached.filter(i=>i!==id):[...current.attached,id]}};
}
export function routeCondition(route: Job, career: Job) {
  // Apprenticeship notes include model-review reasoning, not entry requirements.
  if (route.path !== 'degrees') return null;
  return route.routeNotes?.[career.id.replace('onet:','')] || null;
}
export function artwork(unit: Job, links: Map<string, Job[]>) {
  const label = [unit.label,...destinations(unit,links).map(j=>j.label)].join(' ').toLowerCase();
  if (/nurs|therap|teach|care|social|counsel|health|child|psycholog/.test(label)) return 'people';
  if (/scient|biolog|chem|physic|medic|laborator|research|environment/.test(label)) return 'science';
  if (/engineer|mechanic|electric|plumb|construct|technician|agricultur|repair|build|manufactur/.test(label)) return 'making';
  return 'ideas';
}
export const money = (v:number|null) => v===null?'Not available':`£${Math.round(v/1000)}k`;
export function formatRange(r:ReturnType<typeof range>, format:(v:number|null)=>string = v=>v===null?'Not available':String(Math.round(v))) {
  return r.min===null?'Not available':r.min===r.max?format(r.min):`${format(r.min)}–${format(r.max)}`;
}
export function searchRank(unit:Job, query:string) {
  const q=query.trim().toLowerCase(),label=unit.label.toLowerCase();
  return !q?0:label===q?4:label.startsWith(q)?3:label.includes(q)?2:unit.aka?.some(a=>a.toLowerCase().includes(q))?1:-1;
}

export function readDraft(raw:string, base:import('../assessment/model').Profile, byId:Map<string,Job>, links:Map<string,Job[]>) {
  const value=JSON.parse(raw);
  const p=value?.profile;
  if(value?.version!==1||!p||!Array.isArray(p.answers)||p.answers.length!==60||!p.answers.every((v:unknown)=>typeof v==='number'&&Number.isInteger(v)&&v>=0&&v<=5)) throw Error('Invalid draft');
  const specificInterests:import('../assessment/model').Profile['specificInterests']={};
  if(p.specificInterests&&typeof p.specificInterests==='object'&&!Array.isArray(p.specificInterests)) for(const [id,choice] of Object.entries(p.specificInterests)) if(choice==='pursue'||choice==='neutral'||choice==='avoid')specificInterests[id]=choice;
  const educationPlan=['gcse','level3','university','postgraduate','unsure'].includes(p.educationPlan)?p.educationPlan:'';
  const profile={...base,answers:p.answers,targetIds:Array.isArray(p.targetIds)?[...new Set(p.targetIds.filter((id:unknown)=>typeof id==='string'&&byId.has(id)))] as string[]:[],stage:typeof p.stage==='string'?p.stage:'',educationPlan,specificInterests};
  const plan=emptyPlan();
  for(const key of keys){const slot=value.plan?.[key];if(typeof slot?.main==='string'&&byId.has(slot.main)){plan[key].main=slot.main;plan[key].attached=Array.isArray(slot.attached)?[...new Set(slot.attached.filter((id:unknown)=>typeof id==='string'&&links.get(slot.main)?.some(j=>j.id===id)))] as string[]:[];}}
  return {profile,plan,first:['Not yet','A few ideas','I know what I want'].includes(value.first)?value.first:'',fieldsDone:value.fieldsDone===true,aboutDone:value.aboutDone===true,nextAction:typeof value.nextAction==='string'?value.nextAction.slice(0,600):'',step:Number.isInteger(value.step)&&value.step>=0&&value.step<=62?value.step:0};
}
