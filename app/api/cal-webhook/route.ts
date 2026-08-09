import { createHmac, timingSafeEqual } from "crypto";
import { subscribeViaKit } from "@/app/lib/kit";

export const runtime = "nodejs";

// Cal.com fires this on BOOKING_CREATED. We verify the signature, then add the
// attendee to the Kit "calls" list. Consent basis: PECR soft opt-in — they're
// booking a sales call and the booking page carries the opt-out notice.
export async function POST(req: Request) {
  // trim: a stray newline pasted into the env value silently breaks the HMAC.
  const secret = process.env.CAL_WEBHOOK_SECRET?.trim();
  if (!secret) {
    console.error("Cal webhook not configured: CAL_WEBHOOK_SECRET missing.");
    return new Response("Not configured", { status: 500 });
  }

  const raw = await req.text();
  const signature = req.headers.get("x-cal-signature-256") ?? "";
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  if (
    signature.length !== expected.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    return new Response("Invalid signature", { status: 401 });
  }

  let email: string | undefined;
  let firstName: string | undefined;
  try {
    const body = JSON.parse(raw);
    if (body.triggerEvent !== "BOOKING_CREATED") {
      return new Response("Ignored", { status: 200 });
    }
    const attendee = body.payload?.attendees?.[0];
    email = attendee?.email?.trim().toLowerCase();
    firstName = attendee?.name?.trim().split(" ")[0];
  } catch (err) {
    console.error("Cal webhook parse error:", err);
    return new Response("Bad payload", { status: 400 });
  }

  if (!email) {
    return new Response("No attendee email", { status: 200 });
  }

  const ok = await subscribeViaKit(
    email,
    process.env.KIT_BOOKINGS_FORM_ID,
    firstName
  );
  return new Response(ok ? "OK" : "Kit error", { status: ok ? 200 : 502 });
}
