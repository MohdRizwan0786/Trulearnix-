'use client'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import AdminLayout from '@/components/AdminLayout'
import { adminAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import {
  TrendingUp, TrendingDown, DollarSign, Receipt,
  FileText, ArrowUpRight, ArrowDownRight,
  Plus, Trash2, X, Loader2,
  Wallet, BarChart3, PieChart,
  ShieldCheck, Calculator, BadgePercent, Coins,
  IndianRupee, CreditCard, Building2, Activity
} from 'lucide-react'
import { format } from 'date-fns'

type Tab = 'overview' | 'pnl' | 'gst' | 'tds' | 'expenses'

const fmt = (n: number) => `₹${Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
const fmtShort = (n: number) => {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(1)}Cr`
  if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(1)}L`
  if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(1)}K`
  return `${sign}₹${abs.toFixed(0)}`
}

const EXPENSE_CATEGORIES = ['server','marketing','salary','tools','office','refund','legal','other']
const catColors: Record<string,string> = {
  server:'bg-blue-500/20 text-blue-400 border-blue-500/30',
  marketing:'bg-pink-500/20 text-pink-400 border-pink-500/30',
  salary:'bg-violet-500/20 text-violet-400 border-violet-500/30',
  tools:'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  office:'bg-amber-500/20 text-amber-400 border-amber-500/30',
  refund:'bg-red-500/20 text-red-400 border-red-500/30',
  legal:'bg-orange-500/20 text-orange-400 border-orange-500/30',
  other:'bg-gray-500/20 text-gray-400 border-gray-500/30',
}
const catBar: Record<string,string> = {
  server:'bg-blue-500', marketing:'bg-pink-500', salary:'bg-violet-500',
  tools:'bg-cyan-500', office:'bg-amber-500', refund:'bg-red-500',
  legal:'bg-orange-500', other:'bg-gray-500',
}
const tierColors: Record<string,string> = {
  starter:'text-sky-400 bg-sky-500/20', pro:'text-violet-400 bg-violet-500/20',
  elite:'text-amber-400 bg-amber-500/20', supreme:'text-rose-400 bg-rose-500/20', free:'text-gray-400 bg-gray-500/20'
}

function GrowthBadge({ value }: { value: number }) {
  const positive = value >= 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-lg ${positive ? 'text-green-400 bg-green-500/15 border border-green-500/20' : 'text-red-400 bg-red-500/15 border border-red-500/20'}`}>
      {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(value).toFixed(1)}%
    </span>
  )
}

function KpiCard({ icon: Icon, label, value, sub, growth, accent }: {
  icon: any; label: string; value: string; sub?: string; growth?: number; accent: string
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gray-900 border p-5 ${accent}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/5`}>
          <Icon className="w-5 h-5 text-white/60" />
        </div>
        {growth !== undefined && <GrowthBadge value={growth} />}
      </div>
      <p className="text-2xl font-black text-white tracking-tight">{value}</p>
      <p className="text-gray-400 text-xs mt-1 font-medium">{label}</p>
      {sub && <p className="text-gray-600 text-xs mt-0.5">{sub}</p>}
    </div>
  )
}

// Simple bar chart using SVG
function BarChart({ data, height = 80, barColor = '#7c3aed', label2Color }: {
  data: { label: string; v1: number; v2?: number }[]
  height?: number; barColor?: string; label2Color?: string
}) {
  if (!data.length) return <div className="h-20 flex items-center justify-center text-gray-600 text-xs">No data</div>
  const max = Math.max(...data.map(d => Math.max(d.v1, d.v2 || 0)), 1)
  const [tooltip, setTooltip] = useState<{ i: number; x: number; y: number } | null>(null)
  const W = 100 / data.length
  return (
    <div className="relative select-none">
      <svg viewBox={`0 0 100 ${height}`} className="w-full overflow-visible" style={{ height }}>
        {data.map((d, i) => {
          const h1 = (d.v1 / max) * (height - 12)
          const h2 = d.v2 ? (d.v2 / max) * (height - 12) : 0
          const x = i * W
          const bw = d.v2 ? W * 0.42 : W * 0.7
          const gap = d.v2 ? W * 0.02 : 0
          return (
            <g key={i}
              onMouseEnter={e => setTooltip({ i, x: (i / data.length) * 100, y: 0 })}
              onMouseLeave={() => setTooltip(null)}
              className="cursor-pointer"
            >
              <rect x={x + (W - (d.v2 ? bw * 2 + gap : bw)) / 2} y={height - 12 - h1} width={bw} height={h1} rx="1.5" fill={barColor} opacity={tooltip?.i === i ? 1 : 0.75} />
              {d.v2 !== undefined && (
                <rect x={x + (W - (bw * 2 + gap)) / 2 + bw + gap} y={height - 12 - h2} width={bw} height={h2} rx="1.5" fill={label2Color || '#10b981'} opacity={tooltip?.i === i ? 1 : 0.6} />
              )}
              <text x={x + W / 2} y={height - 2} textAnchor="middle" fontSize="3.5" fill="#6b7280">{d.label}</text>
            </g>
          )
        })}
      </svg>
      {tooltip !== null && (
        <div className="absolute top-0 left-0 pointer-events-none z-10 bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs shadow-xl"
          style={{ left: `${tooltip.x}%`, transform: 'translateX(-50%)', marginTop: '-2px' }}>
          <p className="text-white font-bold mb-0.5">{data[tooltip.i].label}</p>
          <p className="text-violet-300">{fmtShort(data[tooltip.i].v1)}</p>
          {data[tooltip.i].v2 !== undefined && <p className="text-emerald-300">{fmtShort(data[tooltip.i].v2!)}</p>}
        </div>
      )}
    </div>
  )
}

export default function FinanceDashboard() {
  const [tab, setTab] = useState<Tab>('overview')
  const [period, setPeriod] = useState('mtd')
  const [chartPeriod, setChartPeriod] = useState('30d')
  const [pnlYear, setPnlYear] = useState(new Date().getFullYear())
  const [gstYear, setGstYear] = useState(new Date().getFullYear())
  const [tdsYear, setTdsYear] = useState(new Date().getFullYear())
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [expForm, setExpForm] = useState({
    title:'', category:'server', amount:'', gstPaid:'',
    vendor:'', invoiceNumber:'', date: format(new Date(),'yyyy-MM-dd'), notes:''
  })
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  const qc = useQueryClient()

  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ['finance-overview', period],
    queryFn: () => adminAPI.financeOverview(period).then(r => r.data),
  })
  const { data: chartData, isLoading: loadingChart } = useQuery({
    queryKey: ['finance-chart', chartPeriod],
    queryFn: () => adminAPI.financeChart(chartPeriod).then(r => r.data),
    enabled: tab === 'overview',
  })
  const { data: pnlData, isLoading: loadingPnl } = useQuery({
    queryKey: ['finance-pnl', pnlYear],
    queryFn: () => adminAPI.financePnl(pnlYear).then(r => r.data),
    enabled: tab === 'pnl',
  })
  const { data: gstData, isLoading: loadingGst } = useQuery({
    queryKey: ['finance-gst', gstYear],
    queryFn: () => adminAPI.financeGst(gstYear).then(r => r.data),
    enabled: tab === 'gst',
  })
  const { data: tdsData, isLoading: loadingTds } = useQuery({
    queryKey: ['finance-tds', tdsYear],
    queryFn: () => adminAPI.financeTds(tdsYear).then(r => r.data),
    enabled: tab === 'tds',
  })
  const { data: expData, isLoading: loadingExp } = useQuery({
    queryKey: ['finance-expenses'],
    queryFn: () => adminAPI.financeExpenses().then(r => r.data),
    enabled: tab === 'expenses',
  })

  const s = overview?.summary || {}

  const saveExpense = async () => {
    if (!expForm.title || !expForm.category || !expForm.amount) return toast.error('Title, category, amount required')
    setSaving(true)
    try {
      await adminAPI.addExpense({ ...expForm, amount: Number(expForm.amount), gstPaid: Number(expForm.gstPaid) || 0 })
      toast.success('Expense added')
      setShowExpenseModal(false)
      setExpForm({ title:'', category:'server', amount:'', gstPaid:'', vendor:'', invoiceNumber:'', date: format(new Date(),'yyyy-MM-dd'), notes:'' })
      qc.invalidateQueries({ queryKey: ['finance-expenses'] })
      qc.invalidateQueries({ queryKey: ['finance-overview'] })
    } catch { toast.error('Failed to add') } finally { setSaving(false) }
  }

  const deleteExpense = async (id: string) => {
    if (!confirm('Delete this expense?')) return
    setDeletingId(id)
    try {
      await adminAPI.deleteExpense(id)
      toast.success('Deleted')
      qc.invalidateQueries({ queryKey: ['finance-expenses'] })
      qc.invalidateQueries({ queryKey: ['finance-overview'] })
    } catch { toast.error('Failed') } finally { setDeletingId('') }
  }

  // Build chart bars from revenue-chart API
  const buildChartBars = () => {
    const rev = chartData?.revenueByDay || []
    const exp = chartData?.expenseByDay || []
    if (!rev.length && !exp.length) return []
    // Get all unique dates
    const dates = Array.from(new Set([...rev.map((r: any) => r._id), ...exp.map((e: any) => e._id)])).sort() as string[]
    return dates.slice(-20).map((d: string) => {
      const r = rev.find((x: any) => x._id === d)?.revenue || 0
      const e = exp.find((x: any) => x._id === d)?.total || 0
      return { label: d.slice(5), v1: r, v2: e }
    })
  }

  // Build monthly chart from P&L data
  const buildPnlBars = () => {
    if (!pnlData?.pnl) return []
    return pnlData.pnl.map((row: any) => ({
      label: row.month.slice(0, 3),
      v1: row.grossRevenue,
      v2: row.expenses,
    }))
  }

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'pnl', label: 'P&L', icon: TrendingUp },
    { id: 'gst', label: 'GST', icon: BadgePercent },
    { id: 'tds', label: 'TDS', icon: ShieldCheck },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* ── Page Header ── */}
        <div className="page-header">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Calculator className="w-5 h-5 text-white" />
                </div>
                Finance Dashboard
              </h1>
              <p className="text-gray-500 text-sm mt-1">Revenue · GST · TDS · P&L · Expenses</p>
            </div>
            <div className="flex items-center gap-3">
              {tab === 'expenses' && (
                <button onClick={() => setShowExpenseModal(true)} className="btn-primary flex items-center gap-2 text-sm">
                  <Plus className="w-4 h-4" /> Add Expense
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 bg-gray-900 border border-gray-800 p-1 rounded-2xl w-fit">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t.id ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20' : 'text-gray-400 hover:text-white'}`}>
              <t.icon className="w-3.5 h-3.5" />{t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ─────────────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <div className="space-y-6">
            {/* Period selector */}
            <div className="flex flex-wrap gap-2">
              {[['mtd','This Month'],['ytd','This Year'],['7d','7 Days'],['30d','30 Days'],['90d','90 Days'],['all','All Time']].map(([v,l]) => (
                <button key={v} onClick={() => setPeriod(v)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${period === v ? 'bg-amber-500 text-black' : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-600'}`}>
                  {l}
                </button>
              ))}
            </div>

            {loadingOverview ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(8)].map((_,i)=><div key={i} className="h-32 bg-gray-900 rounded-2xl animate-pulse border border-gray-800"/>)}</div>
            ) : (
              <>
                {/* KPI Row 1 */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <KpiCard icon={IndianRupee} label="Gross Revenue" value={fmtShort(s.grossRevenue||0)} sub={`${s.salesCount||0} sales`} growth={s.revenueGrowth} accent="border-violet-500/25" />
                  <KpiCard icon={TrendingUp} label="Net Revenue (ex-GST)" value={fmtShort(s.netRevenue||0)} sub="After 18% GST" accent="border-blue-500/25" />
                  <KpiCard icon={Activity} label={s.netProfit >= 0 ? 'Net Profit' : 'Net Loss'} value={fmtShort(Math.abs(s.netProfit||0))} sub="After all deductions" accent={s.netProfit >= 0 ? 'border-green-500/25' : 'border-red-500/25'} />
                  <KpiCard icon={BarChart3} label="Gross Profit" value={fmtShort(s.grossProfit||0)} sub="Rev - Comm - Withdrawals" accent="border-emerald-500/25" />
                </div>

                {/* KPI Row 2 */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <KpiCard icon={BadgePercent} label="GST Collected" value={fmtShort(s.gstCollected||0)} sub={`Input: ${fmtShort(s.gstPaidOnExpenses||0)} · Net: ${fmtShort(s.netGstPayable||0)}`} accent="border-orange-500/25" />
                  <KpiCard icon={ShieldCheck} label="TDS Deducted (2%)" value={fmtShort(s.tdsDeducted||0)} sub={`On ${fmtShort(s.paidCommissions||0)} commissions`} accent="border-red-500/25" />
                  <KpiCard icon={Coins} label="Commissions Due" value={fmtShort(s.totalCommissions||0)} sub={`${s.pendingCommCount||0} pending · ${fmtShort(s.pendingComm||0)}`} accent="border-amber-500/25" />
                  <KpiCard icon={Wallet} label="Withdrawals Paid" value={fmtShort(s.withdrawalsPaid||0)} sub={`${s.pendingWithdCount||0} pending · ${fmtShort(s.pendingWithd||0)}`} accent="border-pink-500/25" />
                </div>

                {/* Revenue Chart + P&L Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Revenue Chart */}
                  <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-white text-sm flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-violet-400" /> Revenue vs Expenses
                        </h3>
                        <p className="text-gray-600 text-xs mt-0.5">Daily trend — violet = revenue, green = expenses</p>
                      </div>
                      <div className="flex gap-1">
                        {[['7d','7D'],['30d','30D'],['90d','90D']].map(([v,l]) => (
                          <button key={v} onClick={() => setChartPeriod(v)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${chartPeriod === v ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                    {loadingChart ? (
                      <div className="h-24 bg-gray-800 rounded-xl animate-pulse" />
                    ) : buildChartBars().length === 0 ? (
                      <div className="h-24 flex items-center justify-center">
                        <p className="text-gray-600 text-sm">No data for this period</p>
                      </div>
                    ) : (
                      <>
                        <BarChart data={buildChartBars()} height={90} barColor="#7c3aed" label2Color="#10b981" />
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-800">
                          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-violet-600"/><span className="text-gray-500 text-xs">Revenue</span></div>
                          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-emerald-500"/><span className="text-gray-500 text-xs">Expenses</span></div>
                          <div className="ml-auto text-gray-600 text-xs">Hover bars for details</div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Revenue by Tier */}
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                    <h3 className="font-bold text-white text-sm flex items-center gap-2 mb-4">
                      <PieChart className="w-4 h-4 text-violet-400" /> Revenue by Package
                    </h3>
                    {(overview?.tierBreakdown||[]).length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-8">No sales yet</p>
                    ) : (
                      <div className="space-y-3">
                        {(overview?.tierBreakdown||[]).map((t:any) => {
                          const pct = s.grossRevenue > 0 ? Math.round((t.total / s.grossRevenue) * 100) : 0
                          return (
                            <div key={t._id}>
                              <div className="flex items-center justify-between text-xs mb-1.5">
                                <span className={`px-2 py-0.5 rounded-lg font-semibold capitalize ${tierColors[t._id]||'text-gray-400 bg-gray-500/20'}`}>{t._id}</span>
                                <span className="text-white font-bold">{fmtShort(t.total)} <span className="text-gray-500 font-normal">({t.count})</span></span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all" style={{width:`${pct}%`}}/>
                                </div>
                                <span className="text-gray-600 text-xs w-7 text-right">{pct}%</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    <div className="mt-4 pt-4 border-t border-gray-800 space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Active Partners</span>
                        <span className="text-white font-semibold">{s.activeAffiliates||0}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Net GST Payable</span>
                        <span className="text-orange-400 font-semibold">{fmtShort(s.netGstPayable||0)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Total Expenses</span>
                        <span className="text-red-400 font-semibold">{fmtShort(s.totalExpenses||0)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* P&L Summary card */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-violet-400" /> P&L Summary
                    <span className="ml-auto text-gray-600 text-xs font-normal capitalize">{period === 'mtd' ? 'Month to Date' : period === 'ytd' ? 'Year to Date' : period}</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                    {[
                      { label: 'Gross Revenue', value: s.grossRevenue||0, color:'text-green-400', note:'' },
                      { label: 'GST Collected (18%)', value: s.gstCollected||0, color:'text-orange-400', note:'Payable to Govt', indent: true },
                      { label: '(-) Commissions', value: s.totalCommissions||0, color:'text-amber-400', note:'' },
                      { label: '(-) Withdrawals Processed', value: s.withdrawalsPaid||0, color:'text-pink-400', note:'' },
                      { label: '(-) Operating Expenses', value: s.totalExpenses||0, color:'text-red-400', note:'', growth: s.expenseGrowth },
                      { label: '(-) TDS @ 2%', value: s.tdsDeducted||0, color:'text-red-300', note:'Govt deposit' },
                    ].map((row, i) => (
                      <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-800 last:border-0">
                        <span className={`text-sm text-gray-400 ${row.indent ? 'pl-3' : ''}`}>
                          {row.label}
                          {row.note && <span className="text-xs text-gray-600 ml-1.5">({row.note})</span>}
                        </span>
                        <div className="flex items-center gap-2">
                          {row.growth !== undefined && <GrowthBadge value={row.growth} />}
                          <span className={`font-semibold text-sm ${row.color}`}>{fmt(row.value)}</span>
                        </div>
                      </div>
                    ))}
                    <div className="md:col-span-2 flex items-center justify-between pt-4 mt-2 border-t-2 border-gray-700">
                      <span className="text-white font-bold text-base">Net {s.netProfit >= 0 ? 'Profit' : 'Loss'}</span>
                      <span className={`font-black text-xl ${s.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{fmt(Math.abs(s.netProfit||0))}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── P&L REPORT TAB ────────────────────────────────────────────────────── */}
        {tab === 'pnl' && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <select value={pnlYear} onChange={e => setPnlYear(Number(e.target.value))}
                className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500 w-28">
                {[2024,2025,2026].map(y=><option key={y} value={y}>{y}</option>)}
              </select>
              <span className="text-gray-500 text-sm">Monthly Profit & Loss Statement</span>
            </div>

            {loadingPnl ? <div className="h-64 bg-gray-900 rounded-2xl animate-pulse border border-gray-800"/> : (
              <>
                {/* Monthly bar chart */}
                {pnlData?.pnl && (
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                    <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-violet-400" /> Monthly Revenue vs Expenses
                    </h3>
                    <BarChart data={buildPnlBars()} height={80} barColor="#7c3aed" label2Color="#ef4444" />
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-violet-600"/><span className="text-gray-500 text-xs">Revenue</span></div>
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-500"/><span className="text-gray-500 text-xs">Expenses</span></div>
                    </div>
                  </div>
                )}

                {/* Totals strip */}
                {pnlData?.totals && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label:'Gross Revenue', value: pnlData.totals.grossRevenue, color:'text-green-400 bg-green-500/10 border-green-500/20' },
                      { label:'Net Revenue', value: pnlData.totals.netRevenue, color:'text-blue-400 bg-blue-500/10 border-blue-500/20' },
                      { label:'Total Expenses', value: pnlData.totals.expenses, color:'text-red-400 bg-red-500/10 border-red-500/20' },
                      { label:'Net Profit', value: pnlData.totals.netProfit, color: pnlData.totals.netProfit >= 0 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20' },
                    ].map((c,i) => (
                      <div key={i} className={`rounded-xl border p-4 ${c.color}`}>
                        <p className="text-lg font-black">{fmtShort(c.value)}</p>
                        <p className="text-xs opacity-70 mt-0.5">{c.label} {pnlYear}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-800/50 border-b border-gray-800">
                          <th className="text-left px-4 py-3 text-gray-400 font-medium w-16">Month</th>
                          <th className="text-right px-3 py-3 text-gray-400 font-medium">Gross Rev.</th>
                          <th className="text-right px-3 py-3 text-gray-400 font-medium">GST</th>
                          <th className="text-right px-3 py-3 text-gray-400 font-medium">Net Rev.</th>
                          <th className="text-right px-3 py-3 text-gray-400 font-medium">Commission</th>
                          <th className="text-right px-3 py-3 text-gray-400 font-medium">TDS</th>
                          <th className="text-right px-3 py-3 text-gray-400 font-medium">Withdrawals</th>
                          <th className="text-right px-3 py-3 text-gray-400 font-medium">Expenses</th>
                          <th className="text-right px-4 py-3 text-gray-400 font-medium">Net Profit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(pnlData?.pnl||[]).map((row:any, i:number) => (
                          <tr key={i} className="border-b border-gray-800/60 hover:bg-gray-800/30 transition-colors">
                            <td className="px-4 py-3 text-white font-semibold">{row.month}</td>
                            <td className="px-3 py-3 text-right text-gray-300">{row.grossRevenue>0?fmtShort(row.grossRevenue):'-'}</td>
                            <td className="px-3 py-3 text-right text-orange-400">{row.gstCollected>0?fmtShort(row.gstCollected):'-'}</td>
                            <td className="px-3 py-3 text-right text-blue-400">{row.netRevenue>0?fmtShort(row.netRevenue):'-'}</td>
                            <td className="px-3 py-3 text-right text-amber-400">{row.commissions>0?fmtShort(row.commissions):'-'}</td>
                            <td className="px-3 py-3 text-right text-red-400">{row.tds>0?fmtShort(row.tds):'-'}</td>
                            <td className="px-3 py-3 text-right text-pink-400">{row.withdrawals>0?fmtShort(row.withdrawals):'-'}</td>
                            <td className="px-3 py-3 text-right text-gray-400">{row.expenses>0?fmtShort(row.expenses):'-'}</td>
                            <td className={`px-4 py-3 text-right font-bold ${row.netProfit>0?'text-green-400':row.netProfit<0?'text-red-400':'text-gray-500'}`}>
                              {row.netProfit!==0?fmtShort(row.netProfit):'-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      {pnlData?.totals && (
                        <tfoot>
                          <tr className="bg-violet-500/10 border-t-2 border-violet-500/30">
                            <td className="px-4 py-3 text-white font-black text-xs uppercase tracking-wide">Total</td>
                            <td className="px-3 py-3 text-right text-white font-bold">{fmtShort(pnlData.totals.grossRevenue)}</td>
                            <td className="px-3 py-3 text-right text-orange-400 font-bold">{fmtShort(pnlData.totals.gstCollected)}</td>
                            <td className="px-3 py-3 text-right text-blue-400 font-bold">{fmtShort(pnlData.totals.netRevenue)}</td>
                            <td className="px-3 py-3 text-right text-amber-400 font-bold">{fmtShort(pnlData.totals.commissions)}</td>
                            <td className="px-3 py-3 text-right text-red-400 font-bold">{fmtShort(pnlData.totals.tds)}</td>
                            <td className="px-3 py-3 text-right text-pink-400 font-bold">{fmtShort(pnlData.totals.withdrawals)}</td>
                            <td className="px-3 py-3 text-right text-gray-300 font-bold">{fmtShort(pnlData.totals.expenses)}</td>
                            <td className={`px-4 py-3 text-right text-base font-black ${pnlData.totals.netProfit>=0?'text-green-400':'text-red-400'}`}>{fmtShort(pnlData.totals.netProfit)}</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── GST TAB ──────────────────────────────────────────────────────────── */}
        {tab === 'gst' && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <select value={gstYear} onChange={e => setGstYear(Number(e.target.value))}
                className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500 w-28">
                {[2024,2025,2026].map(y=><option key={y} value={y}>{y}</option>)}
              </select>
              <span className="text-gray-500 text-sm">GST Summary — 18% on package sales</span>
            </div>

            {loadingGst ? <div className="h-64 bg-gray-900 rounded-2xl animate-pulse border border-gray-800"/> : (
              <>
                {gstData?.totals && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label:'Output GST Collected', value: gstData.totals.gstCollected, color:'text-orange-400 bg-orange-500/10 border-orange-500/25' },
                      { label:'Input GST Credit', value: gstData.totals.inputCredit, color:'text-blue-400 bg-blue-500/10 border-blue-500/25' },
                      { label:'Net GST Payable', value: gstData.totals.netGstPayable, color:'text-red-400 bg-red-500/10 border-red-500/25' },
                      { label:'Taxable Sales (Net)', value: gstData.totals.netSales, color:'text-green-400 bg-green-500/10 border-green-500/25' },
                    ].map((c,i) => (
                      <div key={i} className={`rounded-2xl border p-5 ${c.color}`}>
                        <p className="text-2xl font-black">{fmtShort(c.value)}</p>
                        <p className="text-xs opacity-70 mt-1 font-medium">{c.label}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="bg-gray-800/50 border-b border-gray-800">
                          <th className="text-left px-4 py-3 text-gray-400 font-medium">Month</th>
                          <th className="text-right px-3 py-3 text-gray-400 font-medium">Taxable Sales</th>
                          <th className="text-right px-3 py-3 text-gray-400 font-medium">GST Collected</th>
                          <th className="text-right px-3 py-3 text-gray-400 font-medium">Input Credit</th>
                          <th className="text-right px-4 py-3 text-gray-400 font-medium">Net Payable</th>
                        </tr></thead>
                        <tbody>
                          {(gstData?.gstReport||[]).map((row:any,i:number) => (
                            <tr key={i} className="border-b border-gray-800/60 hover:bg-gray-800/30">
                              <td className="px-4 py-3 text-white font-medium">{row.month}</td>
                              <td className="px-3 py-3 text-right text-gray-300">{row.netSales>0?fmtShort(row.netSales):'-'}</td>
                              <td className="px-3 py-3 text-right text-orange-400">{row.gstCollected>0?fmtShort(row.gstCollected):'-'}</td>
                              <td className="px-3 py-3 text-right text-blue-400">{row.inputCredit>0?fmtShort(row.inputCredit):'-'}</td>
                              <td className={`px-4 py-3 text-right font-semibold ${row.netGstPayable>0?'text-red-400':row.netGstPayable<0?'text-green-400':'text-gray-500'}`}>
                                {row.netGstPayable!==0?fmtShort(row.netGstPayable):'-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                    <h3 className="font-bold text-white mb-4 text-sm">GST by Package Tier</h3>
                    <div className="space-y-4">
                      {(gstData?.tierGst||[]).length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-4">No data</p>
                      ) : (gstData?.tierGst||[]).map((t:any,i:number) => {
                        const totalGst = gstData.totals?.gstCollected || 1
                        const pct = Math.round((t.gstCollected / totalGst) * 100)
                        return (
                          <div key={i}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className={`text-xs px-2 py-0.5 rounded-lg font-semibold capitalize ${tierColors[t._id]||'text-gray-400 bg-gray-500/20'}`}>{t._id}</span>
                              <div className="text-right">
                                <span className="text-white text-sm font-semibold">{fmtShort(t.gstCollected)}</span>
                                <span className="text-gray-600 text-xs ml-1">({t.count})</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-orange-500 rounded-full" style={{width:`${pct}%`}}/>
                              </div>
                              <span className="text-gray-600 text-xs w-7 text-right">{pct}%</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="mt-5 pt-4 border-t border-gray-800 space-y-1.5 text-xs text-gray-500">
                      <p>GST Rate: 18% (IGST / CGST+SGST)</p>
                      <p>HSN/SAC: 999293 (Ed-Tech Services)</p>
                      <p>GSTIN: Applied for</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── TDS TAB ──────────────────────────────────────────────────────────── */}
        {tab === 'tds' && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <select value={tdsYear} onChange={e => setTdsYear(Number(e.target.value))}
                className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500 w-28">
                {[2024,2025,2026].map(y=><option key={y} value={y}>{y}</option>)}
              </select>
              <span className="text-gray-500 text-sm">TDS u/s 194H — 2% on partner commissions</span>
            </div>

            {loadingTds ? <div className="h-64 bg-gray-900 rounded-2xl animate-pulse border border-gray-800"/> : (
              <>
                {tdsData?.summary && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label:'Total Commission Paid', value: tdsData.summary.totalCommission, isNum: false, color:'text-amber-400 bg-amber-500/10 border-amber-500/25' },
                      { label:'TDS @ 2%', value: tdsData.summary.totalTds, isNum: false, color:'text-red-400 bg-red-500/10 border-red-500/25' },
                      { label:'Net Payable to Partners', value: tdsData.summary.netPayable, isNum: false, color:'text-green-400 bg-green-500/10 border-green-500/25' },
                      { label:'Partners with TDS', value: tdsData.summary.affiliateCount, isNum: true, color:'text-violet-400 bg-violet-500/10 border-violet-500/25' },
                    ].map((c,i) => (
                      <div key={i} className={`rounded-2xl border p-5 ${c.color}`}>
                        <p className="text-2xl font-black">{c.isNum ? c.value : fmtShort(c.value as number)}</p>
                        <p className="text-xs opacity-70 mt-1 font-medium">{c.label}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-800">
                    <h3 className="text-white font-bold text-sm">Partner-wise TDS Ledger {tdsYear}</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-gray-800/30 border-b border-gray-800">
                        <th className="text-left px-4 py-3 text-gray-400 font-medium">Partner</th>
                        <th className="text-left px-3 py-3 text-gray-400 font-medium">Contact</th>
                        <th className="text-center px-3 py-3 text-gray-400 font-medium">Package</th>
                        <th className="text-right px-3 py-3 text-gray-400 font-medium">Total Commission</th>
                        <th className="text-right px-3 py-3 text-gray-400 font-medium">TDS 2%</th>
                        <th className="text-right px-4 py-3 text-gray-400 font-medium">Net Payable</th>
                      </tr></thead>
                      <tbody>
                        {(tdsData?.tdsData||[]).map((row:any,i:number) => (
                          <tr key={i} className="border-b border-gray-800/60 hover:bg-gray-800/30">
                            <td className="px-4 py-3 text-white font-medium">{row.user?.name||'—'}</td>
                            <td className="px-3 py-3 text-gray-500 text-xs">{row.user?.email}</td>
                            <td className="px-3 py-3 text-center">
                              <span className={`text-xs px-2 py-0.5 rounded-lg font-semibold capitalize ${tierColors[row.user?.packageTier]||'text-gray-400 bg-gray-500/20'}`}>{row.user?.packageTier||'—'}</span>
                            </td>
                            <td className="px-3 py-3 text-right text-amber-400 font-semibold">{fmtShort(row.totalCommission)}</td>
                            <td className="px-3 py-3 text-right text-red-400 font-semibold">{fmtShort(row.tdsAmount)}</td>
                            <td className="px-4 py-3 text-right text-green-400 font-semibold">{fmtShort(row.netPayable)}</td>
                          </tr>
                        ))}
                        {(tdsData?.tdsData||[]).length===0 && (
                          <tr><td colSpan={6} className="text-center py-16 text-gray-500">No TDS data for {tdsYear}</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── EXPENSES TAB ─────────────────────────────────────────────────────── */}
        {tab === 'expenses' && (
          <div className="space-y-5">
            {loadingExp ? (
              <div className="h-64 bg-gray-900 rounded-2xl animate-pulse border border-gray-800"/>
            ) : (
              <>
                {/* Category KPI cards */}
                {(expData?.byCategory||[]).length > 0 && (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {(expData.byCategory||[]).slice(0,4).map((c:any,i:number) => (
                        <div key={i} className={`rounded-2xl border p-4 ${catColors[c._id]||catColors.other}`}>
                          <p className="text-lg font-black">{fmtShort(c.total)}</p>
                          <p className="text-xs opacity-70 mt-0.5 font-medium capitalize">{c._id}</p>
                          <p className="text-xs opacity-50 mt-0.5">{c.count} entries</p>
                        </div>
                      ))}
                    </div>

                    {/* Expense distribution bar */}
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                      <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                        <PieChart className="w-4 h-4 text-violet-400" /> Expense Distribution
                      </h3>
                      <div className="space-y-3">
                        {(expData.byCategory||[]).map((c:any,i:number) => {
                          const totalExp = (expData.byCategory||[]).reduce((s:number,x:any)=>s+x.total,0) || 1
                          const pct = Math.round((c.total / totalExp) * 100)
                          return (
                            <div key={i} className="flex items-center gap-3">
                              <span className={`text-xs px-2 py-0.5 rounded-lg font-semibold capitalize border w-20 text-center flex-shrink-0 ${catColors[c._id]||catColors.other}`}>{c._id}</span>
                              <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${catBar[c._id]||catBar.other}`} style={{width:`${pct}%`}}/>
                              </div>
                              <span className="text-white font-semibold text-sm w-16 text-right">{fmtShort(c.total)}</span>
                              <span className="text-gray-600 text-xs w-8 text-right">{pct}%</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </>
                )}

                {/* Expense table */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
                    <h3 className="text-white font-bold text-sm">All Expenses</h3>
                    <span className="text-gray-500 text-xs">{expData?.total || 0} total entries</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-gray-800/30 border-b border-gray-800">
                        <th className="text-left px-4 py-3 text-gray-400 font-medium">Title</th>
                        <th className="text-left px-3 py-3 text-gray-400 font-medium">Category</th>
                        <th className="text-left px-3 py-3 text-gray-400 font-medium hidden sm:table-cell">Vendor</th>
                        <th className="text-right px-3 py-3 text-gray-400 font-medium">Amount</th>
                        <th className="text-right px-3 py-3 text-gray-400 font-medium hidden md:table-cell">GST Paid</th>
                        <th className="text-left px-3 py-3 text-gray-400 font-medium hidden sm:table-cell">Date</th>
                        <th className="px-4 py-3 w-10"></th>
                      </tr></thead>
                      <tbody>
                        {(expData?.expenses||[]).map((e:any,i:number) => (
                          <tr key={i} className="border-b border-gray-800/60 hover:bg-gray-800/30 transition-colors">
                            <td className="px-4 py-3">
                              <p className="text-white font-medium">{e.title}</p>
                              {e.notes && <p className="text-gray-600 text-xs mt-0.5">{e.notes}</p>}
                              {e.invoiceNumber && <p className="text-gray-600 text-xs">#{e.invoiceNumber}</p>}
                            </td>
                            <td className="px-3 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-lg font-semibold capitalize border ${catColors[e.category]||catColors.other}`}>{e.category}</span>
                            </td>
                            <td className="px-3 py-3 text-gray-500 text-xs hidden sm:table-cell">{e.vendor||'—'}</td>
                            <td className="px-3 py-3 text-right text-white font-semibold">{fmt(e.amount)}</td>
                            <td className="px-3 py-3 text-right text-blue-400 text-xs hidden md:table-cell">{e.gstPaid>0?fmt(e.gstPaid):'-'}</td>
                            <td className="px-3 py-3 text-gray-500 text-xs hidden sm:table-cell">{format(new Date(e.date),'dd MMM yyyy')}</td>
                            <td className="px-4 py-3">
                              <button onClick={() => deleteExpense(e._id)} disabled={deletingId===e._id}
                                className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-40">
                                {deletingId===e._id ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Trash2 className="w-3.5 h-3.5"/>}
                              </button>
                            </td>
                          </tr>
                        ))}
                        {(expData?.expenses||[]).length===0 && (
                          <tr>
                            <td colSpan={7} className="text-center py-16">
                              <Receipt className="w-10 h-10 text-gray-700 mx-auto mb-2" />
                              <p className="text-gray-500 text-sm">No expenses recorded</p>
                              <p className="text-gray-700 text-xs mt-1">Click "Add Expense" to get started</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="fixed inset-0" onClick={() => setShowExpenseModal(false)}/>
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-lg z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-white flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-amber-400" />
                </div>
                Add Expense
              </h2>
              <button onClick={() => setShowExpenseModal(false)} className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white"><X className="w-4 h-4"/></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block font-medium">Title *</label>
                <input value={expForm.title} onChange={e => setExpForm(p=>({...p,title:e.target.value}))} placeholder="e.g. AWS Server Cost"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 text-sm"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block font-medium">Category *</label>
                  <select value={expForm.category} onChange={e => setExpForm(p=>({...p,category:e.target.value}))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-violet-500 text-sm appearance-none">
                    {EXPENSE_CATEGORIES.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block font-medium">Date *</label>
                  <input type="date" value={expForm.date} onChange={e => setExpForm(p=>({...p,date:e.target.value}))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-violet-500 text-sm"/>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block font-medium">Amount (₹) *</label>
                  <input type="number" value={expForm.amount} onChange={e => setExpForm(p=>({...p,amount:e.target.value}))} placeholder="0"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 text-sm"/>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block font-medium">GST Paid (₹)</label>
                  <input type="number" value={expForm.gstPaid} onChange={e => setExpForm(p=>({...p,gstPaid:e.target.value}))} placeholder="0"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 text-sm"/>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block font-medium">Vendor</label>
                  <input value={expForm.vendor} onChange={e => setExpForm(p=>({...p,vendor:e.target.value}))} placeholder="Vendor name"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 text-sm"/>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block font-medium">Invoice #</label>
                  <input value={expForm.invoiceNumber} onChange={e => setExpForm(p=>({...p,invoiceNumber:e.target.value}))} placeholder="INV-001"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 text-sm"/>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block font-medium">Notes</label>
                <textarea value={expForm.notes} onChange={e => setExpForm(p=>({...p,notes:e.target.value}))} rows={2}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 text-sm resize-none" placeholder="Optional notes..."/>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowExpenseModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white text-sm font-medium transition-all">Cancel</button>
                <button onClick={saveExpense} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold hover:opacity-90 transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin"/>Saving...</> : 'Add Expense'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
