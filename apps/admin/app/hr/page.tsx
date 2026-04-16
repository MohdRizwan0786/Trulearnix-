'use client'
import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { adminAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import { Users, Shield, UserCheck, UserX, Search, ChevronDown, Mail, Phone } from 'lucide-react'

const ROLES = ['student', 'mentor', 'manager', 'admin', 'superadmin']
const ROLE_COLORS: Record<string, string> = {
  student: 'text-gray-400 bg-gray-500/20',
  mentor: 'text-blue-400 bg-blue-500/20',
  manager: 'text-yellow-400 bg-yellow-500/20',
  admin: 'text-orange-400 bg-orange-500/20',
  superadmin: 'text-red-400 bg-red-500/20',
}

export default function HRPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('admin')
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => { fetchUsers() }, [roleFilter])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await adminAPI.users({ role: roleFilter, limit: 100 })
      setUsers(res.data.data || [])
    } catch { toast.error('Failed to load team') }
    finally { setLoading(false) }
  }

  const changeRole = async (userId: string, newRole: string) => {
    setUpdating(userId)
    try {
      await adminAPI.updateUserRole(userId, newRole)
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u))
      toast.success('Role updated')
    } catch { toast.error('Failed to update role') }
    finally { setUpdating(null) }
  }

  const toggleActive = async (userId: string, current: boolean) => {
    setUpdating(userId)
    try {
      await adminAPI.toggleUser(userId)
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isActive: !current } : u))
      toast.success(!current ? 'User activated' : 'User deactivated')
    } catch { toast.error('Failed') }
    finally { setUpdating(null) }
  }

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const summary = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    admins: users.filter(u => ['admin', 'superadmin'].includes(u.role)).length,
    managers: users.filter(u => u.role === 'manager').length,
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* ── Page Header ── */}
        <div className="page-header">
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-pink-600 flex items-center justify-center shadow-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            HR & Team Management
          </h1>
          <p className="text-gray-400 text-sm mt-1">Manage admin roles, permissions and team access</p>
        </div>

        {/* ── KPI Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="kpi-violet">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-black text-white">{summary.total}</p>
            <p className="text-white/70 text-xs mt-1">Team Members</p>
          </div>
          <div className="kpi-emerald">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-3">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-black text-white">{summary.active}</p>
            <p className="text-white/70 text-xs mt-1">Active</p>
          </div>
          <div className="kpi-orange">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-3">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-black text-white">{summary.admins}</p>
            <p className="text-white/70 text-xs mt-1">Admins</p>
          </div>
          <div className="kpi-blue">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-3">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-black text-white">{summary.managers}</p>
            <p className="text-white/70 text-xs mt-1">Managers</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..."
              className="w-full bg-slate-800 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm border border-white/10 outline-none focus:border-violet-500" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['admin', 'superadmin', 'manager', 'mentor', 'student'].map(r => (
              <button key={r} onClick={() => setRoleFilter(r)}
                className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition-colors ${roleFilter === r ? 'bg-violet-600 text-white' : 'bg-slate-800 text-gray-400 hover:bg-slate-700 border border-white/10'}`}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Team table */}
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="bg-slate-800 rounded-2xl border border-white/5 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">Member</th>
                  <th className="text-left text-xs text-gray-400 font-medium px-5 py-3 hidden md:table-cell">Contact</th>
                  <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">Role</th>
                  <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">Status</th>
                  <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(u => (
                  <tr key={u._id} className="hover:bg-white/2 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-violet-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                          {u.avatar ? <img src={u.avatar} className="w-full h-full rounded-full object-cover" alt="" /> :
                            <span className="text-violet-400 font-bold text-xs">{u.name?.[0]?.toUpperCase()}</span>}
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{u.name}</p>
                          <p className="text-gray-500 text-xs">{u.packageTier || 'free'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <div className="space-y-0.5">
                        <p className="text-gray-400 text-xs flex items-center gap-1"><Mail className="w-3 h-3" />{u.email}</p>
                        {u.phone && <p className="text-gray-500 text-xs flex items-center gap-1"><Phone className="w-3 h-3" />{u.phone}</p>}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <select value={u.role} onChange={e => changeRole(u._id, e.target.value)}
                        disabled={updating === u._id}
                        className={`text-xs px-2 py-1 rounded-lg border border-white/10 outline-none bg-slate-700 capitalize cursor-pointer ${ROLE_COLORS[u.role]}`}>
                        {ROLES.map(r => <option key={r} value={r} className="capitalize bg-slate-700">{r}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${u.isActive ? 'text-green-400 bg-green-500/20' : 'text-red-400 bg-red-500/20'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={() => toggleActive(u._id, u.isActive)} disabled={updating === u._id}
                        className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${u.isActive ? 'text-red-400 hover:bg-red-500/10' : 'text-green-400 hover:bg-green-500/10'}`}>
                        {u.isActive ? <><UserX className="w-3.5 h-3.5 inline mr-1" />Deactivate</> : <><UserCheck className="w-3.5 h-3.5 inline mr-1" />Activate</>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="text-center py-12 text-gray-500">No users found</div>}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
