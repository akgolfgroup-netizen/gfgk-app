'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, MapPin } from 'lucide-react'
import Link from 'next/link'
import { useTransition } from 'react'
import { AvatarStack, type AvatarStackUser } from '@/components/ui/AvatarStack'
import { Checkbox } from '@/components/ui/Checkbox'
import { Pill, priorityTone } from '@/components/ui/Pill'
import { cn } from '@/lib/cn'

export interface TaskBlockData {
  id: string
  title: string
  status: 'todo' | 'in_progress' | 'waiting' | 'done'
  priority: 'low' | 'medium' | 'high'
  dueDate: string | null
  assignees: AvatarStackUser[]
  zone?: string | null
}

export interface TaskBlockProps {
  task: TaskBlockData
  onToggle: (id: string) => Promise<void>
  sortable?: boolean
  /** Hvis sann, render som en flat card (uten sortable-overhead). */
  flat?: boolean
}

const PRIORITY_LABEL: Record<TaskBlockData['priority'], string> = {
  high: 'Høy',
  medium: 'Middels',
  low: 'Lav',
}

function formatDue(date: string): { label: string; overdue: boolean } {
  const d = new Date(date + 'T23:59:59')
  const now = new Date()
  const overdue = d < now
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const dDay = new Date(date + 'T00:00:00')
  if (dDay.getTime() === today.getTime()) return { label: 'I dag', overdue: false }
  if (dDay.getTime() === tomorrow.getTime()) return { label: 'I morgen', overdue: false }
  return {
    label: dDay.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' }),
    overdue,
  }
}

export function TaskBlock({ task, onToggle, sortable = false, flat = false }: TaskBlockProps) {
  const [isPending, startTransition] = useTransition()

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, disabled: !sortable })

  const style = sortable
    ? {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined

  const done = task.status === 'done'
  const due = task.dueDate ? formatDue(task.dueDate) : null

  return (
    <div
      ref={sortable ? setNodeRef : undefined}
      style={style}
      className={cn(
        'group flex items-center gap-2 rounded-xl border border-gfgk-border bg-white px-3 py-3 shadow-card transition-colors',
        !flat && 'hover:bg-gfgk-cream-deep',
        done && 'opacity-60',
      )}
    >
      {sortable && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Dra for å flytte"
          className="touch-none text-gfgk-text-3 hover:text-gfgk-text-2"
        >
          <GripVertical className="h-5 w-5" />
        </button>
      )}

      <div onClick={(e) => e.stopPropagation()} className="shrink-0">
        <Checkbox
          variant="circle"
          checked={done}
          disabled={isPending}
          onCheckedChange={() => startTransition(() => onToggle(task.id))}
          aria-label={done ? 'Marker som ikke fullført' : 'Marker som fullført'}
        />
      </div>

      <Link
        href={`/oppgaver/${task.id}`}
        className="flex min-w-0 flex-1 flex-col gap-1"
      >
        <span
          className={cn(
            'truncate text-sm font-semibold text-gfgk-text',
            done && 'line-through text-gfgk-text-2',
          )}
        >
          {task.title}
        </span>
        {(due || task.priority !== 'medium' || task.zone || task.assignees.length > 0) && (
          <div className="flex items-center gap-2 text-xs text-gfgk-text-2">
            {due && (
              <span
                className={cn(
                  due.overdue && !done ? 'font-semibold text-gfgk-red-deep' : '',
                )}
              >
                {due.label}
              </span>
            )}
            {task.priority !== 'medium' && (
              <Pill tone={priorityTone(task.priority)} size="sm">
                {PRIORITY_LABEL[task.priority]}
              </Pill>
            )}
            {task.zone && (
              <span className="inline-flex items-center gap-1 text-xs text-gfgk-text-3">
                <MapPin className="h-3 w-3" />
                {task.zone}
              </span>
            )}
          </div>
        )}
      </Link>

      {task.assignees.length > 0 && (
        <div className="shrink-0">
          <AvatarStack users={task.assignees} max={3} size="sm" />
        </div>
      )}
    </div>
  )
}
