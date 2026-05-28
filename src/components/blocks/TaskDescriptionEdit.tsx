'use client'

import { useTransition, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { cn } from '@/lib/cn'

interface TaskDescriptionEditProps {
  taskId: string
  initialDescription: string | null
  onSave: (taskId: string, formData: FormData) => Promise<void>
}

export function TaskDescriptionEdit({
  taskId,
  initialDescription,
  onSave,
}: TaskDescriptionEditProps) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(initialDescription ?? '')
  const [isPending, startTransition] = useTransition()

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={cn(
          'w-full rounded-lg px-3 py-2 text-left text-sm leading-relaxed transition-colors hover:bg-gfgk-cream-deep',
          initialDescription ? 'text-gfgk-text' : 'text-gfgk-text-3',
        )}
      >
        {initialDescription ? (
          <span className="whitespace-pre-wrap">{initialDescription}</span>
        ) : (
          'Legg til beskrivelse...'
        )}
      </button>
    )
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus
        rows={5}
        disabled={isPending}
        placeholder="Skriv beskrivelse..."
      />
      <div className="flex justify-end gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setValue(initialDescription ?? '')
            setEditing(false)
          }}
          disabled={isPending}
        >
          Avbryt
        </Button>
        <Button
          variant="primary"
          size="sm"
          disabled={isPending}
          onClick={() => {
            const formData = new FormData()
            formData.set('description', value)
            startTransition(async () => {
              await onSave(taskId, formData)
              setEditing(false)
            })
          }}
        >
          Lagre
        </Button>
      </div>
    </div>
  )
}
