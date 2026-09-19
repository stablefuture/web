const LOWERCASE_WORDS = new Set([
  "a", "an", "and", "as", "at", "by", "for", "from", "in", "of", "on", "or", "the", "to", "with",
]);

function capitalise(part) {
  if (/^[A-Z0-9]{2,}$/.test(part)) return part;
  return part ? part[0].toUpperCase() + part.slice(1) : part;
}

/** Title-case a standard degree-subject name without damaging acronyms. */
export function degreeTitle(label) {
  const words = label.trim().split(/\s+/);
  return words.map((word, index) => {
    const lower = word.toLowerCase();
    if (index > 0 && index < words.length - 1 && LOWERCASE_WORDS.has(lower)) return lower;
    return word.split(/([\-/])/).map(part => part === "-" || part === "/" ? part : capitalise(part)).join("");
  }).join(" ");
}
