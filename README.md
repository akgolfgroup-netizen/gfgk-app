# gfgk-app

AK Golf Group — mobile-first PWA built with Next.js 15, TypeScript, Tailwind, and Supabase.

## Setup

```bash
pnpm install
cp .env.local.example .env.local   # fill in Supabase URL + anon key
pnpm dev
```

## Scripts

| Command          | What it does                              |
| ---------------- | ----------------------------------------- |
| `pnpm dev`       | Next dev server on :3000                  |
| `pnpm build`     | Production build                          |
| `pnpm lint`      | ESLint                                    |
| `pnpm typecheck` | `tsc --noEmit`                            |
| `pnpm db:types`  | Regenerate `src/types/database.ts`        |

See `CLAUDE.md` for architecture and conventions.
