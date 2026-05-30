import { and, asc, eq, gte, inArray, isNotNull, lte, ne } from 'drizzle-orm'
import { CheckSquare, ClipboardList } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AppShell } from '@/components/AppShell'
import { AnnouncementBanner } from '@/components/blocks/AnnouncementBanner'
import { ClockButton } from '@/components/blocks/ClockButton'
import { InstallPrompt } from '@/components/blocks/InstallPrompt'
import { TaskBlock } from '@/components/blocks/TaskBlock'
import { Avatar } from '@/components/ui/Avatar'
import {
  BottomSheet,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetTitle,
  BottomSheetTrigger,
} from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { KPI } from '@/components/ui/KPI'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { Textarea } from '@/components/ui/Textarea'
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
import { createHandover, listTodaysHandovers } from '@/lib/handovers'
import { toggleTaskDone } from '@/lib/tasks'

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
    myTodayTasks,
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
    // Mine oppgaver i dag — tildelt meg, frist i dag eller forfalt, ikke fullført
    db
      .select({
        id: tasks.id,
        title: tasks.title,
        status: tasks.status,
        priority: tasks.priority,
        dueDate: tasks.dueDate,
        zone: tasks.zone,
      })
      .from(tasks)
      .innerJoin(taskAssignees, eq(taskAssignees.taskId, tasks.id))
      .where(
        and(
          eq(taskAssignees.userId, userId),
          ne(tasks.status, 'done'),
          isNotNull(tasks.dueDate),
          lte(tasks.dueDate, today),
        ),
      )
      .orderBy(asc(tasks.dueDate)),
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

  const todaysHandovers = await listTodaysHandovers()

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
    <AppShell role={session.user.role} userName={session.user.name ?? null}>
        <header className="bg-gfgk-black px-6 pt-safe pb-7">
          <div className="lg:mx-auto lg:max-w-6xl">
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
          </div>
        </header>

        <div className="lg:mx-auto lg:max-w-6xl">
        {/* KPI-strip */}
        <div className="px-6 pt-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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

        {/* Install + annonseringer spenner full bredde over kolonnene */}
        <div className="space-y-6 px-6 pt-6 empty:hidden">
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
        </div>

        <div className="px-6 pt-6 lg:grid lg:grid-cols-[2fr_1fr] lg:items-start lg:gap-6 lg:pt-6">
        {/* Venstre hovedkolonne */}
        <div className="space-y-6 lg:pt-0">
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

          {/* Mine oppgaver i dag */}
          <section>
            <SectionLabel>Mine oppgaver i dag</SectionLabel>
            {myTodayTasks.length === 0 ? (
              <p className="text-sm text-gfgk-text-3">
                Ingen oppgaver med frist i dag.
              </p>
            ) : (
              <div className="space-y-2">
                {myTodayTasks.map((t) => (
                  <TaskBlock
                    key={t.id}
                    task={{
                      id: t.id,
                      title: t.title,
                      status: t.status,
                      priority: t.priority,
                      dueDate: t.dueDate,
                      zone: t.zone,
                      assignees: [],
                    }}
                    onToggle={toggleTaskDone}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Høyre siderail */}
        <div className="mt-6 space-y-6 lg:mt-0">
          {/* Overlevering */}
          <section>
            <SectionLabel>Overlevering</SectionLabel>
            {todaysHandovers.length === 0 ? (
              <p className="text-sm text-gfgk-text-3">
                Ingen overlevering i dag ennå.
              </p>
            ) : (
              <div className="space-y-2">
                {todaysHandovers.map((h) => (
                  <Card key={h.id} padding="md" accent="gold" className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Avatar
                        size="sm"
                        src={h.fromAvatar}
                        name={h.fromName}
                        email={h.fromEmail}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gfgk-text">
                          {h.fromName ?? h.fromEmail}
                        </p>
                        <p className="font-mono-nums text-xs text-gfgk-text-3">
                          {h.createdAt.toLocaleTimeString('nb-NO', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-gfgk-text">
                      {h.note}
                    </p>
                    {h.openItems && h.openItems.length > 0 && (
                      <ul className="space-y-1 border-t border-gfgk-border pt-2">
                        {h.openItems.map((it, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm text-gfgk-text-2"
                          >
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gfgk-gold" />
                            {it}
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card>
                ))}
              </div>
            )}
            <BottomSheet>
              <BottomSheetTrigger asChild>
                <Button variant="secondary" size="sm" className="mt-3">
                  <ClipboardList className="h-4 w-4" /> Skriv overlevering
                </Button>
              </BottomSheetTrigger>
              <BottomSheetContent>
                <BottomSheetTitle>Skriv overlevering</BottomSheetTitle>
                <form action={createHandover} className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                      Overlevering
                    </label>
                    <Textarea
                      name="note"
                      rows={3}
                      required
                      placeholder="Hva bør neste vakt vite?"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                      Åpne punkter (ett per linje)
                    </label>
                    <Textarea
                      name="openItems"
                      rows={3}
                      placeholder={'Range-maskin 2 vakler\nMangler giveaway-baller'}
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <BottomSheetClose asChild>
                      <Button type="button" variant="secondary" fullWidth>
                        Avbryt
                      </Button>
                    </BottomSheetClose>
                    <Button type="submit" variant="primary" fullWidth>
                      Lagre
                    </Button>
                  </div>
                </form>
              </BottomSheetContent>
            </BottomSheet>
          </section>

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
                    className="flex items-center justify-between gap-3 rounded-xl border border-gfgk-border border-l-4 border-l-gfgk-gold bg-white px-4 py-3 shadow-card"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold capitalize text-gfgk-text">
                        {formatNorwegianDate(shift.date)}
                      </p>
                      <p className="truncate text-[13px] text-gfgk-text-2">
                        <span className="font-mono-nums">
                          {shift.startTime}–{shift.endTime}
                        </span>
                        {shift.note ? ` · ${shift.note}` : ''}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="max-w-[120px] truncate text-right text-xs text-gfgk-text-3">
                        {shift.name ?? shift.email}
                      </span>
                      <Avatar
                        size="sm"
                        src={shift.avatarUrl}
                        name={shift.name}
                        email={shift.email}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
        </div>
        </div>
    </AppShell>
  )
}
