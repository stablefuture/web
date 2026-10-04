const KIT_BASE = "https://api.kit.com/v4";

// Upserts the subscriber, then records the signup against the selected form.
// Existing callers request active subscriptions. Kit controls form automations.
// Returns false on failure without logging addresses or provider response bodies.
export async function subscribeViaKit(
  email: string,
  formId: string | undefined,
  firstName?: string
): Promise<boolean> {
  // trim: a whitespace-only env value is truthy and would 404 the form-add.
  const apiKey = process.env.KIT_API_KEY?.trim();
  const form = formId?.trim();
  if (!apiKey || !form) {
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
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({
        email_address: email,
        state: "active",
        ...(firstName ? { first_name: firstName } : {}),
      }),
    });
    if (!created.ok) {
      console.error(
        "Kit create subscriber failed:",
        created.status
      );
      return false;
    }

    // 2. Attach to the form; its configured automations may send follow-up emails.
    const attached = await fetch(`${KIT_BASE}/forms/${form}/subscribers`, {
      method: "POST",
      headers,
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({ email_address: email }),
    });
    if (!attached.ok) {
      console.error(
        "Kit add-to-form failed:",
        attached.status
      );
      return false;
    }
  } catch {
    console.error("Kit subscription request failed.");
    return false;
  }

  return true;
}
