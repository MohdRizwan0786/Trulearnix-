'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { managerAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import {
  Wallet, ArrowDownToLine, ShieldCheck, Clock,
  CheckCircle, XCircle, AlertTriangle, Loader2, IndianRupee,
  Lock, RefreshCw, Info, BadgeCheck
} from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

const STATUS_CFG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  pending:    { label: 'Pending Review', icon: Clock,         color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/30' },
  processing: { label: 'Processing',     icon: RefreshCw,     color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/30' },
  completed:  { label: 'Completed',      icon: CheckCircle,   color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  rejected:   { label: 'Rejected',       icon: XCircle,       color: 'text-rose-400',    bg: 'bg-rose-500/10 border-rose-500/30' },
}

export default function ManagerWithdrawPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [amount, setAmount] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['manager-withdrawals'],
    queryFn: () => managerAPI.withdrawHistory().then(r => r.data),
  })

  const wallet: number = data?.wallet ?? (user?.wallet || 0)
  const history: any[] = data?.withdrawals || []
  const kycStatus: string = (user as any)?.kyc?.status || 'pending'
  const kycVerified = kycStatus === 'verified'
  const hasPending = history.some(w => w.hrStatus === 'pending')
  const amt = Number(amount) || 0
  const tds = Math.round(amt * 2 / 100)
  const gateway = 5.19
  const net = amt > 0 ? Math.max(0, amt - tds - gateway) : 0
  const canSubmit = kycVerified && !hasPending && amt >= 500 && amt <= wallet

  const withdraw = useMutation({
    mutationFn: () => managerAPI.requestWithdraw({ amount: amt }),
    onSuccess: () => {
      toast.success('Withdrawal request submitted! HR will process within 3-5 business days.')
      setAmount('')
      qc.invalidateQueries({ queryKey: ['manager-withdrawals'] })
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to submit'),
  })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          Withdraw Earnings
        </h1>
        <p className="text-gray-400 text-sm mt-1">Transfer your manager Partnership earning wallet balance to your bank account</p>
      </div>

      {/* Wallet balance */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-500/15 to-teal-600/10 border border-emerald-500/20 p-6 text-center">
        <p className="text-gray-400 text-sm mb-1">Available Wallet Balance</p>
        <p className="text-white text-5xl font-black tracking-tight">₹{wallet.toLocaleString('en-IN')}</p>
        <p className="text-emerald-300 text-xs mt-2">
          Total withdrawn: <span className="text-white font-semibold">₹{(data?.totalWithdrawn || 0).toLocaleString('en-IN')}</span>
        </p>
      </div>

      {/* KYC block */}
      {!kycVerified && (
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 flex items-start gap-3">
          <Lock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-300 font-semibold text-sm">KYC Required</p>
            <p className="text-amber-400/70 text-xs mt-0.5">
              {kycStatus === 'submitted' ? 'Your KYC is under review (1-3 business days).'
                : kycStatus === 'rejected' ? 'Your KYC was rejected. Please re-submit.'
                : 'Complete KYC to unlock withdrawals.'}
            </p>
          </div>
        </div>
      )}

      {/* Pending block */}
      {hasPending && kycVerified && (
        <div className="rounded-2xl bg-blue-500/10 border border-blue-500/20 p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-blue-300 text-sm">You have a pending withdrawal. A new request can be submitted once HR processes the current one.</p>
        </div>
      )}

      {/* Request form */}
      {kycVerified && !hasPending && (
        <div className="rounded-2xl bg-white/3 border border-white/10 p-5 space-y-4">
          <p className="text-white font-bold flex items-center gap-2">
            <ArrowDownToLine className="w-4 h-4 text-emerald-400" /> New Withdrawal Request
          </p>

          <div>
            <label className="text-gray-400 text-xs font-medium mb-1.5 block">Amount (₹) *</label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="number" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="Minimum ₹500" min={500} max={wallet}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <button onClick={() => setAmount(String(wallet))} className="text-emerald-400 text-xs hover:text-emerald-300 font-medium mt-1.5">
              Max: ₹{wallet.toLocaleString('en-IN')}
            </button>
          </div>

          {/* Quick amounts */}
          <div className="flex gap-2 flex-wrap">
            {[500, 1000, 2000, 5000].filter(v => v <= wallet).map(v => (
              <button key={v} onClick={() => setAmount(String(v))}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  Number(amount) === v
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-white/5 text-gray-400 border-white/10 hover:border-emerald-500/30 hover:text-white'
                }`}>
                ₹{v.toLocaleString('en-IN')}
              </button>
            ))}
          </div>

          {/* Calculation breakdown */}
          {amt >= 500 && (
            <div className="bg-white/5 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Requested</span>
                <span className="text-white font-medium">₹{amt.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">TDS @ 2%</span>
                <span className="text-rose-400">- ₹{tds.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Gateway Fee</span>
                <span className="text-rose-400">- ₹{gateway.toFixed(2)}</span>
              </div>
              <div className="border-t border-white/10 pt-2 flex justify-between font-bold">
                <span className="text-white">Net to Bank</span>
                <span className="text-emerald-400 text-lg">₹{net.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          )}

          {/* Bank info */}
          {(user as any)?.kyc?.bankAccount && (
            <div className="bg-white/3 border border-white/10 rounded-xl p-3 flex items-center gap-3">
              <BadgeCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div className="text-xs">
                <p className="text-white font-semibold">{(user as any).kyc.bankName} — ****{(user as any).kyc.bankAccount.slice(-4)}</p>
                <p className="text-gray-500">{(user as any).kyc.bankHolderName} | {(user as any).kyc.bankIfsc}</p>
              </div>
            </div>
          )}

          <button
            onClick={() => withdraw.mutate()}
            disabled={!canSubmit || withdraw.isPending}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm disabled:opacity-40 hover:opacity-90 flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
          >
            {withdraw.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
              : <><ArrowDownToLine className="w-4 h-4" /> Request Withdrawal</>}
          </button>

          <p className="text-gray-600 text-xs text-center flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3" /> HR will review and process within 3-5 business days
          </p>
        </div>
      )}

      {/* Withdrawal history */}
      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />)}</div>
      ) : history.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-white font-bold text-sm">Withdrawal History</h2>
          {history.map((w: any) => {
            const cfg = STATUS_CFG[w.status] || STATUS_CFG.pending
            const StatusIcon = cfg.icon
            return (
              <div key={w._id} className="rounded-2xl bg-white/3 border border-white/10 p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-white font-bold text-base">₹{(w.amount || 0).toLocaleString('en-IN')}</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      Net: <span className="text-emerald-400 font-semibold">₹{(w.netAmount || 0).toLocaleString('en-IN')}</span>
                      {' · '}TDS: ₹{(w.tdsAmount || 0).toLocaleString('en-IN')}
                    </p>
                    <p className="text-gray-600 text-xs">{new Date(w.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>
                    <StatusIcon className="w-3 h-3" /> {cfg.label}
                  </span>
                </div>
                {w.razorpayPayoutId && (
                  <p className="text-xs text-gray-500 mt-2 font-mono">Txn: {w.razorpayPayoutId}</p>
                )}
                {w.status === 'rejected' && w.rejectionReason && (
                  <p className="text-xs text-rose-400 mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {w.rejectionReason}
                  </p>
                )}
                {w.status === 'completed' && w.processedAt && (
                  <p className="text-xs text-emerald-400 mt-2">
                    Credited: {new Date(w.processedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 rounded-2xl bg-white/3 border border-white/10 text-center">
          <Wallet className="w-10 h-10 text-gray-600 mb-3" />
          <p className="text-gray-300 font-semibold">No withdrawal requests yet</p>
          <p className="text-gray-500 text-sm mt-1">Your withdrawal history will appear here</p>
        </div>
      )}
    </div>
  )
}
