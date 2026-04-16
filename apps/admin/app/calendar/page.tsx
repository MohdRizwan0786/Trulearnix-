'use client'
import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { adminAPI } from '@/lib/api'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft, ChevronRight, Video, Bell, CalendarDays, Plus, X,
  Users, Clock, CheckSquare, Loader2, Trash2, Edit3, Tag,
} from 'lucide-react'
import toast from 'react-hot-toast'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const MEETING_TYPES = ['team', 'client', 'training', 'review', 'standup']
const TYPE_COLORS: Record<string, string> = {
  team: 'violet', client: 'blue', training: 'emerald', review: 'amber', standup: 'cyan',
}
const TYPE_BADGE: Record<string, string> = {
  team: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  client: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  training: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  review: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  standup: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
}
const STATUS_BADGE: Record<string, string> = {
  scheduled: 'bg-blue-500/20 text-blue-400',
  live: 'bg-green-500/20 text-green-400',
  ended: 'bg-gray-500/20 text-gray-400',
  cancelled: 'bg-red-500/20 text-red-400',
}

interface Meeting {
  _id: string
  title: string
  description: string
  roomId: string
  scheduledAt: string
  duration: number
  type: string
  status: 'scheduled' | 'live' | 'ended' | 'cancelled'
  createdBy: { name: string; role: string }
  invitees: { _id: string; name: string; role: string }[]
}

interface CalEvent {
  id: string
  title: string
  date: string
  type: 'class' | 'reminder' | 'task' | 'meeting'
  status?: string
  time?: string
  data?: any
}

interface TeamMember { _id: string; name: string; role: string }

export default function CalendarPage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [events, setEvents] = useState<CalEvent[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [team, setTeam] = useState<TeamMember[]>([])
  const [analytics, setAnalytics] = useState({ total: 0, upcoming: 0, live: 0, thisMonth: 0, ended: 0 })
  const [adminRole, setAdminRole] = useState('')

  const router = useRouter()

  // Create/Edit modal
  const [showModal, setShowModal] = useState(false)
  const [editMeeting, setEditMeeting] = useState<Meeting | null>(null)
  const [form, setForm] = useState({
    title: '', description: '', scheduledAt: '', duration: 60,
    type: 'team', invitees: [] as string[],
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const role = localStorage.getItem('adminRole') || ''
    setAdminRole(role)
  }, [])

  useEffect(() => { fetchAll() }, [month, year])

  const isAdmin = ['admin', 'superadmin', 'manager'].includes(adminRole)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [classRes, reminderRes, taskRes, meetingRes, analyticsRes, teamRes] = await Promise.allSettled([
        adminAPI.allClasses({ limit: 100 }),
        adminAPI.reminders(),
        adminAPI.tasks(),
        adminAPI.meetings(),
        adminAPI.meetingAnalytics(),
        adminAPI.taskTeam(),
      ])

      const classEvents: CalEvent[] = classRes.status === 'fulfilled'
        ? (classRes.value.data.data || []).map((c: any) => ({
            id: c._id, title: c.title, date: c.scheduledAt?.split('T')[0] || '',
            type: 'class', status: c.status,
            time: c.scheduledAt ? new Date(c.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            data: c,
          })) : []

      const reminderEvents: CalEvent[] = reminderRes.status === 'fulfilled'
        ? (reminderRes.value.data.data || []).map((r: any) => ({
            id: r._id, title: r.title, date: r.scheduledAt?.split('T')[0] || '',
            type: 'reminder', status: r.status,
            time: r.scheduledAt ? new Date(r.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            data: r,
          })) : []

      const taskEvents: CalEvent[] = taskRes.status === 'fulfilled'
        ? (taskRes.value.data.data || [])
            .filter((t: any) => t.dueDate)
            .map((t: any) => ({
              id: t._id, title: t.title, date: t.dueDate?.split('T')[0] || '',
              type: 'task', status: t.status,
              time: '', data: t,
            })) : []

      const meetingList: Meeting[] = meetingRes.status === 'fulfilled'
        ? (meetingRes.value.data.data || []) : []
      setMeetings(meetingList)

      const meetingEvents: CalEvent[] = meetingList.map((m) => ({
        id: m._id, title: m.title, date: m.scheduledAt?.split('T')[0] || '',
        type: 'meeting', status: m.status,
        time: m.scheduledAt ? new Date(m.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        data: m,
      }))

      if (analyticsRes.status === 'fulfilled') setAnalytics(analyticsRes.value.data.data)
      if (teamRes.status === 'fulfilled') setTeam(teamRes.value.data.data || [])

      setEvents([...classEvents, ...reminderEvents, ...taskEvents, ...meetingEvents])
    } catch { }
    finally { setLoading(false) }
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, month, 1).getDay()

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  const eventsOnDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter(e => e.date === dateStr)
  }

  const selectedEvents = selected ? eventsOnDay(selected) : []

  const openCreate = () => {
    setEditMeeting(null)
    const now = new Date()
    now.setMinutes(0, 0, 0)
    now.setHours(now.getHours() + 1)
    setForm({ title: '', description: '', scheduledAt: now.toISOString().slice(0, 16), duration: 60, type: 'team', invitees: [] })
    setShowModal(true)
  }

  const openEdit = (m: Meeting) => {
    setEditMeeting(m)
    setForm({
      title: m.title, description: m.description,
      scheduledAt: new Date(m.scheduledAt).toISOString().slice(0, 16),
      duration: m.duration, type: m.type,
      invitees: m.invitees.map((i: any) => i._id || i),
    })
    setShowModal(true)
  }

  const saveMeeting = async () => {
    if (!form.title || !form.scheduledAt) return toast.error('Title and time required')
    setSaving(true)
    try {
      if (editMeeting) {
        await adminAPI.updateMeeting(editMeeting._id, form)
        toast.success('Meeting updated')
      } else {
        await adminAPI.createMeeting(form)
        toast.success('Meeting created')
      }
      setShowModal(false)
      fetchAll()
    } catch { toast.error('Failed to save meeting') }
    finally { setSaving(false) }
  }

  const deleteMeeting = async (id: string) => {
    if (!confirm('Delete this meeting?')) return
    try {
      await adminAPI.deleteMeeting(id)
      toast.success('Deleted')
      fetchAll()
    } catch { toast.error('Failed') }
  }

  const startMeeting = async (m: Meeting) => {
    try {
      if (isAdmin) await adminAPI.startMeeting(m._id)
      router.push(`/meeting-room/${m._id}`)
    } catch { router.push(`/meeting-room/${m._id}`) }
  }

  const joinLiveMeeting = (m: Meeting) => {
    router.push(`/meeting-room/${m._id}`)
  }

  const toggleInvitee = (id: string) => {
    setForm(f => ({
      ...f,
      invitees: f.invitees.includes(id) ? f.invitees.filter(i => i !== id) : [...f.invitees, id],
    }))
  }

  const TEAM_GROUPS = [
    { label: 'All', roles: ['superadmin', 'admin', 'manager', 'mentor', 'salesperson'], color: 'text-white bg-white/10 border-white/20' },
    { label: 'Mentors', roles: ['mentor'], color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
    { label: 'Sales', roles: ['salesperson'], color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
    { label: 'Managers', roles: ['manager'], color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
    { label: 'Admins', roles: ['admin', 'superadmin'], color: 'text-violet-400 bg-violet-500/10 border-violet-500/30' },
  ]

  const selectTeam = (roles: string[]) => {
    const ids = team.filter(m => roles.includes(m.role)).map(m => m._id)
    const allSelected = ids.every(id => form.invitees.includes(id))
    if (allSelected) {
      // deselect all in this group
      setForm(f => ({ ...f, invitees: f.invitees.filter(id => !ids.includes(id)) }))
    } else {
      // select all in this group
      setForm(f => ({ ...f, invitees: Array.from(new Set([...f.invitees, ...ids])) }))
    }
  }

  const isGroupSelected = (roles: string[]) => {
    const ids = team.filter(m => roles.includes(m.role)).map(m => m._id)
    return ids.length > 0 && ids.every(id => form.invitees.includes(id))
  }

  const dotColor = (type: string) => {
    if (type === 'meeting') return 'bg-violet-400'
    if (type === 'class') return 'bg-blue-400'
    if (type === 'task') return 'bg-orange-400'
    return 'bg-yellow-400'
  }

  const kpiCards = [
    { label: 'Total Meetings', value: analytics.total, color: 'violet', icon: CalendarDays },
    { label: 'Upcoming', value: analytics.upcoming, color: 'blue', icon: Clock },
    { label: 'Live Now', value: analytics.live, color: 'green', icon: Video },
    { label: 'This Month', value: analytics.thisMonth, color: 'amber', icon: Tag },
    { label: 'Completed', value: analytics.ended, color: 'gray', icon: CheckSquare },
  ]

  const colorMap: Record<string, string> = {
    violet: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    gray: 'bg-slate-700 text-gray-400 border-white/10',
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Calendar</h1>
            <p className="text-gray-400 text-sm mt-1">Meetings, live classes, task due dates & reminders</p>
          </div>
          {isAdmin && (
            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" /> New Meeting
            </button>
          )}
        </div>

        {/* KPI Analytics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {kpiCards.map(card => (
            <div key={card.label} className={`rounded-2xl border p-4 flex flex-col gap-2 ${colorMap[card.color]}`}>
              <card.icon className="w-5 h-5 opacity-80" />
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="text-xs opacity-80">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Calendar + Sidebar */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Calendar Grid */}
          <div className="xl:col-span-3 bg-slate-800 rounded-2xl p-6 border border-white/5">
            <div className="flex items-center justify-between mb-6">
              <button onClick={prev} className="p-2 hover:bg-white/10 rounded-xl text-gray-400"><ChevronLeft className="w-5 h-5" /></button>
              <h2 className="text-white font-bold text-lg">{MONTHS[month]} {year}</h2>
              <button onClick={next} className="p-2 hover:bg-white/10 rounded-xl text-gray-400"><ChevronRight className="w-5 h-5" /></button>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 mb-4 text-xs text-gray-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-400 inline-block" /> Meeting</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Class</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" /> Task Due</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Reminder</span>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map(d => <div key={d} className="text-center text-xs text-gray-500 font-medium py-2">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dayEvents = eventsOnDay(day)
                const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
                const isSelected = selected === day
                return (
                  <button key={day} onClick={() => setSelected(isSelected ? null : day)}
                    className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition-colors
                      ${isToday ? 'bg-violet-600 text-white font-bold' : ''}
                      ${isSelected && !isToday ? 'bg-violet-600/30 text-violet-300' : ''}
                      ${!isToday && !isSelected ? 'text-gray-300 hover:bg-white/5' : ''}`}>
                    {day}
                    {dayEvents.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5">
                        {dayEvents.slice(0, 4).map((e, idx) => (
                          <span key={idx} className={`w-1 h-1 rounded-full ${dotColor(e.type)}`} />
                        ))}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Day Events Sidebar */}
          <div className="bg-slate-800 rounded-2xl p-5 border border-white/5 overflow-y-auto max-h-[500px]">
            {selected ? (
              <>
                <h3 className="text-white font-semibold mb-4">{MONTHS[month]} {selected}, {year}</h3>
                {selectedEvents.length > 0 ? (
                  <div className="space-y-3">
                    {selectedEvents.map(e => (
                      <div key={e.id} className={`p-3 rounded-xl border ${
                        e.type === 'meeting' ? 'border-violet-500/30 bg-violet-500/10' :
                        e.type === 'class' ? 'border-blue-500/30 bg-blue-500/10' :
                        e.type === 'task' ? 'border-orange-500/30 bg-orange-500/10' :
                        'border-yellow-500/30 bg-yellow-500/10'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          {e.type === 'meeting' && <Video className="w-3.5 h-3.5 text-violet-400" />}
                          {e.type === 'class' && <Video className="w-3.5 h-3.5 text-blue-400" />}
                          {e.type === 'task' && <CheckSquare className="w-3.5 h-3.5 text-orange-400" />}
                          {e.type === 'reminder' && <Bell className="w-3.5 h-3.5 text-yellow-400" />}
                          <span className={`text-xs font-medium capitalize ${
                            e.type === 'meeting' ? 'text-violet-400' :
                            e.type === 'class' ? 'text-blue-400' :
                            e.type === 'task' ? 'text-orange-400' : 'text-yellow-400'
                          }`}>{e.type === 'class' ? 'Live Class' : e.type === 'task' ? 'Task Due' : e.type}</span>
                        </div>
                        <p className="text-white text-sm font-medium">{e.title}</p>
                        {e.time && <p className="text-gray-400 text-xs mt-0.5">{e.time}</p>}
                        {e.type === 'meeting' && e.data && (
                          <button
                            onClick={() => e.data.status === 'live' ? joinLiveMeeting(e.data) : startMeeting(e.data)}
                            className={`mt-2 w-full py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              e.data.status === 'live'
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : e.data.status === 'scheduled'
                                  ? 'bg-violet-600 hover:bg-violet-700 text-white'
                                  : 'bg-gray-700 text-gray-400 cursor-default'
                            }`}
                            disabled={e.data.status === 'ended' || e.data.status === 'cancelled'}>
                            {e.data.status === 'live' ? 'Join Meeting' : e.data.status === 'scheduled' ? 'Start & Join' : e.data.status}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No events this day</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Select a day to view events</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Meetings List */}
        <div className="bg-slate-800 rounded-2xl p-5 border border-white/5">
          <h3 className="text-white font-semibold mb-4">Upcoming Meetings</h3>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-violet-400" /></div>
          ) : (
            <div className="space-y-3">
              {meetings
                .filter(m => m.status === 'scheduled' || m.status === 'live')
                .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                .slice(0, 10)
                .map(m => {
                  const dt = new Date(m.scheduledAt)
                  const isPast = dt < today
                  return (
                    <div key={m._id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-700/50 hover:bg-slate-700 transition-colors">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${TYPE_BADGE[m.type] || 'bg-violet-500/20'}`}>
                        <Video className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-white text-sm font-medium truncate">{m.title}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full capitalize border ${TYPE_BADGE[m.type]}`}>{m.type}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full capitalize ${STATUS_BADGE[m.status]}`}>{m.status}</span>
                        </div>
                        <p className="text-gray-400 text-xs mt-0.5">
                          {dt.toLocaleDateString()} · {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {m.duration}min
                        </p>
                        {m.invitees.length > 0 && (
                          <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-1">
                            <Users className="w-3 h-3" /> {m.invitees.map((i: any) => i.name).join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {m.status === 'live' && (
                          <button onClick={() => joinLiveMeeting(m)}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg font-medium transition-colors flex items-center gap-1.5">
                            <Video className="w-3.5 h-3.5" /> Join
                          </button>
                        )}
                        {m.status === 'scheduled' && (
                          <button onClick={() => startMeeting(m)}
                            className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs rounded-lg font-medium transition-colors flex items-center gap-1.5">
                            <Video className="w-3.5 h-3.5" /> {isAdmin ? 'Start' : 'Join'}
                          </button>
                        )}
                        {isAdmin && (
                          <>
                            <button onClick={() => openEdit(m)} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => deleteMeeting(m._id)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              {meetings.filter(m => m.status === 'scheduled' || m.status === 'live').length === 0 && (
                <div className="text-center py-8 text-gray-500">No upcoming meetings</div>
              )}
            </div>
          )}
        </div>

        {/* All Events Timeline */}
        <div className="bg-slate-800 rounded-2xl p-5 border border-white/5">
          <h3 className="text-white font-semibold mb-4">All Upcoming Events</h3>
          <div className="space-y-2">
            {events
              .filter(e => e.date >= today.toISOString().split('T')[0])
              .sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')))
              .slice(0, 15)
              .map(e => (
                <div key={e.id + e.type} className="flex items-center gap-3 p-3 rounded-xl bg-slate-700/50">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor(e.type)}`} />
                  <span className="text-gray-400 text-xs w-24 flex-shrink-0">{e.date} {e.time && `· ${e.time}`}</span>
                  <span className="text-white text-sm truncate flex-1">{e.title}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                    e.type === 'meeting' ? 'bg-violet-500/20 text-violet-400' :
                    e.type === 'class' ? 'bg-blue-500/20 text-blue-400' :
                    e.type === 'task' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>{e.type === 'class' ? 'Class' : e.type === 'task' ? 'Task Due' : e.type}</span>
                </div>
              ))}
            {events.filter(e => e.date >= today.toISOString().split('T')[0]).length === 0 && (
              <div className="text-center py-8 text-gray-500">No upcoming events</div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Meeting Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-white font-bold text-lg">{editMeeting ? 'Edit Meeting' : 'New Meeting'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-xl text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Meeting title..."
                  className="w-full bg-slate-700 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} placeholder="What's this meeting about?"
                  className="w-full bg-slate-700 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Date & Time *</label>
                  <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                    className="w-full bg-slate-700 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Duration (minutes)</label>
                  <input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
                    min={15} max={480} step={15}
                    className="w-full bg-slate-700 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500" />
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Meeting Type</label>
                <div className="flex flex-wrap gap-2">
                  {MEETING_TYPES.map(t => (
                    <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors border ${
                        form.type === t ? TYPE_BADGE[t] : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
                      }`}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-gray-400 text-xs">Invite Team Members</label>
                  {form.invitees.length > 0 && (
                    <button onClick={() => setForm(f => ({ ...f, invitees: [] }))}
                      className="text-[10px] text-gray-500 hover:text-red-400 transition-colors">Clear all</button>
                  )}
                </div>
                {/* Quick team-select buttons */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {TEAM_GROUPS.map(g => {
                    const count = team.filter(m => g.roles.includes(m.role)).length
                    if (count === 0) return null
                    const active = isGroupSelected(g.roles)
                    return (
                      <button key={g.label} onClick={() => selectTeam(g.roles)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                          active ? g.color : 'border-white/10 text-gray-400 hover:bg-white/5'
                        }`}>
                        <Users className="w-3 h-3" />
                        {g.label}
                        <span className={`text-[10px] px-1 rounded-full ml-0.5 ${active ? 'bg-white/20' : 'bg-white/10'}`}>{count}</span>
                      </button>
                    )
                  })}
                </div>
                {/* Individual member list */}
                <div className="space-y-1 max-h-44 overflow-y-auto border border-white/5 rounded-xl p-2 bg-slate-700/30">
                  {['mentor', 'salesperson', 'manager', 'admin', 'superadmin'].map(role => {
                    const members = team.filter(m => m.role === role)
                    if (!members.length) return null
                    return (
                      <div key={role}>
                        <p className="text-gray-500 text-[10px] uppercase tracking-wider px-2 py-1 font-medium capitalize">{role === 'salesperson' ? 'Sales' : role}</p>
                        {members.map(m => (
                          <label key={m._id} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer">
                            <input type="checkbox" checked={form.invitees.includes(m._id)}
                              onChange={() => toggleInvitee(m._id)}
                              className="accent-violet-500" />
                            <div className="w-6 h-6 bg-violet-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-violet-300 text-[10px] font-bold">{m.name[0]?.toUpperCase()}</span>
                            </div>
                            <p className="text-white text-xs">{m.name}</p>
                          </label>
                        ))}
                      </div>
                    )
                  })}
                </div>
                {form.invitees.length > 0 && (
                  <p className="text-violet-400 text-[11px] mt-1.5">{form.invitees.length} member{form.invitees.length !== 1 ? 's' : ''} selected</p>
                )}
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-white/10">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white text-sm font-medium transition-colors">
                Cancel
              </button>
              <button onClick={saveMeeting} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editMeeting ? 'Update Meeting' : 'Create Meeting'}
              </button>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  )
}
