import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyJourney,readJourney,allocationValid,journeyComplete,SKILLS,PREFERENCES,weightedInterest,preferenceFit,workValue,stages} from './journey.ts';
const areas=[{id:'a',label:'A'},{id:'b',label:'B'}];
const profile={specificInterests:{a:'pursue',b:'avoid'}};
const job={id:'onet:x',salary:null,openings:null,exposure:null,substitution:null};
test('points apply only to ticked areas and missing evidence earns no priority points',()=>{
 const j={...emptyJourney(),points:{a:10,b:10}};const data={areas,profiles:{[job.id]:{specific:[80,5]}}};
 assert.equal(weightedInterest(j,profile,data,job),.8);
 assert.equal(weightedInterest(j,profile,{areas,profiles:{}},job),0);
 assert.equal(allocationValid(j,profile,areas),true);
 assert.equal(allocationValid({...j,points:{a:9}},profile,areas),false);
 assert.equal(allocationValid(emptyJourney(),{specificInterests:{a:'avoid',b:'avoid'}},areas),true);
});
test('restore rejects out-of-range ratings and stale, crossed or excessive points',()=>{
 const j=readJourney({points:{a:11,b:3,stale:4},confidence:{[SKILLS[0].id]:0,[SKILLS[1].id]:9},preferences:{outdoors:5,team:-1}},areas,profile);
 assert.deepEqual(j.points,{});assert.equal(j.confidence[SKILLS[0].id],0);assert.equal(j.confidence[SKILLS[1].id],undefined);assert.deepEqual(j.preferences,{outdoors:5});
 assert.deepEqual(readJourney({points:{a:7,b:7}},areas,{specificInterests:{a:'pursue',b:'pursue'}}).points,{});
});
test('every section is required; not tried counts as answered but not zero ability',()=>{
 const j={points:{a:10},confidence:Object.fromEntries(SKILLS.map(s=>[s.id,0])),preferences:Object.fromEntries(PREFERENCES.map(p=>[p.id,3]))};
 assert.equal(journeyComplete(j,profile,areas),true);delete j.confidence[SKILLS[0].id];assert.equal(journeyComplete(j,profile,areas),false);
 assert.equal(stages(41).education,121);
});
test('must-avoid conflicts are visible; unknown evidence makes no adjustment',()=>{
 const j={...emptyJourney(),preferences:{outdoors:5}};
 const e={careers:{[job.id]:{skills:{},work:{outdoors:1}}}};
 assert.equal(preferenceFit(job,j,e,[job]).modifier,-10);assert.equal(preferenceFit(job,j,e,[job]).notes.length,1);
 assert.deepEqual(preferenceFit(job,j,null,[job]),{modifier:0,notes:[]});
 assert.equal(workValue(job,'ai',e,[job]),null);assert.equal(workValue({...job,exposure:25,substitution:100},'ai',e,[job]),.5);
});
test('confidence cannot change preference fit',()=>{
 const a={...emptyJourney(),confidence:{[SKILLS[0].id]:1}},b={...a,confidence:{[SKILLS[0].id]:5}};
 assert.deepEqual(preferenceFit(job,a,null,[job]),preferenceFit(job,b,null,[job]));
});
