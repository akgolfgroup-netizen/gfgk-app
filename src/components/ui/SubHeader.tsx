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
  /**
   * Maks-bredde på det sentrerte innholdet på desktop. SKAL matche body-bredden
   * på samme side så headeren ikke blir bredere enn kroppen.
   */
  maxWidth?: '3xl' | '6xl'
}

// Hele klassenavn (ikke interpolering) så Tailwind ikke purger dem.
const maxWidthClass: Record<'3xl' | '6xl', string> = {
  '3xl': 'lg:max-w-3xl',
  '6xl': 'lg:max-w-6xl',
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
  maxWidth = '6xl',
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
      <div className={cn('pt-3 lg:mx-auto', maxWidthClass[maxWidth])}>
        {back && (
          <Link
            href={back.href}
            className="-ml-0.5 mb-2 inline-flex h-9 items-center gap-1 rounded-full border border-gfgk-border bg-white pl-2 pr-3.5 text-sm font-semibold text-gfgk-text shadow-card transition-colors hover:bg-gfgk-cream-deep"
          >
            <ChevronLeft className="h-[18px] w-[18px]" strokeWidth={2.5} />
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
