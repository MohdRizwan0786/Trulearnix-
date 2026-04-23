'use client'
import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { adminAPI } from '@/lib/api'
import { usePackages } from '@/lib/usePackages'
import toast from 'react-hot-toast'
import { Plus, X, Bell, Clock, Send, Mail, Smartphone, Repeat, Trash2 } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-yellow-400 bg-yellow-500/20',
  sent: 'text-green-400 bg-green-500/20',
  failed: 'text-red-400 bg-red-500/20',
}

const empty = {
  title: '', message: '', scheduledAt: '', targetType: 'all', targetValue: '',
  channel: 'both', isRecurring: false, recurringInterval: ''
}

export default function RemindersPage() {
  const { packages } = usePackages()
  const [reminders, setReminders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<any>(empty)

  useEffect(() => { fetchReminders() }, [])

  const fetchReminders = async () => {
    try {
      const res = await adminAPI.reminders()
      setReminders(res.data.data || [])
    } catch { toast.error('Failed to load reminders') }
    finally { setLoading(false) }
  }

  const save = async () => {
    if (!form.title || !form.message || !form.scheduledAt) return toast.error('Fill required fields')
    try {
      await adminAPI.createReminder(form)
      toast.success('Reminder scheduled!')
      setShowForm(false)
      setForm(empty)
      fetchReminders()
    } catch { toast.error('Failed') }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this reminder?')) return
    try {
      await adminAPI.deleteReminder(id)
      setReminders(p => p.filter(r => r._id !== id))
      toast.success('Deleted')
    } catch { toast.error('Failed') }
  }

  const pending = reminders.filter(r => r.status === 'pending')
  const sent = reminders.filter(r => r.status === 'sent')

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* ── Page Header ── */}
        <div className="page-header">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                Reminders
              </h1>
              <p className="text-gray-400 text-sm mt-1">{pending.length} pending · {sent.length} sent</p>
            </div>
            <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Schedule Reminder
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Pending', count: pending.length, color: 'text-yellow-400', icon: Clock },
            { label: 'Sent', count: sent.length, color: 'text-green-400', icon: Send },
            { label: 'Total', count: reminders.length, color: 'text-violet-400', icon: Bell },
          ].map(s => (
            <div key={s.label} className="bg-slate-800 rounded-2xl p-4 border border-white/5 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color} bg-current/10`}>
                <s.icon className="w-5 h-5" style={{ color: 'inherit' }} />
              </div>
              <div>
                <p className="text-gray-400 text-xs">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
              </div>
            </div>
          ))}
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-lg border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-white font-bold">Schedule Reminder</h2>
                <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-gray-400" /></button>
              </div>
              <input value={form.title} onChange={e => setForm((p: any) => ({ ...p, title: e.target.value }))}
                placeholder="Reminder title *" className="w-full bg-slate-700 text-white rounded-xl px-4 py-2.5 text-sm border border-white/10 outline-none focus:border-violet-500" />
              <textarea value={form.message} onChange={e => setForm((p: any) => ({ ...p, message: e.target.value }))}
                placeholder="Message *" rows={3} className="w-full bg-slate-700 text-white rounded-xl px-4 py-2.5 text-sm border border-white/10 outline-none resize-none" />
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Scheduled At *</label>
                <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm((p: any) => ({ ...p, scheduledAt: e.target.value }))}
                  className="w-full bg-slate-700 text-white rounded-xl px-4 py-2.5 text-sm border border-white/10 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Target</label>
                  <select value={form.targetType} onChange={e => setForm((p: any) => ({ ...p, targetType: e.target.value }))}
                    className="w-full bg-slate-700 text-white rounded-xl px-3 py-2.5 text-sm border border-white/10 outline-none">
                    <option value="all">All Users</option>
                    <option value="role">By Role</option>
                    <option value="tier">By Tier</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Channel</label>
                  <select value={form.channel} onChange={e => setForm((p: any) => ({ ...p, channel: e.target.value }))}
                    className="w-full bg-slate-700 text-white rounded-xl px-3 py-2.5 text-sm border border-white/10 outline-none">
                    <option value="both">Email + Push</option>
                    <option value="email">Email only</option>
                    <option value="push">Push only</option>
                  </select>
                </div>
              </div>
              {form.targetType === 'role' && (
                <select value={form.targetValue} onChange={e => setForm((p: any) => ({ ...p, targetValue: e.target.value }))}
                  className="w-full bg-slate-700 text-white rounded-xl px-3 py-2.5 text-sm border border-white/10 outline-none">
                  <option value="">Select role…</option>
                  <option value="student">Student</option>
                  <option value="mentor">Mentor</option>
                  <option value="manager">Manager</option>
                  <option value="salesperson">Salesperson</option>
                </select>
              )}
              {form.targetType === 'tier' && (
                <select value={form.targetValue} onChange={e => setForm((p: any) => ({ ...p, targetValue: e.target.value }))}
                  className="w-full bg-slate-700 text-white rounded-xl px-3 py-2.5 text-sm border border-white/10 outline-none">
                  <option value="">Select tier…</option>
                  {packages.map(p => (
                    <option key={p._id} value={p.tier}>{p.name}</option>
                  ))}
                </select>
              )}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isRecurring} onChange={e => setForm((p: any) => ({ ...p, isRecurring: e.target.checked }))} className="w-4 h-4 accent-violet-500" />
                <span className="text-sm text-gray-300">Recurring reminder</span>
              </label>
              {form.isRecurring && (
                <select value={form.recurringInterval} onChange={e => setForm((p: any) => ({ ...p, recurringInterval: e.target.value }))}
                  className="w-full bg-slate-700 text-white rounded-xl px-3 py-2.5 text-sm border border-white/10 outline-none">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              )}
              <div className="flex gap-3">
                <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm">Cancel</button>
                <button onClick={save} className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700">Schedule</button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="space-y-3">
            {reminders.map(r => (
              <div key={r._id} className="bg-slate-800 rounded-2xl p-4 border border-white/5 flex items-start justify-between gap-4 group">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-violet-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Bell className="w-5 h-5 text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-semibold text-sm">{r.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status]}`}>{r.status}</span>
                      {r.isRecurring && <span className="text-xs text-blue-400 flex items-center gap-1"><Repeat className="w-3 h-3" />{r.recurringInterval}</span>}
                    </div>
                    <p className="text-gray-400 text-sm mb-2 line-clamp-2">{r.message}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(r.scheduledAt).toLocaleString()}</span>
                      <span className="flex items-center gap-1">
                        {r.channel === 'email' ? <Mail className="w-3 h-3" /> : r.channel === 'push' ? <Smartphone className="w-3 h-3" /> : <><Mail className="w-3 h-3" /><Smartphone className="w-3 h-3" /></>}
                        {r.channel}
                      </span>
                      <span className="capitalize">{r.targetType}{r.targetValue ? `: ${r.targetValue}` : ''}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => remove(r._id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-400 flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {reminders.length === 0 && <div className="text-center py-16 text-gray-500">No reminders scheduled.</div>}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
