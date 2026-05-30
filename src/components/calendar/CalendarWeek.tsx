import { daysInWeek, sameDay, toDateString, WEEKDAYS_NB } from '@/lib/calendar'
import { cn } from '@/lib/cn'

export interface CalendarTimedEvent {
  id: string
  date: string // YYYY-MM-DD
  startTime: string // HH:MM
  endTime: string
  title: string
  tone: 'gold' | 'teal' | 'red'
}

interface CalendarWeekProps {
  weekStart: Date
  events: CalendarTimedEvent[]
  baseHref: string
}

const TONE_BG = {
  gold: 'bg-gfgk-gold text-gfgk-black',
  teal: 'bg-gfgk-teal text-white',
  red: 'bg-gfgk-red text-white',
} as const

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

const START_HOUR = 7
const END_HOUR = 22
const HOUR_HEIGHT = 48 // px

export function CalendarWeek({ weekStart, events, baseHref }: CalendarWeekProps) {
  const days = daysInWeek(weekStart)
  const today = new Date()

  // NÅ-markør: gull-linje på dagens tidspunkt hvis uka inneholder i dag
  const nowMin = today.getHours() * 60 + today.getMinutes()
  const showNow =
    days.some((d) => sameDay(d, today)) &&
    nowMin >= START_HOUR * 60 &&
    nowMin <= END_HOUR * 60
  const nowTop = ((nowMin - START_HOUR * 60) / 60) * HOUR_HEIGHT

  return (
    <div className="overflow-hidden rounded-2xl border border-gfgk-border bg-white shadow-card">
      {/* Header: ukedager */}
      <div className="grid grid-cols-[40px_repeat(7,_1fr)] border-b border-gfgk-border bg-gfgk-black">
        <div />
        {days.map((d, i) => {
          const isToday = sameDay(d, today)
          return (
            <a
              key={i}
              href={`${baseHref}?view=dag&date=${toDateString(d)}`}
              className="flex flex-col items-center py-2 text-center transition-colors hover:bg-white/5"
            >
              <span className="text-[10px] font-extrabold uppercase tracking-wide text-gfgk-gold">
                {WEEKDAYS_NB[i]}
              </span>
              <span
                className={cn(
                  'mt-0.5 text-sm font-bold',
                  isToday ? 'text-gfgk-gold' : 'text-white/80',
                )}
              >
                {d.getDate()}
              </span>
            </a>
          )
        })}
      </div>

      {/* Timeline */}
      <div
        className="relative grid grid-cols-[40px_repeat(7,_1fr)]"
        style={{ height: `${(END_HOUR - START_HOUR) * HOUR_HEIGHT}px` }}
      >
        {/* NÅ-markør */}
        {showNow && (
          <div
            className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
            style={{ top: `${nowTop}px` }}
            aria-hidden="true"
          >
            <span className="pulse-dot ml-1.5 h-2 w-2 shrink-0 rounded-full bg-gfgk-gold" />
            <div className="h-px flex-1 bg-gfgk-gold/80" />
          </div>
        )}

        {/* Time labels */}
        <div className="flex flex-col">
          {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (
            <div
              key={i}
              className="border-b border-gfgk-border text-right pr-1 text-[10px] text-gfgk-text-3"
              style={{ height: `${HOUR_HEIGHT}px` }}
            >
              {String(START_HOUR + i).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* 7 day columns */}
        {days.map((d, dayIdx) => {
          const dateStr = toDateString(d)
          const dayEvents = events.filter((e) => e.date === dateStr)
          return (
            <div
              key={dayIdx}
              className="relative border-l border-gfgk-border"
            >
              {/* Hourly grid */}
              {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (
                <div
                  key={i}
                  className="border-b border-gfgk-border"
                  style={{ height: `${HOUR_HEIGHT}px` }}
                />
              ))}
              {/* Events */}
              {dayEvents.map((e) => {
                const startMin = timeToMinutes(e.startTime)
                const endMin = timeToMinutes(e.endTime)
                const offsetMin = startMin - START_HOUR * 60
                const heightMin = endMin - startMin
                if (offsetMin < 0 || heightMin <= 0) return null
                return (
                  <div
                    key={e.id}
                    className={cn(
                      'absolute left-0.5 right-0.5 rounded-md px-1 py-0.5 text-[10px] font-semibold overflow-hidden',
                      TONE_BG[e.tone],
                    )}
                    style={{
                      top: `${(offsetMin / 60) * HOUR_HEIGHT}px`,
                      height: `${(heightMin / 60) * HOUR_HEIGHT}px`,
                    }}
                  >
                    <div className="truncate">{e.startTime}</div>
                    <div className="truncate">{e.title}</div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
