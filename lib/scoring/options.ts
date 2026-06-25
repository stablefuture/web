// Form-option helpers derived from the rubric.
// The quiz form calls these to populate dropdowns / typeahead lists.

import { loadRubric } from "./loader";
import type { Direction, Sector } from "./types";

// Sectors selectable from the Q3 dropdown for a given direction.
// Excludes *_undecided and *_other — those are surfaced via the
// "I'm not sure" and "Other" radios respectively, not in the dropdown.
export function sectorsForDirection(direction: Direction): Sector[] {
  const all = loadRubric().sectors;
  return all.filter(
    (s) =>
      s.matches.direction === direction &&
      !s.sector_id.endsWith("_undecided") &&
      !s.sector_id.endsWith("_other")
  );
}

// Distinct job suggestions for a given sector, ranked by path label first
// then deduped job_keywords. Used to populate the Q4 typeahead.
export function jobSuggestionsForSector(sectorId: string): string[] {
  const paths = loadRubric().paths.filter((p) => p.sector_id === sectorId);
  const seen = new Set<string>();
  const out: string[] = [];
  // Prefer the human-friendly label first…
  for (const p of paths) {
    const label = p.label.split(" — ")[0].split(" (")[0].trim();
    const lower = label.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      out.push(label);
    }
  }
  // …then add unique job_keywords (skip duplicates of labels).
  for (const p of paths) {
    for (const kw of p.matches.job_keywords) {
      if (kw === "*") continue;
      const lower = kw.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        out.push(kw);
      }
    }
  }
  return out;
}
