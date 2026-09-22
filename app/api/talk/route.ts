import { NextResponse } from "next/server";

const RESEND_URL = "https://api.resend.com/emails";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Email service is not configured." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  if (!body || body.website) {
    return NextResponse.json({ ok: true });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";

  if (!EMAIL_PATTERN.test(email) || !message || message.length > 5000 || !subject || subject.length > 160) {
    return NextResponse.json({ error: "Please check the form." }, { status: 400 });
  }

  const response = await fetch(RESEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Stable Future website <talk@stablefuture.uk>",
      to: ["ben@stablefuture.uk"],
      reply_to: email,
      subject,
      text: `${message}\n\nReply to: ${email}`,
    }),
  });

  if (!response.ok) {
    console.error("Resend talk form failed", response.status, await response.text());
    return NextResponse.json({ error: "Email could not be sent." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
