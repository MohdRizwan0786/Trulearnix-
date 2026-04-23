'use client'
import { useState, useMemo } from 'react'
import { adminAPI } from '@/lib/api'
import { usePackages } from '@/lib/usePackages'
import AdminLayout from '@/components/AdminLayout'
import toast from 'react-hot-toast'
import { Bell, Send, Users, Megaphone } from 'lucide-react'

const BASE_AUDIENCES = [
  { value: 'all', label: 'All Users' },
  { value: 'students', label: 'Students Only' },
  { value: 'mentors', label: 'Mentors Only' },
  { value: 'affiliates', label: 'Partners' },
]

const TEMPLATES = [
  { label: 'New Feature', title: 'Exciting New Feature!', message: 'We have just launched a new feature. Check it out now!' },
  { label: 'Maintenance', title: 'Scheduled Maintenance', message: 'Our platform will undergo maintenance on [DATE] from [TIME]. Services may be unavailable.' },
  { label: 'Promotion', title: 'Special Offer Just for You!', message: 'Upgrade your package today and unlock premium features. Limited time offer!' },
  { label: 'Welcome', title: 'Welcome to TureLearnix!', message: 'Your journey to financial freedom starts here. Explore courses and connect with mentors.' },
]

export default function NotificationsPage() {
  const { packages } = usePackages()
  const AUDIENCES = useMemo(() => [
    ...BASE_AUDIENCES,
    ...packages.map(p => ({ value: p.tier, label: `${p.name} Tier` })),
  ], [packages])

  const [form, setForm] = useState({ title: '', message: '', audience: 'all', type: 'general', link: '' })
  const [sending, setSending] = useState(false)
  const [history, setHistory] = useState<any[]>([])

  const applyTemplate = (t: any) => {
    setForm(f => ({ ...f, title: t.title, message: t.message || t.body || '' }))
  }

  const audienceToRoles = (audience: string): string[] => {
    if (audience === 'students') return ['student']
    if (audience === 'mentors') return ['mentor']
    if (audience === 'affiliates') return ['mentor', 'salesperson']
    return []
  }

  const send = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Title and message are required')
      return
    }
    setSending(true)
    try {
      await adminAPI.broadcastNotify({
        title: form.title,
        message: form.message,
        type: form.type,
        roles: audienceToRoles(form.audience),
        url: form.link || undefined,
      })
      toast.success('Notification broadcast sent!')
      setHistory(h => [{ ...form, sentAt: new Date().toISOString(), id: Date.now() }, ...h])
      setForm({ title: '', message: '', audience: 'all', type: 'general', link: '' })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send notification')
    } finally { setSending(false) }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* ── Page Header ── */}
        <div className="page-header">
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg">
              <Bell className="w-5 h-5 text-white" />
            </div>
            Notifications
          </h1>
          <p className="text-gray-400 text-sm mt-1">Broadcast push notifications to platform users</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Compose */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-violet-500/20 rounded-xl flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h2 className="font-bold text-white">Broadcast Notification</h2>
                  <p className="text-xs text-gray-400">Send push notification to platform users</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Target Audience</label>
                    <select value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })} className="input">
                      {AUDIENCES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Notification Type</label>
                    <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="input">
                      <option value="general">General</option>
                      <option value="promotion">Promotion</option>
                      <option value="alert">Alert</option>
                      <option value="reminder">Reminder</option>
                      <option value="announcement">Announcement</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Title *</label>
                  <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="Notification title..." className="input" maxLength={100} />
                  <p className="text-xs text-gray-600 mt-1">{form.title.length}/100</p>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Message *</label>
                  <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                    rows={4} className="input resize-none" placeholder="Notification message..."
                    maxLength={500} />
                  <p className="text-xs text-gray-600 mt-1">{form.message.length}/500</p>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Deep Link (optional)</label>
                  <input value={form.link} onChange={e => setForm({ ...form, link: e.target.value })}
                    placeholder="/dashboard or https://..." className="input" />
                </div>

                {/* Preview */}
                {(form.title || form.message) && (
                  <div className="bg-slate-700/40 rounded-xl p-4 border border-white/10">
                    <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Preview</p>
                    <div className="flex gap-3">
                      <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Bell className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{form.title || 'Notification Title'}</p>
                        <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{form.message || 'Message content...'}</p>
                      </div>
                    </div>
                  </div>
                )}

                <button onClick={send} disabled={sending || !form.title || !form.message}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50">
                  {sending ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending...</>
                  ) : (
                    <><Send className="w-4 h-4" />Send Notification</>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Templates + History */}
          <div className="space-y-6">
            {/* Templates */}
            <div className="card">
              <h3 className="font-bold text-white mb-4">Quick Templates</h3>
              <div className="space-y-2">
                {TEMPLATES.map((t, i) => (
                  <button key={i} onClick={() => applyTemplate(t)}
                    className="w-full text-left p-3 bg-slate-700/40 hover:bg-slate-700 rounded-xl transition-colors">
                    <p className="text-white text-sm font-medium">{t.label}</p>
                    <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{t.title}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent broadcasts */}
            {history.length > 0 && (
              <div className="card">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-gray-400" /> Recent Broadcasts
                </h3>
                <div className="space-y-3">
                  {history.slice(0, 5).map((h: any) => (
                    <div key={h.id} className="p-3 bg-slate-700/40 rounded-xl">
                      <p className="text-white text-sm font-medium line-clamp-1">{h.title}</p>
                      <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{h.message}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="badge bg-violet-500/20 text-violet-400 capitalize">{h.audience}</span>
                        <span className="text-gray-600 text-xs">Just now</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audience info */}
            <div className="card">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" /> Audience Info
              </h3>
              <div className="space-y-2">
                {AUDIENCES.map(a => (
                  <div key={a.value} className={`flex items-center justify-between p-2 rounded-lg transition-colors ${form.audience === a.value ? 'bg-violet-500/20 border border-violet-500/30' : 'bg-slate-700/30'}`}>
                    <span className={`text-sm ${form.audience === a.value ? 'text-violet-400 font-medium' : 'text-gray-300'}`}>{a.label}</span>
                    {form.audience === a.value && (
                      <span className="badge bg-violet-600 text-white text-xs">Selected</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
