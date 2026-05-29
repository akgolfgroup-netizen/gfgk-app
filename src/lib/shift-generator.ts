'use server'

import { and, eq, gte, lte } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { getDb } from '@/db'
import { shiftTemplates, shifts, timeOff, users } from '@/db/schema'
import { startOfWeek, toDateString } from '@/lib/calendar'

interface GeneratorOptions {
  fromDate: string // 'YYYY-MM-DD'
  numWeeks: number
  userIds: string[] // ansatte å inkludere
  templateIds: string[] // hvilke vakt-maler å bruke
}

interface GeneratedShift {
  userId: string
  date: string
  startTime: string
  endTime: string
  note: string | null
  estHours: number
}

/**
 * Round-robin generator med fairness-vekting på preferred_shifts og
 * over-tid-balansering. Hopper over godkjent ferie.
 *
 * Heuristic:
 * - Beregn target-timer per ansatt per uke = users.timerPerUke
 * - For hver dag i perioden:
 *   - For hver template (sortert på start_time):
 *     - Pick ansatt med lavest "credit balance" (running_total - target * day_index/7)
 *     - som ikke har ferie og som foretrekker denne tiden (eller har ingen preferanse)
 *
 * Returnerer foreslåtte shifts som lagres med published=false.
 */
export async function generateShifts(
  opts: GeneratorOptions,
): Promise<{ created: number; skippedDueToTimeOff: number }> {
  const session = await auth()
  if (session?.user?.role !== 'admin') return { created: 0, skippedDueToTimeOff: 0 }

  const db = getDb()

  // Hent ansatte med data vi trenger
  const empRows = await db
    .select({
      id: users.id,
      timerPerUke: users.timerPerUke,
      preferredShifts: users.preferredShifts,
    })
    .from(users)
    .where(eq(users.active, true))

  const employees = empRows
    .filter((e) => opts.userIds.includes(e.id))
    .map((e) => ({
      id: e.id,
      target: e.timerPerUke ? parseFloat(e.timerPerUke) : 37.5,
      preferred: e.preferredShifts ?? [],
      assignedHours: 0,
    }))

  if (employees.length === 0) return { created: 0, skippedDueToTimeOff: 0 }

  // Hent maler
  const templates = await db
    .select()
    .from(shiftTemplates)
    .where(opts.templateIds.length > 0 ? undefined : undefined)
  const usedTemplates = templates
    .filter((t) => opts.templateIds.includes(t.id))
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  if (usedTemplates.length === 0) return { created: 0, skippedDueToTimeOff: 0 }

  // Hent godkjent ferie i perioden
  const periodStart = opts.fromDate
  const periodEndDate = new Date(opts.fromDate + 'T00:00:00')
  periodEndDate.setDate(periodEndDate.getDate() + opts.numWeeks * 7 - 1)
  const periodEnd = toDateString(periodEndDate)

  const timeOffRows = await db
    .select()
    .from(timeOff)
    .where(
      and(
        eq(timeOff.status, 'approved'),
        lte(timeOff.startDate, periodEnd),
        gte(timeOff.endDate, periodStart),
      ),
    )

  function hasTimeOff(userId: string, dateStr: string): boolean {
    return timeOffRows.some(
      (t) => t.userId === userId && t.startDate <= dateStr && t.endDate >= dateStr,
    )
  }

  function templateShiftType(template: { startTime: string }): string {
    const h = parseInt(template.startTime.split(':')[0] ?? '12', 10)
    if (h < 11) return 'morgen'
    if (h < 17) return 'ettermiddag'
    return 'kveld'
  }

  const out: GeneratedShift[] = []
  let skippedDueToTimeOff = 0
  const start = new Date(opts.fromDate + 'T00:00:00')
  // Start uken fra mandag
  const weekStart = startOfWeek(start)

  for (let d = 0; d < opts.numWeeks * 7; d++) {
    const dayDate = new Date(weekStart)
    dayDate.setDate(weekStart.getDate() + d)
    const dateStr = toDateString(dayDate)
    if (dateStr < opts.fromDate) continue

    for (const template of usedTemplates) {
      const tType = templateShiftType(template)

      // Velg ansatt:
      // 1) Foretrekker denne shift-typen (eller ingen preferanse), og
      // 2) Har minst-overbookede tid (lavest assignedHours / target ratio)
      const candidates = employees
        .filter((e) => {
          if (hasTimeOff(e.id, dateStr)) return false
          // Hvis preferanser finnes, må shift-typen være med
          if (e.preferred.length > 0 && !e.preferred.includes(tType as 'morgen' | 'ettermiddag' | 'kveld'))
            return false
          return true
        })
        .sort((a, b) => {
          const aRatio = a.target > 0 ? a.assignedHours / a.target : 999
          const bRatio = b.target > 0 ? b.assignedHours / b.target : 999
          return aRatio - bRatio
        })

      if (candidates.length === 0) {
        skippedDueToTimeOff++
        continue
      }

      const picked = candidates[0]
      if (!picked) continue

      const hours = parseFloat(template.hours)
      picked.assignedHours += hours

      out.push({
        userId: picked.id,
        date: dateStr,
        startTime: template.startTime,
        endTime: template.endTime,
        note: `Auto-generert (${template.name})`,
        estHours: hours,
      })
    }
  }

  // Sett inn alle som ikke-publisert
  if (out.length > 0) {
    await db.insert(shifts).values(
      out.map((s) => ({
        userId: s.userId,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        note: s.note,
        published: false,
        createdBy: session.user.id,
      })),
    )
  }

  revalidatePath('/admin/vaktliste')
  return { created: out.length, skippedDueToTimeOff }
}

/**
 * Slett alle ikke-publiserte (utkast) vakter i et intervall. Brukes for å
 * rydde opp før ny generering.
 */
export async function deleteUnpublishedInRange(
  fromDate: string,
  toDate: string,
): Promise<{ deleted: number }> {
  const session = await auth()
  if (session?.user?.role !== 'admin') return { deleted: 0 }

  const result = await getDb()
    .delete(shifts)
    .where(
      and(
        gte(shifts.date, fromDate),
        lte(shifts.date, toDate),
        eq(shifts.published, false),
      ),
    )
    .returning({ id: shifts.id })

  revalidatePath('/admin/vaktliste')
  return { deleted: result.length }
}
