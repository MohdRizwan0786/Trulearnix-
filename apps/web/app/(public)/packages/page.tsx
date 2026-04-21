'use client'
import { useQuery } from '@tanstack/react-query'
import { useRef, useState, useEffect, useCallback } from 'react'
import { packageAPI } from '@/lib/api'
import { Check, Zap, Shield, Sparkles, Crown, Flame, Rocket, Star, ChevronLeft, ChevronRight, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

/* ── Palette assigned by index ── */
const PALETTE = [
  { glow: 'rgba(59,130,246,0.5)', glowSoft: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.4)', accent: '#60a5fa', gradient: 'from-blue-600 via-blue-700 to-cyan-700', btnGrad: '#2563eb,#0891b2', decorColor: 'rgba(59,130,246,0.08)', icon: Rocket },
  { glow: 'rgba(139,92,246,0.6)', glowSoft: 'rgba(139,92,246,0.2)', border: 'rgba(139,92,246,0.5)', accent: '#a78bfa', gradient: 'from-violet-600 via-purple-700 to-fuchsia-700', btnGrad: '#7c3aed,#d946ef', decorColor: 'rgba(139,92,246,0.1)', icon: Flame },
  { glow: 'rgba(234,88,12,0.5)', glowSoft: 'rgba(234,88,12,0.15)', border: 'rgba(234,88,12,0.4)', accent: '#fb923c', gradient: 'from-orange-600 via-orange-700 to-red-700', btnGrad: '#ea580c,#dc2626', decorColor: 'rgba(234,88,12,0.08)', icon: Star },
  { glow: 'rgba(245,158,11,0.6)', glowSoft: 'rgba(245,158,11,0.2)', border: 'rgba(245,158,11,0.5)', accent: '#fbbf24', gradient: 'from-yellow-500 via-amber-600 to-orange-600', btnGrad: '#d97706,#ea580c', decorColor: 'rgba(245,158,11,0.08)', icon: Crown },
  { glow: 'rgba(6,182,212,0.5)', glowSoft: 'rgba(6,182,212,0.15)', border: 'rgba(6,182,212,0.4)', accent: '#34d399', gradient: 'from-teal-600 via-teal-700 to-cyan-700', btnGrad: '#0d9488,#0891b2', decorColor: 'rgba(6,182,212,0.08)', icon: Zap },
  { glow: 'rgba(225,29,72,0.5)', glowSoft: 'rgba(225,29,72,0.15)', border: 'rgba(225,29,72,0.4)', accent: '#fb7185', gradient: 'from-rose-600 via-rose-700 to-pink-700', btnGrad: '#e11d48,#db2777', decorColor: 'rgba(225,29,72,0.08)', icon: Shield },
]

function getPalette(i: number) { return PALETTE[i % PALETTE.length] }

/* ── helper: compute commission amount ── */
function calcComm(price: number, type: string, value: number) {
  if (!value) return 0
  return type === 'flat' ? value : Math.round(price * value / 100)
}

/* ── Single Card ── */
function PackageCard({ pkg, index, active }: { pkg: any; index: number; active?: boolean }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const p = getPalette(index)
  const Icon = p.icon
  const features: string[] = pkg.features || []

  const applyTilt = (x: number, y: number, rect: DOMRect) => {
    const card = cardRef.current; if (!card) return
    const cx = rect.width / 2, cy = rect.height / 2
    card.style.transform = `perspective(900px) rotateX(${-((y - cy) / cy) * 10}deg) rotateY(${((x - cx) / cx) * 12}deg) translateZ(10px) scale(1.03)`
    card.style.boxShadow = `0 30px 80px ${p.glow}, 0 10px 30px rgba(0,0,0,0.6), 0 0 0 1px ${p.border}`
    const shine = card.querySelector('.card-shine') as HTMLElement
    if (shine) { shine.style.opacity = '1'; shine.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.12) 0%, transparent 60%)` }
  }
  const resetTilt = () => {
    const card = cardRef.current; if (!card) return
    card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale(1)'
    card.style.boxShadow = `0 8px 32px ${p.glowSoft}, 0 2px 8px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)`
    const shine = card.querySelector('.card-shine') as HTMLElement
    if (shine) shine.style.opacity = '0'
  }

  return (
    <div className="relative scene-3d pt-5 flex flex-col h-full">
      <div className="absolute inset-0 rounded-3xl blur-2xl opacity-25 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 80%, ${p.glow}, transparent 70%)` }} />

      {pkg.badge && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap">
          <div className="px-4 py-1.5 rounded-full text-xs font-black text-white flex items-center gap-1.5"
            style={{ background: `linear-gradient(135deg, ${p.accent}, ${p.btnGrad.split(',')[1]})`, boxShadow: `0 4px 20px ${p.glow}` }}>
            <Sparkles className="w-3 h-3" /> {pkg.badge}
          </div>
        </div>
      )}

      <div ref={cardRef}
        onMouseMove={e => { const r = e.currentTarget.getBoundingClientRect(); applyTilt(e.clientX - r.left, e.clientY - r.top, r) }}
        onMouseLeave={resetTilt}
        className="relative rounded-3xl overflow-hidden flex flex-col flex-1 cursor-default"
        style={{
          background: 'rgba(10,10,20,0.9)',
          border: `1px solid ${active ? p.border : 'rgba(255,255,255,0.07)'}`,
          boxShadow: `0 8px 32px ${p.glowSoft}, 0 2px 8px rgba(0,0,0,0.4)`,
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          transformStyle: 'preserve-3d',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="card-shine absolute inset-0 rounded-3xl pointer-events-none z-10 opacity-0 transition-opacity duration-200" />
        <div className="absolute -bottom-16 -right-16 w-52 h-52 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${p.decorColor}, transparent 70%)` }} />
        <div className={`h-1.5 w-full bg-gradient-to-r ${p.gradient} flex-shrink-0`} />

        <div className="relative z-10 flex flex-col flex-1 p-5 sm:p-7">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${p.glowSoft}`, boxShadow: `0 4px 20px ${p.glow}`, border: `1px solid ${p.border}` }}>
              <Icon className="w-6 h-6" style={{ color: p.accent }} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">{pkg.name}</h3>
              {pkg.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{pkg.description}</p>}
            </div>
          </div>

          <div className="mb-5 pb-5 border-b border-white/8">
            <span className="text-4xl font-black leading-none block"
              style={{ background: `linear-gradient(135deg, #fff 30%, ${p.accent})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              ₹{(pkg.price || 0).toLocaleString()}
            </span>
            <p className="text-xs text-gray-500 mt-1">one-time • GST extra</p>
          </div>

          <ul className="space-y-2.5 flex-1 mb-6">
            {features.map((f: string) => (
              <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: p.glowSoft, border: `1px solid ${p.border}` }}>
                  <Check className="w-2.5 h-2.5" style={{ color: p.accent }} />
                </div>
                {f}
              </li>
            ))}
          </ul>

          <Link href={`/packages/${pkg._id}`}
            className="block w-full text-center py-3.5 rounded-2xl font-black text-sm transition-all duration-200 hover:scale-105 active:scale-95"
            style={{ background: `linear-gradient(135deg, ${p.btnGrad})`, boxShadow: `0 4px 24px ${p.glow}`, color: '#fff' }}>
            Get {pkg.name} →
          </Link>
        </div>
      </div>
    </div>
  )
}

/* ── Mobile Slider ── */
function MobileSlider({ packages }: { packages: any[] }) {
  const [active, setActive] = useState(0)
  const sliderRef = useRef<HTMLDivElement>(null)

  const scrollToCard = useCallback((index: number) => {
    const slider = sliderRef.current; if (!slider) return
    slider.scrollTo({ left: index * (slider.offsetWidth * 0.78 + 16), behavior: 'smooth' })
    setActive(index)
  }, [])

  useEffect(() => {
    const slider = sliderRef.current; if (!slider) return
    let timeout: ReturnType<typeof setTimeout>
    const onScroll = () => {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        const cardWidth = slider.offsetWidth * 0.78 + 16
        setActive(Math.min(Math.max(Math.round(slider.scrollLeft / cardWidth), 0), packages.length - 1))
      }, 80)
    }
    slider.addEventListener('scroll', onScroll, { passive: true })
    return () => { slider.removeEventListener('scroll', onScroll); clearTimeout(timeout) }
  }, [packages.length, scrollToCard])

  if (packages.length === 0) return null

  return (
    <div className="block lg:hidden mb-14">
      <div ref={sliderRef} className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 px-[11%]"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}>
        {packages.map((pkg, i) => (
          <div key={pkg._id} className="snap-center flex-shrink-0 transition-all duration-300"
            style={{ width: '78%', opacity: active === i ? 1 : 0.55, transform: active === i ? 'scale(1)' : 'scale(0.93)' }}
            onClick={() => active !== i && scrollToCard(i)}>
            <PackageCard pkg={pkg} index={i} active={active === i} />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-4 mt-4">
        <button onClick={() => scrollToCard(Math.max(active - 1, 0))} disabled={active === 0}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
          <ChevronLeft className="w-4 h-4 text-white" />
        </button>
        <div className="flex items-center gap-2">
          {packages.map((pkg, i) => {
            const p = getPalette(i)
            return (
              <button key={pkg._id} onClick={() => scrollToCard(i)} className="rounded-full transition-all duration-300"
                style={{ width: active === i ? 24 : 7, height: 7, background: active === i ? p.accent : 'rgba(255,255,255,0.2)', boxShadow: active === i ? `0 0 8px ${p.glow}` : 'none' }} />
            )
          })}
        </div>
        <button onClick={() => scrollToCard(Math.min(active + 1, packages.length - 1))} disabled={active === packages.length - 1}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
          <ChevronRight className="w-4 h-4 text-white" />
        </button>
      </div>
      {packages[active] && (
        <p className="text-center text-xs font-bold mt-3 transition-all" style={{ color: getPalette(active).accent }}>
          {packages[active].name} Plan
        </p>
      )}
    </div>
  )
}

/* ── Income Matrix ── */
function IncomeMatrix({ packages }: { packages: any[] }) {
  if (packages.length < 2) return null

  return (
    <div className="card section-3d-shadow mb-12 sm:mb-16">
      <div className="text-center mb-5">
        <h2 className="text-xl sm:text-2xl font-black text-white">Income Matrix</h2>
        <p className="text-gray-400 text-xs sm:text-sm mt-1">Your package × sold package = your L1 income per referral</p>
      </div>
      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full text-xs sm:text-sm min-w-[480px]">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 px-2 sm:px-4 text-gray-400 font-semibold">My Package</th>
              {packages.map((sold, si) => {
                const p = getPalette(si)
                return <th key={sold._id} className="text-center py-3 px-2 sm:px-4 font-semibold" style={{ color: p.accent }}>{sold.name}</th>
              })}
            </tr>
          </thead>
          <tbody>
            {packages.map((earner, ei) => {
              const ep = getPalette(ei)
              return (
                <tr key={earner._id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="py-3 px-2 sm:px-4">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ep.accent }} />
                      {earner.name}
                    </span>
                  </td>
                  {packages.map((sold, si) => {
                    // find earner's commission row in this sold package (earnerTier may be _id or tier slug)
                    const row = (sold.partnerEarnings || []).find((pe: any) =>
                      pe.earnerTier === earner._id || pe.earnerTier === earner.tier || pe.earnerTier === earner.name
                    )
                    const amount = row ? calcComm(sold.price, row.type, row.value) : 0
                    const sp = getPalette(si)
                    return (
                      <td key={sold._id} className="py-3 px-2 sm:px-4 text-center font-semibold text-white">
                        {amount > 0 ? (
                          <span style={{ color: sp.accent }}>₹{amount.toLocaleString()}</span>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-4 p-3 sm:p-4 bg-primary-500/10 rounded-xl border border-primary-500/20">
        <p className="text-xs sm:text-sm text-primary-300">
          <span className="font-bold">3-Level MLM:</span> Matrix shows Level 1 earnings. L2 & L3 rates are set per package by admin.
        </p>
      </div>
    </div>
  )
}

/* ── Main Page ── */
export default function PackagesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['packages-public'],
    queryFn: () => packageAPI.getAll().then(r => r.data?.packages || []),
  })

  const packages: any[] = (data || []).filter((p: any) => p.isActive)

  if (isLoading) return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
    </div>
  )

  return (
    <div className="min-h-screen bg-dark-900 py-14 sm:py-20 px-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-64 sm:w-96 h-64 sm:h-96 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
      <div className="absolute bottom-0 right-1/4 w-56 sm:w-80 h-56 sm:h-80 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #d946ef, transparent)' }} />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-10 sm:mb-16 px-2">
          <span className="section-label mb-4 inline-flex">
            <Sparkles className="w-3.5 h-3.5" /> Pricing Plans
          </span>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white mt-4 mb-4 leading-tight">
            Choose Your <span className="gradient-shift-text">Plan</span>
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto text-base sm:text-lg">
            Your package tier determines your income share rate.{' '}
            <span className="text-white font-semibold">Higher tier = more earnings</span> when you help others learn.
          </p>
        </div>

        {packages.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Sparkles className="w-10 h-10 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-semibold">Packages coming soon</p>
            <p className="text-sm mt-1">Check back shortly.</p>
          </div>
        ) : (
          <>
            {/* Mobile slider */}
            <MobileSlider packages={packages} />

            {/* Desktop grid */}
            <div className={`hidden lg:grid gap-8 mb-20 items-stretch ${packages.length <= 2 ? 'grid-cols-2 max-w-3xl mx-auto' : packages.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
              {packages.map((pkg, i) => (
                <div key={pkg._id}>
                  <PackageCard pkg={pkg} index={i} active />
                </div>
              ))}
            </div>

            {/* Income Matrix */}
            <IncomeMatrix packages={packages} />
          </>
        )}

        {/* FAQs */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-black text-white text-center mb-6 sm:mb-8">Frequently Asked Questions</h2>
          <div className="space-y-3 sm:space-y-4">
            {[
              { q: 'How is income calculated?', a: 'Your income rate is determined by YOUR OWN package tier. Higher the package, more you earn when someone purchases through your referral link.' },
              { q: 'When do I get Partner access?', a: 'Immediately after payment is confirmed. Your Partner Panel is auto-unlocked, a personal partner link is assigned, and a welcome message is sent.' },
              { q: 'What are the partner earning levels?', a: 'Level 1 = direct referrals. Level 2 = their referrals. Level 3 = L2 referrals. All credited to your wallet automatically.' },
              { q: 'When is income paid out?', a: 'Income is credited to your wallet in real-time on every sale. Withdraw anytime (min ₹500) via UPI or bank — processed within 24-48 hours.' },
              { q: 'Is GST applicable?', a: 'Yes, 18% GST is applicable on all package purchases. A GST invoice will be emailed after payment.' },
            ].map(faq => (
              <div key={faq.q} className="card hover:border-primary-500/30 transition-all">
                <div className="flex items-start gap-3">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-white text-sm sm:text-base mb-1">{faq.q}</p>
                    <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-10 sm:mt-12">
          <p className="text-gray-500 text-sm">Have questions? <Link href="/" className="text-primary-400 hover:underline">Contact us</Link></p>
        </div>
      </div>
    </div>
  )
}
