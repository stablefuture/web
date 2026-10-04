const COLOURS = { green: ['#e6eee3', '#31503d'], amber: ['#fff0d1', '#76521c'], red: ['#fae4dd', '#923e31'] };
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const scoreText = (exposure) => Number.isFinite(exposure?.score) ? `${Math.round(exposure.score)}/100` : 'Not yet available';
const colour = (exposure) => COLOURS[exposure?.colour] || ({ '#3d8b4a': COLOURS.green, '#b26f00': COLOURS.amber, '#ba861c': COLOURS.amber, '#b58322': COLOURS.amber, '#c14c34': COLOURS.red })[exposure?.colour] || (exposure?.label === 'Moderate' || exposure?.label === 'Medium' ? COLOURS.amber : ['#ecece7', '#5c625a']);
const scoreBasis = (exposure) => {
  const n = exposure?.scoredJobCount || 0;
  if (exposure?.basis === 'linked_jobs') return n === 1 ? 'Based on 1 linked career, not all graduates of this course.' : `Average across ${n} linked careers, not all graduates of this course.`;
  if (exposure?.basis === 'broader_groups') return `Broader group estimate, based on ${n} scored jobs in the classification. These are not confirmed destinations.`;
  if (exposure?.basis === 'mixed_links_and_groups') return `Estimate across ${n} scored jobs, combining supported links and broader career groups.`;
  if (exposure?.basis === 'career_group') return `Average across ${n} scored job titles in this group.`;
  if (exposure?.basis === 'job') return 'This job’s exposure compared with other scored jobs.';
  return 'An exposure score is not yet available for this path.';
};
const badge = (exposure) => { const [bg, ink] = colour(exposure); return `<span style="display:inline-block;padding:7px 11px;border-radius:8px;background:${bg};color:${ink};font-weight:700">${escape(scoreText(exposure))}${exposure?.label ? ` · ${escape(exposure.label)}` : ''}</span>`; };
const details = (item) => [...new Set([item.condition, item.scopeNote].filter(Boolean))];

export function selectReports(ids, reports) {
  if (!Array.isArray(ids) || ids.length < 1 || ids.length > 3 || ids.some((id) => typeof id !== 'string' || id.length > 160)) throw new Error('Choose between one and three paths.');
  const unique = [...new Set(ids)];
  const index = new Map(reports.map((report) => [report.id, report]));
  if (unique.some((id) => !index.has(id))) throw new Error('One of those paths is no longer available. Please choose it again.');
  return unique.map((id) => index.get(id));
}

export function renderCareerEmail(reports, { bookingUrl = '' } = {}) {
  const subject = `Your AI career check: ${reports.length === 1 ? reports[0].title : `${reports.length} paths`}`.replace(/[\r\n]/g, ' ').slice(0, 180);
  const text = ['YOUR AI CAREER CHECK', '', 'A closer look at the paths you chose.', 'AI exposure is a comparison of how AI may affect work, not the chance of losing a job.', ''];
  const cards = reports.map((report, index) => {
    const jobs = Array.isArray(report.jobs) ? report.jobs : [];
    const groups = Array.isArray(report.groupRoutes) ? report.groupRoutes : [];
    const exposure = report.aiExposure;
    const broad = ['broader_groups', 'mixed_links_and_groups'].includes(exposure?.basis);
    const scoreHeading = broad ? 'Broader group exposure' : 'AI exposure';
    const exactRoleNote = broad ? 'This exact role has not been scored.' : '';
    text.push(`${index + 1}. ${report.title}`, `${scoreHeading}: ${scoreText(exposure)}${exposure?.label ? ` — ${exposure.label}` : ''}`);
    if (exactRoleNote) text.push(exactRoleNote);
    text.push(scoreBasis(exposure));
    if (exposure?.partial) text.push(`Coverage: ${exposure.scoredJobCount} of ${exposure.totalJobCount} linked jobs have scores.`);
    let html = `<section style="margin:24px 0;padding:26px;background:#fffef9;border:1px solid #d9dfd3;border-radius:16px"><p style="margin:0 0 8px;font-size:12px;letter-spacing:1px;color:#68735f">PATH ${index + 1}</p><h2 style="margin:0 0 16px;font-size:25px;color:#263f32">${escape(report.title)}</h2><p style="margin:0 0 8px">${escape(scoreHeading)} ${badge(exposure)}</p>${exactRoleNote ? `<p style="font-size:13px;font-weight:600">${exactRoleNote}</p>` : ''}`;
    if (exposure?.basis) html += `<p style="font-size:13px;color:#596552">${escape(scoreBasis(exposure))}</p>`;
    if (exposure?.partial) html += `<p style="font-size:13px;color:#596552">Coverage: ${escape(exposure.scoredJobCount)} of ${escape(exposure.totalJobCount)} linked jobs have scores.</p>`;
    if (jobs.length) {
      const jobsHeading = report.jobsHeading === 'Jobs in this group' ? 'Jobs in this group' : report.kind === 'job' ? 'Related jobs' : 'Career examples';
      text.push('', jobsHeading.toUpperCase());
      html += `<h3 style="font-size:17px;margin:24px 0 10px">${jobsHeading}</h3>`;
      for (const job of jobs) {
        const subjectNote = job.memberSubjects?.length ? `Subject routes: ${job.memberSubjects.map((s) => s.title).join(', ')}` : '';
        if (subjectNote) text.push(subjectNote);
        text.push(`${job.title} — AI exposure: ${scoreText(job.aiExposure)}${job.aiExposure?.label ? ` (${job.aiExposure.label})` : ''}`, ...details(job));
        html += `<div style="padding:14px 0;border-top:1px solid #e3e6dc"><p style="margin:0 0 8px;font-weight:600">${escape(job.title)}</p>${badge(job.aiExposure)}${subjectNote ? `<p style="font-size:12px;color:#596552">${escape(subjectNote)}</p>` : ''}${details(job).map((s) => `<p style="font-size:13px;line-height:1.6;margin:8px 0 0;color:#596552">${escape(s)}</p>`).join('')}</div>`;
      }
    }
    for (const group of groups) {
      text.push('', group.exampleRole || report.title, `BROADER CAREER GROUP: ${group.title}`, `Group exposure estimate: ${scoreText(group.aiExposure)}`, 'This classification gives context. It is not a list of jobs this path qualifies you for.', ...details(group));
      html += `<div style="margin-top:20px;padding:18px;background:#f0f1e9;border-radius:10px"><h3 style="margin:0 0 10px;font-size:17px">${escape(group.exampleRole || report.title)}</h3><p style="margin:0 0 7px;font-size:12px;color:#596552">Broader career group: ${escape(group.title)}</p><p>Group exposure estimate ${badge(group.aiExposure)}</p><p style="font-size:13px">This classification gives context. It is not a list of jobs this path qualifies you for.</p>${details(group).map((s) => `<p style="font-size:13px">${escape(s)}</p>`).join('')}</div>`;
    }
    const example = report.exampleCareer;
    if (example && Array.isArray(example.tasks) && example.tasks.length) {
      text.push('', `A CLOSER LOOK: ${example.title}`);
      const conditions = details(report.exampleSelection || {});
      const member = report.exampleSelection?.memberSubject || example.memberSubject;
      if (member?.title) conditions.unshift(`Example from: ${member.title}`);
      const tasks = example.tasks;
      const sampleNote = `The ${tasks.length} most important mapped tasks for this example job${example.totalMappedTasks ? ` (${example.totalMappedTasks} tasks mapped in total)` : ''}.`;
      text.push(sampleNote, 'AI can help with this task:');
      text.push(...conditions);
      html += `<h3 style="font-size:17px;margin:25px 0 8px">A closer look: ${escape(example.title)}</h3>${conditions.map((s) => `<p style="font-size:13px;color:#596552">${escape(s)}</p>`).join('')}<p style="font-size:12px;color:#596552">${escape(sampleNote)}</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;font-size:13px;line-height:1.6"><tr><td style="padding:8px 0;font-weight:700">Task</td><td style="padding:8px 0 8px 12px;font-weight:700;text-align:center">AI can help with this task</td></tr>`;
      for (const task of tasks) {
        const label = task.aiExposure === 'yes' ? 'Yes' : task.aiExposure === 'no' ? 'No' : 'Not yet assessed';
        const [taskBg, taskInk] = task.aiExposure === 'yes' ? COLOURS.red : task.aiExposure === 'no' ? COLOURS.green : ['#ecece7', '#5c625a'];
        text.push(`• ${task.text} [${label}]`);
        html += `<tr><td style="padding:11px 10px 11px 0;border-top:1px solid #e3e6dc;vertical-align:top">${escape(task.text)}</td><td style="padding:11px 0 11px 12px;border-top:1px solid #e3e6dc;text-align:center;vertical-align:top"><span style="display:inline-block;padding:4px 9px;border-radius:6px;background:${taskBg};color:${taskInk};font-weight:700">${label}</span></td></tr>`;
      }
      html += '</table>';
    } else {
      const note = 'A task breakdown for this specific role is not available yet.';
      text.push('', note); html += `<p style="font-size:13px;color:#596552;margin-top:22px">${note}</p>`;
    }
    if (report.kind !== 'job' && !jobs.length && !groups.length) {
      const reason = report.routeReview?.reason || 'We do not yet have a supported career example for this path.';
      text.push(reason); html += `<p style="font-size:13px">${escape(reason)}</p>`;
    }
    text.push(''); return html + '</section>';
  }).join('');
  const plan = '<section style="margin:26px 0;line-height:1.7"><h2 style="font-size:23px">A plan you can adjust.</h2><p><strong>Plan A:</strong> the path you want to pursue.<br><strong>Plan B:</strong> another route if your interests or opportunities change.<br><strong>Plan Z:</strong> a practical fallback you could rely on.</p><p><strong>Your next step:</strong> choose one role and ask someone doing it how AI is changing their day-to-day work.</p></section>';
  text.push('A PLAN YOU CAN ADJUST', 'Plan A: the path you want to pursue.', 'Plan B: another route if your interests or opportunities change.', 'Plan Z: a practical fallback you could rely on.', '', 'Your next step: choose one role and ask someone doing it how AI is changing their day-to-day work.', '');
  let cta = '';
  if (/^https:\/\//.test(bookingUrl)) {
    text.push('WHAT COULD THIS MEAN FOR YOU?', 'Talk through your choices in a free call with Ben at Stable Future.', bookingUrl);
    cta = `<section style="padding:26px;background:#294635;color:#fffef7;border-radius:16px;margin-top:28px"><h2 style="margin:0 0 10px;font-size:23px">Make your next step clearer.</h2><p style="line-height:1.6">Talk through your choices in a free call with Ben at Stable Future.</p><a href="${escape(bookingUrl)}" style="display:inline-block;padding:13px 19px;background:#f1eddf;color:#294635;text-decoration:none;border-radius:8px;font-weight:700">Book a free call →</a></section>`;
  }
  text.push('', 'Scores compare jobs using importance-weighted task exposure. A course score summarises its supported job examples; a broader-group estimate is labelled separately. These examples do not predict your own career.', '', 'You asked for this career report.', 'Stable Future · stablefuture.uk');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(subject)}</title></head><body style="margin:0;background:#f2f0e5;color:#2c3f31;font-family:Arial,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding:24px 12px"><!--[if mso]><table role="presentation" width="660" align="center"><tr><td><![endif]--><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:660px"><tr><td style="padding:12px 8px"><p style="font-size:13px;letter-spacing:2px;font-weight:700">STABLE FUTURE</p><h1 style="font-size:36px;line-height:1.15;margin:25px 0 12px">Your choices.<br>A clearer view.</h1><p style="line-height:1.7;color:#596552">A closer look at the paths you chose. AI exposure is a comparison of how AI may affect work, not the chance of losing a job.</p>${cards}${plan}${cta}<p style="font-size:12px;line-height:1.7;color:#65705d;margin-top:25px">Scores compare jobs using importance-weighted task exposure. A course score summarises its supported job examples; a broader-group estimate is labelled separately. These examples do not predict your own career.</p><p style="font-size:12px;color:#65705d">You asked for this career report.<br>Stable Future · stablefuture.uk</p></td></tr></table><!--[if mso]></td></tr></table><![endif]--></td></tr></table></body></html>`;
  return { subject, html, text: text.join('\n') };
}

/**
 * @param {{loadReports: () => Promise<any[]>, fetchImpl?: typeof fetch, apiKey?: string, from?: string, bookingUrl?: string, now?: () => number, rateLimit?: number, rateWindowMs?: number, subscribe?: (email: string) => Promise<boolean>}} options
 */
export function createCareerResultsHandler({ loadReports, fetchImpl = fetch, apiKey, from = 'Stable Future <talk@stablefuture.uk>', bookingUrl = '', now = Date.now, rateLimit = 5, rateWindowMs = 15 * 60 * 1000, subscribe } = {}) {
  const attempts = new Map();
  const json = (data, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
  return async function handle(request) {
    if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
    const origin = request.headers.get('origin');
    if (!origin || origin !== new URL(request.url).origin) return json({ error: 'Please send the form from this website.' }, 403);
    const time = now();
    for (const [key, item] of attempts) if (item.until <= time) attempts.delete(key);
    const client = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const item = attempts.get(client) || { count: 0, until: time + rateWindowMs };
    if (item.count >= rateLimit || attempts.size > 10000) return json({ error: 'Please wait a little before requesting another report.' }, 429);
    item.count++; attempts.set(client, item);
    if (Number(request.headers.get('content-length') || 0) > 5000) return json({ error: 'Please check the form.' }, 400);
    let body;
    try { const raw = await request.text(); if (raw.length > 5000) throw new Error(); body = JSON.parse(raw); } catch { return json({ error: 'Please check the form.' }, 400); }
    if (!body || typeof body !== 'object' || body.website) return json({ error: 'Please check the form.' }, 400);
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Enter a valid email address.' }, 400);
    let reports;
    try { reports = await loadReports(); } catch { return json({ error: 'The reports are temporarily unavailable. Please try again later.' }, 503); }
    let selected;
    try { selected = selectReports(body.ids, reports); } catch (error) { return json({ error: error.message }, 400); }
    if (!apiKey) return json({ error: 'Email is temporarily unavailable. You can still preview your report below.' }, 503);
    const rendered = renderCareerEmail(selected, { bookingUrl });
    try {
      const response = await fetchImpl('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from, to: [email], ...rendered }), signal: AbortSignal.timeout(15000) });
      const result = await response.json().catch(() => null);
      if (!response.ok || typeof result?.id !== 'string' || !result.id) return json({ error: 'We could not send your report. Please try again later.' }, 502);
      if (subscribe) {
        const subscribed = await subscribe(email).catch(() => false);
        if (!subscribed) return json({ ok: true, warning: 'Your report is on its way, but we could not add you to follow-up emails.' });
      }
      return json({ ok: true });
    } catch { return json({ error: 'We could not send your report. Please try again later.' }, 502); }
  };
}
