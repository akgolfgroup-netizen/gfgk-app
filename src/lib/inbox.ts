'use server'

import { desc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { getDb } from '@/db'
import {
  inboxMessages,
  inboxSkills,
  type InboxStatus,
} from '@/db/schema'
import { sendEmail } from '@/lib/email'

async function requireAdmin(): Promise<{ id: string } | null> {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') return null
  return { id: session.user.id }
}

/**
 * Ingest webhook-helper. Lagrer melding i inbox_messages. Returnerer
 * meldings-ID slik at webhook kan trigge ensureDraftFor i bakgrunnen.
 */
export async function ingestInboundMessage(input: {
  externalId: string
  fromEmail: string
  fromName: string | null
  toEmail: string
  subject: string
  bodyText: string | null
  bodyHtml: string | null
  receivedAt: Date
  threadId: string | null
}): Promise<{ id: string; isNew: boolean } | null> {
  const db = getDb()

  // Idempotent — sjekk om vi allerede har denne external-id
  const [existing] = await db
    .select({ id: inboxMessages.id })
    .from(inboxMessages)
    .where(eq(inboxMessages.externalId, input.externalId))
    .limit(1)

  if (existing) return { id: existing.id, isNew: false }

  const [created] = await db
    .insert(inboxMessages)
    .values({
      externalId: input.externalId,
      fromEmail: input.fromEmail,
      fromName: input.fromName,
      toEmail: input.toEmail,
      subject: input.subject,
      bodyText: input.bodyText,
      bodyHtml: input.bodyHtml,
      receivedAt: input.receivedAt,
      threadId: input.threadId,
      status: 'new',
    })
    .returning({ id: inboxMessages.id })

  if (!created) return null
  return { id: created.id, isNew: true }
}

export async function listInbox(filter?: { status?: InboxStatus }) {
  const db = getDb()
  return db
    .select()
    .from(inboxMessages)
    .where(filter?.status ? eq(inboxMessages.status, filter.status) : undefined)
    .orderBy(desc(inboxMessages.receivedAt))
    .limit(200)
}

export async function getInboxMessage(id: string) {
  const [msg] = await getDb()
    .select()
    .from(inboxMessages)
    .where(eq(inboxMessages.id, id))
    .limit(1)
  return msg ?? null
}

/**
 * Send svar via Resend. Bruker eksisterende sendEmail() med tråd-håndtering
 * via Re: i emne.
 */
export async function sendInboxReply(id: string, formData: FormData): Promise<void> {
  const admin = await requireAdmin()
  if (!admin) return

  const body = ((formData.get('body') as string) ?? '').trim()
  if (!body) return

  const db = getDb()
  const [msg] = await db
    .select()
    .from(inboxMessages)
    .where(eq(inboxMessages.id, id))
    .limit(1)
  if (!msg) return

  const replySubject = msg.subject.toLowerCase().startsWith('re:')
    ? msg.subject
    : `Re: ${msg.subject}`

  const html = `<div style="font-family: -apple-system, sans-serif; max-width: 600px; padding: 16px; white-space: pre-wrap; line-height: 1.5; color: #1B1B1B;">${escapeHtml(
    body,
  )}</div>`

  await sendEmail({
    to: msg.fromEmail,
    subject: replySubject,
    html,
  })

  await db
    .update(inboxMessages)
    .set({
      status: 'sent',
      sentAt: new Date(),
      sentBy: admin.id,
      aiDraft: body, // lagre faktisk sendt versjon
    })
    .where(eq(inboxMessages.id, id))

  revalidatePath('/admin/inbox')
  revalidatePath(`/admin/inbox/${id}`)
}

export async function markAsManual(id: string): Promise<void> {
  const admin = await requireAdmin()
  if (!admin) return

  await getDb()
    .update(inboxMessages)
    .set({ status: 'manual' })
    .where(eq(inboxMessages.id, id))

  revalidatePath('/admin/inbox')
  revalidatePath(`/admin/inbox/${id}`)
}

export async function archiveInboxMessage(id: string): Promise<void> {
  const admin = await requireAdmin()
  if (!admin) return

  await getDb()
    .update(inboxMessages)
    .set({ status: 'archived' })
    .where(eq(inboxMessages.id, id))

  revalidatePath('/admin/inbox')
}

// ============================================================
// Skills CRUD
// ============================================================

export async function createInboxSkill(formData: FormData): Promise<void> {
  const admin = await requireAdmin()
  if (!admin) return

  const name = ((formData.get('name') as string) ?? '').trim()
  const description = ((formData.get('description') as string) ?? '').trim()
  const prompt = ((formData.get('prompt') as string) ?? '').trim()
  const exampleResponse =
    ((formData.get('exampleResponse') as string) ?? '').trim() || null

  if (!name || !description || !prompt) return

  await getDb().insert(inboxSkills).values({
    name,
    description,
    prompt,
    exampleResponse,
  })

  revalidatePath('/admin/innstillinger/ai-skills')
}

export async function deleteInboxSkill(id: string): Promise<void> {
  const admin = await requireAdmin()
  if (!admin) return

  await getDb().delete(inboxSkills).where(eq(inboxSkills.id, id))
  revalidatePath('/admin/innstillinger/ai-skills')
}

export async function listInboxSkills() {
  return getDb().select().from(inboxSkills).orderBy(inboxSkills.name)
}

// ============================================================
// Helpers
// ============================================================

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

