import {loadHecos, saveHecosReview} from "../hecos-data";
import {reviewError, type HumanReview} from "../hecos-model";

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") return new Response(null, {status:404});
  try {
    const origin = new URL(request.headers.get("origin") || "https://invalid");
    if (origin.host !== request.headers.get("host") || !["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname)) return Response.json({error:"Use the local review tool to save."}, {status:403});
    const body = await request.json();
    const {subjects, jobs} = await loadHecos();
    const error = reviewError(body, subjects.find(s => s.code === body?.code), new Set(jobs.map(j => j.code)));
    if (error) return Response.json({error}, {status:400});
    const review: HumanReview = {code:body.code, fingerprint:body.fingerprint, action:body.action,
      links:body.links.map((l: HumanReview["links"][number]) => ({onetCode:l.onetCode, relation:l.relation, conditions:l.conditions.trim()})),
      note:body.note.trim(), evidenceUrl:body.evidenceUrl.trim(), at:new Date().toISOString()};
    await saveHecosReview(review);
    return Response.json(review);
  } catch { return Response.json({error:"Could not save. Your review has not been confirmed."}, {status:500}); }
}
