'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { packageAPI, paymentAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import toast from 'react-hot-toast'
import {
  Check, Zap, Shield, Award, Users, TrendingUp, Star,
  ArrowLeft, ArrowRight, Loader2, Crown, Sparkles, BadgeCheck,
  BookOpen, Video, Bot, Briefcase, Globe, Clock, Gift, ChevronRight, Lock
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

declare global { interface Window { Razorpay: any } }

/* ── Tier config ─────────────────────────────────────────── */
const TIER_CONFIG: Record<string, {
  emoji: string
  name: string
  tagline: string
  headerGrad: string
  accentColor: string
  glowColor: string
  borderColor: string
  btnGrad: string
  btnGlow: string
  badgeText: string
  highlight: boolean
  comparedTo?: string
}> = {
  starter: {
    emoji: '🚀', name: 'Starter', tagline: 'Launch your learning journey',
    headerGrad: 'linear-gradient(135deg,#0f2044 0%,#1d4ed8 60%,#2563eb 100%)',
    accentColor: '#60a5fa', glowColor: 'rgba(59,130,246,0.35)',
    borderColor: 'rgba(59,130,246,0.45)', btnGrad: 'linear-gradient(135deg,#1d4ed8,#0284c7)',
    btnGlow: '0 8px 32px rgba(59,130,246,0.45)', badgeText: 'Great Start', highlight: false,
  },
  pro: {
    emoji: '⚡', name: 'Pro', tagline: 'Everything you need to grow fast',
    headerGrad: 'linear-gradient(135deg,#2d0f44 0%,#7c3aed 60%,#6366f1 100%)',
    accentColor: '#c4b5fd', glowColor: 'rgba(124,58,237,0.4)',
    borderColor: 'rgba(124,58,237,0.65)', btnGrad: 'linear-gradient(135deg,#7c3aed,#d946ef,#6366f1)',
    btnGlow: '0 8px 32px rgba(124,58,237,0.55)', badgeText: '⚡ Most Popular', highlight: true,
    comparedTo: 'starter',
  },
  elite: {
    emoji: '👑', name: 'Elite', tagline: 'Teach, earn and build your brand',
    headerGrad: 'linear-gradient(135deg,#3a0d00 0%,#d97706 60%,#b45309 100%)',
    accentColor: '#fcd34d', glowColor: 'rgba(245,158,11,0.35)',
    borderColor: 'rgba(245,158,11,0.5)', btnGrad: 'linear-gradient(135deg,#d97706,#ea580c)',
    btnGlow: '0 8px 32px rgba(245,158,11,0.45)', badgeText: '👑 For Educators', highlight: false,
    comparedTo: 'pro',
  },
  supreme: {
    emoji: '💎', name: 'Supreme', tagline: 'Maximum power, maximum earnings',
    headerGrad: 'linear-gradient(135deg,#022020 0%,#0d9488 60%,#0891b2 100%)',
    accentColor: '#34d399', glowColor: 'rgba(6,182,212,0.35)',
    borderColor: 'rgba(6,182,212,0.5)', btnGrad: 'linear-gradient(135deg,#0d9488,#0891b2)',
    btnGlow: '0 8px 32px rgba(6,182,212,0.45)', badgeText: '💎 Enterprise', highlight: false,
    comparedTo: 'elite',
  },
}

/* ── Feature icons ───────────────────────────────────────── */
const FEATURE_ICONS: Record<string, any> = {
  'All course': BookOpen, 'Live class': Video, 'AI Coach': Bot,
  'Job Engine': Briefcase, 'Community': Users, 'Earn': TrendingUp,
  'Income': TrendingUp, 'Mentor': Star, 'Personal brand': Globe,
  'Certificate': Award, 'WhatsApp': Gift, 'Analytics': Zap,
  'Dedicated': Crown, 'Mastermind': Sparkles, 'Lifetime': Clock,
  'Priority': Shield, 'Done-For-You': BadgeCheck, 'Early access': Zap,
  'default': Check,
}

function getIcon(feature: string) {
  for (const [key, Icon] of Object.entries(FEATURE_ICONS)) {
    if (feature.toLowerCase().includes(key.toLowerCase())) return Icon
  }
  return Check
}

/* ── Commission calculator ───────────────────────────────── */
function EarningsCalc({ rate, accentColor }: { rate: number; accentColor: string }) {
  const [referrals, setReferrals] = useState(10)
  const [tier, setTier] = useState(9999)
  const monthly = referrals * tier * (rate / 100)

  return (
    <div className="rounded-3xl p-6 sm:p-8" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <h3 className="text-lg font-black text-white mb-1 flex items-center gap-2">
        <TrendingUp className="w-5 h-5" style={{ color: accentColor }} />
        Earnings Calculator
      </h3>
      <p className="text-gray-500 text-xs mb-6">See how much you can earn per month</p>

      <div className="space-y-5">
        <div>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-gray-400">People you help join per month</span>
            <span className="font-black text-white">{referrals}</span>
          </div>
          <input type="range" min={1} max={100} value={referrals} onChange={e => setReferrals(+e.target.value)}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{ background: `linear-gradient(to right,${accentColor} ${referrals}%,rgba(255,255,255,0.1) ${referrals}%)` }} />
          <div className="flex justify-between text-[10px] text-gray-600 mt-1"><span>1</span><span>100</span></div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-gray-400">Avg. package value</span>
            <span className="font-black text-white">₹{tier.toLocaleString()}</span>
          </div>
          <div className="flex gap-2">
            {[4999, 9999, 19999, 29999].map(v => (
              <button key={v} onClick={() => setTier(v)}
                className="flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                style={{
                  background: tier === v ? accentColor + '25' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${tier === v ? accentColor : 'rgba(255,255,255,0.08)'}`,
                  color: tier === v ? accentColor : '#6b7280',
                }}>
                ₹{(v/1000).toFixed(0)}K
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl p-5 text-center" style={{ background: accentColor + '12', border: `1px solid ${accentColor}30` }}>
          <p className="text-gray-400 text-xs mb-1">Your estimated monthly earnings</p>
          <p className="font-black leading-none" style={{ fontSize: '2.5rem', color: accentColor }}>
            ₹{monthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p className="text-gray-500 text-xs mt-1">{rate}% income rate × {referrals} people helped</p>
        </div>
      </div>
    </div>
  )
}

/* ── FAQ ─────────────────────────────────────────────────── */
const FAQS = [
  { q: 'Can I upgrade my plan later?', a: 'Yes! You can upgrade anytime and only pay the difference.' },
  { q: 'Is there a money-back guarantee?', a: '30-day full refund, no questions asked.' },
  { q: 'How does the Earn Program work?', a: 'Share your personal invite link. Every time someone joins through it, you earn income instantly — no selling required, just help others learn.' },
  { q: 'Can I pay in EMI?', a: 'Yes, EMI options are available via Razorpay (3–12 months, 0% interest on select plans).' },
  { q: 'Do I get lifetime access?', a: 'Yes, all courses and materials are accessible for lifetime once enrolled.' },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/5 transition-colors">
        <span className="text-white font-bold text-sm pr-4">{q}</span>
        <ChevronRight className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && <div className="px-5 pb-4 text-gray-400 text-sm leading-relaxed">{a}</div>}
    </div>
  )
}

/* ── Main page ───────────────────────────────────────────── */
export default function PackageDetailPage({ params }: { params: { tier: string } }) {
  const [pkg, setPkg] = useState<any>(null)
  const [allPkgs, setAllPkgs] = useState<any[]>([])
  const [buying, setBuying] = useState(false)
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const cfg = TIER_CONFIG[params.tier] || TIER_CONFIG.pro

  useEffect(() => {
    packageAPI.getAll().then(res => {
      const pkgs = res.data?.packages || []
      setAllPkgs(pkgs)
      const found = pkgs.find((p: any) => p.tier === params.tier)
      if (found) setPkg(found)
    }).catch(() => {})
  }, [params.tier])

  const handleBuy = async () => {
    if (!isAuthenticated()) return router.push('/register')
    if (!pkg) return
    setBuying(true)
    try {
      const orderRes = await packageAPI.createOrder({ packageId: pkg._id, tier: pkg.tier })
      const { orderId, amount, currency, keyId } = orderRes.data
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      document.body.appendChild(script)
      script.onload = () => {
        const rzp = new window.Razorpay({
          key: keyId, amount, currency, order_id: orderId,
          name: 'TruLearnix', description: `${pkg.name} Package`,
          prefill: { name: user?.name, email: user?.email },
          theme: { color: cfg.accentColor },
          handler: async (response: any) => {
            try {
              await packageAPI.verify({ razorpayOrderId: orderId, razorpayPaymentId: response.razorpay_payment_id, razorpaySignature: response.razorpay_signature })
              toast.success(`🎉 Welcome to ${pkg.name}!`)
              router.push('/student/dashboard')
            } catch { toast.error('Payment verification failed') }
          },
          modal: { ondismiss: () => setBuying(false) }
        })
        rzp.open()
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Something went wrong')
      setBuying(false)
    }
  }

  const price = pkg?.price || 0
  const originalPrice = pkg?.originalPrice || price
  const discount = originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : 0
  const features: string[] = pkg?.features || []

  const BuyBtn = ({ full = true, size = 'lg' }: { full?: boolean; size?: 'lg' | 'sm' }) => (
    <button onClick={handleBuy} disabled={buying}
      className={`flex items-center justify-center gap-2 rounded-2xl font-black text-white transition-all hover:scale-[1.02] active:scale-[0.97] disabled:opacity-70 ${full ? 'w-full' : ''} ${size === 'lg' ? 'py-4 text-base' : 'py-3 px-6 text-sm'}`}
      style={{ background: cfg.btnGrad, boxShadow: cfg.btnGlow }}>
      {buying ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
        : <><Zap className="w-4 h-4" /> Get {cfg.name} — ₹{price.toLocaleString()}</>}
    </button>
  )

  return (
    <div style={{ background: '#04050a' }} className="min-h-screen">
      <Navbar />

      {/* ── HERO ── */}
      <div className="relative overflow-hidden pt-16">
        <div className="absolute inset-0" style={{ background: cfg.headerGrad, opacity: 0.85 }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 60% 50%,transparent 30%,rgba(0,0,0,0.65) 100%)' }} />
        {/* Animated circles */}
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full pointer-events-none" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <div className="absolute bottom-0 -left-16 w-72 h-72 rounded-full pointer-events-none" style={{ background: 'rgba(255,255,255,0.03)' }} />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-20">
          {/* Back */}
          <Link href="/pricing" className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> All Plans
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left */}
            <div>
              <div className="flex items-center gap-3 mb-5 flex-wrap">
                {cfg.badgeText && (
                  <span className="text-xs font-black px-3 py-1.5 rounded-full text-white"
                    style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
                    {cfg.badgeText}
                  </span>
                )}
                {discount > 0 && (
                  <span className="text-xs font-black px-3 py-1.5 rounded-full"
                    style={{ background: 'rgba(74,222,128,0.2)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)' }}>
                    {discount}% OFF
                  </span>
                )}
              </div>

              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="text-7xl mb-6 inline-block" style={{ filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.4))' }}>
                {cfg.emoji}
              </motion.div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight mb-4">
                {cfg.name} <span className="block text-2xl sm:text-3xl font-bold mt-1" style={{ color: 'rgba(255,255,255,0.65)' }}>Plan</span>
              </h1>
              <p className="text-white/70 text-lg mb-8 max-w-md">{cfg.tagline}</p>

              {/* Price */}
              <div className="flex items-baseline gap-4 mb-8">
                <span className="font-black text-white" style={{ fontSize: '3.5rem', lineHeight: 1 }}>
                  ₹{price.toLocaleString()}
                </span>
                {originalPrice > price && (
                  <span className="text-white/40 text-xl line-through">₹{originalPrice.toLocaleString()}</span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <BuyBtn />
                {cfg.comparedTo && (
                  <Link href={`/packages/${cfg.comparedTo}`}
                    className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-bold text-sm text-gray-300 hover:text-white transition-all"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                    Compare with {TIER_CONFIG[cfg.comparedTo]?.name}
                  </Link>
                )}
              </div>

              <p className="flex items-center gap-1.5 text-white/50 text-xs mt-4">
                <Shield className="w-3.5 h-3.5" /> 30-day money-back guarantee
              </p>
            </div>

            {/* Right — feature highlights */}
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
              className="rounded-3xl p-6 sm:p-8"
              style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <p className="text-xs font-black uppercase tracking-widest mb-5" style={{ color: cfg.accentColor }}>What's included</p>
              <ul className="space-y-3">
                {features.slice(0, 8).map((f, i) => {
                  const Icon = getIcon(f)
                  return (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: cfg.accentColor + '20' }}>
                        <Icon className="w-3.5 h-3.5" style={{ color: cfg.accentColor }} />
                      </div>
                      <span className="text-gray-200 text-sm">{f}</span>
                    </li>
                  )
                })}
                {features.length > 8 && (
                  <li className="text-xs pl-10" style={{ color: cfg.accentColor }}>+{features.length - 8} more features below ↓</li>
                )}
              </ul>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-12">

        {/* All features full */}
        <section>
          <h2 className="text-2xl font-black text-white mb-2">Everything in {cfg.name}</h2>
          <p className="text-gray-500 text-sm mb-7">All features included in your plan</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => {
              const Icon = getIcon(f)
              return (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }} viewport={{ once: true }}
                  className="flex items-center gap-3 p-4 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: cfg.accentColor + '15' }}>
                    <Icon className="w-4 h-4" style={{ color: cfg.accentColor }} />
                  </div>
                  <span className="text-gray-300 text-sm font-medium">{f}</span>
                </motion.div>
              )
            })}
          </div>
        </section>

        {/* Stats row */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { val: `${pkg?.commissionRate || 0}%`, label: 'Income Rate', icon: TrendingUp },
            { val: '500+', label: 'Courses Access', icon: BookOpen },
            { val: pkg?.liveClassAccess ? 'Daily' : 'Limited', label: 'Live Classes', icon: Video },
            { val: '30 Days', label: 'Money-Back', icon: Shield },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }} viewport={{ once: true }}
              className="rounded-2xl p-5 text-center"
              style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${cfg.borderColor}` }}>
              <s.icon className="w-5 h-5 mx-auto mb-2" style={{ color: cfg.accentColor }} />
              <p className="font-black text-white text-xl leading-none">{s.val}</p>
              <p className="text-gray-500 text-xs mt-1">{s.label}</p>
            </motion.div>
          ))}
        </section>

        {/* Earnings calculator */}
        {pkg?.commissionRate > 0 && (
          <section>
            <EarningsCalc rate={pkg.commissionRate} accentColor={cfg.accentColor} />
          </section>
        )}

        {/* EMI section */}
        {pkg?.emiAvailable && (
          <section className="rounded-3xl p-6 sm:p-8"
            style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${cfg.borderColor}` }}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: cfg.accentColor + '15' }}>
                <Clock className="w-6 h-6" style={{ color: cfg.accentColor }} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-white mb-1">Easy EMI Available</h3>
                <p className="text-gray-500 text-sm mb-4">Pay in easy monthly installments, no interest</p>
                <div className="flex flex-wrap gap-3">
                  {[pkg.emiMonths || 3].map((m: number) => (
                    <div key={m} className="rounded-2xl px-5 py-3 text-center"
                      style={{ background: cfg.accentColor + '15', border: `1px solid ${cfg.accentColor}30` }}>
                      <p className="font-black text-white text-xl">₹{(pkg.emiMonthlyAmount || Math.round(price / m)).toLocaleString()}</p>
                      <p className="text-xs mt-0.5" style={{ color: cfg.accentColor }}>× {m} months</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Compare plans */}
        {allPkgs.length > 0 && (
          <section>
            <h2 className="text-2xl font-black text-white mb-2">Compare Plans</h2>
            <p className="text-gray-500 text-sm mb-7">Find the right plan for your goals</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {allPkgs.map((p: any) => {
                const c = TIER_CONFIG[p.tier] || TIER_CONFIG.pro
                const isActive = p.tier === params.tier
                return (
                  <Link key={p._id} href={`/packages/${p.tier}`}
                    className="rounded-2xl p-4 text-center transition-all hover:scale-[1.03]"
                    style={{
                      background: isActive ? c.accentColor + '15' : 'rgba(255,255,255,0.03)',
                      border: `1.5px solid ${isActive ? c.borderColor : 'rgba(255,255,255,0.07)'}`,
                      boxShadow: isActive ? `0 0 32px ${c.glowColor}` : 'none',
                    }}>
                    <div className="text-3xl mb-2">{c.emoji}</div>
                    <p className="font-black text-white text-sm">{p.name}</p>
                    <p className="font-bold text-xs mt-1" style={{ color: c.accentColor }}>₹{p.price.toLocaleString()}</p>
                    {isActive && <p className="text-[10px] mt-1.5 font-black" style={{ color: c.accentColor }}>Current</p>}
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* Testimonials */}
        <section>
          <h2 className="text-2xl font-black text-white mb-7">What our members say</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { name: 'Rahul M.', role: 'Pro Member', text: 'The AI coach alone is worth the price. My skills improved 10x in 2 months!', rating: 5 },
              { name: 'Priya S.', role: 'Elite Member', text: 'Earning ₹45K/month through the Earn Program — just helping friends learn. Best investment ever!', rating: 5 },
              { name: 'Amit K.', role: 'Supreme Member', text: 'The dedicated success manager helped me build a 6-figure business online.', rating: 5 },
            ].map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                className="rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(t.rating)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black"
                    style={{ background: cfg.btnGrad }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-white text-xs font-bold">{t.name}</p>
                    <p className="text-gray-600 text-[10px]">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-2xl font-black text-white mb-7">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {FAQS.map((f, i) => <FAQItem key={i} q={f.q} a={f.a} />)}
          </div>
        </section>

        {/* Final CTA */}
        <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="rounded-3xl p-8 sm:p-12 text-center"
          style={{ background: cfg.headerGrad, position: 'relative', overflow: 'hidden' }}>
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.3)' }} />
          <div className="relative">
            <div className="text-6xl mb-4">{cfg.emoji}</div>
            <h2 className="text-3xl font-black text-white mb-3">Ready to go {cfg.name}?</h2>
            <p className="text-white/70 mb-8 max-w-md mx-auto">Join thousands of learners growing their skills and income with TruLearnix.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
              <BuyBtn />
            </div>
          </div>
        </motion.section>

      </div>

      {/* Mobile sticky CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 p-4"
        style={{ background: 'rgba(4,5,10,0.96)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3">
          <div>
            <p className="text-white font-black text-lg leading-none">₹{price.toLocaleString()}</p>
            {originalPrice > price && <p className="text-gray-600 text-xs line-through">₹{originalPrice.toLocaleString()}</p>}
          </div>
          <BuyBtn full={false} size="sm" />
        </div>
      </div>
      <div className="lg:hidden h-24" />

      <Footer />
    </div>
  )
}
