import assert from 'node:assert/strict';
import test from 'node:test';
import {compactSalary, rankRoutes, routeTitle} from './presentation.ts';

test('salary rounds to nearest thousand, preserving unknown and zero', () => {
  assert.equal(compactSalary(56499), '£56k');
  assert.equal(compactSalary(56500), '£57k');
  assert.equal(compactSalary(null), 'Not available');
  assert.equal(compactSalary(0), '£0k');
});
test('route labels preserve acronyms', () => {
  assert.equal(routeTitle('computer science'), 'Computer science');
  assert.equal(routeTitle('AI and automation'), 'AI and automation');
  assert.equal(routeTitle('childhood and youth studies', 'degrees'), 'Childhood and Youth Studies');
  assert.equal(routeTitle('artificial intelligence and AI', 'degrees'), 'Artificial Intelligence and AI');
});
test('courses use families; apprenticeships use starts, never job openings', () => {
  const routes = [
    {id:'a', path:'apprenticeships', label:'A', starts:2, openings:99999},
    {id:'b', path:'apprenticeships', label:'B', starts:100, openings:1},
    {id:'c', path:'apprenticeships', label:'C', starts:null},
    {id:'d', path:'apprenticeships', label:'D', starts:0},
  ];
  assert.deepEqual(rankRoutes(routes).map(r=>r.id), ['b','a','d','c']);
  assert.equal(routes[0].id, 'a');
  assert.deepEqual(rankRoutes([
    {id:'x', path:'degrees', label:'X', courseAvailability:{estimatedProviderCourseFamilies:2, codedCourseRecords:100}},
    {id:'y', path:'degrees', label:'Y', courseAvailability:{estimatedProviderCourseFamilies:20, codedCourseRecords:1}},
  ]).map(r=>r.id), ['y','x']);
});
