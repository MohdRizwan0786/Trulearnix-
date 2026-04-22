'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminAPI } from '@/lib/api'
import AdminLayout from '@/components/AdminLayout'
import toast from 'react-hot-toast'
import {
  Download, Video, Search, RefreshCw, Calendar, Clock, User, BookOpen,
  PlayCircle, FileVideo, Cloud, HardDrive, Trash2, Link2, X, Check,
  ChevronDown, Loader2, AlertTriangle
} from 'lucide-react'
import { format } from 'date-fns'

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://api.trulearnix.com').replace(/\/api$/, '')

const TYPE_TABS = [
  { key: 'all', label: 'All' },
  { key: 'class', label: 'Classes' },
  { key: 'webinar', label: 'Webinars' },
  { key: 'workshop', label: 'Workshops' },
]

// ── Link to Lesson Modal ─────────────────────────────────────────────────────
function LinkLessonModal({ rec, onClose }: { rec: any; onClose: () => void }) {
  const [courseId, setCourseId] = useState(rec.course?._id || rec.course || '')
  const [moduleIdx, setModuleIdx] = useState('')
  const [lessonId, setLessonId] = useState('')
  const [ytUrl, setYtUrl] = useState('')
  const qc = useQueryClient()

  const { data: courseData, isLoading: courseLoading } = useQuery({
    queryKey: ['admin-course', courseId],
    queryFn: () => adminAPI.getCourse(courseId).then(r => r.data),
    enabled: !!courseId,
  })
  const { data: coursesData } = useQuery({
    queryKey: ['admin-all-courses-sm'],
    queryFn: () => adminAPI.allCourses({ limit: 200 }).then(r => r.data),
  })
  const courses = coursesData?.courses || []
  const modules: any[] = courseData?.course?.modules || []
  const lessons: any[] = moduleIdx !== '' ? (modules[Number(moduleIdx)]?.lessons || []) : []

  const saveMutation = useMutation({
    mutationFn: () => adminAPI.updateLessonVideoUrl(courseId, lessonId, ytUrl),
    onSuccess: () => {
      toast.success('YouTube link lesson mein add ho gaya!')
      qc.invalidateQueries({ queryKey: ['admin-course', courseId] })
      onClose()
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to save'),
  })

  const canSave = courseId && lessonId && ytUrl.trim()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <Link2 className="w-5 h-5 text-violet-400" />
            <h2 className="text-white font-bold">Recording ka YouTube Link add karo</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Recording info */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/8 text-xs text-gray-400">
            <p className="text-white font-semibold text-sm mb-0.5">{rec.title}</p>
            {rec.course?.title && <p className="text-violet-400">{rec.course.title}</p>}
            {rec.batch && <p>Batch #{rec.batch.batchNumber}{rec.batch.label ? ` — ${rec.batch.label}` : ''}</p>}
          </div>

          {/* YouTube URL */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">YouTube Video URL <span className="text-red-400">*</span></label>
            <input
              value={ytUrl}
              onChange={e => setYtUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="input w-full text-sm"
            />
            <p className="text-xs text-gray-600 mt-1">Recording download karke YouTube pe upload karo, phir woh URL yahan daalo</p>
          </div>

          {/* Course selector (if not pre-filled) */}
          {!rec.course?._id && (
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Course <span className="text-red-400">*</span></label>
              <select value={courseId} onChange={e => { setCourseId(e.target.value); setModuleIdx(''); setLessonId('') }}
                className="input w-full text-sm">
                <option value="">Course select karo</option>
                {courses.map((c: any) => <option key={c._id} value={c._id}>{c.title}</option>)}
              </select>
            </div>
          )}

          {/* Module selector */}
          {courseId && (
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Module <span className="text-red-400">*</span></label>
              {courseLoading ? (
                <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading...
                </div>
              ) : (
                <select value={moduleIdx} onChange={e => { setModuleIdx(e.target.value); setLessonId('') }}
                  className="input w-full text-sm">
                  <option value="">Module select karo</option>
                  {modules.map((m: any, i: number) => (
                    <option key={i} value={i}>{m.title || `Module ${i + 1}`}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Lesson selector */}
          {moduleIdx !== '' && (
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Lesson <span className="text-red-400">*</span></label>
              <select value={lessonId} onChange={e => setLessonId(e.target.value)} className="input w-full text-sm">
                <option value="">Lesson select karo</option>
                {lessons.map((l: any) => (
                  <option key={l._id} value={l._id}>{l.title || `Lesson`}</option>
                ))}
              </select>
            </div>
          )}

          {canSave && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300">
              <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              Selected lesson ka videoUrl is YouTube link se update ho jayega — student directly wahan se dekh sakenge.
            </div>
          )}
        </div>

        <div className="flex gap-2 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm">
            Cancel
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={!canSave || saveMutation.isPending}
            className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2">
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Save Link
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
function DeleteModal({ rec, onClose }: { rec: any; onClose: () => void }) {
  const qc = useQueryClient()
  const deleteMutation = useMutation({
    mutationFn: () => adminAPI.deleteRecording(rec._id),
    onSuccess: () => {
      toast.success('Recording R2 se delete ho gayi!')
      qc.invalidateQueries({ queryKey: ['admin-recordings'] })
      onClose()
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Delete failed'),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h2 className="text-white font-bold">Recording Delete karo?</h2>
            <p className="text-gray-400 text-xs mt-0.5">Cloudflare R2 se permanently delete ho jayegi</p>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
          <p className="font-semibold">{rec.title}</p>
          {rec.course?.title && <p className="text-red-400/70 mt-0.5">{rec.course.title}</p>}
          <p className="mt-1.5 text-red-400/70">Pehle YouTube link lesson mein add karo, phir hi delete karo!</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm">
            Cancel
          </button>
          <button onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2">
            {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete from R2
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function RecordingsPage() {
  const [search, setSearch] = useState('')
  const [typeTab, setTypeTab] = useState('all')
  const [linkRec, setLinkRec] = useState<any>(null)
  const [deleteRec, setDeleteRec] = useState<any>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-recordings'],
    queryFn: () => adminAPI.getRecordings({ limit: 200 }).then(r => r.data),
  })

  const recordings: any[] = (data?.recordings || []).filter((r: any) => {
    const matchSearch = !search ||
      r.title?.toLowerCase().includes(search.toLowerCase()) ||
      r.mentor?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.course?.title?.toLowerCase().includes(search.toLowerCase())
    const matchType =
      typeTab === 'all' ? true :
      typeTab === 'class' ? r._recordingType === 'class' :
      typeTab === 'webinar' ? (r._recordingType === 'webinar' && r.type !== 'workshop') :
      typeTab === 'workshop' ? (r._recordingType === 'webinar' && r.type === 'workshop') :
      true
    return matchSearch && matchType
  })

  const totalSize = recordings.reduce((s, r) => s + (r.recordingSize || 0), 0)
  const r2Count = recordings.filter(r => r.recordingUrl?.startsWith('http')).length

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <PlayCircle className="w-7 h-7 text-violet-400" />
              Recordings
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {recordings.length} recording{recordings.length !== 1 ? 's' : ''}
              {totalSize > 0 && ` · ${(totalSize / (1024 * 1024 * 1024)).toFixed(2)} GB`}
              {r2Count > 0 && <span className="text-emerald-400 ml-2">· {r2Count} on R2 Cloud</span>}
            </p>
          </div>
          <button onClick={() => refetch()} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Workflow hint */}
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-sm">
          <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-violet-500 text-white flex items-center justify-center text-xs font-bold">!</div>
          <div className="text-violet-200 space-y-1 text-xs">
            <p className="font-semibold text-violet-100">Workflow: Download → YouTube Upload → Link → Delete</p>
            <p>1. Recording <b>Download</b> karo &nbsp;→&nbsp; 2. YouTube pe upload karo &nbsp;→&nbsp; 3. <b>"Add to Lesson"</b> se YouTube link lesson mein daalo &nbsp;→&nbsp; 4. <b>"Delete"</b> se R2 space free karo</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by class, mentor, course..."
              className="w-full bg-slate-800 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-gray-500 outline-none focus:border-violet-500 transition-colors" />
          </div>
          <div className="flex gap-1 bg-slate-800/60 border border-white/10 rounded-xl p-1">
            {TYPE_TABS.map(t => (
              <button key={t.key} onClick={() => setTypeTab(t.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${typeTab === t.key ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                {t.label}
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
          ) : recordings.length === 0 ? (
            <div className="text-center py-20">
              <FileVideo className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No recordings yet</p>
              <p className="text-gray-600 text-sm mt-1">Recordings will appear here after live classes end</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-slate-700/30">
                    <th className="text-left px-5 py-4 text-gray-400 font-medium text-xs uppercase tracking-wide">Title / Course</th>
                    <th className="text-left px-5 py-4 text-gray-400 font-medium text-xs uppercase tracking-wide hidden md:table-cell">Mentor</th>
                    <th className="text-left px-5 py-4 text-gray-400 font-medium text-xs uppercase tracking-wide hidden lg:table-cell">Date</th>
                    <th className="text-left px-5 py-4 text-gray-400 font-medium text-xs uppercase tracking-wide">Size</th>
                    <th className="text-left px-5 py-4 text-gray-400 font-medium text-xs uppercase tracking-wide">Storage</th>
                    <th className="text-left px-5 py-4 text-gray-400 font-medium text-xs uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recordings.map((rec: any) => {
                    const isR2 = rec.recordingUrl?.startsWith('http')
                    const fileUrl = isR2 ? rec.recordingUrl : `${API_BASE}${rec.recordingUrl}`
                    const sizeMB = rec.recordingSize ? (rec.recordingSize / (1024 * 1024)).toFixed(1) : null
                    const recType = rec._recordingType === 'webinar'
                      ? (rec.type === 'workshop' ? 'workshop' : 'webinar')
                      : 'class'

                    return (
                      <tr key={rec._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              recType === 'workshop' ? 'bg-orange-500/20' :
                              recType === 'webinar' ? 'bg-amber-500/20' : 'bg-violet-500/20'
                            }`}>
                              <Video className={`w-5 h-5 ${
                                recType === 'workshop' ? 'text-orange-400' :
                                recType === 'webinar' ? 'text-amber-400' : 'text-violet-400'
                              }`} />
                            </div>
                            <div>
                              <p className="text-white font-semibold text-sm leading-tight max-w-[200px] truncate">{rec.title}</p>
                              {rec.course?.title ? (
                                <p className="text-violet-400/70 text-xs mt-0.5 flex items-center gap-1 truncate max-w-[200px]">
                                  <BookOpen className="w-3 h-3 flex-shrink-0" /> {rec.course.title}
                                  {rec.batch && <span className="ml-1 text-gray-500">· Batch #{rec.batch.batchNumber}</span>}
                                </p>
                              ) : (
                                <span className={`text-xs px-1.5 py-0.5 rounded ${
                                  recType === 'workshop' ? 'bg-orange-500/20 text-orange-400' :
                                  recType === 'webinar' ? 'bg-amber-500/20 text-amber-400' :
                                  'bg-violet-500/20 text-violet-400'
                                } font-medium`}>{recType}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {rec.mentor?.avatar
                                ? <img src={rec.mentor.avatar} className="w-full h-full object-cover" alt="" />
                                : <User className="w-3.5 h-3.5 text-gray-400" />}
                            </div>
                            <span className="text-gray-300 text-xs">{rec.mentor?.name || '—'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 hidden lg:table-cell">
                          <p className="text-gray-300 text-xs flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-500" />
                            {rec.endedAt ? format(new Date(rec.endedAt), 'dd MMM yyyy') : '—'}
                          </p>
                          <p className="text-gray-500 text-[11px] mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {rec.endedAt ? format(new Date(rec.endedAt), 'hh:mm a') : ''}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          {sizeMB ? <span className="text-gray-400 text-xs">{sizeMB} MB</span> : <span className="text-gray-600 text-xs">—</span>}
                        </td>
                        <td className="px-5 py-4">
                          {isR2 ? (
                            <span className="flex items-center gap-1 text-xs text-emerald-400"><Cloud className="w-3.5 h-3.5" /> R2 Cloud</span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-gray-500"><HardDrive className="w-3.5 h-3.5" /> Local</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Watch */}
                            <a href={fileUrl} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors">
                              <PlayCircle className="w-3.5 h-3.5" /> Watch
                            </a>
                            {/* Download */}
                            <a href={fileUrl} download
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 transition-colors">
                              <Download className="w-3.5 h-3.5" /> Download
                            </a>
                            {/* Add to Lesson (only for class recordings with a course) */}
                            {rec._recordingType === 'class' && (
                              <button onClick={() => setLinkRec(rec)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors">
                                <Link2 className="w-3.5 h-3.5" /> Add to Lesson
                              </button>
                            )}
                            {/* Delete from R2 */}
                            <button onClick={() => setDeleteRec(rec)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {linkRec && <LinkLessonModal rec={linkRec} onClose={() => setLinkRec(null)} />}
      {deleteRec && <DeleteModal rec={deleteRec} onClose={() => setDeleteRec(null)} />}
    </AdminLayout>
  )
}
