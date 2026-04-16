'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ticketAPI } from '@/lib/api'
import { LifeBuoy, Plus, X, Send, Clock, CheckCircle, XCircle, MessageSquare, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import toast from 'react-hot-toast'

const SALES_CATEGORIES = [
  { value: 'commission',   label: 'Commission Issue' },
  { value: 'withdrawal',   label: 'Withdrawal Problem' },
  { value: 'order',        label: 'Order Issue' },
  { value: 'lead',         label: 'Lead / Assignment' },
  { value: 'technical',    label: 'Technical Problem' },
  { value: 'other',        label: 'Other' },
]

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  open:        { label: 'Open',        color: 'text-blue-400',   bg: 'bg-blue-500/15',   icon: AlertCircle },
  in_progress: { label: 'In Progress', color: 'text-amber-400',  bg: 'bg-amber-500/15',  icon: Clock },
  resolved:    { label: 'Resolved',    color: 'text-green-400',  bg: 'bg-green-500/15',  icon: CheckCircle },
  closed:      { label: 'Closed',      color: 'text-gray-400',   bg: 'bg-gray-500/15',   icon: XCircle },
}

const PRIORITY_MAP: Record<string, { color: string }> = {
  low:    { color: 'text-green-400' },
  medium: { color: 'text-amber-400' },
  high:   { color: 'text-red-400' },
}

function TicketCard({ ticket }: { ticket: any }) {
  const [open, setOpen] = useState(false)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const qc = useQueryClient()
  const status = STATUS_MAP[ticket.status] || STATUS_MAP.open
  const priority = PRIORITY_MAP[ticket.priority] || PRIORITY_MAP.medium
  const StatusIcon = status.icon
  const canReply = ticket.status !== 'closed'

  const sendReply = async () => {
    if (!reply.trim()) return
    setSending(true)
    try {
      await ticketAPI.reply(ticket._id, reply)
      setReply('')
      qc.invalidateQueries({ queryKey: ['sales-tickets'] })
      toast.success('Reply sent')
    } catch { toast.error('Failed to send') } finally { setSending(false) }
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(12,12,20,0.95)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <button onClick={() => setOpen(v => !v)} className="w-full text-left p-5 flex items-start gap-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.25)' }}>
          <MessageSquare className="w-4 h-4 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-bold text-white text-sm leading-tight">{ticket.subject}</p>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${status.color} ${status.bg}`}>
              <StatusIcon className="w-2.5 h-2.5" /> {status.label}
            </span>
            <span className={`text-[10px] font-semibold ${priority.color}`}>● {ticket.priority}</span>
          </div>
          <p className="text-gray-500 text-xs">{ticket.category} · {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</p>
        </div>
        <div className="flex-shrink-0 text-gray-600">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {open && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} className="px-5 pb-5">
          <div className="space-y-3 mt-4 max-h-80 overflow-y-auto">
            {(ticket.messages || []).map((m: any, i: number) => {
              const isAdmin = m.senderRole === 'admin' || m.senderRole === 'superadmin'
              return (
                <div key={i} className={`flex gap-3 ${isAdmin ? '' : 'flex-row-reverse'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-black ${
                    isAdmin ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-gray-300'
                  }`}>
                    {isAdmin ? 'A' : 'Me'}
                  </div>
                  <div className={`flex-1 max-w-[80%] ${isAdmin ? '' : 'text-right'}`}>
                    <div className={`inline-block rounded-2xl px-4 py-2.5 text-sm ${
                      isAdmin ? 'bg-blue-500/10 text-gray-300 rounded-tl-sm' : 'bg-white/8 text-gray-300 rounded-tr-sm'
                    }`}>
                      {m.message}
                    </div>
                    <p className="text-[10px] text-gray-600 mt-1">
                      {m.createdAt ? format(new Date(m.createdAt), 'dd MMM, HH:mm') : ''}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {canReply && (
            <div className="flex gap-2 mt-4">
              <input value={reply} onChange={e => setReply(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendReply()}
                placeholder="Add a reply..."
                className="flex-1 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
              <button onClick={sendReply} disabled={!reply.trim() || sending}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40 text-white"
                style={{ background: 'linear-gradient(135deg,#2563eb,#4f46e5)' }}>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {!canReply && <p className="mt-3 text-xs text-gray-600 italic text-center">This ticket is closed</p>}
        </div>
      )}
    </div>
  )
}

export default function SalesSupportPage() {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ subject: '', description: '', category: 'commission', priority: 'medium' })
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['sales-tickets'],
    queryFn: () => ticketAPI.list().then(r => r.data),
  })

  const createMut = useMutation({
    mutationFn: () => ticketAPI.create({ ...form, userType: 'sales' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales-tickets'] })
      setShowForm(false)
      setForm({ subject: '', description: '', category: 'commission', priority: 'medium' })
      toast.success("Ticket submitted! We'll respond within 24 hours.")
    },
    onError: () => toast.error('Failed to create ticket'),
  })

  const tickets: any[] = data?.tickets || []
  const openCount = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length
  const resolved = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-10">

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl p-5 sm:p-6"
        style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.3) 0%, rgba(79,70,229,0.25) 100%)', border: '1px solid rgba(59,130,246,0.25)' }}>
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(59,130,246,0.15)' }} />
        <div className="relative flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <LifeBuoy className="w-5 h-5 text-blue-300" />
              <span className="text-blue-300 text-xs font-bold uppercase tracking-wider">Help & Support</span>
            </div>
            <h1 className="text-2xl font-black text-white">Sales Support</h1>
            <p className="text-blue-200/50 text-sm mt-0.5">Raise a ticket — our team will respond soon</p>
          </div>
          <button onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-all"
            style={{ background: 'linear-gradient(135deg,#2563eb,#4f46e5)' }}>
            <Plus className="w-4 h-4" /> New Ticket
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'rgba(12,12,20,0.95)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <AlertCircle className="w-6 h-6 text-blue-400 flex-shrink-0" />
          <div>
            <p className="text-2xl font-black text-white">{openCount}</p>
            <p className="text-xs text-gray-500">Open / In Progress</p>
          </div>
        </div>
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'rgba(12,12,20,0.95)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
          <div>
            <p className="text-2xl font-black text-white">{resolved}</p>
            <p className="text-xs text-gray-500">Resolved</p>
          </div>
        </div>
      </div>

      {/* New Ticket Form */}
      {showForm && (
        <div className="rounded-2xl p-5" style={{ background: 'rgba(12,12,20,0.95)', border: '1px solid rgba(59,130,246,0.3)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-400" /> New Support Ticket
            </h2>
            <button onClick={() => setShowForm(false)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 font-semibold mb-1.5 block">Subject *</label>
              <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="Brief description of the issue"
                className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 font-semibold mb-1.5 block">Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none transition-colors appearance-none cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {SALES_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-semibold mb-1.5 block">Priority</label>
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none transition-colors appearance-none cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-semibold mb-1.5 block">Description *</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe your issue in detail..."
                rows={4}
                className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none transition-colors resize-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
            </div>
            <button
              onClick={() => createMut.mutate()}
              disabled={!form.subject.trim() || !form.description.trim() || createMut.isPending}
              className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg,#2563eb,#4f46e5)' }}>
              <Send className="w-4 h-4" />
              {createMut.isPending ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </div>
        </div>
      )}

      {/* Tickets list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: 'rgba(12,12,20,0.95)' }} />)}
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ background: 'rgba(12,12,20,0.95)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <LifeBuoy className="w-10 h-10 mx-auto mb-3 text-gray-700" />
          <p className="text-gray-300 font-semibold">No tickets yet</p>
          <p className="text-gray-600 text-sm mt-1">Create a ticket if you need any help</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t: any) => <TicketCard key={t._id} ticket={t} />)}
        </div>
      )}
    </div>
  )
}
