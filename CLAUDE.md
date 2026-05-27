# Stable Future — web

Next.js 16 (App Router) · Tailwind v4 · Supabase. Deployed on Vercel (team:
`stablefuture`). **Pushes to `main` auto-deploy to production** at
stablefuture.uk (Cloudflare DNS, DNS-only). Live since 2026-05-27.

## Workflow
- **Always branch before merging to `main`.** Create a feature branch, push it
  (Vercel builds a private Preview), open a PR, review, then merge. Don't commit
  straight to `main` from an interactive session.
- `git pull` before starting — the night-shift agent may have pushed overnight.
- Secrets live in `.env.local` (gitignored); prod env vars are set in Vercel.
- Dev server: `npm run dev` (port 3000). Verify with the preview tools.

## Layout
- `app/page.tsx` — landing page. `app/apply/` — application/lead form.
- `app/actions/leads.ts` — server action; upserts to Supabase `leads`
  (unique on `email,source`; uses `name` + `answers` columns).
- `app/config.ts` — runtime flags (`VSL_URL`, `BOOKING_URL`, scarcity). Empty
  values degrade gracefully — don't hardcode.
- `app/components/` — `Button`, `Container`, `Section`. Reuse these.
- `app/icon.png` — favicon (inverted brand mark). `app/globals.css` — Tailwind
  `@theme` tokens (purple brand ramp).
- Brand spec (colour / type / voice): `../agents/design/brand.md`.

## Gotchas
- Vercel Deployment Protection gates the `*.vercel.app` URLs (HTTP 401); the
  custom domain stablefuture.uk is public.
- Tab title must stay exactly **"Stable Future"** (no subtitle).
