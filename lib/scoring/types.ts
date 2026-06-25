// Types mirroring web/lib/scoring/scoring.yaml. See that file's header for
// the authoritative schema documentation.

export type Direction =
  | "uni"
  | "apprenticeship"
  | "leaving_for_work"
  | "undecided"
  | "other";

export type Tier = 1 | 2 | 3 | 4;

export type Axes = { R: number; Y: number; D: number; S: number };

export type Sector = {
  sector_id: string;
  label: string;
  matches: { direction: Direction; keywords: string[] };
  anthropic_category: string | null;
  anthropic_theoretical: number | null;
  anthropic_observed: number | null;
  sector_exposure_score: number;
  sector_tier_default: Tier;
  rationale_key: string;
};

export type Path = {
  path_id: string;
  label: string;
  sector_id: string;
  matches: { direction: Direction; job_keywords: string[] };
  soc4: string[] | null;
  scoring: Axes;
  total: number;
  tier: Tier;
  exposure_score: number;
  rationale_key: string;
};

export type Rubric = {
  version: number;
  last_updated: string;
  sectors: Sector[];
  paths: Path[];
};

export type Rationale = {
  key: string;
  bullets: string[]; // each bullet collapsed to a single line
  raw: string; // raw markdown body (excl. the "## key" header)
};

export type QuizInput = {
  direction: Direction;
  // Sector field can be a sector_id string, "unsure", or "other".
  sector: string;
  // Job field can be a job_keyword string, "unsure", or "other".
  job: string;
  // Free text captured if user picked "Other" on sector / job.
  sectorOther?: string;
  jobOther?: string;
};

export type Verdict = {
  // How the verdict was reached:
  //   "path"             — exact (sector, job) match in the rubric
  //   "sector_default"   — sector matched but job was unsure/other/no-match
  //   "direction_default"— direction is undecided/other (no sector resolution)
  matchKind: "path" | "sector_default" | "direction_default";
  tier: Tier;
  exposureScore: number; // 0–10
  pathId: string | null;
  sectorId: string;
  label: string;
  rationaleKey: string;
  rationale: Rationale;
  // Echoed back so the verdict-panel renderer can show "you typed: …"
  freeText?: { sector?: string; job?: string };
};
