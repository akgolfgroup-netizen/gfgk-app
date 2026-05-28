'use client'

import * as React from 'react'
import { cn } from '@/lib/cn'
import { Avatar } from './Avatar'

export interface AvatarStackUser {
  name?: string | null
  email?: string | null
  src?: string | null
}

export interface AvatarStackProps extends React.HTMLAttributes<HTMLDivElement> {
  users: AvatarStackUser[]
  max?: number
  size?: 'sm' | 'md' | 'lg'
}

export function AvatarStack({
  users,
  max = 4,
  size = 'sm',
  className,
  ...props
}: AvatarStackProps) {
  const visible = users.slice(0, max)
  const extra = users.length - max

  return (
    <div className={cn('flex items-center -space-x-2', className)} {...props}>
      {visible.map((u, i) => (
        <Avatar
          key={i}
          size={size}
          src={u.src}
          name={u.name}
          email={u.email}
          className="border-2 border-white"
        />
      ))}
      {extra > 0 && (
        <span
          className={cn(
            'flex items-center justify-center rounded-full border-2 border-white bg-gfgk-cream-deep font-semibold text-gfgk-text-2',
            size === 'sm' && 'h-6 min-w-6 px-1.5 text-[10px]',
            size === 'md' && 'h-8 min-w-8 px-2 text-xs',
            size === 'lg' && 'h-10 min-w-10 px-2.5 text-sm',
          )}
        >
          +{extra}
        </span>
      )}
    </div>
  )
}
