import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initialProfile} from '../assessment/model.ts';
import {weightedInterest,journeyComplete} from './journey.ts';
import {makeLinks,risk} from './logic.ts';
import {recommendationRows,recommendationCards} from './recommendations.mjs';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const units=read('../../public/assessment-careers.json').units;
const data=read('../../public/assessment-direct-interests.json');
const evidence=read('../../public/pathfinder-profile-evidence.json');
const fixtures=[...read('./testing/profiles-a.json'),...read('./testing/profiles-b.json')];
const jobs=units.filter(u=>u.path==='jobs'),links=makeLinks(units);
test('missing evidence cannot increase priority points',()=>{
 const f=fixtures[0],p={...initialProfile,...f.profile},job=jobs.find(j=>data.profiles[j.id]?.specific?.some(v=>v>0));
 const original=weightedInterest(f.journey,p,data,job);
 const missing={...data,profiles:{...data.profiles,[job.id]:{...data.profiles[job.id],specific:[]}}};
 assert.equal(weightedInterest(f.journey,p,missing,job),0);
 assert(original>=0);
});
test('default route order averages linked career scores rather than taking the best',()=>{
 const a={id:'a',path:'degrees',label:'A'},b={id:'b',path:'degrees',label:'B'};
 const j1={id:'1'},j2={id:'2'},j3={id:'3'};
 const rows=[{job:j1,score:100},{job:j2,score:0},{job:j3,score:80}];
 assert.equal(recommendationCards([a,b],rows,new Map([['a',[j1,j2]],['b',[j3]]]),[],'degrees')[0].id,'b');
});
test('all 50 synthetic profiles complete the same gates as the student journey',()=>{
 assert.equal(fixtures.length,50);for(const f of fixtures)assert(journeyComplete(f.journey,{...initialProfile,...f.profile},data.areas),f.id);
});
test('confidence-only pair produces identical rankings across all three views',()=>{
 const ranked=fixtures.filter(p=>['P26','P27'].includes(p.id)).map(f=>recommendationRows(units,data,{...initialProfile,...f.profile},f.journey,evidence));
 for(const path of ['jobs','degrees','apprenticeships'])assert.deepEqual(...ranked.map(rows=>recommendationCards(units,rows,links,[],path).map(u=>u.id)));
});
test('unanswered preview uses evidence availability without fabricating match scores',()=>{
 const rows=recommendationCards(units,[],links,[],'jobs','',false);assert(risk(rows[0])!==null);
});

test('degrees without course evidence stay out of new suggestions but saved cards retain career links',()=>{
 const career={id:'onet:1',path:'jobs',label:'Engineer'};
 const hidden={id:'hecos:1',path:'degrees',label:'Unverified degree',studentVisible:false,status:'approved',onetCodes:['1']};
 const shown={id:'hecos:2',path:'degrees',label:'Verified degree',studentVisible:true,status:'approved',onetCodes:['1']};
 const list=[career,hidden,shown],graph=makeLinks(list);
 assert.deepEqual(recommendationCards(list,[],graph,[hidden.id],'degrees','',false).map(c=>c.id),[shown.id]);
 assert.deepEqual(graph.get(career.id).map(c=>c.id),[hidden.id,shown.id]);
 assert.deepEqual(graph.get(hidden.id).map(c=>c.id),[career.id]);
});
