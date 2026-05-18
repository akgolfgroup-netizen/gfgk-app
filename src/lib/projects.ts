'use server'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { getDb } from '@/db'
import { projects, tasks } from '@/db/schema'

export async function createProject(formData: FormData) {
  const session = await auth()
  if (!session?.user) return

  const name = (formData.get('name') as string).trim()
  const description = (formData.get('description') as string | null)?.trim() || null
  const deadline = (formData.get('deadline') as string | null) || null

  if (!name) return

  await getDb().insert(projects).values({
    name,
    description,
    deadline,
    createdBy: session.user.id,
  })

  revalidatePath('/prosjekter')
  revalidatePath('/admin/prosjekter')
}

export async function updateProjectStatus(id: string, _formData: FormData) {
  const session = await auth()
  if (!session?.user) return

  const [project] = await getDb()
    .select({ status: projects.status })
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1)

  if (!project) return

  const next =
    project.status === 'aktiv' ? 'fullfort' : project.status === 'fullfort' ? 'pause' : 'aktiv'

  await getDb().update(projects).set({ status: next }).where(eq(projects.id, id))
  revalidatePath('/prosjekter')
  revalidatePath('/admin/prosjekter')
}

export async function deleteProject(id: string, _formData: FormData) {
  const session = await auth()
  if (!session?.user) return

  await getDb().delete(projects).where(eq(projects.id, id))
  revalidatePath('/prosjekter')
  revalidatePath('/admin/prosjekter')
}

export async function createTask(formData: FormData) {
  const session = await auth()
  if (!session?.user) return

  const projectId = formData.get('projectId') as string
  const title = (formData.get('title') as string).trim()
  const assignedTo = (formData.get('assignedTo') as string | null) || null

  if (!projectId || !title) return

  await getDb().insert(tasks).values({
    projectId,
    title,
    assignedTo,
    createdBy: session.user.id,
  })

  revalidatePath('/prosjekter')
  revalidatePath('/admin/prosjekter')
}

export async function toggleTask(id: string, _formData: FormData) {
  const session = await auth()
  if (!session?.user) return

  const [task] = await getDb()
    .select({ done: tasks.done })
    .from(tasks)
    .where(eq(tasks.id, id))
    .limit(1)

  if (!task) return

  await getDb().update(tasks).set({ done: !task.done }).where(eq(tasks.id, id))
  revalidatePath('/prosjekter')
  revalidatePath('/admin/prosjekter')
}

export async function deleteTask(id: string, _formData: FormData) {
  const session = await auth()
  if (!session?.user) return

  await getDb().delete(tasks).where(and(eq(tasks.id, id)))
  revalidatePath('/prosjekter')
  revalidatePath('/admin/prosjekter')
}

export async function setHourlyRate(userId: string, _formData: FormData) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') return

  const { users } = await import('@/db/schema')
  const { getDb: getDatabase } = await import('@/db')
  const rateRaw = _formData.get('hourlyRate') as string
  const hourlyRate = parseInt(rateRaw, 10)
  if (isNaN(hourlyRate) || hourlyRate < 0) return

  await getDatabase().update(users).set({ hourlyRate }).where(eq(users.id, userId))
  revalidatePath('/admin/lonn')
}
