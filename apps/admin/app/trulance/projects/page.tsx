'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminAPI } from '@/lib/api'
import AdminLayout from '@/components/AdminLayout'
import toast from 'react-hot-toast'
import { Search, Briefcase, Trash2, Edit2, Check, X, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'

const STATUSES = ['all', 'open', 'in-progress', 'closed']
const CATEGORIES = ['All', 'Development', 'Design', 'Marketing', 'Content', 'Data', 'Video', 'Other']

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-green-500/15 text-green-400',
  'in-progress': 'bg-blue-500/15 text-blue-400',
  closed: 'bg-gray-500/15 text-gray-400',
}

export default function TruLanceProjectsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [category, setCategory] = useState('All')
  const [editId, setEditId] = useState<string | null>(null)
  const [editStatus, setEditStatus] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-trulance-projects', search, status, category],
    queryFn: () => adminAPI.trulanceProjects({ search: search || undefined, status: status !== 'all' ? status : undefined, category: category !== 'All' ? category : undefined }),
  })

  const projects: any[] = data?.data?.data || []
  const total: number = data?.data?.total || 0

  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => adminAPI.updateTrulanceProject(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-trulance-projects'] }); toast.success('Updated'); setEditId(null) },
    onError: () => toast.error('Update failed'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminAPI.deleteTrulanceProject(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-trulance-projects'] }); toast.success('Deleted') },
    onError: () => toast.error('Delete failed'),
  })

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-teal-400" /> TruLance Projects
            </h1>
            <p className="text-gray-400 text-sm mt-1">{total} total projects</p>
          </div>
          <a href={process.env.NEXT_PUBLIC_TRULANCE_URL || 'https://trulancer.trulearnix.com'} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-teal-400 border border-teal-500/30 hover:bg-teal-500/10 transition-colors">
            <ExternalLink className="w-4 h-4" /> Visit TruLance
          </a>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..."
              className="w-full bg-slate-800 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500" />
          </div>
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm capitalize focus:outline-none focus:border-violet-500">
            {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s === 'all' ? 'All Status' : s}</option>)}
          </select>
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500">
            {CATEGORIES.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="bg-slate-800/50 rounded-2xl border border-white/10 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p>No projects found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-white/10">
                <tr className="text-gray-400 text-xs uppercase tracking-wider">
                  <th className="text-left px-6 py-4">Project</th>
                  <th className="text-left px-4 py-4">Posted By</th>
                  <th className="text-left px-4 py-4">Budget</th>
                  <th className="text-left px-4 py-4">Applicants</th>
                  <th className="text-left px-4 py-4">Status</th>
                  <th className="text-left px-4 py-4">Date</th>
                  <th className="text-right px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {projects.map((p: any) => (
                  <tr key={p._id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-white truncate max-w-xs">{p.title}</p>
                        <p className="text-gray-500 text-xs capitalize">{p.category} · {p.experienceLevel}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-white text-xs font-medium">{p.postedBy?.name || '—'}</p>
                        <p className="text-gray-500 text-xs">{p.postedBy?.email || ''}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-teal-400 font-medium">₹{p.budget?.toLocaleString()}</td>
                    <td className="px-4 py-4 text-gray-300">{p.applicants?.length || 0}</td>
                    <td className="px-4 py-4">
                      {editId === p._id ? (
                        <div className="flex items-center gap-1">
                          <select value={editStatus} onChange={e => setEditStatus(e.target.value)}
                            className="bg-slate-700 border border-white/20 rounded-lg px-2 py-1 text-white text-xs">
                            <option value="open">open</option>
                            <option value="in-progress">in-progress</option>
                            <option value="closed">closed</option>
                          </select>
                          <button onClick={() => updateMut.mutate({ id: p._id, data: { status: editStatus } })}
                            className="p-1 text-green-400 hover:bg-green-500/20 rounded"><Check className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditId(null)}
                            className="p-1 text-gray-400 hover:bg-white/10 rounded"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ) : (
                        <span className={`text-xs px-2.5 py-1 rounded-full capitalize font-medium ${STATUS_COLORS[p.status] || 'bg-gray-500/15 text-gray-400'}`}>
                          {p.status}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-gray-500 text-xs">
                      {p.createdAt ? format(new Date(p.createdAt), 'dd MMM yyyy') : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setEditId(p._id); setEditStatus(p.status) }}
                          className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => { if (confirm('Delete this project?')) deleteMut.mutate(p._id) }}
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
