// TruLearnix Service Worker — Web Push Notifications
const CACHE_NAME = 'trulearnix-v1'
const NOTIFICATION_SOUND_URL = '/notification.mp3'

self.addEventListener('install', (e) => {
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim())
})

// ── Push Event — show notification ───────────────────────────────────────────
self.addEventListener('push', (e) => {
  let data = {}
  try { data = e.data ? e.data.json() : {} } catch {}

  const title   = data.title  || 'TruLearnix'
  const body    = data.body   || 'You have a new notification'
  const icon    = data.icon   || '/logo.png'
  const badge   = data.badge  || '/badge.png'
  const url     = data.url    || '/'
  const tag     = data.tag    || 'default'
  const type    = data.type   || 'info'

  // Type → color accent mapping
  const vibrate = {
    commission: [200, 100, 200, 100, 200],
    success:    [200, 100, 200],
    warning:    [300, 100, 300],
    error:      [500],
    class:      [150, 75, 150, 75, 150],
    default:    [200],
  }[type] || [200]

  const options = {
    body,
    icon,
    badge,
    tag,
    vibrate,
    requireInteraction: ['class', 'commission'].includes(type),
    data: { url, type, timestamp: data.timestamp || Date.now() },
    actions: [
      { action: 'open',    title: 'Open'    },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  }

  e.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// ── Notification Click ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (e) => {
  e.notification.close()

  if (e.action === 'dismiss') return

  const url = e.notification.data?.url || '/'

  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing tab if open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus()
          client.postMessage({ type: 'NAVIGATE', url })
          return
        }
      }
      // Otherwise open new tab
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})

// ── Background Sync (optional) ────────────────────────────────────────────────
self.addEventListener('message', (e) => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting()
})
