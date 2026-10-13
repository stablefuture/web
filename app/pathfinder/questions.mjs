// Pathfinder v1 for paying families: questions only. Students see no results; Ben analyses
// the answers. Shared by the form and the API so both validate the same shape.
export const QUESTIONS_VERSION = 'pathfinder-questions-2026-10-13f';

export const STAGES = ['Year 9 or below', 'Year 10', 'Year 11', 'Year 12', 'Year 13', 'At college', 'At university', 'Finished education'];
export const IDEAS = ['Not yet', 'A few ideas', 'I know what I want'];
// Only things a student can check for a career before starting it. The third item names the data
// Ben checks each against (pay: ONS; openings: DfE Skills Imperative; AI: Eloundou et al.).
export const VALUES = [
  ['pay', 'Good pay', 'ONS median pay'],
  ['openings', 'Lots of jobs to apply for', 'DfE job openings'],
  ['ai', 'Security as AI changes jobs', 'AI exposure'],
  ['independence', 'Freedom to make my own decisions', 'O*NET 1.B.2.f Independence'],
  ['secure', 'Steady, secure work', 'DfE job openings forecasts'],
  ['quick', 'Getting into work quickly', 'training length'],
];
// Every scale runs from most negative (1) to most positive (N), left to right.
// O*NET Interest Profiler Short Form scale, in our words. 1–5, summed per RIASEC area (10–50).
export const LIKE = ['Not at all', 'Not really', 'Not sure', 'Quite a bit', 'A lot'];
export const PREFERENCE = ['Must avoid', 'Rather not', 'Don’t mind', 'Prefer', 'Must have'];
export const NEXT = ['Sixth form or college', 'University', 'Apprenticeship', 'Straight into work', 'Gap year'];
export const MOVE = ['I’d rather stay near home', 'Maybe, for the right thing', 'Happy to move anywhere'];
export const DEBT = ['I want to avoid it', 'Some worry', 'Not a worry'];
export const AI_FEEL = ['Very worried', 'A bit worried', 'A bit excited', 'Very excited'];

// Open questions near the end, for the O*NET work values a student can't check before starting a job
// (1.B.2.a Achievement, d Relationships, e Support, c Recognition). Each has a prompt to get them thinking.
export const REFLECT = [
  ['achievement', 'When have you felt really proud of something you did?', 'What were you doing, and what made it feel good?'],
  ['relationships', 'Who would you like to work with, or help?', 'Think about the people you’d help, and the kind of team you’d enjoy.'],
  ['support', 'What helps you do your best?', 'Clear instructions, someone checking in, or being left to get on with it?'],
  ['recognition', 'How much does it matter to you to be respected, promoted, or in charge?', 'Would you like to lead people one day, or would you rather not?'],
];

export const PREFERENCES = [
  ['outdoors', 'Working outdoors'], ['team', 'Working in a team'], ['people', 'Lots of contact with people'],
  ['autonomy', 'Freedom to make your own decisions'], ['pressure', 'Working to tight deadlines'],
  ['helping', 'Helping and caring for others'], ['improving', 'Improving how things work'],
  ['travel', 'Travelling for work'], ['hours', 'Regular nine-to-five hours'], ['physical', 'Physical, hands-on work'],
];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const text = (v, max) => typeof v === 'string' ? v.replace(/\r/g, '').trim().slice(0, max) : '';
const pick = (v, list) => list.includes(v) ? v : '';
const int = (v, min, max) => Number.isInteger(v) && v >= min && v <= max ? v : null;

export function emptyAnswers(activityCount = 60) {
  return { k: '', name: '', email: '', stage: '', ideas: '', picks: [], ideasText: '', goal: '', values: [], activities: Array(activityCount).fill(0), areaVotes: {}, areas: [], avoidAreas: [], topAreas: [], preferences: {}, reflect: {}, subjects: '', next: {}, move: '', debt: '', ai: '', aiText: '', extra: '' };
}

/** Validates a submission. Throws with a message a student can act on. */
export function parseAnswers(body, { activityCount = 60, areaIds = [], linked = false } = {}) {
  if (!body || typeof body !== 'object' || body.website) throw new Error('Please check your answers.');
  const ids = new Set(areaIds);
  const a = {
    name: text(body.name, 60).replace(/\n/g, ' '),
    email: text(body.email, 254).toLowerCase(),
    stage: pick(body.stage, STAGES),
    ideas: pick(body.ideas, IDEAS), ideasText: text(body.ideasText, 2000),
    picks: Array.isArray(body.picks) ? body.picks.filter(x => x && /^(st|job|hecos|soc|cah)[:A-Za-z0-9._-]{1,40}$/.test(x.id) && ['job', 'degree', 'apprenticeship'].includes(x.kind)).slice(0, 10).map(x => ({ id: x.id, kind: x.kind, title: text(x.title, 120).replace(/\n/g, ' ') })) : [], goal: text(body.goal, 2000),
    values: Array.isArray(body.values) ? [...new Set(body.values.filter(v => VALUES.some(([id]) => id === v)))].slice(0, 3) : [],
    activities: Array.from({ length: activityCount }, (_, i) => int(body.activities?.[i], 1, 5) ?? 0),
    areas: Array.isArray(body.areas) ? [...new Set(body.areas.filter(v => ids.has(v)))] : [],
    avoidAreas: Array.isArray(body.avoidAreas) ? [...new Set(body.avoidAreas.filter(v => ids.has(v)))] : [],
    topAreas: [], preferences: {}, reflect: {}, next: {},
    subjects: text(body.subjects, 2000), move: pick(body.move, MOVE), debt: pick(body.debt, DEBT),
    ai: pick(body.ai, AI_FEEL), aiText: text(body.aiText, 2000), extra: text(body.extra, 3000),
  };
  a.topAreas = Array.isArray(body.topAreas) ? [...new Set(body.topAreas.filter(v => a.areas.includes(v)))].slice(0, 3) : [];
  a.avoidAreas = a.avoidAreas.filter(v => !a.areas.includes(v));
  for (const [id] of REFLECT) { const v = text(body.reflect?.[id], 1000); if (v) a.reflect[id] = v; }
  for (const option of NEXT) { const n = body.next?.[option]; if (n === 1 || n === -1) a.next[option] = n; }
  for (const [id] of PREFERENCES) { const n = int(body.preferences?.[id], 1, 5); if (n !== null) a.preferences[id] = n; }
  if (!a.name) throw new Error('Please add your first name.');
  if (!linked && !EMAIL.test(a.email)) throw new Error('Please add the email your parent or carer used to sign up.');
  if (!EMAIL.test(a.email)) a.email = '';
  if (!a.stage) throw new Error('Please choose where you are in education.');
  if (a.activities.some(v => !v)) throw new Error('Please answer every activity question.');
  if (a.areas.length < 3) throw new Error('Please choose at least three interest areas.');
  return a;
}

// O*NET 30.0 interest areas (ids from assessment-direct-interests.json), British spelling.
export const AREAS = [["1.B.3.ai","Accounting"],["1.B.3.f","Agriculture"],["1.B.3.h","Animal care"],["1.B.3.s","Applied arts and design"],["1.B.3.i","Sport"],["1.B.3.ae","Business ideas"],["1.B.3.b","Construction and woodwork"],["1.B.3.v","Creative writing"],["1.B.3.x","Cooking"],["1.B.3.j","Engineering"],["1.B.3.ah","Finance"],["1.B.3.aa","Health care"],["1.B.3.aj","Human resources"],["1.B.3.o","Humanities"],["1.B.3.q","IT"],["1.B.3.ao","Law"],["1.B.3.l","Life sciences"],["1.B.3.al","Management and admin"],["1.B.3.ag","Marketing and advertising"],["1.B.3.p","Maths and statistics"],["1.B.3.a","Mechanics and electronics"],["1.B.3.w","Media"],["1.B.3.m","Medical science"],["1.B.3.u","Music"],["1.B.3.g","Nature and outdoors"],["1.B.3.ak","Office work"],["1.B.3.t","Performing arts"],["1.B.3.ac","Personal services"],["1.B.3.k","Physical sciences"],["1.B.3.d","Physical and manual work"],["1.B.3.an","Politics"],["1.B.3.ad","Advising people"],["1.B.3.e","Protective services"],["1.B.3.am","Public speaking"],["1.B.3.ab","Religion"],["1.B.3.af","Sales"],["1.B.3.n","Social sciences"],["1.B.3.z","Social care"],["1.B.3.y","Teaching"],["1.B.3.c","Driving and machines"],["1.B.3.r","Visual arts"]];
