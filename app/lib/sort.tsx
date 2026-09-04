"use client";

// Column sorting shared by the checker and the graduate destinations lists.
// A header click cycles default → descending → ascending → default, so the
// builder's own order (most openings first, biggest share first) is always one
// more click away.
export type Sort<K extends string> = { key: K; dir: "desc" | "asc" } | null;

export function nextSort<K extends string>(s: Sort<K>, k: K): Sort<K> {
  if (!s || s.key !== k) return { key: k, dir: "desc" };
  return s.dir === "desc" ? { key: k, dir: "asc" } : null;
}

// Missing figures sit last whichever way the column runs.
export function sortRows<T, K extends string>(
  rows: T[],
  s: Sort<K>,
  get: (row: T, k: K) => number | null | undefined,
): T[] {
  if (!s) return rows;
  const sign = s.dir === "desc" ? -1 : 1;
  return [...rows].sort((a, b) => {
    const x = get(a, s.key);
    const y = get(b, s.key);
    if (x == null) return y == null ? 0 : 1;
    if (y == null) return -1;
    return sign * (x - y);
  });
}

// The arrow sits on the outer side of the label so the label's inner edge
// stays flush with the figures under it whichever way the column is aligned.
export function SortButton<K extends string>({
  k, label, sort, onSort, align = "left", className = "",
}: {
  k: K;
  label: string;
  sort: Sort<K>;
  onSort: (s: Sort<K>) => void;
  align?: "left" | "right";
  className?: string;
}) {
  const on = sort?.key === k;
  const arrow = (
    <span aria-hidden className="inline-block w-3 text-center">
      {on ? (sort.dir === "desc" ? "▾" : "▴") : ""}
    </span>
  );
  return (
    <button
      type="button"
      onClick={() => onSort(nextSort(sort, k))}
      aria-label={`Sort by ${label.toLowerCase()}`}
      aria-pressed={on}
      className={`whitespace-nowrap text-[11px] font-semibold uppercase tracking-wider transition hover:text-ink ${
        on ? "text-ink" : "text-muted"
      } ${align === "right" ? "text-right" : "text-left"} ${className}`}
    >
      {align === "right" && arrow}
      {label}
      {align === "left" && arrow}
    </button>
  );
}
