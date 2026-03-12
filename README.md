# CBT League

CBT League is a static-first basketball league web app built with Next.js App Router and TypeScript.
It serves standings, schedules, team pages, player profiles, league leaders, and all-time records from JSON data, with an admin workflow for writing stat updates back to GitHub.

## What This Project Solves

- Replaces a legacy static site with a typed, maintainable codebase.
- Keeps public pages fast and deployable to GitHub Pages via static export.
- Preserves rich UI/animation while handling large stat tables and multi-season data.
- Supports admin stat entry with GitHub commit automation through a serverless endpoint.

## Core Features

- Multi-season league navigation (`Season 1`, `Season 2`, `Season 3`)
- Team profiles with roster + team-level metrics
- Player profiles with per-game box score logs
- League leaders and all-time records
- Admin stat-entry page with per-game draft publishing and queued local fallback on API failure
- Typed aggregation pipeline for PPG/RPG/APG/efficiency and shooting percentages

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript (strict mode)
- Tailwind CSS v4
- shadcn setup + Radix primitives + Lucide icons
- Framer Motion
- ESLint + Next.js type/build checks

## Architecture Notes

- Public site is statically generated (`next.config.ts` uses `output: "export"`).
- GitHub Pages compatibility is handled with production `basePath` and `trailingSlash`.
- Image optimization is disabled for static export compatibility (`images.unoptimized = true`).
- League data is loaded from JSON and processed through typed utilities in `src/lib/league-data.ts`.
- A summary generator script (`scripts/generate-league-summary.mjs`) precomputes compact season summaries.

## Repository Layout

```text
api/
  admin/update-stats.ts        # Vercel-compatible API: writes stats.json to GitHub
src/
  app/                         # Next.js App Router pages
  components/                  # UI + league components
  data/                        # Source league JSON data
  lib/                         # Typed data helpers and aggregation
  types/                       # Shared TypeScript domain types
scripts/
  generate-league-summary.mjs  # Data precompute utility
public/
  images/                      # Team logos and player headshots
```

## Local Development

```bash
npm install
npm run dev
```

Useful commands:

```bash
npm run lint
npm run build
npm run generate:summary
```

## Admin Stat Sync (GitHub Write-Back)

The admin page builds a local draft for a selected matchup, then posts the whole game to an API endpoint (`/api/admin/update-stats` by default). The endpoint:

1. Reads the current stats file from the GitHub repository.
2. Decodes and updates every drafted player log for that matchup in one request.
3. Rebuilds the compact league summary JSON.
4. Commits the game update back to GitHub in a single commit.

### Frontend env

- `NEXT_PUBLIC_ADMIN_API_URL` (optional)
  - Use this when your admin API is hosted on a different domain than the static site.
  - Example: `https://your-admin-api.vercel.app/api/admin/update-stats`

### API env (required for write-back)

- `GITHUB_TOKEN` (required)
- `GITHUB_REPO_OWNER` (required unless Vercel Git env is available)
- `GITHUB_REPO_NAME` (required unless Vercel Git env is available)

### API env (optional)

- `GITHUB_BRANCH` (defaults to `main`)
- `GITHUB_STATS_PATH` (stats file path override)
- `ADMIN_ALLOWED_ORIGIN` (CORS allowlist)
- `ADMIN_API_KEY` (shared bearer token for admin requests)

## Deployment Model

This repo uses a split deployment model:

- Static public site: GitHub Pages
- Admin write-back API: Vercel serverless function

That keeps the public app purely static while still allowing secure authenticated stats updates.

### Mobile Admin Flow

1. Open the public `/admin` page from your phone.
2. Paste your Vercel API URL into the `Admin API URL` field.
3. Enter your shared `Admin Key` if you configured `ADMIN_API_KEY` on Vercel.
4. Draft each player for the matchup, then tap `Publish Game`.
5. The Vercel API commits updated JSON back to GitHub in one game-level commit.
6. GitHub Pages rebuilds from `main` and publishes the updated public site.

## License

MIT (see `LICENSE`).
