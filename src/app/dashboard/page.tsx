import { and, asc, eq, gte, inArray } from 'drizzle-orm'
import { CheckSquare } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { BottomNav } from '@/components/BottomNav'
import { AnnouncementBanner } from '@/components/blocks/AnnouncementBanner'
import { ClockButton } from '@/components/blocks/ClockButton'
import { InstallPrompt } from '@/components/blocks/InstallPrompt'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { getDb } from '@/db'
import { checklistRunItems, checklistRuns, checklists, shifts } from '@/db/schema'
import { getDashboardBannerItems, markAnnouncementRead } from '@/lib/announcements'
import { clockIn, clockOut, getActiveClock, getTodayShift } from '@/lib/clock'
import { formatNorwegianDate, toDateString } from '@/lib/dates'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const db = getDb()
  const today = toDateString(new Date())
  const userId = session.user.id

  const [
    upcomingShifts,
    activeClock,
    todayShift,
    announcementItems,
    todayChecklistRuns,
  ] = await Promise.all([
    db
      .select({
        date: shifts.date,
        startTime: shifts.startTime,
        endTime: shifts.endTime,
        note: shifts.note,
      })
      .from(shifts)
      .where(
        and(
          eq(shifts.userId, userId),
          eq(shifts.published, true),
          gte(shifts.date, today),
        ),
      )
      .orderBy(asc(shifts.date), asc(shifts.startTime))
      .limit(7),
    getActiveClock(userId),
    getTodayShift(userId),
    getDashboardBannerItems(userId, session.user.role),
    db
      .select({
        runId: checklistRuns.id,
        checklistName: checklists.name,
        completedAt: checklistRuns.completedAt,
      })
      .from(checklistRuns)
      .innerJoin(checklists, eq(checklists.id, checklistRuns.checklistId))
      .where(eq(checklistRuns.date, today)),
  ])

  // Beregn progresjon per sjekkliste
  const runIds = todayChecklistRuns.map((r) => r.runId)
  const itemCounts =
    runIds.length === 0
      ? []
      : await db
          .select({
            runId: checklistRunItems.runId,
            total: checklistRunItems.id,
            done: checklistRunItems.done,
          })
          .from(checklistRunItems)
          .where(inArray(checklistRunItems.runId, runIds))

  const progressByRun = new Map<string, { total: number; done: number }>()
  for (const item of itemCounts) {
    const cur = progressByRun.get(item.runId) ?? { total: 0, done: 0 }
    cur.total += 1
    if (item.done) cur.done += 1
    progressByRun.set(item.runId, cur)
  }

  return (
    <>
      <main className="min-h-dvh pb-24">
        <header className="bg-gfgk-black px-6 pt-safe pb-6">
          <div className="flex items-center gap-3 pt-4">
            <Image
              src="/logo.png"
              alt="GFGK"
              width={48}
              height={48}
              priority
              className="h-11 w-11 shrink-0 drop-shadow-[0_2px_8px_rgba(255,204,0,0.25)]"
            />
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-extrabold tracking-tight text-gfgk-gold">
                Hei{session.user.name ? `, ${session.user.name.split(' ')[0]}` : ''}
              </h1>
              <p className="truncate text-sm text-white/50">{session.user.email}</p>
            </div>
          </div>
        </header>

        <div className="space-y-6 px-6 pt-6">
          {/* Install-prompt (PWA) */}
          <InstallPrompt />

          {/* Annonseringer */}
          {announcementItems.length > 0 && (
            <AnnouncementBanner
              items={announcementItems.map((a) => ({
                id: a.id,
                title: a.title,
                body: a.body,
                pinned: a.pinned,
              }))}
              onDismiss={markAnnouncementRead}
            />
          )}

          {/* Innstempling */}
          <ClockButton
            isClockedIn={Boolean(activeClock)}
            clockedInAt={activeClock?.clockedInAt ?? null}
            todayShift={
              todayShift
                ? { startTime: todayShift.startTime, endTime: todayShift.endTime }
                : null
            }
            onClockIn={clockIn}
            onClockOut={clockOut}
          />

          {/* Dagens sjekklister */}
          {todayChecklistRuns.length > 0 && (
            <section>
              <SectionLabel>Sjekklister i dag</SectionLabel>
              <div className="space-y-2">
                {todayChecklistRuns.map((r) => {
                  const prog = progressByRun.get(r.runId) ?? { total: 0, done: 0 }
                  const pct =
                    prog.total === 0 ? 0 : Math.round((prog.done / prog.total) * 100)
                  return (
                    <Link
                      key={r.runId}
                      href={`/sjekklister`}
                      className="block rounded-2xl border border-gfgk-border bg-white p-3 shadow-card transition-colors hover:bg-gfgk-cream-deep"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-gfgk-text">
                          <CheckSquare className="h-4 w-4 shrink-0 text-gfgk-gold-deep" />
                          <span className="truncate">{r.checklistName}</span>
                        </span>
                        <span className="shrink-0 text-xs font-bold text-gfgk-text-2">
                          {prog.done}/{prog.total}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-gfgk-cream-deep">
                        <div
                          className="h-full rounded-full bg-gfgk-gold transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {/* Kommende vakter */}
          <section>
            <SectionLabel>Kommende vakter</SectionLabel>
            {upcomingShifts.length === 0 ? (
              <p className="text-sm text-gfgk-text-3">Ingen planlagte vakter.</p>
            ) : (
              <div className="space-y-2">
                {upcomingShifts.map((shift, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-gfgk-border border-l-4 border-l-gfgk-gold bg-white px-4 py-3 shadow-card"
                  >
                    <p className="text-sm font-semibold capitalize text-gfgk-text">
                      {formatNorwegianDate(shift.date)}
                    </p>
                    <p className="mt-0.5 text-sm text-gfgk-text-2">
                      {shift.startTime}–{shift.endTime}
                      {shift.note ? ` · ${shift.note}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <BottomNav role={session.user.role} />
    </>
  )
}
