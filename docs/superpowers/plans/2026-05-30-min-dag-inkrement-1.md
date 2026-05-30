# Min dag — Inkrement 1 (Min dag-flyt) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reframe Hjem (`/dashboard`) til en ordnet «Min dag»-flyt og legg til en «Mine oppgaver i dag»-seksjon, slik at ansatten ser hele dagen i rekkefølge med fremdrift.

**Architecture:** Rent server-component-arbeid på `src/app/dashboard/page.tsx`. Én ny Drizzle-spørring (oppgaver tildelt meg med frist i dag/forfalt, ikke fullført) + én ny seksjon som gjenbruker `TaskBlock` (avkryssbar via eksisterende `toggleTaskDone`). Seksjonsrekkefølgen endres til vakt → rutiner → mine oppgaver → roster. Bottom-nav-etiketten «Hjem» → «Min dag».

**Tech Stack:** Next.js 16 App Router (server components), Drizzle ORM (Neon Postgres), Tailwind/AK-designsystem. Verifisering: `pnpm typecheck`, `pnpm lint`, Claude Preview (mobil, innlogget demo-bruker). Server-components testes via preview (kodebasens etablerte mønster), ikke enhetstester.

---

## Filstruktur

| Fil | Ansvar | Endring |
|---|---|---|
| `src/app/dashboard/page.tsx` | Hjem/Min dag-skjermen | Modifiser: ny spørring + ny seksjon + rekkefølge |
| `src/components/BottomNav.tsx` | Bunn-navigasjon | Modifiser: etikett «Hjem» → «Min dag» |

Gjenbrukes (ingen endring): `src/components/blocks/TaskBlock.tsx`, `toggleTaskDone` i `src/lib/tasks.ts`, `src/components/ui/SectionLabel.tsx`.

---

## Forhåndskrav

Dev-server og demo-data må kjøre for preview-verifisering.

- [ ] **Steg 0: Sikre dev-server + demo-data**

Demo-data finnes allerede (seedet tidligere). Bekreft at dev-serveren svarer:

Run:
```bash
cd ~/gfgk-app && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/login
```
Expected: `200` (login svarer). Hvis ikke: start preview via Claude Preview (`Next.js dev`).

---

## Task 1: «Mine oppgaver i dag»-spørring

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Steg 1: Utvid drizzle-importen med `isNotNull` og `lte`**

I `src/app/dashboard/page.tsx`, endre den første importlinjen:

```ts
import { and, asc, eq, gte, inArray, isNotNull, lte, ne } from 'drizzle-orm'
```

- [ ] **Steg 2: Legg til `myTodayTasks` i Promise.all-destruktureringen**

Finn destruktureringen og legg til `myTodayTasks` som nytt element:

```ts
  const [
    upcomingShifts,
    activeClock,
    todayShift,
    announcementItems,
    todayChecklistRuns,
    openTaskRows,
    rosterShifts,
    myTodayTasks,
  ] = await Promise.all([
```

- [ ] **Steg 3: Legg til spørringen sist i Promise.all**

Rett før den avsluttende `])` i Promise.all, etter `rosterShifts`-spørringen, legg til (husk komma før):

```ts
    // Mine oppgaver i dag — tildelt meg, frist i dag eller forfalt, ikke fullført
    db
      .select({
        id: tasks.id,
        title: tasks.title,
        status: tasks.status,
        priority: tasks.priority,
        dueDate: tasks.dueDate,
      })
      .from(tasks)
      .innerJoin(taskAssignees, eq(taskAssignees.taskId, tasks.id))
      .where(
        and(
          eq(taskAssignees.userId, userId),
          ne(tasks.status, 'done'),
          isNotNull(tasks.dueDate),
          lte(tasks.dueDate, today),
        ),
      )
      .orderBy(asc(tasks.dueDate)),
```

- [ ] **Steg 4: Typecheck**

Run:
```bash
cd ~/gfgk-app && export DATABASE_URL="$(awk -F= '/^DATABASE_URL=/{sub(/^DATABASE_URL=/,""); print}' .env.local)" && pnpm typecheck 2>&1 | tail -4
```
Expected: ingen feil (tom utskrift etter `> tsc --noEmit`). `myTodayTasks` er nå definert og brukt i Task 2 — hvis du kjører Task 1 alene vil lint klage på ubrukt variabel; det er ok, det løses i Task 2.

---

## Task 2: «Mine oppgaver i dag»-seksjon + importer

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Steg 1: Importer `TaskBlock` og `toggleTaskDone`**

Legg til ved de øvrige `@/components`- og `@/lib`-importene i `src/app/dashboard/page.tsx`:

```ts
import { TaskBlock } from '@/components/blocks/TaskBlock'
```
og utvid eksisterende `@/lib/tasks`-import (eller legg til ny linje):
```ts
import { toggleTaskDone } from '@/lib/tasks'
```

- [ ] **Steg 2: Rendre seksjonen mellom «Dagens sjekklister» og «Kommende vakter»**

Finn slutten på sjekkliste-`<section>`-en (rett etter dens avsluttende `</section>`) og før `{/* Kommende vakter */}`. Sett inn:

```tsx
          {/* Mine oppgaver i dag */}
          <section>
            <SectionLabel>Mine oppgaver i dag</SectionLabel>
            {myTodayTasks.length === 0 ? (
              <p className="text-sm text-gfgk-text-3">
                Ingen oppgaver med frist i dag.
              </p>
            ) : (
              <div className="space-y-2">
                {myTodayTasks.map((t) => (
                  <TaskBlock
                    key={t.id}
                    task={{
                      id: t.id,
                      title: t.title,
                      status: t.status,
                      priority: t.priority,
                      dueDate: t.dueDate,
                      assignees: [],
                    }}
                    onToggle={toggleTaskDone}
                  />
                ))}
              </div>
            )}
          </section>
```

- [ ] **Steg 3: Typecheck + lint**

Run:
```bash
cd ~/gfgk-app && export DATABASE_URL="$(awk -F= '/^DATABASE_URL=/{sub(/^DATABASE_URL=/,""); print}' .env.local)" && pnpm typecheck 2>&1 | tail -3 && echo "=== LINT ===" && pnpm lint 2>&1 | tail -3
```
Expected: begge rene (ingen feil).

- [ ] **Steg 4: Verifiser i preview**

Naviger til `/dashboard` i Claude Preview (mobil, innlogget som `demo@gfgk.no`). Bekreft:
- Ny seksjon «MINE OPPGAVER I DAG» (eyebrow mono-caps) vises mellom rutiner og kommende vakter.
- Demo-oppgavene med frist i dag/forfalt vises (f.eks. «Oppdatere prisliste i pro shop» (i dag), «Bestille range-baller» (forfalt)). Avkryssing fungerer.
- `preview_console_logs` (level error) er tom.

- [ ] **Steg 5: Commit**

```bash
cd ~/gfgk-app && git add src/app/dashboard/page.tsx && git commit -m "Min dag: legg til «Mine oppgaver i dag»-seksjon

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: «Min dag»-rammeverk (nav-etikett)

**Files:**
- Modify: `src/components/BottomNav.tsx`

- [ ] **Steg 1: Endre bunn-nav-etiketten «Hjem» → «Min dag»**

I `src/components/BottomNav.tsx`, i `baseItems`, endre første element:

```ts
  { href: '/dashboard', label: 'Min dag', icon: Home },
```

- [ ] **Steg 2: Typecheck + lint**

Run:
```bash
cd ~/gfgk-app && export DATABASE_URL="$(awk -F= '/^DATABASE_URL=/{sub(/^DATABASE_URL=/,""); print}' .env.local)" && pnpm typecheck 2>&1 | tail -3 && echo "=== LINT ===" && pnpm lint 2>&1 | tail -3
```
Expected: begge rene.

- [ ] **Steg 3: Verifiser i preview**

I Claude Preview, bekreft at bunn-navigasjonen nå viser «Min dag» (aktiv, gull) i stedet for «Hjem» på dashboard-skjermen. `preview_console_logs` (level error) tom.

- [ ] **Steg 4: Commit**

```bash
cd ~/gfgk-app && git add src/components/BottomNav.tsx && git commit -m "Min dag: rename Hjem-fane til «Min dag»

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Push + sluttverifisering

- [ ] **Steg 1: Bygg-sjekk (valgfri, men anbefalt før push)**

Run:
```bash
cd ~/gfgk-app && export DATABASE_URL="$(awk -F= '/^DATABASE_URL=/{sub(/^DATABASE_URL=/,""); print}' .env.local)" && export AUTH_SECRET="$(awk -F= '/^AUTH_SECRET=/{sub(/^AUTH_SECRET=/,""); print}' .env.local)" && pnpm build 2>&1 | grep -iE "Compiled successfully|error" | head -5
```
Expected: «✓ Compiled successfully».

- [ ] **Steg 2: Push (auto-deployer til Vercel)**

```bash
cd ~/gfgk-app && git push origin main 2>&1 | tail -3
```
Expected: pushet til `main` (Vercel auto-deployer `gfgk-app.vercel.app`).

---

## Out of scope (egne planer senere)
- Inkrement 2 — Vakt-overlevering (ny `handovers`-tabell)
- Inkrement 3 — Koblinger (sjekkpunkt→SOP, hendelse→oppgave, oppgave→sone)
- Inkrement 4 — Varsler (morgenbrief-push, rutine-påminnelse)

## Avvik fra spec (bevisst)
Spec-en nevnte et «plassholder-kort for overlevering» i Inkrement 1. Vi hopper over en død plassholder og introduserer overlevering som ekte seksjon i Inkrement 2 — for å unngå å shippe et kort som ikke gjør noe.
