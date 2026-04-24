'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, X, Star, Heart, BadgeCheck, Quote, Sparkles } from 'lucide-react'

const GRADIENTS = [
  'linear-gradient(135deg,#7c3aed,#4f46e5,#0ea5e9)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#8b5cf6,#ec4899)',
  'linear-gradient(135deg,#10b981,#06b6d4)',
  'linear-gradient(135deg,#f97316,#eab308)',
  'linear-gradient(135deg,#0ea5e9,#6366f1)',
]
const RESULT_COLORS = ['#34d399','#fbbf24','#a78bfa','#34d399','#fb923c','#38bdf8']

function enrichVideo(v: any, i: number) {
  const initials = v.name.split(' ').map((p: string) => p[0]).slice(0,2).join('')
  return { ...v, gradient: GRADIENTS[i % GRADIENTS.length], resultColor: RESULT_COLORS[i % RESULT_COLORS.length], avatar: initials || v.name.slice(0,2).toUpperCase() }
}

type Video = ReturnType<typeof enrichVideo>


/* ── Modal ──────────────────────────────────────────────────────── */
function VideoModal({ v, onClose }: { v: Video; onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          className="w-full max-w-xl rounded-3xl overflow-hidden"
          style={{ background: '#0d0f1a', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 40px 120px rgba(0,0,0,0.8)' }}
          onClick={e => e.stopPropagation()}
        >
          <button onClick={onClose}
            className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full flex items-center justify-center hover:scale-110 transition-all"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <X className="w-4 h-4 text-white" />
          </button>

          <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
            {v.videoUrl
              ? <video className="absolute inset-0 w-full h-full object-cover" src={v.videoUrl} controls autoPlay />
              : <iframe className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${v.videoId}?autoplay=1&rel=0`}
                  allow="autoplay; encrypted-media" allowFullScreen />
            }
          </div>

          <div className="p-5 flex items-start gap-4">
            <div className="w-11 h-11 rounded-full flex items-center justify-center font-black text-sm text-white flex-shrink-0"
              style={{ background: v.gradient }}>
              {v.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <p className="text-white font-black text-sm">{v.name}</p>
                <BadgeCheck className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                  style={{ background: `${v.resultColor}18`, color: v.resultColor, border: `1px solid ${v.resultColor}30` }}>
                  {v.result}
                </span>
              </div>
              <p className="text-gray-500 text-xs">{v.role} · {v.company}</p>
              <p className="text-gray-400 text-sm mt-2 italic">"{v.quote}"</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

/* ── Video Card ─────────────────────────────────────────────────── */
function VideoCard({ v, onClick, delay = 0 }: { v: Video; onClick: () => void; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
      className="rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300"
      style={{ background: '#0d1020', border: '1px solid rgba(255,255,255,0.08)' }}
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video" style={{ background: v.gradient }}>
        {/* Avatar / image */}
        <div className="absolute inset-0 flex items-center justify-center">
          {v.avatarUrl
            ? <img src={v.avatarUrl} className="w-full h-full object-cover opacity-60" alt={v.name} />
            : <div className="w-14 h-14 rounded-full flex items-center justify-center font-black text-lg text-white opacity-30"
                style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.3)' }}>
                {v.avatar}
              </div>
          }
        </div>

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl"
            style={{ background: 'rgba(255,255,255,0.95)', boxShadow: '0 0 0 10px rgba(255,255,255,0.12)' }}>
            <Play className="w-6 h-6 text-gray-900 ml-0.5" fill="currentColor" />
          </div>
        </div>

        {/* Verified badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-lg"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}>
          <BadgeCheck className="w-3 h-3 text-blue-400" />
          <span className="text-[9px] text-blue-400 font-black tracking-wide">VERIFIED</span>
        </div>

        {/* Duration */}
        <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-black text-white"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}>
          {v.duration}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <Quote className="w-4 h-4 mb-2 text-white/10" />
        <p className="text-gray-300 text-sm leading-relaxed mb-4 line-clamp-2">"{v.quote}"</p>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-xs text-white flex-shrink-0"
            style={{ background: v.gradient }}>
            {v.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-black text-sm leading-tight">{v.name}</p>
            <p className="text-gray-500 text-xs truncate">{v.role} · {v.company}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
          </div>
          <span className="text-[10px] font-black px-2.5 py-1 rounded-full"
            style={{ background: `${v.resultColor}15`, color: v.resultColor, border: `1px solid ${v.resultColor}25` }}>
            {v.result}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

/* ── Marquee Card ───────────────────────────────────────────────── */
function MarqueeCard({ v, onClick }: { v: Video; onClick: () => void }) {
  return (
    <div className="flex-shrink-0 w-[200px] mx-2 rounded-xl overflow-hidden cursor-pointer group transition-all duration-300 hover:-translate-y-1"
      style={{ background: '#0d1020', border: '1px solid rgba(255,255,255,0.07)' }}
      onClick={onClick}>
      <div className="relative aspect-video" style={{ background: v.gradient }}>
        {v.avatarUrl && (
          <img src={v.avatarUrl} className="absolute inset-0 w-full h-full object-cover opacity-70" alt={v.name} />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-9 h-9 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
            style={{ background: 'rgba(255,255,255,0.92)', boxShadow: '0 0 0 6px rgba(255,255,255,0.12)' }}>
            <Play className="w-4 h-4 text-gray-900 ml-0.5" fill="currentColor" />
          </div>
        </div>
        <span className="absolute bottom-2 right-2 text-[10px] font-black text-white px-1.5 py-0.5 rounded"
          style={{ background: 'rgba(0,0,0,0.65)' }}>{v.duration}</span>
      </div>
      <div className="p-3">
        <p className="text-white font-black text-xs truncate">{v.name}</p>
        <p className="text-gray-600 text-[10px] mb-2 truncate">{v.role}</p>
        <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
          style={{ background: `${v.resultColor}15`, color: v.resultColor }}>
          {v.result}
        </span>
      </div>
    </div>
  )
}

/* ── Section ────────────────────────────────────────────────────── */
export default function WallOfLove() {
  const [active, setActive] = useState<Video | null>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const [heading, setHeading] = useState('')
  const [subheading, setSubheading] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/site-content/wall`)
      .then(r => r.json())
      .then(d => {
        if (!d.success || !d.data) return
        if (d.data.heading)    setHeading(d.data.heading)
        if (d.data.subheading) setSubheading(d.data.subheading)
        if (d.data.videos?.length) {
          setVideos(d.data.videos.map((item: any, i: number) => enrichVideo({
            ...item,
            id: i + 1,
            duration: item.duration || '1:00',
          }, i)))
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true))

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/stats`)
      .then(r => r.json())
      .then(d => { if (d.success) setStats(d.stats) })
      .catch(() => {})
  }, [])

  const fmtCount = (n: number) => n >= 100000 ? `${Math.floor(n / 100000)}L+` : n >= 1000 ? `${Math.floor(n / 1000)}K+` : `${n}+`
  const trustStrip = [
    { emoji: '🎥', val: videos.length ? `${videos.length}+` : '—', label: 'Video Reviews',   color: '#ec4899' },
    { emoji: '⭐', val: stats && stats.avgRating > 0 ? `${stats.avgRating.toFixed(1)}/5` : '—',  label: 'Avg Rating', color: '#fbbf24' },
    { emoji: '👥', val: stats ? fmtCount(stats.totalStudents || 0) : '—', label: 'Happy Learners', color: '#34d399' },
    { emoji: '📚', val: stats ? fmtCount(stats.totalCourses || 0) : '—', label: 'Courses Live', color: '#a78bfa' },
  ]

  if (loaded && videos.length === 0) return null

  const marqueeVideos = [...videos, ...videos]

  return (
    <section className="relative py-10 md:py-16 overflow-hidden" style={{ background: '#060810' }}>

      {/* BG orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 70%)' }} />
      </div>

      <div className="max-w-6xl mx-auto px-4 relative z-10">

        {/* Header */}
        <div className="text-center mb-6 md:mb-12">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            className="inline-flex items-center gap-2 mb-5 px-5 py-2 rounded-full"
            style={{ background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.22)' }}>
            <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400" />
            <span className="text-pink-400 text-xs font-black uppercase tracking-widest">Wall of Love</span>
            <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400" />
          </motion.div>

          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="font-black text-white leading-tight mb-4"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
            <span style={{ background: 'linear-gradient(135deg,#ec4899,#a855f7,#6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {heading}
            </span>
          </motion.h2>

          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            className="text-gray-400 text-base max-w-md mx-auto mb-5">
            {subheading}
          </motion.p>

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2">
            <div className="flex -space-x-2">
              {['PM','RS','AV','KP','SJ'].map((a, i) => (
                <div key={i} className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-[9px] font-black text-white"
                  style={{ borderColor: '#060810', background: `hsl(${i * 60 + 200},65%,50%)` }}>{a}</div>
              ))}
            </div>
            <span className="text-gray-500 text-xs">
              <Sparkles className="w-3 h-3 text-amber-400 inline mr-1" />
              <span className="text-white font-black">2,400+</span> students shared their story
            </span>
          </motion.div>
        </div>

        {/* Auto-scroll marquee row */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-16 sm:w-28 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(90deg, #060810 0%, transparent 100%)' }} />
          <div className="absolute inset-y-0 right-0 w-16 sm:w-28 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(270deg, #060810 0%, transparent 100%)' }} />
          <div className="marquee-fwd py-2" style={{ animationDuration: '60s' }}>
            {marqueeVideos.map((v, i) => (
              <MarqueeCard key={i} v={v} onClick={() => setActive(v)} />
            ))}
          </div>
        </div>

        {/* Trust strip */}
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {trustStrip.map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.06 }}
              className="text-center py-4 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-xl mb-1">{s.emoji}</div>
              <p className="font-black text-lg" style={{ color: s.color }}>{s.val}</p>
              <p className="text-gray-600 text-xs">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {active && <VideoModal v={active} onClose={() => setActive(null)} />}
    </section>
  )
}
