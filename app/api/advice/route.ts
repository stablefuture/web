import { after } from 'next/server';
import { sendLeadAlert } from '../../lib/lead-alerts.mjs';
import { createAdviceHandler } from '../../lib/advice.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const post = createAdviceHandler({ notify: (lead) => after(async () => { await sendLeadAlert(lead); }), apiKey: process.env.RESEND_API_KEY });
export async function POST(request: Request) { return post(request); }
