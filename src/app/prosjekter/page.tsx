import { eq, desc } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getDb } from '@/db'
import { projects, tasks, users } from '@/db/schema'
import { BottomNav } from '@/components/BottomNav'
import { toggleTask } from '@/lib/projects'

const STATUS_LABEL: Record<string, string> = {
  aktiv: 'Aktiv',
  fullfort: 'Fullført',
  pause: 'Pause',
}

const STATUS_COLOR: Record<string, string> = {
  aktiv: 'bg-gfgk-teal-light text-gfgk-teal-deep',
  fullfort: 'bg-gfgk-gold-light text-gfgk-gold-deep',
  pause: 'bg-gfgk-cream-deep text-gfgk-text-2',
}

export default async function ProsjekterPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const db = getDb()
  const allProjects = await db
    .select()
    .from(projects)
    .orderBy(desc(projects.createdAt))

  const allTasks = await db
    .select({
      id: tasks.id,
      projectId: tasks.projectId,
      title: tasks.title,
      done: tasks.done,
      assignedTo: tasks.assignedTo,
      assignedName: users.name,
      assignedEmail: users.email,
    })
    .from(tasks)
    .leftJoin(users, eq(tasks.assignedTo, users.id))
    .orderBy(tasks.createdAt)

  return (
    <>
      <main className="min-h-dvh pb-24">
        <header className="bg-gfgk-black px-6 pt-safe pb-6">
          <div className="pt-4">
            <h1 className="text-2xl font-extrabold tracking-tight text-gfgk-gold">Prosjekter</h1>
            <p className="text-sm text-white/50 mt-0.5">Oppgaver og fremdrift</p>
          </div>
        </header>

        <div className="px-6 pt-6 space-y-4">
          {allProjects.length === 0 ? (
            <p className="text-sm text-gfgk-text-3">Ingen prosjekter ennå.</p>
          ) : (
            allProjects.map((project) => {
              const projectTasks = allTasks.filter((t) => t.projectId === project.id)
              const doneTasks = projectTasks.filter((t) => t.done).length
              const progress = projectTasks.length > 0
                ? Math.round((doneTasks / projectTasks.length) * 100)
                : 0

              return (
                <div key={project.id} className="overflow-hidden rounded-lg border border-gfgk-border shadow-[0_1px_2px_rgba(0,0,0,.06)]">
                  <div className="bg-gfgk-black px-4 py-3 flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-extrabold text-white">{project.name}</h2>
                      {project.deadline && (
                        <p className="text-xs text-white/40 mt-0.5">
                          Frist: {new Date(project.deadline + 'T00:00:00').toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })}
                        </p>
                      )}
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${STATUS_COLOR[project.status]}`}>
                      {STATUS_LABEL[project.status]}
                    </span>
                  </div>

                  <div className="bg-white px-4 pt-3 pb-4 space-y-3">
                    {project.description && (
                      <p className="text-sm text-gfgk-text-2">{project.description}</p>
                    )}

                    {projectTasks.length > 0 && (
                      <>
                        <div className="flex items-center justify-between text-xs text-gfgk-text-2">
                          <span>{doneTasks}/{projectTasks.length} oppgaver</span>
                          <span className="font-semibold text-gfgk-gold-deep">{progress}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-gfgk-cream-deep overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gfgk-gold transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </>
                    )}

                    <div className="space-y-2 pt-1">
                      {projectTasks.map((task) => (
                        <form key={task.id} action={toggleTask.bind(null, task.id)}>
                          <button
                            type="submit"
                            className="flex w-full items-start gap-3 text-left"
                          >
                            <span className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors ${
                              task.done
                                ? 'border-gfgk-gold bg-gfgk-gold'
                                : 'border-gfgk-border-strong bg-white'
                            }`}>
                              {task.done && (
                                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                  <path d="M1 4L3.5 6.5L9 1" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${task.done ? 'line-through text-gfgk-text-3' : 'text-gfgk-text font-medium'}`}>
                                {task.title}
                              </p>
                              {task.assignedName && (
                                <p className="text-xs text-gfgk-text-3">{task.assignedName}</p>
                              )}
                            </div>
                          </button>
                        </form>
                      ))}

                      {projectTasks.length === 0 && (
                        <p className="text-sm text-gfgk-text-3">Ingen oppgaver ennå.</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </main>
      <BottomNav role={session.user.role} />
    </>
  )
}
