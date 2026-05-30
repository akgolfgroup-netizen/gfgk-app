import * as React from 'react'
import { cn } from '@/lib/cn'

export interface EyebrowProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: 'muted' | 'gold' | 'light'
}

/**
 * AK-signaturen: mono CAPS · 0.12em tracking. Instrumentpanel-typografi.
 * Brukes som liten label over seksjoner, KPI-er og kort.
 */
export function Eyebrow({ className, tone = 'muted', ...props }: EyebrowProps) {
  return (
    <span
      className={cn(
        'eyebrow',
        tone === 'gold' && 'text-gfgk-gold-deep',
        tone === 'light' && 'text-white/90',
        className,
      )}
      {...props}
    />
  )
}
