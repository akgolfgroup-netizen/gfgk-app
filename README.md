# gfgk-app

GFGK — mobile-first PWA built with Next.js 16, TypeScript, Tailwind, Auth.js, and Neon Postgres (via Drizzle).

## Setup

```bash
pnpm install
cp .env.local.example .env.local   # fill in DATABASE_URL + AUTH_SECRET
pnpm db:push                       # push schema to Neon (dev) — or use db:generate + db:migrate
pnpm dev
```

Create the first admin user manually — see "Creating the first admin user" in `CLAUDE.md`.

## Scripts

| Command            | What it does                                            |
| ------------------ | ------------------------------------------------------- |
| `pnpm dev`         | Next dev server on :3000                                |
| `pnpm build`       | Production build                                        |
| `pnpm lint`        | ESLint                                                  |
| `pnpm typecheck`   | `tsc --noEmit`                                          |
| `pnpm db:generate` | Generate migration SQL from `src/db/schema.ts`          |
| `pnpm db:migrate`  | Apply migrations to the DB                              |
| `pnpm db:push`     | Push schema directly (dev only)                         |
| `pnpm db:studio`   | Open Drizzle Studio                                     |

See `CLAUDE.md` for architecture and conventions.
