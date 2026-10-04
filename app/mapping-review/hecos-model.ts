export type Mapping = {
  onetCode: string; relation: "direct" | "conditional"; conditions: string;
  rationale?: string; qualificationCaveat?: string; source?: string;
  evidence?: {sourceId: string; quote: string}[]; onetTasks?: string[];
};
export type Subject = {
  code: string; term: string; definition: string; scopeNote: string;
  status: "approved" | "needs_review" | "no_direct_route" | "not_subject";
  cah1: {code: string; label: string}; cah3: {code: string; label: string};
  selectionBasis: string;
  availability: {codedCourseRecords: number; titleMatchedRecords: number; distinctUnionCourseRecords: number; estimatedProviderCourseFamilies?: number; caveat: string};
  sources: {id: string; url: string; error?: string}[];
  courseExamples: {title: string; url: string}[];
  mappings: Mapping[]; candidateMappings?: Mapping[];
  review: Record<string, {availabilityReason?: string; noMappingReason?: string; resolutionReason?: string}>;
  fingerprint: string;
};
export type Job = {code: string; title: string; description: string; tasks: string[]};
export type NoRouteAnalysis = {
  taxonomy: {code: string; label: string}[];
  counts: Record<string, number>;
  subjects: {code: string; reason_code: string; saved_reason: string}[];
};
export type HumanLink = {onetCode: string; relation: "direct" | "conditional" | "unverified"; conditions: string};
export type HumanReview = {
  code: string; fingerprint: string; action: "propose" | "approve" | "exclude" | "defer" | "reset";
  links: HumanLink[]; note: string; evidenceUrl: string; at: string;
};
export function currentReviews(reviews: HumanReview[], subjects: Subject[]) {
  const fingerprints = new Map(subjects.map(s => [s.code, s.fingerprint]));
  const result: Record<string, HumanReview> = {};
  for (const review of reviews) if (fingerprints.get(review.code) === review.fingerprint) {
    if (review.action === "reset") delete result[review.code]; else result[review.code] = review;
  }
  return result;
}
export function reviewError(value: unknown, subject: Subject | undefined, jobs: Set<string>): string | null {
  if (!value || typeof value !== "object") return "Invalid review.";
  const v = value as HumanReview;
  if (!subject || subject.status !== "needs_review" || v.fingerprint !== subject.fingerprint) return "The mapping changed. Reload before saving.";
  if (!["propose", "approve", "exclude", "defer", "reset"].includes(v.action)) return "Choose a review action.";
  if (typeof v.note !== "string" || v.note.length > 4000 || typeof v.evidenceUrl !== "string" || v.evidenceUrl.length > 2000) return "Invalid note or evidence link.";
  if (v.evidenceUrl) { try { if (!["https:", "http:"].includes(new URL(v.evidenceUrl).protocol)) return "Use an http or https evidence link."; } catch { return "Use a complete evidence URL."; } }
  if (!Array.isArray(v.links) || v.links.length > 10) return "Select at most ten links.";
  if (v.action === "approve" || v.action === "propose") {
    if (!v.links.length) return "Select at least one job.";
    if (v.action === "approve" && !v.note.trim()) return "Explain why the uncertainty is resolved.";
    if (new Set(v.links.map(l => l?.onetCode)).size !== v.links.length) return "Select each job only once.";
    for (const l of v.links) {
      if (!l || !jobs.has(l.onetCode) || !(v.action === "propose" ? ["direct", "conditional", "unverified"] : ["direct", "conditional"]).includes(l.relation) || typeof l.conditions !== "string" || l.conditions.length > 2000) return "Invalid job or route type.";
      if (v.action === "approve" && l.relation === "conditional" && !l.conditions.trim()) return "State the requirement for each conditional route.";
    }
    if (v.action === "approve" && v.links.length > 2 && v.note.trim().length < 40) return "More than two jobs needs a fuller justification (at least 40 characters).";
  } else if (v.links.length) return "Only a proposal or approval can contain job links.";
  return null;
}
