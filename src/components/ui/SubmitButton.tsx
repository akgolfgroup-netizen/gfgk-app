'use client'

import { Loader2 } from 'lucide-react'
import { useFormStatus } from 'react-dom'
import { Button, type ButtonProps } from '@/components/ui/Button'

interface SubmitButtonProps extends Omit<ButtonProps, 'type'> {
  /** Valgfri tekst som vises i stedet for children mens innsending pågår. */
  pendingText?: string
}

/**
 * Submit-knapp med innebygd pending-state. MÅ rendres inni et
 * `<form action={...}>` for at `useFormStatus()` skal fange innsending.
 * Viser en spinner (+ valgfri pending-tekst) og disabler knappen mens
 * server-handlingen kjører.
 */
export function SubmitButton({
  children,
  pendingText,
  disabled,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={disabled || pending} {...props}>
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {pendingText ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  )
}
