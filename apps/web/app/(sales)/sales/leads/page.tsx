'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salesAPI } from '@/lib/api'
import {
  Users, Search, Phone, Mail, MapPin, Loader2, Save, Calendar,
  CheckCircle, MessageCircle, Clock, Star, PhoneCall, ChevronDown,
  ChevronUp, TrendingUp, Target, Flame, Zap, ArrowRight, Filter,
  AlertCircle, BarChart3
} from 'lucide-react'
import toast from 'react-hot-toast'

const PIPELINE: { key: string; label: string; icon: string; color: string; glow: string; bar: string }[] = [
  { key: 'new',             label: 'New',            icon: '🆕', color: 'text-slate-300',  glow: 'bg-slate-500/15 border-slate-500/25',   bar: 'bg-slate-500' },
  { key: 'contacted',       label: 'Contacted',      icon: '📞', color: 'text-blue-400',   glow: 'bg-blue-500/15 border-blue-500/25',     bar: 'bg-blue-500' },
  { key: 'interested',      label: 'Interested',     icon: '⭐', color: 'text-amber-400',  glow: 'bg-amber-500/15 border-amber-500/25',   bar: 'bg-amber-500' },
  { key: 'demo_done',       label: 'Demo Done',      icon: '🎥', color: 'text-purple-400', glow: 'bg-purple-500/15 border-purple-500/25', bar: 'bg-purple-500' },
  { key: 'negotiating',     label: 'Negotiate',      icon: '🤝', color: 'text-orange-400', glow: 'bg-orange-500/15 border-orange-500/25', bar: 'bg-orange-500' },
  { key: 'token_collected', label: 'Token Collected',icon: '💰', color: 'text-yellow-400', glow: 'bg-yellow-500/15 border-yellow-500/25', bar: 'bg-yellow-500' },
  { key: 'paid',            label: 'Paid',           icon: '✅', color: 'text-green-400',  glow: 'bg-green-500/15 border-green-500/25',   bar: 'bg-green-500' },
  { key: 'lost',            label: 'Lost',           icon: '❌', color: 'text-red-400',    glow: 'bg-red-500/15 border-red-500/25',       bar: 'bg-red-500' },
]

const AI_STYLE: Record<string, string> = {
  cold: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  warm: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  hot:  'bg-red-500/10 text-red-400 border-red-500/20',
}

const DATE_FILTERS = [
  { label: 'Today', value: 'today' },
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: 'All Time', value: '' },
]

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'Just now'
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function LeadCard({ lead, onUpdated }: { lead: any; onUpdated: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [stage, setStage] = useState(lead.stage)
  const [noteText, setNoteText] = useState('')
  const [tokenAmount, setTokenAmount] = useState(lead.tokenAmount || '')
  const [tokenCollected, setTokenCollected] = useState(lead.tokenCollected || false)
  const [followUpDate, setFollowUpDate] = useState('')
  const [followUpType, setFollowUpType] = useState('call')
  const [lostReason, setLostReason] = useState('')

  const mutation = useMutation({
    mutationFn: (data: any) => salesAPI.updateLead(lead._id, data),
    onSuccess: () => { toast.success('Lead updated'); onUpdated(); setNoteText(''); setFollowUpDate('') },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Update failed'),
  })

  const handleSave = () => {
    const data: any = { stage }
    if (noteText.trim()) data.noteText = noteText.trim()
    if (followUpDate) data.followUp = { scheduledAt: followUpDate, type: followUpType, done: false }
    if (tokenAmount !== '') data.tokenAmount = Number(tokenAmount)
    data.tokenCollected = tokenCollected
    if (stage === 'lost' && lostReason) data.lostReason = lostReason
    mutation.mutate(data)
  }

  const meta = PIPELINE.find(p => p.key === stage) || PIPELINE[0]
  const isPaid = stage === 'paid'
  const isLost = stage === 'lost'
  const nextFollowUp = lead.followUps?.find((f: any) => !f.done && new Date(f.scheduledAt) > new Date())
  const isOverdue = lead.followUps?.some((f: any) => !f.done && new Date(f.scheduledAt) < new Date())

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all duration-200 ${
      isPaid ? 'border-green-500/25 bg-gradient-to-r from-green-500/5 to-transparent' :
      isLost ? 'border-red-500/15 bg-red-500/3' :
      isOverdue ? 'border-amber-500/20 bg-amber-500/3' :
      'border-white/5 bg-dark-800'
    }`}>
      {/* Stage accent bar */}
      <div className={`h-0.5 w-full ${meta.bar} opacity-60`} />

      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/3 transition-colors text-left"
      >
        {/* Avatar */}
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black flex-shrink-0 ${
          isPaid ? 'bg-green-500/20 text-green-300' : 'bg-indigo-500/15 text-indigo-300'
        }`}>
          {lead.name?.[0]?.toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-white">{lead.name}</p>
            <span className={`text-xs px-2 py-0.5 rounded-lg font-semibold border ${meta.glow} ${meta.color}`}>
              {meta.icon} {meta.label}
            </span>
            {lead.aiScoreLabel && (
              <span className={`text-xs px-2 py-0.5 rounded-lg border capitalize ${AI_STYLE[lead.aiScoreLabel] || AI_STYLE.cold}`}>
                {lead.aiScoreLabel === 'hot' ? '🔥' : lead.aiScoreLabel === 'warm' ? '🌡️' : '❄️'} {lead.aiScoreLabel}
              </span>
            )}
            {lead.tokenCollected && (
              <span className="text-xs px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Token ₹{lead.tokenAmount?.toLocaleString('en-IN')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>
            {lead.city && <span className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{lead.city}</span>}
            <span className="text-xs text-gray-600 flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(lead.updatedAt)}</span>
            {nextFollowUp && (
              <span className="text-xs text-amber-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(nextFollowUp.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <a href={`tel:${lead.phone}`} onClick={e => e.stopPropagation()}
            className="w-8 h-8 rounded-xl bg-blue-500/10 hover:bg-blue-500/25 flex items-center justify-center transition-colors">
            <PhoneCall className="w-3.5 h-3.5 text-blue-400" />
          </a>
          <a href={`https://wa.me/${lead.phone?.replace(/[^0-9]/g, '').replace(/^0/, '91')}`}
            target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
            className="w-8 h-8 rounded-xl bg-green-500/10 hover:bg-green-500/25 flex items-center justify-center transition-colors">
            <MessageCircle className="w-3.5 h-3.5 text-green-400" />
          </a>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-white/5 px-4 py-4 space-y-4">
          {/* Info chips */}
          <div className="flex flex-wrap gap-2">
            {lead.email && (
              <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-700 border border-white/5 text-xs text-gray-400 hover:text-white transition-colors">
                <Mail className="w-3 h-3" />{lead.email}
              </a>
            )}
            {lead.source && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-700 border border-white/5 text-xs text-gray-500 capitalize">
                Source: {lead.source.replace(/_/g, ' ')}
              </span>
            )}
            {lead.interestedPackage && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-400">
                <Star className="w-3 h-3" />{lead.interestedPackage}
              </span>
            )}
          </div>

          {/* Stage buttons */}
          <div>
            <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wide">Move Stage</p>
            <div className="flex flex-wrap gap-1.5">
              {PIPELINE.map(p => (
                <button key={p.key} onClick={() => setStage(p.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                    stage === p.key ? `${p.glow} ${p.color}` : 'border-white/8 text-gray-500 hover:text-gray-300 hover:border-white/20'
                  }`}>
                  {p.icon} {p.label}
                </button>
              ))}
            </div>
            {stage === 'lost' && (
              <input type="text" placeholder="Reason for losing..." value={lostReason}
                onChange={e => setLostReason(e.target.value)}
                className="mt-2 w-full bg-dark-700 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500/50" />
            )}
          </div>

          {/* Token + Follow-up */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Token Amount (₹)</label>
              <input type="number" value={tokenAmount} onChange={e => setTokenAmount(e.target.value)} placeholder="e.g. 2000"
                className="w-full bg-dark-700 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50" />
            </div>
            <div className="flex items-end">
              <button onClick={() => setTokenCollected(!tokenCollected)}
                className={`w-full px-3 py-2 rounded-xl text-sm font-semibold transition-all border ${
                  tokenCollected ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-dark-700 text-gray-400 border-white/10 hover:border-green-500/30'
                }`}>
                {tokenCollected
                  ? <span className="flex items-center justify-center gap-1"><CheckCircle className="w-4 h-4" />Collected</span>
                  : 'Token Collected?'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Schedule Follow-up</label>
            <div className="flex gap-2">
              <input type="datetime-local" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)}
                className="flex-1 bg-dark-700 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50" />
              <select value={followUpType} onChange={e => setFollowUpType(e.target.value)}
                className="bg-dark-700 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
                <option value="call">📞 Call</option>
                <option value="whatsapp">💬 WhatsApp</option>
                <option value="email">📧 Email</option>
                <option value="meeting">🤝 Meeting</option>
              </select>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Add Note</label>
            <textarea rows={2} value={noteText} onChange={e => setNoteText(e.target.value)}
              placeholder="What did you discuss? Any key points..."
              className="w-full bg-dark-700 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 resize-none" />
          </div>

          {/* History */}
          {lead.notes?.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wide">History ({lead.notes.length})</p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {[...lead.notes].reverse().slice(0, 5).map((n: any, i: number) => (
                  <div key={i} className="px-3 py-2 rounded-xl bg-dark-700/50 border border-white/5">
                    <p className="text-xs text-gray-300">{n.text}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next follow-up banner */}
          {nextFollowUp && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Calendar className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-amber-400 font-medium">Next Follow-up · {nextFollowUp.type}</p>
                <p className="text-xs text-amber-300/70">
                  {new Date(nextFollowUp.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )}

          <button onClick={handleSave} disabled={mutation.isPending}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-all disabled:opacity-50">
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      )}
    </div>
  )
}

export default function SalesLeadsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['sales-leads', search, stageFilter, dateFilter, page],
    queryFn: () => salesAPI.leads({ search, stage: stageFilter, dateFilter, page, limit: 20 }).then(r => r.data),
  })

  const leads: any[] = data?.leads || []
  const totalPages = data?.pages || 1
  const stageSummary: Record<string, number> = data?.stageSummary || {}
  const totalLeads = Object.values(stageSummary).reduce((s: number, v: any) => s + v, 0)
  const paidCount = stageSummary['paid'] || 0
  const activeCount = totalLeads - paidCount - (stageSummary['lost'] || 0)
  const conversionRate = totalLeads > 0 ? Math.round((paidCount / totalLeads) * 100) : 0

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">My Leads</h1>
        <p className="text-gray-500 text-sm mt-0.5">Track and manage your assigned leads</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Total Leads', value: totalLeads,
            icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/10',
          },
          {
            label: 'Converted', value: paidCount,
            icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/10',
            sub: conversionRate > 0 ? `${conversionRate}% rate` : undefined,
          },
          {
            label: 'Active Pipeline', value: activeCount,
            icon: Zap, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/10',
          },
          {
            label: "Follow-ups Today", value: data?.followUpToday || 0,
            icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/10',
          },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl p-4 border ${s.bg}`}>
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            {s.sub && <p className="text-xs text-gray-600 mt-0.5">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Pipeline funnel */}
      {totalLeads > 0 && (
        <div className="bg-dark-800 rounded-2xl border border-white/5 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5" /> Lead Pipeline
            </p>
            {stageFilter && (
              <button onClick={() => { setStageFilter(''); setPage(1) }}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                Clear filter
              </button>
            )}
          </div>

          {/* Funnel bars */}
          <div className="space-y-2">
            {PIPELINE.map((p, i) => {
              const count = stageSummary[p.key] || 0
              if (count === 0 && i < 5) return null
              const pct = totalLeads > 0 ? Math.max(4, Math.round((count / totalLeads) * 100)) : 0
              const isActive = stageFilter === p.key
              return (
                <button key={p.key} onClick={() => { setStageFilter(isActive ? '' : p.key); setPage(1) }}
                  className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 transition-all text-left ${
                    isActive ? `${p.glow} border` : 'hover:bg-white/4'
                  }`}>
                  <span className="text-base w-5 text-center flex-shrink-0">{p.icon}</span>
                  <span className={`text-xs font-semibold w-20 flex-shrink-0 ${isActive ? p.color : 'text-gray-400'}`}>
                    {p.label}
                  </span>
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full ${p.bar} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }} />
                  </div>
                  <span className={`text-sm font-black w-8 text-right flex-shrink-0 ${isActive ? p.color : 'text-white'}`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Conversion bar */}
          {conversionRate > 0 && (
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-3">
              <Target className="w-4 h-4 text-green-400 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500">Overall Conversion</p>
                  <p className="text-xs font-bold text-green-400">{conversionRate}%</p>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-700"
                    style={{ width: `${conversionRate}%` }} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" placeholder="Search name, phone, email..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50" />
        </div>
        {/* Date filter */}
        <div className="flex gap-1 bg-dark-800 border border-white/10 rounded-xl p-1">
          {DATE_FILTERS.map(df => (
            <button key={df.value} onClick={() => { setDateFilter(df.value); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                dateFilter === df.value ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}>
              {df.label}
            </button>
          ))}
        </div>
      </div>

      {/* Result info */}
      {(stageFilter || dateFilter || search) && !isLoading && (
        <p className="text-xs text-gray-500">
          Showing <span className="text-white font-semibold">{data?.total || 0}</span> leads
          {stageFilter && <> in <span className="text-indigo-400">{PIPELINE.find(p => p.key === stageFilter)?.label}</span></>}
          {dateFilter && <> · {DATE_FILTERS.find(d => d.value === dateFilter)?.label}</>}
        </p>
      )}

      {/* Lead list */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
          <p className="text-sm text-gray-600">Loading leads...</p>
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-16 bg-dark-800 rounded-2xl border border-white/5">
          <Users className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No leads found</p>
          <p className="text-gray-600 text-sm mt-1">
            {search || stageFilter || dateFilter ? 'Try adjusting your filters' : 'Leads assigned by admin will appear here'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {leads.map(lead => (
            <LeadCard key={lead._id} lead={lead}
              onUpdated={() => qc.invalidateQueries({ queryKey: ['sales-leads'] })} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 rounded-xl text-sm bg-dark-800 border border-white/10 text-gray-400 hover:text-white disabled:opacity-40 transition-colors">
            Prev
          </button>
          <span className="px-4 py-2 text-sm text-gray-500">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-4 py-2 rounded-xl text-sm bg-dark-800 border border-white/10 text-gray-400 hover:text-white disabled:opacity-40 transition-colors">
            Next
          </button>
        </div>
      )}
    </div>
  )
}
