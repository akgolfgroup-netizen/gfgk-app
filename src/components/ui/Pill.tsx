import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@/lib/cn'

const pillVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full font-semibold uppercase tracking-wider whitespace-nowrap',
  {
    variants: {
      tone: {
        gold: 'bg-gfgk-gold-light text-gfgk-gold-deep',
        teal: 'bg-gfgk-teal-light text-gfgk-teal-deep',
        red: 'bg-gfgk-red-light text-gfgk-red-deep',
        neutral: 'bg-gfgk-cream-deep text-gfgk-text-2',
        black: 'bg-gfgk-black text-gfgk-gold',
      },
      size: {
        sm: 'h-[18px] px-2 text-[10px]',
        md: 'h-6 px-2.5 text-[11px]',
        lg: 'h-7 px-3 text-xs',
      },
    },
    defaultVariants: {
      tone: 'gold',
      size: 'md',
    },
  },
)

export interface PillProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof pillVariants> {}

export const Pill = React.forwardRef<HTMLSpanElement, PillProps>(
  ({ className, tone, size, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(pillVariants({ tone, size }), className)}
        {...props}
      />
    )
  },
)
Pill.displayName = 'Pill'

/**
 * Hjelper: mapper status-streng til riktig tone.
 */
export function statusTone(
  status: 'aktiv' | 'fullført' | 'pause' | 'forfalt' | string,
): VariantProps<typeof pillVariants>['tone'] {
  switch (status) {
    case 'aktiv':
    case 'i_gang':
    case 'todo':
      return 'gold'
    case 'fullført':
    case 'sendt':
      return 'teal'
    case 'forfalt':
    case 'avvist':
      return 'red'
    case 'pause':
    case 'venter':
    case 'arkivert':
      return 'neutral'
    default:
      return 'neutral'
  }
}

/**
 * Hjelper: mapper prioritet til riktig tone.
 */
export function priorityTone(
  priority: 'høy' | 'middels' | 'lav' | string,
): VariantProps<typeof pillVariants>['tone'] {
  switch (priority) {
    case 'høy':
      return 'red'
    case 'middels':
      return 'gold'
    case 'lav':
      return 'teal'
    default:
      return 'neutral'
  }
}
