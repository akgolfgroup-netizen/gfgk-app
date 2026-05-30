'use client'

import { Calendar, Columns3, List, Table } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/cn'
import { parseTaskView, type TaskView } from '@/lib/task-views'

const OPTIONS: Array<{ view: TaskView; label: string; icon: LucideIcon }> = [
  { view: 'liste', label: 'Liste', icon: List },
  { view: 'tavle', label: 'Tavle', icon: Columns3 },
  { view: 'tabell', label: 'Tabell', icon: Table },
  { view: 'kalender', label: 'Kalender', icon: Calendar },
]

export function TaskViewSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = parseTaskView(searchParams.get('view'))

  function select(view: TaskView) {
    const params = new URLSearchParams(searchParams)
    if (view === 'liste') {
      params.delete('view')
    } else {
      params.set('view', view)
    }
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  return (
    <div className="inline-flex w-full gap-1 rounded-xl border border-gfgk-border bg-white p-1 shadow-card sm:w-auto">
      {OPTIONS.map(({ view, label, icon: Icon }) => {
        const active = view === current
        return (
          <button
            key={view}
            type="button"
            onClick={() => select(view)}
            aria-pressed={active}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:flex-none',
              active
                ? 'bg-gfgk-gold text-gfgk-black'
                : 'text-gfgk-text-2 hover:bg-gfgk-cream-deep hover:text-gfgk-text',
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={2} />
            <span className="hidden sm:inline">{label}</span>
            <span className="sr-only sm:hidden">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
