'use client'
import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { adminAPI } from '@/lib/api'
import { usePackages, tierStyle, tierName } from '@/lib/usePackages'
import toast from 'react-hot-toast'
import {
  ShieldCheck, ShieldAlert, Clock, CheckCircle, XCircle, Search,
  Eye, X, ChevronLeft, ChevronRight, CreditCard, Fingerprint,
  Building2, User, Phone, Mail, Loader2, ZoomIn, ExternalLink,
  AlertTriangle, Check
} from 'lucide-react'

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  submitted: { label: 'Pending Review', color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  icon: Clock       },
  verified:  { label: 'Verified',       color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/30',  icon: CheckCircle },
  rejected:  { label: 'Rejected',       color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/30',    icon: XCircle     },
  pending:   { label: 'Not Submitted',  color: 'text-gray-400',   bg: 'bg-gray-500/10',   border: 'border-gray-500/30',   icon: Clock       },
}
const getStatus = (s: string) => STATUS_CFG[s] || STATUS_CFG.pending


function PhotoViewer({ url, label }: { url?: string; label: string }) {
  const [open, setOpen] = useState(false)
  if (!url) return (
    <div className="w-full h-24 rounded-xl bg-gray-800 border border-gray-700 border-dashed flex items-center justify-center">
      <p className="text-gray-600 text-xs">{label} not uploaded</p>
    </div>
  )
  return (
    <>
      <div className="relative group cursor-pointer rounded-xl overflow-hidden border border-gray-700 h-24" onClick={() => setOpen(true)}>
        <img src={url} alt={label} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
          <ZoomIn className="w-6 h-6 text-white" />
        </div>
      </div>
      {open && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setOpen(false)} className="absolute -top-10 right-0 text-white/70 hover:text-white">
              <X className="w-6 h-6" />
            </button>
            <img src={url} alt={label} className="w-full rounded-2xl" />
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 text-white/60 hover:text-white text-sm transition-colors">
              <ExternalLink className="w-4 h-4" /> Open in new tab
            </a>
          </div>
        </div>
      )}
    </>
  )
}

export default function KYCReviewPage() {
  const { packages } = usePackages()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('submitted')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})
  const [selected, setSelected] = useState<any>(null)
  const [rejReason, setRejReason] = useState('')
  const [acting, setActing] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await adminAPI.kycList({ status: statusFilter, page, search: search || undefined })
      setUsers(res.data.users || [])
      setTotalPages(res.data.pages || 1)
      setStatusCounts(res.data.statusCounts || {})
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [statusFilter, page])
  useEffect(() => { const t = setTimeout(() => { setPage(1); load() }, 400); return () => clearTimeout(t) }, [search])

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!selected) return
    if (action === 'reject' && !rejReason.trim()) return toast.error('Rejection reason required')
    setActing(true)
    try {
      await adminAPI.kycAction(selected._id, { action, rejectionReason: rejReason })
      toast.success(action === 'approve' ? '✅ KYC Approved!' : '❌ KYC Rejected')
      setSelected(null)
      setRejReason('')
      load()
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed') }
    finally { setActing(false) }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* ── Page Header ── */}
        <div className="page-header">
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            KYC Review
          </h1>
          <p className="text-gray-400 text-sm mt-1">Verify partner identity documents and compliance</p>
        </div>

        {/* ── Status filter KPI cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { key: 'submitted', label: 'Pending Review', color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  kpi: 'kpi-amber'   },
            { key: 'verified',  label: 'Verified',       color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/30',  kpi: 'kpi-emerald' },
            { key: 'rejected',  label: 'Rejected',       color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/30',    kpi: 'kpi-rose'    },
            { key: 'all',       label: 'All KYC',        color: 'text-white',      bg: 'bg-white/5',       border: 'border-white/10',      kpi: 'kpi-violet'  },
          ].map(f => {
            const count = f.key === 'all' ? Object.values(statusCounts).reduce((a: any, b: any) => a + b, 0) : (statusCounts[f.key] || 0)
            const active = statusFilter === f.key
            return (
              <button key={f.key} onClick={() => { setStatusFilter(f.key); setPage(1) }}
                className={`${active ? f.kpi : 'card'} text-center transition-all hover:scale-[1.02] p-5 rounded-2xl border`}
                style={{ border: active ? undefined : undefined }}>
                <p className={`text-2xl font-black ${active ? f.color : 'text-white'}`}>{count}</p>
                <p className={`text-xs mt-1 font-medium ${active ? f.color : 'text-gray-500'}`}>{f.label}</p>
              </button>
            )
          })}
        </div>

        {/* ── Search ── */}
        <div className="search-bar">
          <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, phone or email..."
            className="search-input" />
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-900 rounded-2xl animate-pulse" />)}</div>
        ) : users.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl py-14 text-center">
            <ShieldCheck className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 font-semibold">No KYC submissions found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {users.map(u => {
              const s = getStatus(u.kyc?.status || 'pending')
              const SIcon = s.icon
              return (
                <div key={u._id} className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl p-4 transition-all">
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {u.avatar
                        ? <img src={u.avatar} alt="" className="w-11 h-11 rounded-full object-cover ring-2 ring-gray-700" />
                        : <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-white font-bold">{u.name?.[0]?.toUpperCase()}</div>
                      }
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-bold text-sm">{u.name}</p>
                        {u.packageTier && (
                          <span className={`text-[10px] font-semibold px-1.5 py-px rounded-full ${tierStyle(u.packageTier, packages).chip}`}>
                            {tierName(u.packageTier, packages)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-gray-500 text-xs">{u.phone}</span>
                        {u.kyc?.submittedAt && (
                          <span className="text-gray-600 text-xs">Submitted {new Date(u.kyc.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        )}
                      </div>
                    </div>
                    {/* Status + action */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${s.bg} ${s.border} ${s.color}`}>
                        <SIcon className="w-3 h-3" /> {s.label}
                      </span>
                      <button onClick={() => setSelected(u)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-400 text-xs font-semibold hover:bg-violet-500/25 transition-colors">
                        <Eye className="w-3.5 h-3.5" /> Review
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg bg-gray-800 text-gray-400 disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-gray-400 text-sm">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg bg-gray-800 text-gray-400 disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ── Review Modal ── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-gray-900 px-5 py-4 border-b border-gray-800 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                {selected.avatar
                  ? <img src={selected.avatar} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-700" />
                  : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-white font-bold">{selected.name?.[0]?.toUpperCase()}</div>
                }
                <div>
                  <p className="text-white font-bold">{selected.name}</p>
                  <p className="text-gray-500 text-xs">{selected.phone} · {selected.email}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Current status */}
              {(() => { const s = getStatus(selected.kyc?.status); return (
                <div className={`flex items-center gap-3 p-3 rounded-xl border ${s.bg} ${s.border}`}>
                  <s.icon className={`w-5 h-5 ${s.color} flex-shrink-0`} />
                  <div>
                    <p className={`font-semibold text-sm ${s.color}`}>{s.label}</p>
                    {selected.kyc?.rejectionReason && <p className="text-red-300 text-xs mt-0.5">Reason: {selected.kyc.rejectionReason}</p>}
                    {selected.kyc?.reviewedBy && <p className="text-gray-500 text-xs mt-0.5">Reviewed by: {selected.kyc.reviewedBy}</p>}
                  </div>
                </div>
              )})()}

              {/* PAN */}
              <div className="bg-gray-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-violet-400" />
                  <h3 className="text-white font-semibold text-sm">PAN Card</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-gray-500 text-xs">PAN Number</p><p className="text-white font-mono font-bold tracking-widest mt-0.5">{selected.kyc?.pan || '—'}</p></div>
                  <div><p className="text-gray-500 text-xs">Name on PAN</p><p className="text-white mt-0.5">{selected.kyc?.panName || '—'}</p></div>
                </div>
                <PhotoViewer url={selected.kyc?.panPhoto} label="PAN Photo" />
              </div>

              {/* Aadhaar */}
              <div className="bg-gray-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-blue-400" />
                  <h3 className="text-white font-semibold text-sm">Aadhaar Card</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-gray-500 text-xs">Aadhaar Number</p><p className="text-white font-mono font-bold tracking-widest mt-0.5">{selected.kyc?.aadhar || '—'}</p></div>
                  <div><p className="text-gray-500 text-xs">Name on Aadhaar</p><p className="text-white mt-0.5">{selected.kyc?.aadharName || '—'}</p></div>
                </div>
                <PhotoViewer url={selected.kyc?.aadharPhoto} label="Aadhaar Photo" />
              </div>

              {/* Bank */}
              <div className="bg-gray-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-white font-semibold text-sm">Bank Account</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-gray-500 text-xs">Account Holder</p><p className="text-white mt-0.5">{selected.kyc?.bankHolderName || '—'}</p></div>
                  <div><p className="text-gray-500 text-xs">Account Number</p><p className="text-white font-mono mt-0.5">{selected.kyc?.bankAccount || '—'}</p></div>
                  <div><p className="text-gray-500 text-xs">IFSC Code</p><p className="text-white font-mono mt-0.5">{selected.kyc?.bankIfsc || '—'}</p></div>
                  <div><p className="text-gray-500 text-xs">Bank Name</p><p className="text-white mt-0.5">{selected.kyc?.bankName || '—'}</p></div>
                </div>
              </div>

              {/* Actions — only for submitted/rejected */}
              {['submitted', 'rejected'].includes(selected.kyc?.status) && (
                <div className="space-y-3">
                  <div>
                    <label className="text-gray-400 text-xs font-medium mb-1.5 block">Rejection Reason (required if rejecting)</label>
                    <input value={rejReason} onChange={e => setRejReason(e.target.value)}
                      placeholder="e.g. PAN photo is blurry, Aadhaar number mismatch..."
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-red-500 text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => handleAction('reject')} disabled={acting}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 font-bold text-sm hover:bg-red-500/25 transition-all disabled:opacity-50">
                      {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      Reject
                    </button>
                    <button onClick={() => handleAction('approve')} disabled={acting}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-green-500/20">
                      {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Approve KYC
                    </button>
                  </div>
                </div>
              )}

              {selected.kyc?.status === 'verified' && (
                <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-semibold">
                  <ShieldCheck className="w-4 h-4" /> KYC Verified
                  {selected.kyc?.verifiedAt && ` · ${new Date(selected.kyc.verifiedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
