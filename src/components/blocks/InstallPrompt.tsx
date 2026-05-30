'use client'

import { Download, Share, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetTitle,
} from '@/components/ui/BottomSheet'
import { InstallInstructions } from '@/components/blocks/InstallInstructions'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'gfgk-install-dismissed'

type Mode = 'android' | 'ios'

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [mode, setMode] = useState<Mode | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem(DISMISS_KEY) === '1') return

    // Allerede installert (standalone)? Da trenger vi ikke banneret.
    if (window.matchMedia('(display-mode: standalone)').matches) return

    // Android/Chrome: vis banner først når nettleseren faktisk tilbyr install.
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setMode('android')
    }
    window.addEventListener('beforeinstallprompt', handler)

    // iOS Safari sender aldri beforeinstallprompt — vi må veilede manuelt.
    const ua = navigator.userAgent
    const isIOS = /iphone|ipad|ipod/i.test(ua)
    // iPadOS later som macOS; touch + ingen MSStream skiller den fra desktop Safari.
    const isIPadOS =
      navigator.maxTouchPoints > 1 && /macintosh/i.test(ua) && !('MSStream' in window)
    // queueMicrotask: unngå synkron setState i effect (cascading renders).
    if (isIOS || isIPadOS) queueMicrotask(() => setMode('ios'))

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    setMode(null)
    localStorage.setItem(DISMISS_KEY, '1')
  }

  async function handleAction() {
    if (mode === 'android' && deferred) {
      await deferred.prompt()
      await deferred.userChoice
      dismiss()
      return
    }
    if (mode === 'ios') {
      setSheetOpen(true)
    }
  }

  if (!mode) return null

  const copy =
    mode === 'ios'
      ? { title: 'Legg GFGK på Hjem-skjermen', body: 'Få app-følelse og rask tilgang.' }
      : { title: 'Installer GFGK', body: 'Legg til på hjemskjermen for rask tilgang.' }

  return (
    <>
      <div className="flex items-center gap-3 rounded-xl border border-gfgk-gold-deep bg-gfgk-gold-light p-3">
        {mode === 'ios' ? (
          <Share className="h-5 w-5 shrink-0 text-gfgk-gold-deep" strokeWidth={2.5} />
        ) : (
          <Download className="h-5 w-5 shrink-0 text-gfgk-gold-deep" strokeWidth={2.5} />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gfgk-text">{copy.title}</p>
          <p className="text-xs text-gfgk-text-2">{copy.body}</p>
        </div>
        <Button variant="accent" size="sm" onClick={handleAction}>
          {mode === 'ios' ? 'Slik gjør du' : 'Installer'}
        </Button>
        <button
          onClick={dismiss}
          className="shrink-0 rounded-md p-1 text-gfgk-text-2 hover:bg-gfgk-cream-deep"
          aria-label="Lukk"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {mode === 'ios' && (
        <BottomSheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <BottomSheetContent>
            <BottomSheetTitle>Installer GFGK</BottomSheetTitle>
            <BottomSheetDescription>
              Legg til på hjemskjermen for rask tilgang og en app-følelse.
            </BottomSheetDescription>
            <InstallInstructions platform="ios" />
          </BottomSheetContent>
        </BottomSheet>
      )}
    </>
  )
}
