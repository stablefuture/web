import type { Job } from './model';
import { degreeTitle } from '../lib/titleCase.mjs';

export const compactSalary = (value: number | null | undefined) => value == null ? 'Not available' : `£${Math.round(value / 1000)}k`;
export const routeTitle = (label: string, path?: Job['path']) => path === 'degrees'
  ? degreeTitle(label)
  : label ? label[0].toUpperCase() + label.slice(1) : label;
export const routeCount = (route: Job) => route.path === 'degrees' ? route.courseAvailability?.estimatedProviderCourseFamilies : route.starts;
export function rankRoutes(routes: Job[]) {
  return [...routes].sort((a, b) => (routeCount(b) ?? -1) - (routeCount(a) ?? -1) || a.label.localeCompare(b.label) || a.id.localeCompare(b.id));
}
