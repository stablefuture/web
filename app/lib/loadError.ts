// Why a client-side data fetch failed, in words a reader can repeat back.
// A timeout, a bad response and a dead connection need different fixes and
// otherwise look identical on screen, so the page says which one it was.
export function loadError(e: unknown): string {
  const err = e as { name?: string; message?: string } | null;
  if (err?.name === "AbortError") return "The download timed out.";
  const status = err?.message?.match(/\b(\d{3})\b/)?.[1];
  if (status) return `The server returned ${status}.`;
  return "The connection failed.";
}
