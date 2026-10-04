import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { subscribeViaKit } from '../../lib/kit';
import { createCareerResultsHandler, renderCareerEmail, selectReports } from '../../lib/career-email.mjs';

// Own-domain link (redirects to the booking page in next.config.ts) keeps links
// aligned with the sending domain, which helps inbox placement.
const CALL_URL = 'https://www.stablefuture.uk/call';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function loadReports() {
  const data = JSON.parse(await readFile(path.join(process.cwd(), 'data/lead-magnet/reports.json'), 'utf8'));
  if (!Array.isArray(data.reports)) throw new Error('Invalid report data');
  return data.reports;
}

const post = createCareerResultsHandler({ loadReports, apiKey: process.env.RESEND_API_KEY, from: process.env.CAREER_EMAIL_FROM || 'Ben at Stable Future <talk@stablefuture.uk>', bookingUrl: CALL_URL, subscribe: (email) => subscribeViaKit(email, process.env.KIT_CAREER_FORM_ID || '9682557') });
export async function POST(request: Request) { return post(request); }

// Public preview uses exactly the same renderer and server-owned data as email.
export async function GET(request: Request) {
  const url = new URL(request.url);
  let reports;
  try { reports = await loadReports(); } catch {
    return Response.json({ error: 'Reports are temporarily unavailable.' }, { status: 503 });
  }
  try {
    const selected = selectReports(url.searchParams.getAll('id'), reports);
    const email = renderCareerEmail(selected, { bookingUrl: CALL_URL });
    const plain = url.searchParams.get('format') === 'text';
    return new Response(plain ? email.text : email.html, { headers: { 'Content-Type': plain ? 'text/plain; charset=utf-8' : 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'" } });
  } catch {
    return Response.json({ error: 'Choose between one and three valid paths.' }, { status: 400 });
  }
}
