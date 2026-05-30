'use client'

import { useEffect } from 'react'

/**
 * Registrerer service workeren slik at `navigator.serviceWorker.ready`
 * resolver — en forutsetning for at PushManager kan abonnere på push.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.error('[sw] register failed:', err))
    }
  }, [])
  return null
}
