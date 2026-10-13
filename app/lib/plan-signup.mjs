// Server-only: confirm a saved card, email the parent a copy of the terms, and alert Ben once.
import { getPlanCheckout, stripe } from './stripe.mjs';
import { sendLeadAlert } from './lead-alerts.mjs';
import { PLAN, PLAN_GUARANTEE, planTermsText } from './plan-terms.mjs';
import { pathfinderToken } from './pathfinder-link.mjs';

const clean = (value, max) => typeof value === 'string' ? value.replace(/[\r\n]/g, ' ').trim().slice(0, max) : '';

export function planEmail({ name, student, link = 'https://www.stablefuture.uk/pathfinder' }) {
  const first = name.split(' ')[0];
  const text = [
    `Hi${first ? ` ${first}` : ''},`,
    '',
    `Thank you for signing up for the ${PLAN.name}. Your card is saved and nothing has been charged.`,
    '',
    'What happens next:',
    `1. ${student || 'Your son or daughter'} completes Pathfinder (about 15 minutes). Their personal link: ${link}`,
    '2. I analyse the answers and email you to arrange the results call.',
    `3. On the call, we build the A/B/Z plan together. I charge £${PLAN.price} 48 hours after the call.`,
    '',
    PLAN_GUARANTEE,
    '',
    'Just reply to this email with any questions.',
    '',
    'Ben',
    '',
    '—',
    'Your copy of the terms',
    '',
    planTermsText(),
  ].join('\n');
  return { subject: `You’re booked in: ${PLAN.name}`, text };
}

/**
 * @param {string} sessionId
 * @param {{ apiKey?: string, from?: string, fetchImpl?: typeof fetch, alert?: (lead: any) => Promise<boolean> }} [options]
 */
export async function confirmPlanSignup(sessionId, { apiKey = process.env.RESEND_API_KEY, from = 'Ben at Stable Future <talk@stablefuture.uk>', fetchImpl = fetch, alert = sendLeadAlert } = {}) {
  const session = await getPlanCheckout(sessionId, { fetchImpl });
  if (!session || session.status !== 'complete' || session.metadata?.product !== PLAN.id) return null;
  const email = clean(session.customer_details?.email, 254);
  const name = clean(session.customer_details?.name, 100);
  const student = clean(session.metadata?.student, 60);
  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id || '';
  const token = pathfinderToken(customerId);
  const path = token ? `/pathfinder?k=${token}` : '/pathfinder';
  const intent = session.setup_intent;
  if (intent && intent.metadata?.confirmed !== 'yes') {
    let sent = false;
    if (apiKey && email) {
      try {
        const response = await fetchImpl('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from, to: [email], reply_to: 'ben@stablefuture.uk', bcc: ['ben@stablefuture.uk'], ...planEmail({ name, student, link: `https://www.stablefuture.uk${path}` }), tags: [{ name: 'type', value: 'plan_signup' }] }),
          signal: AbortSignal.timeout(15000),
        });
        sent = response.ok;
      } catch { /* reported below */ }
    }
    if (!sent) console.error('Plan confirmation email failed.');
    await alert({ type: 'plan', name, email, student, emailed: sent });
    if (customerId) await stripe(`customers/${customerId}`, { method: 'POST', fetchImpl, params: { metadata: { product: PLAN.id, student } } }).catch(() => console.error('Could not label the Stripe customer.'));
    await stripe(`setup_intents/${intent.id}`, { method: 'POST', fetchImpl, params: { metadata: { confirmed: 'yes' } } });
  }
  return { email, name, student, path };
}
