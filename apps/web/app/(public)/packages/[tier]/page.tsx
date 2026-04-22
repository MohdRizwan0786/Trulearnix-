'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { packageAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import toast from 'react-hot-toast'
import {
  Check, Zap, Shield, Award, Users, TrendingUp, Star,
  ArrowLeft, Loader2, Crown, Sparkles, BadgeCheck,
  BookOpen, Video, Bot, Briefcase, Globe, Clock, Gift, ChevronRight,
  ChevronDown, Play, Flame, Target, Trophy, Lock, Rocket, Heart,
  CheckCircle2, ArrowRight, Infinity as InfinityIcon, DollarSign, GraduationCap, PhoneCall
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

declare global { interface Window { Razorpay: any } }

/* ── Dynamic palette by index ─────────────────────────────── */
const PALETTE_DETAIL = [
  {
    emoji: '🚀', headerGrad: 'linear-gradient(135deg,#020818 0%,#0f2044 40%,#1d4ed8 80%,#2563eb 100%)',
    accentColor: '#60a5fa', accentColor2: '#93c5fd',
    glowColor: 'rgba(59,130,246,0.4)', borderColor: 'rgba(59,130,246,0.45)',
    btnGrad: 'linear-gradient(135deg,#1d4ed8,#0284c7)', btnGlow: '0 8px 40px rgba(59,130,246,0.55)',
    particleColor: '#3b82f6', bgPattern: 'radial-gradient(ellipse at 20% 80%,rgba(59,130,246,0.15) 0%,transparent 60%)',
  },
  {
    emoji: '⚡', headerGrad: 'linear-gradient(135deg,#0d0020 0%,#2d0f44 40%,#7c3aed 80%,#6366f1 100%)',
    accentColor: '#c4b5fd', accentColor2: '#e879f9',
    glowColor: 'rgba(124,58,237,0.45)', borderColor: 'rgba(124,58,237,0.65)',
    btnGrad: 'linear-gradient(135deg,#7c3aed,#d946ef,#6366f1)', btnGlow: '0 8px 40px rgba(124,58,237,0.65)',
    particleColor: '#8b5cf6', bgPattern: 'radial-gradient(ellipse at 20% 80%,rgba(124,58,237,0.2) 0%,transparent 60%)',
  },
  {
    emoji: '👑', headerGrad: 'linear-gradient(135deg,#1a0800 0%,#3a0d00 40%,#d97706 80%,#b45309 100%)',
    accentColor: '#fcd34d', accentColor2: '#fb923c',
    glowColor: 'rgba(245,158,11,0.4)', borderColor: 'rgba(245,158,11,0.5)',
    btnGrad: 'linear-gradient(135deg,#d97706,#ea580c)', btnGlow: '0 8px 40px rgba(245,158,11,0.55)',
    particleColor: '#f59e0b', bgPattern: 'radial-gradient(ellipse at 20% 80%,rgba(245,158,11,0.15) 0%,transparent 60%)',
  },
  {
    emoji: '💎', headerGrad: 'linear-gradient(135deg,#001a1a 0%,#022020 40%,#0d9488 80%,#0891b2 100%)',
    accentColor: '#34d399', accentColor2: '#22d3ee',
    glowColor: 'rgba(6,182,212,0.4)', borderColor: 'rgba(6,182,212,0.5)',
    btnGrad: 'linear-gradient(135deg,#0d9488,#0891b2)', btnGlow: '0 8px 40px rgba(6,182,212,0.55)',
    particleColor: '#06b6d4', bgPattern: 'radial-gradient(ellipse at 20% 80%,rgba(6,182,212,0.15) 0%,transparent 60%)',
  },
  {
    emoji: '🌟', headerGrad: 'linear-gradient(135deg,#1a0020 0%,#3b0764 40%,#e11d48 80%,#db2777 100%)',
    accentColor: '#fb7185', accentColor2: '#f472b6',
    glowColor: 'rgba(225,29,72,0.4)', borderColor: 'rgba(225,29,72,0.5)',
    btnGrad: 'linear-gradient(135deg,#e11d48,#db2777)', btnGlow: '0 8px 40px rgba(225,29,72,0.55)',
    particleColor: '#f43f5e', bgPattern: 'radial-gradient(ellipse at 20% 80%,rgba(225,29,72,0.15) 0%,transparent 60%)',
  },
]

function makeCfg(pkg: any, index: number) {
  const p = PALETTE_DETAIL[index % PALETTE_DETAIL.length]
  return {
    ...p,
    name: pkg?.name || 'Plan',
    tagline: pkg?.description || 'Accelerate your learning journey',
    subTagline: pkg?.description || 'Everything you need to succeed',
    badgeText: pkg?.badge ? `✨ ${pkg.badge}` : '',
    highlight: false,
  }
}

/* ── Feature icons ───────────────────────────────────────── */
const FEATURE_ICONS: Record<string, any> = {
  'All course': BookOpen, 'Live class': Video, 'AI Coach': Bot,
  'Job Engine': Briefcase, 'Community': Users, 'Earn': TrendingUp,
  'Income': TrendingUp, 'Mentor': Star, 'Personal brand': Globe,
  'Certificate': Award, 'WhatsApp': Gift, 'Analytics': Zap,
  'Dedicated': Crown, 'Mastermind': Sparkles, 'Lifetime': InfinityIcon,
  'Priority': Shield, 'Done-For-You': BadgeCheck, 'Early access': Rocket,
  'Quiz': Trophy, 'Assignment': Target, 'default': CheckCircle2,
}

function getIcon(feature: string) {
  for (const [key, Icon] of Object.entries(FEATURE_ICONS)) {
    if (feature.toLowerCase().includes(key.toLowerCase())) return Icon
  }
  return CheckCircle2
}

/* ── Floating particles ──────────────────────────────────── */
function Particles({ color }: { color: string }) {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 8 + 6,
    delay: Math.random() * 4,
  }))
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <motion.div key={p.id}
          className="absolute rounded-full"
          style={{ width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%`, background: color, opacity: 0.25 }}
          animate={{ y: [-20, 20, -20], opacity: [0.1, 0.35, 0.1], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

/* ── Animated number ─────────────────────────────────────── */
function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting && !started) setStarted(true) }, { threshold: 0.5 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [started])

  useEffect(() => {
    if (!started) return
    let start = 0
    const step = value / 40
    const t = setInterval(() => {
      start += step
      if (start >= value) { setDisplay(value); clearInterval(t) }
      else setDisplay(Math.floor(start))
    }, 35)
    return () => clearInterval(t)
  }, [started, value])

  return <span ref={ref}>{prefix}{display.toLocaleString()}{suffix}</span>
}

/* ── Earnings Calculator ─────────────────────────────────── */
function EarningsCalc({ rate, accentColor, accentColor2 }: { rate: number; accentColor: string; accentColor2: string }) {
  const [referrals, setReferrals] = useState(10)
  const [tier, setTier] = useState(9999)
  const monthly = referrals * tier * (rate / 100)
  const yearly = monthly * 12

  return (
    <div className="rounded-3xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div className="px-6 py-5 sm:px-8 sm:py-6" style={{ background: `linear-gradient(135deg,${accentColor}12,${accentColor2}08)`, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: accentColor + '20' }}>
            <TrendingUp className="w-5 h-5" style={{ color: accentColor }} />
          </div>
          <div>
            <h3 className="text-white font-black text-base">Income Calculator</h3>
            <p className="text-gray-500 text-xs">Estimate your monthly earnings</p>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        <div>
          <div className="flex justify-between text-xs mb-3">
            <span className="text-gray-400 font-medium">People you help join per month</span>
            <span className="font-black text-white text-sm">{referrals} people</span>
          </div>
          <div className="relative">
            <input type="range" min={1} max={100} value={referrals} onChange={e => setReferrals(+e.target.value)}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{ background: `linear-gradient(to right,${accentColor} ${referrals}%,rgba(255,255,255,0.1) ${referrals}%)` }} />
          </div>
          <div className="flex justify-between text-[10px] text-gray-600 mt-1.5"><span>1</span><span>100</span></div>
        </div>

        <div>
          <p className="text-gray-400 text-xs font-medium mb-3">Avg. package value they buy</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[4999, 9999, 19999, 29999].map(v => (
              <button key={v} onClick={() => setTier(v)}
                className="py-2.5 rounded-xl text-xs font-black transition-all hover:scale-105 active:scale-95"
                style={{
                  background: tier === v ? `linear-gradient(135deg,${accentColor}25,${accentColor2}15)` : 'rgba(255,255,255,0.04)',
                  border: `1.5px solid ${tier === v ? accentColor : 'rgba(255,255,255,0.06)'}`,
                  color: tier === v ? accentColor : '#6b7280',
                  boxShadow: tier === v ? `0 4px 16px ${accentColor}30` : 'none',
                }}>
                ₹{(v / 1000).toFixed(0)}K
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-4 text-center" style={{ background: accentColor + '10', border: `1px solid ${accentColor}25` }}>
            <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">Monthly</p>
            <p className="font-black text-lg leading-none" style={{ color: accentColor }}>
              ₹{monthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="rounded-2xl p-4 text-center" style={{ background: accentColor2 + '10', border: `1px solid ${accentColor2}25` }}>
            <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">Yearly</p>
            <p className="font-black text-lg leading-none" style={{ color: accentColor2 }}>
              ₹{yearly.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-gray-600 text-xs">{rate}% commission rate × {referrals} people × ₹{tier.toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}

/* ── FAQ ─────────────────────────────────────────────────── */
const FAQS = [
  { q: 'Can I upgrade my plan later?', a: 'Yes! You can upgrade anytime and only pay the difference. Your learning progress is always saved.' },
  { q: 'How does the Partner Program work?', a: 'Share your personal partner link. Every time someone joins through it, you earn income instantly — no selling skills required, just help others learn.' },
  { q: 'Can I pay in EMI?', a: 'Yes, EMI options are available via Razorpay (3–12 months, 0% interest on select plans). Choose at checkout.' },
  { q: 'Do I get lifetime access?', a: 'Yes! All courses, content, and updates are accessible for lifetime once enrolled. No expiry.' },
  { q: 'Is there a mobile app?', a: 'The platform is fully mobile responsive. A dedicated app is coming soon for an even better experience.' },
]

function FAQItem({ q, a, accentColor }: { q: string; a: string; accentColor: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-2xl overflow-hidden transition-all" style={{ border: `1px solid ${open ? accentColor + '30' : 'rgba(255,255,255,0.07)'}`, background: open ? accentColor + '05' : 'rgba(255,255,255,0.02)' }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 sm:py-5 text-left gap-4 transition-colors hover:bg-white/5">
        <span className="text-white font-bold text-sm sm:text-base">{q}</span>
        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
          style={{ background: open ? accentColor + '25' : 'rgba(255,255,255,0.06)', color: open ? accentColor : '#6b7280' }}>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
            <div className="px-5 pb-5 text-gray-400 text-sm leading-relaxed">{a}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── What happens next steps ─────────────────────────────── */
function JourneyStep({ step, title, desc, icon: Icon, accentColor, delay }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }} viewport={{ once: true }}
      className="flex gap-4 items-start">
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 font-black text-sm"
          style={{ background: accentColor + '20', color: accentColor, border: `1.5px solid ${accentColor}35` }}>
          {step}
        </div>
        {step < 4 && <div className="w-0.5 h-8 mt-2" style={{ background: `linear-gradient(to bottom,${accentColor}40,transparent)` }} />}
      </div>
      <div className="pb-8">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="w-4 h-4" style={{ color: accentColor }} />
          <p className="text-white font-black text-sm">{title}</p>
        </div>
        <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  )
}

/* ── Main page ───────────────────────────────────────────── */
export default function PackageDetailPage({ params }: { params: { tier: string } }) {
  const [pkg, setPkg] = useState<any>(null)
  const [allPkgs, setAllPkgs] = useState<any[]>([])
  const [pkgIndex, setPkgIndex] = useState(0)
  const [buying, setBuying] = useState(false)
  const [showStickyBuy, setShowStickyBuy] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)
  const { user, isAuthenticated, _hasHydrated } = useAuthStore()
  const router = useRouter()
  const cfg = makeCfg(pkg, pkgIndex)

  useEffect(() => {
    // params.tier is the package _id
    packageAPI.getAll().then(res => {
      const pkgs = (res.data?.packages || []).filter((p: any) => p.isActive)
      setAllPkgs(pkgs)
      const idx = pkgs.findIndex((p: any) => p._id === params.tier)
      if (idx >= 0) { setPkg(pkgs[idx]); setPkgIndex(idx) }
    }).catch(() => { })
  }, [params.tier])

  // Sticky buy button on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const bottom = heroRef.current.getBoundingClientRect().bottom
        setShowStickyBuy(bottom < 0)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleBuy = () => {
    if (!_hasHydrated) return
    if (!isAuthenticated()) return router.push(`/login?redirect=/checkout?type=package%26packageId=${params.tier}`)
    router.push(`/checkout?type=package&packageId=${params.tier}`)
  }

  const price = pkg?.price || 0
  const originalPrice = pkg?.originalPrice || price
  const discount = originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : 0
  const features: string[] = pkg?.features || []

  const BuyBtn = ({ full = true, size = 'lg', label }: { full?: boolean; size?: 'lg' | 'sm'; label?: string }) => (
    <button onClick={handleBuy} disabled={buying}
      className={`group relative flex items-center justify-center gap-2 rounded-2xl font-black text-white transition-all hover:scale-[1.02] active:scale-[0.97] disabled:opacity-70 overflow-hidden ${full ? 'w-full' : ''} ${size === 'lg' ? 'py-4 px-6 text-base' : 'py-3 px-5 text-sm'}`}
      style={{ background: cfg.btnGrad, boxShadow: cfg.btnGlow }}>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(255,255,255,0.1)' }} />
      {buying
        ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
        : <><Zap className="w-4 h-4" /> {label || `Get ${cfg.name} — ₹${price.toLocaleString()}`}</>}
    </button>
  )

  return (
    <div style={{ background: '#04050a' }} className="min-h-screen">
      <Navbar />

      {/* ── HERO ── */}
      <div ref={heroRef} className="relative overflow-hidden pt-16">
        {/* Background layers */}
        <div className="absolute inset-0" style={{ background: cfg.headerGrad }} />
        <div className="absolute inset-0" style={{ background: cfg.bgPattern }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 100%,rgba(0,0,0,0.7) 0%,transparent 70%)' }} />
        <Particles color={cfg.particleColor} />

        {/* Decorative blobs */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: cfg.accentColor + '08', filter: 'blur(80px)' }} />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full pointer-events-none" style={{ background: cfg.accentColor2 + '08', filter: 'blur(60px)' }} />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-14 md:pb-20">
          {/* Back link */}
          <Link href="/pricing" className="inline-flex items-center gap-1.5 text-white/50 hover:text-white text-sm mb-8 transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to all plans
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left */}
            <div>
              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-2 mb-6">
                {cfg.badgeText && (
                  <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', color: 'white', border: '1px solid rgba(255,255,255,0.25)' }}>
                    {cfg.badgeText}
                  </motion.span>
                )}
                {discount > 0 && (
                  <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
                    className="inline-flex items-center gap-1 text-xs font-black px-3 py-1.5 rounded-full"
                    style={{ background: 'rgba(74,222,128,0.18)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.35)' }}>
                    <Flame className="w-3 h-3" /> {discount}% OFF
                  </motion.span>
                )}
              </div>

              {/* Emoji */}
              <motion.div initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="text-7xl sm:text-8xl mb-5 inline-block select-none"
                style={{ filter: `drop-shadow(0 16px 40px ${cfg.glowColor})` }}>
                {cfg.emoji}
              </motion.div>

              {/* Title */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <h1 className="font-black text-white leading-none mb-2">
                  <span className="block text-5xl sm:text-6xl md:text-7xl">{cfg.name}</span>
                  <span className="block text-2xl sm:text-3xl font-bold mt-1.5" style={{ color: cfg.accentColor }}>Plan</span>
                </h1>
                <p className="text-white/60 text-base sm:text-lg mt-3 mb-8 max-w-sm leading-relaxed">{cfg.subTagline}</p>
              </motion.div>

              {/* Price */}
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="flex items-baseline gap-3 mb-2">
                <span className="font-black text-white" style={{ fontSize: '3.8rem', lineHeight: 1 }}>
                  ₹{price.toLocaleString()}
                </span>
                {originalPrice > price && (
                  <div className="flex flex-col">
                    <span className="text-white/35 text-lg line-through">₹{originalPrice.toLocaleString()}</span>
                    <span className="text-xs font-bold" style={{ color: '#4ade80' }}>You save ₹{(originalPrice - price).toLocaleString()}</span>
                  </div>
                )}
              </motion.div>
              <p className="text-gray-500 text-xs mb-8">One-time payment • Lifetime access</p>

              {/* CTA Buttons */}
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-3 mb-5">
                <BuyBtn />
                {pkgIndex > 0 && allPkgs[pkgIndex - 1] && (
                  <Link href={`/packages/${allPkgs[pkgIndex - 1]._id}`}
                    className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-bold text-sm text-gray-300 hover:text-white transition-all hover:bg-white/10"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <ArrowLeft className="w-4 h-4" /> See {allPkgs[pkgIndex - 1].name} Plan
                  </Link>
                )}
              </motion.div>

              {/* Trust badges */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-blue-400" /> Secure checkout</span>
                <span className="flex items-center gap-1.5"><InfinityIcon className="w-3.5 h-3.5 text-purple-400" /> Lifetime access</span>
              </motion.div>
            </div>

            {/* Right — feature highlights card */}
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.6 }}>
              <div className="rounded-3xl overflow-hidden"
                style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(24px)', border: `1px solid ${cfg.borderColor}` }}>
                <div className="px-6 py-5 sm:px-7" style={{ background: `linear-gradient(135deg,${cfg.accentColor}15,transparent)`, borderBottom: `1px solid ${cfg.borderColor}40` }}>
                  <p className="text-xs font-black uppercase tracking-widest" style={{ color: cfg.accentColor }}>What&apos;s included</p>
                </div>
                <div className="p-6 sm:p-7">
                  <ul className="space-y-3.5">
                    {features.slice(0, 9).map((f, i) => {
                      const Icon = getIcon(f)
                      return (
                        <motion.li key={i} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + i * 0.05 }}
                          className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: cfg.accentColor + '18', border: `1px solid ${cfg.accentColor}25` }}>
                            <Icon className="w-4 h-4" style={{ color: cfg.accentColor }} />
                          </div>
                          <span className="text-gray-200 text-sm font-medium">{f}</span>
                        </motion.li>
                      )
                    })}
                    {features.length > 9 && (
                      <li className="flex items-center gap-2 pl-11">
                        <span className="text-xs font-black" style={{ color: cfg.accentColor }}>+{features.length - 9} more features ↓</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="relative h-12 -mb-1">
          <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute bottom-0 w-full" preserveAspectRatio="none">
            <path d="M0 48L60 42.7C120 37.3 240 26.7 360 21.3C480 16 600 16 720 21.3C840 26.7 960 37.3 1080 40C1200 42.7 1320 37.3 1380 34.7L1440 32V48H1380C1320 48 1200 48 1080 48C960 48 840 48 720 48C600 48 480 48 360 48C240 48 120 48 60 48H0Z" fill="#04050a" />
          </svg>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 space-y-16 sm:space-y-20">

        {/* Stats row */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 -mt-2">
          {[
            { val: pkg?.commissionRate || 0, suffix: '%', label: 'Income Rate', icon: TrendingUp, prefix: '' },
            { val: pkg?.statCourses || 500, suffix: '+', label: 'Courses Access', icon: BookOpen, prefix: '' },
            { val: pkg?.statMembers || 10000, suffix: '+', label: 'Active Members', icon: Users, prefix: '' },
            { val: 100, suffix: '%', label: 'Lifetime Access', icon: Shield, prefix: '' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }} viewport={{ once: true }}
              className="rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-center group hover:scale-[1.03] transition-transform cursor-default"
              style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${cfg.borderColor}`, boxShadow: `0 0 0 0 ${cfg.glowColor}` }}
              whileHover={{ boxShadow: `0 0 30px ${cfg.glowColor}` }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: cfg.accentColor + '15' }}>
                <s.icon className="w-4 h-4" style={{ color: cfg.accentColor }} />
              </div>
              <p className="font-black text-white text-xl sm:text-2xl leading-none">
                <AnimatedNumber value={s.val} prefix={s.prefix} suffix={s.suffix} />
              </p>
              <p className="text-gray-500 text-xs mt-1.5 font-medium">{s.label}</p>
            </motion.div>
          ))}
        </section>

        {/* All features grid */}
        <section>
          <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8">
            <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: cfg.accentColor }}>Full Feature List</p>
            <h2 className="text-2xl sm:text-3xl font-black text-white">Everything in {cfg.name}</h2>
            <p className="text-gray-500 text-sm mt-2">All features included in your plan from day one</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {features.map((f, i) => {
              const Icon = getIcon(f)
              return (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.5) }} viewport={{ once: true }}
                  className="group flex items-center gap-3.5 p-4 rounded-2xl transition-all hover:scale-[1.02]"
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
                  whileHover={{ background: cfg.accentColor + '08', borderColor: cfg.accentColor + '30' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                    style={{ background: cfg.accentColor + '15' }}
                  >
                    <Icon className="w-4.5 h-4.5" style={{ color: cfg.accentColor, width: 18, height: 18 }} />
                  </div>
                  <span className="text-gray-300 text-sm font-semibold group-hover:text-white transition-colors">{f}</span>
                  <CheckCircle2 className="w-4 h-4 ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: cfg.accentColor }} />
                </motion.div>
              )
            })}
          </div>
        </section>

        {/* Included Courses */}
        {(pkg?.courses || []).length > 0 && (
          <section>
            <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-6">
              <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: cfg.accentColor }}>Courses Included</p>
              <h2 className="text-2xl sm:text-3xl font-black text-white">What you&apos;ll learn</h2>
              <p className="text-gray-500 text-sm mt-2">{(pkg.courses || []).length} courses unlocked with this plan</p>
            </motion.div>

            {/* Mobile: horizontal snap slider | Desktop: grid */}
            <div
              className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as any}
            >
              {(pkg.courses || []).map((course: any, i: number) => (
                <div key={course._id}
                  className="group flex-shrink-0 w-[72vw] max-w-[280px] sm:w-auto sm:max-w-none snap-start rounded-2xl overflow-hidden transition-all hover:scale-[1.02] cursor-default"
                  style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${cfg.borderColor}40` }}
                >
                  {/* Thumbnail — 16:9 */}
                  {course.thumbnail ? (
                    <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16/9' }}>
                      <img src={course.thumbnail} alt={course.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      {course.status === 'published' && (
                        <span className="absolute top-2 right-2 text-[10px] font-black px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(74,222,128,0.2)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.4)' }}>
                          Live
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="w-full flex items-center justify-center" style={{ aspectRatio: '16/9', background: `linear-gradient(135deg,${cfg.accentColor}12,${(cfg.accentColor2 || cfg.accentColor)}08)` }}>
                      <BookOpen className="w-10 h-10 opacity-30" style={{ color: cfg.accentColor }} />
                    </div>
                  )}

                  <div className="p-3 sm:p-4">
                    {course.category && (
                      <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: cfg.accentColor }}>
                        {course.category}
                      </p>
                    )}
                    <p className="text-white font-bold text-sm leading-snug line-clamp-2">{course.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* What happens after purchase */}
        <section>
          <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8">
            <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: cfg.accentColor }}>Your Journey</p>
            <h2 className="text-2xl sm:text-3xl font-black text-white">What happens after you join?</h2>
            <p className="text-gray-500 text-sm mt-2">Simple 4-step process to start your transformation</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10">
            {(pkg?.journeySteps?.length > 0 ? pkg.journeySteps : [
              { title: 'Secure checkout in 60 seconds', desc: 'Pay safely with Razorpay. Cards, UPI, EMI — all options available.' },
              { title: 'Instant plan activation', desc: 'Your account is upgraded immediately. No wait time.' },
              { title: 'Enroll in courses free', desc: 'Browse the full catalog and self-enroll in anything you want.' },
              { title: 'Start earning as a partner', desc: 'Get your unique link and start earning income by helping others join.' },
            ]).map((step: any, i: number) => (
              <JourneyStep key={i} step={i + 1} icon={[CheckCircle2, Zap, BookOpen, TrendingUp][i] || CheckCircle2}
                accentColor={cfg.accentColor} delay={(i + 1) * 0.1}
                title={step.title} desc={step.desc} />
            ))}
          </div>
        </section>

        {/* Earnings calculator */}
        {pkg?.commissionRate > 0 && (
          <section>
            <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8">
              <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: cfg.accentColor }}>Partner Income</p>
              <h2 className="text-2xl sm:text-3xl font-black text-white">Calculate your earnings</h2>
              <p className="text-gray-500 text-sm mt-2">With {pkg.commissionRate}% income rate, see your potential</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <EarningsCalc rate={pkg.commissionRate} accentColor={cfg.accentColor} accentColor2={cfg.accentColor2} />
            </motion.div>
          </section>
        )}

        {/* EMI */}
        {pkg?.emiAvailable && (
          <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start sm:items-center"
            style={{ background: `linear-gradient(135deg,${cfg.accentColor}08,${cfg.accentColor2}05)`, border: `1px solid ${cfg.borderColor}` }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: cfg.accentColor + '20', border: `1px solid ${cfg.accentColor}30` }}>
              <Clock className="w-7 h-7" style={{ color: cfg.accentColor }} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl font-black text-white mb-1">Flexible EMI — ₹{(pkg.emiMonthlyAmount || 0).toLocaleString()} × {pkg.emiDays?.length || 1} installments</h3>
              <p className="text-gray-500 text-sm mb-4">Pay in easy installments. No extra interest charged.</p>
              <div className="flex flex-wrap gap-2">
                {(pkg.emiDays || []).map((day: number, i: number) => (
                  <div key={i} className="rounded-xl px-4 py-2.5 text-center"
                    style={{ background: cfg.accentColor + '12', border: `1px solid ${cfg.accentColor}25` }}>
                    <p className="font-black text-white text-base">₹{(pkg.emiMonthlyAmount || 0).toLocaleString()}</p>
                    <p className="text-[10px] mt-0.5 font-bold" style={{ color: cfg.accentColor }}>
                      {i === 0 ? 'Today' : `Day ${day}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {/* Compare plans */}
        {allPkgs.length > 0 && (
          <section>
            <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8">
              <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: cfg.accentColor }}>All Plans</p>
              <h2 className="text-2xl sm:text-3xl font-black text-white">Compare & choose</h2>
              <p className="text-gray-500 text-sm mt-2">Find the perfect plan for your goals</p>
            </motion.div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {allPkgs.map((p: any, i: number) => {
                const c = makeCfg(p, i)
                const isActive = p._id === params.tier
                return (
                  <motion.div key={p._id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }} viewport={{ once: true }}>
                    <Link href={`/packages/${p._id}`}
                      className="block rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-center transition-all hover:scale-[1.04]"
                      style={{
                        background: isActive ? `linear-gradient(135deg,${c.accentColor}15,${c.accentColor2}08)` : 'rgba(255,255,255,0.03)',
                        border: `1.5px solid ${isActive ? c.borderColor : 'rgba(255,255,255,0.07)'}`,
                        boxShadow: isActive ? `0 8px 32px ${c.glowColor}` : 'none',
                      }}>
                      <div className="text-3xl sm:text-4xl mb-2.5">{c.emoji}</div>
                      <p className="font-black text-white text-sm">{p.name}</p>
                      <p className="font-bold text-sm mt-1" style={{ color: c.accentColor }}>₹{p.price.toLocaleString()}</p>
                      {isActive && (
                        <span className="inline-block text-[10px] mt-2 px-2.5 py-1 rounded-full font-black"
                          style={{ background: c.accentColor + '20', color: c.accentColor }}>
                          Current Plan
                        </span>
                      )}
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          </section>
        )}

        {/* Testimonials */}
        {((pkg?.testimonials?.length > 0 ? pkg.testimonials : [
          { name: 'Rahul M.', role: 'Pro Member', avatar: 'R', text: 'The AI coach alone is worth the price. My skills improved 10x in just 2 months. Best investment I ever made!', rating: 5, earning: '₹18K/mo' },
          { name: 'Priya S.', role: 'Elite Member', avatar: 'P', text: 'Earning ₹45K/month through the Partner Program — just helping friends learn. Never thought it was possible!', rating: 5, earning: '₹45K/mo' },
          { name: 'Amit K.', role: 'Supreme Member', avatar: 'A', text: 'The dedicated success manager helped me build a 6-figure business online. Absolutely life-changing.', rating: 5, earning: '₹1.2L/mo' },
        ])).length > 0 && (
        <section>
          <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8">
            <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: cfg.accentColor }}>Success Stories</p>
            <h2 className="text-2xl sm:text-3xl font-black text-white">What our members say</h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(pkg?.testimonials?.length > 0 ? pkg.testimonials : [
              { name: 'Rahul M.', role: 'Pro Member', avatar: 'R', text: 'The AI coach alone is worth the price. My skills improved 10x in just 2 months. Best investment I ever made!', rating: 5, earning: '₹18K/mo' },
              { name: 'Priya S.', role: 'Elite Member', avatar: 'P', text: 'Earning ₹45K/month through the Partner Program — just helping friends learn. Never thought it was possible!', rating: 5, earning: '₹45K/mo' },
              { name: 'Amit K.', role: 'Supreme Member', avatar: 'A', text: 'The dedicated success manager helped me build a 6-figure business online. Absolutely life-changing.', rating: 5, earning: '₹1.2L/mo' },
            ]).map((t: any, i: number) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                className="rounded-3xl p-5 sm:p-6 flex flex-col"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />)}
                  <BadgeCheck className="w-4 h-4 ml-auto text-blue-400" />
                </div>
                <p className="text-gray-300 text-sm leading-relaxed flex-1 mb-5">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0"
                    style={{ background: cfg.btnGrad || '#7c3aed' }}>
                    {t.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-black">{t.name}</p>
                    <p className="text-gray-600 text-[10px]">{t.role}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-black text-sm" style={{ color: cfg.accentColor }}>{t.earning}</p>
                    <p className="text-gray-600 text-[10px]">earning</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
        )}

        {/* FAQ */}
        {((pkg?.faqs?.length > 0 ? pkg.faqs : FAQS)).length > 0 && (
        <section>
          <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8">
            <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: cfg.accentColor }}>FAQ</p>
            <h2 className="text-2xl sm:text-3xl font-black text-white">Got questions?</h2>
            <p className="text-gray-500 text-sm mt-2">Everything you need to know before joining</p>
          </motion.div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {(pkg?.faqs?.length > 0 ? pkg.faqs : FAQS).map((f: any, i: number) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }} viewport={{ once: true }}>
                <FAQItem q={f.q} a={f.a} accentColor={cfg.accentColor} />
              </motion.div>
            ))}
          </div>
        </section>
        )}

        {/* Final CTA */}
        <motion.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="rounded-3xl sm:rounded-[2rem] overflow-hidden relative"
          style={{ background: cfg.headerGrad }}>
          <Particles color={cfg.particleColor} />
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.35)' }} />
          <div className="relative px-6 py-12 sm:px-12 sm:py-16 text-center">
            <motion.div initial={{ scale: 0.8 }} whileInView={{ scale: 1 }} viewport={{ once: true }}
              className="text-6xl sm:text-7xl mb-5 inline-block"
              style={{ filter: `drop-shadow(0 12px 32px ${cfg.glowColor})` }}>
              {cfg.emoji}
            </motion.div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">Ready to go {cfg.name}?</h2>
            <p className="text-white/60 text-base mb-3 max-w-md mx-auto leading-relaxed">
              Join thousands of learners growing their skills and income with TruLearnix.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-white/50 mb-8">
              <span className="flex items-center gap-1.5"><InfinityIcon className="w-3.5 h-3.5 text-blue-400" /> Lifetime access</span>
              <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-yellow-400" /> Instant activation</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-xs mx-auto">
              <BuyBtn label={`Get ${cfg.name} Now`} />
            </div>
            <p className="text-white/35 text-xs mt-5">One-time payment of ₹{price.toLocaleString()} • No hidden charges</p>
          </div>
        </motion.section>

      </div>

      {/* ── Mobile sticky CTA bar ── */}
      <AnimatePresence>
        {(
          <motion.div
            initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
            className="lg:hidden fixed bottom-0 left-0 right-0 z-50"
            style={{ background: 'rgba(4,5,10,0.97)', backdropFilter: 'blur(24px)', borderTop: `1px solid ${cfg.borderColor}` }}>
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="text-2xl flex-shrink-0">{cfg.emoji}</div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-black text-base leading-none">₹{price.toLocaleString()}</p>
                {originalPrice > price && (
                  <p className="text-gray-600 text-xs mt-0.5">
                    <span className="line-through">₹{originalPrice.toLocaleString()}</span>
                    <span className="text-green-500 ml-1.5 font-bold">{discount}% off</span>
                  </p>
                )}
              </div>
              <button onClick={handleBuy} disabled={buying}
                className="flex items-center gap-2 px-5 py-3 rounded-xl font-black text-white text-sm transition-all active:scale-95 flex-shrink-0"
                style={{ background: cfg.btnGrad, boxShadow: cfg.btnGlow }}>
                {buying ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Zap className="w-4 h-4" /> Get Now</>}
              </button>
            </div>
            <div className="h-safe-area-inset-bottom" />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="lg:hidden h-20" />

      <Footer />
    </div>
  )
}
