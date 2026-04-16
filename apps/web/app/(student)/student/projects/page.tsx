'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import toast from 'react-hot-toast'
import { Plus, X, Github, Globe, Heart, Code2, Search, Loader2, Trash2 } from 'lucide-react'

const CATEGORIES = ['All', 'Web', 'Mobile', 'AI/ML', 'Data Science', 'Blockchain', 'DevOps', 'General']
const empty = { title: '', description: '', techStack: '', liveUrl: '', repoUrl: '', thumbnail: '', category: 'Web' }

export default function ProjectsPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<any>(empty)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [tab, setTab] = useState<'all' | 'mine'>('all')

  const { data: allProjects = [], isLoading } = useQuery({
    queryKey: ['projects', category, search, tab],
    queryFn: () => {
      const params: any = {}
      if (category !== 'All') params.category = category
      if (search) params.search = search
      if (tab === 'mine') params.userId = (user as any)?._id
      return projectAPI.all(params).then(r => r.data.data)
    },
  })

  const createMut = useMutation({
    mutationFn: (data: any) => projectAPI.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); toast.success('Project published!'); setShowForm(false); setForm(empty) },
    onError: () => toast.error('Failed to publish'),
  })

  const likeMut = useMutation({
    mutationFn: (id: string) => projectAPI.like(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => projectAPI.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); toast.success('Deleted') },
    onError: () => toast.error('Failed'),
  })

  const submit = () => {
    if (!form.title || !form.description) return toast.error('Title and description required')
    const payload = { ...form, techStack: form.techStack.split(',').map((s: string) => s.trim()).filter(Boolean) }
    createMut.mutate(payload)
  }

  const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }
  const labelCls = 'block text-xs text-gray-400 mb-1.5 font-medium'

  return (
    <div className="space-y-5 max-w-6xl pb-8">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Code2 className="w-6 h-6 text-violet-400" /> Project Showcase
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Share your work with the community</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', boxShadow: '0 4px 20px rgba(124,58,237,0.35)' }}>
          <Plus className="w-4 h-4" /> Add Project
        </button>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {(['all', 'mine'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-5 py-2 rounded-xl text-sm font-bold transition-all"
              style={tab === t
                ? { background: 'rgba(124,58,237,0.25)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.4)' }
                : { color: '#6b7280' }}>
              {t === 'all' ? 'All Projects' : 'My Projects'}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..."
            className="w-full rounded-2xl pl-10 pr-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none"
            style={inputStyle} />
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            style={category === c
              ? { background: 'rgba(124,58,237,0.2)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.4)' }
              : { background: 'rgba(255,255,255,0.04)', color: '#6b7280', border: '1px solid rgba(255,255,255,0.06)' }}>
            {c}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-9 h-9 animate-spin text-violet-400" />
          <p className="text-gray-500 text-sm">Loading projects…</p>
        </div>
      ) : (allProjects as any[]).length === 0 ? (
        <div className="rounded-3xl py-20 text-center" style={{ background: 'rgba(13,13,20,0.95)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <Code2 className="w-7 h-7 text-gray-600" />
          </div>
          <p className="text-white font-bold">No projects yet</p>
          <p className="text-gray-500 text-sm mt-1">Be the first to showcase your work!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(allProjects as any[]).map((p: any) => {
            const isOwner = (user as any)?._id === p.owner?._id
            const isLiked = p.likes?.includes((user as any)?._id)
            return (
              <div key={p._id} className="rounded-2xl overflow-hidden group transition-all hover:scale-[1.02]"
                style={{ background: 'rgba(13,13,20,0.95)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {/* Thumbnail */}
                {p.thumbnail ? (
                  <img src={p.thumbnail} alt={p.title} className="w-full h-36 object-cover" />
                ) : (
                  <div className="w-full h-36 flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.12),rgba(79,70,229,0.08))' }}>
                    <Code2 className="w-10 h-10 text-violet-500/40" />
                  </div>
                )}

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="font-bold text-white text-sm leading-snug">{p.title}</h3>
                    {isOwner && (
                      <button onClick={() => deleteMut.mutate(p._id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg text-gray-600 hover:text-red-400"
                        style={{ background: 'rgba(239,68,68,0.08)' }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 mb-3">{p.description}</p>

                  {p.techStack?.length > 0 && (
                    <div className="flex gap-1 flex-wrap mb-3">
                      {p.techStack.map((t: string) => (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded-lg font-medium"
                          style={{ color: '#a78bfa', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)' }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white"
                        style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                        {p.owner?.name?.[0]}
                      </div>
                      <span className="text-gray-500 text-xs">{p.owner?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.repoUrl && (
                        <a href={p.repoUrl} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-lg transition-colors text-gray-500 hover:text-white"
                          style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <Github className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {p.liveUrl && (
                        <a href={p.liveUrl} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-lg transition-colors text-gray-500 hover:text-green-400"
                          style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <Globe className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button onClick={() => likeMut.mutate(p._id)}
                        className="flex items-center gap-1 p-1.5 rounded-lg transition-colors"
                        style={{ background: isLiked ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.06)' }}>
                        <Heart className={`w-3.5 h-3.5 ${isLiked ? 'text-red-400' : 'text-gray-500'}`} fill={isLiked ? 'currentColor' : 'none'} />
                        <span className="text-xs text-gray-500">{p.likes?.length || 0}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Project Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowForm(false)}>
          <div className="w-full max-w-lg rounded-3xl p-6 my-4 space-y-4"
            style={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-black text-white flex items-center gap-2"><Code2 className="w-5 h-5 text-violet-400" /> Add Project</h2>
              <button onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-500 hover:text-white"
                style={{ background: 'rgba(255,255,255,0.06)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {[
              { label: 'Project Title *', key: 'title', placeholder: 'e.g. AI Resume Builder' },
              { label: 'Tech Stack (comma-separated)', key: 'techStack', placeholder: 'React, Node.js, MongoDB' },
              { label: 'Live URL', key: 'liveUrl', placeholder: 'https://myproject.com' },
              { label: 'GitHub Repo', key: 'repoUrl', placeholder: 'https://github.com/...' },
              { label: 'Thumbnail URL', key: 'thumbnail', placeholder: 'https://...' },
            ].map(f => (
              <div key={f.key}>
                <label className={labelCls}>{f.label}</label>
                <input value={form[f.key]} onChange={e => setForm((p: any) => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none"
                  style={inputStyle} />
              </div>
            ))}

            <div>
              <label className={labelCls}>Description *</label>
              <textarea value={form.description} onChange={e => setForm((p: any) => ({ ...p, description: e.target.value }))}
                placeholder="What does your project do?" rows={3}
                className="w-full rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none resize-none"
                style={inputStyle} />
            </div>

            <div>
              <label className={labelCls}>Category</label>
              <select value={form.category} onChange={e => setForm((p: any) => ({ ...p, category: e.target.value }))}
                className="w-full rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                style={inputStyle}>
                {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-gray-400"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                Cancel
              </button>
              <button onClick={submit} disabled={createMut.isPending}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                {createMut.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Publishing…</> : 'Publish Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
