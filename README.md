# gfgk-app

GFGK — mobile-first PWA built with Next.js 16, TypeScript, Tailwind, Auth.js, and Neon Postgres (via Drizzle).

## Deploy via Vercel + Neon (anbefalt — null lokal infra)

1. Gå til https://vercel.com/new → velg `akgolfgroup-netizen/gfgk-app` → "Import".
2. På "Configure Project"-siden:
   - Framework Preset: **Next.js** (autodetekteres).
   - Klikk **"Add storage"** → **Neon Postgres** → opprett ny database. `DATABASE_URL` settes automatisk i miljøvariablene.
   - Klikk **"Environment Variables"** og legg til `AUTH_SECRET`. Generer verdien lokalt med:
     ```bash
     openssl rand -base64 32
     ```
     Bruk samme verdi i ditt lokale `.env.local` og i Vercel.
3. Klikk **"Deploy"**. Første deploy feiler fordi schemaet ikke er pushet ennå — det er ok.
4. Etter første deploy, kopier `DATABASE_URL` fra Vercel-prosjektets "Environment Variables" til ditt lokale `.env.local`, og kjør:
   ```bash
   pnpm install
   pnpm db:push
   ADMIN_EMAIL=daglig.leder@gfgk.no \
   ADMIN_PASSWORD='velg-et-sterkt-passord' \
   ADMIN_NAME='Daglig leder' \
   pnpm seed:admin
   ```
5. Trigger ny deploy på Vercel (Deployments → Redeploy). `/login` skal nå virke.

## Lokal utvikling

```bash
pnpm install
cp .env.local.example .env.local   # fyll inn DATABASE_URL + AUTH_SECRET
pnpm db:push                       # push schema til Neon
pnpm seed:admin                    # opprett første admin (env vars over)
pnpm dev
```

Får du `DATABASE_URL` direkte fra Neon-dashbordet i stedet for Vercel, fungerer flowen identisk.

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
| `pnpm seed:admin`  | Create/update the first admin user (idempotent)         |

See `CLAUDE.md` for architecture and conventions.
