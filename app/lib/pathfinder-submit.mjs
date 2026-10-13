// Server-only: receive a completed Pathfinder, keep a private copy, and email Ben the answers.
// Students see no results. Never log answers: they are a young person's personal data.
import { AREAS, NEXT, PREFERENCE, PREFERENCES, QUESTIONS_VERSION, REFLECT, VALUES, parseAnswers } from '../pathfinder/questions.mjs';

const areaLabel = id => AREAS.find(([x]) => x === id)?.[1] ?? id;
const valueLabel = id => { const [, label, source] = VALUES.find(([x]) => x === id) ?? [id, id, '']; return source ? `${label} (${source})` : label; };

/** RIASEC sums (10–50) from the O*NET Interest Profiler Short Form answers. */
export function interestProfile(activities, questions, dimensions) {
  return dimensions.map((name, d) => ({ name, score: questions.reduce((sum, q, i) => sum + (q[1] === d ? activities[i] : 0), 0) }))
    .sort((a, b) => b.score - a.score);
}

export function pathfinderEmail(a, profile, questions, match = 'typed') {
  const bar = n => '█'.repeat(Math.round((n - 10) / 4)).padEnd(10, '·');
  const list = (title, items) => [title, ...(items.length ? items : ['—']), ''];
  const byAnswer = n => questions.flatMap((q, i) => a.activities[i] === n ? [q[0]] : []);
  const lines = [
    `${a.name} · ${a.stage}`, `Parent: ${a.parentName ? `${a.parentName} <${a.email}>` : a.email || 'unknown'} (${{ link: 'matched by their personal link', typed: 'email typed by the student', failed: 'LINK FAILED: match by name in Stripe' }[match]})`, '',
    ...list('INTEREST PROFILE (O*NET Interest Profiler Short Form, 10–50)', profile.map(p => `${p.name.padEnd(15)} ${String(p.score).padStart(2)} ${bar(p.score)}`)),
    ...list('TOP INTEREST AREAS', a.topAreas.map((id, i) => `${i + 1}. ${areaLabel(id)}`)),
    ...list('ALL AREAS TICKED', [a.areas.map(areaLabel).join(', ') || '—']),
    ...list('AREAS CROSSED', [a.avoidAreas.map(areaLabel).join(', ') || '—']),
    ...list('WHAT MATTERS MOST', a.values.map((v, i) => `${i + 1}. ${valueLabel(v)}`)),
    ...list('WHAT MAKES WORK WORTH IT (open answers)', REFLECT.flatMap(([id, question]) => a.reflect[id] ? [`${question}\n  ${a.reflect[id].replace(/\n/g, '\n  ')}`] : [])),
    ...list(`CAREER IDEAS: ${a.ideas}`, [...a.picks.map(x => `• ${x.title} (${x.kind}, ${x.id})`), ...(a.ideasText ? [a.ideasText] : [])]),
    ...list('WORKING LIFE', PREFERENCES.map(([id, label]) => `${PREFERENCE[a.preferences[id] - 1] ?? '—'}: ${label}`)),
    ...list('NEXT STEPS', [`Would consider: ${NEXT.filter(o => a.next[o] === 1).join(', ') || '—'}`, `Ruled out: ${NEXT.filter(o => a.next[o] === -1).join(', ') || '—'}`]),
    ...list('SUBJECTS AND GRADES', a.subjects ? [a.subjects] : []),
    ...list('PRACTICAL', [`Moving away: ${a.move || '—'}`, `Student debt: ${a.debt || '—'}`]),
    ...list(`AI: ${a.ai || '—'}`, a.aiText ? [a.aiText] : []),
    ...list('ANYTHING ELSE', a.extra ? [a.extra] : []),
    ...list('AT 30', a.goal ? [a.goal] : []),
    ...list('ACTIVITIES THEY’D ENJOY A LOT', byAnswer(5)),
    ...list('ACTIVITIES THEY’D ENJOY QUITE A BIT', byAnswer(4)),
    ...list('ACTIVITIES NOT AT ALL', byAnswer(1)),
    'The full answers are attached as JSON.',
  ];
  return { subject: `Pathfinder: ${a.name} (${a.stage})`, text: lines.join('\n') };
}

/**
 * @param {{ questions: readonly (readonly [string, number])[], dimensions: string[], apiKey?: string, supabaseUrl?: string, supabaseKey?: string,
 *   fetchImpl?: typeof fetch, alert?: (lead: any) => any, to?: string, from?: string, now?: () => number, rateLimit?: number,
 *   readToken?: (token: unknown) => string | null, lookupParent?: (customerId: string) => Promise<{ email: string, name: string, student: string } | null>, markComplete?: (customerId: string) => Promise<unknown> }} options
 */
export function createPathfinderHandler({ questions, dimensions, apiKey, supabaseUrl, supabaseKey, fetchImpl = fetch, alert = () => {}, readToken = () => null, lookupParent = async () => null, markComplete = async () => {}, to = 'ben@stablefuture.uk', from = 'Stable Future website <talk@stablefuture.uk>', now = Date.now, rateLimit = 5 }) {
  const attempts = new Map();
  const json = (data, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
  return async function handle(request) {
    if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
    const origin = request.headers.get('origin');
    if (!origin || origin !== new URL(request.url).origin) return json({ error: 'Please send your answers from this website.' }, 403);
    const time = now();
    for (const [key, item] of attempts) if (item.until <= time) attempts.delete(key);
    const client = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const item = attempts.get(client) || { count: 0, until: time + 15 * 60 * 1000 };
    if (item.count >= rateLimit || attempts.size > 10000) return json({ error: 'Please wait a few minutes and try again.' }, 429);
    item.count++; attempts.set(client, item);

    let answers, customerId = null, parent = null, match = 'typed';
    try {
      const raw = await request.text();
      if (raw.length > 40000) throw new Error('Please check your answers.');
      const body = JSON.parse(raw);
      // A broken personal link never blocks the student: Ben can match by name instead.
      answers = parseAnswers(body, { activityCount: questions.length, areaIds: AREAS.map(([id]) => id), linked: !!body?.k });
      customerId = readToken(body.k);
      if (customerId) parent = await lookupParent(customerId).catch(() => null);
      if (body.k) match = parent ? 'link' : 'failed';
      if (parent?.email) Object.assign(answers, { email: parent.email, parentName: parent.name });
    } catch (error) {
      return json({ error: error instanceof SyntaxError ? 'Please check your answers.' : error.message }, 400);
    }
    const profile = interestProfile(answers.activities, questions, dimensions);
    const submittedAt = new Date(time).toISOString();
    const id = `${submittedAt.slice(0, 10)}/${submittedAt.replace(/[:.]/g, '-')}-${crypto.randomUUID().slice(0, 8)}`;
    const record = { version: QUESTIONS_VERSION, submittedAt, match, stripeCustomer: parent ? customerId : null, answers, interestProfile: profile };
    const body = JSON.stringify(record, null, 2);

    let stored = false, emailed = false;
    if (supabaseUrl && supabaseKey) {
      try {
        const response = await fetchImpl(`${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/pathfinder-responses/${id}.json`, {
          method: 'POST', headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json', 'x-upsert': 'false' }, body, signal: AbortSignal.timeout(15000),
        });
        stored = response.ok;
      } catch { /* reported below */ }
    }
    if (apiKey) {
      try {
        const email = pathfinderEmail(answers, profile, questions, match);
        const response = await fetchImpl('https://api.resend.com/emails', {
          method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from, to: [to], ...(answers.email ? { reply_to: answers.email } : {}), ...email, text: `${email.text}${stored ? `\nStored copy: pathfinder-responses/${id}.json` : '\nStorage FAILED: this email is the only copy.'}`, attachments: [{ filename: `pathfinder-${submittedAt.slice(0, 10)}.json`, content: Buffer.from(body).toString('base64') }], tags: [{ name: 'type', value: 'pathfinder' }] }),
          signal: AbortSignal.timeout(15000),
        });
        emailed = response.ok;
      } catch { /* reported below */ }
    }
    if (!stored) console.error('Pathfinder storage failed.');
    if (!emailed) console.error('Pathfinder email failed.');
    if (!stored && !emailed) return json({ error: 'We couldn’t save your answers. Please try again in a minute, or email ben@stablefuture.uk.' }, 503);
    if (parent) await markComplete(customerId).catch(() => console.error('Could not mark Pathfinder complete in Stripe.'));
    try { alert({ type: 'pathfinder', student: answers.name, stage: answers.stage, email: answers.email || (match === 'failed' ? 'link failed, match by name' : 'unknown'), top: answers.topAreas.map(areaLabel).join(', ') || answers.areas.map(areaLabel).slice(0, 3).join(', ') || '—' }); } catch { /* optional */ }
    return json({ ok: true });
  };
}
