'use client'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { adminAPI } from '@/lib/api'
import AdminLayout from '@/components/AdminLayout'
import toast from 'react-hot-toast'
import {
  Video, Plus, X, Clock, Users, Play, Square, Trash2,
  BarChart2, CheckCircle2, XCircle, Search, RefreshCw,
  Calendar, BookOpen, User, Zap, AlertCircle, Eye, Download, Circle
} from 'lucide-react'
import { format, formatDistanceToNow, isFuture } from 'date-fns'

const STATUS = {
  live:      { label: 'LIVE',      cls: 'bg-red-500/20 text-red-400',    dot: 'bg-red-400 animate-pulse' },
  scheduled: { label: 'Scheduled', cls: 'bg-blue-500/20 text-blue-400',  dot: 'bg-blue-400' },
  ended:     { label: 'Ended',     cls: 'bg-gray-500/20 text-gray-400',  dot: 'bg-gray-500' },
  cancelled: { label: 'Cancelled', cls: 'bg-red-900/20 text-red-600',    dot: 'bg-red-700' },
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://api.peptly.in').replace(/\/api$/, '')

const emptyForm = {
  title: '', description: '', courseId: '', batchId: '', scheduledAt: '',
  duration: 60, platform: 'agora',
}

export default function LiveClassesPage() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch]             = useState('')
  const [showCreate, setShowCreate]     = useState(false)
  const [form, setForm]                 = useState({ ...emptyForm })
  const [saving, setSaving]             = useState(false)
  const [actionId, setActionId]         = useState('')  // which class is being acted on
  const [attendanceModal, setAttendanceModal] = useState<any>(null) // class obj

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-classes', statusFilter],
    queryFn: () => adminAPI.allClasses({ status: statusFilter || undefined, limit: 100 }).then(r => r.data),
    refetchInterval: 30000,
  })
  const { data: coursesData } = useQuery({
    queryKey: ['admin-courses-list'],
    queryFn: () => adminAPI.allCourses({ limit: 100 }).then(r => r.data),
  })
  const { data: batchesData } = useQuery({
    queryKey: ['admin-batches-for-course', form.courseId],
    queryFn: () => adminAPI.courseBatches(form.courseId).then(r => r.data),
    enabled: !!form.courseId,
  })
  const { data: attendanceData, isLoading: loadingAtt } = useQuery({
    queryKey: ['class-attendance', attendanceModal?._id],
    queryFn: () => adminAPI.getAttendance(attendanceModal._id).then(r => r.data),
    enabled: !!attendanceModal,
  })

  const classes: any[] = (data?.classes || []).filter((c: any) =>
    !search || c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.mentor?.name?.toLowerCase().includes(search.toLowerCase())
  )

  const liveCount      = (data?.classes || []).filter((c: any) => c.status === 'live').length
  const scheduledCount = (data?.classes || []).filter((c: any) => c.status === 'scheduled').length
  const endedCount     = (data?.classes || []).filter((c: any) => c.status === 'ended').length

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleCreate = async () => {
    if (!form.title || !form.scheduledAt) return toast.error('Title and date required')
    setSaving(true)
    try {
      await adminAPI.createClass({ ...form, duration: Number(form.duration), platform: 'agora', batchId: form.batchId || undefined })
      toast.success('Class scheduled!')
      setShowCreate(false)
      setForm({ ...emptyForm })
      refetch()
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleStart = async (cls: any) => {
    setActionId(cls._id)
    try {
      await adminAPI.startClass(cls._id)
      toast.success(`"${cls.title}" is now LIVE`)
      refetch()
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setActionId('') }
  }

  const handleEnd = async (cls: any) => {
    if (!confirm(`End class "${cls.title}"?`)) return
    setActionId(cls._id)
    try {
      await adminAPI.endClass(cls._id)
      toast.success('Class ended')
      refetch()
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setActionId('') }
  }

  const handleCancel = async (cls: any) => {
    if (!confirm(`Cancel class "${cls.title}"? This will also delete the Zoom meeting.`)) return
    setActionId(cls._id)
    try {
      await adminAPI.cancelClass(cls._id)
      toast.success('Class cancelled')
      refetch()
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setActionId('') }
  }

  const courses = coursesData?.courses || []

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Live Classes</h1>
            <p className="text-gray-400 text-sm mt-0.5">{data?.classes?.length || 0} total classes</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => refetch()} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors" title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-violet-500/25">
              <Plus className="w-4 h-4" /> Schedule Class
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-red-600/20 to-red-800/10 border border-red-500/20 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="w-3 h-3 bg-red-400 rounded-full animate-pulse" />
            </div>
            <div>
              <p className="text-3xl font-bold text-red-400">{liveCount}</p>
              <p className="text-gray-400 text-xs">Live Now</p>
            </div>
          </div>
          <div className="bg-slate-800/60 border border-white/5 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-400">{scheduledCount}</p>
              <p className="text-gray-400 text-xs">Scheduled</p>
            </div>
          </div>
          <div className="bg-slate-800/60 border border-white/5 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-emerald-400">{endedCount}</p>
              <p className="text-gray-400 text-xs">Completed</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search classes or mentor..."
              className="w-full bg-slate-800 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-gray-500 outline-none focus:border-violet-500 transition-colors" />
          </div>
          <div className="flex gap-1 bg-slate-800/60 p-1 rounded-xl border border-white/5">
            {[
              { v: '', l: 'All' },
              { v: 'live', l: 'Live' },
              { v: 'scheduled', l: 'Scheduled' },
              { v: 'ended', l: 'Ended' },
              { v: 'cancelled', l: 'Cancelled' },
            ].map(opt => (
              <button key={opt.v} onClick={() => setStatusFilter(opt.v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === opt.v ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                {opt.l}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-800/60 border border-white/5 rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-slate-700/30">
                    <th className="text-left px-5 py-4 text-gray-400 font-medium text-xs uppercase tracking-wide">Class</th>
                    <th className="text-left px-5 py-4 text-gray-400 font-medium text-xs uppercase tracking-wide hidden md:table-cell">Mentor</th>
                    <th className="text-left px-5 py-4 text-gray-400 font-medium text-xs uppercase tracking-wide">Schedule</th>
                    <th className="text-left px-5 py-4 text-gray-400 font-medium text-xs uppercase tracking-wide hidden lg:table-cell">Attendance</th>
                    <th className="text-left px-5 py-4 text-gray-400 font-medium text-xs uppercase tracking-wide hidden xl:table-cell">Recording</th>
                    <th className="text-left px-5 py-4 text-gray-400 font-medium text-xs uppercase tracking-wide">Status</th>
                    <th className="text-left px-5 py-4 text-gray-400 font-medium text-xs uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {classes.map((cls: any) => {
                    const st = STATUS[cls.status as keyof typeof STATUS] || STATUS.scheduled
                    const attRecords: any[] = cls.attendanceRecords || []
                    const presentCount = attRecords.filter((r: any) => r.isPresent).length
                    const isActing = actionId === cls._id
                    return (
                      <tr key={cls._id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cls.status === 'live' ? 'bg-red-500/20' : 'bg-violet-500/20'}`}>
                              <Video className={`w-5 h-5 ${cls.status === 'live' ? 'text-red-400' : 'text-violet-400'}`} />
                            </div>
                            <div>
                              <p className="text-white font-semibold text-sm leading-tight max-w-[180px] truncate">{cls.title}</p>
                              {cls.course?.title && (
                                <p className="text-violet-400/70 text-xs mt-0.5 flex items-center gap-1">
                                  <BookOpen className="w-3 h-3" /> {cls.course.title}
                                  {cls.batch && (
                                    <span className="text-gray-500 ml-1">· Batch {cls.batch.batchNumber}{cls.batch.label ? ` (${cls.batch.label})` : ''}</span>
                                  )}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {cls.mentor?.avatar
                                ? <img src={cls.mentor.avatar} className="w-full h-full object-cover" alt="" />
                                : <User className="w-3.5 h-3.5 text-gray-400" />}
                            </div>
                            <span className="text-gray-300 text-xs">{cls.mentor?.name || '—'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-gray-300 text-xs">
                            {cls.scheduledAt ? format(new Date(cls.scheduledAt), 'dd MMM, hh:mm a') : '—'}
                          </p>
                          <p className="text-gray-500 text-[11px] mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {cls.duration || 60} min
                          </p>
                          {cls.status === 'scheduled' && isFuture(new Date(cls.scheduledAt)) && (
                            <p className="text-yellow-400/70 text-[11px] mt-0.5">
                              {formatDistanceToNow(new Date(cls.scheduledAt), { addSuffix: true })}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4 hidden lg:table-cell">
                          {attRecords.length > 0 ? (
                            <button onClick={() => setAttendanceModal(cls)}
                              className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors group/att">
                              <Users className="w-3.5 h-3.5" />
                              <span className="text-emerald-400 font-semibold">{presentCount}</span>
                              <span className="text-gray-500">/ {attRecords.length} present</span>
                              <Eye className="w-3 h-3 opacity-0 group-hover/att:opacity-100 transition-opacity" />
                            </button>
                          ) : (
                            <span className="text-gray-600 text-xs">No data yet</span>
                          )}
                        </td>
                        <td className="px-5 py-4 hidden xl:table-cell">
                          {cls.recordingUrl ? (
                            <a
                              href={`${API_BASE}${cls.recordingUrl}`}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>
                                Download
                                {cls.recordingSize ? ` (${(cls.recordingSize / (1024 * 1024)).toFixed(1)} MB)` : ''}
                              </span>
                            </a>
                          ) : (
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              {cls.status === 'live' ? (
                                <><Circle className="w-2.5 h-2.5 fill-red-400 text-red-400 animate-pulse" /> Recording...</>
                              ) : cls.status === 'ended' ? (
                                <span>No recording</span>
                              ) : (
                                <span>—</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${st.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                            {st.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            {cls.status === 'scheduled' && (
                              <button onClick={() => handleStart(cls)} disabled={isActing}
                                title="Start Class"
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50">
                                {isActing ? <div className="w-3 h-3 border border-emerald-400 border-t-transparent rounded-full animate-spin" /> : <Play className="w-3 h-3" />}
                                Start
                              </button>
                            )}
                            {cls.status === 'live' && (
                              <>
                                <a href={`/live-classes/${cls._id}`}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 transition-colors">
                                  <Video className="w-3 h-3" /> Join
                                </a>
                                <button onClick={() => handleEnd(cls)} disabled={isActing}
                                  title="End Class"
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50">
                                  {isActing ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" /> : <Square className="w-3 h-3" />}
                                  End
                                </button>
                              </>
                            )}
                            {cls.status === 'ended' && attRecords.length > 0 && (
                              <button onClick={() => setAttendanceModal(cls)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 transition-colors">
                                <BarChart2 className="w-3 h-3" /> Report
                              </button>
                            )}
                            {['scheduled', 'live'].includes(cls.status) && (
                              <button onClick={() => handleCancel(cls)} disabled={isActing}
                                title="Cancel Class"
                                className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {classes.length === 0 && (
                <div className="text-center py-16 text-gray-500">
                  <Video className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No classes found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Create Modal ───────────────────────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-10 overflow-hidden">
            <div className="bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border-b border-white/10 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-violet-600/30 rounded-xl flex items-center justify-center">
                  <Video className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-white font-bold">Schedule Live Class</h2>
                  <p className="text-gray-400 text-xs mt-0.5">Zoom meeting will be auto-created</p>
                </div>
              </div>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="text-gray-400 text-xs font-medium block mb-1.5">Class Title *</label>
                <input value={form.title} onChange={e => set('title', e.target.value)}
                  placeholder="e.g. Digital Marketing — Session 1"
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-violet-500 transition-colors" />
              </div>

              <div>
                <label className="text-gray-400 text-xs font-medium block mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                  placeholder="What will be covered in this class..." rows={2}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-violet-500 transition-colors resize-none" />
              </div>

              <div>
                <label className="text-gray-400 text-xs font-medium block mb-1.5">Link to Course</label>
                <select value={form.courseId} onChange={e => { set('courseId', e.target.value); set('batchId', '') }}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500 transition-colors">
                  <option value="">— General / No Course —</option>
                  {courses.map((c: any) => <option key={c._id} value={c._id}>{c.title}</option>)}
                </select>
              </div>

              {form.courseId && (
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1.5">Batch (optional)</label>
                  <select value={form.batchId} onChange={e => set('batchId', e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500 transition-colors">
                    <option value="">— No Batch —</option>
                    {(batchesData?.batches || []).map((b: any) => (
                      <option key={b._id} value={b._id}>
                        Batch {b.batchNumber}{b.label ? ` — ${b.label}` : ''} ({b.status})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1.5">Date & Time *</label>
                  <input type="datetime-local" value={form.scheduledAt} onChange={e => set('scheduledAt', e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500 transition-colors" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1.5">Duration (minutes)</label>
                  <input type="number" value={form.duration} onChange={e => set('duration', e.target.value)}
                    min={15} step={15}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500 transition-colors" />
                </div>
              </div>

              {/* Info box */}
              <div className="flex items-start gap-2.5 bg-violet-500/10 border border-violet-500/20 rounded-xl p-3">
                <Zap className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-gray-400">
                  <span className="text-violet-400 font-semibold">Zoom Auto-Create:</span> A Zoom meeting will be automatically created with cloud recording enabled. Attendance will be auto-tracked (75% threshold).
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowCreate(false)}
                className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-gray-300 rounded-xl text-sm font-medium transition-colors">
                Cancel
              </button>
              <button onClick={handleCreate} disabled={saving}
                className="flex-1 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-violet-500/25 disabled:opacity-60 flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Video className="w-4 h-4" />}
                {saving ? 'Creating...' : 'Schedule & Create Zoom'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Attendance Report Modal ─────────────────────────────────────────────── */}
      {attendanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setAttendanceModal(null)} />
          <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-10 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-slate-800/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-violet-600/20 rounded-xl flex items-center justify-center">
                  <BarChart2 className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-white font-bold">Attendance Report</h2>
                  <p className="text-gray-400 text-xs mt-0.5 truncate max-w-[260px]">{attendanceModal.title}</p>
                </div>
              </div>
              <button onClick={() => setAttendanceModal(null)} className="text-gray-400 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingAtt ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* Summary */}
                {(() => {
                  const records: any[] = attendanceData?.attendanceRecords || attendanceModal.attendanceRecords || []
                  const present = records.filter((r: any) => r.isPresent).length
                  const total = records.length
                  const dur = attendanceModal.duration || 60
                  return (
                    <>
                      <div className="grid grid-cols-3 gap-3 p-5 flex-shrink-0">
                        <div className="bg-slate-800 rounded-xl p-3 text-center border border-white/5">
                          <p className="text-2xl font-bold text-white">{total}</p>
                          <p className="text-gray-400 text-xs mt-0.5">Total Joined</p>
                        </div>
                        <div className="bg-emerald-500/10 rounded-xl p-3 text-center border border-emerald-500/20">
                          <p className="text-2xl font-bold text-emerald-400">{present}</p>
                          <p className="text-gray-400 text-xs mt-0.5">Present (75%+)</p>
                        </div>
                        <div className="bg-red-500/10 rounded-xl p-3 text-center border border-red-500/20">
                          <p className="text-2xl font-bold text-red-400">{total - present}</p>
                          <p className="text-gray-400 text-xs mt-0.5">Absent</p>
                        </div>
                      </div>

                      {/* Student list */}
                      <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-2">
                        {records.length === 0 ? (
                          <div className="text-center py-10 text-gray-500">
                            <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">No attendance data yet</p>
                          </div>
                        ) : records.map((r: any, i: number) => {
                          const watchMin = Math.round((r.totalWatchSeconds || 0) / 60)
                          const pct = Math.min(100, Math.round((r.totalWatchSeconds / (dur * 60)) * 100))
                          const attPct = Math.min(100, Math.round((r.totalWatchSeconds / (dur * 60 * 0.75)) * 100))
                          return (
                            <div key={i} className={`rounded-xl p-3.5 border ${r.isPresent ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-slate-800 border-white/5'}`}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0 text-xs text-gray-300 font-bold">
                                    {(r.user?.name || 'S')[0].toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-white text-sm font-medium truncate">{r.user?.name || 'Student'}</p>
                                    <p className="text-gray-500 text-xs truncate">{r.user?.email || ''}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className="text-xs text-gray-400">{watchMin}m</span>
                                  {r.isPresent
                                    ? <span className="flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
                                        <CheckCircle2 className="w-3 h-3" /> Present
                                      </span>
                                    : <span className="flex items-center gap-1 text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-semibold">
                                        <XCircle className="w-3 h-3" /> Absent
                                      </span>}
                                </div>
                              </div>
                              {/* Progress bar toward 75% */}
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-slate-700 rounded-full h-1.5">
                                  <div className={`h-1.5 rounded-full transition-all ${r.isPresent ? 'bg-emerald-500' : 'bg-violet-500'}`}
                                    style={{ width: `${attPct}%` }} />
                                </div>
                                <span className="text-[10px] text-gray-500 flex-shrink-0">{pct}% of class</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )
                })()}
              </>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
