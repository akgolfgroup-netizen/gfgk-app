import { cn } from '@/lib/cn'

export type CalendarView = 'dag' | 'uke' | 'maned' | 'ar'

interface ViewToggleProps {
  current: CalendarView
  baseHref: string // f.eks. '/kalender' eller '/vakter'
}

const VIEWS: Array<{ key: CalendarView; label: string }> = [
  { key: 'dag', label: 'Dag' },
  { key: 'uke', label: 'Uke' },
  { key: 'maned', label: 'Måned' },
  { key: 'ar', label: 'År' },
]

export function ViewToggle({ current, baseHref }: ViewToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-gfgk-border bg-white p-0.5">
      {VIEWS.map((v) => (
        <a
          key={v.key}
          href={`${baseHref}?view=${v.key}`}
          className={cn(
            'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
            current === v.key
              ? 'bg-gfgk-gold text-gfgk-black'
              : 'text-gfgk-text-2 hover:text-gfgk-text',
          )}
        >
          {v.label}
        </a>
      ))}
    </div>
  )
}

export function parseView(input: string | undefined): CalendarView {
  if (input === 'dag' || input === 'uke' || input === 'ar' || input === 'maned') {
    return input
  }
  return 'maned'
}
