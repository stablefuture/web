import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {linkedRoutes,targetJobIds,rankJobs,initialProfile,visibleRoutes} from './model.ts';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url)));
const units=read('../../public/assessment-careers.json').units;
const data=read('../../public/assessment-direct-interests.json');
const jobs=units.filter(u=>u.path==='jobs');
test('risk combines the exact occupation axes and preserves missing scores',()=>{
  for(const job of jobs){
    const expected=job.exposure == null || job.substitution == null ? null : Math.round(Math.sqrt(job.exposure*job.substitution));
    assert.equal(job.risk,expected,job.id);
    const detail=read(`../../public${job.detailUrl}`).occupations[0];
    assert.equal(detail.risk,job.risk,job.id);
  }
  assert.equal(jobs.find(j=>j.id==='onet:15-1252.00').risk,94);
});
test('results use specific occupations and direct route IDs, not SOC sibling expansion',()=>{
  assert.equal(jobs.length,1016);
  assert.ok(jobs.every(j=>j.id.startsWith('onet:')));
  assert.ok(units.filter(u=>u.path!=='jobs').every(r=>r.onetCodes && !r.roles && !r.related_roles));
  const degrees=units.filter(u=>u.path==='degrees');
  assert.ok(degrees.length>0);
  assert.ok(degrees.every(r=>r.id.startsWith('hecos:') && r.status==='approved' && r.cah3));
  const nuclear=units.find(u=>u.id==='hecos:100172');
  assert.ok(nuclear?.onetCodes.includes('17-2161.00'));
  const nuclearJob=jobs.find(j=>j.id==='onet:17-2161.00');
  assert.ok(!linkedRoutes(nuclearJob,units).some(r=>r.id==='hecos:100527'));
  const tox=units.find(u=>u.id==='hecos:100277');
  assert.ok(!tox?.onetCodes.some(code=>code.startsWith('33-')));
  assert.deepEqual([...targetJobIds(units,[nuclear.id])].sort(),nuclear.onetCodes.map(c=>'onet:'+c).sort());
  assert.ok(degrees.every(r=>r.openings===null && r.exposure===null && r.courseAvailability));
});
test('all eight apprenticeship corrections reach their selected careers with scope notes',()=>{
  const expected={ST0542:'31-9091.00',ST0574:'47-5032.00',ST0820:'19-3033.00',ST0834:'47-5032.00',ST0860:'11-9041.00',ST0930:'33-9099.00',ST1292:'51-8031.00',ST1434:'31-9091.00'};
  for(const [st,code] of Object.entries(expected)){
    const route=linkedRoutes(jobs.find(j=>j.id==='onet:'+code),units).find(r=>r.id==='appr-'+st);
    assert.ok(route,st); assert.ok(route.routeNote,st);
  }
});
test('unknown scores stay unknown; named unprofiled route destinations remain accessible',()=>{
  const job=jobs.find(j=>j.id==='onet:33-9099.00');
  assert.equal(job.exposure,null);
  const ranked=rankJobs(jobs,data,{...initialProfile,targetIds:['appr-ST0930']},units);
  assert.ok(ranked.find(r=>r.job.id===job.id)?.target);
  assert.ok(ranked.every(r=>Number.isFinite(r.score)));
  assert.deepEqual(visibleRoutes(job,units,{...initialProfile,route:'Straight into work'}),[]);
});
test('details and interest profiles belong to the exact displayed occupation',()=>{
  for(const job of jobs){
    const detail=read('../../public'+job.detailUrl);
    assert.equal(detail.occupations.length,1);
    assert.equal(detail.occupations[0].code,job.id.slice(5));
    assert.equal(detail.occupations[0].exposure,job.exposure);
    if(data.profiles[job.id]) assert.deepEqual(data.profiles[job.id].onetCodes,[job.id.slice(5)]);
  }
});
