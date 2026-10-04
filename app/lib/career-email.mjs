import { BANDS, bandFor } from './exposure-bands.mjs';

// Email-safe rendering: presentation tables, inline styles, bgcolor fallbacks,
// no web fonts, no scripts, no images. Keep under Gmail's 102 KB clip.
const SITE = 'https://www.stablefuture.uk';
const INK = '#1d3026';
const MUTED = '#566151';
const PAPER = '#f2f0e5';
const CARD = '#fffdf6';
const SAGE = '#e7e9dc';
const SUN = '#ff8a3d';
const SERIF = "Georgia,'Times New Roman',serif";
const SANS = 'Helvetica,Arial,sans-serif';
const SOURCES = {
  stanford: 'https://digitaleconomy.stanford.edu/project/indicators/canaries-dashboard/',
  epoch: 'https://epoch.ai/',
  pwc: 'https://www.pwc.com/gx/en/news-room/press-releases/2026/pwc-2026-ai-jobs-barometer.html',
};

const SCORING = 'We take every task the ONS lists for each UK job, judge whether AI can help with it (using the method from Eloundou et al., 2023), weight tasks by importance, and rank 1,182 UK jobs from 0 to 100. A course or apprenticeship score averages the careers we link to it. Scores describe exposure, not the chance of losing a job, and they do not predict your child’s own career.';
const TASK_NOTE = '“Can AI help?” means AI could save much of the time a task takes, on its own or with other software. It does not mean AI can do the whole task.';
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const score = (exposure) => Number.isFinite(exposure?.score) ? Math.round(exposure.score) : null;
const scoreText = (exposure) => score(exposure) === null ? 'Not yet available' : `${score(exposure)}/100`;
const kindLabel = (kind) => kind === 'degree' ? 'Degree' : kind === 'apprenticeship' ? 'Apprenticeship' : 'Job';
const listTitles = (titles) => titles.length < 2 ? titles.join('') : `${titles.slice(0, -1).join(', ')} and ${titles.at(-1)}`;
const details = (item) => [...new Set([item?.condition, item?.scopeNote].filter(Boolean))];

const MEANING = {
  'very-high': 'AI can already do much of the work in this area. Expect fewer entry-level jobs and more competition for them. Your child can still do well here, with skills AI can’t easily copy and a strong Plan B.',
  high: 'A lot of this work is exposed to AI. Junior roles are likely to get more competitive, so the skills your child builds early matter more than usual.',
  medium: 'Some of this work is exposed to AI and some stays human. The human parts are where your child should aim to stand out.',
  low: 'Most of this work still needs a person. A sound choice, and a good Plan B beside more exposed paths.',
  'very-low': 'Very little of this work is exposed to AI today. A strong Plan Z: a path to fall back on if others get bumpy.',
  none: 'We haven’t been able to score this path yet.',
};

export function basisText(exposure) {
  const n = exposure?.scoredJobCount || 0;
  const s = score(exposure);
  if (s === null) return 'An exposure score is not yet available for this path.';
  if (exposure?.basis === 'job') return `More exposed to AI than ${s}% of the UK jobs we score.`;
  if (exposure?.basis === 'linked_jobs') return n === 1 ? 'Based on the one career we link to this path. It does not cover everyone who takes it.' : `The average of the ${n} careers we link to this path. It does not cover everyone who takes it.`;
  if (exposure?.basis === 'career_group') return `The average of ${n} job titles in this group.`;
  if (exposure?.basis === 'broader_groups') return `An estimate from the broader job group this path sits in (${n} scored jobs). We have not scored this exact role.`;
  if (exposure?.basis === 'mixed_links_and_groups') return `An estimate across ${n} scored jobs, combining direct links and broader job groups.`;
  return '';
}

function pill(exposure, { size = 13, withScore = true } = {}) {
  const band = bandFor(exposure?.score);
  const label = `${band.label}${withScore && score(exposure) !== null ? ` · ${score(exposure)}` : ''}`;
  return `<span style="display:inline-block;padding:${size > 13 ? '8px 14px' : '5px 10px'};border-radius:999px;background:${band.bg};color:${band.ink};font-family:${SANS};font-size:${size}px;line-height:1.2;font-weight:700;white-space:nowrap">${escape(label)}</span>`;
}

// Five cells, the active one solid with its label. Works without images or CSS support.
function meter(exposure) {
  const active = bandFor(exposure?.score);
  const cells = BANDS.map((band) => {
    const on = band.key === active.key;
    return `<td width="20%" bgcolor="${on ? band.bg : band.tint}" style="background:${on ? band.bg : band.tint};height:34px;padding:0 4px;text-align:center;font-family:${SANS};font-size:11px;line-height:1.2;font-weight:700;color:${on ? band.ink : '#7a8273'};border-left:3px solid ${CARD}">${on ? escape(band.label) : '&nbsp;'}</td>`;
  }).join('');
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;table-layout:fixed"><tr>${cells}</tr></table><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%"><tr><td style="padding-top:6px;font-family:${SANS};font-size:11px;color:${MUTED}">Less exposed</td><td align="right" style="padding-top:6px;font-family:${SANS};font-size:11px;color:${MUTED}">More exposed</td></tr></table>`;
}

const p = (text, style = '') => `<p style="margin:0 0 12px;font-family:${SANS};font-size:15px;line-height:1.6;color:${INK};${style}">${text}</p>`;
const small = (text) => `<p style="margin:6px 0 0;font-family:${SANS};font-size:12px;line-height:1.55;color:${MUTED}">${text}</p>`;
const h2 = (text, style = '') => `<h2 style="margin:0 0 12px;font-family:${SERIF};font-size:26px;line-height:1.2;font-weight:400;color:${INK};${style}">${text}</h2>`;
const h3 = (text) => `<h3 style="margin:26px 0 10px;font-family:${SANS};font-size:13px;line-height:1.3;letter-spacing:1px;text-transform:uppercase;font-weight:700;color:${INK}">${text}</h3>`;
const link = (href, text) => `<a href="${escape(href)}" style="color:${INK};text-decoration:underline">${text}</a>`;

export function selectReports(ids, reports) {
  if (!Array.isArray(ids) || ids.length < 1 || ids.length > 3 || ids.some((id) => typeof id !== 'string' || id.length > 160)) throw new Error('Choose between one and three paths.');
  const unique = [...new Set(ids)];
  const index = new Map(reports.map((report) => [report.id, report]));
  if (unique.some((id) => !index.has(id))) throw new Error('One of those paths is no longer available. Please choose it again.');
  return unique.map((id) => index.get(id));
}

function renderPath(report, index, text) {
  const jobs = Array.isArray(report.jobs) ? report.jobs : [];
  const groups = Array.isArray(report.groupRoutes) ? report.groupRoutes : [];
  const exposure = report.aiExposure;
  const band = bandFor(exposure?.score);
  text.push('', `${index + 1}. ${report.title} (${kindLabel(report.kind)})`, `AI exposure: ${band.label}${score(exposure) !== null ? ` (${score(exposure)} / 100)` : ''}`, basisText(exposure));
  if (exposure?.partial) text.push(`Coverage: ${exposure.scoredJobCount} of ${exposure.totalJobCount} linked jobs have scores.`);
  text.push(`What this means: ${MEANING[band.key]}`);

  let html = `<tr><td style="padding:0 0 22px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${CARD}" style="width:100%;background:${CARD};border-radius:18px;border-top:8px solid ${band.bg}"><tr><td style="padding:24px 24px 26px">`;
  html += `<p style="margin:0 0 6px;font-family:${SANS};font-size:12px;letter-spacing:1px;text-transform:uppercase;font-weight:700;color:${MUTED}">Path ${index + 1} · ${kindLabel(report.kind)}</p>`;
  html += `<h2 style="margin:0 0 16px;font-family:${SERIF};font-size:27px;line-height:1.15;font-weight:400;color:${INK}">${escape(report.title)}</h2>`;
  html += meter(exposure);
  html += `<p style="margin:16px 0 4px;font-family:${SANS};font-size:15px;line-height:1.5;color:${INK}"><strong>AI exposure: ${escape(band.label)}${score(exposure) !== null ? ` (${score(exposure)} / 100)` : ''}.</strong><br>${escape(basisText(exposure))}</p>`;
  if (exposure?.partial) html += small(`Coverage: ${escape(exposure.scoredJobCount)} of ${escape(exposure.totalJobCount)} linked jobs have scores.`);
  html += `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;margin-top:14px"><tr><td bgcolor="${band.tint}" style="background:${band.tint};border-radius:12px;padding:14px 16px;font-family:${SANS};font-size:14px;line-height:1.6;color:${INK}"><strong>What this means:</strong> ${escape(MEANING[band.key])}</td></tr></table>`;

  if (jobs.length) {
    const heading = report.jobsHeading === 'Jobs in this group' ? 'Jobs in this group' : report.kind === 'job' ? 'Related jobs' : 'Where it leads';
    text.push('', heading.toUpperCase());
    html += h3(escape(heading));
    // A note that applies to every job is shown once, above the list.
    const shared = jobs.length > 1 ? details(jobs[0]).filter((n) => jobs.every((j) => details(j).includes(n))) : [];
    if (shared.length) { text.push(...shared); html += shared.map((n) => small(escape(n))).join('') + '<div style="height:8px;line-height:8px;font-size:1px">&nbsp;</div>'; }
    html += `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse">`;
    for (const job of jobs) {
      const subjects = job.memberSubjects?.length ? `Subject routes: ${job.memberSubjects.map((s) => s.title).join(', ')}` : '';
      const notes = [subjects, ...details(job).filter((n) => !shared.includes(n))].filter(Boolean);
      text.push(`- ${job.title}: ${bandFor(job.aiExposure?.score).label} (${scoreText(job.aiExposure)})`, ...notes.map((n) => `  ${n}`));
      html += `<tr><td style="padding:11px 10px 11px 0;border-top:1px solid #e3e5da;vertical-align:top;font-family:${SANS};font-size:14px;line-height:1.45;color:${INK}"><strong style="font-weight:600">${escape(job.title)}</strong>${notes.map((n) => small(escape(n))).join('')}</td><td align="right" style="padding:11px 0;border-top:1px solid #e3e5da;vertical-align:top;width:1%">${pill(job.aiExposure, { size: 12 })}</td></tr>`;
    }
    html += '</table>';
  }

  for (const group of groups) {
    const role = group.exampleRole || report.title;
    text.push('', `${role} - broader job group: ${group.title}`, `Group estimate: ${bandFor(group.aiExposure?.score).label} (${scoreText(group.aiExposure)})`, 'This group gives context. It is not a list of jobs this path qualifies you for.', ...details(group));
    html += `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;margin-top:18px"><tr><td bgcolor="${SAGE}" style="background:${SAGE};border-radius:12px;padding:16px 18px"><p style="margin:0 0 4px;font-family:${SANS};font-size:15px;font-weight:700;color:${INK}">${escape(role)}</p><p style="margin:0 0 10px;font-family:${SANS};font-size:13px;color:${MUTED}">Broader job group: ${escape(group.title)}</p>${pill(group.aiExposure, { size: 12 })}${small('This group gives context. It is not a list of jobs this path qualifies you for.')}${details(group).map((s) => small(escape(s))).join('')}</td></tr></table>`;
  }

  const example = report.exampleCareer;
  if (example && Array.isArray(example.tasks) && example.tasks.length) {
    const tasks = example.tasks;
    const yes = tasks.filter((t) => t.aiExposure === 'yes').length;
    const conditions = details(report.exampleSelection);
    const member = report.exampleSelection?.memberSubject || example.memberSubject;
    if (member?.title) conditions.unshift(`Example from: ${member.title}`);
    const intro = `AI can help with ${yes} of these ${tasks.length} tasks.`;
    const which = `The ${tasks.length} most important tasks in this job${example.totalMappedTasks ? `, out of ${example.totalMappedTasks}` : ''}.`;
    text.push('', `INSIDE THE JOB: ${example.title}`, intro, which, ...conditions, 'Can AI help?');
    html += h3(`Inside the job: ${escape(example.title)}`);
    html += p(`<strong>${escape(intro)}</strong><br>${escape(which)}`, 'font-size:14px;margin-bottom:6px');
    html += conditions.map((s) => small(escape(s))).join('');
    html += `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;margin-top:10px"><tr><td style="padding:6px 0;font-family:${SANS};font-size:12px;font-weight:700;color:${MUTED}">Task</td><td align="right" style="padding:6px 0;font-family:${SANS};font-size:12px;font-weight:700;color:${MUTED};white-space:nowrap">Can AI help?</td></tr>`;
    for (const task of tasks) {
      const label = task.aiExposure === 'yes' ? 'Yes' : task.aiExposure === 'no' ? 'No' : 'Not yet assessed';
      const tone = task.aiExposure === 'yes' ? BANDS[4] : task.aiExposure === 'no' ? BANDS[0] : { tint: '#ecece7', ink: MUTED };
      const ink = task.aiExposure === 'yes' ? '#a3152b' : task.aiExposure === 'no' ? '#1d6b2a' : MUTED;
      text.push(`- ${task.text} [${label}]`);
      html += `<tr><td style="padding:11px 12px 11px 0;border-top:1px solid #e3e5da;vertical-align:top;font-family:${SANS};font-size:14px;line-height:1.5;color:${INK}">${escape(task.text)}</td><td align="right" style="padding:11px 0;border-top:1px solid #e3e5da;vertical-align:top;width:1%"><span style="display:inline-block;padding:4px 12px;border-radius:999px;background:${tone.tint};color:${ink};font-family:${SANS};font-size:12px;font-weight:700;white-space:nowrap">${label}</span></td></tr>`;
    }
    html += '</table>';
  } else {
    const note = 'We don’t have a task breakdown for this role yet.';
    text.push('', note);
    html += small(note);
  }
  if (report.kind !== 'job' && !jobs.length && !groups.length) {
    const reason = report.routeReview?.reason || 'We do not yet have a supported career example for this path.';
    text.push(reason);
    html += small(escape(reason));
  }
  return `${html}</td></tr></table></td></tr>`;
}

export function renderCareerEmail(reports, { bookingUrl = '', marketing = false } = {}) {
  const titles = reports.map((r) => r.title);
  const subject = `Your AI career check: ${listTitles(titles)}`.replace(/[\r\n]/g, ' ').slice(0, 150);
  const preheader = 'How exposed your chosen paths are to AI, the tasks behind them, and what to do next.';
  const text = ['YOUR AI CAREER CHECK', ...reports.map((r) => `- ${r.title} (${kindLabel(r.kind)})`), '', 'THE SHORT VERSION',
    '1. Jobs are made of tasks.',
    '2. AI exposure means how many of a job’s tasks AI can do. We rank every UK job from 0 to 100: a score of 90 means more exposed than 90% of jobs.',
    `3. Studies link higher AI exposure to fewer entry-level jobs: AI is doing the tasks juniors used to do. (Stanford Digital Economy Lab: ${SOURCES.stanford})`,
    `4. AI is improving faster each year, and companies are starting to use it at scale. (Epoch AI: ${SOURCES.epoch})`,
    '', 'HERE’S HOW EXPOSED YOUR CHOSEN CAREER PATHS ARE:'];

  const summary = reports.map((r) => `<tr><td style="padding:12px 10px 12px 0;border-top:1px solid #d9dccd;font-family:${SANS};font-size:15px;line-height:1.35;color:${INK}"><span style="display:block;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${MUTED};font-weight:700">${kindLabel(r.kind)}</span><strong style="font-weight:700">${escape(r.title)}</strong></td><td align="right" style="padding:12px 0;border-top:1px solid #d9dccd;width:1%;vertical-align:middle">${pill(r.aiExposure, { size: 14 })}</td></tr>`).join('');
  reports.forEach((r) => text.push(`- ${r.title}: ${bandFor(r.aiExposure?.score).label}${score(r.aiExposure) !== null ? ` (${score(r.aiExposure)}/100)` : ''}`));
  const cards = reports.map((r, i) => renderPath(r, i, text)).join('');

  text.push('', 'EVERY CHILD NEEDS A PLAN A, B AND Z',
    'Plan A: their preference. The career they want most. Build the skills employers pay more for. Jobs that need AI skills pay 62% more on average (PwC, 2026).',
    'Plan B: a good alternative. Close to their interests, and less exposed to AI.',
    'Plan Z: a lifeboat. Work that is barely exposed to AI, so they are secure even in a very disruptive job market.');

  let cta = '';
  if (/^https:\/\//.test(bookingUrl)) {
    text.push('', 'TURN THIS REPORT INTO AN ACTION PLAN',
      'Book a free call with Ben. We’ll look at your child’s interests and strengths, choose the paths that suit them best, and build a Plan A, B and Z the whole family is happy with.',
      'We only work with 5 families a month, so every plan gets proper time. Book now to secure a place.',
      `Get advice: ${bookingUrl}`);
    cta = `<tr><td style="padding:8px 0 22px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${INK}" style="width:100%;background:${INK};border-radius:22px"><tr><td style="padding:30px 26px 32px">
<table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td width="46" height="46" bgcolor="${SUN}" style="width:46px;height:46px;background:${SUN};border-radius:23px;font-size:1px;line-height:1px">&nbsp;</td></tr></table>
<p style="margin:20px 0 8px;font-family:${SANS};font-size:12px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;color:#ffc9a3">Your next step</p>
<h2 style="margin:0 0 14px;font-family:${SERIF};font-size:30px;line-height:1.15;font-weight:400;color:#fffaf0">Turn this report into an action plan.</h2>
<p style="margin:0 0 16px;font-family:${SANS};font-size:15px;line-height:1.65;color:#e6e9dd">Book a free call with Ben. We’ll look at your child’s interests and strengths, choose the paths that suit them best, and build a Plan A, B and Z the whole family is happy with.</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%"><tr><td style="border-left:4px solid ${SUN};padding:2px 0 2px 14px;font-family:${SANS};font-size:15px;line-height:1.55;color:#fffaf0"><strong>We only work with 5 families a month,</strong> so every plan gets proper time. Book now to secure a place.</td></tr></table>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:24px"><tr><td bgcolor="${SUN}" style="background:${SUN};border-radius:999px"><a href="${escape(bookingUrl)}" style="display:inline-block;padding:16px 28px;font-family:${SANS};font-size:17px;font-weight:700;color:${INK};text-decoration:none;border-radius:999px">Get advice: book a call &rarr;</a></td></tr></table>
<p style="margin:24px 0 0;font-family:${SANS};font-size:13px;line-height:1.5;color:#e6e9dd"><strong style="color:#fffaf0">Ben Grime</strong>, founder of Stable Future<br>Former AI Consultant · MSc Data Science</p>
</td></tr></table></td></tr>`;
  }

  const followUp = marketing ? 'We’ll also send a few short emails about planning your child’s career, as you asked; each one has an unsubscribe link.' : 'We won’t email you again unless you ask.';
  text.push('', 'HOW WE SCORE', `${SCORING} ${TASK_NOTE}`,
    `Wage premium: PwC Global AI Jobs Barometer, June 2026: ${SOURCES.pwc}`,
    '', `You asked for this report at stablefuture.uk. ${followUp} Reply to this email to reach Ben.`, `Privacy: ${SITE}/privacy`, 'Stable Future · stablefuture.uk');

  const plan = `<tr><td style="padding:6px 0 22px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${CARD}" style="width:100%;background:${CARD};border-radius:18px"><tr><td style="padding:26px 24px 20px">${h2('Every child needs a Plan A, B and Z.')}
${[['A', 'Their preference.', `The career they want most, plus the skills employers pay more for. Jobs that need AI skills pay <strong>62% more</strong> on average (${link(SOURCES.pwc, 'PwC, 2026')}).`, { bg: SUN, ink: INK }], ['B', 'A good alternative.', 'Close to their interests, and less exposed to AI.', { bg: '#b0b79c', ink: INK }], ['Z', 'A lifeboat.', 'Work that’s barely exposed to AI. So they’re secure even in a very disruptive job market.', { bg: INK, ink: '#fffaf0' }]].map(([letter, lead, rest, band]) => `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;margin-bottom:12px"><tr><td width="44" style="width:44px;vertical-align:top"><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td width="34" height="34" align="center" bgcolor="${band.bg}" style="width:34px;height:34px;background:${band.bg};border-radius:17px;font-family:${SERIF};font-size:18px;color:${band.ink};text-align:center">${letter}</td></tr></table></td><td style="vertical-align:top;font-family:${SANS};font-size:15px;line-height:1.55;color:${INK};padding-top:5px"><strong>${lead}</strong> ${rest}</td></tr></table>`).join('')}</td></tr></table></td></tr>`;

  const legend = BANDS.map((b) => `<td width="20%" bgcolor="${b.bg}" style="background:${b.bg};padding:8px 2px;text-align:center;font-family:${SANS};font-size:11px;line-height:1.2;font-weight:700;color:${b.ink};border-left:3px solid ${CARD}">${b.label}</td>`).join('');
  const step = (n, lead, rest) => `<tr><td width="34" style="width:34px;vertical-align:top;padding:0 0 12px"><span style="display:inline-block;width:24px;height:24px;line-height:24px;border-radius:12px;background:${INK};color:#fffaf0;text-align:center;font-family:${SANS};font-size:12px;font-weight:700">${n}</span></td><td style="vertical-align:top;padding:2px 0 12px;font-family:${SANS};font-size:15px;line-height:1.55;color:${INK}"><strong>${lead}</strong>${rest ? ` ${rest}` : ''}</td></tr>`;

  const html = `<!doctype html><html lang="en-GB" xmlns="http://www.w3.org/1999/xhtml"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only"><title>${escape(subject)}</title><style>:root{color-scheme:light only}a{color:${INK}}@media (max-width:480px){.px{padding-left:16px!important;padding-right:16px!important}}</style></head>
<body style="margin:0;padding:0;background:${PAPER};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">${escape(preheader)}${'&#847;&zwnj;&nbsp;'.repeat(40)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${PAPER}" style="width:100%;background:${PAPER}"><tr><td align="center" class="px" style="padding:28px 14px 36px">
<!--[if mso]><table role="presentation" width="600" align="center" cellspacing="0" cellpadding="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px">
<tr><td style="padding:0 4px 22px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td style="font-family:${SANS};font-size:19px;font-weight:700;letter-spacing:-0.5px;color:${INK}">stable future &#8599;</td><td align="right"><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td width="30" height="30" bgcolor="${SUN}" style="width:30px;height:30px;background:${SUN};border-radius:15px;font-size:1px;line-height:1px">&nbsp;</td></tr></table></td></tr></table></td></tr>
<tr><td style="padding:0 4px 20px"><h1 style="margin:0 0 10px;font-family:${SERIF};font-size:38px;line-height:1.1;font-weight:400;color:${INK}">Your AI career check</h1><table role="presentation" cellspacing="0" cellpadding="0" border="0">${reports.map((r) => `<tr><td width="18" style="width:18px;vertical-align:top;padding:3px 0;font-family:${SANS};font-size:16px;line-height:1.5;color:${SUN}">&#9679;</td><td style="padding:3px 0;font-family:${SANS};font-size:16px;line-height:1.5;color:${INK}">${escape(r.title)} <span style="color:${MUTED};font-size:13px">· ${kindLabel(r.kind)}</span></td></tr>`).join('')}</table></td></tr>
<tr><td style="padding:0 0 22px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${SAGE}" style="width:100%;background:${SAGE};border-radius:18px"><tr><td style="padding:22px 22px 12px">
<p style="margin:0 0 14px;font-family:${SANS};font-size:12px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;color:${MUTED}">The short version</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%">
${step(1, 'Jobs are made of tasks.', '')}
${step(2, 'AI exposure means how many of a job’s tasks AI can do.', 'We rank every UK job from 0 to 100. A score of 90 means more exposed than 90% of jobs.')}
${step(3, 'Studies link higher AI exposure to fewer entry-level jobs.', `AI is doing the tasks juniors used to do. (${link(SOURCES.stanford, 'Stanford Digital Economy Lab')})`)}
${step(4, 'AI is improving faster each year,', `and companies are starting to use it at scale. (${link(SOURCES.epoch, 'Epoch AI')})`)}
</table></td></tr></table></td></tr>
<tr><td style="padding:0 0 22px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${CARD}" style="width:100%;background:${CARD};border-radius:18px"><tr><td style="padding:24px 24px 22px">
${h2('Here’s how exposed your chosen career paths are:', 'font-size:24px')}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse">${summary}</table>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;table-layout:fixed;margin-top:18px"><tr>${legend}</tr></table>
${small('Each band holds about a fifth of UK jobs.')}
</td></tr></table></td></tr>
${cards}${plan}${cta}
<tr><td style="padding:8px 6px 0;font-family:${SANS};font-size:12px;line-height:1.65;color:${MUTED}">
<p style="margin:0 0 10px"><strong>How we score.</strong> ${SCORING} ${TASK_NOTE}</p>
<p style="margin:0 0 10px">You asked for this report at ${link(SITE, 'stablefuture.uk')}. ${followUp} Reply to this email to reach Ben. ${link(`${SITE}/privacy`, 'Privacy notice')}.</p>
<p style="margin:0">Stable Future</p>
</td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table></body></html>`;
  return { subject, html, text: text.join('\n') };
}

/**
 * @param {{loadReports: () => Promise<any[]>, fetchImpl?: typeof fetch, apiKey?: string, from?: string, replyTo?: string, bookingUrl?: string, now?: () => number, rateLimit?: number, rateWindowMs?: number, subscribe?: (email: string) => Promise<boolean>}} options
 */
export function createCareerResultsHandler({ loadReports, fetchImpl = fetch, apiKey, from = 'Ben at Stable Future <talk@stablefuture.uk>', replyTo = 'ben@stablefuture.uk', bookingUrl = '', now = Date.now, rateLimit = 5, rateWindowMs = 15 * 60 * 1000, subscribe } = {}) {
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
    const marketing = body.marketing === true;
    const rendered = renderCareerEmail(selected, { bookingUrl, marketing });
    try {
      const response = await fetchImpl('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from, to: [email], ...(replyTo ? { reply_to: replyTo } : {}), ...rendered, tags: [{ name: 'type', value: 'career_check' }] }), signal: AbortSignal.timeout(15000) });
      const result = await response.json().catch(() => null);
      if (!response.ok || typeof result?.id !== 'string' || !result.id) return json({ error: 'We could not send your report. Please try again later.' }, 502);
      if (subscribe && marketing) {
        const subscribed = await subscribe(email).catch(() => false);
        if (!subscribed) return json({ ok: true, warning: 'Your report is on its way, but we could not add you to follow-up emails.' });
      }
      return json({ ok: true });
    } catch { return json({ error: 'We could not send your report. Please try again later.' }, 502); }
  };
}
