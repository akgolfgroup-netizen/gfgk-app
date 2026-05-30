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
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import type { Activity } from '@/db/schema'
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
import { createActivity, listActivities } from '@/lib/activities'

interface PageProps {
  searchParams: Promise<{ view?: string; date?: string }>
}

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
  const refDate = dateParam ? new Date(dateParam + 'T00:00:00') : new Date()

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

  const monthEvents: CalendarEvent[] = activities.map((a) => ({
    id: a.id,
    date: toDateString(a.startAt),
    tone: activityTone(a.type),
  }))

  return (
    <AppShell role={session.user.role} userName={session.user.name ?? null}>
        <PageHeader title="Kalender" subtitle="Turneringer og aktiviteter" />

        <div className="space-y-4 px-6 pt-4 lg:mx-auto lg:max-w-5xl">
          <div className="flex items-center justify-between gap-3">
            <ViewToggle current={view} baseHref="/kalender" />
            <div className="flex items-center gap-1">
              <a
                href={`/kalender?view=${view}&date=${toDateString(prev)}`}
                className="rounded-md border border-gfgk-border bg-white p-2 text-gfgk-text-2 hover:bg-gfgk-cream-deep"
                aria-label="Forrige"
              >
                <ChevronLeft className="h-4 w-4" />
              </a>
              <a
                href={`/kalender?view=${view}&date=${toDateString(new Date())}`}
                className="rounded-md border border-gfgk-border bg-white px-3 py-1.5 text-xs font-semibold text-gfgk-text hover:bg-gfgk-cream-deep"
              >
                I dag
              </a>
              <a
                href={`/kalender?view=${view}&date=${toDateString(next)}`}
                className="rounded-md border border-gfgk-border bg-white p-2 text-gfgk-text-2 hover:bg-gfgk-cream-deep"
                aria-label="Neste"
              >
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          <h2 className="text-sm font-bold capitalize text-gfgk-text">{title}</h2>

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
            <CalendarMonth
              year={refDate.getFullYear()}
              month={refDate.getMonth() + 1}
              events={monthEvents}
              baseHref="/kalender"
            />
          )}
          {view === 'ar' && (
            <CalendarYear
              year={refDate.getFullYear()}
              events={monthEvents}
              baseHref="/kalender"
            />
          )}

          {/* Liste over events for valgt periode (måned/år) */}
          {(view === 'maned' || view === 'ar') && activities.length > 0 && (
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
