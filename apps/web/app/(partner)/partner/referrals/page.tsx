'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { partnerAPI } from '@/lib/api'
import {
  UserCheck, Search, ChevronLeft, ChevronRight, Package, Calendar,
  Coins, Users, CreditCard, BookOpen, TrendingUp, Crown,
  Zap, Shield, Rocket, Star, Filter, X, ArrowUpRight,
  ShoppingBag, Clock, CheckCircle2, AlertCircle
} from 'lucide-react'

const TIER_CFG: Record<string, { gradient: string; badge: string; label: string; icon: React.ElementType }> = {
  free:    { gradient: 'from-gray-500 to-gray-600',     badge: 'bg-gray-500/15 text-gray-400 border-gray-500/25',    label: 'Free',    icon: Users },
  starter: { gradient: 'from-sky-500 to-blue-600',      badge: 'bg-sky-500/15 text-sky-400 border-sky-500/25',       label: 'Starter', icon: Zap },
  pro:     { gradient: 'from-violet-500 to-purple-600', badge: 'bg-violet-500/15 text-violet-400 border-violet-500/25', label: 'Pro',   icon: Rocket },
  elite:   { gradient: 'from-amber-500 to-orange-500',  badge: 'bg-amber-500/15 text-amber-400 border-amber-500/25', label: 'Elite',   icon: Crown },
  supreme: { gradient: 'from-rose-500 to-pink-600',     badge: 'bg-rose-500/15 text-rose-400 border-rose-500/25',    label: 'Supreme', icon: Shield },
}

const LEVELS = [
  { key: 1, label: 'Level 1', desc: 'Direct referrals', color: 'violet' },
  { key: 2, label: 'Level 2', desc: 'Their referrals', color: 'blue' },
  { key: 3, label: 'Level 3', desc: 'Deep network', color: 'emerald' },
] as const

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'paid', label: 'Paid' },
  { key: 'free', label: 'Free' },
  { key: 'partner', label: 'Partners' },
]

function Avatar({ name, tier }: { name: string; tier: string }) {
  const cfg = TIER_CFG[tier] || TIER_CFG.free
  return (
    <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center text-white font-black text-base flex-shrink-0 shadow-lg`}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  )
}

function TierBadge({ tier }: { tier: string }) {
  const cfg = TIER_CFG[tier] || TIER_CFG.free
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md border font-bold capitalize ${cfg.badge}`}>
      <Icon className="w-2.5 h-2.5" />
      {cfg.label}
    </span>
  )
}

export default function ReferralsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [level, setLevel] = useState<1 | 2 | 3>(1)
  const [filter, setFilter] = useState('all')

  const { data, isLoading } = useQuery({
    queryKey: ['partner-referrals', page, level],
    queryFn: () => partnerAPI.referrals({ page, limit: 20, level }).then(r => r.data),
    placeholderData: (prev) => prev,
  })

  const referrals: any[] = data?.referrals || []
  const total: number = data?.total || 0
  const totalPages: number = data?.totalPages || 1
  const stats = data?.stats || {}

  const levelCfg = LEVELS.find(l => l.key === level)!

  const filtered = referrals.filter((r: any) => {
    const matchSearch = !search ||
      r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.phone?.includes(search)
    const matchFilter =
      filter === 'all' ? true :
      filter === 'paid' ? !!r.packagePurchasedAt || r.contribution > 0 :
      filter === 'free' ? !r.packagePurchasedAt && !r.contribution :
      filter === 'partner' ? r.isAffiliate : true
    return matchSearch && matchFilter
  })

  const levelColorMap: Record<string, string> = {
    violet: { active: 'bg-violet-500/15 text-violet-400 border-violet-500/35', dot: 'bg-violet-400' } as any,
    blue:   { active: 'bg-blue-500/15 text-blue-400 border-blue-500/35', dot: 'bg-blue-400' } as any,
    emerald:{ active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/35', dot: 'bg-emerald-400' } as any,
  }
  const lc = levelColorMap[levelCfg.color] as any

  return (
    <div className="space-y-5 pb-12">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 border border-violet-500/30 p-5 sm:p-7">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-violet-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-500/15 rounded-full blur-3xl" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="px-2.5 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center gap-1.5">
              <Users className="w-3 h-3 text-violet-300" />
              <span className="text-violet-300 text-[11px] font-bold uppercase tracking-wider">Your Network</span>
            </div>
          </div>
          <h1 className="text-white text-2xl sm:text-3xl font-black mb-1">Referrals</h1>
          <p className="text-violet-200/60 text-sm mb-5">Track your referred members across all levels</p>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Referred', value: stats.total ?? 0, icon: Users, color: 'text-violet-300', bg: 'bg-white/10' },
              { label: 'Paid Members', value: stats.paid ?? 0, icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/15' },
              { label: 'Free Members', value: stats.free ?? 0, icon: AlertCircle, color: 'text-blue-400', bg: 'bg-blue-500/15' },
              { label: `L${level} Earnings`, value: `₹${(stats.totalEarnings ?? 0).toLocaleString()}`, icon: Coins, color: 'text-amber-400', bg: 'bg-amber-500/15' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className={`${bg} backdrop-blur-sm rounded-2xl p-3.5 border border-white/10`}>
                <Icon className={`w-4 h-4 ${color} mb-2`} />
                <p className={`text-xl font-black ${color}`}>{value}</p>
                <p className="text-white/50 text-[11px] mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Level Switcher ── */}
      <div className="grid grid-cols-3 gap-2">
        {LEVELS.map(lv => {
          const isActive = level === lv.key
          const colors = levelColorMap[lv.color] as any
          return (
            <button key={lv.key} onClick={() => { setLevel(lv.key); setPage(1) }}
              className={`flex flex-col items-center gap-0.5 py-3 px-2 rounded-2xl border text-center transition-all ${isActive ? colors.active : 'bg-dark-800/60 border-white/8 text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>
              <span className={`text-base font-black ${isActive ? '' : 'text-gray-400'}`}>L{lv.key}</span>
              <span className="text-[11px] font-semibold">{lv.label}</span>
              <span className={`text-[10px] ${isActive ? 'opacity-70' : 'text-gray-600'}`}>{lv.desc}</span>
            </button>
          )
        })}
      </div>

      {/* ── Search + Filter ── */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full bg-dark-800 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 text-sm transition-colors" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3.5 py-3 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all flex-shrink-0 ${filter === f.key ? 'bg-violet-500/15 text-violet-400 border-violet-500/30' : 'bg-dark-800 text-gray-400 border-white/8 hover:text-white'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── List ── */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-dark-800/60 rounded-2xl animate-pulse border border-white/5" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-dark-800/40 rounded-2xl border border-white/8">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-gray-600" />
          </div>
          <p className="text-white font-semibold mb-1">
            {search || filter !== 'all' ? 'No matches found' : `No Level ${level} referrals yet`}
          </p>
          <p className="text-gray-500 text-sm">
            {search || filter !== 'all' ? 'Try a different search or filter' : 'Share your referral link to grow your network'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((r: any, idx: number) => {
            const hasPurchase = !!r.packagePurchasedAt || r.contribution > 0 || !!r.coursePurchasedAt
            const tier = r.packageTier || 'free'

            return (
              <div key={r._id}
                className="bg-dark-800/60 rounded-2xl border border-white/8 hover:border-white/15 transition-all overflow-hidden">
                {/* Main row */}
                <div className="flex items-center gap-3 p-4">
                  {/* Rank + Avatar */}
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <span className="text-[10px] text-gray-600 font-bold">#{(page - 1) * 20 + idx + 1}</span>
                    <Avatar name={r.name} tier={tier} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="text-white font-bold text-sm">{r.name}</p>
                      <TierBadge tier={tier} />
                      {r.isAffiliate && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md border bg-violet-500/10 text-violet-400 border-violet-500/20 font-bold">
                          <Star className="w-2.5 h-2.5" /> Partner
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-gray-500 flex-wrap">
                      {r.phone && <span>{r.phone}</span>}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {/* Earnings / Status */}
                  <div className="text-right flex-shrink-0">
                    {r.contribution > 0 ? (
                      <div>
                        <p className="text-green-400 text-sm font-black">+₹{r.contribution.toLocaleString()}</p>
                        <p className="text-gray-600 text-[10px]">earned</p>
                      </div>
                    ) : hasPurchase ? (
                      <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">Purchased</span>
                    ) : (
                      <span className="text-[11px] text-gray-600 bg-white/4 border border-white/8 px-2 py-1 rounded-lg">No purchase</span>
                    )}
                  </div>
                </div>

                {/* Detail strip — only if purchase exists */}
                {hasPurchase && (
                  <div className="px-4 pb-3 flex flex-wrap gap-2">
                    {r.packagePurchasedAt && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/8 border border-amber-500/15">
                        <Package className="w-3 h-3 text-amber-400 flex-shrink-0" />
                        <span className="text-[11px] text-amber-300 font-medium capitalize">{tier} Package</span>
                        <span className="text-[10px] text-gray-600">· {new Date(r.packagePurchasedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      </div>
                    )}
                    {r.coursePurchasedAt && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-500/8 border border-blue-500/15">
                        <BookOpen className="w-3 h-3 text-blue-400 flex-shrink-0" />
                        <span className="text-[11px] text-blue-300 font-medium">{r.coursePurchaseCount} course{r.coursePurchaseCount > 1 ? 's' : ''}</span>
                        <span className="text-[10px] text-gray-600">· ₹{(r.coursePurchaseTotal || 0).toLocaleString()}</span>
                      </div>
                    )}
                    {r.isEmi && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/8 border border-cyan-500/15">
                        <CreditCard className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                        <span className="text-[11px] text-cyan-300 font-medium">EMI {r.emiPaid}/{r.emiTotal}</span>
                        <span className="text-[10px] text-gray-600">· ₹{(r.installmentAmount || 0).toLocaleString()}/mo</span>
                        {/* mini progress */}
                        <div className="flex gap-0.5 ml-1">
                          {[...Array(r.emiTotal || 4)].map((_: any, i: number) => (
                            <div key={i} className={`w-2 h-2 rounded-full ${i < (r.emiPaid || 0) ? 'bg-cyan-400' : 'bg-white/10'}`} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 pt-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-dark-800 border border-white/8 text-gray-400 hover:text-white hover:border-white/20 disabled:opacity-30 transition-all text-sm font-medium">
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>
          <span className="text-gray-500 text-sm">
            <span className="text-white font-bold">{page}</span> / {totalPages}
            <span className="text-gray-600 ml-2">({total} total)</span>
          </span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-dark-800 border border-white/8 text-gray-400 hover:text-white hover:border-white/20 disabled:opacity-30 transition-all text-sm font-medium">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  )
}
