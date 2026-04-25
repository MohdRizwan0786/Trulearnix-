'use client'
import { useState, useEffect, useRef } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { adminAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import {
  GraduationCap, Plus, Pencil, Trash2, Video, FileText,
  BookOpen, Zap, Eye, EyeOff, X, Loader2, ChevronUp,
  ChevronDown, Tag, Clock, Save, Globe, Lock, Upload,
  CheckCircle2, Film, AlertCircle, UploadCloud
} from 'lucide-react'

const TYPE_CFG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  video:    { label: 'Video',    icon: Video,    color: 'text-blue-400',   bg: 'bg-blue-500/15 border-blue-500/30'   },
  pdf:      { label: 'PDF',      icon: FileText, color: 'text-red-400',    bg: 'bg-red-500/15 border-red-500/30'     },
  resource: { label: 'Resource', icon: BookOpen, color: 'text-green-400',  bg: 'bg-green-500/15 border-green-500/30' },
  live:     { label: 'Live',     icon: Zap,      color: 'text-amber-400',  bg: 'bg-amber-500/15 border-amber-500/30' },
  quiz:     { label: 'Quiz',     icon: Tag,      color: 'text-purple-400', bg: 'bg-purple-500/15 border-purple-500/30'},
}

const EMPTY = {
  title: '', description: '', videoUrl: '', thumbnailUrl: '',
  type: 'video', duration: '', order: 0, day: undefined as number | undefined,
  isPublished: false, tags: '', resources: ''
}

function VideoUploader({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [fileName, setFileName] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const doUpload = async (file: File) => {
    if (!file) return
    const allowed = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
    if (!allowed.includes(file.type)) {
      toast.error('Only MP4, WebM, MOV, AVI allowed')
      return
    }
    if (file.size > 500 * 1024 * 1024) {
      toast.error('File too large (max 500 MB)')
      return
    }
    setFileName(file.name)
    setUploading(true)
    setProgress(0)
    try {
      const fd = new FormData()
      fd.append('video', file)
      // Use XMLHttpRequest for progress tracking
      const token = localStorage.getItem('adminToken')
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.trulearnix.com/api'
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', `${apiBase}/upload/video`)
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100))
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const res = JSON.parse(xhr.responseText)
            if (res.success && res.url) {
              onChange(res.url)
              toast.success('Video uploaded!')
              resolve()
            } else {
              reject(new Error(res.message || 'Upload failed'))
            }
          } else {
            reject(new Error('Upload failed'))
          }
        }
        xhr.onerror = () => reject(new Error('Network error'))
        xhr.send(fd)
      })
    } catch (e: any) {
      toast.error(e.message || 'Upload failed')
      setFileName('')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) doUpload(file)
  }

  const displayName = fileName || (value ? value.split('/').pop() : '')

  return (
    <div className="space-y-2">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all
          ${dragOver ? 'border-violet-500 bg-violet-500/10' : 'border-gray-700 hover:border-violet-500/60 hover:bg-gray-800/50'}
          ${uploading ? 'pointer-events-none' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) doUpload(f); e.target.value = '' }}
        />

        {uploading ? (
          <div className="space-y-3">
            <div className="w-10 h-10 mx-auto rounded-full bg-violet-500/20 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
            </div>
            <p className="text-white text-sm font-medium">Uploading {fileName}...</p>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-violet-600 to-purple-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-gray-400 text-xs">{progress}%</p>
          </div>
        ) : value ? (
          <div className="space-y-2">
            <div className="w-10 h-10 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-green-400 text-sm font-medium">Video uploaded</p>
            <p className="text-gray-500 text-xs truncate max-w-xs mx-auto">{displayName}</p>
            <p className="text-gray-600 text-xs">Click to replace</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="w-10 h-10 mx-auto rounded-full bg-gray-800 flex items-center justify-center">
              <UploadCloud className="w-5 h-5 text-gray-500" />
            </div>
            <p className="text-white text-sm font-medium">Click or drag video here</p>
            <p className="text-gray-500 text-xs">MP4, WebM, MOV, AVI · Max 500 MB</p>
          </div>
        )}
      </div>

      {/* Show current URL if already uploaded (small, read-only) */}
      {value && !uploading && (
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2 flex items-center gap-2 min-w-0">
            <Film className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            <span className="text-gray-400 text-xs truncate">{value}</span>
          </div>
          <button
            type="button"
            onClick={() => { onChange(''); setFileName('') }}
            className="w-7 h-7 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500/25 transition-colors flex-shrink-0"
            title="Remove video"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

function ThumbnailUploader({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const doUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Images only'); return }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await adminAPI.uploadImage(fd)
      if (res.data.url) { onChange(res.data.url); toast.success('Thumbnail uploaded!') }
    } catch { toast.error('Upload failed') }
    finally { setUploading(false) }
  }

  return (
    <div className="flex items-center gap-3">
      {value ? (
        <div className="relative w-20 h-12 rounded-lg overflow-hidden border border-gray-700 flex-shrink-0">
          <img src={value} alt="thumb" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-red-600 transition-colors"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          className="w-20 h-12 rounded-lg border-2 border-dashed border-gray-700 hover:border-violet-500/60 flex items-center justify-center cursor-pointer transition-colors flex-shrink-0"
        >
          {uploading ? <Loader2 className="w-4 h-4 text-violet-400 animate-spin" /> : <Upload className="w-4 h-4 text-gray-600" />}
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) doUpload(f); e.target.value = '' }} />
      <div>
        <p className="text-white text-sm">{value ? 'Thumbnail set' : 'Upload thumbnail'}</p>
        <p className="text-gray-500 text-xs">JPG, PNG, WebP · Optional</p>
      </div>
    </div>
  )
}

export default function PartnerTrainingAdminPage() {
  const [modules, setModules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await adminAPI.partnerTraining()
      setModules(res.data.modules || [])
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const openAdd = () => { setEditing(null); setForm({ ...EMPTY }); setShowModal(true) }
  const openEdit = (m: any) => {
    setEditing(m)
    setForm({
      title: m.title, description: m.description || '', videoUrl: m.videoUrl || '',
      thumbnailUrl: m.thumbnailUrl || '', type: m.type || 'video', duration: m.duration || '',
      order: m.order || 0, day: m.day, isPublished: m.isPublished || false,
      tags: (m.tags || []).join(', '),
      resources: (m.resources || []).map((r: any) => `${r.label}::${r.url}`).join('\n'),
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error('Title is required')
    setSaving(true)
    try {
      const payload = {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        resources: form.resources.split('\n').map(r => {
          const [label, ...rest] = r.split('::')
          return { label: label.trim(), url: rest.join('::').trim() }
        }).filter(r => r.label && r.url),
      }
      if (editing) {
        await adminAPI.updateTrainingModule(editing._id, payload)
        toast.success('Module updated!')
      } else {
        await adminAPI.createTrainingModule(payload)
        toast.success('Module created!')
      }
      setShowModal(false)
      load()
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this module?')) return
    setDeleting(id)
    try { await adminAPI.deleteTrainingModule(id); toast.success('Deleted'); load() }
    catch { toast.error('Failed') }
    finally { setDeleting(null) }
  }

  const togglePublish = async (m: any) => {
    setToggling(m._id)
    try {
      await adminAPI.updateTrainingModule(m._id, { isPublished: !m.isPublished })
      toast.success(m.isPublished ? 'Unpublished' : 'Published!')
      load()
    } catch { toast.error('Failed') }
    finally { setToggling(null) }
  }

  const moveOrder = async (m: any, dir: -1 | 1) => {
    const idx = modules.findIndex(x => x._id === m._id)
    const swap = modules[idx + dir]
    if (!swap) return
    await Promise.all([
      adminAPI.updateTrainingModule(m._id, { order: swap.order }),
      adminAPI.updateTrainingModule(swap._id, { order: m.order }),
    ])
    load()
  }

  const publishedCount = modules.filter(m => m.isPublished).length

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* ── Page Header ── */}
        <div className="page-header">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-700 flex items-center justify-center shadow-lg">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                Partner Training
              </h1>
              <p className="text-gray-400 text-sm mt-1">{publishedCount} published · {modules.length - publishedCount} draft</p>
            </div>
            <button onClick={openAdd} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Module
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Modules',  value: modules.length,        color: 'text-white'        },
            { label: 'Published',      value: publishedCount,         color: 'text-green-400'    },
            { label: 'Drafts',         value: modules.length - publishedCount, color: 'text-amber-400' },
            { label: 'Video',          value: modules.filter(m => m.type === 'video').length, color: 'text-blue-400' },
          ].map(s => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-900 rounded-xl animate-pulse" />)}</div>
        ) : modules.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl py-16 text-center">
            <GraduationCap className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 font-semibold">No training modules yet</p>
            <p className="text-gray-600 text-sm mt-1">Click "Add Module" to create the first one</p>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-800 text-left">
                    <th className="px-4 py-3 text-gray-400 text-xs font-semibold">Order</th>
                    <th className="px-4 py-3 text-gray-400 text-xs font-semibold">Module</th>
                    <th className="px-4 py-3 text-gray-400 text-xs font-semibold">Type</th>
                    <th className="px-4 py-3 text-gray-400 text-xs font-semibold">Duration</th>
                    <th className="px-4 py-3 text-gray-400 text-xs font-semibold">Status</th>
                    <th className="px-4 py-3 text-gray-400 text-xs font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {modules.map((m, i) => {
                    const tc = TYPE_CFG[m.type] || TYPE_CFG.video
                    const Icon = tc.icon
                    return (
                      <tr key={m._id} className="hover:bg-gray-800/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            <button onClick={() => moveOrder(m, -1)} disabled={i === 0} className="w-6 h-5 flex items-center justify-center text-gray-500 hover:text-white disabled:opacity-20 transition-colors">
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-white font-bold text-sm text-center">{m.order || i + 1}</span>
                            <button onClick={() => moveOrder(m, 1)} disabled={i === modules.length - 1} className="w-6 h-5 flex items-center justify-center text-gray-500 hover:text-white disabled:opacity-20 transition-colors">
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {m.thumbnailUrl ? (
                              <img src={m.thumbnailUrl} alt="" className="w-12 h-8 rounded-lg object-cover border border-gray-700 flex-shrink-0" />
                            ) : m.videoUrl ? (
                              <div className="w-12 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                                <Film className="w-4 h-4 text-blue-400" />
                              </div>
                            ) : null}
                            <div>
                              <p className="text-white font-semibold text-sm">{m.day ? `Day ${m.day}: ` : ''}{m.title}</p>
                              <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{m.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border ${tc.bg}`}>
                            <Icon className={`w-3 h-3 ${tc.color}`} />{tc.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-400 text-sm">{m.duration || '—'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => togglePublish(m)} disabled={toggling === m._id}
                            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-all ${m.isPublished ? 'bg-green-500/15 border-green-500/30 text-green-400' : 'bg-gray-700 border-gray-600 text-gray-400'}`}>
                            {toggling === m._id ? <Loader2 className="w-3 h-3 animate-spin" /> : m.isPublished ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                            {m.isPublished ? 'Published' : 'Draft'}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => openEdit(m)} className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 hover:bg-violet-500/25 transition-colors">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDelete(m._id)} disabled={deleting === m._id} className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500/25 transition-colors disabled:opacity-40">
                              {deleting === m._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-gray-900 px-5 py-4 border-b border-gray-800 flex items-center justify-between z-10">
              <h3 className="text-white font-bold">{editing ? 'Edit Module' : 'New Training Module'}</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Title */}
              <div>
                <label className="text-gray-400 text-xs font-medium mb-1.5 block">Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Module title"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 text-sm" />
              </div>

              {/* Day + Order */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs font-medium mb-1.5 block">Day # (optional)</label>
                  <input type="number" value={form.day ?? ''} onChange={e => setForm(f => ({ ...f, day: e.target.value ? parseInt(e.target.value) : undefined }))}
                    placeholder="e.g. 1"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 text-sm" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium mb-1.5 block">Display Order</label>
                  <input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 text-sm" />
                </div>
              </div>

              {/* Type + Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs font-medium mb-1.5 block">Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-violet-500 text-sm appearance-none">
                    {Object.entries(TYPE_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium mb-1.5 block">Duration</label>
                  <input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                    placeholder="e.g. 45 min"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 text-sm" />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-gray-400 text-xs font-medium mb-1.5 block">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="What will partners learn in this module?"
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 text-sm resize-none" />
              </div>

              {/* Video Upload */}
              <div>
                <label className="text-gray-400 text-xs font-medium mb-1.5 block">Video File</label>
                <VideoUploader
                  value={form.videoUrl}
                  onChange={url => setForm(f => ({ ...f, videoUrl: url }))}
                />
              </div>

              {/* Thumbnail */}
              <div>
                <label className="text-gray-400 text-xs font-medium mb-1.5 block">Thumbnail</label>
                <ThumbnailUploader
                  value={form.thumbnailUrl}
                  onChange={url => setForm(f => ({ ...f, thumbnailUrl: url }))}
                />
              </div>

              {/* Tags */}
              <div>
                <label className="text-gray-400 text-xs font-medium mb-1.5 block">Tags (comma separated)</label>
                <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  placeholder="e.g. sales, Partnership earning, MLM"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 text-sm" />
              </div>

              {/* Resources */}
              <div>
                <label className="text-gray-400 text-xs font-medium mb-1.5 block">Resources (one per line: Label::URL)</label>
                <textarea value={form.resources} onChange={e => setForm(f => ({ ...f, resources: e.target.value }))}
                  placeholder={"PDF Guide::https://...\nWhatsApp Templates::https://..."}
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 text-sm resize-none font-mono text-xs" />
              </div>

              {/* Publish toggle */}
              <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl border border-gray-700">
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">Publish module</p>
                  <p className="text-gray-500 text-xs">Partners will see this module once published</p>
                </div>
                <button onClick={() => setForm(f => ({ ...f, isPublished: !f.isPublished }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.isPublished ? 'bg-violet-600' : 'bg-gray-700'}`}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.isPublished ? 'left-5.5 translate-x-0.5' : 'left-0.5'}`} />
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all text-sm font-medium">Cancel</button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold hover:opacity-90 transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> {editing ? 'Update' : 'Create'}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
