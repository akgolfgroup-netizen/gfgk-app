import * as React from 'react'
import { cn } from '@/lib/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, type = 'text', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          // Override globals.css default
          'h-12 w-full rounded-xl border bg-white px-4 text-base text-gfgk-text outline-none transition-colors',
          'placeholder:text-gfgk-text-3',
          'disabled:cursor-not-allowed disabled:bg-gfgk-cream disabled:text-gfgk-text-3',
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
Input.displayName = 'Input'
