'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getDb } from '@/db'
import { users, type Role } from '@/db/schema'

async function requireAdmin(): Promise<{ adminId: string } | null> {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') return null
  return { adminId: session.user.id }
}

function parseInt0(input: string | null): number | null {
  if (!input) return null
  const n = parseInt(input, 10)
  return Number.isNaN(n) || n < 0 ? null : n
}

function parseDecimal0(input: string | null): string | null {
  if (!input) return null
  const n = parseFloat(input.replace(',', '.'))
  return Number.isNaN(n) || n < 0 ? null : n.toFixed(1)
}

/**
 * Oppdater en ansatt sine profil-felter. Alle felter er valgfrie i FormData;
 * tomme strenger nullstilles, manglende felter ignoreres.
 */
export async function updateEmployee(userId: string, formData: FormData): Promise<void> {
  const admin = await requireAdmin()
  if (!admin) return

  const name = (formData.get('name') as string | null)?.trim()
  const phoneRaw = (formData.get('phone') as string | null)?.trim()
  const stillingsprosent = parseInt0(formData.get('stillingsprosent') as string | null)
  const timerPerUke = parseDecimal0(formData.get('timerPerUke') as string | null)
  const hourlyRate = parseInt0(formData.get('hourlyRate') as string | null)
  const roleRaw = (formData.get('role') as string | null) ?? 'ansatt'
  const role: Role = roleRaw === 'admin' ? 'admin' : 'ansatt'

  await getDb()
    .update(users)
    .set({
      name: name || null,
      phone: phoneRaw && phoneRaw.length > 0 ? phoneRaw : null,
      stillingsprosent,
      timerPerUke,
      hourlyRate,
      role,
    })
    .where(eq(users.id, userId))

  revalidatePath('/admin/ansatte')
  revalidatePath(`/admin/ansatte/${userId}`)
}

/**
 * Toggle om en ansatt er aktiv/inaktiv. Inaktive kan ikke logge inn,
 * og blir hoppet over av vaktliste-generatoren (M10).
 */
export async function toggleEmployeeActive(userId: string): Promise<void> {
  const admin = await requireAdmin()
  if (!admin) return

  // Ikke deaktiver deg selv
  if (admin.adminId === userId) return

  const [current] = await getDb()
    .select({ active: users.active })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!current) return

  await getDb()
    .update(users)
    .set({ active: !current.active })
    .where(eq(users.id, userId))

  revalidatePath('/admin/ansatte')
  revalidatePath(`/admin/ansatte/${userId}`)
}

/**
 * Slett en ansatt permanent. Vil feile hvis brukeren har relaterte data
 * (shifts, timeEntries, etc.) — i så fall bør admin deaktivere i stedet.
 */
export async function deleteEmployee(userId: string): Promise<void> {
  const admin = await requireAdmin()
  if (!admin) return

  // Aldri slett deg selv
  if (admin.adminId === userId) return

  try {
    await getDb().delete(users).where(eq(users.id, userId))
  } catch (err) {
    console.error('[deleteEmployee] feilet:', err)
    return
  }

  revalidatePath('/admin/ansatte')
  redirect('/admin/ansatte')
}
