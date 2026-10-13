import Link from 'next/link';
import type { Metadata } from 'next';
import { PLAN, PLAN_TERMS, PLAN_TERMS_VERSION } from '../lib/plan-terms.mjs';
import s from '../plan/plan.module.css';

export const metadata: Metadata = {
  title: 'Terms | Stable Future',
  description: `Terms for the ${PLAN.name}.`,
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  const updated = new Date(PLAN_TERMS_VERSION).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <main className={s.page}>
      <header className={s.top}><Link className={s.brand} href="/">Stable Future</Link><a href="/plan">The plan</a></header>
      <div className={`${s.wrap} ${s.terms}`}>
        <h1>Terms</h1>
        <p className={s.meta}>{PLAN.name} · £{PLAN.price} · Updated {updated}</p>
        {PLAN_TERMS.map(([heading, body]) => <section key={heading}><h2>{heading}</h2><p>{body}</p></section>)}
      </div>
    </main>
  );
}
