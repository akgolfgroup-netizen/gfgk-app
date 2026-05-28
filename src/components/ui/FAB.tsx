'use client'

import { Slot } from '@radix-ui/react-slot'
import * as React from 'react'
import { cn } from '@/lib/cn'

export interface FABProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

/**
 * Floating Action Button — 56x56 gull sirkel fast nede til høyre.
 * Plassert over bottom-nav.
 */
export const FAB = React.forwardRef<HTMLButtonElement, FABProps>(
  ({ className, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        ref={ref}
        className={cn(
          'fixed bottom-20 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gfgk-gold text-gfgk-black shadow-[0_4px_12px_rgba(245,197,24,0.4)] transition-transform active:scale-95 motion-reduce:active:scale-100 disabled:pointer-events-none disabled:opacity-50',
          className,
        )}
        {...props}
      >
        {children}
      </Comp>
    )
  },
)
FAB.displayName = 'FAB'
