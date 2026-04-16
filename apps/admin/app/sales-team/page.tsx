'use client'
import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { adminAPI } from '@/lib/api'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import {
  UserCheck, Users, IndianRupee, ShoppingBag, TrendingUp,
  Search, RefreshCw, X, CheckCircle, ChevronRight, Loader2,
  UserPlus, ClipboardList, Eye, Phone, MessageCircle, BarChart2, Target,
  ArrowRight, Award, Zap
} from 'lucide-react'

const STATUS_COLOR: Record<string, string> = {
  pending:    'bg-yellow-500/20 text-yellow-400',
  token_paid: 'bg-blue-500/20 text-blue-400',
  partial:    'bg-orange-500/20 text-orange-400',
  paid:       'bg-green-500/20 text-green-400',
  cancelled:  'bg-red-500/20 text-red-400',
}

const STAGE_COLOR: Record<string, string> = {
  new:             'bg-gray-500/20 text-gray-400',
  contacted:       'bg-blue-500/20 text-blue-400',
  interested:      'bg-yellow-500/20 text-yellow-400',
  demo_done:       'bg-purple-500/20 text-purple-400',
  negotiating:     'bg-orange-500/20 text-orange-400',
  token_collected: 'bg-yellow-400/20 text-yellow-300',
  paid:            'bg-green-500/20 text-green-400',
  lost:            'bg-red-500/20 text-red-400',
}

const STAGE_BAR: Record<string, string> = {
  new: 'bg-slate-500',
  contacted: 'bg-blue-500',
  interested: 'bg-amber-500',
  demo_done: 'bg-purple-500',
  negotiating: 'bg-orange-500',
  token_collected: 'bg-yellow-400',
  paid: 'bg-green-500',
  lost: 'bg-red-500',
}

const STAGE_ORDER = ['new','contacted','interested','demo_done','negotiating','token_collected','paid','lost'] as const

// Derive initials gradient from name
function getAvatarGradient(name: string) {
  const gradients = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-pink-600',
    'from-cyan-500 to-sky-600',
  ]
  const idx = (name?.charCodeAt(0) || 0) % gradients.length
  return gradients[idx]
}

function getInitials(name: string) {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function getPerformanceScore(sp: any) {
  const convRate = sp.totalOrders > 0 ? Math.min(100, Math.round(((sp.paidOrders || 0) / sp.totalOrders) * 100)) : 0
  const orders = Math.min(100, (sp.totalOrders || 0) * 5)
  return Math.round((convRate * 0.6) + (orders * 0.4))
}

export default function SalesTeamPage() {
  const [tab, setTab] = useState<'team' | 'orders' | 'leads'>('team')
  const [salespersons, setSalespersons] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Assign leads modal
  const [assignModal, setAssignModal] = useState(false)
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [assignTo, setAssignTo] = useState('')
  const [assigning, setAssigning] = useState(false)

  // Performance modal
  const [perfModal, setPerfModal] = useState(false)
  const [perfData, setPerfData] = useState<any>(null)
  const [perfLoading, setPerfLoading] = useState(false)

  // Create Sales Member modal
  const [createModal, setCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', email: '', phone: '', password: '', department: 'sales' })
  const [creating, setCreating] = useState(false)

  useEffect(() => { fetchStats() }, [])
  useEffect(() => {
    if (tab === 'team') fetchTeam()
    else if (tab === 'orders') fetchOrders()
    else fetchLeads()
  }, [tab, search, statusFilter, page])

  const fetchStats = async () => {
    try { const r = await adminAPI.salesStats(); setStats(r.data.stats) } catch {}
  }

  const handleCreate = async () => {
    if (!createForm.name || !createForm.email || !createForm.password) return toast.error('Name, email & password required')
    setCreating(true)
    try {
      await adminAPI.createSalesperson(createForm)
      toast.success('Sales member created!')
      setCreateModal(false)
      setCreateForm({ name: '', email: '', phone: '', password: '', department: 'sales' })
      fetchTeam(); fetchStats()
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to create') }
    finally { setCreating(false) }
  }

  const fetchTeam = async () => {
    setLoading(true)
    try {
      const r = await adminAPI.salespersons({ search, page, limit: 15 })
      setSalespersons(r.data.salespersons || [])
      setTotalPages(r.data.pages || 1)
    } catch { toast.error('Failed to load team') }
    finally { setLoading(false) }
  }

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const r = await adminAPI.salesOrders({ status: statusFilter, page, limit: 20 })
      setOrders(r.data.orders || [])
      setTotalPages(r.data.pages || 1)
    } catch { toast.error('Failed to load orders') }
    finally { setLoading(false) }
  }

  const fetchLeads = async () => {
    setLoading(true)
    try {
      const r = await adminAPI.crmLeads({ search, page, limit: 20 })
      setLeads(r.data.leads || [])
      setTotalPages(r.data.pages || 1)
    } catch { toast.error('Failed to load leads') }
    finally { setLoading(false) }
  }

  const handleAssignLeads = async () => {
    if (!selectedLeads.length || !assignTo) return toast.error('Select leads and salesperson')
    setAssigning(true)
    try {
      await adminAPI.assignLeads(selectedLeads, assignTo)
      toast.success(`${selectedLeads.length} lead(s) assigned!`)
      setSelectedLeads([])
      setAssignModal(false)
      fetchLeads()
    } catch { toast.error('Failed to assign') }
    finally { setAssigning(false) }
  }

  const toggleLead = (id: string) =>
    setSelectedLeads(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])

  const [perfSpId, setPerfSpId] = useState('')
  const [perfStageFilter, setPerfStageFilter] = useState('')
  const [perfDateFilter, setPerfDateFilter] = useState('')
  const [perfTab, setPerfTab] = useState<'overview' | 'leads'>('overview')

  const getAuthHeader = () => ({
    Authorization: `Bearer ${typeof window !== 'undefined' ? (document.cookie.match(/adminToken=([^;]+)/)?.[1] || localStorage.getItem('adminToken') || '') : ''}`
  })

  const openPerformance = async (spId: string) => {
    setPerfLoading(true); setPerfModal(true); setPerfData(null)
    setPerfSpId(spId); setPerfStageFilter(''); setPerfDateFilter(''); setPerfTab('overview')
    try {
      const r = await api.get(`/admin/salespersons/${spId}/performance`, { headers: getAuthHeader() })
      setPerfData(r.data)
    } catch { toast.error('Failed to load performance') }
    finally { setPerfLoading(false) }
  }

  const refetchPerfLeads = async (spId: string, stage: string, date: string) => {
    try {
      const r = await api.get(`/admin/salespersons/${spId}/performance?stage=${stage}&dateFilter=${date}`, { headers: getAuthHeader() })
      setPerfData((prev: any) => prev ? { ...prev, assignedLeads: r.data.assignedLeads } : r.data)
    } catch {}
  }

  const handleRefresh = () => {
    fetchStats()
    if (tab === 'team') fetchTeam()
    else if (tab === 'orders') fetchOrders()
    else fetchLeads()
  }

  // Derived KPIs
  const totalRevenue = stats?.totalRevenue || 0
  const totalOrders = stats?.totalOrders || 0
  const totalSalespersons = stats?.totalSalespersons || 0
  const avgConversion = stats && stats.totalOrders > 0
    ? Math.round(((stats.paidOrders || 0) / stats.totalOrders) * 100)
    : 0

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* ── Page Header ── */}
        <div className="page-header">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg">
                  <UserCheck className="w-5 h-5 text-white" />
                </div>
                Sales Team
              </h1>
              <p className="text-gray-400 text-sm mt-1">Track performance, manage leads and monitor revenue across your entire sales force</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleRefresh}
                className="p-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl border border-white/10 transition-all">
                <RefreshCw className="w-4 h-4" />
              </button>
              <button onClick={() => setCreateModal(true)} className="btn-primary flex items-center gap-2">
                <UserPlus className="w-4 h-4" /> Create Sales Member
              </button>
            </div>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Revenue */}
          <div className="kpi-violet">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-white/60 font-medium bg-white/10 px-2 py-0.5 rounded-full">Revenue</span>
            </div>
            <p className="text-2xl font-black text-white">
              ₹{totalRevenue >= 100000
                ? `${(totalRevenue / 100000).toFixed(1)}L`
                : totalRevenue >= 1000
                  ? `${(totalRevenue / 1000).toFixed(1)}K`
                  : totalRevenue.toLocaleString()}
            </p>
            <p className="text-white/70 text-xs mt-1">Total Revenue Generated</p>
          </div>

          {/* Total Orders */}
          <div className="kpi-emerald">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-white/60 font-medium bg-white/10 px-2 py-0.5 rounded-full">Orders</span>
            </div>
            <p className="text-2xl font-black text-white">{totalOrders.toLocaleString()}</p>
            <p className="text-white/70 text-xs mt-1">
              {stats?.paidOrders || 0} paid · {stats?.tokenOrders || 0} token
            </p>
          </div>

          {/* Active Salespersons */}
          <div className="kpi-amber">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-white/60 font-medium bg-white/10 px-2 py-0.5 rounded-full">Team</span>
            </div>
            <p className="text-2xl font-black text-white">{totalSalespersons}</p>
            <p className="text-white/70 text-xs mt-1">Active Salespersons</p>
          </div>

          {/* Avg Conversion Rate */}
          <div className="kpi-blue">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-white/60 font-medium bg-white/10 px-2 py-0.5 rounded-full">Rate</span>
            </div>
            <p className="text-2xl font-black text-white">{avgConversion}%</p>
            <p className="text-white/70 text-xs mt-1">Avg Conversion Rate</p>
          </div>
        </div>

        {/* ── Tab Bar ── */}
        <div className="tab-bar">
          {(['team', 'orders', 'leads'] as const).map(t => (
            <button key={t}
              onClick={() => { setTab(t); setPage(1); setSearch('') }}
              className={tab === t ? 'tab-active' : 'tab-inactive'}>
              {t === 'team' ? (
                <><Users className="w-4 h-4" /> Sales Team</>
              ) : t === 'orders' ? (
                <><ShoppingBag className="w-4 h-4" /> Orders</>
              ) : (
                <><ClipboardList className="w-4 h-4" /> Assign Leads</>
              )}
            </button>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="flex gap-3 flex-wrap">
          {(tab === 'team' || tab === 'leads') && (
            <div className="search-bar flex-1 min-w-48">
              <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder={tab === 'team' ? 'Search by name or email...' : 'Search leads...'}
                className="search-input" />
            </div>
          )}
          {tab === 'orders' && (
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
              className="bg-slate-800 text-white rounded-xl px-4 py-2.5 text-sm border border-white/10 outline-none focus:border-violet-500/50 min-w-40">
              <option value="">All Status</option>
              {['pending','token_paid','partial','paid','cancelled'].map(s => (
                <option key={s} value={s} className="capitalize">{s.replace('_',' ')}</option>
              ))}
            </select>
          )}
          {tab === 'leads' && selectedLeads.length > 0 && (
            <button onClick={() => setAssignModal(true)}
              className="btn-primary flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Assign {selectedLeads.length} Lead(s)
            </button>
          )}
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
            <p className="text-gray-500 text-sm">Loading data...</p>
          </div>
        ) : (
          <>
            {/* ──── Team Tab — Performance Cards ──── */}
            {tab === 'team' && (
              <>
                {salespersons.length === 0 ? (
                  <div className="text-center py-20 glass rounded-2xl border border-white/5">
                    <div className="w-16 h-16 rounded-2xl bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-gray-600" />
                    </div>
                    <p className="text-gray-300 font-semibold">No salespersons found</p>
                    <p className="text-gray-600 text-sm mt-1">Create a sales member using the button above</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {salespersons.map((s: any) => {
                      const convRate = s.totalOrders > 0
                        ? Math.round(((s.paidOrders || 0) / s.totalOrders) * 100)
                        : 0
                      const perfScore = getPerformanceScore(s)
                      const gradient = getAvatarGradient(s.name)
                      const initials = getInitials(s.name)

                      return (
                        <div key={s._id} className="card card-hover group">
                          {/* Card Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`avatar-md bg-gradient-to-br ${gradient} text-white font-black text-base shadow-lg`}>
                                {initials}
                              </div>
                              <div>
                                <p className="text-white font-bold text-sm leading-tight">{s.name}</p>
                                <p className="text-gray-500 text-xs mt-0.5">{s.email}</p>
                                {s.phone && (
                                  <p className="text-gray-600 text-xs flex items-center gap-1 mt-0.5">
                                    <Phone className="w-3 h-3" /> {s.phone}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1.5">
                              <span className={`badge ${s.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {s.isActive ? 'Active' : 'Inactive'}
                              </span>
                              {s.affiliateCode && (
                                <span className="font-mono text-xs bg-slate-700 text-gray-400 px-2 py-0.5 rounded-lg">
                                  {s.affiliateCode}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Revenue Big Number */}
                          <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/5 border border-violet-500/15 rounded-xl px-4 py-3 mb-4">
                            <p className="text-xs text-gray-500 mb-0.5">Revenue Generated</p>
                            <p className="text-2xl font-black text-white">
                              ₹{(s.totalEarnings || 0) >= 100000
                                ? `${((s.totalEarnings || 0) / 100000).toFixed(1)}L`
                                : (s.totalEarnings || 0) >= 1000
                                  ? `${((s.totalEarnings || 0) / 1000).toFixed(1)}K`
                                  : (s.totalEarnings || 0).toLocaleString()}
                            </p>
                          </div>

                          {/* Stats Row */}
                          <div className="grid grid-cols-3 gap-2 mb-4">
                            <div className="bg-slate-700/30 rounded-xl px-2 py-2.5 text-center">
                              <p className="text-white font-bold text-lg leading-none">{s.totalOrders || 0}</p>
                              <p className="text-gray-500 text-xs mt-1">Orders</p>
                            </div>
                            <div className="bg-slate-700/30 rounded-xl px-2 py-2.5 text-center">
                              <p className="text-white font-bold text-lg leading-none">{s.totalLeads || 0}</p>
                              <p className="text-gray-500 text-xs mt-1">Leads</p>
                            </div>
                            <div className="bg-slate-700/30 rounded-xl px-2 py-2.5 text-center">
                              <p className="text-green-400 font-bold text-lg leading-none">{s.paidOrders || 0}</p>
                              <p className="text-gray-500 text-xs mt-1">Converted</p>
                            </div>
                          </div>

                          {/* Conversion Rate Progress Bar */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs text-gray-500">Conversion Rate</span>
                              <span className="text-xs font-bold text-white">{convRate}%</span>
                            </div>
                            <div className="perf-bar">
                              <div
                                className="perf-fill bg-gradient-to-r from-violet-500 to-purple-500"
                                style={{ width: `${Math.min(convRate, 100)}%` }} />
                            </div>
                          </div>

                          {/* Performance Score */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <Award className="w-4 h-4 text-amber-400" />
                              <span className="text-xs text-gray-400">Performance Score</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="perf-bar w-20">
                                <div
                                  className={`perf-fill ${perfScore >= 70 ? 'bg-gradient-to-r from-emerald-500 to-green-400' : perfScore >= 40 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : 'bg-gradient-to-r from-red-500 to-rose-400'}`}
                                  style={{ width: `${perfScore}%` }} />
                              </div>
                              <span className={`text-xs font-black ${perfScore >= 70 ? 'text-emerald-400' : perfScore >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                                {perfScore}/100
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => openPerformance(s._id)}
                              className="btn-primary flex-1 flex items-center justify-center gap-1.5 text-xs py-2">
                              <BarChart2 className="w-3.5 h-3.5" /> View Performance
                            </button>
                            <button
                              onClick={() => { setTab('leads'); setPage(1) }}
                              className="btn-secondary flex-1 flex items-center justify-center gap-1.5 text-xs py-2">
                              <UserPlus className="w-3.5 h-3.5" /> Assign Leads
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}

            {/* ──── Orders Tab ──── */}
            {tab === 'orders' && (
              <div className="glass border border-white/5 rounded-2xl overflow-hidden">
                {orders.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-14 h-14 rounded-2xl bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
                      <ShoppingBag className="w-7 h-7 text-gray-600" />
                    </div>
                    <p className="text-gray-300 font-semibold">No orders found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10 bg-slate-700/30">
                          <th className="text-left px-5 py-3.5 text-gray-400 font-semibold text-xs uppercase tracking-wide">Customer</th>
                          <th className="text-left px-5 py-3.5 text-gray-400 font-semibold text-xs uppercase tracking-wide hidden md:table-cell">Package</th>
                          <th className="text-left px-5 py-3.5 text-gray-400 font-semibold text-xs uppercase tracking-wide">Amount</th>
                          <th className="text-left px-5 py-3.5 text-gray-400 font-semibold text-xs uppercase tracking-wide">Status</th>
                          <th className="text-left px-5 py-3.5 text-gray-400 font-semibold text-xs uppercase tracking-wide hidden lg:table-cell">Salesperson</th>
                          <th className="text-left px-5 py-3.5 text-gray-400 font-semibold text-xs uppercase tracking-wide hidden sm:table-cell">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {orders.map((o: any) => (
                          <tr key={o._id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-5 py-4">
                              <p className="text-white font-semibold text-sm">{o.customer?.name}</p>
                              <p className="text-gray-500 text-xs">{o.customer?.phone}</p>
                            </td>
                            <td className="px-5 py-4 hidden md:table-cell">
                              <p className="text-gray-300 text-sm capitalize">{o.packageTier || '—'}</p>
                            </td>
                            <td className="px-5 py-4">
                              <p className="text-white font-bold">₹{(o.totalAmount || 0).toLocaleString()}</p>
                              {o.paymentType === 'emi' && (
                                <p className="text-xs text-purple-400">EMI · Paid ₹{(o.paidAmount || 0).toLocaleString()}</p>
                              )}
                              {o.paymentType === 'token' && (
                                <p className="text-xs text-blue-400">Token ₹{(o.tokenAmount || 0).toLocaleString()} · Paid ₹{(o.paidAmount || 0).toLocaleString()}</p>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              <span className={`badge capitalize ${STATUS_COLOR[o.status] || 'bg-gray-500/20 text-gray-400'}`}>
                                {o.status?.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-5 py-4 hidden lg:table-cell">
                              <p className="text-gray-300 text-sm">{o.salesperson?.name || '—'}</p>
                            </td>
                            <td className="px-5 py-4 hidden sm:table-cell">
                              <p className="text-gray-500 text-xs">{new Date(o.createdAt).toLocaleDateString('en-IN')}</p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ──── Leads Tab — Pipeline View ──── */}
            {tab === 'leads' && (
              <div className="space-y-4">
                {leads.length === 0 ? (
                  <div className="text-center py-20 glass rounded-2xl border border-white/5">
                    <div className="w-14 h-14 rounded-2xl bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
                      <ClipboardList className="w-7 h-7 text-gray-600" />
                    </div>
                    <p className="text-gray-300 font-semibold">No leads found</p>
                  </div>
                ) : (
                  <>
                    {/* Stage Pipeline Summary */}
                    {(() => {
                      const stageCounts: Record<string, number> = {}
                      leads.forEach((l: any) => { stageCounts[l.stage || 'new'] = (stageCounts[l.stage || 'new'] || 0) + 1 })
                      const total = leads.length
                      return (
                        <div className="glass border border-white/5 rounded-2xl p-5">
                          <div className="flex items-center gap-2 mb-4">
                            <Zap className="w-4 h-4 text-amber-400" />
                            <p className="section-title">Lead Pipeline Overview</p>
                            <span className="ml-auto text-xs text-gray-500">{total} total leads</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                            {STAGE_ORDER.map(stage => {
                              const count = stageCounts[stage] || 0
                              const pct = total > 0 ? Math.round((count / total) * 100) : 0
                              return (
                                <div key={stage} className="bg-slate-700/30 rounded-xl p-3 text-center">
                                  <p className="text-xl font-black text-white">{count}</p>
                                  <div className={`w-full h-1 rounded-full my-1.5 ${STAGE_BAR[stage]} opacity-70`} />
                                  <p className="text-xs text-gray-500 capitalize leading-tight">{stage.replace('_',' ')}</p>
                                  <p className="text-xs text-gray-600 mt-0.5">{pct}%</p>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })()}

                    {/* Selection controls */}
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        {selectedLeads.length > 0 ? `${selectedLeads.length} leads selected` : 'Select leads to assign to a salesperson'}
                      </p>
                      {selectedLeads.length > 0 && (
                        <button onClick={() => setSelectedLeads([])} className="text-xs text-gray-400 hover:text-white transition-colors">
                          Clear selection
                        </button>
                      )}
                    </div>

                    {/* Leads Table */}
                    <div className="glass border border-white/5 rounded-2xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/10 bg-slate-700/30">
                              <th className="px-5 py-3.5 w-10">
                                <input type="checkbox"
                                  checked={selectedLeads.length === leads.length && leads.length > 0}
                                  onChange={e => setSelectedLeads(e.target.checked ? leads.map((l: any) => l._id) : [])}
                                  className="rounded accent-violet-500" />
                              </th>
                              <th className="text-left px-5 py-3.5 text-gray-400 font-semibold text-xs uppercase tracking-wide">Lead</th>
                              <th className="text-left px-5 py-3.5 text-gray-400 font-semibold text-xs uppercase tracking-wide hidden md:table-cell">Stage</th>
                              <th className="text-left px-5 py-3.5 text-gray-400 font-semibold text-xs uppercase tracking-wide">Assigned To</th>
                              <th className="text-left px-5 py-3.5 text-gray-400 font-semibold text-xs uppercase tracking-wide hidden sm:table-cell">Source</th>
                              <th className="px-5 py-3.5 text-gray-400 font-semibold text-xs uppercase tracking-wide">Contact</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {leads.map((l: any) => (
                              <tr key={l._id}
                                onClick={() => toggleLead(l._id)}
                                className={`cursor-pointer transition-colors ${selectedLeads.includes(l._id) ? 'bg-violet-500/5 border-l-2 border-violet-500' : 'hover:bg-white/[0.02]'}`}>
                                <td className="px-5 py-4">
                                  <input type="checkbox" checked={selectedLeads.includes(l._id)}
                                    onChange={() => toggleLead(l._id)}
                                    onClick={e => e.stopPropagation()}
                                    className="rounded accent-violet-500" />
                                </td>
                                <td className="px-5 py-4">
                                  <p className="text-white font-semibold text-sm">{l.name}</p>
                                  <p className="text-gray-500 text-xs">{l.phone}</p>
                                </td>
                                <td className="px-5 py-4 hidden md:table-cell">
                                  <span className={`badge capitalize ${STAGE_COLOR[l.stage] || 'bg-gray-500/20 text-gray-400'}`}>
                                    {l.stage?.replace('_', ' ')}
                                  </span>
                                </td>
                                <td className="px-5 py-4">
                                  {l.assignedTo ? (
                                    <span className="text-xs text-green-300 flex items-center gap-1">
                                      <CheckCircle className="w-3.5 h-3.5 text-green-400" /> {l.assignedTo.name || 'Assigned'}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-orange-400 bg-orange-500/10 px-2 py-1 rounded-lg">Unassigned</span>
                                  )}
                                </td>
                                <td className="px-5 py-4 hidden sm:table-cell">
                                  <span className="text-xs text-gray-500 capitalize">{l.source?.replace('_', ' ')}</span>
                                </td>
                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                    <a href={`tel:${l.phone}`}
                                      className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors" title="Call">
                                      <Phone className="w-3.5 h-3.5" />
                                    </a>
                                    <a href={`https://wa.me/${l.phone?.replace(/[^0-9]/g,'').replace(/^0/,'91')}`}
                                      target="_blank" rel="noopener noreferrer"
                                      className="p-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 transition-colors" title="WhatsApp">
                                      <MessageCircle className="w-3.5 h-3.5" />
                                    </a>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: Math.min(totalPages, 8) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${p === page ? 'bg-violet-600 text-white shadow-lg' : 'bg-slate-800 text-gray-400 hover:text-white border border-white/10'}`}>
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════
          Performance Modal
      ════════════════════════════════════════ */}
      {perfModal && (
        <div className="modal-overlay">
          <div className="modal-box max-w-2xl w-full my-4">
            {/* Modal Header */}
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg">
                  <BarChart2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-base">
                    {perfData?.salesperson?.name || 'Salesperson'}
                  </h2>
                  <p className="text-gray-500 text-xs">Sales Performance Dashboard</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {perfData?.salesperson?.phone && (
                  <>
                    <a href={`tel:${perfData.salesperson.phone}`}
                      className="p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors">
                      <Phone className="w-4 h-4" />
                    </a>
                    <a href={`https://wa.me/${perfData.salesperson.phone?.replace(/[^0-9]/g,'').replace(/^0/,'91')}`}
                      target="_blank" rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 transition-colors">
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  </>
                )}
                <button onClick={() => setPerfModal(false)}
                  className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {perfLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
                <p className="text-gray-500 text-sm">Loading performance data...</p>
              </div>
            ) : perfData ? (
              <div className="modal-body space-y-5">
                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-blue-500/10 border border-blue-500/15 rounded-xl p-3.5">
                    <p className="text-xs text-blue-300/70 mb-1">Total Leads</p>
                    <p className="text-2xl font-black text-blue-300">{perfData.totalLeads || 0}</p>
                    <p className="text-xs text-blue-400/60 mt-0.5">assigned</p>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/15 rounded-xl p-3.5">
                    <p className="text-xs text-green-300/70 mb-1">This Month</p>
                    <p className="text-2xl font-black text-green-300">{perfData.monthOrders || 0}</p>
                    <p className="text-xs text-green-400/60 mt-0.5">paid orders</p>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/15 rounded-xl p-3.5">
                    <p className="text-xs text-amber-300/70 mb-1">Total Earned</p>
                    <p className="text-2xl font-black text-amber-300">
                      ₹{((perfData.totalCommissions || 0) / 1000).toFixed(1)}k
                    </p>
                    <p className="text-xs text-amber-400/60 mt-0.5">commissions</p>
                  </div>
                  <div className="bg-violet-500/10 border border-violet-500/15 rounded-xl p-3.5">
                    <p className="text-xs text-violet-300/70 mb-1">This Month</p>
                    <p className="text-2xl font-black text-violet-300">
                      ₹{((perfData.monthCommissions || 0) / 1000).toFixed(1)}k
                    </p>
                    <p className="text-xs text-violet-400/60 mt-0.5">commission</p>
                  </div>
                </div>

                {/* Conversion Rate Bar */}
                {perfData.totalLeads > 0 && (() => {
                  const paidCount = perfData.leadsByStage?.paid || 0
                  const convRate = Math.round((paidCount / perfData.totalLeads) * 100)
                  const perfScore = Math.min(100, Math.round((convRate * 0.6) + (Math.min(100, (perfData.monthOrders || 0) * 10) * 0.4)))
                  return (
                    <div className="bg-slate-800/60 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5 text-violet-400" /> Overall Conversion
                        </span>
                        <span className="text-sm font-black text-white">{convRate}%</span>
                      </div>
                      <div className="perf-bar h-3">
                        <div className="perf-fill bg-gradient-to-r from-violet-500 to-purple-400 h-3"
                          style={{ width: `${Math.min(convRate, 100)}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{paidCount} converted out of {perfData.totalLeads} leads</span>
                        <span className={`font-bold ${perfScore >= 70 ? 'text-emerald-400' : perfScore >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                          Score: {perfScore}/100
                        </span>
                      </div>
                    </div>
                  )
                })()}

                {/* Internal Tabs */}
                <div className="tab-bar">
                  {(['overview', 'leads'] as const).map(t => (
                    <button key={t} onClick={() => setPerfTab(t)}
                      className={perfTab === t ? 'tab-active' : 'tab-inactive'}>
                      {t === 'overview' ? (
                        <><ShoppingBag className="w-3.5 h-3.5" /> Orders</>
                      ) : (
                        <><ClipboardList className="w-3.5 h-3.5" /> Leads Pipeline</>
                      )}
                    </button>
                  ))}
                </div>

                {/* Overview: Pipeline + Recent Orders */}
                {perfTab === 'overview' && (
                  <>
                    {Object.keys(perfData.leadsByStage || {}).length > 0 && (() => {
                      const total = perfData.totalLeads || 1
                      return (
                        <div className="bg-slate-800/60 rounded-xl p-4 space-y-2.5">
                          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">Lead Pipeline Breakdown</p>
                          {STAGE_ORDER.map(s => {
                            const cnt = perfData.leadsByStage?.[s] || 0
                            if (!cnt) return null
                            const pct = Math.max(4, Math.round((cnt / total) * 100))
                            return (
                              <div key={s} className="flex items-center gap-3">
                                <span className="text-xs text-gray-400 w-24 flex-shrink-0 capitalize">{s.replace('_',' ')}</span>
                                <div className="flex-1 perf-bar">
                                  <div className={`perf-fill ${STAGE_BAR[s]}`} style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-xs font-bold text-white w-6 text-right">{cnt}</span>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })()}

                    {perfData.orders?.length > 0 && (
                      <div>
                        <p className="section-title mb-3">Recent Orders</p>
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {perfData.orders.map((o: any) => (
                            <div key={o._id} className="flex items-center justify-between bg-slate-800/60 rounded-xl px-4 py-3">
                              <div>
                                <p className="text-white text-sm font-semibold">{o.customer?.name}</p>
                                <p className="text-gray-500 text-xs capitalize">
                                  {o.packageTier} · {new Date(o.createdAt).toLocaleDateString('en-IN')}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-white font-bold text-sm">₹{(o.totalAmount || 0).toLocaleString()}</p>
                                <span className={`badge capitalize ${STATUS_COLOR[o.status] || 'bg-gray-500/20 text-gray-400'}`}>
                                  {o.status?.replace('_', ' ')}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Leads Pipeline Tab */}
                {perfTab === 'leads' && (
                  <div className="space-y-3">
                    {/* Filters */}
                    <div className="flex gap-2 flex-wrap">
                      <div className="flex gap-1 flex-wrap">
                        {['', 'new','contacted','interested','demo_done','negotiating','token_collected','paid','lost'].map(s => (
                          <button key={s} onClick={() => {
                            setPerfStageFilter(s)
                            refetchPerfLeads(perfSpId, s, perfDateFilter)
                          }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                              perfStageFilter === s
                                ? (s ? `${STAGE_COLOR[s]} border-current` : 'bg-violet-600 text-white border-violet-500')
                                : 'border-white/10 text-gray-500 hover:text-gray-300'
                            }`}>
                            {s ? s.replace('_',' ') : 'All'}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-1 ml-auto">
                        {[{l:'Today',v:'today'},{l:'7d',v:'7d'},{l:'30d',v:'30d'},{l:'All',v:''}].map(df => (
                          <button key={df.v} onClick={() => {
                            setPerfDateFilter(df.v)
                            refetchPerfLeads(perfSpId, perfStageFilter, df.v)
                          }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                              perfDateFilter === df.v ? 'bg-slate-600 text-white border-slate-500' : 'border-white/10 text-gray-500 hover:text-gray-300'
                            }`}>
                            {df.l}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Lead Cards */}
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {(perfData.assignedLeads || []).length === 0 ? (
                        <div className="text-center py-10 text-gray-500 text-sm">No leads found</div>
                      ) : (perfData.assignedLeads || []).map((l: any) => (
                        <div key={l._id} className="flex items-center gap-3 bg-slate-800/60 rounded-xl px-4 py-3">
                          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getAvatarGradient(l.name)} flex items-center justify-center text-xs font-black text-white flex-shrink-0`}>
                            {getInitials(l.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-semibold truncate">{l.name}</p>
                            <p className="text-gray-500 text-xs">{l.phone}{l.city ? ` · ${l.city}` : ''}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`badge capitalize ${STAGE_COLOR[l.stage] || 'bg-gray-500/20 text-gray-400'}`}>
                              {l.stage?.replace('_',' ') || 'new'}
                            </span>
                            <a href={`tel:${l.phone}`}
                              className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors">
                              <Phone className="w-3 h-3" />
                            </a>
                            <a href={`https://wa.me/${l.phone?.replace(/[^0-9]/g,'').replace(/^0/,'91')}`}
                              target="_blank" rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 transition-colors">
                              <MessageCircle className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 text-center">{(perfData.assignedLeads || []).length} leads shown</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          Assign Leads Modal
      ════════════════════════════════════════ */}
      {assignModal && (
        <div className="modal-overlay">
          <div className="modal-box max-w-md w-full">
            <div className="modal-header">
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-violet-400" /> Assign Leads
              </h2>
              <button onClick={() => setAssignModal(false)}
                className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="modal-body space-y-4">
              <div className="bg-violet-500/10 border border-violet-500/15 rounded-xl p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center">
                  <ClipboardList className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{selectedLeads.length} lead(s) selected</p>
                  <p className="text-gray-500 text-xs">Will be assigned to the selected salesperson</p>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-2 block font-semibold uppercase tracking-wide">Assign to Salesperson</label>
                <select value={assignTo} onChange={e => setAssignTo(e.target.value)}
                  className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 text-sm border border-white/10 outline-none focus:border-violet-500/50">
                  <option value="">— Select Salesperson —</option>
                  {salespersons.map(s => (
                    <option key={s._id} value={s._id}>{s.name} · {s.totalOrders || 0} orders</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setAssignModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleAssignLeads} disabled={assigning || !assignTo}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
                {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Assign Leads
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          Create Sales Member Modal
      ════════════════════════════════════════ */}
      {createModal && (
        <div className="modal-overlay">
          <div className="modal-box max-w-md w-full">
            <div className="modal-header">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-violet-400" /> Create Sales Member
              </h3>
              <button onClick={() => setCreateModal(false)}
                className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="modal-body space-y-3">
              {[
                { key: 'name', label: 'Full Name *', placeholder: 'e.g. Rahul Sharma', type: 'text' },
                { key: 'email', label: 'Email *', placeholder: 'rahul@example.com', type: 'email' },
                { key: 'phone', label: 'Phone', placeholder: '+91 98765 43210', type: 'text' },
                { key: 'password', label: 'Password *', placeholder: 'Min 6 characters', type: 'password' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">{f.label}</label>
                  <input
                    type={f.type}
                    value={(createForm as any)[f.key]}
                    onChange={e => setCreateForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500/50 transition-colors" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Department</label>
                <select
                  value={createForm.department}
                  onChange={e => setCreateForm(p => ({ ...p, department: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500/50 transition-colors">
                  <option value="sales">Sales</option>
                  <option value="inside_sales">Inside Sales</option>
                  <option value="field_sales">Field Sales</option>
                </select>
              </div>
              <p className="text-xs text-gray-500 bg-slate-700/30 rounded-xl px-3 py-2">
                A unique referral code will be auto-generated for this sales member.
              </p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setCreateModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleCreate} disabled={creating}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Create Member
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
