'use client'

import { Check, Smartphone } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/Button'
import { InstallInstructionsSheet } from '@/components/blocks/InstallInstructions'

/**
 * Permanent inngang til installasjonsveiledning i profilen. Alltid tilgjengelig,
 * uavhengig av om banneret er avvist. Viser bekreftelse hvis appen allerede
 * kjører som installert (standalone).
 */
export function ProfilInstall() {
  // Anta «ikke installert» til vi vet bedre — unngår SSR/klient-mismatch.
  const [standalone, setStandalone] = React.useState(false)

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    // queueMicrotask: unngå synkron setState i effect (cascading renders).
    queueMicrotask(() =>
      setStandalone(window.matchMedia('(display-mode: standalone)').matches),
    )
  }, [])

  if (standalone) {
    return (
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gfgk-gold-light text-gfgk-gold-deep">
          <Check className="h-5 w-5" strokeWidth={2.5} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gfgk-text">Appen er installert</p>
          <p className="text-xs text-gfgk-text-2">
            Du kjører GFGK fra hjemskjermen.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gfgk-gold-light text-gfgk-gold-deep">
        <Smartphone className="h-5 w-5" strokeWidth={2.25} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gfgk-text">Installer GFGK</p>
        <p className="text-xs text-gfgk-text-2">
          Legg appen på hjemskjermen for rask tilgang.
        </p>
      </div>
      <InstallInstructionsSheet
        trigger={
          <Button variant="secondary" size="sm">
            Slik gjør du
          </Button>
        }
      />
    </div>
  )
}
