import { and, asc, eq, inArray, isNotNull, isNull, lt, ne, or } from 'drizzle-orm'
import { CheckSquare, Plus } from 'lucide-react'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AppShell } from '@/components/AppShell'
import { type TaskBlockData } from '@/components/blocks/TaskBlock'
import { TaskViews } from '@/components/blocks/TaskViews'
import { parseTaskView } from '@/components/blocks/TaskViewSwitcher'
import {
  BottomSheet,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetTitle,
  BottomSheetTrigger,
} from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { Chip, ChipBar } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/EmptyState'
import { FAB } from '@/components/ui/FAB'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { getDb } from '@/db'
import {
  projectMembers,
  projects,
  taskAssignees,
  tasks,
  users,
  type Task,
} from '@/db/schema'
import { cn } from '@/lib/cn'
import { createTask, moveTask, toggleTaskDone } from '@/lib/tasks'

type FilterKey = 'mine' | 'alle' | 'i-dag' | 'forfalt' | 'fullfort'

interface PageProps {
  searchParams: Promise<{ filter?: string; view?: string }>
}

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: 'mine', label: 'Mine' },
  { key: 'alle', label: 'Alle' },
  { key: 'i-dag', label: 'I dag' },
  { key: 'forfalt', label: 'Forfalt' },
  { key: 'fullfort', label: 'Fullført' },
]

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export default async function OppgaverPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { filter: filterParam, view: viewParam } = await searchParams
  const filter: FilterKey =
    (FILTERS.map((f) => f.key) as string[]).includes(filterParam ?? '')
      ? (filterParam as FilterKey)
      : 'mine'
  const view = parseTaskView(viewParam)

  const db = getDb()
  const userId = session.user.id

  // Bygg query basert på filter
  const today = todayISO()

  // Hent alle oppgaver som brukeren har tilgang til
  // = tasks der bruker er tildelt ELLER er medlem av prosjektet ELLER opprettet selv (personal)
  const accessibleTaskIds = await db
    .selectDistinct({ id: tasks.id })
    .from(tasks)
    .leftJoin(taskAssignees, eq(taskAssignees.taskId, tasks.id))
    .leftJoin(projectMembers, eq(projectMembers.projectId, tasks.projectId))
    .where(
      or(
        eq(taskAssignees.userId, userId),
        eq(projectMembers.userId, userId),
        and(isNull(tasks.projectId), eq(tasks.createdBy, userId)),
      ),
    )

  if (accessibleTaskIds.length === 0) {
    return (
      <EmptyPage
        role={session.user.role}
        userName={session.user.name ?? null}
        filter={filter}
        currentUserId={userId}
      />
    )
  }

  const ids = accessibleTaskIds.map((r) => r.id)

  // Filtrer videre basert på filter-valg.
  // For andre visninger enn liste trenger vi HELE oppgave-settet (alle statuser,
  // inkl. ferdige) slik at tavle/tabell/kalender blir meningsfulle.
  let taskRows: Task[] = []
  if (view !== 'liste') {
    taskRows = await db
      .select()
      .from(tasks)
      .where(inArray(tasks.id, ids))
      .orderBy(asc(tasks.dueDate), asc(tasks.createdAt))
  } else if (filter === 'mine') {
    // Alle tildelt meg, ikke fullført
    const mineIds = await db
      .selectDistinct({ id: taskAssignees.taskId })
      .from(taskAssignees)
      .where(and(eq(taskAssignees.userId, userId), inArray(taskAssignees.taskId, ids)))
    const minIds = mineIds.map((r) => r.id)
    if (minIds.length === 0) {
      taskRows = []
    } else {
      taskRows = await db
        .select()
        .from(tasks)
        .where(and(inArray(tasks.id, minIds), ne(tasks.status, 'done')))
        .orderBy(asc(tasks.dueDate), asc(tasks.createdAt))
    }
  } else if (filter === 'i-dag') {
    taskRows = await db
      .select()
      .from(tasks)
      .where(and(inArray(tasks.id, ids), eq(tasks.dueDate, today)))
      .orderBy(asc(tasks.createdAt))
  } else if (filter === 'forfalt') {
    taskRows = await db
      .select()
      .from(tasks)
      .where(
        and(
          inArray(tasks.id, ids),
          isNotNull(tasks.dueDate),
          lt(tasks.dueDate, today),
          ne(tasks.status, 'done'),
        ),
      )
      .orderBy(asc(tasks.dueDate))
  } else if (filter === 'fullfort') {
    taskRows = await db
      .select()
      .from(tasks)
      .where(and(inArray(tasks.id, ids), eq(tasks.status, 'done')))
      .orderBy(asc(tasks.createdAt))
  } else {
    // alle
    taskRows = await db
      .select()
      .from(tasks)
      .where(and(inArray(tasks.id, ids), ne(tasks.status, 'done')))
      .orderBy(asc(tasks.dueDate), asc(tasks.createdAt))
  }

  // Hent tildelte
  const taskIdList = taskRows.map((t) => t.id)
  const assigneeRows =
    taskIdList.length === 0
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
          .where(inArray(taskAssignees.taskId, taskIdList))

  const blocks: TaskBlockData[] = taskRows.map((t) => ({
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

  // Hent prosjekter bruker er medlem av (for "Ny oppgave"-skjema)
  const memberProjects = await db
    .select({ id: projects.id, name: projects.name })
    .from(projects)
    .innerJoin(projectMembers, eq(projectMembers.projectId, projects.id))
    .where(and(eq(projectMembers.userId, userId), ne(projects.status, 'arkivert')))
    .orderBy(projects.name)

  // Aktive ansatte for «Ansvarlig»-velgeren
  const employees = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.active, true))
    .orderBy(users.name)

  return (
    <AppShell role={session.user.role} userName={session.user.name ?? null}>
        <PageHeader title="Oppgaver" />

        <div
          className={cn(
            view === 'liste' ? 'lg:mx-auto lg:max-w-3xl' : 'lg:mx-auto lg:max-w-6xl',
          )}
        >
          {/* Filter-chips gir kun mening for liste-visningen */}
          {view === 'liste' && (
            <div className="px-6 pt-4">
              <ChipBar>
                {FILTERS.map((f) => (
                  <Chip
                    key={f.key}
                    active={filter === f.key}
                    href={`/oppgaver?filter=${f.key}`}
                  >
                    {f.label}
                  </Chip>
                ))}
              </ChipBar>
            </div>
          )}

          <div className="px-6 pt-6">
            <TaskViews tasks={blocks} onMove={moveTask} onToggle={toggleTaskDone} />
          </div>
        </div>

      <BottomSheet>
        <BottomSheetTrigger asChild>
          <FAB aria-label="Ny oppgave">
            <Plus className="h-6 w-6" strokeWidth={2.5} />
          </FAB>
        </BottomSheetTrigger>
        <BottomSheetContent>
          <BottomSheetTitle>Ny oppgave</BottomSheetTitle>
          <form action={createTask} className="space-y-3">
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
                Prosjekt
              </label>
              <Select name="projectId" defaultValue="">
                <option value="">Personlig (ingen prosjekt)</option>
                {memberProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                Ansvarlig
              </label>
              <Select name="assigneeId" defaultValue="">
                <option value="">Ingen ansvarlig</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name ?? e.email}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                Sone (valgfri)
              </label>
              <Input name="zone" type="text" placeholder="F.eks. Hull 3, Pro shop" />
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
    </AppShell>
  )
}

function EmptyPage({
  role,
  userName,
  filter,
  currentUserId: _,
}: {
  role: 'admin' | 'ansatt'
  userName: string | null
  filter: FilterKey
  currentUserId: string
}) {
  return (
    <AppShell role={role} userName={userName}>
        <PageHeader title="Oppgaver" />
        <div className="px-6 pt-12 lg:mx-auto lg:max-w-3xl">
          <EmptyState
            icon={CheckSquare}
            title="Ingen oppgaver enda"
            description={
              filter === 'mine'
                ? 'Når noen tildeler deg en oppgave, dukker den opp her.'
                : 'Tap + nede til høyre for å lage den første.'
            }
          />
        </div>
    </AppShell>
  )
}
