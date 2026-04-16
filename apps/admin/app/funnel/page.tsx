'use client'
import AdminLayout from '@/components/AdminLayout'
import { adminAPI } from '@/lib/api'
import { useEffect, useState } from 'react'
import {
  TrendingDown, Users, ShoppingCart, CreditCard, Zap,
  ArrowDown, Flame, Thermometer, Snowflake, Target,
  BarChart2, AlertTriangle, RefreshCw, IndianRupee, Award,
} from 'lucide-react'

const STAGE_CFG: Record<string, { label: string; color: string; bg: string; text: string; border: string }> = {
  new:             { label: 'New',             color: 'bg-slate-500',   bg: 'bg-slate-500/15',   text: 'text-slate-300',   border: 'border-slate-500/30' },
  contacted:       { label: 'Contacted',       color: 'bg-blue-500',    bg: 'bg-blue-500/15',    text: 'text-blue-400',    border: 'border-blue-500/30' },
  interested:      { label: 'Interested',      color: 'bg-cyan-500',    bg: 'bg-cyan-500/15',    text: 'text-cyan-400',    border: 'border-cyan-500/30' },
  demo_done:       { label: 'Demo Done',       color: 'bg-indigo-500',  bg: 'bg-indigo-500/15',  text: 'text-indigo-400',  border: 'border-indigo-500/30' },
  negotiating:     { label: 'Negotiating',     color: 'bg-violet-500',  bg: 'bg-violet-500/15',  text: 'text-violet-400',  border: 'border-violet-500/30' },
  token_collected: { label: 'Token Collected', color: 'bg-amber-500',   bg: 'bg-amber-500/15',   text: 'text-amber-400',   border: 'border-amber-500/30' },
  paid:            { label: 'Paid ✓',          color: 'bg-green-500',   bg: 'bg-green-500/15',   text: 'text-green-400',   border: 'border-green-500/30' },
  lost:            { label: 'Lost ✗',          color: 'bg-red-500',     bg: 'bg-red-500/15',     text: 'text-red-400',     border: 'border-red-500/30' },
}

const TIER_COLORS: Record<string, string> = {
  elite: 'bg-amber-500',
  pro: 'bg-violet-500',
  basic: 'bg-blue-500',
  free: 'bg-slate-500',
}

function fmt(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n.toLocaleString('en-IN')}`
}

export default function FunnelPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const [funnelRes, unitRes] = await Promise.allSettled([
        adminAPI.analyticsFunnel(),
        adminAPI.unitEconomics(),
      ])
      const funnel = funnelRes.status === 'fulfilled' ? funnelRes.value.data : {}
      const unit = unitRes.status === 'fulfilled' ? unitRes.value.data : {}
      setData({ funnel, unit })
    } catch {}
    finally { setLoading(false) }
  }

  const funnel = data?.funnel || {}
  const unit = data?.unit || {}

  const stages: any[] = funnel.stagesData || []
  const activeStages = stages.filter(s => s.stage !== 'lost')
  const lostStage = stages.find(s => s.stage === 'lost')
  const maxCount = Math.max(...activeStages.map((s: any) => s.count), 1)
  const totalLeads = funnel.totalLeads || 0
  const paidCount = stages.find(s => s.stage === 'paid')?.count || 0
  const overallConv = totalLeads > 0 ? ((paidCount / totalLeads) * 100).toFixed(1) : '0'

  const score = funnel.scoreBreakdown || { hot: 0, warm: 0, cold: 0 }
  const scoreTotal = score.hot + score.warm + score.cold || 1

  const revGrowth = funnel.revenue?.lastMonth > 0
    ? (((funnel.revenue?.thisMonth - funnel.revenue?.lastMonth) / funnel.revenue?.lastMonth) * 100).toFixed(1)
    : '0'

  const kpiCards = [
    { icon: Users, label: 'Total Leads', value: totalLeads, sub: `+${funnel.users?.thisMonth || 0} this month`, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    { icon: Target, label: 'Conversion Rate', value: `${overallConv}%`, sub: 'Leads → Paid', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
    { icon: ShoppingCart, label: 'Total Purchases', value: funnel.purchases?.total || 0, sub: `+${funnel.purchases?.thisMonth || 0} this month`, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { icon: IndianRupee, label: 'Total Revenue', value: fmt(funnel.revenue?.total || 0), sub: `This month: ${fmt(funnel.revenue?.thisMonth || 0)}`, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    { icon: Flame, label: 'Hot Leads', value: score.hot, sub: `${((score.hot / scoreTotal) * 100).toFixed(0)}% of pipeline`, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
    { icon: AlertTriangle, label: 'Lost Leads', value: lostStage?.count || 0, sub: `${lostStage?.thisMonth || 0} this month`, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <TrendingDown className="w-6 h-6 text-violet-400" /> Funnel Tracking
            </h1>
            <p className="text-gray-500 text-sm mt-1">Lead-to-customer conversion pipeline with full analytics</p>
          </div>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 text-gray-300 rounded-xl text-sm transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
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
                <div key={card.label} className={`rounded-2xl border p-4 flex flex-col gap-2 ${card.bg}`}>
                  <card.icon className={`w-4 h-4 ${card.color}`} />
                  <div className={`text-2xl font-black ${card.color}`}>{card.value}</div>
                  <div>
                    <p className="text-white text-xs font-semibold">{card.label}</p>
                    <p className="text-gray-500 text-[10px]">{card.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Main funnel + side panels */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

              {/* Visual Funnel */}
              <div className="xl:col-span-2 bg-slate-800 rounded-2xl border border-white/5 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-white font-bold flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-violet-400" /> Conversion Funnel
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="w-2 h-2 rounded-full bg-violet-400" /> Active
                    <span className="w-2 h-2 rounded-full bg-red-400 ml-2" /> Lost
                  </div>
                </div>

                <div className="space-y-2">
                  {activeStages.map((s: any, i: number) => {
                    const cfg = STAGE_CFG[s.stage]
                    const widthPct = maxCount > 0 ? Math.max(10, (s.count / maxCount) * 100) : 10
                    const prevCount = i > 0 ? activeStages[i - 1].count : s.count
                    const dropPct = prevCount > 0 ? (((prevCount - s.count) / prevCount) * 100).toFixed(0) : '0'
                    const convFromTop = totalLeads > 0 ? ((s.count / totalLeads) * 100).toFixed(1) : '0'

                    return (
                      <div key={s.stage}>
                        {i > 0 && (
                          <div className="flex items-center justify-center gap-2 my-1">
                            <ArrowDown className="w-3.5 h-3.5 text-gray-600" />
                            {Number(dropPct) > 0 && (
                              <span className="text-[10px] text-red-400/70">-{dropPct}% drop</span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          {/* Funnel bar centered */}
                          <div className="flex-1 flex flex-col items-center">
                            <div className={`h-10 rounded-xl ${cfg.color} transition-all duration-700 relative overflow-hidden flex items-center justify-between px-3`}
                              style={{ width: `${widthPct}%`, minWidth: 120 }}>
                              <span className="text-white text-xs font-bold truncate">{cfg.label}</span>
                              <span className="text-white/80 text-xs font-black">{s.count}</span>
                            </div>
                          </div>
                          {/* Stats */}
                          <div className="flex-shrink-0 w-28 text-right">
                            <div className="text-white text-sm font-bold">{s.count}</div>
                            <div className="text-gray-500 text-[10px]">{convFromTop}% of leads</div>
                            {s.thisMonth > 0 && <div className="text-violet-400 text-[10px]">+{s.thisMonth} this mo.</div>}
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* Lost row separately */}
                  {lostStage && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl">
                          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                          <span className="text-red-400 text-sm font-bold">Lost</span>
                          <span className="text-gray-500 text-xs ml-auto">{totalLeads > 0 ? ((lostStage.count / totalLeads) * 100).toFixed(1) : 0}% of all leads</span>
                        </div>
                        <div className="flex-shrink-0 w-28 text-right">
                          <div className="text-red-400 text-sm font-bold">{lostStage.count}</div>
                          <div className="text-gray-500 text-[10px]">+{lostStage.thisMonth} this mo.</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Overall conversion badge */}
                <div className="mt-6 flex items-center justify-center">
                  <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 px-5 py-3 rounded-2xl">
                    <Award className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-green-400 font-black text-lg">{overallConv}%</p>
                      <p className="text-gray-400 text-xs">Overall Conversion Rate</p>
                    </div>
                    <div className="ml-4 pl-4 border-l border-white/10">
                      <p className="text-amber-400 font-bold text-sm">{paidCount} paid</p>
                      <p className="text-gray-500 text-xs">of {totalLeads} leads</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-4">

                {/* Lead Score Distribution */}
                <div className="bg-slate-800 rounded-2xl border border-white/5 p-5">
                  <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-400" /> Lead Score
                  </h3>
                  <div className="space-y-3">
                    {[
                      { key: 'hot', label: 'Hot', icon: Flame, color: 'text-red-400', bar: 'bg-red-500', bg: 'bg-red-500/10' },
                      { key: 'warm', label: 'Warm', icon: Thermometer, color: 'text-amber-400', bar: 'bg-amber-500', bg: 'bg-amber-500/10' },
                      { key: 'cold', label: 'Cold', icon: Snowflake, color: 'text-blue-400', bar: 'bg-blue-500', bg: 'bg-blue-500/10' },
                    ].map(({ key, label, icon: Icon, color, bar, bg }) => {
                      const val = score[key as keyof typeof score] || 0
                      const pct = ((val / scoreTotal) * 100).toFixed(0)
                      return (
                        <div key={key}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <Icon className={`w-3.5 h-3.5 ${color}`} />
                              <span className={`text-xs font-semibold ${color}`}>{label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-white text-xs font-bold">{val}</span>
                              <span className="text-gray-500 text-[10px]">{pct}%</span>
                            </div>
                          </div>
                          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${bar} transition-all duration-500`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Package distribution */}
                <div className="bg-slate-800 rounded-2xl border border-white/5 p-5">
                  <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                    <Award className="w-4 h-4 text-violet-400" /> Package Distribution
                  </h3>
                  <div className="space-y-2.5">
                    {(funnel.purchasesByTier || []).map((t: any) => {
                      const maxRev = Math.max(...(funnel.purchasesByTier || []).map((x: any) => x.revenue), 1)
                      const barW = Math.max(8, (t.revenue / maxRev) * 100)
                      const color = TIER_COLORS[t._id] || 'bg-violet-500'
                      return (
                        <div key={t._id}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-white capitalize">{t._id || 'Unknown'}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 text-[10px]">{t.count} sales</span>
                              <span className="text-violet-400 text-[10px] font-bold">{fmt(t.revenue)}</span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${color}`} style={{ width: `${barW}%` }} />
                          </div>
                        </div>
                      )
                    })}
                    {!funnel.purchasesByTier?.length && (
                      <p className="text-gray-600 text-xs text-center py-4">No purchase data yet</p>
                    )}
                  </div>
                </div>

                {/* Lost Reasons */}
                {funnel.lostReasons?.length > 0 && (
                  <div className="bg-slate-800 rounded-2xl border border-white/5 p-5">
                    <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" /> Why Leads Are Lost
                    </h3>
                    <div className="space-y-2">
                      {funnel.lostReasons.map((r: any) => (
                        <div key={r._id} className="flex items-center justify-between px-3 py-2 bg-red-500/5 border border-red-500/10 rounded-xl">
                          <span className="text-gray-300 text-xs truncate flex-1">{r._id || 'Unspecified'}</span>
                          <span className="text-red-400 text-xs font-bold ml-2 flex-shrink-0">{r.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom row: Unit Economics + Monthly Trend + Conversion tips */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Unit Economics */}
              <div className="bg-slate-800 rounded-2xl border border-white/5 p-5">
                <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" /> Unit Economics
                </h3>
                <div className="space-y-3">
                  {[
                    { label: 'Avg Order Value', value: fmt(unit.avgOrderValue || 0), color: 'text-white' },
                    { label: 'Est. LTV', value: fmt(unit.estimatedLTV || 0), color: 'text-emerald-400' },
                    { label: 'Est. CAC', value: fmt(unit.estimatedCAC || 0), color: 'text-amber-400' },
                    { label: 'LTV:CAC Ratio', value: unit.ltvCacRatio || 'N/A', color: Number(unit.ltvCacRatio) >= 3 ? 'text-green-400' : 'text-red-400' },
                    { label: 'Payback Period', value: `${unit.paybackMonths || 'N/A'} mo.`, color: 'text-blue-400' },
                    { label: 'Commission Paid', value: fmt(unit.commissionPaid || 0), color: 'text-violet-400' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-gray-400 text-xs">{item.label}</span>
                      <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly Trend */}
              <div className="bg-slate-800 rounded-2xl border border-white/5 p-5">
                <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-blue-400" /> Monthly Lead Trend
                </h3>
                {funnel.monthlyLeads?.length > 0 ? (
                  <div className="space-y-3">
                    {funnel.monthlyLeads.map((m: any) => {
                      const maxTotal = Math.max(...funnel.monthlyLeads.map((x: any) => x.total), 1)
                      const conv = m.total > 0 ? ((m.paid / m.total) * 100).toFixed(0) : 0
                      return (
                        <div key={m._id}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-gray-400 text-xs">{m._id}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-white text-xs font-bold">{m.total}</span>
                              <span className="text-green-400 text-[10px]">{m.paid} paid</span>
                              <span className="text-violet-400 text-[10px]">{conv}%</span>
                            </div>
                          </div>
                          <div className="h-2 bg-slate-700 rounded-full overflow-hidden flex gap-0.5">
                            <div className="h-full bg-blue-500/60 rounded-full transition-all"
                              style={{ width: `${(m.total / maxTotal) * 100}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-600">
                    <BarChart2 className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-xs">No historical data yet</p>
                  </div>
                )}
              </div>

              {/* Revenue Trend + Tips */}
              <div className="bg-slate-800 rounded-2xl border border-white/5 p-5">
                <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-amber-400" /> Revenue Snapshot
                </h3>
                <div className="space-y-3 mb-5">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <p className="text-amber-400 text-xs font-medium mb-0.5">This Month</p>
                    <p className="text-white font-black text-xl">{fmt(funnel.revenue?.thisMonth || 0)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-700/50 border border-white/5">
                    <p className="text-gray-400 text-xs font-medium mb-0.5">Last Month</p>
                    <p className="text-white font-bold">{fmt(funnel.revenue?.lastMonth || 0)}</p>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${Number(revGrowth) >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'} border`}>
                    <Zap className={`w-3.5 h-3.5 ${Number(revGrowth) >= 0 ? 'text-green-400' : 'text-red-400'}`} />
                    <span className={`text-sm font-bold ${Number(revGrowth) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {Number(revGrowth) >= 0 ? '+' : ''}{revGrowth}% MoM
                    </span>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/5">
                  <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider mb-2">Conversion Tips</p>
                  <div className="space-y-1.5 text-[11px] text-gray-400">
                    <p className="flex items-start gap-1.5"><span className="text-orange-400 mt-0.5">•</span> Follow up hot leads within 2 hours</p>
                    <p className="flex items-start gap-1.5"><span className="text-amber-400 mt-0.5">•</span> Offer limited-time discounts to warm leads</p>
                    <p className="flex items-start gap-1.5"><span className="text-green-400 mt-0.5">•</span> Use WhatsApp for faster conversions</p>
                    <p className="flex items-start gap-1.5"><span className="text-violet-400 mt-0.5">•</span> Free webinar → paid package upsell</p>
                    <p className="flex items-start gap-1.5"><span className="text-blue-400 mt-0.5">•</span> Move demo_done leads fast — highest intent</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
