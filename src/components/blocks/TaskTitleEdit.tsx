'use client'

import { useTransition } from 'react'
import { useInlineEdit } from '@/hooks/useInlineEdit'
import { cn } from '@/lib/cn'

interface TaskTitleEditProps {
  taskId: string
  initialTitle: string
  onSave: (taskId: string, formData: FormData) => Promise<void>
}

export function TaskTitleEdit({ taskId, initialTitle, onSave }: TaskTitleEditProps) {
  const [, startTransition] = useTransition()

  const {
    value,
    editing,
    isPending,
    startEdit,
    setValue,
    handleBlur,
    handleKeyDown,
    attachRef,
  } = useInlineEdit({
    initialValue: initialTitle,
    onSave: async (newValue) => {
      const formData = new FormData()
      formData.set('title', newValue)
      await new Promise<void>((resolve) => {
        startTransition(async () => {
          await onSave(taskId, formData)
          resolve()
        })
      })
    },
  })

  if (editing) {
    return (
      <input
        ref={attachRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={isPending}
        className="w-full border-none bg-transparent text-2xl font-extrabold tracking-tight text-gfgk-text outline-none focus:ring-0"
      />
    )
  }

  return (
    <h1
      onClick={startEdit}
      className={cn(
        'cursor-text rounded-md text-2xl font-extrabold tracking-tight text-gfgk-text hover:bg-gfgk-cream-deep',
        isPending && 'opacity-50',
      )}
    >
      {value || 'Klikk for å gi tittel'}
    </h1>
  )
}
