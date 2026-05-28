'use server'

import { del, put } from '@vercel/blob'
import { desc, eq, isNull, or } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { getDb } from '@/db'
import { documents, type DocumentCategory } from '@/db/schema'

const MAX_BYTES = 25 * 1024 * 1024 // 25 MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const

const VALID_CATEGORIES: DocumentCategory[] = [
  'kontrakt',
  'ferieattest',
  'sykmelding',
  'kvittering',
  'annet',
]

function isCategory(c: string): c is DocumentCategory {
  return (VALID_CATEGORIES as string[]).includes(c)
}

async function requireAdmin(): Promise<{ id: string } | null> {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') return null
  return { id: session.user.id }
}

/**
 * Last opp dokument for en spesifikk ansatt. Admin-only.
 * Hvis userId = null, blir det et felles dokument (alle ser).
 */
export async function uploadDocument(formData: FormData): Promise<void> {
  const admin = await requireAdmin()
  if (!admin) return

  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) return

  if (file.size > MAX_BYTES) {
    console.warn('[documents] for stor fil:', file.name, file.size)
    return
  }
  if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
    console.warn('[documents] ikke-tillatt filtype:', file.type)
    return
  }

  const userId = (formData.get('userId') as string) || null
  const categoryRaw = (formData.get('category') as string) ?? 'annet'
  const category: DocumentCategory = isCategory(categoryRaw) ? categoryRaw : 'annet'
  const customName = ((formData.get('name') as string) ?? '').trim()
  const expiresAt = (formData.get('expiresAt') as string) || null

  const safeName = file.name.replace(/[^\w.\-]+/g, '-')
  const key = userId
    ? `documents/user-${userId}/${Date.now()}-${safeName}`
    : `documents/felles/${Date.now()}-${safeName}`

  const blob = await put(key, file, {
    access: 'public', // TODO: bytt til private + signed URLs i Sub-E
    addRandomSuffix: true,
    contentType: file.type,
  })

  await getDb().insert(documents).values({
    userId,
    category,
    name: customName || file.name,
    blobUrl: blob.url,
    mimeType: file.type,
    sizeBytes: file.size,
    uploadedBy: admin.id,
    expiresAt,
  })

  revalidatePath(userId ? `/admin/ansatte/${userId}/dokumenter` : '/admin/dokumenter')
  if (userId) revalidatePath('/profil/dokumenter')
}

export async function deleteDocument(id: string): Promise<void> {
  const admin = await requireAdmin()
  if (!admin) return

  const db = getDb()
  const [doc] = await db.select().from(documents).where(eq(documents.id, id)).limit(1)
  if (!doc) return

  await db.delete(documents).where(eq(documents.id, id))
  try {
    await del(doc.blobUrl)
  } catch (err) {
    console.warn('[documents] kunne ikke slette blob:', err)
  }

  revalidatePath(doc.userId ? `/admin/ansatte/${doc.userId}/dokumenter` : '/admin/dokumenter')
  if (doc.userId) revalidatePath('/profil/dokumenter')
}

/**
 * Hent dokumenter for én bruker (egne + felles).
 */
export async function listDocumentsForUser(userId: string) {
  return getDb()
    .select()
    .from(documents)
    .where(or(eq(documents.userId, userId), isNull(documents.userId)))
    .orderBy(desc(documents.uploadedAt))
}

/**
 * Hent dokumenter for én bruker (kun egne — for admin-visning per ansatt).
 */
export async function listDocumentsByUser(userId: string) {
  return getDb()
    .select()
    .from(documents)
    .where(eq(documents.userId, userId))
    .orderBy(desc(documents.uploadedAt))
}

