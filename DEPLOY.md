# Deploying Stable Future to Vercel

## Prerequisites

- [Vercel CLI](https://vercel.com/docs/cli): `npm i -g vercel`
- A Vercel account linked to your GitHub
- Real values for the keys marked **REQUIRED** below

## Keys required before first production deploy

| Key | Where to get it | Notes |
|-----|-----------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | Already in `.env.local` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API | Already in `.env.local` |
| `SUPABASE_SECRET_KEY` | Supabase → Project Settings → API | Already in `.env.local` — **never expose client-side** |
| `GEMINI_API_KEY` | console.cloud.google.com | Already in `.env.local` |
| `STRIPE_SECRET_KEY` | dashboard.stripe.com → Developers → API keys | **REQUIRED** — replace `sk_test_PLACEHOLDER` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | dashboard.stripe.com → Developers → API keys | **REQUIRED** — replace `pk_test_PLACEHOLDER` |
| `NEXT_PUBLIC_POSTHOG_KEY` | app.posthog.com → Project Settings | Optional — app is a no-op if still `PLACEHOLDER` |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://app.posthog.com` | Default is fine |
| `NEXT_PUBLIC_SITE_URL` | Your production domain (e.g. `https://stablefuture.co.uk`) | Used for Stripe redirect URLs |

## Step-by-step deploy

```bash
# 1. Log in to Vercel
vercel login

# 2. Link this project (run from /Users/ben/build/stable-future)
cd /Users/ben/build/stable-future
vercel link

# 3. Add each env var (repeat for all keys above)
vercel env add STRIPE_SECRET_KEY production
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
vercel env add NEXT_PUBLIC_POSTHOG_KEY production
vercel env add NEXT_PUBLIC_SITE_URL production
# Supabase + Gemini keys already exist — add them the same way if not pulled automatically

# 4. Deploy to production
vercel --prod
```

## Supabase — run the migration

Before the guide page will save leads, run the migration against your Supabase project:

```bash
# Option A: Supabase CLI
npx supabase db push

# Option B: Supabase dashboard SQL editor
# Paste the contents of supabase/migrations/20260510_create_leads.sql
```

## Stripe smoke test

After deploy, visit `/pricing` and click any tier button.
Use Stripe test card `4242 4242 4242 4242`, any future expiry, any CVC.
Confirm redirect to `/success`. Check the Stripe dashboard for the test payment.

Replace smoke-test amounts (1p/2p/3p) in `app/pricing/page.tsx` with real prices before going live.

## Custom domain

In the Vercel dashboard: Settings → Domains → Add Domain.
Update `NEXT_PUBLIC_SITE_URL` env var to match.
