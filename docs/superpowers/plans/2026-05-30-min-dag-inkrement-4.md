# Min dag — Inkrement 4: Varsler (Implementeringsplan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Gjøre push-varsler ende-til-ende: fullføre mottakssiden (service worker + registrering) og legge til to cron-drevne varsler — morgenbrief (vakt + oppgaver + rutiner) og rutine-påminnelse.

**Architecture:** Mottakssiden mangler kun en service worker og registrering av den; enrollment-UI (`/profil/varsler`), `PushManager`, `subscribe`/`unsubscribe`-routes og `sendPushToUser` (graceful uten VAPID) finnes allerede. Avsendersiden får to nye lib-funksjoner + to Vercel Cron-endpoints, schedulert via `vercel.json`. For å holde oss innenfor Vercel Hobby sin grense på 2 cron-jobber, genererer morgenbrief-cronen også dagens checklist-runs (i stedet for en egen checklists-cron).

**Tech Stack:** Next.js 16 App Router, web-push (VAPID), Drizzle/Neon, Vercel Cron.

**Env (allerede satt i `.env.local`):** `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_SUBJECT`, `CRON_SECRET`. Må også settes i Vercel (Anders gjør dette etter merge).

---

### Task 1: Service worker + registrering (mottakssiden)

**Files:**
- Create: `public/sw.js`
- Create: `src/components/ServiceWorkerRegister.tsx`
- Modify: `src/app/layout.tsx` (render registrering i `<body>`)

- [ ] **Step 1: Skriv service worker** — `public/sw.js`:

```js
// GFGK Servicepunkt — push service worker.
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = {}
  }
  const title = data.title || 'GFGK Servicepunkt'
  const options = {
    body: data.body || '',
    icon: '/logo.png',
    badge: '/logo.png',
    data: { url: data.url || '/dashboard' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/dashboard'
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if (client.url.includes(url) && 'focus' in client) return client.focus()
        }
        if (self.clients.openWindow) return self.clients.openWindow(url)
      }),
  )
})
```

- [ ] **Step 2: Skriv registreringskomponent** — `src/components/ServiceWorkerRegister.tsx`:

```tsx
'use client'

import { useEffect } from 'react'

/**
 * Registrerer service workeren slik at `navigator.serviceWorker.ready`
 * resolver — en forutsetning for at PushManager kan abonnere på push.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.error('[sw] register failed:', err))
    }
  }, [])
  return null
}
```

- [ ] **Step 3: Render i layout** — i `src/app/layout.tsx`, importer og render i body:

```tsx
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister'
// ...
      <body>
        <ServiceWorkerRegister />
        {children}
      </body>
```

- [ ] **Step 4: Verifiser** — `pnpm typecheck` + `pnpm lint` rene. `pnpm build` kompilerer.

- [ ] **Step 5: Commit** — `git commit -m "Varsler: service worker + registrering (mottakssiden)"`

---

### Task 2: Morgenbrief (avsendersiden) + cron

**Files:**
- Create: `src/lib/morning-brief.ts`
- Create: `src/app/api/cron/morning-brief/route.ts`

- [ ] **Step 1: Skriv brief-lib** — `src/lib/morning-brief.ts`:

```ts
'use server'

import { and, eq, isNotNull, lte, ne } from 'drizzle-orm'
import { getDb } from '@/db'
import {
  checklistRuns,
  shifts,
  taskAssignees,
  tasks,
} from '@/db/schema'
import { toDateString } from '@/lib/dates'
import { sendPushToUser } from '@/lib/push'

/**
 * Morgenbrief: for hver bruker med publisert vakt i dag, send én push med
 * vakttid, antall åpne oppgaver (frist i dag/forfalt) og antall gjenstående
 * rutiner (klubb-bredt). Best-effort — sender 0 hvis ingen abonnement/VAPID.
 */
export async function sendMorningBrief(): Promise<{ recipients: number; sent: number }> {
  const db = getDb()
  const today = toDateString(new Date())

  const todaysShifts = await db
    .select({
      userId: shifts.userId,
      startTime: shifts.startTime,
      endTime: shifts.endTime,
    })
    .from(shifts)
    .where(and(eq(shifts.date, today), eq(shifts.published, true)))

  if (todaysShifts.length === 0) return { recipients: 0, sent: 0 }

  const todayRuns = await db
    .select({ completedAt: checklistRuns.completedAt })
    .from(checklistRuns)
    .where(eq(checklistRuns.date, today))
  const pendingRoutines = todayRuns.filter((r) => r.completedAt === null).length

  let sent = 0
  for (const s of todaysShifts) {
    const openTasks = await db
      .select({ id: tasks.id })
      .from(tasks)
      .innerJoin(taskAssignees, eq(taskAssignees.taskId, tasks.id))
      .where(
        and(
          eq(taskAssignees.userId, s.userId),
          ne(tasks.status, 'done'),
          isNotNull(tasks.dueDate),
          lte(tasks.dueDate, today),
        ),
      )
    const taskCount = openTasks.length

    const parts = [`Vakt ${s.startTime}–${s.endTime}`]
    parts.push(taskCount === 1 ? '1 oppgave i dag' : `${taskCount} oppgaver i dag`)
    if (pendingRoutines > 0) {
      parts.push(pendingRoutines === 1 ? '1 rutine venter' : `${pendingRoutines} rutiner venter`)
    }

    const res = await sendPushToUser(s.userId, {
      title: 'God morgen',
      body: parts.join(' · '),
      url: '/dashboard',
    })
    sent += res.sent
  }

  return { recipients: todaysShifts.length, sent }
}
```

- [ ] **Step 2: Skriv cron-route** — `src/app/api/cron/morning-brief/route.ts`. Genererer dagens runs FØRST (så briefen teller rutiner riktig), så sender brief:

```ts
import { NextResponse } from 'next/server'
import { generateChecklistRunsForToday } from '@/lib/checklists'
import { sendMorningBrief } from '@/lib/morning-brief'

/**
 * Vercel Cron — kjøres tidlig morgen (se vercel.json). Bygger dagens
 * checklist-runs og sender deretter morgenbrief til alle med vakt i dag.
 * Sikkerhet: Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const expected = process.env.CRON_SECRET
  if (expected && authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const runs = await generateChecklistRunsForToday()
  const brief = await sendMorningBrief()
  return NextResponse.json({ ok: true, runs, brief })
}
```

- [ ] **Step 3: Verifiser** — `pnpm typecheck` + `pnpm lint` rene.

- [ ] **Step 4: Commit** — `git commit -m "Varsler: morgenbrief-lib + cron-route"`

---

### Task 3: Rutine-påminnelse (avsendersiden) + cron

**Files:**
- Create: `src/lib/routine-reminder.ts`
- Create: `src/app/api/cron/routine-reminder/route.ts`

- [ ] **Step 1: Skriv reminder-lib** — `src/lib/routine-reminder.ts`:

```ts
'use server'

import { and, eq, isNull } from 'drizzle-orm'
import { getDb } from '@/db'
import { checklistRuns, checklists, shifts } from '@/db/schema'
import { toDateString } from '@/lib/dates'
import { sendPushToUser } from '@/lib/push'

/**
 * Rutine-påminnelse: hvis det gjenstår ufullførte rutiner i dag, send en
 * påminnelse til alle med publisert vakt i dag. Best-effort.
 */
export async function sendRoutineReminder(): Promise<{
  recipients: number
  sent: number
  pending: number
}> {
  const db = getDb()
  const today = toDateString(new Date())

  const pendingRuns = await db
    .select({ name: checklists.name })
    .from(checklistRuns)
    .innerJoin(checklists, eq(checklists.id, checklistRuns.checklistId))
    .where(and(eq(checklistRuns.date, today), isNull(checklistRuns.completedAt)))

  if (pendingRuns.length === 0) return { recipients: 0, sent: 0, pending: 0 }

  const names = pendingRuns.map((r) => r.name)
  const body =
    names.length <= 3
      ? `Gjenstår: ${names.join(', ')}`
      : `${names.length} rutiner gjenstår i dag`

  const todaysShifts = await db
    .select({ userId: shifts.userId })
    .from(shifts)
    .where(and(eq(shifts.date, today), eq(shifts.published, true)))

  let sent = 0
  for (const s of todaysShifts) {
    const res = await sendPushToUser(s.userId, {
      title: 'Rutiner gjenstår',
      body,
      url: '/sjekklister',
    })
    sent += res.sent
  }

  return { recipients: todaysShifts.length, sent, pending: pendingRuns.length }
}
```

- [ ] **Step 2: Skriv cron-route** — `src/app/api/cron/routine-reminder/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { sendRoutineReminder } from '@/lib/routine-reminder'

/**
 * Vercel Cron — kjøres på ettermiddagen (se vercel.json). Minner ansatte
 * med vakt i dag om gjenstående rutiner. Sikkerhet: Bearer <CRON_SECRET>.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const expected = process.env.CRON_SECRET
  if (expected && authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await sendRoutineReminder()
  return NextResponse.json({ ok: true, ...result })
}
```

- [ ] **Step 3: Verifiser** — `pnpm typecheck` + `pnpm lint` rene.

- [ ] **Step 4: Commit** — `git commit -m "Varsler: rutine-påminnelse-lib + cron-route"`

---

### Task 4: Cron-scheduling (vercel.json)

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: Skriv vercel.json** — tidene er UTC. `30 5` ≈ 07:30 CEST / 06:30 CET (morgen). `0 13` ≈ 15:00 CEST / 14:00 CET (ettermiddag):

```json
{
  "crons": [
    { "path": "/api/cron/morning-brief", "schedule": "30 5 * * *" },
    { "path": "/api/cron/routine-reminder", "schedule": "0 13 * * *" }
  ]
}
```

- [ ] **Step 2: Verifiser** — `pnpm build` kompilerer, og begge route-handlere finnes på de oppgitte stiene.

- [ ] **Step 3: Commit** — `git commit -m "Varsler: vercel.json cron-scheduling"`

---

## Verifisering (etter alle tasks)

- `pnpm typecheck` + `pnpm lint` + `pnpm build` rene.
- Lokalt med env satt: kall begge cron-endpoints med `Authorization: Bearer $CRON_SECRET` og bekreft `{ ok: true, ... }` uten feil (sent kan være 0 uten abonnement).
- Preview (innlogget): gå til `/profil/varsler` → "Skru på"-knapp vises (ikke "støtter ikke"), bekreft ingen konsollfeil ved SW-registrering.
- Bekreft uautorisert kall (feil/manglende secret) gir 401.

## Utenfor scope

- iOS-spesifikk PWA-installasjonsguide (PushManager viser allerede hint).
- Per-bruker varsel-preferanser (av/på per varseltype).
- Tidssone-presis cron (Vercel Cron kjører UTC; fast tilnærming dokumentert).
