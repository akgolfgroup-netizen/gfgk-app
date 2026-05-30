import * as React from 'react'
import { cn } from '@/lib/cn'

export interface KPIProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: React.ReactNode
  /** Liten endrings-/kontekstlinje under tallet (f.eks. «+2 fra forrige uke»). */
  hint?: React.ReactNode
  /** Toner verdien — nøytral, positiv (teal) eller negativ (rød). */
  tone?: 'default' | 'positive' | 'negative'
  size?: 'md' | 'lg'
}

/**
 * KPI — JetBrains Mono tabulærtall + mono-caps label (AK-mønster).
 * Norsk tallformat (komma-desimal, mellomrom-tusenskille) formateres av kalleren.
 */
export function KPI({
  className,
  label,
  value,
  hint,
  tone = 'default',
  size = 'md',
  ...props
}: KPIProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)} {...props}>
      <span className="kpi-label">{label}</span>
      <span
        className={cn(
          'kpi-value',
          size === 'md' ? 'text-2xl' : 'text-4xl',
          tone === 'positive' && 'text-gfgk-teal-deep',
          tone === 'negative' && 'text-gfgk-red-deep',
        )}
      >
        {value}
      </span>
      {hint && <span className="text-[11px] text-gfgk-text-3">{hint}</span>}
    </div>
  )
}
