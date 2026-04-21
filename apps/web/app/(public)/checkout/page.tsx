'use client'
import { useEffect, useState, useCallback, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import api, { checkoutAPI, phonepeAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import toast from 'react-hot-toast'
import Link from 'next/link'
import {
  ShieldCheck, Tag, Ticket, Loader2, CheckCircle2, AlertCircle,
  ArrowLeft, Lock, Clock, Award, Check, RefreshCw, CreditCard,
  Percent, BadgePercent, Sparkles, ChevronRight, User, Mail, Phone
} from 'lucide-react'

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

const EMI_INSTALLMENTS = 4
const EMI_DAYS = [0, 15, 30, 45]
const GST_RATE = 0.18

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

function CodeField({ label, icon: Icon, placeholder, value, onChange, onValidate, status, accentColor, loading, successMsg, errorMsg }: {
  label: string; icon: any; placeholder: string; value: string
  onChange: (v: string) => void; onValidate: () => void
  status: 'idle' | 'valid' | 'invalid'; accentColor: string; loading?: boolean
  successMsg?: string; errorMsg?: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">{label}</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
          <input
            value={value}
            onChange={e => onChange(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && value && onValidate()}
            placeholder={placeholder}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-all tracking-widest font-mono"
          />
        </div>
        <button onClick={onValidate} disabled={!value || loading}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 whitespace-nowrap"
          style={{ background: accentColor + '25', border: `1px solid ${accentColor}45` }}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
        </button>
      </div>
      <AnimatePresence>
        {status === 'valid' && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mt-1.5 text-xs flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            {successMsg || 'Applied successfully!'}
          </motion.p>
        )}
        {status === 'invalid' && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mt-1.5 text-xs flex items-center gap-1.5 text-red-400">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {errorMsg || 'Invalid or expired code'}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

function CheckoutInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, _hasHydrated, setAuth } = useAuthStore()

  const itemType = (searchParams.get('type') || 'package') as 'package' | 'course'
  const tier = searchParams.get('tier') || ''
  const packageId = searchParams.get('packageId') || ''
  const courseId = searchParams.get('id') || ''
  const tc = (tier && TIER_CONFIG[tier]) ? TIER_CONFIG[tier] : DEFAULT_TIER

  const [item, setItem] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [payMode, setPayMode] = useState<'full' | 'emi'>('full')
  const [emiEnabled, setEmiEnabled] = useState(false)

  const [promoCode, setPromoCode] = useState(searchParams.get('promo') || '')
  const [promoStatus, setPromoStatus] = useState<'idle' | 'valid' | 'invalid'>('idle')
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoSuccessMsg, setPromoSuccessMsg] = useState('')
  const [promoErrorMsg, setPromoErrorMsg] = useState('')

  const [couponCode, setCouponCode] = useState('')
  const [couponStatus, setCouponStatus] = useState<'idle' | 'valid' | 'invalid'>('idle')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponLoading, setCouponLoading] = useState(false)

  const [paying, setPaying] = useState(false)

  // Guest form state (for unauthenticated buyers)
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestAge, setGuestAge] = useState('')
  const [guestState, setGuestState] = useState('')
  const [guestPaying, setGuestPaying] = useState(false)

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
    fetch(`${apiBase}/public/maintenance`).then(r => r.json()).then(d => setEmiEnabled(!!d.emiEnabled)).catch(() => {})
  }, [])

  useEffect(() => {
    // For guest checkout (no auth), load item details publicly
    if (!user && itemType === 'course' && courseId) {
      checkoutAPI.getItem({ type: 'course', courseId })
        .then(r => setItem(r.data.item))
        .catch(() => toast.error('Failed to load course details'))
        .finally(() => setLoading(false))
      return
    }
    if (!user && itemType === 'package') {
      const params: any = { type: 'package' }
      if (packageId) params.packageId = packageId; else params.tier = tier
      checkoutAPI.getItem(params)
        .then(r => setItem(r.data.item))
        .catch(() => toast.error('Failed to load package details'))
        .finally(() => setLoading(false))
      return
    }
    if (!user) return
    const params: any = { type: itemType }
    if (itemType === 'package') { if (packageId) params.packageId = packageId; else params.tier = tier }
    else params.courseId = courseId
    checkoutAPI.getItem(params)
      .then(r => setItem(r.data.item))
      .catch(() => toast.error('Failed to load item details'))
      .finally(() => setLoading(false))
  }, [user, itemType, tier, packageId, courseId])

  // Auto-validate promo from URL
  const autoValidatedRef = useRef(false)
  useEffect(() => {
    if (promoCode && item?.price > 0 && !autoValidatedRef.current) {
      autoValidatedRef.current = true
      handlePromo()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promoCode, item?.price])

  // ── Price math (matches backend exactly) ──────────────────────────────────
  const basePrice = item?.price || 0
  const promoSaving = promoDiscount
  const couponSaving = couponDiscount
  const afterDiscount = Math.max(0, basePrice - promoSaving - couponSaving)
  const totalSaving = promoSaving + couponSaving
  const gstAmount = itemType === 'package' ? Math.round(afterDiscount * GST_RATE) : 0
  const totalPayable = afterDiscount + gstAmount
  const emiAmount = Math.ceil(totalPayable / EMI_INSTALLMENTS)
  const payNow = payMode === 'emi' ? emiAmount : totalPayable
  const showEmi = itemType === 'package' && basePrice > 0 && emiEnabled

  const handlePromo = useCallback(async () => {
    if (!promoCode) return
    setPromoLoading(true)
    try {
      const { data } = await checkoutAPI.validateCode({ code: promoCode, codeType: 'promo', type: itemType, packageId: packageId || undefined, tier: tier || undefined, courseId, amount: basePrice })
      setPromoStatus('valid')
      setPromoDiscount(data?.discount || 0)
      setPromoSuccessMsg(data?.message || 'Code applied!')
      setPromoErrorMsg('')
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Invalid or expired code'
      setPromoStatus('invalid'); setPromoDiscount(0); setPromoSuccessMsg(''); setPromoErrorMsg(msg)
    } finally { setPromoLoading(false) }
  }, [promoCode, itemType, packageId, tier, courseId, basePrice])

  const handleCoupon = useCallback(async () => {
    if (!couponCode) return
    setCouponLoading(true)
    try {
      const { data } = await checkoutAPI.validateCode({ code: couponCode, codeType: 'coupon', type: itemType, packageId: packageId || undefined, tier: tier || undefined, courseId, amount: basePrice })
      setCouponStatus('valid'); setCouponDiscount(data?.discount || 0)
      toast.success(data?.message || 'Coupon applied!')
    } catch {
      setCouponStatus('invalid'); setCouponDiscount(0)
    } finally { setCouponLoading(false) }
  }, [couponCode, itemType, packageId, tier, courseId, basePrice])

  const handlePay = async () => {
    if (!user) return
    setPaying(true)
    try {
      const { data } = await phonepeAPI.createOrder({
        type: itemType,
        packageId: packageId || undefined,
        tier: tier || undefined,
        courseId,
        promoCode: promoStatus === 'valid' ? promoCode : undefined,
        couponCode: couponStatus === 'valid' ? couponCode : undefined,
        isEmi: payMode === 'emi',
        age: guestAge.trim() || undefined,
        state: guestState.trim() || undefined,
      })
      if (data.redirectUrl) window.location.href = data.redirectUrl
      else { toast.error('Could not get payment URL'); setPaying(false) }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not initiate payment')
      setPaying(false)
    }
  }

  const handleGuestPay = async () => {
    if (!guestName.trim() || !guestEmail.trim() || !guestPhone.trim() || !guestAge.trim() || !guestState.trim()) {
      return toast.error('Please fill all fields')
    }
    setGuestPaying(true)
    try {
      const endpoint = itemType === 'package' ? '/phonepe/guest-package' : '/phonepe/guest-course'
      const payload: any = {
        name: guestName.trim(),
        email: guestEmail.trim(),
        phone: guestPhone.trim(),
        age: guestAge.trim(),
        state: guestState.trim(),
        promoCode: promoStatus === 'valid' ? promoCode : undefined,
        couponCode: couponStatus === 'valid' ? couponCode : undefined,
      }
      if (itemType === 'package') {
        if (packageId) payload.packageId = packageId; else payload.tier = tier
        payload.isEmi = payMode === 'emi'
      } else {
        payload.courseId = courseId
      }
      const { data } = await api.post(endpoint, payload)
      setAuth(data.user, data.accessToken, data.refreshToken)
      if (data.redirectUrl) window.location.href = data.redirectUrl
      else toast.error('Could not get payment URL')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Something went wrong')
    } finally {
      setGuestPaying(false)
    }
  }

  // Show guest checkout form when not logged in (both course and package)
  const showGuestForm = _hasHydrated && !user

  if (!_hasHydrated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'radial-gradient(ellipse at center,#0d0d1a 0%,#050508 100%)' }}>
        <Loader2 className="w-10 h-10 animate-spin text-white/30" />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at 50% 0%,#0d1035 0%,#05050f 65%)' }}>
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[450px] rounded-full opacity-15 blur-3xl"
          style={{ background: tc.headerGrad }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6 sm:py-10">
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <Link href={itemType === 'package' ? `/packages/${packageId || tier}` : `/courses/${courseId}`}
            className="inline-flex items-center gap-2 text-white/35 hover:text-white/60 text-sm transition-colors mb-7">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_400px] gap-6 lg:gap-8 items-start">

          {/* ── Left ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Complete Your Order</h1>
              <p className="text-white/35 text-sm mt-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Secure checkout powered by PhonePe
              </p>
            </div>

            {/* Account */}
            <div className="rounded-2xl border p-5" style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.08)' }}>
              <p className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-4">Your Details</p>
              {showGuestForm ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-white/40 mb-1.5">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                      <input value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="Enter your full name"
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                      <input value={guestEmail} onChange={e => setGuestEmail(e.target.value)} placeholder="Enter your email" type="email"
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1.5">Mobile Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                      <input value={guestPhone} onChange={e => setGuestPhone(e.target.value)} placeholder="Enter your mobile number" type="tel"
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-all" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-white/40 mb-1.5">Age</label>
                      <input value={guestAge} onChange={e => setGuestAge(e.target.value)} placeholder="e.g. 22" type="number" min="10" max="80"
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 mb-1.5">State</label>
                      <select value={guestState} onChange={e => setGuestState(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#0d0f1c] border border-white/10 text-white text-sm focus:outline-none focus:border-white/30 transition-all">
                        <option value="">Select state</option>
                        {['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Andaman & Nicobar','Chandigarh','Dadra & Nagar Haveli','Daman & Diu','Delhi','Jammu & Kashmir','Ladakh','Lakshadweep','Puducherry'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="text-white/25 text-xs">Your account & login credentials will be sent to your WhatsApp after payment.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-white/40 mb-1.5">Full Name</label>
                      <input value={user!.name} readOnly className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/8 text-white text-sm cursor-not-allowed opacity-60" />
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 mb-1.5">Email</label>
                      <input value={user!.email} readOnly className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/8 text-white text-sm cursor-not-allowed opacity-60" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-white/40 mb-1.5">Age</label>
                      <input value={guestAge} onChange={e => setGuestAge(e.target.value)} placeholder="e.g. 22" type="number" min="10" max="80"
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 mb-1.5">State</label>
                      <select value={guestState} onChange={e => setGuestState(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#0d0f1c] border border-white/10 text-white text-sm focus:outline-none focus:border-white/30 transition-all">
                        <option value="">Select state</option>
                        {['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Andaman & Nicobar','Chandigarh','Dadra & Nagar Haveli','Daman & Diu','Delhi','Jammu & Kashmir','Ladakh','Lakshadweep','Puducherry'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Discount codes */}
            <div className="rounded-2xl border p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.08)' }}>
              <p className="text-xs font-semibold text-white/35 uppercase tracking-widest">Discount Codes</p>
              <CodeField label="Partner / Promo Code" icon={Tag} placeholder="E.g. TLABCD12"
                value={promoCode} onChange={v => { setPromoCode(v); setPromoStatus('idle'); setPromoSuccessMsg(''); setPromoErrorMsg('') }}
                onValidate={handlePromo} status={promoStatus}
                accentColor={tc.accentColor} loading={promoLoading}
                successMsg={promoSuccessMsg} errorMsg={promoErrorMsg} />
              <CodeField label="Coupon Code (Optional)" icon={Ticket} placeholder="E.g. SAVE20"
                value={couponCode} onChange={v => { setCouponCode(v); setCouponStatus('idle') }}
                onValidate={handleCoupon} status={couponStatus}
                accentColor={tc.accentColor} loading={couponLoading} />
            </div>

            {/* Payment mode */}
            {showEmi && (
              <div className="rounded-2xl border p-5" style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.08)' }}>
                <p className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-4">Payment Mode</p>
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
                          <p className="text-sm font-bold text-white">Pay Full</p>
                          <p className="text-xs text-white/40 mt-0.5">{fmt(totalPayable)} one-time</p>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-5 h-5 mb-2" style={{ color: tc.accentColor }} />
                          <p className="text-sm font-bold text-white">4 Easy Installments</p>
                          <p className="text-xs text-white/40 mt-0.5">{fmt(emiAmount)} × 4 (0/15/30/45 days)</p>
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
                    className="mt-3 px-4 py-3 rounded-xl text-xs text-amber-300/80 border border-amber-500/20 bg-amber-500/5">
                    <span className="font-bold text-amber-400">Note:</span> Pay {fmt(emiAmount)} today, then Day 15, Day 30 &amp; Day 45. Missed installment will suspend access.
                  </motion.div>
                )}
              </div>
            )}

            {/* ── ORDER SUMMARY ── */}
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)' }}>
              <div className="px-5 pt-5 pb-3 border-b border-white/5">
                <p className="text-xs font-semibold text-white/35 uppercase tracking-widest">Order Summary</p>
              </div>

              <div className="p-5 space-y-3 text-sm">
                {/* Base price */}
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Package Price</span>
                  <span className="text-white font-medium">{fmt(basePrice)}</span>
                </div>

                {/* Promo discount */}
                {promoSaving > 0 && (
                  <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <BadgePercent className="w-3.5 h-3.5" /> Promo Discount
                    </span>
                    <span className="text-emerald-400 font-semibold">− {fmt(promoSaving)}</span>
                  </motion.div>
                )}

                {/* Coupon discount */}
                {couponSaving > 0 && (
                  <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <Ticket className="w-3.5 h-3.5" /> Coupon Discount
                    </span>
                    <span className="text-emerald-400 font-semibold">− {fmt(couponSaving)}</span>
                  </motion.div>
                )}

                {/* After discount subtotal */}
                {totalSaving > 0 && (
                  <>
                    <div className="border-t border-white/8 pt-3 flex justify-between items-center">
                      <span className="text-white/50">After Discount</span>
                      <span className="text-white font-medium">{fmt(afterDiscount)}</span>
                    </div>
                  </>
                )}

                {/* GST */}
                {gstAmount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 text-white/50">
                      <Percent className="w-3.5 h-3.5" /> GST (18%)
                    </span>
                    <span className="text-white/70">+ {fmt(gstAmount)}</span>
                  </div>
                )}

                {/* Total */}
                <div className="border-t border-white/10 pt-3 mt-1">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold text-base">
                      {payMode === 'emi' ? `Pay Now (1 of ${EMI_INSTALLMENTS})` : 'Total Payable'}
                    </span>
                    <span className="text-xl font-black" style={{ color: tc.accentColor }}>{fmt(payNow)}</span>
                  </div>
                  {payMode === 'emi' && (
                    <p className="text-right text-xs text-white/35 mt-1">Then {fmt(emiAmount)} × 3 more (Day 15, 30, 45)</p>
                  )}
                </div>

                {/* Savings badge */}
                {totalSaving > 0 && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mt-2">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 text-xs font-bold">You're saving {fmt(totalSaving)}!</span>
                  </motion.div>
                )}
              </div>

              {/* Pay button */}
              <div className="px-5 pb-5">
                <motion.button
                  onClick={showGuestForm ? handleGuestPay : handlePay}
                  disabled={(showGuestForm ? guestPaying : paying) || basePrice === 0}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 rounded-2xl font-bold text-white text-base relative overflow-hidden transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: tc.btnGrad, boxShadow: (showGuestForm ? guestPaying : paying) ? 'none' : tc.btnGlow }}>
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {(showGuestForm ? guestPaying : paying)
                      ? <><Loader2 className="w-5 h-5 animate-spin" /> Redirecting to PhonePe…</>
                      : basePrice === 0
                        ? 'Enroll Free'
                        : <><Lock className="w-4 h-4" /> Pay {fmt(payNow)} via PhonePe <ChevronRight className="w-4 h-4" /></>
                    }
                  </span>
                  {!paying && (
                    <motion.div className="absolute inset-0 opacity-20"
                      style={{ background: 'linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.4) 50%,transparent 70%)' }}
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }} />
                  )}
                </motion.button>

                <div className="flex items-center justify-center gap-4 mt-4 text-xs text-white/25">
                  <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> 256-bit SSL</span>
                  <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> Secure</span>
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Instant Access</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Right: Item card ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="lg:sticky lg:top-6">

            <div className="rounded-2xl overflow-hidden border" style={{ borderColor: itemType === 'course' ? 'rgba(99,102,241,0.5)' : tc.borderColor, boxShadow: `0 0 50px ${itemType === 'course' ? 'rgba(99,102,241,0.25)' : tc.glowColor}` }}>
              {/* Header */}
              <div className="p-6 relative overflow-hidden" style={{ background: itemType === 'course' ? 'linear-gradient(135deg,#1e1b4b 0%,#312e81 60%,#4338ca 100%)' : tc.headerGrad }}>
                <div className="absolute inset-0 opacity-20"
                  style={{ backgroundImage: 'radial-gradient(circle at 70% 50%,rgba(255,255,255,0.2) 0%,transparent 60%)' }} />
                <div className="relative z-10">
                  <div className="text-4xl mb-3">{itemType === 'course' ? '🎓' : tc.emoji}</div>
                  <h2 className="text-xl font-bold text-white">{item?.name}</h2>
                  <p className="text-white/55 text-sm mt-0.5">{itemType === 'course' ? (item?.instructor ? `By ${item.instructor}` : 'Online Course') : tc.tagline}</p>

                  {/* Price display */}
                  <div className="mt-5 space-y-1">
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-black text-white">{fmt(totalPayable)}</span>
                      {totalSaving > 0 && <span className="text-white/35 line-through text-sm mb-1">{fmt(basePrice)}</span>}
                    </div>
                    {gstAmount > 0 && <p className="text-white/45 text-xs">incl. GST ({fmt(gstAmount)})</p>}
                    {payMode === 'emi' && <p className="text-white/55 text-xs">or {fmt(emiAmount)} × {EMI_INSTALLMENTS} installments</p>}
                    {totalSaving > 0 && (
                      <div className="inline-flex items-center gap-1 mt-1 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 text-xs font-bold">Save {fmt(totalSaving)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Features */}
              {item?.features && item.features.length > 0 && (
                <div className="p-5" style={{ background: 'rgba(0,0,0,0.45)' }}>
                  <p className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-3">What's Included</p>
                  <ul className="space-y-2.5">
                    {item.features.slice(0, 8).map((f: string, i: number) => (
                      <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.04 }}
                        className="flex items-start gap-2.5 text-sm text-white/70">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: tc.accentColor }} />
                        {f}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Trust */}
              <div className="px-5 pb-5 grid grid-cols-2 gap-2" style={{ background: 'rgba(0,0,0,0.45)' }}>
                {[
                  { icon: ShieldCheck, text: 'Secure Payment' },
                  { icon: CheckCircle2, text: 'Instant Access' },
                  { icon: Award, text: 'Certified Courses' },
                  { icon: Clock, text: 'Lifetime Access' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-xs text-white/35 px-3 py-2 rounded-lg bg-white/4">
                    <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: tc.accentColor }} />
                    {text}
                  </div>
                ))}
              </div>

              {/* EMI schedule */}
              {payMode === 'emi' && showEmi && (
                <div className="mx-5 mb-5 rounded-xl p-4 border text-xs space-y-2.5" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
                  <p className="text-white/35 font-semibold uppercase tracking-wider mb-1">Installment Schedule</p>
                  {EMI_DAYS.map((day, i) => (
                    <div key={i} className="flex justify-between text-white/55">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        Installment {i + 1} {day === 0 ? '(Today)' : `(Day +${day})`}
                      </span>
                      <span className="font-bold" style={{ color: tc.accentColor }}>{fmt(emiAmount)}</span>
                    </div>
                  ))}
                  <div className="border-t border-white/8 pt-2 flex justify-between text-white/60">
                    <span>Total</span>
                    <span className="font-bold text-white">{fmt(totalPayable)}</span>
                  </div>
                </div>
              )}
            </div>

            <p className="text-center text-xs text-white/20 mt-4">
              Need help?{' '}
              <a href="https://wa.me/919999999999" target="_blank" rel="noopener noreferrer"
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'radial-gradient(ellipse at center,#0d0d1a 0%,#050508 100%)' }}>
        <Loader2 className="w-10 h-10 animate-spin text-white/30" />
      </div>
    }>
      <CheckoutInner />
    </Suspense>
  )
}
