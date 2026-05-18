'use client'
import type { ReactNode } from 'react'

export function ConfirmButton({
  children,
  message,
  className,
}: {
  children: ReactNode
  message: string
  className?: string
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault()
      }}
    >
      {children}
    </button>
  )
}
