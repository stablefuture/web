import type { Metadata } from 'next';
import CareerCheck from './CareerCheck';

export const metadata: Metadata = {
  title: 'Your AI career check | Stable Future',
  description: 'Choose up to three degrees, apprenticeships, or jobs. Get one clear email about AI exposure and the work behind your choices.',
  alternates: { canonical: '/ai-career-check' },
};
export default function Page() { return <CareerCheck />; }
