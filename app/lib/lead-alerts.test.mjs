import test from 'node:test';
import assert from 'node:assert/strict';
import { formatLeadAlert, sendLeadAlert } from './lead-alerts.mjs';

test('advice alert includes contact details and the requested situation', () => {
 const text = formatLeadAlert({ type: 'advice', name: 'Parent', phone: '07700 900123', email: 'parent@example.com', situation: 'private child details' });
 assert.match(text, /07700 900123/); assert.match(text, /parent@example.com/); assert.match(text, /private child details/);
});
test('opted-out report alerts contain no contact details and forbid outreach', () => {
 const text = formatLeadAlert({ type: 'career-check', email: 'private@example.com', marketing: false });
 assert.doesNotMatch(text, /private@example.com/); assert.match(text, /do not contact/);
});
test('Telegram accepts plain text and requires provider confirmation', async () => {
 let sent;
 const options = { token: 'test-token', chatId: '123', fetchImpl: async (url, init) => { sent = JSON.parse(init.body); return Response.json({ ok: true }); } };
 assert.equal(await sendLeadAlert({ type: 'career-check', email: '<a>@example.com', marketing: true }, options), true);
 assert.equal(sent.chat_id, '123'); assert.equal(sent.parse_mode, undefined);
 assert.match(sent.text, /<a>@example.com/);
 const old = console.error; const logs = []; console.error = (...args) => logs.push(args.join(' '));
 try {
  assert.equal(await sendLeadAlert({}, { ...options, fetchImpl: async () => { throw new Error('secret token'); } }), false);
  assert.equal(await sendLeadAlert({}, { ...options, fetchImpl: async () => Response.json({ ok: false }) }), false);
  assert.doesNotMatch(logs.join(' '), /secret token|test-token/);
 } finally { console.error = old; }
});

test('advice includes a Call lead button with the phone in a private URL fragment', async () => {
 const requests = [];
 const lead = { type: 'advice', name: 'Ben 😀 Phone: test', phone: '+44 7700 900123', email: 'test@example.com', situation: 'Test enquiry, not a real family.' };
 await sendLeadAlert(lead, { token: 'test', chatId: '123', fetchImpl: async (url, init) => { requests.push({url, body: JSON.parse(init.body)}); return Response.json({ ok: true }); } });
 const sent = requests[0].body;
 const entity = sent.entities[0]; assert.equal(entity.type, 'phone_number');
 assert.equal(sent.text.slice(entity.offset, entity.offset + entity.length), lead.phone);
 assert.equal(sent.reply_markup.inline_keyboard[0][0].text, 'Call lead');
 const url = new URL(sent.reply_markup.inline_keyboard[0][0].url);
 assert.equal(url.search, '');
 assert.equal(decodeURIComponent(url.hash.slice(1)), '+447700900123');
 assert.equal(requests.length, 1);
});
