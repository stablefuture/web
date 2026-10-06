import test from 'node:test';
import assert from 'node:assert/strict';
import { createAdviceHandler } from '../../lib/advice.mjs';

const good = { name: 'Sam Parent', email: ' sam@example.com ', situation: 'My son is in Year 12 and likes chemistry.' };
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
  assert.doesNotMatch(mail.text, /Phone:/);
  assert.match(mail.text, /Year 12/);
  assert.match(mail.subject, /Sam Parent/);
});

test('invalid fields, honeypot, and bad JSON never contact the provider', async () => {
  for (const body of [{ ...good, name: '' }, { ...good, email: 'nope' }, { ...good, situation: 'hi' }, { ...good, situation: 'x'.repeat(3001) }, { ...good, website: 'spam' }, '{broken']) {
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

test('old phone input is discarded', async () => {
 const { handler, calls } = setup();
 assert.equal((await handler(request({ ...good, phone: '07700 900123' }))).status, 200);
 assert.doesNotMatch(calls[0][1].body, /07700|Phone/);
});
