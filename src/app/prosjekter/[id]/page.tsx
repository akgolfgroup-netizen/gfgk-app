import { and, asc, desc, eq, inArray, isNull } from 'drizzle-orm'
import { CheckSquare, Files, Plus, UserPlus, Users } from 'lucide-react'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AppShell } from '@/components/AppShell'
import { type TaskBlockData } from '@/components/blocks/TaskBlock'
import { TaskViews } from '@/components/blocks/TaskViews'
import {
  BottomSheet,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetTitle,
  BottomSheetTrigger,
} from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { FAB } from '@/components/ui/FAB'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pill, statusTone } from '@/components/ui/Pill'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Avatar } from '@/components/ui/Avatar'
import { getDb } from '@/db'
import {
  attachments,
  projectMembers,
  projects,
  taskAssignees,
  tasks,
  users,
  type ProjectStatus,
} from '@/db/schema'
import { cn } from '@/lib/cn'
import { addProjectMember, removeProjectMember } from '@/lib/projects'
import { createTask, moveTask, toggleTaskDone } from '@/lib/tasks'

type TabKey = 'oppgaver' | 'filer' | 'medlemmer'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

const TABS: Array<{ key: TabKey; label: string; icon: typeof CheckSquare }> = [
  { key: 'oppgaver', label: 'Oppgaver', icon: CheckSquare },
  { key: 'filer', label: 'Filer', icon: Files },
  { key: 'medlemmer', label: 'Medlemmer', icon: Users },
]

const STATUS_LABEL: Record<ProjectStatus, string> = {
  aktiv: 'Aktiv',
  fullfort: 'Fullført',
  pause: 'Pause',
  arkivert: 'Arkivert',
}

export default async function ProsjektDetaljPage({ params, searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { id } = await params
  const { tab: tabParam } = await searchParams
  const tab: TabKey =
    tabParam === 'filer' || tabParam === 'medlemmer' ? tabParam : 'oppgaver'

  const db = getDb()

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1)
  if (!project) notFound()

  // Sjekk medlemskap
  const [membership] = await db
    .select({ role: projectMembers.role })
    .from(projectMembers)
    .where(
      and(eq(projectMembers.projectId, id), eq(projectMembers.userId, session.user.id)),
    )
    .limit(1)

  // Hvis ikke medlem og ikke admin: redirect tilbake
  if (!membership && session.user.role !== 'admin') {
    redirect('/prosjekter')
  }

  return (
    <AppShell role={session.user.role} userName={session.user.name ?? null}>
        <PageHeader
          title={project.name}
          subtitle={
            project.deadline
              ? `Frist ${new Date(project.deadline + 'T00:00:00').toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' })}`
              : undefined
          }
          back={{ href: '/prosjekter', label: 'Prosjekter' }}
          maxWidth="3xl"
          action={
            <Pill tone={statusTone(project.status)} size="md">
              {STATUS_LABEL[project.status]}
            </Pill>
          }
        />

        {project.description && (
          <div className="border-b border-gfgk-border bg-white px-6 py-4">
            <p className="whitespace-pre-wrap text-sm text-gfgk-text-2 lg:mx-auto lg:max-w-3xl">
              {project.description}
            </p>
          </div>
        )}

        {/* Tab-bar */}
        <div className="px-6 pt-4 lg:mx-auto lg:max-w-3xl">
          <div className="flex gap-6 border-b border-gfgk-border">
            {TABS.map((t) => {
              const Icon = t.icon
              const active = tab === t.key
              return (
                <a
                  key={t.key}
                  href={`/prosjekter/${id}?tab=${t.key}`}
                  className={cn(
                    'flex items-center gap-1.5 border-b-2 pb-3 text-sm font-medium transition-colors',
                    active
                      ? 'border-gfgk-gold font-semibold text-gfgk-text'
                      : 'border-transparent text-gfgk-text-2',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                </a>
              )
            })}
          </div>
        </div>

        <div className="px-6 pt-6 lg:mx-auto lg:max-w-3xl">
          {tab === 'oppgaver' && <OppgaverTab projectId={id} />}
          {tab === 'filer' && <FilerTab projectId={id} />}
          {tab === 'medlemmer' && (
            <MedlemmerTab projectId={id} isOwner={membership?.role === 'eier'} />
          )}
        </div>

      {tab === 'oppgaver' && (
        <BottomSheet>
          <BottomSheetTrigger asChild>
            <FAB aria-label="Ny oppgave">
              <Plus className="h-6 w-6" strokeWidth={2.5} />
            </FAB>
          </BottomSheetTrigger>
          <BottomSheetContent>
            <BottomSheetTitle>Ny oppgave</BottomSheetTitle>
            <form action={createTask} className="space-y-3">
              <input type="hidden" name="projectId" value={id} />
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                  Tittel
                </label>
                <Input name="title" type="text" required autoFocus />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                  Beskrivelse
                </label>
                <Textarea
                  name="description"
                  rows={3}
                  placeholder="Hva skal gjøres? (valgfritt)"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                  Bilde
                </label>
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  capture="environment"
                  className="!h-auto !rounded-xl !px-3 !py-2.5 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-gfgk-black file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-gfgk-gold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                    Frist
                  </label>
                  <Input name="dueDate" type="date" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                    Prioritet
                  </label>
                  <Select name="priority" defaultValue="medium">
                    <option value="low">Lav</option>
                    <option value="medium">Middels</option>
                    <option value="high">Høy</option>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <BottomSheetClose asChild>
                  <Button type="button" variant="secondary" fullWidth>
                    Avbryt
                  </Button>
                </BottomSheetClose>
                <Button type="submit" variant="primary" fullWidth>
                  Opprett
                </Button>
              </div>
            </form>
          </BottomSheetContent>
        </BottomSheet>
      )}
    </AppShell>
  )
}

// ============================================================
// Oppgaver-tab
// ============================================================

async function OppgaverTab({ projectId }: { projectId: string }) {
  const db = getDb()

  // Top-level oppgaver (ikke subtasks)
  const topTasks = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.projectId, projectId), isNull(tasks.parentId)))
    .orderBy(asc(tasks.orderIndex), asc(tasks.createdAt))

  if (topTasks.length === 0) {
    return (
      <EmptyState
        icon={CheckSquare}
        title="Ingen oppgaver enda"
        description="Tap + nede til høyre for å lage den første."
      />
    )
  }

  const taskIds = topTasks.map((t) => t.id)
  const assigneeRows = await db
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

  const blocks: TaskBlockData[] = topTasks.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate,
    zone: t.zone,
    assignees: assigneeRows
      .filter((a) => a.taskId === t.id)
      .map((a) => ({ name: a.name, email: a.email, src: a.avatarUrl })),
  }))

  return <TaskViews tasks={blocks} onMove={moveTask} onToggle={toggleTaskDone} />
}

// ============================================================
// Filer-tab
// ============================================================

async function FilerTab({ projectId }: { projectId: string }) {
  const db = getDb()
  const files = await db
    .select({
      id: attachments.id,
      filename: attachments.filename,
      blobUrl: attachments.blobUrl,
      mimeType: attachments.mimeType,
      sizeBytes: attachments.sizeBytes,
      uploadedAt: attachments.uploadedAt,
      taskId: attachments.taskId,
      taskTitle: tasks.title,
    })
    .from(attachments)
    .innerJoin(tasks, eq(attachments.taskId, tasks.id))
    .where(eq(tasks.projectId, projectId))
    .orderBy(desc(attachments.uploadedAt))

  if (files.length === 0) {
    return (
      <EmptyState
        icon={Files}
        title="Ingen filer enda"
        description="Vedlegg du legger til på oppgaver dukker opp her."
      />
    )
  }

  return (
    <div className="space-y-2">
      {files.map((f) => (
        <a
          key={f.id}
          href={f.blobUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl border border-gfgk-border bg-white px-4 py-3 transition-colors hover:bg-gfgk-cream-deep"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gfgk-cream-deep">
            <Files className="h-5 w-5 text-gfgk-text-2" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gfgk-text">
              {f.filename}
            </p>
            <p className="truncate text-xs text-gfgk-text-2">{f.taskTitle}</p>
          </div>
        </a>
      ))}
    </div>
  )
}

// ============================================================
// Medlemmer-tab
// ============================================================

async function MedlemmerTab({
  projectId,
  isOwner,
}: {
  projectId: string
  isOwner: boolean
}) {
  const db = getDb()

  const members = await db
    .select({
      userId: projectMembers.userId,
      role: projectMembers.role,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
    })
    .from(projectMembers)
    .innerJoin(users, eq(projectMembers.userId, users.id))
    .where(eq(projectMembers.projectId, projectId))

  // For "legg til medlem"-listen: aktive brukere som IKKE er medlem
  const memberIds = members.map((m) => m.userId)
  const eligibleUsers = isOwner
    ? await db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(eq(users.active, true))
        .orderBy(users.name)
        .then((all) => all.filter((u) => !memberIds.includes(u.id)))
    : []

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {members.map((m) => (
          <div
            key={m.userId}
            className="flex items-center gap-3 rounded-xl border border-gfgk-border bg-white px-4 py-3"
          >
            <Avatar size="md" src={m.avatarUrl} name={m.name} email={m.email} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gfgk-text">
                {m.name ?? m.email}
              </p>
              <p className="text-xs text-gfgk-text-2">
                {m.role === 'eier' ? 'Eier' : 'Medlem'}
              </p>
            </div>
            {isOwner && m.role !== 'eier' && (
              <form action={removeProjectMember.bind(null, projectId, m.userId)}>
                <Button type="submit" variant="ghost" size="sm">
                  Fjern
                </Button>
              </form>
            )}
          </div>
        ))}
      </div>

      {isOwner && eligibleUsers.length > 0 && (
        <BottomSheet>
          <BottomSheetTrigger asChild>
            <Button variant="secondary" size="md" fullWidth>
              <UserPlus className="h-4 w-4" />
              Legg til medlem
            </Button>
          </BottomSheetTrigger>
          <BottomSheetContent>
            <BottomSheetTitle>Legg til medlem</BottomSheetTitle>
            <div className="space-y-2">
              {eligibleUsers.map((u) => (
                <form
                  key={u.id}
                  action={addProjectMember.bind(null, projectId, u.id)}
                >
                  <BottomSheetClose asChild>
                    <button
                      type="submit"
                      className="flex w-full items-center gap-3 rounded-xl border border-gfgk-border bg-white px-4 py-3 text-left transition-colors hover:bg-gfgk-cream-deep"
                    >
                      <Avatar size="md" name={u.name} email={u.email} />
                      <div>
                        <p className="text-sm font-semibold text-gfgk-text">
                          {u.name ?? u.email}
                        </p>
                        {u.name && (
                          <p className="text-xs text-gfgk-text-2">{u.email}</p>
                        )}
                      </div>
                    </button>
                  </BottomSheetClose>
                </form>
              ))}
            </div>
          </BottomSheetContent>
        </BottomSheet>
      )}
    </div>
  )
}
