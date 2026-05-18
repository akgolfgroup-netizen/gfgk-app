'use server'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { getDb } from '@/db'
import { timeEntries } from '@/db/schema'

export async function createTimeEntry(formData: FormData) {
  const session = await auth()
  if (!session?.user) return

  const date = formData.get('date') as string
  const hoursRaw = formData.get('hours') as string
  const note = (formData.get('note') as string | null) ?? undefined
  const shiftId = (formData.get('shiftId') as string | null) ?? undefined

  const hours = Math.round(parseFloat(hoursRaw.replace(',', '.')) * 100) / 100
  if (!date || isNaN(hours) || hours <= 0) return

  await getDb().insert(timeEntries).values({
    userId: session.user.id,
    date,
    hours: String(hours),
    note: note || null,
    shiftId: shiftId || null,
  })

  revalidatePath('/profil')
  revalidatePath('/admin/lonn')
}

export async function deleteTimeEntry(id: string, _formData: FormData) {
  const session = await auth()
  if (!session?.user) return

  await getDb().delete(timeEntries).where(eq(timeEntries.id, id))

  revalidatePath('/profil')
  revalidatePath('/admin/lonn')
}
