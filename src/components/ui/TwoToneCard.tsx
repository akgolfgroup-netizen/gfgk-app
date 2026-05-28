import * as React from 'react'
import { cn } from '@/lib/cn'

export interface TwoToneCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode
  titleRight?: React.ReactNode
  interactive?: boolean
}

/**
 * Sort topp m/ gull tittel + hvit body. Brukes for admin-meny,
 * lønnssammendrag, og fremhevde kort med to nivåer.
 */
export const TwoToneCard = React.forwardRef<HTMLDivElement, TwoToneCardProps>(
  ({ className, title, titleRight, interactive, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'overflow-hidden rounded-xl border border-gfgk-border shadow-[0_1px_2px_rgba(0,0,0,.06)]',
          interactive &&
            'transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0',
          className,
        )}
        {...props}
      >
        <div className="flex items-center justify-between bg-gfgk-black px-4 py-3">
          <div className="text-[11px] font-extrabold uppercase tracking-wide text-gfgk-gold">
            {title}
          </div>
          {titleRight && <div>{titleRight}</div>}
        </div>
        <div className="bg-white px-4 py-3">{children}</div>
      </div>
    )
  },
)
TwoToneCard.displayName = 'TwoToneCard'
