'use client'

import { AlertTriangle } from 'lucide-react'
import { type ReactNode, useRef, useState } from 'react'
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetTitle,
} from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'

interface ConfirmButtonProps {
  children: ReactNode
  /** Forklarende melding som vises i bekreftelses-arket. */
  message: string
  className?: string
  /** Overskrift i arket. Standard: «Bekreft». */
  title?: string
  /** Erstatter `message` som beskrivelse hvis satt. */
  description?: string
  /** Tekst på bekreftelses-knappen. Standard: «Slett». */
  confirmLabel?: string
}

/**
 * Trigger-knapp som åpner en in-app BottomSheet for å bekrefte en
 * destruktiv handling. Erstatter native `confirm()`. Submitter den
 * omsluttende `<form action={...}>` ved bekreftelse, så API-et er
 * uendret for eksisterende bruk.
 */
export function ConfirmButton({
  children,
  message,
  className,
  title = 'Bekreft',
  description,
  confirmLabel = 'Slett',
}: ConfirmButtonProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  function handleConfirm() {
    setOpen(false)
    // requestSubmit() trigger server-action på den omsluttende formen.
    triggerRef.current?.form?.requestSubmit()
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={className}
        onClick={() => setOpen(true)}
      >
        {children}
      </button>

      <BottomSheet open={open} onOpenChange={setOpen}>
        <BottomSheetContent>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gfgk-red-light text-gfgk-red-deep">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <BottomSheetTitle>{title}</BottomSheetTitle>
              <BottomSheetDescription>
                {description ?? message}
              </BottomSheetDescription>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => setOpen(false)}
            >
              Avbryt
            </Button>
            <Button
              type="button"
              variant="destructive"
              fullWidth
              onClick={handleConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </BottomSheetContent>
      </BottomSheet>
    </>
  )
}
