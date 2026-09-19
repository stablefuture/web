/** Exact route jobs open their UK occupation-group overview. */
export function overviewId(unit: { id: string; soc4?: string }) {
  return unit.soc4 ? `soc4:${unit.soc4}` : unit.id;
}
