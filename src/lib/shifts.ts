'use server'
import { and, eq, gte, lte } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { getDb } from '@/db'
import { shifts } from '@/db/schema'

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
}

export async function publishWeek(weekStart: string, _formData: FormData) {
  const session = await auth()
  if (session?.user.role !== 'admin') throw new Error('Unauthorized')

  const end = new Date(weekStart + 'T00:00:00')
  end.setDate(end.getDate() + 6)
  const weekEnd = end.toISOString().slice(0, 10)

  await getDb()
    .update(shifts)
    .set({ published: true })
    .where(and(gte(shifts.date, weekStart), lte(shifts.date, weekEnd)))

  revalidatePath('/admin/vaktliste')
  revalidatePath('/dashboard')
}
