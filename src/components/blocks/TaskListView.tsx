'use client'

import { TaskBlock, type TaskBlockData } from '@/components/blocks/TaskBlock'
import { SectionLabel } from '@/components/ui/SectionLabel'

export interface TaskListViewProps {
  tasks: TaskBlockData[]
  onToggle: (id: string) => Promise<void>
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function isToday(date: string | null): boolean {
  return date === todayISO()
}

function isOverdue(date: string | null): boolean {
  if (!date) return false
  return date < todayISO()
}

interface Group {
  label: string
  tasks: TaskBlockData[]
}

/**
 * Gruppert oppgave-liste identisk med /oppgaver-grupperingen:
 * Forfalt, I dag, Senere, Ingen frist. Tomme grupper vises ikke.
 */
export function TaskListView({ tasks, onToggle }: TaskListViewProps) {
  const groups: Group[] = [
    {
      label: 'Forfalt',
      tasks: tasks.filter((t) => isOverdue(t.dueDate) && t.status !== 'done'),
    },
    { label: 'I dag', tasks: tasks.filter((t) => isToday(t.dueDate)) },
    {
      label: 'Senere',
      tasks: tasks.filter(
        (t) => t.dueDate && !isToday(t.dueDate) && !isOverdue(t.dueDate),
      ),
    },
    { label: 'Ingen frist', tasks: tasks.filter((t) => !t.dueDate) },
  ]

  return (
    <div className="space-y-6">
      {groups
        .filter((g) => g.tasks.length > 0)
        .map((g) => (
          <section key={g.label}>
            <SectionLabel>{g.label}</SectionLabel>
            <div className="space-y-2">
              {g.tasks.map((t) => (
                <TaskBlock key={t.id} task={t} onToggle={onToggle} />
              ))}
            </div>
          </section>
        ))}
    </div>
  )
}
