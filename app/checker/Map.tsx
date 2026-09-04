"use client";

import { useMemo, useRef, useState } from "react";

import type { Unit } from "./Checker";

// Square user-space so the box can be forced square with aspect-square.
const S = 400;
// Top padding leaves room for the HIGHER RISK label above the plot, so no
// label sits on top of the dots.
const PAD = { l: 40, r: 14, t: 30, b: 40 };
const W = S - PAD.l - PAD.r;
const H = S - PAD.t - PAD.b;
const px = (v: number) => PAD.l + (v / 100) * W;
const py = (v: number) => PAD.t + (1 - v / 100) * H;

// Every job in grey as context; the chosen one, and the jobs a sector or a
// degree leads to, in the accent. One series is the point, the rest is the map.
export function JobMap({
  jobs, selected, lit, litNote, onSelect,
}: {
  jobs: Unit[];
  selected: Unit | null;
  lit: Set<string>;
  litNote: string | null;
  onSelect: (id: string) => void;
}) {
  const [hover, setHover] = useState<Unit | null>(null);
  const ref = useRef<SVGSVGElement>(null);
  const pts = useMemo(
    () => jobs.filter((u) => u.exposure != null && u.substitution != null),
    [jobs],
  );

  // Nearest dot within reach of the pointer, so a small mark never needs a
  // pixel-perfect hit.
  const nearest = (e: React.MouseEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const x = ((e.clientX - r.left) * S) / r.width;
    const y = ((e.clientY - r.top) * S) / r.height;
    let best: Unit | null = null;
    let bd = 14 * 14;
    for (const u of pts) {
      const dx = px(u.exposure!) - x;
      const dy = py(u.substitution!) - y;
      const d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = u; }
    }
    return best;
  };

  const focus = selected && selected.exposure != null && selected.substitution != null ? selected : null;
  const shown = hover ?? focus;
  const dim = focus != null || lit.size > 0;

  return (
    <figure className="flex flex-col gap-3">
      <svg
        ref={ref}
        viewBox={`0 0 ${S} ${S}`}
        className="aspect-square w-full cursor-crosshair select-none"
        role="img"
        aria-label="Every UK job plotted by how much of the work AI could learn to do and how likely employers are to replace people. The lists beside this carry the same figures."
        onMouseMove={(e) => setHover(nearest(e))}
        onMouseLeave={() => setHover(null)}
        onClick={() => hover && onSelect(hover.id)}
      >
        <rect
          x={px(50)} y={py(100)} width={px(100) - px(50)} height={py(50) - py(100)}
          fill="var(--accent)" fillOpacity={0.07}
        />
        {[0, 50, 100].map((t) => (
          <g key={t} stroke="var(--border-soft)" strokeOpacity={0.6} strokeWidth={1}>
            <line x1={px(t)} y1={py(0)} x2={px(t)} y2={py(100)} />
            <line x1={px(0)} y1={py(t)} x2={px(100)} y2={py(t)} />
          </g>
        ))}
        {[0, 50, 100].map((t) => (
          <g key={t} fill="var(--muted)" fontSize={9}>
            <text x={px(t)} y={py(0) + 13} textAnchor="middle">{t}</text>
            <text x={PAD.l - 6} y={py(t) + 3} textAnchor="end">{t}</text>
          </g>
        ))}
        {/* Risk labels sit outside the plot: lower risk at the bottom-left
            corner, higher risk above the top-right corner. */}
        <text
          x={PAD.l} y={S - 6} fill="var(--muted)" fontSize={9} fontWeight={600} letterSpacing=".08em"
        >
          LOWER RISK
        </text>
        <text x={px(100)} y={S - 6} textAnchor="end" fill="var(--muted)" fontSize={10}>
          How much of the work AI could learn →
        </text>
        <text
          transform="rotate(-90)" x={-py(50)} y={11} textAnchor="middle"
          fill="var(--muted)" fontSize={10}
        >
          How likely employers replace people →
        </text>
        <text
          x={px(100)} y={PAD.t - 9} textAnchor="end"
          fill="var(--accent-strong)" fontSize={9} fontWeight={600} letterSpacing=".08em"
        >
          HIGHER RISK
        </text>

        {pts.map((u) => {
          const on = lit.has(u.id);
          return (
            <circle
              key={u.id}
              cx={px(u.exposure!)} cy={py(u.substitution!)}
              r={on ? 3.5 : 2.4}
              fill={on ? "var(--accent)" : "var(--muted)"}
              fillOpacity={on ? 0.95 : dim ? 0.22 : 0.5}
              stroke={on ? "var(--background)" : "none"}
              strokeWidth={1}
            />
          );
        })}

        {focus && (
          <g>
            <circle
              cx={px(focus.exposure!)} cy={py(focus.substitution!)} r={10}
              fill="none" stroke="var(--accent)" strokeWidth={1.5}
            />
            <circle
              cx={px(focus.exposure!)} cy={py(focus.substitution!)} r={5.5}
              fill="var(--accent-strong)" stroke="var(--background)" strokeWidth={2}
            />
          </g>
        )}
        {hover && hover.id !== focus?.id && (
          <circle
            cx={px(hover.exposure!)} cy={py(hover.substitution!)} r={7}
            fill="none" stroke="var(--ink)" strokeWidth={1}
          />
        )}
        {shown && <Label u={shown} />}
      </svg>
      <figcaption className="text-xs leading-relaxed text-muted">
        {shown ? (
          <>
            <span className="font-medium text-ink">{shown.label}</span>
            {" "}scores {shown.exposure} for learnability and {shown.substitution} for substitution.{" "}
          </>
        ) : litNote ? (
          <>{litNote} </>
        ) : (
          <>Each dot is one of {pts.length} UK jobs. </>
        )}
        Bottom-left is safest. Hover or click a dot.
      </figcaption>
    </figure>
  );
}

function Label({ u }: { u: Unit }) {
  const cx = px(u.exposure!);
  const cy = py(u.substitution!);
  const half = Math.min(u.label.length * 2.7, W / 2);
  const x = Math.max(PAD.l + half, Math.min(S - PAD.r - half, cx));
  const y = cy < PAD.t + 26 ? cy + 22 : cy - 14;
  return (
    <text
      x={x} y={y} textAnchor="middle" fontSize={10} fontWeight={600}
      fill="var(--ink)" stroke="var(--background)" strokeWidth={3} paintOrder="stroke"
    >
      {u.label}
    </text>
  );
}
