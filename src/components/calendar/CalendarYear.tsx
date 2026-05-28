import { monthGrid, sameDay, MONTHS_NB } from '@/lib/calendar'
import { cn } from '@/lib/cn'
import type { CalendarEvent } from './CalendarMonth'

interface CalendarYearProps {
  year: number
  events: CalendarEvent[]
  baseHref: string
}

export function CalendarYear({ year, events, baseHref }: CalendarYearProps) {
  const today = new Date()
  const eventsByDate = new Set<string>(events.map((e) => e.date.slice(0, 10)))

  return (
    <div className="grid grid-cols-3 gap-3">
      {Array.from({ length: 12 }, (_, m) => {
        const cells = monthGrid(year, m + 1)
        return (
          <a
            key={m}
            href={`${baseHref}?view=maned&date=${year}-${String(m + 1).padStart(2, '0')}-01`}
            className="overflow-hidden rounded-lg border border-gfgk-border bg-white p-2 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="mb-1.5 text-center text-[10px] font-extrabold uppercase tracking-wide capitalize text-gfgk-gold-deep">
              {MONTHS_NB[m]}
            </p>
            <div className="grid grid-cols-7 gap-px text-[8px]">
              {cells.map((cell, i) => {
                const isToday = sameDay(cell.date, today)
                const hasEvent = eventsByDate.has(cell.isoString)
                return (
                  <div
                    key={i}
                    className={cn(
                      'flex h-3 items-center justify-center',
                      !cell.inMonth && 'text-gfgk-text-3',
                      cell.inMonth && 'text-gfgk-text-2',
                      isToday && 'rounded-full bg-gfgk-black text-gfgk-gold',
                      hasEvent && !isToday && 'font-bold text-gfgk-gold-deep',
                    )}
                  >
                    {cell.date.getDate()}
                  </div>
                )
              })}
            </div>
          </a>
        )
      })}
    </div>
  )
}
