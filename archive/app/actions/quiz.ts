"use server";

import { scoreInputs } from "@/lib/scoring/engine";
import type { Direction, Verdict, QuizInput } from "@/lib/scoring/types";

export type QuizResult =
  | { ok: true; verdict: Verdict; quizId: string }
  | { ok: false; error: string };

const VALID_DIRECTIONS: Direction[] = [
  "uni",
  "apprenticeship",
  "leaving_for_work",
  "undecided",
  "other",
];

export async function submitQuiz(
  _prev: QuizResult | null,
  formData: FormData
): Promise<QuizResult> {
  try {
    const get = (k: string) =>
      ((formData.get(k) as string | null) ?? "").trim();

    const quizId = get("quizId");
    const direction = get("direction") as Direction;
    const sector = get("sector");
    const job = get("job");
    const sectorOther = get("sectorOther");
    const jobOther = get("jobOther");

    if (!VALID_DIRECTIONS.includes(direction)) {
      return { ok: false, error: "Please select an option for direction." };
    }
    if (!quizId) {
      return { ok: false, error: "Session expired. Please reload and try again." };
    }

    const input: QuizInput = {
      direction,
      sector,
      job,
      sectorOther: sectorOther || undefined,
      jobOther: jobOther || undefined,
    };

    // Persistence (Supabase) comes in step 2 of the build sequence.
    // For now we just score and return.
    const verdict = scoreInputs(input);
    return { ok: true, verdict, quizId };
  } catch (e) {
    console.error("submitQuiz error:", e);
    return {
      ok: false,
      error: "Something went wrong scoring your answers. Please try again.",
    };
  }
}
