import { createAdviceHandler } from '../../lib/advice.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const post = createAdviceHandler({ apiKey: process.env.RESEND_API_KEY });
export async function POST(request: Request) { return post(request); }
