'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { partnerAPI, phonepeAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import {
  CreditCard, CheckCircle2, Clock, AlertTriangle, Coins, Users,
  TrendingUp, Lock, Wallet, Loader2, Zap, ArrowRight, Star,
  ShieldCheck, Calendar, IndianRupee, ChevronRight, Sparkles
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

const STATUS: Record<string, { cls: string; bg: string; label: string; icon: any; dot: string }> = {
  paid:    { cls: 'border-green-500/30 text-green-300',  bg: 'bg-green-500/10',  label: 'Paid',    icon: CheckCircle2,    dot: 'bg-green-400' },
  pending: { cls: 'border-amber-500/30 text-amber-300',  bg: 'bg-amber-500/10',  label: 'Pending', icon: Clock,           dot: 'bg-amber-400' },
  overdue: { cls: 'border-red-500/30 text-red-300',      bg: 'bg-red-500/10',    label: 'Overdue', icon: AlertTriangle,   dot: 'bg-red-400' },
  failed:  { cls: 'border-gray-500/30 text-gray-400',    bg: 'bg-gray-500/10',   label: 'Failed',  icon: Clock,           dot: 'bg-gray-400' },
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}
function fmtDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function ProgressBar({ value, max, color = 'violet' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  const colorMap: Record<string, string> = {
    violet: 'from-violet-500 to-purple-600',
    amber:  'from-amber-400 to-orange-500',
    green:  'from-green-400 to-emerald-500',
    blue:   'from-blue-400 to-cyan-500',
  }
  return (
    <div className="w-full h-1.5 bg-dark-700 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${colorMap[color] || colorMap.violet} transition-all duration-700`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export default function PartnerEmiPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [walletPaying, setWalletPaying] = useState<string | null>(null)
  const walletBalance = (user as any)?.wallet || 0

  const walletPayMut = useMutation({
    mutationFn: (installmentId: string) => phonepeAPI.payEmiFromWallet({ installmentId }),
    onMutate: (id) => setWalletPaying(id),
    onSuccess: (res) => {
      const d = res.data
      if (d.fullyPaid) {
        toast.success(d.message || 'Installment paid from wallet!')
        qc.invalidateQueries({ queryKey: ['partner-my-emi'] })
      } else {
        toast.success(`₹${d.walletUsed} deducted. Redirecting for remaining ₹${d.remaining}...`)
        setTimeout(() => { window.location.href = d.redirectUrl }, 1000)
      }
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
    onSettled: () => setWalletPaying(null),
  })

  const { data: myEmiData, isLoading: myEmiLoading } = useQuery({
    queryKey: ['partner-my-emi'],
    queryFn: () => phonepeAPI.getEmiStatus().then(r => r.data),
    staleTime: 30000,
  })

  const { data: commData, isLoading: commLoading } = useQuery({
    queryKey: ['partner-emi-commissions'],
    queryFn: () => partnerAPI.emiCommissions().then(r => r.data),
    staleTime: 60000,
  })

  const myInstallments: any[] = myEmiData?.installments || []
  const isSuspended = myEmiData?.isSuspended

  const myGroups: Record<string, any[]> = {}
  for (const inst of myInstallments) {
    const key = inst.packagePurchase?._id || inst.packagePurchase || 'unknown'
    if (!myGroups[key]) myGroups[key] = []
    myGroups[key].push(inst)
  }

  const commInstallments: any[] = commData?.installments || []
  const stats = commData?.stats || {}

  const byUser: Record<string, any[]> = {}
  for (const inst of commInstallments) {
    const uid = inst.user?._id || 'unknown'
    if (!byUser[uid]) byUser[uid] = []
    byUser[uid].push(inst)
  }

  const hasMyEmi = myInstallments.length > 0

  return (
    <div className="space-y-6 pb-6">

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800 p-5 sm:p-6">
        {/* decorative blobs */}
        <div className="pointer-events-none absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5 blur-2xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 w-32 h-32 rounded-full bg-violet-400/10 blur-xl" />

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-white" />
              </div>
              <span className="text-white/70 text-sm font-medium">EMI Center</span>
            </div>
            <h1 className="text-white text-2xl sm:text-3xl font-bold tracking-tight">EMI &amp; Installments</h1>
            <p className="text-violet-200 text-sm mt-1">Track your plan payments &amp; earn commissions on referrals</p>
          </div>
          {walletBalance > 0 && (
            <div className="flex-shrink-0 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-center">
              <div className="flex items-center gap-1 text-amber-300 text-xs mb-0.5">
                <Wallet className="w-3 h-3" /> Wallet
              </div>
              <p className="text-white font-bold text-base">{fmt(walletBalance)}</p>
            </div>
          )}
        </div>

        {/* Quick stats row */}
        {(hasMyEmi || commInstallments.length > 0) && (
          <div className="relative mt-4 grid grid-cols-3 gap-2 sm:gap-3">
            <div className="bg-white/10 rounded-xl p-2.5 text-center">
              <p className="text-white font-bold text-base sm:text-lg">
                {myInstallments.filter(i => i.status === 'paid').length}/{myInstallments.length || '—'}
              </p>
              <p className="text-white/60 text-[10px] sm:text-xs mt-0.5">My Paid</p>
            </div>
            <div className="bg-white/10 rounded-xl p-2.5 text-center">
              <p className="text-amber-300 font-bold text-base sm:text-lg">{fmt(stats.totalEarnedCommission || 0)}</p>
              <p className="text-white/60 text-[10px] sm:text-xs mt-0.5">Comm Earned</p>
            </div>
            <div className="bg-white/10 rounded-xl p-2.5 text-center">
              <p className="text-blue-300 font-bold text-base sm:text-lg">{fmt(stats.totalPendingCommission || 0)}</p>
              <p className="text-white/60 text-[10px] sm:text-xs mt-0.5">Upcoming</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Suspension Banner ── */}
      {isSuspended && (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/25 rounded-2xl p-4">
          <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <Lock className="w-4 h-4 text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-red-300 font-semibold text-sm">Dashboard Access Suspended</p>
            <p className="text-red-400/70 text-xs mt-0.5">Clear your overdue installment below to restore full access.</p>
          </div>
        </div>
      )}

      {/* ── My EMI Plan ── */}
      {(myEmiLoading || hasMyEmi) && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <CreditCard className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <h2 className="text-white font-bold text-base">My EMI Plan</h2>
            {isSuspended && (
              <span className="flex items-center gap-1 text-[10px] bg-red-500/10 border border-red-500/25 text-red-400 px-2 py-0.5 rounded-full">
                <Lock className="w-2.5 h-2.5" /> Suspended
              </span>
            )}
          </div>

          {myEmiLoading ? (
            <div className="space-y-3">
              {[...Array(1)].map((_, i) => <div key={i} className="h-48 bg-dark-800 rounded-2xl animate-pulse" />)}
            </div>
          ) : (
            Object.entries(myGroups).map(([ppId, insts]) => {
              const sorted = [...insts].sort((a, b) => a.installmentNumber - b.installmentNumber)
              const pkg = sorted[0]?.packagePurchase
              const pkgName = pkg?.packageTier
                ? `${pkg.packageTier.charAt(0).toUpperCase() + pkg.packageTier.slice(1)} Package`
                : 'Package'
              const paidCount = sorted.filter(i => i.status === 'paid').length
              const totalAmt = sorted.reduce((s: number, i: any) => s + i.amount, 0)
              const paidAmt = sorted.filter(i => i.status === 'paid').reduce((s: number, i: any) => s + i.amount, 0)
              const remaining = totalAmt - paidAmt
              const pct = Math.round((paidCount / sorted.length) * 100)

              return (
                <div key={ppId} className="bg-dark-800 rounded-2xl border border-dark-700 overflow-hidden">
                  {/* Card header */}
                  <div className="px-4 sm:px-5 py-4 border-b border-dark-700">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 bg-violet-500/15 border border-violet-500/25 text-violet-300 text-xs font-semibold px-2 py-0.5 rounded-full">
                            <Star className="w-2.5 h-2.5" /> {pkgName}
                          </span>
                        </div>
                        <p className="text-white font-bold text-base mt-1.5">{paidCount} of 4 paid</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {remaining > 0
                          ? <><p className="text-amber-400 font-bold text-sm">{fmt(remaining)}</p><p className="text-dark-400 text-xs">remaining</p></>
                          : <span className="flex items-center gap-1 text-green-400 text-sm font-bold"><ShieldCheck className="w-4 h-4" /> Completed!</span>
                        }
                      </div>
                    </div>
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-xs text-dark-400 mb-1">
                        <span>Progress</span><span>{pct}%</span>
                      </div>
                      <ProgressBar value={paidCount} max={sorted.length} color={pct === 100 ? 'green' : 'violet'} />
                    </div>
                  </div>

                  {/* Wallet notice */}
                  {walletBalance > 0 && sorted.some((i: any) => i.status !== 'paid') && (
                    <div className="px-4 sm:px-5 py-2.5 bg-amber-500/5 border-b border-amber-500/15 flex items-center gap-2">
                      <Wallet className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <p className="text-amber-300 text-xs"><span className="font-semibold">{fmt(walletBalance)}</span> wallet balance — pay EMI instantly</p>
                    </div>
                  )}

                  {/* Installment cards */}
                  <div className="p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    {sorted.map((inst: any) => {
                      const s = STATUS[inst.status] || STATUS.pending
                      const Icon = s.icon
                      const payLink = inst.paymentLink || `/pay/emi/${inst._id}`
                      const canPay = inst.status !== 'paid'
                      const walletCovers = Math.min(walletBalance, inst.amount)
                      const remainingAfterWallet = inst.amount - walletCovers

                      return (
                        <div key={inst._id} className={`relative rounded-xl border ${s.cls} ${s.bg} overflow-hidden`}>
                          {inst.status === 'overdue' && (
                            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-red-500 to-orange-500" />
                          )}
                          {inst.status === 'paid' && (
                            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-green-400 to-emerald-500" />
                          )}
                          <div className="p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-medium opacity-60">#{inst.installmentNumber}</span>
                              <div className={`w-2 h-2 rounded-full ${s.dot}`} />
                            </div>
                            <p className="font-bold text-sm">{fmt(inst.amount)}</p>
                            <p className="text-[10px] opacity-55 mt-0.5 leading-tight">
                              {inst.status === 'paid' && inst.paidAt
                                ? `Paid ${fmtDate(inst.paidAt)}`
                                : `Due ${fmtDate(inst.dueDate)}`}
                            </p>
                            {inst.walletAmountUsed > 0 && inst.status === 'paid' && (
                              <p className="text-[10px] opacity-40 mt-0.5">₹{inst.walletAmountUsed} wallet</p>
                            )}
                            {inst.status === 'paid' && (
                              <div className="mt-2 flex items-center gap-1 text-green-400 text-[10px] font-semibold">
                                <CheckCircle2 className="w-3 h-3" /> Done
                              </div>
                            )}
                            {canPay && (
                              <div className="mt-2.5 space-y-1.5">
                                {walletBalance > 0 && (
                                  <button
                                    onClick={() => walletPayMut.mutate(inst._id)}
                                    disabled={walletPaying === inst._id}
                                    className="w-full py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 active:scale-95 border border-amber-500/30 text-amber-300 text-[10px] font-bold transition-all disabled:opacity-60 flex flex-col items-center gap-0.5"
                                  >
                                    {walletPaying === inst._id
                                      ? <span className="flex items-center gap-1"><Loader2 className="w-2.5 h-2.5 animate-spin" /> Processing</span>
                                      : <>
                                        <span className="flex items-center gap-1"><Wallet className="w-2.5 h-2.5" /> Wallet Pay</span>
                                        <span className="opacity-55 font-normal">
                                          {walletCovers >= inst.amount ? fmt(walletCovers) : `${fmt(walletCovers)} + ${fmt(remainingAfterWallet)}`}
                                        </span>
                                      </>
                                    }
                                  </button>
                                )}
                                <Link href={payLink}
                                  className="flex items-center justify-center gap-1 w-full py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 active:scale-95 text-white text-[10px] font-bold transition-all shadow-sm shadow-violet-500/20">
                                  <CreditCard className="w-2.5 h-2.5" />
                                  {walletBalance > 0 ? 'Pay UPI' : 'Pay Now'}
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </section>
      )}

      {/* ── No EMI Plan State ── */}
      {!myEmiLoading && !hasMyEmi && (
        <div className="relative overflow-hidden bg-dark-800 border border-dark-700 rounded-2xl p-5 sm:p-6">
          <div className="pointer-events-none absolute -top-6 -right-6 w-28 h-28 rounded-full bg-violet-500/5 blur-xl" />
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">No Active EMI Plan</p>
              <p className="text-dark-400 text-xs">You have not purchased any package on EMI</p>
            </div>
          </div>
        </div>
      )}

      {/* ── EMI Commissions ── */}
      <section className="space-y-3">
        {/* Section header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <h2 className="text-white font-bold text-base">EMI Commissions</h2>
          </div>
          {commInstallments.length > 0 && (
            <span className="text-dark-400 text-xs">{Object.keys(byUser).length} member{Object.keys(byUser).length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="relative overflow-hidden bg-dark-800 rounded-xl border border-dark-700 p-3 sm:p-4">
            <div className="pointer-events-none absolute -top-3 -right-3 w-14 h-14 rounded-full bg-violet-500/10 blur-lg" />
            <Users className="w-4 h-4 text-violet-400 mb-2" />
            <p className="text-white font-bold text-lg sm:text-xl leading-none">{stats.totalInstallments || 0}</p>
            <p className="text-dark-400 text-[10px] sm:text-xs mt-1">Installments</p>
          </div>
          <div className="relative overflow-hidden bg-dark-800 rounded-xl border border-dark-700 p-3 sm:p-4">
            <div className="pointer-events-none absolute -top-3 -right-3 w-14 h-14 rounded-full bg-amber-500/10 blur-lg" />
            <Coins className="w-4 h-4 text-amber-400 mb-2" />
            <p className="text-amber-400 font-bold text-lg sm:text-xl leading-none">{fmt(stats.totalEarnedCommission || 0)}</p>
            <p className="text-dark-400 text-[10px] sm:text-xs mt-1">Earned</p>
          </div>
          <div className="relative overflow-hidden bg-dark-800 rounded-xl border border-dark-700 p-3 sm:p-4">
            <div className="pointer-events-none absolute -top-3 -right-3 w-14 h-14 rounded-full bg-blue-500/10 blur-lg" />
            <TrendingUp className="w-4 h-4 text-blue-400 mb-2" />
            <p className="text-blue-400 font-bold text-lg sm:text-xl leading-none">{fmt(stats.totalPendingCommission || 0)}</p>
            <p className="text-dark-400 text-[10px] sm:text-xs mt-1">Upcoming</p>
          </div>
        </div>

        {/* Commission list */}
        {commLoading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => <div key={i} className="h-28 bg-dark-800 rounded-2xl animate-pulse" />)}
          </div>
        ) : commInstallments.length === 0 ? (
          <div className="relative overflow-hidden bg-dark-800 rounded-2xl border border-dark-700 py-10 sm:py-14 text-center px-4">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-500/3 to-transparent" />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-3">
                <Coins className="w-7 h-7 text-amber-500/50" />
              </div>
              <p className="text-white font-semibold text-sm">No EMI Commissions Yet</p>
              <p className="text-dark-500 text-xs mt-1 max-w-xs mx-auto leading-relaxed">
                When your referred members pay their EMI installments, your commissions will appear here
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-violet-400 text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5" /> Refer more members to earn EMI bonuses
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(byUser).map(([uid, userInsts]) => {
              const usr = userInsts[0]?.user
              const sorted = [...userInsts].sort((a, b) => a.installmentNumber - b.installmentNumber)
              const earned = sorted.filter((i: any) => i.partnerCommissionPaid).reduce((s: number, i: any) => s + (i.partnerCommissionAmount || 0), 0)
              const pending = sorted.filter((i: any) => !i.partnerCommissionPaid && i.partnerCommissionAmount > 0).reduce((s: number, i: any) => s + (i.partnerCommissionAmount || 0), 0)
              const paidInsts = sorted.filter((i: any) => i.status === 'paid').length
              const initial = usr?.name?.[0]?.toUpperCase() || '?'

              return (
                <div key={uid} className="bg-dark-800 rounded-2xl border border-dark-700 overflow-hidden">
                  {/* User header */}
                  <div className="px-4 sm:px-5 py-3.5 border-b border-dark-700 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-md shadow-violet-500/20">
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{usr?.name || 'Unknown'}</p>
                        <p className="text-dark-400 text-xs truncate">{usr?.phone || usr?.email || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {earned > 0 && (
                        <span className="flex items-center gap-1 text-[11px] bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-semibold">
                          <CheckCircle2 className="w-2.5 h-2.5" /> +{fmt(earned)}
                        </span>
                      )}
                      {pending > 0 && (
                        <span className="flex items-center gap-1 text-[11px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-semibold">
                          <Clock className="w-2.5 h-2.5" /> {fmt(pending)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress mini row */}
                  <div className="px-4 sm:px-5 py-2 bg-dark-900/40 border-b border-dark-700 flex items-center gap-3">
                    <span className="text-dark-400 text-[10px]">{paidInsts}/{sorted.length} paid</span>
                    <div className="flex-1">
                      <ProgressBar value={paidInsts} max={sorted.length} color="violet" />
                    </div>
                  </div>

                  {/* Installment grid */}
                  <div className="p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    {sorted.map((inst: any) => {
                      const s = STATUS[inst.status] || STATUS.pending
                      const Icon = s.icon
                      return (
                        <div key={inst._id} className={`relative rounded-xl border ${s.cls} ${s.bg} overflow-hidden`}>
                          {inst.status === 'paid' && (
                            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-green-400 to-emerald-500" />
                          )}
                          {inst.status === 'overdue' && (
                            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-red-500 to-orange-500" />
                          )}
                          <div className="p-3">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] opacity-60">#{inst.installmentNumber}/{inst.totalInstallments}</span>
                              <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                            </div>
                            <p className="font-bold text-sm">{fmt(inst.amount)}</p>
                            <p className="text-[10px] opacity-55 mt-0.5 leading-tight">
                              {inst.status === 'paid' && inst.paidAt
                                ? fmtDate(inst.paidAt)
                                : `Due ${fmtDate(inst.dueDate)}`}
                            </p>
                            {inst.partnerCommissionAmount > 0 && (
                              <div className={`mt-2 flex items-center gap-1 text-[10px] font-bold rounded-lg px-1.5 py-1 ${inst.partnerCommissionPaid ? 'bg-green-500/15 text-green-400' : 'bg-dark-700 text-dark-300'}`}>
                                <Coins className="w-2.5 h-2.5 flex-shrink-0" />
                                <span>{fmt(inst.partnerCommissionAmount)}</span>
                                {inst.partnerCommissionPaid && <CheckCircle2 className="w-2.5 h-2.5 ml-auto" />}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

    </div>
  )
}
