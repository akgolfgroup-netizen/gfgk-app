'use client'

import { MapPin } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import type { TaskBlockData } from '@/components/blocks/TaskBlock'
import { AvatarStack } from '@/components/ui/AvatarStack'
import { Pill, priorityTone } from '@/components/ui/Pill'
import { cn } from '@/lib/cn'

type TaskStatus = TaskBlockData['status']

export interface TaskTableViewProps {
  tasks: TaskBlockData[]
  onMove: (
    id: string,
    status: TaskStatus | null,
    orderIndex: number | null,
  ) => Promise<void>
}

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: 'Å gjøre',
  in_progress: 'Pågår',
  waiting: 'Venter',
  done: 'Ferdig',
}

const STATUS_OPTIONS: TaskStatus[] = ['todo', 'in_progress', 'waiting', 'done']

const PRIORITY_LABEL: Record<TaskBlockData['priority'], string> = {
  high: 'Høy',
  medium: 'Middels',
  low: 'Lav',
}

function isStatus(value: string): value is TaskStatus {
  return (STATUS_OPTIONS as string[]).includes(value)
}

function formatDue(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('nb-NO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function isOverdue(date: string | null, status: TaskStatus): boolean {
  if (!date || status === 'done') return false
  return date < new Date().toISOString().slice(0, 10)
}

const TH = 'px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gfgk-text-3'
const TD = 'px-3 py-2.5 align-middle'

export function TaskTableView({ tasks, onMove }: TaskTableViewProps) {
  return (
    <div className="-mx-6 overflow-x-auto px-6 lg:mx-0 lg:px-0">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-gfgk-border">
            <th className={TH}>Tittel</th>
            <th className={TH}>Status</th>
            <th className={TH}>Ansvarlig</th>
            <th className={TH}>Frist</th>
            <th className={TH}>Prioritet</th>
            <th className={TH}>Sone</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <TaskRow key={t.id} task={t} onMove={onMove} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TaskRow({
  task,
  onMove,
}: {
  task: TaskBlockData
  onMove: TaskTableViewProps['onMove']
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const overdue = isOverdue(task.dueDate, task.status)

  function changeStatus(value: string) {
    if (!isStatus(value) || value === task.status) return
    startTransition(async () => {
      await onMove(task.id, value, null)
      router.refresh()
    })
  }

  return (
    <tr className="border-b border-gfgk-border last:border-0 hover:bg-gfgk-cream-deep/50">
      <td className={cn(TD, 'max-w-[260px]')}>
        <Link
          href={`/oppgaver/${task.id}`}
          className="font-semibold text-gfgk-text hover:underline"
        >
          {task.title}
        </Link>
      </td>
      <td className={TD}>
        <select
          value={task.status}
          disabled={isPending}
          aria-label="Endre status"
          onChange={(e) => changeStatus(e.target.value)}
          className="rounded-lg border border-gfgk-border bg-white px-2 py-1 text-xs font-medium text-gfgk-text disabled:opacity-50"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </td>
      <td className={TD}>
        {task.assignees.length > 0 ? (
          <AvatarStack users={task.assignees} max={3} size="sm" />
        ) : (
          <span className="text-gfgk-text-3">—</span>
        )}
      </td>
      <td className={cn(TD, 'whitespace-nowrap')}>
        {task.dueDate ? (
          <span className={cn(overdue && 'font-semibold text-gfgk-red-deep')}>
            {formatDue(task.dueDate)}
          </span>
        ) : (
          <span className="text-gfgk-text-3">—</span>
        )}
      </td>
      <td className={TD}>
        <Pill tone={priorityTone(task.priority)} size="sm">
          {PRIORITY_LABEL[task.priority]}
        </Pill>
      </td>
      <td className={TD}>
        {task.zone ? (
          <span className="inline-flex items-center gap-1 text-xs text-gfgk-text-2">
            <MapPin className="h-3 w-3" />
            {task.zone}
          </span>
        ) : (
          <span className="text-gfgk-text-3">—</span>
        )}
      </td>
    </tr>
  )
}
