import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'
import { cn } from '@/lib/cn'

export interface SubHeaderProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  title: React.ReactNode
  subtitle?: React.ReactNode
  back?: { href: string; label?: string }
  action?: React.ReactNode
}

/**
 * Lys, rolig header (Notion-stil) for detalj- og undersider.
 * Sitter på cream-canvas med en tynn bunnkant. TopHeader (PageHeader, mørk)
 * brukes på hovedfaner; SubHeader brukes ett nivå ned.
 */
export function SubHeader({
  className,
  title,
  subtitle,
  back,
  action,
  ...props
}: SubHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 border-b border-gfgk-border bg-gfgk-cream/90 px-6 pb-3 pt-safe backdrop-blur',
        className,
      )}
      {...props}
    >
      <div className="pt-3">
        {back && (
          <Link
            href={back.href}
            className="-ml-1 mb-1 inline-flex items-center gap-1 text-sm font-medium text-gfgk-text-2 transition-colors hover:text-gfgk-text"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            {back.label ?? 'Tilbake'}
          </Link>
        )}
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight text-gfgk-text">
              {title}
            </h1>
            {subtitle && (
              <p className="truncate text-[13px] text-gfgk-text-2">{subtitle}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      </div>
    </header>
  )
}
