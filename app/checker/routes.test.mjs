import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = name => JSON.parse(readFileSync(new URL(`../../public/${name}`, import.meta.url)));
const data = read('v3.json');
const destinations = read('destinations/index.json');
const jobs = data.units.filter(u => u.path === 'jobs');
const degrees = data.units.filter(u => u.path === 'degrees');

test('original route data has valid UK job references', () => {
  assert.deepEqual(data.meta.counts, { jobs: 341, degrees: 165, apprenticeships: 620 });
  for (const route of data.units.filter(u => u.path !== 'jobs')) {
    for (const index of [...(route.roles ?? []), ...(route.related_roles ?? [])]) {
      assert.ok(Number.isInteger(index) && jobs[index]?.id.startsWith('soc4:'));
    }
    assert.ok(!(route.roles ?? []).some(i => (route.related_roles ?? []).includes(i)));
  }
});

test('destinations uses the same latest degree classifications as the checker', () => {
  const sectors = new Map(data.sectors.degrees.map(s => [s.label.toLowerCase(),s.id]));
  for (const subject of destinations.subjects) {
    const sector = sectors.get(subject.label.toLowerCase());
    if (!sector) continue;
    const matching = degrees.filter(d => d.sectors.includes(sector));
    const direct = new Set(matching.flatMap(d => d.roles).map(i => jobs[i].id));
    const broader = new Set(matching.flatMap(d => d.related_roles).map(i => jobs[i].id).filter(id => !direct.has(id)));
    const groups = Object.values(subject.role_groups ?? {});
    assert.deepEqual(new Set(groups.flatMap(g => g.trains_for)), direct, subject.label);
    assert.deepEqual(new Set(groups.flatMap(g => g.related_to)), broader, subject.label);
  }
});
