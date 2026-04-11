'use client'
import { useEffect, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { checkoutAPI, phonepeAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import toast from 'react-hot-toast'
import Link from 'next/link'
import {
  ShieldCheck, Tag, Ticket, Loader2, CheckCircle2, AlertCircle,
  ArrowLeft, Lock, Clock, Users, Award, Check, RefreshCw, CreditCard
} from 'lucide-react'

/* ─── Tier config ────────────────────────────────────────── */
const TIER_CONFIG: Record<string, {
  emoji: string; name: string; tagline: string
  headerGrad: string; accentColor: string; glowColor: string
  borderColor: string; btnGrad: string; btnGlow: string
}> = {
  starter: {
    emoji: '🚀', name: 'Starter', tagline: 'Launch your learning journey',
    headerGrad: 'linear-gradient(135deg,#0f2044 0%,#1d4ed8 60%,#2563eb 100%)',
    accentColor: '#60a5fa', glowColor: 'rgba(59,130,246,0.35)',
    borderColor: 'rgba(59,130,246,0.5)', btnGrad: 'linear-gradient(135deg,#1d4ed8,#0284c7)',
    btnGlow: '0 8px 32px rgba(59,130,246,0.5)',
  },
  pro: {
    emoji: '⚡', name: 'Pro', tagline: 'Everything you need to grow fast',
    headerGrad: 'linear-gradient(135deg,#2d0f44 0%,#7c3aed 60%,#6366f1 100%)',
    accentColor: '#c4b5fd', glowColor: 'rgba(124,58,237,0.4)',
    borderColor: 'rgba(124,58,237,0.65)', btnGrad: 'linear-gradient(135deg,#7c3aed,#d946ef,#6366f1)',
    btnGlow: '0 8px 32px rgba(124,58,237,0.6)',
  },
  elite: {
    emoji: '👑', name: 'Elite', tagline: 'Teach, earn and build your brand',
    headerGrad: 'linear-gradient(135deg,#3a0d00 0%,#d97706 60%,#b45309 100%)',
    accentColor: '#fcd34d', glowColor: 'rgba(245,158,11,0.35)',
    borderColor: 'rgba(245,158,11,0.5)', btnGrad: 'linear-gradient(135deg,#d97706,#ea580c)',
    btnGlow: '0 8px 32px rgba(245,158,11,0.5)',
  },
  supreme: {
    emoji: '💎', name: 'Supreme', tagline: 'Maximum power, maximum earnings',
    headerGrad: 'linear-gradient(135deg,#022020 0%,#0d9488 60%,#0891b2 100%)',
    accentColor: '#34d399', glowColor: 'rgba(6,182,212,0.35)',
    borderColor: 'rgba(6,182,212,0.5)', btnGrad: 'linear-gradient(135deg,#0d9488,#0891b2)',
    btnGlow: '0 8px 32px rgba(6,182,212,0.5)',
  },
}

const DEFAULT_TIER = {
  emoji: '📦', name: 'Package', tagline: 'Level up your skills',
  headerGrad: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)',
  accentColor: '#818cf8', glowColor: 'rgba(129,140,248,0.3)',
  borderColor: 'rgba(129,140,248,0.4)', btnGrad: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
  btnGlow: '0 8px 32px rgba(99,102,241,0.5)',
}

const EMI_MONTHS = 3

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

/* ─── Code input ─────────────────────────────────────────── */
function CodeField({ label, icon: Icon, placeholder, value, onChange, onValidate, status, discount, accentColor, loading }: {
  label: string; icon: any; placeholder: string; value: string
  onChange: (v: string) => void; onValidate: () => void
  status: 'idle' | 'valid' | 'invalid'; discount?: number; accentColor: string; loading?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-white/60 mb-1.5">{label}</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={value}
            onChange={e => onChange(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && value && onValidate()}
            placeholder={placeholder}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm
              placeholder:text-white/25 focus:outline-none focus:border-white/30 transition-all tracking-widest font-mono"
          />
        </div>
        <button onClick={onValidate} disabled={!value || loading}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
          style={{ background: accentColor + '33', border: `1px solid ${accentColor}55` }}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
        </button>
      </div>
      <AnimatePresence>
        {status === 'valid' && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mt-1.5 text-xs flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {discount ? `₹${discount} discount applied!` : 'Applied successfully!'}
          </motion.p>
        )}
        {status === 'invalid' && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mt-1.5 text-xs flex items-center gap-1.5 text-red-400">
            <AlertCircle className="w-3.5 h-3.5" /> Invalid or expired code
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Main checkout ──────────────────────────────────────── */
function CheckoutInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, _hasHydrated } = useAuthStore()

  const itemType = (searchParams.get('type') || 'package') as 'package' | 'course'
  const tier = searchParams.get('tier') || ''
  const packageId = searchParams.get('packageId') || ''  // new: _id based routing
  const courseId = searchParams.get('id') || ''
  const tc = (tier && TIER_CONFIG[tier]) ? TIER_CONFIG[tier] : DEFAULT_TIER

  const [item, setItem] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [payMode, setPayMode] = useState<'full' | 'emi'>('full')

  const [promoCode, setPromoCode] = useState('')
  const [promoStatus, setPromoStatus] = useState<'idle' | 'valid' | 'invalid'>('idle')
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [promoLoading, setPromoLoading] = useState(false)

  const [couponCode, setCouponCode] = useState('')
  const [couponStatus, setCouponStatus] = useState<'idle' | 'valid' | 'invalid'>('idle')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponLoading, setCouponLoading] = useState(false)

  const [paying, setPaying] = useState(false)

  useEffect(() => {
    if (!_hasHydrated) return
    if (!user) {
      const dest = encodeURIComponent(window.location.pathname + window.location.search)
      router.push(`/login?redirect=${dest}`)
    }
  }, [_hasHydrated, user, router])

  useEffect(() => {
    if (!user) return
    const params: any = { type: itemType }
    if (itemType === 'package') { if (packageId) params.packageId = packageId; else params.tier = tier }
    else params.courseId = courseId
    checkoutAPI.getItem(params)
      .then(r => setItem(r.data.item))
      .catch(() => toast.error('Failed to load item details'))
      .finally(() => setLoading(false))
  }, [user, itemType, tier, packageId, courseId])

  const basePrice = item?.price || 0
  const couponSaving = couponDiscount
  const finalPrice = Math.max(0, basePrice - couponSaving)
  const emiAmount = Math.ceil(finalPrice / EMI_MONTHS)
  const payNow = payMode === 'emi' ? emiAmount : finalPrice
  const showEmi = itemType === 'package' && basePrice > 0

  const handlePromo = useCallback(async () => {
    if (!promoCode) return
    setPromoLoading(true)
    try {
      const { data } = await checkoutAPI.validateCode({ code: promoCode, codeType: 'promo', type: itemType, tier: packageId || tier, courseId, amount: basePrice })
      setPromoStatus('valid')
      setPromoDiscount(data?.discount || 0)
      toast.success(data?.message || 'Partner code applied!')
    } catch {
      setPromoStatus('invalid'); setPromoDiscount(0)
    } finally { setPromoLoading(false) }
  }, [promoCode, itemType, tier, courseId, basePrice])

  const handleCoupon = useCallback(async () => {
    if (!couponCode) return
    setCouponLoading(true)
    try {
      const { data } = await checkoutAPI.validateCode({ code: couponCode, codeType: 'coupon', type: itemType, tier: packageId || tier, courseId, amount: basePrice })
      setCouponStatus('valid')
      setCouponDiscount(data?.discount || 0)
      toast.success(data?.message || 'Coupon applied!')
    } catch {
      setCouponStatus('invalid'); setCouponDiscount(0)
    } finally { setCouponLoading(false) }
  }, [couponCode, itemType, tier, courseId, basePrice])

  const handlePay = async () => {
    if (!user) return
    setPaying(true)
    try {
      const { data } = await phonepeAPI.createOrder({
        type: itemType, tier: packageId || tier, courseId,
        promoCode: promoStatus === 'valid' ? promoCode : undefined,
        couponCode: couponStatus === 'valid' ? couponCode : undefined,
        isEmi: payMode === 'emi',
      })
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl
      } else {
        toast.error('Could not get payment URL')
        setPaying(false)
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not initiate payment')
      setPaying(false)
    }
  }

  if (!_hasHydrated || loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'radial-gradient(ellipse at center, #0d0d1a 0%, #050508 100%)' }}>
        <Loader2 className="w-10 h-10 animate-spin text-white/40" />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at 50% 0%, #0d1035 0%, #05050f 60%)' }}>
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full opacity-20 blur-3xl"
          style={{ background: tc.headerGrad }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <Link href={itemType === 'package' ? `/packages/${packageId || tier}` : `/courses/${courseId}`}
            className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 text-sm transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_420px] gap-6 lg:gap-8 items-start">

          {/* ── Left: Form ───────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Complete Your Order</h1>
              <p className="text-white/40 text-sm flex items-center gap-1.5">
                <span className="text-base">🔒</span> Secure checkout powered by PhonePe
              </p>
            </div>

            <div className="rounded-2xl overflow-hidden border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>

              {/* Account info */}
              <div className="p-5 sm:p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Account Info</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-white/60 mb-1.5">Full Name</label>
                    <input value={user.name} readOnly className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm cursor-not-allowed opacity-70" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/60 mb-1.5">Email</label>
                    <input value={user.email} readOnly className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm cursor-not-allowed opacity-70" />
                  </div>
                </div>
              </div>

              {/* EMI toggle */}
              {showEmi && (
                <div className="p-5 sm:p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Payment Mode</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {(['full', 'emi'] as const).map(mode => (
                      <button key={mode} onClick={() => setPayMode(mode)}
                        className="relative rounded-xl p-4 border text-left transition-all"
                        style={{
                          background: payMode === mode ? tc.glowColor : 'transparent',
                          borderColor: payMode === mode ? tc.accentColor : 'rgba(255,255,255,0.1)',
                          boxShadow: payMode === mode ? `0 0 20px ${tc.glowColor}` : 'none',
                        }}>
                        {mode === 'full' ? (
                          <>
                            <CreditCard className="w-5 h-5 mb-2" style={{ color: tc.accentColor }} />
                            <p className="text-sm font-semibold text-white">Pay Full</p>
                            <p className="text-xs text-white/40 mt-0.5">One-time payment</p>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-5 h-5 mb-2" style={{ color: tc.accentColor }} />
                            <p className="text-sm font-semibold text-white">3 Installments</p>
                            <p className="text-xs text-white/40 mt-0.5">{fmt(emiAmount)}/month</p>
                          </>
                        )}
                        {payMode === mode && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: tc.accentColor }}>
                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  {payMode === 'emi' && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                      className="mt-3 px-4 py-3 rounded-xl text-xs text-white/60 border"
                      style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
                      <span className="text-amber-400 font-semibold">Note:</span> Pay {fmt(emiAmount)} now via PhonePe, then {fmt(emiAmount)} every 30 days. Missed EMI may suspend your access.
                    </motion.div>
                  )}
                </div>
              )}

              {/* Codes */}
              <div className="p-5 sm:p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Discount Codes</h3>
                <div className="space-y-4">
                  <CodeField label="Partner / Promo Code" icon={Tag} placeholder="E.g. TLABCD12"
                    value={promoCode} onChange={v => { setPromoCode(v); setPromoStatus('idle') }}
                    onValidate={handlePromo} status={promoStatus} discount={promoDiscount}
                    accentColor={tc.accentColor} loading={promoLoading} />
                  <CodeField label="Coupon Code (Optional)" icon={Ticket} placeholder="E.g. SAVE20"
                    value={couponCode} onChange={v => { setCouponCode(v); setCouponStatus('idle') }}
                    onValidate={handleCoupon} status={couponStatus} discount={couponDiscount}
                    accentColor={tc.accentColor} loading={couponLoading} />
                </div>
              </div>

              {/* Price breakdown + Pay button */}
              <div className="p-5 sm:p-6">
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Price Breakdown</h3>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between text-white/70">
                    <span>Original Price</span><span>{fmt(basePrice)}</span>
                  </div>
                  {couponSaving > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Coupon Discount</span><span>−{fmt(couponSaving)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-white text-base pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                    <span>{payMode === 'emi' ? `Due Now (1 of ${EMI_MONTHS})` : 'Total'}</span>
                    <span style={{ color: tc.accentColor }}>{fmt(payNow)}</span>
                  </div>
                  {payMode === 'emi' && (
                    <p className="text-xs text-white/40 text-right">Then {fmt(emiAmount)} × 2 more installments</p>
                  )}
                </div>

                <motion.button onClick={handlePay} disabled={paying || basePrice === 0} whileTap={{ scale: 0.97 }}
                  className="w-full py-4 rounded-2xl font-bold text-white text-base relative overflow-hidden transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: tc.btnGrad, boxShadow: tc.btnGlow }}>
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {paying ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Redirecting to PhonePe…</>
                    ) : (
                      <><Lock className="w-4 h-4" />
                        {basePrice === 0 ? 'Enroll Free' : `Pay ${fmt(payNow)} via PhonePe`}
                      </>
                    )}
                  </span>
                  <motion.div className="absolute inset-0 opacity-20"
                    style={{ background: 'linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.4) 50%,transparent 70%)' }}
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }} />
                </motion.button>

                <div className="flex items-center justify-center gap-5 mt-4 text-xs text-white/30">
                  <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> 256-bit SSL</span>
                  <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> PhonePe Secured</span>
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Instant Access</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Right: Order summary ─────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="lg:sticky lg:top-6">

            <div className="rounded-2xl overflow-hidden border" style={{ borderColor: tc.borderColor, boxShadow: `0 0 40px ${tc.glowColor}` }}>
              {/* Header */}
              <div className="p-6 relative overflow-hidden" style={{ background: tc.headerGrad }}>
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, rgba(255,255,255,0.15) 0%, transparent 60%)' }} />
                <div className="relative z-10">
                  <div className="text-4xl mb-3">{tc.emoji}</div>
                  <h2 className="text-xl font-bold text-white">{item?.name || (tier ? `${tc.name} Package` : 'Course Enrollment')}</h2>
                  <p className="text-white/60 text-sm mt-1">{tc.tagline}</p>
                  <div className="mt-4 flex items-end gap-2">
                    <span className="text-3xl font-black text-white">{fmt(finalPrice)}</span>
                    {finalPrice < basePrice && <span className="text-white/40 line-through text-sm mb-1">{fmt(basePrice)}</span>}
                  </div>
                  {payMode === 'emi' && <p className="text-white/60 text-xs mt-1">or {fmt(emiAmount)}/month × {EMI_MONTHS}</p>}
                </div>
              </div>

              {/* Features */}
              {item?.features && item.features.length > 0 && (
                <div className="p-5" style={{ background: 'rgba(0,0,0,0.4)' }}>
                  <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">What's Included</h3>
                  <ul className="space-y-2.5">
                    {item.features.slice(0, 8).map((f: string, i: number) => (
                      <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.05 }}
                        className="flex items-start gap-2.5 text-sm text-white/75">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: tc.accentColor }} />
                        {f}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Trust badges */}
              <div className="px-5 pb-5 grid grid-cols-2 gap-2">
                {[
                  { icon: ShieldCheck, text: 'Secure Payment' },
                  { icon: CheckCircle2, text: 'Instant Activation' },
                  { icon: Users, text: '10,000+ Students' },
                  { icon: Award, text: 'Certified Courses' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-xs text-white/40 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: tc.accentColor }} />
                    {text}
                  </div>
                ))}
              </div>

              {/* EMI schedule preview */}
              {payMode === 'emi' && showEmi && (
                <div className="mx-5 mb-5 rounded-xl p-4 border text-xs space-y-2" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
                  <p className="text-white/40 font-semibold uppercase tracking-wider mb-3">Installment Schedule</p>
                  {Array.from({ length: EMI_MONTHS }).map((_, i) => (
                    <div key={i} className="flex justify-between text-white/60">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3" /> Month {i + 1} {i === 0 ? '(Today)' : `(+${i * 30} days)`}
                      </span>
                      <span className="font-semibold" style={{ color: tc.accentColor }}>{fmt(emiAmount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="text-center text-xs text-white/25 mt-4">
              Questions? <a href="https://wa.me/919999999999" target="_blank" rel="noopener noreferrer"
                className="underline hover:text-white/40 transition-colors">Chat on WhatsApp</a>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'radial-gradient(ellipse at center, #0d0d1a 0%, #050508 100%)' }}>
        <Loader2 className="w-10 h-10 animate-spin text-white/40" />
      </div>
    }>
      <CheckoutInner />
    </Suspense>
  )
}
