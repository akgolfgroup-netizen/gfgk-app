'use client'

import * as RxSwitch from '@radix-ui/react-switch'
import * as React from 'react'
import { cn } from '@/lib/cn'

export type ToggleProps = React.ComponentPropsWithoutRef<typeof RxSwitch.Root>

/**
 * iOS-stil toggle. Gull når på, cream-deep når av.
 */
export const Toggle = React.forwardRef<
  React.ElementRef<typeof RxSwitch.Root>,
  ToggleProps
>(({ className, ...props }, ref) => {
  return (
    <RxSwitch.Root
      ref={ref}
      className={cn(
        'peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gfgk-gold/40',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=checked]:bg-gfgk-gold data-[state=unchecked]:bg-gfgk-border-strong',
        className,
      )}
      {...props}
    >
      <RxSwitch.Thumb
        className={cn(
          'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-md ring-0 transition-transform',
          'data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0.5',
        )}
      />
    </RxSwitch.Root>
  )
})
Toggle.displayName = 'Toggle'
