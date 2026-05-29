import { cn } from '@/lib/cn'
import type { CalendarTimedEvent } from './CalendarWeek'

interface CalendarDayProps {
  date: Date
  events: CalendarTimedEvent[]
}

const TONE_ACCENT = {
  gold: 'border-l-gfgk-gold',
  teal: 'border-l-gfgk-teal',
  red: 'border-l-gfgk-red',
} as const

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

export function CalendarDay({ date, events }: CalendarDayProps) {
  const today = new Date()
  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()

  const sorted = [...events].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
  )

  // Grupper på tids-blokk (timer)
  const groups = new Map<string, CalendarTimedEvent[]>()
  for (const e of sorted) {
    const hour = e.startTime.split(':')[0] ?? '00'
    const arr = groups.get(hour) ?? []
    arr.push(e)
    groups.set(hour, arr)
  }

  return (
    <div className="space-y-3">
      {isToday && (
        <div className="rounded-lg border border-gfgk-gold bg-gfgk-gold-light px-3 py-2">
          <p className="text-xs font-bold uppercase tracking-wide text-gfgk-gold-deep">
            I dag · {date.toLocaleDateString('nb-NO', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      )}

      {sorted.length === 0 ? (
        <p className="text-sm text-gfgk-text-3">Ingen events denne dagen.</p>
      ) : (
        <div className="space-y-2">
          {Array.from(groups.entries()).map(([hour, items]) => (
            <div key={hour} className="grid grid-cols-[40px_1fr] gap-3">
              <span className="text-xs font-semibold text-gfgk-text-3">
                {hour}:00
              </span>
              <div className="space-y-1.5">
                {items.map((e) => (
                  <div
                    key={e.id}
                    className={cn(
                      'rounded-lg border border-gfgk-border border-l-4 bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,.06)]',
                      TONE_ACCENT[e.tone],
                    )}
                  >
                    <p className="text-xs font-semibold text-gfgk-text-2">
                      {e.startTime}–{e.endTime}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-gfgk-text">
                      {e.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
