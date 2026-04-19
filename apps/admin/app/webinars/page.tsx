'use client'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { adminAPI } from '@/lib/api'
import AdminLayout from '@/components/AdminLayout'
import toast from 'react-hot-toast'
import {
  Radio, Plus, X, Clock, Users, Play, Square, Trash2,
  Search, RefreshCw, Calendar, ExternalLink, Copy, BarChart2,
  CheckCircle2, XCircle, Circle, Eye,
} from 'lucide-react'
import { format, formatDistanceToNow, isFuture } from 'date-fns'
import { useRouter } from 'next/navigation'

const STATUS: Record<string, { label: string; cls: string; dot: string }> = {
  live:      { label: 'LIVE',      cls: 'bg-red-500/20 text-red-400',   dot: 'bg-red-400 animate-pulse' },
  scheduled: { label: 'Scheduled', cls: 'bg-blue-500/20 text-blue-400', dot: 'bg-blue-400' },
  ended:     { label: 'Ended',     cls: 'bg-gray-500/20 text-gray-400', dot: 'bg-gray-500' },
  cancelled: { label: 'Cancelled', cls: 'bg-red-900/20 text-red-600',   dot: 'bg-red-700' },
}

const WEB_BASE = process.env.NEXT_PUBLIC_WEB_URL || 'https://trulearnix.com'

const emptyForm = { title: '', description: '', type: 'webinar', scheduledAt: '', duration: 60 }

export default function WebinarsPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [actionId, setActionId] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-webinars', statusFilter],
    queryFn: () => adminAPI.allWebinars({ status: statusFilter || undefined, limit: 100 }).then(r => r.data),
    refetchInterval: 30000,
  })

  const webinars: any[] = (data?.webinars || []).filter((w: any) =>
    !search || w.title?.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.scheduledAt) return toast.error('Title and scheduled time required')
    setSaving(true)
    try {
      await adminAPI.createWebinar(form)
      toast.success('Webinar created!')
      qc.invalidateQueries({ queryKey: ['admin-webinars'] })
      setShowCreate(false)
      setForm({ ...emptyForm })
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to create')
    } finally { setSaving(false) }
  }

  const handleStart = async (id: string) => {
    setActionId(id)
    try {
      await adminAPI.startWebinar(id)
      toast.success('Session is now LIVE!')
      qc.invalidateQueries({ queryKey: ['admin-webinars'] })
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setActionId('') }
  }

  const handleEnd = async (id: string) => {
    if (!confirm('End this session? Recording will be saved automatically.')) return
    setActionId(id)
    try {
      await adminAPI.endWebinar(id)
      toast.success('Session ended and recording saved.')
      qc.invalidateQueries({ queryKey: ['admin-webinars'] })
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setActionId('') }
  }

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this webinar?')) return
    try {
      await adminAPI.cancelWebinar(id)
      toast.success('Cancelled')
      qc.invalidateQueries({ queryKey: ['admin-webinars'] })
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed') }
  }

  const copyLink = (slug: string) => {
    const url = `${WEB_BASE}/webinar/${slug}`
    navigator.clipboard.writeText(url).then(() => toast.success('Link copied!'))
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Radio className="w-6 h-6 text-violet-400" />
              Webinars & Workshops
            </h1>
            <p className="text-gray-400 text-sm mt-1">Public sessions via shareable link — powered by LiveKit</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-white font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Session
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search sessions..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-violet-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
          >
            <option value="">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="live">Live</option>
            <option value="ended">Ended</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button onClick={() => refetch()} className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Table */}
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : webinars.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No sessions found. Create your first webinar or workshop!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 uppercase text-xs">
                    <th className="px-4 py-3 text-left">Session</th>
                    <th className="px-4 py-3 text-left">Scheduled</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Participants</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {webinars.map((w: any) => {
                    const st = STATUS[w.status] || STATUS.scheduled
                    const isLive = w.status === 'live'
                    const isScheduled = w.status === 'scheduled'
                    const loading = actionId === w._id
                    return (
                      <tr key={w._id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-white">{w.title}</div>
                          <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                            <span className={`capitalize px-1.5 py-0.5 rounded text-xs ${w.type === 'workshop' ? 'bg-amber-500/20 text-amber-400' : 'bg-violet-500/20 text-violet-400'}`}>
                              {w.type}
                            </span>
                            <span>{w.duration} min</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-300">
                          {w.scheduledAt && !isNaN(new Date(w.scheduledAt).getTime()) ? (
                            <>
                              <div>{format(new Date(w.scheduledAt), 'dd MMM yyyy')}</div>
                              <div className="text-xs text-gray-500">{format(new Date(w.scheduledAt), 'hh:mm a')}</div>
                            </>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${st.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                            {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-300">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-gray-500" />
                            {w.participants?.length || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Join link */}
                            {w.joinSlug && (isLive || isScheduled) && (
                              <button
                                onClick={() => copyLink(w.joinSlug)}
                                className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-gray-300 transition-colors"
                                title="Copy join link"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {/* Manage room */}
                            {(isLive || isScheduled) && (
                              <button
                                onClick={() => router.push(`/webinars/${w._id}`)}
                                className="p-1.5 rounded bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 transition-colors"
                                title="Enter room / manage"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {/* Report */}
                            {w.status === 'ended' && (
                              <button
                                onClick={() => router.push(`/webinars/${w._id}`)}
                                className="p-1.5 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-colors"
                                title="View report"
                              >
                                <BarChart2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {/* Start */}
                            {isScheduled && (
                              <button
                                onClick={() => handleStart(w._id)}
                                disabled={loading}
                                className="flex items-center gap-1 px-2 py-1 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded text-xs transition-colors disabled:opacity-50"
                              >
                                <Play className="w-3 h-3" /> Go Live
                              </button>
                            )}
                            {/* End */}
                            {isLive && (
                              <button
                                onClick={() => handleEnd(w._id)}
                                disabled={loading}
                                className="flex items-center gap-1 px-2 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded text-xs transition-colors disabled:opacity-50"
                              >
                                <Square className="w-3 h-3" /> End
                              </button>
                            )}
                            {/* Cancel */}
                            {isScheduled && (
                              <button
                                onClick={() => handleCancel(w._id)}
                                className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                                title="Cancel"
                              >
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
            </div>
          )}
        </div>

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg">
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Radio className="w-5 h-5 text-violet-400" /> Create Session
                </h2>
                <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreate} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Type</label>
                  <div className="flex gap-3">
                    {['webinar', 'workshop'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, type: t }))}
                        className={`flex-1 py-2 rounded-lg border text-sm font-medium capitalize transition-colors ${form.type === t ? 'bg-violet-600 border-violet-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Title *</label>
                  <input
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Digital Marketing Masterclass"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={3}
                    placeholder="What will participants learn?"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-violet-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Scheduled At *</label>
                    <input
                      type="datetime-local"
                      value={form.scheduledAt}
                      onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Duration (min)</label>
                    <input
                      type="number"
                      min={15}
                      max={480}
                      value={form.duration}
                      onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="flex-1 py-2.5 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Creating...' : 'Create Session'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
