// Shapes mirror jobs/pipeline/publish.py output (web/public/tracker.json).

export type SourceNote = { label: string; source: string; caveat: string };

export type Occupation = {
  soc4: string;
  name: string;
  soc3: string;
  soc1: string;
  soc1_name: string;
  pay: { median_ft: number | null; p25_ft: number | null; p75_ft: number | null };
  supply: { hesa_entrants: number | null; appr_starts: number | null };
  exposure: {
    alpha: number | null;
    beta: number | null;
    gamma: number | null;
    n_tasks: number | null;
  };
  nowcast: {
    z: number | null;
    pct_dev: number | null;
    share_now: number | null;
    share_trend: number | null;
  };
  competition:
    | { year: number; central: number; p10: number; p90: number }[]
    | null;
};

export type Tracker = {
  meta: {
    generated: string;
    model_version: string;
    counts: Record<string, number>;
    sources: Record<string, SourceNote>;
    no_composite_note: string;
  };
  occupations: Occupation[];
};

// Validated categorical hues (dataviz validator, light + dark bands).
export const SERIES = {
  light: { judged: "#7e22ce", observed: "#0891b2", supply: "#d97706" },
  dark: { judged: "#a855f7", observed: "#0e9fbc", supply: "#c78310" },
};

export const fmtPay = (v: number | null) =>
  v == null ? "—" : `£${Math.round(v / 1000)}k`;

export const fmtPct = (v: number | null, digits = 0) =>
  v == null ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(digits)}%`;

/** Exposure gamma (0-1) -> five named bands, higher = more exposed. */
export const EXPOSURE_BANDS = [
  { min: 0.8, label: "Very high", color: "#dc2626" },
  { min: 0.6, label: "High", color: "#ea580c" },
  { min: 0.4, label: "Moderate", color: "#d97706" },
  { min: 0.2, label: "Low", color: "#65a30d" },
  { min: 0, label: "Very low", color: "#16a34a" },
];
export const exposureBand = (g: number) =>
  EXPOSURE_BANDS.find((b) => g >= b.min) ?? EXPOSURE_BANDS[4];

/** Hiring-vs-trend wording. Deliberately calm: adverts are a signal, not a verdict. */
export function nowcastWord(pct: number | null) {
  if (pct == null) return { word: "No clear signal", tone: "muted" as const };
  if (pct <= -25) return { word: "Well below trend", tone: "bad" as const };
  if (pct <= -10) return { word: "Below trend", tone: "bad" as const };
  if (pct < 10) return { word: "About on trend", tone: "flat" as const };
  if (pct < 25) return { word: "Above trend", tone: "good" as const };
  return { word: "Well above trend", tone: "good" as const };
}

/** Entrants per opening -> plain wording. */
export function competitionWord(ratio: number | null) {
  if (ratio == null) return "No entrant-supply data";
  if (ratio < 0.75) return "Fewer entrants than openings";
  if (ratio < 1.5) return "Roughly one entrant per opening";
  if (ratio < 3) return "Several entrants per opening";
  return "Heavily oversubscribed";
}
