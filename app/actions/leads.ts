"use server";

import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export type LeadResult =
  | { ok: true }
  | { ok: false; error: string };

export async function submitApplication(
  _prevState: LeadResult | null,
  formData: FormData
): Promise<LeadResult> {
  const email = (formData.get("email") as string | null)?.trim().toLowerCase();
  const name = (formData.get("name") as string | null)?.trim() || null;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  let answers: unknown = null;
  const raw = formData.get("answers") as string | null;
  if (raw) {
    try {
      answers = JSON.parse(raw);
    } catch {
      answers = null;
    }
  }

  const supabase = getSupabase();
  if (!supabase) {
    console.error("Supabase not configured: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY are missing.");
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  const { error } = await supabase.from("leads").upsert(
    { email, name, answers, source: "apply" },
    { onConflict: "email,source" }
  );

  if (error) {
    console.error("Supabase application insert error:", error.message);
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  return { ok: true };
}
