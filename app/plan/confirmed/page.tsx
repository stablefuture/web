import Link from 'next/link';
import type { Metadata } from 'next';
import { confirmPlanSignup } from '../../lib/plan-signup.mjs';
import s from '../plan.module.css';

export const metadata: Metadata = { title: 'You’re booked in | Stable Future', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function ConfirmedPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  let signup: Awaited<ReturnType<typeof confirmPlanSignup>> = null;
  try { signup = await confirmPlanSignup(session_id ?? ''); } catch { console.error('Could not confirm plan signup.'); }
  return (
    <main className={s.page}>
      <header className={s.top}><Link className={s.brand} href="/">Stable Future</Link><a href="/terms">Terms</a></header>
      <div className={`${s.wrap} ${s.done}`}>
        {signup ? <>
          <h1>You’re in{signup.student ? `, and so is ${signup.student}` : ''}.</h1>
          <p className={s.lede}>Your card is saved and nothing has been charged. We’re emailing a copy of the terms to {signup.email}.</p>
          <div className={s.next}>
            <b>What happens next</b>
            <ol>
              <li>{signup.student || 'Your son or daughter'} completes Pathfinder. It takes about 15 minutes.</li>
              <li>Ben analyses the answers and emails you to arrange the results call.</li>
              <li>On the call, you build the A/B/Z plan together. We charge £199 48 hours later, unless it wasn’t worth it.</li>
            </ol>
          </div>
          <a className={s.primary} href={signup.path}>Start Pathfinder now <span aria-hidden="true">→</span></a>
          <p className={s.small} style={{ textAlign: 'left' }}>Not with them? Send them their personal link (it’s also in your email):<br /><b style={{ wordBreak: 'break-all' }}>https://www.stablefuture.uk{signup.path}</b></p>
        </> : <>
          <h1>We couldn’t confirm your card.</h1>
          <p className={s.lede}>If you saved a card, check your email for our confirmation. Otherwise, <a href="/plan">try again</a> or email ben@stablefuture.uk.</p>
        </>}
      </div>
    </main>
  );
}
