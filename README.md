# Stable Future website

Next.js app for stablefuture.uk. Current offer: [`../docs/product/offer.md`](../docs/product/offer.md). Shared context: [`../docs/PROJECT-CONTEXT.md`](../docs/PROJECT-CONTEXT.md).

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/pathfinder` | Pathfinder: career questions, results, shortlist and A/B/Z plan. Spec: [`../docs/product/pathfinder-ux-spec.md`](../docs/product/pathfinder-ux-spec.md) |
| `/ai-career-check` | Free report emailed to a visitor. See `app/ai-career-check/README.md` |
| `/checker`, `/destinations` | Earlier free tools. Check whether they still earn their place |
| `/about`, `/talk` | About page; talk follow-up form |
| `/hecos` | Unlisted degree-subject browser (research) |
| `/mapping-review`, `/pathfinder/testing`, `/ai-career-check/testing` | Development only. Return 404 in production |
| `/email`, `/call` | Temporary redirects to Kit and the booking page. `/assessment` redirects to `/pathfinder` |

`app/assessment/` holds the shared scoring model (`model.ts`, `presentation.ts`) that Pathfinder imports. Its old interface was removed on 4 October 2026.

## Run and check

```bash
npm ci            # when needed
npm run dev       # reuse a running server first
npm run build
npm run lint
node --test app/pathfinder/*.test.mjs app/assessment/*.test.mjs
```

Check changed layouts at mobile and desktop widths.

## Data and services

- Public data in `public/` comes from the pipelines in the sibling `jobs/` repository. `jobs/pipeline/run_all.sh` does not rebuild this site.
- Rebuild Pathfinder evidence with `node scripts/build-pathfinder-evidence.mjs` (reads reviewed degree links from `jobs/`) and `python3 scripts/build-pathfinder-profile.py` (O\*NET 30.0 profile evidence from local raw files; no AI scoring).
- `node scripts/audit-pathfinder.mjs` reruns the 50 synthetic profiles in `app/pathfinder/testing/`. They expose faults; they do not measure usefulness for real students. Reports: `../docs/research/pathfinder-profile-audit/`.
- Email uses Resend; the booking webhook and signups use Kit; the outreach action uses OpenRouter. Read the source for variable names. Keep secrets in ignored `.env*` files, never in Git or chat.
- Pathfinder keeps answers in memory. A browser copy saves only when the user chooses Save. There are no accounts, payments or cloud saving.

## Deployment

Pushing `main` deploys to production through Vercel. Verify the connection first. A local commit does not deploy.
