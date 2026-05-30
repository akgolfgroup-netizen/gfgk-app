'use client'

import { CheckSquare } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import type { TaskBlockData } from '@/components/blocks/TaskBlock'
import { TaskBoardView } from '@/components/blocks/TaskBoardView'
import { TaskCalendarView } from '@/components/blocks/TaskCalendarView'
import { TaskListView } from '@/components/blocks/TaskListView'
import { TaskTableView } from '@/components/blocks/TaskTableView'
import { TaskViewSwitcher } from '@/components/blocks/TaskViewSwitcher'
import { EmptyState } from '@/components/ui/EmptyState'
import { parseTaskView } from '@/lib/task-views'

type TaskStatus = TaskBlockData['status']

export interface TaskViewsProps {
  tasks: TaskBlockData[]
  onMove: (
    id: string,
    status: TaskStatus | null,
    orderIndex: number | null,
  ) => Promise<void>
  onToggle: (id: string) => Promise<void>
}

/**
 * Den ene komponenten sidene bruker. Viser en visnings-velger øverst og
 * den valgte visningen (liste/tavle/tabell/kalender) under. Valgt visning
 * leses fra ?view=-param.
 */
export function TaskViews(props: TaskViewsProps) {
  return (
    <Suspense fallback={<TaskViewsBody {...props} forceView="liste" />}>
      <TaskViewsInner {...props} />
    </Suspense>
  )
}

function TaskViewsInner({ tasks, onMove, onToggle }: TaskViewsProps) {
  const searchParams = useSearchParams()
  const view = parseTaskView(searchParams.get('view'))
  return (
    <TaskViewsBody tasks={tasks} onMove={onMove} onToggle={onToggle} forceView={view} />
  )
}

function TaskViewsBody({
  tasks,
  onMove,
  onToggle,
  forceView,
}: TaskViewsProps & { forceView: ReturnType<typeof parseTaskView> }) {
  return (
    <div className="space-y-5">
      <TaskViewSwitcher />

      {tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="Ingen oppgaver"
          description="Det er ingen oppgaver å vise her ennå."
        />
      ) : forceView === 'tavle' ? (
        <TaskBoardView tasks={tasks} onMove={onMove} />
      ) : forceView === 'tabell' ? (
        <TaskTableView tasks={tasks} onMove={onMove} />
      ) : forceView === 'kalender' ? (
        <TaskCalendarView tasks={tasks} />
      ) : (
        <TaskListView tasks={tasks} onToggle={onToggle} />
      )}
    </div>
  )
}
