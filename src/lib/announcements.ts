'use server'

import { and, desc, eq, gt, isNull, or, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getDb } from '@/db'
import {
  announcementReads,
  announcements,
  type AnnouncementAudience,
  type Role,
} from '@/db/schema'

const VALID_AUDIENCE: AnnouncementAudience[] = ['alle', 'admin', 'ansatt']

function isAudience(a: string): a is AnnouncementAudience {
  return (VALID_AUDIENCE as string[]).includes(a)
}

async function requireAdmin(): Promise<{ id: string } | null> {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') return null
  return { id: session.user.id }
}

export async function createAnnouncement(formData: FormData): Promise<void> {
  const admin = await requireAdmin()
  if (!admin) return

  const title = ((formData.get('title') as string) ?? '').trim()
  const body = ((formData.get('body') as string) ?? '').trim()
  const audienceRaw = (formData.get('audience') as string) ?? 'alle'
  const audience: AnnouncementAudience = isAudience(audienceRaw) ? audienceRaw : 'alle'
  const pinned = formData.get('pinned') === 'on'
  const expiresAtRaw = (formData.get('expiresAt') as string) || null
  const expiresAt = expiresAtRaw ? new Date(expiresAtRaw) : null

  if (!title || !body) return

  await getDb().insert(announcements).values({
    title,
    body,
    audience,
    pinned,
    expiresAt,
    createdBy: admin.id,
  })

  revalidatePath('/dashboard')
  revalidatePath('/admin/annonseringer')
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const admin = await requireAdmin()
  if (!admin) return

  await getDb().delete(announcements).where(eq(announcements.id, id))
  revalidatePath('/dashboard')
  revalidatePath('/admin/annonseringer')
  redirect('/admin/annonseringer')
}

export async function markAnnouncementRead(id: string): Promise<void> {
  const session = await auth()
  if (!session?.user) return

  await getDb()
    .insert(announcementReads)
    .values({ announcementId: id, userId: session.user.id })
    .onConflictDoNothing()

  revalidatePath('/dashboard')
}

/**
 * Hent uleste annonseringer for bruker (basert på rolle og audience).
 */
export async function getUnreadAnnouncements(userId: string, role: Role) {
  const db = getDb()
  const now = new Date()

  return db
    .select({
      id: announcements.id,
      title: announcements.title,
      body: announcements.body,
      pinned: announcements.pinned,
      createdAt: announcements.createdAt,
      readAt: announcementReads.readAt,
    })
    .from(announcements)
    .leftJoin(
      announcementReads,
      and(
        eq(announcementReads.announcementId, announcements.id),
        eq(announcementReads.userId, userId),
      ),
    )
    .where(
      and(
        or(isNull(announcements.expiresAt), gt(announcements.expiresAt, now)),
        or(
          eq(announcements.audience, 'alle'),
          eq(announcements.audience, role),
        ),
        // Vis hvis ulest, ELLER pinned (pinned vises til alle har lest)
        or(
          isNull(announcementReads.readAt),
          and(
            eq(announcements.pinned, true),
            sql`true`, // alltid vis pinned
          ),
        ),
      ),
    )
    .orderBy(desc(announcements.pinned), desc(announcements.createdAt))
}

/**
 * Bare uleste (for banner). Pinned vises alltid.
 */
export async function getDashboardBannerItems(userId: string, role: Role) {
  const db = getDb()
  const now = new Date()

  return db
    .select({
      id: announcements.id,
      title: announcements.title,
      body: announcements.body,
      pinned: announcements.pinned,
      createdAt: announcements.createdAt,
      readAt: announcementReads.readAt,
    })
    .from(announcements)
    .leftJoin(
      announcementReads,
      and(
        eq(announcementReads.announcementId, announcements.id),
        eq(announcementReads.userId, userId),
      ),
    )
    .where(
      and(
        or(isNull(announcements.expiresAt), gt(announcements.expiresAt, now)),
        or(eq(announcements.audience, 'alle'), eq(announcements.audience, role)),
        or(isNull(announcementReads.readAt), eq(announcements.pinned, true)),
      ),
    )
    .orderBy(desc(announcements.pinned), desc(announcements.createdAt))
}

