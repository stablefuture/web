// Server-only: each paying family gets a personal Pathfinder link, so answers attach to the
// parent's Stripe customer without the student typing anything. The token is the customer id
// plus an HMAC derived from the Stripe key; it reveals nothing about the family.
import { createHmac, timingSafeEqual } from 'node:crypto';

const sign = (id, key) => createHmac('sha256', key.trim()).update(`pathfinder:${id}`).digest('base64url').slice(0, 22);

export function pathfinderToken(customerId, key = process.env.STRIPE_SECRET_KEY || '') {
  if (!/^cus_[A-Za-z0-9]+$/.test(customerId) || !key.trim()) return '';
  return `${customerId.slice(4)}.${sign(customerId, key)}`;
}

/** Returns the Stripe customer id for a valid token, otherwise null. */
export function readPathfinderToken(token, key = process.env.STRIPE_SECRET_KEY || '') {
  const match = /^([A-Za-z0-9]{6,40})\.([A-Za-z0-9_-]{22})$/.exec(typeof token === 'string' ? token : '');
  if (!match || !key.trim()) return null;
  const id = `cus_${match[1]}`;
  return timingSafeEqual(Buffer.from(match[2]), Buffer.from(sign(id, key))) ? id : null;
}
