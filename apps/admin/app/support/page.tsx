'use client'
import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { adminAPI } from '@/lib/api'
import AdminLayout from '@/components/AdminLayout'
import toast from 'react-hot-toast'
import {
  MessageSquare, X, Send, Clock, Ticket, CheckCircle2,
  AlertCircle, Search, Filter, ChevronDown, Inbox
} from 'lucide-react'
import { format, formatDistanceToNow, differenceInHours, differenceInMinutes } from 'date-fns'

const STATUS_OPTIONS = ['open', 'in_progress', 'resolved', 'closed']

/* ── Color helpers ─────────────────────────────────────── */
const statusBadge = (s: string): string => {
  const map: Record<string, string> = {
    open:        'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    in_progress: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    resolved:    'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    closed:      'bg-slate-500/20 text-slate-400 border border-slate-500/30',
  }
  return map[s] || 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
}

const priorityConfig = (p: string) => {
  const map: Record<string, { color: string; dot: string; label: string; ring: string }> = {
    critical: { color: 'text-rose-400',   dot: 'bg-rose-400',   label: 'Critical', ring: 'ring-rose-400/30' },
    high:     { color: 'text-orange-400', dot: 'bg-orange-400', label: 'High',     ring: 'ring-orange-400/30' },
    medium:   { color: 'text-amber-400',  dot: 'bg-amber-400',  label: 'Medium',   ring: 'ring-amber-400/30' },
    low:      { color: 'text-slate-400',  dot: 'bg-slate-400',  label: 'Low',      ring: 'ring-slate-400/30' },
  }
  return map[p] || map.medium
}

const avatarColors = [
  'bg-violet-600 text-white', 'bg-blue-600 text-white',
  'bg-emerald-600 text-white', 'bg-amber-600 text-white',
  'bg-rose-600 text-white', 'bg-cyan-600 text-white',
]
const avatarColor = (name: string) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length]
const initials = (name: string) => name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?'

const formatResponseTime = (createdAt: string, resolvedAt?: string) => {
  if (!createdAt) return '—'
  const end = resolvedAt ? new Date(resolvedAt) : new Date()
  const start = new Date(createdAt)
  const mins = differenceInMinutes(end, start)
  if (mins < 60) return `${mins}m`
  const hrs = differenceInHours(end, start)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

const USER_TYPE_TABS = [
  { v: '', l: 'All Users' },
  { v: 'learner', l: 'Learners' },
  { v: 'partner', l: 'Partners' },
]

const STATUS_TABS = [
  { v: '', l: 'All' },
  { v: 'open', l: 'Open' },
  { v: 'in_progress', l: 'In Progress' },
  { v: 'resolved', l: 'Resolved' },
  { v: 'closed', l: 'Closed' },
]

/* ══════════════════════════════════════════════════════════ */
export default function SupportPage() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter]     = useState('')
  const [userTypeFilter, setUserTypeFilter] = useState('')
  const [search, setSearch]                 = useState('')
  const [selected, setSelected]             = useState<any>(null)
  const [reply, setReply]                   = useState('')
  const [newStatus, setNewStatus]           = useState('')
  const [updating, setUpdating]             = useState(false)

  const { data, refetch } = useQuery({
    queryKey: ['admin-tickets', statusFilter, userTypeFilter],
    queryFn: () =>
      adminAPI
        .tickets({ status: statusFilter || undefined, userType: userTypeFilter || undefined, limit: 100 })
        .then(r => r.data),
  })

  const tickets: any[] = data?.tickets || data?.data || []
  const stats = data?.stats || {}

  /* ── Filtered + searched tickets ───────────────────────── */
  const filtered = useMemo(() => {
    if (!search.trim()) return tickets
    const q = search.toLowerCase()
    return tickets.filter((t: any) =>
      t.user?.name?.toLowerCase().includes(q) ||
      t.user?.email?.toLowerCase().includes(q) ||
      t.subject?.toLowerCase().includes(q) ||
      t.title?.toLowerCase().includes(q) ||
      t.message?.toLowerCase().includes(q)
    )
  }, [tickets, search])

  /* ── KPI counts ─────────────────────────────────────────── */
  const totalTickets   = tickets.length
  const openTickets    = tickets.filter((t: any) => t.status === 'open').length
  const resolvedToday  = tickets.filter((t: any) => {
    if (t.status !== 'resolved' && t.status !== 'closed') return false
    if (!t.updatedAt) return false
    const d = new Date(t.updatedAt)
    const now = new Date()
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length
  const avgResponseMins = useMemo(() => {
    const resolved = tickets.filter((t: any) => t.status === 'resolved' && t.createdAt && t.updatedAt)
    if (!resolved.length) return null
    const avg = resolved.reduce((sum: number, t: any) => sum + differenceInMinutes(new Date(t.updatedAt), new Date(t.createdAt)), 0) / resolved.length
    if (avg < 60) return `${Math.round(avg)}m`
    return `${Math.round(avg / 60)}h`
  }, [tickets])

  /* ── Actions ────────────────────────────────────────────── */
  const openTicket = (ticket: any) => {
    setSelected(ticket)
    setNewStatus(ticket.status || 'open')
    setReply('')
  }

  const sendReply = async () => {
    if (!reply.trim() || !selected) return
    setUpdating(true)
    try {
      await adminAPI.updateTicket(selected._id, { reply, replyAction: 'add' })
      toast.success('Reply sent')
      setReply('')
      refetch()
      const updated = tickets.find((t: any) => t._id === selected._id)
      if (updated) setSelected({ ...updated, status: newStatus })
    } catch { toast.error('Failed to send reply') } finally { setUpdating(false) }
  }

  const updateStatus = async () => {
    if (!selected || !newStatus) return
    setUpdating(true)
    try {
      await adminAPI.updateTicket(selected._id, { status: newStatus })
      toast.success('Status updated')
      refetch()
      setSelected({ ...selected, status: newStatus })
    } catch { toast.error('Failed to update') } finally { setUpdating(false) }
  }

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <AdminLayout>
      <div className="space-y-6 fade-in-up">

        {/* ── Page Header ──────────────────────────────────── */}
        <div className="page-header">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 rounded-xl bg-violet-600/20 border border-violet-500/30">
                  <Ticket className="w-5 h-5 text-violet-400" />
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight">Support Center</h1>
              </div>
              <p className="text-slate-400 text-sm ml-[52px]">
                Manage and respond to support tickets
              </p>
            </div>
            <div className="flex items-center gap-2 ml-[52px] sm:ml-0">
              <span className="text-xs text-slate-500 font-medium">{filtered.length} tickets shown</span>
              {openTickets > 0 && (
                <span className="badge bg-rose-500/20 text-rose-400 border border-rose-500/30 pulse-dot">
                  {openTickets} open
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── KPI Cards ────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total */}
          <div className="kpi-violet">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-violet-500/20">
                <Ticket className="w-4 h-4 text-violet-400" />
              </div>
              <span className="text-xs text-violet-400/70 font-medium">Total</span>
            </div>
            <p className="text-3xl font-black text-white count-up">{totalTickets}</p>
            <p className="text-xs text-slate-400 mt-1">All Tickets</p>
          </div>

          {/* Open */}
          <div className="kpi-blue cursor-pointer" onClick={() => setStatusFilter(statusFilter === 'open' ? '' : 'open')}>
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <AlertCircle className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-xs text-blue-400/70 font-medium">Needs Reply</span>
            </div>
            <p className="text-3xl font-black text-white count-up">{openTickets}</p>
            <p className="text-xs text-slate-400 mt-1">Open Tickets</p>
          </div>

          {/* Resolved Today */}
          <div className="kpi-emerald">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-xs text-emerald-400/70 font-medium">Today</span>
            </div>
            <p className="text-3xl font-black text-white count-up">{resolvedToday}</p>
            <p className="text-xs text-slate-400 mt-1">Resolved Today</p>
          </div>

          {/* Avg Response Time */}
          <div className="kpi-amber">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-xs text-amber-400/70 font-medium">Performance</span>
            </div>
            <p className="text-3xl font-black text-white count-up">{avgResponseMins ?? '—'}</p>
            <p className="text-xs text-slate-400 mt-1">Avg Response Time</p>
          </div>
        </div>

        {/* ── Filters ──────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          {/* Search */}
          <div className="search-bar flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <input
              className="search-input"
              placeholder="Search tickets, users, subjects..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* User type tabs */}
          <div className="tab-bar">
            {USER_TYPE_TABS.map(tab => (
              <button
                key={tab.v}
                onClick={() => setUserTypeFilter(tab.v)}
                className={userTypeFilter === tab.v ? 'tab-active' : 'tab-inactive'}
              >
                {tab.l}
                {tab.v === 'learner' && stats.learner ? (
                  <span className="ml-1.5 text-[10px] opacity-70">({stats.learner})</span>
                ) : null}
                {tab.v === 'partner' && stats.partner ? (
                  <span className="ml-1.5 text-[10px] opacity-70">({stats.partner})</span>
                ) : null}
              </button>
            ))}
          </div>

          {/* Status tabs */}
          <div className="tab-bar">
            {STATUS_TABS.map(tab => (
              <button
                key={tab.v}
                onClick={() => setStatusFilter(tab.v)}
                className={statusFilter === tab.v ? 'tab-active' : 'tab-inactive'}
              >
                {tab.l}
              </button>
            ))}
          </div>
        </div>

        {/* ── Ticket List ──────────────────────────────────── */}
        <div className="table-container">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[2fr_1fr_3fr_1fr_1fr_1fr_56px] gap-4 table-header">
            <span>User</span>
            <span>Type</span>
            <span>Subject</span>
            <span>Priority</span>
            <span>Status</span>
            <span>Response</span>
            <span></span>
          </div>

          {/* Rows */}
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="p-4 rounded-2xl bg-slate-800/60 mb-4">
                <Inbox className="w-10 h-10 text-slate-600" />
              </div>
              <p className="text-slate-400 font-medium">No tickets found</p>
              <p className="text-slate-600 text-sm mt-1">
                {search ? 'Try a different search query' : 'No support tickets match your filters'}
              </p>
            </div>
          ) : (
            filtered.map((ticket: any, idx: number) => {
              const pc = priorityConfig(ticket.priority || 'medium')
              const isLast = idx === filtered.length - 1
              return (
                <div
                  key={ticket._id}
                  onClick={() => openTicket(ticket)}
                  className={`grid grid-cols-1 md:grid-cols-[2fr_1fr_3fr_1fr_1fr_1fr_56px] gap-4 items-center px-4 py-4 cursor-pointer hover:bg-white/[0.03] transition-colors group ${!isLast ? 'border-b border-white/5' : ''}`}
                >
                  {/* User */}
                  <div className="flex items-center gap-3">
                    <div className={`avatar-md ${avatarColor(ticket.user?.name || '')} flex-shrink-0`}>
                      {initials(ticket.user?.name || '?')}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{ticket.user?.name || '—'}</p>
                      <p className="text-xs text-slate-500 truncate">{ticket.user?.email}</p>
                    </div>
                  </div>

                  {/* User type */}
                  <div>
                    <span className={`badge text-[10px] font-bold ${
                      ticket.userType === 'partner'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                        : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                    }`}>
                      {ticket.userType === 'partner' ? 'Partner' : 'Learner'}
                    </span>
                  </div>

                  {/* Subject */}
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{ticket.subject || ticket.title || '—'}</p>
                    {ticket.message && (
                      <p className="text-xs text-slate-500 truncate">{ticket.message}</p>
                    )}
                    <p className="text-[10px] text-slate-600 mt-0.5 md:hidden">
                      {ticket.createdAt ? formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true }) : ''}
                    </p>
                  </div>

                  {/* Priority */}
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${pc.dot} ring-2 ${pc.ring}`} />
                    <span className={`text-xs font-semibold ${pc.color}`}>{pc.label}</span>
                  </div>

                  {/* Status */}
                  <div>
                    <span className={`badge capitalize ${statusBadge(ticket.status)}`}>
                      {(ticket.status || 'open').replace('_', ' ')}
                    </span>
                  </div>

                  {/* Response time */}
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-slate-600 flex-shrink-0" />
                    <span className="text-xs text-slate-400">
                      {formatResponseTime(ticket.createdAt, ticket.resolvedAt || (ticket.status === 'resolved' ? ticket.updatedAt : undefined))}
                    </span>
                  </div>

                  {/* Action */}
                  <div className="flex justify-end">
                    <button
                      className="p-2 rounded-lg bg-slate-700/0 group-hover:bg-violet-500/10 text-slate-500 group-hover:text-violet-400 transition-all"
                      onClick={e => { e.stopPropagation(); openTicket(ticket) }}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ── Ticket Detail Side Panel ─────────────────────── */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-end" onClick={() => setSelected(null)}>
          <div
            className="w-full max-w-xl bg-slate-900 border-l border-white/10 flex flex-col h-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Panel Header */}
            <div className="p-5 border-b border-white/10 bg-slate-900/80 backdrop-blur-sm flex-shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`avatar-md ${avatarColor(selected.user?.name || '')} flex-shrink-0`}>
                    {initials(selected.user?.name || '?')}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-white text-sm line-clamp-2">
                      {selected.subject || selected.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-slate-400">{selected.user?.name}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-xs text-slate-500">
                        {selected.createdAt ? format(new Date(selected.createdAt), 'dd MMM yyyy, hh:mm a') : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={`badge capitalize ${statusBadge(selected.status)}`}>
                        {(selected.status || 'open').replace('_', ' ')}
                      </span>
                      {(() => {
                        const pc = priorityConfig(selected.priority || 'medium')
                        return (
                          <span className={`flex items-center gap-1 text-xs font-medium ${pc.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`} />
                            {pc.label} priority
                          </span>
                        )
                      })()}
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        {formatResponseTime(selected.createdAt, selected.resolvedAt || (selected.status === 'resolved' ? selected.updatedAt : undefined))}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Message Thread */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <p className="section-title">Conversation</p>

              {/* Original message */}
              {selected.message && (
                <div className="glass p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`avatar-sm ${avatarColor(selected.user?.name || '')}`}>
                      {initials(selected.user?.name || '?')}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-300">{selected.user?.name}</span>
                      <span className="text-xs text-slate-600 ml-2">
                        {selected.createdAt ? format(new Date(selected.createdAt), 'dd MMM, hh:mm a') : ''}
                      </span>
                    </div>
                  </div>
                  <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{selected.message}</p>
                </div>
              )}

              {/* Replies */}
              {(selected.replies || selected.messages || []).map((msg: any, i: number) => {
                const isAdmin = msg.isAdmin || msg.role === 'admin'
                return (
                  <div
                    key={i}
                    className={`p-4 rounded-2xl ${
                      isAdmin
                        ? 'bg-violet-600/15 border border-violet-500/20 ml-6'
                        : 'glass'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`avatar-sm ${isAdmin ? 'bg-violet-600 text-white' : avatarColor(msg.user?.name || selected.user?.name || '')}`}>
                        {isAdmin ? 'A' : initials(msg.user?.name || selected.user?.name || '?')}
                      </div>
                      <div>
                        <span className={`text-xs font-semibold ${isAdmin ? 'text-violet-400' : 'text-slate-300'}`}>
                          {isAdmin ? 'Support Team' : (msg.user?.name || selected.user?.name || 'User')}
                        </span>
                        {msg.createdAt && (
                          <span className="text-xs text-slate-600 ml-2">
                            {format(new Date(msg.createdAt), 'dd MMM, hh:mm a')}
                          </span>
                        )}
                        {isAdmin && <span className="ml-2 badge bg-violet-500/20 text-violet-400 text-[10px]">Admin</span>}
                      </div>
                    </div>
                    <p className="text-sm whitespace-pre-wrap text-slate-300 leading-relaxed">
                      {msg.message || msg.text || msg.content}
                    </p>
                  </div>
                )
              })}

              {(selected.replies || selected.messages || []).length === 0 && !selected.message && (
                <div className="empty-state py-8">
                  <MessageSquare className="w-8 h-8 text-slate-700 mb-2" />
                  <p className="text-slate-600 text-sm">No messages yet</p>
                </div>
              )}
            </div>

            {/* Status + Reply Footer */}
            <div className="p-5 border-t border-white/10 bg-slate-900/80 flex-shrink-0 space-y-3">
              {/* Status update row */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value)}
                    className="input py-2 text-sm pr-8 appearance-none"
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s} className="capitalize">
                        {s.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
                <button
                  onClick={updateStatus}
                  disabled={updating || newStatus === selected.status}
                  className="btn-secondary text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Update Status
                </button>
              </div>

              {/* Reply textarea */}
              <div className="space-y-2">
                <textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  placeholder="Type your reply... (Ctrl+Enter to send)"
                  rows={3}
                  className="input resize-none text-sm leading-relaxed"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) sendReply()
                  }}
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-600">Ctrl+Enter to send</p>
                  <button
                    onClick={sendReply}
                    disabled={updating || !reply.trim()}
                    className="btn-primary text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    Send Reply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
