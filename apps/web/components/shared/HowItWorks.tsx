'use client'
import { motion } from 'framer-motion'
import { UserPlus, Search, Video, Award, DollarSign, ArrowRight } from 'lucide-react'

const steps = [
  { icon: UserPlus,    step: '01', title: 'Create Account',  desc: 'Sign up free in 30 seconds. No credit card needed.',                                              color: 'from-violet-500 to-indigo-500',  glow: 'rgba(124,58,237,0.3)'  },
  { icon: Search,      step: '02', title: 'Choose Course',   desc: 'Browse 500+ expert-curated courses across tech, design & business.',                             color: 'from-indigo-500 to-blue-500',    glow: 'rgba(99,102,241,0.3)'  },
  { icon: Video,       step: '03', title: 'Join Live Class', desc: 'Attend live interactive sessions with real mentors. Ask questions, get instant answers.',        color: 'from-blue-500 to-cyan-500',      glow: 'rgba(59,130,246,0.3)'  },
  { icon: Award,       step: '04', title: 'Get Certified',   desc: 'Complete quizzes & assignments. Download your AI-generated certificate instantly.',             color: 'from-amber-500 to-orange-500',   glow: 'rgba(245,158,11,0.3)'  },
  { icon: DollarSign,  step: '05', title: 'Earn Money',      desc: 'Invite friends to join. Help them learn skills — and earn income on every successful enrollment.',  color: 'from-green-500 to-emerald-500',  glow: 'rgba(34,197,94,0.3)'   },
]

export default function HowItWorks() {
  return (
    <section className="py-14 md:py-24 px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(124,58,237,0.04) 50%, transparent 100%)' }} />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 md:mb-16">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="section-label mb-5">
            SIMPLE PROCESS
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
            From Zero to{' '}
            <span className="gradient-text">Certified Pro</span>
          </motion.h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            5 simple steps to transform your career and start earning
          </p>
        </div>

        {/* Desktop: horizontal flow */}
        <div className="hidden md:grid grid-cols-5 gap-5 relative">
          {/* Gradient connector line */}
          <div className="absolute top-[38px] left-[calc(10%+20px)] right-[calc(10%+20px)] h-px"
            style={{ background: 'linear-gradient(90deg, rgba(124,58,237,0), rgba(124,58,237,0.5), rgba(99,102,241,0.5), rgba(34,197,94,0.4), rgba(34,197,94,0))' }} />

          {steps.map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12 }}
              viewport={{ once: true }}
              className="relative text-center group"
            >
              {/* Step number ghost */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-[5rem] font-black leading-none pointer-events-none select-none"
                style={{ color: 'rgba(255,255,255,0.025)' }}>{s.step}</div>

              {/* Icon circle */}
              <div className={`w-[76px] h-[76px] mx-auto mb-5 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform duration-300`}
                style={{ boxShadow: `0 8px 32px ${s.glow}` }}>
                <s.icon className="w-9 h-9 text-white" />
              </div>

              <h3 className="font-black text-white mb-2 text-sm">{s.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{s.desc}</p>

              {/* Arrow between steps */}
              {i < steps.length - 1 && (
                <div className="absolute top-8 -right-3 z-10">
                  <ArrowRight className="w-5 h-5 text-violet-500/40" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Mobile: vertical timeline */}
        <div className="md:hidden relative pl-14">
          {/* Timeline track */}
          <div className="absolute left-5 top-5 bottom-5 w-0.5 rounded-full"
            style={{ background: 'linear-gradient(180deg, rgba(124,58,237,0.6), rgba(34,197,94,0.4))' }} />

          {steps.map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="relative mb-6 last:mb-0"
            >
              {/* Timeline node */}
              <div className={`absolute -left-14 w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}
                style={{ boxShadow: `0 4px 20px ${s.glow}` }}>
                <s.icon className="w-5 h-5 text-white" />
              </div>

              <div className="rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-black text-gray-600">{s.step}</span>
                  <h3 className="font-bold text-white">{s.title}</h3>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
