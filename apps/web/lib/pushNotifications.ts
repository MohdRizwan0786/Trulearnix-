const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = window.atob(base64)
  const outputArray = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; ++i) outputArray[i] = raw.charCodeAt(i)
  return outputArray
}

function getToken() {
  try { return localStorage.getItem('accessToken') || '' } catch { return '' }
}

export async function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    return reg
  } catch { return null }
}

export async function getVapidPublicKey(): Promise<string> {
  try {
    const res = await fetch(`${API}/notifications/vapid-public-key`)
    const data = await res.json()
    return data.publicKey || ''
  } catch { return '' }
}

export async function subscribeToPush(): Promise<boolean> {
  try {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return false

    // Request permission
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return false

    const reg = await navigator.serviceWorker.ready
    const vapidKey = await getVapidPublicKey()
    if (!vapidKey) return false

    // Check if already subscribed
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })
    }

    // Send subscription to server
    const token = getToken()
    await fetch(`${API}/notifications/push-subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        endpoint: sub.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...Array.from(new Uint8Array(sub.getKey('p256dh')!)))),
          auth:   btoa(String.fromCharCode(...Array.from(new Uint8Array(sub.getKey('auth')!)))),
        },
        userAgent: navigator.userAgent,
      }),
    })
    return true
  } catch (e) {
    console.error('[Push Subscribe Error]', e)
    return false
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (!sub) return
    const token = getToken()
    await fetch(`${API}/notifications/push-subscribe`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    })
    await sub.unsubscribe()
  } catch {}
}

export function isPushSupported() {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported'
  return Notification.permission
}

// Handle SW messages (navigation after click)
export function setupSWMessageHandler() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
  navigator.serviceWorker.addEventListener('message', (e) => {
    if (e.data?.type === 'NAVIGATE' && e.data.url) {
      window.location.href = e.data.url
    }
  })
}
