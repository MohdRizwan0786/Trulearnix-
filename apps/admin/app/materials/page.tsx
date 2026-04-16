'use client'
import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { adminAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import { Plus, X, FileText, Video, File, Link2, Image, Download, Search, Trash2, Globe, Lock, BookOpen, FolderOpen } from 'lucide-react'

const TYPE_ICONS: Record<string, any> = {
  pdf: FileText, video: Video, doc: File, link: Link2, image: Image
}
const TYPE_COLORS: Record<string, string> = {
  pdf: 'text-red-400 bg-red-500/20',
  video: 'text-blue-400 bg-blue-500/20',
  doc: 'text-yellow-400 bg-yellow-500/20',
  link: 'text-green-400 bg-green-500/20',
  image: 'text-purple-400 bg-purple-500/20',
}

const empty = { title: '', description: '', type: 'pdf', url: '', courseId: '', isPublic: false, tags: '' }

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [courseFilter, setCourseFilter] = useState('')
  const [form, setForm] = useState<any>(empty)

  useEffect(() => {
    fetchMaterials()
    adminAPI.allCourses({ limit: 200 }).then(r => setCourses(r.data.courses || [])).catch(() => {})
  }, [typeFilter, courseFilter])

  const fetchMaterials = async () => {
    try {
      const params: any = {}
      if (typeFilter) params.type = typeFilter
      if (courseFilter) params.courseId = courseFilter
      const res = await adminAPI.materials(params)
      setMaterials(res.data.data || [])
    } catch { toast.error('Failed to load materials') }
    finally { setLoading(false) }
  }

  const save = async () => {
    if (!form.title || !form.url) return toast.error('Title and URL required')
    try {
      const payload = {
        ...form,
        tags: form.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
        courseId: form.courseId || undefined,
      }
      await adminAPI.createMaterial(payload)
      toast.success('Material added!')
      setShowForm(false)
      setForm(empty)
      fetchMaterials()
    } catch { toast.error('Failed') }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this material?')) return
    try {
      await adminAPI.deleteMaterial(id)
      setMaterials(p => p.filter(m => m._id !== id))
      toast.success('Deleted')
    } catch { toast.error('Failed') }
  }

  const filtered = materials.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* ── Page Header ── */}
        <div className="page-header">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-700 flex items-center justify-center shadow-lg">
                  <FolderOpen className="w-5 h-5 text-white" />
                </div>
                Study Materials
              </h1>
              <p className="text-gray-400 text-sm mt-1">{materials.length} resources available</p>
            </div>
            <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Material
            </button>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search materials..."
              className="w-full bg-slate-800 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm border border-white/10 outline-none focus:border-violet-500" />
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="bg-slate-800 text-white rounded-xl px-4 py-2.5 text-sm border border-white/10 outline-none">
            <option value="">All Types</option>
            {['pdf', 'video', 'doc', 'link', 'image'].map(t => <option key={t} value={t} className="capitalize">{t.toUpperCase()}</option>)}
          </select>
          <select value={courseFilter} onChange={e => setCourseFilter(e.target.value)}
            className="bg-slate-800 text-white rounded-xl px-4 py-2.5 text-sm border border-white/10 outline-none min-w-40">
            <option value="">All Courses</option>
            {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
          </select>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-lg border border-white/10 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h2 className="text-white font-bold">Add Study Material</h2>
                <button onClick={() => { setShowForm(false); setForm(empty) }}><X className="w-4 h-4 text-gray-400" /></button>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Title *</label>
                <input type="text" value={form.title} onChange={e => setForm((p: any) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Python Basics Notes" className="w-full bg-slate-700 text-white rounded-xl px-4 py-2.5 text-sm border border-white/10 outline-none focus:border-violet-500" />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">URL / Link *</label>
                <input type="url" value={form.url} onChange={e => setForm((p: any) => ({ ...p, url: e.target.value }))}
                  placeholder="https://drive.google.com/..." className="w-full bg-slate-700 text-white rounded-xl px-4 py-2.5 text-sm border border-white/10 outline-none focus:border-violet-500" />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Description</label>
                <textarea value={form.description} onChange={e => setForm((p: any) => ({ ...p, description: e.target.value }))}
                  placeholder="Brief description" rows={2} className="w-full bg-slate-700 text-white rounded-xl px-4 py-2.5 text-sm border border-white/10 outline-none resize-none" />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Link to Course</label>
                <select value={form.courseId} onChange={e => setForm((p: any) => ({ ...p, courseId: e.target.value }))}
                  className="w-full bg-slate-700 text-white rounded-xl px-3 py-2.5 text-sm border border-white/10 outline-none">
                  <option value="">— General / No specific course —</option>
                  {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                </select>
                <p className="text-xs text-gray-500 mt-1">Enrolled students of the selected course will see this material.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Type</label>
                  <select value={form.type} onChange={e => setForm((p: any) => ({ ...p, type: e.target.value }))}
                    className="w-full bg-slate-700 text-white rounded-xl px-3 py-2.5 text-sm border border-white/10 outline-none">
                    {['pdf', 'video', 'doc', 'link', 'image'].map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isPublic} onChange={e => setForm((p: any) => ({ ...p, isPublic: e.target.checked }))}
                      className="w-4 h-4 accent-violet-500" />
                    <span className="text-sm text-gray-300">Public (everyone)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Tags (comma-separated)</label>
                <input value={form.tags} onChange={e => setForm((p: any) => ({ ...p, tags: e.target.value }))}
                  placeholder="python, beginner, notes" className="w-full bg-slate-700 text-white rounded-xl px-4 py-2.5 text-sm border border-white/10 outline-none" />
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={() => { setShowForm(false); setForm(empty) }} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm">Cancel</button>
                <button onClick={save} className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700">Add Material</button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(m => {
              const Icon = TYPE_ICONS[m.type] || File
              return (
                <div key={m._id} className="bg-slate-800 rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-colors group">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${TYPE_COLORS[m.type]}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {m.isPublic ? <Globe className="w-3.5 h-3.5 text-green-400" /> : <Lock className="w-3.5 h-3.5 text-gray-500" />}
                      <button onClick={() => remove(m._id)}><Trash2 className="w-3.5 h-3.5 text-gray-500 hover:text-red-400" /></button>
                    </div>
                  </div>
                  <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2">{m.title}</h3>
                  {m.description && <p className="text-gray-500 text-xs mb-2 line-clamp-2">{m.description}</p>}
                  {m.courseId?.title && (
                    <div className="flex items-center gap-1 text-xs text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-lg mb-2 w-fit">
                      <BookOpen className="w-3 h-3" /> {m.courseId.title}
                    </div>
                  )}
                  {m.tags?.length > 0 && (
                    <div className="flex gap-1 flex-wrap mb-3">
                      {m.tags.map((tag: string) => <span key={tag} className="text-xs bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded">{tag}</span>)}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500 flex items-center gap-1"><Download className="w-3 h-3" />{m.downloadCount} downloads</span>
                    <a href={m.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
                      <Link2 className="w-3 h-3" /> Open
                    </a>
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && <div className="col-span-3 text-center py-16 text-gray-500">No materials found.</div>}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
