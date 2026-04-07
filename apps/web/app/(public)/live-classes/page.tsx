'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, Video, Clock, Users, Zap, Gift, Calendar, ChevronRight, Play } from 'lucide-react'
import Logo from '@/components/ui/Logo'
import { motion } from 'framer-motion'
import { classAPI } from '@/lib/api'

const FALLBACK: any[] = [
  {
    _id: '1',
    title: 'Full Stack Web Development – Live Session',
    course: { title: 'Full Stack Development', category: 'Development' },
    mentor: { name: 'Rahul Sharma', avatar: null },
    status: 'scheduled',
    scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    participantCount: 0,
    maxParticipants: 100,
    isFree: true,
  },
  {
    _id: '2',
    title: 'Digital Marketing Masterclass',
    course: { title: 'Digital Marketing', category: 'Marketing' },
    mentor: { name: 'Priya Singh', avatar: null },
    status: 'scheduled',
    scheduledAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
    participantCount: 0,
    maxParticipants: 80,
    isFree: false,
  },
  {
    _id: '3',
    title: 'Python for Data Science – Hands On',
    course: { title: 'Data Science', category: 'Data' },
    mentor: { name: 'Amit Verma', avatar: null },
    status: 'scheduled',
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    participantCount: 0,
    maxParticipants: 120,
    isFree: true,
  },
]

const CATEGORY_COLORS: Record<string, string> = {
  Development: 'linear-gradient(135deg,#1e3a5f,#1d4ed8)',
  Marketing: 'linear-gradient(135deg,#3b0764,#7c3aed)',
  Data: 'linear-gradient(135deg,#042f2e,#0d9488)',
  Design: 'linear-gradient(135deg,#451a03,#d97706)',
  Business: 'linear-gradient(135deg,#1e1b4b,#6366f1)',
  default: 'linear-gradient(135deg,#1a1740,#6366f1)',
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const diffH = Math.floor(diffMs / 3600000)
  const diffM = Math.floor((diffMs % 3600000) / 60000)
  if (diffMs < 0) return 'Started'
  if (diffH === 0) return `in ${diffM}m`
  if (diffH < 24) return `in ${diffH}h ${diffM}m`
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function ClassCard({ cls, i }: { cls: any; i: number }) {
  const [hovered, setHovered] = useState(false)
  const isLive = cls.status === 'live'
  const cat = cls.course?.category || 'default'
  const grad = CATEGORY_COLORS[cat] || CATEGORY_COLORS.default

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.08, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      viewport={{ once: true }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: '#0b0d1a',
        border: `1.5px solid ${hovered || isLive ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.08)'}`,
        boxShadow: hovered || isLive ? '0 0 40px rgba(124,58,237,0.2), 0 16px 48px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.4)',
        transition: 'border-color 0.3s, box-shadow 0.3s',
      }}
    >
      {/* Header */}
      <div className="relative px-5 pt-6 pb-5" style={{ background: grad }}>
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />

        {/* Badges row */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {isLive ? (
            <span className="flex items-center gap-1.5 text-[11px] font-black px-3 py-1 rounded-full"
              style={{ background: 'rgba(239,68,68,0.9)', color: '#fff' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              LIVE NOW
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
              <Clock className="w-3 h-3" />
              {formatTime(cls.scheduledAt)}
            </span>
          )}
          {(cls.isFree || i === 0) && (
            <span className="flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(16,185,129,0.25)', color: '#34d399', border: '1px solid rgba(16,185,129,0.4)' }}>
              <Gift className="w-3 h-3" /> FREE
            </span>
          )}
        </div>

        <h3 className="text-white font-black text-base leading-tight mb-1">{cls.title}</h3>
        <p className="text-white/60 text-xs">{cls.course?.title}</p>
      </div>

      {/* Body */}
      <div className="px-5 py-4 flex flex-col flex-1 gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
            style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa' }}>
            {cls.mentor?.name?.[0] || 'M'}
          </div>
          <span className="text-sm text-gray-300">{cls.mentor?.name || 'Expert Mentor'}</span>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {cls.participantCount || 0} joined</span>
          {cls.maxParticipants && <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> {cls.maxParticipants} seats</span>}
        </div>

        <Link href="/login"
          className="mt-auto block text-center py-2.5 rounded-xl text-sm font-black text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: isLive ? 'linear-gradient(135deg,#ef4444,#f97316)' : 'linear-gradient(135deg,#7c3aed,#6366f1)',
            boxShadow: isLive ? '0 4px 16px rgba(239,68,68,0.4)' : '0 4px 16px rgba(124,58,237,0.4)',
          }}>
          {isLive ? <span className="flex items-center justify-center gap-2"><Play className="w-4 h-4" /> Join Live Class</span> : 'Register Free →'}
        </Link>
      </div>
    </motion.div>
  )
}

export default function LiveClassesPage() {
  const [classes, setClasses] = useState<any[]>(FALLBACK)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    classAPI.getPublic()
      .then(res => {
        const data = res.data?.classes || []
        if (data.length > 0) setClasses(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const liveNow = classes.filter(c => c.status === 'live')
  const upcoming = classes.filter(c => c.status !== 'live')

  return (
    <div className="min-h-screen" style={{ background: '#04050a' }}>
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <Link href="/" className="flex items-center">
          <Logo size="md" href="/" />
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">Login</Link>
          <Link href="/register" className="btn-primary text-sm px-4 py-2">Get Started →</Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black mb-5"
            style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa' }}>
            <Video className="w-3.5 h-3.5" /> LIVE CLASSES
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight">
            Learn Live, Learn{' '}
            <span style={{ background: 'linear-gradient(135deg,#a78bfa,#e879f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Faster</span>
          </motion.h1>
          <p className="text-gray-400 max-w-lg mx-auto">
            Join expert-led live sessions. Ask questions, get answers, and learn in real time.
          </p>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-full"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <Gift className="w-4 h-4 text-green-400" />
            <span className="text-green-400 font-bold text-sm">New users get their first live class completely FREE</span>
          </motion.div>
        </div>

        {/* Live Now */}
        {liveNow.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <h2 className="text-lg font-black text-white">Live Right Now</h2>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>{liveNow.length} active</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {liveNow.map((cls, i) => <ClassCard key={cls._id} cls={cls} i={i} />)}
            </div>
          </div>
        )}

        {/* Upcoming */}
        <div>
          <div className="flex items-center gap-2 mb-5">
            <Calendar className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-black text-white">Upcoming Classes</h2>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1,2,3].map(i => (
                <div key={i} className="h-64 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {upcoming.map((cls, i) => <ClassCard key={cls._id} cls={cls} i={i} />)}
            </div>
          )}
        </div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="mt-16 text-center rounded-3xl p-10"
          style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
          <h2 className="text-2xl font-black text-white mb-2">Ready to Learn Live?</h2>
          <p className="text-gray-400 text-sm mb-6">Create your free account and join your first live class today.</p>
          <Link href="/register" className="btn-primary px-8 py-3 text-sm font-black">
            Start Learning Free →
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
