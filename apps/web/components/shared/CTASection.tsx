'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Zap, Video, Award, Shield, RefreshCcw, CreditCard } from 'lucide-react'
import Tilt3D from '@/components/ui/Tilt3D'

const DEFAULT_PILLS = [
  { label: 'Live Classes' },
  { label: 'AI Certificate' },
  { label: 'Earn & Grow' },
]

const PILL_ICONS = [Video, Award, Zap]

export default function CTASection() {
  const [promoBannerText, setPromoBannerText] = useState('🎉 Limited Offer — First month FREE with code LEARN2024')
  const [promoCode, setPromoCode]             = useState('LEARN2024')
  const [headline, setHeadline]               = useState('Ready to Transform Your Career?')
  const [subheadline, setSubheadline]         = useState('Join our growing community. Start with free courses, attend live classes, earn certificates, and grow your income — all in one platform.')
  const [featurePills, setFeaturePills]       = useState(DEFAULT_PILLS)
  const [primaryCTAText, setPrimaryCTAText]   = useState('Start Learning Free')
  const [primaryCTAHref, setPrimaryCTAHref]   = useState('/register')
  const [secondaryCTAText, setSecondaryCTAText] = useState('Browse Courses')
  const [secondaryCTAHref, setSecondaryCTAHref] = useState('/courses')

  useEffect(() => {
    let subheadlineFromCms = false
    fetch(process.env.NEXT_PUBLIC_API_URL + '/site-content/cta')
      .then(r => r.json())
      .then(res => {
        const d = res.data
        if (!d) return
        if (d.promoBannerText)  setPromoBannerText(d.promoBannerText)
        if (d.promoCode)        setPromoCode(d.promoCode)
        if (d.headline)         setHeadline(d.headline)
        if (d.subheadline)      { setSubheadline(d.subheadline); subheadlineFromCms = true }
        if (d.featurePills?.length) setFeaturePills(d.featurePills)
        if (d.primaryCTAText)   setPrimaryCTAText(d.primaryCTAText)
        if (d.primaryCTAHref)   setPrimaryCTAHref(d.primaryCTAHref)
        if (d.secondaryCTAText) setSecondaryCTAText(d.secondaryCTAText)
        if (d.secondaryCTAHref) setSecondaryCTAHref(d.secondaryCTAHref)
      })
      .catch(() => {})
      .finally(() => {
        if (subheadlineFromCms) return
        fetch(process.env.NEXT_PUBLIC_API_URL + '/public/stats')
          .then(r => r.json())
          .then(d => {
            if (!d.success) return
            const n = d.stats.totalStudents || 0
            if (!n) return
            const fmt = n >= 100000 ? `${Math.floor(n / 100000)}L+` : n >= 1000 ? `${Math.floor(n / 1000)}K+` : `${n}+`
            setSubheadline(`Join ${fmt} learners. Start with free courses, attend live classes, earn certificates, and grow your income — all in one platform.`)
          })
          .catch(() => {})
      })
  }, [])

  // Split headline at known break points for styling
  const headlineParts = headline.split(' ')
  const midpoint = Math.floor(headlineParts.length / 2)
  const line1 = headlineParts.slice(0, midpoint).join(' ')
  const line2 = headlineParts.slice(midpoint).join(' ')

  return (
    <section className="py-10 md:py-14 px-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(124,58,237,0.14) 0%, transparent 70%)' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] rounded-full pointer-events-none blur-3xl"
        style={{ background: 'rgba(217,70,239,0.06)' }} />

      <div className="max-w-4xl mx-auto relative scene-3d">
        <motion.div
          initial={{ opacity: 0, y: 40, rotateX: -10 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          viewport={{ once: true }}
        >
          <Tilt3D intensity={5} glare className="animated-border rounded-[24px]">
            <div className="rounded-[19px] overflow-hidden"
              style={{ background: 'linear-gradient(160deg, #0d0f1c, #0a0c15, #0d1020)' }}>

              {/* Promo banner */}
              <div className="py-2.5 px-4 text-center"
                style={{ background: 'linear-gradient(90deg, #7c3aed, #6366f1, #7c3aed)' }}>
                <p className="text-white text-xs font-bold">
                  {promoBannerText.replace(promoCode, '').trim()}{' '}
                  {promoCode && (
                    <strong className="bg-white/20 px-2 py-0.5 rounded font-black tracking-wider">{promoCode}</strong>
                  )}
                </p>
              </div>

              <div className="p-6 sm:p-10 md:p-16 text-center">
                {/* Feature pills */}
                <div className="flex items-center justify-center gap-4 mb-10 flex-wrap">
                  {featurePills.map((f, i) => {
                    const Icon = PILL_ICONS[i % PILL_ICONS.length]
                    return (
                      <motion.div key={i}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        viewport={{ once: true }}
                        className="flex items-center gap-2 text-sm text-gray-300 px-4 py-2 rounded-full"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)'
                        }}>
                        <Icon className="w-4 h-4 text-violet-400" />
                        {f.label}
                      </motion.div>
                    )
                  })}
                </div>

                {/* Headline */}
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-5 leading-tight text-3d">
                  {line1}{' '}
                  <span className="gradient-shift-text">{line2}</span>
                </h2>

                <p className="text-gray-400 text-base sm:text-lg mb-8 sm:mb-12 max-w-xl mx-auto leading-relaxed">
                  {subheadline}
                </p>

                {/* CTA buttons */}
                <div className="flex flex-col xs:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-10">
                  <Link href={primaryCTAHref} className="btn-primary text-base sm:text-lg px-8 sm:px-12 py-3.5 sm:py-4 group w-full xs:w-auto">
                    {primaryCTAText}
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link href={secondaryCTAHref} className="btn-outline text-sm sm:text-base px-6 sm:px-10 py-3.5 sm:py-4 w-full xs:w-auto">
                    {secondaryCTAText}
                  </Link>
                </div>

                {/* Trust badges */}
                <div className="flex items-center justify-center gap-6 flex-wrap text-xs text-gray-600">
                  {[
                    { icon: CreditCard, label: 'No credit card' },
                    { icon: RefreshCcw, label: 'Cancel anytime' },
                    { icon: Shield, label: '30-day guarantee' },
                  ].map((b, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <b.icon className="w-3.5 h-3.5 text-gray-600" />
                      {b.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Tilt3D>
        </motion.div>
      </div>
    </section>
  )
}
