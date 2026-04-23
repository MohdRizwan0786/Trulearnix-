'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminAPI } from '@/lib/api'
import { usePackages, tierStyle, tierName } from '@/lib/usePackages'
import AdminLayout from '@/components/AdminLayout'
import { Search, UserCheck, ExternalLink, Star } from 'lucide-react'
import { format } from 'date-fns'

export default function TruLanceFreelancersPage() {
  const { packages } = usePackages()
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-trulance-freelancers', search],
    queryFn: () => adminAPI.trulanceFreelancers({ search: search || undefined }),
  })

  const freelancers: any[] = data?.data?.data || []
  const total: number = data?.data?.total || 0

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-teal-400" /> TruLance Freelancers
            </h1>
            <p className="text-gray-400 text-sm mt-1">{total} students registered</p>
          </div>
          <a href="https://trulancer.trulearnix.com/freelancers" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-teal-400 border border-teal-500/30 hover:bg-teal-500/10 transition-colors">
            <ExternalLink className="w-4 h-4" /> View Public Page
          </a>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search freelancers..."
            className="w-full bg-slate-800 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500" />
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : freelancers.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <UserCheck className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p>No freelancers found</p>
          </div>
        ) : (
          <div className="bg-slate-800/50 rounded-2xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-white/10">
                <tr className="text-gray-400 text-xs uppercase tracking-wider">
                  <th className="text-left px-6 py-4">Freelancer</th>
                  <th className="text-left px-4 py-4">Skills</th>
                  <th className="text-left px-4 py-4">XP / Level</th>
                  <th className="text-left px-4 py-4">Package</th>
                  <th className="text-left px-4 py-4">Status</th>
                  <th className="text-left px-4 py-4">Joined</th>
                  <th className="text-right px-6 py-4">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {freelancers.map((u: any) => (
                  <tr key={u._id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                          {u.avatar
                            ? <img src={u.avatar} alt={u.name} className="w-9 h-9 rounded-full object-cover" />
                            : <span className="text-teal-400 font-bold text-sm">{u.name?.[0]}</span>
                          }
                        </div>
                        <div>
                          <p className="font-medium text-white">{u.name}</p>
                          <p className="text-gray-500 text-xs">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {u.expertise?.slice(0, 3).map((s: string) => (
                          <span key={s} className="text-xs bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded-full">{s}</span>
                        ))}
                        {(u.expertise?.length || 0) > 3 && (
                          <span className="text-xs text-gray-500">+{u.expertise.length - 3}</span>
                        )}
                        {!u.expertise?.length && <span className="text-gray-600 text-xs">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-yellow-400" />
                        <span className="text-white text-xs font-medium">{(u.xpPoints || 0).toLocaleString()} XP</span>
                        <span className="text-gray-500 text-xs">· Lv{u.level || 1}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${tierStyle(u.packageTier, packages).chip}`}>
                        {tierName(u.packageTier, packages)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.isActive !== false ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                        {u.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-500 text-xs">
                      {u.createdAt ? format(new Date(u.createdAt), 'dd MMM yyyy') : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <a href={`https://trulancer.trulearnix.com/freelancers/${u._id}`} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 text-gray-400 hover:text-teal-400 hover:bg-teal-500/10 rounded-lg transition-colors inline-flex">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
