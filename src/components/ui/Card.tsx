import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@/lib/cn'

const cardVariants = cva(
  'rounded-2xl border border-gfgk-border bg-white shadow-card',
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
        true: 'cursor-pointer transition-[border-color,box-shadow] duration-150 hover:border-gfgk-border-strong hover:shadow-card-hover',
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
