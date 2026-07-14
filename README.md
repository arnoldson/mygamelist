A website to keep track of the games you play inspired by My Anime List.

## Database & Environment Setup

This project uses PostgreSQL via Prisma. Local development and production use separate databases:

- **Local dev**: Postgres running in Docker (see `db:setup`/`db:teardown` scripts below)
- **Production**: Supabase Postgres, connected via Vercel environment variables

### `DATABASE_URL` vs `DIRECT_URL`

Prisma uses two connection strings, set in `.env` (local) and Vercel (production):

- **`DATABASE_URL`** — used by the app at runtime for normal queries. In production this points to Supabase's **transaction pooler** (port 6543), which handles many short-lived serverless connections efficiently.
- **`DIRECT_URL`** — used only by Prisma's CLI (`db push`, `migrate dev`, `migrate deploy`) for schema operations. In production this points to Supabase's **session pooler** (port 5432), since the transaction pooler doesn't support all operations schema commands need.

Locally, both point to the same local Postgres instance (no pooler needed).

### Schema change workflow

1. Edit `prisma/schema.prisma` locally.
2. Run `npm run db:push` to apply the change to your local database and verify it works.
3. Commit and push your code changes as usual.
4. Update production schema by running `npm run db:push:prod` (prompts for confirmation before running against Supabase), or reference the connection strings directly in Supabase's dashboard if preferred.
5. Vercel auto-deploys on push to `main`; no manual `.env` swapping is required — local and production connection strings are fully separate and permanent in their respective environments.

### Local dev commands

```bash
npm run db:setup      # Start local Postgres via Docker
npm run db:push       # Push current schema to local Postgres
npm run db:seed       # Seed local database
npm run db:teardown   # Stop and remove local Postgres container
```
