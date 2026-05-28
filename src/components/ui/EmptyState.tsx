import type { LucideIcon } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/cn'

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({
  className,
  icon: Icon,
  title,
  description,
  action,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-12 text-center',
        className,
      )}
      {...props}
    >
      {Icon && <Icon className="h-12 w-12 text-gfgk-gold" strokeWidth={1.5} />}
      <h3 className="text-base font-bold text-gfgk-text">{title}</h3>
      {description && (
        <p className="max-w-[240px] text-sm text-gfgk-text-2">{description}</p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
