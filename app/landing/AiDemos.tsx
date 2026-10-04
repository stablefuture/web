'use client';

import { useState } from 'react';
import { AI, SOURCES } from './content';
import { at, ease, typed, useClock, useInView } from './motion';
import s from './demos.module.css';

// Three animated illustrations of real Agents' Last Exam tasks. Each is a pure
// function of the clock `t`, so it can pause, replay, and respect reduced motion.

type Demo = { id: string; tab: string; title: string; task: string; before: string; shows: string; run: number };
const HOLD = 3200;
const DEMOS: Demo[] = [
  { id: 'tax', tab: 'Tax return', title: 'Fill in a tax return', task: 'Turn a pile of paperwork into a finished tax return, in a real web browser.', before: 'Accountants and tax advisers', shows: 'AI reads documents, fills in forms, and checks its own sums.', run: 10400 },
  { id: 'xray', tab: 'Chest X-ray', title: 'Read a chest X-ray', task: 'Study the scan, mark the problem, and write the report a doctor signs.', before: 'Radiologists, after years of training', shows: 'AI can see, measure, and explain what it finds.', run: 10800 },
  { id: 'film', tab: 'Film edit', title: 'Edit a highlights film', task: 'Turn raw festival footage into a finished film that follows the director’s brief, in professional editing software.', before: 'Video editors', shows: 'AI now does creative work, in the same software people use.', run: 10600 },
];

function Status({ text, done }: { text: string; done: boolean }) {
  return <span className={s.status} data-done={done || undefined}><i />{text}</span>;
}

function Window({ title, status, done, children, dark }: { title: string; status: string; done: boolean; children: React.ReactNode; dark?: boolean }) {
  return <div className={s.window} data-dark={dark || undefined}>
    <div className={s.bar}><span className={s.lights}><i /><i /><i /></span><span className={s.title}>{title}</span><Status text={status} done={done} /></div>
    <div className={s.body}>{children}</div>
  </div>;
}

/* ---------- Tax return ---------- */
const DOCS = [
  { name: 'P60 · end of year certificate', value: 'Pay £62,400 · Tax paid £12,392' },
  { name: 'Bank statement', value: 'Interest £640' },
  { name: 'Pension statement', value: 'Paid in £4,000' },
  { name: 'Gift Aid receipts', value: 'Donated £800' },
];
const FIELDS = [
  { group: 'Income', label: 'Pay from employment', value: '£62,400', doc: 0 },
  { group: '', label: 'Tax already paid', value: '£12,392', doc: 0 },
  { group: '', label: 'UK bank interest', value: '£640', doc: 1 },
  { group: 'Reliefs', label: 'Pension contributions', value: '£4,000', doc: 2 },
  { group: '', label: 'Gift Aid donations', value: '£800', doc: 3 },
];
function TaxDemo({ t }: { t: number }) {
  const docStart = (i: number) => 900 + i * 1500;
  const reading = DOCS.findIndex((_, i) => t >= docStart(i) && t < docStart(i) + 1500);
  const checking = at(t, 7000, 1500);
  const done = t > 9000;
  const status = t < 900 ? 'Opening the return…' : reading >= 0 ? `Reading ${DOCS[reading].name.split(' ·')[0]}…` : t < 8600 ? 'Checking every total…' : done ? 'Ready to submit' : 'Working out the refund…';
  const log = [
    t > 300 && 'Opening the tax return',
    ...DOCS.map((d, i) => t > docStart(i) + 800 && `Read ${d.name.split(' ·')[0]}: ${d.value.toLowerCase()}`),
    t > 7000 && `Checked ${Math.round(24 * checking)} of 24 totals`,
    done && 'Done. Refund due: £1,144.00',
  ].filter(Boolean) as string[];
  return <Window title="Tax return 2025–26" status={status} done={done}>
    <div className={s.tax}>
      <div className={s.docs}>
        <p className={s.paneLabel}>Paperwork</p>
        {DOCS.map((d, i) => {
          const p = at(t, docStart(i), 1500);
          return <div key={d.name} className={s.doc} data-active={reading === i || undefined} data-read={p >= 1 || undefined} style={{ ['--scan' as string]: ease(at(t, docStart(i), 1000)) }}>
            <strong>{d.name}</strong>
            <span className={s.lines}><i /><i /><i /></span>
            <mark data-on={p > 0.55 || undefined}>{d.value}</mark>
            {reading === i && <span className={s.scan} />}
            <span className={s.tick} aria-hidden="true">✓</span>
          </div>;
        })}
      </div>
      <div className={s.form}>
        <p className={s.paneLabel}>Return</p>
        {FIELDS.map((f, i) => {
          const fill = at(t, docStart(f.doc) + 900 + (i % 2) * 250, 500);
          const checked = checking * FIELDS.length > i + 0.5;
          return <div key={f.label}>
            {f.group && <p className={s.group}>{f.group}</p>}
            <div className={s.field} data-filling={fill > 0 && fill < 1 || undefined} data-checked={checked || undefined}>
              <span>{f.label}</span><b>{typed(f.value, fill)}{fill > 0 && fill < 1 && <i className={s.caret} />}</b><em aria-hidden="true">✓</em>
            </div>
          </div>;
        })}
        <div className={s.total} data-on={t > 8600 || undefined}><span>Refund due</span><b>{typed('£1,144.00', at(t, 8600, 500))}</b></div>
        <span className={s.stamp} data-on={done || undefined}>Checked · ready to submit</span>
      </div>
    </div>
    <div className={s.log}>{log.slice(-3).map((l, i, all) => <p key={l} data-last={i === all.length - 1 || undefined}><span>›</span> {l}</p>)}</div>
  </Window>;
}

/* ---------- Chest X-ray ---------- */
const REPORT = [
  ['FINDINGS', ''],
  ['Lungs', '14 mm rounded opacity in the right upper zone. No other focal lesion.'],
  ['Heart', 'Normal size.'],
  ['Pleura', 'No effusion. No pneumothorax.'],
  ['IMPRESSION', ''],
  ['', 'Right upper zone nodule. Recommend CT chest to assess further.'],
];
const REPORT_STARTS = REPORT.reduce<number[]>((acc, _, i) => [...acc, i ? acc[i - 1] + REPORT[i - 1][0].length + REPORT[i - 1][1].length : 0], []);
const REPORT_CHARS = REPORT.reduce((n, [a, b]) => n + a.length + b.length, 0);
const RIBS = Array.from({ length: 9 }, (_, i) => 70 + i * 24);
function XrayDemo({ t }: { t: number }) {
  const window_ = ease(at(t, 200, 900));
  const scan = at(t, 1000, 2600);
  const heat = at(t, 3100, 700);
  const box = ease(at(t, 3800, 900));
  const chars = Math.round(REPORT_CHARS * at(t, 4900, 4800));
  const lines = REPORT.map(([head, body], i) => {
    const len = head.length + body.length;
    const n = Math.max(0, Math.min(len, chars - REPORT_STARTS[i]));
    return { head: head.slice(0, n), body: body.slice(0, Math.max(0, n - head.length)), isHead: !!head && !body, typing: n > 0 && n < len, show: n > 0 };
  });
  const done = t > 9900;
  const status = t < 1000 ? 'Adjusting contrast…' : t < 3600 ? 'Scanning both lungs…' : t < 4900 ? 'Found a 14 mm nodule' : !done ? 'Writing the report…' : 'Report ready for sign-off';
  return <Window title="Radiology viewer · PA chest" status={status} done={done} dark>
    <div className={s.xray}>
      <div className={s.viewer}>
        <svg viewBox="0 0 300 340" role="img" aria-label="Illustrated chest X-ray with a nodule marked in the right upper lung">
          <defs>
            <filter id="xr-soft"><feGaussianBlur stdDeviation="5" /></filter>
            <filter id="xr-bone"><feGaussianBlur stdDeviation="1.4" /></filter>
            <linearGradient id="xr-spine" x1="0" x2="1"><stop offset="0" stopColor="#7f8a8f" stopOpacity="0" /><stop offset=".5" stopColor="#c9d1d4" /><stop offset="1" stopColor="#7f8a8f" stopOpacity="0" /></linearGradient>
            <radialGradient id="xr-heat"><stop offset="0" stopColor="#ff8a3d" stopOpacity=".85" /><stop offset=".6" stopColor="#ff8a3d" stopOpacity=".25" /><stop offset="1" stopColor="#ff8a3d" stopOpacity="0" /></radialGradient>
            <linearGradient id="xr-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7fe3ff" stopOpacity="0" /><stop offset=".85" stopColor="#7fe3ff" stopOpacity=".35" /><stop offset="1" stopColor="#c8f4ff" stopOpacity=".9" /></linearGradient>
          </defs>
          <g style={{ filter: `contrast(${0.75 + window_ * 0.55}) brightness(${0.7 + window_ * 0.35})` }}>
            <path d="M40 330 C 30 220, 40 120, 70 70 C 100 40, 200 40, 230 70 C 260 120, 270 220, 260 330 Z" fill="#30373b" filter="url(#xr-soft)" />
            <ellipse cx="102" cy="185" rx="58" ry="118" fill="#0b0e10" filter="url(#xr-soft)" />
            <ellipse cx="198" cy="185" rx="58" ry="118" fill="#0b0e10" filter="url(#xr-soft)" />
            <ellipse cx="178" cy="238" rx="50" ry="56" fill="#9aa4a8" opacity=".42" filter="url(#xr-soft)" />
            <path d="M40 300 Q 100 250 150 290 Q 200 250 262 300 L 262 340 L 40 340 Z" fill="#a9b3b7" opacity=".55" filter="url(#xr-soft)" />
            <g filter="url(#xr-bone)" stroke="#d3dadc" fill="none" strokeLinecap="round">
              {RIBS.map((y, i) => <g key={y} opacity={0.62 - i * 0.03} strokeWidth={7 - i * 0.25}>
                <path d={`M144 ${y} C 118 ${y - 14}, 70 ${y - 6}, 50 ${y + 30}`} />
                <path d={`M156 ${y} C 182 ${y - 14}, 230 ${y - 6}, 250 ${y + 30}`} />
              </g>)}
              <path d="M146 58 C 120 52, 90 54, 64 64" strokeWidth="8" opacity=".75" />
              <path d="M154 58 C 180 52, 210 54, 236 64" strokeWidth="8" opacity=".75" />
            </g>
            <rect x="138" y="30" width="24" height="300" fill="url(#xr-spine)" filter="url(#xr-bone)" />
            <circle cx="96" cy="124" r="8.5" fill="#e3eaec" opacity=".62" filter="url(#xr-bone)" />
          </g>
          <circle cx="96" cy="124" r={34} fill="url(#xr-heat)" opacity={heat * (1 - 0.35 * box)} />
          {scan > 0 && scan < 1 && <rect x="0" y={scan * 340 - 60} width="300" height="60" fill="url(#xr-beam)" />}
          <g opacity={box > 0 ? 1 : 0}>
            <rect x="74" y="102" width="44" height="44" rx="4" fill="none" stroke="#ff8a3d" strokeWidth="2" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - box} />
            <g opacity={at(t, 4500, 300)}>
              <line x1="74" y1="154" x2="118" y2="154" stroke="#ff8a3d" strokeWidth="1.2" />
              <line x1="74" y1="150" x2="74" y2="158" stroke="#ff8a3d" strokeWidth="1.2" /><line x1="118" y1="150" x2="118" y2="158" stroke="#ff8a3d" strokeWidth="1.2" />
              <rect x="122" y="92" width="86" height="20" rx="10" fill="#ff8a3d" />
              <text x="165" y="106" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#1d3026">Nodule · 14 mm</text>
            </g>
          </g>
        </svg>
        <span className={s.vTopLeft}>PA CHEST · ADULT</span>
        <span className={s.vBottomRight}>W 1500 · L −600</span>
      </div>
      <div className={s.report}>
        <p className={s.paneLabel}>Report · draft</p>
        {lines.map((l, i) => !l.show ? null : l.isHead
          ? <p key={i} className={s.rHead}>{l.head}{l.typing && <i className={s.caret} />}</p>
          : <p key={i} className={s.rLine}>{l.head && <b>{l.head} </b>}{l.body}{l.typing && <i className={s.caret} />}</p>)}
        <span className={s.signoff} data-on={done || undefined}>✓ Ready for sign-off</span>
      </div>
    </div>
  </Window>;
}

/* ---------- Film edit ---------- */
const CLIPS = [
  { name: 'Gates open', w: 15, scene: 'dusk' },
  { name: 'Main stage', w: 19, scene: 'stage' },
  { name: 'Food stalls', w: 14, scene: 'lights' },
  { name: 'Dancers', w: 17, scene: 'dance' },
  { name: 'Fireworks', w: 20, scene: 'fireworks' },
  { name: 'Sunrise', w: 15, scene: 'sunrise' },
];
function Scene({ kind, big }: { kind: string; big?: boolean }) {
  return <span className={s.scene} data-scene-kind={kind} data-big={big || undefined}>
    {kind === 'stage' && <><i /><i /><i /></>}
    {kind === 'fireworks' && <><i /><i /><i /></>}
    {kind === 'lights' && <b />}
    {kind === 'dance' && <><i /><i /><i /><i /></>}
    {(kind === 'dusk' || kind === 'sunrise') && <i />}
  </span>;
}
function FilmDemo({ t }: { t: number }) {
  const play = at(t, 5600, 4400);
  const offsets = CLIPS.reduce<number[]>((acc, c, i) => [...acc, i ? acc[i - 1] + CLIPS[i - 1].w : 0], []);
  const current = CLIPS.findIndex((c, i) => play * 100 >= offsets[i] && play * 100 < offsets[i] + c.w);
  const placed = CLIPS.filter((_, i) => t > 900 + i * 560).length;
  const done = t > 10200;
  const status = t < 900 ? 'Watching the raw footage…' : placed < CLIPS.length ? 'Picking the best moments…' : t < 4900 ? 'Cutting to the beat…' : t < 5600 ? 'Adding titles…' : !done ? 'Playing back…' : 'Exported · 45-second recap';
  const shown = play > 0 ? CLIPS[Math.max(0, current)] : CLIPS[Math.max(0, placed - 1)];
  const seconds = Math.floor(play * 45);
  return <Window title="Festival recap · edit" status={status} done={done} dark>
    <div className={s.film}>
      <div className={s.bin}>
        <p className={s.paneLabel}>Raw footage</p>
        <div className={s.thumbs}>{CLIPS.map((c, i) => <span key={c.name} data-used={t > 900 + i * 560 || undefined}><Scene kind={c.scene} /><small>{c.name}</small></span>)}</div>
      </div>
      <div className={s.monitor}>
        {shown && <Scene key={shown.name} kind={shown.scene} big />}
        <span className={s.titleCard} data-on={(t > 5000 && play < 0.2) || undefined}>Festival 2026</span>
        <span className={s.timecode}>00:00:{String(seconds).padStart(2, '0')}:{String(Math.floor((play * 45 * 25) % 25)).padStart(2, '0')}</span>
      </div>
      <div className={s.timeline}>
        <div className={s.ruler}>{Array.from({ length: 10 }, (_, i) => <i key={i} />)}</div>
        <div className={s.track}><span className={s.trackName}>T1</span><div className={s.lane}><span className={s.titleClip} data-on={t > 5000 || undefined}>Festival 2026</span></div></div>
        <div className={s.track}><span className={s.trackName}>V1</span><div className={s.lane}>{CLIPS.map((c, i) => <span key={c.name} className={s.clip} data-on={t > 900 + i * 560 || undefined} style={{ left: `${offsets[i]}%`, width: `${c.w}%` }}><Scene kind={c.scene} /><small>{c.name}</small></span>)}</div></div>
        <div className={s.track}><span className={s.trackName}>A1</span><div className={s.lane}><span className={s.wave} style={{ clipPath: `inset(0 ${100 - at(t, 4200, 800) * 100}% 0 0)` }}>{Array.from({ length: 64 }, (_, i) => <i key={i} style={{ height: `${22 + Math.abs(Math.sin(i * 1.7) * 60 + Math.sin(i * 0.4) * 18)}%` }} />)}</span>
          {offsets.slice(1).map((o) => <b key={o} className={s.beat} style={{ left: `${o}%` }} data-on={t > 4600 || undefined} />)}</div></div>
        <span className={s.playhead} style={{ left: `calc(34px + (100% - 34px) * ${play})` }} data-on={play > 0 || undefined} />
      </div>
    </div>
  </Window>;
}

const RENDER: Record<string, (p: { t: number }) => React.ReactNode> = { tax: TaxDemo, xray: XrayDemo, film: FilmDemo };

export function AiDemos({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const [index, setIndex] = useState(0);
  const [run, setRun] = useState(0);
  const [auto, setAuto] = useState(true);
  const [ref, inView] = useInView<HTMLDivElement>(0.3);
  const demo = DEMOS[index];
  const t = useClock(inView, demo.run + HOLD, `${index}-${run}`, () => {
    if (auto) setIndex((i) => (i + 1) % DEMOS.length); else setRun((r) => r + 1);
  });
  const Render = RENDER[demo.id];
  const pick = (i: number) => { setAuto(false); setIndex(i); setRun((r) => r + 1); };
  return <div className={s.demos} data-tone={tone} ref={ref}>
    <div className={s.tabs} role="tablist" aria-label="AI tasks">
      {DEMOS.map((d, i) => <button key={d.id} role="tab" aria-selected={i === index} aria-controls="ai-demo" onClick={() => pick(i)}>
        <span>{String(i + 1).padStart(2, '0')}</span>{d.tab}
        {i === index && <i className={s.progress} style={{ transform: `scaleX(${Math.min(1, t / demo.run)})` }} />}
      </button>)}
    </div>
    <div className={s.stage} id="ai-demo" role="tabpanel" aria-label={demo.title}>
      <div className={s.screen}><Render t={t} /></div>
      <div className={s.explain}>
        <h3>{demo.title}</h3>
        <dl>
          <dt>The task</dt><dd>{demo.task}</dd>
          <dt>Who did this before</dt><dd>{demo.before}</dd>
          <dt>What it shows</dt><dd>{demo.shows}</dd>
        </dl>
        <button type="button" className={s.replay} onClick={() => { setAuto(false); setRun((r) => r + 1); }}>↻ Watch again</button>
      </div>
    </div>
    <div className={s.stats}>
      {AI.stats.map((x) => <div key={x.label}><b>{x.value}</b><span>{x.label} <a href={SOURCES[x.source].href} target="_blank" rel="noopener">{SOURCES[x.source].label}</a></span></div>)}
    </div>
    <p className={s.source}>{AI.note} Agents’ Last Exam is run by UC Berkeley RDI.</p>
  </div>;
}
