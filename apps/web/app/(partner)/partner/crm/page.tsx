'use client'
import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { partnerAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import {
  Users, Plus, Search, Phone, Mail, Calendar, Tag, X,
  Link2, Copy, Check, ChevronDown, Flame, Zap, Target,
  TrendingUp, MessageCircle, Filter, UserPlus,
  ExternalLink, Share2, Sparkles, Clock, CheckCircle2,
  SlidersHorizontal, Loader2, ArrowUpRight, BarChart3,
  Star, Percent, Activity
} from 'lucide-react'
import toast from 'react-hot-toast'

/* ─────────── Stage config ─────────── */
const STAGES = [
  { key: 'all',         label: 'All',         color: 'text-white',         bg: 'bg-white/10',          border: 'border-white/20',          dot: 'bg-gray-400',    ring: 'ring-white/20'         },
  { key: 'new',         label: 'New',          color: 'text-blue-300',      bg: 'bg-blue-500/15',       border: 'border-blue-500/30',       dot: 'bg-blue-400',    ring: 'ring-blue-500/30'      },
  { key: 'contacted',   label: 'Contacted',    color: 'text-yellow-300',    bg: 'bg-yellow-500/15',     border: 'border-yellow-500/30',     dot: 'bg-yellow-400',  ring: 'ring-yellow-500/30'    },
  { key: 'interested',  label: 'Interested',   color: 'text-violet-300',    bg: 'bg-violet-500/15',     border: 'border-violet-500/30',     dot: 'bg-violet-400',  ring: 'ring-violet-500/30'    },
  { key: 'demo_done',   label: 'Demo Done',    color: 'text-orange-300',    bg: 'bg-orange-500/15',     border: 'border-orange-500/30',     dot: 'bg-orange-400',  ring: 'ring-orange-500/30'    },
  { key: 'negotiating', label: 'Negotiating',  color: 'text-amber-300',     bg: 'bg-amber-500/15',      border: 'border-amber-500/30',      dot: 'bg-amber-400',   ring: 'ring-amber-500/30'     },
  { key: 'paid',        label: 'Converted',    color: 'text-green-300',     bg: 'bg-green-500/15',      border: 'border-green-500/30',      dot: 'bg-green-400',   ring: 'ring-green-500/30'     },
  { key: 'lost',        label: 'Lost',         color: 'text-red-300',       bg: 'bg-red-500/15',        border: 'border-red-500/30',        dot: 'bg-red-400',     ring: 'ring-red-500/30'       },
]
const getStage = (k: string) => STAGES.find(s => s.key === k) || STAGES[1]

const STAGE_BORDER_HEX: Record<string, string> = {
  all: '#6b7280', new: '#60a5fa', contacted: '#facc15', interested: '#a78bfa',
  demo_done: '#fb923c', negotiating: '#fbbf24', paid: '#4ade80', lost: '#f87171',
}

const AVATAR_GRADIENTS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-500',
  'from-amber-500 to-orange-500',
  'from-pink-500 to-rose-600',
  'from-emerald-500 to-green-600',
  'from-sky-500 to-blue-600',
  'from-fuchsia-500 to-pink-600',
]

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getInitials(name: string) {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  return parts.length > 1
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0][0].toUpperCase()
}

function getAvatarGrad(name: string) {
  const code = (name || '?').charCodeAt(0)
  return AVATAR_GRADIENTS[code % AVATAR_GRADIENTS.length]
}

/* ─────────── Stage Dropdown ─────────── */
function StageDropdown({ lead, onUpdate }: { lead: any; onUpdate: (id: string, stage: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const s = getStage(lead.stage || 'new')

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-full border transition-all active:scale-95 ${s.bg} ${s.border} ${s.color}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${s.dot} flex-shrink-0`} />
        {s.label}
        <ChevronDown className={`w-2.5 h-2.5 opacity-70 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-40 bg-dark-800 border border-dark-600 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden min-w-[150px] backdrop-blur-xl">
          <div className="p-1.5">
            {STAGES.filter(st => st.key !== 'all').map(st => (
              <button
                key={st.key}
                onClick={() => { onUpdate(lead._id, st.key); setOpen(false) }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all hover:bg-dark-700 ${lead.stage === st.key ? st.color + ' font-bold bg-dark-700' : 'text-dark-300 font-medium'}`}
              >
                <span className={`w-2 h-2 rounded-full ${st.dot} flex-shrink-0`} />
                {st.label}
                {lead.stage === st.key && <CheckCircle2 className="w-3 h-3 ml-auto text-current opacity-80" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─────────── Skeleton ─────────── */
function LeadSkeleton() {
  return (
    <div className="bg-dark-800 rounded-2xl border border-dark-700 p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-dark-700 flex-shrink-0" />
        <div className="flex-1 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="h-4 bg-dark-700 rounded-lg w-36" />
            <div className="h-6 bg-dark-700 rounded-full w-20" />
          </div>
          <div className="h-3 bg-dark-700 rounded w-28" />
          <div className="h-3 bg-dark-700 rounded w-44" />
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-dark-700 flex gap-2">
        <div className="h-7 bg-dark-700 rounded-lg w-24" />
        <div className="h-7 bg-dark-700 rounded-lg w-16" />
      </div>
    </div>
  )
}

/* ─────────── Lead Card ─────────── */
function LeadCard({ lead, onUpdate }: { lead: any; onUpdate: (id: string, stage: string) => void }) {
  const s = getStage(lead.stage || 'new')
  const initials = getInitials(lead.name)
  const grad = getAvatarGrad(lead.name)
  const lastNote = lead.notes?.length > 0 ? lead.notes[lead.notes.length - 1]?.text : null

  return (
    <div className="group bg-dark-800 rounded-2xl border border-dark-700 transition-all duration-200 overflow-hidden hover:border-dark-500 hover:shadow-lg hover:shadow-black/30 hover:-translate-y-0.5"
      style={{ borderLeft: `4px solid ${STAGE_BORDER_HEX[lead.stage || 'new']}` }}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-lg ring-2 ring-white/10`}>
            {initials}
          </div>

          {/* Main info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <p className="text-white font-bold text-sm leading-snug">{lead.name}</p>
              <StageDropdown lead={lead} onUpdate={onUpdate} />
            </div>

            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
              {lead.phone && (
                <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 text-dark-300 hover:text-white text-xs transition-colors group/link">
                  <Phone className="w-3 h-3 text-dark-500 group-hover/link:text-violet-400" />
                  {lead.phone}
                </a>
              )}
              {lead.email && (
                <span className="flex items-center gap-1.5 text-dark-400 text-xs">
                  <Mail className="w-3 h-3 text-dark-500" />
                  <span className="truncate max-w-[160px]">{lead.email}</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
              {lead.source && (
                <span className="flex items-center gap-1 text-dark-500 text-[11px]">
                  <Tag className="w-2.5 h-2.5" />
                  {lead.source}
                </span>
              )}
              {lead.createdAt && (
                <span className="flex items-center gap-1 text-dark-500 text-[11px]">
                  <Calendar className="w-2.5 h-2.5" />
                  {fmt(lead.createdAt)}
                </span>
              )}
              {lead.city && (
                <span className="text-dark-500 text-[11px]">{lead.city}</span>
              )}
            </div>

            {lastNote && (
              <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-dark-700/60 border border-dark-600">
                <p className="text-dark-400 text-[11px] italic line-clamp-1">"{lastNote}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Action bar */}
        {lead.phone && (
          <div className="mt-3 pt-3 border-t border-dark-700/80 flex items-center gap-2">
            <a
              href={`https://wa.me/91${lead.phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25d366]/10 border border-[#25d366]/20 text-[#25d366] text-[11px] font-bold hover:bg-[#25d366]/20 transition-all active:scale-95"
            >
              <MessageCircle className="w-3 h-3" />
              WhatsApp
            </a>
            <a
              href={`tel:${lead.phone}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-bold hover:bg-blue-500/20 transition-all active:scale-95"
            >
              <Phone className="w-3 h-3" />
              Call
            </a>
            <div className={`ml-auto flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg ${s.bg} ${s.color} border ${s.border}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              {s.label}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─────────── Input helper ─────────── */
function FormInput({ label, value, onChange, placeholder, icon: Icon, type = 'text' }: any) {
  return (
    <div>
      <label className="text-dark-300 text-xs font-semibold mb-1.5 block">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-500" />
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-dark-700/80 border border-dark-600 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-dark-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 text-sm transition-all"
        />
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════ */
export default function CRMPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()

  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [showCapture, setShowCapture] = useState(false)
  const [copied, setCopied] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '', stage: 'new', source: 'manual' })

  const affiliateCode = (user as any)?.affiliateCode || ''
  const captureLink = affiliateCode
    ? `${typeof window !== 'undefined' ? window.location.origin : 'https://peptly.in'}/capture-lead?ref=${affiliateCode}`
    : ''

  const { data, isLoading } = useQuery({
    queryKey: ['partner-crm', stageFilter],
    queryFn: () => partnerAPI.crm(stageFilter !== 'all' ? { stage: stageFilter } : {}).then(r => r.data),
  })

  const addLead = useMutation({
    mutationFn: (d: any) => partnerAPI.addLead(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partner-crm'] })
      setShowAdd(false)
      setForm({ name: '', phone: '', email: '', notes: '', stage: 'new', source: 'manual' })
      toast.success('Lead added successfully!')
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to add lead'),
  })

  const updateLead = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) => partnerAPI.updateLead(id, { stage }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partner-crm'] })
      toast.success('Stage updated!')
    },
    onError: () => toast.error('Failed to update stage'),
  })

  const leads = (data?.leads || []).filter((l: any) =>
    !search ||
    l.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.phone?.includes(search) ||
    l.email?.toLowerCase().includes(search.toLowerCase())
  )

  const counts = data?.stageCounts || {}
  const total = (Object.values(counts) as number[]).reduce((a, b) => a + b, 0)
  const converted = counts['paid'] || 0
  const convRate = total > 0 ? Math.round((converted / total) * 100) : 0

  const handleCopy = () => {
    if (!captureLink) return
    navigator.clipboard.writeText(captureLink).then(() => {
      setCopied(true)
      toast.success('Link copied!')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleShare = () => {
    if (navigator.share && captureLink) {
      navigator.share({ title: 'Join TruLearnix', text: 'Fill this form to get a free callback!', url: captureLink })
    } else {
      handleCopy()
    }
  }

  return (
    <div className="space-y-5 pb-24 sm:pb-8">

      {/* ══════════ HERO ══════════ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#120428] via-[#1e0545] to-[#0a1240] border border-violet-500/25 p-5 sm:p-7">
        {/* BG blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full bg-violet-600/20 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-indigo-600/15 blur-3xl" />
          <div className="absolute top-1/2 right-1/4 w-24 h-24 rounded-full bg-purple-500/10 blur-2xl" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'linear-gradient(rgba(139,92,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="relative">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 bg-violet-500/15 border border-violet-400/25 px-3 py-1 rounded-full mb-3">
            <Target className="w-3 h-3 text-violet-300" />
            <span className="text-violet-200 text-[11px] font-bold tracking-wide uppercase">Lead Management</span>
          </div>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-white text-2xl sm:text-3xl font-black tracking-tight">
                CRM
                <span className="ml-2 text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-300">Dashboard</span>
              </h1>
              <p className="text-violet-300/60 text-sm mt-1">Capture, nurture &amp; convert your leads</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowCapture(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs shadow-lg shadow-amber-500/25 hover:opacity-90 active:scale-95 transition-all"
              >
                <Link2 className="w-3.5 h-3.5" />
                Capture Link
              </button>
              <button
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-xs shadow-lg shadow-violet-500/25 hover:opacity-90 active:scale-95 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Lead
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-xl bg-violet-500/20 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <span className="text-dark-400 text-[11px] font-semibold uppercase tracking-wide">Total</span>
              </div>
              <p className="text-white text-xl font-black">{total as number}</p>
              <p className="text-dark-500 text-[11px] mt-0.5">All leads</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                </div>
                <span className="text-dark-400 text-[11px] font-semibold uppercase tracking-wide">Converted</span>
              </div>
              <p className="text-green-300 text-xl font-black">{converted}</p>
              <p className="text-dark-500 text-[11px] mt-0.5">Paid leads</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Percent className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <span className="text-dark-400 text-[11px] font-semibold uppercase tracking-wide">Rate</span>
              </div>
              <p className="text-amber-300 text-xl font-black">{convRate}%</p>
              <p className="text-dark-500 text-[11px] mt-0.5">Conversion</p>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ STAGE FILTER TABS ══════════ */}
      <div className="relative">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide snap-x">
          {STAGES.map(s => {
            const count = s.key === 'all' ? total : (counts[s.key] || 0)
            const active = stageFilter === s.key
            return (
              <button
                key={s.key}
                onClick={() => setStageFilter(s.key)}
                className={`snap-start flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2.5 rounded-2xl border text-center transition-all active:scale-95 min-w-[72px]
                  ${active
                    ? `${s.bg} ${s.border} shadow-lg`
                    : 'bg-dark-800 border-dark-700 hover:border-dark-600'
                  }`}
              >
                {active && <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${s.dot} rounded-b-2xl opacity-80`} />}
                <span className={`text-base font-black leading-none ${active ? s.color : 'text-white'}`}>
                  {count as number}
                </span>
                <span className={`text-[9px] font-bold leading-tight ${active ? s.color : 'text-dark-500'}`}>
                  {s.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ══════════ SEARCH ══════════ */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400 pointer-events-none" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, phone or email..."
          className="w-full bg-dark-800 border border-dark-700 rounded-2xl pl-10 pr-4 py-3 text-white placeholder-dark-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 text-sm transition-all"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-dark-600 flex items-center justify-center text-dark-400 hover:text-white transition-colors">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* ══════════ LEAD LIST ══════════ */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <LeadSkeleton key={i} />)}
        </div>
      ) : leads.length === 0 ? (
        <div className="relative overflow-hidden bg-dark-800 rounded-3xl border border-dark-700 py-16 text-center px-6">
          {/* Subtle gradient */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-violet-500/5 to-transparent" />
          <div className="pointer-events-none absolute inset-0"
            style={{ backgroundImage: 'radial-gradient(circle at center, rgba(139,92,246,0.06) 0%, transparent 70%)' }} />
          <div className="relative">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/30 animate-pulse" />
              <div className="w-full h-full rounded-3xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <Users className="w-8 h-8 text-violet-500/50" />
              </div>
            </div>
            <p className="text-white font-bold text-base">
              {search ? `No leads match "${search}"` : stageFilter !== 'all' ? `No ${getStage(stageFilter).label} leads yet` : 'No leads yet'}
            </p>
            <p className="text-dark-500 text-sm mt-1.5 max-w-xs mx-auto leading-relaxed">
              {search ? 'Try a different search term' : 'Share your capture link or add leads manually to get started'}
            </p>
            {!search && (
              <div className="flex items-center justify-center gap-2 mt-5">
                <button onClick={() => setShowCapture(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs shadow-lg shadow-amber-500/20 hover:opacity-90 active:scale-95 transition-all">
                  <Link2 className="w-3.5 h-3.5" />
                  Get Capture Link
                </button>
                <button onClick={() => setShowAdd(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-dark-700 border border-dark-600 text-white font-semibold text-xs hover:bg-dark-600 active:scale-95 transition-all">
                  <Plus className="w-3.5 h-3.5" />
                  Add Manually
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {search && (
            <p className="text-dark-400 text-xs px-1">
              Found <span className="text-white font-semibold">{leads.length}</span> lead{leads.length !== 1 ? 's' : ''}
            </p>
          )}
          {leads.map((lead: any) => (
            <LeadCard
              key={lead._id}
              lead={lead}
              onUpdate={(id, stage) => updateLead.mutate({ id, stage })}
            />
          ))}
        </div>
      )}

      {/* ══════════ FLOATING ACTION BUTTON ══════════ */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-28 right-5 sm:bottom-8 sm:right-6 z-30 w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 text-white shadow-2xl shadow-violet-500/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all hover:shadow-violet-500/60"
        aria-label="Add Lead"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* ══════════ CAPTURE LEAD MODAL ══════════ */}
      {showCapture && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/75 backdrop-blur-md"
          onClick={() => setShowCapture(false)}
        >
          <div
            className="bg-dark-800 rounded-3xl border border-dark-600 w-full max-w-md overflow-hidden shadow-2xl shadow-black/60"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-transparent border-b border-amber-500/20 px-5 py-4">
              <div className="pointer-events-none absolute -top-4 -right-4 w-24 h-24 rounded-full bg-amber-500/15 blur-2xl" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <Link2 className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">Capture Lead Link</p>
                    <p className="text-amber-300/70 text-xs">Share with potential clients</p>
                  </div>
                </div>
                <button onClick={() => setShowCapture(false)}
                  className="w-8 h-8 rounded-xl bg-dark-700 border border-dark-600 flex items-center justify-center text-dark-400 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Steps */}
              <div className="space-y-2">
                {[
                  { n: '1', text: 'Share the link on WhatsApp, Instagram, or anywhere' },
                  { n: '2', text: 'Client fills their name, phone, and email' },
                  { n: '3', text: 'Lead instantly appears in your CRM automatically' },
                ].map(({ n, text }) => (
                  <div key={n} className="flex items-start gap-3 p-2.5 rounded-xl bg-dark-700/50">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0 mt-0.5">{n}</div>
                    <p className="text-dark-300 text-xs leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>

              {/* Link display */}
              <div className="bg-dark-900 border border-dark-600 rounded-2xl p-3 flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-dark-500 text-[10px] font-semibold uppercase tracking-wide mb-0.5">Your unique capture link</p>
                  <p className="text-violet-300 text-xs font-mono truncate">
                    {captureLink || 'Complete KYC to unlock your capture link'}
                  </p>
                </div>
                <button
                  onClick={handleCopy}
                  disabled={!captureLink}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all border
                    ${copied ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-dark-700 border-dark-600 text-dark-300 hover:text-white hover:border-dark-500'}`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleCopy}
                  disabled={!captureLink}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-dark-700 border border-dark-600 hover:bg-dark-600 text-white font-semibold text-xs transition-all disabled:opacity-40 active:scale-95"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
                <button
                  onClick={handleShare}
                  disabled={!captureLink}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs shadow-lg shadow-amber-500/20 hover:opacity-90 transition-all disabled:opacity-40 active:scale-95"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Share Now
                </button>
              </div>

              {captureLink && (
                <a
                  href={captureLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 text-dark-500 hover:text-violet-400 text-xs transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Preview the form
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════ ADD LEAD MODAL ══════════ */}
      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/75 backdrop-blur-md"
          onClick={() => setShowAdd(false)}
        >
          <div
            className="bg-dark-800 rounded-3xl border border-dark-600 w-full max-w-md overflow-hidden shadow-2xl shadow-black/60"
            onClick={e => e.stopPropagation()}
            style={{ maxHeight: '92vh', overflowY: 'auto' }}
          >
            {/* Modal header */}
            <div className="sticky top-0 bg-dark-800 border-b border-dark-700 px-5 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-md shadow-violet-500/30">
                  <UserPlus className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Add Lead Manually</p>
                  <p className="text-dark-500 text-xs">Fill in the details below</p>
                </div>
              </div>
              <button
                onClick={() => setShowAdd(false)}
                className="w-8 h-8 rounded-xl bg-dark-700 border border-dark-600 flex items-center justify-center text-dark-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <FormInput
                label="Full Name *"
                value={form.name}
                onChange={(e: any) => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Enter full name"
                icon={Users}
              />
              <FormInput
                label="Phone Number *"
                value={form.phone}
                onChange={(e: any) => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+91 XXXXX XXXXX"
                icon={Phone}
                type="tel"
              />
              <FormInput
                label="Email Address"
                value={form.email}
                onChange={(e: any) => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="email@example.com"
                icon={Mail}
                type="email"
              />

              {/* Stage selector */}
              <div>
                <label className="text-dark-300 text-xs font-semibold mb-1.5 block">Stage</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {STAGES.filter(s => s.key !== 'all').map(s => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, stage: s.key }))}
                      className={`flex flex-col items-center gap-1 py-2 rounded-xl border text-center transition-all text-[10px] font-bold active:scale-95
                        ${form.stage === s.key ? `${s.bg} ${s.border} ${s.color}` : 'bg-dark-700 border-dark-600 text-dark-400 hover:border-dark-500'}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Source */}
              <div>
                <label className="text-dark-300 text-xs font-semibold mb-1.5 block">Source</label>
                <div className="relative">
                  <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-500" />
                  <select
                    value={form.source}
                    onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                    className="w-full bg-dark-700/80 border border-dark-600 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-violet-500 text-sm appearance-none transition-all"
                  >
                    <option value="manual">Manual Entry</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="referral">Referral</option>
                    <option value="call">Phone Call</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-dark-300 text-xs font-semibold mb-1.5 block">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Add any notes about this lead..."
                  rows={3}
                  className="w-full bg-dark-700/80 border border-dark-600 rounded-xl px-4 py-2.5 text-white placeholder-dark-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 text-sm resize-none transition-all"
                />
              </div>

              {/* Submit */}
              <div className="flex gap-2.5 pt-1">
                <button
                  onClick={() => setShowAdd(false)}
                  className="flex-1 py-3 rounded-xl bg-dark-700 border border-dark-600 text-dark-300 hover:bg-dark-600 transition-all text-sm font-semibold active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={() => addLead.mutate({ ...form, notes: form.notes ? [{ text: form.notes }] : undefined })}
                  disabled={!form.name || !form.phone || addLead.isPending}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-sm shadow-lg shadow-violet-500/25 hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
                >
                  {addLead.isPending
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding...</>
                    : <><Plus className="w-4 h-4" /> Add Lead</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
