'use server'

import { desc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { getDb } from '@/db'
import { handovers, users } from '@/db/schema'

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function createHandover(formData: FormData): Promise<void> {
  const session = await auth()
  if (!session?.user) return
  const note = ((formData.get('note') as string) ?? '').trim()
  if (!note) return
  const openItems = ((formData.get('openItems') as string) ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)

  await getDb().insert(handovers).values({
    date: todayStr(),
    fromUserId: session.user.id,
    note,
    openItems: openItems.length > 0 ? openItems : null,
  })
  revalidatePath('/dashboard')
}

export async function listTodaysHandovers() {
  return getDb()
    .select({
      id: handovers.id,
      note: handovers.note,
      openItems: handovers.openItems,
      createdAt: handovers.createdAt,
      fromName: users.name,
      fromEmail: users.email,
      fromAvatar: users.avatarUrl,
    })
    .from(handovers)
    .innerJoin(users, eq(users.id, handovers.fromUserId))
    .where(eq(handovers.date, todayStr()))
    .orderBy(desc(handovers.createdAt))
}
