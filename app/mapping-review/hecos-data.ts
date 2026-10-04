import {readFile, mkdir, appendFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import path from "node:path";
import type {Subject, Job, HumanReview, NoRouteAnalysis} from "./hecos-model";

const root = path.resolve(process.cwd(), "../jobs/data/classified");
const ledger = path.join(root, "hecos_onet_review/human-decisions.jsonl");
export async function loadHecos() {
  const [map, catalogue] = await Promise.all([
    readFile(path.join(root, "hecos_to_onet.json"), "utf8").then(JSON.parse),
    readFile(path.join(root, "st_onet_review/onet_catalogue.json"), "utf8").then(JSON.parse),
  ]);
  const subjects: Subject[] = map.subjects.map((s: Subject) => ({...s,
    fingerprint: createHash("sha256").update(JSON.stringify(s)).digest("hex")}));
  const jobs: Job[] = Object.entries(catalogue).map(([code, job]) => ({code, ...(job as Omit<Job, "code">)}));
  return {subjects, jobs};
}
export async function loadHecosReviews(): Promise<HumanReview[]> {
  try { return (await readFile(ledger, "utf8")).split("\n").filter(Boolean).map(s => JSON.parse(s)); }
  catch (e) { if ((e as NodeJS.ErrnoException).code === "ENOENT") return []; throw e; }
}
export async function loadNoRouteAnalysis(): Promise<NoRouteAnalysis> {
  return JSON.parse(await readFile(path.join(root, "hecos_onet_review/no-route-analysis.json"), "utf8"));
}
export async function saveHecosReview(review: HumanReview) {
  await mkdir(path.dirname(ledger), {recursive: true});
  await appendFile(ledger, JSON.stringify(review) + "\n", "utf8");
}
