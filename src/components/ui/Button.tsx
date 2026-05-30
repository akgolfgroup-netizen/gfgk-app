import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@/lib/cn'

const buttonVariants = cva(
  // Base — AK-editorial: fargeskift som trykk-tilbakemelding, ingen scale/lift, tydelig fokusring
  'inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-semibold transition-[background-color,box-shadow,border-color] duration-150 outline-none focus-visible:ring-2 focus-visible:ring-gfgk-gold/45 focus-visible:ring-offset-2 focus-visible:ring-offset-gfgk-cream disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // Standard CTA: sort fyll + gull tekst (forest+lime → charcoal+gull)
        primary: 'rounded-xl bg-gfgk-black text-gfgk-gold hover:bg-gfgk-charcoal',
        // Signatur-CTA: gull pill med glød. Brukes sparsomt.
        accent:
          'rounded-full bg-gfgk-gold text-gfgk-black shadow-gold-glow hover:brightness-105',
        // Alternativ handling: 1px kant
        secondary:
          'rounded-xl border border-gfgk-border-strong bg-white text-gfgk-text hover:bg-gfgk-cream-deep',
        // De-emfasert
        ghost:
          'rounded-xl bg-transparent text-gfgk-text-2 hover:bg-gfgk-cream-deep hover:text-gfgk-text',
        // Destruktiv: rød fyll + hvit tekst
        destructive: 'rounded-xl bg-gfgk-red text-white hover:bg-gfgk-red-deep',
      },
      size: {
        sm: 'h-9 px-4 text-[13px]',
        md: 'h-11 px-5 text-sm',
        lg: 'h-[52px] px-6 text-[15px]',
        xl: 'h-14 px-8 text-base',
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
