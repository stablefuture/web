"use client";

import { useState } from "react";
import styles from "./viewer.module.css";

type Row = {code: string; title: string; live: boolean; ours: string[]; used: string[]; nfer: string[]};
type Data = {rows: Row[]; occupations: Record<string, {title: string; nferTitle?: string; description: string; current: boolean}>; sources: Record<string, {path: string; sha256: string}>};
const diff = (a: string[], b: string[]) => a.filter(c => !b.includes(c));

export default function Viewer({data}: {data: Data}) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"ours" | "used">("ours");
  const [filter, setFilter] = useState("different");
  const [liveOnly, setLiveOnly] = useState(false);
  const [selected, setSelected] = useState("2139");
  const [sort, setSort] = useState("difference");
  const changed = (r: Row) => diff(r[mode], r.nfer).length + diff(r.nfer, r[mode]).length;
  const rows = data.rows.filter(r => {
    const search = [r.code, r.title, ...[...r[mode], ...r.nfer].flatMap(c => [c, data.occupations[c]?.title, data.occupations[c]?.nferTitle])].join(" ").toLowerCase();
    return (!liveOnly || r.live) && search.includes(query.toLowerCase().trim()) &&
      (filter === "all" || (filter === "different" ? changed(r) > 0 : changed(r) === 0));
  }).sort((a,b) => sort === "difference" ? changed(b) - changed(a) || a.code.localeCompare(b.code) : a.code.localeCompare(b.code));
  const row = rows.find(r => r.code === selected) ?? rows[0];
  const scope = data.rows.filter(r => !liveOnly || r.live);
  const shared = row ? row[mode].filter(c => row.nfer.includes(c)) : [];
  function list(codes: string[], source: "ours" | "nfer", other: string[]) {
    return codes.length ? <ul className={styles.links}>{codes.map(code => {
      const o = data.occupations[code];
      const same = other.includes(code);
      return <li key={code} data-shared={same}><span className={styles.tag}>{same ? "Shared" : source === "ours" ? "Only ours" : "Only NFER"}</span>
        <strong>{source === "nfer" ? o.nferTitle || o.title : o.title}</strong><small>{code}{!o.current && " · Not in O*NET 30.0 — version review needed"}</small>
        {o.description && <details><summary>Description</summary><p>{o.description}</p></details>}
        {o.current && <a href={`https://www.onetonline.org/link/summary/${code}`} target="_blank" rel="noreferrer">O*NET source ↗</a>}
      </li>;
    })}</ul> : <p className={styles.empty}>No links in this mapping.</p>;
  }
  return <main className={styles.page}>
    <p className={styles.eyebrow}>LOCAL REVIEW · READ ONLY</p><h1>Our mapping vs NFER</h1>
    <p>Compare SOC2020 groups with their O*NET occupations. A difference is a review prompt, not proof that either map is wrong.</p>
    <div className={styles.notice}>Ours: O*NET 30.0. NFER: O*NET 2019. This compares exact codes; retired, split, or merged codes are not silently translated. “Shared” means the same code, not verified equivalence across versions.</div>
    <div className={styles.controls}>
      <label>Search SOC4 or O*NET title/code<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="e.g. Data analysts, 3544, 15-2051"/></label>
      <label>Our mapping<select value={mode} onChange={e=>setMode(e.target.value as typeof mode)}><option value="ours">Full source crosswalk</option><option value="used">Scored links used by assessment</option></select></label>
      <label>Show<select value={filter} onChange={e=>setFilter(e.target.value)}><option value="different">Differences only</option><option value="all">All groups</option><option value="same">Exact-code matches only</option></select></label>
      <label>Order<select value={sort} onChange={e=>setSort(e.target.value)}><option value="difference">Most differences first</option><option value="code">SOC4 code</option></select></label>
      <label className={styles.check}><input type="checkbox" checked={liveOnly} onChange={e=>setLiveOnly(e.target.checked)}/> Assessment groups only</label>
    </div>
    <p className={styles.stats}>{scope.length} groups · {scope.filter(r=>changed(r)===0).length} exact-code matches · {scope.filter(r=>changed(r)>0).length} differing groups · {rows.length} shown</p>
    <div className={styles.workspace}>
      <nav className={styles.sidebar} aria-label="SOC4 groups">{rows.map(r=><button key={r.code} aria-current={row?.code===r.code ? "true" : undefined} onClick={()=>setSelected(r.code)}><small>{r.code} · {changed(r)} differing links</small><strong>{r.title}</strong></button>)}{!rows.length && <p>No matching groups. Try another search or filter.</p>}</nav>
      {row && <section className={styles.detail} aria-label="Selected mapping"><p className={styles.eyebrow}>SOC4 {row.code} · {row.live ? "In assessment" : "Outside assessment"}</p><h2>{row.title}</h2>
        <p>{shared.length} shared · {diff(row[mode],row.nfer).length} only ours · {diff(row.nfer,row[mode]).length} only NFER</p>
        {mode === "used" && <p className={styles.notice}>This view includes scoring and product filters. Missing links here do not necessarily mean the source crosswalk rejects them.</p>}
        <div className={styles.columns}><section><h3>Stable Future <small>{row[mode].length} links</small></h3>{list(row[mode],"ours",row.nfer)}</section><section><h3>NFER <small>{row.nfer.length} links</small></h3>{list(row.nfer,"nfer",row[mode])}</section></div>
      </section>}
    </div>
    <details className={styles.sources}><summary>Sources and interpretation</summary><p>The full source is soc4_to_onet30_narrow.json. The assessment view uses detail edges from the current built universe. NFER includes all rows from our stored reference, without the product’s senior-role or scoring exclusions. Neither selector changes the product.</p><a href="https://www.nfer.ac.uk/media/1tojrw0o/matching_uk_soc2020_to_o_net.pdf" target="_blank" rel="noreferrer">NFER mapping methodology ↗</a>{Object.entries(data.sources).map(([key,s])=><p key={key}>{s.path}<small className={styles.hash}>Snapshot SHA256: {s.sha256}</small></p>)}</details>
  </main>;
}
