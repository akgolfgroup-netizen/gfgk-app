'use client'

import * as RxAvatar from '@radix-ui/react-avatar'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@/lib/cn'

const avatarVariants = cva(
  'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gfgk-cream-deep',
  {
    variants: {
      size: {
        sm: 'h-6 w-6 text-[10px] font-semibold',
        md: 'h-8 w-8 text-xs font-semibold',
        lg: 'h-10 w-10 text-sm font-semibold',
        xl: 'h-14 w-14 text-base font-bold',
      },
    },
    defaultVariants: { size: 'md' },
  },
)

export interface AvatarProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof avatarVariants> {
  src?: string | null
  name?: string | null
  email?: string | null
}

function initials(input: string): string {
  const parts = input.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0] ?? ''
  if (parts.length === 1) return first.slice(0, 2).toUpperCase()
  const last = parts[parts.length - 1] ?? ''
  return ((first[0] ?? '') + (last[0] ?? '')).toUpperCase() || '?'
}

export const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(
  ({ className, size, src, name, email, ...props }, ref) => {
    const label = name ?? email ?? '?'
    return (
      <RxAvatar.Root
        ref={ref}
        className={cn(avatarVariants({ size }), className)}
        {...props}
      >
        {src && (
          <RxAvatar.Image
            src={src}
            alt={label}
            className="h-full w-full object-cover"
          />
        )}
        <RxAvatar.Fallback
          delayMs={src ? 200 : 0}
          className="flex h-full w-full items-center justify-center text-gfgk-text-2"
        >
          {initials(label)}
        </RxAvatar.Fallback>
      </RxAvatar.Root>
    )
  },
)
Avatar.displayName = 'Avatar'
