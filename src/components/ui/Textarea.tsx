import * as React from 'react'
import { cn } from '@/lib/cn'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, rows = 4, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          'w-full rounded-xl border bg-white px-4 py-3 text-base text-gfgk-text outline-none transition-colors',
          'placeholder:text-gfgk-text-3',
          'disabled:cursor-not-allowed disabled:bg-gfgk-cream disabled:text-gfgk-text-3',
          'resize-y',
          error
            ? 'border-gfgk-red focus:border-gfgk-red focus:ring-2 focus:ring-gfgk-red/30'
            : 'border-gfgk-border-strong focus:border-gfgk-gold focus:ring-2 focus:ring-gfgk-gold/30',
          className,
        )}
        {...props}
      />
    )
  },
)
Textarea.displayName = 'Textarea'
