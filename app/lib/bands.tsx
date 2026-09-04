// Plain-English bands for the checker's 0-100 percentiles, shared by the
// checker and the graduate destinations page so a word means the same thing on
// both. Cut-offs set by Ben, 4 Sep 2026: under 50 is low, 50 to 74 medium, 75
// and over high.
export type Tone = "good" | "warn" | "bad";

export function band(v: number): { word: string; tone: Tone } {
  if (v < 50) return { word: "Low", tone: "good" };
  if (v < 75) return { word: "Medium", tone: "warn" };
  return { word: "High", tone: "bad" };
}

export function riskWord(v: number): { word: string; tone: Tone } {
  const b = band(v);
  const word =
    b.word === "Low" ? "Lower risk" : b.word === "High" ? "Higher risk" : "Medium risk";
  return { word, tone: b.tone };
}

// Status colours only ever sit beside a word, never carry the meaning alone.
const DOT: Record<Tone, string> = {
  good: "bg-[#0ca30c]",
  warn: "bg-[#fab219]",
  bad: "bg-[#d03b3b]",
};

export function Dot({ tone }: { tone: Tone }) {
  return (
    <span
      aria-hidden
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${DOT[tone]}`}
    />
  );
}
