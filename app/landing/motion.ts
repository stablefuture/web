'use client';

import { useEffect, useEffectEvent, useRef, useState } from 'react';

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
/** Progress 0..1 of `t` through the window [start, start + dur]. */
export const at = (t: number, start: number, dur: number) => clamp((t - start) / dur);
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export const ease = (p: number) => p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;

export function reducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Writes scroll progress into CSS variables so styles can animate with scroll:
 * `--p` on the root (whole page), and `--sp` / `--pin` on each `[data-scene]`.
 * Marks `[data-reveal]` elements with `data-in` once they enter the viewport.
 * `onFrame` receives page progress for effects CSS can't express.
 */
export function useScrollScenes(root: React.RefObject<HTMLElement | null>, onFrame?: (p: number) => void) {
  const frameEvent = useEffectEvent((p: number) => onFrame?.(p));
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    el.setAttribute('data-motion', reducedMotion() ? 'reduced' : 'on');
    const scenes = Array.from(el.querySelectorAll<HTMLElement>('[data-scene]'));
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      const max = document.documentElement.scrollHeight - vh;
      const p = max > 0 ? clamp(window.scrollY / max) : 0;
      el.style.setProperty('--p', p.toFixed(4));
      for (const s of scenes) {
        const r = s.getBoundingClientRect();
        s.style.setProperty('--sp', clamp((vh - r.top) / (vh + r.height)).toFixed(4));
        s.style.setProperty('--pin', (r.height > vh ? clamp(-r.top / (r.height - vh)) : clamp((vh - r.top) / vh)).toFixed(4));
      }
      frameEvent(p);
    };
    const request = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.setAttribute('data-in', ''); io.unobserve(e.target); }
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    el.querySelectorAll('[data-reveal]').forEach((n) => io.observe(n));
    return () => { window.removeEventListener('scroll', request); window.removeEventListener('resize', request); io.disconnect(); if (raf) cancelAnimationFrame(raf); };
  }, [root]);
}

/** True while the element is at least partly on screen. */
export function useInView<T extends Element>(threshold = 0.25) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

/**
 * A clock in milliseconds that runs while `playing`, restarts when `runKey`
 * changes, and calls `onEnd` once `duration` has passed. Reduced motion shows
 * the final frame.
 */
export function useClock(playing: boolean, duration: number, runKey: string, onEnd?: () => void) {
  const [t, setT] = useState(0);
  const [key, setKey] = useState(runKey);
  const tRef = useRef(0);
  const keyRef = useRef(runKey);
  const endEvent = useEffectEvent(() => onEnd?.());
  // A new run starts from the first frame.
  if (key !== runKey) { setKey(runKey); setT(0); }
  useEffect(() => {
    if (!playing) return;
    if (keyRef.current !== runKey) { keyRef.current = runKey; tRef.current = 0; }
    if (reducedMotion()) { const id = requestAnimationFrame(() => setT(duration)); return () => cancelAnimationFrame(id); }
    let raf = 0;
    let prev = performance.now();
    let painted = 0;
    const tick = (now: number) => {
      tRef.current += Math.min(now - prev, 100);
      prev = now;
      if (tRef.current >= duration) { setT(duration); endEvent(); return; }
      if (now - painted > 30) { setT(tRef.current); painted = now; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, duration, runKey]);
  return t;
}

/** The first `p` share of `text`, for a typing effect. */
export const typed = (text: string, p: number) => text.slice(0, Math.round(text.length * clamp(p)));
