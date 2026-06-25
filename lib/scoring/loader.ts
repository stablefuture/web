// Server-side loader for the scoring rubric + rationale.
// Files are read once per process and cached at module scope.

import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import type { Rubric, Rationale } from "./types";

const SCORING_DIR = path.join(process.cwd(), "lib", "scoring");

let _rubric: Rubric | null = null;
let _rationale: Map<string, Rationale> | null = null;

export function loadRubric(): Rubric {
  if (_rubric) return _rubric;
  const raw = fs.readFileSync(path.join(SCORING_DIR, "scoring.yaml"), "utf8");
  _rubric = yaml.load(raw) as Rubric;
  return _rubric;
}

export function loadRationale(): Map<string, Rationale> {
  if (_rationale) return _rationale;
  const md = fs.readFileSync(
    path.join(SCORING_DIR, "scoring-rationale.md"),
    "utf8"
  );

  const map = new Map<string, Rationale>();
  // Split on "## " (h2 headers = rationale keys). slice(1) drops the
  // intro text before the first key.
  const sections = md.split(/^## /m).slice(1);

  for (const section of sections) {
    const newlineIdx = section.indexOf("\n");
    const key = section.slice(0, newlineIdx).trim();
    let body = section.slice(newlineIdx + 1).trim();

    // Cut at next "# " (top-level section divider, e.g. "# Paths") if present.
    const nextSectionMatch = body.match(/^# /m);
    if (nextSectionMatch && nextSectionMatch.index !== undefined) {
      body = body.slice(0, nextSectionMatch.index).trim();
    }

    // Bullets: lines starting with "- ", with continuation lines indented
    // 2+ spaces. Collapse continuation whitespace into a single space.
    const bullets: string[] = [];
    const bulletRegex = /^- (.+(?:\n  +.+)*)/gm;
    let m: RegExpExecArray | null;
    while ((m = bulletRegex.exec(body)) !== null) {
      bullets.push(m[1].replace(/\n\s+/g, " ").trim());
    }

    map.set(key, { key, bullets, raw: body });
  }

  _rationale = map;
  return _rationale;
}
