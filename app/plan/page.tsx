import Link from 'next/link';
import type { Metadata } from 'next';
import { PLAN, PLAN_CONSENT, PLAN_GUARANTEE, PLAN_STEPS } from '../lib/plan-terms.mjs';
import s from './plan.module.css';

export const metadata: Metadata = {
  title: 'Future-Proof ABZ Plan | Stable Future',
  description: 'A career plan for your son or daughter that should earn well however AI changes jobs. Nothing to pay until after the results call.',
  alternates: { canonical: '/plan' },
  robots: { index: false, follow: false },
};

const ERRORS: Record<string, string> = {
  student: 'Please add your son or daughter’s first name.',
  terms: 'Please tick the box to agree to the terms.',
  form: 'Please use the button on this page to continue.',
  stripe: 'We couldn’t open the card page. Please try again, or email ben@stablefuture.uk.',
};

export default async function PlanPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className={s.page}>
      <header className={s.top}><Link className={s.brand} href="/">Stable Future</Link><a href="/terms">Terms</a></header>
      <div className={s.wrap}>
        <h1>A career plan that holds up, whatever AI does.</h1>
        <p className={s.lede}>Your son or daughter answers Pathfinder. Ben analyses it against UK career data, then you build their A/B/Z plan together on a call.</p>
        <p className={s.price}><b>£{PLAN.price}</b><span>Nothing to pay until 48 hours after the results call.</span></p>
        <ol className={s.steps}>
          {PLAN_STEPS.map(([title, body]) => <li key={title}><div><b>{title}</b><span>{body}</span></div></li>)}
        </ol>
        <section className={s.guarantee}>
          <h2>Worth it, or free</h2>
          <p>{PLAN_GUARANTEE}</p>
        </section>
        <form className={s.signup} id="signup" method="post" action="/api/plan-checkout">
          <h2>Save a card to start</h2>
          <p>Stripe keeps your card details safe. We never see them. We charge £{PLAN.price} 48 hours after the results call, unless you claim the guarantee.</p>
          {error && ERRORS[error] && <p className={s.error} role="alert">{ERRORS[error]}</p>}
          <label className={s.field}><span>Your son or daughter’s first name</span><input name="student" required maxLength={60} autoComplete="off" /></label>
          <label className={s.check}>
            <input type="checkbox" name="accept" value="yes" required />
            <span>I agree to the <a href="/terms" target="_blank">terms</a>. {PLAN_CONSENT.replace('I agree to the terms. ', '')}</span>
          </label>
          <button className={s.primary} type="submit">Save card · £0 today <span aria-hidden="true">→</span></button>
          <p className={s.small}>Questions? Email <a href="mailto:ben@stablefuture.uk">ben@stablefuture.uk</a>.</p>
        </form>
      </div>
    </main>
  );
}
