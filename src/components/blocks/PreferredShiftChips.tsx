'use client'

import { Check } from 'lucide-react'
import { useTransition } from 'react'
import { cn } from '@/lib/cn'

interface PreferredShiftChipsProps {
  current: ReadonlyArray<string>
  onToggle: (shift: string) => Promise<void>
}

const SHIFTS = [
  { value: 'morgen', label: 'Morgen' },
  { value: 'ettermiddag', label: 'Ettermiddag' },
  { value: 'kveld', label: 'Kveld' },
] as const

export function PreferredShiftChips({ current, onToggle }: PreferredShiftChipsProps) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex flex-wrap gap-2">
      {SHIFTS.map((s) => {
        const active = current.includes(s.value)
        return (
          <button
            key={s.value}
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => onToggle(s.value))}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold transition-colors',
              active
                ? 'bg-gfgk-gold text-gfgk-black'
                : 'bg-gfgk-cream-deep text-gfgk-text hover:bg-gfgk-cream',
              isPending && 'opacity-50',
            )}
          >
            {active && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
            {s.label}
          </button>
        )
      })}
    </div>
  )
}
