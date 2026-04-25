'use client'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { salesAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import {
  TrendingUp, IndianRupee, Clock, CheckCircle,
  AlertCircle, Zap, ArrowUpRight, Calendar, ArrowRight, Package
} from 'lucide-react'
import Link from 'next/link'

type Period = 'today' | '7' | '30' | 'custom'

function DateFilter({ period, setPeriod, from, setFrom, to, setTo }: {
  period: Period; setPeriod: (p: Period) => void
  from: string; setFrom: (v: string) => void; to: string; setTo: (v: string) => void
}) {
  const OPTS: { key: Period; label: string }[] = [
    { key: 'today', label: 'Today' }, { key: '7', label: '7 Days' },
    { key: '30', label: '30 Days' }, { key: 'custom', label: 'Custom' },
  ]
  return (
    <div className="space-y-2">
      <div className="flex gap-2 flex-wrap">
        {OPTS.map(o => (
          <button key={o.key} onClick={() => setPeriod(o.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${period === o.key ? 'bg-blue-600 border-blue-500 text-white' : 'bg-dark-800 border-dark-700 text-dark-400 hover:text-white'}`}>
            {o.label}
          </button>
        ))}
      </div>
      {period === 'custom' && (
        <div className="flex gap-2 items-center">
          <Calendar className="w-3.5 h-3.5 text-dark-400 flex-shrink-0" />
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="bg-dark-800 border border-dark-700 text-white text-xs rounded-lg px-2 py-1.5 flex-1" />
          <span className="text-dark-500 text-xs">to</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="bg-dark-800 border border-dark-700 text-white text-xs rounded-lg px-2 py-1.5 flex-1" />
        </div>
      )}
    </div>
  )
}

export default function SalesEarningsPage() {
  const { user } = useAuthStore()
  const [period, setPeriod] = useState<Period>('30')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const queryParams = period === 'custom' ? (from && to ? { period, from, to } : null) : { period }

  const { data, isLoading } = useQuery({
    queryKey: ['sales-earnings', period, from, to],
    queryFn: () => salesAPI.earnings(queryParams || { period: '30' }).then(r => r.data),
    enabled: period !== 'custom' || !!(from && to),
  })

  const totalEarnings = data?.totalEarnings || 0
  const byPackage = data?.byPackage || {}
  const recent = data?.recentCommissions || []
  const monthly = data?.monthly || []
  const wallet = data?.wallet || 0
  const allTimeEarnings = data?.allTimeEarnings || 0
  const thisMonth = monthly[monthly.length - 1]?.total || 0

  const packageColors: Record<string, string> = {
    starter: 'text-blue-400 bg-blue-500/15 border-blue-500/25',
    pro: 'text-violet-400 bg-violet-500/15 border-violet-500/25',
    elite: 'text-amber-400 bg-amber-500/15 border-amber-500/25',
    supreme: 'text-pink-400 bg-pink-500/15 border-pink-500/25',
  }

  return (
    <div className="space-y-5 pb-8 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Earnings</h1>
          <p className="text-gray-400 text-sm mt-0.5">Your sales Partnership earnings breakdown</p>
        </div>
        <Link href="/sales/withdraw"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all">
          Withdraw <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-2xl p-4 border border-blue-500/15 col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-300 text-xs uppercase tracking-wide font-medium mb-1">Available Wallet</p>
              <p className="text-white text-3xl font-black">₹{wallet.toLocaleString()}</p>
              <p className="text-blue-400 text-xs mt-1">All time: ₹{allTimeEarnings.toLocaleString()}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-blue-500/15 flex items-center justify-center">
              <IndianRupee className="w-7 h-7 text-blue-400" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 rounded-2xl p-4 border border-indigo-500/15">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center mb-3">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-xl font-bold text-white">₹{thisMonth.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-0.5">This Month</p>
        </div>
        <div className="bg-gradient-to-br from-violet-500/20 to-violet-600/10 rounded-2xl p-4 border border-violet-500/15">
          <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center mb-3">
            <Zap className="w-4 h-4 text-violet-400" />
          </div>
          <p className="text-xl font-bold text-white">₹{totalEarnings.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-0.5">In Period</p>
        </div>
      </div>

      {/* Date Filter */}
      <div className="bg-dark-800 rounded-2xl border border-dark-700 p-4">
        <p className="text-white text-sm font-semibold mb-3">Filter Period</p>
        <DateFilter period={period} setPeriod={setPeriod} from={from} setFrom={setFrom} to={to} setTo={setTo} />
      </div>

      {/* Monthly Chart (bar) */}
      {monthly.length > 0 && (
        <div className="bg-dark-800 rounded-2xl border border-dark-700 p-5">
          <h3 className="text-white font-semibold text-sm mb-4">Monthly Trend</h3>
          <div className="flex items-end gap-2 h-24">
            {monthly.map((m: any, i: number) => {
              const maxVal = Math.max(...monthly.map((x: any) => x.total), 1)
              const pct = (m.total / maxVal) * 100
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full relative" style={{ height: '72px' }}>
                    <div className="absolute bottom-0 w-full rounded-t-lg bg-blue-500/30 border border-blue-500/20 transition-all" style={{ height: `${Math.max(pct, 4)}%` }}>
                      {pct > 20 && <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 to-transparent rounded-t-lg" />}
                    </div>
                  </div>
                  <span className="text-[9px] text-dark-500 font-medium">{m.month}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* By Package */}
      {Object.keys(byPackage).length > 0 && (
        <div className="bg-dark-800 rounded-2xl border border-dark-700 p-5">
          <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-400" /> Earnings by Package
          </h3>
          <div className="space-y-2">
            {Object.entries(byPackage).map(([tier, amount]: [string, any]) => (
              <div key={tier} className="flex items-center justify-between p-3 rounded-xl bg-dark-700/50 border border-dark-600">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${packageColors[tier.toLowerCase()] || 'text-gray-400 bg-gray-500/10 border-gray-500/20'}`}>
                  {tier}
                </span>
                <span className="text-white font-bold text-sm">₹{amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Commissions */}
      <div className="bg-dark-800 rounded-2xl border border-dark-700 p-5">
        <h3 className="text-white font-semibold mb-4">Recent Partnership earnings</h3>
        {isLoading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-dark-700 rounded-xl animate-pulse" />)}</div>
        ) : recent.length === 0 ? (
          <div className="text-center py-8 text-dark-500 text-sm">No Partnership earning records in this period</div>
        ) : (
          <div className="space-y-2">
            {recent.map((c: any) => (
              <div key={c._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.03] transition-colors border border-transparent hover:border-blue-500/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                    <IndianRupee className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">{c.customerName || 'Customer'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {c.packageTier && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border capitalize ${packageColors[c.packageTier?.toLowerCase()] || 'text-gray-400 bg-gray-500/10 border-gray-500/20'}`}>
                          {c.packageTier}
                        </span>
                      )}
                      <span className="text-xs text-dark-500">{new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>
                </div>
                <p className="text-green-400 font-bold text-sm">+₹{(c.amount || 0).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Withdraw CTA */}
      <div className="bg-dark-800 rounded-2xl border border-blue-500/15 p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-white font-semibold">Ready to Withdraw?</p>
          <p className="text-gray-400 text-sm mt-0.5">Transfer earnings to your bank account</p>
        </div>
        <Link href="/sales/withdraw"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all flex-shrink-0">
          Withdraw <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}
