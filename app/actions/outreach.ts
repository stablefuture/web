"use server";

// AI drafting for the outreach tool. Calls OpenRouter (DeepSeek by default) and
// returns a ready-to-send email + follow-up. The client keeps a local template
// as an instant fallback, so this failing never leaves the user with nothing.

export type OutreachInput = {
  goal: string;
  name: string;
  year: string;
  school: string;
  sector: string;
  org: string;
  person: string;
  reason: string;
  about: string;
  availability: string;
  email: string;
};

export type DraftResult =
  | { ok: true; subject: string; email: string; followUp: string }
  | { ok: false; error: string };

const MODEL = process.env.OPENROUTER_MODEL || "deepseek/deepseek-v4-flash";

const GOAL_LONG: Record<string, string> = {
  work_experience: "a short work experience placement",
  insight_day: "an insight day or the chance to shadow someone",
  weekend_job: "a weekend or holiday job",
  apprenticeship: "a conversation about apprenticeship routes",
  volunteering: "a volunteering opportunity",
};

const SYSTEM = `You help a UK secondary-school student (school years 10-13, ages 14-18) write a short outreach email to a real organisation to secure work experience, an insight/shadow day, a weekend or holiday job, an apprenticeship conversation, or volunteering.

Write in the student's own voice: warm, genuine and polite, like a bright 15-17 year old — never corporate, no buzzwords, no clichés like "I am writing to express my keen interest", no exaggeration. British English and spelling. Keep the email tight: about 110-150 words. Lead with the specific, honest reason they are contacting this place, using what they tell you. Make one clear, low-pressure ask, and offer to fit around the recipient. Never use placeholders or square brackets — if a detail is missing, write naturally around it. Sign off with their name (and email if given).

Also write a brief follow-up note (40-70 words) they can send once, about a week later, if they hear nothing: friendly, no guilt-tripping.

Return ONLY a JSON object, with no code fences and no extra text, in exactly this shape:
{"subject": "...", "email": "...", "followUp": "..."}
Keep the subject short and specific. Use \\n for line breaks inside "email" and "followUp".`;

function userMessage(f: OutreachInput): string {
  const lines = [
    `Goal: ${GOAL_LONG[f.goal] ?? "work experience"}`,
    f.name && `Student's name: ${f.name}`,
    f.year && `School year: Year ${f.year}`,
    f.school && `School: ${f.school}`,
    f.sector && `Field of interest: ${f.sector}`,
    f.org && `Organisation being contacted: ${f.org}`,
    f.person && `Named contact: ${f.person}`,
    f.reason && `Why this place (their personal reason): ${f.reason}`,
    f.about && `Relevant thing about the student: ${f.about}`,
    f.availability && `Availability: ${f.availability}`,
    f.email && `Student's email for the sign-off: ${f.email}`,
  ].filter(Boolean);
  return lines.join("\n");
}

function parseDraft(raw: string): { subject: string; email: string; followUp: string } | null {
  if (!raw) return null;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  try {
    const o = JSON.parse(raw.slice(start, end + 1));
    const subject = typeof o.subject === "string" ? o.subject.trim() : "";
    const email = typeof o.email === "string" ? o.email.trim() : "";
    const followUp = typeof o.followUp === "string" ? o.followUp.trim() : "";
    return email ? { subject, email, followUp } : null;
  } catch {
    return null;
  }
}

export async function draftOutreach(input: OutreachInput): Promise<DraftResult> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return { ok: false, error: "AI drafting isn't configured yet." };

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "X-Title": "Stable Future Outreach",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.7,
        max_tokens: 700,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userMessage(input) },
        ],
      }),
    });

    if (!res.ok) {
      console.error("OpenRouter error:", res.status, (await res.text()).slice(0, 300));
      return { ok: false, error: "The AI writer is busy right now. Please try again." };
    }

    const data = await res.json();
    const draft = parseDraft(data?.choices?.[0]?.message?.content ?? "");
    if (!draft) return { ok: false, error: "Couldn't read the AI response. Please try again." };
    return { ok: true, ...draft };
  } catch (e) {
    console.error("draftOutreach error:", e);
    return { ok: false, error: "Something went wrong reaching the AI writer." };
  }
}
