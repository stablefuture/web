// "Get advice" enquiries from the landing page. Sends one plain email to Ben
// with the parent as reply-to. Nothing is stored. Same guards as the career check.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean = (value, max) => typeof value === 'string' ? value.replace(/\r/g, '').trim().slice(0, max + 1) : '';

export function parseAdvice(body) {
  if (!body || typeof body !== 'object' || body.website) throw new Error('Please check the form.');
  const name = clean(body.name, 100).replace(/\n/g, ' ');
  const email = clean(body.email, 254);
  const situation = clean(body.situation, 3000);
  if (!name || name.length > 100) throw new Error('Please add your name.');
  if (email.length > 254 || !EMAIL.test(email)) throw new Error('Enter a valid email address.');
  if (situation.length < 10) throw new Error('Tell us a little about your child’s situation.');
  if (situation.length > 3000) throw new Error('Please keep it under 3,000 characters.');
  return { name, email, situation };
}

/**
 * @param {{ apiKey?: string, fetchImpl?: typeof fetch, to?: string, from?: string, now?: () => number, rateLimit?: number, rateWindowMs?: number }} options
 */
export function createAdviceHandler({ apiKey, fetchImpl = fetch, to = 'ben@stablefuture.uk', from = 'Stable Future website <talk@stablefuture.uk>', now = Date.now, rateLimit = 5, rateWindowMs = 15 * 60 * 1000 } = {}) {
  const attempts = new Map();
  const json = (data, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
  return async function handle(request) {
    if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
    const origin = request.headers.get('origin');
    if (!origin || origin !== new URL(request.url).origin) return json({ error: 'Please send the form from this website.' }, 403);
    const time = now();
    for (const [key, item] of attempts) if (item.until <= time) attempts.delete(key);
    const client = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const item = attempts.get(client) || { count: 0, until: time + rateWindowMs };
    if (item.count >= rateLimit || attempts.size > 10000) return json({ error: 'Please wait a little before sending another message.' }, 429);
    item.count++; attempts.set(client, item);
    let enquiry;
    try {
      const raw = await request.text();
      if (raw.length > 8000) throw new Error('Please check the form.');
      enquiry = parseAdvice(JSON.parse(raw));
    } catch (error) {
      return json({ error: error instanceof SyntaxError ? 'Please check the form.' : error.message }, 400);
    }
    if (!apiKey) return json({ error: 'The form is temporarily unavailable. Please email ben@stablefuture.uk.' }, 503);
    const text = ['Call enquiry — a time has not yet been booked.', '', `Name: ${enquiry.name}`, `Email: ${enquiry.email}`, '', 'Situation:', enquiry.situation].join('\n');
    try {
      const response = await fetchImpl('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from, to: [to], reply_to: enquiry.email, subject: `Advice enquiry: ${enquiry.name}`.slice(0, 140), text, tags: [{ name: 'type', value: 'advice_enquiry' }] }), signal: AbortSignal.timeout(15000) });
      const result = await response.json().catch(() => null);
      if (!response.ok || typeof result?.id !== 'string') return json({ error: 'We could not send your message. Please try again, or email ben@stablefuture.uk.' }, 502);
      return json({ ok: true });
    } catch {
      return json({ error: 'We could not send your message. Please try again, or email ben@stablefuture.uk.' }, 502);
    }
  };
}
