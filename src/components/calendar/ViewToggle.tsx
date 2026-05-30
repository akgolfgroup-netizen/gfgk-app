import { Calendar, CalendarDays, CalendarRange, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/cn'

export type CalendarView = 'dag' | 'uke' | 'maned' | 'ar'

interface ViewToggleProps {
  current: CalendarView
  baseHref: string // f.eks. '/kalender' eller '/vakter'
}

const VIEWS: Array<{ key: CalendarView; label: string; icon: typeof Calendar }> = [
  { key: 'dag', label: 'Dag', icon: CalendarDays },
  { key: 'uke', label: 'Uke', icon: CalendarRange },
  { key: 'maned', label: 'Måned', icon: LayoutGrid },
  { key: 'ar', label: 'År', icon: Calendar },
]

export function ViewToggle({ current, baseHref }: ViewToggleProps) {
  return (
    <div className="inline-flex w-full gap-0.5 rounded-xl border border-gfgk-border bg-white p-1 sm:w-auto">
      {VIEWS.map((v) => {
        const Icon = v.icon
        const active = current === v.key
        return (
          <a
            key={v.key}
            href={`${baseHref}?view=${v.key}`}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:flex-none',
              active
                ? 'bg-gfgk-gold text-gfgk-black shadow-sm'
                : 'text-gfgk-text-2 hover:bg-gfgk-cream-deep hover:text-gfgk-text',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={2.25} />
            <span className="hidden sm:inline">{v.label}</span>
          </a>
        )
      })}
    </div>
  )
}

export function parseView(input: string | undefined): CalendarView {
  if (input === 'dag' || input === 'uke' || input === 'ar' || input === 'maned') {
    return input
  }
  return 'maned'
}
