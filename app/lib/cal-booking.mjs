import { createHmac, timingSafeEqual } from 'node:crypto';

const text = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const oneLine = (value, max) => text(value, max).replace(/[\r\n]/g, ' ');

export function bookingAlert(payload) {
  if (payload?.eventTypeId !== 7364132 || payload.status !== 'ACCEPTED') return null;
  const attendee = payload.attendees?.[0];
  const start = new Date(payload.startTime);
  if (!attendee?.email || !Number.isFinite(start.getTime())) return null;
  const when = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(start);
  const candidates = [payload.videoCallData?.url, payload.metadata?.videoCallUrl, payload.location];
  const meetUrl = candidates.find(value => typeof value === 'string' && /^https:\/\/meet\.google\.com\/[a-z-]+$/.test(value)) || '';
  return {
    type: 'booking', name: oneLine(attendee.name, 100), email: oneLine(attendee.email, 254),
    title: 'Future-Proof Career Strategy', when, meetUrl,
    situation: text(payload.responses?.notes?.value ?? payload.additionalNotes, 3000),
  };
}

/** @param {{ secret?: string, subscribe: (email: string, firstName: string) => Promise<boolean>, notify?: (lead: any) => void }} options */
export function createCalWebhookHandler({ secret, subscribe, notify = () => {} }) {
  return async request => {
    if (!secret?.trim()) return new Response('Not configured', { status: 500 });
    const raw = await request.text();
    const signature = request.headers.get('x-cal-signature-256') || '';
    const expected = createHmac('sha256', secret.trim()).update(raw).digest();
    if (!/^[a-f\d]{64}$/i.test(signature) || !timingSafeEqual(Buffer.from(signature, 'hex'), expected)) {
      return new Response('Invalid signature', { status: 401 });
    }
    let body;
    try { body = JSON.parse(raw); } catch { return new Response('Bad payload', { status: 400 }); }
    if (body?.triggerEvent !== 'BOOKING_CREATED') return new Response('Ignored');
    const payload = body.payload;
    const attendee = payload?.attendees?.[0];
    const email = text(attendee?.email, 254).toLowerCase();
    if (!email) return new Response('No attendee email');
    // Only call-related contacts go to Kit. Telegram runs after Kit succeeds so a
    // failed Kit delivery can be retried without sending the alert each time.
    const ok = await subscribe(email, oneLine(attendee?.name, 100).split(' ')[0]);
    if (!ok) return new Response('Kit error', { status: 502 });
    const lead = bookingAlert(payload);
    if (lead) {
      try { notify(lead); } catch { console.error('Could not schedule booking alert.'); }
    }
    return new Response('OK');
  };
}
