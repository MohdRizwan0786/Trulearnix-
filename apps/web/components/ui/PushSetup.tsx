'use client'
import { useEffect, useState } from 'react'
import { Bell, X } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { registerServiceWorker, subscribeToPush, setupSWMessageHandler, getNotificationPermission, isPushSupported } from '@/lib/pushNotifications'

export default function PushSetup() {
  const { user } = useAuthStore()
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    registerServiceWorker()
    setupSWMessageHandler()
  }, [])

  useEffect(() => {
    const perm = getNotificationPermission()
    if (perm === 'granted') {
      subscribeToPush().catch(() => {})
    } else if (perm === 'default' && isPushSupported()) {
      // Show banner after 3 seconds so page loads first
      const t = setTimeout(() => setShowBanner(true), 3000)
      return () => clearTimeout(t)
    }
  }, [user?.id])

  const handleEnable = async () => {
    setShowBanner(false)
    await subscribeToPush()
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-sm">
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl"
        style={{ background: '#0d1929', border: '1px solid rgba(124,58,237,0.35)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(124,58,237,0.15)' }}>
          <Bell className="w-4 h-4 text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-xs font-semibold">Enable Notifications</p>
          <p className="text-gray-400 text-[11px] mt-0.5">Get alerts for classes, commissions & updates</p>
        </div>
        <button onClick={handleEnable}
          className="flex-shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-lg text-white"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#6366f1)' }}>
          Allow
        </button>
        <button onClick={() => setShowBanner(false)} className="text-gray-600 hover:text-gray-300 flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
