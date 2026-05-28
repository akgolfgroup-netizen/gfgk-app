'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { getDb } from '@/db'
import { shiftTemplates } from '@/db/schema'

function hoursBetween(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const startMin = (sh ?? 0) * 60 + (sm ?? 0)
  const endMin = (eh ?? 0) * 60 + (em ?? 0)
  return Math.max(0, (endMin - startMin) / 60)
}

async function requireAdmin(): Promise<boolean> {
  const session = await auth()
  return session?.user?.role === 'admin'
}

export async function createShiftTemplate(formData: FormData): Promise<void> {
  if (!(await requireAdmin())) return

  const name = ((formData.get('name') as string) ?? '').trim()
  const startTime = ((formData.get('startTime') as string) ?? '').trim()
  const endTime = ((formData.get('endTime') as string) ?? '').trim()

  if (!name || !startTime || !endTime) return
  const hours = hoursBetween(startTime, endTime)

  await getDb().insert(shiftTemplates).values({
    name,
    startTime,
    endTime,
    hours: hours.toFixed(1),
  })

  revalidatePath('/admin/vaktliste/generer')
}

export async function deleteShiftTemplate(id: string): Promise<void> {
  if (!(await requireAdmin())) return

  await getDb().delete(shiftTemplates).where(eq(shiftTemplates.id, id))
  revalidatePath('/admin/vaktliste/generer')
}

export async function listShiftTemplates() {
  return getDb().select().from(shiftTemplates).orderBy(shiftTemplates.startTime)
}
