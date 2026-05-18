import { eq, desc } from 'drizzle-orm'
import { auth } from '@/auth'
import { getDb } from '@/db'
import { projects, tasks, users } from '@/db/schema'
import { BottomNav } from '@/components/BottomNav'
import { ConfirmButton } from '@/components/ConfirmButton'
import { createProject, createTask, deleteProject, deleteTask, updateProjectStatus } from '@/lib/projects'

const STATUS_LABEL: Record<string, string> = {
  aktiv: 'Aktiv',
  fullfort: 'Fullført',
  pause: 'Pause',
}

const STATUS_NEXT: Record<string, string> = {
  aktiv: 'Merk fullført',
  fullfort: 'Sett på pause',
  pause: 'Gjenåpne',
}

export default async function AdminProsjekterPage() {
  const session = await auth()
  const db = getDb()

  const [allProjects, allTasks, allUsers] = await Promise.all([
    db.select().from(projects).orderBy(desc(projects.createdAt)),
    db
      .select({
        id: tasks.id,
        projectId: tasks.projectId,
        title: tasks.title,
        done: tasks.done,
        assignedTo: tasks.assignedTo,
        assignedName: users.name,
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.assignedTo, users.id))
      .orderBy(tasks.createdAt),
    db.select({ id: users.id, name: users.name, email: users.email }).from(users).orderBy(users.name),
  ])

  return (
    <>
      <main className="min-h-dvh pb-24">
        <header className="bg-gfgk-black px-6 pt-safe pb-6">
          <div className="pt-4">
            <a href="/admin" className="text-sm text-white/50 hover:text-white/80 transition-colors">← Admin</a>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-gfgk-gold">Prosjekter</h1>
          </div>
        </header>

        <div className="px-6 pt-6 space-y-8">
          {/* Prosjektliste */}
          <section className="space-y-4">
            {allProjects.map((project) => {
              const projectTasks = allTasks.filter((t) => t.projectId === project.id)
              return (
                <div key={project.id} className="overflow-hidden rounded-lg border border-gfgk-border shadow-[0_1px_2px_rgba(0,0,0,.06)]">
                  <div className="bg-gfgk-black px-4 py-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="text-sm font-extrabold text-white truncate">{project.name}</h2>
                      {project.deadline && (
                        <p className="text-xs text-white/40 mt-0.5">
                          Frist: {new Date(project.deadline + 'T00:00:00').toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wide text-gfgk-gold whitespace-nowrap">
                      {STATUS_LABEL[project.status]}
                    </span>
                  </div>

                  <div className="bg-white px-4 py-4 space-y-4">
                    {project.description && (
                      <p className="text-sm text-gfgk-text-2">{project.description}</p>
                    )}

                    {/* Oppgaver */}
                    <div className="space-y-2">
                      {projectTasks.map((task) => (
                        <div key={task.id} className="flex items-center gap-2">
                          <span className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border ${task.done ? 'border-gfgk-gold bg-gfgk-gold' : 'border-gfgk-border-strong'}`}>
                            {task.done && (
                              <svg width="8" height="6" viewBox="0 0 10 8" fill="none">
                                <path d="M1 4L3.5 6.5L9 1" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </span>
                          <span className={`flex-1 text-sm ${task.done ? 'line-through text-gfgk-text-3' : 'text-gfgk-text'}`}>
                            {task.title}
                            {task.assignedName ? <span className="text-gfgk-text-3"> · {task.assignedName}</span> : null}
                          </span>
                          <form action={deleteTask.bind(null, task.id)}>
                            <button type="submit" className="text-xs text-gfgk-red-deep hover:underline">Slett</button>
                          </form>
                        </div>
                      ))}
                    </div>

                    {/* Ny oppgave */}
                    <form action={createTask} className="flex gap-2">
                      <input type="hidden" name="projectId" value={project.id} />
                      <input name="title" type="text" placeholder="Ny oppgave..." className="flex-1 !py-2 !text-sm" required />
                      <select name="assignedTo" className="!py-2 !text-sm">
                        <option value="">Alle</option>
                        {allUsers.map((u) => (
                          <option key={u.id} value={u.id}>{u.name ?? u.email}</option>
                        ))}
                      </select>
                      <button type="submit" className="rounded-md bg-gfgk-gold px-3 py-2 text-xs font-bold text-gfgk-black hover:bg-gfgk-gold-deep transition-colors whitespace-nowrap">
                        + Legg til
                      </button>
                    </form>

                    {/* Handlinger */}
                    <div className="flex gap-2 pt-1 border-t border-gfgk-border">
                      <form action={updateProjectStatus.bind(null, project.id)}>
                        <button type="submit" className="rounded-md border border-gfgk-border px-3 py-1.5 text-xs font-semibold text-gfgk-text-2 hover:bg-gfgk-cream-deep transition-colors">
                          {STATUS_NEXT[project.status]}
                        </button>
                      </form>
                      <form action={deleteProject.bind(null, project.id)}>
                        <ConfirmButton
                          message={`Slette prosjektet "${project.name}" og alle oppgavene?`}
                          className="rounded-md bg-gfgk-red-light px-3 py-1.5 text-xs font-semibold text-gfgk-red-deep hover:bg-gfgk-red/20 transition-colors"
                        >
                          Slett prosjekt
                        </ConfirmButton>
                      </form>
                    </div>
                  </div>
                </div>
              )
            })}
          </section>

          {/* Nytt prosjekt */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-gfgk-gold-deep">
              <span className="inline-block h-3.5 w-0.5 rounded-full bg-gfgk-gold" />
              Nytt prosjekt
            </h2>
            <form action={createProject} className="space-y-4 rounded-lg border border-gfgk-border bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,.06)]">
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-gfgk-text">Navn</span>
                <input name="name" type="text" required className="w-full" />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-gfgk-text">Beskrivelse (valgfritt)</span>
                <input name="description" type="text" className="w-full" />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-gfgk-text">Frist (valgfritt)</span>
                <input name="deadline" type="date" className="w-full" />
              </label>
              <button type="submit" className="w-full rounded-md bg-gfgk-gold py-3 text-sm font-bold text-gfgk-black hover:bg-gfgk-gold-deep transition-colors">
                Opprett prosjekt
              </button>
            </form>
          </section>
        </div>
      </main>
      <BottomNav role={session!.user.role} />
    </>
  )
}
