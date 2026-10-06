import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { bookingAlert, createCalWebhookHandler } from './cal-booking.mjs';

const payload = { eventTypeId: 7364132, status: 'ACCEPTED', startTime: '2026-10-07T17:00:00Z', attendees: [{ name: 'Sam Parent', email: 'SAM@example.com' }], responses: { notes: { value: 'Choosing between science courses.' } }, videoCallData: { url: 'https://meet.google.com/abc-defg-hij' } };
const request = (body, secret = 'test') => {
  const raw = typeof body === 'string' ? body : JSON.stringify(body);
  return new Request('https://www.stablefuture.uk/api/cal-webhook', { method: 'POST', headers: { 'x-cal-signature-256': createHmac('sha256', secret).update(raw).digest('hex') }, body: raw });
};

test('signed confirmed booking adds to Kit and schedules one booking alert', async () => {
  const subscriptions = [], alerts = [];
  const handler = createCalWebhookHandler({ secret: 'test\n', subscribe: async (...args) => { subscriptions.push(args); return true; }, notify: lead => alerts.push(lead) });
  assert.equal((await handler(request({ triggerEvent: 'BOOKING_CREATED', payload }))).status, 200);
  assert.deepEqual(subscriptions, [['sam@example.com', 'Sam']]);
  assert.equal(alerts.length, 1);
  assert.match(alerts[0].when, /18:00/);
  assert.equal(alerts[0].situation, payload.responses.notes.value);
  assert.equal(alerts[0].meetUrl, payload.videoCallData.url);
});

test('invalid signature, malformed JSON, and other events never contact Kit or Telegram', async () => {
  let calls = 0;
  const handler = createCalWebhookHandler({ secret: 'test', subscribe: async () => { calls++; return true; }, notify: () => calls++ });
  assert.equal((await handler(request({ triggerEvent: 'BOOKING_CREATED', payload }, 'wrong'))).status, 401);
  assert.equal((await handler(request('{bad'))).status, 400);
  assert.equal((await handler(request({ triggerEvent: 'BOOKING_REQUESTED', payload }))).status, 200);
  assert.equal(calls, 0);
});

test('failed Kit delivery returns a retryable response without a premature alert', async () => {
  let alerts = 0;
  const handler = createCalWebhookHandler({ secret: 'test', subscribe: async () => false, notify: () => alerts++ });
  assert.equal((await handler(request({ triggerEvent: 'BOOKING_CREATED', payload }))).status, 502);
  assert.equal(alerts, 0);
});

test('only accepted strategy bookings alert, dates respect GMT/BST, and unsafe links stay out', () => {
  for (const change of [{ status: 'PENDING' }, { eventTypeId: 42 }, { startTime: 'bad' }]) assert.equal(bookingAlert({ ...payload, ...change }), null);
  assert.match(bookingAlert({ ...payload, startTime: '2026-11-07T17:00:00Z' }).when, /17:00/);
  assert.equal(bookingAlert({ ...payload, videoCallData: { url: 'javascript:alert(1)' } }).meetUrl, '');
  assert.equal(bookingAlert({ ...payload, responses: {}, additionalNotes: 'Other notes' }).situation, 'Other notes');
});
