import test from 'node:test';
import assert from 'node:assert/strict';
import { createAdviceHandler } from '../../lib/advice.mjs';

const good = { name: 'Sam Parent', email: ' sam@example.com ', phone: '07700 900123', situation: 'My son is in Year 12 and likes chemistry.' };
const request = (body, headers = {}) => new Request('https://stablefuture.uk/api/advice', { method: 'POST', headers: { origin: 'https://stablefuture.uk', 'Content-Type': 'application/json', 'x-forwarded-for': 'test', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) });
function setup(overrides = {}) {
  const calls = [];
  const handler = createAdviceHandler({ apiKey: 'test-only', fetchImpl: async (...args) => { calls.push(args); return Response.json({ id: 'mock' }); }, ...overrides });
  return { handler, calls };
}

test('a valid enquiry sends one email to Ben with the parent as reply-to', async () => {
  const { handler, calls } = setup();
  const response = await handler(request(good));
  assert.equal(response.status, 200);
  assert.equal(calls.length, 1);
  const mail = JSON.parse(calls[0][1].body);
  assert.deepEqual(mail.to, ['ben@stablefuture.uk']);
  assert.equal(mail.reply_to, 'sam@example.com');
  assert.match(mail.text, /07700 900123/);
  assert.match(mail.text, /Year 12/);
  assert.match(mail.subject, /Sam Parent/);
});

test('invalid fields, honeypot, and bad JSON never contact the provider', async () => {
  for (const body of [{ ...good, name: '' }, { ...good, email: 'nope' }, { ...good, phone: 'call me' }, { ...good, phone: '123' }, { ...good, situation: 'hi' }, { ...good, situation: 'x'.repeat(3001) }, { ...good, website: 'spam' }, '{broken']) {
    const { handler, calls } = setup();
    assert.equal((await handler(request(body))).status, 400);
    assert.equal(calls.length, 0);
  }
});

test('origin, method, missing key, and provider failure guards', async () => {
  const { handler } = setup({ rateLimit: 50 });
  assert.equal((await handler(request(good, { origin: 'https://other.uk' }))).status, 403);
  assert.equal((await handler(new Request('https://stablefuture.uk/api/advice'))).status, 405);
  assert.equal((await setup({ apiKey: '' }).handler(request(good))).status, 503);
  assert.equal((await setup({ fetchImpl: async () => Response.json({}, { status: 500 }) }).handler(request(good))).status, 502);
  assert.equal((await setup({ fetchImpl: async () => { throw new Error('net'); } }).handler(request(good))).status, 502);
});

test('rate limit applies per client', async () => {
  const { handler } = setup({ rateLimit: 1 });
  assert.equal((await handler(request(good))).status, 200);
  assert.equal((await handler(request(good))).status, 429);
});

test('alerts only accepted enquiries and alert scheduling failure does not break submission', async () => {
 const leads = [];
 const { handler } = setup({ notify: lead => leads.push(lead) });
 await handler(request(good));
 assert.equal(leads.length, 1); assert.equal(leads[0].phone, good.phone); assert.equal(leads[0].situation, good.situation);
 await handler(request({ ...good, website: 'bot' })); assert.equal(leads.length, 1);
 await setup({ notify: lead => leads.push(lead), fetchImpl: async () => Response.json({}, { status: 500 }) }).handler(request(good));
 assert.equal(leads.length, 1);
 const old = console.error; console.error = () => {};
 try { assert.equal((await setup({ notify: () => { throw new Error('unavailable'); } }).handler(request(good))).status, 200); } finally { console.error = old; }
});
