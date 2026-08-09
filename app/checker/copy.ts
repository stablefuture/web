// Fixed copy. These strings are specified verbatim in the v3 build handoff —
// do not reword them.
export const TOOLTIPS: Record<string, string> = {
  exposure:
    "New technology changes how people work. How much of this work could AI learn to do?",
  substitution:
    "New technology can replace work. What's the practical likelihood that employers replace workers with AI here?",
  risk:
    "For AI to replace people's work, the work needs to be (a) learnable by AI and (b) able to substitute people for AI. How true is that for this role? How hard will I need to work to not get replaced?",
  salary:
    "Average full-time salary for related junior/mid/senior roles across the UK, excluding managers and directors",
  openings: "Estimated number of roles available in 5 years' time",
  growth: "How much is this sector growing or shrinking?",
  entrants:
    "Number of apprentices or graduates entering related roles across the UK",
  competition:
    "How many apprentices and graduates per job opening will there be for related roles?",
};

export const LABELS: Record<string, string> = {
  exposure: "AI Learnability",
  substitution: "Substitution",
  risk: "Risk",
  salary: "Salary",
  openings: "Projected openings",
  growth: "Sector growth",
  entrants: "Entrants",
  competition: "Competition",
};

export const PATHS = [
  { id: "apprenticeships", label: "Apprenticeships" },
  { id: "degrees", label: "Degrees" },
  { id: "jobs", label: "Jobs" },
] as const;
