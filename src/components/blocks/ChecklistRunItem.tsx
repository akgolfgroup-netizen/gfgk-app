'use client'

import { Check } from 'lucide-react'
import { useState, useTransition } from 'react'
import { cn } from '@/lib/cn'

interface ChecklistRunItemProps {
  id: string
  title: string
  description: string | null
  done: boolean
  doneAt: Date | null
  doneBy: string | null
  onToggle: (id: string) => Promise<void>
}

export function ChecklistRunItem({
  id,
  title,
  description,
  done,
  doneAt,
  onToggle,
}: ChecklistRunItemProps) {
  const [isPending, startTransition] = useTransition()
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border border-gfgk-border bg-white p-3 transition-colors',
        done && 'bg-gfgk-cream',
      )}
    >
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(() => onToggle(id))}
        className={cn(
          'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors',
          done
            ? 'border-gfgk-gold bg-gfgk-gold'
            : 'border-gfgk-border-strong bg-white hover:border-gfgk-gold',
          isPending && 'opacity-50',
        )}
        aria-label={done ? 'Marker som ikke fullført' : 'Marker som fullført'}
      >
        {done && <Check className="h-4 w-4 text-gfgk-black" strokeWidth={3} />}
      </button>

      <div
        className="min-w-0 flex-1 cursor-pointer"
        onClick={() => description && setExpanded((x) => !x)}
      >
        <p
          className={cn(
            'text-sm font-semibold text-gfgk-text',
            done && 'line-through text-gfgk-text-2',
          )}
        >
          {title}
        </p>
        {description && expanded && (
          <p className="mt-1 whitespace-pre-wrap text-xs text-gfgk-text-2">
            {description}
          </p>
        )}
        {done && doneAt && (
          <p className="mt-1 text-xs text-gfgk-text-3">
            Huket av kl{' '}
            {new Date(doneAt).toLocaleTimeString('nb-NO', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
      </div>
    </div>
  )
}
