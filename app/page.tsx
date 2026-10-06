import type { Metadata } from 'next';
import { Fraunces } from 'next/font/google';
import Dawn from './landing/Dawn';

const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-display', axes: ['SOFT', 'opsz'], style: ['normal', 'italic'], display: 'swap' });

export const metadata: Metadata = {
  title: 'Stable Future | Career advice for families navigating AI',
  description: 'Is your child’s career path ready for AI? Check how exposed their chosen degree, apprenticeship, or job is, then build a Plan A, B and Z with Ben.',
  alternates: { canonical: '/' },
  openGraph: { title: 'Is your child’s career path ready for AI? | Stable Future', description: 'Career advice for families navigating AI, for students of any age.' },
  twitter: { title: 'Is your child’s career path ready for AI? | Stable Future', description: 'Career advice for families navigating AI, for students of any age.' },
};

export default function Home() {
  return <div className={fraunces.variable}><Dawn /></div>;
}
