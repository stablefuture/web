import { initialProfile, QUESTIONS, type InterestData, type Profile } from "./model";

// Fictional, repeatable input for local exploration testing, not a real student.
export function alexProfile(data: InterestData): Profile {
  return {
    ...initialProfile,
    stage: "Sixth form or college",
    educationPlan: "university",
    route: "Keep my options open",
    targetIds: [],
    answers: QUESTIONS.map(([, dimension], index) =>
      [4, 5, 2, 3, 3, 4][dimension] - (index % 4 === 0 ? 1 : 0)),
    specificInterests: Object.fromEntries(data.areas.map(area => [area.id,
      ["1.B.3.j", "1.B.3.q", "1.B.3.p"].includes(area.id) ? "pursue" : "neutral"])),
    ai: 4,
    salaryImportance: 2,
    network: "yes",
    networkAreaIds: ["1.B.3.q"],
    confidence: "Comfortable",
    qualifications: [
      {id: 1, kind: "GCSE (9–1)", subject: "Mathematics", grade: "8", institution: "", detail: ""},
      {id: 2, kind: "GCSE (9–1)", subject: "Computer Science", grade: "8", institution: "", detail: ""},
      {id: 3, kind: "GCSE (9–1)", subject: "English Language", grade: "6", institution: "", detail: ""},
    ],
  };
}
