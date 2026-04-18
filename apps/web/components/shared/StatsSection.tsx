'use client'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Users, BookOpen, Award, TrendingUp, Star, Globe, Video, Zap } from 'lucide-react'
import Tilt3D from '@/components/ui/Tilt3D'

const ICONS = [Users, Video, BookOpen, Award, TrendingUp, Star, Globe, Zap]
const COLORS = [
  { color: 'text-violet-400', glow: 'rgba(124,58,237,0.18)', shadow: 'rgba(124,58,237,0.4)' },
  { color: 'text-red-400',    glow: 'rgba(239,68,68,0.15)',  shadow: 'rgba(239,68,68,0.35)' },
  { color: 'text-blue-400',   glow: 'rgba(59,130,246,0.15)', shadow: 'rgba(59,130,246,0.35)'},
  { color: 'text-amber-400',  glow: 'rgba(245,158,11,0.15)', shadow: 'rgba(245,158,11,0.35)'},
  { color: 'text-green-400',  glow: 'rgba(34,197,94,0.15)',  shadow: 'rgba(34,197,94,0.35)' },
  { color: 'text-orange-400', glow: 'rgba(249,115,22,0.15)', shadow: 'rgba(249,115,22,0.35)'},
  { color: 'text-cyan-400',   glow: 'rgba(6,182,212,0.15)',  shadow: 'rgba(6,182,212,0.35)' },
  { color: 'text-fuchsia-400',glow: 'rgba(217,70,239,0.15)', shadow: 'rgba(217,70,239,0.35)'},
]

const DEFAULT_STATS = [
  { value: '50,000+', label: 'Active Students' },
  { value: '1,200+',  label: 'Live Sessions Done' },
  { value: '500+',    label: 'Expert Courses' },
  { value: '20,000+', label: 'Certificates Issued' },
  { value: '₹2Cr+',   label: 'Partner Earnings' },
  { value: '4.9/5',   label: 'Platform Rating' },
  { value: '50+',     label: 'Cities Covered' },
  { value: '98%',     label: 'Completion Rate' },
]

type StatItem = { value: string; label: string; icon?: any; color?: string; glow?: string; shadow?: string }

function StatCard({ s }: { s: StatItem }) {
  const Icon = s.icon || Users
  const color = s.color || 'text-violet-400'
  const glow = s.glow || 'rgba(124,58,237,0.18)'
  const shadow = s.shadow || 'rgba(124,58,237,0.4)'
  return (
    <Tilt3D intensity={14} className="bento p-4 text-center cursor-default group h-full">
      <div className="relative mb-3">
        <div className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center transition-all duration-400 group-hover:scale-110 icon-3d relative z-10"
          style={{ background: glow, boxShadow: `0 6px 20px ${shadow}` }}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-7 h-2 rounded-full blur-sm opacity-50"
          style={{ background: shadow }} />
      </div>
      <div className="text-lg font-black text-white leading-tight"
        style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>{s.value}</div>
      <div className="text-[11px] text-gray-500 mt-0.5 leading-tight">{s.label}</div>
    </Tilt3D>
  )
}

export default function StatsSection() {
  const [stats, setStats] = useState<StatItem[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/site-content/stats`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data?.stats?.length) {
          setStats(d.data.stats.map((s: any, i: number) => ({ ...s, icon: ICONS[i % ICONS.length], ...COLORS[i % COLORS.length] })))
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  if (loaded && stats.length === 0) return null

  const doubled = [...stats, ...stats]
  return (
    <section className="py-8 md:py-14 relative overflow-hidden scene-3d">
      <div className="absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.2), transparent)' }} />
      <div className="absolute inset-x-0 bottom-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.2), transparent)' }} />

      {/* Mobile: auto-scroll marquee */}
      <div className="md:hidden relative">
        <div className="absolute inset-y-0 left-0 w-8 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(90deg, #050709, transparent)' }} />
        <div className="absolute inset-y-0 right-0 w-8 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(270deg, #050709, transparent)' }} />
        <div className="overflow-hidden">
          <div className="marquee-fwd flex" style={{ animationDuration: '22s', width: 'max-content' }}>
            {doubled.map((s, i) => (
              <div key={i} className="flex-shrink-0 w-[130px] mx-1.5">
                <StatCard s={s} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop: grid */}
      <div className="hidden md:block max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-3">
          {stats.map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 30, rotateX: -20 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ delay: i * 0.07, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              viewport={{ once: true }}
            >
              <StatCard s={s} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
