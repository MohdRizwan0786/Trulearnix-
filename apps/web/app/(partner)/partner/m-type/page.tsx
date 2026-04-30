'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { partnerAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { usePackages } from '@/lib/tiers'
import {
  Users, TrendingUp, Crown, Star, Copy, Check,
  ChevronDown, ChevronUp, Zap, Share2, Network,
  GitBranch, Layers, DollarSign, UserCheck
} from 'lucide-react'
import toast from 'react-hot-toast'

/* ── Tier config ── */
const TIER_GRAD: Record<string, string> = {
  free: 'from-gray-500 to-gray-600',
  starter: 'from-blue-500 to-blue-600',
  pro: 'from-purple-500 to-violet-600',
  elite: 'from-amber-500 to-orange-500',
  supreme: 'from-rose-500 to-pink-600',
}
const TIER_BADGE: Record<string, string> = {
  free: 'bg-gray-600/30 text-gray-300 border-gray-500/30',
  starter: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  pro: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  elite: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  supreme: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
}
const TIER_EMOJI: Record<string, string> = {
  free: '🌱', starter: '⚡', pro: '🚀', elite: '💎', supreme: '👑',
}

/* ── Level config ── */
const LEVELS = [
  {
    key: 'l1', n: 1, label: 'Level 1', sub: 'Your direct referrals',
    color: '#8b5cf6', hexLight: 'violet',
    grad: 'from-violet-600 to-violet-500',
    gradFull: 'from-violet-600/30 to-violet-500/10',
    ring: 'ring-violet-500/40',
    glow: 'shadow-violet-500/30',
    bg: 'bg-violet-500/8 border-violet-500/20',
    header: 'from-violet-900/60 to-violet-800/20',
    dot: 'bg-violet-500',
    dotGlow: 'shadow-violet-500',
    statColor: 'text-violet-400',
    connectorColor: 'from-violet-500/50 to-violet-400/20',
  },
  {
    key: 'l2', n: 2, label: 'Level 2', sub: 'Referrals of your Level 1',
    color: '#3b82f6', hexLight: 'blue',
    grad: 'from-blue-600 to-blue-500',
    gradFull: 'from-blue-600/30 to-blue-500/10',
    ring: 'ring-blue-500/40',
    glow: 'shadow-blue-500/30',
    bg: 'bg-blue-500/8 border-blue-500/20',
    header: 'from-blue-900/60 to-blue-800/20',
    dot: 'bg-blue-500',
    dotGlow: 'shadow-blue-500',
    statColor: 'text-blue-400',
    connectorColor: 'from-blue-500/50 to-blue-400/20',
  },
  {
    key: 'l3', n: 3, label: 'Level 3', sub: 'Referrals of your Level 2',
    color: '#06b6d4', hexLight: 'cyan',
    grad: 'from-cyan-600 to-cyan-500',
    gradFull: 'from-cyan-600/30 to-cyan-500/10',
    ring: 'ring-cyan-500/40',
    glow: 'shadow-cyan-500/30',
    bg: 'bg-cyan-500/8 border-cyan-500/20',
    header: 'from-cyan-900/60 to-cyan-800/20',
    dot: 'bg-cyan-500',
    dotGlow: 'shadow-cyan-500',
    statColor: 'text-cyan-400',
    connectorColor: 'from-cyan-500/50 to-cyan-400/20',
  },
]

function fmt(n: number) {
  if (n >= 100000) return '₹' + (n / 100000).toFixed(1) + 'L'
  if (n >= 1000) return '₹' + (n / 1000).toFixed(1) + 'K'
  return '₹' + n
}
function fmtFull(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

/* ── Skeleton ── */
function MTypeSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-48 animate-pulse rounded-2xl bg-dark-800" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-dark-800" />)}
      </div>
      <div className="h-28 animate-pulse rounded-2xl bg-dark-800" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-6 w-1 animate-pulse bg-dark-700 mx-auto" />
          <div className="h-16 animate-pulse rounded-2xl bg-dark-800" />
        </div>
      ))}
    </div>
  )
}

/* ── Member Card ── */
function MemberCard({ m }: { m: any }) {
  const { getName: getPkgName } = usePackages()
  const grad = TIER_GRAD[m.packageTier] || TIER_GRAD.free
  const badge = TIER_BADGE[m.packageTier] || TIER_BADGE.free
  const emoji = TIER_EMOJI[m.packageTier] || TIER_EMOJI.free
  return (
    <div className="flex items-center gap-2.5 bg-white/4 hover:bg-white/8 border border-white/8 hover:border-white/15 rounded-xl px-3 py-2.5 transition-all cursor-default group">
      {/* Avatar */}
      <div className={`relative w-9 h-9 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ring-1 ring-white/10`}>
        {m.name?.[0]?.toUpperCase()}
        {m.isAffiliate && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-violet-500 border border-dark-800 flex items-center justify-center">
            <Star className="w-2 h-2 text-white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="text-white/90 text-xs font-semibold truncate leading-tight group-hover:text-white transition-colors">
          {m.name}
        </p>
        <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full border mt-0.5 ${badge}`}>
          {emoji} {getPkgName(m.packageTier || 'free')}
        </span>
      </div>

      {/* Earnings */}
      {m.totalEarnings > 0 && (
        <div className="flex-shrink-0 text-right">
          <p className="text-green-400 text-xs font-bold">{fmt(m.totalEarnings)}</p>
          <p className="text-dark-500 text-[9px]">earned</p>
        </div>
      )}
    </div>
  )
}

/* ── Level Node ── */
function LevelNode({
  lv, members, earnings, idx
}: {
  lv: typeof LEVELS[0]; members: any[]; earnings: number; idx: number
}) {
  const [open, setOpen] = useState(idx === 0)
  const paid = members.filter(m => m.packageTier && m.packageTier !== 'free').length
  const totalMembers = members.length

  const stats = [
    { label: 'Members', value: totalMembers, color: lv.statColor },
    { label: 'Paid', value: paid, color: 'text-green-400' },
    { label: 'Earned', value: fmt(earnings), color: 'text-emerald-400' },
  ]

  return (
    <div className="relative flex flex-col items-center w-full">
      {/* Connector line + dot */}
      <div className="flex flex-col items-center">
        <div className={`w-px h-10 bg-gradient-to-b ${lv.connectorColor}`} />
        <div className="relative flex items-center justify-center">
          <div className={`absolute w-6 h-6 rounded-full ${lv.dot} opacity-20 animate-ping`} style={{ animationDuration: '3s' }} />
          <div className={`relative w-4 h-4 rounded-full ${lv.dot} ring-4 ${lv.ring} shadow-lg`} style={{ boxShadow: `0 0 12px ${lv.color}60` }} />
        </div>
        <div className={`w-px h-6 bg-gradient-to-b ${lv.connectorColor} opacity-50`} />
      </div>

      {/* Level card */}
      <div
        className={`w-full rounded-2xl border ${lv.bg} overflow-hidden`}
        style={{ boxShadow: `0 0 40px ${lv.color}12, 0 4px 20px rgba(0,0,0,0.3)` }}
      >
        {/* Card Header */}
        <button
          className={`w-full bg-gradient-to-r ${lv.header} px-4 sm:px-5 py-4 flex items-center justify-between gap-3 border-b border-white/5 transition-all hover:bg-white/5`}
          onClick={() => setOpen(v => !v)}
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* Level badge */}
            <div className={`flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${lv.grad} flex items-center justify-center shadow-lg`}
              style={{ boxShadow: `0 4px 12px ${lv.color}50` }}>
              <span className="text-white font-black text-sm">L{lv.n}</span>
            </div>
            <div className="text-left min-w-0">
              <p className="text-white font-bold text-sm leading-tight">{lv.label}</p>
              <p className="text-white/40 text-[11px] truncate">{lv.sub}</p>
            </div>
          </div>

          {/* Desktop stats */}
          <div className="hidden sm:flex items-center gap-5 flex-shrink-0">
            {stats.map(s => (
              <div key={s.label} className="text-center">
                <p className={`${s.color} font-black text-base leading-none`}>{s.value}</p>
                <p className="text-white/30 text-[10px] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Toggle */}
          <div className={`flex-shrink-0 w-7 h-7 rounded-lg bg-white/8 hover:bg-white/15 border border-white/8 flex items-center justify-center transition-all`}>
            {open
              ? <ChevronUp className="w-3.5 h-3.5 text-white/50" />
              : <ChevronDown className="w-3.5 h-3.5 text-white/50" />
            }
          </div>
        </button>

        {/* Mobile stats */}
        {open && (
          <div className="sm:hidden px-4 py-3 flex justify-around border-b border-white/5 bg-white/3">
            {stats.map(s => (
              <div key={s.label} className="text-center">
                <p className={`${s.color} font-black text-base leading-none`}>{s.value}</p>
                <p className="text-white/30 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Members grid */}
        {open && (
          <div className="p-4">
            {members.length === 0 ? (
              <div className="text-center py-12 flex flex-col items-center gap-3">
                <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${lv.gradFull} border ${lv.bg} flex items-center justify-center`}>
                  <Users className="w-6 h-6 text-white/20" />
                </div>
                <div>
                  <p className="text-white/30 text-sm font-semibold">No {lv.label} members yet</p>
                  <p className="text-white/15 text-xs mt-1">Share your partner code to grow</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {members.map((m: any) => <MemberCard key={m._id} m={m} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function MTypePage() {
  const { user } = useAuthStore()
  const [copied, setCopied] = useState(false)
  const { getName: getPkgName } = usePackages()

  const { data, isLoading } = useQuery({
    queryKey: ['partner-m-type'],
    queryFn: () => partnerAPI.mType().then(r => r.data),
  })

  const l1: any[] = data?.l1 || []
  const teamEarnings: any[] = data?.teamEarnings || []
  const getEarnings = (n: number) => teamEarnings.find((e: any) => e._id === n)?.total || 0
  const totalEarnings = getEarnings(1)
  const totalTeam = l1.length
  const VISIBLE_LEVELS = LEVELS.filter(lv => lv.key === 'l1')

  const copyCode = () => {
    navigator.clipboard.writeText(user?.affiliateCode || '')
    setCopied(true)
    toast.success('Partner code copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const shareCode = () => {
    const text = `Join TruLearnix with my code: ${user?.affiliateCode} 🚀`
    if (navigator.share) {
      navigator.share({ text, title: 'TruLearnix Partner Code' }).catch(() => {})
    } else {
      navigator.clipboard.writeText(text)
      toast.success('Share text copied!')
    }
  }

  if (isLoading) return (
    <div className="pb-24 sm:pb-8">
      <MTypeSkeleton />
    </div>
  )

  const heroStats = [
    {
      label: 'Total Team',
      value: totalTeam,
      icon: Users,
      color: 'text-violet-400',
      bg: 'from-violet-600/20 to-violet-500/5',
      border: 'border-violet-500/20',
      glow: 'shadow-violet-500/20',
    },
    {
      label: 'Total Earned',
      value: fmtFull(totalEarnings),
      icon: DollarSign,
      color: 'text-emerald-400',
      bg: 'from-emerald-600/20 to-emerald-500/5',
      border: 'border-emerald-500/20',
      glow: 'shadow-emerald-500/20',
    },
    {
      label: 'L1 Direct',
      value: l1.length,
      icon: Zap,
      color: 'text-amber-400',
      bg: 'from-amber-600/20 to-amber-500/5',
      border: 'border-amber-500/20',
      glow: 'shadow-amber-500/20',
    },
    {
      label: 'Depth',
      value: 'L1',
      icon: Layers,
      color: 'text-cyan-400',
      bg: 'from-cyan-600/20 to-cyan-500/5',
      border: 'border-cyan-500/20',
      glow: 'shadow-cyan-500/20',
    },
  ]

  return (
    <div className="space-y-4 pb-24 sm:pb-8">

      {/* ── Hero Section ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#130828] via-[#1e0a45] to-[#0a1530] border border-violet-500/20 p-5 sm:p-6">
        {/* Background decorations */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-violet-600/10 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-indigo-600/8 blur-3xl" />
          <div className="absolute top-1/2 right-1/4 w-24 h-24 rounded-full bg-purple-500/8 blur-2xl" />
          <Network className="absolute top-3 right-4 w-28 h-28 text-violet-500/5" />
        </div>

        <div className="relative">
          {/* Label */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <div className="flex items-center gap-1.5 bg-violet-500/15 border border-violet-500/25 px-2.5 py-1 rounded-full">
              <GitBranch className="w-3 h-3 text-violet-400" />
              <span className="text-violet-300 text-[11px] font-semibold">M-Type Network</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/8 px-2.5 py-1 rounded-full">
              <UserCheck className="w-3 h-3 text-green-400" />
              <span className="text-white/70 text-[11px] font-medium">{totalTeam} total members</span>
            </div>
          </div>

          <h1 className="text-white text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400">
              Referral Tree
            </span>
          </h1>
          <p className="text-violet-300/50 text-sm mt-1.5">
            Your direct referrals network
          </p>
        </div>
      </div>

      {/* ── Hero Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {heroStats.map(({ label, value, icon: Icon, color, bg, border, glow }) => (
          <div
            key={label}
            className={`relative overflow-hidden rounded-2xl border ${border} bg-gradient-to-br ${bg} p-4 shadow-lg ${glow}`}
          >
            <div className="pointer-events-none absolute top-0 right-0 w-16 h-16 rounded-full bg-white/3 blur-xl -translate-y-4 translate-x-4" />
            <div className="relative">
              <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${bg} border ${border} flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className={`${color} font-black text-xl leading-none truncate`}>{value}</p>
              <p className="text-white/40 text-xs mt-1.5 font-medium">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Partner Code Card ── */}
      <div className="relative overflow-hidden rounded-2xl border border-violet-500/25 bg-dark-800">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/8 to-purple-600/5" />
        <div className="relative p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
              <Star className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">Your Partner Code</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Code display */}
            <div className="flex-1 min-w-0 flex items-center gap-3 bg-dark-900/80 border border-violet-500/20 rounded-xl px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-dark-400 font-medium uppercase tracking-wider mb-0.5">Code</p>
                <p className="text-white font-black text-lg sm:text-xl font-mono tracking-widest truncate">
                  {user?.affiliateCode || '——'}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={copyCode}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border font-semibold text-sm transition-all active:scale-95 ${
                  copied
                    ? 'bg-green-500/15 border-green-500/30 text-green-400'
                    : 'bg-violet-500/15 border-violet-500/30 text-violet-300 hover:bg-violet-500/25'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
              </button>
              <button
                onClick={shareCode}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold text-sm transition-all active:scale-95 shadow-lg shadow-violet-500/30"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tree Visualization ── */}
      <div className="flex flex-col items-center w-full">

        {/* ROOT — You node */}
        <div className="relative w-full">
          {/* Outer glow */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-600/15 to-purple-600/15 blur-xl scale-105" />

          <div
            className="relative rounded-2xl border border-violet-500/35 bg-gradient-to-br from-[#1a0640] via-[#220852] to-[#150740] p-5 overflow-hidden"
            style={{ boxShadow: '0 0 50px #7c3aed25, 0 0 100px #7c3aed08' }}
          >
            {/* Background blobs */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-violet-500/10 blur-2xl" />
              <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-purple-500/8 blur-2xl" />
            </div>

            <div className="relative flex items-center gap-4">
              {/* Avatar with glow rings */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 rounded-full bg-violet-500/30 blur-lg scale-125" />
                <div className="absolute inset-0 rounded-full ring-1 ring-violet-400/20 scale-150" />
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-2xl font-black ring-2 ring-violet-400/50 shadow-xl">
                  {user?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center ring-2 ring-dark-900 shadow-lg">
                  <Crown className="w-3.5 h-3.5 text-white" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="text-white font-black text-lg leading-none">{user?.name}</p>
                  <span className="text-[10px] bg-violet-500/20 border border-violet-500/30 text-violet-400 px-2 py-0.5 rounded-full font-bold">ROOT</span>
                </div>
                <p className="text-violet-300/60 text-xs mb-2">
                  {getPkgName(user?.packageTier || 'free')} Plan · Network Root
                </p>
                {/* Quick stats */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-violet-400" />
                    <span className="text-violet-300 text-xs font-bold">{totalTeam}</span>
                    <span className="text-dark-400 text-xs">team</span>
                  </div>
                  <div className="w-px h-3 bg-dark-600" />
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-green-400" />
                    <span className="text-green-400 text-xs font-bold">{fmt(totalEarnings)}</span>
                    <span className="text-dark-400 text-xs">earned</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Level nodes */}
        {VISIBLE_LEVELS.map((lv, i) => (
          <LevelNode
            key={lv.key}
            lv={lv}
            members={data?.[lv.key] || []}
            earnings={getEarnings(lv.n)}
            idx={i}
          />
        ))}

        {/* Bottom cap */}
        <div className="flex flex-col items-center mt-3 opacity-30">
          <div className="w-px h-8 bg-gradient-to-b from-cyan-500/40 to-transparent" />
          <div className="w-2 h-2 rounded-full bg-cyan-500/40" />
          <p className="text-dark-600 text-[10px] mt-2 font-medium">End of network</p>
        </div>
      </div>
    </div>
  )
}
