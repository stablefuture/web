import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decisionLabel, proposalLabels, inHumanShortlist, reviewState } from './review-model.ts';
import { loadQueue } from './review-data.ts';

test('outcome labels make inverted removal decisions explicit', () => {
  const row = {proposal:'remove',jobs:[{code:'test'}],fingerprint:'v1'};
  assert.equal(proposalLabels(row).original, 'REMOVE this link');
  assert.equal(decisionLabel(row,{fingerprint:'v1',action:'accept'}), 'Remove this link');
  assert.equal(decisionLabel(row,{fingerprint:'v1',action:'reject'}), 'Keep this link');
  const empty = {...row,proposal:'review',jobs:[]};
  assert.equal(proposalLabels(empty).accept, 'Confirm no direct match');
  assert.equal(proposalLabels(empty).reject, 'Request a different mapping');
  assert.equal(proposalLabels({...row,proposal:'review'}).accept, 'Approve these links');
  assert.match(decisionLabel(row,{fingerprint:'old',action:'accept'}), /Earlier evidence/);
});

test('saved decisions, changed evidence, and reopening', () => {
  const row = {id:'one',fingerprint:'v1'};
  const saved = {id:'one',fingerprint:'v1',action:'accept'};
  assert.equal(reviewState(row, []), 'pending');
  assert.equal(reviewState(row, [saved]), 'accept');
  assert.equal(reviewState({...row,fingerprint:'v2'}, [saved]), 'changed');
  assert.equal(reviewState(row, [saved,{...saved,action:'reset'}]), 'pending');
  assert.equal(reviewState(row, [saved,{...saved,action:'defer'}]), 'defer');
  assert.equal(reviewState(row, [{...saved,id:'other'}]), 'pending');
});
test('queue covers every audited edge and standard with stable identities', async () => {
  const rows = await loadQueue();
  assert.equal(rows.filter(r=>r.kind==='degree').length, 6227);
  assert.equal(rows.filter(r=>r.kind==='apprenticeship').length, 620);
  assert.equal(new Set(rows.map(r=>r.id)).size, rows.length);
  assert.ok(rows.every(r=>r.fingerprint.length===64));
  assert.equal(rows.filter(r=>r.kind==='degree' && r.proposal==='remove').length, 50);
  assert.equal(rows.filter(r=>r.kind==='degree' && inHumanShortlist(r)).length, 50);
  assert.ok(rows.filter(r=>r.kind==='degree' && r.proposal==='review').every(r=>!inHumanShortlist(r)));
  assert.equal(inHumanShortlist(rows.find(r=>r.code==='ST0847')), true);
  assert.equal(rows.find(r=>r.code==='ST0847').proposal, 'review');
  assert.deepEqual(rows.map(r=>r.fingerprint), (await loadQueue()).map(r=>r.fingerprint));
});
