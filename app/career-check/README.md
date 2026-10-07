# Future-Proof Career Check

`/career-check` (formerly `/ai-career-check`, which now redirects) lets a visitor choose one to three degrees, apprenticeships, or detailed jobs. It sends one report containing the selected paths. Real submissions join Kit’s magnet form (9682557) unless the visitor ticks the opt-out box (soft opt-in; the form sends `marketing: !optOut`), after Resend accepts the report. If they opt out, the email says we won’t email again. KIT_CAREER_FORM_ID can override this. A failed Kit signup returns a visible warning without asking the user to resend their report.

The client loads only `/lead-magnet/search.json`. `/api/career-results` looks up every ID in `data/lead-magnet/reports.json` on the server. Client-supplied scores, titles, and report contents have no effect.

## Email and preview

Uses `RESEND_API_KEY` and the existing verified sender `talk@stablefuture.uk`. Optional `CAREER_EMAIL_FROM` overrides the sender. The free-call link comes from `BOOKING_URL` in `app/config.ts`. Missing configuration or a rejected/failed provider call returns an error; success requires Resend's acceptance ID. Acceptance does not establish inbox delivery.

In development, `GET /api/career-results?id=ID&id=ID` previews the same HTML renderer without sending anything. Add `&format=text` for the plain text version. It returns 404 in production, so the public page offers no preview and a report arrives only by email.

The email includes every supported job's exposure score and route conditions. A course score describes only its linked jobs, not graduate outcomes. Broader group proxies lead with the actual example role; the classification is secondary and its members are not presented as destinations. Group-only routes do not borrow a detailed job's tasks. The exporter supplies the five most important available tasks; the renderer preserves that selection and the Yes/red, No/green labels.

The report closes with brief Plan A/B/Z guidance, one practical next step, and a free-call link.

## Checks

From `web/`:

- `node --test app/api/career-results/career-results.test.mjs`
- `npx eslint app/career-check app/api/career-results app/lib/career-email.mjs`
- `npm run build`

Tests mock Resend. Do not test with real recipients unless Ben explicitly asks.

## Abuse and operational limits

POST checks same-origin requests, input size, email, a honeypot, and 1–3 valid IDs; duplicate IDs send one copy of the report. A process-local cap permits five attempts per forwarded client IP per 15 minutes. It is a lightweight guard, not a distributed quota: instances restart and proxies must supply a trustworthy forwarded address. No recipient or key is logged by this code. No database stores addresses. Resend handles the requested delivery.

The outer email layout uses inline presentation tables with a 660px Outlook fallback and a fluid mobile width. Resend accepted a real send to a Gmail address on 4 Oct 2026; inbox placement is unconfirmed.

## Test together
In development (`npm run dev`), open `/career-check/testing`, select up to three paths, then choose **View results**. It opens the exact email renderer in another tab, without an address, POST, email, or Kit signup. Keep the selector open to change choices.
