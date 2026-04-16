'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminAPI } from '@/lib/api'
import AdminLayout from '@/components/AdminLayout'
import {
  CreditCard, TrendingUp, AlertTriangle, CheckCircle, Clock,
  ExternalLink, Filter, Lock, Unlock, CheckCircle2, Loader2, Wallet,
} from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_COLORS: Record<string, string> = {
  paid: 'bg-green-500/20 text-green-400 border-green-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  overdue: 'bg-red-500/20 text-red-400 border-red-500/30',
  failed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}
function fmtDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function EmiPage() {
  const [statusFilter, setStatusFilter] = useState('all')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-emi', statusFilter],
    queryFn: () => adminAPI.emi(statusFilter !== 'all' ? { status: statusFilter } : {}).then(r => r.data),
    placeholderData: (prev: any) => prev,
  })

  const markPaidMut = useMutation({
    mutationFn: (installmentId: string) => adminAPI.emiMarkPaid(installmentId),
    onSuccess: () => { toast.success('Marked as paid'); qc.invalidateQueries({ queryKey: ['admin-emi'] }) },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  })

  const collectWalletMut = useMutation({
    mutationFn: (installmentId: string) => adminAPI.emiCollectWallet(installmentId),
    onSuccess: (res) => {
      const d = res.data
      if (d.fullyPaid) {
        toast.success(d.message)
      } else {
        toast.success(`${d.message} — Send payment link for remaining ₹${d.remaining}`)
      }
      qc.invalidateQueries({ queryKey: ['admin-emi'] })
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  })

  const toggleAccessMut = useMutation({
    mutationFn: ({ ppId, lock }: { ppId: string; lock: boolean }) => adminAPI.emiToggleAccess(ppId, lock),
    onSuccess: (_, vars) => { toast.success(vars.lock ? 'Access locked' : 'Access unlocked'); qc.invalidateQueries({ queryKey: ['admin-emi'] }) },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  })

  const stats = data?.stats || {}
  const groups: any[] = data?.groups || []

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* ── Page Header ── */}
        <div className="page-header">
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            EMI Installments
          </h1>
          <p className="text-gray-400 text-sm mt-1">Manage all EMI purchases, manual payments and access control</p>
        </div>

        {/* ── KPI Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="kpi-violet">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-3">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-black text-white">{stats.totalEmiPurchases || 0}</p>
            <p className="text-white/70 text-xs mt-1">EMI Purchases</p>
          </div>
          <div className="kpi-rose">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-black text-white">{stats.totalOverdue || 0}</p>
            <p className="text-white/70 text-xs mt-1">Overdue</p>
          </div>
          <div className="kpi-emerald">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-3">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-black text-white">{stats.totalPaid || 0}</p>
            <p className="text-white/70 text-xs mt-1">Paid Installments</p>
          </div>
          <div className="kpi-amber">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-black text-white">{fmt(stats.totalCollected || 0)}</p>
            <p className="text-white/70 text-xs mt-1">Total Collected</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />
          {['all', 'pending', 'overdue', 'paid', 'failed'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                statusFilter === s ? 'bg-violet-600 text-white border-violet-600' : 'bg-slate-800 text-gray-400 border-white/10 hover:border-white/20'
              }`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Groups */}
        {isLoading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-slate-800 rounded-2xl animate-pulse" />)}</div>
        ) : groups.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-slate-900 py-16 text-center">
            <CreditCard className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No EMI records found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group: any, gi: number) => {
              const user = group.user as any
              const pp = group.packagePurchase as any
              const insts: any[] = (group.installments || []).sort((a: any, b: any) => a.installmentNumber - b.installmentNumber)
              const hasOverdue = insts.some((i: any) => i.status === 'overdue')
              const ppId = pp?._id?.toString() || ''
              const isSuspended = user?.packageSuspended
              const salesperson = insts[0]?.partnerUser as any
              const totalInst = insts[0]?.totalInstallments || insts.length

              return (
                <div key={gi} className={`rounded-2xl border bg-slate-900 overflow-hidden ${hasOverdue ? 'border-red-500/30' : 'border-white/10'}`}>
                  {/* User row */}
                  <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {user?.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{user?.name || 'Unknown'}</p>
                        <p className="text-gray-400 text-xs">{user?.email} {user?.phone ? `· ${user.phone}` : ''}</p>
                        {salesperson && (
                          <p className="text-blue-400 text-xs mt-0.5">Sales: {salesperson.name} {salesperson.affiliateCode ? `(${salesperson.affiliateCode})` : ''}</p>
                        )}
                        {(user?.wallet || 0) > 0 && (
                          <p className="text-amber-400 text-xs flex items-center gap-1 mt-0.5">
                            <Wallet className="w-3 h-3" /> Wallet: ₹{(user.wallet || 0).toLocaleString('en-IN')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-3 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium capitalize">
                        {pp?.packageTier || 'Package'}
                      </span>
                      {hasOverdue && (
                        <span className="px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                          Overdue
                        </span>
                      )}
                      {isSuspended && (
                        <span className="px-3 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Suspended
                        </span>
                      )}
                      {/* Access toggle */}
                      {ppId && (
                        <button
                          onClick={() => toggleAccessMut.mutate({ ppId, lock: !isSuspended })}
                          disabled={toggleAccessMut.isPending}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                            isSuspended
                              ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'
                              : 'bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20'
                          }`}
                        >
                          {toggleAccessMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : isSuspended ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                          {isSuspended ? 'Unlock Access' : 'Lock Access'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Installments grid */}
                  <div className={`p-5 grid gap-3 ${totalInst <= 2 ? 'grid-cols-2' : totalInst === 3 ? 'grid-cols-3' : 'grid-cols-2 lg:grid-cols-4'}`}>
                    {Array.from({ length: totalInst }, (_, i) => i + 1).map(num => {
                      const inst = insts.find((i: any) => i.installmentNumber === num)
                      if (!inst) return (
                        <div key={num} className="rounded-xl bg-slate-800/50 border border-white/5 p-3 opacity-40">
                          <p className="text-gray-500 text-xs mb-2">Installment {num}</p>
                          <p className="text-gray-600 text-sm">—</p>
                        </div>
                      )
                      return (
                        <div key={num} className={`rounded-xl border p-3 ${STATUS_COLORS[inst.status] || 'bg-gray-500/10 border-gray-500/20'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs opacity-80">Installment {num}</p>
                            <span className={`text-xs font-medium capitalize px-2 py-0.5 rounded-full ${STATUS_COLORS[inst.status]}`}>
                              {inst.status}
                            </span>
                          </div>
                          <p className="font-bold text-sm">{fmt(inst.amount)}</p>
                          {(inst.walletAmountUsed || 0) > 0 && inst.status !== 'paid' && (
                            <p className="text-xs opacity-70 mt-0.5">
                              ₹{inst.walletAmountUsed} wallet paid · <span className="font-semibold">{fmt(inst.amount - inst.walletAmountUsed)} remaining</span>
                            </p>
                          )}
                          <p className="text-xs opacity-70 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {inst.status === 'paid' && inst.paidAt ? `Paid ${fmtDate(inst.paidAt)}` : `Due ${fmtDate(inst.dueDate)}`}
                          </p>
                          {inst.partnerCommissionAmount > 0 && (
                            <p className="text-xs opacity-60 mt-0.5">
                              Partner: ₹{inst.partnerCommissionAmount} {inst.partnerCommissionPaid ? '✓' : '(pending)'}
                            </p>
                          )}
                          {/* Actions for unpaid */}
                          {inst.walletAmountUsed > 0 && inst.status === 'paid' && (
                            <p className="text-xs opacity-50 mt-0.5">₹{inst.walletAmountUsed} from wallet</p>
                          )}
                          {inst.status !== 'paid' && (
                            <div className="mt-2 flex flex-col gap-1.5">
                              {/* Collect from wallet */}
                              {(user?.wallet || 0) > 0 && (
                                <button
                                  onClick={() => collectWalletMut.mutate(inst._id)}
                                  disabled={collectWalletMut.isPending}
                                  className="flex flex-col items-center justify-center gap-0.5 text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg py-1.5 px-2 transition-colors"
                                >
                                  {collectWalletMut.isPending
                                    ? <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Collecting...</span>
                                    : <>
                                        <span className="flex items-center gap-1"><Wallet className="w-3 h-3" /> Collect from Wallet</span>
                                        <span className="opacity-60 font-normal">
                                          {(user.wallet || 0) >= (inst.amount - (inst.walletAmountUsed || 0))
                                            ? ('₹' + (inst.amount - (inst.walletAmountUsed || 0)).toLocaleString('en-IN') + ' full')
                                            : ('₹' + (user.wallet || 0).toLocaleString('en-IN') + ' + ₹' + (inst.amount - (inst.walletAmountUsed || 0) - (user.wallet || 0)).toLocaleString('en-IN') + ' pending')}
                                        </span>
                                      </>
                                  }
                                </button>
                              )}
                              {inst.paymentLink && (
                                <a href={inst.paymentLink} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-xs underline opacity-80 hover:opacity-100">
                                  Payment Link <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                              <button
                                onClick={() => markPaidMut.mutate(inst._id)}
                                disabled={markPaidMut.isPending}
                                className="flex items-center justify-center gap-1 text-xs bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-lg py-1 px-2 transition-colors"
                              >
                                {markPaidMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                Mark Paid (Manual)
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
