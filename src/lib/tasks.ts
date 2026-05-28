'use server'

import { and, asc, eq, inArray, isNull, max } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getDb } from '@/db'
import {
  attachments,
  projectMembers,
  taskAssignees,
  taskComments,
  tasks,
  users,
  type TaskPriority,
  type TaskStatus,
} from '@/db/schema'
import { deleteBlobByUrl, uploadTaskAttachment } from '@/lib/blob'
import { sendEmail, taskAssignedEmailHtml } from '@/lib/email'

const VALID_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'waiting', 'done']
const VALID_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high']

function isStatus(s: string): s is TaskStatus {
  return (VALID_STATUSES as string[]).includes(s)
}
function isPriority(p: string): p is TaskPriority {
  return (VALID_PRIORITIES as string[]).includes(p)
}

async function userCanAccessTask(taskId: string, userId: string): Promise<boolean> {
  const db = getDb()
  const [task] = await db
    .select({ projectId: tasks.projectId, createdBy: tasks.createdBy })
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1)
  if (!task) return false

  // Standalone task (uten prosjekt): bare skaperen
  if (!task.projectId) return task.createdBy === userId

  // Med prosjekt: alle medlemmer
  const [member] = await db
    .select({ userId: projectMembers.userId })
    .from(projectMembers)
    .where(
      and(
        eq(projectMembers.projectId, task.projectId),
        eq(projectMembers.userId, userId),
      ),
    )
    .limit(1)
  return Boolean(member)
}

// ============================================================
// CRUD
// ============================================================

/**
 * Opprett oppgave. ProjectId er valgfri — uten = personlig oppgave.
 */
export async function createTask(formData: FormData): Promise<void> {
  const session = await auth()
  if (!session?.user) return

  const title = ((formData.get('title') as string) ?? '').trim()
  const projectId = (formData.get('projectId') as string) || null
  const parentId = (formData.get('parentId') as string) || null
  const description = ((formData.get('description') as string) ?? '').trim() || null
  const dueDate = (formData.get('dueDate') as string) || null
  const priorityRaw = (formData.get('priority') as string) ?? 'medium'
  const priority: TaskPriority = isPriority(priorityRaw) ? priorityRaw : 'medium'

  if (!title) return

  // Beregn order_index = max + 1 innenfor samme parent/projekt
  const db = getDb()
  const [maxRow] = await db
    .select({ maxOrder: max(tasks.orderIndex) })
    .from(tasks)
    .where(
      parentId
        ? eq(tasks.parentId, parentId)
        : projectId
          ? and(eq(tasks.projectId, projectId), isNull(tasks.parentId))
          : eq(tasks.createdBy, session.user.id),
    )
  const orderIndex = (maxRow?.maxOrder ?? -1) + 1

  await db.insert(tasks).values({
    title,
    projectId,
    parentId,
    description,
    dueDate,
    priority,
    orderIndex,
    createdBy: session.user.id,
    updatedBy: session.user.id,
  })

  revalidatePath('/oppgaver')
  if (projectId) revalidatePath(`/prosjekter/${projectId}`)
}

/**
 * Oppdater én eller flere felter på oppgaven.
 * Bruk null-strenger ('') for å nullstille tekst-felter.
 */
export async function updateTask(id: string, formData: FormData): Promise<void> {
  const session = await auth()
  if (!session?.user) return
  if (!(await userCanAccessTask(id, session.user.id))) return

  const updates: Partial<typeof tasks.$inferInsert> = {
    updatedAt: new Date(),
    updatedBy: session.user.id,
  }

  if (formData.has('title')) {
    const t = ((formData.get('title') as string) ?? '').trim()
    if (t) updates.title = t
  }
  if (formData.has('description')) {
    const d = ((formData.get('description') as string) ?? '').trim()
    updates.description = d || null
  }
  if (formData.has('status')) {
    const s = (formData.get('status') as string) ?? 'todo'
    if (isStatus(s)) updates.status = s
  }
  if (formData.has('priority')) {
    const p = (formData.get('priority') as string) ?? 'medium'
    if (isPriority(p)) updates.priority = p
  }
  if (formData.has('dueDate')) {
    const v = (formData.get('dueDate') as string) ?? ''
    updates.dueDate = v || null
  }
  if (formData.has('startAt')) {
    const v = (formData.get('startAt') as string) ?? ''
    updates.startAt = v ? new Date(v) : null
  }
  if (formData.has('endAt')) {
    const v = (formData.get('endAt') as string) ?? ''
    updates.endAt = v ? new Date(v) : null
  }

  await getDb().update(tasks).set(updates).where(eq(tasks.id, id))

  revalidatePath(`/oppgaver/${id}`)
  revalidatePath('/oppgaver')
}

/**
 * Sett status og/eller flytt rekkefølge.
 */
export async function moveTask(
  id: string,
  newStatus: TaskStatus | null,
  newOrderIndex: number | null,
): Promise<void> {
  const session = await auth()
  if (!session?.user) return
  if (!(await userCanAccessTask(id, session.user.id))) return

  const updates: Partial<typeof tasks.$inferInsert> = {
    updatedAt: new Date(),
    updatedBy: session.user.id,
  }
  if (newStatus && isStatus(newStatus)) updates.status = newStatus
  if (typeof newOrderIndex === 'number') updates.orderIndex = newOrderIndex

  await getDb().update(tasks).set(updates).where(eq(tasks.id, id))

  revalidatePath('/oppgaver')
}

/**
 * Toggle status mellom todo og done (rask huk-av).
 */
export async function toggleTaskDone(id: string): Promise<void> {
  const session = await auth()
  if (!session?.user) return
  if (!(await userCanAccessTask(id, session.user.id))) return

  const [t] = await getDb()
    .select({ status: tasks.status })
    .from(tasks)
    .where(eq(tasks.id, id))
    .limit(1)
  if (!t) return

  const next: TaskStatus = t.status === 'done' ? 'todo' : 'done'
  await getDb()
    .update(tasks)
    .set({ status: next, updatedAt: new Date(), updatedBy: session.user.id })
    .where(eq(tasks.id, id))

  revalidatePath('/oppgaver')
}

/**
 * Slett oppgave permanent (cascade fjerner subtasks, vedlegg, kommentarer, tildelinger).
 */
export async function deleteTask(id: string): Promise<void> {
  const session = await auth()
  if (!session?.user) return
  if (!(await userCanAccessTask(id, session.user.id))) return

  const [t] = await getDb()
    .select({ projectId: tasks.projectId })
    .from(tasks)
    .where(eq(tasks.id, id))
    .limit(1)

  await getDb().delete(tasks).where(eq(tasks.id, id))

  revalidatePath('/oppgaver')
  if (t?.projectId) revalidatePath(`/prosjekter/${t.projectId}`)
  redirect('/oppgaver')
}

// ============================================================
// Tildelinger
// ============================================================

/**
 * Tildel oppgave til en bruker. Sender e-post-varsel.
 */
export async function assignTask(taskId: string, userId: string): Promise<void> {
  const session = await auth()
  if (!session?.user) return
  if (!(await userCanAccessTask(taskId, session.user.id))) return

  const db = getDb()

  // Sjekk om allerede tildelt
  const [existing] = await db
    .select({ userId: taskAssignees.userId })
    .from(taskAssignees)
    .where(and(eq(taskAssignees.taskId, taskId), eq(taskAssignees.userId, userId)))
    .limit(1)
  if (existing) return

  await db.insert(taskAssignees).values({ taskId, userId })

  // Hent oppgave og bruker for e-post
  const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1)
  const [user] = await db
    .select({ email: users.email, name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (task && user) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    await sendEmail({
      to: user.email,
      subject: `Ny oppgave: ${task.title}`,
      html: taskAssignedEmailHtml({
        name: user.name ?? '',
        title: task.title,
        dueDate: task.dueDate,
        appUrl,
        taskId,
      }),
    })
  }

  revalidatePath(`/oppgaver/${taskId}`)
}

/**
 * Fjern tildeling.
 */
export async function unassignTask(taskId: string, userId: string): Promise<void> {
  const session = await auth()
  if (!session?.user) return
  if (!(await userCanAccessTask(taskId, session.user.id))) return

  await getDb()
    .delete(taskAssignees)
    .where(and(eq(taskAssignees.taskId, taskId), eq(taskAssignees.userId, userId)))

  revalidatePath(`/oppgaver/${taskId}`)
}

// ============================================================
// Kommentarer
// ============================================================

export async function addComment(taskId: string, formData: FormData): Promise<void> {
  const session = await auth()
  if (!session?.user) return
  if (!(await userCanAccessTask(taskId, session.user.id))) return

  const body = ((formData.get('body') as string) ?? '').trim()
  if (!body) return

  await getDb().insert(taskComments).values({
    taskId,
    userId: session.user.id,
    body,
  })

  revalidatePath(`/oppgaver/${taskId}`)
}

export async function deleteComment(commentId: string): Promise<void> {
  const session = await auth()
  if (!session?.user) return

  const db = getDb()
  const [c] = await db
    .select({ userId: taskComments.userId, taskId: taskComments.taskId })
    .from(taskComments)
    .where(eq(taskComments.id, commentId))
    .limit(1)
  if (!c) return
  if (c.userId !== session.user.id) return // bare egne kommentarer

  await db.delete(taskComments).where(eq(taskComments.id, commentId))
  revalidatePath(`/oppgaver/${c.taskId}`)
}

// ============================================================
// Vedlegg
// ============================================================

export async function addTaskAttachment(
  taskId: string,
  formData: FormData,
): Promise<void> {
  const session = await auth()
  if (!session?.user) return
  if (!(await userCanAccessTask(taskId, session.user.id))) return

  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) return

  const result = await uploadTaskAttachment(file, taskId)

  await getDb().insert(attachments).values({
    taskId,
    blobUrl: result.url,
    filename: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    uploadedBy: session.user.id,
  })

  revalidatePath(`/oppgaver/${taskId}`)
}

export async function deleteTaskAttachment(attachmentId: string): Promise<void> {
  const session = await auth()
  if (!session?.user) return

  const db = getDb()
  const [att] = await db
    .select()
    .from(attachments)
    .where(eq(attachments.id, attachmentId))
    .limit(1)
  if (!att) return
  if (!(await userCanAccessTask(att.taskId, session.user.id))) return

  await db.delete(attachments).where(eq(attachments.id, attachmentId))
  await deleteBlobByUrl(att.blobUrl)

  revalidatePath(`/oppgaver/${att.taskId}`)
}

// ============================================================
// Spørringer (helpers, ikke server actions)
// ============================================================

/**
 * Hent alle subtasks for et task-tree (én nivå dypt).
 */
export async function listSubtasks(parentId: string) {
  return getDb()
    .select()
    .from(tasks)
    .where(eq(tasks.parentId, parentId))
    .orderBy(asc(tasks.orderIndex), asc(tasks.createdAt))
}

/**
 * Hent tildelte brukere for en oppgave.
 */
export async function listTaskAssignees(taskIds: string[]) {
  if (taskIds.length === 0) return []
  return getDb()
    .select({
      taskId: taskAssignees.taskId,
      userId: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
    })
    .from(taskAssignees)
    .innerJoin(users, eq(taskAssignees.userId, users.id))
    .where(inArray(taskAssignees.taskId, taskIds))
}
