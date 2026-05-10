"use server";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export type LeadResult =
  | { ok: true }
  | { ok: false; error: string };

export async function captureEmail(_prevState: LeadResult | null, formData: FormData): Promise<LeadResult> {
  const email = (formData.get("email") as string | null)?.trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  const { error } = await supabase.from("leads").upsert(
    { email, source: "guide" },
    { onConflict: "email,source", ignoreDuplicates: true }
  );

  if (error) {
    console.error("Supabase leads insert error:", error.message);
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  return { ok: true };
}
