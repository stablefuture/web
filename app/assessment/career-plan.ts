import type { Job } from "./model";

export const PLAN_KEY = "stable-future-pathfinder-plan-v1";
export const SLOTS = ["A", "B", "Z"] as const;
export type Slot = typeof SLOTS[number];
export const SLOT_LABELS = { A: "Preferred route", B: "Alternative", Z: "Fallback" };
export type PlanChoice = { unitId: string; routeId: string; reason: string; entryCheck: string; reviewTrigger: string };
export type CareerPlan = {
  version: 1;
  choices: Record<Slot, PlanChoice>;
  nextAction: string;
  actionDate: string;
  reviewDate: string;
};
const emptyChoice = (): PlanChoice => ({ unitId: "", routeId: "", reason: "", entryCheck: "", reviewTrigger: "" });
export const emptyPlan = (): CareerPlan => ({ version: 1, choices: { A: emptyChoice(), B: emptyChoice(), Z: emptyChoice() }, nextAction: "", actionDate: "", reviewDate: "" });

// Replacing a choice must not carry notes or a training route from the previous career.
export function chooseUnit(plan: CareerPlan, slot: Slot, unitId: string): CareerPlan {
  if (plan.choices[slot].unitId === unitId) return plan;
  return { ...plan, choices: { ...plan.choices, [slot]: { ...emptyChoice(), unitId } } };
}

export function readPlan(value: string | null): CareerPlan | null {
  if (!value) return null;
  try {
    const raw = JSON.parse(value);
    if (raw?.version !== 1 || !raw.choices) return null;
    const plan = emptyPlan();
    const text = (v: unknown, max: number) => typeof v === "string" ? v.slice(0, max) : "";
    const date = (v: unknown) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) ? v : "";
    for (const slot of SLOTS) {
      const choice = raw.choices[slot];
      if (!choice || typeof choice.unitId !== "string") return null;
      plan.choices[slot] = {
        unitId: text(choice.unitId, 120), routeId: text(choice.routeId, 120),
        reason: text(choice.reason, 600), entryCheck: text(choice.entryCheck, 600), reviewTrigger: text(choice.reviewTrigger, 600),
      };
    }
    plan.nextAction = text(raw.nextAction, 600);
    plan.actionDate = date(raw.actionDate);
    plan.reviewDate = date(raw.reviewDate);
    return plan;
  } catch { return null; }
}

export function planPrompts(plan: CareerPlan, units: Job[]): string[] {
  const selected = SLOTS.map(slot => units.find(unit => unit.id === plan.choices[slot].unitId));
  const prompts: string[] = [];
  const ids = selected.flatMap(unit => unit ? [unit.id] : []);
  if (new Set(ids).size < ids.length) prompts.push("You have chosen the same option more than once. Would a different alternative give you more options?");
  if (selected[1]?.path === "jobs" && selected[1].exposure != null && selected[1].exposure >= 70) prompts.push("B also has higher AI exposure. Consider how it differs from A and what would make it a useful alternative.");
  if (selected[2]?.path === "jobs" && selected[2].exposure != null && selected[2].exposure >= 40) prompts.push("For Z, explore a less-exposed option too. Check how soon you could start earning and what training you would need.");
  if (selected.some(unit => unit && (unit.path !== "jobs" || unit.exposure == null))) prompts.push("Some choices have no career exposure score. Missing evidence does not mean lower exposure; check the work the route could lead to.");
  return prompts;
}

export function formatDate(value: string) {
  if (!value) return "Not set";
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export function exposureText(unit?: Job) {
  if (!unit) return "Not chosen";
  if (unit.path !== "jobs") return "Choose a career to assess exposure; this is a training route.";
  return unit.exposure == null ? "Not available" : `${unit.exposure}/100 — relative AI exposure, not a probability of job loss`;
}

export function planText(plan: CareerPlan, units: Job[], model: string, date: string): string {
  return ["MY PATHFINDER PLAN", `Prepared: ${date}`, `Evidence model: ${model}`, "",
    ...SLOTS.flatMap(slot => {
      const choice = plan.choices[slot];
      const unit = units.find(u => u.id === choice.unitId);
      const route = units.find(u => u.id === choice.routeId);
      return [`${slot} — ${SLOT_LABELS[slot]}`, unit?.label ?? (choice.unitId ? "Choice no longer in the current data — review needed" : "Not chosen yet"),
        ...(route ? [`Via: ${route.label}`] : []), `AI exposure: ${exposureText(unit)}`,
        `Why this fits: ${choice.reason || "To explore"}`, `Entry, time and cost: ${choice.entryCheck || "To check"}`,
        `When I would reconsider: ${choice.reviewTrigger || "To decide"}`,
        ...(unit?.path === "jobs" ? [`Explore: https://www.stablefuture.uk/pathfinder?career=${encodeURIComponent(unit.id)}`] : []),
        ...(unit?.sources ?? []).map(s => `${s.label}: ${s.url}`), ""];
    }), "MY NEXT ACTION", plan.nextAction || "Not chosen yet", `Do this by: ${formatDate(plan.actionDate)}`, `Review my plan: ${formatDate(plan.reviewDate)}`, "",
    ...planPrompts(plan, units), "", "Evidence: O*NET occupations and tasks, linked to broader UK pay and openings data. UK occupation mappings and AI scores by Stable Future. This is a prototype, not a validated suitability test. Check current entry requirements with the course provider or employer.",
    "Sources: https://www.onetcenter.org/database.html",
  ].join("\n");
}
