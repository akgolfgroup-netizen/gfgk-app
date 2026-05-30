// GFGK Servicepunkt — service worker (push + enkel offline-fallback).
// Håndskrevet fordi prosjektet bruker Turbopack, som serwist ikke støtter.

const CACHE = 'gfgk-offline-v1'
const OFFLINE_URL = '/offline'

// Forhåndscache offline-siden ved installasjon.
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add(OFFLINE_URL)))
  self.skipWaiting()
})

// Rydd gamle cacher ved aktivering.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  )
})

// Kun navigasjoner: prøv nettet først, fall tilbake til offline-siden ved feil.
// App-data hentes alltid friskt — vi cacher ikke API/sider for å unngå utdatert innhold.
self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.open(CACHE).then((cache) => cache.match(OFFLINE_URL)),
    ),
  )
})

// Push-varsel mottatt.
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = {}
  }
  const title = data.title || 'GFGK Servicepunkt'
  const options = {
    body: data.body || '',
    icon: '/logo.png',
    badge: '/logo.png',
    data: { url: data.url || '/dashboard' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

// Klikk på varsel → fokuser åpent vindu eller åpne nytt på riktig side.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/dashboard'
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if (client.url.includes(url) && 'focus' in client) return client.focus()
        }
        if (self.clients.openWindow) return self.clients.openWindow(url)
      }),
  )
})
