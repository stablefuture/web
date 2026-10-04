export const MODEL_VERSION = "assessment-v1.4-onet-sum-scores-2026-09-22";

export const DIMENSIONS = ["Practical", "Analytical", "Creative", "People-focused", "Enterprising", "Organised"];

// O*NET Interest Profiler Short Form: ten questions per RIASEC dimension.
export const QUESTIONS = [
  ["Build kitchen cabinets", 0], ["Lay brick or tile", 0], ["Repair household appliances", 0],
  ["Raise fish in a fish hatchery", 0], ["Assemble electronic parts", 0],
  ["Drive a truck to deliver packages to offices and homes", 0], ["Test the quality of parts before shipment", 0],
  ["Repair and install locks", 0], ["Set up and operate machines to make products", 0], ["Put out forest fires", 0],
  ["Develop a new medicine", 1], ["Study ways to reduce water pollution", 1], ["Conduct chemical experiments", 1],
  ["Study the movement of planets", 1], ["Examine blood samples using a microscope", 1],
  ["Investigate the cause of a fire", 1], ["Develop a way to better predict the weather", 1],
  ["Work in a biology lab", 1], ["Invent a replacement for sugar", 1], ["Do laboratory tests to identify diseases", 1],
  ["Write books or plays", 2], ["Play a musical instrument", 2], ["Compose or arrange music", 2],
  ["Draw pictures", 2], ["Create special effects for movies", 2], ["Paint sets for plays", 2],
  ["Write scripts for movies or television shows", 2], ["Perform jazz or tap dance", 2], ["Sing in a band", 2], ["Edit movies", 2],
  ["Teach an individual an exercise routine", 3], ["Help people with personal or emotional problems", 3],
  ["Give career guidance to people", 3], ["Perform rehabilitation therapy", 3],
  ["Do volunteer work at a non-profit organisation", 3], ["Teach children how to play sports", 3],
  ["Teach sign language to people who are deaf or hard of hearing", 3], ["Help conduct a group therapy session", 3],
  ["Take care of children at a day-care centre", 3], ["Teach a secondary-school class", 3],
  ["Buy and sell stocks and bonds", 4], ["Manage a retail store", 4], ["Operate a beauty salon or barber shop", 4],
  ["Manage a department within a large company", 4], ["Start your own business", 4], ["Negotiate business contracts", 4],
  ["Represent a client in a lawsuit", 4], ["Market a new line of clothing", 4],
  ["Sell merchandise at a department store", 4], ["Manage a clothing store", 4],
  ["Develop a spreadsheet using computer software", 5], ["Proofread records or forms", 5],
  ["Install software across computers on a large network", 5], ["Operate a calculator", 5],
  ["Keep shipping and receiving records", 5], ["Calculate the wages of employees", 5],
  ["Inventory supplies using a hand-held computer", 5], ["Record rent payments", 5],
  ["Keep inventory records", 5], ["Stamp, sort, and distribute mail for an organisation", 5],
] as const;

export const STAGES = ["Before GCSEs", "Studying GCSEs", "Sixth form or college", "Apprenticeship", "University", "Graduated", "Returning to education"];

export const EDUCATION_PLANS = {
  gcse: { label: "After GCSEs", maxZone: 3, preferredZones: [2, 3], maxApprenticeship: 3, showDegrees: false },
  level3: { label: "After A Levels", maxZone: 4, preferredZones: [3, 4], maxApprenticeship: 5, showDegrees: false },
  university: { label: "After university", maxZone: 5, preferredZones: [4, 5], maxApprenticeship: 7, showDegrees: true },
  postgraduate: { label: "After postgraduate study", maxZone: 5, preferredZones: [5], maxApprenticeship: 7, showDegrees: true },
  unsure: { label: "I’m not sure yet", maxZone: 5, preferredZones: [], maxApprenticeship: 7, showDegrees: true },
} as const;

export type EducationPlanId = keyof typeof EDUCATION_PLANS;
export type SpecificChoice = "pursue" | "neutral" | "avoid";

export function availableEducationPlanIds(stage: string): EducationPlanId[] {
  if (stage === "University") return ["university", "postgraduate", "unsure"];
  if (stage === "Sixth form or college" || stage === "Apprenticeship" || stage === "Returning to education") return ["level3", "university", "postgraduate", "unsure"];
  if (stage === "Graduated") return ["postgraduate", "unsure"];
  return ["gcse", "level3", "university", "postgraduate", "unsure"];
}

export const GRADES: Record<string, string[]> = {
  "GCSE (9–1)": ["9", "8", "7", "6", "5", "4", "3", "2", "1", "U"],
  "GCSE (A*–G)": ["A*", "A", "B", "C", "D", "E", "F", "G", "U"],
  "A level": ["A*", "A", "B", "C", "D", "E", "U"],
  Apprenticeship: ["Distinction", "Merit", "Pass"],
  "Bachelor’s degree": ["First", "2:1", "2:2", "Third", "Pass"],
  "Master’s degree": ["Distinction", "Merit", "Pass"],
  Other: [],
};

export type Qualification = { id: number; kind: string; subject: string; grade: string; institution: string; detail: string };
export type CourseAvailability = {
  codedCourseRecords: number;
  codedProviders: number;
  titleMatchedRecords: number;
  distinctTitleMatches: number;
  titleMatchedProviders: number;
  distinctUnionCourseRecords: number;
  estimatedProviderCourseFamilies: number;
  snapshot: string;
  scope: string;
  caveat: string;
};
export type CahGroup = { code: string; label: string };
export type Profile = {
  stage: string;
  nation: string;
  educationPlan: EducationPlanId | "";
  route: string;
  targetIds: string[];
  answers: number[];
  specificInterests: Record<string, SpecificChoice>;
  ai: number;
  network: string;
  networkAreaIds: string[];
  confidence: string;
  qualifications: Qualification[];
  salaryImportance: number;
};

export const initialProfile: Profile = {
  stage: "",
  nation: "England",
  educationPlan: "",
  route: "",
  targetIds: [],
  answers: Array(QUESTIONS.length).fill(0),
  specificInterests: {},
  ai: 0,
  network: "",
  networkAreaIds: [],
  confidence: "",
  qualifications: [],
  salaryImportance: -1,
};

export type Job = {
  studentVisible?: boolean;
  id: string;
  path: string;
  label: string;
  aka?: string[];
  sectors: string[];
  exposure: number | null;
  substitution: number | null;
  risk: number | null;
  salary: number | null;
  openings: number | null;
  roles?: number[];
  related_roles?: number[];
  onetCodes?: string[];
  routeNotes?: Record<string, string>;
  routeRelations?: Record<string, "direct" | "conditional">;
  routeNote?: string;
  sources?: {label: string; url: string}[];
  definition?: string;
  scopeNote?: string;
  cah1?: CahGroup;
  cah2?: CahGroup;
  cah3?: CahGroup;
  courseAvailability?: CourseAvailability;
  status?: "approved" | "no_direct_route" | "needs_review" | "not_subject";
  ukGroup?: string;
  soc4?: string;
  salaryScope?: {code: string; level: string; fallback: boolean};
  detailUrl?: string;
  level?: string;
  starts?: number | null;
  startsYear?: string | null;
};

export type InterestArea = { id: string; label: string; description: string };
export type InterestData = {
  meta: { mapped: number; total: number };
  areas: InterestArea[];
  profiles: Record<string, { interests: number[]; specific: Array<number | null>; jobZone: number | null; onetCodes: string[] }>;
};

export function interests(answers: number[]) {
  return DIMENSIONS.map((_, dimension) => {
    const values = QUESTIONS.flatMap((question, index) => question[1] === dimension && answers[index] > 0 ? [answers[index]] : []);
    return values.reduce((sum, value) => sum + value, 0);
  });
}

// Absolute agreement keeps flat or unsure answers neutral.
export function similarity(a: number[], b: number[]) {
  if (Math.max(...a) - Math.min(...a) < 6) return .5;
  const differences = a.map((value, index) => Math.abs((value - 10) / 40 - (b[index] - 1) / 6));
  return 1 - differences.reduce((sum, value) => sum + value, 0) / 6;
}

export function targetJobIds(units: Job[], targetIds: string[]) {
  const jobs = units.filter(unit => unit.path === "jobs");
  // Keep the last published dataset usable until the reviewed HECoS release is ready.
  const hecosDataset = units.some(unit => unit.path === "degrees" && unit.id.startsWith("hecos:"));
  const result = new Set(targetIds.filter(id => id.startsWith("soc4:") || id.startsWith("onet:")));
  for (const job of jobs) if (job.soc4 && targetIds.includes(`soc4:${job.soc4}`)) result.add(job.id);
  for (const route of units.filter(unit => unit.path !== "jobs")) {
    if (hecosDataset && route.path === "degrees" && (!route.id.startsWith("hecos:") || route.status !== "approved")) continue;
    const legacyDegreeId = route.id.startsWith("hecos:") && route.status === "approved" && route.cah3
      ? `degree-${route.cah3.code.replace(/^CAH/, "")}`
      : "";
    if (!targetIds.includes(route.id) && !targetIds.includes(legacyDegreeId)) continue;
    if (route.onetCodes) for (const code of route.onetCodes) result.add(`onet:${code}`);
    else if (!hecosDataset || route.path !== "degrees") for (const index of route.roles ?? []) if (jobs[index]) result.add(jobs[index].id);
  }
  return result;
}

const percentile = (values: number[], value: number | null) => {
  if (value === null || !values.length) return .5;
  return values.filter(candidate => candidate <= value).length / values.length;
};

export function aiPreferenceModifier(ai: number, exposure: number | null) {
  if (exposure === null || !ai) return 0;
  if (exposure < 40) return [0, 10, 5, 0, 0, 0][ai] ?? 0;
  if (exposure >= 70) return [0, -20, -10, -5, 0, 10][ai] ?? 0;
  if (ai === 5) return 5;
  return 0;
}

export function rankJobs(jobs: Job[], data: InterestData, profile: Profile, units: Job[] = jobs) {
  const user = interests(profile.answers);
  const plan = EDUCATION_PLANS[profile.educationPlan || "unsure"];
  const targets = targetJobIds(units, profile.targetIds);
  const networkAreas = data.areas.flatMap((area, index) => profile.networkAreaIds.includes(area.id) ? [index] : []);
  const pursued = data.areas.flatMap((area, index) => profile.specificInterests[area.id] === "pursue" ? [index] : []);
  const avoided = data.areas.flatMap((area, index) => profile.specificInterests[area.id] === "avoid" ? [index] : []);
  const openings = jobs.flatMap(job => job.openings === null ? [] : [job.openings]).sort((a, b) => a - b);
  const salaries = jobs.flatMap(job => job.salary === null ? [] : [job.salary]).sort((a, b) => a - b);

  return jobs.filter(job => {
    const profileData = data.profiles[job.id];
    const target = targets.has(job.id);
    if (!target && !profileData?.jobZone) return false;
    if (!target && profileData?.jobZone && profileData.jobZone > plan.maxZone) return false;
    if (!target && avoided.some(index => (profileData?.specific[index] ?? 0) >= 50)) return false;
    return true;
  }).map(job => {
    const profileData = data.profiles[job.id];
    const vector = profileData?.interests;
    const specific = profileData?.specific ?? [];
    const dimensions = vector ? vector.map((value, index) => ({ value: (value - 1) / 6 * (user[index] - 10) / 40, index }))
      .sort((a, b) => b.value - a.value).slice(0, 2).map(item => item.index) : [];
    const riasecFit = vector ? similarity(user, vector) : .5;
    const specificFit = pursued.length
      ? pursued.reduce((sum, index) => sum + (specific[index] ?? 50) / 100, 0) / pursued.length
      : .5;
    const matchedAreas = pursued.map(index => ({ area: data.areas[index], score: specific[index] ?? 0 }))
      .filter(match => match.score >= 35)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(match => match.area);
    const opportunity = percentile(openings, job.openings);
    const salaryBonus = Math.max(0, profile.salaryImportance) / 3 * percentile(salaries, job.salary) * 10;
    const zone = profileData?.jobZone ?? null;
    const zoneBonus = zone && plan.preferredZones.some(preferred => preferred === zone) ? 10 : 0;
    const aiModifier = aiPreferenceModifier(profile.ai, job.exposure);
    const networkBonus = profile.network === "yes" && networkAreas.some(index => (specific[index] ?? 0) >= 50) ? 10 : 0;
    const target = targets.has(job.id);
    const coreScore = riasecFit * 40 + specificFit * 40 + opportunity * 20;
    return {
      job,
      dimensions,
      matchedAreas,
      riasecFit,
      specificFit,
      opportunity,
      salaryBonus,
      zoneBonus,
      aiModifier,
      networkBonus,
      jobZone: zone,
      target,
      score: coreScore + salaryBonus + zoneBonus + aiModifier + networkBonus,
      hasInterestData: !!profileData,
    };
  }).sort((a, b) => Number(b.target) - Number(a.target) || b.score - a.score || a.job.label.localeCompare(b.job.label));
}

export function linkedRoutes(job: Job, units: Job[]) {
  const hecosDataset = units.some(unit => unit.path === "degrees" && unit.id.startsWith("hecos:"));
  const routes = units.filter(unit => unit.path !== "jobs" &&
    (!hecosDataset || unit.path !== "degrees" || (unit.id.startsWith("hecos:") && unit.status === "approved")));
  if (job.id.startsWith("onet:")) {
    const code = job.id.slice(5);
    return routes.filter(unit => unit.onetCodes?.includes(code))
      .map(unit => ({...unit, routeNote: unit.routeNotes?.[code]}));
  }
  const jobs = units.filter(unit => unit.path === "jobs");
  const index = jobs.findIndex(unit => unit.id === job.id);
  return routes.filter(unit => (!hecosDataset || unit.path !== "degrees") && unit.roles?.includes(index));
}

export function visibleRoutes(job: Job, units: Job[], profile: Profile) {
  const plan = EDUCATION_PLANS[profile.educationPlan || "unsure"];
  return linkedRoutes(job, units).filter(route => {
    if (route.path === "degrees" && !plan.showDegrees) return false;
    if (route.path === "apprenticeships" && Number(route.level ?? 0) > plan.maxApprenticeship) return false;
    if (profile.route === "University") return route.path === "degrees";
    if (profile.route === "Apprenticeship") return route.path === "apprenticeships";
    if (profile.route === "Straight into work") return false;
    return true;
  });
}

export const band = (value: number | null) => value === null ? "Not available" : value < 40 ? "Lower" : value < 70 ? "Medium" : "Higher";

export function subjectEvidence(qualifications: Qualification[]) {
  return qualifications.filter(qualification => qualification.subject.trim() && qualification.grade).map(qualification =>
    `${qualification.subject}: ${qualification.grade} (${qualification.kind}${qualification.detail ? ` — ${qualification.detail}` : ""})`
  );
}

export const APPRENTICESHIPS: Record<string, string> = {
  England: "https://www.gov.uk/apply-apprenticeship",
  Scotland: "https://www.apprenticeships.scot/",
  Wales: "https://careerswales.gov.wales/apprenticeship-search",
  "Northern Ireland": "https://www.nidirect.gov.uk/campaigns/apprenticeships",
};
