import { del, put } from '@vercel/blob'

const MAX_AVATAR_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024 // 25 MB
const ALLOWED_ATTACHMENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'video/mp4',
  'video/quicktime',
  'application/pdf',
] as const

export class BlobValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BlobValidationError'
  }
}

/**
 * Last opp avatar for en bruker. Returnerer den offentlige URL-en.
 * Vil overskrive eksisterende fil med samme key (random suffix forhindrer det).
 */
export async function uploadAvatar(file: File, userId: string): Promise<string> {
  if (file.size > MAX_AVATAR_BYTES) {
    throw new BlobValidationError(
      `Bildet er for stort (maks ${MAX_AVATAR_BYTES / 1024 / 1024} MB).`,
    )
  }
  if (!ALLOWED_AVATAR_TYPES.includes(file.type as (typeof ALLOWED_AVATAR_TYPES)[number])) {
    throw new BlobValidationError('Kun JPG, PNG og WebP er tillatt.')
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
  const key = `avatars/${userId}.${ext}`

  const blob = await put(key, file, {
    access: 'public',
    addRandomSuffix: true,
    contentType: file.type,
  })
  return blob.url
}

/**
 * Last opp et task-vedlegg (bilde, video, PDF). Returnerer URL.
 */
export async function uploadTaskAttachment(
  file: File,
  taskId: string,
): Promise<{ url: string }> {
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new BlobValidationError(
      `Filen er for stor (maks ${MAX_ATTACHMENT_BYTES / 1024 / 1024} MB).`,
    )
  }
  if (
    !ALLOWED_ATTACHMENT_TYPES.includes(
      file.type as (typeof ALLOWED_ATTACHMENT_TYPES)[number],
    )
  ) {
    throw new BlobValidationError(
      'Filtypen støttes ikke. Tillatt: bilder, video (mp4/mov) og PDF.',
    )
  }

  const safeName = file.name.replace(/[^\w.\-]+/g, '-')
  const key = `tasks/${taskId}/${Date.now()}-${safeName}`

  const blob = await put(key, file, {
    access: 'public',
    addRandomSuffix: true,
    contentType: file.type,
  })
  return { url: blob.url }
}

/**
 * Slett en blob via URL. Trygt å kalle på null/undefined.
 */
export async function deleteBlobByUrl(url: string | null | undefined): Promise<void> {
  if (!url) return
  try {
    await del(url)
  } catch (err) {
    // Log men ikke kast — sletting er ofte best-effort.
    console.warn('[blob] kunne ikke slette:', url, err)
  }
}
