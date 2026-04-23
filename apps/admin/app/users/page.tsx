'use client'
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminAPI } from '@/lib/api'
import AdminLayout from '@/components/AdminLayout'
import toast from 'react-hot-toast'
import {
  Search, UserCheck, UserX, Shield, GraduationCap, BookOpen,
  Users, UserCog, TrendingUp, ArrowUpRight, ArrowDownRight,
  ChevronLeft, ChevronRight, Filter, Banknote, X, Loader2, Building2,
  UserPlus, IndianRupee, Eye, EyeOff, Star, Award, Link2, HeartHandshake, Pencil
} from 'lucide-react'
import { format, isThisMonth } from 'date-fns'

function PerfCell({ user, typeTab }: { user: any; typeTab: string }) {
  const p = user._perf || {}
  const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n || 0)

  if (typeTab === 'partners') return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-xs">
        <IndianRupee className="w-3 h-3 text-emerald-400" />
        <span className="text-emerald-400 font-bold">₹{fmt(user.totalEarnings)}</span>
        <span className="text-gray-500">earned</span>
      </div>
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span><Link2 className="w-3 h-3 inline mr-1 text-cyan-500" />{p.referralCount || 0} referrals</span>
        <span><BookOpen className="w-3 h-3 inline mr-1 text-violet-400" />{p.enrollCount || 0} enrolls</span>
      </div>
    </div>
  )

  if (typeTab === 'learners') return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-xs">
        <BookOpen className="w-3 h-3 text-blue-400" />
        <span className="text-white font-semibold">{p.enrollCount || 0}</span>
        <span className="text-gray-500">enrolled</span>
        <span className="text-emerald-400 font-semibold">{p.completedCount || 0}</span>
        <span className="text-gray-500">done</span>
      </div>
      {(p.enrollCount || 0) > 0 && (
        <div className="flex items-center gap-2">
          <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${p.avgProgress || 0}%` }} />
          </div>
          <span className="text-xs text-gray-400">{p.avgProgress || 0}%</span>
        </div>
      )}
    </div>
  )

  if (typeTab === 'mentors') return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-xs">
        <BookOpen className="w-3 h-3 text-amber-400" />
        <span className="text-white font-semibold">{p.courseCount || 0}</span>
        <span className="text-gray-500">courses</span>
        <Users className="w-3 h-3 text-violet-400" />
        <span className="text-white font-semibold">{p.totalStudents || 0}</span>
        <span className="text-gray-500">students</span>
      </div>
      {(p.avgRating > 0) && (
        <div className="flex items-center gap-1 text-xs">
          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
          <span className="text-yellow-400 font-semibold">{p.avgRating}</span>
        </div>
      )}
    </div>
  )

  if (typeTab === 'managers') return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-xs">
        <HeartHandshake className="w-3 h-3 text-orange-400" />
        <span className="text-white font-semibold">{p.partnerCount || 0}</span>
        <span className="text-gray-500">partners</span>
      </div>
      <div className="flex items-center gap-1 text-xs">
        <IndianRupee className="w-3 h-3 text-emerald-400" />
        <span className="text-emerald-400 font-semibold">₹{fmt(p.teamEarnings)}</span>
        <span className="text-gray-500">team earnings</span>
      </div>
    </div>
  )

  // Default (all / employees / sales)
  const score = (() => {
    const roleWeight: Record<string, number> = { superadmin: 95, admin: 88, manager: 78, mentor: 70, student: 55 }
    const base = roleWeight[user.role] ?? 40
    const days = user.createdAt ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86400000) : 0
    const recency = Math.max(0, 30 - Math.floor(days / 10))
    const tierBonus: Record<string, number> = { supreme: 10, elite: 7, pro: 4, starter: 0 }
    return Math.min(100, base + recency + (tierBonus[user.packageTier] ?? 0) + (user.isActive ? 5 : -20))
  })()
  const col = score >= 80 ? 'bg-emerald-400' : score >= 60 ? 'bg-violet-400' : score >= 40 ? 'bg-amber-400' : 'bg-rose-400'
  const tcol = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-violet-400' : score >= 40 ? 'text-amber-400' : 'text-rose-400'
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${col}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-semibold ${tcol}`}>{score}</span>
    </div>
  )
}

const ROLES = ['superadmin', 'admin', 'manager', 'mentor', 'student', 'salesperson']

const TYPE_TABS = [
  { key: 'all',       label: 'All Users',        icon: Users,        color: 'text-violet-400', bg: 'bg-violet-500/15 border-violet-500/30', roleFilter: undefined,    affiliateFilter: undefined },
  { key: 'learners',  label: 'Learners',          icon: GraduationCap,color: 'text-blue-400',   bg: 'bg-blue-500/15 border-blue-500/30',    roleFilter: 'student',     affiliateFilter: undefined },
  { key: 'partners',  label: 'Partners',          icon: UserCheck,    color: 'text-emerald-400',bg: 'bg-emerald-500/15 border-emerald-500/30',roleFilter: undefined,   affiliateFilter: 'true' },
  { key: 'managers',  label: 'Partner Managers',  icon: UserCog,      color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/30', roleFilter: 'manager',     affiliateFilter: undefined },
  { key: 'mentors',   label: 'Mentors',           icon: BookOpen,     color: 'text-amber-400',  bg: 'bg-amber-500/15 border-amber-500/30',   roleFilter: 'mentor',      affiliateFilter: undefined },
  { key: 'employees', label: 'Employees',         icon: Shield,       color: 'text-rose-400',   bg: 'bg-rose-500/15 border-rose-500/30',     roleFilter: 'admin',       affiliateFilter: undefined },
  { key: 'sales',     label: 'Sales Team',        icon: TrendingUp,   color: 'text-cyan-400',   bg: 'bg-cyan-500/15 border-cyan-500/30',     roleFilter: 'salesperson', affiliateFilter: undefined },
]

const roleColor = (r: string) => {
  const map: Record<string, string> = {
    superadmin: 'text-rose-400 bg-rose-500/20 border border-rose-500/30',
    admin:      'text-red-400 bg-red-500/20 border border-red-500/30',
    manager:    'text-orange-400 bg-orange-500/20 border border-orange-500/30',
    mentor:     'text-blue-400 bg-blue-500/20 border border-blue-500/30',
    student:    'text-green-400 bg-green-500/20 border border-green-500/30',
  }
  return map[r] || 'text-gray-400 bg-gray-500/20 border border-gray-500/30'
}

const tierColor = (t: string) => {
  const map: Record<string, string> = {
    basic:   'text-teal-400 bg-teal-500/20 border border-teal-500/30',
    starter: 'text-sky-400 bg-sky-500/20 border border-sky-500/30',
    pro:     'text-violet-400 bg-violet-500/20 border border-violet-500/30',
    proedge: 'text-fuchsia-400 bg-fuchsia-500/20 border border-fuchsia-500/30',
    elite:   'text-amber-400 bg-amber-500/20 border border-amber-500/30',
    supreme: 'text-rose-400 bg-rose-500/20 border border-rose-500/30',
  }
  return map[t] || 'text-gray-400 bg-gray-500/20 border border-gray-500/30'
}

const avatarBg = (name: string) => {
  const colors = [
    'bg-violet-500/30 text-violet-300',
    'bg-blue-500/30 text-blue-300',
    'bg-emerald-500/30 text-emerald-300',
    'bg-amber-500/30 text-amber-300',
    'bg-rose-500/30 text-rose-300',
    'bg-cyan-500/30 text-cyan-300',
    'bg-pink-500/30 text-pink-300',
    'bg-orange-500/30 text-orange-300',
  ]
  const idx = (name?.charCodeAt(0) || 0) % colors.length
  return colors[idx]
}


export default function UsersPage() {
  const [typeTab, setTypeTab]   = useState('all')
  const [role, setRole]         = useState('')
  const [tier, setTier]         = useState('')
  const [search, setSearch]     = useState('')
  const [page, setPage]         = useState(1)
  const [updatingId, setUpdatingId] = useState('')
  const [statusTab, setStatusTab]   = useState<'all' | 'active' | 'suspended'>('all')
  const [ieModal, setIeModal] = useState<any>(null) // user for industrial earning modal
  const [ieForm, setIeForm] = useState({ industrialEarning: '', industrialEarningSource: '', grantPartnerAccess: false, packageTier: 'starter' })
  const [ieSaving, setIeSaving] = useState(false)

  // Edit Profile Modal
  const [editModal, setEditModal] = useState<any>(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', bio: '', password: '', role: '', department: '', employeeId: '', joiningDate: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [showEditPwd, setShowEditPwd] = useState(false)

  // Create User Modal
  const [createModal, setCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', email: '', phone: '', password: '', type: 'free', packageId: '', amountReceived: '', grantPartnerAccess: false })
  const [createSaving, setCreateSaving] = useState(false)
  const [showCreatePwd, setShowCreatePwd] = useState(false)

  const { data: packagesData } = useQuery({ queryKey: ['admin-packages'], queryFn: () => adminAPI.packages().then(r => r.data.packages || r.data) })

  const tierToName = useMemo(() => {
    const map: Record<string, string> = {}
    if (Array.isArray(packagesData)) {
      packagesData.forEach((p: any) => { if (p.tier && p.name) map[p.tier] = p.name })
    }
    return map
  }, [packagesData])

  const tierLabel = (t: string) => tierToName[t] || (t.charAt(0).toUpperCase() + t.slice(1))

  const activeTab = TYPE_TABS.find(t => t.key === typeTab) || TYPE_TABS[0]
  const effectiveRole = activeTab.roleFilter || role || undefined
  const effectiveAffiliate = activeTab.affiliateFilter

  const { data, refetch } = useQuery({
    queryKey: ['admin-users', typeTab, role, tier, search, page],
    queryFn: () =>
      adminAPI
        .users({ role: effectiveRole, packageTier: tier || undefined, search: search || undefined, page, limit: 20, isAffiliate: effectiveAffiliate })
        .then(r => r.data),
    placeholderData: (prev: any) => prev,
  })

  /* KPI derivations from current page data (best-effort) */
  const kpi = useMemo(() => {
    const users: any[] = data?.users ?? []
    const total     = data?.pagination?.total ?? 0
    const active    = users.filter(u => u.isActive).length
    const suspended = users.filter(u => !u.isActive).length
    const newMonth  = users.filter(u => u.createdAt && isThisMonth(new Date(u.createdAt))).length
    return { total, active, suspended, newMonth }
  }, [data])

  const toggleUser = async (id: string, name: string, isActive: boolean) => {
    setUpdatingId(id)
    try {
      await adminAPI.toggleUser(id)
      toast.success(`${name} ${isActive ? 'suspended' : 'activated'}`)
      refetch()
    } catch { toast.error('Action failed') } finally { setUpdatingId('') }
  }

  const changeRole = async (id: string, newRole: string) => {
    try {
      await adminAPI.updateUserRole(id, newRole)
      toast.success('Role updated')
      refetch()
    } catch { toast.error('Failed to update role') }
  }

  const changeTier = async (id: string, newTier: string) => {
    try {
      await adminAPI.updateUserPackage(id, newTier)
      toast.success('Package updated')
      refetch()
    } catch { toast.error('Failed to update package') }
  }

  const openEditModal = (user: any) => {
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      bio: user.bio || '',
      password: '',
      role: user.role || '',
      department: user.department || '',
      employeeId: user.employeeId || '',
      joiningDate: user.joiningDate ? new Date(user.joiningDate).toISOString().split('T')[0] : '',
    })
    setShowEditPwd(false)
    setEditModal(user)
  }

  const saveEdit = async () => {
    if (!editModal) return
    setEditSaving(true)
    try {
      const payload: any = {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        bio: editForm.bio,
        role: editForm.role,
        department: editForm.department,
        employeeId: editForm.employeeId,
        joiningDate: editForm.joiningDate || undefined,
      }
      if (editForm.password) payload.password = editForm.password
      await adminAPI.updateUserProfile(editModal._id, payload)
      toast.success('Profile updated!')
      setEditModal(null)
      refetch()
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to update') } finally { setEditSaving(false) }
  }

  const openIeModal = (user: any) => {
    setIeForm({
      industrialEarning: user.industrialEarning ? String(user.industrialEarning) : '',
      industrialEarningSource: user.industrialEarningSource || '',
      grantPartnerAccess: user.isAffiliate || false,
      packageTier: user.packageTier !== 'free' ? user.packageTier : 'starter',
    })
    setIeModal(user)
  }

  const saveIndustrialEarning = async () => {
    if (!ieModal) return
    if (!ieForm.industrialEarning || Number(ieForm.industrialEarning) < 0) return toast.error('Enter a valid amount')
    setIeSaving(true)
    try {
      await adminAPI.setIndustrialEarning(ieModal._id, {
        industrialEarning: Number(ieForm.industrialEarning),
        industrialEarningSource: ieForm.industrialEarningSource,
        grantPartnerAccess: ieForm.grantPartnerAccess,
        packageTier: ieForm.packageTier,
      })
      toast.success('Industrial earning set!')
      setIeModal(null)
      refetch()
    } catch { toast.error('Failed') } finally { setIeSaving(false) }
  }

  const handleCreateUser = async () => {
    if (!createForm.name || !createForm.email || !createForm.password) return toast.error('Name, email, password required')
    if (createForm.type === 'paid' && (!createForm.packageId || !createForm.amountReceived)) return toast.error('Select package and enter amount')
    setCreateSaving(true)
    try {
      await adminAPI.createUser({
        name: createForm.name,
        email: createForm.email,
        phone: createForm.phone,
        password: createForm.password,
        type: createForm.type,
        packageId: createForm.type === 'paid' ? createForm.packageId : undefined,
        amountReceived: createForm.type === 'paid' ? Number(createForm.amountReceived) : undefined,
        grantPartnerAccess: createForm.grantPartnerAccess,
      })
      toast.success('User created successfully!')
      setCreateModal(false)
      setCreateForm({ name: '', email: '', phone: '', password: '', type: 'free', packageId: '', amountReceived: '', grantPartnerAccess: false })
      refetch()
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to create user') } finally { setCreateSaving(false) }
  }

  const visibleUsers: any[] = useMemo(() => {
    const users = data?.users ?? []
    if (statusTab === 'active')    return users.filter((u: any) => u.isActive)
    if (statusTab === 'suspended') return users.filter((u: any) => !u.isActive)
    return users
  }, [data?.users, statusTab])

  const totalPages = data?.pagination?.pages ?? 1

  return (
    <AdminLayout>
      <div className="space-y-6 fade-in-up">

        {/* ── Page Header ─────────────────────────────────── */}
        <div className="page-header">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <Users className="w-6 h-6 text-violet-400" />
                User Management
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                {kpi.total > 0 ? (
                  <>
                    <span className="text-violet-300 font-semibold">{kpi.total}</span> registered users across all roles and tiers
                  </>
                ) : 'Loading user directory...'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all active:scale-95">
                <UserPlus className="w-4 h-4" />
                Create User
              </button>
              <div className="hidden sm:flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Platform</p>
                  <p className="text-sm font-semibold text-violet-300">TruLearnix</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                  <UserCog className="w-5 h-5 text-violet-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── KPI Analytics Cards ──────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Users */}
          <div className="kpi-violet">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-violet-400" />
              </div>
              <span className="stat-up">
                <ArrowUpRight className="w-3 h-3" />
                All
              </span>
            </div>
            <p className="text-2xl font-bold text-white count-up">{kpi.total}</p>
            <p className="text-xs text-slate-400 mt-0.5">Total Users</p>
          </div>

          {/* Active Users */}
          <div className="kpi-blue">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-blue-400" />
              </div>
              <span className="stat-up">
                <ArrowUpRight className="w-3 h-3" />
                Live
              </span>
            </div>
            <p className="text-2xl font-bold text-white count-up">{kpi.active}</p>
            <p className="text-xs text-slate-400 mt-0.5">Active Users</p>
          </div>

          {/* Suspended Users */}
          <div className="kpi-rose">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 flex items-center justify-center">
                <UserX className="w-4 h-4 text-rose-400" />
              </div>
              {kpi.suspended > 0 ? (
                <span className="stat-down">
                  <ArrowDownRight className="w-3 h-3" />
                  {kpi.suspended}
                </span>
              ) : (
                <span className="stat-flat">—</span>
              )}
            </div>
            <p className="text-2xl font-bold text-white count-up">{kpi.suspended}</p>
            <p className="text-xs text-slate-400 mt-0.5">Suspended</p>
          </div>

          {/* New This Month */}
          <div className="kpi-emerald">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="stat-up">
                <ArrowUpRight className="w-3 h-3" />
                Month
              </span>
            </div>
            <p className="text-2xl font-bold text-white count-up">{kpi.newMonth}</p>
            <p className="text-xs text-slate-400 mt-0.5">New This Month</p>
          </div>
        </div>

        {/* ── Type Tabs ───────────────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          {TYPE_TABS.map(tab => {
            const Icon = tab.icon
            const isActive = typeTab === tab.key
            return (
              <button key={tab.key} onClick={() => { setTypeTab(tab.key); setRole(''); setPage(1) }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${isActive ? `${tab.bg} ${tab.color}` : 'bg-slate-800/60 text-slate-400 border-white/8 hover:text-white hover:bg-slate-700/60'}`}>
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* ── Filter Bar ──────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="search-bar flex-1 min-w-[220px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by name or email..."
              className="search-input"
            />
          </div>

          {/* Role filter */}
          <div className="search-bar gap-2 w-44">
            <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <select
              value={role}
              onChange={e => { setRole(e.target.value); setPage(1) }}
              className="search-input capitalize text-sm cursor-pointer"
            >
              <option value="">All Roles</option>
              {ROLES.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
            </select>
          </div>

          {/* Tier filter */}
          <div className="search-bar gap-2 w-44">
            <Shield className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <select
              value={tier}
              onChange={e => { setTier(e.target.value); setPage(1) }}
              className="search-input capitalize text-sm cursor-pointer"
            >
              <option value="">All Tiers</option>
              {(packagesData || []).map((p: any) => <option key={p.tier} value={p.tier}>{p.name || tierLabel(p.tier)}</option>)}
            </select>
          </div>
        </div>

        {/* ── Status Tab Bar ───────────────────────────────── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="tab-bar">
            <button
              className={statusTab === 'all' ? 'tab-active' : 'tab-inactive'}
              onClick={() => setStatusTab('all')}
            >
              All Users
            </button>
            <button
              className={statusTab === 'active' ? 'tab-active' : 'tab-inactive'}
              onClick={() => setStatusTab('active')}
            >
              <span className="flex items-center gap-1.5">
                <span className="dot-online pulse-dot" />
                Active
              </span>
            </button>
            <button
              className={statusTab === 'suspended' ? 'tab-active' : 'tab-inactive'}
              onClick={() => setStatusTab('suspended')}
            >
              Suspended
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Showing <span className="text-slate-300 font-medium">{visibleUsers.length}</span> of{' '}
            <span className="text-slate-300 font-medium">{kpi.total}</span> users
          </p>
        </div>

        {/* ── User Table ───────────────────────────────────── */}
        <div className="table-container">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-header text-left rounded-tl-2xl">User</th>
                  <th className="table-header text-left">Phone</th>
                  <th className="table-header text-left">Role</th>
                  <th className="table-header text-left">Package</th>
                  <th className="table-header text-left">Partner</th>
                  <th className="table-header text-left">Status</th>
                  <th className="table-header text-left">Performance</th>
                  <th className="table-header text-left">Joined</th>
                  <th className="table-header text-left rounded-tr-2xl">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((user: any, idx: number) => {
                  const isLast = idx === visibleUsers.length - 1
                  return (
                    <tr
                      key={user._id}
                      className={isLast ? 'table-row-last' : 'table-row'}
                    >
                      {/* User cell */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`avatar-md flex-shrink-0 ${avatarBg(user.name)} overflow-hidden`}>
                            {user.avatar
                              ? <img src={user.avatar} className="w-full h-full object-cover rounded-full" alt="" />
                              : <span className="font-bold text-sm">{user.name?.[0]?.toUpperCase() ?? '?'}</span>}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-white leading-tight truncate max-w-[140px]">{user.name}</p>
                            <p className="text-xs text-slate-400 truncate max-w-[140px]">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3.5 text-slate-400 text-xs">{user.phone || '—'}</td>

                      {/* Role */}
                      <td className="px-4 py-3.5">
                        <select
                          value={user.role}
                          onChange={e => changeRole(user._id, e.target.value)}
                          className={`badge ${roleColor(user.role)} capitalize cursor-pointer bg-transparent outline-none text-xs`}
                        >
                          {ROLES.map(r => <option key={r} value={r} className="bg-slate-800 text-white">{r}</option>)}
                        </select>
                      </td>

                      {/* Package tier */}
                      <td className="px-4 py-3.5">
                        <select
                          value={user.packageTier || ''}
                          onChange={e => changeTier(user._id, e.target.value)}
                          className={`badge ${tierColor(user.packageTier)} capitalize cursor-pointer bg-transparent outline-none text-xs`}
                        >
                          <option value="" className="bg-slate-800 text-white">None</option>
                          {(packagesData || []).map((p: any) => <option key={p.tier} value={p.tier} className="bg-slate-800 text-white">{p.name || tierLabel(p.tier)}</option>)}
                        </select>
                      </td>

                      {/* Partner code */}
                      <td className="px-4 py-3.5">
                        {user.affiliateCode
                          ? <span className="badge bg-slate-700/60 text-slate-300 border border-white/10">{user.affiliateCode}</span>
                          : <span className="text-slate-600 text-xs">—</span>}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span className={`badge ${user.isActive
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/15 text-red-400 border border-red-500/30'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${user.isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
                          {user.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>

                      {/* Performance */}
                      <td className="px-4 py-3.5">
                        <PerfCell user={user} typeTab={typeTab} />
                      </td>

                      {/* Joined date */}
                      <td className="px-4 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                        {user.createdAt ? format(new Date(user.createdAt), 'dd MMM yyyy') : '—'}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            disabled={updatingId === user._id}
                            onClick={() => toggleUser(user._id, user.name, user.isActive)}
                            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-200 disabled:opacity-40 active:scale-95 ${
                              user.isActive
                                ? 'bg-red-500/15 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/30'
                                : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/30'
                            }`}
                          >
                            {user.isActive
                              ? <><UserX className="w-3.5 h-3.5" />Suspend</>
                              : <><UserCheck className="w-3.5 h-3.5" />Activate</>}
                          </button>
                          <button
                            onClick={() => openEditModal(user)}
                            title="Edit Profile"
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-xs transition-all border bg-violet-500/10 border-violet-500/30 text-violet-400 hover:bg-violet-500 hover:text-white"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openIeModal(user)}
                            title="Set Industrial Earning"
                            className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs transition-all border ${user.isIndustrialPartner ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-gray-800 border-gray-700 text-gray-500 hover:text-amber-400 hover:border-amber-500/40'}`}
                          >
                            <Building2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Empty state */}
            {!visibleUsers.length && (
              <div className="empty-state">
                <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-white/10 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-slate-500" />
                </div>
                <p className="text-slate-400 font-medium">No users found</p>
                <p className="text-slate-600 text-sm mt-1">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Pagination ───────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Page <span className="text-slate-300">{page}</span> of <span className="text-slate-300">{totalPages}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary flex items-center gap-1 text-sm disabled:opacity-40 px-3 py-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>

              <div className="flex gap-1">
                {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                  const pg = i + 1
                  return (
                    <button
                      key={pg}
                      onClick={() => setPage(pg)}
                      className={`w-9 h-9 rounded-xl text-sm font-medium transition-all duration-200 ${
                        page === pg
                          ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                          : 'bg-slate-800/60 border border-white/10 text-slate-400 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      {pg}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-secondary flex items-center gap-1 text-sm disabled:opacity-40 px-3 py-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ── Edit Profile Modal ── */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="fixed inset-0" onClick={() => setEditModal(null)} />
          <div className="relative bg-gray-900 border border-violet-500/30 rounded-2xl p-6 w-full max-w-lg z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm ${avatarBg(editModal.name)} overflow-hidden`}>
                  {editModal.avatar
                    ? <img src={editModal.avatar} className="w-full h-full object-cover rounded-full" alt="" />
                    : editModal.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <h2 className="font-bold text-white text-sm">Edit Profile</h2>
                  <p className="text-gray-500 text-xs capitalize">{editModal.role} · {editModal.email}</p>
                </div>
              </div>
              <button onClick={() => setEditModal(null)} className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-gray-400 text-xs font-medium mb-1 block">Full Name</label>
                <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 text-sm" />
              </div>
              <div>
                <label className="text-gray-400 text-xs font-medium mb-1 block">Email</label>
                <input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 text-sm" />
              </div>
              <div>
                <label className="text-gray-400 text-xs font-medium mb-1 block">Phone</label>
                <input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="text-gray-400 text-xs font-medium mb-1 block">Bio / About</label>
                <textarea rows={2} value={editForm.bio} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                  placeholder="Short bio or description..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 text-sm resize-none" />
              </div>
              <div>
                <label className="text-gray-400 text-xs font-medium mb-1 block">Role</label>
                <select value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-violet-500 text-sm appearance-none">
                  {['superadmin','admin','manager','department_head','team_lead','employee','mentor','student','salesperson'].map(r => (
                    <option key={r} value={r} className="capitalize bg-gray-800">{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-xs font-medium mb-1 block">Department</label>
                <input value={editForm.department} onChange={e => setEditForm(f => ({ ...f, department: e.target.value }))}
                  placeholder="e.g. sales, hr, tech"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 text-sm" />
              </div>
              <div>
                <label className="text-gray-400 text-xs font-medium mb-1 block">Employee ID</label>
                <input value={editForm.employeeId} onChange={e => setEditForm(f => ({ ...f, employeeId: e.target.value }))}
                  placeholder="e.g. EMP0042"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 text-sm" />
              </div>
              <div>
                <label className="text-gray-400 text-xs font-medium mb-1 block">Joining Date</label>
                <input type="date" value={editForm.joiningDate} onChange={e => setEditForm(f => ({ ...f, joiningDate: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-violet-500 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="text-gray-400 text-xs font-medium mb-1 block">New Password <span className="text-gray-600">(leave blank to keep current)</span></label>
                <div className="relative">
                  <input type={showEditPwd ? 'text' : 'password'} value={editForm.password}
                    onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Min 6 characters"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 pr-10 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 text-sm" />
                  <button type="button" onClick={() => setShowEditPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                    {showEditPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditModal(null)} className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white text-sm font-medium">Cancel</button>
              <button onClick={saveEdit} disabled={editSaving}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold hover:opacity-90 transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                {editSaving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : <><Pencil className="w-4 h-4" />Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Industrial Earning Modal ── */}
      {ieModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="fixed inset-0" onClick={() => setIeModal(null)} />
          <div className="relative bg-gray-900 border border-amber-500/30 rounded-2xl p-6 w-full max-w-md z-10">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-sm">Industrial Earning</h2>
                  <p className="text-gray-500 text-xs">{ieModal.name}</p>
                </div>
              </div>
              <button onClick={() => setIeModal(null)} className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-3 mb-4 text-xs text-amber-300">
              This earning is <strong>display-only</strong>. It shows on dashboard and leaderboard as a badge, but is <strong>NOT withdrawable</strong>. Wallet stays ₹0 until they make real sales.
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-gray-400 text-xs font-medium mb-1 block">Industrial Earning Amount (₹) *</label>
                <input
                  type="number"
                  value={ieForm.industrialEarning}
                  onChange={e => setIeForm(f => ({ ...f, industrialEarning: e.target.value }))}
                  placeholder="e.g. 50000"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 text-sm"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs font-medium mb-1 block">Previous Platform / Source (optional)</label>
                <input
                  value={ieForm.industrialEarningSource}
                  onChange={e => setIeForm(f => ({ ...f, industrialEarningSource: e.target.value }))}
                  placeholder="e.g. Vedantu, Unacademy, BYJU's"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 text-sm"
                />
              </div>

              {/* Grant partner access */}
              <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl border border-gray-700">
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">Grant Partner Panel Access</p>
                  <p className="text-gray-500 text-xs">Enable learner + partner panel both</p>
                </div>
                <button
                  onClick={() => setIeForm(f => ({ ...f, grantPartnerAccess: !f.grantPartnerAccess }))}
                  className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${ieForm.grantPartnerAccess ? 'bg-amber-500' : 'bg-gray-700'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${ieForm.grantPartnerAccess ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </div>

              {ieForm.grantPartnerAccess && (
                <div>
                  <label className="text-gray-400 text-xs font-medium mb-1 block">Assign Package Tier</label>
                  <select
                    value={ieForm.packageTier}
                    onChange={e => setIeForm(f => ({ ...f, packageTier: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 text-sm appearance-none"
                  >
                    {(packagesData || []).map((p: any) => <option key={p.tier} value={p.tier}>{p.name || tierLabel(p.tier)}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setIeModal(null)} className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white text-sm font-medium">Cancel</button>
              <button onClick={saveIndustrialEarning} disabled={ieSaving}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold hover:opacity-90 transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                {ieSaving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : <><Banknote className="w-4 h-4" />Set Earning</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create User Modal ── */}
      {createModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="fixed inset-0" onClick={() => setCreateModal(false)} />
          <div className="relative bg-gray-900 border border-violet-500/30 rounded-2xl p-6 w-full max-w-md z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-sm">Create New User</h2>
                  <p className="text-gray-500 text-xs">Role: Student (Learner + Partner access)</p>
                </div>
              </div>
              <button onClick={() => setCreateModal(false)} className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Free / Paid Toggle */}
            <div className="flex rounded-xl overflow-hidden border border-gray-700 mb-5">
              <button
                onClick={() => setCreateForm(f => ({ ...f, type: 'free', packageId: '', amountReceived: '' }))}
                className={`flex-1 py-2.5 text-sm font-semibold transition-all ${createForm.type === 'free' ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                Free User
              </button>
              <button
                onClick={() => setCreateForm(f => ({ ...f, type: 'paid' }))}
                className={`flex-1 py-2.5 text-sm font-semibold transition-all ${createForm.type === 'paid' ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                Paid User
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-gray-400 text-xs font-medium mb-1 block">Full Name *</label>
                <input value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 text-sm" />
              </div>
              <div>
                <label className="text-gray-400 text-xs font-medium mb-1 block">Email *</label>
                <input type="email" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="rahul@example.com"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 text-sm" />
              </div>
              <div>
                <label className="text-gray-400 text-xs font-medium mb-1 block">Phone</label>
                <input value={createForm.phone} onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="98XXXXXXXX"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 text-sm" />
              </div>
              <div>
                <label className="text-gray-400 text-xs font-medium mb-1 block">Password *</label>
                <div className="relative">
                  <input type={showCreatePwd ? 'text' : 'password'} value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Min 6 characters"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 pr-10 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 text-sm" />
                  <button type="button" onClick={() => setShowCreatePwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                    {showCreatePwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Paid fields */}
              {createForm.type === 'paid' && (
                <>
                  <div>
                    <label className="text-gray-400 text-xs font-medium mb-1 block">Select Package *</label>
                    <select value={createForm.packageId} onChange={e => setCreateForm(f => ({ ...f, packageId: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-violet-500 text-sm appearance-none">
                      <option value="">-- Select Package --</option>
                      {(packagesData || []).map((pkg: any) => (
                        <option key={pkg._id} value={pkg._id} className="bg-gray-800">
                          {pkg.name} — ₹{pkg.price?.toLocaleString()} ({pkg.tier})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs font-medium mb-1 block">Amount Received (₹) *</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="number" value={createForm.amountReceived} onChange={e => setCreateForm(f => ({ ...f, amountReceived: e.target.value }))}
                        placeholder="Actual amount collected"
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 text-sm" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">This will be saved in Finance & Dashboard</p>
                  </div>
                </>
              )}

              {/* Partner Access Toggle */}
              <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl border border-gray-700">
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">Grant Partner Panel Access</p>
                  <p className="text-gray-500 text-xs">User can access both Learner + Partner panel</p>
                </div>
                <button
                  onClick={() => setCreateForm(f => ({ ...f, grantPartnerAccess: !f.grantPartnerAccess }))}
                  className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${createForm.grantPartnerAccess ? 'bg-violet-500' : 'bg-gray-700'}`}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${createForm.grantPartnerAccess ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setCreateModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white text-sm font-medium">Cancel</button>
              <button onClick={handleCreateUser} disabled={createSaving}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold hover:opacity-90 transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                {createSaving ? <><Loader2 className="w-4 h-4 animate-spin" />Creating...</> : <><UserPlus className="w-4 h-4" />Create User</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
