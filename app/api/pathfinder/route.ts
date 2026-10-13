import { after } from 'next/server';
import { DIMENSIONS, QUESTIONS } from '../../assessment/model';
import { createPathfinderHandler } from '../../lib/pathfinder-submit.mjs';
import { sendLeadAlert } from '../../lib/lead-alerts.mjs';
import { readPathfinderToken } from '../../lib/pathfinder-link.mjs';
import { stripe } from '../../lib/stripe.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const post = createPathfinderHandler({
  questions: QUESTIONS,
  dimensions: [...DIMENSIONS],
  apiKey: process.env.RESEND_API_KEY,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SECRET_KEY,
  alert: (lead: Parameters<typeof sendLeadAlert>[0]) => after(async () => { await sendLeadAlert(lead); }),
  readToken: readPathfinderToken,
  lookupParent: async (id: string) => {
    const customer = await stripe(`customers/${id}`);
    return customer?.deleted ? null : { email: customer.email || '', name: customer.name || '', student: customer.metadata?.student || '' };
  },
  // Records the guarantee's first condition on the parent's Stripe customer.
  markComplete: (id: string) => stripe(`customers/${id}`, { method: 'POST', params: { metadata: { pathfinder_completed: new Date().toISOString().slice(0, 10) } } }),
});
export async function POST(request: Request) { return post(request); }
