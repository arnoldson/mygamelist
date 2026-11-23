# MyGameList

**Keep track of the games you play. Inspired by MyAnimeList.**

[**Live app → mygamelist.app**](https://www.mygamelist.app)

<!-- EDIT: add a 10–20 s GIF (search → add to list → change status) and 2–3 screenshots in /docs, then uncomment:
![MyGameList: searching for a game and adding it to a list](docs/demo.gif)
-->

| | |
|---|---|
| **Stack** | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Auth.js v5 · Prisma · PostgreSQL (Supabase) · Resend · Playwright · Vercel |
| **Game data** | [RAWG Video Games Database API](https://rawg.io/apidocs) |

## Features

- Search a catalog of games
- Track each game with a status (*Playing · Plan to play · Completed · On hold · Dropped*), a 1–10 rating, a review, hours played, and start/completion dates
- Public profile and game list for each user (`/profile/<username>`, `/gameslist/<username>`)
- Email + password accounts, including a forgot-password flow sent by email
- Responsive on phones and desktop, checked by automated tests

## Engineering notes

### Password reset that doesn't leak anything

- The reset link carries a random 32-byte token. Only its **SHA-256 hash** is stored, so a database leak doesn't give anyone working reset links.
- Tokens expire after 1 hour, and requesting a new one **invalidates any earlier tokens**.
- The form always returns the same message ("If an account exists…"), so it **can't be used to find out which emails are registered**.

### Two session bugs and the fixes

- **Production login always looked logged out.** Middleware calls `getToken()`, which has to guess whether the session cookie has the `__Secure-` prefix used over HTTPS. Behind Vercel's proxy, the request Next.js sees doesn't reliably report the original protocol, so it looked for the wrong cookie. The fix sets `secureCookie` explicitly in production.
- **Search page showed "Sign in to add" right after logging in.** Login runs as a server action with a client-side redirect, and `SessionProvider` kept the empty session it had cached on `/login`. The fix: the root layout reads the session on the server and passes it to `SessionProvider`, keyed on the user ID so the provider remounts when the user signs in or out. A Playwright regression test logs in, navigates without a full page reload (it plants a marker that a reload would wipe), and checks that the add-to-list controls appear.

### `DATABASE_URL` vs `DIRECT_URL`

Prisma uses two connection strings, set in `.env` locally and in Vercel for production:

- **`DATABASE_URL`** is used by the app at runtime. In production it points to Supabase's **transaction pooler** (port 6543), which handles many short-lived serverless connections efficiently.
- **`DIRECT_URL`** is used only by Prisma's CLI (`db push`, `migrate dev`, `migrate deploy`). In production it points to Supabase's **session pooler** (port 5432), because the transaction pooler doesn't support everything schema commands need.

Locally, both point to the same Postgres in Docker.

### Tests that don't depend on someone else's API

Browser tests intercept calls to `/api/games/search` and serve a fixture response, so they don't depend on the RAWG API's quota or uptime. (One API-level test still calls RAWG through the route, so `RAWG_API_KEY` must be set.) Playwright suites cover:

- login and registration
- search
- the session regression above
- responsive layout: no horizontal scrolling at several viewport sizes, minimum touch-target sizes, and no hover-only controls on mobile

Tests run against a separate Postgres database in Docker.

### Keeping a free-tier database awake

Supabase pauses free projects it considers inactive. A scheduled GitHub Action does a real write and delete on a dedicated table every 2 days. A plain `SELECT 1` turned out not to count as activity.

## Running locally

Requirements: Node 20+, Docker.

```bash
npm install
cp .env.example .env      # then fill in the variables below
npm run db:setup          # start local Postgres in Docker
npm run db:push           # push the Prisma schema
npm run db:seed           # seed a test user and data
npm run dev
```

```bash
npm test                  # spins up a test DB, runs Playwright, tears it down
npm run db:teardown       # stop and remove the local Postgres container
```

| Variable | Purpose |
|---|---|
| `DATABASE_URL` / `DIRECT_URL` | Runtime and CLI connection strings (see above) |
| `NEXTAUTH_SECRET` | Signs session tokens |
| `NEXTAUTH_URL` | Base URL of the app for Auth.js (e.g. `http://localhost:3000`) |
| `RAWG_API_KEY` | Game data |
| `RESEND_API_KEY` | Password reset emails |
| `NEXT_PUBLIC_APP_URL` | Base URL used in reset links |

### Schema change workflow

1. Edit `prisma/schema.prisma`.
2. `npm run db:push` to apply it locally and check it works.
3. Commit and push. Vercel deploys `main` automatically.
4. `npm run db:push:prod` applies the schema to production Supabase. It asks for confirmation first.

## Roadmap

- [ ] Move game data from RAWG to IGDB
- [ ] Run Playwright in CI on every push and pull request
