import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPathfinderHandler, interestProfile } from './pathfinder-submit.mjs';
import { confirmPlanSignup, planEmail } from './plan-signup.mjs';
import { formatLeadAlert } from './lead-alerts.mjs';
import { AREAS, parseAnswers } from '../pathfinder/questions.mjs';
import { pathfinderToken, readPathfinderToken } from './pathfinder-link.mjs';
import { deleteExpiredAnswers } from './pathfinder-cleanup.mjs';

const QUESTIONS = Array.from({ length: 60 }, (_, i) => [`Activity ${i}`, Math.floor(i / 10)]);
const DIMENSIONS = ['Practical', 'Analytical', 'Creative', 'People-focused', 'Enterprising', 'Organised'];
const valid = () => ({ name: 'Sam', email: 'Parent@Example.com', stage: 'Year 13', ideas: 'A few ideas', ideasText: 'Criminology', values: ['pay', 'independence', 'Variety', 'quick', 'openings'], reflect: { support: '  Someone checking in  ', bogus: 'x' }, activities: QUESTIONS.map((_, i) => (i % 5) + 1), areas: ['1.B.3.ao', '1.B.3.n', '1.B.3.y', 'bogus'], topAreas: ['1.B.3.ao', 'nope'], preferences: { team: 1, outdoors: 9 }, next: { University: 1, 'Straight into work': -1, Bogus: 1 }, avoidAreas: ['1.B.3.ao', '1.B.3.a'] });
const request = (body, origin = 'http://localhost') => new Request('http://localhost/api/pathfinder', { method: 'POST', headers: { origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

test('parseAnswers keeps only known values and caps rankings at three', () => {
  const a = parseAnswers(valid(), { areaIds: AREAS.map(([id]) => id) });
  assert.equal(a.email, 'parent@example.com');
  assert.deepEqual(a.values, ['pay', 'independence', 'quick']);
  assert.deepEqual(a.reflect, { support: 'Someone checking in' });
  assert.deepEqual(a.areas, ['1.B.3.ao', '1.B.3.n', '1.B.3.y']);
  assert.throws(() => parseAnswers({ ...valid(), areas: ['1.B.3.ao'] }, { areaIds: AREAS.map(([id]) => id) }), /three/);
  assert.equal(parseAnswers({ ...valid(), email: '' }, { areaIds: AREAS.map(([id]) => id), linked: true }).email, '');
  assert.deepEqual(a.topAreas, ['1.B.3.ao']);
  assert.deepEqual(a.preferences, { team: 1 });
  assert.deepEqual(a.next, { University: 1, 'Straight into work': -1 });
  assert.deepEqual(a.avoidAreas, ['1.B.3.a']);
  assert.throws(() => parseAnswers({ ...valid(), activities: [1] }), /every activity/);
  assert.throws(() => parseAnswers({ ...valid(), email: 'x' }), /email/);
});

test('interest profile sums each RIASEC area from 10 to 50', () => {
  const p = interestProfile(QUESTIONS.map(q => (q[1] === 3 ? 5 : 1)), QUESTIONS, DIMENSIONS);
  assert.deepEqual(p[0], { name: 'People-focused', score: 50 });
  assert.equal(p.at(-1).score, 10);
});

test('pathfinder handler stores, emails Ben with JSON attached, and alerts', async () => {
  const calls = [], alerts = [];
  const fetchImpl = async (url, init) => { calls.push({ url, body: init.body }); return new Response('{}', { status: 200 }); };
  const handle = createPathfinderHandler({ questions: QUESTIONS, dimensions: DIMENSIONS, apiKey: 're_test', supabaseUrl: 'https://x.supabase.co', supabaseKey: 'sb', fetchImpl, alert: lead => alerts.push(lead) });
  const response = await handle(request(valid()));
  assert.equal(response.status, 200);
  assert.match(calls[0].url, /storage\/v1\/object\/pathfinder-responses\/\d{4}-\d\d-\d\d\//);
  const email = JSON.parse(calls[1].body);
  assert.deepEqual(email.to, ['ben@stablefuture.uk']);
  assert.match(email.text, /TOP INTEREST AREAS\n1\. Law/);
  assert.match(email.text, /Would consider: University\nRuled out: Straight into work/);
  assert.match(email.text, /Freedom to make my own decisions \(O\*NET 1\.B\.2\.f Independence\)/);
  assert.match(email.text, /What helps you do your best\?\n  Someone checking in/);
  assert.equal(email.attachments.length, 1);
  assert.equal(alerts[0].top, 'Law');
  assert.match(formatLeadAlert(alerts[0]), /^PATHFINDER\n/);
});

test('pathfinder handler rejects other origins and reports total failure', async () => {
  const handle = createPathfinderHandler({ questions: QUESTIONS, dimensions: DIMENSIONS, fetchImpl: async () => new Response('', { status: 500 }), apiKey: 'k', supabaseUrl: 'https://x', supabaseKey: 'k' });
  assert.equal((await handle(request(valid(), 'https://evil.example'))).status, 403);
  assert.equal((await handle(request(valid()))).status, 503);
});

test('plan signup emails the terms once and marks the card confirmed', async () => {
  const calls = [], alerts = [];
  const session = { status: 'complete', customer: { id: 'cus_TEST123' }, metadata: { product: 'abz-plan', student: 'Sam' }, customer_details: { email: 'parent@example.com', name: 'Alex Parent' }, setup_intent: { id: 'seti_1', metadata: {} } };
  const fetchImpl = async (url, init = {}) => { calls.push({ url: String(url), method: init.method || 'GET', body: init.body }); return new Response(JSON.stringify(String(url).includes('checkout/sessions') ? session : {}), { status: 200 }); };
  process.env.STRIPE_SECRET_KEY ||= 'sk_test_x';
  const result = await confirmPlanSignup('cs_test_abc', { apiKey: 're_test', fetchImpl, alert: async lead => { alerts.push(lead); return true; } });
  assert.deepEqual(result, { email: 'parent@example.com', name: 'Alex Parent', student: 'Sam', path: `/pathfinder?k=${pathfinderToken('cus_TEST123')}` });
  assert.equal(readPathfinderToken(result.path.split('k=')[1]), 'cus_TEST123');
  const email = JSON.parse(calls.find(c => c.url.includes('resend')).body);
  assert.match(email.text, /Satisfaction guarantee/);
  assert.ok(email.text.includes(`https://www.stablefuture.uk${result.path}`));
  assert.ok(calls.some(c => c.url.endsWith('customers/cus_TEST123') && String(c.body).includes('student')));
  assert.match(String(calls.at(-1).body), /metadata%5Bconfirmed%5D=yes/);
  assert.equal(alerts[0].emailed, true);
  session.setup_intent.metadata.confirmed = 'yes';
  calls.length = 0;
  await confirmPlanSignup('cs_test_abc', { apiKey: 're_test', fetchImpl, alert: async () => true });
  assert.equal(calls.length, 1);
  assert.equal(await confirmPlanSignup('not-a-session', { fetchImpl }), null);
  assert.match(planEmail({ name: 'Alex Parent', student: 'Sam' }).text, /^Hi Alex,/);
});

test('personal links verify only with the same key', () => {
  const token = pathfinderToken('cus_ABC123xyz', 'sk_test_one');
  assert.equal(readPathfinderToken(token, 'sk_test_one'), 'cus_ABC123xyz');
  assert.equal(readPathfinderToken(token, 'sk_test_two'), null);
  assert.equal(readPathfinderToken(token.replace(/.$/, c => c === 'A' ? 'B' : 'A'), 'sk_test_one'), null);
  assert.equal(readPathfinderToken('junk', 'sk_test_one'), null);
});

test('a personal link fills in the parent and marks Pathfinder complete', async () => {
  const calls = [], marked = [];
  const fetchImpl = async (url, init) => { calls.push({ url, body: init.body }); return new Response('{}', { status: 200 }); };
  const handle = createPathfinderHandler({ questions: QUESTIONS, dimensions: DIMENSIONS, apiKey: 're_test', supabaseUrl: 'https://x.supabase.co', supabaseKey: 'sb', fetchImpl,
    readToken: k => k === 'good' ? 'cus_1' : null, lookupParent: async () => ({ email: 'alex@example.com', name: 'Alex Parent', student: 'Sam' }), markComplete: async id => marked.push(id) });
  assert.equal((await handle(request({ ...valid(), email: '', k: 'good' }))).status, 200);
  const stored = JSON.parse(calls[0].body);
  assert.equal(stored.match, 'link');
  assert.equal(stored.answers.email, 'alex@example.com');
  assert.match(JSON.parse(calls[1].body).text, /Parent: Alex Parent <alex@example.com> \(matched by their personal link\)/);
  assert.deepEqual(marked, ['cus_1']);
  calls.length = 0;
  assert.equal((await handle(request({ ...valid(), email: '', k: 'broken' }))).status, 200);
  assert.equal(JSON.parse(calls[0].body).match, 'failed');
});

test('cleanup deletes only days older than 10 years', async () => {
  const deleted = [];
  const fetchImpl = async (url, init) => {
    const body = JSON.parse(init.body);
    if (init.method === 'DELETE') { deleted.push(...body.prefixes); return new Response('[]'); }
    return Response.json(body.prefix === '' ? [{ name: '2016-10-12' }, { name: '2016-10-14' }, { name: '2025-10-12' }, { name: 'junk' }] : [{ name: 'a.json' }, { name: 'b.json' }]);
  };
  const n = await deleteExpiredAnswers({ supabaseUrl: 'https://x', supabaseKey: 'k', now: Date.parse('2026-10-13T12:00:00Z'), fetchImpl });
  assert.equal(n, 2);
  assert.deepEqual(deleted, ['2016-10-12/a.json', '2016-10-12/b.json']);
});
