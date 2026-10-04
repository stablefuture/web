import { loadQueue, saveDecision } from "../review-data";
import type { Decision } from "../review-model";

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") return new Response(null, {status: 404});
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || new URL(origin).host !== host || !["localhost", "127.0.0.1", "[::1]"].includes(new URL(origin).hostname)) {
    return Response.json({error: "Reviews can only be saved from the local viewer."}, {status: 403});
  }
  try {
    const body = await request.json();
    if (!["accept", "reject", "defer", "reset"].includes(body.action) || typeof body.note !== "string" || body.note.length > 4000) {
      return Response.json({error: "Invalid decision or note."}, {status: 400});
    }
    const row = (await loadQueue()).find(r => r.id === body.id);
    if (!row || row.fingerprint !== body.fingerprint) return Response.json({error: "The source has changed. Reload before reviewing."}, {status: 409});
    const decision: Decision = { id: row.id, fingerprint: row.fingerprint, action: body.action, note: body.note, at: new Date().toISOString() };
    await saveDecision(decision);
    return Response.json(decision);
  } catch { return Response.json({error: "Could not save the review. Your decision has not been confirmed."}, {status: 500}); }
}
