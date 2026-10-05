// Copy for the home page. Every figure carries its source.
// Checked 4 October 2026.

export const SOURCES = {
  ale: { label: 'Agents’ Last Exam leaderboard, October 2026', href: 'https://agents-last-exam.org/leaderboard' },
  stanford: { label: 'Stanford Digital Economy Lab', href: 'https://digitaleconomy.stanford.edu/project/indicators/canaries-dashboard/' },
  epoch: { label: 'Epoch AI', href: 'https://epoch.ai/' },
  mercor: { label: 'Mercor, October 2026', href: 'https://www.mercor.com/blog/human-baselines-for-benchmarks-ai-now-outperforms-junior-accountants/' },
  pwc: { label: 'PwC Global AI Jobs Barometer, June 2026', href: 'https://www.pwc.com/gx/en/news-room/press-releases/2026/pwc-2026-ai-jobs-barometer.html' },
};

export const CHECK_URL = '/ai-career-check';
export const CALL_URL = '/call';

export const HERO = {
  eyebrow: 'AI career advice for families',
  title: 'Is your child’s career path ready for AI?',
  lede: 'AI now does much of the work that new starters used to learn on. We help families choose a path that will still pay well, and build the skills to get there.',
  audience: 'For parents of students from Year 10 to university.',
  cta: 'Check their career path',
  ctaNote: 'Free · 2 minutes · report by email',
  secondary: 'Get advice',
};

export const AI = {
  eyebrow: 'What AI can do now',
  title: 'AI doesn’t just answer questions any more. It does the work.',
  intro: 'These are three real tasks from Agents’ Last Exam, a test built by UC Berkeley with more than 300 industry experts. Each one is a project that took a professional days or weeks.',
  statsTitle: 'AI vs a human expert, on the same projects',
  // Per-task averages for Codex with GPT-5.6 Luna (ranked 8th): the leaderboard's Overall
  // total runtime and estimated cost (66h 7m, $235) over the 160 public tasks (67 + 55 + 38).
  // Human cost is our estimate.
  stats: [
    { value: 'Days → 25 min', label: 'Experts took days or weeks on each project. Given only the brief and the files, a leading AI agent worked through it on its own in about 25 minutes.', source: 'ale' as const },
    { value: '£1,000s → £1', label: 'Days or weeks of a professional’s time can cost thousands of pounds. Each AI run cost about £1.', source: 'ale' as const },
  ],
  note: 'Animations illustrate the benchmark tasks.',
};

export const JOBS = {
  eyebrow: 'What it means for jobs',
  title: 'Jobs are made of tasks. AI is taking the junior ones first.',
  points: [
    { lead: 'Jobs are made of tasks.', rest: '' },
    { lead: 'AI exposure means how many of a job’s tasks AI can do.', rest: '' },
    { lead: 'Studies link higher AI exposure to fewer entry-level jobs.', rest: 'AI is doing the tasks juniors used to do.', source: 'stanford' as const },
    { lead: 'AI is improving faster each year,', rest: 'and companies are starting to use it at scale.', source: 'epoch' as const },
  ],
  stat: { value: '19%', label: 'Employment of 22 to 25-year-olds in the most AI-exposed jobs is about 19% below where it would otherwise be.', source: 'stanford' as const },
  pyramid: [
    { label: 'Before AI', text: 'Juniors learn the job by doing the simple tasks.' },
    { label: 'Now', text: 'AI does many of those tasks, so firms hire fewer juniors.' },
    { label: 'Next', text: 'New starters must work like seniors: set goals, check AI’s work, use judgement. The bar rises.' },
  ],
  checkPrompt: 'How exposed is your child’s path?',
};

export const FAMILIES = {
  eyebrow: 'What families should do',
  title: 'Your child will spend 80,000 hours in their career. Help them choose well.',
  titleParts: ['Your child will spend ', '80,000 hours', ' in their career. Help them choose well.'],
  intro: 'Choosing a career was already one of life’s biggest decisions. AI makes it bigger. Four moves make the difference.',
  moves: [
    { n: '01', title: 'Avoid dead ends', text: 'Don’t start in a career where AI already does most of the junior work, unless your child is truly exceptional at it. Take accountancy: on month-end accounting tasks, AI now beats junior accountants, getting every attempt right in under 10 minutes.', source: 'mercor' as const },
    { n: '02', title: 'Pick a direction', text: 'Match their interests, strengths, and preferences to careers with growing demand. Then find the best way in: university, an apprenticeship, or straight into work.' },
    { n: '03', title: 'Learn to work with AI', text: 'In every career, AI will take some tasks and leave others. People who do the human parts well, and use AI for the rest, earn more.', stat: { value: '62%', label: 'higher pay, on average, for jobs that need AI skills', source: 'pwc' as const } },
    { n: '04', title: 'Make a Plan A, B and Z', text: 'Plan A is the career they want most. Plan B is a good alternative that’s less exposed to AI. Plan Z is a lifeboat: work that’s barely exposed at all. So they’re secure even in a very disruptive job market.' },
  ],
  plans: [
    { key: 'A', title: 'Plan A: their preference', text: 'The career they want most, plus the skills employers pay more for.' },
    { key: 'B', title: 'Plan B: a good alternative', text: 'Close to their interests, and less exposed to AI.' },
    { key: 'Z', title: 'Plan Z: a lifeboat', text: 'Barely exposed to AI, so it’s there whatever happens.' },
  ],
};

export const WHO = {
  eyebrow: 'Who we are',
  title: 'You’re in safe hands.',
  greeting: 'Hi, I’m Ben.',
  bio: [
    'I used to build AI for businesses. As an AI Consultant, I’ve helped career coaches, environmental consultants, civil engineers, the NHS, and the University of Oxford. I saw how quickly AI was taking on work people had trained for years to do.',
    'So I left to help young people get ahead of it. I’ve tutored and mentored students of all ages since 2021. Now I spend my days tracking how AI is changing UK jobs, and turning that into advice families can act on.',
  ],
  credentials: ['MSc Data Science, Lancaster', 'BA Maths and Philosophy, Lancaster', 'Machine learning researcher, University of Oxford', 'Statistician, NHS', 'AI Consultant, Waterman Group', 'Data Scientist, career coaching startup', 'Tutor and mentor'],
  data: [
    { value: '1,182', label: 'UK jobs broken into their tasks and scored for AI exposure' },
    { value: '780', label: 'degree subjects and apprenticeships traced to the jobs they lead to' },
    { value: '1', label: 'plan your whole family agrees on' },
  ],
  dataNote: 'Built on ONS job and task data, HESA graduate outcomes, and the latest research.',
  outcomes: 'We work towards outcomes, not information. You won’t get a pile of reports. You’ll get a plan your child believes in, and the skills to make it work.',
  steps: [
    { title: 'Career test', text: 'Your child takes Pathfinder, our career test. Ben studies the results.' },
    { title: 'Options session', text: 'Ben takes the family through the best paths for your child, and you narrow them down together.' },
    { title: 'Plan A, B and Z', text: 'You agree one plan the whole family is happy with.' },
    { title: 'Skills plan', text: 'For Plan A, Ben finds the skills employers pay thousands more for and sets out how to build them, such as a job-specific AI project.' },
  ],
  leaveWith: ['A direction your child is excited about', 'A backup plan if things change', 'A project that sets them apart'],
};

export const ADVICE = {
  eyebrow: 'Get advice',
  title: 'Let’s make your child’s plan.',
  intro: 'Tell us a little about your child. Ben will reply personally to arrange a call.',
  scarcity: 'We only work with 10 families a month,',
  scarcityRest: 'so every plan gets proper time. Get in touch now to secure a place.',
  placeholder: 'For example: my daughter is in Year 12. She loves biology and is torn between medicine and a biomedical science degree.',
  privacy: 'We only use these details to reply to you. See our privacy notice.',
  button: 'Get advice',
  bookInstead: 'Prefer to pick a time now?',
  bookLink: 'Book a call',
};
