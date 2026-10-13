// Server-only: delete stored Pathfinder answers 10 years after submission, as the terms promise.
// Answers are stored under YYYY-MM-DD/ folders, so whole days are removed at once.
export const RETENTION_YEARS = 10;

export async function deleteExpiredAnswers({ supabaseUrl, supabaseKey, now = Date.now(), fetchImpl = fetch }) {
  const base = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object`;
  const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' };
  const list = async prefix => {
    const response = await fetchImpl(`${base}/list/pathfinder-responses`, { method: 'POST', headers, body: JSON.stringify({ prefix, limit: 1000 }) });
    if (!response.ok) throw new Error('Could not list stored answers.');
    return response.json();
  };
  const cutoff = new Date(now); cutoff.setUTCFullYear(cutoff.getUTCFullYear() - RETENTION_YEARS);
  const days = (await list('')).map(o => o.name).filter(name => /^\d{4}-\d\d-\d\d$/.test(name) && name < cutoff.toISOString().slice(0, 10));
  let deleted = 0;
  for (const day of days) {
    const prefixes = (await list(`${day}/`)).map(o => `${day}/${o.name}`);
    if (!prefixes.length) continue;
    const response = await fetchImpl(`${base}/pathfinder-responses`, { method: 'DELETE', headers, body: JSON.stringify({ prefixes }) });
    if (!response.ok) throw new Error('Could not delete stored answers.');
    deleted += prefixes.length;
  }
  return deleted;
}
