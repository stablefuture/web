# Stable Future website

Next.js application. Main routes include `/`, `/checker`, `/pathfinder` and `/destinations`. `/assessment` redirects to `/pathfinder` for compatibility. Check `app/` for the full current route list.

## Local preview

From this directory, install dependencies with `npm ci` when needed, then run `npm run dev`. Open the local address printed by the server. Reuse an existing server before starting another.

## Checks

- `npm run build` checks the production build.
- `npm run lint` runs ESLint.
- Check changed layouts in a browser at mobile and desktop widths.

## Data and services

The checker loads `public/v3.json`; graduate destinations load files in `public/destinations/`. The sibling `jobs/` repository holds the pipelines. Its `run_all.sh` is not a full website rebuild.

The outreach server action uses OpenRouter; the calendar webhook uses Kit. Check the source files for required environment variable names. Keep local secrets in ignored environment files and out of Git and chat.

Existing deployment notes identify Vercel with automatic deployment from `main`. Verify the connection before deployment. Committing locally does not require pushing.

Shared current context: `../docs/PROJECT-CONTEXT.md`. The `archive/` folder holds previous designs.

## Pathfinder preview

`/pathfinder` now uses the fresh interface in `app/pathfinder/`. The older assessment components remain in place as prior work; they are not the design source for this interface. All normal users take the questions. In development, **Dev tools** lets you jump to a section or load a fictional sample.

The preview uses the existing `assessment-careers.json`, `assessment-direct-interests.json`, and occupation/apprenticeship detail files. No SSC scores are generated. `node scripts/build-pathfinder-evidence.mjs` publishes the existing reviewed degree relation labels from the neighbouring jobs repo; rerun it when the reviewed route release changes.

Answers stay in memory unless the user explicitly saves on this device. That browser copy includes their answers and plan. The user can remove it from the plan view. Printing provides a simple take-away plan; cloud accounts and emailed reports are not connected.

Checks: `node --test app/pathfinder/logic.test.mjs app/assessment/model.test.mjs app/assessment/direct-routes.test.mjs app/assessment/presentation.test.mjs`, `npx eslint app/pathfinder scripts/build-pathfinder-evidence.mjs`, and `npm run build`. Current data gaps and product limits are recorded in `../docs/pathfinder-master.md`.

### September 27 quiz update

The revised journey adds illustrated section intros, all 41 tick/cross interest decisions and 10-point allocation, eight skill-confidence scenarios, and ten five-choice work preferences. `journey.ts` keeps confidence separate from ability and ranking; preferences produce bounded ranking adjustments and visible conflicts. `QuizSections.tsx` handles the new sections. `CourseEvidence.tsx` reuses the existing Discover Uni CAH3 course files, preserving measure scope.

Run `python3 scripts/build-pathfinder-profile.py` to rebuild the O*NET 30.0 profile evidence from the local raw files, including `Skills.txt`. This performs no AI task scoring. Include `app/pathfinder/journey.test.mjs` in the test command above. The UI saves the new fields only when the user chooses Save.

### Local profile testing and synthetic audit

Open `/pathfinder/testing` in development to load three complete fictional profiles: Tom (practical), Sofia (creative), and Caleb (science). Each load resets the in-page answers, results, and plan. The test page cannot overwrite or remove a saved student draft. It returns 404 in a production build. A link also appears in Pathfinder's Dev tools.

The 50 synthetic cases live in `app/pathfinder/testing/profiles-{a,b}.json`. Luna agents generated them at high reasoning; Sol agents reviewed their outputs. Run `node scripts/audit-pathfinder.mjs` to validate the fixtures and reproduce all three top-ten lists and score diagnostics. The runner and UI both call `app/pathfinder/recommendations.mjs`; this extraction preserves the prior ranking. Reports and initial-run history are in `../docs/research/pathfinder-profile-audit/`. Add `app/pathfinder/recommendations.test.mjs` to verification. Synthetic cases expose faults but do not measure usefulness for real students.
