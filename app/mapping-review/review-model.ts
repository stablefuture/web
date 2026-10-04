export type ReviewRow = {
  id: string; fingerprint: string; kind: "degree" | "apprenticeship";
  code: string; title: string; relation: string; proposal: "keep" | "remove" | "review";
  priority: number; rationale: string; evidence: string[];
  jobs: { code: string; title: string; description: string; tasks: string[] }[];
  sources: { label: string; url: string }[];
};
export type Decision = { id: string; fingerprint: string; action: "accept" | "reject" | "defer" | "reset"; note: string; at: string };
export function proposalLabels(row: ReviewRow) {
  if (row.proposal === "remove") return { original: "REMOVE this link", accept: "Remove this link", reject: "Keep this link" };
  if (!row.jobs.length) return { original: "NO DIRECT MATCH identified", accept: "Confirm no direct match", reject: "Request a different mapping" };
  if (row.proposal === "review") return { original: "TENTATIVE links — needs your judgement", accept: "Approve these links", reject: "Reject these links — needs correction" };
  return { original: "KEEP these links", accept: "Keep these links", reject: "Reject these links — needs correction" };
}
export function decisionLabel(row: ReviewRow, decision?: Decision) {
  if (!decision) return "No decision saved";
  if (decision.fingerprint !== row.fingerprint) return `Earlier evidence: ${decision.action} — review again`;
  if (decision.action === "reset") return "Reopened — awaiting your decision";
  if (decision.action === "defer") return "Deferred — decide later";
  return proposalLabels(row)[decision.action];
}
export function inHumanShortlist(row: ReviewRow) {
  return row.kind === "degree" ? row.proposal === "remove" : row.priority === 1;
}
export function reviewState(row: ReviewRow, decisions: Decision[]) {
  const last = decisions.findLast(d => d.id === row.id);
  if (!last || last.action === "reset") return "pending";
  if (last.fingerprint !== row.fingerprint) return "changed";
  return last.action;
}
