'use server'

import { desc, eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { getDb } from '@/db'
import {
  sponsorAgreements,
  sponsorCommunications,
  sponsors,
  type SponsorCommType,
  type SponsorStatus,
  type SponsorTier,
} from '@/db/schema'

const TIERS: SponsorTier[] = ['hovedsponsor', 'gull', 'solv', 'partner']
const STATUSES: SponsorStatus[] = ['prospekt', 'aktiv', 'utlopt']
const COMM_TYPES: SponsorCommType[] = ['mote', 'epost', 'telefon', 'annet']

async function requireAdmin(): Promise<string | null> {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') return null
  return session.user.id
}

/**
 * Liste over sponsorer med samlet årlig avtaleverdi.
 */
export async function listSponsors() {
  const db = getDb()
  const rows = await db
    .select({
      id: sponsors.id,
      name: sponsors.name,
      tier: sponsors.tier,
      status: sponsors.status,
      logoUrl: sponsors.logoUrl,
      contactName: sponsors.contactName,
      annualValue: sql<number>`coalesce(sum(${sponsorAgreements.valuePerYear}), 0)`,
      agreementCount: sql<number>`count(${sponsorAgreements.id})`,
    })
    .from(sponsors)
    .leftJoin(sponsorAgreements, eq(sponsorAgreements.sponsorId, sponsors.id))
    .groupBy(sponsors.id)
    .orderBy(desc(sql`coalesce(sum(${sponsorAgreements.valuePerYear}), 0)`))
  return rows
}

/**
 * Nøkkeltall til oversikten.
 */
export async function sponsorStats() {
  const db = getDb()
  const [stats] = await db
    .select({
      total: sql<number>`count(distinct ${sponsors.id})`,
      active: sql<number>`count(distinct ${sponsors.id}) filter (where ${sponsors.status} = 'aktiv')`,
    })
    .from(sponsors)

  const [value] = await db
    .select({
      totalValue: sql<number>`coalesce(sum(${sponsorAgreements.valuePerYear}), 0)`,
      expiringSoon: sql<number>`count(*) filter (where ${sponsorAgreements.endDate} is not null and ${sponsorAgreements.endDate} <= current_date + interval '60 days' and ${sponsorAgreements.endDate} >= current_date)`,
    })
    .from(sponsorAgreements)

  return {
    total: Number(stats?.total ?? 0),
    active: Number(stats?.active ?? 0),
    totalValue: Number(value?.totalValue ?? 0),
    expiringSoon: Number(value?.expiringSoon ?? 0),
  }
}

export async function getSponsor(id: string) {
  const db = getDb()
  const [sponsor] = await db.select().from(sponsors).where(eq(sponsors.id, id)).limit(1)
  if (!sponsor) return null
  const [agreements, communications] = await Promise.all([
    db
      .select()
      .from(sponsorAgreements)
      .where(eq(sponsorAgreements.sponsorId, id))
      .orderBy(desc(sponsorAgreements.endDate)),
    db
      .select()
      .from(sponsorCommunications)
      .where(eq(sponsorCommunications.sponsorId, id))
      .orderBy(desc(sponsorCommunications.occurredAt)),
  ])
  return { sponsor, agreements, communications }
}

// ============================================================
// Mutations
// ============================================================

export async function createSponsor(formData: FormData): Promise<void> {
  const adminId = await requireAdmin()
  if (!adminId) return
  const name = ((formData.get('name') as string) ?? '').trim()
  if (!name) return
  const tierRaw = (formData.get('tier') as string) ?? 'partner'
  const statusRaw = (formData.get('status') as string) ?? 'aktiv'

  await getDb().insert(sponsors).values({
    name,
    tier: (TIERS as string[]).includes(tierRaw) ? (tierRaw as SponsorTier) : 'partner',
    status: (STATUSES as string[]).includes(statusRaw)
      ? (statusRaw as SponsorStatus)
      : 'aktiv',
    website: ((formData.get('website') as string) ?? '').trim() || null,
    contactName: ((formData.get('contactName') as string) ?? '').trim() || null,
    contactEmail: ((formData.get('contactEmail') as string) ?? '').trim() || null,
    contactPhone: ((formData.get('contactPhone') as string) ?? '').trim() || null,
    notes: ((formData.get('notes') as string) ?? '').trim() || null,
    createdBy: adminId,
  })
  revalidatePath('/admin/sponsorer')
}

export async function updateSponsor(id: string, formData: FormData): Promise<void> {
  const adminId = await requireAdmin()
  if (!adminId) return
  const tierRaw = (formData.get('tier') as string) ?? 'partner'
  const statusRaw = (formData.get('status') as string) ?? 'aktiv'

  await getDb()
    .update(sponsors)
    .set({
      name: ((formData.get('name') as string) ?? '').trim() || 'Uten navn',
      tier: (TIERS as string[]).includes(tierRaw) ? (tierRaw as SponsorTier) : 'partner',
      status: (STATUSES as string[]).includes(statusRaw)
        ? (statusRaw as SponsorStatus)
        : 'aktiv',
      website: ((formData.get('website') as string) ?? '').trim() || null,
      contactName: ((formData.get('contactName') as string) ?? '').trim() || null,
      contactEmail: ((formData.get('contactEmail') as string) ?? '').trim() || null,
      contactPhone: ((formData.get('contactPhone') as string) ?? '').trim() || null,
      notes: ((formData.get('notes') as string) ?? '').trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(sponsors.id, id))
  revalidatePath(`/admin/sponsorer/${id}`)
  revalidatePath('/admin/sponsorer')
}

export async function deleteSponsor(id: string): Promise<void> {
  const adminId = await requireAdmin()
  if (!adminId) return
  await getDb().delete(sponsors).where(eq(sponsors.id, id))
  revalidatePath('/admin/sponsorer')
}

export async function createAgreement(
  sponsorId: string,
  formData: FormData,
): Promise<void> {
  const adminId = await requireAdmin()
  if (!adminId) return
  const title = ((formData.get('title') as string) ?? '').trim()
  if (!title) return
  const value = Number(formData.get('valuePerYear') ?? 0)

  await getDb().insert(sponsorAgreements).values({
    sponsorId,
    title,
    valuePerYear: Number.isFinite(value) ? Math.round(value) : 0,
    startDate: (formData.get('startDate') as string) || null,
    endDate: (formData.get('endDate') as string) || null,
    deliverables: ((formData.get('deliverables') as string) ?? '').trim() || null,
  })
  revalidatePath(`/admin/sponsorer/${sponsorId}`)
  revalidatePath('/admin/sponsorer')
}

export async function deleteAgreement(
  id: string,
  sponsorId: string,
): Promise<void> {
  const adminId = await requireAdmin()
  if (!adminId) return
  await getDb().delete(sponsorAgreements).where(eq(sponsorAgreements.id, id))
  revalidatePath(`/admin/sponsorer/${sponsorId}`)
  revalidatePath('/admin/sponsorer')
}

export async function logCommunication(
  sponsorId: string,
  formData: FormData,
): Promise<void> {
  const adminId = await requireAdmin()
  if (!adminId) return
  const summary = ((formData.get('summary') as string) ?? '').trim()
  if (!summary) return
  const typeRaw = (formData.get('type') as string) ?? 'annet'

  await getDb().insert(sponsorCommunications).values({
    sponsorId,
    type: (COMM_TYPES as string[]).includes(typeRaw)
      ? (typeRaw as SponsorCommType)
      : 'annet',
    summary,
    occurredAt:
      (formData.get('occurredAt') as string) ||
      new Date().toISOString().slice(0, 10),
    followUpDate: (formData.get('followUpDate') as string) || null,
    createdBy: adminId,
  })
  revalidatePath(`/admin/sponsorer/${sponsorId}`)
}

export async function deleteCommunication(
  id: string,
  sponsorId: string,
): Promise<void> {
  const adminId = await requireAdmin()
  if (!adminId) return
  await getDb().delete(sponsorCommunications).where(eq(sponsorCommunications.id, id))
  revalidatePath(`/admin/sponsorer/${sponsorId}`)
}
