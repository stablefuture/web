import { deleteExpiredAnswers } from '../../lib/pathfinder-cleanup.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Vercel Cron calls this daily (vercel.json). With CRON_SECRET set, Vercel sends it as a bearer token.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const ok = secret ? request.headers.get('authorization') === `Bearer ${secret}` : (request.headers.get('user-agent') || '').startsWith('vercel-cron/');
  if (!ok) return new Response('Unauthorised', { status: 401 });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL, supabaseKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !supabaseKey) return new Response('Not configured', { status: 500 });
  try {
    return Response.json({ deleted: await deleteExpiredAnswers({ supabaseUrl, supabaseKey }) });
  } catch {
    console.error('Pathfinder cleanup failed.');
    return new Response('Cleanup failed', { status: 502 });
  }
}
