// Five AI exposure bands for the lead magnet and landing page, set by Ben on
// 4 Oct 2026. Scores are percentiles against the UK jobs we score, so each band
// holds about a fifth of jobs. They describe exposure, not the chance of job loss.
// Colours are bright on purpose; the text label always carries the meaning.
export const BANDS = [
  { key: 'very-low', label: 'Very low', min: 0, bg: '#3fa34d', ink: '#06210c', tint: '#e5f4e7' },
  { key: 'low', label: 'Low', min: 20, bg: '#9bcf53', ink: '#172808', tint: '#eff8e3' },
  { key: 'medium', label: 'Medium', min: 40, bg: '#ffc93c', ink: '#2e2304', tint: '#fff6d9' },
  { key: 'high', label: 'High', min: 60, bg: '#ff8a3d', ink: '#2b1203', tint: '#ffeadb' },
  { key: 'very-high', label: 'Very high', min: 80, bg: '#d92a42', ink: '#ffffff', tint: '#fde4e7' },
];

export const NO_BAND = { key: 'none', label: 'Not scored', min: null, bg: '#d9dbd3', ink: '#3f4a40', tint: '#f0f1ec' };

export function bandFor(score) {
  if (!Number.isFinite(score)) return NO_BAND;
  return [...BANDS].reverse().find((band) => score >= band.min) ?? BANDS[0];
}
