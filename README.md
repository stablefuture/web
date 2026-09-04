# Stable Future website

Next.js application. Main routes include `/`, `/checker` and `/destinations`. Check `app/` for the full current route list.

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
