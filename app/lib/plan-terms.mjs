// The paid offer and its terms. Change PLAN_TERMS_VERSION whenever the terms change;
// each saved card records the version the parent accepted.
export const PLAN_TERMS_VERSION = '2026-10-13';
export const PLAN = { id: 'abz-plan', name: 'Future-Proof ABZ Plan', price: 199 };

export const PLAN_STEPS = [
  ['Save a card', 'Nothing is charged today.'],
  ['Pathfinder', 'Your son or daughter answers our career questions online. It takes about 15 minutes.'],
  ['Analysis', 'Ben matches their answers against UK data on careers, degrees, apprenticeships, pay, and AI.'],
  ['Results call', 'Ben takes you through the best options by video call, and you build an A/B/Z plan together.'],
];

export const PLAN_GUARANTEE = `If your son or daughter completes Pathfinder, you attend the results call, and you don’t think it was worth £${PLAN.price}, tell us within 48 hours of the call and you pay nothing.`;

export const PLAN_CONSENT = 'I agree to the terms. I ask Stable Future to start straight away, and I understand I lose my right to cancel once the service has been fully provided.';

// Plain-text terms used on /terms and in the confirmation email (a durable copy).
export const PLAN_TERMS = [
  ['Who we are', 'Stable Future is run by Ben Grime, 71–75 Shelton Street, Covent Garden, London WC2H 9JQ. Email ben@stablefuture.uk.'],
  ['What you get', `Your son or daughter (the student) answers Pathfinder, our online career questions. Ben analyses the answers against UK data on careers, degrees, apprenticeships, pay, and AI exposure. Ben then takes you through the best options on a video call, and you build an A/B/Z plan together: Plan A is the preferred route, Plan B an alternative, and Plan Z a fallback.`],
  ['Price and payment', `The price is £${PLAN.price} in total. You save a card when you sign up, and nothing is charged then. We charge £${PLAN.price} to that card 48 hours after the results call, unless you claim the guarantee. If the payment fails, we will email you a link to pay.`],
  ['Satisfaction guarantee', PLAN_GUARANTEE + ' Email ben@stablefuture.uk or tell Ben at the end of the call. The guarantee needs both: Pathfinder completed and the call attended.'],
  ['If Pathfinder is not completed', 'If Pathfinder is not completed within 30 days of saving your card, we cancel your booking, remove the card, and do not charge you.'],
  ['Rescheduling and missed calls', `You can move the call once, free, with at least 24 hours’ notice. If Pathfinder is complete and you miss the call without 24 hours’ notice, we charge £${PLAN.price} and the guarantee no longer applies. We will still offer you another time for the call.`],
  ['Cancelling', 'You can cancel at no cost at any time before we charge your card, by emailing ben@stablefuture.uk. You also have a legal right to cancel within 14 days of signing up. You ask us to start straight away, so if the service is fully provided within those 14 days, that right ends when it is complete. If you cancel after the service has started but before it is complete, you pay nothing.'],
  ['Our advice', 'We give careful, evidence-based guidance, not promises. AI exposure describes what AI may be able to do in a job; it is not a probability of job loss. Pay, openings, and course details come from public data with dates and sources, and can change. Check entry requirements with the course or apprenticeship provider. We do not guarantee any job, place, or salary, and we do not give financial advice.'],
  ['Responsibility', `We provide the service with reasonable care and skill. Nothing in these terms limits liability that cannot be limited by law. Otherwise, our total liability to you is limited to the £${PLAN.price} you paid.`],
  ['The student’s information', 'Pathfinder asks about the student’s interests, goals, preferences, and education. Only Ben sees the answers. We use them to prepare your advice and any later guidance for the student. We keep them for 10 years after Pathfinder is completed, so we can help as the student moves through education and into work, and delete them sooner if you ask. By signing up you confirm you are the student’s parent or carer and agree to them taking part. See stablefuture.uk/privacy.'],
  ['Complaints', 'Email ben@stablefuture.uk. We aim to reply within five working days.'],
  ['Law', 'These terms are governed by the law of England and Wales. If you live in Scotland or Northern Ireland, you can also bring a claim in your local courts.'],
];

export function planTermsText() {
  return PLAN_TERMS.map(([heading, body]) => `${heading}\n${body}`).join('\n\n');
}
