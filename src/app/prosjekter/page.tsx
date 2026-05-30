import { and, count, eq, inArray, ne, sql } from 'drizzle-orm'
import { FolderPlus, Plus } from 'lucide-react'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AppShell } from '@/components/AppShell'
import { ProjectCard, type ProjectCardData } from '@/components/blocks/ProjectCard'
import { Button } from '@/components/ui/Button'
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetClose,
  BottomSheetTitle,
  BottomSheetTrigger,
} from '@/components/ui/BottomSheet'
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
  tasks,
  users,
  type ProjectCover,
  type ProjectStatus,
} from '@/db/schema'
import { cn } from '@/lib/cn'
import { createProject } from '@/lib/projects'

type TabKey = 'mine' | 'alle' | 'arkiv'

interface PageProps {
  searchParams: Promise<{ tab?: string }>
}

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'mine', label: 'Mine' },
  { key: 'alle', label: 'Alle' },
  { key: 'arkiv', label: 'Arkiv' },
]

async function loadProjectsForTab(
  userId: string,
  tab: TabKey,
): Promise<ProjectCardData[]> {
  const db = getDb()

  // Velg projekter basert på tab
  let projectRows: Array<{
    id: string
    name: string
    status: ProjectStatus
    coverColor: ProjectCover
    deadline: string | null
  }>

  if (tab === 'mine') {
    projectRows = await db
      .select({
        id: projects.id,
        name: projects.name,
        status: projects.status,
        coverColor: projects.coverColor,
        deadline: projects.deadline,
      })
      .from(projects)
      .innerJoin(projectMembers, eq(projectMembers.projectId, projects.id))
      .where(and(eq(projectMembers.userId, userId), ne(projects.status, 'arkivert')))
      .orderBy(projects.name)
  } else if (tab === 'arkiv') {
    projectRows = await db
      .select({
        id: projects.id,
        name: projects.name,
        status: projects.status,
        coverColor: projects.coverColor,
        deadline: projects.deadline,
      })
      .from(projects)
      .where(eq(projects.status, 'arkivert'))
      .orderBy(projects.name)
  } else {
    projectRows = await db
      .select({
        id: projects.id,
        name: projects.name,
        status: projects.status,
        coverColor: projects.coverColor,
        deadline: projects.deadline,
      })
      .from(projects)
      .where(ne(projects.status, 'arkivert'))
      .orderBy(projects.name)
  }

  if (projectRows.length === 0) return []

  const projectIds = projectRows.map((p) => p.id)

  // Hent task-counts per prosjekt
  const taskCounts = await db
    .select({
      projectId: tasks.projectId,
      total: count(),
      done: sql<number>`SUM(CASE WHEN ${tasks.status} = 'done' THEN 1 ELSE 0 END)::int`,
    })
    .from(tasks)
    .where(inArray(tasks.projectId, projectIds))
    .groupBy(tasks.projectId)

  // Hent medlemmer per prosjekt
  const memberRows = await db
    .select({
      projectId: projectMembers.projectId,
      userId: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
    })
    .from(projectMembers)
    .innerJoin(users, eq(projectMembers.userId, users.id))
    .where(inArray(projectMembers.projectId, projectIds))

  return projectRows.map((p) => {
    const tc = taskCounts.find((t) => t.projectId === p.id)
    const members = memberRows
      .filter((m) => m.projectId === p.id)
      .map((m) => ({ name: m.name, email: m.email, src: m.avatarUrl }))
    return {
      id: p.id,
      name: p.name,
      status: p.status,
      coverColor: p.coverColor,
      deadline: p.deadline,
      taskCount: tc?.total ?? 0,
      doneCount: tc?.done ?? 0,
      members,
    }
  })
}

export default async function ProsjekterPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { tab: tabParam } = await searchParams
  const tab: TabKey =
    tabParam === 'alle' || tabParam === 'arkiv' ? tabParam : 'mine'

  const projectList = await loadProjectsForTab(session.user.id, tab)

  return (
    <AppShell role={session.user.role} userName={session.user.name ?? null}>
        <PageHeader title="Prosjekter" />

        {/* Tab-bar */}
        <div className="px-6 pt-4 lg:mx-auto lg:max-w-5xl">
          <div className="flex gap-6 border-b border-gfgk-border">
            {TABS.map((t) => {
              const active = tab === t.key
              return (
                <a
                  key={t.key}
                  href={`/prosjekter?tab=${t.key}`}
                  className={cn(
                    'border-b-2 pb-3 text-sm font-medium transition-colors',
                    active
                      ? 'border-gfgk-gold font-semibold text-gfgk-text'
                      : 'border-transparent text-gfgk-text-2',
                  )}
                >
                  {t.label}
                </a>
              )
            })}
          </div>
        </div>

        <div className="px-6 pt-6 lg:mx-auto lg:max-w-5xl">
          {projectList.length === 0 ? (
            <EmptyState
              icon={FolderPlus}
              title={
                tab === 'arkiv'
                  ? 'Ingen arkiverte prosjekter'
                  : tab === 'mine'
                    ? 'Ingen prosjekter enda'
                    : 'Ingen prosjekter'
              }
              description={
                tab === 'arkiv'
                  ? 'Arkiverte prosjekter dukker opp her.'
                  : 'Lag det første prosjektet med + nede til høyre.'
              }
            />
          ) : (
            <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
              {projectList.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          )}
        </div>

      {tab !== 'arkiv' && (
        <BottomSheet>
          <BottomSheetTrigger asChild>
            <FAB aria-label="Nytt prosjekt">
              <Plus className="h-6 w-6" strokeWidth={2.5} />
            </FAB>
          </BottomSheetTrigger>
          <BottomSheetContent>
            <BottomSheetTitle>Nytt prosjekt</BottomSheetTitle>
            <form action={createProject} className="space-y-3">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                  Navn
                </label>
                <Input
                  name="name"
                  type="text"
                  required
                  autoFocus
                  placeholder="F.eks. Sommerturnering 2026"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                  Beskrivelse (valgfri)
                </label>
                <Textarea name="description" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                    Frist
                  </label>
                  <Input name="deadline" type="date" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                    Farge
                  </label>
                  <Select name="coverColor" defaultValue="gold">
                    <option value="gold">Gull</option>
                    <option value="teal">Turkis</option>
                    <option value="red">Rød</option>
                    <option value="black">Sort</option>
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
