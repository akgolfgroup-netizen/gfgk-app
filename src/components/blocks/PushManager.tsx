'use client'

import { Bell, BellOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'

type PushState = 'loading' | 'unsupported' | 'denied' | 'off' | 'on'

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const buffer = new ArrayBuffer(raw.length)
  const out = new Uint8Array(buffer)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export function PushManager() {
  const [state, setState] = useState<PushState>('loading')
  const [busy, setBusy] = useState(false)

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

  // Browser-feature-detection + async subscription-sjekk. setState skjer
  // i async-callbacks (ikke synkront i effect-body) for å unngå cascading renders.
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      !('PushManager' in window)
    ) {
      queueMicrotask(() => setState('unsupported'))
      return
    }
    if (Notification.permission === 'denied') {
      queueMicrotask(() => setState('denied'))
      return
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setState(sub ? 'on' : 'off'))
      .catch(() => setState('off'))
  }, [])

  async function enable() {
    if (!vapidKey) {
      alert('Push er ikke konfigurert (mangler VAPID-nøkkel).')
      return
    }
    setBusy(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'denied' : 'off')
        return
      }
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })
      const json = sub.toJSON()
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      })
      setState('on')
    } catch (err) {
      console.error('[push] enable failed:', err)
      setState('off')
    } finally {
      setBusy(false)
    }
  }

  async function disable() {
    setBusy(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setState('off')
    } catch (err) {
      console.error('[push] disable failed:', err)
    } finally {
      setBusy(false)
    }
  }

  if (state === 'loading') {
    return <p className="text-sm text-gfgk-text-3">Sjekker varsel-status...</p>
  }
  if (state === 'unsupported') {
    return (
      <p className="text-sm text-gfgk-text-2">
        Enheten din støtter ikke push-varsler. På iPhone må appen legges til på
        hjemskjermen først.
      </p>
    )
  }
  if (state === 'denied') {
    return (
      <p className="text-sm text-gfgk-text-2">
        Varsler er blokkert i nettleseren. Skru på i innstillinger for å aktivere.
      </p>
    )
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm text-gfgk-text">
        {state === 'on' ? (
          <Bell className="h-5 w-5 text-gfgk-teal-deep" />
        ) : (
          <BellOff className="h-5 w-5 text-gfgk-text-3" />
        )}
        {state === 'on' ? 'Varsler er på' : 'Varsler er av'}
      </div>
      {state === 'on' ? (
        <Button variant="secondary" size="sm" disabled={busy} onClick={disable}>
          Skru av
        </Button>
      ) : (
        <Button variant="primary" size="sm" disabled={busy} onClick={enable}>
          Skru på
        </Button>
      )}
    </div>
  )
}
