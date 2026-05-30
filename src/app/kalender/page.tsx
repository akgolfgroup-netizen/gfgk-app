import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AppShell } from '@/components/AppShell'
import { CalendarDay } from '@/components/calendar/CalendarDay'
import { CalendarMonth, type CalendarEvent } from '@/components/calendar/CalendarMonth'
import { CalendarWeek, type CalendarTimedEvent } from '@/components/calendar/CalendarWeek'
import { CalendarYear } from '@/components/calendar/CalendarYear'
import { ViewToggle, parseView, type CalendarView } from '@/components/calendar/ViewToggle'
import {
  BottomSheet,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetTitle,
  BottomSheetTrigger,
} from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { FAB } from '@/components/ui/FAB'
import { Input } from '@/components/ui/Input'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { cn } from '@/lib/cn'
import type { Activity } from '@/db/schema'
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
import { createActivity, listActivities } from '@/lib/activities'

interface PageProps {
  searchParams: Promise<{ view?: string; date?: string }>
}

const ACTIVITY_ACCENT = {
  gold: 'border-l-gfgk-gold',
  teal: 'border-l-gfgk-teal',
  red: 'border-l-gfgk-red',
  neutral: 'border-l-gfgk-text-3',
} as const

function activityTone(type: Activity['type']): 'gold' | 'teal' | 'red' | 'neutral' {
  switch (type) {
    case 'turnering':
      return 'gold'
    case 'kurs':
      return 'teal'
    case 'sosial':
      return 'red'
    default:
      return 'neutral'
  }
}

function toTimedEvent(a: Activity): CalendarTimedEvent {
  const tone = activityTone(a.type)
  return {
    id: a.id,
    date: toDateString(a.startAt),
    startTime: a.startAt.toLocaleTimeString('nb-NO', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    endTime: a.endAt.toLocaleTimeString('nb-NO', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    title: a.title,
    tone: tone === 'neutral' ? 'gold' : tone,
  }
}

export default async function KalenderPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { view: viewParam, date: dateParam } = await searchParams
  const view: CalendarView = parseView(viewParam)
  const parsedDate = dateParam ? new Date(dateParam + 'T00:00:00') : new Date()
  // Ugyldig ?date= gir Invalid Date som kan 500-e nedstrøms — fall tilbake til i dag.
  const refDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate

  // Beregn intervall basert på view
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

  const activities = await listActivities({ from, to })

  // Beregn forrige/neste. I måneds-visning er refDate BÅDE valgt dag og
  // referansemåned — hopp hele måneder og klamp dagnummeret så vi ikke
  // ruller over til en annen måned (f.eks. 31. mai → «31. april» = 1. mai).
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

  const monthEvents: CalendarEvent[] = activities.map((a) => ({
    id: a.id,
    date: toDateString(a.startAt),
    tone: activityTone(a.type),
  }))

  const selectedDateStr = toDateString(refDate)
  const selectedDayActivities = activities
    .filter((a) => toDateString(a.startAt) === selectedDateStr)
    .sort((a, b) => a.startAt.getTime() - b.startAt.getTime())

  return (
    <AppShell role={session.user.role} userName={session.user.name ?? null}>
        <div className="sticky top-0 z-30 border-b border-gfgk-border bg-gfgk-cream/95 backdrop-blur supports-[backdrop-filter]:bg-gfgk-cream/80">
          <div className="space-y-3 px-6 pt-safe pb-3 lg:mx-auto lg:max-w-6xl">
            <p className="eyebrow pt-3">Kalender · Turneringer og aktiviteter</p>
            <h1 className="h-display text-2xl capitalize lg:text-3xl">{title}</h1>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <ViewToggle current={view} baseHref="/kalender" />
              <div className="flex items-center justify-end gap-1">
                <a
                  href={`/kalender?view=${view}&date=${toDateString(prev)}`}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-gfgk-border bg-white text-gfgk-text-2 hover:bg-gfgk-cream-deep"
                  aria-label="Forrige"
                >
                  <ChevronLeft className="h-5 w-5" />
                </a>
                <a
                  href={`/kalender?view=${view}&date=${toDateString(new Date())}`}
                  className="flex h-10 items-center rounded-lg border border-gfgk-border bg-white px-4 text-sm font-semibold text-gfgk-text hover:bg-gfgk-cream-deep"
                >
                  I dag
                </a>
                <a
                  href={`/kalender?view=${view}&date=${toDateString(next)}`}
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
          {view === 'dag' && (
            <CalendarDay date={refDate} events={activities.map(toTimedEvent)} />
          )}
          {view === 'uke' && (
            <CalendarWeek
              weekStart={startOfWeek(refDate)}
              events={activities.map(toTimedEvent)}
              baseHref="/kalender"
            />
          )}
          {view === 'maned' && (
            <>
              <CalendarMonth
                year={refDate.getFullYear()}
                month={refDate.getMonth() + 1}
                events={monthEvents}
                selectedDate={selectedDateStr}
                baseHref="/kalender"
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
                {selectedDayActivities.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-gfgk-border bg-white/50 px-4 py-6 text-center text-sm text-gfgk-text-3">
                    Ingen aktiviteter denne dagen
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedDayActivities.map((a) => (
                      <div
                        key={a.id}
                        className={cn(
                          'min-h-[44px] rounded-xl border border-gfgk-border border-l-4 bg-white p-3 shadow-card',
                          ACTIVITY_ACCENT[activityTone(a.type)],
                        )}
                      >
                        <p className="font-mono-nums text-xs font-semibold text-gfgk-text-2">
                          {a.startAt.toLocaleTimeString('nb-NO', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          –
                          {a.endAt.toLocaleTimeString('nb-NO', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-gfgk-text">
                          {a.title}
                        </p>
                        {a.location && (
                          <p className="mt-0.5 text-xs text-gfgk-text-3">{a.location}</p>
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
              baseHref="/kalender"
            />
          )}

          {/* Liste over events for året */}
          {view === 'ar' && activities.length > 0 && (
            <section>
              <SectionLabel as="h3">Kommende</SectionLabel>
              <div className="space-y-2">
                {activities.slice(0, 10).map((a) => (
                  <div
                    key={a.id}
                    className="rounded-xl border border-gfgk-border border-l-4 border-l-gfgk-teal bg-white p-3 shadow-card"
                  >
                    <p className="text-sm font-semibold text-gfgk-text">{a.title}</p>
                    <p className="mt-0.5 text-xs text-gfgk-text-2">
                      {a.startAt.toLocaleDateString('nb-NO', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                      {' · '}
                      {a.startAt.toLocaleTimeString('nb-NO', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {a.location ? ` · ${a.location}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

      {session.user.role === 'admin' && (
        <BottomSheet>
          <BottomSheetTrigger asChild>
            <FAB aria-label="Ny aktivitet">
              <Plus className="h-6 w-6" strokeWidth={2.5} />
            </FAB>
          </BottomSheetTrigger>
          <BottomSheetContent>
            <BottomSheetTitle>Ny aktivitet</BottomSheetTitle>
            <form action={createActivity} className="space-y-3">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                  Tittel
                </label>
                <Input name="title" type="text" required autoFocus />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                  Type
                </label>
                <Select name="type" defaultValue="intern">
                  <option value="turnering">Turnering</option>
                  <option value="kurs">Kurs</option>
                  <option value="intern">Intern</option>
                  <option value="sosial">Sosial</option>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                    Start
                  </label>
                  <Input name="startAt" type="datetime-local" required />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                    Slutt
                  </label>
                  <Input name="endAt" type="datetime-local" required />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                  Sted
                </label>
                <Input name="location" type="text" placeholder="F.eks. Banen" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                  Beskrivelse
                </label>
                <Textarea name="description" rows={2} />
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
