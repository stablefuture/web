import test from 'node:test';
import assert from 'node:assert/strict';
import { formatLeadAlert, sendLeadAlert } from './lead-alerts.mjs';

test('advice alert includes contact details and the requested situation', () => {
 const text = formatLeadAlert({ type: 'advice', name: 'Parent', phone: '07700 900123', email: 'parent@example.com', situation: 'private child details' });
 assert.match(text, /07700 900123/); assert.match(text, /parent@example.com/); assert.match(text, /private child details/);
});
test('opted-out report alerts contain no contact details and forbid outreach', () => {
 const text = formatLeadAlert({ type: 'career-check', email: 'private@example.com', marketing: false });
 assert.doesNotMatch(text, /private@example.com/); assert.match(text, /Follow-up: Opted out/);
});
test('Telegram accepts plain text and requires provider confirmation', async () => {
 let sent;
 const options = { token: 'test-token', chatId: '123', fetchImpl: async (url, init) => { sent = JSON.parse(init.body); return Response.json({ ok: true }); } };
 assert.equal(await sendLeadAlert({ type: 'career-check', email: '<a>@example.com', marketing: true }, options), true);
 assert.deepEqual(sent.entities[0], { type: 'bold', offset: 0, length: 7 });
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
 const entity = sent.entities.find(item => item.type === 'phone_number'); assert.equal(entity.type, 'phone_number');
 assert.equal(sent.text.slice(entity.offset, entity.offset + entity.length), lead.phone);
 assert.equal(sent.reply_markup.inline_keyboard[0][0].text, 'Call lead');
 const url = new URL(sent.reply_markup.inline_keyboard[0][0].url);
 assert.equal(url.search, '');
 assert.equal(decodeURIComponent(url.hash.slice(1)), '+447700900123');
 assert.equal(requests.length, 1);
});

test('career reply buttons preserve draft text in fragments and respect opt-outs', async () => {
 let sent;
 const options = { token: 'test', chatId: '123', fetchImpl: async (_, init) => { sent = JSON.parse(init.body); return Response.json({ ok: true }); } };
 const lead = { type: 'career-check', email: 'ben+test@example.com', paths: ['Art & design'], marketing: true };
 await sendLeadAlert(lead, options);
 const url = new URL(sent.reply_markup.inline_keyboard[0][0].url);
 assert.equal(url.search, '');
 const draft = JSON.parse(decodeURIComponent(url.hash.slice(1)));
 assert.equal(draft.to, lead.email);
 assert.match(draft.body, /Art & design/);
 assert.match(draft.body, /^Hi! It's Ben here\./);
 assert.match(draft.body, /Cheers,\nBen$/);
 assert.doesNotMatch(draft.body, /https:|no thanks/);
 await sendLeadAlert({ ...lead, marketing: false }, options);
 assert.equal(sent.reply_markup, undefined);
 assert.doesNotMatch(JSON.stringify(sent), /ben\+test|Art & design/);
});

test('email page encodes draft fields and rejects recipient or subject header injection', async () => {
 const { readFileSync } = await import('node:fs');
 const { runInNewContext } = await import('node:vm');
 const html = readFileSync(new URL('../../public/email-lead.html', import.meta.url), 'utf8');
 const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
 function open(draft) {
  const elements = { compose: { hidden: true }, message: {}, preview: {} };
  const location = { hash: '#' + encodeURIComponent(JSON.stringify(draft)), pathname: '/email-lead.html' };
  let cleared = false;
  runInNewContext(script, { document: { getElementById: id => elements[id] }, location, history: { replaceState: () => { cleared = true; } } });
  assert.equal(cleared, true);
  return { elements, location };
 }
 const draft = { to: 'ben+test@example.com', subject: 'A & B?', body: 'Hello\n&bcc=bad@example.com <script>' };
 const good = open(draft);
 const link = new URL(good.location.href);
 assert.equal(link.protocol, 'mailto:');
 assert.equal(link.searchParams.get('body'), draft.body);
 assert.equal(link.searchParams.has('bcc'), false);
 assert.equal(good.elements.compose.hidden, false);
 for (const bad of [{ ...draft, to: 'ben@example.com?bcc=bad@example.com' }, { ...draft, subject: 'Hello\r\nBcc: bad@example.com' }]) {
  assert.equal(open(bad).location.href, undefined);
 }
});
