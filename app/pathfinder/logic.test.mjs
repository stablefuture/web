import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { risk, makeLinks, stats, emptyPlan, putInSlot, attach, planRisk, readDraft, searchRank } from './logic.ts';
const job=(id,exposure,substitution,soc4='1234')=>({id:`onet:${id}`,path:'jobs',label:id,sectors:[],exposure,substitution,salary:30000,openings:100,soc4});
const route=(codes)=>({id:'hecos:test',path:'degrees',label:'Test degree',status:'approved',onetCodes:codes});
test('geometric mean uses component scores; missing and invalid scores stay unknown',()=>{
  assert.equal(risk({...job('a',25,100),risk:99}),50);
  assert.equal(risk(job('a',0,100)),0);
  for(const v of [null,undefined,NaN,-1,101])assert.equal(risk(job('a',v,100)),null);
});
test('training ranges describe destinations and deduplicate SOC4 openings',()=>{
  const a=job('a',25,100),b=job('b',100,100),c=job('c',null,50,'5678'),r=route(['a','b','b','c']);
  const links=makeLinks([a,b,c,r]);
  assert.deepEqual(links.get(r.id).map(j=>j.id),['onet:a','onet:b','onet:c']);
  assert.deepEqual(links.get(a.id).map(j=>j.id),[r.id]);
  const result=stats(r,links);
  assert.deepEqual(result.risk,{min:50,max:100,missing:1,total:3});
  assert.equal(result.openings,200);
  assert.equal(result.groups,2);
  assert.equal(stats({...r,id:'unmapped'},links).risk.min,null);
});
test('unreviewed degree routes are not made into links',()=>{
  const a=job('a',50,50),r={...route(['a']),status:'needs_review'};
  assert.equal(makeLinks([a,r]).get(a.id),undefined);
});
test('plan alert is strictly above 200 and never substitutes zero for missing risk',()=>{
  const a=job('a',100,100),b=job('b',50,50),c=job('c',51,51),d=job('d',null,null);
  const byId=new Map([a,b,c,d].map(j=>[j.id,j])),links=makeLinks([...byId.values()]);
  let p=putInSlot(putInSlot(putInSlot(emptyPlan(),'A',a.id),'B',b.id),'Z',b.id);
  assert.equal(planRisk(p,byId,links).state,'okay');
  p=putInSlot(p,'Z',c.id);assert.equal(planRisk(p,byId,links).state,'high');
  p=putInSlot(p,'Z',d.id);assert.equal(planRisk(p,byId,links).state,'unknown');
});
test('selected training destinations narrow the plan range; multiple attachments remain valid',()=>{
  const a=job('a',20,20),b=job('b',90,90),r=route(['a','b']);const units=[a,b,r],links=makeLinks(units),byId=new Map(units.map(j=>[j.id,j]));
  let p=putInSlot(putInSlot(putInSlot(emptyPlan(),'A',r.id),'B',b.id),'Z',b.id);
  assert.equal(planRisk(p,byId,links).state,'possible');
  p=attach(p,'A',a.id,links);assert.equal(planRisk(p,byId,links).state,'okay');
  p=attach(p,'A',b.id,links);assert.equal(p.A.attached.length,2);assert.equal(planRisk(p,byId,links).state,'possible');
  assert.equal(attach(p,'A','invalid',links),p);
  assert.deepEqual(putInSlot(p,'A',a.id).A.attached,[]);
});
test('saved plans reject malformed answers and discard stale or unrelated IDs',()=>{
  const a=job('a',50,50),b=job('b',50,50),r=route(['a']);const units=[a,b,r],links=makeLinks(units),byId=new Map(units.map(j=>[j.id,j]));
  const base={answers:Array(60).fill(0),specificInterests:{},targetIds:[],educationPlan:'',stage:''};
  assert.throws(()=>readDraft(JSON.stringify({version:1,profile:{answers:[5]}}),base,byId,links));
  const restored=readDraft(JSON.stringify({version:1,profile:{...base,answers:Array(60).fill(3),targetIds:['missing',a.id],specificInterests:null},plan:{A:{main:r.id,attached:[a.id,a.id,b.id,'missing']}}}),base,byId,links);
  assert.deepEqual(restored.plan.A.attached,[a.id]);assert.deepEqual(restored.profile.targetIds,[a.id]);assert.deepEqual(restored.profile.specificInterests,{});
});
test('title matches outrank aliases',()=>assert.ok(searchRank({...job('Software Developers',50,50)},'software')>searchRank({...job('Managers',50,50),aka:['Software boss']},'software')));
test('published data has reciprocal links, valid route labels, and component-derived scores',()=>{
  const units=JSON.parse(readFileSync(new URL('../../public/assessment-careers.json',import.meta.url))).units;
  const relations=JSON.parse(readFileSync(new URL('../../public/pathfinder-route-evidence.json',import.meta.url))).relations;
  const links=makeLinks(units),byId=new Map(units.map(j=>[j.id,j]));
  for(const [id,items] of links)for(const item of items)assert.ok(links.get(item.id).some(j=>j.id===id));
  for(const [id,entries] of Object.entries(relations))for(const [code,label] of Object.entries(entries)){assert.ok(byId.get(id).onetCodes.includes(code));assert.ok(['direct','conditional'].includes(label));}
  for(const unit of units.filter(j=>j.path==='jobs'))if(unit.risk!==null)assert.equal(Math.round(risk(unit)),unit.risk);
});
