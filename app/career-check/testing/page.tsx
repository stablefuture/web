import { notFound } from 'next/navigation';
import CareerCheck from '../CareerCheck';
export const metadata = { title: 'Test career reports | Stable Future', robots: { index: false, follow: false } };
export default function Page() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <CareerCheck testing />;
}
