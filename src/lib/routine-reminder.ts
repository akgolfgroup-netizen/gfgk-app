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
