'use client'
import { motion } from 'framer-motion'
import { TrendingUp, IndianRupee, Users, Star, ArrowRight, Zap } from 'lucide-react'
import Link from 'next/link'

const earners = [
  { name: 'Rahul S.', location: 'Delhi', earned: '₹82,000', period: 'last month', avatar: 'RS', color: '#a78bfa', invites: 82, tier: 'Pro' },
  { name: 'Priya M.', location: 'Mumbai', earned: '₹1,14,500', period: 'last month', avatar: 'PM', color: '#34d399', invites: 114, tier: 'Elite' },
  { name: 'Amit K.', location: 'Bangalore', earned: '₹47,200', period: 'last month', avatar: 'AK', color: '#60a5fa', invites: 47, tier: 'Pro' },
  { name: 'Sneha R.', location: 'Pune', earned: '₹2,08,000', period: 'last month', avatar: 'SR', color: '#fbbf24', invites: 208, tier: 'Elite' },
  { name: 'Vikram T.', location: 'Hyderabad', earned: '₹63,400', period: 'last month', avatar: 'VT', color: '#f472b6', invites: 63, tier: 'Pro' },
  { name: 'Ananya P.', location: 'Chennai', earned: '₹1,56,000', period: 'last month', avatar: 'AP', color: '#fb923c', invites: 156, tier: 'Elite' },
]

const steps = [
  { num: '01', title: 'Join & Learn', desc: 'Enroll in any plan. Start your Pro or Elite membership.', color: '#a78bfa' },
  { num: '02', title: 'Share Your Link', desc: 'Get your personal invite link. Share it with friends, family, and on social media.', color: '#34d399' },
  { num: '03', title: 'Earn Every Month', desc: 'Help others learn skills — earn 10–25% income on every successful enrollment, every month.', color: '#fbbf24' },
]

export default function EarningsProofSection() {
  return (
    <section className="py-16 md:py-28 px-4 relative overflow-hidden" style={{ background: '#060810' }}>
      {/* bg */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 65%)' }} />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 65%)' }} />
      </div>

      <div className="max-w-7xl mx-auto relative">

        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black mb-5"
            style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', color: '#34d399' }}>
            <IndianRupee className="w-3.5 h-3.5" />
            REAL STUDENT EARNINGS — VERIFIED
          </motion.div>

          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-5">
            Learn &amp; Earn{' '}
            <span style={{ background: 'linear-gradient(135deg,#34d399,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              ₹30K–₹2L+
            </span>
            <span className="block mt-2 text-white">Every Month</span>
          </motion.h2>

          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="text-gray-400 max-w-xl mx-auto text-base">
            Our Earn Program isn't a side hustle — students are replacing their salaries. Help people learn, get rewarded every month.
          </motion.p>
        </div>

        {/* Earner cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-14">
          {earners.map((e, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              viewport={{ once: true }}
              className="relative rounded-2xl p-5 group hover:scale-[1.02] transition-all duration-300"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid rgba(255,255,255,0.08)`,
              }}
              whileHover={{ border: `1px solid ${e.color}33`, boxShadow: `0 8px 32px ${e.color}22` }}>

              {/* Tier badge */}
              <div className="absolute top-4 right-4 text-[10px] font-black px-2.5 py-1 rounded-full"
                style={{ background: `${e.color}22`, color: e.color, border: `1px solid ${e.color}44` }}>
                {e.tier}
              </div>

              <div className="flex items-center gap-3 mb-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0"
                  style={{ background: `${e.color}22`, color: e.color, border: `2px solid ${e.color}44` }}>
                  {e.avatar}
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{e.name}</p>
                  <p className="text-gray-500 text-xs">{e.location}</p>
                </div>
              </div>

              {/* Earning */}
              <div className="flex items-baseline gap-1.5 mb-3">
                <span className="font-black text-2xl" style={{ color: e.color }}>{e.earned}</span>
                <span className="text-gray-500 text-xs">{e.period}</span>
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(e.invites, 100)}%`, background: `linear-gradient(90deg, ${e.color}, ${e.color}88)` }} />
                </div>
                <span className="text-gray-500 text-[10px] font-bold flex-shrink-0">{e.invites} invites</span>
              </div>

              {/* Stars */}
              <div className="flex items-center gap-0.5 mt-3">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />
                ))}
                <span className="text-gray-500 text-[10px] ml-1.5">Verified member</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* How it works */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="rounded-3xl p-8 md:p-10 mb-10"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>

          <h3 className="text-center text-2xl md:text-3xl font-black text-white mb-8">
            How to Start Earning in{' '}
            <span style={{ background: 'linear-gradient(135deg,#34d399,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              3 Simple Steps
            </span>
          </h3>

          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <div key={i} className="relative text-center">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(100%-8px)] w-full h-px z-10"
                    style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.15), transparent)' }} />
                )}
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 font-black text-2xl"
                  style={{ background: `${s.color}18`, border: `1px solid ${s.color}33`, color: s.color }}>
                  {s.num}
                </div>
                <h4 className="text-white font-black mb-2">{s.title}</h4>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4">
            <Link href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-white text-sm transition-all hover:scale-[1.04]"
              style={{ background: 'linear-gradient(135deg,#059669,#0891b2)', boxShadow: '0 8px 32px rgba(5,150,105,0.45)' }}>
              <Zap className="w-4 h-4" />
              Start Earning Today
              <ArrowRight className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Users className="w-4 h-4 text-gray-500" />
              <span>Join <span className="text-white font-bold">50,000+</span> students already earning</span>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
