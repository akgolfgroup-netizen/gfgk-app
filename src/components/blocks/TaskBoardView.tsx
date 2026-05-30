'use client'

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { MapPin } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import type { TaskBlockData } from '@/components/blocks/TaskBlock'
import { AvatarStack } from '@/components/ui/AvatarStack'
import { Pill, priorityTone } from '@/components/ui/Pill'
import { cn } from '@/lib/cn'

type TaskStatus = TaskBlockData['status']

export interface TaskBoardViewProps {
  tasks: TaskBlockData[]
  onMove: (
    id: string,
    status: TaskStatus | null,
    orderIndex: number | null,
  ) => Promise<void>
}

const COLUMNS: Array<{ status: TaskStatus; label: string }> = [
  { status: 'todo', label: 'Å gjøre' },
  { status: 'in_progress', label: 'Pågår' },
  { status: 'waiting', label: 'Venter' },
  { status: 'done', label: 'Ferdig' },
]

const PRIORITY_LABEL: Record<TaskBlockData['priority'], string> = {
  high: 'Høy',
  medium: 'Middels',
  low: 'Lav',
}

function formatDue(date: string): string {
  const d = new Date(date + 'T00:00:00')
  return d.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })
}

function isOverdue(date: string | null, status: TaskStatus): boolean {
  if (!date || status === 'done') return false
  return date < new Date().toISOString().slice(0, 10)
}

/**
 * Kanban-tavle med dnd-kit. Støtter både status-bytte mellom kolonner og
 * omrekkefølge innad i en kolonne. Optimistisk UI + router.refresh() etter
 * server-action (siden moveTask kun revalidaterer /oppgaver).
 */
export function TaskBoardView({ tasks, onMove }: TaskBoardViewProps) {
  const router = useRouter()
  const [items, setItems] = useState<TaskBlockData[]>(tasks)
  const [activeId, setActiveId] = useState<string | null>(null)

  // Re-synk hvis server sender nye props (etter refresh).
  const prevTasksRef = useRef(tasks)
  useEffect(() => {
    if (prevTasksRef.current !== tasks) {
      prevTasksRef.current = tasks
      setItems(tasks)
    }
  }, [tasks])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const byStatus = (status: TaskStatus) => items.filter((t) => t.status === status)
  const activeTask = items.find((t) => t.id === activeId) ?? null

  function findContainer(id: string): TaskStatus | null {
    const col = COLUMNS.find((c) => c.status === id)
    if (col) return col.status
    const task = items.find((t) => t.id === id)
    return task?.status ?? null
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id))
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const activeIdStr = String(active.id)
    const overIdStr = String(over.id)
    const sourceStatus = findContainer(activeIdStr)
    const targetStatus = findContainer(overIdStr)
    if (!sourceStatus || !targetStatus) return

    if (sourceStatus !== targetStatus) {
      // Status-bytte mellom kolonner.
      const moved = items.map((t) =>
        t.id === activeIdStr ? { ...t, status: targetStatus } : t,
      )
      setItems(moved)
      await onMove(activeIdStr, targetStatus, null)
      router.refresh()
      return
    }

    // Omrekkefølge innad i samme kolonne.
    if (activeIdStr === overIdStr) return
    const colTasks = byStatus(sourceStatus)
    const oldIndex = colTasks.findIndex((t) => t.id === activeIdStr)
    const newIndex = colTasks.findIndex((t) => t.id === overIdStr)
    if (oldIndex === -1 || newIndex === -1) return

    // Reorder lokalt: bygg ny global rekkefølge med kolonnens nye orden.
    const movedTask = colTasks[oldIndex]
    if (!movedTask) return
    const reorderedCol = colTasks.filter((t) => t.id !== activeIdStr)
    reorderedCol.splice(newIndex, 0, movedTask)
    const queue = [...reorderedCol]
    const next = items.map((t) =>
      t.status === sourceStatus ? (queue.shift() ?? t) : t,
    )
    setItems(next)
    await onMove(activeIdStr, null, newIndex)
    router.refresh()
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="-mx-6 flex gap-3 overflow-x-auto px-6 pb-2 lg:mx-0 lg:px-0">
        {COLUMNS.map((col) => {
          const colTasks = byStatus(col.status)
          return (
            <BoardColumn
              key={col.status}
              status={col.status}
              label={col.label}
              tasks={colTasks}
            />
          )
        })}
      </div>
      <DragOverlay>
        {activeTask ? <BoardCard task={activeTask} overlay /> : null}
      </DragOverlay>
    </DndContext>
  )
}

function BoardColumn({
  status,
  label,
  tasks,
}: {
  status: TaskStatus
  label: string
  tasks: TaskBlockData[]
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div className="flex w-72 shrink-0 flex-col lg:flex-1">
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className="eyebrow">{label}</span>
        <span className="text-xs font-semibold text-gfgk-text-3">{tasks.length}</span>
      </div>
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={cn(
            'flex min-h-24 flex-1 flex-col gap-2 rounded-xl border border-dashed border-transparent p-1 transition-colors',
            isOver && 'border-gfgk-gold bg-gfgk-gold-light/40',
          )}
        >
          {tasks.map((t) => (
            <SortableBoardCard key={t.id} task={t} />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

function SortableBoardCard({ task }: { task: TaskBlockData }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      aria-roledescription="Flyttbart kort"
      aria-label={task.title}
    >
      <BoardCard task={task} />
    </div>
  )
}

function BoardCard({ task, overlay = false }: { task: TaskBlockData; overlay?: boolean }) {
  const overdue = isOverdue(task.dueDate, task.status)

  return (
    <div
      className={cn(
        'flex cursor-grab flex-col gap-2 rounded-xl border border-gfgk-border bg-white p-3 shadow-card active:cursor-grabbing',
        overlay && 'cursor-grabbing shadow-lg',
      )}
    >
      <Link
        href={`/oppgaver/${task.id}`}
        // Hindre navigasjon når kortet dras (pointer-down konsumeres av dnd).
        onClick={(e) => {
          if (overlay) e.preventDefault()
        }}
        className="text-sm font-semibold text-gfgk-text hover:underline"
      >
        {task.title}
      </Link>
      <div className="flex flex-wrap items-center gap-2 text-xs text-gfgk-text-2">
        {task.priority !== 'medium' && (
          <Pill tone={priorityTone(task.priority)} size="sm">
            {PRIORITY_LABEL[task.priority]}
          </Pill>
        )}
        {task.dueDate && (
          <span className={cn(overdue && 'font-semibold text-gfgk-red-deep')}>
            {formatDue(task.dueDate)}
          </span>
        )}
        {task.zone && (
          <span className="inline-flex items-center gap-1 text-gfgk-text-3">
            <MapPin className="h-3 w-3" />
            {task.zone}
          </span>
        )}
      </div>
      {task.assignees.length > 0 && (
        <div className="flex">
          <AvatarStack users={task.assignees} max={3} size="sm" />
        </div>
      )}
    </div>
  )
}
