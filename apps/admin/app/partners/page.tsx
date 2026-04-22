'use client'
import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { adminAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import ReferralsModal from '@/components/ReferralsModal'
import {
  Search, Users, RefreshCw, UserCog, X, CheckCircle, Crown,
  TrendingUp, IndianRupee, BarChart2, ChevronRight, Loader2,
  Phone, Star, Package, Activity, Award, UserPlus, Link2
} from 'lucide-react'

const TIER_COLOR: Record<string, string> = {
  free:    'bg-gray-500/20 text-gray-400',
  basic:   'bg-teal-500/20 text-teal-400',
  starter: 'bg-blue-500/20 text-blue-400',
  pro:     'bg-indigo-500/20 text-indigo-400',
  proedge: 'bg-fuchsia-500/20 text-fuchsia-400',
  elite:   'bg-violet-500/20 text-violet-400',
  supreme: 'bg-yellow-500/20 text-yellow-400',
  // Old website tier names
  'TRU BOOSTER':          'bg-blue-500/20 text-blue-400',
  'TRU STARTER':          'bg-indigo-500/20 text-indigo-400',
  'TRU ADVANCE':          'bg-fuchsia-500/20 text-fuchsia-400',
  'TRU PRO-EDGE':         'bg-violet-500/20 text-violet-400',
  'TRU PREMIUM-INFINITY': 'bg-yellow-500/20 text-yellow-400',
}
const TIER_ICON: Record<string, string> = {
  free: '🆓', basic: '🌱', starter: '⚡', pro: '🚀', proedge: '🔥', elite: '💎', supreme: '👑',
  'TRU BOOSTER': '⚡', 'TRU STARTER': '🚀', 'TRU ADVANCE': '🔥', 'TRU PRO-EDGE': '💎', 'TRU PREMIUM-INFINITY': '👑',
}
const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n || 0)

export default function PartnersPage() {
  const [tab, setTab] = useState<'partners' | 'managers'>('partners')
  const [partners, setPartners]       = useState<any[]>([])
  const [managers, setManagers]       = useState<any[]>([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [mgrFilter, setMgrFilter]     = useState('')
  const [page, setPage]               = useState(1)
  const [totalPages, setTotalPages]   = useState(1)
  const [assignModal, setAssignModal] = useState<any>(null)
  const [assigning, setAssigning]     = useState(false)
  const [selectedMgr, setSelectedMgr] = useState('')
  const [perfModal, setPerfModal]     = useState<any>(null)
  const [perfData, setPerfData]       = useState<any>(null)
  const [perfLoading, setPerfLoading] = useState(false)
  const [createMgrModal, setCreateMgrModal] = useState(false)
  const [mgrForm, setMgrForm]         = useState({ name: '', email: '', phone: '', password: '' })
  const [creatingMgr, setCreatingMgr] = useState(false)
  const [refModal, setRefModal]       = useState<{ id: string; name: string } | null>(null)
  const [pkgList, setPkgList]         = useState<any[]>([])

  useEffect(() => { fetchManagers(); adminAPI.packages().then((r: any) => setPkgList(r.data?.packages || r.data || [])).catch(() => {}) }, [])
  useEffect(() => { fetchPartners() }, [search, mgrFilter, page])

  const fetchManagers = async () => {
    try {
      const r = await adminAPI.managers()
      setManagers(r.data.managers || [])
    } catch {}
  }

  const fetchPartners = async () => {
    setLoading(true)
    try {
      const r = await adminAPI.partners({ search, managerId: mgrFilter, page, limit: 20 })
      setPartners(r.data.partners || [])
      setTotalPages(r.data.pages || 1)
    } catch { toast.error('Failed to load partners') }
    finally { setLoading(false) }
  }

  const handleCreateMgr = async () => {
    if (!mgrForm.name || !mgrForm.email || !mgrForm.password) return toast.error('Name, email & password required')
    setCreatingMgr(true)
    try {
      await adminAPI.createPartnerManager(mgrForm)
      toast.success('Partner Manager created!')
      setCreateMgrModal(false)
      setMgrForm({ name: '', email: '', phone: '', password: '' })
      fetchManagers()
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to create') }
    finally { setCreatingMgr(false) }
  }

  const openAssign = (partner: any) => {
    setAssignModal(partner)
    setSelectedMgr(partner.managerId?._id || '')
  }

  const handleAssign = async () => {
    if (!assignModal) return
    setAssigning(true)
    try {
      await adminAPI.assignManager(assignModal._id, selectedMgr || null)
      toast.success('Manager assigned!')
      setAssignModal(null)
      fetchPartners()
      fetchManagers()
    } catch { toast.error('Failed') }
    finally { setAssigning(false) }
  }

  const openPerfModal = async (mgr: any) => {
    setPerfModal(mgr)
    setPerfData(null)
    setPerfLoading(true)
    try {
      const r = await adminAPI.managerPerformance(mgr._id)
      setPerfData(r.data)
    } catch { toast.error('Failed to load performance data') }
    finally { setPerfLoading(false) }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* ── Page Header ── */}
        <div className="page-header">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                Partners & Managers
              </h1>
              <p className="text-gray-400 text-sm mt-1">Manage partners, assign managers, and track performance</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setCreateMgrModal(true)} className="btn-primary flex items-center gap-2">
                <UserPlus className="w-4 h-4" /> Create Partner Manager
              </button>
              <button onClick={() => { fetchPartners(); fetchManagers() }}
                className="p-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl border border-white/10 transition-all">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="tab-bar w-fit">
          <button onClick={() => setTab('partners')} className={`flex items-center gap-2 ${tab === 'partners' ? 'tab-active' : 'tab-inactive'}`}>
            <Users className="w-4 h-4" /> Partners
          </button>
          <button onClick={() => setTab('managers')} className={`flex items-center gap-2 ${tab === 'managers' ? 'tab-active' : 'tab-inactive'}`}>
            <UserCog className="w-4 h-4" /> Manager Performance
          </button>
        </div>

        {/* ── Analytics KPI Cards ── */}
        {(() => {
          const totalEarnings = partners.reduce((s, p) => s + (p.totalEarnings || 0), 0)
          const activePartners = partners.filter(p => p.isActive).length
          const unassigned = partners.filter(p => !p.managerId).length
          const tierCounts: Record<string, number> = {}
          partners.forEach(p => { tierCounts[p.packageTier || 'free'] = (tierCounts[p.packageTier || 'free'] || 0) + 1 })
          const topTier = Object.entries(tierCounts).sort((a, b) => b[1] - a[1])[0]
          return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="kpi-violet rounded-2xl p-4 border flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Total Partners</p>
                  <p className="text-2xl font-bold text-white">{partners.length}</p>
                  <p className="text-xs text-green-400 mt-0.5">{activePartners} active</p>
                </div>
              </div>
              <div className="kpi-emerald rounded-2xl p-4 border flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <IndianRupee className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Total Commissions</p>
                  <p className="text-2xl font-bold text-emerald-400">₹{(totalEarnings / 1000).toFixed(1)}k</p>
                  <p className="text-xs text-gray-500 mt-0.5">cumulative earnings</p>
                </div>
              </div>
              <div className="kpi-blue rounded-2xl p-4 border flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <UserCog className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Managers</p>
                  <p className="text-2xl font-bold text-white">{managers.length}</p>
                  <p className="text-xs text-orange-400 mt-0.5">{unassigned} unassigned</p>
                </div>
              </div>
              <div className="kpi-amber rounded-2xl p-4 border flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <Star className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Top Tier</p>
                  <p className="text-2xl font-bold text-amber-400 capitalize">{topTier?.[0] || '—'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{topTier?.[1] || 0} partners</p>
                </div>
              </div>
            </div>
          )
        })()}

        {/* ── Package Distribution ── */}
        {partners.length > 0 && (() => {
          const tierCounts: Record<string, number> = {}
          partners.forEach(p => { tierCounts[p.packageTier?.toLowerCase() || 'free'] = (tierCounts[p.packageTier?.toLowerCase() || 'free'] || 0) + 1 })
          const colors = ['bg-blue-500','bg-indigo-500','bg-violet-500','bg-yellow-500','bg-emerald-500','bg-fuchsia-500','bg-gray-500']
          const displayList = pkgList.length > 0
            ? pkgList.map((pkg: any, i: number) => ({ key: pkg.tier?.toLowerCase(), label: pkg.name, color: colors[i % colors.length] }))
            : [
                { key: 'free', label: 'Free', color: 'bg-gray-500' },
                { key: 'starter', label: 'Starter', color: 'bg-blue-500' },
                { key: 'pro', label: 'Pro', color: 'bg-indigo-500' },
                { key: 'elite', label: 'Elite', color: 'bg-violet-500' },
                { key: 'supreme', label: 'Supreme', color: 'bg-yellow-500' },
              ]
          return (
            <div className="bg-slate-800 rounded-2xl p-4 border border-white/5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-violet-400" /> Package Distribution
              </p>
              <div className="flex items-end gap-2 h-16">
                {displayList.map((item: any) => {
                  const count = tierCounts[item.key] || 0
                  const pct = partners.length > 0 ? (count / partners.length) * 100 : 0
                  return (
                    <div key={item.key + item.label} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs text-gray-400">{count}</span>
                      <div className={`w-full rounded-t-lg ${item.color} opacity-80`} style={{ height: `${Math.max(pct * 0.48, count > 0 ? 4 : 0)}px` }} />
                      <span className="text-[9px] text-gray-500 text-center leading-tight">{item.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* ─── PARTNERS TAB ─── */}
        {tab === 'partners' && (
          <>
            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                  placeholder="Search by name, email, code..."
                  className="w-full bg-slate-800 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm border border-white/10 outline-none focus:border-violet-500" />
              </div>
              <select value={mgrFilter} onChange={e => { setMgrFilter(e.target.value); setPage(1) }}
                className="bg-slate-800 text-white rounded-xl px-4 py-2.5 text-sm border border-white/10 outline-none min-w-44">
                <option value="">All Partners</option>
                <option value="unassigned">Unassigned Only</option>
                {managers.map(m => <option key={m._id} value={m._id}>{m.name} ({m.assignedCount})</option>)}
              </select>
            </div>

            {/* Partner Cards Grid */}
            {loading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-violet-400" /></div>
            ) : partners.length === 0 ? (
              <div className="text-center py-20 bg-slate-800/40 rounded-2xl border border-white/5">
                <Users className="w-14 h-14 mx-auto mb-4 text-gray-700" />
                <p className="text-gray-300 font-semibold">No partners found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {partners.map((p: any) => (
                  <div key={p._id} className="bg-slate-800 rounded-2xl border border-white/5 hover:border-violet-500/25 p-5 flex flex-col gap-4 transition-all hover:shadow-lg hover:shadow-violet-500/5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center text-xl font-bold text-violet-400 flex-shrink-0 border border-violet-500/15">
                          {p.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-sm">{p.name}</h3>
                          <p className="text-gray-500 text-xs font-mono">{p.affiliateCode}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-lg capitalize font-semibold flex items-center gap-1 ${TIER_COLOR[p.packageTier] || TIER_COLOR.free}`}>
                        {TIER_ICON[p.packageTier]} {p.packageTier}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-700/50 rounded-xl p-2.5">
                        <p className="text-base font-bold text-white">₹{fmt(p.totalEarnings || 0)}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">Total Earned</p>
                      </div>
                      <div className="bg-slate-700/50 rounded-xl p-2.5">
                        <p className="text-base font-bold text-emerald-400">₹{fmt(p.wallet || 0)}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">Wallet Balance</p>
                      </div>
                      <button onClick={() => setRefModal({ id: p._id, name: p.name })}
                        className="bg-slate-700/50 hover:bg-cyan-500/15 rounded-xl p-2.5 text-left transition-colors w-full">
                        <p className="text-base font-bold text-cyan-400">{p._perf?.referralCount || 0}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">Referrals →</p>
                      </button>
                      <div className="bg-slate-700/50 rounded-xl p-2.5">
                        <p className="text-base font-bold text-violet-400">₹{fmt(p._perf?.commAmount || 0)}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          Comm · <span className="text-orange-400">{p._perf?.commCount || 0} txns</span>
                        </p>
                      </div>
                    </div>
                    {/* Commission breakdown */}
                    {(p._perf?.commAmount > 0) && (
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="flex items-center gap-1 bg-green-500/10 text-green-400 px-2 py-1 rounded-lg">
                          ✓ Paid ₹{fmt(p._perf?.paidAmount || 0)}
                        </span>
                        {(p._perf?.pendingAmount > 0) && (
                          <span className="flex items-center gap-1 bg-orange-500/10 text-orange-400 px-2 py-1 rounded-lg">
                            ⏳ Pending ₹{fmt(p._perf?.pendingAmount || 0)}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Sponsor row */}
                    {p.referredBy && (
                      <div className="flex items-center gap-1.5 bg-slate-700/30 rounded-lg px-2.5 py-1.5">
                        <Link2 className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                        <span className="text-xs text-gray-400">Sponsor:</span>
                        <span className="text-xs text-cyan-300 font-medium">{p.referredBy.name}</span>
                        <span className="text-[10px] text-gray-500 font-mono ml-auto">{p.referredBy.affiliateCode}</span>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5">
                        {p.managerId ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                              <UserCog className="w-3 h-3 text-violet-400" />
                            </div>
                            <span className="text-xs text-violet-300 font-medium">{p.managerId.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-lg">Unassigned</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${p.isActive ? 'bg-green-400' : 'bg-gray-600'}`} />
                        <button onClick={() => setRefModal({ id: p._id, name: p.name })}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25 transition-colors">
                          <Users className="w-3 h-3" /> Referrals ({p._perf?.referralCount || 0})
                        </button>
                        <button onClick={() => openAssign(p)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-violet-500/15 text-violet-400 hover:bg-violet-500/25 transition-colors">
                          <UserCog className="w-3 h-3" /> Assign
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                {Array.from({ length: Math.min(totalPages, 8) }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${p === page ? 'bg-violet-600 text-white' : 'bg-slate-800 text-gray-400 hover:text-white border border-white/10'}`}>
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* ─── MANAGER PERFORMANCE TAB ─── */}
        {tab === 'managers' && (
          <div className="space-y-4">
            {managers.length === 0 ? (
              <div className="text-center py-20 bg-slate-800/40 rounded-2xl border border-white/5">
                <UserCog className="w-14 h-14 mx-auto mb-4 text-gray-700" />
                <p className="text-gray-300 font-semibold">No managers yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {managers.map((m: any) => (
                  <div key={m._id}
                    onClick={() => openPerfModal(m)}
                    className="group bg-slate-800 rounded-2xl border border-white/5 hover:border-violet-500/30 p-5 flex flex-col gap-4 cursor-pointer transition-all hover:shadow-xl hover:shadow-violet-500/10 hover:-translate-y-0.5">
                    {/* Manager header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/25 to-purple-600/25 border border-violet-500/20 flex items-center justify-center text-xl font-bold text-violet-300 flex-shrink-0">
                          {m.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-white font-bold group-hover:text-violet-300 transition-colors">{m.name}</h3>
                          <p className="text-gray-500 text-xs">{m.email}</p>
                        </div>
                      </div>
                      <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
                        <BarChart2 className="w-3.5 h-3.5 text-violet-400" />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-700/50 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-violet-400">{m.assignedCount}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">Assigned Partners</p>
                      </div>
                      <div className="bg-slate-700/50 rounded-xl p-3 text-center">
                        <p className="text-sm font-bold text-white flex items-center justify-center gap-0.5">
                          <span className="text-xs text-gray-500">₹</span>
                          {((m.totalEarnings || 0) / 1000).toFixed(1)}k
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5">Own Earnings</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-white/5">
                      {m.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Phone className="w-3 h-3" /> {m.phone}
                        </div>
                      )}
                      <span className="text-xs text-violet-400 group-hover:text-violet-300 flex items-center gap-1 font-medium ml-auto">
                        View Performance <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── ASSIGN MODAL ─── */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-white/10 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold text-lg">Assign Manager</h2>
              <button onClick={() => setAssignModal(null)}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
            </div>
            <div className="bg-slate-700/50 rounded-xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center font-bold text-violet-400 text-lg">
                {assignModal.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-white font-semibold">{assignModal.name}</p>
                <p className="text-gray-400 text-xs">{assignModal.affiliateCode} · {assignModal.packageTier}</p>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-2 block font-medium uppercase tracking-wide">Select Manager</label>
              <select value={selectedMgr} onChange={e => setSelectedMgr(e.target.value)}
                className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 text-sm border border-white/10 outline-none focus:border-violet-500">
                <option value="">— Remove Manager (Unassign) —</option>
                {managers.map(m => (
                  <option key={m._id} value={m._id}>{m.name} · {m.assignedCount} partners</option>
                ))}
              </select>
            </div>
            {selectedMgr && (() => {
              const mgr = managers.find((m: any) => m._id === selectedMgr)
              return mgr ? (
                <div className="bg-violet-500/10 rounded-xl p-3 border border-violet-500/20 flex items-center gap-3">
                  <UserCog className="w-5 h-5 text-violet-400 flex-shrink-0" />
                  <div>
                    <p className="text-violet-300 font-semibold text-sm">{mgr.name}</p>
                    <p className="text-gray-400 text-xs">{mgr.email} · {mgr.assignedCount} partners currently</p>
                  </div>
                </div>
              ) : null
            })()}
            <div className="flex gap-3 pt-1">
              <button onClick={() => setAssignModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:text-white">
                Cancel
              </button>
              <button onClick={handleAssign} disabled={assigning}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                {assigning
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <CheckCircle className="w-4 h-4" />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MANAGER PERFORMANCE MODAL ─── */}
      {perfModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-800 rounded-2xl w-full max-w-xl border border-white/10 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/25 to-purple-600/25 border border-violet-500/20 flex items-center justify-center text-xl font-bold text-violet-300">
                  {perfModal.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">{perfModal.name}</h2>
                  <p className="text-gray-400 text-xs">{perfModal.email}</p>
                </div>
              </div>
              <button onClick={() => { setPerfModal(null); setPerfData(null) }}>
                <X className="w-5 h-5 text-gray-400 hover:text-white" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {perfLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-7 h-7 animate-spin text-violet-400" />
                </div>
              ) : perfData ? (
                <>
                  {/* Stats grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-700/50 rounded-xl p-4 border border-white/5">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-3.5 h-3.5 text-violet-400" />
                        <p className="text-xs text-gray-400">Assigned</p>
                      </div>
                      <p className="text-2xl font-bold text-white">{perfData.assignedPartners}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{perfData.activePartners} active</p>
                    </div>
                    <div className="bg-slate-700/50 rounded-xl p-4 border border-white/5">
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="w-3.5 h-3.5 text-blue-400" />
                        <p className="text-xs text-gray-400">Orders</p>
                      </div>
                      <p className="text-2xl font-bold text-white">{perfData.totalOrders}</p>
                      <p className="text-xs text-gray-500 mt-0.5">by partners</p>
                    </div>
                    <div className="bg-slate-700/50 rounded-xl p-4 border border-white/5 col-span-2 sm:col-span-1">
                      <div className="flex items-center gap-2 mb-1">
                        <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
                        <p className="text-xs text-gray-400">Partner Sales</p>
                      </div>
                      <p className="text-2xl font-bold text-emerald-400">₹{fmt(perfData.totalSales)}</p>
                      <p className="text-xs text-gray-500 mt-0.5">total revenue</p>
                    </div>
                  </div>

                  {/* Commission summary */}
                  <div className="bg-slate-700/30 rounded-xl p-4 border border-white/5 space-y-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-2">
                      <Award className="w-3.5 h-3.5 text-violet-400" /> EMI Commission Earned
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Credited</p>
                        <p className="text-xl font-bold text-green-400">₹{fmt(perfData.earnedCommission)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Pending</p>
                        <p className="text-xl font-bold text-amber-400">₹{fmt(perfData.pendingCommission)}</p>
                      </div>
                    </div>
                    {(perfData.earnedCommission + perfData.pendingCommission) > 0 && (
                      <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-green-500 h-1.5 rounded-full" style={{
                          width: `${Math.round(perfData.earnedCommission / (perfData.earnedCommission + perfData.pendingCommission) * 100)}%`
                        }} />
                      </div>
                    )}
                  </div>

                  {/* Recent orders */}
                  {perfData.recentOrders?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-violet-400" /> Recent Partner Orders
                      </p>
                      <div className="space-y-2">
                        {perfData.recentOrders.slice(0, 6).map((o: any) => (
                          <div key={o._id} className="flex items-center justify-between bg-slate-700/30 rounded-xl px-4 py-3 border border-white/5">
                            <div>
                              <p className="text-sm text-white font-medium">{o.partnerUser?.name || 'Partner'}</p>
                              <p className="text-xs text-gray-500 font-mono">{o.partnerUser?.affiliateCode}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-emerald-400">₹{fmt(o.paidAmount || o.totalAmount)}</p>
                              <p className="text-xs text-gray-500 capitalize">{o.purchaseType || 'full'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-400 text-center py-8">No data available</p>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ── Create Partner Manager Modal ── */}
      {createMgrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="bg-[#0f1120] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-yellow-400" /> Create Partner Manager
              </h3>
              <button onClick={() => setCreateMgrModal(false)} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              {[
                { key: 'name', label: 'Full Name *', placeholder: 'e.g. Priya Sharma', type: 'text' },
                { key: 'email', label: 'Email *', placeholder: 'priya@example.com', type: 'email' },
                { key: 'phone', label: 'Phone', placeholder: '+91 98765 43210', type: 'text' },
                { key: 'password', label: 'Password *', placeholder: 'Min 6 characters', type: 'password' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">{f.label}</label>
                  <input type={f.type} value={(mgrForm as any)[f.key]}
                    onChange={e => setMgrForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500/50" />
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500">Manager will be able to log in to the admin panel and manage assigned partners.</p>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setCreateMgrModal(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:text-white">Cancel</button>
              <button onClick={handleCreateMgr} disabled={creatingMgr}
                className="flex-1 py-2.5 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                {creatingMgr ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Create Manager
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ─── REFERRALS MODAL ─── */}
      {refModal && (
        <ReferralsModal
          userId={refModal.id}
          userName={refModal.name}
          onClose={() => setRefModal(null)}
        />
      )}
    </AdminLayout>
  )
}
