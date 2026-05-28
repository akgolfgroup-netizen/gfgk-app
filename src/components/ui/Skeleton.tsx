import * as React from 'react'
import { cn } from '@/lib/cn'

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>

/**
 * Skeleton-loader for lister. Bruk i stedet for spinner på sider som laster lister.
 * Respekterer `prefers-reduced-motion` ved å fade i stedet for pulse.
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gfgk-cream-deep motion-reduce:animate-none',
        className,
      )}
      aria-hidden="true"
      {...props}
    />
  )
}
