import type {Subject, Job, Mapping, HumanReview} from "./hecos-model";

export type SpotCheck = {onetCode: string; title: string; reason: string; severity: "check" | "gap"; subjectCodes: string[]; resolved?: boolean};
export type JobContext = {id: string; path: string; label: string; onetCodes?: string[]; soc4?: string; ukGroup?: string; openings?: number | null};
export type DegreeLink = {
  code: string; term: string; area: string; definition: string; families: number | null;
  mapping: Mapping; sources: Subject["sources"];
};
export type ReverseJob = Job & {degrees: DegreeLink[]; pending: {code: string; term: string}[];
  apprenticeships: number; soc4?: string; ukGroup?: string; openings: number | null; flags: SpotCheck[]};

// A small familiar-job sample, not a claim about UK employment rank.
export const FAMILIAR_JOBS = new Set([
  "13-2011.00", "15-1252.00", "15-2051.00", "29-1141.00", "29-1123.00",
  "29-1021.00", "23-1011.00", "25-2031.00", "25-2022.00", "17-2141.00",
  "17-2051.00", "17-2071.00", "47-2111.00", "47-2152.00", "49-9021.00",
  "13-1161.00", "27-1024.00", "13-1071.00", "21-1021.00", "13-2051.00",
]);

export function reverseJobs(subjects: Subject[], jobs: Job[], context: JobContext[], reviews: HumanReview[], flags: SpotCheck[]): ReverseJob[] {
  const result = new Map(jobs.map(j => [j.code, {...j, degrees:[], pending:[], apprenticeships:0, openings:null, flags:flags.filter(f=>f.onetCode===j.code)} as ReverseJob]));
  for (const s of subjects) if (s.status === "approved") for (const m of s.mappings) {
    const cited = new Set(m.evidence?.map(e=>e.sourceId));
    result.get(m.onetCode)?.degrees.push({code:s.code,term:s.term,area:s.cah1.label,definition:s.definition,
      families:s.availability.estimatedProviderCourseFamilies ?? null,mapping:m,sources:s.sources.filter(x=>cited.has(x.id))});
  }
  for (const r of reviews) if (["propose", "approve"].includes(r.action)) {
    const s=subjects.find(s=>s.code===r.code);
    if (s) for (const l of r.links) result.get(l.onetCode)?.pending.push({code:s.code,term:s.term});
  }
  for (const u of context) {
    if (u.path === "jobs") {
      const j=result.get(u.id.replace(/^onet:/,""));
      if (j) {j.openings=u.openings ?? null;j.soc4=u.soc4;j.ukGroup=u.ukGroup;}
    } else if (u.path === "apprenticeships") for (const code of new Set(u.onetCodes ?? [])) {
      const j=result.get(code);if(j)j.apprenticeships++;
    }
  }
  for (const j of result.values()) j.degrees.sort((a,b)=>a.mapping.relation.localeCompare(b.mapping.relation) || (b.families ?? -1)-(a.families ?? -1) || a.term.localeCompare(b.term));
  return [...result.values()];
}

export function reverseSummary(jobs: ReverseJob[]) {
  const linked=jobs.filter(j=>j.degrees.length);
  const edges=linked.flatMap(j=>j.degrees);
  const counts=linked.map(j=>j.degrees.length).sort((a,b)=>a-b);
  const distribution = ["1", "2–3", "4–7", "8+"].map((label,i)=>({label,count:counts.filter(n=>i===0?n===1:i===1?n>=2&&n<=3:i===2?n>=4&&n<=7:n>=8).length}));
  return {subjects:new Set(edges.map(d=>d.code)).size,links:edges.length,linkedJobs:linked.length,totalJobs:jobs.length,
    direct:edges.filter(d=>d.mapping.relation==="direct").length,conditional:edges.filter(d=>d.mapping.relation==="conditional").length,
    median:counts.length ? (counts[Math.floor((counts.length-1)/2)]+counts[Math.floor(counts.length/2)])/2 : 0,
    max:counts.at(-1) ?? 0,distribution};
}
