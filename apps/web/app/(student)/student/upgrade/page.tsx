'use client'
import { useQuery } from '@tanstack/react-query'
import { packageAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { useAllTiers } from '@/lib/tiers'
import { Rocket, Flame, Shield, Crown, Check, ArrowRight, Sparkles, Lock, Star, Zap } from 'lucide-react'
import Link from 'next/link'

const TIERS = [
  {
    tier: 'starter', name: 'Starter', price: 4999,
    icon: Rocket, badge: '',
    grad: 'linear-gradient(135deg,#2563eb,#0891b2)',
    glow: 'rgba(59,130,246,0.4)',
    border: 'rgba(59,130,246,0.3)',
    accent: '#60a5fa',
    bg: 'rgba(37,99,235,0.08)',
  },
  {
    tier: 'pro', name: 'Pro', price: 9999,
    icon: Flame, badge: 'Most Popular',
    grad: 'linear-gradient(135deg,#7c3aed,#d946ef)',
    glow: 'rgba(139,92,246,0.45)',
    border: 'rgba(139,92,246,0.4)',
    accent: '#a78bfa',
    bg: 'rgba(124,58,237,0.1)',
  },
  {
    tier: 'elite', name: 'Elite', price: 19999,
    icon: Shield, badge: 'Best Value',
    grad: 'linear-gradient(135deg,#d97706,#ea580c)',
    glow: 'rgba(245,158,11,0.4)',
    border: 'rgba(245,158,11,0.3)',
    accent: '#fbbf24',
    bg: 'rgba(217,119,6,0.08)',
  },
  {
    tier: 'supreme', name: 'Supreme', price: 29999,
    icon: Crown, badge: 'All Access',
    grad: 'linear-gradient(135deg,#f43f5e,#ec4899)',
    glow: 'rgba(244,63,94,0.4)',
    border: 'rgba(244,63,94,0.3)',
    accent: '#fb7185',
    bg: 'rgba(244,63,94,0.08)',
  },
]

const FEATURES: Record<string, string[]> = {
  starter: ['All Courses Access', 'Live Classes', 'Community Access', 'AI Coach Basic', 'Certificate Generation', 'Job Engine Access'],
  pro: ['Everything in Starter', 'Priority Support', 'Personal Brand Tools', 'Advanced AI Coach', 'Quiz & Assignments', 'Mentor 1-on-1 (2/month)'],
  elite: ['Everything in Pro', 'Unlimited Mentor Sessions', 'Personal Brand Kit', 'Premium Community', 'Early Access to New Courses', 'Career Placement Support'],
  supreme: ['Everything in Elite', 'Lifetime Access', 'Dedicated Success Manager', 'White-glove Onboarding', 'Custom Learning Path', 'Guaranteed Placement'],
}


export default function UpgradePage() {
  const { user } = useAuthStore()
  const currentTier = (user as any)?.packageTier || 'free'
  const { tiers: TIER_ORDER } = useAllTiers()
  const currentIdx = TIER_ORDER.indexOf(currentTier)

  const { data: pkgs } = useQuery({
    queryKey: ['packages'],
    queryFn: () => packageAPI.getAll().then(r => r.data.packages)
  })

  return (
    <div className="space-y-5 max-w-5xl pb-8">

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 text-center"
        style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.18),rgba(79,70,229,0.12),rgba(13,13,20,0.95))', border: '1px solid rgba(139,92,246,0.25)' }}>
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #8b5cf6, transparent 70%)' }} />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #6366f1, transparent 70%)' }} />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
            style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' }}>
            <Sparkles className="w-3.5 h-3.5" /> Upgrade Your Plan
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Level Up Your Learning</h1>
          <p className="text-gray-400 mt-2 text-sm max-w-lg mx-auto">
            Unlock all courses, live classes, AI Coach & more. Current plan:
            <span className="text-violet-300 font-bold ml-1">{pkgs?.find((p: any) => p.tier === currentTier)?.name || currentTier}</span>
          </p>
        </div>
      </div>

      {/* Current plan status */}
      {currentTier !== 'free' && (
        <div className="rounded-2xl p-4 flex items-center gap-4"
          style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(34,197,94,0.15)' }}>
            <Check className="w-5 h-5 text-green-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">You're on the <span className="text-green-400">{pkgs?.find((p: any) => p.tier === currentTier)?.name || currentTier}</span> plan</p>
            <p className="text-xs text-gray-500 mt-0.5">Upgrade to unlock more features & higher commission rates</p>
          </div>
          {(user as any)?.packageExpiresAt && (
            <div className="text-right flex-shrink-0">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Expires</p>
              <p className="text-xs text-white font-bold">
                {new Date((user as any).packageExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Plans grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TIERS.map(t => {
          const tierIdx = TIER_ORDER.indexOf(t.tier)
          const isCurrent = t.tier === currentTier
          const isUpgrade = tierIdx > currentIdx
          const isLocked = tierIdx < currentIdx
          const Icon = t.icon
          const pkgData = pkgs?.find((p: any) => p.tier === t.tier)
          const features = (pkgData?.features?.length ? pkgData.features : FEATURES[t.tier]) || []
          const displayName = pkgData?.name || t.name
          const displayBadge = pkgData?.badge || t.badge

          return (
            <div key={t.tier} className="relative rounded-2xl p-5 flex flex-col transition-all"
              style={{
                background: isCurrent
                  ? `linear-gradient(135deg,${t.bg},rgba(13,13,20,0.95))`
                  : isUpgrade ? t.bg : 'rgba(13,13,20,0.6)',
                border: `1px solid ${isCurrent ? t.border : isUpgrade ? t.border : 'rgba(255,255,255,0.06)'}`,
                opacity: isLocked ? 0.55 : 1,
                boxShadow: isCurrent ? `0 8px 32px ${t.glow}` : 'none',
              }}>
              {/* Badge */}
              {(displayBadge || isCurrent) && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-black px-3 py-1 rounded-full whitespace-nowrap text-white"
                  style={{ background: isCurrent ? 'linear-gradient(135deg,#7c3aed,#4f46e5)' : t.grad }}>
                  {isCurrent ? '✓ Current' : displayBadge}
                </div>
              )}

              {/* Icon */}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 mt-2"
                style={{ background: t.bg, border: `1px solid ${t.border}` }}>
                <Icon className="w-5 h-5" style={{ color: t.accent }} />
              </div>

              <h3 className="text-base font-black text-white">{displayName}</h3>
              <div className="flex items-baseline gap-1 mt-1 mb-4">
                <span className="text-2xl font-black" style={{ color: isUpgrade || isCurrent ? t.accent : '#6b7280' }}>
                  ₹{(pkgData?.price || t.price).toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-gray-600">one-time</span>
              </div>

              <ul className="space-y-2 flex-1 mb-5">
                {features.slice(0, 5).map((f, fi) => (
                  <li key={fi} className="flex items-start gap-2 text-xs">
                    <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: isUpgrade || isCurrent ? t.accent : '#374151' }} />
                    <span className={isUpgrade || isCurrent ? 'text-gray-300' : 'text-gray-600'}>{f}</span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="w-full py-2.5 rounded-xl text-xs font-bold text-center"
                  style={{ background: t.bg, color: t.accent, border: `1px solid ${t.border}` }}>
                  ✓ Active Plan
                </div>
              ) : isUpgrade ? (
                <Link href={`/packages/${t.tier}`}
                  className="w-full py-2.5 rounded-xl text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-all hover:opacity-90"
                  style={{ background: t.grad, boxShadow: `0 4px 16px ${t.glow}` }}>
                  Upgrade <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <div className="w-full py-2.5 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1"
                  style={{ background: 'rgba(255,255,255,0.04)', color: '#374151' }}>
                  <Lock className="w-3 h-3" /> Already Passed
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Why Upgrade */}
      <div className="rounded-3xl p-5" style={{ background: 'rgba(13,13,20,0.95)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h2 className="font-black text-white mb-4 flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-400" /> Why Upgrade?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { emoji: '🎓', title: 'All Courses', desc: 'Access every course — new ones added weekly' },
            { emoji: '🤖', title: 'AI Coach', desc: 'Personalized roadmaps and Q&A from AI' },
            { emoji: '📜', title: 'Certificates', desc: 'Verified certificates for every completed course' },
            { emoji: '🎯', title: 'Live Classes', desc: 'Expert mentor sessions every week' },
            { emoji: '💼', title: 'Job Engine', desc: 'Exclusive listings and placement assistance' },
            { emoji: '🏆', title: 'Community', desc: 'Premium learner network and opportunities' },
          ].map((b, i) => (
            <div key={i} className="flex items-start gap-3 p-3.5 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span className="text-xl flex-shrink-0">{b.emoji}</span>
              <div>
                <p className="text-sm font-bold text-white">{b.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="relative overflow-hidden rounded-3xl p-6 text-center"
        style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.2),rgba(79,70,229,0.15),rgba(13,13,20,0.95))', border: '1px solid rgba(139,92,246,0.25)' }}>
        <Zap className="w-8 h-8 text-violet-400 mx-auto mb-3" />
        <p className="text-white font-black text-lg mb-1">Ready to unlock your potential?</p>
        <p className="text-gray-400 text-sm mb-5">Join thousands of learners already on their journey</p>
        <Link href="/packages"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold text-sm transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', boxShadow: '0 8px 32px rgba(124,58,237,0.4)' }}>
          <Sparkles className="w-4 h-4" /> Browse All Plans <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
