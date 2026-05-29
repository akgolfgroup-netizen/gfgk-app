'use server'

import { and, desc, eq, gte, lte, or } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { getDb } from '@/db'
import { timeOff, type TimeOffStatus, type TimeOffType } from '@/db/schema'
import { notifyTimeOffDecision } from '@/lib/notifications'

const VALID_TYPES: TimeOffType[] = ['ferie', 'sykemelding', 'permisjon']
const VALID_STATUSES: TimeOffStatus[] = ['pending', 'approved', 'declined']

function isType(t: string): t is TimeOffType {
  return (VALID_TYPES as string[]).includes(t)
}
function isStatus(s: string): s is TimeOffStatus {
  return (VALID_STATUSES as string[]).includes(s)
}

/**
 * Ansatt søker om ferie/permisjon. Standard: type=ferie, status=pending.
 */
export async function requestTimeOff(formData: FormData): Promise<void> {
  const session = await auth()
  if (!session?.user) return

  const startDate = (formData.get('startDate') as string) || null
  const endDate = (formData.get('endDate') as string) || null
  const typeRaw = (formData.get('type') as string) ?? 'ferie'
  const type: TimeOffType = isType(typeRaw) ? typeRaw : 'ferie'
  const note = ((formData.get('note') as string) ?? '').trim() || null

  if (!startDate || !endDate) return
  if (endDate < startDate) return

  await getDb().insert(timeOff).values({
    userId: session.user.id,
    startDate,
    endDate,
    type,
    status: 'pending',
    note,
  })

  revalidatePath('/profil')
  revalidatePath(`/admin/ansatte/${session.user.id}`)
}

/**
 * Admin godkjenner eller avviser en ferieforespørsel.
 */
export async function setTimeOffStatus(id: string, status: TimeOffStatus): Promise<void> {
  const session = await auth()
  if (session?.user?.role !== 'admin') return
  if (!isStatus(status)) return

  const db = getDb()
  const [row] = await db.select().from(timeOff).where(eq(timeOff.id, id)).limit(1)
  if (!row) return

  await db
    .update(timeOff)
    .set({ status, approvedBy: session.user.id })
    .where(eq(timeOff.id, id))

  if (status === 'approved' || status === 'declined') {
    await notifyTimeOffDecision(row.userId, status === 'approved')
  }

  revalidatePath('/profil')
  revalidatePath(`/admin/ansatte/${row.userId}`)
}

/**
 * Ansatt kansellerer egen pending ferie.
 */
export async function cancelTimeOff(id: string): Promise<void> {
  const session = await auth()
  if (!session?.user) return

  const db = getDb()
  const [row] = await db.select().from(timeOff).where(eq(timeOff.id, id)).limit(1)
  if (!row) return

  // Bare egen, og bare pending
  if (row.userId !== session.user.id) return
  if (row.status !== 'pending') return

  await db.delete(timeOff).where(eq(timeOff.id, id))
  revalidatePath('/profil')
}

/**
 * Hent kommende + pågående ferie for en bruker.
 */
export async function listUpcomingTimeOff(userId: string) {
  const today = new Date().toISOString().slice(0, 10)
  return getDb()
    .select()
    .from(timeOff)
    .where(and(eq(timeOff.userId, userId), gte(timeOff.endDate, today)))
    .orderBy(desc(timeOff.startDate))
}

/**
 * Hent all ferie for en bruker (admin-visning).
 */
export async function listAllTimeOff(userId: string) {
  return getDb()
    .select()
    .from(timeOff)
    .where(eq(timeOff.userId, userId))
    .orderBy(desc(timeOff.startDate))
}

/**
 * Sjekk om en bruker har approved-ferie i et gitt datointervall (brukes av generator).
 */
export async function userHasTimeOffInRange(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<boolean> {
  const [hit] = await getDb()
    .select({ id: timeOff.id })
    .from(timeOff)
    .where(
      and(
        eq(timeOff.userId, userId),
        eq(timeOff.status, 'approved'),
        or(
          // Overlapp: ferie-start <= dato-slutt OG ferie-slutt >= dato-start
          and(lte(timeOff.startDate, endDate), gte(timeOff.endDate, startDate)),
        ),
      ),
    )
    .limit(1)
  return Boolean(hit)
}
