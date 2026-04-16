'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { partnerAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import {
  Trophy, Crown, Users, TrendingUp, Flame, Award,
  ChevronUp, Sparkles, Clock, Calendar, CalendarDays,
  BarChart3, Star, Medal, Zap, Target
} from 'lucide-react'

/* ── Period config ── */
const PERIODS = [
  { key: '24h',     label: '24h',       sublabel: 'Today',      Icon: Clock,        grad: 'from-cyan-500 to-blue-500',      glow: 'shadow-cyan-500/30',    text: 'text-cyan-400',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/30',    activeBg: 'bg-cyan-500' },
  { key: 'week',    label: 'Week',      sublabel: 'This Week',  Icon: CalendarDays, grad: 'from-violet-500 to-purple-600',  glow: 'shadow-violet-500/30',  text: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/30',  activeBg: 'bg-violet-500' },
  { key: 'month',   label: 'Month',     sublabel: 'This Month', Icon: Calendar,     grad: 'from-amber-500 to-orange-500',   glow: 'shadow-amber-500/30',   text: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   activeBg: 'bg-amber-500' },
  { key: 'quarter', label: 'Quarter',   sublabel: 'This Qtr',   Icon: BarChart3,    grad: 'from-pink-500 to-rose-600',      glow: 'shadow-pink-500/30',    text: 'text-pink-400',    bg: 'bg-pink-500/10',    border: 'border-pink-500/30',    activeBg: 'bg-pink-500' },
  { key: 'year',    label: 'Year',      sublabel: 'This Year',  Icon: TrendingUp,   grad: 'from-emerald-500 to-green-600',  glow: 'shadow-emerald-500/30', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', activeBg: 'bg-emerald-500' },
  { key: 'all',     label: 'All Time',  sublabel: 'Ever',       Icon: Star,         grad: 'from-yellow-400 to-amber-500',   glow: 'shadow-yellow-400/30',  text: 'text-yellow-400',  bg: 'bg-yellow-400/10',  border: 'border-yellow-400/30',  activeBg: 'bg-yellow-400' },
]

/* ── Tier config ── */
const TIER: Record<string, { grad: string; ring: string; badge: string; emoji: string; label: string }> = {
  free:    { grad: 'from-slate-500 to-gray-600',    ring: 'ring-slate-500/40',  badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30',   emoji: '🌱', label: 'Free'    },
  starter: { grad: 'from-blue-500 to-cyan-500',     ring: 'ring-blue-500/40',   badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30',      emoji: '⚡', label: 'Starter' },
  pro:     { grad: 'from-purple-500 to-violet-600', ring: 'ring-purple-500/40', badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30', emoji: '🚀', label: 'Pro'     },
  elite:   { grad: 'from-amber-500 to-orange-500',  ring: 'ring-amber-500/40',  badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',   emoji: '💎', label: 'Elite'   },
  supreme: { grad: 'from-rose-500 to-pink-600',     ring: 'ring-rose-500/40',   badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',      emoji: '👑', label: 'Supreme' },
}
const getTier = (t?: string) => TIER[t || 'free'] || TIER.free

function fmtMoney(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}k`
  return `₹${n}`
}

/* ── Skeleton ── */
function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-dark-800 ${className}`} />
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-4">
      <SkeletonBlock className="h-52 w-full" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {[...Array(6)].map((_, i) => <SkeletonBlock key={i} className="h-16" />)}
      </div>
      <SkeletonBlock className="h-20" />
      <div className="space-y-2">
        {[...Array(7)].map((_, i) => <SkeletonBlock key={i} className="h-16" />)}
      </div>
    </div>
  )
}

/* ── Empty state ── */
function EmptyState({ period }: { period: string }) {
  return (
    <div className="py-20 flex flex-col items-center gap-4 px-6 text-center">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-violet-500/10 blur-2xl scale-150" />
        <div className="relative w-20 h-20 rounded-full bg-dark-700 border border-dark-600 flex items-center justify-center">
          <Trophy className="w-8 h-8 text-dark-500" />
        </div>
      </div>
      <div>
        <p className="text-white font-bold text-lg">No rankings yet</p>
        <p className="text-dark-400 text-sm mt-1">Be the first to earn for this period</p>
        <p className="text-dark-600 text-xs mt-1">Period: {period}</p>
      </div>
      <div className="flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-2">
        <Zap className="w-4 h-4 text-violet-400" />
        <span className="text-violet-300 text-sm font-medium">Start referring to climb the ranks</span>
      </div>
    </div>
  )
}

/* ── Podium Section ── */
function PodiumSection({ top3, periodCfg }: { top3: any[]; periodCfg: typeof PERIODS[0] }) {
  if (top3.length < 1) return null

  // podium order: 2nd | 1st | 3rd
  const podium = [top3[1], top3[0], top3[2]]
  const podiumRanks = [2, 1, 3]
  const podiumHeights = ['h-24', 'h-36', 'h-16']
  const podiumConfig = [
    {
      name: '2nd Place',
      color: 'text-slate-300',
      glow: 'shadow-slate-400/20',
      platBg: 'bg-gradient-to-b from-slate-500/30 to-slate-600/10',
      platBorder: 'border-slate-500/30',
      ring: 'ring-2 ring-slate-400/40',
      crown: null,
      medal: <Medal className="w-4 h-4 text-slate-400" />,
    },
    {
      name: '1st Place',
      color: 'text-yellow-300',
      glow: 'shadow-yellow-400/30',
      platBg: 'bg-gradient-to-b from-yellow-500/25 to-yellow-600/5',
      platBorder: 'border-yellow-500/40',
      ring: 'ring-2 ring-yellow-400/60',
      crown: <Crown className="w-6 h-6 text-yellow-400 drop-shadow-lg" style={{ filter: 'drop-shadow(0 0 8px #facc15)' }} />,
      medal: null,
    },
    {
      name: '3rd Place',
      color: 'text-amber-500',
      glow: 'shadow-amber-600/20',
      platBg: 'bg-gradient-to-b from-amber-700/25 to-amber-800/5',
      platBorder: 'border-amber-600/30',
      ring: 'ring-2 ring-amber-600/40',
      crown: null,
      medal: <Award className="w-4 h-4 text-amber-600" />,
    },
  ]

  return (
    <div className="relative overflow-hidden rounded-2xl border border-dark-700 bg-dark-800 p-5">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-yellow-400/5 blur-3xl rounded-full" />
        <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-dark-900/50 to-transparent" />
      </div>

      <div className="relative">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-yellow-500/15 border border-yellow-500/20 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm">Top 3 Champions</h2>
              <p className={`text-[10px] ${periodCfg.text} font-medium`}>{periodCfg.sublabel}</p>
            </div>
          </div>
          <div className={`text-[10px] font-bold ${periodCfg.text} ${periodCfg.bg} ${periodCfg.border} border px-2.5 py-1 rounded-full uppercase tracking-wider`}>
            {periodCfg.label}
          </div>
        </div>

        {/* Podium */}
        <div className="flex items-end justify-center gap-3 sm:gap-5 px-2">
          {podium.map((entry, i) => {
            const cfg = podiumConfig[i]
            const rank = podiumRanks[i]
            if (!entry) {
              return (
                <div key={`empty-${i}`} className="flex-1 flex flex-col items-center gap-2 opacity-30">
                  <div className="w-12 h-12 rounded-full bg-dark-700 border-2 border-dashed border-dark-600 flex items-center justify-center">
                    <span className="text-dark-500 text-lg font-black">?</span>
                  </div>
                  <div className={`w-full ${podiumHeights[i]} ${cfg.platBg} border ${cfg.platBorder} rounded-t-xl`} />
                </div>
              )
            }
            const t = getTier(entry.packageTier)
            const earnings = entry.periodEarnings ?? entry.totalEarnings ?? 0

            return (
              <div key={entry._id} className="flex-1 flex flex-col items-center gap-2">
                {/* Crown or medal */}
                <div className="h-8 flex items-end justify-center">
                  {cfg.crown}
                  {cfg.medal && <div className="mb-1">{cfg.medal}</div>}
                </div>

                {/* Avatar */}
                <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br ${t.grad} flex items-center justify-center text-white font-black text-lg mx-auto ${cfg.ring} ${rank === 1 ? `shadow-xl ${cfg.glow}` : ''}`}>
                  {entry.name?.[0]?.toUpperCase() || '?'}
                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-black border-2 border-dark-800 ${rank === 1 ? 'bg-yellow-400' : rank === 2 ? 'bg-slate-500' : 'bg-amber-700'}`}>
                    {rank}
                  </div>
                </div>

                {/* Info */}
                <div className="text-center w-full px-1">
                  <p className="text-white text-xs font-bold truncate leading-tight">{entry.name?.split(' ')[0]}</p>
                  <p className={`text-sm font-black ${cfg.color} mt-0.5`}>{fmtMoney(earnings)}</p>
                  <span className={`inline-flex text-[9px] font-semibold px-1.5 py-0.5 rounded-full border mt-1 ${t.badge}`}>
                    {t.emoji} {t.label}
                  </span>
                  {rank === 1 && (
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Sparkles className="w-2.5 h-2.5 text-yellow-400" />
                      <span className="text-yellow-400 text-[9px] font-semibold">Top Earner</span>
                    </div>
                  )}
                </div>

                {/* Platform */}
                <div className={`w-full ${podiumHeights[i]} ${cfg.platBg} border-t border-x ${cfg.platBorder} rounded-t-xl flex items-center justify-center relative overflow-hidden`}>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
                  <span className={`font-black text-3xl opacity-10 ${cfg.color}`}>{rank}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function LeaderboardPage() {
  const { user } = useAuthStore()
  const [period, setPeriod] = useState('all')
  const periodCfg = PERIODS.find(p => p.key === period) || PERIODS[5]
  const PeriodIcon = periodCfg.Icon

  const { data, isLoading } = useQuery({
    queryKey: ['partner-leaderboard', period],
    queryFn: () => partnerAPI.leaderboard(period).then(r => r.data),
    staleTime: 60000,
  })

  const leaderboard: any[] = data?.leaderboard || []
  const myRank: number = data?.myRank || 0
  const myPeriodEarnings: number = data?.myPeriodEarnings ?? data?.me?.totalEarnings ?? 0
  const top3 = leaderboard.slice(0, 3)
  const maxEarnings = (leaderboard[0]?.periodEarnings ?? leaderboard[0]?.totalEarnings ?? 0) || 1

  return (
    <div className="space-y-4 pb-24 sm:pb-8">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#160930] via-[#240d55] to-[#0d1840] border border-violet-500/25 p-5 sm:p-6">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-violet-600/15 blur-3xl" />
          <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-indigo-600/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-purple-500/8 blur-2xl" />
          {/* Watermark trophy */}
          <div className="absolute top-0 right-2 text-[120px] leading-none opacity-[0.04] select-none font-black text-white">🏆</div>
        </div>

        <div className="relative">
          {/* Live badge */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <div className="flex items-center gap-1.5 bg-red-500/15 border border-red-500/25 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-300 text-[11px] font-bold tracking-wide">LIVE</span>
            </div>
            <div className="flex items-center gap-1.5 bg-yellow-400/10 border border-yellow-400/20 px-2.5 py-1 rounded-full">
              <Flame className="w-3 h-3 text-yellow-400" />
              <span className="text-yellow-300 text-[11px] font-semibold">Rankings Active</span>
            </div>
          </div>

          <h1 className="text-white text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Partner{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400">
              Leaderboard
            </span>
          </h1>
          <p className="text-violet-300/50 text-sm mt-1.5 leading-relaxed">
            Top earners across the TruLearnix Partner Network
          </p>

          {/* Stats row */}
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/8 rounded-xl px-3 py-1.5 backdrop-blur-sm">
              <Users className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-white/80 text-xs font-medium">{leaderboard.length} Partners</span>
            </div>
            {leaderboard[0] && (
              <div className="flex items-center gap-1.5 bg-yellow-400/8 border border-yellow-400/15 rounded-xl px-3 py-1.5 backdrop-blur-sm">
                <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-yellow-300/90 text-xs font-medium">
                  Top: {fmtMoney(leaderboard[0].periodEarnings ?? leaderboard[0].totalEarnings ?? 0)}
                </span>
              </div>
            )}
            {myRank > 0 && (
              <div className="flex items-center gap-1.5 bg-violet-500/15 border border-violet-500/25 rounded-xl px-3 py-1.5 backdrop-blur-sm">
                <Target className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-violet-300 text-xs font-bold">You: #{myRank}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Period Filter Tabs (horizontal scroll on mobile) ── */}
      <div className="sticky top-0 z-10 -mx-4 px-4 bg-dark-900/90 backdrop-blur-xl py-2 border-b border-dark-800">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
          {PERIODS.map(p => {
            const active = period === p.key
            const PIcon = p.Icon
            return (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`relative flex-shrink-0 flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all active:scale-95 border
                  ${active
                    ? `${p.bg} ${p.border} ${p.text} shadow-lg ${p.glow}`
                    : 'bg-dark-800 border-dark-700 text-dark-400 hover:text-dark-200 hover:border-dark-600'
                  }`}
              >
                {active && <div className={`absolute inset-0 bg-gradient-to-r ${p.grad} opacity-10 rounded-xl`} />}
                <PIcon className={`relative w-3.5 h-3.5 ${active ? p.text : 'text-dark-500'}`} />
                <span className="relative whitespace-nowrap">{p.label}</span>
                {active && <div className={`absolute bottom-0 inset-x-3 h-0.5 bg-gradient-to-r ${p.grad} rounded-full`} />}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── My Rank Card ── */}
      {myRank > 0 && !isLoading && (
        <div className={`relative overflow-hidden rounded-2xl border ${periodCfg.border} bg-dark-800`}>
          <div className={`absolute inset-0 bg-gradient-to-r ${periodCfg.grad} opacity-[0.07]`} />
          <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-white/3 to-transparent" />
          <div className="relative p-4 sm:p-5">
            <div className="flex items-center gap-4">
              {/* Rank badge */}
              <div className="relative flex-shrink-0">
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${periodCfg.grad} blur-md opacity-50 scale-110`} />
                <div className={`relative w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br ${periodCfg.grad} flex flex-col items-center justify-center shadow-xl ${periodCfg.glow}`}>
                  <span className="text-white/60 text-[9px] font-bold uppercase tracking-widest leading-none">Rank</span>
                  <span className="text-white text-2xl font-black leading-tight">#{myRank}</span>
                </div>
                {myRank <= 3 && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg">
                    <Crown className="w-3 h-3 text-yellow-900" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className={`text-[11px] font-semibold ${periodCfg.text} uppercase tracking-wider`}>
                    Your Position · {periodCfg.sublabel}
                  </p>
                </div>
                <p className="text-white font-black text-lg leading-tight">{fmtMoney(myPeriodEarnings)}</p>
                <p className="text-dark-400 text-xs">earned this period</p>

                {/* Progress to next rank */}
                {myRank > 1 && leaderboard[myRank - 2] && (() => {
                  const above = leaderboard[myRank - 2]?.periodEarnings ?? leaderboard[myRank - 2]?.totalEarnings ?? 0
                  const gap = above - myPeriodEarnings
                  const pct = Math.min(100, Math.round((myPeriodEarnings / Math.max(above, 1)) * 100))
                  return gap > 0 ? (
                    <div className="mt-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`${periodCfg.text} text-[11px] font-medium flex items-center gap-1`}>
                          <ChevronUp className="w-3 h-3" />
                          {fmtMoney(gap)} to reach #{myRank - 1}
                        </span>
                        <span className="text-dark-400 text-[10px]">{pct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-dark-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${periodCfg.grad} rounded-full transition-all duration-1000 ease-out`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  ) : null
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {isLoading && <LeaderboardSkeleton />}

      {!isLoading && (
        <>
          {/* ── Podium ── */}
          {top3.length >= 1 && (
            <PodiumSection top3={top3} periodCfg={periodCfg} />
          )}

          {/* ── Full Rankings List ── */}
          <div className="rounded-2xl border border-dark-700 bg-dark-800 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3.5 border-b border-dark-700 flex items-center justify-between bg-dark-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
                  <Award className="w-4 h-4 text-violet-400" />
                </div>
                <h3 className="text-white font-bold text-sm">Full Rankings</h3>
                {leaderboard.length > 0 && (
                  <span className="text-[10px] font-bold text-dark-400 bg-dark-700 border border-dark-600 px-1.5 py-0.5 rounded-full">
                    {leaderboard.length}
                  </span>
                )}
              </div>
              <div className={`flex items-center gap-1.5 text-[11px] font-bold ${periodCfg.text} ${periodCfg.bg} ${periodCfg.border} border px-2.5 py-1 rounded-full`}>
                <PeriodIcon className="w-3 h-3" />
                {periodCfg.label}
              </div>
            </div>

            {leaderboard.length === 0 ? (
              <EmptyState period={periodCfg.sublabel} />
            ) : (
              <div className="divide-y divide-dark-700/50">
                {leaderboard.map((p: any, i: number) => {
                  const isMe = p._id === (user as any)?._id || p._id === user?.id
                  const rank = i + 1
                  const t = getTier(p.packageTier)
                  const earnings = p.periodEarnings ?? p.totalEarnings ?? 0
                  const earningPct = Math.round((earnings / maxEarnings) * 100)

                  const rankColor =
                    rank === 1 ? 'text-yellow-400' :
                    rank === 2 ? 'text-slate-300' :
                    rank === 3 ? 'text-amber-500' :
                    isMe ? 'text-violet-400' : 'text-dark-300'

                  return (
                    <div
                      key={p._id}
                      className={`relative flex items-center gap-3 px-4 py-3 transition-all
                        ${isMe
                          ? 'bg-violet-900/20 border-l-2 border-l-violet-500'
                          : rank <= 3
                          ? 'bg-dark-800 hover:bg-dark-750'
                          : 'hover:bg-dark-750/50'
                        }`}
                    >
                      {/* Rank number / medal */}
                      <div className="flex-shrink-0 w-8 flex items-center justify-center">
                        {rank === 1 && (
                          <div className="relative w-8 h-8 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full bg-yellow-400/15 animate-pulse" />
                            <Crown className="w-4 h-4 text-yellow-400 relative z-10" />
                          </div>
                        )}
                        {rank === 2 && (
                          <div className="w-7 h-7 rounded-full bg-slate-600/30 border border-slate-500/30 flex items-center justify-center">
                            <span className="text-slate-300 text-xs font-black">2</span>
                          </div>
                        )}
                        {rank === 3 && (
                          <div className="w-7 h-7 rounded-full bg-amber-700/20 border border-amber-600/25 flex items-center justify-center">
                            <span className="text-amber-500 text-xs font-black">3</span>
                          </div>
                        )}
                        {rank > 3 && rank <= 10 && (
                          <span className="text-violet-400 text-xs font-bold">#{rank}</span>
                        )}
                        {rank > 10 && (
                          <span className="text-dark-500 text-xs">#{rank}</span>
                        )}
                      </div>

                      {/* Avatar */}
                      <div className={`relative flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br ${t.grad} flex items-center justify-center text-white font-bold text-sm ring-1 ${t.ring} ${rank === 1 ? 'shadow-lg shadow-yellow-400/20' : ''}`}>
                        {p.name?.[0]?.toUpperCase() || '?'}
                      </div>

                      {/* Name / details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                          <p className={`text-sm font-semibold truncate ${isMe ? 'text-violet-300' : 'text-white/90'}`}>
                            {p.name}
                          </p>
                          {isMe && (
                            <span className="text-[10px] bg-violet-500/20 border border-violet-500/30 text-violet-400 px-1.5 py-px rounded-full font-bold">
                              You
                            </span>
                          )}
                          {rank === 1 && (
                            <span className="text-[10px] bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 px-1.5 py-px rounded-full font-bold flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5" />Top
                            </span>
                          )}
                          {p.isIndustrialPartner && (
                            <span className="text-[10px] bg-amber-500/15 border border-amber-500/30 text-amber-400 px-1.5 py-px rounded-full font-bold flex items-center gap-0.5">
                              🏭 Industry
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${t.badge}`}>
                            {t.emoji} {t.label}
                          </span>
                          {(p.totalReferrals || 0) > 0 && (
                            <span className="text-dark-500 text-[10px]">{p.totalReferrals} referrals</span>
                          )}
                        </div>
                        {/* Earnings bar */}
                        {rank > 1 && earningPct > 0 && (
                          <div className="mt-1.5 w-full max-w-[180px] sm:max-w-[240px] h-1 bg-dark-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r ${t.grad} rounded-full transition-all duration-700`}
                              style={{ width: `${earningPct}%` }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Earnings */}
                      <div className="text-right flex-shrink-0 ml-1">
                        <p className={`font-black text-sm ${rankColor}`}>{fmtMoney(earnings)}</p>
                        <p className="text-dark-600 text-[10px]">earned</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
