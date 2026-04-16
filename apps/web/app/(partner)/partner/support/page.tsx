'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ticketAPI } from '@/lib/api'
import { LifeBuoy, Plus, X, Send, Clock, CheckCircle, XCircle, MessageSquare, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import toast from 'react-hot-toast'

const PARTNER_CATEGORIES = [
  { value: 'commission',  label: 'Commission Issue' },
  { value: 'withdrawal',  label: 'Withdrawal Problem' },
  { value: 'payment',     label: 'Payment Issue' },
  { value: 'technical',   label: 'Technical Problem' },
  { value: 'other',       label: 'Other' },
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
      qc.invalidateQueries({ queryKey: ['partner-tickets'] })
      toast.success('Reply sent')
    } catch { toast.error('Failed to send') } finally { setSending(false) }
  }

  return (
    <div className="rounded-2xl overflow-hidden bg-dark-800 border border-dark-600">
      <button onClick={() => setOpen(v => !v)} className="w-full text-left p-5 flex items-start gap-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary-500/15 border border-primary-500/25">
          <MessageSquare className="w-4 h-4 text-primary-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-bold text-white text-sm leading-tight">{ticket.subject}</p>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${status.color} ${status.bg}`}>
              <StatusIcon className="w-2.5 h-2.5" /> {status.label}
            </span>
            <span className={`text-[10px] font-semibold ${priority.color}`}>● {ticket.priority}</span>
          </div>
          <p className="text-dark-300 text-xs">{ticket.category} · {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</p>
        </div>
        <div className="flex-shrink-0 text-dark-400">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-dark-600 px-5 pb-5">
          <div className="space-y-3 mt-4 max-h-80 overflow-y-auto">
            {(ticket.messages || []).map((m: any, i: number) => {
              const isAdmin = m.senderRole === 'admin' || m.senderRole === 'superadmin'
              return (
                <div key={i} className={`flex gap-3 ${isAdmin ? '' : 'flex-row-reverse'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-black ${isAdmin ? 'bg-primary-500/20 text-primary-400' : 'bg-dark-600 text-dark-300'}`}>
                    {isAdmin ? 'A' : 'Me'}
                  </div>
                  <div className={`flex-1 max-w-[80%] ${isAdmin ? '' : 'text-right'}`}>
                    <div className={`inline-block rounded-2xl px-4 py-2.5 text-sm ${isAdmin ? 'bg-primary-500/10 text-gray-300 rounded-tl-sm' : 'bg-dark-600 text-gray-300 rounded-tr-sm'}`}>
                      {m.message}
                    </div>
                    <p className="text-[10px] text-dark-400 mt-1">
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
                className="flex-1 bg-dark-700 border border-dark-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-dark-400 outline-none focus:border-primary-500 transition-colors" />
              <button onClick={sendReply} disabled={!reply.trim() || sending}
                className="px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40">
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {!canReply && <p className="mt-3 text-xs text-dark-400 italic text-center">This ticket is closed</p>}
        </div>
      )}
    </div>
  )
}

export default function PartnerSupportPage() {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ subject: '', description: '', category: 'commission', priority: 'medium' })
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['partner-tickets'],
    queryFn: () => ticketAPI.list().then(r => r.data),
  })

  const createMut = useMutation({
    mutationFn: () => ticketAPI.create({ ...form, userType: 'partner' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partner-tickets'] })
      setShowForm(false)
      setForm({ subject: '', description: '', category: 'commission', priority: 'medium' })
      toast.success('Ticket submitted! We\'ll respond within 24 hours.')
    },
    onError: () => toast.error('Failed to create ticket'),
  })

  const tickets: any[] = data?.tickets || []
  const open = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length
  const resolved = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <LifeBuoy className="w-6 h-6 text-primary-400" /> Partner Support
            </h1>
            <p className="text-dark-300 text-sm mt-0.5">Raise a ticket — our partner team will respond soon</p>
          </div>
          <button onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-bold transition-colors">
            <Plus className="w-4 h-4" /> New Ticket
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-4 flex items-center gap-3 bg-dark-800 border border-blue-500/20">
            <AlertCircle className="w-6 h-6 text-blue-400 flex-shrink-0" />
            <div>
              <p className="text-2xl font-black text-white">{open}</p>
              <p className="text-xs text-dark-300">Open / In Progress</p>
            </div>
          </div>
          <div className="rounded-2xl p-4 flex items-center gap-3 bg-dark-800 border border-green-500/20">
            <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
            <div>
              <p className="text-2xl font-black text-white">{resolved}</p>
              <p className="text-xs text-dark-300">Resolved</p>
            </div>
          </div>
        </div>

        {/* New Ticket Form */}
        {showForm && (
          <div className="rounded-2xl p-5 bg-dark-800 border border-primary-500/30">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-white flex items-center gap-2"><Plus className="w-4 h-4 text-primary-400" /> New Ticket</h2>
              <button onClick={() => setShowForm(false)} className="w-7 h-7 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700 flex items-center justify-center transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-dark-300 font-semibold mb-1.5 block">Subject *</label>
                <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="Brief description of the issue"
                  className="w-full bg-dark-700 border border-dark-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-dark-400 outline-none focus:border-primary-500 transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-dark-300 font-semibold mb-1.5 block">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full bg-dark-700 border border-dark-600 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-primary-500 transition-colors">
                    {PARTNER_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-dark-300 font-semibold mb-1.5 block">Priority</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full bg-dark-700 border border-dark-600 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-primary-500 transition-colors">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-dark-300 font-semibold mb-1.5 block">Description *</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe your issue in detail..."
                  rows={4}
                  className="w-full bg-dark-700 border border-dark-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-dark-400 outline-none focus:border-primary-500 transition-colors resize-none" />
              </div>
              <button
                onClick={() => createMut.mutate()}
                disabled={!form.subject.trim() || !form.description.trim() || createMut.isPending}
                className="w-full py-3 rounded-xl text-sm font-bold text-white bg-primary-600 hover:bg-primary-500 flex items-center justify-center gap-2 transition-colors disabled:opacity-40">
                <Send className="w-4 h-4" />
                {createMut.isPending ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </div>
          </div>
        )}

        {/* Tickets list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1,2].map(i => <div key={i} className="h-20 rounded-2xl animate-pulse bg-dark-800" />)}
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-16 rounded-2xl bg-dark-800 border border-dark-600">
            <LifeBuoy className="w-10 h-10 mx-auto mb-3 text-dark-400 opacity-40" />
            <p className="text-dark-200 font-semibold">No tickets yet</p>
            <p className="text-dark-400 text-sm mt-1">Create a ticket if you need any help</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((t: any) => <TicketCard key={t._id} ticket={t} />)}
          </div>
        )}
    </div>
  )
}
