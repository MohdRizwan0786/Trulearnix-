'use client'
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Play, Star, Users, Award, BookOpen, Video, Zap, TrendingUp, CheckCircle2, ArrowRight, Sparkles, Flame, Shield, Volume2, VolumeX } from 'lucide-react'

const DEFAULT_FEATURES = [
  'Live Interactive Classes Daily',
  'AI-Generated Certificates',
  'Earn via Partner Program',
  '500+ Expert-Led Courses',
]

const DEFAULT_TICKER = [
  '🔥 New Batch Starting Monday',
  '⚡ 247 Students Joined Today',
  '🏆 50,000+ Learners Trust Us',
  '💰 ₹2Cr+ Partner Earnings Paid',
  '🎓 20,000+ Certificates Issued',
  '🌟 4.9/5 Platform Rating',
]

const DEFAULT_HERO_STATS = [
  { icon: Users,    val: '50K+',  label: 'Active Learners',     glowColor: 'rgba(124,58,237,0.2)',  iconColor: 'text-violet-400' },
  { icon: BookOpen, val: '500+',  label: 'Expert Courses',      glowColor: 'rgba(99,102,241,0.2)',  iconColor: 'text-indigo-400' },
  { icon: Award,    val: '20K+',  label: 'Certificates Issued', glowColor: 'rgba(245,158,11,0.2)',  iconColor: 'text-amber-400'  },
  { icon: Zap,      val: '₹2Cr+', label: 'Partner Earnings',  glowColor: 'rgba(16,185,129,0.2)',  iconColor: 'text-green-400'  },
]

const ICON_CYCLE = [Users, BookOpen, Award, Zap]
const GLOW_CYCLE = ['rgba(124,58,237,0.2)', 'rgba(99,102,241,0.2)', 'rgba(245,158,11,0.2)', 'rgba(16,185,129,0.2)']
const COLOR_CYCLE = ['text-violet-400', 'text-indigo-400', 'text-amber-400', 'text-green-400']

export default function HeroSection() {
  const [badgeText, setBadgeText]             = useState('Live Classes Happening Now')
  const [headline, setHeadline]               = useState("India's #1 Live Learning + Earning Platform")
  const [subheadline, setSubheadline]         = useState('Interactive live classes, AI certificates & a built-in partner system — learn skills, earn money & transform your career.')
  const [heroBannerImage, setHeroBannerImage] = useState('')
  const [features, setFeatures]               = useState(DEFAULT_FEATURES)
  const [tickerItems, setTickerItems]         = useState(DEFAULT_TICKER)
  const [heroStats, setHeroStats]             = useState(DEFAULT_HERO_STATS)
  const [heroVideoUrl, setHeroVideoUrl]       = useState('/hero-video.mp4')
  const [muted, setMuted]                     = useState(true)
  const videoRef1 = useRef<HTMLVideoElement>(null)
  const videoRef2 = useRef<HTMLVideoElement>(null)
  const [liveClassTitle, setLiveClassTitle]   = useState('')
  const [liveClassMentor, setLiveClassMentor] = useState('')
  const [liveClassViewers, setLiveClassViewers] = useState('')
  const [chatMessages, setChatMessages]       = useState<{ u: string; m: string; c: string }[]>([])

  useEffect(() => {
    fetch(process.env.NEXT_PUBLIC_API_URL + '/site-content/hero')
      .then(r => r.json())
      .then(res => {
        const d = res.data
        if (!d) return
        if (d.badgeText)             setBadgeText(d.badgeText)
        if (d.headline)              setHeadline(d.headline)
        if (d.subheadline)           setSubheadline(d.subheadline)
        if (d.heroBannerImage)       setHeroBannerImage(d.heroBannerImage)
        if (d.features?.length)      setFeatures(d.features)
        if (d.ticker?.length)        setTickerItems(d.ticker)
        if (d.heroStats?.length) {
          setHeroStats(d.heroStats.map((s: any, i: number) => ({
            icon: ICON_CYCLE[i] || Users,
            val: s.value,
            label: s.label,
            glowColor: GLOW_CYCLE[i] || 'rgba(124,58,237,0.2)',
            iconColor: COLOR_CYCLE[i] || 'text-violet-400',
          })))
        }
        if (d.heroVideoUrl)     setHeroVideoUrl(d.heroVideoUrl)
        if (d.liveClassTitle)   setLiveClassTitle(d.liveClassTitle)
        if (d.liveClassMentor)  setLiveClassMentor(d.liveClassMentor)
        if (d.liveClassViewers) setLiveClassViewers(d.liveClassViewers)
        if (d.chatMessages?.length) {
          const colors = ['text-blue-400', 'text-fuchsia-400', 'text-green-400']
          setChatMessages(d.chatMessages.map((m: any, i: number) => ({ ...m, c: colors[i % colors.length] })))
        }
      })
      .catch(() => {})
  }, [])

  const toggleMute = () => {
    const next = !muted
    setMuted(next)
    if (videoRef1.current) videoRef1.current.muted = next
    if (videoRef2.current) videoRef2.current.muted = next
  }

  const ticker = [...tickerItems, ...tickerItems]

  return (
    <section className="hero-bg noise relative min-h-screen flex flex-col" style={{ background: '#04050a', overflow:'hidden', width:'100%', maxWidth:'100vw' }}>

      {/* Moving animated orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="hero-orb-1 absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.22) 0%, transparent 70%)' }} />
        <div className="hero-orb-2 absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.20) 0%, transparent 70%)' }} />
        <div className="hero-orb-3 absolute top-[35%] right-[15%] w-[350px] h-[350px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(217,70,239,0.13) 0%, transparent 70%)' }} />
      </div>

      {/* Grid overlay */}
      <div className="hero-grid absolute inset-0 pointer-events-none opacity-50" />

      {/* ── Main hero content ── */}
      <div className="relative z-10 flex-1 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16 w-full">

          {/* Announcement ticker */}
          <div className="rounded-2xl mb-8 border border-violet-500/20" style={{ overflow:'hidden', width:'100%', background: 'linear-gradient(90deg, rgba(124,58,237,0.12), rgba(217,70,239,0.08), rgba(6,182,212,0.06))' }}>
            <div className="ticker-track py-2.5">
              {ticker.map((item, i) => (
                <span key={i} className="flex items-center gap-6 px-6 text-xs font-bold text-gray-300 whitespace-nowrap">
                  {item}
                  <span className="text-violet-500/40">✦</span>
                </span>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-center">

            {/* ── LEFT ── */}
            <div>
              {/* Top badge */}
              <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="inline-flex items-center gap-2 mb-7 px-4 py-2 rounded-full"
                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.28)' }}>
                <span className="w-2 h-2 bg-red-400 rounded-full live-dot flex-shrink-0" />
                <span className="text-red-400 text-sm font-black">{badgeText}</span>
                <span className="hidden sm:block text-gray-600">•</span>
                <span className="hidden sm:block text-gray-500 text-xs font-semibold">50K+ Students</span>
              </motion.div>

              {/* Main headline */}
              <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
                <h1 className="font-black leading-[1.04] tracking-tight mb-6"
                  style={{ fontSize: 'clamp(2.2rem, 7vw, 5.5rem)' }}>
                  <span className="gradient-shift-text">{headline}</span>
                </h1>
              </motion.div>

              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="text-lg text-gray-400 mb-8 leading-relaxed max-w-xl">
                {subheadline}
              </motion.p>

              {/* Feature checklist */}
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}
                className="grid grid-cols-1 xs:grid-cols-2 gap-2.5 mb-9">
                {features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm text-gray-300">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(124,58,237,0.2)' }}>
                      <CheckCircle2 className="w-3.5 h-3.5 text-violet-400" />
                    </div>
                    {f}
                  </div>
                ))}
              </motion.div>

              {/* CTAs */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
                className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link href="/register" className="btn-primary text-base px-9 py-4 group">
                  Start Learning Free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button className="btn-outline text-sm px-6 py-4 group">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                    style={{ background: 'rgba(124,58,237,0.2)' }}>
                    <Play className="w-3.5 h-3.5 ml-0.5 text-violet-400" />
                  </div>
                  Watch Demo
                </button>
              </motion.div>

              {/* Social proof */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.42 }}
                className="flex items-center gap-4 flex-wrap">
                <div className="flex -space-x-2.5">
                  {['RS', 'PK', 'AM', 'SJ', 'NK', 'VG'].map((a, i) => (
                    <div key={i} className="w-9 h-9 rounded-full border-2 border-[#04050a] flex items-center justify-center text-[10px] font-black text-white"
                      style={{ background: `hsl(${i * 45 + 210},70%,52%)` }}>{a}</div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                    <span className="text-amber-400 font-black text-sm ml-1">4.9</span>
                  </div>
                  <p className="text-gray-500 text-xs mt-0.5">Trusted by 50,000+ learners across India</p>
                </div>
              </motion.div>

              {/* Mobile-only hero visual */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.54, duration: 0.6, ease: [0.23,1,0.32,1] }}
                className="lg:hidden mt-8 rounded-2xl overflow-hidden"
                style={{ background: 'linear-gradient(160deg, #0d1020, #0a0c18)', border: '1px solid rgba(124,58,237,0.28)', boxShadow: '0 8px 40px rgba(124,58,237,0.12)' }}
              >
                <div className="flex items-center justify-between px-4 py-3"
                  style={{ background: 'linear-gradient(90deg, rgba(124,58,237,0.18), rgba(79,70,229,0.12))' }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(124,58,237,0.25)' }}>
                      <Video className="w-4 h-4 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-white font-black text-xs">{liveClassTitle}</p>
                      <p className="text-gray-500 text-[10px]">with {liveClassMentor}</p>
                    </div>
                  </div>
                  <span className="live-badge text-[10px] px-2 py-0.5 flex-shrink-0">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full live-dot" />LIVE
                  </span>
                </div>
                <div className="relative aspect-video" style={{ background: '#000' }}>
                  <video
                    ref={videoRef1}
                    className="absolute inset-0 w-full h-full object-cover"
                    src={heroVideoUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold text-gray-300 z-10"
                    style={{ background:'rgba(0,0,0,0.65)', backdropFilter:'blur(8px)' }}>
                    <Users className="w-3 h-3 text-violet-400" />{liveClassViewers}
                  </div>
                  <button onClick={toggleMute}
                    className="absolute bottom-3 right-3 z-10 w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                    style={{ background:'rgba(0,0,0,0.65)', backdropFilter:'blur(8px)' }}>
                    {muted ? <VolumeX className="w-3.5 h-3.5 text-gray-400" /> : <Volume2 className="w-3.5 h-3.5 text-violet-400" />}
                  </button>
                </div>
                <div className="grid grid-cols-3 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  {[
                    { val: '₹15K', label: 'Avg. Earned', color: 'text-green-400' },
                    { val: '4.9★', label: 'Rating', color: 'text-amber-400' },
                    { val: '20K+', label: 'Certified', color: 'text-violet-400' },
                  ].map((s, i) => (
                    <div key={i} className="py-3" style={{ borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                      <p className={`font-black text-sm ${s.color}`}>{s.val}</p>
                      <p className="text-gray-600 text-[10px]">{s.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* ── RIGHT — 3D Live class visual ── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.7, ease: [0.23,1,0.32,1] }}
              className="hidden lg:block relative"
            >
              <div className="absolute -inset-8 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(ellipse, rgba(124,58,237,0.2) 0%, transparent 70%)', filter:'blur(20px)' }} />

              <div className="animated-border relative">
                <div className="rounded-[22px] overflow-hidden"
                  style={{ background: 'linear-gradient(160deg, #0d1020, #0a0c18)' }}>

                  <div className="flex items-center justify-between px-5 py-4"
                    style={{ background: 'linear-gradient(90deg, rgba(124,58,237,0.18), rgba(79,70,229,0.12))' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(124,58,237,0.25)' }}>
                        <Video className="w-5 h-5 text-violet-400" />
                      </div>
                      <div>
                        <p className="text-white font-black text-sm">{liveClassTitle}</p>
                        <p className="text-gray-500 text-xs">with {liveClassMentor}</p>
                      </div>
                    </div>
                    <span className="live-badge">
                      <span className="w-1.5 h-1.5 bg-red-400 rounded-full live-dot" />LIVE
                    </span>
                  </div>

                  <div className="relative aspect-video" style={{ background: '#000' }}>
                    <video
                      ref={videoRef2}
                      className="absolute inset-0 w-full h-full object-cover"
                      src={heroVideoUrl}
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                    <div className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-300 z-10"
                      style={{ background:'rgba(0,0,0,0.65)', backdropFilter:'blur(8px)' }}>
                      <Users className="w-3.5 h-3.5 text-violet-400" />{liveClassViewers}
                    </div>
                    <button onClick={toggleMute}
                      className="absolute bottom-4 right-4 z-10 w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                      style={{ background:'rgba(0,0,0,0.65)', backdropFilter:'blur(8px)' }}>
                      {muted ? <VolumeX className="w-4 h-4 text-gray-400" /> : <Volume2 className="w-4 h-4 text-violet-400" />}
                    </button>
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs text-gray-400 z-10"
                      style={{ background:'rgba(0,0,0,0.65)', backdropFilter:'blur(8px)' }}>
                      <Flame className="w-3 h-3 text-orange-400" />Trending
                    </div>
                  </div>

                  <div className="p-4 space-y-2 border-t" style={{ borderColor:'rgba(255,255,255,0.06)' }}>
                    {chatMessages.map((msg, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <span className={`font-black ${msg.c} flex-shrink-0`}>{msg.u}:</span>
                        <span className="text-gray-400">{msg.m}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating — Certificate */}
              <div className="absolute -top-6 -right-6 float rounded-2xl px-4 py-3 shadow-2xl z-20"
                style={{ background:'linear-gradient(135deg,#1a1f38,#131826)', border:'1px solid rgba(245,158,11,0.2)', boxShadow:'0 8px 32px rgba(0,0,0,0.4)' }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'rgba(245,158,11,0.2)' }}>
                    <Award className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-white font-black text-sm">Certificate</p>
                    <p className="text-gray-500 text-xs">AI-Generated ✦ Instant</p>
                  </div>
                </div>
              </div>

              {/* Floating — Earnings */}
              <div className="absolute -bottom-6 -left-6 float-2 rounded-2xl px-4 py-3 shadow-2xl z-20"
                style={{ background:'linear-gradient(135deg,#0f1f18,#0a1412)', border:'1px solid rgba(16,185,129,0.2)', boxShadow:'0 8px 32px rgba(0,0,0,0.4)' }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'rgba(16,185,129,0.2)' }}>
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white font-black text-sm">₹15,000</p>
                    <p className="text-gray-500 text-xs">Partner Earned</p>
                  </div>
                </div>
              </div>

              {/* Floating — Students */}
              <div className="absolute top-1/2 -left-8 -translate-y-1/2 float-3 rounded-2xl px-3 py-2.5 z-20"
                style={{ background:'linear-gradient(135deg,#160c2d,#0e0a1e)', border:'1px solid rgba(217,70,239,0.2)', boxShadow:'0 8px 32px rgba(0,0,0,0.4)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:'rgba(217,70,239,0.2)' }}>
                    <Sparkles className="w-4 h-4 text-fuchsia-400" />
                  </div>
                  <div>
                    <p className="text-white font-black text-xs">50K+</p>
                    <p className="text-gray-600 text-[10px]">Learners</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── STATS BAR ── */}
          <motion.div initial={{ opacity:0, y:28 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.52 }}
            className="mt-12 md:mt-16 grid grid-cols-2 md:grid-cols-4 gap-3">
            {heroStats.map((s, i) => (
              <div key={i}
                className="flex items-center gap-3 rounded-2xl p-3 sm:p-4 transition-all duration-300 hover:-translate-y-1 cursor-default group"
                style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110"
                  style={{ background: s.glowColor }}>
                  <s.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${s.iconColor}`} />
                </div>
                <div>
                  <p className="text-white font-black text-lg sm:text-xl leading-tight">{s.val}</p>
                  <p className="text-gray-500 text-[10px] sm:text-xs">{s.label}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
