'use client'
import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { adminAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import {
  ArrowDownToLine, Clock, CheckCircle, XCircle, RefreshCw,
  Search, User, Phone, Mail, Building2, AlertTriangle,
  IndianRupee, Loader2, Check, X, Eye, Shield, TrendingUp,
  Banknote, ListChecks, CircleDollarSign
} from 'lucide-react'

/* ─── Status config ─────────────────────────────────────────────────────── */
const HR_STATUS_CFG: Record<string, { label: string; badgeClass: string; icon: any }> = {
  pending:  { label: 'Pending Review', badgeClass: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',  icon: Clock       },
  approved: { label: 'Approved',       badgeClass: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30', icon: CheckCircle },
  rejected: { label: 'Rejected',       badgeClass: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',    icon: XCircle     },
}

const PAYMENT_STATUS_BADGE: Record<string, string> = {
  pending:    'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  processing: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  completed:  'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  rejected:   'bg-rose-500/15 text-rose-400 border border-rose-500/30',
}

const TIER_BADGE: Record<string, string> = {
  free:    'bg-slate-500/20 text-slate-400',
  starter: 'bg-blue-500/20 text-blue-400',
  pro:     'bg-purple-500/20 text-purple-400',
  elite:   'bg-amber-500/20 text-amber-400',
  supreme: 'bg-rose-500/20 text-rose-400',
}

const fmt = (n: number) =>
  '₹' + (n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })

/* ─── Component ─────────────────────────────────────────────────────────── */
export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [loading, setLoading]         = useState(true)
  const [hrFilter, setHrFilter]       = useState('pending')
  const [search, setSearch]           = useState('')
  const [selected, setSelected]       = useState<any>(null)
  const [rejReason, setRejReason]     = useState('')
  const [txRef, setTxRef]             = useState('')
  const [acting, setActing]           = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await adminAPI.withdrawals({ hrStatus: hrFilter || undefined })
      setWithdrawals(res.data.withdrawals || [])
    } catch { toast.error('Failed to load withdrawals') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [hrFilter])

  const filtered = withdrawals.filter(w => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      w.user?.name?.toLowerCase().includes(q) ||
      w.user?.email?.toLowerCase().includes(q) ||
      w.user?.phone?.includes(q)
    )
  })

  /* KPI calculations */
  const allPending   = withdrawals.filter(w => w.hrStatus === 'pending')
  const allApproved  = withdrawals.filter(w => w.hrStatus === 'approved')
  const allRejected  = withdrawals.filter(w => w.hrStatus === 'rejected')

  const today = new Date().toDateString()
  const completedToday = withdrawals.filter(
    w => w.status === 'completed' && new Date(w.updatedAt).toDateString() === today
  ).length

  const totalPendingAmount = allPending.reduce((s, w) => s + (w.amount || 0), 0)
  const totalProcessed     = withdrawals.filter(w => w.status === 'completed').length

  const kpiCards = [
    {
      cls:   'kpi-amber',
      icon:  Clock,
      label: 'Total Pending Amount',
      value: fmt(totalPendingAmount),
      sub:   `${allPending.length} request${allPending.length !== 1 ? 's' : ''} awaiting review`,
    },
    {
      cls:   'kpi-emerald',
      icon:  TrendingUp,
      label: 'Completed Today',
      value: String(completedToday),
      sub:   'Payouts processed today',
    },
    {
      cls:   'kpi-rose',
      icon:  ListChecks,
      label: 'Pending Count',
      value: String(allPending.length),
      sub:   `${allRejected.length} rejected total`,
    },
    {
      cls:   'kpi-violet',
      icon:  CircleDollarSign,
      label: 'Total Processed',
      value: String(totalProcessed),
      sub:   `${allApproved.length} approved`,
    },
  ]

  /* Actions */
  const approve = async (id: string) => {
    setActing(true)
    try {
      const res = await adminAPI.hrApproveWithdrawal(id)
      toast.success(res.data.message || 'Withdrawal approved!')
      setSelected(null)
      load()
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed') }
    finally { setActing(false) }
  }

  const reject = async (id: string) => {
    if (!rejReason.trim()) return toast.error('Please enter a rejection reason')
    setActing(true)
    try {
      await adminAPI.hrRejectWithdrawal(id, rejReason)
      toast.success('Withdrawal rejected. Amount refunded to partner wallet.')
      setSelected(null)
      setRejReason('')
      load()
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed') }
    finally { setActing(false) }
  }

  const complete = async (id: string) => {
    setActing(true)
    try {
      await adminAPI.completeWithdrawal(id, txRef)
      toast.success('Withdrawal marked as completed.')
      setSelected(null)
      setTxRef('')
      load()
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed') }
    finally { setActing(false) }
  }

  const TABS = [
    { key: 'pending',  label: 'Pending Review', count: allPending.length  },
    { key: 'approved', label: 'Approved',        count: allApproved.length },
    { key: 'rejected', label: 'Rejected',        count: allRejected.length },
    { key: '',         label: 'All',             count: withdrawals.length  },
  ] as const

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* ── Page header ───────────────────────────────────────────────── */}
        <div className="page-header">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                  <ArrowDownToLine className="w-5 h-5 text-violet-400" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                  Withdrawal Management
                </h1>
              </div>
              <p className="text-slate-400 text-sm ml-12">
                Review, approve, and process partner payout requests
              </p>
            </div>
            <button
              onClick={load}
              className="btn-secondary flex items-center gap-2 self-start"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* ── KPI cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map(({ cls, icon: Icon, label, value, sub }) => (
            <div key={label} className={cls}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider opacity-70">{label}</span>
                <Icon className="w-4 h-4 opacity-60" />
              </div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs opacity-60 mt-1">{sub}</p>
            </div>
          ))}
        </div>

        {/* ── Filter tabs ───────────────────────────────────────────────── */}
        <div className="tab-bar">
          {TABS.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setHrFilter(key as string)}
              className={hrFilter === key ? 'tab-active' : 'tab-inactive'}
            >
              {label}
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-medium
                ${hrFilter === key ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-400'}`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* ── Search ────────────────────────────────────────────────────── */}
        <div className="search-bar">
          <Search className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-input"
          />
        </div>

        {/* ── Table / List ──────────────────────────────────────────────── */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="table-container flex flex-col items-center justify-center py-16 text-center">
            <ArrowDownToLine className="w-10 h-10 text-slate-600 mb-3" />
            <p className="text-slate-300 font-semibold">No withdrawal requests</p>
            <p className="text-slate-500 text-sm mt-1">
              {hrFilter === 'pending' ? 'No pending requests to review' : `No ${hrFilter || ''} withdrawals found`}
            </p>
          </div>
        ) : (
          <div className="table-container">
            <div className="space-y-px">
              {filtered.map((w: any) => {
                const hrCfg    = HR_STATUS_CFG[w.hrStatus] || HR_STATUS_CFG.pending
                const HrIcon   = hrCfg.icon
                const pmtBadge = PAYMENT_STATUS_BADGE[w.status] || PAYMENT_STATUS_BADGE.pending

                return (
                  <div key={w._id} className="table-row group">
                    <div className="flex items-start gap-4">

                      {/* Avatar */}
                      <div className="avatar-md flex-shrink-0">
                        {w.user?.name?.[0]?.toUpperCase() || '?'}
                      </div>

                      {/* Main info */}
                      <div className="flex-1 min-w-0">
                        {/* Name + tier */}
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="text-white font-semibold text-sm">
                            {w.user?.name || 'Unknown Partner'}
                          </span>
                          {w.user?.packageTier && (
                            <span className={`badge capitalize ${TIER_BADGE[w.user.packageTier] || TIER_BADGE.free}`}>
                              {w.user.packageTier}
                            </span>
                          )}
                        </div>

                        {/* Contact */}
                        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                          {w.user?.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />{w.user.email}
                            </span>
                          )}
                          {w.user?.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />{w.user.phone}
                            </span>
                          )}
                        </div>

                        {/* Amount row */}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span className="text-violet-300 font-bold text-base">
                            {fmt(w.amount)}
                          </span>
                          {w.tdsAmount > 0 && (
                            <span className="text-slate-500 text-xs">
                              TDS {fmt(w.tdsAmount)} → Net <span className="text-emerald-400">{fmt(w.netAmount)}</span>
                            </span>
                          )}
                          <span className="text-slate-600 text-xs">
                            {new Date(w.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            })}
                          </span>
                          {/* Payment status */}
                          <span className={`badge ${pmtBadge} capitalize`}>{w.status}</span>
                        </div>

                        {/* Bank summary */}
                        {(w.accountNumber || w.user?.kyc?.bankAccount) && (
                          <div className="mt-2 flex items-center gap-2 bg-slate-700/40 border border-slate-700/60 rounded-lg px-3 py-1.5 w-fit max-w-full">
                            <Building2 className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                            <p className="text-slate-400 text-xs truncate">
                              <span className="font-mono text-slate-300">{w.accountNumber || w.user?.kyc?.bankAccount}</span>
                              {(w.ifscCode || w.user?.kyc?.bankIfsc) && (
                                <> &middot; <span className="font-mono text-slate-300">{w.ifscCode || w.user?.kyc?.bankIfsc}</span></>
                              )}
                              {(w.accountName || w.user?.kyc?.bankHolderName) && (
                                <> &middot; {w.accountName || w.user?.kyc?.bankHolderName}</>
                              )}
                            </p>
                          </div>
                        )}

                        {/* Payout ID */}
                        {w.razorpayPayoutId && (
                          <div className="mt-2 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-1.5 w-fit">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                            <p className="text-emerald-300 text-xs font-mono">{w.razorpayPayoutId}</p>
                          </div>
                        )}

                        {/* Rejection reason */}
                        {w.hrRejectionReason && (
                          <div className="mt-2 flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 mt-0.5 flex-shrink-0" />
                            <p className="text-rose-300 text-xs">{w.hrRejectionReason}</p>
                          </div>
                        )}
                      </div>

                      {/* Right column: HR status badge + action */}
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span className={`badge flex items-center gap-1 ${hrCfg.badgeClass}`}>
                          <HrIcon className="w-3 h-3" /> {hrCfg.label}
                        </span>
                        <button
                          onClick={() => { setSelected(w); setRejReason(''); setTxRef('') }}
                          className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
                        >
                          <Eye className="w-3.5 h-3.5" /> Review
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Detail / Action Modal ───────────────────────────────────────── */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-box w-full max-w-md" onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <ArrowDownToLine className="w-5 h-5 text-violet-400" />
                <h3 className="text-white font-bold">Withdrawal Review</h3>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="modal-body space-y-4">

              {/* Partner info */}
              <div className="glass rounded-xl p-4">
                <p className="section-title mb-3">Referral Partner Details</p>
                <div className="flex items-center gap-3 mb-3">
                  <div className="avatar-md flex-shrink-0">
                    {selected.user?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{selected.user?.name}</p>
                    <p className="text-slate-400 text-xs">{selected.user?.email}</p>
                  </div>
                  {selected.user?.packageTier && (
                    <span className={`badge capitalize ml-auto ${TIER_BADGE[selected.user.packageTier] || TIER_BADGE.free}`}>
                      {selected.user.packageTier}
                    </span>
                  )}
                </div>
                {selected.user?.phone && (
                  <p className="text-slate-400 text-xs flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />{selected.user.phone}
                  </p>
                )}
              </div>

              {/* Amount breakdown */}
              <div className="glass rounded-xl p-4 space-y-2">
                <p className="section-title mb-2">Amount Details</p>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Requested</span>
                  <span className="text-white font-bold">{fmt(selected.amount)}</span>
                </div>
                {selected.tdsAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">TDS ({selected.tdsRate}%)</span>
                    <span className="text-rose-400">- {fmt(selected.tdsAmount)}</span>
                  </div>
                )}
                <div className="border-t border-slate-700 pt-2 flex justify-between text-sm font-bold">
                  <span className="text-slate-300">Net Payable</span>
                  <span className="text-emerald-400">{fmt(selected.netAmount || selected.amount)}</span>
                </div>
              </div>

              {/* Bank details */}
              <div className="glass rounded-xl p-4 space-y-1.5">
                <p className="section-title mb-2 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> Bank Account
                </p>
                {[
                  { label: 'Account Holder', value: selected.accountName      || selected.user?.kyc?.bankHolderName },
                  { label: 'Account No.',    value: selected.accountNumber     || selected.user?.kyc?.bankAccount    },
                  { label: 'IFSC Code',      value: selected.ifscCode          || selected.user?.kyc?.bankIfsc       },
                  { label: 'Bank Name',      value: selected.user?.kyc?.bankName },
                ].filter(f => f.value).map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-slate-500">{label}</span>
                    <span className="text-slate-300 font-mono text-xs">{value}</span>
                  </div>
                ))}
              </div>

              {/* KYC status */}
              <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 border text-sm
                ${selected.user?.kyc?.status === 'verified'
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/25 text-rose-400'}`}>
                <Shield className="w-4 h-4 flex-shrink-0" />
                KYC: <span className="font-bold capitalize ml-1">{selected.user?.kyc?.status || 'Not submitted'}</span>
              </div>

              {/* HR actions: pending */}
              {selected.hrStatus === 'pending' && (
                <div className="space-y-3">
                  {/* Approve */}
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                    <p className="text-emerald-300 text-sm font-semibold mb-1">Approve Withdrawal</p>
                    <p className="text-slate-400 text-xs mb-3">
                      Transfer <span className="text-emerald-400 font-bold">{fmt(selected.netAmount || selected.amount)}</span> to the bank account above via Razorpay Payouts or manual NEFT/IMPS.
                    </p>
                    <button
                      onClick={() => approve(selected._id)}
                      disabled={acting}
                      className="btn-success w-full flex items-center justify-center gap-2"
                    >
                      {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Approve &amp; Process
                    </button>
                  </div>

                  {/* Reject */}
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 space-y-3">
                    <p className="text-rose-300 text-sm font-semibold">Reject Withdrawal</p>
                    <textarea
                      value={rejReason}
                      onChange={e => setRejReason(e.target.value)}
                      placeholder="Enter rejection reason (required)..."
                      rows={2}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-rose-500 resize-none"
                    />
                    <button
                      onClick={() => reject(selected._id)}
                      disabled={acting || !rejReason.trim()}
                      className="btn-danger w-full flex items-center justify-center gap-2"
                    >
                      {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                      Reject &amp; Refund Wallet
                    </button>
                  </div>
                </div>
              )}

              {/* Mark complete (approved, not yet completed) */}
              {selected.hrStatus === 'approved' && selected.status !== 'completed' && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 space-y-3">
                  <p className="text-blue-300 text-sm font-semibold">Mark as Completed</p>
                  <p className="text-slate-400 text-xs">
                    Once payment is transferred, enter the transaction reference and mark as complete.
                  </p>
                  <input
                    type="text"
                    value={txRef}
                    onChange={e => setTxRef(e.target.value)}
                    placeholder="Transaction ID / UTR number (optional)"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => complete(selected._id)}
                    disabled={acting}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Mark as Completed
                  </button>
                </div>
              )}

              {/* Status banner for non-pending */}
              {selected.hrStatus !== 'pending' && (
                <div className={`rounded-xl border p-3 text-sm flex items-center gap-2
                  ${selected.hrStatus === 'approved'
                    ? 'bg-blue-500/10 border-blue-500/25 text-blue-300'
                    : 'bg-rose-500/10 border-rose-500/25 text-rose-300'}`}>
                  {selected.hrStatus === 'approved'
                    ? <><CheckCircle className="w-4 h-4 flex-shrink-0" /> Approved by HR &middot; Status: <span className="font-bold capitalize ml-1">{selected.status}</span></>
                    : <><XCircle className="w-4 h-4 flex-shrink-0" /> Rejected: {selected.hrRejectionReason}</>
                  }
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="modal-footer">
              <button onClick={() => setSelected(null)} className="btn-secondary w-full">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
