'use server'

import { and, desc, eq, gte, isNull, lte } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { getDb } from '@/db'
import { shiftClocks, shifts, timeEntries } from '@/db/schema'
import { toDateString } from '@/lib/dates'

/**
 * Stempel inn. Hvis en aktiv vakt i dag finnes, knyttes den til.
 * Returnerer hvis bruker allerede er stemplet inn (uten clock-out).
 */
export async function clockIn(): Promise<void> {
  const session = await auth()
  if (!session?.user) return

  const db = getDb()

  // Sjekk om bruker allerede er stemplet inn (ingen clock-out enda)
  const [active] = await db
    .select({ id: shiftClocks.id })
    .from(shiftClocks)
    .where(
      and(eq(shiftClocks.userId, session.user.id), isNull(shiftClocks.clockedOutAt)),
    )
    .orderBy(desc(shiftClocks.clockedInAt))
    .limit(1)

  if (active) return

  // Finn dagens publiserte vakt (hvis noen)
  const today = toDateString(new Date())
  const [shift] = await db
    .select({ id: shifts.id })
    .from(shifts)
    .where(
      and(
        eq(shifts.userId, session.user.id),
        eq(shifts.date, today),
        eq(shifts.published, true),
      ),
    )
    .limit(1)

  await db.insert(shiftClocks).values({
    userId: session.user.id,
    shiftId: shift?.id ?? null,
    clockedInAt: new Date(),
  })

  revalidatePath('/dashboard')
}

/**
 * Stempel ut. Kalkulerer timer og oppretter time_entry-rad automatisk.
 */
export async function clockOut(formData?: FormData): Promise<void> {
  const session = await auth()
  if (!session?.user) return

  const db = getDb()

  const [active] = await db
    .select()
    .from(shiftClocks)
    .where(
      and(eq(shiftClocks.userId, session.user.id), isNull(shiftClocks.clockedOutAt)),
    )
    .orderBy(desc(shiftClocks.clockedInAt))
    .limit(1)

  if (!active) return

  const now = new Date()
  const ms = now.getTime() - active.clockedInAt.getTime()
  const hours = Math.max(0, Math.round((ms / 1000 / 60 / 60) * 100) / 100) // 2 desimaler
  const note = ((formData?.get('note') as string | null) ?? '').trim() || null

  await db
    .update(shiftClocks)
    .set({ clockedOutAt: now, hours: hours.toFixed(2), note })
    .where(eq(shiftClocks.id, active.id))

  // Opprett tilsvarende time_entry
  await db.insert(timeEntries).values({
    userId: session.user.id,
    shiftId: active.shiftId,
    date: toDateString(active.clockedInAt),
    hours: hours.toFixed(2),
    note: note ?? `Innstemplet ${active.clockedInAt.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })} – ${now.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}`,
  })

  revalidatePath('/dashboard')
  revalidatePath('/profil')
  revalidatePath('/admin/lonn')
}

/**
 * Hent aktiv innstempling (uten clock-out). Brukes for å vise riktig knapp.
 */
export async function getActiveClock(userId: string) {
  const db = getDb()
  const [active] = await db
    .select()
    .from(shiftClocks)
    .where(and(eq(shiftClocks.userId, userId), isNull(shiftClocks.clockedOutAt)))
    .orderBy(desc(shiftClocks.clockedInAt))
    .limit(1)
  return active ?? null
}

/**
 * Hent dagens publiserte vakt for bruker (for å vise tid på knappen).
 */
export async function getTodayShift(userId: string) {
  const today = toDateString(new Date())
  const [shift] = await getDb()
    .select()
    .from(shifts)
    .where(
      and(eq(shifts.userId, userId), eq(shifts.date, today), eq(shifts.published, true)),
    )
    .limit(1)
  return shift ?? null
}

/**
 * Admin-helper: hvem har stemplet inn i dag, og hvem mangler.
 */
export async function listTodayClockStatus() {
  const today = toDateString(new Date())
  const dayStart = new Date(`${today}T00:00:00`)
  const dayEnd = new Date(`${today}T23:59:59`)

  return getDb()
    .select()
    .from(shiftClocks)
    .where(
      and(
        gte(shiftClocks.clockedInAt, dayStart),
        lte(shiftClocks.clockedInAt, dayEnd),
      ),
    )
    .orderBy(desc(shiftClocks.clockedInAt))
}
