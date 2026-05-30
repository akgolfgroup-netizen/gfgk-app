import { asc, eq, inArray } from 'drizzle-orm'
import { BookOpen, CheckSquare } from 'lucide-react'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AppShell } from '@/components/AppShell'
import { ChecklistRunItem } from '@/components/blocks/ChecklistRunItem'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { getDb } from '@/db'
import {
  articles,
  checklistItems,
  checklistRunItems,
  checklistRuns,
  checklists,
} from '@/db/schema'
import { toggleChecklistItem } from '@/lib/checklists'
import { toDateString } from '@/lib/dates'

export default async function SjekklisterPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const db = getDb()
  const today = toDateString(new Date())

  // Hent dagens runs
  const runs = await db
    .select({
      runId: checklistRuns.id,
      checklistId: checklistRuns.checklistId,
      checklistName: checklists.name,
      checklistDescription: checklists.description,
      assignedRole: checklists.assignedRole,
      articleSlug: articles.slug,
    })
    .from(checklistRuns)
    .innerJoin(checklists, eq(checklists.id, checklistRuns.checklistId))
    .leftJoin(articles, eq(articles.id, checklists.articleId))
    .where(eq(checklistRuns.date, today))

  // Filtrer på rolle
  const myRuns = runs.filter(
    (r) =>
      r.assignedRole === 'alle' ||
      r.assignedRole === session.user.role,
  )

  // Hent alle run-items + tilhørende item-data
  const runIds = myRuns.map((r) => r.runId)
  const runItems =
    runIds.length === 0
      ? []
      : await db
          .select({
            runItemId: checklistRunItems.id,
            runId: checklistRunItems.runId,
            itemId: checklistRunItems.itemId,
            done: checklistRunItems.done,
            doneAt: checklistRunItems.doneAt,
            doneBy: checklistRunItems.doneBy,
            title: checklistItems.title,
            description: checklistItems.description,
            orderIndex: checklistItems.orderIndex,
          })
          .from(checklistRunItems)
          .innerJoin(checklistItems, eq(checklistItems.id, checklistRunItems.itemId))
          .where(inArray(checklistRunItems.runId, runIds))
          .orderBy(asc(checklistItems.orderIndex))

  return (
    <AppShell role={session.user.role} userName={session.user.name ?? null}>
        <PageHeader title="Sjekklister i dag" />

        <div className="space-y-6 px-6 pt-6 lg:mx-auto lg:max-w-3xl">
          {myRuns.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="Ingen sjekklister i dag"
              description="Sjekklister dukker opp automatisk om morgenen."
            />
          ) : (
            myRuns.map((run) => {
              const items = runItems.filter((i) => i.runId === run.runId)
              const done = items.filter((i) => i.done).length
              const pct =
                items.length === 0 ? 0 : Math.round((done / items.length) * 100)
              return (
                <section key={run.runId}>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-base font-bold text-gfgk-text">
                      {run.checklistName}
                    </h2>
                    <span className="text-xs font-semibold text-gfgk-text-2">
                      {done}/{items.length} · {pct}%
                    </span>
                  </div>
                  {run.articleSlug && (
                    <a
                      href={`/kunnskap/${run.articleSlug}`}
                      className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-gfgk-gold-deep hover:underline"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      Slik gjør du
                    </a>
                  )}
                  {run.checklistDescription && (
                    <p className="mb-3 text-sm text-gfgk-text-2">
                      {run.checklistDescription}
                    </p>
                  )}
                  <div className="space-y-2">
                    {items.map((item) => (
                      <ChecklistRunItem
                        key={item.runItemId}
                        id={item.runItemId}
                        title={item.title}
                        description={item.description}
                        done={item.done}
                        doneAt={item.doneAt}
                        doneBy={item.doneBy}
                        onToggle={toggleChecklistItem}
                      />
                    ))}
                  </div>
                </section>
              )
            })
          )}
        </div>
    </AppShell>
  )
}
