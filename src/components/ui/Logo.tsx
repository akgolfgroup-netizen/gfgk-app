import Image from 'next/image'
import { cn } from '@/lib/cn'

export interface LogoProps {
  /** Pikselstørrelse (kvadrat). */
  size?: number
  /** `mark` = kun festningssoldaten; `full` = farge-logo med klubbnavn. */
  variant?: 'mark' | 'full'
  /** Gull-glød bak merket (på mørke flater). */
  glow?: boolean
  className?: string
}

/**
 * GFGK-logoen. Festningssoldaten er det eneste merket.
 * `mark` til headere/nav, `full` til splash/login.
 */
export function Logo({ size = 40, variant = 'mark', glow = false, className }: LogoProps) {
  const src = variant === 'full' ? '/logo-color.png' : '/logo.png'
  return (
    <Image
      src={src}
      alt="GFGK"
      width={size}
      height={size}
      priority
      className={cn(
        'shrink-0 object-contain',
        glow && 'drop-shadow-[0_2px_8px_rgba(255,204,0,0.25)]',
        className,
      )}
      style={{ width: size, height: size }}
    />
  )
}
