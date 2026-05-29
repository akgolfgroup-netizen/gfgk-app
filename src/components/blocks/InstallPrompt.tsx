'use client'

import { Download, X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'gfgk-install-dismissed'

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem(DISMISS_KEY) === '1') return

    // Allerede installert (standalone)?
    if (window.matchMedia('(display-mode: standalone)').matches) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    setVisible(false)
    localStorage.setItem(DISMISS_KEY, '1')
  }

  async function install() {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    dismiss()
  }

  if (!visible) return null

  return (
    <div className="flex items-center gap-3 rounded-xl border border-gfgk-gold-deep bg-gfgk-gold-light p-3">
      <Download className="h-5 w-5 shrink-0 text-gfgk-gold-deep" strokeWidth={2.5} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gfgk-text">Installer GFGK</p>
        <p className="text-xs text-gfgk-text-2">Legg til på hjemskjermen for rask tilgang.</p>
      </div>
      <button
        onClick={install}
        className="rounded-md bg-gfgk-gold px-3 py-1.5 text-xs font-bold text-gfgk-black transition-colors hover:bg-gfgk-gold-deep"
      >
        Installer
      </button>
      <button
        onClick={dismiss}
        className="shrink-0 rounded-md p-1 text-gfgk-text-2 hover:bg-gfgk-cream-deep"
        aria-label="Lukk"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
