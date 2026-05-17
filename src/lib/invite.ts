'use server'
import { randomBytes } from 'crypto'
import { and, eq, isNull } from 'drizzle-orm'
import { hash } from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getDb } from '@/db'
import { invites, users } from '@/db/schema'

export async function createInvite(formData: FormData) {
  const session = await auth()
  if (session?.user.role !== 'admin') throw new Error('Unauthorized')

  const email = (formData.get('email') as string | null)?.toLowerCase().trim()
  const role = formData.get('role') as 'admin' | 'ansatt' | null
  if (!email || !role) throw new Error('Mangler felt')

  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await getDb().insert(invites).values({ email, role, token, createdBy: session.user.id, expiresAt })
  revalidatePath('/admin/ansatte')
}

export async function revokeInvite(id: string, _formData: FormData) {
  const session = await auth()
  if (session?.user.role !== 'admin') throw new Error('Unauthorized')

  await getDb().delete(invites).where(eq(invites.id, id))
  revalidatePath('/admin/ansatte')
}

export async function acceptInvite(
  token: string,
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  const name = (formData.get('name') as string | null)?.trim()
  const password = formData.get('password') as string | null
  const confirmPassword = formData.get('confirmPassword') as string | null

  if (!name || !password) return 'Fyll inn alle feltene.'
  if (password !== confirmPassword) return 'Passordene stemmer ikke.'
  if (password.length < 8) return 'Passordet må være minst 8 tegn.'

  const db = getDb()
  const [invite] = await db
    .select()
    .from(invites)
    .where(and(eq(invites.token, token), isNull(invites.usedAt)))
    .limit(1)

  if (!invite) return 'Ugyldig eller allerede brukt invitasjonslenke.'
  if (invite.expiresAt < new Date()) return 'Invitasjonen har utløpt.'

  const passwordHash = await hash(password, 10)

  try {
    await db.insert(users).values({ email: invite.email, passwordHash, name, role: invite.role })
  } catch {
    return 'En bruker med denne e-posten finnes allerede.'
  }

  await db.update(invites).set({ usedAt: new Date() }).where(eq(invites.token, token))
  redirect('/login?invited=1')
}
