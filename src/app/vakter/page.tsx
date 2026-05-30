import { and, asc, eq, gte, lte } from 'drizzle-orm'
import { CalendarClock, ChevronLeft, ChevronRight } from 'lucide-react'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getDb } from '@/db'
import { shifts, timeOff } from '@/db/schema'
import { AppShell } from '@/components/AppShell'
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
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionLabel } from '@/components/ui/SectionLabel'
import {
  endOfMonth,
  endOfWeek,
  endOfYear,
  formatNorwegianMonthYear,
  isoWeek,
  shiftPeriod,
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
  const parsedDate = dateParam ? new Date(dateParam + 'T00:00:00') : new Date()
  // Ugyldig ?date= gir Invalid Date som kan 500-e nedstrøms — fall tilbake til i dag.
  const refDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate

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

  // Beregn forrige/neste. Måneds-visning hopper hele måneder og klamper
  // dagnummeret (refDate er både valgt dag og referansemåned).
  const prev = shiftPeriod(refDate, view, -1)
  const next = shiftPeriod(refDate, view, 1)

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

  const selectedDateStr = toDateString(refDate)
  const selectedDayShifts = myShifts.filter((s) => s.date === selectedDateStr)

  return (
    <AppShell role={session.user.role} userName={session.user.name ?? null}>
        <div className="sticky top-0 z-30 border-b border-gfgk-border bg-gfgk-cream/95 backdrop-blur supports-[backdrop-filter]:bg-gfgk-cream/80">
          <div className="space-y-3 px-6 pt-safe pb-3 lg:mx-auto lg:max-w-6xl">
            <p className="eyebrow pt-3">Mine vakter · {myShifts.length} vakter</p>
            <h1 className="h-display text-2xl capitalize lg:text-3xl">{title}</h1>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <ViewToggle current={view} baseHref="/vakter" />
              <div className="flex items-center justify-end gap-1">
                <a
                  href={`/vakter?view=${view}&date=${toDateString(prev)}`}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-gfgk-border bg-white text-gfgk-text-2 hover:bg-gfgk-cream-deep"
                  aria-label="Forrige"
                >
                  <ChevronLeft className="h-5 w-5" />
                </a>
                <a
                  href={`/vakter?view=${view}&date=${toDateString(new Date())}`}
                  className="flex h-10 items-center rounded-lg border border-gfgk-border bg-white px-4 text-sm font-semibold text-gfgk-text hover:bg-gfgk-cream-deep"
                >
                  I dag
                </a>
                <a
                  href={`/vakter?view=${view}&date=${toDateString(next)}`}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-gfgk-border bg-white text-gfgk-text-2 hover:bg-gfgk-cream-deep"
                  aria-label="Neste"
                >
                  <ChevronRight className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-6 pt-4 lg:mx-auto lg:max-w-6xl">
          {view === 'dag' && <CalendarDay date={refDate} events={timedEvents} />}
          {view === 'uke' && (
            <CalendarWeek
              weekStart={startOfWeek(refDate)}
              events={timedEvents}
              baseHref="/vakter"
            />
          )}
          {view === 'maned' && (
            <>
              <CalendarMonth
                year={refDate.getFullYear()}
                month={refDate.getMonth() + 1}
                events={monthEvents}
                selectedDate={selectedDateStr}
                baseHref="/vakter"
              />
              <section className="space-y-2">
                <SectionLabel as="h3">
                  <span className="capitalize">
                    {refDate.toLocaleDateString('nb-NO', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </span>
                </SectionLabel>
                {selectedDayShifts.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-gfgk-border bg-white/50 px-4 py-6 text-center text-sm text-gfgk-text-3">
                    Ingen vakter denne dagen
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedDayShifts.map((s) => (
                      <div
                        key={s.id}
                        className="min-h-[44px] rounded-xl border border-gfgk-border border-l-4 border-l-gfgk-gold bg-white p-3 shadow-card"
                      >
                        <p className="font-mono-nums text-xs font-semibold text-gfgk-text-2">
                          {s.startTime}–{s.endTime}
                        </p>
                        {s.note && (
                          <p className="mt-0.5 text-sm font-semibold text-gfgk-text">
                            {s.note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
          {view === 'ar' && (
            <CalendarYear
              year={refDate.getFullYear()}
              events={monthEvents}
              baseHref="/vakter"
            />
          )}

          {myShifts.length === 0 && myTimeOff.length === 0 && (
            <EmptyState
              icon={CalendarClock}
              title="Ingen vakter i denne perioden"
              description="Du har ingen planlagte vakter her. Publiserte vakter dukker opp i kalenderen så snart de er satt opp."
            />
          )}

          {view === 'ar' && myShifts.length > 0 && (
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
    </AppShell>
  )
}
