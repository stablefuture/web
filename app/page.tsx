import type { Metadata } from 'next';
import { Fraunces } from 'next/font/google';
import Dawn from './landing/Dawn';

const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-display', axes: ['SOFT', 'opsz'], style: ['normal', 'italic'], display: 'swap' });

export const metadata: Metadata = {
  title: 'Stable Future | Is your child’s career ready for AI?',
  description: 'Career advice for families navigating AI. Check how exposed your child’s chosen degree, apprenticeship, or job is, then build Plan A, B, and Z with Ben.',
  alternates: { canonical: '/' },
  openGraph: { title: 'Is your child’s career ready for AI? | Stable Future', description: 'Career advice for families navigating AI, for students of any age.', url: '/' },
  twitter: { card: 'summary_large_image', title: 'Is your child’s career ready for AI? | Stable Future', description: 'Career advice for families navigating AI, for students of any age.' },
};

// Tells search engines the site's name and logo.
const JSON_LD = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebSite', name: 'Stable Future', url: 'https://www.stablefuture.uk/' },
    { '@type': 'Organization', name: 'Stable Future', url: 'https://www.stablefuture.uk/', logo: 'https://www.stablefuture.uk/icon.png', email: 'ben@stablefuture.uk' },
  ],
});

export default function Home() {
  return <div className={fraunces.variable}><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON_LD }} /><Dawn /></div>;
}
