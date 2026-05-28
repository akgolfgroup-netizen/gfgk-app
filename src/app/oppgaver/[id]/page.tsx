import { and, asc, desc, eq, inArray } from 'drizzle-orm'
import { CornerDownRight, MessageSquare, Trash2, UserMinus, UserPlus } from 'lucide-react'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { BottomNav } from '@/components/BottomNav'
import { AttachmentGrid, type AttachmentData } from '@/components/blocks/AttachmentGrid'
import { Comment, type CommentData } from '@/components/blocks/Comment'
import { TaskDescriptionEdit } from '@/components/blocks/TaskDescriptionEdit'
import { TaskTitleEdit } from '@/components/blocks/TaskTitleEdit'
import { Avatar } from '@/components/ui/Avatar'
import { AvatarStack } from '@/components/ui/AvatarStack'
import {
  BottomSheet,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetTitle,
  BottomSheetTrigger,
} from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { getDb } from '@/db'
import {
  attachments,
  projectMembers,
  projects,
  taskAssignees,
  taskComments,
  tasks,
  users,
} from '@/db/schema'
import {
  addComment,
  addTaskAttachment,
  assignTask,
  createTask,
  deleteComment,
  deleteTask,
  deleteTaskAttachment,
  toggleTaskDone,
  unassignTask,
  updateTask,
} from '@/lib/tasks'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function OppgaveDetaljPage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { id } = await params
  const db = getDb()

  const [task] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1)
  if (!task) notFound()

  // Tilgang: tildelt, prosjekt-medlem, eller skaper (for personlige)
  if (task.projectId) {
    const [member] = await db
      .select({ userId: projectMembers.userId })
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, task.projectId),
          eq(projectMembers.userId, session.user.id),
        ),
      )
      .limit(1)
    if (!member && session.user.role !== 'admin') redirect('/oppgaver')
  } else if (task.createdBy !== session.user.id) {
    redirect('/oppgaver')
  }

  // Hent prosjekt-navn
  const project = task.projectId
    ? (
        await db
          .select({ name: projects.name, id: projects.id })
          .from(projects)
          .where(eq(projects.id, task.projectId))
          .limit(1)
      )[0]
    : null

  // Hent tildelte
  const assigneeRows = await db
    .select({
      userId: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
    })
    .from(taskAssignees)
    .innerJoin(users, eq(taskAssignees.userId, users.id))
    .where(eq(taskAssignees.taskId, id))

  // Eligible: prosjekt-medlemmer som IKKE er tildelt
  const assignedIds = assigneeRows.map((a) => a.userId)
  const eligibleAssignees = task.projectId
    ? await db
        .select({ id: users.id, name: users.name, email: users.email, avatarUrl: users.avatarUrl })
        .from(projectMembers)
        .innerJoin(users, eq(projectMembers.userId, users.id))
        .where(eq(projectMembers.projectId, task.projectId))
        .then((rows) => rows.filter((r) => !assignedIds.includes(r.id)))
    : []

  // Underoppgaver
  const subtasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.parentId, id))
    .orderBy(asc(tasks.orderIndex), asc(tasks.createdAt))

  const subtaskIds = subtasks.map((s) => s.id)
  const subtaskAssignees =
    subtaskIds.length === 0
      ? []
      : await db
          .select({
            taskId: taskAssignees.taskId,
            userId: users.id,
            name: users.name,
            email: users.email,
            avatarUrl: users.avatarUrl,
          })
          .from(taskAssignees)
          .innerJoin(users, eq(taskAssignees.userId, users.id))
          .where(inArray(taskAssignees.taskId, subtaskIds))

  // Vedlegg
  const attachmentRows = await db
    .select()
    .from(attachments)
    .where(eq(attachments.taskId, id))
    .orderBy(desc(attachments.uploadedAt))

  const attachmentData: AttachmentData[] = attachmentRows.map((a) => ({
    id: a.id,
    blobUrl: a.blobUrl,
    filename: a.filename,
    mimeType: a.mimeType,
    sizeBytes: a.sizeBytes,
  }))

  // Kommentarer
  const commentRows = await db
    .select({
      id: taskComments.id,
      body: taskComments.body,
      createdAt: taskComments.createdAt,
      authorId: users.id,
      authorName: users.name,
      authorEmail: users.email,
      authorAvatar: users.avatarUrl,
    })
    .from(taskComments)
    .innerJoin(users, eq(taskComments.userId, users.id))
    .where(eq(taskComments.taskId, id))
    .orderBy(asc(taskComments.createdAt))

  const commentData: CommentData[] = commentRows.map((c) => ({
    id: c.id,
    body: c.body,
    createdAt: c.createdAt,
    author: {
      id: c.authorId,
      name: c.authorName,
      email: c.authorEmail,
      avatarUrl: c.authorAvatar,
    },
  }))

  return (
    <>
      <main className="min-h-dvh pb-24">
        <PageHeader
          title="Oppgave"
          back={
            project
              ? { href: `/prosjekter/${project.id}`, label: project.name }
              : { href: '/oppgaver', label: 'Oppgaver' }
          }
          action={
            <BottomSheet>
              <BottomSheetTrigger asChild>
                <button
                  className="rounded-md p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
                  aria-label="Mer"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </BottomSheetTrigger>
              <BottomSheetContent>
                <BottomSheetTitle>Slett oppgave?</BottomSheetTitle>
                <p className="mb-4 text-sm text-gfgk-text-2">
                  Dette kan ikke angres. Underoppgaver, kommentarer og vedlegg slettes også.
                </p>
                <div className="flex gap-2">
                  <BottomSheetClose asChild>
                    <Button variant="secondary" fullWidth>
                      Avbryt
                    </Button>
                  </BottomSheetClose>
                  <form action={deleteTask.bind(null, id)} className="flex-1">
                    <Button type="submit" variant="destructive" fullWidth>
                      Slett
                    </Button>
                  </form>
                </div>
              </BottomSheetContent>
            </BottomSheet>
          }
        />

        <div className="space-y-6 px-6 pt-6">
          {/* Tittel */}
          <TaskTitleEdit
            taskId={id}
            initialTitle={task.title}
            onSave={updateTask}
          />

          {/* Meta-grid */}
          <Card padding="md" className="space-y-3">
            {/* Status */}
            <form action={updateTask.bind(null, id)} className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gfgk-text">Status</span>
              <Select
                name="status"
                defaultValue={task.status}
                className="!h-9 !w-auto !py-0 !text-sm"
              >
                <option value="todo">Ikke startet</option>
                <option value="in_progress">I gang</option>
                <option value="waiting">Venter</option>
                <option value="done">Fullført</option>
              </Select>
              <button type="submit" className="sr-only">Lagre</button>
            </form>

            {/* Prioritet */}
            <form action={updateTask.bind(null, id)} className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gfgk-text">Prioritet</span>
              <Select
                name="priority"
                defaultValue={task.priority}
                className="!h-9 !w-auto !py-0 !text-sm"
              >
                <option value="low">Lav</option>
                <option value="medium">Middels</option>
                <option value="high">Høy</option>
              </Select>
              <button type="submit" className="sr-only">Lagre</button>
            </form>

            {/* Frist */}
            <form action={updateTask.bind(null, id)} className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gfgk-text">Frist</span>
              <Input
                name="dueDate"
                type="date"
                defaultValue={task.dueDate ?? ''}
                className="!h-9 !w-auto !py-0 !text-sm"
              />
              <button type="submit" className="sr-only">Lagre</button>
            </form>
          </Card>

          {/* Tildelt */}
          <section>
            <SectionLabel>Tildelt</SectionLabel>
            <div className="flex items-center justify-between gap-3">
              {assigneeRows.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {assigneeRows.map((a) => (
                    <form
                      key={a.userId}
                      action={unassignTask.bind(null, id, a.userId)}
                      className="inline-flex"
                    >
                      <button
                        type="submit"
                        className="group inline-flex items-center gap-2 rounded-full bg-gfgk-cream-deep px-2 py-1 text-xs font-semibold text-gfgk-text transition-colors hover:bg-gfgk-red-light hover:text-gfgk-red-deep"
                        aria-label={`Fjern ${a.name ?? a.email}`}
                      >
                        <Avatar size="sm" src={a.avatarUrl} name={a.name} email={a.email} />
                        <span>{a.name ?? a.email}</span>
                        <UserMinus className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                      </button>
                    </form>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gfgk-text-3">Ingen tildelt</p>
              )}

              {eligibleAssignees.length > 0 && (
                <BottomSheet>
                  <BottomSheetTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <UserPlus className="h-4 w-4" />
                      Tildel
                    </Button>
                  </BottomSheetTrigger>
                  <BottomSheetContent>
                    <BottomSheetTitle>Tildel oppgave</BottomSheetTitle>
                    <div className="space-y-2">
                      {eligibleAssignees.map((u) => (
                        <form
                          key={u.id}
                          action={assignTask.bind(null, id, u.id)}
                        >
                          <BottomSheetClose asChild>
                            <button
                              type="submit"
                              className="flex w-full items-center gap-3 rounded-xl border border-gfgk-border bg-white px-4 py-3 text-left transition-colors hover:bg-gfgk-cream-deep"
                            >
                              <Avatar size="md" src={u.avatarUrl} name={u.name} email={u.email} />
                              <span className="text-sm font-semibold text-gfgk-text">
                                {u.name ?? u.email}
                              </span>
                            </button>
                          </BottomSheetClose>
                        </form>
                      ))}
                    </div>
                  </BottomSheetContent>
                </BottomSheet>
              )}
            </div>
          </section>

          {/* Beskrivelse */}
          <section>
            <SectionLabel>Beskrivelse</SectionLabel>
            <TaskDescriptionEdit
              taskId={id}
              initialDescription={task.description}
              onSave={updateTask}
            />
          </section>

          {/* Vedlegg */}
          <section>
            <SectionLabel>Vedlegg</SectionLabel>
            <AttachmentGrid
              attachments={attachmentData}
              onUpload={addTaskAttachment.bind(null, id)}
              onDelete={deleteTaskAttachment}
            />
          </section>

          {/* Underoppgaver */}
          <section>
            <SectionLabel>Underoppgaver</SectionLabel>
            <div className="space-y-2">
              {subtasks.map((s) => {
                const subAssignees = subtaskAssignees
                  .filter((a) => a.taskId === s.id)
                  .map((a) => ({ name: a.name, email: a.email, src: a.avatarUrl }))
                const done = s.status === 'done'
                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-2 rounded-lg border border-gfgk-border bg-white px-3 py-2"
                  >
                    <CornerDownRight className="h-3.5 w-3.5 shrink-0 text-gfgk-text-3" />
                    <form action={toggleTaskDone.bind(null, s.id)} className="inline-flex">
                      <button
                        type="submit"
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                          done
                            ? 'border-gfgk-gold bg-gfgk-gold'
                            : 'border-gfgk-border-strong bg-white'
                        }`}
                        aria-label={done ? 'Marker som ikke fullført' : 'Marker som fullført'}
                      />
                    </form>
                    <a
                      href={`/oppgaver/${s.id}`}
                      className={`flex-1 truncate text-sm ${
                        done ? 'text-gfgk-text-2 line-through' : 'text-gfgk-text'
                      }`}
                    >
                      {s.title}
                    </a>
                    {subAssignees.length > 0 && (
                      <AvatarStack users={subAssignees} max={2} size="sm" />
                    )}
                  </div>
                )
              })}
            </div>

            <BottomSheet>
              <BottomSheetTrigger asChild>
                <Button variant="ghost" size="sm" className="mt-2">
                  + Legg til underoppgave
                </Button>
              </BottomSheetTrigger>
              <BottomSheetContent>
                <BottomSheetTitle>Ny underoppgave</BottomSheetTitle>
                <form action={createTask} className="space-y-3">
                  <input type="hidden" name="parentId" value={id} />
                  {task.projectId && (
                    <input type="hidden" name="projectId" value={task.projectId} />
                  )}
                  <Input name="title" type="text" required autoFocus placeholder="Tittel" />
                  <div className="flex gap-2">
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
          </section>

          {/* Kommentarer */}
          <section>
            <SectionLabel>Kommentarer</SectionLabel>
            {commentData.length > 0 ? (
              <div className="mb-4 space-y-4">
                {commentData.map((c) => (
                  <Comment
                    key={c.id}
                    comment={c}
                    currentUserId={session.user.id}
                    onDelete={deleteComment}
                  />
                ))}
              </div>
            ) : (
              <p className="mb-4 text-sm text-gfgk-text-3">Ingen kommentarer enda.</p>
            )}

            <form action={addComment.bind(null, id)} className="space-y-2">
              <Textarea
                name="body"
                rows={3}
                required
                placeholder="Skriv en kommentar..."
              />
              <div className="flex justify-end">
                <Button type="submit" variant="primary" size="sm">
                  <MessageSquare className="h-4 w-4" />
                  Kommenter
                </Button>
              </div>
            </form>
          </section>
        </div>
      </main>
      <BottomNav role={session.user.role} />
    </>
  )
}
