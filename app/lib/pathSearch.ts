// Shared with the live checker: title matches first, then alternative names.
const words = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).map((w) => w.replace(/s$/, ""));
export function searchMatches<T>(items: T[], query: string, title: (item: T) => string, aliases: (item: T) => string[]) {
  const tokens = words(query);
  if (!tokens.length) return items.map((item) => ({ item, via: null as string | null }));
  const full = tokens.join(" ");
  const score = (label: string) => {
    const parts = words(label), text = parts.join(" ");
    return text === full ? 3 : text.startsWith(full) ? 2 : tokens.every((t) => parts.some((w) => w.startsWith(t))) ? 1 : 0;
  };
  return items.map((item, index) => {
    const own = score(title(item));
    const via = own ? null : aliases(item).find((a) => score(a) > 0) ?? null;
    return { item, via, rank: own || (via ? .5 : 0), index };
  }).filter((hit) => hit.rank > 0).sort((a, b) => b.rank - a.rank || a.index - b.index);
}
