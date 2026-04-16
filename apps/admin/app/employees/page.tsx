'use client'
import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { adminAPI } from '@/lib/api'
import AdminLayout from '@/components/AdminLayout'
import toast from 'react-hot-toast'
import {
  Users, UserPlus, Search, Shield, Briefcase, Headphones,
  TrendingUp, FileText, DollarSign, Settings, Code2, UserCheck,
  UserX, Trash2, X, Eye, EyeOff, Mail, Phone, Lock, ChevronDown,
  LayoutDashboard, BarChart2, Package, Contact, BookOpen, Video,
  LifeBuoy, Bell, Tag, Layers, PanelTop, Kanban, Target,
  MousePointerClick, FolderOpen, Trophy, Zap, GraduationCap,
  KeyRound, CheckSquare, Square, Wallet, CreditCard, Mic2,
  Megaphone, CalendarDays, UmbrellaOff, Star, ClipboardList,
  ScanLine, Sparkles, UserCog, HeartHandshake,
  BadgePercent, BarChart3, Receipt, Radio
} from 'lucide-react'
import { format } from 'date-fns'

// ── Permission modules ─────────────────────────────────────────────────────────
const PERMISSION_GROUPS = [
  {
    group: 'Core', color: 'text-violet-400', bg: 'bg-violet-500/10',
    items: [
      { key: 'dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
      { key: 'analytics',  label: 'Analytics',  icon: BarChart2 },
      { key: 'reports',    label: 'Reports',    icon: BarChart3 },
      { key: 'security',   label: 'Security',   icon: Shield },
      { key: 'nova',       label: 'Nova AI',    icon: Sparkles },
    ]
  },
  {
    group: 'Users & Team', color: 'text-pink-400', bg: 'bg-pink-500/10',
    items: [
      { key: 'users',      label: 'All Users',  icon: Users },
      { key: 'learners',   label: 'Learners',   icon: GraduationCap },
      { key: 'employees',  label: 'Employees',  icon: UserPlus },
      { key: 'mentors',    label: 'Mentors',    icon: UserCheck },
      { key: 'partners',   label: 'Partners',   icon: HeartHandshake },
      { key: 'sales-team', label: 'Sales Team', icon: UserCog },
      { key: 'kyc',        label: 'KYC Review', icon: ScanLine },
    ]
  },
  {
    group: 'Revenue & Finance', color: 'text-amber-400', bg: 'bg-amber-500/10',
    items: [
      { key: 'packages',        label: 'Packages',        icon: Package },
      { key: 'finance',         label: 'Finance',         icon: DollarSign },
      { key: 'withdrawals',     label: 'Withdrawals',     icon: Wallet },
      { key: 'emi',             label: 'EMI',             icon: CreditCard },
      { key: 'employee-salary', label: 'Employee Salary', icon: Receipt },
      { key: 'mentor-salary',   label: 'Mentor Salary',   icon: BadgePercent },
    ]
  },
  {
    group: 'Sales & Marketing', color: 'text-emerald-400', bg: 'bg-emerald-500/10',
    items: [
      { key: 'marketing',    label: 'Marketing',    icon: Briefcase },
      { key: 'crm',          label: 'CRM',          icon: Contact },
      { key: 'coupons',      label: 'Coupons',      icon: Tag },
      { key: 'funnel',       label: 'Funnel',       icon: TrendingUp },
      { key: 'ads-tracking', label: 'Ads Tracking', icon: MousePointerClick },
    ]
  },
  {
    group: 'Content', color: 'text-blue-400', bg: 'bg-blue-500/10',
    items: [
      { key: 'courses',          label: 'Courses',          icon: BookOpen },
      { key: 'live-classes',     label: 'Live Classes',     icon: Video },
      { key: 'webinars',         label: 'Webinars',         icon: Radio },
      { key: 'recordings',       label: 'Recordings',       icon: Mic2 },
      { key: 'partner-training', label: 'Partner Training', icon: GraduationCap },
      { key: 'blog',             label: 'Blog',             icon: FileText },
      { key: 'materials',        label: 'Materials',        icon: FolderOpen },
      { key: 'content',          label: 'Website CMS',      icon: PanelTop },
      { key: 'popups',           label: 'Popups',           icon: Layers },
    ]
  },
  {
    group: 'Engagement', color: 'text-cyan-400', bg: 'bg-cyan-500/10',
    items: [
      { key: 'support',         label: 'Support',         icon: LifeBuoy },
      { key: 'notifications',   label: 'Notifications',   icon: Bell },
      { key: 'announcements',   label: 'Announcements',   icon: Megaphone },
      { key: 'achievements',    label: 'Achievements',    icon: Trophy },
      { key: 'qualifications',  label: 'Qualifications',  icon: Star },
      { key: 'report-cards',    label: 'Report Cards',    icon: ClipboardList },
    ]
  },
  {
    group: 'HR & Operations', color: 'text-indigo-400', bg: 'bg-indigo-500/10',
    items: [
      { key: 'hr',         label: 'HR',         icon: Settings },
      { key: 'attendance', label: 'Attendance', icon: CalendarDays },
      { key: 'holidays',   label: 'Holidays',   icon: UmbrellaOff },
      { key: 'kanban',     label: 'Kanban',     icon: Kanban },
      { key: 'calendar',   label: 'Calendar',   icon: Target },
      { key: 'reminders',  label: 'Reminders',  icon: Bell },
      { key: 'goals',      label: 'Goals/OKR',  icon: Target },
    ]
  },
  {
    group: 'TruLance', color: 'text-rose-400', bg: 'bg-rose-500/10',
    items: [
      { key: 'trulance', label: 'TruLance', icon: Zap },
    ]
  },
]

const ALL_PERMS = PERMISSION_GROUPS.flatMap(g => g.items.map(i => i.key))

// Default permissions per department
const DEPT_DEFAULTS: Record<string, string[]> = {
  hr:         ['dashboard','users','learners','employees','hr','attendance','holidays','employee-salary','mentor-salary','kyc','reports'],
  sales:      ['dashboard','crm','analytics','packages','marketing','learners','partners','sales-team','funnel','ads-tracking','coupons'],
  marketing:  ['dashboard','marketing','blog','content','analytics','notifications','announcements','popups','ads-tracking','funnel'],
  content:    ['dashboard','blog','courses','materials','content','live-classes','webinars','recordings','partner-training'],
  finance:    ['dashboard','finance','analytics','packages','withdrawals','emi','employee-salary','mentor-salary','reports'],
  operations: ['dashboard','kanban','calendar','reminders','goals','funnel','analytics','hr','attendance','holidays'],
  support:    ['dashboard','support','users','notifications','announcements'],
  tech:       ALL_PERMS,
  general:    ['dashboard'],
}

const DEPARTMENTS = [
  { value: 'hr',         label: 'HR',           icon: Users,       color: 'text-pink-400',   bg: 'bg-pink-500/15',   desc: 'Human Resources' },
  { value: 'sales',      label: 'Sales',         icon: TrendingUp,  color: 'text-emerald-400',bg: 'bg-emerald-500/15',desc: 'Sales & Business Dev' },
  { value: 'marketing',  label: 'Marketing',     icon: Briefcase,   color: 'text-orange-400', bg: 'bg-orange-500/15', desc: 'Marketing & Growth' },
  { value: 'content',    label: 'Content',       icon: FileText,    color: 'text-blue-400',   bg: 'bg-blue-500/15',   desc: 'Content Creation' },
  { value: 'finance',    label: 'Finance',       icon: DollarSign,  color: 'text-amber-400',  bg: 'bg-amber-500/15',  desc: 'Finance & Accounts' },
  { value: 'operations', label: 'Operations',    icon: Settings,    color: 'text-violet-400', bg: 'bg-violet-500/15', desc: 'Operations' },
  { value: 'support',    label: 'Support',       icon: Headphones,  color: 'text-cyan-400',   bg: 'bg-cyan-500/15',   desc: 'Customer Support' },
  { value: 'tech',       label: 'Tech',          icon: Code2,       color: 'text-indigo-400', bg: 'bg-indigo-500/15', desc: 'Technology & Dev' },
  { value: 'general',    label: 'General',       icon: Shield,      color: 'text-gray-400',   bg: 'bg-gray-500/15',   desc: 'General Staff' },
]

const ROLES = [
  { value: 'employee',         label: 'Employee',        color: 'text-gray-400',    bg: 'bg-gray-500/15',    desc: 'Standard staff — module-based access' },
  { value: 'team_lead',        label: 'Team Lead',       color: 'text-blue-400',    bg: 'bg-blue-500/15',    desc: 'Leads a team, extended module access' },
  { value: 'manager',          label: 'Manager',         color: 'text-yellow-400',  bg: 'bg-yellow-500/15',  desc: 'Department manager, reports & ops' },
  { value: 'department_head',  label: 'Department Head', color: 'text-orange-400',  bg: 'bg-orange-500/15',  desc: 'Head of department, full dept access' },
  { value: 'admin',            label: 'Admin',           color: 'text-violet-400',  bg: 'bg-violet-500/15',  desc: 'Full admin access to all modules' },
  { value: 'superadmin',       label: 'Super Admin',     color: 'text-red-400',     bg: 'bg-red-500/15',     desc: 'Unrestricted — highest authority' },
]

function getDept(val: string) { return DEPARTMENTS.find(d => d.value === val) || DEPARTMENTS[8] }
function getRole(val: string) { return ROLES.find(r => r.value === val) || ROLES[0] }

// ─────────────────────────────────────────────────────────────────────────────

export default function EmployeesPage() {
  const qc = useQueryClient()
  const [search, setSearch]         = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [page, setPage]             = useState(1)
  const [showModal, setShowModal]   = useState(false)
  const [showPermsFor, setShowPermsFor] = useState<string | null>(null) // employee id to show permissions modal

  const [form, setForm] = useState({
    name: '', email: '', phone: '', role: 'employee', department: 'general', password: '', joiningDate: ''
  })
  const [permissions, setPermissions] = useState<string[]>(DEPT_DEFAULTS['general'])
  const [showPwd, setShowPwd]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [deletingId, setDeletingId]   = useState('')
  const [togglingId, setTogglingId]   = useState('')
  const [savingPerms, setSavingPerms] = useState(false)
  const [editPerms, setEditPerms]     = useState<string[]>([])

  // Auto-set permissions when department changes
  useEffect(() => {
    if (['superadmin', 'admin'].includes(form.role)) {
      setPermissions(ALL_PERMS)
    } else {
      setPermissions(DEPT_DEFAULTS[form.department] || ['dashboard'])
    }
  }, [form.department, form.role])

  const { data, isLoading } = useQuery({
    queryKey: ['admin-employees', deptFilter, search, page],
    queryFn: () => adminAPI.employees({ department: deptFilter || undefined, search: search || undefined, page, limit: 20 }).then(r => r.data),
    placeholderData: (prev: any) => prev,
  })

  const employees: any[] = data?.employees || []

  const togglePerm = (key: string, arr: string[], setter: (v: string[]) => void) => {
    setter(arr.includes(key) ? arr.filter(k => k !== key) : [...arr, key])
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) return toast.error('Name, email & password required')
    setSaving(true)
    try {
      await adminAPI.createEmployee({ ...form, permissions })
      toast.success('Employee created!')
      setShowModal(false)
      setForm({ name: '', email: '', phone: '', role: 'employee', department: 'general', password: '', joiningDate: '' })
      setPermissions(DEPT_DEFAULTS['general'])
      qc.invalidateQueries({ queryKey: ['admin-employees'] })
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create employee')
    } finally { setSaving(false) }
  }

  const openPermModal = (emp: any) => {
    setShowPermsFor(emp._id)
    setEditPerms(emp.permissions || DEPT_DEFAULTS[emp.department] || ['dashboard'])
  }

  const savePermissions = async () => {
    if (!showPermsFor) return
    setSavingPerms(true)
    try {
      await adminAPI.updateEmployee(showPermsFor, { permissions: editPerms })
      toast.success('Permissions updated!')
      setShowPermsFor(null)
      qc.invalidateQueries({ queryKey: ['admin-employees'] })
    } catch { toast.error('Failed to update permissions') }
    finally { setSavingPerms(false) }
  }

  const toggleActive = async (id: string, current: boolean, name: string) => {
    setTogglingId(id)
    try {
      await adminAPI.updateEmployee(id, { isActive: !current })
      toast.success(`${name} ${!current ? 'activated' : 'deactivated'}`)
      qc.invalidateQueries({ queryKey: ['admin-employees'] })
    } catch { toast.error('Failed') } finally { setTogglingId('') }
  }

  const deleteEmployee = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    setDeletingId(id)
    try {
      await adminAPI.deleteEmployee(id)
      toast.success(`${name} deleted`)
      qc.invalidateQueries({ queryKey: ['admin-employees'] })
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete')
    } finally { setDeletingId('') }
  }

  const isSuperRole = ['superadmin', 'admin'].includes(form.role)
  const selectedEmp = employees.find(e => e._id === showPermsFor)

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* ── Page Header ── */}
        <div className="page-header">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-pink-600 flex items-center justify-center shadow-lg">
                  <Users className="w-5 h-5 text-white" />
                </div>
                Employee Management
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                {data?.total || 0} team members across {DEPARTMENTS.length} departments
              </p>
            </div>
            <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Add Employee
            </button>
          </div>
        </div>

        {/* ── Department filter cards ── */}
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
          {DEPARTMENTS.map(dept => {
            const Icon = dept.icon
            const count = employees.filter(e => e.department === dept.value).length
            const active = deptFilter === dept.value
            return (
              <button key={dept.value} onClick={() => setDeptFilter(active ? '' : dept.value)}
                className={`p-3 rounded-xl border text-center transition-all ${active ? `${dept.bg} border-current ${dept.color}` : 'bg-slate-800 border-white/5 hover:border-white/10'}`}>
                <Icon className={`w-4 h-4 mx-auto mb-1 ${active ? dept.color : 'text-gray-400'}`} />
                <p className="text-white font-bold text-sm">{count}</p>
                <p className={`text-[10px] mt-0.5 ${active ? dept.color : 'text-gray-500'}`}>{dept.label}</p>
              </button>
            )
          })}
        </div>

        {/* Search */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search employees..."
              className="w-full bg-slate-800 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-gray-500 outline-none focus:border-violet-500 transition-colors" />
          </div>
          {deptFilter && (
            <button onClick={() => setDeptFilter('')}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 border border-white/10 text-gray-400 rounded-xl text-sm hover:bg-slate-600 transition-colors">
              <X className="w-3.5 h-3.5" /> Clear filter
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-slate-800/60 border border-white/5 rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-slate-700/30">
                    <th className="text-left px-5 py-4 text-gray-400 font-medium text-xs uppercase tracking-wide">Employee</th>
                    <th className="text-left px-5 py-4 text-gray-400 font-medium text-xs uppercase tracking-wide hidden md:table-cell">Contact</th>
                    <th className="text-left px-5 py-4 text-gray-400 font-medium text-xs uppercase tracking-wide">Dept / Role</th>
                    <th className="text-left px-5 py-4 text-gray-400 font-medium text-xs uppercase tracking-wide">Access</th>
                    <th className="text-left px-5 py-4 text-gray-400 font-medium text-xs uppercase tracking-wide">Status</th>
                    <th className="text-left px-5 py-4 text-gray-400 font-medium text-xs uppercase tracking-wide hidden lg:table-cell">Joined</th>
                    <th className="text-left px-5 py-4 text-gray-400 font-medium text-xs uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {employees.map((emp: any) => {
                    const dept = getDept(emp.department)
                    const role = getRole(emp.role)
                    const DeptIcon = dept.icon
                    const perms: string[] = emp.permissions || []
                    const isFullAccess = ['superadmin','admin'].includes(emp.role)
                    return (
                      <tr key={emp._id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden ring-2 ring-transparent group-hover:ring-violet-500/20 transition-all">
                                {emp.avatar
                                  ? <img src={emp.avatar} className="w-full h-full object-cover" alt="" />
                                  : <span className="text-violet-400 font-bold">{emp.name?.[0]?.toUpperCase()}</span>}
                              </div>
                              <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-800 ${emp.isActive ? 'bg-green-400' : 'bg-gray-500'}`} />
                            </div>
                            <div>
                              <p className="font-semibold text-white leading-tight">{emp.name}</p>
                              {emp.employeeId && <p className="text-xs text-gray-500 mt-0.5 font-mono">{emp.employeeId}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell">
                          <p className="text-gray-300 text-xs flex items-center gap-1"><Mail className="w-3 h-3 text-gray-500" />{emp.email}</p>
                          {emp.phone && <p className="text-gray-500 text-xs flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3 text-gray-600" />{emp.phone}</p>}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${dept.color} ${dept.bg}`}>
                            <DeptIcon className="w-3 h-3" />{dept.label}
                          </span>
                          <span className={`mt-1 inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${role.color} ${role.bg}`}>
                            {role.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {isFullAccess ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-400 bg-rose-500/15">
                              <Shield className="w-3 h-3" /> Full Access
                            </span>
                          ) : (
                            <button onClick={() => openPermModal(emp)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-violet-400 bg-violet-500/15 hover:bg-violet-500/25 transition-colors">
                              <KeyRound className="w-3 h-3" />
                              {perms.length} module{perms.length !== 1 ? 's' : ''}
                            </button>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${emp.isActive ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${emp.isActive ? 'bg-green-400' : 'bg-red-400'}`} />
                            {emp.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-gray-400 text-xs hidden lg:table-cell">
                          {emp.joiningDate ? format(new Date(emp.joiningDate), 'dd MMM yyyy') : emp.createdAt ? format(new Date(emp.createdAt), 'dd MMM yyyy') : '—'}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => toggleActive(emp._id, emp.isActive, emp.name)} disabled={togglingId === emp._id}
                              title={emp.isActive ? 'Deactivate' : 'Activate'}
                              className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${emp.isActive ? 'text-red-400 hover:bg-red-500/10' : 'text-green-400 hover:bg-green-500/10'}`}>
                              {emp.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </button>
                            <button onClick={() => deleteEmployee(emp._id, emp.name)} disabled={deletingId === emp._id}
                              title="Delete" className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {!employees.length && (
                <div className="text-center py-16 text-gray-500">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No employees found</p>
                  <p className="text-sm mt-1">Click "Add Employee" to get started</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {data?.pages > 1 && (
          <div className="flex items-center gap-2 justify-center">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-4 py-2 bg-slate-700 text-gray-400 hover:text-white rounded-xl text-sm disabled:opacity-40 transition-colors">Previous</button>
            {Array.from({ length: Math.min(data.pages, 7) }).map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)}
                className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${page === i + 1 ? 'bg-violet-600 text-white' : 'bg-slate-700 text-gray-400 hover:text-white'}`}>
                {i + 1}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages}
              className="px-4 py-2 bg-slate-700 text-gray-400 hover:text-white rounded-xl text-sm disabled:opacity-40 transition-colors">Next</button>
          </div>
        )}
      </div>

      {/* ── Create Employee Modal ──────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-10 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border-b border-white/10 px-6 py-5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-violet-600/30 rounded-xl flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-white font-bold">Add New Employee</h2>
                  <p className="text-gray-400 text-xs mt-0.5">Set details & access permissions</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="overflow-y-auto">
              <div className="p-6 space-y-5">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-400 text-xs font-medium block mb-1.5">Full Name *</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Rahul Sharma" required
                      className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-violet-500 transition-colors" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs font-medium block mb-1.5">Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                      <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                        placeholder="9876543210" type="tel"
                        className="w-full bg-slate-800 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-violet-500 transition-colors" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1.5">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                    <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="rahul@company.com" type="email" required
                      className="w-full bg-slate-800 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-violet-500 transition-colors" />
                  </div>
                </div>

                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1.5">Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                    <input value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      type={showPwd ? 'text' : 'password'} placeholder="Min 6 characters" required
                      className="w-full bg-slate-800 border border-white/10 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-violet-500 transition-colors" />
                    <button type="button" onClick={() => setShowPwd(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-gray-400 text-xs font-medium block mb-1.5">Department *</label>
                    <div className="relative">
                      <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500 transition-colors appearance-none cursor-pointer">
                        {DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs font-medium block mb-1.5">Role / Access *</label>
                    <div className="relative">
                      <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500 transition-colors appearance-none cursor-pointer">
                        {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs font-medium block mb-1.5">Joining Date</label>
                    <input value={form.joiningDate} onChange={e => setForm(f => ({ ...f, joiningDate: e.target.value }))}
                      type="date"
                      className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500 transition-colors" />
                  </div>
                </div>

                {/* Permissions Section */}
                <div className="border border-white/10 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-700/30 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-violet-400" />
                      <span className="text-white text-sm font-semibold">Module Permissions</span>
                      <span className="text-xs text-gray-400">({permissions.length}/{ALL_PERMS.length} selected)</span>
                    </div>
                    {isSuperRole ? (
                      <span className="text-xs text-rose-400 bg-rose-500/15 px-2 py-1 rounded-lg flex items-center gap-1">
                        <Shield className="w-3 h-3" /> Auto — Full Access
                      </span>
                    ) : (
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setPermissions(ALL_PERMS)}
                          className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">Select All</button>
                        <span className="text-gray-600">·</span>
                        <button type="button" onClick={() => setPermissions(['dashboard'])}
                          className="text-xs text-red-400 hover:text-red-300 transition-colors">Reset</button>
                      </div>
                    )}
                  </div>

                  {isSuperRole ? (
                    <div className="px-4 py-3 text-center text-gray-400 text-xs">
                      Super Admin and Admin roles automatically receive full unrestricted access to all modules.
                    </div>
                  ) : (
                    <div className="p-4 space-y-4 max-h-64 overflow-y-auto">
                      {PERMISSION_GROUPS.map(group => (
                        <div key={group.group}>
                          <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${group.color}`}>{group.group}</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                            {group.items.map(item => {
                              const Icon = item.icon
                              const checked = permissions.includes(item.key)
                              return (
                                <button key={item.key} type="button"
                                  onClick={() => togglePerm(item.key, permissions, setPermissions)}
                                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-all border ${checked ? `${group.bg} ${group.color} border-current/30` : 'bg-slate-800 text-gray-500 border-white/5 hover:border-white/10'}`}>
                                  {checked ? <CheckSquare className="w-3.5 h-3.5 flex-shrink-0" /> : <Square className="w-3.5 h-3.5 flex-shrink-0" />}
                                  <Icon className="w-3 h-3 flex-shrink-0" />
                                  {item.label}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer buttons */}
              <div className="flex gap-3 px-6 pb-6">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-gray-300 rounded-xl text-sm font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-violet-500/25 disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  {saving ? 'Creating...' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Permissions Modal ─────────────────────────────────────────────── */}
      {showPermsFor && selectedEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowPermsFor(null)} />
          <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-10 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-slate-800/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-violet-600/20 rounded-xl flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-white font-bold">Edit Permissions</h2>
                  <p className="text-gray-400 text-xs mt-0.5">{selectedEmp.name} · {getDept(selectedEmp.department).label}</p>
                </div>
              </div>
              <button onClick={() => setShowPermsFor(null)} className="text-gray-400 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              {/* Quick select */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400 text-xs">{editPerms.length}/{ALL_PERMS.length} modules selected</span>
                <div className="flex gap-3">
                  <button onClick={() => setEditPerms(ALL_PERMS)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">Select All</button>
                  <button onClick={() => setEditPerms(['dashboard'])}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors">Reset to Minimum</button>
                  <button onClick={() => setEditPerms(DEPT_DEFAULTS[selectedEmp.department] || ['dashboard'])}
                    className="text-xs text-violet-400 hover:text-violet-300 transition-colors">Dept Default</button>
                </div>
              </div>

              <div className="space-y-4">
                {PERMISSION_GROUPS.map(group => (
                  <div key={group.group}>
                    <div className="flex items-center gap-2 mb-2">
                      <p className={`text-xs font-semibold uppercase tracking-wide ${group.color}`}>{group.group}</p>
                      <div className="flex-1 h-px bg-white/5" />
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {group.items.map(item => {
                        const Icon = item.icon
                        const checked = editPerms.includes(item.key)
                        return (
                          <button key={item.key} type="button"
                            onClick={() => togglePerm(item.key, editPerms, setEditPerms)}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all border text-left ${checked ? `${group.bg} ${group.color} border-current/20` : 'bg-slate-800 text-gray-500 border-white/5 hover:border-white/10 hover:text-gray-400'}`}>
                            {checked
                              ? <CheckSquare className="w-4 h-4 flex-shrink-0" />
                              : <Square className="w-4 h-4 flex-shrink-0" />}
                            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{item.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t border-white/10 flex-shrink-0">
              <button onClick={() => setShowPermsFor(null)}
                className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-gray-300 rounded-xl text-sm font-medium transition-colors">
                Cancel
              </button>
              <button onClick={savePermissions} disabled={savingPerms}
                className="flex-1 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {savingPerms ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Shield className="w-4 h-4" />}
                {savingPerms ? 'Saving...' : 'Save Permissions'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
