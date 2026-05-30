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

  const nowStr = today.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="space-y-3">
      {isToday && (
        <div className="flex items-center gap-2">
          <span className="pulse-dot h-2 w-2 rounded-full bg-gfgk-gold" aria-hidden="true" />
          <span className="eyebrow text-gfgk-gold-deep">Nå · {nowStr}</span>
        </div>
      )}

      {sorted.length === 0 ? (
        <p className="text-sm text-gfgk-text-3">Ingen events denne dagen.</p>
      ) : (
        <div className="space-y-2">
          {Array.from(groups.entries()).map(([hour, items]) => (
            <div key={hour} className="grid grid-cols-[40px_1fr] gap-3">
              <span className="font-mono-nums text-xs font-semibold text-gfgk-text-3">
                {hour}:00
              </span>
              <div className="space-y-1.5">
                {items.map((e) => (
                  <div
                    key={e.id}
                    className={cn(
                      'rounded-xl border border-gfgk-border border-l-4 bg-white p-3 shadow-card',
                      TONE_ACCENT[e.tone],
                    )}
                  >
                    <p className="font-mono-nums text-xs font-semibold text-gfgk-text-2">
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
