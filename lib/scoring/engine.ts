// Scoring engine — pure function that maps quiz inputs to a verdict.
//
// Algorithm (see scoring.yaml header for canonical version):
//   1. direction in {undecided, other} → use the corresponding *_default path.
//   2. Resolve sector (id, "unsure" → *_undecided, "other" → *_other).
//   3. If job is a specific string and matches a path's job_keywords → path verdict.
//   4. Else fall back to sector's default tier + exposure score.

import { loadRubric, loadRationale } from "./loader";
import type {
  Direction,
  Path,
  QuizInput,
  Sector,
  Verdict,
} from "./types";

// "leaving_for_work" sectors use the shorter "work" prefix; others use the
// direction string verbatim.
function sectorPrefix(d: Direction): string {
  return d === "leaving_for_work" ? "work" : d;
}

function findSector(
  sectors: Sector[],
  direction: Direction,
  sector: string
): Sector | null {
  const sectorLower = sector.toLowerCase().trim();
  const prefix = sectorPrefix(direction);

  if (["unsure", "undecided", "not sure"].includes(sectorLower)) {
    return sectors.find((s) => s.sector_id === `sector_${prefix}_undecided`) ?? null;
  }
  if (sectorLower === "other") {
    return sectors.find((s) => s.sector_id === `sector_${prefix}_other`) ?? null;
  }
  return sectors.find((s) => s.sector_id === sector) ?? null;
}

function findPath(
  paths: Path[],
  direction: Direction,
  sectorId: string,
  job: string
): Path | null {
  const jobLower = job.toLowerCase().trim();
  if (
    !jobLower ||
    jobLower === "unsure" ||
    jobLower === "other" ||
    jobLower === "undecided"
  ) {
    return null;
  }

  // Prefer the most-specific match. Score each candidate by best keyword overlap:
  //   exact equality > startsWith > substring.
  type Scored = { path: Path; score: number };
  const candidates: Scored[] = [];

  for (const p of paths) {
    if (p.matches.direction !== direction) continue;
    if (p.sector_id !== sectorId) continue;
    let best = 0;
    for (const kwRaw of p.matches.job_keywords) {
      const kw = kwRaw.toLowerCase();
      if (kw === "*") continue;
      if (kw === jobLower) best = Math.max(best, 3);
      else if (jobLower.startsWith(kw) || kw.startsWith(jobLower))
        best = Math.max(best, 2);
      else if (jobLower.includes(kw) || kw.includes(jobLower))
        best = Math.max(best, 1);
    }
    if (best > 0) candidates.push({ path: p, score: best });
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0].path;
}

export function scoreInputs(input: QuizInput): Verdict {
  const rubric = loadRubric();
  const rationaleMap = loadRationale();

  const freeText =
    input.sectorOther || input.jobOther
      ? { sector: input.sectorOther, job: input.jobOther }
      : undefined;

  // Case 1: direction undecided / other → use *_default path.
  if (input.direction === "undecided" || input.direction === "other") {
    const path = rubric.paths.find(
      (p) => p.path_id === `${input.direction}_default`
    );
    if (!path)
      throw new Error(`Missing default path for direction "${input.direction}"`);
    const rationale = rationaleMap.get(path.rationale_key);
    if (!rationale)
      throw new Error(`Missing rationale for ${path.rationale_key}`);
    return {
      matchKind: "direction_default",
      tier: path.tier,
      exposureScore: path.exposure_score,
      pathId: path.path_id,
      sectorId: path.sector_id,
      label: path.label,
      rationaleKey: path.rationale_key,
      rationale,
      freeText,
    };
  }

  // Case 2: resolve sector.
  const sector = findSector(rubric.sectors, input.direction, input.sector);
  if (!sector) {
    throw new Error(
      `No sector matched for direction="${input.direction}" sector="${input.sector}"`
    );
  }

  // Case 3: try to match a specific path within the sector.
  const path = findPath(rubric.paths, input.direction, sector.sector_id, input.job);
  if (path) {
    const rationale = rationaleMap.get(path.rationale_key);
    if (!rationale)
      throw new Error(`Missing rationale for ${path.rationale_key}`);
    return {
      matchKind: "path",
      tier: path.tier,
      exposureScore: path.exposure_score,
      pathId: path.path_id,
      sectorId: sector.sector_id,
      label: path.label,
      rationaleKey: path.rationale_key,
      rationale,
      freeText,
    };
  }

  // Case 4: sector default (job was unsure/other/no-match).
  const rationale = rationaleMap.get(sector.rationale_key);
  if (!rationale)
    throw new Error(`Missing rationale for ${sector.rationale_key}`);
  return {
    matchKind: "sector_default",
    tier: sector.sector_tier_default,
    exposureScore: sector.sector_exposure_score,
    pathId: null,
    sectorId: sector.sector_id,
    label: sector.label,
    rationaleKey: sector.rationale_key,
    rationale,
    freeText,
  };
}
