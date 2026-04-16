'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminAPI } from '@/lib/api'
import AdminLayout from '@/components/AdminLayout'
import {
  Megaphone, Plus, X, Trash2, Edit3, Pin, Bell, BookOpen, Users,
  Calendar, Eye, EyeOff, ChevronDown, ChevronUp, Send
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

const TARGET_LABELS: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  all:    { label: 'All Students',  color: 'text-violet-400', bg: 'bg-violet-500/15', icon: Bell },
  course: { label: 'Course',        color: 'text-green-400',  bg: 'bg-green-500/15',  icon: BookOpen },
  batch:  { label: 'Batch',         color: 'text-blue-400',   bg: 'bg-blue-500/15',   icon: Users },
}

const EMPTY_FORM = {
  title: '', content: '', image: '', link: '', linkText: 'Learn More',
  priority: 0, targetType: 'all', targetCourse: '', targetBatch: '',
  pinned: false, isActive: true,
}

function AnnouncementRow({ a, onDelete, onToggle, onPin }: any) {
  const [expanded, setExpanded] = useState(false)
  const target = TARGET_LABELS[a.targetType] || TARGET_LABELS.all
  const TargetIcon = target.icon

  return (
    <div className="rounded-2xl overflow-hidden transition-all" style={{ background: 'rgba(15,15,25,0.9)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center gap-4 px-5 py-4">
        {/* Icon */}
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: a.pinned ? 'rgba(251,191,36,0.15)' : 'rgba(139,92,246,0.15)', border: `1px solid ${a.pinned ? 'rgba(251,191,36,0.25)' : 'rgba(139,92,246,0.25)'}` }}>
          <Megaphone className={`w-4 h-4 ${a.pinned ? 'text-amber-400' : 'text-violet-400'}`} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`font-bold text-sm ${a.isActive ? 'text-white' : 'text-gray-500 line-through'}`}>{a.title}</p>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${target.color} ${target.bg}`}>
              <TargetIcon className="w-2.5 h-2.5" />
              {a.targetType === 'course' && a.targetCourse?.title ? a.targetCourse.title : a.targetType === 'batch' && a.targetBatch?.name ? a.targetBatch.name : target.label}
            </span>
            {a.pinned && <span className="text-[10px] font-black text-amber-400 flex items-center gap-0.5"><Pin className="w-2.5 h-2.5" /> Pinned</span>}
            {a.priority > 5 && <span className="text-[10px] font-black text-red-400">IMPORTANT</span>}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[11px] text-gray-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {a.createdAt ? formatDistanceToNow(new Date(a.createdAt), { addSuffix: true }) : ''}
            </span>
            {a.postedBy && <span className="text-[11px] text-gray-600">by {a.postedBy.name}</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => onPin(a._id, !a.pinned)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${a.pinned ? 'text-amber-400 bg-amber-500/10' : 'text-gray-600 hover:text-amber-400 hover:bg-amber-500/10'}`}>
            <Pin className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onToggle(a._id, !a.isActive)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${a.isActive ? 'text-green-400 hover:bg-green-500/10' : 'text-gray-600 hover:text-green-400 hover:bg-green-500/10'}`}>
            {a.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => setExpanded(v => !v)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:text-white hover:bg-white/5 transition-colors">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => onDelete(a._id)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/5 px-5 pb-4">
          <p className="text-gray-400 text-sm leading-relaxed pt-3 whitespace-pre-line">{a.content}</p>
          {a.link && (
            <a href={a.link} target="_blank" rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-violet-400 hover:underline">
              {a.linkText || 'Link'} →
            </a>
          )}
        </div>
      )}
    </div>
  )
}

export default function AdminAnnouncementsPage() {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<any>({ ...EMPTY_FORM })
  const [targetFilter, setTargetFilter] = useState('all_types')
  const qc = useQueryClient()

  const { data: announcementsData, isLoading } = useQuery({
    queryKey: ['admin-announcements', targetFilter],
    queryFn: () => adminAPI.announcements({ targetType: targetFilter !== 'all_types' ? targetFilter : undefined }).then(r => r.data),
  })

  const { data: coursesData } = useQuery({
    queryKey: ['admin-courses-list'],
    queryFn: () => adminAPI.allCourses({ limit: 100 }).then(r => r.data),
    enabled: form.targetType === 'course',
  })

  const { data: batchesData } = useQuery({
    queryKey: ['admin-batches-list'],
    queryFn: () => adminAPI.batches('').then(r => r.data),
    enabled: form.targetType === 'batch',
  })

  const createMut = useMutation({
    mutationFn: (data: any) => adminAPI.createAnnouncement(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-announcements'] })
      setShowForm(false)
      setForm({ ...EMPTY_FORM })
      toast.success('Announcement published!')
    },
    onError: () => toast.error('Failed to publish'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminAPI.deleteAnnouncement(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-announcements'] }); toast.success('Deleted') },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminAPI.updateAnnouncement(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-announcements'] }),
  })

  const announcements: any[] = announcementsData?.announcements || []
  const courses: any[] = coursesData?.courses || []
  const batches: any[] = batchesData?.batches || []

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* ── Page Header ── */}
        <div className="page-header">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-700 flex items-center justify-center shadow-lg">
                  <Megaphone className="w-5 h-5 text-white" />
                </div>
                Announcements
              </h1>
              <p className="text-gray-400 text-sm mt-1">Course-wise, batch-wise, or platform-wide announcements</p>
            </div>
            <button onClick={() => setShowForm(v => !v)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Announcement
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {(['all', 'course', 'batch'] as const).map(t => {
            const count = announcements.filter(a => a.targetType === t).length
            const cfg = TARGET_LABELS[t]
            const Ic = cfg.icon
            return (
              <div key={t} className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'rgba(15,15,25,0.85)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <Ic className={`w-6 h-6 ${cfg.color} flex-shrink-0`} />
                <div>
                  <p className={`text-xl font-black ${cfg.color}`}>{count}</p>
                  <p className="text-xs text-gray-500">{cfg.label}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="rounded-2xl p-6" style={{ background: 'rgba(15,15,25,0.95)', border: '1px solid rgba(124,58,237,0.35)', boxShadow: '0 0 40px rgba(124,58,237,0.1)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-white flex items-center gap-2"><Send className="w-4 h-4 text-violet-400" /> Publish Announcement</h2>
              <button onClick={() => setShowForm(false)} className="w-7 h-7 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs text-gray-400 font-semibold mb-1.5 block">Title *</label>
                <input value={form.title} onChange={e => setForm((f: any) => ({ ...f, title: e.target.value }))}
                  placeholder="Announcement title"
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-violet-500 transition-colors" />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs text-gray-400 font-semibold mb-1.5 block">Content *</label>
                <textarea value={form.content} onChange={e => setForm((f: any) => ({ ...f, content: e.target.value }))}
                  placeholder="Announcement content..."
                  rows={4}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-violet-500 transition-colors resize-none" />
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold mb-1.5 block">Target Audience</label>
                <select value={form.targetType} onChange={e => setForm((f: any) => ({ ...f, targetType: e.target.value, targetCourse: '', targetBatch: '' }))}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500 transition-colors">
                  <option value="all">All Students</option>
                  <option value="course">Specific Course</option>
                  <option value="batch">Specific Batch</option>
                </select>
              </div>

              {form.targetType === 'course' && (
                <div>
                  <label className="text-xs text-gray-400 font-semibold mb-1.5 block">Select Course</label>
                  <select value={form.targetCourse} onChange={e => setForm((f: any) => ({ ...f, targetCourse: e.target.value }))}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500 transition-colors">
                    <option value="">-- Select Course --</option>
                    {courses.map((c: any) => <option key={c._id} value={c._id}>{c.title}</option>)}
                  </select>
                </div>
              )}

              {form.targetType === 'batch' && (
                <div>
                  <label className="text-xs text-gray-400 font-semibold mb-1.5 block">Select Batch</label>
                  <select value={form.targetBatch} onChange={e => setForm((f: any) => ({ ...f, targetBatch: e.target.value }))}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500 transition-colors">
                    <option value="">-- Select Batch --</option>
                    {batches.map((b: any) => <option key={b._id} value={b._id}>{b.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs text-gray-400 font-semibold mb-1.5 block">Priority (0–10)</label>
                <input type="number" min={0} max={10} value={form.priority}
                  onChange={e => setForm((f: any) => ({ ...f, priority: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500 transition-colors" />
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold mb-1.5 block">CTA Link (optional)</label>
                <input value={form.link} onChange={e => setForm((f: any) => ({ ...f, link: e.target.value }))}
                  placeholder="https://..."
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-violet-500 transition-colors" />
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold mb-1.5 block">CTA Button Text</label>
                <input value={form.linkText} onChange={e => setForm((f: any) => ({ ...f, linkText: e.target.value }))}
                  placeholder="Learn More"
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-violet-500 transition-colors" />
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold mb-1.5 block">Image URL (optional)</label>
                <input value={form.image} onChange={e => setForm((f: any) => ({ ...f, image: e.target.value }))}
                  placeholder="https://..."
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-violet-500 transition-colors" />
              </div>
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-6 mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.pinned} onChange={e => setForm((f: any) => ({ ...f, pinned: e.target.checked }))}
                  className="w-4 h-4 accent-amber-500" />
                <span className="text-sm text-gray-300 flex items-center gap-1"><Pin className="w-3.5 h-3.5 text-amber-400" /> Pin to top</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm((f: any) => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 accent-violet-500" />
                <span className="text-sm text-gray-300">Active (visible to students)</span>
              </label>
            </div>

            <button
              onClick={() => createMut.mutate(form)}
              disabled={!form.title.trim() || !form.content.trim() || createMut.isPending}
              className="mt-5 px-6 py-3 rounded-xl text-sm font-bold text-white flex items-center gap-2 transition-all disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
              <Send className="w-4 h-4" />
              {createMut.isPending ? 'Publishing...' : 'Publish Announcement'}
            </button>
          </div>
        )}

        {/* Filter */}
        <div className="flex bg-slate-800 rounded-xl p-1 border border-white/5 w-fit">
          {[
            { v: 'all_types', label: 'All' },
            { v: 'all', label: 'All Students' },
            { v: 'course', label: 'Course' },
            { v: 'batch', label: 'Batch' },
          ].map(f => (
            <button key={f.v} onClick={() => setTargetFilter(f.v)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${targetFilter === f.v ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20' : 'text-gray-400 hover:text-white'}`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-16 rounded-2xl" style={{ background: 'rgba(15,15,25,0.85)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-20 text-violet-400" />
            <p className="text-gray-400 font-semibold">No announcements yet</p>
            <p className="text-gray-600 text-sm mt-1">Create one to notify your students</p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((a: any) => (
              <AnnouncementRow
                key={a._id}
                a={a}
                onDelete={(id: string) => { if (confirm('Delete this announcement?')) deleteMut.mutate(id) }}
                onToggle={(id: string, isActive: boolean) => updateMut.mutate({ id, data: { isActive } })}
                onPin={(id: string, pinned: boolean) => updateMut.mutate({ id, data: { pinned } })}
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
