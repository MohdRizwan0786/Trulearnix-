'use client'
import { useState, useEffect, useCallback } from 'react'
import { adminAPI } from '@/lib/api'
import { usePackages, tierStyle } from '@/lib/usePackages'
import AdminLayout from '@/components/AdminLayout'
import {
  TrendingUp, Users, IndianRupee, ShoppingCart, Target,
  ArrowUpRight, ArrowDownRight, Minus, RefreshCw, Calendar,
  BarChart2, Activity, Zap, Award, CreditCard,
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtNum(n: number) {
  if (n >= 10000000) return `${(n / 10000000).toFixed(2)}Cr`
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toLocaleString('en-IN')
}
function fmtRupee(n: number) { return `₹${fmtNum(n)}` }

function GrowthBadge({ value }: { value: string | null }) {
  if (value === null) return <span className="text-gray-500 text-[10px]">No prev data</span>
  const n = Number(value)
  if (n > 0) return <span className="flex items-center gap-0.5 text-green-400 text-xs font-bold"><ArrowUpRight className="w-3 h-3" />+{value}%</span>
  if (n < 0) return <span className="flex items-center gap-0.5 text-red-400 text-xs font-bold"><ArrowDownRight className="w-3 h-3" />{value}%</span>
  return <span className="flex items-center gap-0.5 text-gray-400 text-xs"><Minus className="w-3 h-3" />0%</span>
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────
function BarChart({ data, valueKey, labelKey, color, height = 160 }: {
  data: any[]; valueKey: string; labelKey: string; color: string; height?: number
}) {
  const max = Math.max(...data.map(d => d[valueKey] || 0), 1)
  if (!data.length) return (
    <div className="flex items-center justify-center text-gray-600 text-sm" style={{ height }}>
      No data for this period
    </div>
  )
  return (
    <div className="flex items-end gap-px w-full overflow-x-auto" style={{ height }}>
      {data.map((d, i) => {
        const pct = Math.max(2, Math.round(((d[valueKey] || 0) / max) * 100))
        const label = String(d[labelKey] || '').replace(/^\d{4}-/, '').replace(/-/g, '/')
        return (
          <div key={i} className="flex-1 min-w-[8px] flex flex-col items-center gap-0.5 group relative" style={{ height }}>
            {/* tooltip */}
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-700 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none border border-white/10">
              {d[labelKey]}: {valueKey === 'revenue' ? fmtRupee(d[valueKey] || 0) : (d[valueKey] || 0)}
            </div>
            <div className="flex-1 w-full flex items-end">
              <div className={`w-full rounded-t-sm ${color} opacity-70 hover:opacity-100 transition-all cursor-default`}
                style={{ height: `${pct}%` }} />
            </div>
            {data.length <= 14 && (
              <span className="text-[8px] text-gray-600 truncate max-w-full px-0.5">{label}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Dual Bar Chart ───────────────────────────────────────────────────────────
function DualBarChart({ revData, userData }: { revData: any[]; userData: any[] }) {
  // merge by date
  const dates = Array.from(new Set([...revData.map(d => d._id), ...userData.map(d => d._id)])).sort()
  const maxRev = Math.max(...revData.map(d => d.revenue || 0), 1)
  const maxUsers = Math.max(...userData.map(d => d.count || 0), 1)

  if (!dates.length) return (
    <div className="h-40 flex items-center justify-center text-gray-600 text-sm">No data for this period</div>
  )

  return (
    <div className="flex items-end gap-1 w-full overflow-x-auto" style={{ height: 160 }}>
      {dates.map((date, i) => {
        const rev = revData.find(d => d._id === date)?.revenue || 0
        const users = userData.find(d => d._id === date)?.count || 0
        const revPct = Math.max(2, Math.round((rev / maxRev) * 90))
        const userPct = Math.max(2, Math.round((users / maxUsers) * 90))
        const label = String(date).replace(/^\d{4}-/, '').replace(/-/g, '/')
        return (
          <div key={i} className="flex-1 min-w-[10px] flex flex-col items-center gap-0.5 group relative" style={{ height: 160 }}>
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-700 text-white text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap z-20 pointer-events-none border border-white/10">
              {date}<br />Rev: {fmtRupee(rev)}<br />Users: {users}
            </div>
            <div className="flex-1 w-full flex items-end justify-center gap-0.5">
              <div className="flex-1 bg-violet-500/80 hover:bg-violet-500 rounded-t-sm transition-all" style={{ height: `${revPct}%` }} />
              <div className="flex-1 bg-green-500/80 hover:bg-green-500 rounded-t-sm transition-all" style={{ height: `${userPct}%` }} />
            </div>
            {dates.length <= 14 && (
              <span className="text-[8px] text-gray-600 truncate max-w-full">{label}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const PERIODS = [
  { label: 'Today', value: '1d' },
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: 'Custom', value: 'custom' },
]


export default function AnalyticsPage() {
  const { packages } = usePackages()
  const [period, setPeriod] = useState('30d')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [data, setData] = useState<any>(null)
  const [economics, setEconomics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeChart, setActiveChart] = useState<'revenue' | 'users' | 'leads' | 'combined'>('combined')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = period === 'custom'
        ? { from: customFrom, to: customTo }
        : { period }

      const [ovRes, econRes] = await Promise.allSettled([
        adminAPI.analyticsOverview(params),
        adminAPI.unitEconomics(),
      ])
      if (ovRes.status === 'fulfilled') setData(ovRes.value.data)
      if (econRes.status === 'fulfilled') setEconomics(econRes.value.data)
    } catch {}
    finally { setLoading(false) }
  }, [period, customFrom, customTo])

  useEffect(() => {
    if (period !== 'custom') load()
  }, [period])

  const kpis = data?.kpis || {}
  const charts = data?.charts || {}
  const breakdown = data?.breakdown || {}

  const revByDay: any[] = (charts.revByDay || []).map((d: any) => ({ ...d, revenue: d.revenue || 0, date: d._id }))
  const usersByDay: any[] = (charts.usersByDay || []).map((d: any) => ({ ...d, count: d.count || 0, date: d._id }))
  const leadsByDay: any[] = (charts.leadsByDay || []).map((d: any) => ({ ...d, count: d.count || 0, date: d._id }))

  const totalRevInPeriod = revByDay.reduce((s, d) => s + d.revenue, 0)
  const maxTierRev = Math.max(...(breakdown.revByTier || []).map((t: any) => t.revenue || 0), 1)

  const kpiCards = [
    {
      icon: IndianRupee, label: 'Revenue', value: fmtRupee(kpis.revenue?.value || 0),
      sub: `${kpis.revenue?.orders || 0} orders`,
      growth: kpis.revenue?.growth ?? null,
      color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      icon: Users, label: 'New Users', value: fmtNum(kpis.users?.value || 0),
      sub: `vs ${fmtNum(kpis.users?.prev || 0)} prev period`,
      growth: kpis.users?.growth ?? null,
      color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20',
    },
    {
      icon: Target, label: 'New Leads', value: fmtNum(kpis.leads?.value || 0),
      sub: `vs ${fmtNum(kpis.leads?.prev || 0)} prev period`,
      growth: kpis.leads?.growth ?? null,
      color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20',
    },
    {
      icon: ShoppingCart, label: 'Purchases', value: fmtNum(kpis.purchases || 0),
      sub: 'Paid conversions',
      growth: null,
      color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20',
    },
    {
      icon: CreditCard, label: 'Avg Order', value: fmtRupee(economics?.avgOrderValue || 0),
      sub: 'Per transaction',
      growth: null,
      color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      icon: Award, label: 'LTV:CAC', value: `${economics?.ltvCacRatio || 'N/A'}x`,
      sub: Number(economics?.ltvCacRatio) >= 3 ? 'Healthy ✓' : 'Needs improvement',
      growth: null,
      color: Number(economics?.ltvCacRatio) >= 3 ? 'text-green-400' : 'text-orange-400',
      bg: Number(economics?.ltvCacRatio) >= 3 ? 'bg-green-500/10 border-green-500/20' : 'bg-orange-500/10 border-orange-500/20',
    },
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-violet-400" /> Analytics
            </h1>
            <p className="text-gray-500 text-sm mt-1">Revenue, users, leads & unit economics</p>
          </div>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 text-gray-300 rounded-xl text-sm transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex bg-slate-800 rounded-xl p-1 border border-white/10">
            {PERIODS.map(p => (
              <button key={p.value} onClick={() => setPeriod(p.value)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${period === p.value ? 'bg-violet-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>
                {p.label}
              </button>
            ))}
          </div>

          {period === 'custom' && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 bg-slate-800 border border-white/10 rounded-xl px-3 py-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                  className="bg-transparent text-white text-sm outline-none" />
              </div>
              <span className="text-gray-500 text-sm">to</span>
              <div className="flex items-center gap-2 bg-slate-800 border border-white/10 rounded-xl px-3 py-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                  className="bg-transparent text-white text-sm outline-none" />
              </div>
              <button onClick={load} disabled={!customFrom || !customTo}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-xl font-semibold disabled:opacity-40 transition-colors">
                Apply
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
              {kpiCards.map(card => (
                <div key={card.label} className={`rounded-2xl border p-4 flex flex-col gap-1.5 ${card.bg}`}>
                  <div className="flex items-center justify-between">
                    <card.icon className={`w-4 h-4 ${card.color}`} />
                    <GrowthBadge value={card.growth} />
                  </div>
                  <div className={`text-2xl font-black ${card.color}`}>{card.value}</div>
                  <p className="text-white text-xs font-semibold">{card.label}</p>
                  <p className="text-gray-500 text-[10px]">{card.sub}</p>
                </div>
              ))}
            </div>

            {/* Main Chart */}
            <div className="bg-slate-800 rounded-2xl border border-white/5 p-6">
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div>
                  <h2 className="text-white font-bold flex items-center gap-2">
                    <Activity className="w-4 h-4 text-violet-400" /> Performance Chart
                  </h2>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {period === '1d' ? 'Today' : period === '7d' ? 'Last 7 days' : period === '30d' ? 'Last 30 days' : `${customFrom} — ${customTo}`}
                    {' · '}Revenue total: <span className="text-violet-400 font-semibold">{fmtRupee(totalRevInPeriod)}</span>
                  </p>
                </div>
                <div className="flex gap-1 bg-slate-700/60 rounded-xl p-1 border border-white/5">
                  {[
                    { key: 'combined', label: 'Overview', icon: BarChart2 },
                    { key: 'revenue', label: 'Revenue', icon: IndianRupee },
                    { key: 'users', label: 'Users', icon: Users },
                    { key: 'leads', label: 'Leads', icon: Target },
                  ].map(c => (
                    <button key={c.key} onClick={() => setActiveChart(c.key as any)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeChart === c.key ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                      <c.icon className="w-3 h-3" />{c.label}
                    </button>
                  ))}
                </div>
              </div>

              {activeChart === 'combined' && (
                <>
                  <DualBarChart revData={charts.revByDay || []} userData={charts.usersByDay || []} />
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-violet-500/80" /> Revenue</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-500/80" /> New Users</span>
                  </div>
                </>
              )}
              {activeChart === 'revenue' && (
                <BarChart data={revByDay} valueKey="revenue" labelKey="date" color="bg-violet-500" height={160} />
              )}
              {activeChart === 'users' && (
                <BarChart data={usersByDay} valueKey="count" labelKey="date" color="bg-green-500" height={160} />
              )}
              {activeChart === 'leads' && (
                <BarChart data={leadsByDay} valueKey="count" labelKey="date" color="bg-blue-500" height={160} />
              )}
            </div>

            {/* Breakdown row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Revenue by Package */}
              <div className="bg-slate-800 rounded-2xl border border-white/5 p-5">
                <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-amber-400" /> Revenue by Package
                </h3>
                {breakdown.revByTier?.length ? (
                  <div className="space-y-3">
                    {breakdown.revByTier.map((t: any) => {
                      const pct = Math.round((t.revenue / maxTierRev) * 100)
                      const color = tierStyle(t._id, packages).chartBg
                      return (
                        <div key={t._id}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-white capitalize">{t._id || 'Unknown'}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 text-[10px]">{t.count} sales</span>
                              <span className="text-amber-400 text-xs font-bold">{fmtRupee(t.revenue)}</span>
                            </div>
                          </div>
                          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : <p className="text-gray-600 text-xs text-center py-6">No revenue data</p>}
              </div>

              {/* Users by Package */}
              <div className="bg-slate-800 rounded-2xl border border-white/5 p-5">
                <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" /> New Users by Package
                </h3>
                {breakdown.usersByTier?.length ? (
                  <div className="space-y-3">
                    {(() => {
                      const maxU = Math.max(...breakdown.usersByTier.map((t: any) => t.count), 1)
                      return breakdown.usersByTier.map((t: any) => {
                        const pct = Math.round((t.count / maxU) * 100)
                        const color = tierStyle(t._id, packages).chartBg
                        return (
                          <div key={t._id}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-white capitalize">{t._id || 'Unknown'}</span>
                              <span className="text-blue-400 text-xs font-bold">{t.count} users</span>
                            </div>
                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        )
                      })
                    })()}
                  </div>
                ) : <p className="text-gray-600 text-xs text-center py-6">No user data</p>}
              </div>

              {/* Lead Stages */}
              <div className="bg-slate-800 rounded-2xl border border-white/5 p-5">
                <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4 text-violet-400" /> Leads by Stage
                </h3>
                {breakdown.topLeadStages?.length ? (
                  <div className="space-y-2.5">
                    {(() => {
                      const maxS = Math.max(...breakdown.topLeadStages.map((s: any) => s.count), 1)
                      const STAGE_COLORS: Record<string, string> = {
                        new: 'bg-slate-400', contacted: 'bg-blue-500', interested: 'bg-cyan-500',
                        demo_done: 'bg-indigo-500', negotiating: 'bg-violet-500',
                        token_collected: 'bg-amber-500', paid: 'bg-green-500', lost: 'bg-red-500',
                      }
                      return breakdown.topLeadStages.map((s: any) => (
                        <div key={s._id}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-300 capitalize">{(s._id || 'unknown').replace('_', ' ')}</span>
                            <span className={`text-xs font-bold ${s._id === 'paid' ? 'text-green-400' : s._id === 'lost' ? 'text-red-400' : 'text-gray-300'}`}>{s.count}</span>
                          </div>
                          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${STAGE_COLORS[s._id] || 'bg-violet-500'}`}
                              style={{ width: `${Math.round((s.count / maxS) * 100)}%` }} />
                          </div>
                        </div>
                      ))
                    })()}
                  </div>
                ) : <p className="text-gray-600 text-xs text-center py-6">No lead data</p>}
              </div>
            </div>

            {/* Unit Economics */}
            <div className="bg-slate-800 rounded-2xl border border-white/5 p-6">
              <h2 className="text-white font-bold mb-5 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" /> Unit Economics
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                {[
                  { label: 'Total Revenue', value: fmtRupee(economics?.totalRevenue || 0), color: 'text-amber-400', sub: 'All time' },
                  { label: 'Avg Order Value', value: fmtRupee(economics?.avgOrderValue || 0), color: 'text-white', sub: 'Per transaction' },
                  { label: 'Est. LTV', value: fmtRupee(economics?.estimatedLTV || 0), color: 'text-emerald-400', sub: 'Per customer' },
                  { label: 'Est. CAC', value: fmtRupee(economics?.estimatedCAC || 0), color: 'text-orange-400', sub: '~20% rev spend' },
                  { label: 'LTV:CAC', value: `${economics?.ltvCacRatio || 'N/A'}x`, color: Number(economics?.ltvCacRatio) >= 3 ? 'text-green-400' : 'text-red-400', sub: Number(economics?.ltvCacRatio) >= 3 ? 'Healthy' : 'Low' },
                  { label: 'Payback Period', value: `${economics?.paybackMonths || 'N/A'} mo.`, color: 'text-blue-400', sub: 'CAC recovery' },
                ].map(item => (
                  <div key={item.label} className="bg-slate-700/40 rounded-xl p-4 border border-white/5">
                    <p className="text-gray-500 text-[10px] mb-1">{item.sub}</p>
                    <p className={`text-xl font-black ${item.color}`}>{item.value}</p>
                    <p className="text-gray-400 text-xs mt-1">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily breakdown table */}
            {revByDay.length > 0 && (
              <div className="bg-slate-800 rounded-2xl border border-white/5 overflow-hidden">
                <div className="p-5 border-b border-white/5">
                  <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-violet-400" /> Daily Breakdown
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5 bg-slate-700/30">
                        <th className="text-left text-xs text-gray-500 font-semibold px-5 py-3">Date</th>
                        <th className="text-right text-xs text-gray-500 font-semibold px-5 py-3">Revenue</th>
                        <th className="text-right text-xs text-gray-500 font-semibold px-5 py-3">Orders</th>
                        <th className="text-right text-xs text-gray-500 font-semibold px-5 py-3">New Users</th>
                        <th className="text-right text-xs text-gray-500 font-semibold px-5 py-3">New Leads</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {revByDay.slice().reverse().slice(0, 15).map((d: any) => {
                        const users = usersByDay.find(u => u._id === d._id)?.count || 0
                        const leads = leadsByDay.find(l => l._id === d._id)?.count || 0
                        return (
                          <tr key={d._id} className="hover:bg-white/3 transition-colors">
                            <td className="px-5 py-3 text-gray-300 text-xs">{d._id}</td>
                            <td className="px-5 py-3 text-right">
                              <span className="text-amber-400 font-bold text-xs">{fmtRupee(d.revenue)}</span>
                            </td>
                            <td className="px-5 py-3 text-right text-gray-300 text-xs">{d.orders || 0}</td>
                            <td className="px-5 py-3 text-right text-blue-400 text-xs font-semibold">{users}</td>
                            <td className="px-5 py-3 text-right text-violet-400 text-xs font-semibold">{leads}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  )
}
