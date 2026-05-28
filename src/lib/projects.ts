'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getDb } from '@/db'
import {
  projectMembers,
  projects,
  type ProjectCover,
  type ProjectStatus,
} from '@/db/schema'

const VALID_STATUSES: ProjectStatus[] = ['aktiv', 'fullfort', 'pause', 'arkivert']
const VALID_COVERS: ProjectCover[] = ['gold', 'teal', 'red', 'black']

function isStatus(s: string): s is ProjectStatus {
  return (VALID_STATUSES as string[]).includes(s)
}

function isCover(c: string): c is ProjectCover {
  return (VALID_COVERS as string[]).includes(c)
}

/**
 * Opprett nytt prosjekt. Skaperen blir automatisk eier.
 */
export async function createProject(formData: FormData): Promise<void> {
  const session = await auth()
  if (!session?.user) return

  const name = ((formData.get('name') as string) ?? '').trim()
  const description = ((formData.get('description') as string) ?? '').trim() || null
  const deadline = (formData.get('deadline') as string) || null
  const coverRaw = (formData.get('coverColor') as string) ?? 'gold'
  const coverColor: ProjectCover = isCover(coverRaw) ? coverRaw : 'gold'

  if (!name) return

  const db = getDb()
  const [created] = await db
    .insert(projects)
    .values({
      name,
      description,
      deadline,
      coverColor,
      createdBy: session.user.id,
      updatedBy: session.user.id,
    })
    .returning({ id: projects.id })

  if (created) {
    await db.insert(projectMembers).values({
      projectId: created.id,
      userId: session.user.id,
      role: 'eier',
    })
  }

  revalidatePath('/prosjekter')
}

/**
 * Oppdater prosjekt-metadata. Bare medlemmer kan endre.
 */
export async function updateProject(id: string, formData: FormData): Promise<void> {
  const session = await auth()
  if (!session?.user) return

  const db = getDb()
  const isMember = await userIsMember(id, session.user.id)
  if (!isMember) return

  const name = ((formData.get('name') as string) ?? '').trim()
  const description = ((formData.get('description') as string) ?? '').trim() || null
  const deadline = (formData.get('deadline') as string) || null
  const coverRaw = (formData.get('coverColor') as string) ?? 'gold'
  const coverColor: ProjectCover = isCover(coverRaw) ? coverRaw : 'gold'
  const statusRaw = (formData.get('status') as string) ?? 'aktiv'
  const status: ProjectStatus = isStatus(statusRaw) ? statusRaw : 'aktiv'

  if (!name) return

  await db
    .update(projects)
    .set({
      name,
      description,
      deadline,
      coverColor,
      status,
      updatedAt: new Date(),
      updatedBy: session.user.id,
    })
    .where(eq(projects.id, id))

  revalidatePath('/prosjekter')
  revalidatePath(`/prosjekter/${id}`)
}

/**
 * Sett prosjekt-status (raskere kall enn full updateProject).
 */
export async function setProjectStatus(id: string, status: ProjectStatus): Promise<void> {
  const session = await auth()
  if (!session?.user) return
  if (!VALID_STATUSES.includes(status)) return

  if (!(await userIsMember(id, session.user.id))) return

  await getDb()
    .update(projects)
    .set({ status, updatedAt: new Date(), updatedBy: session.user.id })
    .where(eq(projects.id, id))

  revalidatePath('/prosjekter')
  revalidatePath(`/prosjekter/${id}`)
}

/**
 * Arkiver prosjekt (status = 'arkivert'). Eier-only.
 */
export async function archiveProject(id: string): Promise<void> {
  const session = await auth()
  if (!session?.user) return

  const isOwner = await userIsOwner(id, session.user.id)
  if (!isOwner) return

  await getDb()
    .update(projects)
    .set({ status: 'arkivert', updatedAt: new Date(), updatedBy: session.user.id })
    .where(eq(projects.id, id))

  revalidatePath('/prosjekter')
}

/**
 * Slett prosjekt permanent. Eier-only. Sletter også alle tasks/medlemskap (cascade).
 */
export async function deleteProject(id: string): Promise<void> {
  const session = await auth()
  if (!session?.user) return

  const isOwner = await userIsOwner(id, session.user.id)
  if (!isOwner) return

  await getDb().delete(projects).where(eq(projects.id, id))

  revalidatePath('/prosjekter')
  redirect('/prosjekter')
}

/**
 * Legg til et medlem i prosjektet.
 */
export async function addProjectMember(
  projectId: string,
  userId: string,
): Promise<void> {
  const session = await auth()
  if (!session?.user) return

  if (!(await userIsMember(projectId, session.user.id))) return

  await getDb()
    .insert(projectMembers)
    .values({ projectId, userId, role: 'medlem' })
    .onConflictDoNothing()

  revalidatePath(`/prosjekter/${projectId}`)
}

/**
 * Fjern et medlem fra prosjektet. Eier-only. Kan ikke fjerne den siste eieren.
 */
export async function removeProjectMember(
  projectId: string,
  userId: string,
): Promise<void> {
  const session = await auth()
  if (!session?.user) return

  if (!(await userIsOwner(projectId, session.user.id))) return

  // Beskytt mot å fjerne siste eier
  const db = getDb()
  const owners = await db
    .select({ userId: projectMembers.userId })
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.role, 'eier')))

  const targetIsOwner = owners.some((o) => o.userId === userId)
  if (targetIsOwner && owners.length === 1) return

  await db
    .delete(projectMembers)
    .where(
      and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)),
    )

  revalidatePath(`/prosjekter/${projectId}`)
}

// ============================================================
// Helpers (eksportert kun for testing — server-only)
// ============================================================

async function userIsMember(projectId: string, userId: string): Promise<boolean> {
  const [row] = await getDb()
    .select({ userId: projectMembers.userId })
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
    .limit(1)
  return Boolean(row)
}

async function userIsOwner(projectId: string, userId: string): Promise<boolean> {
  const [row] = await getDb()
    .select({ role: projectMembers.role })
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
    .limit(1)
  return row?.role === 'eier'
}
