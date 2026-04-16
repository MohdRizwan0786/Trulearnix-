'use client'
import { useState, useEffect } from 'react'
import { meetingsAPI, tasksAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { usePathname } from 'next/navigation'
import toast from 'react-hot-toast'
import { ChevronLeft, ChevronRight, Plus, X, Loader2, CalendarDays, Video, CheckSquare, Clock, Users, Zap } from 'lucide-react'

const DAYS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

const TYPE_COLOR: Record<string, string> = {
  meeting: 'bg-blue-500/80',
  task:    'bg-amber-500/80',
}

interface CalEvent { id: string; title: string; date: string; type: 'meeting' | 'task'; time?: string; data?: any }

const emptyMeeting = { title: '', description: '', scheduledAt: '', duration: 60, type: 'team' }

// Detect current panel path prefix (sales / manager / mentor)
function usePanelBase() {
  const pathname = usePathname()
  if (pathname.startsWith('/sales'))   return '/sales'
  if (pathname.startsWith('/manager')) return '/manager'
  if (pathname.startsWith('/mentor'))  return '/mentor'
  return ''
}

export default function CalendarView() {
  const { user } = useAuthStore()
  const isAdmin  = ['admin', 'superadmin'].includes(user?.role || '')
  const panelBase = usePanelBase()

  const today = new Date()
  const [year, setYear]         = useState(today.getFullYear())
  const [month, setMonth]       = useState(today.getMonth())
  const [events, setEvents]     = useState<CalEvent[]>([])
  const [allMeetings, setAllMeetings] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState<any>(emptyMeeting)
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    fetchAll()
    const t = setInterval(fetchAll, 30_000)
    return () => clearInterval(t)
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [m, t] = await Promise.allSettled([meetingsAPI.list(), tasksAPI.list()])
      const evts: CalEvent[] = []
      let rawMeetings: any[] = []
      if (m.status === 'fulfilled') {
        rawMeetings = m.value.data.meetings || []
        rawMeetings.forEach((mtg: any) => {
          if (mtg.scheduledAt) evts.push({
            id: mtg._id, title: mtg.title,
            date: mtg.scheduledAt.slice(0, 10), type: 'meeting',
            time: new Date(mtg.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            data: mtg,
          })
        })
      }
      if (t.status === 'fulfilled') {
        ;(t.value.data.data || []).forEach((task: any) => {
          if (task.dueDate) evts.push({
            id: task._id, title: task.title,
            date: task.dueDate.slice(0, 10), type: 'task',
            data: task,
          })
        })
      }
      setAllMeetings(rawMeetings)
      setEvents(evts)
    } finally { setLoading(false) }
  }

  const saveMeeting = async () => {
    if (!form.title || !form.scheduledAt) return toast.error('Title and date/time required')
    setSaving(true)
    try {
      await meetingsAPI.create(form)
      toast.success('Meeting scheduled!')
      setShowForm(false); setForm(emptyMeeting); fetchAll()
    } catch { toast.error('Failed to create meeting') } finally { setSaving(false) }
  }

  const nowTs = Date.now()
  const twoHrsAgo = nowTs - 2 * 60 * 60 * 1000

  // Live meetings (show prominently regardless of scheduled time)
  const liveMeetings = allMeetings.filter(m => m.status === 'live')

  // Upcoming = future scheduled + live (not already in liveMeetings banner) + recent (within 2h)
  const upcomingMeetings = allMeetings
    .filter(m =>
      m.status !== 'ended' && m.status !== 'cancelled' && m.status !== 'live' &&
      m.scheduledAt && new Date(m.scheduledAt).getTime() > twoHrsAgo
    )
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 4)

  // Calendar grid
  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonth   = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const nextMonth   = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  const dayKey           = (d: number) => `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
  const eventsForDay     = (d: number) => events.filter(e => e.date === dayKey(d))
  const selectedEvents   = selected ? events.filter(e => e.date === selected) : []

  const joinUrl = (id: string) => `${panelBase}/meeting-room/${id}`

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
    </div>
  )

  return (
    <div className="space-y-6">

      {/* Live Meetings banner */}
      {liveMeetings.map(mtg => (
        <div key={mtg._id} className="rounded-2xl p-4 flex items-center gap-4"
          style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.2),rgba(139,92,246,0.1))', border: '1px solid rgba(139,92,246,0.3)' }}>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse" />
            <span className="text-red-400 text-xs font-black tracking-widest">LIVE</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm truncate">{mtg.title}</p>
            <p className="text-violet-300 text-xs">Meeting is live now — join immediately</p>
          </div>
          <a href={joinUrl(mtg._id)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-all flex-shrink-0">
            <Zap className="w-3.5 h-3.5" /> Join Now
          </a>
        </div>
      ))}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Calendar</h1>
            <p className="text-gray-500 text-xs">{events.length} events this period</p>
          </div>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all">
            <Plus className="w-4 h-4" /> Schedule Meeting
          </button>
        )}
      </div>

      {/* Upcoming Meetings */}
      {upcomingMeetings.length > 0 && (
        <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <Video className="w-4 h-4 text-blue-400" /> Upcoming Meetings
          </h3>
          <div className="space-y-2">
            {upcomingMeetings.map(mtg => {
              const dt = new Date(mtg.scheduledAt)
              const diffMs = dt.getTime() - nowTs
              const diffH  = Math.floor(diffMs / 3600000)
              const diffM  = Math.floor((diffMs % 3600000) / 60000)
              const when   = diffH > 24
                ? dt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
                : diffH > 0 ? `In ${diffH}h ${diffM}m` : `In ${diffM}m`
              return (
                <div key={mtg._id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Video className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{mtg.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-gray-500 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} · {dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                      <span className="text-violet-400 text-[10px] font-bold">{when}</span>
                    </div>
                    {mtg.invitees?.length > 0 && (
                      <p className="text-gray-600 text-[10px] mt-0.5 flex items-center gap-1">
                        <Users className="w-3 h-3" /> {mtg.invitees.length} invitee{mtg.invitees.length > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  <a href={joinUrl(mtg._id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex-shrink-0">
                    <Video className="w-3 h-3" /> Join
                  </a>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Month nav */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <button onClick={prevMonth} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="text-white font-bold">{MONTHS[month]} {year}</h2>
          <button onClick={nextMonth} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-white/5">
          {DAYS.map(d => (
            <div key={d} className="py-2 text-center text-[10px] sm:text-[11px] font-black text-gray-600 uppercase tracking-wider">{d.slice(0, 1)}<span className="hidden sm:inline">{d.slice(1)}</span></div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[48px] sm:min-h-[80px] border-r border-b border-white/5 opacity-30" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const d         = i + 1
            const key       = dayKey(d)
            const isToday   = d === today.getDate() && month === today.getMonth() && year === today.getFullYear()
            const isSelected = selected === key
            const dayEvts   = eventsForDay(d)
            return (
              <div key={d} onClick={() => setSelected(isSelected ? null : key)}
                className={`min-h-[48px] sm:min-h-[80px] border-r border-b border-white/5 p-1 sm:p-1.5 cursor-pointer transition-all hover:bg-white/[0.03] ${isSelected ? 'bg-violet-500/10' : ''}`}>
                <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold mb-1 ${
                  isToday ? 'bg-violet-500 text-white' : 'text-gray-400'}`}>
                  {d}
                </div>
                {/* Mobile: colored dots only */}
                <div className="flex flex-wrap gap-0.5 sm:hidden">
                  {dayEvts.slice(0, 3).map(e => (
                    <div key={e.id} className={`w-1.5 h-1.5 rounded-full ${TYPE_COLOR[e.type]}`} />
                  ))}
                </div>
                {/* Desktop: event pills */}
                <div className="hidden sm:block space-y-0.5">
                  {dayEvts.slice(0, 2).map(e => (
                    <div key={e.id} className={`${TYPE_COLOR[e.type]} rounded-sm px-1 py-0.5 text-[9px] font-bold text-white truncate`}>
                      {e.type === 'meeting' ? '📅' : '✅'} {e.title}
                    </div>
                  ))}
                  {dayEvts.length > 2 && (
                    <div className="text-[9px] text-gray-600 font-bold px-1">+{dayEvts.length - 2} more</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Selected day events */}
      {selected && selectedEvents.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 className="text-white font-bold text-sm mb-3">
            {new Date(selected + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h3>
          <div className="space-y-2">
            {selectedEvents.map(e => (
              <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                {e.type === 'meeting'
                  ? <Video className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  : <CheckSquare className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{e.title}</p>
                  {e.time && <p className="text-gray-500 text-xs flex items-center gap-1"><Clock className="w-3 h-3" />{e.time}</p>}
                </div>
                {e.type === 'meeting' ? (
                  <a href={joinUrl(e.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex-shrink-0">
                    <Video className="w-3 h-3" /> Join
                  </a>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                    Task due
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule Meeting Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="fixed inset-0" onClick={() => setShowForm(false)} />
          <div className="relative bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md z-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold">Schedule Meeting</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Title *</label>
                <input value={form.title} onChange={e => setForm((f: any) => ({ ...f, title: e.target.value }))}
                  placeholder="Meeting title"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Date & Time *</label>
                <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm((f: any) => ({ ...f, scheduledAt: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Type</label>
                  <select value={form.type} onChange={e => setForm((f: any) => ({ ...f, type: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500">
                    {['team','client','training','review','standup'].map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Duration (min)</label>
                  <input type="number" value={form.duration} onChange={e => setForm((f: any) => ({ ...f, duration: Number(e.target.value) }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500" />
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Description</label>
                <textarea value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))}
                  rows={2} placeholder="Optional details"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white text-sm">Cancel</button>
              <button onClick={saveMeeting} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : 'Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
