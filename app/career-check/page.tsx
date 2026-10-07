import type { Metadata } from 'next';
import { SHARE_IMAGE } from '../config';
import CareerCheck from './CareerCheck';

export const metadata: Metadata = {
  title: 'Future-Proof Career Check | Stable Future',
  description: 'Choose up to three degrees, apprenticeships, or jobs. Get a free email report on how exposed each one is to AI, and what to do about it.',
  alternates: { canonical: '/career-check' },
  openGraph: { title: 'Future-Proof Career Check | Stable Future', description: 'Choose up to three degrees, apprenticeships, or jobs. Get a free email report on how exposed each one is to AI, and what to do about it.', url: '/career-check', images: [SHARE_IMAGE] },
  twitter: { card: 'summary_large_image', title: 'Future-Proof Career Check | Stable Future', description: 'Choose up to three degrees, apprenticeships, or jobs. Get a free email report on how exposed each one is to AI, and what to do about it.' },
};
export default function Page() { return <CareerCheck />; }
