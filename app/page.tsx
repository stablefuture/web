import type { Metadata } from 'next';
import { Fraunces } from 'next/font/google';
import Dawn from './landing/Dawn';

const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-display', axes: ['SOFT', 'opsz'], style: ['normal', 'italic'], display: 'swap' });

export const metadata: Metadata = {
  title: 'How does AI impact your career path? | Stable Future',
  description: 'Understand how AI affects your career and build a strategy to develop the skills employers pay most for.',
  alternates: { canonical: '/' },
  openGraph: { title: 'How does AI impact your career path? | Stable Future', description: 'Understand how AI affects your career and build a strategy to develop the skills employers pay most for.', url: '/' },
  twitter: { card: 'summary_large_image', title: 'How does AI impact your career path? | Stable Future', description: 'Understand how AI affects your career and build a strategy to develop the skills employers pay most for.' },
};

// Tells search engines the site's name, logo, what it does, and who runs it.
const SITE = 'https://www.stablefuture.uk/';
const JSON_LD = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebSite', '@id': `${SITE}#website`, name: 'Stable Future', url: SITE, inLanguage: 'en-GB', publisher: { '@id': `${SITE}#org` } },
    {
      '@type': 'Organization', '@id': `${SITE}#org`, name: 'Stable Future', url: SITE, logo: `${SITE}icon.png`, email: 'ben@stablefuture.uk',
      description: 'Understand how AI affects your career and build a strategy to develop the skills employers pay most for.',
      areaServed: { '@type': 'Country', name: 'United Kingdom' },
      knowsAbout: ['Careers advice', 'Artificial intelligence and jobs', 'Degrees', 'Apprenticeships'],
      founder: { '@id': `${SITE}#ben` },
    },
    {
      '@type': 'Person', '@id': `${SITE}#ben`, name: 'Ben Grime', jobTitle: 'Founder', image: `${SITE}ben-grime.jpg`,
      worksFor: { '@id': `${SITE}#org` }, alumniOf: { '@type': 'CollegeOrUniversity', name: 'Lancaster University' },
    },
  ],
});

export default function Home() {
  return <div className={fraunces.variable}><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON_LD }} /><Dawn /></div>;
}
