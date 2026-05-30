import { ChevronLeft } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import * as React from 'react'
import { cn } from '@/lib/cn'

export interface PageHeaderProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  title: React.ReactNode
  subtitle?: React.ReactNode
  back?: { href: string; label?: string }
  action?: React.ReactNode
}

/**
 * Standard sort header med pt-safe og tilbake-link. Brukes på alle interne sider.
 */
export function PageHeader({
  className,
  title,
  subtitle,
  back,
  action,
  ...props
}: PageHeaderProps) {
  return (
    <header
      className={cn('bg-gfgk-black px-6 pb-6 pt-safe', className)}
      {...props}
    >
      <div className="pt-4">
        {back && (
          <Link
            href={back.href}
            className="-ml-1 inline-flex items-center gap-1 text-sm text-white/50 transition-colors hover:text-white/80"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            {back.label ?? 'Tilbake'}
          </Link>
        )}
        <div className="mt-1 flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Image
              src="/logo.png"
              alt="GFGK"
              width={40}
              height={40}
              priority
              className="h-9 w-9 shrink-0 drop-shadow-[0_2px_8px_rgba(255,204,0,0.25)]"
            />
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-extrabold tracking-tight text-gfgk-gold">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-0.5 truncate text-sm text-white/50">{subtitle}</p>
              )}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      </div>
    </header>
  )
}
