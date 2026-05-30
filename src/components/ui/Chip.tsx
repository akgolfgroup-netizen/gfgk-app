import Link from 'next/link'
import * as React from 'react'
import { cn } from '@/lib/cn'

const chipBase =
  'inline-flex h-8 shrink-0 cursor-pointer items-center rounded-full px-3.5 text-[13px] font-medium transition-colors'

function chipTone(active: boolean): string {
  return active
    ? 'bg-gfgk-gold text-gfgk-black'
    : 'border border-gfgk-border bg-white text-gfgk-text-2 hover:border-gfgk-border-strong hover:text-gfgk-text'
}

export interface ChipProps {
  active?: boolean
  href: string
  children: React.ReactNode
  className?: string
}

/**
 * Filter-/kategori-chip (Notion/Linear-stil). Aktiv = gull fyll, inaktiv = hvit m/kant.
 */
export function Chip({ active = false, href, children, className }: ChipProps) {
  return (
    <Link href={href} className={cn(chipBase, chipTone(active), className)}>
      {children}
    </Link>
  )
}

/**
 * Horisontal rad av chips som scroller uten synlig scrollbar.
 */
export function ChipBar({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('scrollbar-hide -mx-6 overflow-x-auto px-6', className)} {...props}>
      <div className="flex gap-2">{children}</div>
    </div>
  )
}
