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
