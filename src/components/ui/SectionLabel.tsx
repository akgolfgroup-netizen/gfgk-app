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
        'mb-3 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-gfgk-gold-deep',
        className,
      )}
      {...props}
    >
      <span className="inline-block h-3.5 w-0.5 rounded-full bg-gfgk-gold" />
      {children}
    </Tag>
  )
}
