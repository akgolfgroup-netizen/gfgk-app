import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@/lib/cn'

const buttonVariants = cva(
  // Base
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-bold transition-colors disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] motion-reduce:active:scale-100',
  {
    variants: {
      variant: {
        primary: 'bg-gfgk-gold text-gfgk-black hover:bg-gfgk-gold-deep',
        secondary:
          'border-2 border-gfgk-black bg-white text-gfgk-text hover:bg-gfgk-black hover:text-white',
        destructive:
          'bg-gfgk-red-light text-gfgk-red-deep hover:bg-gfgk-red/20',
        ghost:
          'bg-transparent text-gfgk-text-2 hover:bg-gfgk-cream-deep hover:text-gfgk-text',
      },
      size: {
        sm: 'h-8 rounded-md px-3 text-xs',
        md: 'h-10 rounded-lg px-4 text-sm',
        lg: 'h-12 rounded-lg px-6 text-sm',
        xl: 'h-14 rounded-xl px-8 text-base',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { buttonVariants }
