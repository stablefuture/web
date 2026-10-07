'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { AiDemos } from './AiDemos';
import { ADVICE, AI, CHECK_URL, FAMILIES, HERO, JOBS, WHO } from './content';
import { clamp, ease, lerp, reducedMotion, useScrollScenes } from './motion';
import { AbzPaths, AdviceForm, BandScale, Cite, Pyramid } from './Parts';
import s from './dawn.module.css';

// Design A, "Dawn": one sky that moves from night to full sun as you scroll.
// Each section names its sky; the colours blend between section centres.
const SKIES: Record<string, [string, string, string]> = {
  night: ['#06110c', '#0d2018', '#1a2e24'],
  predawn: ['#0b1a16', '#1b3330', '#33463f'],
  dawn: ['#2f4c5a', '#f29a6b', '#ffc58f'],
  sunrise: ['#f4dcc0', '#fae7cf', '#ffd2a2'],
  morning: ['#f6efe1', '#f7f1e5', '#f9e6cc'],
  noon: ['#fff3df', '#ffe8c8', '#ffcf98'],
};
const DARK = new Set(['night', 'predawn']);
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const blend = (a: string, b: string, p: number) => hex(a).map((v, i) => Math.round(lerp(v, hex(b)[i], p)));
const rgb = (c: number[]) => `rgb(${c.join(',')})`;

// Deterministic star field (same on server and client).
const STARS = Array.from({ length: 70 }, (_, i) => {
  const r = (n: number) => { const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453; return x - Math.floor(x); };
  const round = (v: number) => Math.round(v * 100) / 100;
  return { x: round(r(1) * 100), y: round(r(2) * 70), size: round(1 + r(3) * 2.2), delay: round(r(4) * 4) };
});
const PATHS = 13;

export default function Dawn() {
  const root = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);

  useScrollScenes(root);

  useEffect(() => {
    const el = root.current;
    const art = svg.current;
    if (!el || !art) return;
    const sections = Array.from(el.querySelectorAll<HTMLElement>('[data-sky]'));
    const lines = Array.from(art.querySelectorAll<SVGPathElement>('path'));
    let raf = 0;
    const frame = () => {
      raf = 0;
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const mid = window.scrollY + vh * 0.5;
      const centres = sections.map((n) => n.offsetTop + n.offsetHeight / 2);
      let i = centres.findIndex((c) => c > mid);
      if (i === -1) i = centres.length;
      const a = sections[Math.max(0, i - 1)].dataset.sky!;
      const b = sections[Math.min(sections.length - 1, i)].dataset.sky!;
      const span = i <= 0 || i >= centres.length ? 1 : centres[i] - centres[i - 1];
      const t = i <= 0 ? 0 : i >= centres.length ? 1 : ease(clamp((mid - centres[i - 1]) / span));
      // Night to day passes through a dawn palette, so the blend never goes grey.
      const viaDawn = DARK.has(a) && !DARK.has(b) && b !== 'dawn';
      const [from, to, k] = !viaDawn ? [a, b, t] : t < 0.5 ? [a, 'dawn', t * 2] : ['dawn', b, t * 2 - 1];
      const sky = SKIES[from].map((c, j) => blend(c, SKIES[to][j], k));
      (['--sky-top', '--sky-mid', '--sky-bottom'] as const).forEach((v, j) => el.style.setProperty(v, rgb(sky[j])));
      const max = document.documentElement.scrollHeight - vh;
      const p = max > 0 ? clamp(window.scrollY / max) : 0;
      const day = clamp((p - 0.28) / 0.3);
      el.style.setProperty('--night', (1 - day).toFixed(3));
      el.style.setProperty('--day', day.toFixed(3));
      // The sun peeks over the horizon for most of the page, then rises in the
      // last section, behind the form on wide screens.
      const narrow = vw < 760;
      const low = clamp(p / 0.8);
      const high = ease(clamp((p - 0.8) / 0.2));
      const size = lerp(Math.min(vw, vh) * (narrow ? 0.5 : 0.4), Math.min(vw, vh) * (narrow ? 0.7 : 0.58), high);
      const sunY = lerp(lerp(vh + size * (narrow ? 0.38 : 0.3), vh + size * (narrow ? 0.3 : 0.12), low), narrow ? vh * 0.06 : vh * 0.42, high);
      const sunX = lerp(vw * 0.5, narrow ? vw * 0.5 : vw * 0.74, high);
      el.style.setProperty('--sun-x', `${sunX}px`);
      el.style.setProperty('--sun-y', `${sunY}px`);
      el.style.setProperty('--sun-size', `${size}px`);
      // The nav sits on the sky's top colour, so its ink follows that colour's brightness.
      const [r, g, bl] = sky[0];
      el.dataset.navTone = 0.299 * r + 0.587 * g + 0.114 * bl > 150 ? 'light' : 'dark';
      art.setAttribute('viewBox', `0 0 ${vw} ${vh}`);
      const cx = sunX;
      lines.forEach((line, k) => {
        const x = -0.35 * vw + (k * 1.7 * vw) / (PATHS - 1);
        const c1x = lerp(x, cx, 0.25);
        const c2x = lerp(x, cx, 0.82);
        const c2y = lerp(sunY, vh, 0.38);
        line.setAttribute('d', `M ${x} ${vh + 30} C ${c1x} ${vh * 0.82}, ${c2x} ${c2y}, ${cx} ${sunY}`);
      });
    };
    const request = () => { if (!raf) raf = requestAnimationFrame(frame); };
    frame();
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    if (reducedMotion()) el.dataset.still = '';
    // In-page links glide over one second instead of jumping.
    const onClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      const target = link && document.getElementById(link.hash.slice(1));
      if (!target || e.metaKey || e.ctrlKey) return;
      e.preventDefault();
      const nav = el.querySelector('header')?.getBoundingClientRect().height ?? 0;
      const from = window.scrollY;
      // A section can ask to land a little lower, past its own top padding.
      const to = target.getBoundingClientRect().top + from - nav + Number(target.dataset.scrollOffset || 0);
      if (reducedMotion()) { window.scrollTo(0, to); return; }
      const start = performance.now();
      const step = (now: number) => {
        const k = clamp((now - start) / 1000);
        window.scrollTo(0, lerp(from, to, ease(k)));
        if (k < 1) requestAnimationFrame(step); else history.replaceState(null, '', link.hash);
      };
      requestAnimationFrame(step);
    };
    el.addEventListener('click', onClick);
    return () => { window.removeEventListener('scroll', request); window.removeEventListener('resize', request); el.removeEventListener('click', onClick); if (raf) cancelAnimationFrame(raf); };
  }, []);

  return <div className={s.root} ref={root}>
    <div className={s.sky} aria-hidden="true">
      <div className={s.stars}>{STARS.map((st, i) => <i key={i} style={{ left: `${st.x}%`, top: `${st.y}%`, width: st.size, height: st.size, animationDelay: `${st.delay}s` }} />)}</div>
      <div className={s.glow} />
      <svg ref={svg} className={s.paths} preserveAspectRatio="none">
        {Array.from({ length: PATHS }, (_, k) => <path key={k} data-lit={[3, 6, 9].includes(k) || undefined} />)}
      </svg>
      <div className={s.sun} />
    </div>

    <header className={s.nav}>
      <Link href="/" className={s.brand}>stable future <span aria-hidden="true">↗</span></Link>
      <nav><a href="#who">About</a><a href="#advice">Get advice</a><a className={s.navCta} href={CHECK_URL}>{HERO.cta}</a></nav>
    </header>

    <main data-landing>
      <section className={s.hero} data-sky="night" data-tone="dark" data-scene>
        <p className={s.eyebrow}><i />{HERO.eyebrow}</p>
        <h1>How does AI impact <em>your career path?</em></h1>
        <div className={s.actions}>
          <a className={s.bigCta} href={CHECK_URL}>{HERO.cta}<span aria-hidden="true">→</span></a>
          <a className={s.textLink} href="#advice">{HERO.secondary}</a>
        </div>
        <p className={s.audience}>{HERO.audience}</p>
        <a href="#ai" className={s.cue}><span>Scroll to sunrise</span><i /></a>
      </section>

      <section id="ai" className={s.section} data-sky="night" data-tone="dark">
        <div className={s.head} data-reveal><p className={s.kicker}>01 · {AI.eyebrow}</p><h2>{AI.title}</h2><p>{AI.intro}</p></div>
        <div data-reveal><AiDemos tone="dark" /></div>
      </section>

      <section className={s.section} data-sky="predawn" data-tone="dark">
        <div className={s.head} data-reveal><p className={s.kicker}>02 · {JOBS.eyebrow}</p><h2>{JOBS.title}</h2></div>
        <ol className={s.points} data-reveal>
          {JOBS.points.map((pt, i) => <li key={pt.lead}><b>{i + 1}</b><p><strong>{pt.lead}</strong> {pt.rest} {pt.source && <Cite source={pt.source} />}</p></li>)}
        </ol>
        <div className={s.pyramidWrap} data-reveal><Pyramid tone="dark" /></div>
        <div className={s.statRow} data-reveal>
          <div className={s.bigStat}><b>{JOBS.stat.value}</b><p>{JOBS.stat.label} <Cite source={JOBS.stat.source} /></p></div>
          <div className={s.checkCard}>
            <p>{JOBS.checkPrompt}</p>
            <BandScale compact />
            <a className={s.bigCta} href={CHECK_URL}>{HERO.cta}<span aria-hidden="true">→</span></a>
          </div>
        </div>
      </section>

      <section className={s.section} data-sky="sunrise" data-tone="light">
        <div className={s.head} data-reveal><p className={s.kicker}>03 · {FAMILIES.eyebrow}</p><h2>{FAMILIES.titleParts[0]}<span className={s.hours}>{FAMILIES.titleParts[1]}</span>{FAMILIES.titleParts[2]}</h2><p>{FAMILIES.intro}</p></div>
        <div className={s.moves}>
          {FAMILIES.moves.map((m) => <article key={m.n} data-reveal>
            <span>{m.n}</span><h3>{m.title}</h3><p>{m.text} {m.source && <Cite source={m.source} />}</p>
            {m.stat && <div className={s.moveStat}><b>{m.stat.value}</b><span>{m.stat.label} <Cite source={m.stat.source} /></span></div>}
          </article>)}
        </div>
        <div className={s.glass} data-reveal><AbzPaths /></div>
      </section>

      <section id="who" className={s.section} data-sky="morning" data-tone="light" data-scroll-offset="64">
        <div className={s.who}>
          <figure className={s.portrait} data-reveal>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/ben-grime.jpg" alt="Ben Grime, founder of Stable Future" width={797} height={900} />
          </figure>
          <div data-reveal>
            <p className={s.kicker}>04 · {WHO.eyebrow}</p>
            <h2>{WHO.title}</h2>
            <p className={s.greeting}>{WHO.greeting}</p>
            {WHO.bio.map((b) => <p key={b} className={s.bio}>{b}</p>)}
            <ul className={s.creds}>{WHO.credentials.map((c) => <li key={c}>{c}</li>)}</ul>
          </div>
        </div>
        <div className={s.data} data-reveal>{WHO.data.map((d) => <div key={d.label}><b>{d.value}</b><span>{d.label}</span></div>)}</div>
        <p className={s.dataNote}>{WHO.dataNote}</p>
        <div className={s.how} data-reveal>
          <p className={s.outcomes}>{WHO.outcomes}</p>
          <ol>{WHO.steps.map((st, i) => <li key={st.title}><span>{i + 1}</span><h3>{st.title}</h3><p>{st.text}</p></li>)}</ol>
          <ul className={s.leave}>{WHO.leaveWith.map((l) => <li key={l}>{l}</li>)}</ul>
        </div>
      </section>

      <section id="advice" className={s.advice} data-sky="noon" data-tone="light">
        <div data-reveal>
          <p className={s.kicker}>05 · {ADVICE.eyebrow}</p>
          <h2>{ADVICE.title}</h2>
          <p className={s.adviceIntro}>{ADVICE.intro}</p>
          <p className={s.scarce}><i aria-hidden="true" /><span><strong>{ADVICE.scarcity}</strong> {ADVICE.scarcityRest}</span></p>
        </div>
        <div className={s.formCard} data-reveal><AdviceForm /></div>
      </section>
    </main>

    <footer className={s.footer} data-sky="noon" data-tone="light">
      <span>stable future ↗</span><span>{HERO.eyebrow}</span><a href="mailto:ben@stablefuture.uk">ben@stablefuture.uk</a><a href={CHECK_URL}>{HERO.cta}</a><a href="/privacy">Privacy</a>
    </footer>
  </div>;
}
