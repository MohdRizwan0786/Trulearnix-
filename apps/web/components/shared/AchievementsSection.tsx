'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Trophy, Star, Shield, Zap, Award, TrendingUp, Globe, Cpu, Camera } from 'lucide-react'

const ICON_MAP: Record<string, any> = {
  Trophy, Star, Shield, Zap, Award, TrendingUp, Globe, Cpu, Camera,
}

const COLOR_MAP: Record<string, { color: string; bg: string; border: string; glow: string }> = {
  amber:  { color: 'text-amber-400',   bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.2)',  glow: 'rgba(245,158,11,0.08)'  },
  violet: { color: 'text-violet-400',  bg: 'rgba(124,58,237,0.12)', border: 'rgba(124,58,237,0.2)', glow: 'rgba(124,58,237,0.08)' },
  blue:   { color: 'text-blue-400',    bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.2)', glow: 'rgba(59,130,246,0.08)' },
  green:  { color: 'text-green-400',   bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.2)', glow: 'rgba(16,185,129,0.08)' },
  cyan:   { color: 'text-cyan-400',    bg: 'rgba(6,182,212,0.12)',  border: 'rgba(6,182,212,0.2)',  glow: 'rgba(6,182,212,0.08)'  },
  pink:   { color: 'text-pink-400',    bg: 'rgba(236,72,153,0.12)', border: 'rgba(236,72,153,0.2)', glow: 'rgba(236,72,153,0.08)' },
  orange: { color: 'text-orange-400',  bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.2)', glow: 'rgba(249,115,22,0.08)' },
  indigo: { color: 'text-indigo-400',  bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.2)', glow: 'rgba(99,102,241,0.08)' },
  fuchsia:{ color: 'text-fuchsia-400', bg: 'rgba(217,70,239,0.12)', border: 'rgba(217,70,239,0.2)', glow: 'rgba(217,70,239,0.08)' },
}

interface Award {
  icon: string
  color: string
  title: string
  org: string
  year: string
}

interface Photo {
  src: string
  caption: string
  sub: string
}

interface Stat {
  val: string
  label: string
  color: string
}

interface AchievementsData {
  heading?: string
  subheading?: string
  awards?: Award[]
  photos?: Photo[]
  stats?: Stat[]
}

function AchievementCard({ award }: { award: Award }) {
  const palette = COLOR_MAP[award.color] || COLOR_MAP.violet
  const Icon = ICON_MAP[award.icon] || Trophy
  return (
    <div
      className="flex-shrink-0 flex items-center gap-4 mx-3 px-5 py-4 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] cursor-default"
      style={{
        background: `linear-gradient(135deg, ${palette.glow}, rgba(255,255,255,0.01))`,
        border: `1px solid ${palette.border}`,
        backdropFilter: 'blur(12px)',
        minWidth: '260px',
        boxShadow: `0 4px 24px ${palette.glow}`,
      }}
    >
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: palette.bg, boxShadow: `0 0 20px ${palette.glow}` }}>
        <Icon className={`w-5 h-5 ${palette.color}`} />
      </div>
      <div className="min-w-0">
        <p className="text-white font-black text-sm leading-tight truncate">{award.title}</p>
        <p className="text-gray-500 text-xs mt-0.5 truncate">{award.org}</p>
      </div>
      <span className="flex-shrink-0 text-[10px] font-black px-2 py-1 rounded-lg ml-auto"
        style={{ background: palette.bg, color: palette.color.replace('text-', '') }}>
        {award.year}
      </span>
    </div>
  )
}

function PhotoCard({ photo }: { photo: Photo }) {
  return (
    <div
      className="flex-shrink-0 mx-3 rounded-2xl overflow-hidden relative group cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:scale-[1.03]"
      style={{
        width: '260px',
        height: '320px',
        border: '1px solid rgba(124,58,237,0.25)',
        boxShadow: '0 8px 40px rgba(124,58,237,0.1)',
      }}
    >
      <Image
        src={photo.src}
        alt={photo.caption}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-110"
        sizes="260px"
      />
      <div
        className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(4,5,10,0.95) 0%, rgba(4,5,10,0.5) 50%, transparent 100%)' }}
      />
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
        style={{ boxShadow: 'inset 0 0 0 1px rgba(124,58,237,0.6)', background: 'rgba(124,58,237,0.04)' }}
      />
      <div className="absolute inset-x-0 bottom-0 p-4 z-10">
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400" style={{ boxShadow: '0 0 6px rgba(245,158,11,0.8)' }} />
          <span className="text-amber-400 text-[10px] font-black uppercase tracking-wider">Moment</span>
        </div>
        <p className="text-white font-black text-sm leading-tight">{photo.caption}</p>
        <p className="text-gray-500 text-xs mt-0.5">{photo.sub}</p>
      </div>
      <div className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: 'rgba(124,58,237,0.5)', backdropFilter: 'blur(8px)' }}>
        <Camera className="w-3.5 h-3.5 text-violet-300" />
      </div>
    </div>
  )
}

export default function AchievementsSection() {
  const [data, setData] = useState<AchievementsData | null>(null)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/site-content/achievements`)
      .then(r => r.json())
      .then(r => { if (r.success && r.data) setData(r.data) })
      .catch(() => {})
  }, [])

  if (!data || (!data.awards?.length && !data.photos?.length)) return null

  const awards = data.awards || []
  const photos = data.photos || []
  const stats = data.stats || []

  // Duplicate for marquee — only when enough items to fill screen
  const half1 = awards.slice(0, Math.ceil(awards.length / 2))
  const half2 = awards.slice(Math.ceil(awards.length / 2))
  const row1 = half1.length >= 3 ? [...half1, ...half1] : half1
  const row2 = half2.length >= 3 ? [...half2, ...half2] : half2
  const photoLoop = photos.length >= 3 ? [...photos, ...photos] : photos

  return (
    <section className="relative py-8 sm:py-12 overflow-hidden" style={{ background: '#04050a' }}>

      {/* BG orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-60px] left-1/4 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-60px] right-1/4 w-[350px] h-[350px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(217,70,239,0.06) 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(245,158,11,0.03) 0%, transparent 70%)' }} />
      </div>

      {/* Top divider */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.3), rgba(217,70,239,0.3), transparent)' }} />

      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.6 }}
        className="relative z-10 text-center mb-10 px-4"
      >
        <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full"
          style={{ background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.22)' }}>
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-amber-400 text-xs font-black tracking-wide uppercase">Awards & Recognition</span>
        </div>
        <h2 className="text-white font-black text-2xl sm:text-3xl md:text-4xl leading-tight">
          {data.heading || 'Recognised by'} <span className="gradient-text">India's Best</span>
        </h2>
        {data.subheading && (
          <p className="text-gray-500 text-sm sm:text-base mt-3 max-w-xl mx-auto">{data.subheading}</p>
        )}
      </motion.div>

      {/* Award sliders */}
      {awards.length > 0 && (
        <div className="relative z-10 space-y-4">
          <div className="absolute inset-y-0 left-0 w-24 sm:w-40 z-20 pointer-events-none"
            style={{ background: 'linear-gradient(90deg, #04050a 0%, transparent 100%)' }} />
          <div className="absolute inset-y-0 right-0 w-24 sm:w-40 z-20 pointer-events-none"
            style={{ background: 'linear-gradient(270deg, #04050a 0%, transparent 100%)' }} />

          {row1.length > 0 && (
            <div className="overflow-hidden">
              <div className="marquee-fwd" style={{ animationDuration: '36s' }}>
                {row1.map((award, i) => <AchievementCard key={i} award={award} />)}
              </div>
            </div>
          )}
          {row2.length > 0 && (
            <div className="overflow-hidden">
              <div className="marquee-rev" style={{ animationDuration: '42s' }}>
                {row2.map((award, i) => <AchievementCard key={i} award={award} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Photo gallery */}
      {photos.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.15 }}
          className="relative z-10 mt-12"
        >
          <div className="flex items-center justify-center gap-3 mb-6 px-4">
            <div className="h-px flex-1 max-w-[80px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1))' }} />
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Camera className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Our Moments</span>
            </div>
            <div className="h-px flex-1 max-w-[80px]" style={{ background: 'linear-gradient(270deg, transparent, rgba(255,255,255,0.1))' }} />
          </div>

          {photos.length >= 3 ? (
            <div className="relative overflow-hidden">
              <div className="absolute inset-y-0 left-0 w-20 sm:w-32 z-20 pointer-events-none"
                style={{ background: 'linear-gradient(90deg, #04050a 0%, transparent 100%)' }} />
              <div className="absolute inset-y-0 right-0 w-20 sm:w-32 z-20 pointer-events-none"
                style={{ background: 'linear-gradient(270deg, #04050a 0%, transparent 100%)' }} />
              <div className="marquee-fwd py-3" style={{ animationDuration: '30s' }}>
                {photoLoop.map((photo, i) => <PhotoCard key={i} photo={photo} />)}
              </div>
            </div>
          ) : (
            <div className="flex justify-center gap-6 px-4 py-3 flex-wrap">
              {photos.map((photo, i) => <PhotoCard key={i} photo={photo} />)}
            </div>
          )}
        </motion.div>
      )}

      {/* Bottom stat strip */}
      {stats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }}
          className="relative z-10 mt-12 mx-auto max-w-3xl px-4"
        >
          <div className="grid rounded-2xl overflow-hidden"
            style={{
              gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}>
            {stats.map((s, i) => {
              const palette = COLOR_MAP[s.color] || COLOR_MAP.violet
              return (
                <div key={i} className="text-center py-5"
                  style={{ borderRight: i < stats.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                  <p className={`font-black text-xl sm:text-2xl ${palette.color}`}>{s.val}</p>
                  <p className="text-gray-600 text-xs mt-0.5">{s.label}</p>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Bottom divider */}
      <div className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.2), rgba(217,70,239,0.2), transparent)' }} />
    </section>
  )
}
