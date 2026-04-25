'use client'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { partnerAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import {
  TrendingUp, Coins, Clock, Package, CreditCard,
  CheckCircle, AlertCircle, Zap, ArrowUpRight, Award, Calendar, Building2
} from 'lucide-react'

type Period = 'today' | '7' | '30' | 'all' | 'custom'

function DateFilter({ period, setPeriod, from, setFrom, to, setTo }: {
  period: Period; setPeriod: (p: Period) => void
  from: string; setFrom: (v: string) => void
  to: string; setTo: (v: string) => void
}) {
  const OPTS: { key: Period; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: '7', label: '7 Days' },
    { key: '30', label: '30 Days' },
    { key: 'all', label: 'All Time' },
    { key: 'custom', label: 'Custom' },
  ]
  return (
    <div className="space-y-2">
      <div className="flex gap-2 flex-wrap">
        {OPTS.map(o => (
          <button key={o.key} onClick={() => setPeriod(o.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              period === o.key
                ? 'bg-violet-600 border-violet-500 text-white'
                : 'bg-dark-800 border-dark-700 text-dark-400 hover:text-white'
            }`}>
            {o.label}
          </button>
        ))}
      </div>
      {period === 'custom' && (
        <div className="flex gap-2 items-center">
          <Calendar className="w-3.5 h-3.5 text-dark-400 flex-shrink-0" />
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="bg-dark-800 border border-dark-700 text-white text-xs rounded-lg px-2 py-1.5 flex-1" />
          <span className="text-dark-500 text-xs">to</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="bg-dark-800 border border-dark-700 text-white text-xs rounded-lg px-2 py-1.5 flex-1" />
        </div>
      )}
    </div>
  )
}

export default function EarningsPage() {
  const { user } = useAuthStore()
  const [period, setPeriod] = useState<Period>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const queryParams = period === 'custom'
    ? (from && to ? { period, from, to } : null)
    : { period }
  const isAllTime = period === 'all'

  const { data, isLoading } = useQuery({
    queryKey: ['partner-earnings', period, from, to],
    queryFn: () => partnerAPI.earnings(queryParams || { period: '30' }).then(r => r.data),
    enabled: period !== 'custom' || !!(from && to),
  })
  const { data: pkgsData } = useQuery({
    queryKey: ['packages-list'],
    queryFn: () => fetch(`${process.env.NEXT_PUBLIC_API_URL}/packages`).then(r => r.json()),
    staleTime: 10 * 60 * 1000,
  })
  const tierNameMap: Record<string, string> = {}
  ;(pkgsData?.packages || pkgsData?.data || []).forEach((p: any) => {
    if (p.tier) tierNameMap[p.tier.toLowerCase()] = p.name
  })
  const getTierName = (t?: string) => t ? (tierNameMap[t.toLowerCase()] || t) : '—'
  const { data: emiData, isLoading: emiLoading } = useQuery({
    queryKey: ['partner-emi-commissions'],
    queryFn: () => partnerAPI.emiCommissions().then(r => r.data),
  })

  const byLevel = data?.byLevel || { l1: 0, l2: 0, l3: 0 }
  const byTier  = data?.byTier  || {}
  const recent  = data?.recent  || data?.recentCommissions || []
  const monthly = data?.monthly || []
  const bestTier       = data?.bestTier || null

  const totalEarnings = (byLevel.l1 || 0) + (byLevel.l2 || 0) + (byLevel.l3 || 0)
  const thisMonth = monthly[monthly.length - 1]?.total || 0
  const prevMonth = monthly[monthly.length - 2]?.total || 0
  const growth = prevMonth > 0 ? Math.round(((thisMonth - prevMonth) / prevMonth) * 100) : null

  const monthlyMax = Math.max(...monthly.map((m: any) => m.total || 0), 1)
  const activeTierKeys = Object.keys(byTier).filter(t => (byTier as any)[t] > 0)
  const tierMax = Math.max(...(activeTierKeys.length ? activeTierKeys.map(t => (byTier as any)[t]) : [0]), 1)

  const emiInstallments: any[] = emiData?.installments || []
  const emiStats = emiData?.stats || {}

  const industrialEarning: number = (user as any)?.industrialEarning || 0
  const industrialEarningSource: string = (user as any)?.industrialEarningSource || ''
  const isIndustrialPartner: boolean = (user as any)?.isIndustrialPartner || false

  const TIER_CFG: Record<string, { grad: string; text: string; emoji: string }> = {
    supreme: { grad: 'from-rose-500 to-pink-600',    text: 'text-rose-300',    emoji: '👑' },
    elite:   { grad: 'from-amber-500 to-orange-500', text: 'text-amber-300',   emoji: '⚡' },
    pro:     { grad: 'from-purple-500 to-violet-600',text: 'text-purple-300',  emoji: '🚀' },
    starter: { grad: 'from-blue-500 to-cyan-500',    text: 'text-blue-300',    emoji: '🌱' },
  }

  if (isLoading) return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-dark-800 rounded-2xl animate-pulse" />)}
    </div>
  )

  return (
    <div className="space-y-4 pb-8">

      {/* Header */}
      <div>
        <h1 className="text-white text-2xl font-bold">Earnings</h1>
        <p className="text-dark-400 text-sm mt-0.5">Your income breakdown &amp; insights</p>
      </div>

      {/* Date Filter */}
      <div className="bg-dark-800 rounded-2xl border border-dark-700 p-4">
        <DateFilter period={period} setPeriod={setPeriod} from={from} setFrom={setFrom} to={to} setTo={setTo} />
      </div>

      {/* ── Hero: Total Earnings ── */}
      <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800 border border-violet-500/20">
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-violet-400/10 pointer-events-none" />
        <div className="relative">
          <p className="text-violet-200 text-xs uppercase tracking-widest font-medium mb-1">Total Earnings</p>
          <p className="text-white text-4xl font-black tracking-tight">₹{(totalEarnings + (isAllTime ? industrialEarning : 0)).toLocaleString()}</p>
          {isAllTime && isIndustrialPartner && industrialEarning > 0 && (
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="text-violet-200 text-[11px]">
                Partnership earnings: <span className="font-bold text-white">₹{totalEarnings.toLocaleString()}</span>
              </span>
              <span className="text-amber-300 text-[11px] flex items-center gap-1">
                🏭 Industrial: <span className="font-bold text-amber-200">₹{industrialEarning.toLocaleString()}</span>
              </span>
            </div>
          )}
          <p className="text-violet-300 text-xs mt-2">
            Withdrawable wallet: <span className="font-semibold text-white">₹{(user?.wallet || 0).toLocaleString()}</span>
          </p>
        </div>
        <Coins className="absolute bottom-4 right-4 w-12 h-12 text-white/10" />
      </div>

      {/* ── Industrial + TruLearnix Earning (lifetime — only in All Time view) ── */}
      {isAllTime && isIndustrialPartner && industrialEarning > 0 && (
        <div className="relative overflow-hidden rounded-2xl p-5 border border-amber-500/40 bg-gradient-to-br from-amber-500/12 to-violet-500/8">
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-amber-400/5 pointer-events-none" />
          <div className="relative">
            {/* Badge */}
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-full">
                🏭 Industrial + TruLearnix Earning
              </span>
              {industrialEarningSource && (
                <span className="text-amber-500/55 text-[10px]">via {industrialEarningSource}</span>
              )}
            </div>
            {/* Combined total */}
            <p className="text-white text-3xl font-black tracking-tight">
              ₹{(industrialEarning + totalEarnings).toLocaleString()}
            </p>
            <p className="text-amber-500/55 text-xs mt-1 mb-4">
              Lifetime Partner Earning · grows as you earn on TruLearnix
            </p>
            {/* Breakdown */}
            <div className="flex gap-3 flex-wrap">
              <div className="rounded-xl px-3 py-2 border border-amber-500/20 bg-amber-500/8">
                <p className="text-amber-400/60 text-[9px] uppercase tracking-wide">Industrial</p>
                <p className="text-amber-300 font-black text-sm">₹{industrialEarning.toLocaleString()}</p>
                <p className="text-white/20 text-[9px]">prev. platform</p>
              </div>
              <div className="rounded-xl px-3 py-2 border border-violet-500/20 bg-violet-500/8">
                <p className="text-violet-400/60 text-[9px] uppercase tracking-wide">TruLearnix</p>
                <p className="text-violet-300 font-black text-sm">₹{totalEarnings.toLocaleString()}</p>
                <p className="text-white/20 text-[9px]">Partnership earnings</p>
              </div>
            </div>
          </div>
          <Building2 className="absolute bottom-4 right-4 w-10 h-10 text-amber-500/8" />
        </div>
      )}

      {/* ── Mini Stats ── */}
      <div className="grid grid-cols-2 gap-3">
        {/* This Month */}
        <div className="rounded-2xl p-3 bg-gradient-to-br from-emerald-600 to-teal-700 border border-emerald-500/20 relative overflow-hidden">
          <p className="text-emerald-100 text-[10px] uppercase tracking-wide font-medium">This Month</p>
          <p className="text-white text-base font-bold mt-1">₹{thisMonth >= 1000 ? `${(thisMonth/1000).toFixed(1)}k` : thisMonth}</p>
          {growth !== null && (
            <span className={`text-[10px] font-semibold ${growth >= 0 ? 'text-green-200' : 'text-red-200'}`}>
              {growth >= 0 ? '▲' : '▼'}{Math.abs(growth)}%
            </span>
          )}
        </div>
        {/* Best Tier */}
        <div className="rounded-2xl p-3 bg-gradient-to-br from-rose-600 to-pink-700 border border-rose-500/20 relative overflow-hidden">
          <p className="text-rose-100 text-[10px] uppercase tracking-wide font-medium">Best Tier</p>
          <p className="text-white text-base font-bold mt-1 capitalize">{bestTier || '—'}</p>
          <p className="text-rose-200 text-[10px]">top source</p>
        </div>
      </div>

      {/* ── Revenue by Tier ── */}
      <div className="bg-dark-800 rounded-2xl border border-dark-700 p-5">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Package className="w-4 h-4 text-amber-400" /> Revenue by Package Tier
        </h3>
        <div className="space-y-3">
          {Object.entries(byTier as Record<string, number>).map(([tier, val]) => {
            const cfg = TIER_CFG[tier.toLowerCase()] || { grad: 'from-gray-500 to-gray-600', text: 'text-gray-300', emoji: '📦' }
            const pct = tierMax > 0 ? (val / tierMax) * 100 : 0
            return (
              <div key={tier}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-dark-300 text-sm">{cfg.emoji} {getTierName(tier)}</span>
                  <span className="text-white text-sm font-semibold">₹{val.toLocaleString()}</span>
                </div>
                <div className="w-full bg-dark-700 rounded-full h-2 overflow-hidden">
                  <div className={`h-full rounded-full bg-gradient-to-r ${cfg.grad} transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Monthly Trend ── */}
      <div className="bg-dark-800 rounded-2xl border border-dark-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-400" /> Monthly Trend
          </h3>
          {monthly.length > 0 && <span className="text-dark-500 text-xs">{monthly.length} months</span>}
        </div>
        {monthly.length > 0 ? (
          <>
            <div className="space-y-2">
              {monthly.map((m: any) => (
                <div key={m.month}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-dark-300 text-xs w-16 flex-shrink-0">{m.month}</span>
                    <div className="flex items-center gap-2 flex-1 mx-2">
                      <div className="flex-1 bg-dark-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-600 transition-all"
                          style={{ width: `${monthlyMax > 0 ? (m.total / monthlyMax) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-white text-xs font-semibold w-16 text-right flex-shrink-0">₹{(m.total || 0).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-dark-700">
              <div className="text-center">
                <p className="text-white text-sm font-bold">₹{monthly.reduce((s: number, m: any) => s + (m.total || 0), 0).toLocaleString()}</p>
                <p className="text-dark-500 text-[10px] mt-0.5">Total</p>
              </div>
              <div className="text-center">
                <p className="text-white text-sm font-bold">{monthly.reduce((s: number, m: any) => s + (m.count || 0), 0)}</p>
                <p className="text-dark-500 text-[10px] mt-0.5">Partnership earnings</p>
              </div>
              <div className="text-center">
                <p className="text-white text-sm font-bold">₹{monthly.length > 0 ? Math.round(monthly.reduce((s: number, m: any) => s + (m.total || 0), 0) / monthly.length).toLocaleString() : 0}</p>
                <p className="text-dark-500 text-[10px] mt-0.5">Avg/Month</p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <TrendingUp className="w-8 h-8 text-dark-600 mb-2" />
            <p className="text-dark-400 text-sm">No earnings data yet</p>
            <p className="text-dark-600 text-xs mt-1">Share your partner link to start earning</p>
          </div>
        )}
      </div>

      {/* ── Recent Commissions ── */}
      <div className="bg-dark-800 rounded-2xl border border-dark-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" /> Recent Partnership earnings
          </h3>
          {recent.length > 0 && <span className="text-dark-500 text-xs">{recent.length} entries</span>}
        </div>
        {recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Award className="w-8 h-8 text-dark-600 mb-2" />
            <p className="text-dark-400 text-sm">No Partnership earnings yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map((c: any) => {
              const lvlGrad: Record<number, string> = {
                1: 'from-violet-500 to-purple-600',
                2: 'from-blue-500 to-cyan-600',
                3: 'from-emerald-500 to-teal-600',
              }
              const lvlBadge: Record<number, string> = {
                1: 'bg-violet-900/50 text-violet-300 border-violet-700/40',
                2: 'bg-blue-900/50 text-blue-300 border-blue-700/40',
                3: 'bg-emerald-900/50 text-emerald-300 border-emerald-700/40',
              }
              return (
                <div key={c._id} className="flex items-center gap-3 p-3 bg-dark-700/70 rounded-xl border border-white/[0.03]">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${lvlGrad[c.level] || 'from-violet-500 to-purple-600'} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                    {c.from?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{c.from?.name || 'Unknown'}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${lvlBadge[c.level] || 'bg-dark-600 text-dark-300 border-dark-600'}`}>
                        L{c.level}
                      </span>
                      {c.from?.packageTier && (
                        <span className="text-[10px] text-dark-400">{getTierName(c.from.packageTier)}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-green-400 text-sm font-bold">+₹{(c.amount || 0).toLocaleString()}</p>
                    <p className="text-dark-500 text-[10px] mt-0.5">
                      {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── EMI Commissions ── */}
      <div className="bg-dark-800 rounded-2xl border border-dark-700 p-5">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-violet-400" /> EMI Partnership earnings
        </h3>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-emerald-900/20 border border-emerald-700/20 rounded-xl p-3 text-center">
            <p className="text-emerald-300 text-lg font-bold">₹{(emiStats.totalEarnedCommission || 0).toLocaleString()}</p>
            <p className="text-dark-400 text-xs mt-0.5">Earned</p>
          </div>
          <div className="bg-amber-900/20 border border-amber-700/20 rounded-xl p-3 text-center">
            <p className="text-amber-300 text-lg font-bold">₹{(emiStats.totalPendingCommission || 0).toLocaleString()}</p>
            <p className="text-dark-400 text-xs mt-0.5">Pending</p>
          </div>
        </div>

        {emiLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-dark-700 rounded-xl animate-pulse" />)}
          </div>
        ) : emiInstallments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CreditCard className="w-8 h-8 text-dark-600 mb-2" />
            <p className="text-dark-400 text-sm">No EMI referrals yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {emiInstallments.map((inst: any) => {
              const buyer = inst.user as any
              const pp = inst.packagePurchase as any
              const isPaid    = inst.status === 'paid'
              const isOverdue = inst.status === 'overdue'
              const cls = isPaid ? 'text-green-400' : isOverdue ? 'text-red-400' : 'text-yellow-400'
              const label = isPaid ? (inst.partnerCommissionPaid ? 'Credited' : 'Paid') : inst.status
              return (
                <div key={inst._id} className="flex items-center gap-3 p-3 bg-dark-700/70 rounded-xl border border-white/[0.03]">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {buyer?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{buyer?.name || 'Unknown'}</p>
                    <p className="text-dark-400 text-xs">
                      {getTierName(pp?.packageTier) || 'Package'} · EMI {inst.installmentNumber}/{inst.totalInstallments}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {inst.partnerCommissionAmount > 0 ? (
                      <p className={`text-sm font-bold ${inst.partnerCommissionPaid ? 'text-green-400' : 'text-yellow-400'}`}>
                        {inst.partnerCommissionPaid ? '+' : '~'}₹{inst.partnerCommissionAmount.toLocaleString()}
                      </p>
                    ) : (
                      <p className="text-dark-500 text-sm">—</p>
                    )}
                    <div className={`flex items-center justify-end gap-1 mt-0.5 ${cls}`}>
                      {isPaid ? <CheckCircle className="w-3 h-3" /> : isOverdue ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      <span className="text-[10px] capitalize font-medium">{label}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
