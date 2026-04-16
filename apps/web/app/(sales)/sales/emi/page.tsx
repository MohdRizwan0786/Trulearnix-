'use client'
import { useQuery } from '@tanstack/react-query'
import { salesAPI } from '@/lib/api'
import { Loader2, CheckCircle, Clock, CalendarCheck, IndianRupee, TrendingUp, Zap, AlertCircle } from 'lucide-react'

const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n || 0)

function StatusPill({ status }: { status: string }) {
  if (status === 'paid')
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/15 text-green-300 border border-green-500/25"><CheckCircle className="w-2.5 h-2.5" />Paid</span>
  if (status === 'overdue')
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-300 border border-red-500/25"><AlertCircle className="w-2.5 h-2.5" />Overdue</span>
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/25"><Clock className="w-2.5 h-2.5" />Pending</span>
}

function CommPill({ paid }: { paid: boolean }) {
  if (paid) return <span className="text-[10px] text-green-400 font-semibold flex items-center gap-0.5"><CheckCircle className="w-2.5 h-2.5" />Credited</span>
  return <span className="text-[10px] text-gray-600 font-semibold flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />Pending</span>
}

export default function SalesEmiPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['sales-emi-commissions'],
    queryFn: () => salesAPI.emiCommissions().then(r => r.data),
  })

  const installments: any[] = data?.installments || []

  const grouped: Record<string, any[]> = {}
  installments.forEach(inst => {
    const key = inst.customerName || inst.packageName || 'Unknown'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(inst)
  })

  return (
    <div className="space-y-5 max-w-3xl pb-8">

      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-3xl p-5 sm:p-6"
        style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.25) 0%, rgba(234,88,12,0.2) 100%)', border: '1px solid rgba(245,158,11,0.25)' }}>
        <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(245,158,11,0.15)' }} />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <CalendarCheck className="w-4 h-4 text-amber-300" />
            <span className="text-amber-300 text-xs font-bold uppercase tracking-wider">EMI Commissions</span>
          </div>
          <h1 className="text-2xl font-black text-white">Installment Earnings</h1>
          <p className="text-amber-200/50 text-sm mt-1">Per-installment commission from your EMI orders</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            <p className="text-gray-500 text-sm">Loading EMI data...</p>
          </div>
        </div>
      ) : (
        <>
          {/* ── Summary Cards ── */}
          <div className="grid grid-cols-3 gap-3">
            <div className="relative overflow-hidden rounded-2xl p-4 border border-white/8 bg-gradient-to-br from-white/5 to-transparent">
              <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center mb-2">
                <IndianRupee className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <p className="text-lg font-black text-white">₹{fmt(data?.totalCommission)}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Total</p>
            </div>
            <div className="relative overflow-hidden rounded-2xl p-4 border border-green-500/20 bg-gradient-to-br from-green-500/15 to-transparent">
              <div className="w-8 h-8 rounded-xl bg-green-500/15 flex items-center justify-center mb-2">
                <CheckCircle className="w-3.5 h-3.5 text-green-400" />
              </div>
              <p className="text-lg font-black text-green-300">₹{fmt(data?.earnedCommission)}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Earned</p>
            </div>
            <div className="relative overflow-hidden rounded-2xl p-4 border border-amber-500/20 bg-gradient-to-br from-amber-500/15 to-transparent">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center mb-2">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <p className="text-lg font-black text-amber-300">₹{fmt(data?.pendingCommission)}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Pending</p>
            </div>
          </div>

          {installments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-dark-800 rounded-2xl border border-white/5">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
                <TrendingUp className="w-7 h-7 text-amber-500/40" />
              </div>
              <p className="text-white font-semibold mb-1">No EMI commissions yet</p>
              <p className="text-gray-500 text-sm text-center max-w-xs">Create EMI orders to start earning per-installment commissions</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(grouped).map(([customer, insts]) => {
                const total = insts[0]?.totalInstallments || insts.length
                const paid = insts.filter(i => i.status === 'paid').length
                const totalComm = insts.reduce((s, i) => s + (i.commissionAmount || 0), 0)
                const earnedComm = insts.filter(i => i.commissionPaid).reduce((s, i) => s + (i.commissionAmount || 0), 0)
                const pct = total > 0 ? Math.round((paid / total) * 100) : 0

                return (
                  <div key={customer} className="bg-dark-800 rounded-2xl border border-white/5 overflow-hidden">
                    {/* Progress accent top */}
                    <div className="h-0.5 w-full bg-white/5">
                      <div className="h-full bg-gradient-to-r from-amber-500 to-green-500 transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>

                    {/* Header */}
                    <div className="px-4 sm:px-5 py-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center text-sm font-black text-amber-300 flex-shrink-0">
                        {customer[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white">{customer}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{insts[0]?.packageName} · {paid}/{total} installments paid</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-gray-500">Commission</p>
                        <p className="text-sm font-black text-green-300">₹{fmt(earnedComm)}<span className="text-gray-600 font-normal text-xs"> / ₹{fmt(totalComm)}</span></p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="px-4 sm:px-5 pb-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] text-gray-600">{pct}% complete</p>
                        <p className="text-[10px] text-gray-600">{paid}/{total} paid</p>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-500 to-green-400 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    {/* Installments */}
                    <div className="px-4 sm:px-5 pb-4">
                      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(total, 4)}, 1fr)` }}>
                        {insts.sort((a, b) => a.installmentNumber - b.installmentNumber).map((inst: any) => (
                          <div key={inst._id} className={`rounded-xl p-3 border text-center transition-all ${
                            inst.status === 'paid'
                              ? 'bg-green-500/10 border-green-500/20'
                              : inst.status === 'overdue'
                                ? 'bg-red-500/10 border-red-500/20'
                                : 'bg-white/3 border-white/8'
                          }`}>
                            <p className="text-[10px] text-gray-600 font-medium mb-1">#{inst.installmentNumber}</p>
                            <p className={`text-sm font-black ${inst.status === 'paid' ? 'text-green-300' : 'text-white'}`}>
                              ₹{fmt(inst.amount)}
                            </p>
                            <div className="mt-1.5 flex justify-center">
                              <StatusPill status={inst.status} />
                            </div>
                            {inst.commissionAmount > 0 && (
                              <div className="mt-2 pt-2 border-t border-white/5">
                                <p className="text-[10px] text-gray-600 mb-0.5">₹{fmt(inst.commissionAmount)}</p>
                                <div className="flex justify-center">
                                  <CommPill paid={inst.commissionPaid} />
                                </div>
                              </div>
                            )}
                            {inst.status !== 'paid' && inst.dueDate && (
                              <p className="text-[10px] text-gray-700 mt-1.5">
                                {new Date(inst.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
