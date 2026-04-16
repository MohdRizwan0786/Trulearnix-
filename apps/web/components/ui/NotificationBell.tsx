'use client'
import { useState, useEffect, useRef } from 'react'
import { Bell, BellOff, X, CheckCheck, ExternalLink, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'
import { subscribeToPush, unsubscribeFromPush, getNotificationPermission, isPushSupported } from '@/lib/pushNotifications'

const API = process.env.NEXT_PUBLIC_API_URL!

const TYPE_COLOR: Record<string, string> = {
  commission: 'bg-green-500/15 border-green-500/20 text-green-400',
  success:    'bg-green-500/10 border-green-500/15 text-green-400',
  warning:    'bg-amber-500/15 border-amber-500/20 text-amber-400',
  error:      'bg-red-500/15 border-red-500/20 text-red-400',
  class:      'bg-violet-500/15 border-violet-500/20 text-violet-400',
  info:       'bg-blue-500/10 border-blue-500/15 text-blue-400',
  system:     'bg-slate-500/15 border-slate-500/20 text-slate-400',
}
const TYPE_DOT: Record<string, string> = {
  commission: 'bg-green-400', success: 'bg-green-400', warning: 'bg-amber-400',
  error: 'bg-red-400', class: 'bg-violet-400', info: 'bg-blue-400', system: 'bg-slate-400',
}

export default function NotificationBell() {
  const { user } = useAuthStore()
  const [open, setOpen]               = useState(false)
  const [notifications, setNotifs]    = useState<any[]>([])
  const [unread, setUnread]           = useState(0)
  const [loading, setLoading]         = useState(false)
  const [pushPerm, setPushPerm]       = useState<string>('default')
  const [subscribing, setSubscribing] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const token = () => { try { return localStorage.getItem('token') || '' } catch { return '' } }

  const fetchNotifs = async () => {
    if (!user) return
    setLoading(true)
    try {
      const res  = await fetch(`${API}/notifications?limit=20`, { headers: { Authorization: `Bearer ${token()}` } })
      const data = await res.json()
      if (data.success) { setNotifs(data.notifications || []); setUnread(data.unread || 0) }
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    if (user) {
      fetchNotifs()
      setPushPerm(getNotificationPermission())
    }
  }, [user])

  // Close on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => { if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const markAllRead = async () => {
    try {
      await fetch(`${API}/notifications/read-all`, { method: 'PATCH', headers: { Authorization: `Bearer ${token()}` } })
      setNotifs(n => n.map(x => ({ ...x, read: true })))
      setUnread(0)
    } catch {}
  }

  const markRead = async (id: string) => {
    try {
      await fetch(`${API}/notifications/${id}/read`, { method: 'PATCH', headers: { Authorization: `Bearer ${token()}` } })
      setNotifs(n => n.map(x => x._id === id ? { ...x, read: true } : x))
      setUnread(u => Math.max(0, u - 1))
    } catch {}
  }

  const handleSubscribe = async () => {
    setSubscribing(true)
    const ok = await subscribeToPush()
    setPushPerm(getNotificationPermission())
    setSubscribing(false)
    if (ok) {
      const audio = new Audio('/notification.mp3')
      audio.volume = 0.3
      audio.play().catch(() => {})
    }
  }

  const handleUnsubscribe = async () => {
    setSubscribing(true)
    await unsubscribeFromPush()
    setPushPerm(getNotificationPermission())
    setSubscribing(false)
  }

  if (!user) return null

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => { setOpen(o => !o); if (!open) fetchNotifs() }}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-all"
        style={{ background: open ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <Bell className="w-4 h-4 text-gray-300" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full text-[10px] font-black text-white flex items-center justify-center px-1"
            style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}>
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-12 w-80 sm:w-96 rounded-2xl shadow-2xl z-50 overflow-hidden"
          style={{ background: '#0d1929', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-violet-400" />
              <span className="text-white font-bold text-sm">Notifications</span>
              {unread > 0 && <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-400">{unread} new</span>}
            </div>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAllRead} className="text-[10px] text-gray-400 hover:text-violet-400 flex items-center gap-1 transition-colors">
                  <CheckCheck className="w-3 h-3" /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-600 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Push permission banner */}
          {isPushSupported() && pushPerm !== 'granted' && pushPerm !== 'denied' && (
            <div className="mx-3 mt-3 p-3 rounded-xl flex items-center justify-between gap-2"
              style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
              <div className="flex items-center gap-2 min-w-0">
                <Bell className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                <p className="text-xs text-gray-300 truncate">Enable push notifications with sound</p>
              </div>
              <button onClick={handleSubscribe} disabled={subscribing}
                className="flex-shrink-0 text-[11px] font-bold px-2.5 py-1.5 rounded-lg text-white transition-all flex items-center gap-1"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#6366f1)' }}>
                {subscribing ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Enable'}
              </button>
            </div>
          )}
          {isPushSupported() && pushPerm === 'granted' && (
            <div className="mx-3 mt-3 p-2 rounded-xl flex items-center justify-between gap-2"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                <p className="text-[11px] text-green-400 font-medium">Push notifications active</p>
              </div>
              <button onClick={handleUnsubscribe} disabled={subscribing}
                className="text-[10px] text-gray-500 hover:text-red-400 flex items-center gap-1 transition-colors">
                <BellOff className="w-3 h-3" /> Off
              </button>
            </div>
          )}

          {/* Notification list */}
          <div className="overflow-y-auto max-h-80" style={{ scrollbarWidth: 'none' }}>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-violet-400" /></div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-10">
                <Bell className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {notifications.map((n) => {
                  const colorCls = TYPE_COLOR[n.type] || TYPE_COLOR.info
                  const dotCls   = TYPE_DOT[n.type]   || TYPE_DOT.info
                  const timeAgo  = getTimeAgo(n.createdAt)
                  return (
                    <div key={n._id}
                      className={`px-4 py-3 transition-colors cursor-pointer ${n.read ? 'opacity-70' : 'bg-white/2'}`}
                      onClick={() => { if (!n.read) markRead(n._id); if (n.actionUrl) { setOpen(false); window.location.href = n.actionUrl } }}>
                      <div className="flex items-start gap-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border ${colorCls}`}>
                          <span className={`w-2 h-2 rounded-full ${dotCls}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white leading-snug">{n.title}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5 leading-snug line-clamp-2">{n.message}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-gray-600">{timeAgo}</span>
                            {n.actionUrl && <ExternalLink className="w-2.5 h-2.5 text-gray-600" />}
                          </div>
                        </div>
                        {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0 mt-1" />}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-white/5 text-center">
              <button onClick={() => { setOpen(false); window.location.href = '/student/announcements' }}
                className="text-[11px] text-gray-500 hover:text-violet-400 transition-colors">
                View all announcements
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 1)  return 'Just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days  < 7)  return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-IN')
}
