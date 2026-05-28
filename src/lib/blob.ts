import { del, put } from '@vercel/blob'

const MAX_AVATAR_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

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
