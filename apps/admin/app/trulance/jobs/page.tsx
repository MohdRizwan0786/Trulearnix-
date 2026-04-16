'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminAPI } from '@/lib/api'
import AdminLayout from '@/components/AdminLayout'
import {
  Search, Briefcase, Users, Clock, CheckCircle, XCircle, Trash2,
  ChevronDown, ChevronUp, ExternalLink, Zap, Globe
} from 'lucide-react'
import { format } from 'date-fns'

const PLATFORM_LOGOS: Record<string, { color: string; bg: string }> = {
  Upwork:     { color: 'text-green-400',  bg: 'bg-green-500/15' },
  Freelancer: { color: 'text-blue-400',   bg: 'bg-blue-500/15' },
  Fiverr:     { color: 'text-emerald-400',bg: 'bg-emerald-500/15' },
  LinkedIn:   { color: 'text-sky-400',    bg: 'bg-sky-500/15' },
  Guru:       { color: 'text-amber-400',  bg: 'bg-amber-500/15' },
  Internal:   { color: 'text-violet-400', bg: 'bg-violet-500/15' },
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  open:        { label: 'Open',        color: 'text-green-400',  bg: 'bg-green-500/15' },
  'in-progress':{ label: 'In Progress', color: 'text-amber-400',  bg: 'bg-amber-500/15' },
  closed:      { label: 'Closed',      color: 'text-gray-400',   bg: 'bg-gray-500/15' },
}

function JobRow({ job, onDelete, onStatus }: { job: any; onDelete: () => void; onStatus: (s: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const poster = job.postedBy || {}
  const applicants: any[] = job.applicants || []
  const status = STATUS_MAP[job.status] || STATUS_MAP.open

  return (
    <div className="rounded-2xl overflow-hidden transition-all"
      style={{ background: 'rgba(15,15,25,0.85)', border: '1px solid rgba(255,255,255,0.07)' }}>
      {/* Job header row */}
      <div className="flex items-start gap-4 p-5">
        {/* Icon */}
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
          <Briefcase className="w-5 h-5 text-white" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <p className="font-bold text-white text-sm leading-tight">{job.title}</p>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${status.color} ${status.bg}`}>
              {status.label}
            </span>
          </div>
          <p className="text-gray-500 text-xs mt-1 line-clamp-1">{job.description}</p>

          {/* Meta row */}
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <span className="text-xs text-violet-400 font-semibold">₹{job.budget?.toLocaleString()} {job.budgetType === 'hourly' ? '/hr' : 'fixed'}</span>
            <span className="text-xs text-gray-500">{job.duration}</span>
            {job.skills?.slice(0, 3).map((s: string) => (
              <span key={s} className="text-[10px] px-2 py-0.5 rounded-lg text-violet-300 bg-violet-500/10 border border-violet-500/20">{s}</span>
            ))}
            {(job.skills?.length || 0) > 3 && <span className="text-[10px] text-gray-500">+{job.skills.length - 3} more</span>}
          </div>

          {/* Posted by */}
          <div className="flex items-center gap-2 mt-2">
            <div className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center overflow-hidden flex-shrink-0">
              {poster.avatar
                ? <img src={poster.avatar} className="w-full h-full object-cover" alt="" />
                : <span className="text-[8px] text-violet-400 font-bold">{poster.name?.[0]?.toUpperCase()}</span>
              }
            </div>
            <span className="text-xs text-gray-400">Posted by <span className="text-white">{poster.name || 'Unknown'}</span></span>
            {job.createdAt && <span className="text-[10px] text-gray-600">· {format(new Date(job.createdAt), 'dd MMM yyyy')}</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Status select */}
          <select value={job.status}
            onChange={e => onStatus(e.target.value)}
            onClick={e => e.stopPropagation()}
            className="text-xs bg-slate-700 border border-white/10 rounded-lg px-2 py-1.5 text-gray-300 outline-none focus:border-violet-500">
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="closed">Closed</option>
          </select>

          {/* Expand applicants */}
          <button onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
            <Users className="w-3.5 h-3.5" />
            <span>{applicants.length}</span>
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {/* Delete */}
          <button onClick={onDelete}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Applicants panel */}
      {expanded && (
        <div className="border-t border-white/5 px-5 py-4">
          <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">Applicants ({applicants.length})</p>
          {applicants.length === 0 ? (
            <p className="text-gray-600 text-xs italic">No applicants yet</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {applicants.map((a: any) => (
                <div key={a._id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5">
                  <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {a.avatar
                      ? <img src={a.avatar} className="w-full h-full object-cover" alt="" />
                      : <span className="text-[10px] text-violet-400 font-bold">{a.name?.[0]?.toUpperCase()}</span>
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white font-medium truncate">{a.name}</p>
                    <p className="text-[10px] text-gray-500 truncate">{a.email}</p>
                    {(a.expertise || []).length > 0 && (
                      <p className="text-[10px] text-violet-400 truncate">{a.expertise.slice(0, 3).join(', ')}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const PLATFORM_LINKS = [
  { name: 'Upwork', url: 'https://www.upwork.com/find-work/', note: 'Professional freelance marketplace', color: 'text-green-400', bg: 'from-green-600/10 to-green-800/5', border: 'border-green-500/20' },
  { name: 'Freelancer', url: 'https://www.freelancer.com/search/projects/', note: 'Global project bidding platform', color: 'text-blue-400', bg: 'from-blue-600/10 to-blue-800/5', border: 'border-blue-500/20' },
  { name: 'Fiverr', url: 'https://www.fiverr.com/', note: 'Gig-based freelance platform', color: 'text-emerald-400', bg: 'from-emerald-600/10 to-emerald-800/5', border: 'border-emerald-500/20' },
  { name: 'LinkedIn Jobs', url: 'https://www.linkedin.com/jobs/', note: 'Professional network + job board', color: 'text-sky-400', bg: 'from-sky-600/10 to-sky-800/5', border: 'border-sky-500/20' },
  { name: 'Guru', url: 'https://www.guru.com/', note: 'Workroom-based freelance network', color: 'text-amber-400', bg: 'from-amber-600/10 to-amber-800/5', border: 'border-amber-500/20' },
]

export default function AdminJobsPage() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-jobs', statusFilter, search, page],
    queryFn: () => adminAPI.jobs({ status: statusFilter, search: search || undefined, page, limit: 15 }).then(r => r.data),
    placeholderData: (prev: any) => prev,
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminAPI.deleteJob(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-jobs'] }),
  })

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminAPI.updateJobStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-jobs'] }),
  })

  const jobs: any[] = data?.jobs || []
  const stats = data?.stats || { open: 0, inProgress: 0, closed: 0 }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-violet-400" /> Platform Jobs
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">Internal freelance jobs + platform connections</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Open Jobs', value: stats.open, color: 'text-green-400', border: 'border-green-500/20', from: 'from-green-600/20', icon: CheckCircle },
            { label: 'In Progress', value: stats.inProgress, color: 'text-amber-400', border: 'border-amber-500/20', from: 'from-amber-600/20', icon: Clock },
            { label: 'Closed', value: stats.closed, color: 'text-gray-400', border: 'border-gray-500/20', from: 'from-gray-600/20', icon: XCircle },
          ].map(s => (
            <div key={s.label} className={`bg-gradient-to-br ${s.from} to-transparent border ${s.border} rounded-2xl p-5 flex items-center gap-4`}>
              <s.icon className={`w-8 h-8 ${s.color} flex-shrink-0`} />
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide">{s.label}</p>
                <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Connected Platforms */}
        <div className="rounded-2xl p-5" style={{ background: 'rgba(15,15,25,0.85)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-violet-400" /> Connected Freelance Platforms
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 font-semibold">Live</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
            {PLATFORM_LINKS.map(p => (
              <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer"
                className={`flex flex-col gap-1 p-3 rounded-xl bg-gradient-to-br ${p.bg} border ${p.border} hover:scale-[1.02] transition-transform`}>
                <div className="flex items-center justify-between">
                  <span className={`font-bold text-sm ${p.color}`}>{p.name}</span>
                  <ExternalLink className={`w-3.5 h-3.5 ${p.color} opacity-60`} />
                </div>
                <p className="text-[10px] text-gray-500 leading-tight">{p.note}</p>
                <span className="text-[9px] mt-1 text-green-400 font-semibold">● Connected</span>
              </a>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-3">
            Learner job feeds are auto-matched to their skills from the Brand Profile. Add <code className="text-violet-400 bg-violet-500/10 px-1 rounded">FREELANCER_TOKEN</code> to API env for live Freelancer.com data.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-800 rounded-xl p-1 border border-white/5">
            {['all', 'open', 'in-progress', 'closed'].map(s => (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${statusFilter === s ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20' : 'text-gray-400 hover:text-white'}`}>
                {s === 'in-progress' ? 'In Progress' : s === 'all' ? 'All Jobs' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by title or skill..."
              className="w-full bg-slate-800 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-gray-500 outline-none focus:border-violet-500 transition-colors" />
          </div>
          <span className="text-gray-500 text-sm ml-auto">{data?.total || 0} jobs</span>
        </div>

        {/* Jobs list */}
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16 text-gray-500 rounded-2xl"
            style={{ background: 'rgba(15,15,25,0.85)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No internal jobs found</p>
            <p className="text-xs text-gray-600 mt-1">Learners can post freelance jobs from the Jobs page</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job: any) => (
              <JobRow
                key={job._id}
                job={job}
                onDelete={() => {
                  if (confirm('Delete this job?')) deleteMut.mutate(job._id)
                }}
                onStatus={(status) => statusMut.mutate({ id: job._id, status })}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {(data?.pages || 0) > 1 && (
          <div className="flex items-center gap-2 justify-center">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-4 py-2 bg-slate-700 text-gray-400 hover:text-white rounded-xl text-sm disabled:opacity-40 transition-colors">
              Previous
            </button>
            {Array.from({ length: Math.min(data.pages, 7) }).map((_: any, i: number) => (
              <button key={i} onClick={() => setPage(i + 1)}
                className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${page === i + 1 ? 'bg-violet-600 text-white' : 'bg-slate-700 text-gray-400 hover:text-white'}`}>
                {i + 1}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages}
              className="px-4 py-2 bg-slate-700 text-gray-400 hover:text-white rounded-xl text-sm disabled:opacity-40 transition-colors">
              Next
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
