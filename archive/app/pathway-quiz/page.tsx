// /pathway-quiz — multi-step quiz form.
// Server component: derives form options from the rubric and hands them to
// the client Quiz component. The Quiz manages the multi-step state and
// posts to the `submitQuiz` server action.

import { Quiz, type FormOptions } from "./Quiz";
import { sectorsForDirection, jobSuggestionsForSector } from "@/lib/scoring/options";
import type { Direction } from "@/lib/scoring/types";

const DIRECTIONS_WITH_SECTORS: Direction[] = [
  "uni",
  "apprenticeship",
  "leaving_for_work",
];

export default function PathwayQuizPage() {
  const sectorsByDirection = {} as FormOptions["sectorsByDirection"];
  const jobsBySector: FormOptions["jobsBySector"] = {};

  for (const d of DIRECTIONS_WITH_SECTORS) {
    const sectors = sectorsForDirection(d).map((s) => ({
      id: s.sector_id,
      label: s.label,
    }));
    sectorsByDirection[d] = sectors;
    for (const s of sectors) {
      jobsBySector[s.id] = jobSuggestionsForSector(s.id);
    }
  }
  // Fill the empty arrays for the short-circuit directions so the type is satisfied.
  sectorsByDirection["undecided"] = [];
  sectorsByDirection["other"] = [];

  return <Quiz options={{ sectorsByDirection, jobsBySector }} />;
}
