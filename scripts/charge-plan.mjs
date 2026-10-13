#!/usr/bin/env node
// Charge the £199 ABZ plan to a parent's saved card, 48 hours after the results call.
//   node --env-file=.env.local scripts/charge-plan.mjs parent@example.com          (dry run)
//   node --env-file=.env.local scripts/charge-plan.mjs parent@example.com --yes    (charge)
// Live keys also need --live, so a test run can never charge a real card by accident.
import { stripe } from '../app/lib/stripe.mjs';
import { PLAN } from '../app/lib/plan-terms.mjs';

const [email, ...flags] = process.argv.slice(2);
const key = process.env.STRIPE_SECRET_KEY || '';
if (!email?.includes('@')) { console.error('Usage: charge-plan.mjs parent@example.com [--yes] [--live]'); process.exit(1); }
if (/_live_/.test(key) && !flags.includes('--live')) { console.error('This is a live key. Add --live to charge a real card.'); process.exit(1); }

const customers = (await stripe('customers', { params: { email: email.toLowerCase(), limit: 10 } })).data;
const saved = [];
for (const customer of customers) {
  const intents = (await stripe('setup_intents', { params: { customer: customer.id, limit: 10 } })).data;
  for (const intent of intents) if (intent.status === 'succeeded' && intent.metadata?.product === PLAN.id) saved.push({ customer, intent });
}
if (!saved.length) { console.error(`No saved ABZ plan card for ${email}.`); process.exit(1); }
const { customer, intent } = saved.sort((a, b) => b.intent.created - a.intent.created)[0];
const paid = (await stripe('payment_intents', { params: { customer: customer.id, limit: 20 } })).data
  .filter(p => p.metadata?.product === PLAN.id && p.status === 'succeeded');
if (paid.length) { console.error(`Already charged on ${new Date(paid[0].created * 1000).toLocaleString('en-GB')}.`); process.exit(1); }

const student = intent.metadata?.student || 'the student';
console.log(`${key.includes('_live_') ? 'LIVE' : 'TEST'}: £${PLAN.price} to ${customer.name || email} for ${student} (terms ${intent.metadata?.terms}).`);
if (!flags.includes('--yes')) { console.log('Dry run. Add --yes to charge.'); process.exit(0); }

try {
  const payment = await stripe('payment_intents', {
    method: 'POST',
    params: {
      amount: PLAN.price * 100, currency: 'gbp', customer: customer.id, payment_method: intent.payment_method,
      off_session: true, confirm: true, description: `${PLAN.name} for ${student}`,
      receipt_email: customer.email || email, metadata: { product: PLAN.id, student, terms: intent.metadata?.terms || '' },
    },
  });
  console.log(`Charged: ${payment.status}. Stripe emails the receipt.`);
} catch (error) {
  // authentication_required: the bank wants the parent to confirm. Send them a Stripe payment link instead.
  console.error(`Not charged: ${error.stripe?.decline_code || error.stripe?.code || error.message}. Send a payment link from the Stripe dashboard.`);
  process.exit(1);
}
