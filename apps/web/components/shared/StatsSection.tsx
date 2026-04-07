'use client'
import { motion } from 'framer-motion'
import { Users, BookOpen, Award, TrendingUp, Star, Globe, Video, Zap } from 'lucide-react'

const stats = [
  { icon: Users,     value: '50,000+', label: 'Active Students',    color: 'text-violet-400', glow: 'rgba(124,58,237,0.18)' },
  { icon: Video,     value: '1,200+',  label: 'Live Sessions Done', color: 'text-red-400',    glow: 'rgba(239,68,68,0.15)'  },
  { icon: BookOpen,  value: '500+',    label: 'Expert Courses',     color: 'text-blue-400',   glow: 'rgba(59,130,246,0.15)' },
  { icon: Award,     value: '20,000+', label: 'Certificates Issued',color: 'text-amber-400',  glow: 'rgba(245,158,11,0.15)' },
  { icon: TrendingUp,value: '₹2Cr+',   label: 'Partner Earnings',   color: 'text-green-400',  glow: 'rgba(34,197,94,0.15)'  },
  { icon: Star,      value: '4.9/5',   label: 'Platform Rating',    color: 'text-orange-400', glow: 'rgba(249,115,22,0.15)' },
  { icon: Globe,     value: '50+',     label: 'Cities Covered',     color: 'text-cyan-400',   glow: 'rgba(6,182,212,0.15)'  },
  { icon: Zap,       value: '98%',     label: 'Completion Rate',    color: 'text-fuchsia-400',glow: 'rgba(217,70,239,0.15)' },
]

export default function StatsSection() {
  return (
    <section className="py-10 md:py-14 relative overflow-hidden">
      {/* Subtle separator line */}
      <div className="absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.2), transparent)' }} />
      <div className="absolute inset-x-0 bottom-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.2), transparent)' }} />

      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
          {stats.map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.06, y: -2 }}
              className="bento p-4 text-center cursor-default group transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                style={{ background: s.glow }}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div className="text-lg font-black text-white leading-tight">{s.value}</div>
              <div className="text-[11px] text-gray-500 mt-0.5 leading-tight">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
