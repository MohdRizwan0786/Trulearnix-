'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { freelanceAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import toast from 'react-hot-toast'
import { Briefcase, Search, Plus, X, Clock, DollarSign, Users, CheckCircle, Zap, ExternalLink, Sparkles, Loader2, ChevronDown } from 'lucide-react'
import api from '@/lib/api'

const CATEGORIES = ['All', 'Development', 'Design', 'Marketing', 'Content', 'Data', 'Video', 'Other']
const LEVELS = ['All', 'beginner', 'intermediate', 'expert']

const LEVEL_CFG: Record<string, { color: string; bg: string; border: string }> = {
  beginner:     { color: '#4ade80', bg: 'rgba(74,222,128,0.1)',   border: 'rgba(74,222,128,0.25)' },
  intermediate: { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',   border: 'rgba(96,165,250,0.25)' },
  expert:       { color: '#c084fc', bg: 'rgba(192,132,252,0.1)',  border: 'rgba(192,132,252,0.25)' },
}

export default function FreelancePage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [level, setLevel] = useState('All')
  const [showPost, setShowPost] = useState(false)
  const [tab, setTab] = useState<'recommended' | 'browse' | 'my-jobs'>('recommended')
  const [applied, setApplied] = useState<Set<string>>(new Set())
  const [form, setForm] = useState({
    title: '', description: '', budget: '', budgetType: 'fixed',
    skills: '', duration: '1 month', category: 'Development', experienceLevel: 'intermediate'
  })

  const { data: profile } = useQuery({
    queryKey: ['profile-me'],
    queryFn: () => api.get('/users/me').then(r => r.data.user),
  })

  const expertise: string[] = profile?.expertise || []

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['freelance', search, category, level, tab, expertise.join(',')],
    queryFn: () => {
      if (tab === 'my-jobs') return freelanceAPI.my().then(r => r.data.data)
      const params: any = {}
      if (category !== 'All') params.category = category
      if (level !== 'All') params.experienceLevel = level
      if (search) params.search = search
      if (tab === 'recommended' && expertise.length > 0) params.skills = expertise.join(',')
      return freelanceAPI.all(params).then(r => r.data.data)
    },
  })

  const postMut = useMutation({
    mutationFn: (data: any) => freelanceAPI.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['freelance'] }); toast.success('Job posted!'); setShowPost(false) },
    onError: () => toast.error('Failed to post'),
  })

  const applyMut = useMutation({
    mutationFn: (id: string) => freelanceAPI.apply(id),
    onSuccess: (_, id) => { setApplied(prev => { const s = new Set(Array.from(prev)); s.add(id); return s }); toast.success('Application submitted!') },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to apply'),
  })

  const postJob = () => {
    if (!form.title || !form.description || !form.budget) return toast.error('Fill all required fields')
    const payload = { ...form, budget: +form.budget, skills: form.skills.split(',').map(s => s.trim()).filter(Boolean) }
    postMut.mutate(payload)
  }

  const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }
  const labelCls = 'block text-xs text-gray-400 mb-1.5 font-medium'

  return (
    <div className="space-y-5 max-w-5xl pb-8">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-violet-400" /> Freelance Hub
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Find work, post jobs, and grow your income</p>
        </div>
        <button onClick={() => setShowPost(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold text-white transition-all"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', boxShadow: '0 4px 20px rgba(124,58,237,0.35)' }}>
          <Plus className="w-4 h-4" /> Post a Job
        </button>
      </div>

      {/* TruLance Banner */}
      <a href="https://trulance.peptly.in" target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-between p-4 rounded-2xl group transition-all hover:scale-[1.01]"
        style={{ background: 'linear-gradient(135deg,rgba(13,148,136,0.12),rgba(8,145,178,0.1))', border: '1px solid rgba(13,148,136,0.3)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#0d9488,#0891b2)' }}>
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">TruLance — Full Freelance Marketplace</p>
            <p className="text-xs text-teal-400 mt-0.5">Browse 200+ projects, find talent & build your profile</p>
          </div>
        </div>
        <ExternalLink className="w-4 h-4 text-teal-400 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
      </a>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {([
          { key: 'recommended', label: 'Recommended', icon: Sparkles },
          { key: 'browse',      label: 'Browse All',  icon: Search },
          { key: 'my-jobs',     label: 'My Posted Jobs', icon: Briefcase },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={tab === t.key
              ? { background: 'rgba(124,58,237,0.25)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.4)' }
              : { color: '#6b7280' }}>
            <t.icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Recommended hint */}
      {tab === 'recommended' && (
        <div className="rounded-2xl p-3.5 flex items-start gap-3"
          style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
          <Sparkles className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-white font-semibold">Jobs matched to your skills</p>
            {expertise.length > 0
              ? <p className="text-xs text-gray-400 mt-0.5">Based on: {expertise.slice(0, 5).join(', ')}{expertise.length > 5 ? ` +${expertise.length - 5} more` : ''}</p>
              : <p className="text-xs text-gray-400 mt-0.5">Add skills in your <a href="/student/brand" className="text-violet-400 underline">Brand Profile</a> to get better matches</p>
            }
          </div>
        </div>
      )}

      {/* Browse filters */}
      {tab === 'browse' && (
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs..."
              className="w-full rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none"
              style={inputStyle} />
          </div>
          <div className="relative">
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="appearance-none rounded-xl px-4 py-2.5 pr-8 text-sm text-white focus:outline-none"
              style={inputStyle}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={level} onChange={e => setLevel(e.target.value)}
              className="appearance-none rounded-xl px-4 py-2.5 pr-8 text-sm text-white focus:outline-none capitalize"
              style={inputStyle}>
              {LEVELS.map(l => <option key={l} value={l} className="capitalize">{l === 'All' ? 'All Levels' : l}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Job List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-9 h-9 animate-spin text-violet-400" />
          <p className="text-gray-500 text-sm">Loading opportunities…</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-3xl py-20 text-center" style={{ background: 'rgba(13,13,20,0.95)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <Briefcase className="w-7 h-7 text-gray-600" />
          </div>
          <p className="text-white font-bold">No jobs found</p>
          {tab === 'recommended'
            ? <p className="text-gray-500 text-sm mt-1">Update your skills in <a href="/student/brand" className="text-violet-400 underline">Brand Profile</a> or <button onClick={() => setTab('browse')} className="text-violet-400 underline">browse all jobs</button></p>
            : <p className="text-gray-500 text-sm mt-1">Check back later or post your own!</p>
          }
        </div>
      ) : (
        <div className="space-y-3">
          {(jobs as any[]).map((job: any) => {
            const isOwner = (user as any)?._id === job.postedBy?._id
            const hasApplied = applied.has(job._id) || job.applicants?.includes((user as any)?._id)
            const matchedSkills = job.skills?.filter((s: string) =>
              expertise.some(e => e.toLowerCase() === s.toLowerCase())
            ) || []
            const lc = LEVEL_CFG[job.experienceLevel] || LEVEL_CFG.intermediate
            return (
              <div key={job._id} className="rounded-2xl p-4 transition-all hover:scale-[1.005]"
                style={{ background: 'rgba(13,13,20,0.95)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black text-white"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                    {job.postedBy?.name?.[0] || '?'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-white text-sm">{job.title}</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize"
                          style={{ color: lc.color, background: lc.bg, border: `1px solid ${lc.border}` }}>
                          {job.experienceLevel}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium capitalize"
                          style={{ color: '#9ca3af', background: 'rgba(255,255,255,0.06)' }}>
                          {job.category}
                        </span>
                        {matchedSkills.length > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"
                            style={{ color: '#a78bfa', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)' }}>
                            <Sparkles className="w-2.5 h-2.5" /> {matchedSkills.length} match
                          </span>
                        )}
                        {isOwner && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                            style={{ color: '#c084fc', background: 'rgba(192,132,252,0.1)', border: '1px solid rgba(192,132,252,0.2)' }}>
                            Your Job
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-gray-400 text-xs leading-relaxed line-clamp-2 mb-2.5">{job.description}</p>

                    {job.skills?.length > 0 && (
                      <div className="flex gap-1 flex-wrap mb-2.5">
                        {job.skills.map((s: string) => {
                          const isMatch = expertise.some(e => e.toLowerCase() === s.toLowerCase())
                          return (
                            <span key={s} className="text-[10px] px-2 py-0.5 rounded-lg font-medium"
                              style={isMatch
                                ? { color: '#c4b5fd', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }
                                : { color: '#6b7280', background: 'rgba(255,255,255,0.04)' }}>
                              {s}
                            </span>
                          )
                        })}
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-green-400" />₹{job.budget?.toLocaleString()} {job.budgetType}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-blue-400" />{job.duration}</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3 text-violet-400" />{job.applicants?.length || 0} applied</span>
                      </div>
                      {!isOwner && tab !== 'my-jobs' && (
                        <button onClick={() => applyMut.mutate(job._id)}
                          disabled={hasApplied || applyMut.isPending}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
                          style={hasApplied
                            ? { background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }
                            : { background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff' }}>
                          {hasApplied ? <><CheckCircle className="w-3 h-3" /> Applied</> : 'Apply Now'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Post Job Modal */}
      {showPost && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowPost(false)}>
          <div className="w-full max-w-lg rounded-3xl p-6 my-4 space-y-4"
            style={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-black text-white flex items-center gap-2"><Plus className="w-5 h-5 text-violet-400" /> Post a Job</h2>
              <button onClick={() => setShowPost(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-500 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className={labelCls}>Job Title *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. React Developer for E-commerce"
                className="w-full rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none"
                style={inputStyle} />
            </div>
            <div>
              <label className={labelCls}>Description *</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Detailed job description, requirements, deliverables..." rows={4}
                className="w-full rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none resize-none"
                style={inputStyle} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Budget (₹) *</label>
                <input type="number" value={form.budget} onChange={e => setForm(p => ({ ...p, budget: e.target.value }))}
                  placeholder="5000"
                  className="w-full rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none"
                  style={inputStyle} />
              </div>
              <div>
                <label className={labelCls}>Budget Type</label>
                <select value={form.budgetType} onChange={e => setForm(p => ({ ...p, budgetType: e.target.value }))}
                  className="w-full rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                  style={inputStyle}>
                  <option value="fixed">Fixed</option>
                  <option value="hourly">Hourly</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Required Skills (comma-separated)</label>
              <input value={form.skills} onChange={e => setForm(p => ({ ...p, skills: e.target.value }))}
                placeholder="React, TypeScript, Node.js"
                className="w-full rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none"
                style={inputStyle} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Category</label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                  style={inputStyle}>
                  {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Experience Level</label>
                <select value={form.experienceLevel} onChange={e => setForm(p => ({ ...p, experienceLevel: e.target.value }))}
                  className="w-full rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none capitalize"
                  style={inputStyle}>
                  {['beginner', 'intermediate', 'expert'].map(l => <option key={l} value={l} className="capitalize">{l}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Duration</label>
              <input value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))}
                placeholder="e.g. 2 weeks, 1 month"
                className="w-full rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none"
                style={inputStyle} />
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowPost(false)}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-gray-400 transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                Cancel
              </button>
              <button onClick={postJob} disabled={postMut.isPending}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                {postMut.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Posting…</> : 'Post Job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
