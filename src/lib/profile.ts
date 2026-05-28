'use server'

import { hash, compare } from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { getDb } from '@/db'
import { users } from '@/db/schema'
import { deleteBlobByUrl, uploadAvatar } from '@/lib/blob'

const PREFERRED_SHIFTS = ['morgen', 'ettermiddag', 'kveld'] as const
type PreferredShift = (typeof PREFERRED_SHIFTS)[number]

function isPreferredShift(value: string): value is PreferredShift {
  return (PREFERRED_SHIFTS as readonly string[]).includes(value)
}

function parsePositiveInt(input: string | null, max: number): number | null {
  if (!input) return null
  const n = parseInt(input, 10)
  if (Number.isNaN(n) || n < 0 || n > max) return null
  return n
}

function parsePositiveDecimal(input: string | null, max: number): string | null {
  if (!input) return null
  const n = parseFloat(input.replace(',', '.'))
  if (Number.isNaN(n) || n < 0 || n > max) return null
  return n.toFixed(1)
}

/**
 * Oppdater navnet på brukerens profil.
 */
export async function updateName(formData: FormData): Promise<void> {
  const session = await auth()
  if (!session?.user) return

  const name = (formData.get('name') as string | null)?.trim() ?? ''
  if (!name) return

  await getDb().update(users).set({ name }).where(eq(users.id, session.user.id))
  revalidatePath('/profil')
}

/**
 * Oppdater telefonnummer.
 */
export async function updatePhone(formData: FormData): Promise<void> {
  const session = await auth()
  if (!session?.user) return

  const raw = (formData.get('phone') as string | null)?.trim() ?? ''
  const phone = raw.length > 0 ? raw : null

  await getDb().update(users).set({ phone }).where(eq(users.id, session.user.id))
  revalidatePath('/profil')
}

/**
 * Oppdater arbeids-info (stillingsprosent og timer per uke).
 */
export async function updateWorkInfo(formData: FormData): Promise<void> {
  const session = await auth()
  if (!session?.user) return

  const stillingsprosent = parsePositiveInt(
    formData.get('stillingsprosent') as string | null,
    100,
  )
  const timerPerUke = parsePositiveDecimal(
    formData.get('timerPerUke') as string | null,
    80,
  )

  await getDb()
    .update(users)
    .set({ stillingsprosent, timerPerUke })
    .where(eq(users.id, session.user.id))
  revalidatePath('/profil')
}

/**
 * Toggle ett foretrukket vaktnavn (morgen/ettermiddag/kveld) av/på.
 */
export async function togglePreferredShift(shift: string): Promise<void> {
  const session = await auth()
  if (!session?.user) return
  if (!isPreferredShift(shift)) return

  const [current] = await getDb()
    .select({ preferredShifts: users.preferredShifts })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  const existing = current?.preferredShifts ?? []
  const next = existing.includes(shift)
    ? existing.filter((s) => s !== shift)
    : [...existing, shift]

  await getDb()
    .update(users)
    .set({ preferredShifts: next })
    .where(eq(users.id, session.user.id))
  revalidatePath('/profil')
}

/**
 * Last opp ny avatar. Sletter forrige hvis den finnes.
 */
export async function uploadAvatarAction(formData: FormData): Promise<void> {
  const session = await auth()
  if (!session?.user) return

  const file = formData.get('avatar')
  if (!(file instanceof File) || file.size === 0) return

  const [current] = await getDb()
    .select({ avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  const newUrl = await uploadAvatar(file, session.user.id)

  await getDb()
    .update(users)
    .set({ avatarUrl: newUrl })
    .where(eq(users.id, session.user.id))

  // Slett gammel etter at den nye er lagret
  if (current?.avatarUrl && current.avatarUrl !== newUrl) {
    await deleteBlobByUrl(current.avatarUrl)
  }
  revalidatePath('/profil')
}

/**
 * Bytt passord. Krever korrekt nåværende passord.
 */
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

// Bakoverkompatibilitet for eksisterende /profil-page som fortsatt importerer updateProfile
export { updateName as updateProfile }
