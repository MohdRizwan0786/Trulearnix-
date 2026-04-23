'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminAPI } from '@/lib/api'
import AdminLayout from '@/components/AdminLayout'
import {
  Search, Users, ShoppingBag, UserX, Crown, Star, Zap, Shield, TrendingUp,
  Calendar, Linkedin, Globe, X, CheckCircle, XCircle, Award, BookOpen,
  CalendarDays,
} from 'lucide-react'
import { format } from 'date-fns'

// ─── Tier Config (base) — extended dynamically from API packages ──────────────
const BASE_TIER_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  free:     { label: 'Free',     color: 'text-gray-400',   bg: 'bg-gray-500/20',   border: 'border-gray-500/30',   icon: Users   },
  starter:  { label: 'Starter',  color: 'text-sky-400',    bg: 'bg-sky-500/20',    border: 'border-sky-500/30',    icon: Star    },
  basic:    { label: 'Basic',    color: 'text-teal-400',   bg: 'bg-teal-500/20',   border: 'border-teal-500/30',   icon: Star    },
  pro:      { label: 'Pro',      color: 'text-violet-400', bg: 'bg-violet-500/20', border: 'border-violet-500/30', icon: Zap     },
  proedge:  { label: 'Pro-Edge', color: 'text-pink-400',   bg: 'bg-pink-500/20',   border: 'border-pink-500/30',   icon: Zap     },
  elite:    { label: 'Elite',    color: 'text-amber-400',  bg: 'bg-amber-500/20',  border: 'border-amber-500/30',  icon: Shield  },
  supreme:  { label: 'Supreme',  color: 'text-rose-400',   bg: 'bg-rose-500/20',   border: 'border-rose-500/30',   icon: Crown   },
}

// Build tier config from packages — uses package name as label for unknown tiers
function buildTierConfig(packages: any[]) {
  const config = { ...BASE_TIER_CONFIG }
  const fallbackStyles = [
    { color: 'text-cyan-400',   bg: 'bg-cyan-500/20',   border: 'border-cyan-500/30'   },
    { color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30' },
    { color: 'text-lime-400',   bg: 'bg-lime-500/20',   border: 'border-lime-500/30'   },
    { color: 'text-fuchsia-400',bg: 'bg-fuchsia-500/20',border: 'border-fuchsia-500/30'},
  ]
  let fallbackIdx = 0
  packages.forEach((p: any) => {
    if (p.tier && !config[p.tier]) {
      const style = fallbackStyles[fallbackIdx++ % fallbackStyles.length]
      config[p.tier] = { label: p.name || p.tier, ...style, icon: Star }
    } else if (p.tier && config[p.tier] && p.name) {
      // Override label with actual package name
      config[p.tier] = { ...config[p.tier], label: p.name }
    }
  })
  return config
}

const DEFAULT_TIER = BASE_TIER_CONFIG.free

// ─── Avatar color hash ────────────────────────────────────────────────────────
const AVATAR_PALETTES = [
  { bg: 'bg-violet-500/30', text: 'text-violet-300' },
  { bg: 'bg-sky-500/30',    text: 'text-sky-300'    },
  { bg: 'bg-emerald-500/30',text: 'text-emerald-300'},
  { bg: 'bg-amber-500/30',  text: 'text-amber-300'  },
  { bg: 'bg-rose-500/30',   text: 'text-rose-300'   },
  { bg: 'bg-indigo-500/30', text: 'text-indigo-300' },
  { bg: 'bg-teal-500/30',   text: 'text-teal-300'   },
  { bg: 'bg-orange-500/30', text: 'text-orange-300' },
]
function avatarPalette(name: string) {
  if (!name) return AVATAR_PALETTES[0]
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_PALETTES[hash % AVATAR_PALETTES.length]
}


// ─── Brand completeness helper ────────────────────────────────────────────────
function brandPct(u: any): number {
  const checks = [!!u.avatar, !!u.socialLinks?.linkedin, (u.expertise || []).length > 0, !!u.bio, !!u.phone]
  return Math.round((checks.filter(Boolean).length / 5) * 100)
}

function perfFillColor(pct: number): string {
  if (pct >= 80) return 'linear-gradient(90deg,#22c55e,#4ade80)'
  if (pct >= 50) return 'linear-gradient(90deg,#7c3aed,#a78bfa)'
  return 'linear-gradient(90deg,#f59e0b,#fbbf24)'
}

// ─── BrandDrawer ──────────────────────────────────────────────────────────────
function BrandDrawer({ learnerId, onClose, tierConfig }: { learnerId: string; onClose: () => void; tierConfig: Record<string, any> }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-learner-brand', learnerId],
    queryFn: () => adminAPI.learnerBrand(learnerId).then(r => r.data),
    enabled: !!learnerId,
  })

  const u = data?.user
  const completeness = data?.completeness || {}
  const pct = data?.pct || 0
  const certs = data?.certs || []
  const enrollments = data?.enrollments || []
  const purchases = data?.purchases || []

  const items = [
    { label: 'Profile Photo',      done: completeness.avatar      },
    { label: 'LinkedIn Linked',    done: completeness.linkedin    },
    { label: 'Skills Added',       done: completeness.skills      },
    { label: 'Course Enrolled',    done: completeness.portfolio   },
    { label: 'Certificate Earned', done: completeness.certificate },
  ]

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-end" onClick={onClose}>
      <div className="w-full max-w-lg h-full bg-slate-900 border-l border-white/10 shadow-2xl overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="font-bold text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400" /> Brand Profile
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Profile */}
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-violet-500/20 flex items-center justify-center">
                {u?.avatar
                  ? <img src={u.avatar} className="w-full h-full object-cover" alt="" />
                  : <span className="text-violet-400 font-black text-xl">{u?.name?.[0]?.toUpperCase()}</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-lg">{u?.name}</p>
                <p className="text-gray-400 text-sm">{u?.email}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {u?.packageTier && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${tierConfig[u.packageTier]?.color || 'text-gray-400'} ${tierConfig[u.packageTier]?.bg || 'bg-gray-500/20'}`}>
                      {tierConfig[u.packageTier]?.label || u.packageTier}
                    </span>
                  )}
                  <span className="text-xs text-violet-400 font-semibold">{u?.xpPoints || 0} XP · Lvl {u?.level || 1}</span>
                </div>
              </div>
            </div>

            {/* Package Info */}
            <div className="rounded-2xl p-4 bg-white/5 border border-white/10">
              <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" /> Package Details
              </h3>
              {u?.packageTier && u.packageTier !== 'free' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Current Plan</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${tierConfig[u.packageTier]?.color || 'text-gray-300'} ${tierConfig[u.packageTier]?.bg || 'bg-gray-500/20'}`}>
                      {tierConfig[u.packageTier]?.label || u.packageTier}
                    </span>
                  </div>
                  {u.packagePurchasedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Purchased On</span>
                      <span className="text-xs text-white">{format(new Date(u.packagePurchasedAt), 'dd MMM yyyy')}</span>
                    </div>
                  )}
                  {u.packageExpiresAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Expires On</span>
                      <span className="text-xs text-amber-400">{format(new Date(u.packageExpiresAt), 'dd MMM yyyy')}</span>
                    </div>
                  )}
                  {purchases.length > 0 && (
                    <div className="mt-2 space-y-2">
                      <p className="text-[11px] text-gray-500 uppercase tracking-wide">Purchase History</p>
                      {purchases.map((p: any) => (
                        <div key={p._id} className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/8 border border-emerald-500/15">
                          <div>
                            <p className="text-xs text-white font-medium">{p.package?.name || p.packageTier}</p>
                            <p className="text-[10px] text-gray-500">{p.createdAt ? format(new Date(p.createdAt), 'dd MMM yyyy') : ''}</p>
                          </div>
                          <span className="text-xs text-emerald-400 font-bold">₹{(p.totalAmount || p.amount || 0).toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-xs italic">No package purchased — Free user</p>
              )}
            </div>

            {/* Brand Completeness */}
            <div className="rounded-2xl p-4" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-white text-sm">Brand Completeness</h3>
                <span className={`text-2xl font-black ${pct === 100 ? 'text-green-400' : pct >= 60 ? 'text-violet-400' : 'text-amber-400'}`}>{pct}%</span>
              </div>
              <div className="w-full h-2 rounded-full mb-4 overflow-hidden bg-white/10">
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: pct === 100 ? 'linear-gradient(90deg,#22c55e,#4ade80)' : 'linear-gradient(90deg,#7c3aed,#ec4899)' }} />
              </div>
              <div className="space-y-2">
                {items.map(item => (
                  <div key={item.label} className="flex items-center gap-2.5">
                    {item.done
                      ? <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                      : <XCircle className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    }
                    <span className={`text-sm ${item.done ? 'text-white' : 'text-gray-500'}`}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bio */}
            {u?.bio && (
              <div className="rounded-2xl p-4 bg-white/5 border border-white/10">
                <h3 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-amber-400" /> Bio
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">{u.bio}</p>
              </div>
            )}

            {/* Skills */}
            <div className="rounded-2xl p-4 bg-white/5 border border-white/10">
              <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-violet-400" /> Skills ({(u?.expertise || []).length})
              </h3>
              {(u?.expertise || []).length === 0
                ? <p className="text-gray-600 text-xs italic">No skills added yet</p>
                : <div className="flex flex-wrap gap-2">
                    {(u?.expertise || []).map((s: string) => (
                      <span key={s} className="text-xs px-2.5 py-1 rounded-lg font-medium text-violet-300 bg-violet-500/15 border border-violet-500/25">{s}</span>
                    ))}
                  </div>
              }
            </div>

            {/* LinkedIn */}
            <div className="rounded-2xl p-4 bg-white/5 border border-white/10">
              <h3 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
                <Linkedin className="w-3.5 h-3.5 text-blue-400" /> LinkedIn
              </h3>
              {u?.socialLinks?.linkedin
                ? <a href={u.socialLinks.linkedin} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-400 hover:underline break-all">
                    <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                    {u.socialLinks.linkedin.replace('https://www.', '').replace('https://', '')}
                  </a>
                : <p className="text-gray-600 text-xs italic">Not linked</p>
              }
            </div>

            {/* Certificates */}
            <div className="rounded-2xl p-4 bg-white/5 border border-white/10">
              <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
                <Award className="w-3.5 h-3.5 text-amber-400" /> Certificates ({certs.length})
              </h3>
              {certs.length === 0
                ? <p className="text-gray-600 text-xs italic">No certificates earned</p>
                : <div className="space-y-2">
                    {certs.slice(0, 5).map((c: any) => (
                      <div key={c._id} className="flex items-center gap-2 p-2 rounded-xl bg-amber-500/8 border border-amber-500/15">
                        <Award className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        <span className="text-sm text-gray-300 truncate">{c.course?.title || 'Course'}</span>
                        <span className="text-[10px] text-gray-500 ml-auto flex-shrink-0">
                          {c.issuedAt ? format(new Date(c.issuedAt), 'dd MMM yy') : ''}
                        </span>
                      </div>
                    ))}
                    {certs.length > 5 && <p className="text-xs text-gray-500 text-center">+{certs.length - 5} more</p>}
                  </div>
              }
            </div>

            {/* Enrolled Courses */}
            <div className="rounded-2xl p-4 bg-white/5 border border-white/10">
              <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-green-400" /> Enrolled Courses ({enrollments.length})
              </h3>
              {enrollments.length === 0
                ? <p className="text-gray-600 text-xs italic">No courses enrolled</p>
                : <div className="space-y-2">
                    {enrollments.slice(0, 5).map((e: any) => (
                      <div key={e._id} className="flex items-center gap-2 p-2 rounded-xl bg-green-500/8 border border-green-500/15">
                        <BookOpen className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                        <span className="text-sm text-gray-300 truncate">{e.course?.title || 'Course'}</span>
                        <span className="text-[10px] text-green-400 ml-auto flex-shrink-0">
                          {e.completedAt ? '✓ Done' : `${(e.progress || []).length} lessons`}
                        </span>
                      </div>
                    ))}
                    {enrollments.length > 5 && <p className="text-xs text-gray-500 text-center">+{enrollments.length - 5} more</p>}
                  </div>
              }
            </div>

            {/* Portfolio link */}
            {u?.name && (
              <div className="rounded-2xl p-4 bg-white/5 border border-white/10">
                <h3 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-green-400" /> Portfolio URL
                </h3>
                <a href={`${process.env.NEXT_PUBLIC_WEB_URL || 'https://trulearnix.com'}/portfolio/${u.name.toLowerCase().replace(/\s+/g, '-')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-sm text-green-400 hover:underline break-all">
                  {(process.env.NEXT_PUBLIC_WEB_URL || 'https://trulearnix.com').replace(/^https?:\/\//, '')}/portfolio/{u.name.toLowerCase().replace(/\s+/g, '-')}
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Static tabs (tier tabs built dynamically from API) ──────────────────────
type StaticTab = 'all' | 'purchased' | 'free'
type Tab = StaticTab | string   // string = any tier name from packages

export default function LearnersPage() {
  const [tab, setTab]                       = useState<Tab>('all')
  const [search, setSearch]                 = useState('')
  const [page, setPage]                     = useState(1)
  const [selectedLearner, setSelectedLearner] = useState<string | null>(null)

  // Resolve API params — static tabs vs tier tabs
  const isStaticTab = tab === 'all' || tab === 'purchased' || tab === 'free'
  const apiParams = isStaticTab
    ? { type: tab, search: search || undefined, page, limit: 20 }
    : { type: 'purchased', tier: tab, search: search || undefined, page, limit: 20 }

  const { data, isLoading } = useQuery({
    queryKey: ['admin-learners', tab, search, page],
    queryFn: () => adminAPI.learners(apiParams).then(r => r.data),
    placeholderData: (prev: any) => prev,
  })

  const stats     = data?.stats || { purchasedCount: 0, freeCount: 0, thisMonthCount: 0 }
  const totalAll  = (stats.purchasedCount || 0) + (stats.freeCount || 0)
  const thisMonth = stats.thisMonthCount || 0

  // Dynamic tier tabs from packages returned by API
  const packages: any[] = data?.packages || []
  const TIER_CONFIG = buildTierConfig(packages)
  const tierMap: Record<string, any> = {}
  packages.forEach((p: any) => { if (p.tier && !tierMap[p.tier]) tierMap[p.tier] = p })
  const tierTabs = Object.values(tierMap)

  const handleSearch = (v: string) => { setSearch(v); setPage(1) }
  const handleTab    = (t: Tab)    => { setTab(t); setPage(1) }

  const learners: any[] = data?.learners || []

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="page-header">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Learner Management</h1>
            <p className="text-gray-400 text-sm mt-1">
              Monitor, filter and explore every learner on the platform
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Users className="w-4 h-4 text-violet-400" />
            <span className="text-violet-400 font-semibold">{totalAll}</span> total learners registered
          </div>
        </div>

        {/* ── KPI Cards ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Total */}
          <div className="kpi-violet">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-violet-300/70">Total Learners</p>
              <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <Users className="w-4.5 h-4.5 text-violet-400" />
              </div>
            </div>
            <p className="text-4xl font-black text-white leading-none">{totalAll}</p>
            <p className="text-xs text-violet-300/60 mt-2">All registered accounts</p>
          </div>

          {/* Purchased */}
          <div className="kpi-emerald">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300/70">Purchased</p>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <ShoppingBag className="w-4.5 h-4.5 text-emerald-400" />
              </div>
            </div>
            <p className="text-4xl font-black text-emerald-400 leading-none">{stats.purchasedCount}</p>
            <p className="text-xs text-emerald-300/60 mt-2">
              {totalAll ? Math.round((stats.purchasedCount / totalAll) * 100) : 0}% conversion rate
            </p>
          </div>

          {/* Free */}
          <div className="kpi-amber">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-300/70">Free Users</p>
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <UserX className="w-4.5 h-4.5 text-amber-400" />
              </div>
            </div>
            <p className="text-4xl font-black text-amber-400 leading-none">{stats.freeCount}</p>
            <p className="text-xs text-amber-300/60 mt-2">Potential conversions</p>
          </div>

          {/* This Month */}
          <div className="kpi-blue">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-300/70">This Month</p>
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <CalendarDays className="w-4.5 h-4.5 text-blue-400" />
              </div>
            </div>
            <p className="text-4xl font-black text-blue-400 leading-none">{thisMonth}</p>
            <p className="text-xs text-blue-300/60 mt-2">New joiners this month</p>
          </div>
        </div>

        {/* ── Filters: Tabs + Search ───────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Tier filter tabs */}
          <div className="tab-bar">
            {/* Static tabs */}
            {(['all', 'purchased', 'free'] as const).map(key => (
              <button key={key} onClick={() => handleTab(key)}
                className={tab === key ? 'tab-active' : 'tab-inactive'}>
                {key === 'all' ? 'All Learners' : key === 'purchased' ? 'Purchased' : 'Free'}
              </button>
            ))}
            {/* Dynamic tier tabs from packages */}
            {tierTabs.map((p: any) => {
              const cfg = TIER_CONFIG[p.tier]
              return (
                <button key={p.tier} onClick={() => handleTab(p.tier)}
                  className={tab === p.tier ? 'tab-active' : 'tab-inactive'}>
                  {cfg?.label || p.name || p.tier}
                </button>
              )
            })}
          </div>

          {/* Search */}
          <div className="search-bar flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search name, email or phone..."
              className="search-input"
            />
          </div>

          <span className="text-gray-400 text-sm ml-auto">
            {learners.length} {learners.length === 1 ? 'result' : 'results'}
          </span>
        </div>

        {/* ── Learner Table ────────────────────────────────────────────────── */}
        <div className="table-container">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : learners.length === 0 ? (
            <div className="empty-state">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-20 text-violet-400" />
              <p className="section-title">No learners found</p>
              <p className="text-gray-500 text-sm mt-1">Try adjusting your filters or search query</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="table-header">
                    <th className="text-left px-5 py-4 text-gray-400 font-medium text-xs uppercase tracking-wide">Learner</th>
                    <th className="text-left px-5 py-4 text-gray-400 font-medium text-xs uppercase tracking-wide hidden md:table-cell">Email</th>
                    <th className="text-left px-5 py-4 text-gray-400 font-medium text-xs uppercase tracking-wide">Tier</th>
                    <th className="text-left px-5 py-4 text-gray-400 font-medium text-xs uppercase tracking-wide hidden lg:table-cell">Enrollments</th>
                    <th className="text-left px-5 py-4 text-gray-400 font-medium text-xs uppercase tracking-wide hidden lg:table-cell">Joined</th>
                    <th className="text-left px-5 py-4 text-gray-400 font-medium text-xs uppercase tracking-wide">Profile</th>
                    <th className="text-left px-5 py-4 text-gray-400 font-medium text-xs uppercase tracking-wide">Brand</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {learners.map((u: any) => {
                    const tier    = TIER_CONFIG[u.packageTier] || TIER_CONFIG.free || DEFAULT_TIER
                    const TierIcon = tier.icon
                    const palette = avatarPalette(u.name || '')
                    const pct     = brandPct(u)
                    const enrollCount = (u.enrollments || []).length

                    return (
                      <tr key={u._id} className="table-row cursor-pointer group" onClick={() => setSelectedLearner(u._id)}>

                        {/* Learner – avatar + name */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`avatar-md ${palette.bg} flex-shrink-0 ring-2 ring-transparent group-hover:ring-violet-500/30 transition-all`}>
                              {u.avatar
                                ? <img src={u.avatar} className="w-full h-full object-cover rounded-full" alt="" />
                                : <span className={`font-bold text-sm ${palette.text}`}>{u.name?.[0]?.toUpperCase() || '?'}</span>
                              }
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-white text-sm leading-tight truncate max-w-[140px]">{u.name}</p>
                              {u.affiliateCode && (
                                <p className="text-[10px] text-violet-400 mt-0.5">Ref: {u.affiliateCode}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-5 py-4 hidden md:table-cell">
                          <p className="text-gray-300 text-xs truncate max-w-[180px]">{u.email}</p>
                          {u.phone && <p className="text-gray-500 text-[11px] mt-0.5">{u.phone}</p>}
                        </td>

                        {/* Tier badge */}
                        <td className="px-5 py-4">
                          <span className={`badge inline-flex items-center gap-1.5 ${tier.color} ${tier.bg} border ${tier.border}`}>
                            <TierIcon className="w-3 h-3" />
                            {tier.label}
                          </span>
                          {u.packagePurchasedAt && (
                            <p className="text-gray-500 text-[11px] mt-1.5 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(u.packagePurchasedAt), 'dd MMM yyyy')}
                            </p>
                          )}
                        </td>

                        {/* Enrollment + Performance */}
                        <td className="px-5 py-4 hidden lg:table-cell">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-white font-semibold text-sm">{u._perf?.enrollCount || enrollCount || 0}</span>
                            <span className="text-gray-500 text-xs">enrolled</span>
                            {(u._perf?.completedCount || 0) > 0 && (
                              <span className="text-emerald-400 font-semibold text-xs">· {u._perf.completedCount} done</span>
                            )}
                          </div>
                          {(u._perf?.enrollCount || 0) > 0 && (
                            <div className="flex items-center gap-2 mt-1.5">
                              <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-violet-500 rounded-full" style={{ width: `${u._perf?.avgProgress || 0}%` }} />
                              </div>
                              <span className="text-xs text-gray-400">{u._perf?.avgProgress || 0}% avg</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 mt-1">
                            <TrendingUp className="w-3 h-3 text-violet-400" />
                            <span className="text-xs text-gray-400">{u.xpPoints || 0} XP · Lv {u.level || 1}</span>
                          </div>
                        </td>

                        {/* Joined date */}
                        <td className="px-5 py-4 hidden lg:table-cell">
                          <p className="text-gray-300 text-xs">
                            {u.createdAt ? format(new Date(u.createdAt), 'dd MMM yyyy') : '—'}
                          </p>
                          <span className={`mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${u.isActive ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-green-400' : 'bg-red-400'}`} />
                            {u.isActive ? 'Active' : 'Suspended'}
                          </span>
                        </td>

                        {/* Profile completeness bar */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold" style={{ color: pct >= 80 ? '#4ade80' : pct >= 50 ? '#a78bfa' : '#fbbf24' }}>
                              {pct}%
                            </span>
                          </div>
                          <div className="perf-bar w-20">
                            <div className="perf-fill" style={{ width: `${pct}%`, background: perfFillColor(pct) }} />
                          </div>
                        </td>

                        {/* View Brand button */}
                        <td className="px-5 py-4">
                          <button
                            onClick={e => { e.stopPropagation(); setSelectedLearner(u._id) }}
                            className="btn-secondary text-xs py-1.5 px-3 whitespace-nowrap">
                            View Brand
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Pagination ───────────────────────────────────────────────────── */}
        {data?.pages > 1 && (
          <div className="flex items-center gap-2 justify-center">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary px-4 py-2 text-sm disabled:opacity-40">
              Previous
            </button>
            {Array.from({ length: Math.min(data.pages, 7) }).map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)}
                className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${
                  page === i + 1
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                    : 'bg-slate-800 text-gray-400 hover:text-white border border-white/5'
                }`}>
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(data.pages, p + 1))}
              disabled={page === data.pages}
              className="btn-secondary px-4 py-2 text-sm disabled:opacity-40">
              Next
            </button>
          </div>
        )}

      </div>

      {/* Brand Detail Drawer */}
      {selectedLearner && (
        <BrandDrawer learnerId={selectedLearner} onClose={() => setSelectedLearner(null)} tierConfig={TIER_CONFIG} />
      )}
    </AdminLayout>
  )
}
