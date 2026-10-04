import { readFile } from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import Viewer from "./viewer";
import Queue from "./queue";
import { loadDecisions, loadQueue } from "./review-data";
import Link from "next/link";
import styles from "./viewer.module.css";
import HecosViewer from "./hecos-viewer";
import {loadHecos, loadHecosReviews, loadNoRouteAnalysis} from "./hecos-data";
import {loadReverse} from "./reverse-data";
import ReverseViewer from "./reverse-viewer";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mapping review queue", robots: { index: false, follow: false } };

export default async function MappingReview({searchParams}: {searchParams: Promise<{view?: string}>}) {
  // Research reference data stays outside public/ and is never served in production.
  if (process.env.NODE_ENV !== "development") notFound();
  const view = (await searchParams).view;
  const compare = view === "compare";
  const legacy = view === "legacy";
  const reverse = view === "jobs";
  const tabs = <nav className={styles.tabs} aria-label="Mapping tools"><Link aria-current={!compare && !legacy && !reverse ? "page":undefined} href="/mapping-review">HECoS maps & review</Link><Link aria-current={reverse ? "page":undefined} href="/mapping-review?view=jobs">Jobs → degrees</Link><Link aria-current={legacy ? "page":undefined} href="/mapping-review?view=legacy">Earlier CAH / apprenticeship reviews</Link><Link aria-current={compare ? "page":undefined} href="/mapping-review?view=compare">SOC4 comparison with NFER</Link></nav>;
  if (reverse) return <>{tabs}<ReverseViewer jobs={await loadReverse()}/></>;
  if (compare) {
    const file = path.resolve(process.cwd(), "../jobs/data/processed/crosswalk_viewer.json");
    const data = JSON.parse(await readFile(file, "utf8"));
    return <>{tabs}<Viewer data={data}/></>;
  }
  if (!legacy) {
    const [{subjects, jobs}, initialReviews, analysis] = await Promise.all([loadHecos(), loadHecosReviews(), loadNoRouteAnalysis()]);
    return <>{tabs}<HecosViewer subjects={subjects} jobs={jobs} initialReviews={initialReviews} analysis={analysis}/></>;
  }
  const [rows, decisions] = await Promise.all([loadQueue(), loadDecisions()]);
  return <>{tabs}<Queue rows={rows} initialDecisions={decisions}/></>;
}
