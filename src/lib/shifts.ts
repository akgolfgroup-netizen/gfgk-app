'use server'
import { and, eq, gte, inArray, lte } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { getDb } from '@/db'
import { shifts, users } from '@/db/schema'
import { sendEmail, shiftPublishedEmailHtml } from '@/lib/email'

function getWeekNum(d: Date) {
  const target = new Date(d.valueOf())
  const dayNr = (d.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNr + 3)
  const firstThursday = new Date(target.getFullYear(), 0, 4)
  const diff = (target.getTime() - firstThursday.getTime()) / 86400000
  return 1 + Math.round((diff - 3 + ((firstThursday.getDay() + 6) % 7)) / 7)
}

export async function createShift(formData: FormData) {
  const session = await auth()
  if (session?.user.role !== 'admin') throw new Error('Unauthorized')

  const userId = formData.get('userId') as string | null
  const shiftDate = formData.get('date') as string | null
  const startTime = formData.get('startTime') as string | null
  const endTime = formData.get('endTime') as string | null
  const note = (formData.get('note') as string | null)?.trim() || null

  if (!userId || !shiftDate || !startTime || !endTime) throw new Error('Mangler felt')

  await getDb().insert(shifts).values({
    userId,
    date: shiftDate,
    startTime,
    endTime,
    note,
    published: false,
    createdBy: session.user.id,
  })

  revalidatePath('/admin/vaktliste')
}

export async function deleteShift(id: string, _formData: FormData) {
  const session = await auth()
  if (session?.user.role !== 'admin') throw new Error('Unauthorized')

  await getDb().delete(shifts).where(eq(shifts.id, id))
  revalidatePath('/admin/vaktliste')
  revalidatePath('/vakter')
}

export async function updateShift(id: string, formData: FormData) {
  const session = await auth()
  if (session?.user.role !== 'admin') throw new Error('Unauthorized')

  const startTime = (formData.get('startTime') as string | null)?.trim()
  const endTime = (formData.get('endTime') as string | null)?.trim()
  const note = (formData.get('note') as string | null)?.trim() || null

  if (!startTime || !endTime) return

  await getDb()
    .update(shifts)
    .set({ startTime, endTime, note })
    .where(eq(shifts.id, id))

  revalidatePath('/admin/vaktliste')
  revalidatePath('/vakter')
}

export async function toggleShiftPublished(id: string): Promise<void> {
  const session = await auth()
  if (session?.user.role !== 'admin') throw new Error('Unauthorized')

  const [shift] = await getDb()
    .select({ published: shifts.published })
    .from(shifts)
    .where(eq(shifts.id, id))
    .limit(1)
  if (!shift) return

  await getDb()
    .update(shifts)
    .set({ published: !shift.published })
    .where(eq(shifts.id, id))

  revalidatePath('/admin/vaktliste')
  revalidatePath('/vakter')
}

export async function publishWeek(weekStart: string, _formData: FormData) {
  const session = await auth()
  if (session?.user.role !== 'admin') throw new Error('Unauthorized')

  const end = new Date(weekStart + 'T00:00:00')
  end.setDate(end.getDate() + 6)
  const weekEnd = end.toISOString().slice(0, 10)

  const db = getDb()
  const weekShifts = await db
    .select({ userId: shifts.userId })
    .from(shifts)
    .where(and(gte(shifts.date, weekStart), lte(shifts.date, weekEnd), eq(shifts.published, false)))

  await db
    .update(shifts)
    .set({ published: true })
    .where(and(gte(shifts.date, weekStart), lte(shifts.date, weekEnd)))

  const affectedUserIds = [...new Set(weekShifts.map((s) => s.userId))]
  if (affectedUserIds.length > 0) {
    const recipients = await db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(inArray(users.id, affectedUserIds))

    const h = await headers()
    const host = h.get('host') ?? 'localhost:3000'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const appUrl = `${protocol}://${host}`
    const weekNum = getWeekNum(new Date(weekStart + 'T00:00:00'))

    await Promise.all(
      recipients.map((r) =>
        sendEmail({
          to: r.email,
          subject: `Vaktliste uke ${weekNum} er publisert`,
          html: shiftPublishedEmailHtml({ name: r.name ?? '', weekNum, appUrl }),
        }),
      ),
    )
  }

  revalidatePath('/admin/vaktliste')
  revalidatePath('/dashboard')
}
