import { createPlanCheckout } from '../../lib/stripe.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// The /plan form posts here; we send the parent to Stripe Checkout to save a card.
export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const back = (error: string) => Response.redirect(`${origin}/plan?error=${error}#signup`, 303);
  if (request.headers.get('origin') !== origin) return back('form');
  const form = await request.formData();
  if (form.get('accept') !== 'yes') return back('terms');
  const student = String(form.get('student') ?? '').replace(/[\r\n]/g, ' ').trim().slice(0, 60);
  if (!student) return back('student');
  try {
    const session = await createPlanCheckout({ origin, acceptedAt: new Date().toISOString(), student });
    return Response.redirect(session.url, 303);
  } catch {
    console.error('Could not start plan checkout.');
    return back('stripe');
  }
}
