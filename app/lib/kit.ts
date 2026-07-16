const KIT_BASE = "https://api.kit.com/v4";

// Upserts the subscriber, then attaches them to the given form. When the form
// has double opt-in enabled, the form-add step triggers Kit's confirmation
// ("Incentive") email — so we deliberately do NOT pass state: "active", which
// would pre-confirm them and suppress the email. Returns true on success.
// Never throws.
export async function subscribeViaKit(
  email: string,
  formId: string | undefined,
  firstName?: string
): Promise<boolean> {
  const apiKey = process.env.KIT_API_KEY;
  if (!apiKey || !formId) {
    console.error("Kit not configured: KIT_API_KEY / form id missing.");
    return false;
  }

  const headers = {
    "Content-Type": "application/json",
    "X-Kit-Api-Key": apiKey,
  };

  try {
    // 1. Upsert the subscriber (required before add-to-form; 200 if they exist).
    const created = await fetch(`${KIT_BASE}/subscribers`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        email_address: email,
        ...(firstName ? { first_name: firstName } : {}),
      }),
    });
    if (!created.ok) {
      console.error(
        "Kit create subscriber failed:",
        created.status,
        await created.text()
      );
      return false;
    }

    // 2. Attach to the form — triggers the double opt-in confirmation email and
    //    records which source this lead came from.
    const attached = await fetch(`${KIT_BASE}/forms/${formId}/subscribers`, {
      method: "POST",
      headers,
      body: JSON.stringify({ email_address: email }),
    });
    if (!attached.ok) {
      console.error(
        "Kit add-to-form failed:",
        attached.status,
        await attached.text()
      );
      return false;
    }
  } catch (err) {
    console.error("Kit subscribe error:", err);
    return false;
  }

  return true;
}
