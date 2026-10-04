import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reverseJobs,reverseSummary,FAMILIAR_JOBS} from './reverse-model.ts';

const root=new URL('../../../',import.meta.url);
const read=p=>JSON.parse(readFileSync(new URL(p,root)));
const subjects=read('jobs/data/classified/hecos_to_onet.json').subjects;
const jobs=Object.entries(read('jobs/data/classified/st_onet_review/onet_catalogue.json')).map(([code,j])=>({code,...j}));
const context=read('web/public/assessment-careers.json').units;
test('EDA totals and spot-check references agree with the live approved map',()=>{
 const eda=read('jobs/data/classified/hecos_onet_review/reverse-eda.json');
 const result=reverseJobs(subjects,jobs,context,[],eda.flags);
 const summary=reverseSummary(result);
 assert.equal(eda.summary.scope.approvedSubjects,summary.subjects);
 assert.equal(eda.summary.scope.approvedLinks,summary.links);
 assert.equal(eda.summary.scope.mappedOccupations,summary.linkedJobs);
 for(const flag of eda.flags){
  const job=result.find(j=>j.code===flag.onetCode);
  assert.ok(job,flag.onetCode);
  for(const code of flag.subjectCodes)assert.ok(job.degrees.some(d=>d.code===code),`${flag.onetCode}: ${code}`);
 }
});
test('reverse map preserves every approved edge and excludes withheld subjects',()=>{
 const result=reverseJobs(subjects,jobs,context,[],[]), summary=reverseSummary(result);
 assert.equal(summary.subjects,subjects.filter(s=>s.status==='approved').length);
 assert.equal(summary.links,subjects.reduce((n,s)=>n+s.mappings.length,0));
 assert.equal(summary.distribution.reduce((n,b)=>n+b.count,0),summary.linkedJobs);
 assert.equal(summary.direct+summary.conditional,summary.links);
 assert.equal(result.find(j=>j.code==='17-2161.00').degrees[0].term,'nuclear engineering');
 assert.ok(result.flatMap(j=>j.degrees).every(d=>subjects.find(s=>s.code===d.code).status==='approved'));
});
test('human proposals remain separate from approved counts',()=>{
 const subject=subjects.find(s=>s.status==='needs_review');
 const result=reverseJobs(subjects,jobs,context,[{code:subject.code,action:'propose',links:[{onetCode:'17-2021.00'}]}],[]);
 assert.equal(result.find(j=>j.code==='17-2021.00').pending[0].code,subject.code);
 assert.equal(reverseSummary(result).links,subjects.reduce((n,s)=>n+s.mappings.length,0));
});
test('familiar sample uses valid job codes and preserves shared UK proxy labels',()=>{
 assert.equal(FAMILIAR_JOBS.size,20);
 for(const code of FAMILIAR_JOBS)assert.ok(jobs.some(j=>j.code===code),code);
 const result=reverseJobs(subjects,jobs,context,[],[]);
 const hvac=result.find(j=>j.code==='49-9021.00');
 assert.equal(hvac.soc4,'5225');assert.ok(hvac.ukGroup);assert.equal(hvac.openings,303);
 assert.ok(result.find(j=>j.code==='47-2111.00').apprenticeships>0);
});
test('supervised recall fixes publish psychology and specialist social-work routes',()=>{
 const result=reverseJobs(subjects,jobs,context,[],[]);
 assert.ok(result.find(j=>j.code==='19-3039.00').degrees.some(d=>d.term==='psychology' && d.mapping.relation==='conditional'));
 const social=result.find(j=>j.code==='21-1023.00');
 assert.ok(social.degrees.some(d=>d.term==='social work' && d.mapping.relation==='conditional'));
 assert.ok(social.apprenticeships>0);
 const amendments=read('jobs/data/classified/hecos_onet_review/amendments/20260917_human.json');
 assert.equal(amendments.subjects.length,13);
 for(const r of amendments.subjects)assert.equal(subjects.find(s=>s.code===r.code).status,'approved');
});
