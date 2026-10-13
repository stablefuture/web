// Server-only: a few Stripe REST calls without the SDK. Never log responses; they hold customer data.
import { PLAN, PLAN_TERMS_VERSION } from './plan-terms.mjs';

function encode(params, prefix = '', out = new URLSearchParams()) {
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    const name = prefix ? `${prefix}[${key}]` : key;
    if (typeof value === 'object') encode(value, name, out);
    else out.append(name, String(value));
  }
  return out;
}

/**
 * @param {string} path
 * @param {{ method?: string, params?: Record<string, any>, key?: string, fetchImpl?: typeof fetch }} [options]
 */
export async function stripe(path, { method = 'GET', params, key = process.env.STRIPE_SECRET_KEY, fetchImpl = fetch } = {}) {
  if (!key?.trim()) throw new Error('Stripe is not configured.');
  const body = params ? encode(params) : undefined;
  const url = `https://api.stripe.com/v1/${path}${method === 'GET' && body ? `?${body}` : ''}`;
  const response = await fetchImpl(url, {
    method,
    headers: { Authorization: `Bearer ${key.trim()}`, ...(method === 'GET' ? {} : { 'Content-Type': 'application/x-www-form-urlencoded' }) },
    body: method === 'GET' ? undefined : body,
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data?.error?.message || 'Stripe request failed.'), { stripe: data?.error });
  return data;
}

// Checkout in setup mode saves a card for a later off-session charge. Nothing is charged now.
export function createPlanCheckout({ origin, acceptedAt, student = '', ...options }) {
  return stripe('checkout/sessions', {
    method: 'POST',
    ...options,
    params: {
      mode: 'setup',
      currency: 'gbp',
      payment_method_types: ['card'],
      customer_creation: 'always',
      success_url: `${origin}/plan/confirmed?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/plan`,
      custom_text: { submit: { message: `Nothing is charged today. You authorise Stable Future to charge £${PLAN.price} to this card 48 hours after your results call, unless you claim the guarantee. Terms: stablefuture.uk/terms` } },
      metadata: { product: PLAN.id, terms: PLAN_TERMS_VERSION, accepted_at: acceptedAt, student },
      setup_intent_data: { description: PLAN.name, metadata: { product: PLAN.id, terms: PLAN_TERMS_VERSION, accepted_at: acceptedAt, student } },
    },
  });
}

export function getPlanCheckout(id, options = {}) {
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(id || '')) return Promise.resolve(null);
  return stripe(`checkout/sessions/${id}`, { ...options, params: { expand: ['setup_intent', 'customer'] } });
}
