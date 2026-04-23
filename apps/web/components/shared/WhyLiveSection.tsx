'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { X, Check, Zap, Video, Bot, TrendingUp, Users, WifiOff } from 'lucide-react'
import Logo from '@/components/ui/Logo'
import Tilt3D from '@/components/ui/Tilt3D'

const comparisons = [
  { feature: 'Class Format',         us: 'Live Interactive Sessions Daily',       them: 'Pre-recorded Videos Only' },
  { feature: 'Doubt Solving',        us: 'Instant — ask in live class',            them: 'Wait days for reply' },
  { feature: 'Mentor Access',        us: 'Direct access, 1-on-1 sessions',         them: 'No direct access' },
  { feature: 'AI Coach',             us: 'Personal AI learning assistant',          them: 'Not available' },
  { feature: 'Community',            us: 'Active daily community + live events',    them: 'Basic forum only' },
  { feature: 'Earning Opportunity',  us: 'Earn Program — help others & earn',       them: 'No earning system' },
  { feature: 'Certification',        us: 'AI-powered verified certificates',        them: 'Basic PDF certificate' },
  { feature: 'Content Updates',      us: 'Live — always current',                   them: 'Outdated recordings' },
]

const buildAdvantages = (communityDesc: string) => [
  { icon: Video,      color: '#a78bfa', glow: 'rgba(167,139,250,0.2)', title: 'Real Interaction',   desc: 'Ask questions mid-session. Get answers immediately. No waiting.' },
  { icon: Bot,        color: '#34d399', glow: 'rgba(52,211,153,0.2)',  title: 'AI Coach 24/7',      desc: 'Personal AI mentor round the clock. Practice, test, get feedback.' },
  { icon: TrendingUp, color: '#fbbf24', glow: 'rgba(251,191,36,0.2)', title: 'Earn While Learning', desc: 'Help friends learn skills, earn income. ₹30K–₹1L+ every month.' },
  { icon: Users,      color: '#60a5fa', glow: 'rgba(96,165,250,0.2)', title: 'Live Community',      desc: communityDesc },
]

type Advantage = { icon: any; color: string; glow: string; title: string; desc: string }

function AdvantageCard({ a }: { a: Advantage }) {
  return (
    <Tilt3D intensity={12} className="rounded-3xl p-5 h-full cursor-default"
      style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${a.glow}` }}>
      <div className="relative mb-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center relative z-10 icon-3d float-3d"
          style={{ background: a.glow, boxShadow: `0 8px 28px ${a.glow}, 0 2px 0 rgba(0,0,0,0.3)` }}>
          <a.icon className="w-6 h-6" style={{ color: a.color }} />
        </div>
        <div className="absolute bottom-[-8px] left-3 w-10 h-3 rounded-full blur-md opacity-50"
          style={{ background: a.glow }} />
      </div>
      <h3 className="font-black text-white mb-2 text-sm" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{a.title}</h3>
      <p className="text-gray-500 text-xs leading-relaxed">{a.desc}</p>
    </Tilt3D>
  )
}

export default function WhyLiveSection() {
  const [communityDesc, setCommunityDesc] = useState('Learners growing together. Network, collaborate, get hired.')

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/stats`)
      .then(r => r.json())
      .then(d => {
        if (!d.success) return
        const s = d.stats
        const fmt = (n: number) => n >= 100000 ? `${Math.floor(n / 100000)}L+` : n >= 1000 ? `${Math.floor(n / 1000)}K+` : `${n}+`
        if (s.totalStudents) setCommunityDesc(`${fmt(s.totalStudents)} learners growing together. Network, collaborate, get hired.`)
      })
      .catch(() => {})
  }, [])

  const liveAdvantages = buildAdvantages(communityDesc)
  const doubledAdv = [...liveAdvantages, ...liveAdvantages]

  return (
    <section className="py-10 md:py-16 px-4 relative overflow-hidden" style={{ background: '#04050a' }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.05) 0%, transparent 65%)' }} />

      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8 md:mb-10">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black mb-5"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            WHY LIVE BEATS RECORDED
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-5">
            Don't Just{' '}
            <span className="relative inline-block">
              <span style={{ background: 'linear-gradient(135deg,#a78bfa,#e879f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Watch Videos
              </span>
              <span className="absolute left-0 right-0 top-1/2 h-1 rounded-full -translate-y-1/2 pointer-events-none"
                style={{ background: 'linear-gradient(90deg,#ef4444,#f97316)', opacity: 0.85 }} />
            </span>
            <span className="block mt-2">
              Learn{' '}
              <span style={{ background: 'linear-gradient(135deg,#4ade80,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                LIVE
              </span>
              , Grow Faster
            </span>
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="text-gray-400 max-w-xl mx-auto text-sm sm:text-base">
            Recorded courses have a 95% dropout rate. Live classes keep you accountable, engaged, and ahead.
          </motion.p>
        </div>

        {/* Advantages — mobile: auto-scroll marquee | desktop: 4-col grid */}
        <div className="mb-8 scene-3d">
          {/* Mobile marquee */}
          <div className="md:hidden relative">
            <div className="absolute inset-y-0 left-0 w-8 z-10 pointer-events-none"
              style={{ background: 'linear-gradient(90deg, #04050a, transparent)' }} />
            <div className="absolute inset-y-0 right-0 w-8 z-10 pointer-events-none"
              style={{ background: 'linear-gradient(270deg, #04050a, transparent)' }} />
            <div className="overflow-hidden">
              <div className="marquee-fwd flex" style={{ animationDuration: '18s' }}>
                {doubledAdv.map((a, i) => (
                  <div key={i} className="flex-shrink-0 w-[220px] mx-2 py-1">
                    <AdvantageCard a={a} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop grid */}
          <div className="hidden md:grid grid-cols-4 gap-3">
            {liveAdvantages.map((a, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 30, rotateX: -15 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ delay: i * 0.09, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                viewport={{ once: true }}>
                <AdvantageCard a={a} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Comparison Table */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="rounded-3xl overflow-x-auto"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ minWidth: '480px' }}>

            {/* Table header */}
            <div className="grid grid-cols-3 text-center">
              <div className="py-4 px-3" style={{ background: 'rgba(255,255,255,0.03)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Feature</p>
              </div>
              <div className="py-4 px-3 relative" style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.2),rgba(99,102,241,0.15))', borderRight: '1px solid rgba(124,58,237,0.2)' }}>
                <div className="flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <Logo size="sm" href={undefined} />
                </div>
                <p className="text-[10px] text-violet-400 font-bold mt-1">LIVE Learning</p>
              </div>
              <div className="py-4 px-3" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex items-center justify-center gap-1.5">
                  <WifiOff className="w-3.5 h-3.5 text-gray-600" />
                  <span className="text-gray-500 text-xs font-bold">Recorded</span>
                </div>
                <p className="text-[10px] text-gray-600 font-bold mt-1">Pre-recorded Only</p>
              </div>
            </div>

            {/* Rows */}
            {comparisons.map((row, i) => (
              <div key={i} className="grid grid-cols-3 border-t"
                style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                <div className="py-3 px-3 flex items-center"
                  style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="text-gray-400 text-xs font-semibold">{row.feature}</span>
                </div>
                <div className="py-3 px-3 flex items-center gap-1.5"
                  style={{ background: i % 2 === 0 ? 'rgba(124,58,237,0.07)' : 'rgba(124,58,237,0.04)', borderRight: '1px solid rgba(124,58,237,0.1)' }}>
                  <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(74,222,128,0.2)' }}>
                    <Check className="w-2.5 h-2.5 text-green-400" />
                  </div>
                  <span className="text-white text-xs font-medium leading-tight">{row.us}</span>
                </div>
                <div className="py-3 px-3 flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(239,68,68,0.15)' }}>
                    <X className="w-2.5 h-2.5 text-red-400" />
                  </div>
                  <span className="text-gray-500 text-xs leading-tight">{row.them}</span>
                </div>
              </div>
            ))}

            {/* Footer CTA */}
            <div className="py-5 px-4 text-center"
              style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.12),rgba(99,102,241,0.08))', borderTop: '1px solid rgba(124,58,237,0.15)' }}>
              <p className="text-white font-black text-base mb-3">Ready to experience the difference?</p>
              <a href="/register"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl font-black text-white text-sm transition-all hover:scale-[1.03]"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#6366f1)', boxShadow: '0 8px 32px rgba(124,58,237,0.45)' }}>
                <Zap className="w-4 h-4" /> Join Live Classes Free
              </a>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
