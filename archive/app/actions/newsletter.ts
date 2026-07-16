"use server";

import { subscribeViaKit } from "@/app/lib/kit";

export type NewsletterResult =
  | { ok: true }
  | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Each signup source maps to its own Kit form so we can see where leads come
// from. Unknown/missing sources fall back to the main newsletter form.
const FORM_IDS: Record<string, string | undefined> = {
  newsletter: process.env.KIT_FORM_ID,
  list: process.env.KIT_LIST_FORM_ID,
};

export async function subscribeToNewsletter(
  _prevState: NewsletterResult | null,
  formData: FormData
): Promise<NewsletterResult> {
  const email = (formData.get("email") as string | null)?.trim().toLowerCase();

  if (!email || !EMAIL_RE.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  const source = (formData.get("source") as string | null) ?? "newsletter";
  const formId = FORM_IDS[source] ?? process.env.KIT_FORM_ID;

  const ok = await subscribeViaKit(email, formId);
  return ok
    ? { ok: true }
    : { ok: false, error: "Something went wrong. Please try again." };
}
