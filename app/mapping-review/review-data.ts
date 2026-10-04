import { readFile, mkdir, appendFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import type { Decision, ReviewRow } from "./review-model";

const root = path.resolve(process.cwd(), "../jobs/data/classified");
const ledger = path.join(root, "mapping-review/decisions.jsonl");
const read = async (file: string) => JSON.parse(await readFile(path.join(root, file), "utf8"));
type Occupation = { title: string; description: string; tasks?: string[]; task_examples?: string[] };
type Edge = { onet_code: string; decision: ReviewRow["proposal"]; rationale_code: string; prospects_evidence_ids: number[] };

export async function loadQueue(): Promise<ReviewRow[]> {
  const [audit, standards, catalogue, qa] = await Promise.all([
    read("cah3_onet_direct_audit.json"), read("st_to_onet_proposed.json"),
    read("st_onet_review/onet_catalogue.json"), read("st_onet_review/qa_resolution.json"),
  ]);
  const rows: ReviewRow[] = [];
  function add(row: Omit<ReviewRow, "fingerprint">, version: unknown) {
    rows.push({ ...row, fingerprint: createHash("sha256").update(JSON.stringify([row, version])).digest("hex") });
  }
  function job(code: string, source: Record<string, Occupation>) {
    const o = source[code];
    return { code, title: o?.title ?? code, description: o?.description ?? "", tasks: o?.tasks ?? o?.task_examples ?? [] };
  }
  const occurrences = new Map<number, {degree_id: string; job_title: string; label: string}>(audit.prospects_occurrences.map((o: {id: number}) => [o.id, o]));
  for (const [code, subject] of Object.entries(audit.subjects) as [string, {cah3_name: string; reviewed_links: Record<string, Edge[]>}][]) {
    for (const [relation, edges] of Object.entries(subject.reviewed_links)) for (const edge of edges) {
      const evidence = edge.prospects_evidence_ids.map(id => occurrences.get(id)).filter(o => !!o);
      add({ id: `degree:${code}:${relation}:${edge.onet_code}`, kind: "degree", code, title: subject.cah3_name,
        relation: relation === "primary_trains_for" ? "Direct training link" : "Related work only — not a training route",
        proposal: edge.decision, priority: edge.decision === "remove" ? 0 : edge.decision === "review" ? 2 : 4,
        rationale: audit.rationale_codes[edge.rationale_code],
        evidence: evidence.map(o => `${o.degree_id}: ${o.job_title} (${o.label})`),
        jobs: [job(edge.onet_code, audit.onet_evidence)],
        sources: [...new Set(evidence.map(o => o.degree_id))].map(id => ({label: `Prospects: ${id}`, url: `https://www.prospects.ac.uk/careers-advice/what-can-i-do-with-my-degree/${id}`})),
      }, ["O*NET 30.3", edge]);
    }
  }
  type Standard = {title: string; version: string; level: string; status: string; source: string; notes?: string; extra_links_justification?: string; onet_codes: string[]; links: {code: string; rationale: string; evidence: unknown}[]};
  for (const [code, st] of Object.entries(standards.mappings) as [string, Standard][]) {
    const challenge = qa.resolutions.find((q: {reference: string}) => q.reference === code);
    const unresolved = challenge?.outstanding_disagreement;
    add({ id: `apprenticeship:${code}`, kind: "apprenticeship", code, title: st.title,
      relation: `Level ${st.level} · Version ${st.version} · Review the whole set of links`,
      proposal: st.status === "needs_review" || unresolved ? "review" : "keep",
      priority: st.status === "needs_review" || unresolved ? 1 : st.onet_codes.length > 2 ? 3 : 4,
      rationale: [st.notes, st.extra_links_justification, unresolved && `Disputed: ${unresolved}`].filter(Boolean).join("\n\n"),
      evidence: st.links.map(l => `${l.code}: ${l.rationale}\n${typeof l.evidence === "string" ? l.evidence : JSON.stringify(l.evidence)}`),
      jobs: st.onet_codes.map(c => job(c, catalogue)), sources: [{label: "Official apprenticeship standard", url: st.source}],
    }, [standards.metadata.onet_version, st]);
  }
  return rows.sort((a,b) => a.priority - b.priority || a.id.localeCompare(b.id));
}

export async function loadDecisions(): Promise<Decision[]> {
  try { return (await readFile(ledger, "utf8")).split("\n").filter(Boolean).map(line => JSON.parse(line)); }
  catch (e) { if ((e as NodeJS.ErrnoException).code === "ENOENT") return []; throw e; }
}
export async function saveDecision(decision: Decision) {
  await mkdir(path.dirname(ledger), { recursive: true });
  await appendFile(ledger, JSON.stringify(decision) + "\n", "utf8");
}
