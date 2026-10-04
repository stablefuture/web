import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {currentReviews, reviewError} from './hecos-model.ts';

const subject={code:'100428',status:'needs_review',fingerprint:'snapshot'};
const jobs=new Set(['17-2011.00','17-2012.00','17-2013.00']);
const review={code:subject.code,fingerprint:'snapshot',action:'approve',links:[{onetCode:'17-2011.00',relation:'conditional',conditions:'Qualifying aerospace course'}],note:'Named pathway resolves the availability concern.',evidenceUrl:'https://example.ac.uk/course',at:'2026-09-16'};
test('job choices save without notes, evidence, or scope and remain unverified',()=>{
 const proposal={...review,action:'propose',links:[{onetCode:'17-2011.00',relation:'unverified',conditions:''}],note:'',evidenceUrl:''};
 assert.equal(reviewError(proposal,subject,jobs),null);
 assert.equal(currentReviews([proposal],[subject])[subject.code].action,'propose');
 assert.ok(reviewError({...proposal,action:'approve'},subject,jobs));
 assert.ok(reviewError({...proposal,links:[]},subject,jobs));
 assert.equal(reviewError({...proposal,links:[...jobs].map(onetCode=>({onetCode,relation:'unverified',conditions:''}))},subject,jobs),null);
});
test('approve only explicit selected known jobs with a reason and conditional requirement',()=>{
 assert.equal(reviewError(review,subject,jobs),null);
 for(const value of [{...review,links:[]},{...review,note:''},{...review,links:[{...review.links[0],conditions:''}]},{...review,links:[{...review.links[0],onetCode:'made-up'}]}]) assert.ok(reviewError(value,subject,jobs));
});
test('reject stale snapshots, approved subjects, duplicate jobs, and unsafe URLs',()=>{
 assert.ok(reviewError({...review,fingerprint:'old'},subject,jobs));
 assert.ok(reviewError(review,{...subject,status:'approved'},jobs));
 assert.ok(reviewError({...review,links:[review.links[0],review.links[0]]},subject,jobs));
 assert.ok(reviewError({...review,evidenceUrl:'javascript:alert(1)'},subject,jobs));
});
test('exclude, defer, and reset cannot silently publish links',()=>{
 for(const action of ['exclude','defer','reset']) {
  assert.equal(reviewError({...review,action,links:[],note:''},subject,jobs),null);
  assert.ok(reviewError({...review,action},subject,jobs));
 }
});
test('latest saved review wins, reset restores queue, stale reviews do not count',()=>{
 assert.equal(currentReviews([review], [subject])[subject.code].action,'approve');
 assert.deepEqual(currentReviews([review,{...review,action:'reset',links:[]}],[subject]),{});
 assert.deepEqual(currentReviews([{...review,fingerprint:'old'}],[subject]),{});
});
test('current dataset counts agree with its validated assembly metadata',()=>{
 const map=JSON.parse(readFileSync(new URL('../../../jobs/data/classified/hecos_to_onet.json',import.meta.url)));
 assert.equal(map.subjects.length,652);
 for(const status of ['approved','needs_review','no_direct_route','not_subject'])assert.equal(map.subjects.filter(s=>s.status===status).length,map.metadata.statusCounts[status]);
 assert.ok(map.subjects.filter(s=>s.status!=='approved').every(s=>s.mappings.length===0));
});
