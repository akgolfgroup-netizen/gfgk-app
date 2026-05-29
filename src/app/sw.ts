import { defaultCache } from '@serwist/next/worker'
import { type PrecacheEntry, type SerwistGlobalConfig, Serwist } from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  // Offline-fallback: cachede sider serveres når nettet er nede.
  fallbacks: {
    entries: [
      {
        url: '/offline',
        matcher: ({ request }) => request.destination === 'document',
      },
    ],
  },
})

// Push-varsel mottatt
self.addEventListener('push', (event) => {
  const data = (() => {
    try {
      return event.data?.json() ?? {}
    } catch {
      return {}
    }
  })() as { title?: string; body?: string; url?: string }

  const title = data.title ?? 'GFGK'
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body ?? '',
      icon: '/icons/apple-touch-icon.png',
      badge: '/icons/apple-touch-icon.png',
      data: { url: data.url ?? '/dashboard' },
    }),
  )
})

// Klikk på varsel → åpne riktig side
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url =
    (event.notification.data as { url?: string } | undefined)?.url ?? '/dashboard'
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return self.clients.openWindow(url)
    }),
  )
})

serwist.addEventListeners()
