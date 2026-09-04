import type { Unit } from "./Checker";

// Square user-space so the box can be forced square with aspect-square.
const S = 400;
// Top padding leaves room for the HIGHER RISK label above the plot, so no
// label sits on top of the dots.
const PAD = { l: 24, r: 14, t: 30, b: 34 };
const W = S - PAD.l - PAD.r;
const H = S - PAD.t - PAD.b;
const px = (v: number) => PAD.l + (v / 100) * W;
const py = (v: number) => PAD.t + (1 - v / 100) * H;

// A picture, not a control: every job in grey as context, the jobs of the
// chosen sector in the accent, and the chosen unit ringed and named. The
// lists beside it are where a reader picks a job.
export function JobMap({
  jobs, selected, lit,
}: {
  jobs: Unit[];
  selected: Unit | null;
  lit: Set<string>;
}) {
  const pts = jobs.filter((u) => u.exposure != null && u.substitution != null);
  const focus = selected && selected.exposure != null && selected.substitution != null ? selected : null;
  const dim = focus != null || lit.size > 0;

  return (
    <svg
      viewBox={`0 0 ${S} ${S}`}
      className="aspect-square w-full select-none"
      role="img"
      aria-label="Every UK job plotted by how much of the work AI could learn to do and how likely employers are to replace people. The lists beside this carry the same figures."
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
      {/* Risk labels sit outside the plot: lower risk at the bottom-left
          corner, higher risk above the top-right corner. */}
      <text
        x={PAD.l} y={S - 6} fill="var(--muted)" fontSize={10} fontWeight={600} letterSpacing=".08em"
      >
        LOWER RISK
      </text>
      <text x={px(100)} y={S - 6} textAnchor="end" fill="var(--muted)" fontSize={11}>
        How much of the work AI could learn →
      </text>
      <text
        transform="rotate(-90)" x={-py(50)} y={12} textAnchor="middle"
        fill="var(--muted)" fontSize={11}
      >
        How likely employers replace people →
      </text>
      <text
        x={px(100)} y={PAD.t - 9} textAnchor="end"
        fill="var(--accent-strong)" fontSize={10} fontWeight={600} letterSpacing=".08em"
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
          <Label u={focus} />
        </g>
      )}
    </svg>
  );
}

function Label({ u }: { u: Unit }) {
  const cx = px(u.exposure!);
  const cy = py(u.substitution!);
  // Long unit-group titles would run off the box.
  const name = u.label.length > 40 ? `${u.label.slice(0, 38)}…` : u.label;
  const half = Math.min(name.length * 3, W / 2);
  const x = Math.max(PAD.l + half, Math.min(S - PAD.r - half, cx));
  const y = cy < PAD.t + 26 ? cy + 24 : cy - 15;
  return (
    <text
      x={x} y={y} textAnchor="middle" fontSize={11} fontWeight={600}
      fill="var(--ink)" stroke="var(--background)" strokeWidth={3} paintOrder="stroke"
    >
      {name}
    </text>
  );
}
