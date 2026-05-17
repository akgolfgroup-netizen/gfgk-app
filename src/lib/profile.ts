'use server'
import { hash, compare } from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { getDb } from '@/db'
import { users } from '@/db/schema'

export async function updateProfile(formData: FormData): Promise<void> {
  const session = await auth()
  if (!session?.user) return

  const name = (formData.get('name') as string | null)?.trim() ?? ''
  if (!name) return

  await getDb().update(users).set({ name }).where(eq(users.id, session.user.id))
  revalidatePath('/profil')
}

export async function changePassword(formData: FormData): Promise<void> {
  const session = await auth()
  if (!session?.user) return

  const current = formData.get('current') as string
  const next = formData.get('password') as string
  const confirm = formData.get('confirmPassword') as string

  if (!current || !next || !confirm) return
  if (next.length < 8) return
  if (next !== confirm) return

  const [user] = await getDb()
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  if (!user) return

  const ok = await compare(current, user.passwordHash)
  if (!ok) return

  const passwordHash = await hash(next, 12)
  await getDb().update(users).set({ passwordHash }).where(eq(users.id, session.user.id))
}
