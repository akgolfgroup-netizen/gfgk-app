import * as React from 'react'
import { cn } from '@/lib/cn'

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
}

/**
 * Native <select> styled til GFGK. For komplekse multi-select-mønstre,
 * bygg på @radix-ui/react-select i Sub-prosjekt B.
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'h-12 w-full appearance-none rounded-xl border bg-white px-4 pr-10 text-base text-gfgk-text outline-none transition-colors',
          'disabled:cursor-not-allowed disabled:bg-gfgk-cream disabled:text-gfgk-text-3',
          error
            ? 'border-gfgk-red focus:border-gfgk-red focus:ring-2 focus:ring-gfgk-red/30'
            : 'border-gfgk-border-strong focus:border-gfgk-gold focus:ring-2 focus:ring-gfgk-gold/30',
          // Chevron via inline SVG i bakgrunn
          'bg-[url("data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2716%27%20height=%2716%27%20viewBox=%270%200%2024%2024%27%20fill=%27none%27%20stroke=%27%235A5A5A%27%20stroke-width=%272%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27%3E%3Cpath%20d=%27M6%209l6%206%206-6%27/%3E%3C/svg%3E")] bg-[right_12px_center] bg-no-repeat',
          className,
        )}
        {...props}
      >
        {children}
      </select>
    )
  },
)
Select.displayName = 'Select'
