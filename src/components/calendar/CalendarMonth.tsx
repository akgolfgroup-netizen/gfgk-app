import { monthGrid, sameDay, WEEKDAYS_NB } from '@/lib/calendar'
import { cn } from '@/lib/cn'

export interface CalendarEvent {
  id: string
  date: string // 'YYYY-MM-DD' eller ISO string
  tone: 'gold' | 'teal' | 'red' | 'neutral'
}

interface CalendarMonthProps {
  year: number
  month: number // 1-12
  events: CalendarEvent[]
  selectedDate?: string
  baseHref: string // for navigering når en dag klikkes
}

const TONE_DOT = {
  gold: 'bg-gfgk-gold',
  teal: 'bg-gfgk-teal',
  red: 'bg-gfgk-red',
  neutral: 'bg-gfgk-text-3',
} as const

export function CalendarMonth({
  year,
  month,
  events,
  selectedDate,
  baseHref,
}: CalendarMonthProps) {
  const cells = monthGrid(year, month)
  const today = new Date()

  // Indekser events på dato (YYYY-MM-DD)
  const eventsByDate = new Map<string, CalendarEvent[]>()
  for (const e of events) {
    const key = e.date.slice(0, 10)
    const arr = eventsByDate.get(key) ?? []
    arr.push(e)
    eventsByDate.set(key, arr)
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gfgk-border bg-white shadow-card">
      {/* Header med ukedager */}
      <div className="grid grid-cols-7 bg-gfgk-black">
        {WEEKDAYS_NB.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-[10px] font-extrabold uppercase tracking-wide text-gfgk-gold"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((cell, i) => {
          const isToday = sameDay(cell.date, today)
          const isSelected = selectedDate === cell.isoString
          const dayEvents = eventsByDate.get(cell.isoString) ?? []
          const dayNum = cell.date.getDate()

          return (
            <a
              key={i}
              href={`${baseHref}?view=dag&date=${cell.isoString}`}
              className={cn(
                'flex min-h-[48px] flex-col items-center justify-start gap-1 border-b border-r border-gfgk-border p-1 text-xs transition-colors hover:bg-gfgk-cream-deep',
                !cell.inMonth && 'bg-gfgk-cream/50 text-gfgk-text-3',
                cell.inMonth && 'text-gfgk-text-2',
                isToday && 'bg-gfgk-gold-light',
                isSelected && '!bg-gfgk-gold !text-gfgk-black',
              )}
            >
              <span
                className={cn(
                  'font-semibold',
                  isToday && 'text-gfgk-gold-deep',
                  isSelected && 'text-gfgk-black',
                )}
              >
                {dayNum}
              </span>
              {dayEvents.length > 0 && (
                <div className="flex gap-0.5">
                  {dayEvents.slice(0, 3).map((e, j) => (
                    <span
                      key={j}
                      className={cn('h-1 w-1 rounded-full', TONE_DOT[e.tone])}
                      aria-hidden="true"
                    />
                  ))}
                </div>
              )}
            </a>
          )
        })}
      </div>
    </div>
  )
}
