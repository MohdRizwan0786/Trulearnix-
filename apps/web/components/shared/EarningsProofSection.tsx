'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { IndianRupee, Users, Star, ArrowRight, Zap, Crown, Flame, ChevronRight } from 'lucide-react'
import Link from 'next/link'

const DEFAULT_STEPS = [
  { num: '01', title: 'Join & Learn',     desc: 'Enroll in any plan. Start your learning journey.',                                            color: '#a78bfa' },
  { num: '02', title: 'Share Your Link',  desc: 'Get your personal partner link. Share it with friends, family, and on social media.',             color: '#34d399' },
  { num: '03', title: 'Earn Every Month', desc: 'Help others learn skills — earn 10–25% income on every successful enrollment, every month.',     color: '#fbbf24' },
]

const tierConfig: Record<string, { bg: string; color: string }> = {
  elite:   { bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24' },
  supreme: { bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24' },
  pro:     { bg: 'rgba(167,139,250,0.12)', color: '#a78bfa' },
  starter: { bg: 'rgba(96,165,250,0.12)',  color: '#60a5fa' },
}

const COLORS = ['#fbbf24','#34d399','#fb923c','#a78bfa','#f472b6','#60a5fa','#e879f9','#38bdf8','#4ade80','#facc15']
function getColor(rank: number) { return COLORS[(rank - 1) % COLORS.length] }

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(251,191,36,0.2)', border: '1px solid rgba(251,191,36,0.4)' }}><Crown className="w-3.5 h-3.5 text-amber-400" /></div>
  if (rank === 2) return <div className="w-7 h-7 rounded-full flex items-center justify-center text-gray-300 font-black text-xs flex-shrink-0" style={{ background: 'rgba(156,163,175,0.15)', border: '1px solid rgba(156,163,175,0.3)' }}>2</div>
  if (rank === 3) return <div className="w-7 h-7 rounded-full flex items-center justify-center text-orange-400 font-black text-xs flex-shrink-0" style={{ background: 'rgba(251,146,60,0.15)', border: '1px solid rgba(251,146,60,0.3)' }}>3</div>
  return <div className="w-7 h-7 rounded-full flex items-center justify-center text-gray-600 font-black text-xs flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }}>#{rank}</div>
}

function initials(name: string) {
  const parts = name.trim().split(' ')
  return parts.length >= 2 ? `${parts[0][0]}${parts[parts.length-1][0]}` : parts[0].slice(0,2).toUpperCase()
}

function formatINR(n: number) {
  return `₹${n.toLocaleString('en-IN')}`
}

function EarnerCard({ e, color, tierNameMap = {} }: { e: any; color: string; tierNameMap?: Record<string, string> }) {
  const getTierName = (t?: string) => t ? (tierNameMap[t.toLowerCase()] || t) : '—'
  const tier = tierConfig[e.packageTier?.toLowerCase()] || tierConfig['starter']
  const earned = e.totalEarnings ?? e.monthlyEarnings ?? e.earned ?? 0
  const invites = e.invites ?? 0
  const barW = Math.min((invites / 220) * 100, 100)

  return (
    <div
      className="relative rounded-2xl p-4 cursor-default h-full"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
        <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
          style={{ background: tier.bg, color: tier.color, border: `1px solid ${tier.color}44` }}>
          {getTierName(e.packageTier)}
        </span>
        {e.isIndustrialPartner && (
          <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(245,158,11,0.18)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.4)' }}>
            🏭 Industrial + TruLearnix Earning
          </span>
        )}
      </div>

      <div className="flex items-center gap-2.5 mb-3">
        <RankBadge rank={e.rank} />
        <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0"
          style={{ background: `${color}22`, color, border: `2px solid ${color}44` }}>
          {initials(e.name)}
        </div>
        <div className="min-w-0">
          <p className="text-white font-bold text-xs truncate">{e.name}</p>
          {e.location && <p className="text-gray-500 text-[10px]">{e.location}</p>}
        </div>
      </div>

      <div className="flex items-baseline gap-1 mb-0.5">
        <span className="font-black text-xl" style={{ color }}>
          {e.earnedLabel ?? formatINR(earned)}
        </span>
      </div>
      <p className="text-gray-600 text-[10px] mb-2.5">this month · {e.streak || 0} month streak</p>

      <div className="flex items-center gap-2 mb-2.5">
        <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="h-full rounded-full" style={{ width: `${barW}%`, background: `linear-gradient(90deg, ${color}, ${color}88)` }} />
        </div>
        <span className="text-gray-500 text-[10px] font-bold flex-shrink-0">{invites} partners</span>
      </div>

      <div className="flex items-center gap-0.5">
        {[1,2,3,4,5].map(s => <Star key={s} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />)}
        <span className="text-gray-500 text-[10px] ml-1">Verified</span>
      </div>
    </div>
  )
}

export default function EarningsProofSection({ initialEarners = [] }: { initialEarners?: any[] }) {
  const [earners, setEarners] = useState<any[]>(initialEarners)
  const [loadingEarners, setLoadingEarners] = useState(initialEarners.length === 0)
  const [steps, setSteps] = useState(DEFAULT_STEPS)
  const [heading, setHeading] = useState('Learn & Earn ₹30K–₹2L+ Every Month')
  const [subheading, setSubheading] = useState("Our Earn Program isn't a side hustle — students are replacing their salaries.")
  const [sectionHeading, setSectionHeading] = useState('How Earning Works')
  const [leaderboardHeading, setLeaderboardHeading] = useState('Top Earners This Month')
  const [tierNameMap, setTierNameMap] = useState<Record<string, string>>({})
  const [studentCountLabel, setStudentCountLabel] = useState('—')

  useEffect(() => {
    const fetchLeaderboard = () => {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/affiliate/leaderboard`)
        .then(r => r.json())
        .then(d => {
          if (d.success && d.leaderboard?.length) setEarners(d.leaderboard.slice(0, 6))
        })
        .catch(() => {})
        .finally(() => setLoadingEarners(false))
    }

    fetchLeaderboard()
    const interval = setInterval(fetchLeaderboard, 2 * 60 * 1000)

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/packages`)
      .then(r => r.json())
      .then(d => {
        const map: Record<string, string> = {}
        ;(d.packages || []).forEach((p: any) => { if (p.tier) map[p.tier.toLowerCase()] = p.name })
        setTierNameMap(map)
      })
      .catch(() => {})

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/stats`)
      .then(r => r.json())
      .then(d => {
        if (!d.success) return
        const n = d.stats.totalStudents || 0
        const fmt = n >= 100000 ? `${Math.floor(n / 100000)}L+` : n >= 1000 ? `${Math.floor(n / 1000)}K+` : `${n}+`
        setStudentCountLabel(fmt)
      })
      .catch(() => {})

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/site-content/movement`)
      .then(r => r.json())
      .then(d => {
        if (!d.success || !d.data) return
        if (d.data.heading) setHeading(d.data.heading)
        if (d.data.subheading) setSubheading(d.data.subheading)
        if (d.data.sectionHeading) setSectionHeading(d.data.sectionHeading)
        if (d.data.leaderboardHeading) setLeaderboardHeading(d.data.leaderboardHeading)
        if (d.data.steps?.length) {
          const STEP_COLORS = ['#a78bfa', '#34d399', '#fbbf24']
          setSteps(d.data.steps.map((s: any, i: number) => ({ ...s, color: STEP_COLORS[i % STEP_COLORS.length] })))
        }
      })
      .catch(() => {})

    return () => clearInterval(interval)
  }, [])

  return (
    <section className="py-10 md:py-16 px-4 relative overflow-hidden" style={{ background: '#060810' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 65%)' }} />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 65%)' }} />
      </div>

      <div className="max-w-7xl mx-auto relative">

        {/* Header */}
        <div className="text-center mb-7 md:mb-10">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black mb-5"
            style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', color: '#34d399' }}>
            <IndianRupee className="w-3.5 h-3.5" />
            REAL STUDENT EARNINGS — VERIFIED
          </motion.div>

          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-5">
            <span style={{ background: 'linear-gradient(135deg,#34d399,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {heading}
            </span>
          </motion.h2>

          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="text-gray-400 max-w-xl mx-auto text-sm sm:text-base">
            {subheading}
          </motion.p>
        </div>

        {/* Earner cards — mobile: auto-scroll | desktop: grid */}
        <div className="mb-6">
          {loadingEarners ? (
            /* Skeleton */
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-2xl h-36 animate-pulse"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }} />
              ))}
            </div>
          ) : earners.length === 0 ? null : (
            <>
              {/* Mobile marquee */}
              <div className="md:hidden relative">
                <div className="absolute inset-y-0 left-0 w-6 z-10 pointer-events-none"
                  style={{ background: 'linear-gradient(90deg, #060810, transparent)' }} />
                <div className="absolute inset-y-0 right-0 w-6 z-10 pointer-events-none"
                  style={{ background: 'linear-gradient(270deg, #060810, transparent)' }} />
                <div className="overflow-hidden">
                  <div className="marquee-fwd flex items-stretch" style={{ animationDuration: '60s' }}>
                    {[...earners, ...earners].map((e, i) => (
                      <div key={i} className="flex-shrink-0 w-[220px] mx-2 py-1">
                        <EarnerCard e={e} color={getColor(e.rank ?? i+1)} tierNameMap={tierNameMap} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Desktop grid */}
              <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4">
                {earners.map((e, i) => (
                  <div key={e.rank ?? i}>
                    <EarnerCard e={e} color={getColor(e.rank ?? i+1)} tierNameMap={tierNameMap} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* View All */}
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="flex justify-center mb-7">
          <Link href="/leaderboard"
            className="group inline-flex items-center gap-3 px-7 py-3 rounded-2xl font-black text-sm transition-all hover:scale-[1.03]"
            style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)', color: '#34d399' }}>
            <Flame className="w-4 h-4" />
            View Full Leaderboard
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {/* How it works */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="rounded-3xl p-4 sm:p-8 md:p-10 mb-8"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 className="text-center text-xl md:text-3xl font-black text-white mb-6">
            <span style={{ background: 'linear-gradient(135deg,#34d399,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {sectionHeading}
            </span>
          </h3>

          {/* Mobile: horizontal snap scroll */}
          <div className="md:hidden overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
            <div className="flex gap-3" style={{ width: 'max-content' }}>
              {steps.map((s, i) => (
                <div key={i} className="rounded-2xl p-4 text-center flex-shrink-0 w-[200px]"
                  style={{ scrollSnapAlign: 'start', background: `${s.color}10`, border: `1px solid ${s.color}25` }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 font-black text-xl"
                    style={{ background: `${s.color}18`, border: `1px solid ${s.color}33`, color: s.color }}>
                    {s.num}
                  </div>
                  <h4 className="text-white font-black text-sm mb-1.5">{s.title}</h4>
                  <p className="text-gray-500 text-xs leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop: 3-col grid */}
          <div className="hidden md:grid grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <div key={i} className="relative text-center">
                {i < steps.length - 1 && (
                  <div className="absolute top-8 left-[calc(100%-8px)] w-full h-px z-10"
                    style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.15), transparent)' }} />
                )}
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 font-black text-2xl"
                  style={{ background: `${s.color}18`, border: `1px solid ${s.color}33`, color: s.color }}>
                  {s.num}
                </div>
                <h4 className="text-white font-black mb-2">{s.title}</h4>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4">
            <Link href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-white text-sm transition-all hover:scale-[1.04]"
              style={{ background: 'linear-gradient(135deg,#059669,#0891b2)', boxShadow: '0 8px 32px rgba(5,150,105,0.45)' }}>
              <Zap className="w-4 h-4" />
              Start Earning Today
              <ArrowRight className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Users className="w-4 h-4 text-gray-500" />
              <span>Join <span className="text-white font-bold">{studentCountLabel}</span> students already earning</span>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
