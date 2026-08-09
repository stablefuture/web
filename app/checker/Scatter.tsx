"use client";

import { useMemo, useState } from "react";

import type { Unit } from "./Board";

// Square user-space; the container is forced square too, so a tooltip can be
// positioned as a plain percentage of the box.
const S = 400;
const PAD = { l: 48, r: 18, t: 20, b: 44 };
const W = S - PAD.l - PAD.r;
const H = S - PAD.t - PAD.b;
const px = (v: number) => PAD.l + (v / 100) * W;
const py = (v: number) => PAD.t + (1 - v / 100) * H;

type Cell = { key: string; x: number; y: number; units: Unit[]; match: boolean };

// Both axes are integer percentiles, so identical coordinates are a real
// property of the data, not an artefact of binning. One mark per occupied
// coordinate, area growing with how many units sit on it: no jitter, nothing
// hidden underneath, and the stack is enumerable on click.
const radius = (n: number) => 3.4 + 1.15 * Math.sqrt(n - 1);
const hitRadius = (n: number) => Math.max(11, radius(n) + 6);

export function Scatter({
  units,
  highlighted,
  selectedId,
  onSelect,
}: {
  units: Unit[];
  highlighted: Set<string> | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [hover, setHover] = useState<Cell | null>(null);
  const [pinned, setPinned] = useState<Cell | null>(null);
  const shown = pinned ?? hover;

  const cells = useMemo(() => {
    const m = new Map<string, Cell>();
    for (const u of units) {
      if (u.exposure == null || u.substitution == null) continue;
      const key = `${u.exposure},${u.substitution}`;
      const c = m.get(key) ??
        { key, x: u.exposure, y: u.substitution, units: [], match: false };
      c.units.push(u);
      m.set(key, c);
    }
    const out = [...m.values()];
    for (const c of out) {
      c.match = highlighted != null && c.units.some((u) => highlighted.has(u.id));
    }
    // Painted big-stack-first so a single unit is never buried under a wide
    // mark; matched marks last so a search result is never painted over.
    return out.sort(
      (a, b) => Number(a.match) - Number(b.match) || b.units.length - a.units.length,
    );
  }, [units, highlighted]);

  // Hit targets go in their own pass ON TOP of every visible mark. Interleaved,
  // a later cell's filled circle covers an earlier cell's hit target, which is
  // what made the centre of a dot unhoverable while its edge still worked.
  const targets = useMemo(
    () => [...cells].sort((a, b) => Number(a.match) - Number(b.match)),
    [cells],
  );

  const hidden = units.filter((u) => u.exposure == null).length;

  // Clicking a stack walks through it, so an overlapped unit is still reachable
  // without a zoom.
  const cycle = (c: Cell) => {
    setPinned(c);
    const i = c.units.findIndex((u) => u.id === selectedId);
    onSelect(c.units[(i + 1) % c.units.length].id);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="relative aspect-square w-full">
        <svg
          viewBox={`0 0 ${S} ${S}`}
          className="h-full w-full"
          role="img"
          aria-label="Every unit plotted by how much of the work AI could learn to do and how likely employers are to substitute it. The table beside this lists the same units."
        >
          {[0, 25, 50, 75, 100].map((t) => (
            <g key={t} className="text-border-soft">
              <line x1={px(t)} y1={py(0)} x2={px(t)} y2={py(100)} stroke="currentColor" strokeWidth={1} />
              <line x1={px(0)} y1={py(t)} x2={px(100)} y2={py(t)} stroke="currentColor" strokeWidth={1} />
            </g>
          ))}

          {[0, 50, 100].map((t) => (
            <g key={t} className="fill-muted text-[9px] tabular-nums">
              <text x={px(t)} y={py(0) + 14} textAnchor="middle">{t}</text>
              <text x={PAD.l - 8} y={py(t) + 3} textAnchor="end">{t}</text>
            </g>
          ))}

          <text x={px(50)} y={S - 4} textAnchor="middle" className="fill-muted text-[10px]">
            AI Learnability →
          </text>
          <text
            x={-py(50)} y={13} textAnchor="middle" transform="rotate(-90)"
            className="fill-muted text-[10px]"
          >
            Substitution →
          </text>
          <text x={px(100)} y={PAD.t - 7} textAnchor="end" className="fill-accent-strong text-[9px] font-semibold uppercase tracking-wider">
            more at risk
          </text>
          <text x={px(0)} y={py(0) + 26} className="fill-accent-strong text-[9px] font-semibold uppercase tracking-wider">
            less at risk
          </text>

          {/* pass 1: the marks */}
          {cells.map((c) => {
            const dim = highlighted != null && !c.match;
            const hasSelected = c.units.some((u) => u.id === selectedId);
            const isShown = shown?.key === c.key;
            return (
              <g key={c.key}>
                {hasSelected && (
                  <circle
                    cx={px(c.x)} cy={py(c.y)} r={radius(c.units.length) + 5}
                    fill="none" stroke="var(--accent)" strokeWidth={2}
                  />
                )}
                <circle
                  cx={px(c.x)} cy={py(c.y)} r={radius(c.units.length)}
                  fill={c.match || hasSelected ? "var(--accent)" : "var(--muted)"}
                  fillOpacity={dim && !hasSelected ? 0.16 : c.match || hasSelected ? 0.95 : 0.8}
                  stroke="var(--background)"
                  strokeWidth={1.25}
                />
                {isShown && (
                  <circle
                    cx={px(c.x)} cy={py(c.y)} r={radius(c.units.length) + 2.5}
                    fill="none" stroke="var(--ink)" strokeWidth={1}
                  />
                )}
              </g>
            );
          })}

          {/* pass 2: hit targets, always above every mark and bigger than one */}
          {targets.map((c) => (
            <circle
              key={c.key}
              cx={px(c.x)} cy={py(c.y)} r={hitRadius(c.units.length)}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHover(c)}
              onMouseLeave={() => setHover(null)}
              onClick={() => cycle(c)}
            />
          ))}
        </svg>

        {shown && (
          <div
            // Only interactive once pinned; a hover tooltip that swallows the
            // pointer makes the marks underneath it unhoverable.
            className={`absolute z-20 w-56 -translate-x-1/2 rounded-lg border border-border-soft bg-background p-3 text-xs shadow-lg ${
              pinned ? "pointer-events-auto" : "pointer-events-none"
            }`}
            style={{
              left: `${(px(shown.x) / S) * 100}%`,
              top: `${(py(shown.y) / S) * 100 + 3}%`,
            }}
          >
            <div className="mb-1.5 flex items-baseline justify-between gap-2 text-muted">
              <span className="tabular-nums">
                AI Learnability {shown.x} · Substitution {shown.y}
              </span>
              {pinned && (
                <button
                  onClick={() => setPinned(null)}
                  className="text-muted hover:text-ink"
                  aria-label="Close"
                >
                  ✕
                </button>
              )}
            </div>
            <ul className="flex flex-col gap-0.5">
              {shown.units.slice(0, 8).map((u) => (
                <li key={u.id}>
                  <button
                    onClick={() => onSelect(u.id)}
                    className={`w-full text-left hover:text-accent-strong ${
                      u.id === selectedId ? "font-semibold text-accent-strong" : "text-ink"
                    }`}
                  >
                    {u.label}
                  </button>
                </li>
              ))}
            </ul>
            {shown.units.length > 8 && (
              <p className="mt-1 text-muted">and {shown.units.length - 8} more here</p>
            )}
          </div>
        )}
      </div>

      {hidden > 0 && (
        <p className="text-xs leading-relaxed text-muted">
          {hidden} not plotted — no scored occupation underneath.
        </p>
      )}
    </div>
  );
}
