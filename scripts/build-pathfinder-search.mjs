#!/usr/bin/env node
// Pathfinder's career search: the Career Check catalogue, with HECoS degree subjects in place of
// CAH3 groups. Only subjects with at least one Discover Uni course are listed.
//   node scripts/build-pathfinder-search.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { degreeTitle } from '../app/lib/titleCase.mjs';

const read = path => JSON.parse(readFileSync(new URL(`../public/${path}`, import.meta.url), 'utf8'));
const lead = read('lead-magnet/search.json');
const hecos = read('hecos.json').subjects.filter(s => !s.administrative && s.discoverUniCourses > 0);
const degrees = hecos.map(s => ({
  id: `hecos:${s.code}`, kind: 'degree', title: degreeTitle(s.term),
  aka: s.cah3?.label && s.cah3.label.toLowerCase() !== s.term.toLowerCase() ? [degreeTitle(s.cah3.label)] : [],
  sectors: s.cah1 ? [{ id: `cah1:${s.cah1.code}`, label: degreeTitle(s.cah1.label) }] : [],
}));
const paths = [...degrees, ...lead.paths.filter(p => p.kind !== 'degree')];
writeFileSync(new URL('../public/pathfinder-search.json', import.meta.url), JSON.stringify({ paths, jobGroups: lead.jobGroups }));
console.log(`${degrees.length} HECoS degrees, ${paths.length - degrees.length} jobs and apprenticeships`);
