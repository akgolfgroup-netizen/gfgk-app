import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@/lib/cn'

const cardVariants = cva(
  'rounded-xl border border-gfgk-border bg-white shadow-[0_1px_2px_rgba(0,0,0,.06)]',
  {
    variants: {
      accent: {
        none: '',
        gold: 'border-l-4 border-l-gfgk-gold',
        red: 'border-l-4 border-l-gfgk-red',
        teal: 'border-l-4 border-l-gfgk-teal',
      },
      padding: {
        none: '',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
      },
      interactive: {
        true: 'transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0',
      },
    },
    defaultVariants: {
      accent: 'none',
      padding: 'md',
    },
  },
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, accent, padding, interactive, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ accent, padding, interactive }), className)}
        {...props}
      />
    )
  },
)
Card.displayName = 'Card'
