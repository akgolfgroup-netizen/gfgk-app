import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

const variants: Record<Variant, string> = {
  primary: 'bg-neutral-900 text-white',
  secondary: 'bg-neutral-100 text-neutral-900',
}

export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'rounded-full px-6 py-3 text-sm font-medium disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}
