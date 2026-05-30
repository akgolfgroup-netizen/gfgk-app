'use server'

import { and, asc, eq, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getDb } from '@/db'
import {
  checklistItems,
  checklistRunItems,
  checklistRuns,
  checklists,
  type ChecklistRepeat,
} from '@/db/schema'
import { toDateString } from '@/lib/dates'

const VALID_REPEATS: ChecklistRepeat[] = ['daglig', 'ukentlig', 'manedlig']
const VALID_WEEKDAYS = ['man', 'tir', 'ons', 'tor', 'fre', 'lor', 'son'] as const
type Weekday = (typeof VALID_WEEKDAYS)[number]

function isRepeat(s: string): s is ChecklistRepeat {
  return (VALID_REPEATS as string[]).includes(s)
}

async function requireAdmin(): Promise<{ id: string } | null> {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') return null
  return { id: session.user.id }
}

/**
 * Opprett sjekkliste med items i én operasjon.
 * formData: name, description, repeat, weekdays[], assignedRole, items[] (newline-separert)
 */
export async function createChecklist(formData: FormData): Promise<void> {
  const admin = await requireAdmin()
  if (!admin) return

  const name = ((formData.get('name') as string) ?? '').trim()
  const description = ((formData.get('description') as string) ?? '').trim() || null
  const repeatRaw = (formData.get('repeat') as string) ?? 'daglig'
  const repeat = isRepeat(repeatRaw) ? repeatRaw : 'daglig'

  const weekdaysRaw = formData.getAll('weekdays').filter((v): v is string => typeof v === 'string')
  const weekdays = weekdaysRaw.filter((w): w is Weekday =>
    (VALID_WEEKDAYS as readonly string[]).includes(w),
  )

  const role = (formData.get('assignedRole') as string) ?? 'ansatt'
  const assignedRole: 'ansatt' | 'admin' | 'alle' =
    role === 'admin' || role === 'alle' ? role : 'ansatt'

  const articleId = (formData.get('articleId') as string) || null

  const itemsRaw = ((formData.get('items') as string) ?? '').trim()
  const itemTitles = itemsRaw
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)

  if (!name || itemTitles.length === 0) return

  const db = getDb()
  const [created] = await db
    .insert(checklists)
    .values({
      name,
      description,
      repeat,
      weekdays: repeat === 'ukentlig' ? weekdays : null,
      assignedRole,
      articleId,
      createdBy: admin.id,
    })
    .returning({ id: checklists.id })

  if (created) {
    await db.insert(checklistItems).values(
      itemTitles.map((title, i) => ({
        checklistId: created.id,
        title,
        orderIndex: i,
      })),
    )
  }

  revalidatePath('/admin/sjekklister')
  revalidatePath('/sjekklister')
  revalidatePath('/dashboard')
}

export async function deleteChecklist(id: string): Promise<void> {
  const admin = await requireAdmin()
  if (!admin) return

  await getDb().delete(checklists).where(eq(checklists.id, id))
  revalidatePath('/admin/sjekklister')
  redirect('/admin/sjekklister')
}

/**
 * Huk av eller fjern huk på et item i en run.
 */
export async function toggleChecklistItem(runItemId: string): Promise<void> {
  const session = await auth()
  if (!session?.user) return

  const db = getDb()
  const [item] = await db
    .select({ id: checklistRunItems.id, done: checklistRunItems.done })
    .from(checklistRunItems)
    .where(eq(checklistRunItems.id, runItemId))
    .limit(1)

  if (!item) return

  if (item.done) {
    await db
      .update(checklistRunItems)
      .set({ done: false, doneAt: null, doneBy: null })
      .where(eq(checklistRunItems.id, runItemId))
  } else {
    await db
      .update(checklistRunItems)
      .set({ done: true, doneAt: new Date(), doneBy: session.user.id })
      .where(eq(checklistRunItems.id, runItemId))
  }

  revalidatePath('/sjekklister')
  revalidatePath('/dashboard')
}

/**
 * Generer dagens checklist_runs (kalt fra cron eller manuelt).
 * Idempotent: hvis run allerede finnes for (checklist, dato), gjør ingenting.
 */
export async function generateChecklistRunsForToday(): Promise<{ created: number }> {
  const db = getDb()
  const today = toDateString(new Date())
  const weekday: Weekday = ['son', 'man', 'tir', 'ons', 'tor', 'fre', 'lor'][
    new Date().getDay()
  ] as Weekday

  const all = await db.select().from(checklists)

  const candidates = all.filter((c) => {
    if (c.repeat === 'daglig') return true
    if (c.repeat === 'ukentlig') return c.weekdays?.includes(weekday) ?? false
    if (c.repeat === 'manedlig') {
      const day = new Date().getDate()
      return day === 1
    }
    return false
  })

  if (candidates.length === 0) return { created: 0 }

  // Sjekk hvilke som allerede har run for i dag
  const existing = await db
    .select({ checklistId: checklistRuns.checklistId })
    .from(checklistRuns)
    .where(
      and(
        inArray(
          checklistRuns.checklistId,
          candidates.map((c) => c.id),
        ),
        eq(checklistRuns.date, today),
      ),
    )
  const existingIds = new Set(existing.map((e) => e.checklistId))

  const toCreate = candidates.filter((c) => !existingIds.has(c.id))
  if (toCreate.length === 0) return { created: 0 }

  // Opprett runs
  const createdRuns = await db
    .insert(checklistRuns)
    .values(toCreate.map((c) => ({ checklistId: c.id, date: today })))
    .returning({ id: checklistRuns.id, checklistId: checklistRuns.checklistId })

  // Opprett run_items for hver run (basert på checklist_items)
  for (const run of createdRuns) {
    const items = await db
      .select({ id: checklistItems.id })
      .from(checklistItems)
      .where(eq(checklistItems.checklistId, run.checklistId))
      .orderBy(asc(checklistItems.orderIndex))

    if (items.length > 0) {
      await db.insert(checklistRunItems).values(
        items.map((i) => ({
          runId: run.id,
          itemId: i.id,
        })),
      )
    }
  }

  return { created: createdRuns.length }
}
