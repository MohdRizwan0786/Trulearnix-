'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, Zap, TrendingUp, Gift, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import { packageAPI } from '@/lib/api'

/* ── Tier visual config ─────────────────────────────────── */
const TIER_META: Record<string, {
  emoji: string
  headerGrad: string
  accentColor: string
  glowColor: string
  borderColor: string
  badgeText: string | null
  badgeGrad: string
  btnGrad: string
  btnShadow: string
  highlight: boolean
}> = {
  free: {
    emoji: '🎓',
    headerGrad: 'linear-gradient(135deg,#1e1b4b,#312e81)',
    accentColor: '#818cf8',
    glowColor: 'rgba(99,102,241,0)',
    borderColor: 'rgba(99,102,241,0.2)',
    badgeText: null,
    badgeGrad: '',
    btnGrad: 'linear-gradient(135deg,#312e81,#1e1b4b)',
    btnShadow: '0 4px 16px rgba(99,102,241,0.25)',
    highlight: false,
  },
  starter: {
    emoji: '🚀',
    headerGrad: 'linear-gradient(135deg,#1e3a5f,#1d4ed8)',
    accentColor: '#60a5fa',
    glowColor: 'rgba(59,130,246,0.25)',
    borderColor: 'rgba(59,130,246,0.35)',
    badgeText: 'Starter',
    badgeGrad: 'linear-gradient(90deg,#1d4ed8,#0284c7)',
    btnGrad: 'linear-gradient(135deg,#1d4ed8,#0284c7)',
    btnShadow: '0 4px 20px rgba(59,130,246,0.4)',
    highlight: false,
  },
  pro: {
    emoji: '⚡',
    headerGrad: 'linear-gradient(135deg,#3b0764,#7c3aed,#4f46e5)',
    accentColor: '#c4b5fd',
    glowColor: 'rgba(124,58,237,0.35)',
    borderColor: 'rgba(124,58,237,0.6)',
    badgeText: '⚡ Most Popular',
    badgeGrad: 'linear-gradient(90deg,#7c3aed,#d946ef)',
    btnGrad: 'linear-gradient(135deg,#7c3aed,#d946ef,#6366f1)',
    btnShadow: '0 6px 28px rgba(124,58,237,0.55)',
    highlight: true,
  },
  elite: {
    emoji: '👑',
    headerGrad: 'linear-gradient(135deg,#451a03,#d97706,#b45309)',
    accentColor: '#fcd34d',
    glowColor: 'rgba(245,158,11,0.25)',
    borderColor: 'rgba(245,158,11,0.4)',
    badgeText: '👑 For Educators',
    badgeGrad: 'linear-gradient(90deg,#d97706,#ea580c)',
    btnGrad: 'linear-gradient(135deg,#d97706,#ea580c)',
    btnShadow: '0 4px 20px rgba(245,158,11,0.4)',
    highlight: false,
  },
  supreme: {
    emoji: '💎',
    headerGrad: 'linear-gradient(135deg,#042f2e,#0d9488,#0891b2)',
    accentColor: '#34d399',
    glowColor: 'rgba(6,182,212,0.25)',
    borderColor: 'rgba(6,182,212,0.4)',
    badgeText: '💎 Enterprise',
    badgeGrad: 'linear-gradient(90deg,#0d9488,#0891b2)',
    btnGrad: 'linear-gradient(135deg,#0d9488,#0891b2)',
    btnShadow: '0 4px 20px rgba(6,182,212,0.4)',
    highlight: false,
  },
}

const FALLBACK_PACKAGES: any[] = []

/* ── Single package card ────────────────────────────────── */
function PackageCard({ pkg, i }: { pkg: any; i: number }) {
  const [hovered, setHovered] = useState(false)
  const meta = TIER_META[pkg.tier] || TIER_META['pro']
  const price = pkg.price ?? 0
  const period = price === 0 ? '/ forever' : '/month'
  const features: string[] = pkg.features || []
  const isHighlight = meta.highlight

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.1, duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
      viewport={{ once: true }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative flex flex-col h-full rounded-[24px] overflow-hidden"
      style={{
        background: '#0b0d1a',
        border: `1.5px solid ${hovered || isHighlight ? meta.borderColor : 'rgba(255,255,255,0.08)'}`,
        boxShadow: hovered || isHighlight
          ? `0 0 0 1px ${meta.glowColor}, 0 24px 64px rgba(0,0,0,0.5), 0 0 80px ${meta.glowColor}`
          : '0 8px 32px rgba(0,0,0,0.4)',
        transition: 'border-color 0.3s, box-shadow 0.3s',
      }}
    >
      {/* Animated border top strip */}
      <div className="h-1.5 w-full flex-shrink-0" style={{
        background: isHighlight
          ? 'linear-gradient(90deg,#7c3aed,#d946ef,#06b6d4,#7c3aed)'
          : `linear-gradient(90deg,${meta.accentColor},transparent 80%)`,
        backgroundSize: isHighlight ? '300% 100%' : 'auto',
        animation: isHighlight ? 'border-run 3s ease infinite' : 'none',
      }} />

      {/* ── HEADER BLOCK ── */}
      <div className="relative overflow-hidden px-6 pt-8 pb-6 flex-shrink-0"
        style={{ background: meta.headerGrad }}>
        {/* decorative orb */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full pointer-events-none"
          style={{ background: 'rgba(255,255,255,0.04)' }} />

        {/* Badge — top right */}
        {meta.badgeText && (
          <div className="absolute top-4 right-4 text-[10px] font-black px-3 py-1.5 rounded-full text-white"
            style={{ background: meta.badgeGrad, boxShadow: `0 4px 16px ${meta.glowColor}` }}>
            {meta.badgeText}
          </div>
        )}

        {/* Emoji */}
        <motion.div
          animate={hovered ? { scale: 1.18, y: -4 } : { scale: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          className="text-5xl mb-4 inline-block"
          style={{ filter: `drop-shadow(0 6px 20px rgba(0,0,0,0.4))` }}>
          {meta.emoji}
        </motion.div>

        {/* Plan name + desc */}
        <h3 className="text-2xl font-black text-white mb-1">{pkg.name || pkg.tier}</h3>
        <p className="text-white/60 text-xs leading-relaxed">{pkg.description || 'Perfect for your journey'}</p>

        {/* Price */}
        <div className="flex items-baseline gap-1.5 mt-5">
          <span className="font-black leading-none text-white" style={{ fontSize: '2.8rem' }}>
            {price === 0 ? '₹0' : `₹${price.toLocaleString()}`}
          </span>
          <span className="text-white/50 text-sm">{period}</span>
          {pkg.originalPrice && pkg.originalPrice > price && (
            <>
              <span className="text-white/30 text-sm line-through ml-1">₹{pkg.originalPrice.toLocaleString()}</span>
              <span className="text-xs font-black px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(74,222,128,0.2)', color: '#4ade80' }}>
                {Math.round((1 - price / pkg.originalPrice) * 100)}% off
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="flex flex-col flex-1 px-6 py-5">

        {/* Commission badge */}
        {pkg.commissionRate > 0 && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-xl"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <TrendingUp className="w-4 h-4 text-green-400 flex-shrink-0" />
            <span className="text-green-400 text-xs font-bold">Earn {pkg.commissionRate}% income share — help others learn</span>
          </div>
        )}

        {/* Features — ALL visible, no truncation */}
        <ul className="space-y-2.5 flex-1 mb-6">
          {features.map((f: string, j: number) => (
            <li key={j} className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: `${meta.glowColor || 'rgba(255,255,255,0.05)'}` || 'rgba(255,255,255,0.06)', minWidth: '20px' }}>
                <Check className="w-3 h-3" style={{ color: meta.accentColor }} />
              </div>
              <span className="text-sm text-gray-300 leading-snug">{f}</span>
            </li>
          ))}
        </ul>

        {/* CTA — always at bottom */}
        <Link
          href={price === 0 ? '/register' : `/packages/${pkg._id}`}
          className="block text-center py-3.5 rounded-2xl font-black text-sm text-white transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
          style={{
            background: meta.btnGrad,
            boxShadow: hovered ? meta.btnShadow : meta.btnShadow.replace(/[\d.]+\)$/, '0.3)'),
          }}>
          {price === 0 ? 'Get Started Free →' : `View ${pkg.name || pkg.tier} Plan →`}
        </Link>
      </div>
    </motion.div>
  )
}

/* ── Section ─────────────────────────────────────────────── */
export default function PricingSection() {
  const [packages, setPackages] = useState<any[]>(FALLBACK_PACKAGES)

  useEffect(() => {
    packageAPI.getAll()
      .then(res => {
        const data = res.data?.packages || []
        if (data.length > 0) setPackages(data)
      })
      .catch(() => {})
  }, [])

  return (
    <section className="py-10 md:py-16 px-4 relative overflow-hidden" id="pricing">
      {/* bg glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)' }} />
      </div>

      <div className="max-w-6xl mx-auto">

        {/* ── HEADER ── */}
        <div className="text-center mb-7 md:mb-10">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="section-label mb-5 mx-auto">
            PRICING PLANS
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
            Simple,{' '}
            <span className="gradient-text">Transparent</span> Pricing
          </motion.h2>
          <p className="text-gray-400 max-w-lg mx-auto text-sm">
            Start free, upgrade when ready. No hidden fees. Cancel anytime.
          </p>

          {/* Free class pill */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-full"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <Gift className="w-4 h-4 text-green-400" />
            <span className="text-green-400 font-bold text-sm">New users get their first live class completely FREE</span>
          </motion.div>
        </div>

        {/* ── DESKTOP: equal-height 3-col grid ── */}
        <div className="hidden md:grid md:grid-cols-3 gap-5 items-stretch">
          {packages.slice(0, 3).map((pkg, i) => (
            <PackageCard key={pkg._id || i} pkg={pkg} i={i} />
          ))}
        </div>

        {/* ── MOBILE: horizontal scroll, equal width cards ── */}
        <div className="md:hidden scroll-track pb-4">
          {packages.map((pkg, i) => (
            <div key={pkg._id || i} className="flex-shrink-0 w-[300px] flex">
              <PackageCard pkg={pkg} i={i} />
            </div>
          ))}
        </div>

        {/* ── TRUST STRIP ── */}
        <div className="mt-10 flex flex-wrap justify-center gap-6 text-xs text-gray-500">
          {['🔒 SSL Secured', '💳 UPI / Cards / Net Banking', '❌ No Hidden Charges', '↩ Cancel Anytime'].map((t, i) => (
            <span key={i} className="flex items-center gap-1.5">{t}</span>
          ))}
        </div>
      </div>
    </section>
  )
}
