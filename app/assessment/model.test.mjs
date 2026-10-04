import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { QUESTIONS, aiPreferenceModifier, availableEducationPlanIds, initialProfile, interests, rankJobs, visibleRoutes } from './model.ts';

const units = JSON.parse(readFileSync(new URL('../../public/v3.json', import.meta.url).pathname)).units;
const data = JSON.parse(readFileSync(new URL('../../public/assessment-interests.json', import.meta.url).pathname));
const jobs = units.filter(unit => unit.path === 'jobs');
const profile = {
  ...initialProfile,
  educationPlan: 'university',
  route: 'Keep my options open',
  answers: QUESTIONS.map(question => [5, 4, 1, 2, 2, 3][question[1]]),
  ai: 4,
};

test('the full O*NET Interest Profiler has 60 questions', () => {
  assert.equal(QUESTIONS.length, 60);
  assert.deepEqual(QUESTIONS.reduce((counts, question) => { counts[question[1]] += 1; return counts; }, [0, 0, 0, 0, 0, 0]), [10, 10, 10, 10, 10, 10]);
});

test('current stage removes education finish points that have passed', () => {
  assert.deepEqual(availableEducationPlanIds('University'), ['university', 'postgraduate', 'unsure']);
  assert.ok(!availableEducationPlanIds('Sixth form or college').includes('gcse'));
  assert.ok(availableEducationPlanIds('Studying GCSEs').includes('gcse'));
});

test('real data contains all Specific Interest Areas and produces finite results', () => {
  assert.equal(jobs.length, 341);
  assert.equal(data.areas.length, 41);
  assert.equal(Object.keys(data.profiles).length, 291);
  const ranked = rankJobs(jobs, data, profile, units);
  assert.equal(ranked.length, 291);
  assert.ok(ranked.every(result => Number.isFinite(result.score)));
  assert.ok(ranked.every(result => result.jobZone !== null));
});

test('the core recommendation score uses the 40/40/20 split', () => {
  const result = rankJobs(jobs, data, profile, units)[0];
  const expectedCore = result.riasecFit * 40 + result.specificFit * 40 + result.opportunity * 20;
  assert.equal(result.score, expectedCore + result.salaryBonus + result.zoneBonus + result.aiModifier + result.networkBonus);
});

test('education plan caps Job Zones but keeps a named target visible and first', () => {
  const zoneFive = jobs.find(job => data.profiles[job.id]?.jobZone === 5);
  assert.ok(zoneFive);
  const withoutTarget = rankJobs(jobs, data, { ...profile, educationPlan: 'gcse' }, units);
  assert.ok(withoutTarget.every(result => result.jobZone !== null && result.jobZone <= 3));
  const withTarget = rankJobs(jobs, data, { ...profile, educationPlan: 'gcse', targetIds: [zoneFive.id] }, units);
  assert.equal(withTarget[0].job.id, zoneFive.id);
  assert.equal(withTarget[0].target, true);
});

test('qualifications are recorded but do not affect ranking in v1', () => {
  const qualification = { id: 1, kind: 'A level', subject: 'Mathematics', grade: 'A', institution: '', detail: '' };
  const first = rankJobs(jobs, data, profile, units).map(result => result.job.id);
  const second = rankJobs(jobs, data, { ...profile, qualifications: [qualification] }, units).map(result => result.job.id);
  assert.deepEqual(first, second);
});

test('AI preference uses the 1–5 scale within the agreed -20 to +10 range', () => {
  assert.equal(aiPreferenceModifier(1, 20), 10);
  assert.equal(aiPreferenceModifier(2, 20), 5);
  assert.equal(aiPreferenceModifier(3, 20), 0);
  assert.equal(aiPreferenceModifier(1, 55), 0);
  assert.equal(aiPreferenceModifier(5, 55), 5);
  assert.equal(aiPreferenceModifier(1, 90), -20);
  assert.equal(aiPreferenceModifier(2, 90), -10);
  assert.equal(aiPreferenceModifier(3, 90), -5);
  assert.equal(aiPreferenceModifier(4, 90), 0);
  assert.equal(aiPreferenceModifier(5, 90), 10);
  assert.equal(aiPreferenceModifier(1, null), 0);
});

test('salary importance only adds points', () => {
  const unanswered = rankJobs(jobs, data, { ...profile, salaryImportance: -1 }, units);
  const noSalary = rankJobs(jobs, data, { ...profile, salaryImportance: 0 }, units);
  const highSalary = rankJobs(jobs, data, { ...profile, salaryImportance: 3 }, units);
  const baseScores = new Map(noSalary.map(result => [result.job.id, result.score]));
  assert.deepEqual(unanswered.map(result => result.score), noSalary.map(result => result.score));
  assert.ok(highSalary.every(result => result.score >= baseScores.get(result.job.id)));
});

test('a relevant network interest area gives matching careers a moderate boost', () => {
  const areaIndex = data.areas.findIndex(area => area.label === 'Information Technology');
  const areaId = data.areas[areaIndex].id;
  const ranked = rankJobs(jobs, data, { ...profile, network: 'yes', networkAreaIds: [areaId] }, units);
  assert.ok(ranked.some(result => result.networkBonus === 10));
  assert.ok(ranked.every(result => result.networkBonus === ((data.profiles[result.job.id]?.specific[areaIndex] ?? 0) >= 50 ? 10 : 0)));
});

test('avoiding a Specific Interest Area removes strong matches but not a target', () => {
  const areaIndex = data.areas.findIndex(area => area.label === 'Accounting');
  const strongMatch = jobs.find(job => (data.profiles[job.id]?.specific[areaIndex] ?? 0) >= 50);
  assert.ok(strongMatch);
  const specificInterests = { [data.areas[areaIndex].id]: 'avoid' };
  assert.ok(!rankJobs(jobs, data, { ...profile, specificInterests }, units).some(result => result.job.id === strongMatch.id));
  assert.equal(rankJobs(jobs, data, { ...profile, specificInterests, targetIds: [strongMatch.id] }, units)[0].job.id, strongMatch.id);
});

test('route display follows the education plan without filtering out the career', () => {
  const job = jobs.find(candidate => units.some(unit => unit.roles?.includes(jobs.indexOf(candidate))));
  assert.ok(job);
  const routes = visibleRoutes(job, units, { ...profile, educationPlan: 'gcse', route: 'Keep my options open' });
  assert.ok(routes.every(route => route.path !== 'degrees'));
  assert.ok(routes.filter(route => route.path === 'apprenticeships').every(route => Number(route.level) <= 3));
  assert.deepEqual(visibleRoutes(job, units, { ...profile, route: 'Straight into work' }), []);
});

test('flat RIASEC answers never produce NaN', () => {
  assert.deepEqual(interests(Array(60).fill(3)), Array(6).fill(30));
  assert.ok(rankJobs(jobs, data, { ...profile, answers: Array(60).fill(3) }, units).every(result => Number.isFinite(result.score)));
});

test('RIASEC scores use the official 10–50 summed scale', () => {
  assert.deepEqual(interests(Array(60).fill(1)), Array(6).fill(10));
  assert.deepEqual(interests(Array(60).fill(5)), Array(6).fill(50));
});
