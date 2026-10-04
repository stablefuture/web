// Publish existing reviewed relations only. No scoring or model calls.
import { readFileSync, writeFileSync } from 'node:fs';
const source = JSON.parse(readFileSync(new URL('../../jobs/data/classified/hecos_to_onet.json', import.meta.url)));
const published = JSON.parse(readFileSync(new URL('../public/assessment-careers.json', import.meta.url))).units;
const units = new Map(published.map(unit => [unit.id, unit]));
const relations = {};
for (const subject of source.subjects) {
  const id = `hecos:${subject.code}`;
  const unit = units.get(id);
  if (subject.status !== 'approved' || !unit) continue;
  relations[id] = {};
  for (const mapping of subject.mappings ?? []) {
    if (!unit.onetCodes?.includes(mapping.onetCode)) continue;
    if (!['direct', 'conditional'].includes(mapping.relation)) throw Error(`Unknown relation for ${id}`);
    relations[id][mapping.onetCode] = mapping.relation;
  }
}
writeFileSync(new URL('../public/pathfinder-route-evidence.json', import.meta.url), JSON.stringify({source:'jobs/data/classified/hecos_to_onet.json',relations})+'\n');
console.log(`Published existing relation labels for ${Object.keys(relations).length} degree subjects.`);
