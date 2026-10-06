import { after } from 'next/server';
import { subscribeViaKit } from '@/app/lib/kit';
import { createCalWebhookHandler } from '@/app/lib/cal-booking.mjs';
import { sendLeadAlert } from '@/app/lib/lead-alerts.mjs';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const handler = createCalWebhookHandler({
    secret: process.env.CAL_WEBHOOK_SECRET,
    subscribe: (email: string, firstName: string) => subscribeViaKit(email, process.env.KIT_BOOKINGS_FORM_ID, firstName),
    notify: (lead: Parameters<typeof sendLeadAlert>[0]) => after(async () => { await sendLeadAlert(lead); }),
  });
  return handler(request);
}
