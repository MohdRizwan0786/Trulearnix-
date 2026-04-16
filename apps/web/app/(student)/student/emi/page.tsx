'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { phonepeAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { CreditCard, CheckCircle2, Clock, AlertTriangle, Wallet, Loader2, Zap, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

const STATUS: Record<string, { bg: string; border: string; textColor: string; icon: any; label: string }> = {
  paid:    { bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.25)',  textColor: '#4ade80', icon: CheckCircle2, label: 'Paid' },
  pending: { bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.25)', textColor: '#facc15', icon: Clock,        label: 'Pending' },
  overdue: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)', textColor: '#f87171', icon: AlertTriangle,label: 'Overdue' },
  failed:  { bg: 'rgba(107,114,128,0.1)',border: 'rgba(107,114,128,0.2)',textColor: '#9ca3af', icon: Clock,        label: 'Failed' },
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}
function fmtDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function InstallmentCard({ inst, walletBalance, onWalletPay, walletPaying }: {
  inst: any; walletBalance: number; onWalletPay: (id: string) => void; walletPaying: string | null
}) {
  const s = STATUS[inst.status] || STATUS.pending
  const Icon = s.icon
  const canPay = inst.status !== 'paid'
  const payLink = inst.paymentLink || `/pay/emi/${inst._id}`
  const alreadyWalletPaid = inst.walletAmountUsed || 0
  const stillNeeded = inst.amount - alreadyWalletPaid
  const walletCovers = Math.min(walletBalance, stillNeeded)
  const remainingAfterWallet = stillNeeded - walletCovers
  const hasWallet = walletBalance > 0 && canPay && stillNeeded > 0

  return (
    <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: s.textColor, opacity: 0.7 }}>
          Installment {inst.installmentNumber}/{inst.totalInstallments || 4}
        </span>
        <div className="flex items-center gap-1" style={{ color: s.textColor }}>
          <Icon className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold">{s.label}</span>
        </div>
      </div>

      {/* Amount */}
      <div>
        <p className="text-2xl font-black text-white">{fmt(inst.amount)}</p>
        {alreadyWalletPaid > 0 && inst.status !== 'paid' && (
          <p className="text-[10px] text-amber-300 mt-0.5 flex items-center gap-1">
            <Wallet className="w-3 h-3" /> ₹{alreadyWalletPaid.toLocaleString()} from wallet · {fmt(stillNeeded)} left
          </p>
        )}
        <p className="text-xs mt-1" style={{ color: s.textColor, opacity: 0.7 }}>
          {inst.status === 'paid' && inst.paidAt
            ? `Paid on ${fmtDate(inst.paidAt)}`
            : `Due ${fmtDate(inst.dueDate)}`}
        </p>
        {inst.walletAmountUsed > 0 && inst.status === 'paid' && (
          <p className="text-[10px] text-amber-300/60 mt-0.5 flex items-center gap-1">
            <Wallet className="w-2.5 h-2.5" /> ₹{inst.walletAmountUsed} from wallet
          </p>
        )}
      </div>

      {/* Actions */}
      {canPay && (
        <div className="space-y-2 mt-auto">
          {hasWallet && (
            <button onClick={() => onWalletPay(inst._id)} disabled={walletPaying === inst._id}
              className="w-full py-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-0.5 transition-all disabled:opacity-60"
              style={{ background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24' }}>
              {walletPaying === inst._id ? (
                <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Processing…</span>
              ) : (
                <>
                  <span className="flex items-center gap-1"><Wallet className="w-3 h-3" /> Pay from Wallet</span>
                  <span className="font-normal opacity-60" style={{ fontSize: 10 }}>
                    {walletCovers >= stillNeeded ? `${fmt(walletCovers)}` : `${fmt(walletCovers)} + ${fmt(remainingAfterWallet)} UPI`}
                  </span>
                </>
              )}
            </button>
          )}
          <Link href={payLink}
            className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-bold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
            <CreditCard className="w-3 h-3" />
            {hasWallet ? 'Pay via UPI' : 'Pay Now'}
          </Link>
        </div>
      )}

      {inst.status === 'paid' && (
        <div className="flex items-center justify-center gap-1 text-green-400 text-[10px] font-bold">
          <ShieldCheck className="w-3.5 h-3.5" /> Verified & Paid
        </div>
      )}
    </div>
  )
}

export default function StudentEmiPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [walletPaying, setWalletPaying] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['student-emi'],
    queryFn: () => phonepeAPI.getEmiStatus().then(r => r.data),
    staleTime: 30000,
  })

  const walletPayMut = useMutation({
    mutationFn: (installmentId: string) => phonepeAPI.payEmiFromWallet({ installmentId }),
    onMutate: (id) => setWalletPaying(id),
    onSuccess: (res) => {
      const d = res.data
      if (d.fullyPaid) {
        toast.success(d.message || 'Installment paid!')
        qc.invalidateQueries({ queryKey: ['student-emi'] })
      } else {
        toast.success(`₹${d.walletUsed} deducted. Redirecting…`)
        setTimeout(() => { window.location.href = d.redirectUrl }, 1000)
      }
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
    onSettled: () => setWalletPaying(null),
  })

  const installments: any[] = data?.installments || []
  const isSuspended = data?.isSuspended
  const walletBalance = (user as any)?.wallet || 0

  const groups: Record<string, any[]> = {}
  for (const inst of installments) {
    const key = inst.packagePurchase?._id || inst.packagePurchase || 'unknown'
    if (!groups[key]) groups[key] = []
    groups[key].push(inst)
  }

  const paidCount = installments.filter(i => i.status === 'paid').length
  const paidAmt = installments.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const totalAmt = installments.reduce((s, i) => s + i.amount, 0)
  const remaining = Math.max(0, totalAmt - paidAmt)
  const progressPct = totalAmt > 0 ? Math.round((paidAmt / totalAmt) * 100) : 0

  return (
    <div className="space-y-5 max-w-3xl pb-8">
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>

      <div>
        <h1 className="text-2xl font-black text-white">My EMI Plan</h1>
        <p className="text-gray-500 text-sm mt-0.5">Track and pay your installments</p>
      </div>

      {/* Suspended Banner */}
      {isSuspended && (
        <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 font-bold text-sm">Access Suspended</p>
            <p className="text-red-400/60 text-xs mt-0.5">Pay your overdue installment to restore full access immediately.</p>
          </div>
        </div>
      )}

      {/* Summary Card */}
      {installments.length > 0 && (
        <div className="rounded-3xl p-5" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(79,70,229,0.1))', border: '1px solid rgba(139,92,246,0.25)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-violet-400" /> EMI Progress
            </h2>
            <span className="text-violet-300 font-black text-lg">{progressPct}%</span>
          </div>
          <div className="w-full h-2 rounded-full mb-4 overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #7c3aed, #6366f1)' }} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Paid', value: `${paidCount}/4`, color: 'text-white' },
              { label: 'Amount Paid', value: fmt(paidAmt), color: 'text-green-400' },
              { label: 'Remaining', value: fmt(remaining), color: 'text-amber-400' },
              { label: 'Wallet Balance', value: fmt(walletBalance), color: 'text-violet-400' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-3 text-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
                <p className={`font-black text-lg ${s.color}`}>{s.value}</p>
                <p className="text-gray-500 text-[10px] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-violet-400 mb-3" />
          <p className="text-gray-500 text-sm">Loading your EMI plan…</p>
        </div>
      ) : installments.length === 0 ? (
        <div className="rounded-3xl py-20 text-center" style={{ background: 'rgba(13,13,20,0.95)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="w-20 h-20 rounded-3xl mx-auto mb-5 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <CreditCard className="w-9 h-9 text-gray-600" />
          </div>
          <p className="text-white font-bold text-lg">No EMI Plan</p>
          <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">You haven't purchased any package with EMI. Browse packages to get started.</p>
        </div>
      ) : (
        Object.entries(groups).map(([ppId, groupInsts]) => {
          const sorted = [...groupInsts].sort((a, b) => a.installmentNumber - b.installmentNumber)
          const pkg = sorted[0]?.packagePurchase
          const pkgName = pkg?.packageTier
            ? `${pkg.packageTier.charAt(0).toUpperCase() + pkg.packageTier.slice(1)} Package`
            : 'Package'
          const groupPaid = sorted.filter(i => i.status === 'paid').length

          return (
            <div key={ppId} className="rounded-3xl overflow-hidden" style={{ background: 'rgba(13,13,20,0.95)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.15)' }}>
                    <Zap className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{pkgName}</p>
                    <p className="text-gray-500 text-[10px]">{groupPaid}/{sorted.length} installments paid</p>
                  </div>
                </div>
                {walletBalance > 0 && sorted.some(i => i.status !== 'paid') && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <Wallet className="w-3 h-3 text-amber-400" />
                    <span className="text-amber-300 text-[10px] font-semibold">{fmt(walletBalance)} wallet</span>
                  </div>
                )}
              </div>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {sorted.map((inst: any) => (
                  <InstallmentCard
                    key={inst._id}
                    inst={inst}
                    walletBalance={walletBalance}
                    onWalletPay={(id) => walletPayMut.mutate(id)}
                    walletPaying={walletPaying}
                  />
                ))}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
