'use server'

import { and, desc, eq, gte, lte } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { getDb } from '@/db'
import {
  shiftEvents,
  shifts,
  users,
  type ShiftEventCategory,
  type ShiftEventSeverity,
} from '@/db/schema'

const VALID_CATEGORIES: ShiftEventCategory[] = [
  'hendelse',
  'klage',
  'maskin',
  'observasjon',
  'annet',
]
const VALID_SEVERITIES: ShiftEventSeverity[] = ['info', 'medium', 'hoy']

function isCategory(c: string): c is ShiftEventCategory {
  return (VALID_CATEGORIES as string[]).includes(c)
}
function isSeverity(s: string): s is ShiftEventSeverity {
  return (VALID_SEVERITIES as string[]).includes(s)
}

/**
 * Loggfør hendelse på vakt. shiftId er valgfri (kan logges utenom vakt).
 */
export async function logShiftEvent(formData: FormData): Promise<void> {
  const session = await auth()
  if (!session?.user) return

  const shiftId = (formData.get('shiftId') as string) || null
  const categoryRaw = (formData.get('category') as string) ?? 'annet'
  const category: ShiftEventCategory = isCategory(categoryRaw) ? categoryRaw : 'annet'
  const severityRaw = (formData.get('severity') as string) ?? 'info'
  const severity: ShiftEventSeverity = isSeverity(severityRaw) ? severityRaw : 'info'
  const body = ((formData.get('body') as string) ?? '').trim()

  if (!body) return

  await getDb().insert(shiftEvents).values({
    shiftId,
    userId: session.user.id,
    category,
    body,
    severity,
  })

  revalidatePath('/admin/hendelser')
  if (shiftId) revalidatePath(`/vakter/${shiftId}`)
}

/**
 * Hent hendelser med filter. Brukt på /admin/hendelser.
 */
export async function listShiftEvents(filter: {
  category?: ShiftEventCategory
  severity?: ShiftEventSeverity
  dateFrom?: Date
  dateTo?: Date
  userId?: string
}) {
  const db = getDb()

  const conditions = [] as ReturnType<typeof eq>[]
  if (filter.category) conditions.push(eq(shiftEvents.category, filter.category))
  if (filter.severity) conditions.push(eq(shiftEvents.severity, filter.severity))
  if (filter.userId) conditions.push(eq(shiftEvents.userId, filter.userId))
  if (filter.dateFrom) conditions.push(gte(shiftEvents.createdAt, filter.dateFrom))
  if (filter.dateTo) conditions.push(lte(shiftEvents.createdAt, filter.dateTo))

  return db
    .select({
      id: shiftEvents.id,
      shiftId: shiftEvents.shiftId,
      shiftDate: shifts.date,
      category: shiftEvents.category,
      severity: shiftEvents.severity,
      body: shiftEvents.body,
      createdAt: shiftEvents.createdAt,
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
      userAvatar: users.avatarUrl,
    })
    .from(shiftEvents)
    .innerJoin(users, eq(shiftEvents.userId, users.id))
    .leftJoin(shifts, eq(shiftEvents.shiftId, shifts.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(shiftEvents.createdAt))
    .limit(200)
}
