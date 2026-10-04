import test from 'node:test';
import assert from 'node:assert/strict';
import { createCareerResultsHandler, renderCareerEmail, selectReports } from '../../lib/career-email.mjs';

const exposure = { score: 78, colour: '#c14c34', label: 'High', basis: 'linked_jobs', totalJobCount: 1, scoredJobCount: 1 };
const reports = [
 { id: 'degree:a', title: '<English & media>', kind: 'degree', aiExposure: exposure, jobs: [{ sug: '1234/01', title: 'Writer <script>', condition: 'Take training & gain experience.', memberSubjects: [{ title: 'English' }], aiExposure: { ...exposure, score: 32, colour: '#3d8b4a', label: 'Low' } }], exampleCareer: { title: 'Writer', totalMappedTasks: 30, tasks: [{ text: '<Check> source facts', aiExposure: 'yes' }, { text: 'Meet people', aiExposure: 'no' }] }, exampleSelection: { memberSubject: { title: 'English' }, condition: 'Further training.' }, proposedJobsForReview: [{ title: 'DO NOT INCLUDE CANDIDATE' }] },
 { id: 'st:b', kind: 'apprenticeship', title: 'Flight operations', aiExposure: { ...exposure, score: 50, colour: '#b26f00', label: 'Medium', basis: 'broader_groups', totalJobCount: 2, scoredJobCount: 2 }, jobs: [], groupRoutes: [{ title: 'Pilots and controllers', condition: 'Classification only; does not qualify you as a pilot.', aiExposure: exposure, members: [{ title: 'DO NOT PRESENT MEMBER AS DESTINATION' }] }], exampleCareer: null },
 { id: 'job:c', kind: 'job', title: 'Unscored job', aiExposure: { score: null }, jobs: [], exampleCareer: null },
];
const request = (body, headers = {}) => new Request('https://stablefuture.uk/api/career-results', { method: 'POST', headers: { origin: 'https://stablefuture.uk', 'Content-Type': 'application/json', 'x-forwarded-for': 'test', ...headers }, body: JSON.stringify(body) });
function setup(overrides = {}) {
 const calls = [];
 const handler = createCareerResultsHandler({ loadReports: async () => reports, apiKey: 'test-only', bookingUrl: 'https://example.com/book?a=1&b=2', fetchImpl: async (...args) => { calls.push(args); return Response.json({ id: 'mock-accepted' }); }, ...overrides });
 return { handler, calls };
}
test('one request sends one email containing all three canonical reports', async () => {
 const { handler, calls } = setup(); const response = await handler(request({ email: ' person@example.com ', ids: reports.map((r) => r.id), aiExposure: { score: 0 }, reports: [{ title: 'FORGED' }] }));
 assert.equal(response.status, 200); assert.deepEqual(await response.json(), { ok: true }); assert.equal(calls.length, 1);
 const mail = JSON.parse(calls[0][1].body); assert.deepEqual(mail.to, ['person@example.com']); assert.match(mail.text, /78\/100/); assert.doesNotMatch(mail.text, /FORGED|DO NOT INCLUDE|DO NOT PRESENT/); assert.match(mail.text, /Flight operations/); assert.match(mail.text, /BROADER CAREER GROUP/); assert.match(mail.text, /Classification only/); assert.match(mail.text, /A task breakdown for this specific role is not available yet/);
});
test('duplicates are deduplicated in the single email', async () => {
 const { handler, calls } = setup(); assert.equal((await handler(request({ email: 'a@b.uk', ids: ['job:c', 'job:c'] }))).status, 200);
 assert.equal((JSON.parse(calls[0][1].body).text.match(/\d\. Unscored job/g) || []).length, 1);
});
test('invalid path selections and email never contact the provider', async () => {
 for (const body of [{ email: 'a@b.uk', ids: [] }, { email: 'a@b.uk', ids: ['missing'] }, { email: 'a@b.uk', ids: ['job:c', 'job:c', 'job:c', 'job:c'] }, { email: 'a@b.uk', ids: 'job:c' }, { email: 'a@b.uk', ids: [3] }, { email: 'a@b.uk', ids: ['x'.repeat(161)] }, { email: 'bad\n@b.uk', ids: ['job:c'] }, { email: 'a@b.uk', ids: ['job:c'], website: 'spam' }]) {
  const { handler, calls } = setup(); assert.equal((await handler(request(body))).status, 400); assert.equal(calls.length, 0);
 }
});
test('origin, malformed, oversized, and method guards', async () => {
 const { handler, calls } = setup({ rateLimit: 20 });
 assert.equal((await handler(request({ email: 'a@b.uk', ids: ['job:c'] }, { origin: 'https://other.uk' }))).status, 403);
 assert.equal((await handler(new Request('https://stablefuture.uk/api/career-results', { method: 'POST', body: '{}' }))).status, 403);
 assert.equal((await handler(new Request('https://stablefuture.uk/api/career-results'))).status, 405);
 assert.equal((await handler(new Request('https://stablefuture.uk/api/career-results', { method: 'POST', headers: { origin: 'https://stablefuture.uk' }, body: '{broken' }))).status, 400);
 assert.equal((await handler(request({ email: 'a@b.uk', ids: ['job:c'], junk: 'x'.repeat(6000) }))).status, 400); assert.equal(calls.length, 0);
});
test('missing service/data, provider rejection, timeout, or missing acceptance id never returns success', async () => {
 for (const [overrides, expected] of [[{ apiKey: '' }, 503], [{ loadReports: async () => { throw new Error('missing'); } }, 503], [{ fetchImpl: async () => Response.json({ message: 'no' }, { status: 401 }) }, 502], [{ fetchImpl: async () => { throw new Error('network'); } }, 502], [{ fetchImpl: async () => Response.json({}) }, 502]]) {
  const { handler } = setup(overrides); const response = await handler(request({ email: 'a@b.uk', ids: ['job:c'] })); assert.equal(response.status, expected); assert.ok((await response.json()).error);
 }
});
test('rate cap expires without storing recipients in response', async () => {
 let now = 0; const { handler, calls } = setup({ now: () => now, rateLimit: 1, rateWindowMs: 100 }); const body = { email: 'a@b.uk', ids: ['job:c'] };
 assert.equal((await handler(request(body))).status, 200); assert.equal((await handler(request(body))).status, 429); now = 101; assert.equal((await handler(request(body))).status, 200); assert.equal(calls.length, 2);
});
test('renderer escapes content, keeps conditions/subject, supplied colours, honest basis, ABZ, and task labels', () => {
 const mail = renderCareerEmail(reports, { bookingUrl: 'https://example.com/book?a=1&b=2' });
 assert.match(mail.html, /&lt;English &amp; media&gt;/); assert.doesNotMatch(mail.html, /<script>/); assert.match(mail.html, /a=1&amp;b=2/); assert.match(mail.text, /Based on 1 linked career/); assert.match(mail.text, /Example from: English/); assert.match(mail.text, /Take training/); assert.match(mail.html, /#fae4dd/); assert.match(mail.html, /#e6eee3/); assert.match(mail.html, /#fff0d1/); assert.match(mail.text, /AI can help with this task/); assert.match(mail.text, /\[Yes\]/); assert.match(mail.text, /\[No\]/); assert.match(mail.text, /Plan A:/); assert.match(mail.text, /Your next step:/); assert.match(mail.html, /table role="presentation"/); assert.match(mail.text, /Not yet available/);
});
test('selection is server-owned and returns unique original objects', () => {
 assert.deepEqual(selectReports(['job:c', 'degree:a', 'job:c'], reports), [reports[2], reports[0]]);
});

test('Kit runs once after successful email acceptance, never on invalid inputs or failed sends', async () => {
 const signed = [];
 const { handler } = setup({ subscribe: async (email) => { signed.push(email); return true; } });
 assert.equal((await handler(request({ email: 'a@b.uk', ids: ['job:c'] }))).status, 200);
 assert.deepEqual(signed, ['a@b.uk']);
 await handler(request({ email: 'bad', ids: ['job:c'] }));
 assert.equal(signed.length, 1);
 const failed = setup({ subscribe: async () => { throw new Error('must not call'); }, fetchImpl: async () => Response.json({}, { status: 500 }) });
 assert.equal((await failed.handler(request({ email: 'a@b.uk', ids: ['job:c'] }))).status, 502);
});
test('Kit failure retains report success and returns a clear warning', async () => {
 const { handler } = setup({ subscribe: async () => false });
 const result = await (await handler(request({ email: 'a@b.uk', ids: ['job:c'] }))).json();
 assert.equal(result.ok, true); assert.match(result.warning, /could not add you/);
});
