'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Zap, Video, Award, Shield, RefreshCcw, CreditCard } from 'lucide-react'

export default function CTASection() {
  return (
    <section className="py-14 md:py-24 px-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(124,58,237,0.1) 0%, transparent 70%)' }} />

      <div className="max-w-4xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="animated-border"
        >
          <div className="rounded-[19px] overflow-hidden"
            style={{ background: 'linear-gradient(160deg, #0d0f1c, #0a0c15, #0d1020)' }}>

            {/* Promo banner */}
            <div className="py-2.5 px-4 text-center"
              style={{ background: 'linear-gradient(90deg, #7c3aed, #6366f1, #7c3aed)' }}>
              <p className="text-white text-xs font-bold">
                🎉 Limited Offer — First month FREE with code{' '}
                <strong className="bg-white/20 px-2 py-0.5 rounded font-black tracking-wider">LEARN2024</strong>
              </p>
            </div>

            <div className="p-6 sm:p-10 md:p-16 text-center">
              {/* Feature pills */}
              <div className="flex items-center justify-center gap-4 mb-10 flex-wrap">
                {[
                  { icon: Video, label: 'Live Classes' },
                  { icon: Award, label: 'AI Certificate' },
                  { icon: Zap, label: 'Earn & Grow' },
                ].map((f, i) => (
                  <div key={i}
                    className="flex items-center gap-2 text-sm text-gray-300 px-4 py-2 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <f.icon className="w-4 h-4 text-violet-400" />
                    {f.label}
                  </div>
                ))}
              </div>

              {/* Headline */}
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-5 leading-tight">
                Ready to{' '}
                <span className="gradient-shift-text">Transform</span>
                <br />
                Your Career?
              </h2>

              <p className="text-gray-400 text-base sm:text-lg mb-8 sm:mb-12 max-w-xl mx-auto leading-relaxed">
                Join 50,000+ learners. Start with free courses, attend live classes,
                earn certificates, and grow your income — all in one platform.
              </p>

              {/* CTA buttons */}
              <div className="flex flex-col xs:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-10">
                <Link href="/register" className="btn-primary text-base sm:text-lg px-8 sm:px-12 py-3.5 sm:py-4 group w-full xs:w-auto">
                  Start Learning Free
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/courses" className="btn-outline text-sm sm:text-base px-6 sm:px-10 py-3.5 sm:py-4 w-full xs:w-auto">
                  Browse Courses
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
        </motion.div>
      </div>
    </section>
  )
}
