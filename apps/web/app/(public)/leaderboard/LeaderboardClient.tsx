'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Crown, Star, IndianRupee, Users, Flame, ArrowLeft, Zap, ArrowRight, Trophy, TrendingUp } from 'lucide-react'

type Tier = 'Elite' | 'Pro' | 'Starter'
type FilterVal = Tier | 'All' | 'Industrial'

const tierConfig = {
  Elite:   { bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24', label: '👑 Elite'   },
  Pro:     { bg: 'rgba(167,139,250,0.12)', color: '#a78bfa', label: '⚡ Pro'     },
  Starter: { bg: 'rgba(96,165,250,0.12)',  color: '#60a5fa', label: '🚀 Starter' },
}

const FILTERS: { label: string; value: FilterVal }[] = [
  { label: 'All',           value: 'All'        },
  { label: '👑 Elite',      value: 'Elite'      },
  { label: '⚡ Pro',        value: 'Pro'        },
  { label: '🚀 Starter',   value: 'Starter'    },
  { label: '🏭 Industrial', value: 'Industrial' },
]

const COLORS = ['#fbbf24','#34d399','#fb923c','#a78bfa','#f472b6','#60a5fa','#e879f9','#38bdf8','#4ade80','#facc15']
function getColor(rank: number) { return COLORS[(rank - 1) % COLORS.length] }

function initials(name: string) {
  const parts = name.trim().split(' ')
  return parts.length >= 2 ? `${parts[0][0]}${parts[parts.length-1][0]}` : parts[0].slice(0,2).toUpperCase()
}

function formatINR(n: number) {
  return `₹${n.toLocaleString('en-IN')}`
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return (
    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ background: 'linear-gradient(135deg,rgba(251,191,36,0.3),rgba(251,191,36,0.1))', border: '1.5px solid rgba(251,191,36,0.5)', boxShadow: '0 0 16px rgba(251,191,36,0.25)' }}>
      <Crown className="w-5 h-5 text-amber-400" />
    </div>
  )
  if (rank === 2) return (
    <div className="w-10 h-10 rounded-full flex items-center justify-center text-gray-300 font-black text-sm flex-shrink-0"
      style={{ background: 'rgba(156,163,175,0.12)', border: '1.5px solid rgba(156,163,175,0.35)' }}>2</div>
  )
  if (rank === 3) return (
    <div className="w-10 h-10 rounded-full flex items-center justify-center text-orange-400 font-black text-sm flex-shrink-0"
      style={{ background: 'rgba(251,146,60,0.12)', border: '1.5px solid rgba(251,146,60,0.35)' }}>3</div>
  )
  return (
    <div className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 font-black text-sm flex-shrink-0"
      style={{ background: 'rgba(255,255,255,0.04)' }}>{rank}</div>
  )
}

export default function LeaderboardClient({ initialData }: { initialData: any[] }) {
  const [filter, setFilter] = useState<FilterVal>('All')
  const [all, setAll] = useState<any[]>(initialData)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchData = () => {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/affiliate/leaderboard`)
        .then(r => r.json())
        .then(d => { if (d.success && d.leaderboard?.length) setAll(d.leaderboard) })
        .catch(() => {})
        .finally(() => setLoading(false))
    }

    if (initialData.length === 0) setLoading(true)
    fetchData()
    const interval = setInterval(fetchData, 2 * 60 * 1000) // every 2 min
    return () => clearInterval(interval)
  }, [])

  const list = filter === 'All' ? all
    : filter === 'Industrial' ? all.filter((a: any) => a.isIndustrialPartner)
    : all.filter((a: any) => a.tier === filter)
  const top3 = all.slice(0, 3)
  const totalPaid = all.reduce((s: number, a: any) => s + (a.totalEarnings ?? a.monthlyEarnings ?? a.earned ?? 0), 0)

  return (
    <>
      <Navbar />
      <main className="min-h-screen" style={{ background: '#04050a', paddingTop: '64px' }}>

        {/* Hero */}
        <section className="relative py-14 px-4 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-[500px] h-[400px] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.07) 0%, transparent 70%)' }} />
            <div className="absolute top-0 right-1/4 w-[400px] h-[400px] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)' }} />
          </div>

          <div className="max-w-5xl mx-auto relative text-center">
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 mb-5 px-4 py-2 rounded-full"
              style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)' }}>
              <Flame className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-400 text-xs font-black uppercase tracking-wide">Live Partner Leaderboard</span>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-3xl sm:text-5xl md:text-6xl font-black text-white leading-tight mb-4">
              Top Earners on{' '}
              <span style={{ background: 'linear-gradient(135deg,#34d399,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                TruLearnix
              </span>
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto mb-8">
              Real students. Real earnings. Updated every month.
            </motion.p>

            {/* Summary stats */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="inline-grid grid-cols-3 gap-px rounded-2xl overflow-hidden mx-auto"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {[
                { icon: IndianRupee, val: formatINR(totalPaid), label: 'Total Paid Out', color: '#34d399' },
                { icon: Users,       val: `${all.length}+`,     label: 'Active Partners', color: '#a78bfa' },
                { icon: TrendingUp,  val: top3[0] ? formatINR(top3[0].totalEarnings ?? top3[0].monthlyEarnings ?? top3[0].earned ?? 0) : '—', label: 'Top Earner', color: '#fbbf24' },
              ].map((s, i) => (
                <div key={i} className="px-6 sm:px-10 py-4 text-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <p className="font-black text-lg sm:text-xl" style={{ color: s.color }}>{s.val}</p>
                  <p className="text-gray-500 text-[11px] mt-0.5">{s.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Podium — top 3 */}
        {!loading && top3.length >= 3 && (
          <section className="px-4 pb-10 max-w-3xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="grid grid-cols-3 gap-3 items-end">
              {[top3[1], top3[0], top3[2]].map((e, idx) => {
                const isFirst = idx === 1
                const podiumRank = isFirst ? 1 : idx === 0 ? 2 : 3
                const color = getColor(podiumRank)
                const earned = e.totalEarnings ?? e.monthlyEarnings ?? e.earned ?? 0
                const heights = ['h-28', 'h-36', 'h-24']
                return (
                  <div key={e.rank}
                    className={`relative rounded-2xl flex flex-col items-center justify-end pb-4 pt-6 ${heights[idx]}`}
                    style={{
                      background: isFirst ? 'linear-gradient(160deg,rgba(251,191,36,0.12),rgba(245,158,11,0.06))' : 'rgba(255,255,255,0.03)',
                      border: isFirst ? '1px solid rgba(251,191,36,0.3)' : '1px solid rgba(255,255,255,0.07)',
                      boxShadow: isFirst ? '0 8px 40px rgba(251,191,36,0.1)' : 'none',
                    }}>
                    {isFirst && <div className="absolute -top-4 left-1/2 -translate-x-1/2"><Crown className="w-7 h-7 text-amber-400" style={{ filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.8))' }} /></div>}
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm mb-2"
                      style={{ background: `${color}22`, color, border: `2px solid ${color}44` }}>
                      {initials(e.name)}
                    </div>
                    <p className="text-white font-black text-xs text-center px-1">{e.name.split(' ')[0]}</p>
                    <p className="font-black text-sm mt-1" style={{ color }}>{formatINR(earned)}</p>
                    {e.isIndustrialPartner && (
                      <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full mt-1"
                        style={{ background: 'rgba(245,158,11,0.2)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.4)' }}>
                        🏭 Industrial
                      </span>
                    )}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-3 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black"
                      style={{ background: '#04050a', border: '1px solid rgba(255,255,255,0.1)', color: podiumRank === 1 ? '#fbbf24' : podiumRank === 2 ? '#9ca3af' : '#fb923c' }}>
                      {podiumRank}
                    </div>
                  </div>
                )
              })}
            </motion.div>
          </section>
        )}

        {/* Full table */}
        <section className="px-4 pb-20 max-w-5xl mx-auto">

          {/* Filter tabs */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            {FILTERS.map(f => (
              <button key={f.value} onClick={() => setFilter(f.value)}
                className="px-4 py-2 rounded-xl text-xs font-black transition-all"
                style={filter === f.value
                  ? { background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.35)' }
                  : { background: 'rgba(255,255,255,0.04)', color: '#6b7280', border: '1px solid rgba(255,255,255,0.07)' }
                }>{f.label}</button>
            ))}
            <span className="ml-auto text-gray-600 text-xs">{list.length} partners</span>
          </div>

          {/* Table */}
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl h-16 animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
              {/* Header */}
              <div className="grid grid-cols-12 px-4 sm:px-6 py-3 text-[10px] font-black text-gray-600 uppercase tracking-widest"
                style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="col-span-1">Rank</div>
                <div className="col-span-5 sm:col-span-4">Partner</div>
                <div className="col-span-3 sm:col-span-3">Total Earned</div>
                <div className="col-span-2 hidden sm:block">Partners</div>
                <div className="col-span-3 sm:col-span-2">Tier</div>
              </div>

              {list.map((e, i) => {
                const tier = tierConfig[e.tier as keyof typeof tierConfig] || tierConfig.Starter
                const color = getColor(e.rank)
                const earned = e.totalEarnings ?? e.monthlyEarnings ?? e.earned ?? 0
                return (
                  <div key={e.rank}
                    className="grid grid-cols-12 px-4 sm:px-6 py-4 items-center hover:bg-white/[0.02] transition-all"
                    style={{ borderBottom: i < list.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>

                    <div className="col-span-1"><RankBadge rank={e.rank} /></div>

                    <div className="col-span-5 sm:col-span-4 flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0"
                        style={{ background: `${color}20`, color, border: `1.5px solid ${color}40` }}>
                        {initials(e.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-bold text-sm truncate">{e.name}</p>
                        <div className="flex items-center gap-0.5 mt-0.5">
                          {[1,2,3,4,5].map(s => <Star key={s} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />)}
                        </div>
                      </div>
                    </div>

                    <div className="col-span-3 sm:col-span-3">
                      <p className="font-black text-sm" style={{ color }}>{formatINR(earned)}</p>
                      {e.isIndustrialPartner && e.industrialEarning > 0
                        ? <p className="text-amber-500/70 text-[10px]">🏭 incl. ₹{(e.industrialEarning).toLocaleString('en-IN')} industrial</p>
                        : <p className="text-gray-600 text-[10px]">{e.streak || 0}mo streak</p>
                      }
                    </div>

                    <div className="col-span-2 hidden sm:flex items-center gap-1.5">
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full" style={{ width: `${Math.min(((e.invites||0) / 220) * 100, 100)}%`, background: `linear-gradient(90deg, ${color}, ${color}88)` }} />
                      </div>
                      <span className="text-gray-500 text-[10px]">{e.invites || 0}</span>
                    </div>

                    <div className="col-span-3 sm:col-span-2 flex flex-col gap-1.5">
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-full w-fit"
                        style={{ background: tier.bg, color: tier.color, border: `1px solid ${tier.color}44` }}>
                        {tier.label}
                      </span>
                      {e.isIndustrialPartner && (
                        <span className="text-[9px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 w-fit"
                          style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.2),rgba(251,191,36,0.1))', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.45)', boxShadow: '0 0 8px rgba(245,158,11,0.15)' }}>
                          🏭 Industrial
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* CTA */}
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mt-10 rounded-2xl p-8 text-center"
            style={{ background: 'linear-gradient(135deg,rgba(52,211,153,0.06),rgba(6,182,212,0.04))', border: '1px solid rgba(52,211,153,0.15)' }}>
            <Trophy className="w-8 h-8 text-green-400 mx-auto mb-3" />
            <h3 className="text-white font-black text-xl mb-2">Your name could be here next month</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">Join the Partner Program today. Share your link, help people learn skills, and earn 10–25% every month.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/register"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-black text-white text-sm transition-all hover:scale-[1.04]"
                style={{ background: 'linear-gradient(135deg,#059669,#0891b2)', boxShadow: '0 8px 32px rgba(5,150,105,0.4)' }}>
                <Zap className="w-4 h-4" />Join & Start Earning<ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" />Back to Home
              </Link>
            </div>
          </motion.div>
        </section>
      </main>
      <Footer />
    </>
  )
}
