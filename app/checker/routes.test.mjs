import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = name => JSON.parse(readFileSync(new URL(`../../public/${name}`, import.meta.url)));
const data = read('v3.json');
const destinations = read('destinations/index.json');
const jobs = new Map(data.routeJobs.map(j => [j.id, j]));
const routes = data.units.filter(u => u.path !== 'jobs');

test('publishes approved exact links, with unique stable IDs', () => {
  assert.deepEqual(data.meta.counts, { jobs: 341, degrees: 467, apprenticeships: 620 });
  assert.equal(routes.filter(u => u.path === 'degrees').reduce((n,u) => n+u.routeLinks.length,0),602);
  assert.equal(routes.filter(u => u.path === 'apprenticeships').reduce((n,u) => n+u.routeLinks.length,0),807);
  const ids = [...data.units, ...data.routeJobs, ...data.legacyUnits].map(u => u.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const u of routes) {
    assert.deepEqual(new Set(u.routeLinks.map(l => l.id)), new Set(u.onetCodes.map(c => `onet:${c}`)));
    assert.ok(u.routeLinks.every(l => jobs.has(l.id)));
    assert.ok(!('roles' in u));
    assert.ok(u.sectors.every(s => data.sectors[u.path].some(x => x.id === s)));
  }
});

test('does not reintroduce broad food-to-nuclear routes', () => {
  const food = routes.filter(u => u.path === 'degrees' && /food|beverage/i.test(u.label));
  assert.ok(food.length > 0);
  assert.ok(food.every(u => !u.onetCodes.includes('17-2161.00')));
  assert.ok(routes.some(u => u.path === 'degrees' && u.onetCodes.includes('17-2161.00')));
});

test('social work retains both mental-health pathways and scope notes', () => {
  for (const path of ['degrees','apprenticeships']) {
    const matched = routes.filter(u => u.path === path && u.onetCodes.includes('21-1023.00'));
    assert.ok(matched.length > 0);
    assert.ok(matched.some(u => u.routeLinks.some(l => l.id === 'onet:21-1023.00' && l.note)));
  }
});

test('scores missing occupations as missing, and does not double-count UK groups', () => {
  const uk = new Map(data.units.filter(u => u.path === 'jobs').map(u => [u.id,u]));
  for (const route of routes) {
    const linked = route.routeLinks.map(l => jobs.get(l.id));
    const scored = linked.filter(j => j.exposure != null && j.substitution != null);
    assert.equal(route.scoredRoutes, scored.length);
    assert.equal(route.totalRoutes, linked.length);
    if (!scored.length) assert.equal(route.risk, null);
    else assert.ok(Math.abs(route.risk - Math.sqrt(route.exposure * route.substitution)) <= .5);
    const groups = [...new Set(linked.map(j => j.soc4))].map(c => uk.get(`soc4:${c}`)).filter(Boolean);
    assert.equal(route.openings, groups.reduce((n,g) => n+(g.openings ?? 0),0) || null);
  }
});

test('graduate routes resolve to exact titles, retaining broad observed outcomes', () => {
  const ids = new Set(destinations.routeJobs.map(j => j.id));
  for (const subject of destinations.subjects) {
    for (const group of Object.values(subject.role_groups ?? {})) {
      for (const id of [...group.trains_for,...group.related_to]) assert.ok(ids.has(id));
    }
    if (subject.occupations) assert.equal(subject.occupations.length,9);
  }
  assert.ok(destinations.groups.every(g => g.roles.every(r => r.id.startsWith('soc4:'))));
});
