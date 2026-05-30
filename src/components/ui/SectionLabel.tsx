import * as React from 'react'
import { cn } from '@/lib/cn'

export interface SectionLabelProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h2' | 'h3' | 'h4'
}

/**
 * Mini-label med gull-strek-prefiks. Brukt over hver seksjon i sider.
 */
export function SectionLabel({
  className,
  children,
  as = 'h2',
  ...props
}: SectionLabelProps) {
  const Tag = as
  return (
    <Tag
      className={cn(
        // AK eyebrow: mono CAPS · 0.12em tracking, med GFGK gull-tick
        'eyebrow mb-3 flex items-center gap-2',
        className,
      )}
      {...props}
    >
      <span className="inline-block h-3 w-0.5 rounded-full bg-gfgk-gold" />
      {children}
    </Tag>
  )
}
