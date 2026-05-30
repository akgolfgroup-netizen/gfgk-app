'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { TaskBlockData } from '@/components/blocks/TaskBlock'
import { cn } from '@/lib/cn'

export interface TaskCalendarViewProps {
  tasks: TaskBlockData[]
}

const WEEKDAYS = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn']
const MONTHS = [
  'januar',
  'februar',
  'mars',
  'april',
  'mai',
  'juni',
  'juli',
  'august',
  'september',
  'oktober',
  'november',
  'desember',
]

function dateKey(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${year}-${m}-${d}`
}

function priorityColor(priority: TaskBlockData['priority']): string {
  switch (priority) {
    case 'high':
      return 'bg-gfgk-red-light text-gfgk-red-deep'
    case 'low':
      return 'bg-gfgk-teal-light text-gfgk-teal-deep'
    default:
      return 'bg-gfgk-gold-light text-gfgk-gold-deep'
  }
}

export function TaskCalendarView({ tasks }: TaskCalendarViewProps) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const todayKey = now.toISOString().slice(0, 10)

  const byDate = useMemo(() => {
    const map = new Map<string, TaskBlockData[]>()
    for (const t of tasks) {
      if (!t.dueDate) continue
      const list = map.get(t.dueDate)
      if (list) list.push(t)
      else map.set(t.dueDate, [t])
    }
    return map
  }, [tasks])

  // Bygg grid: ledende tomme celler (man=0) + dager i måneden.
  const firstDay = new Date(year, month, 1)
  // getDay(): søn=0..lør=6 → konverter til man=0..søn=6.
  const leading = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: Array<{ day: number; key: string } | null> = []
  for (let i = 0; i < leading; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, key: dateKey(year, month, d) })
  }

  const noDue = tasks.filter((t) => !t.dueDate)

  function prevMonth() {
    if (month === 0) {
      setMonth(11)
      setYear((y) => y - 1)
    } else {
      setMonth((m) => m - 1)
    }
  }
  function nextMonth() {
    if (month === 11) {
      setMonth(0)
      setYear((y) => y + 1)
    } else {
      setMonth((m) => m + 1)
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-bold capitalize text-gfgk-text">
          {MONTHS[month]} {year}
        </h3>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={prevMonth}
            aria-label="Forrige måned"
            className="rounded-lg border border-gfgk-border bg-white p-1.5 text-gfgk-text-2 hover:bg-gfgk-cream-deep"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            aria-label="Neste måned"
            className="rounded-lg border border-gfgk-border bg-white p-1.5 text-gfgk-text-2 hover:bg-gfgk-cream-deep"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="pb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-gfgk-text-3"
          >
            {w}
          </div>
        ))}
        {cells.map((cell, i) => {
          if (!cell) return <div key={`empty-${i}`} className="min-h-20" />
          const dayTasks = byDate.get(cell.key) ?? []
          const isToday = cell.key === todayKey
          return (
            <div
              key={cell.key}
              className={cn(
                'flex min-h-20 flex-col gap-1 overflow-hidden rounded-lg border border-gfgk-border bg-white p-1',
                isToday && 'border-gfgk-gold bg-gfgk-gold-light/30',
              )}
            >
              <span
                className={cn(
                  'text-[11px] font-semibold',
                  isToday ? 'text-gfgk-gold-deep' : 'text-gfgk-text-3',
                )}
              >
                {cell.day}
              </span>
              {dayTasks.slice(0, 3).map((t) => (
                <Link
                  key={t.id}
                  href={`/oppgaver/${t.id}`}
                  title={t.title}
                  className={cn(
                    'truncate rounded px-1 py-0.5 text-[10px] font-medium leading-tight',
                    priorityColor(t.priority),
                  )}
                >
                  {t.title}
                </Link>
              ))}
              {dayTasks.length > 3 && (
                <span className="px-1 text-[10px] text-gfgk-text-3">
                  +{dayTasks.length - 3} til
                </span>
              )}
            </div>
          )
        })}
      </div>

      {noDue.length > 0 && (
        <div className="mt-6">
          <p className="eyebrow mb-2">Uten frist</p>
          <div className="flex flex-wrap gap-2">
            {noDue.map((t) => (
              <Link
                key={t.id}
                href={`/oppgaver/${t.id}`}
                className={cn(
                  'truncate rounded-full px-3 py-1 text-xs font-medium',
                  priorityColor(t.priority),
                )}
              >
                {t.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
