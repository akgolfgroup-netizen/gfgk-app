import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind classes with conflict resolution.
 * Senere klasser overrider tidligere — viktig for varianter.
 *
 * @example
 *   cn('px-2 py-1', 'px-4', disabled && 'opacity-50')
 *   // → 'py-1 px-4 opacity-50' (px-2 fjernes)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
