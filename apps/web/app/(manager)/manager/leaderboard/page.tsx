'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { managerAPI } from '@/lib/api'
import { usePackages } from '@/lib/tiers'
import { Trophy, TrendingUp, IndianRupee, Users, Medal, Crown, Loader2, ChevronRight } from 'lucide-react'
import Link from 'next/link'

const TIER_COLOR: Record<string, string> = {
  free: 'bg-gray-500/20 text-gray-400', starter: 'bg-blue-500/20 text-blue-400',
  pro: 'bg-indigo-500/20 text-indigo-400', elite: 'bg-violet-500/20 text-violet-400',
  supreme: 'bg-yellow-500/20 text-yellow-400',
}
const TIER_ICON: Record<string, string> = { free: '🆓', starter: '⚡', pro: '🚀', elite: '💎', supreme: '👑' }

const RANK_STYLE = [
  { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30', icon: '🥇' },
  { bg: 'bg-gray-400/20',   text: 'text-gray-300',   border: 'border-gray-400/30',   icon: '🥈' },
  { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30', icon: '🥉' },
]

export default function ManagerLeaderboardPage() {
  const [sortBy, setSortBy] = useState<'earnings' | 'referrals'>('earnings')
  const { getName: getPkgName } = usePackages()

  const { data: leaderboard = [], isLoading } = useQuery({
    queryKey: ['manager-leaderboard'],
    queryFn: () => managerAPI.leaderboard().then(r => r.data.leaderboard),
  })

  const sorted = [...leaderboard].sort((a: any, b: any) =>
    sortBy === 'earnings'
      ? (b.totalEarnings || 0) - (a.totalEarnings || 0)
      : (b.l1Count || 0) - (a.l1Count || 0)
  )

  const top3 = sorted.slice(0, 3)
  const rest  = sorted.slice(3)

  const totalEarnings  = leaderboard.reduce((s: number, p: any) => s + (p.totalEarnings || 0), 0)
  const totalReferrals = leaderboard.reduce((s: number, p: any) => s + (p.l1Count || 0), 0)

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" /> Partner Leaderboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">Your team's performance rankings</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setSortBy('earnings')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${sortBy === 'earnings' ? 'bg-emerald-600 text-white' : 'bg-dark-800 text-gray-400 border border-white/8 hover:text-white'}`}>
            By Earnings
          </button>
          <button onClick={() => setSortBy('referrals')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${sortBy === 'referrals' ? 'bg-emerald-600 text-white' : 'bg-dark-800 text-gray-400 border border-white/8 hover:text-white'}`}>
            By Referrals
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-dark-800 rounded-2xl border border-white/5 p-4 flex flex-col gap-2">
          <div className="w-9 h-9 rounded-xl bg-yellow-500/15 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-yellow-400" />
          </div>
          <p className="text-2xl font-bold text-white">{leaderboard.length}</p>
          <p className="text-xs text-gray-400">Total Partners</p>
        </div>
        <div className="bg-dark-800 rounded-2xl border border-white/5 p-4 flex flex-col gap-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
            <IndianRupee className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white">₹{(totalEarnings / 1000).toFixed(1)}k</p>
          <p className="text-xs text-gray-400">Team Earnings</p>
        </div>
        <div className="bg-dark-800 rounded-2xl border border-white/5 p-4 flex flex-col gap-2">
          <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center">
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white">{totalReferrals}</p>
          <p className="text-xs text-gray-400">Total Referrals</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 animate-spin text-emerald-400" /></div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-20 bg-dark-800 rounded-2xl border border-white/5">
          <Trophy className="w-14 h-14 mx-auto mb-4 text-gray-700" />
          <p className="text-gray-300 font-semibold">No partners yet</p>
          <p className="text-gray-500 text-sm mt-1">Partners will appear here once assigned</p>
        </div>
      ) : (
        <>
          {/* Top 3 podium */}
          {top3.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {top3.map((p: any, idx: number) => {
                const rs = RANK_STYLE[idx]
                return (
                  <Link key={p._id} href={`/manager/partners/${p._id}`}
                    className={`group relative bg-dark-800 rounded-2xl border ${rs.border} p-5 flex flex-col items-center gap-3 hover:shadow-lg transition-all hover:-translate-y-0.5 ${idx === 0 ? 'sm:order-2' : idx === 1 ? 'sm:order-1' : 'sm:order-3'}`}>
                    {/* Rank badge */}
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full ${rs.bg} border ${rs.border} flex items-center justify-center text-lg`}>
                      {rs.icon}
                    </div>

                    {/* Avatar */}
                    <div className={`w-16 h-16 rounded-2xl ${rs.bg} border ${rs.border} flex items-center justify-center text-2xl font-bold ${rs.text} mt-2`}>
                      {p.name?.[0]?.toUpperCase()}
                    </div>

                    <div className="text-center">
                      <h3 className={`font-bold text-white group-hover:${rs.text} transition-colors`}>{p.name}</h3>
                      <p className="text-gray-500 text-xs mt-0.5">{p.affiliateCode}</p>
                    </div>

                    <span className={`text-xs px-2.5 py-1 rounded-xl font-semibold ${TIER_COLOR[p.packageTier] || TIER_COLOR.free}`}>
                      {TIER_ICON[p.packageTier]} {getPkgName(p.packageTier)}
                    </span>

                    <div className="w-full grid grid-cols-2 gap-2 text-center">
                      <div className="bg-dark-700 rounded-xl p-2">
                        <p className="text-sm font-bold text-white">₹{((p.totalEarnings || 0) / 1000).toFixed(1)}k</p>
                        <p className="text-[10px] text-gray-500">Earnings</p>
                      </div>
                      <div className="bg-dark-700 rounded-xl p-2">
                        <p className="text-sm font-bold text-white">{p.l1Count || 0}</p>
                        <p className="text-[10px] text-gray-500">Referrals</p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {/* Rest of table */}
          {rest.length > 0 && (
            <div className="bg-dark-800 rounded-2xl border border-white/5 overflow-hidden">
              <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
                <Medal className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-semibold text-gray-300">Other Rankings</span>
              </div>
              <div className="divide-y divide-white/4">
                {rest.map((p: any, idx: number) => (
                  <Link key={p._id} href={`/manager/partners/${p._id}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/3 transition-colors group">
                    {/* Rank number */}
                    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                      {idx + 4}
                    </div>

                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center text-sm font-bold text-emerald-400 flex-shrink-0">
                      {p.name?.[0]?.toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors truncate">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.affiliateCode}</p>
                    </div>

                    {/* Tier */}
                    <span className={`hidden sm:flex text-xs px-2 py-0.5 rounded-lg font-semibold items-center gap-1 ${TIER_COLOR[p.packageTier] || TIER_COLOR.free}`}>
                      {TIER_ICON[p.packageTier]} {getPkgName(p.packageTier)}
                    </span>

                    {/* Stats */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-white">₹{((p.totalEarnings || 0) / 1000).toFixed(1)}k</p>
                      <p className="text-xs text-gray-500">{p.l1Count || 0} referrals</p>
                    </div>

                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-emerald-400 transition-colors flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
