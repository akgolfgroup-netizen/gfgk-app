import { and, asc, eq, gte, lte } from 'drizzle-orm'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getDb } from '@/db'
import { shifts, timeOff } from '@/db/schema'
import { BottomNav } from '@/components/BottomNav'
import { ShiftEventForm } from '@/components/blocks/ShiftEventForm'
import { logShiftEvent } from '@/lib/shift-events'
import { CalendarDay } from '@/components/calendar/CalendarDay'
import { CalendarMonth, type CalendarEvent } from '@/components/calendar/CalendarMonth'
import { CalendarWeek, type CalendarTimedEvent } from '@/components/calendar/CalendarWeek'
import { CalendarYear } from '@/components/calendar/CalendarYear'
import {
  ViewToggle,
  parseView,
  type CalendarView,
} from '@/components/calendar/ViewToggle'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionLabel } from '@/components/ui/SectionLabel'
import {
  endOfMonth,
  endOfWeek,
  endOfYear,
  formatNorwegianMonthYear,
  isoWeek,
  startOfMonth,
  startOfWeek,
  startOfYear,
  toDateString,
} from '@/lib/calendar'

interface PageProps {
  searchParams: Promise<{ view?: string; date?: string }>
}

export default async function VakterPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { view: viewParam, date: dateParam } = await searchParams
  const view: CalendarView = parseView(viewParam)
  const refDate = dateParam ? new Date(dateParam + 'T00:00:00') : new Date()

  let from: Date
  let to: Date
  if (view === 'dag') {
    from = new Date(refDate)
    from.setHours(0, 0, 0, 0)
    to = new Date(refDate)
    to.setHours(23, 59, 59, 999)
  } else if (view === 'uke') {
    from = startOfWeek(refDate)
    to = endOfWeek(refDate)
  } else if (view === 'ar') {
    from = startOfYear(refDate)
    to = endOfYear(refDate)
  } else {
    from = startOfMonth(refDate)
    to = endOfMonth(refDate)
  }

  const fromStr = toDateString(from)
  const toStr = toDateString(to)

  const db = getDb()
  const [myShifts, myTimeOff] = await Promise.all([
    db
      .select()
      .from(shifts)
      .where(
        and(
          eq(shifts.userId, session.user.id),
          eq(shifts.published, true),
          gte(shifts.date, fromStr),
          lte(shifts.date, toStr),
        ),
      )
      .orderBy(asc(shifts.date), asc(shifts.startTime)),
    db
      .select()
      .from(timeOff)
      .where(
        and(
          eq(timeOff.userId, session.user.id),
          eq(timeOff.status, 'approved'),
          lte(timeOff.startDate, toStr),
          gte(timeOff.endDate, fromStr),
        ),
      ),
  ])

  // Beregn forrige/neste
  const prev = new Date(refDate)
  const next = new Date(refDate)
  if (view === 'dag') {
    prev.setDate(prev.getDate() - 1)
    next.setDate(next.getDate() + 1)
  } else if (view === 'uke') {
    prev.setDate(prev.getDate() - 7)
    next.setDate(next.getDate() + 7)
  } else if (view === 'ar') {
    prev.setFullYear(prev.getFullYear() - 1)
    next.setFullYear(next.getFullYear() + 1)
  } else {
    prev.setMonth(prev.getMonth() - 1)
    next.setMonth(next.getMonth() + 1)
  }

  const title =
    view === 'dag'
      ? refDate.toLocaleDateString('nb-NO', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })
      : view === 'uke'
        ? `Uke ${isoWeek(refDate)} · ${refDate.getFullYear()}`
        : view === 'ar'
          ? String(refDate.getFullYear())
          : formatNorwegianMonthYear(refDate)

  // Bygg events for kalender-komponentene
  const monthEvents: CalendarEvent[] = []
  for (const s of myShifts) {
    monthEvents.push({ id: s.id, date: s.date, tone: 'gold' })
  }
  for (const t of myTimeOff) {
    // Expand ferie-periode til dager
    const start = new Date(t.startDate + 'T00:00:00')
    const end = new Date(t.endDate + 'T00:00:00')
    for (
      const d = new Date(start);
      d <= end;
      d.setDate(d.getDate() + 1)
    ) {
      monthEvents.push({ id: `${t.id}-${toDateString(d)}`, date: toDateString(d), tone: 'red' })
    }
  }

  const timedEvents: CalendarTimedEvent[] = myShifts.map((s) => ({
    id: s.id,
    date: s.date,
    startTime: s.startTime,
    endTime: s.endTime,
    title: s.note ?? 'Vakt',
    tone: 'gold' as const,
  }))

  return (
    <>
      <main className="min-h-dvh pb-24">
        <PageHeader title="Mine vakter" subtitle={`${myShifts.length} vakter`} />

        <div className="space-y-4 px-6 pt-4">
          <div className="flex items-center justify-between gap-3">
            <ViewToggle current={view} baseHref="/vakter" />
            <div className="flex items-center gap-1">
              <a
                href={`/vakter?view=${view}&date=${toDateString(prev)}`}
                className="rounded-md border border-gfgk-border bg-white p-2 text-gfgk-text-2 hover:bg-gfgk-cream-deep"
                aria-label="Forrige"
              >
                <ChevronLeft className="h-4 w-4" />
              </a>
              <a
                href={`/vakter?view=${view}&date=${toDateString(new Date())}`}
                className="rounded-md border border-gfgk-border bg-white px-3 py-1.5 text-xs font-semibold text-gfgk-text hover:bg-gfgk-cream-deep"
              >
                I dag
              </a>
              <a
                href={`/vakter?view=${view}&date=${toDateString(next)}`}
                className="rounded-md border border-gfgk-border bg-white p-2 text-gfgk-text-2 hover:bg-gfgk-cream-deep"
                aria-label="Neste"
              >
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          <h2 className="text-sm font-bold capitalize text-gfgk-text">{title}</h2>

          {view === 'dag' && <CalendarDay date={refDate} events={timedEvents} />}
          {view === 'uke' && (
            <CalendarWeek
              weekStart={startOfWeek(refDate)}
              events={timedEvents}
              baseHref="/vakter"
            />
          )}
          {view === 'maned' && (
            <CalendarMonth
              year={refDate.getFullYear()}
              month={refDate.getMonth() + 1}
              events={monthEvents}
              baseHref="/vakter"
            />
          )}
          {view === 'ar' && (
            <CalendarYear
              year={refDate.getFullYear()}
              events={monthEvents}
              baseHref="/vakter"
            />
          )}

          {(view === 'maned' || view === 'ar') && myShifts.length > 0 && (
            <section>
              <SectionLabel as="h3">Detaljer</SectionLabel>
              <div className="space-y-2">
                {myShifts.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-xl border border-gfgk-border border-l-4 border-l-gfgk-gold bg-white px-4 py-3 shadow-card"
                  >
                    <p className="text-sm font-semibold capitalize text-gfgk-text">
                      {new Date(s.date + 'T00:00:00').toLocaleDateString('nb-NO', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}
                    </p>
                    <p className="mt-0.5 text-sm text-gfgk-text-2">
                      {s.startTime}–{s.endTime}
                      {s.note ? ` · ${s.note}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Loggfør hendelse fra denne måneden */}
          <section>
            <ShiftEventForm shiftId={null} onLog={logShiftEvent} />
          </section>
        </div>
      </main>
      <BottomNav role={session.user.role} />
    </>
  )
}
