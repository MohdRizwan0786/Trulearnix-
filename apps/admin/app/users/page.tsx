'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminAPI } from '@/lib/api'
import { Search, UserCheck, UserX, Shield, GraduationCap, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function UsersPage() {
  const [role, setRole] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, refetch } = useQuery({
    queryKey: ['admin-users', role, search, page],
    queryFn: () => adminAPI.users({ role: role || undefined, search: search || undefined, page, limit: 20 }).then(r => r.data),
    placeholderData: (prev: any) => prev
  })

  const toggleUser = async (id: string, name: string, isActive: boolean) => {
    try {
      await adminAPI.toggleUser(id)
      toast.success(`${name} ${isActive ? 'suspended' : 'activated'}`)
      refetch()
    } catch { toast.error('Action failed') }
  }

  const roleIcon = (r: string) => r === 'admin' ? Shield : r === 'mentor' ? BookOpen : GraduationCap
  const roleColor = (r: string) => r === 'admin' ? 'text-red-400 bg-red-500/20' : r === 'mentor' ? 'text-blue-400 bg-blue-500/20' : 'text-green-400 bg-green-500/20'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Users Management</h1>
        <span className="badge bg-violet-500/20 text-violet-400">{data?.pagination?.total || 0} total</span>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..."
            className="input pl-10" />
        </div>
        <select value={role} onChange={e => setRole(e.target.value)} className="input w-40">
          <option value="">All Roles</option>
          <option value="student">Students</option>
          <option value="mentor">Mentors</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-slate-700/30">
              <th className="text-left px-6 py-4 text-gray-400 font-medium">User</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Role</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Phone</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Joined</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Status</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data?.users?.map((user: any) => {
              const Icon = roleIcon(user.role)
              return (
                <tr key={user._id} className="hover:bg-white/2">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-violet-500/20 rounded-full flex items-center justify-center">
                        {user.avatar ? <img src={user.avatar} className="w-full h-full rounded-full object-cover" alt="" /> :
                          <span className="text-violet-400 font-bold text-xs">{user.name[0]}</span>}
                      </div>
                      <div>
                        <p className="font-medium text-white">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge ${roleColor(user.role)} capitalize flex items-center gap-1 w-fit`}>
                      <Icon className="w-3 h-3" />{user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400">{user.phone || '—'}</td>
                  <td className="px-6 py-4 text-gray-400">{format(new Date(user.createdAt), 'dd MMM yyyy')}</td>
                  <td className="px-6 py-4">
                    <span className={`badge ${user.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {user.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleUser(user._id, user.name, user.isActive)}
                      className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors ${user.isActive ? 'bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white' : 'bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white'}`}>
                      {user.isActive ? <><UserX className="w-3 h-3" />Suspend</> : <><UserCheck className="w-3 h-3" />Activate</>}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data?.pagination?.pages > 1 && (
        <div className="flex gap-2">
          {Array.from({ length: data.pagination.pages }).map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)}
              className={`w-10 h-10 rounded-xl font-medium text-sm transition-colors ${page === i + 1 ? 'bg-violet-600 text-white' : 'bg-slate-700 text-gray-400 hover:text-white'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
