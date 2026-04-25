'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminAPI } from '@/lib/api'
import { usePackages, tierStyle, tierName } from '@/lib/usePackages'
import {
  X, Users, Search, IndianRupee, Crown, ChevronDown,
  Mail, Phone, CalendarDays, TrendingUp, Package, UserPlus
} from 'lucide-react'
import { format } from 'date-fns'

const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n || 0)

interface Props {
  userId: string
  userName: string
  pkgList?: any[]
  onClose: () => void
}

export default function ReferralsModal({ userId, userName, pkgList = [], onClose }: Props) {
  const { packages: hookPackages } = usePackages()
  const packages = pkgList.length ? pkgList : hookPackages
  const getPkgName = (tier: string) => tierName(tier, packages)
  const [search, setSearch] = useState('')
  const [page, setPage]     = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['user-referrals', userId, search, page],
    queryFn: () => adminAPI.userReferrals(userId, { search: search || undefined, page, limit: 30 }).then(r => r.data),
    placeholderData: (prev: any) => prev,
  })

  const referrals: any[] = data?.referrals || []
  const referrer = data?.referrer

  const paid      = referrals.filter(r => r.packageTier && r.packageTier !== 'free')
  const unpaid    = referrals.filter(r => !r.packageTier || r.packageTier === 'free')
  const totalComm = referrals.reduce((s, r) => s + (r.commission?.commAmount || 0), 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-10 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-gradient-to-r from-violet-600/15 to-pink-600/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-600/30 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-white font-bold">{userName} — Referrals</h2>
              <p className="text-gray-400 text-xs mt-0.5">
                {data?.total || 0} total · {paid.length} converted · {unpaid.length} free
                {totalComm > 0 && <span className="text-green-400 font-semibold ml-2">· ₹{fmt(totalComm)} Partnership earning</span>}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats row */}
        {referrer && (
          <div className="px-6 py-3 border-b border-white/5 flex items-center gap-6 flex-wrap bg-slate-800/40 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-violet-400" />
              <span className="text-gray-400 text-xs">Code:</span>
              <span className="text-white text-xs font-mono font-bold">{referrer.affiliateCode || '—'}</span>
            </div>
            <div className="flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-green-400" />
              <span className="text-gray-400 text-xs">Earnings:</span>
              <span className="text-green-400 text-xs font-bold">₹{fmt(referrer.totalEarnings)}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span className="text-gray-400 text-xs">Wallet:</span>
              <span className="text-blue-400 text-xs font-bold">₹{fmt(referrer.wallet)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-400" />
              <span className="text-gray-400 text-xs capitalize">{getPkgName(referrer.packageTier)} tier</span>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="px-6 py-3 border-b border-white/5 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by name, email, phone..."
              className="w-full bg-slate-800 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-violet-500 transition-colors" />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-7 h-7 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : referrals.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <UserPlus className="w-9 h-9 mx-auto mb-2 opacity-30" />
              <p className="text-sm">{search ? 'No results found' : 'No referrals yet'}</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {referrals.map((r: any) => {
                const tier = tierStyle(r.packageTier, packages)
                return (
                  <div key={r._id} className="flex items-center gap-3 px-6 py-3.5 hover:bg-white/[0.02] transition-colors">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-violet-400 font-bold text-sm">{r.name?.[0]?.toUpperCase()}</span>
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white text-sm font-semibold">{r.name}</p>
                        {r.isAffiliate && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-medium">Partner</span>
                        )}
                        {r.downlineCount > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 font-medium">
                            +{r.downlineCount} downline
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1 text-gray-500 text-xs"><Mail className="w-3 h-3" />{r.email}</span>
                        {r.phone && <span className="flex items-center gap-1 text-gray-500 text-xs"><Phone className="w-3 h-3" />{r.phone}</span>}
                      </div>
                    </div>
                    {/* Right side */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${tier.chip}`}>
                        {getPkgName(r.packageTier)}
                      </span>
                      {r.commission?.commAmount > 0 ? (
                        <span className="text-green-400 text-xs font-bold">+₹{fmt(r.commission.commAmount)}</span>
                      ) : (
                        <span className="text-gray-600 text-xs">No Partnership earning</span>
                      )}
                      <span className="text-gray-600 text-[10px] flex items-center gap-1">
                        <CalendarDays className="w-2.5 h-2.5" />
                        {format(new Date(r.createdAt), 'dd MMM yyyy')}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {data?.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-white/5 flex-shrink-0">
            <span className="text-gray-500 text-xs">{data.total} total referrals</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 bg-slate-700 text-gray-400 hover:text-white rounded-lg text-xs disabled:opacity-40 transition-colors">Prev</button>
              <span className="text-gray-400 text-xs">{page} / {data.pages}</span>
              <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages}
                className="px-3 py-1.5 bg-slate-700 text-gray-400 hover:text-white rounded-lg text-xs disabled:opacity-40 transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
