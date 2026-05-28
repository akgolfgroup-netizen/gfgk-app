'use client'

import * as RxCheckbox from '@radix-ui/react-checkbox'
import { Check } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/cn'

export interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof RxCheckbox.Root> {
  variant?: 'square' | 'circle'
}

export const Checkbox = React.forwardRef<
  React.ElementRef<typeof RxCheckbox.Root>,
  CheckboxProps
>(({ className, variant = 'square', ...props }, ref) => {
  return (
    <RxCheckbox.Root
      ref={ref}
      className={cn(
        'peer flex shrink-0 items-center justify-center border-2 border-gfgk-border-strong bg-white transition-colors',
        'data-[state=checked]:border-gfgk-gold data-[state=checked]:bg-gfgk-gold',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gfgk-gold/40',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'square' ? 'h-5 w-5 rounded' : 'h-5 w-5 rounded-full',
        className,
      )}
      {...props}
    >
      <RxCheckbox.Indicator className="text-gfgk-black">
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </RxCheckbox.Indicator>
    </RxCheckbox.Root>
  )
})
Checkbox.displayName = 'Checkbox'
