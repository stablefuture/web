import type { Metadata } from 'next';
import { SHARE_IMAGE } from '../config';
import CareerCheck from './CareerCheck';

export const metadata: Metadata = {
  title: 'Free AI career check for your child | Stable Future',
  description: 'Choose up to three degrees, apprenticeships, or jobs your child is considering. Get a free email report on how exposed each one is to AI.',
  alternates: { canonical: '/ai-career-check' },
  openGraph: { title: 'Free AI career check for your child | Stable Future', description: 'Choose up to three degrees, apprenticeships, or jobs your child is considering. Get a free email report on how exposed each one is to AI.', url: '/ai-career-check', images: [SHARE_IMAGE] },
  twitter: { card: 'summary_large_image', title: 'Free AI career check for your child | Stable Future', description: 'Choose up to three degrees, apprenticeships, or jobs your child is considering. Get a free email report on how exposed each one is to AI.' },
};
export default function Page() { return <CareerCheck />; }
