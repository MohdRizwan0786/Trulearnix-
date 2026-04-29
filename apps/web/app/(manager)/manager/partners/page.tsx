'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { managerAPI } from '@/lib/api'
import { useAllTiers, usePackages } from '@/lib/tiers'
import { Search, Users, TrendingUp, IndianRupee, Target, ChevronRight, Loader2, UserCheck, Filter, Phone, MessageCircle } from 'lucide-react'
import Link from 'next/link'

const TIER_COLOR: Record<string, string> = {
  free: 'bg-gray-500/20 text-gray-400', starter: 'bg-blue-500/20 text-blue-400',
  pro: 'bg-indigo-500/20 text-indigo-400', elite: 'bg-violet-500/20 text-violet-400',
  supreme: 'bg-yellow-500/20 text-yellow-400',
}
const TIER_ICON: Record<string, string> = { free: '🆓', starter: '⚡', pro: '🚀', elite: '💎', supreme: '👑' }

export default function ManagerPartnersPage() {
  const [search, setSearch] = useState('')
  const [tier, setTier]     = useState('')
  const [page, setPage]     = useState(1)
  const { tiers: allTiers } = useAllTiers()
  const { getName: getPkgName, byTier } = usePackages()

  const { data, isLoading } = useQuery({
    queryKey: ['manager-partners', search, tier, page],
    queryFn:  () => managerAPI.partners({ search, tier, page, limit: 15 }).then(r => r.data),
  })

  const partners: any[] = data?.partners || []
  const totalPages = data?.pages || 1

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" /> My Partners
          </h1>
          <p className="text-gray-400 text-sm mt-1">{data?.total || 0} partners assigned to you</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by name, email, code..."
            className="w-full bg-dark-800 border border-white/8 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/40" />
        </div>
        <select value={tier} onChange={e => { setTier(e.target.value); setPage(1) }}
          className="bg-dark-800 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/40">
          <option value="">All Tiers</option>
          {allTiers.map(t => <option key={t} value={t}>{getPkgName(t)}</option>)}
        </select>
      </div>

      {/* Partners grid */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-emerald-400" /></div>
      ) : partners.length === 0 ? (
        <div className="text-center py-20 bg-dark-800 rounded-2xl border border-white/5">
          <Users className="w-14 h-14 mx-auto mb-4 text-gray-700" />
          <p className="text-gray-300 font-semibold">No partners found</p>
          <p className="text-gray-500 text-sm mt-1">Partners will appear here once assigned by admin</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {partners.map((p: any) => (
            <Link key={p._id} href={`/manager/partners/${p._id}`}
              className="group bg-dark-800 rounded-2xl border border-white/5 hover:border-emerald-500/25 p-5 flex flex-col gap-4 transition-all hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-0.5">

              {/* Partner header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-xl font-bold text-emerald-400 flex-shrink-0 border border-emerald-500/15">
                    {p.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-white font-bold group-hover:text-emerald-300 transition-colors">{p.name}</h3>
                    <p className="text-gray-500 text-xs">{p.affiliateCode}</p>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-xl font-semibold flex items-center gap-1 ${TIER_COLOR[p.packageTier] || TIER_COLOR.free}`}>
                  {TIER_ICON[p.packageTier]} {getPkgName(p.packageTier)}
                </span>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-dark-700 rounded-xl p-2.5">
                  <p className="text-base font-bold text-white">{p.l1Count || 0}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Referrals</p>
                </div>
                <div className="bg-dark-700 rounded-xl p-2.5">
                  <p className="text-base font-bold text-white">₹{((p.totalEarnings || 0) / 1000).toFixed(1)}k</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Earnings</p>
                </div>
                <div className="bg-dark-700 rounded-xl p-2.5">
                  <p className={`text-base font-bold ${p.activeGoals > 0 ? 'text-orange-400' : 'text-gray-600'}`}>
                    {p.activeGoals || 0}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Goals</p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${p.isActive ? 'bg-green-400' : 'bg-gray-600'}`} />
                  <span className="text-xs text-gray-500">{p.isActive ? 'Active' : 'Inactive'}</span>
                </div>
                <div className="flex items-center gap-2">
                  {p.phone && (
                    <>
                      <a href={`tel:${p.phone}`} onClick={e => e.stopPropagation()}
                        className="w-7 h-7 rounded-lg bg-blue-500/10 hover:bg-blue-500/25 flex items-center justify-center transition-colors"
                        title="Call">
                        <Phone className="w-3.5 h-3.5 text-blue-400" />
                      </a>
                      <a href={`https://wa.me/${p.phone?.replace(/[^0-9]/g,'').replace(/^0/,'91')}`}
                        target="_blank" rel="noopener noreferrer"
                        className="w-7 h-7 rounded-lg bg-green-500/10 hover:bg-green-500/25 flex items-center justify-center transition-colors"
                        title="WhatsApp">
                        <MessageCircle className="w-3.5 h-3.5 text-green-400" />
                      </a>
                    </>
                  )}
                  <span className="text-xs text-emerald-400 group-hover:text-emerald-300 flex items-center gap-1 font-medium">
                    Manage <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: Math.min(totalPages, 8) }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${p === page ? 'bg-emerald-600 text-white' : 'bg-dark-800 text-gray-400 hover:text-white border border-white/8'}`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
