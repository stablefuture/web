const KIT_BASE = "https://api.kit.com/v4";

// Upserts the subscriber, then attaches them to the given form.
// state "active" = single opt-in, no confirmation email. Call bookers are
// covered by the PECR soft opt-in (reg 22(3)), and a "confirm your
// subscription" email after booking a call only sheds leads. This overrides the
// form's own double opt-in setting; the hosted newsletter form is unaffected.
// Returns true on success. Never throws.
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
      body: JSON.stringify({
        email_address: email,
        state: "active",
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
    const attached = await fetch(`${KIT_BASE}/forms/${form}/subscribers`, {
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
