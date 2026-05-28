'use server'

import { and, eq, gte, lte } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { getDb } from '@/db'
import { activities, type ActivityType } from '@/db/schema'

const VALID_TYPES: ActivityType[] = ['turnering', 'kurs', 'intern', 'sosial']

function isType(t: string): t is ActivityType {
  return (VALID_TYPES as string[]).includes(t)
}

async function requireAdmin(): Promise<{ id: string } | null> {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') return null
  return { id: session.user.id }
}

export async function createActivity(formData: FormData): Promise<void> {
  const admin = await requireAdmin()
  if (!admin) return

  const title = ((formData.get('title') as string) ?? '').trim()
  const description = ((formData.get('description') as string) ?? '').trim() || null
  const typeRaw = (formData.get('type') as string) ?? 'intern'
  const type: ActivityType = isType(typeRaw) ? typeRaw : 'intern'
  const startAtRaw = (formData.get('startAt') as string) || null
  const endAtRaw = (formData.get('endAt') as string) || null
  const location = ((formData.get('location') as string) ?? '').trim() || null
  const url = ((formData.get('url') as string) ?? '').trim() || null

  if (!title || !startAtRaw || !endAtRaw) return

  const startAt = new Date(startAtRaw)
  const endAt = new Date(endAtRaw)
  if (endAt < startAt) return

  await getDb().insert(activities).values({
    title,
    description,
    type,
    source: 'gfgk',
    startAt,
    endAt,
    location,
    url,
    createdBy: admin.id,
  })

  revalidatePath('/admin/aktiviteter')
  revalidatePath('/kalender')
}

export async function updateActivity(id: string, formData: FormData): Promise<void> {
  const admin = await requireAdmin()
  if (!admin) return

  const title = ((formData.get('title') as string) ?? '').trim()
  const description = ((formData.get('description') as string) ?? '').trim() || null
  const typeRaw = (formData.get('type') as string) ?? 'intern'
  const type: ActivityType = isType(typeRaw) ? typeRaw : 'intern'
  const startAtRaw = (formData.get('startAt') as string) || null
  const endAtRaw = (formData.get('endAt') as string) || null
  const location = ((formData.get('location') as string) ?? '').trim() || null
  const url = ((formData.get('url') as string) ?? '').trim() || null

  if (!title || !startAtRaw || !endAtRaw) return

  await getDb()
    .update(activities)
    .set({
      title,
      description,
      type,
      startAt: new Date(startAtRaw),
      endAt: new Date(endAtRaw),
      location,
      url,
    })
    .where(eq(activities.id, id))

  revalidatePath('/admin/aktiviteter')
  revalidatePath('/kalender')
}

export async function deleteActivity(id: string): Promise<void> {
  const admin = await requireAdmin()
  if (!admin) return

  await getDb().delete(activities).where(eq(activities.id, id))
  revalidatePath('/admin/aktiviteter')
  revalidatePath('/kalender')
}

/**
 * Hent aktiviteter i et datointervall.
 */
export async function listActivities(opts: {
  from: Date
  to: Date
  type?: ActivityType
}) {
  const conditions = [
    gte(activities.startAt, opts.from),
    lte(activities.startAt, opts.to),
  ]
  if (opts.type) conditions.push(eq(activities.type, opts.type))

  return getDb()
    .select()
    .from(activities)
    .where(and(...conditions))
    .orderBy(activities.startAt)
}

/**
 * Importer aktiviteter fra CSV. Forventer header: title,type,start_at,end_at,location.
 * type må være en av: turnering|kurs|intern|sosial. start_at/end_at i ISO 8601.
 */
export async function importActivitiesCsv(formData: FormData): Promise<{
  imported: number
  errors: string[]
}> {
  const admin = await requireAdmin()
  if (!admin) return { imported: 0, errors: ['Ikke autorisert'] }

  const file = formData.get('file')
  if (!(file instanceof File)) return { imported: 0, errors: ['Mangler fil'] }

  const text = await file.text()
  const lines = text.split('\n').filter((l) => l.trim().length > 0)
  if (lines.length < 2) return { imported: 0, errors: ['Tom CSV'] }

  const header = parseCsvLine(lines[0] ?? '')
  const titleIdx = header.indexOf('title')
  const typeIdx = header.indexOf('type')
  const startIdx = header.indexOf('start_at')
  const endIdx = header.indexOf('end_at')
  const locationIdx = header.indexOf('location')

  if (titleIdx === -1 || startIdx === -1 || endIdx === -1) {
    return { imported: 0, errors: ['Mangler kolonner: title, start_at, end_at'] }
  }

  const errors: string[] = []
  const inserts: Array<typeof activities.$inferInsert> = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line) continue
    const parts = parseCsvLine(line)
    const title = parts[titleIdx]?.trim()
    const typeRaw = typeIdx >= 0 ? parts[typeIdx]?.trim() : 'intern'
    const type: ActivityType = isType(typeRaw ?? '') ? (typeRaw as ActivityType) : 'intern'
    const startStr = parts[startIdx]?.trim()
    const endStr = parts[endIdx]?.trim()
    const location = locationIdx >= 0 ? parts[locationIdx]?.trim() || null : null

    if (!title || !startStr || !endStr) {
      errors.push(`Linje ${i + 1}: mangler felt`)
      continue
    }
    const startAt = new Date(startStr)
    const endAt = new Date(endStr)
    if (isNaN(startAt.getTime()) || isNaN(endAt.getTime())) {
      errors.push(`Linje ${i + 1}: ugyldig dato`)
      continue
    }

    inserts.push({
      title,
      type,
      source: 'ak_golf',
      startAt,
      endAt,
      location,
      createdBy: admin.id,
    })
  }

  if (inserts.length === 0) return { imported: 0, errors }

  await getDb().insert(activities).values(inserts)
  revalidatePath('/admin/aktiviteter')
  revalidatePath('/kalender')
  return { imported: inserts.length, errors }
}

function parseCsvLine(line: string): string[] {
  // Enkel CSV-parser med støtte for sitater
  const out: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  out.push(current)
  return out.map((s) => s.replace(/\r$/, ''))
}
