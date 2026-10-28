import type { Metadata } from 'next';
import { SHARE_IMAGE } from '../config';
import Opportunity from './Opportunity';

const TITLE = 'Opportunity Scanner | Stable Future';
const DESCRIPTION = 'Upload your roles. An AI agent maps each one to a UK occupation, shows its working, asks you when it isn’t sure, then shows where AI could help with your team’s work.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/opportunity' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: '/opportunity', images: [SHARE_IMAGE] },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

export default function Page() { return <Opportunity />; }
