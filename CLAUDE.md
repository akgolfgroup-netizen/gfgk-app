# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript (strict)
- Tailwind CSS for styling
- Auth.js v5 (`next-auth@beta`) with the Credentials provider (e-post + passord)
- Neon serverless Postgres via Drizzle ORM
- `bcryptjs` for password hashing
- Target: mobile-first installable PWA

## Commands

| Command            | What it does                                              |
| ------------------ | --------------------------------------------------------- |
| `pnpm dev`         | Next.js dev server on :3000                               |
| `pnpm build`       | Production build                                          |
| `pnpm lint`        | ESLint (`next/core-web-vitals` + `next/typescript`)       |
| `pnpm typecheck`   | `tsc --noEmit`                                            |
| `pnpm db:generate` | Generate SQL migration from `src/db/schema.ts`            |
| `pnpm db:migrate`  | Apply pending migrations from `drizzle/`                  |
| `pnpm db:push`     | Push schema directly to DB (dev only, skips migrations)   |
| `pnpm db:studio`   | Open Drizzle Studio against the configured DB             |

## Architecture

- **App Router** lives under `src/app`. Server Components are the default; mark client islands with `'use client'`.
- **Auth.js config** is split:
  - `src/auth.config.ts` — Edge-safe (no DB, no `bcryptjs`). Used by `proxy.ts`.
  - `src/auth.ts` — Full config with Credentials provider, DB lookup, bcrypt compare. Used by server components and route handlers.
  - `src/app/api/auth/[...nextauth]/route.ts` — Re-exports `handlers` so the Auth.js endpoints exist.
- **Proxy (formerly middleware)** in `src/proxy.ts` runs Auth.js's `authorized` callback on every matched request. It redirects unauthenticated users to `/login` and gates `/admin` to `role === 'admin'`. Next.js 16 renamed `middleware.ts` → `proxy.ts`.
- **Drizzle client** lives in `src/db/index.ts` and is exposed via `getDb()` (lazy — keeps `next build` happy when `DATABASE_URL` is unset). Never instantiate `drizzle()` outside `src/db/index.ts`. Schema lives in `src/db/schema.ts`.
- **Session shape** is augmented in `src/types/next-auth.d.ts` to include `id` and `role` on `session.user` and the JWT.
- **Mobile-first PWA**: viewport ≤640px is the design target. `BottomNav` is the primary nav surface. Use the `pt-safe` / `pb-safe` utilities in `globals.css` for notch and home-indicator padding.

## Roles

Two roles in M1: `admin` and `ansatt`. Admin users see the `/admin` panel; ansatte are limited to `/dashboard`. The role lives in the JWT and in `users.role` (Postgres enum `user_role`).

## Conventions

- Strict TS. No `any`, no `@ts-ignore`. Use `unknown` + narrowing.
- No barrel `index.ts` re-exports. Import directly from the source file.
- Only add a folder when ≥2 files justify it. Flat beats nested.
- Server Components by default; reach for `'use client'` only when you need state, effects, or browser-only APIs.
- Comments explain WHY, not WHAT. If a comment restates the code, delete it.
- No global state library, no UI kit, no form library — add them when there's concrete demand, not before.
- Norwegian UI strings, English code and identifiers.

## Environment

`.env.local` needs:

- `DATABASE_URL` — Neon Postgres connection string
- `AUTH_SECRET` — `openssl rand -base64 32`

See `.env.local.example`.

## Creating the first admin user

Until M2 ships an invite flow, seed the first admin via SQL:

```sql
INSERT INTO users (email, password_hash, name, role)
VALUES (
  'admin@example.com',
  -- bcryptjs hash of the chosen password, cost 10
  '$2b$10$...',
  'Daglig leder',
  'admin'
);
```

Generate the hash with `node -e "import('bcryptjs').then(b => b.hash('PASSWORD', 10).then(console.log))"`.
