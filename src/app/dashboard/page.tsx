import { and, asc, eq, gte, inArray, ne } from 'drizzle-orm'
import { CheckSquare } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { BottomNav } from '@/components/BottomNav'
import { AnnouncementBanner } from '@/components/blocks/AnnouncementBanner'
import { ClockButton } from '@/components/blocks/ClockButton'
import { InstallPrompt } from '@/components/blocks/InstallPrompt'
import { Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { KPI } from '@/components/ui/KPI'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { getDb } from '@/db'
import {
  checklistRunItems,
  checklistRuns,
  checklists,
  shifts,
  taskAssignees,
  tasks,
  users,
} from '@/db/schema'
import { getDashboardBannerItems, markAnnouncementRead } from '@/lib/announcements'
import { clockIn, clockOut, getActiveClock, getTodayShift } from '@/lib/clock'
import { formatNorwegianDate, toDateString } from '@/lib/dates'

function greetingForHour(hour: number): string {
  if (hour < 10) return 'morgen'
  if (hour < 12) return 'formiddag'
  if (hour < 18) return 'ettermiddag'
  return 'kveld'
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const db = getDb()
  const now = new Date()
  const today = toDateString(now)
  const userId = session.user.id

  const [
    upcomingShifts,
    activeClock,
    todayShift,
    announcementItems,
    todayChecklistRuns,
    openTaskRows,
    rosterShifts,
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
    db
      .select({ id: tasks.id })
      .from(tasks)
      .innerJoin(taskAssignees, eq(taskAssignees.taskId, tasks.id))
      .where(and(eq(taskAssignees.userId, userId), ne(tasks.status, 'done'))),
    // Hvem jobber framover — alle publiserte vakter neste dager (m/ navn)
    db
      .select({
        date: shifts.date,
        startTime: shifts.startTime,
        endTime: shifts.endTime,
        note: shifts.note,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
      })
      .from(shifts)
      .innerJoin(users, eq(users.id, shifts.userId))
      .where(and(eq(shifts.published, true), gte(shifts.date, today)))
      .orderBy(asc(shifts.date), asc(shifts.startTime))
      .limit(14),
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

  // Avledede verdier til hilsen + KPI-strip
  const firstName = session.user.name?.split(' ')[0] ?? ''
  const greeting = greetingForHour(now.getHours())
  const dateLabel = now
    .toLocaleDateString('nb-NO', { weekday: 'long', day: 'numeric', month: 'long' })
    .toUpperCase()
  const shiftSuffix = todayShift
    ? `du har vakt ${todayShift.startTime}–${todayShift.endTime}`
    : 'du har fri i dag'

  let checklistDone = 0
  let checklistTotal = 0
  for (const v of progressByRun.values()) {
    checklistDone += v.done
    checklistTotal += v.total
  }
  const openTasksCount = openTaskRows.length

  return (
    <>
      <main className="min-h-dvh pb-24">
        <header className="bg-gfgk-black px-6 pt-safe pb-7">
          <div className="flex items-center justify-between gap-3 pt-4">
            <Image
              src="/logo.png"
              alt="GFGK"
              width={44}
              height={44}
              priority
              className="h-10 w-10 shrink-0 drop-shadow-[0_2px_8px_rgba(255,204,0,0.25)]"
            />
            <Eyebrow tone="light" className="text-white/70">
              {dateLabel}
            </Eyebrow>
          </div>
          <h1 className="h-display mt-4 text-[28px] text-white">
            God {greeting}
            {firstName ? `, ${firstName}` : ''}{' '}
            <span className="font-normal italic text-gfgk-gold">— {shiftSuffix}</span>
          </h1>
        </header>

        {/* KPI-strip */}
        <div className="px-6 pt-5">
          <div className="grid grid-cols-2 gap-3">
            <Card padding="md">
              <KPI
                label="Vakt i dag"
                value={todayShift ? todayShift.startTime : 'Fri'}
                hint={todayShift ? `til ${todayShift.endTime}` : 'ingen vakt'}
              />
            </Card>
            <Card padding="md">
              <KPI
                label="Mine vakter"
                value={upcomingShifts.length}
                hint="kommende"
              />
            </Card>
            <Card padding="md">
              <KPI
                label="Åpne oppgaver"
                value={openTasksCount}
                hint="tildelt deg"
              />
            </Card>
            <Card padding="md">
              <KPI
                label="Sjekkliste"
                value={checklistTotal > 0 ? `${checklistDone}/${checklistTotal}` : '—'}
                hint="fullført i dag"
                tone={
                  checklistTotal > 0 && checklistDone === checklistTotal
                    ? 'positive'
                    : 'default'
                }
              />
            </Card>
          </div>
        </div>

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
            {rosterShifts.length === 0 ? (
              <p className="text-sm text-gfgk-text-3">Ingen planlagte vakter.</p>
            ) : (
              <div className="space-y-2">
                {rosterShifts.map((shift, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl border border-gfgk-border border-l-4 border-l-gfgk-gold bg-white px-3 py-2.5 shadow-card"
                  >
                    <Avatar
                      size="sm"
                      src={shift.avatarUrl}
                      name={shift.name}
                      email={shift.email}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gfgk-text">
                        {shift.name ?? shift.email}
                      </p>
                      <p className="truncate text-[13px] text-gfgk-text-2">
                        <span className="capitalize">
                          {formatNorwegianDate(shift.date)}
                        </span>
                        {' · '}
                        <span className="font-mono-nums">
                          {shift.startTime}–{shift.endTime}
                        </span>
                        {shift.note ? ` · ${shift.note}` : ''}
                      </p>
                    </div>
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
