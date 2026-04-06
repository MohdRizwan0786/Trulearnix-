'use client'
import { motion } from 'framer-motion'
import { Video, Users, Clock, ChevronRight, Mic, MonitorPlay, Calendar, Sparkles, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const classes = [
  { title:'Full Stack Web Dev — Batch 12', mentor:'Aryan Kapoor', students:247, time:'Today, 7:00 PM',     status:'live',     tag:'Web Dev',      color:'from-violet-600 to-indigo-600',  glow:'rgba(124,58,237,0.3)' },
  { title:'Data Science with Python',      mentor:'Priya Mehta',  students:183, time:'Today, 9:00 PM',     status:'upcoming', tag:'Data Science', color:'from-blue-600 to-cyan-600',      glow:'rgba(6,182,212,0.25)' },
  { title:'UI/UX Design Masterclass',      mentor:'Sakshi Jain',  students:95,  time:'Tomorrow, 6:30 PM', status:'upcoming', tag:'Design',       color:'from-pink-600 to-rose-600',      glow:'rgba(236,72,153,0.25)' },
  { title:'React Native — Mobile Apps',    mentor:'Vikram Singh', students:142, time:'Tomorrow, 8:00 PM', status:'upcoming', tag:'Mobile Dev',   color:'from-green-600 to-emerald-600',  glow:'rgba(16,185,129,0.25)' },
]

const highlights = [
  { icon:Mic,          title:'Ask Questions Live',   desc:'Real-time Q&A during every session',        color:'text-violet-400', bg:'rgba(124,58,237,0.12)' },
  { icon:MonitorPlay,  title:'Watch Recordings',     desc:'All sessions recorded, available 24/7',      color:'text-cyan-400',   bg:'rgba(6,182,212,0.12)'  },
  { icon:Users,        title:'Batch Learning',       desc:'Learn with peers in cohort-based batches',   color:'text-fuchsia-400',bg:'rgba(217,70,239,0.12)' },
  { icon:Calendar,     title:'Flexible Schedule',    desc:'Morning, evening & weekend batches',         color:'text-amber-400',  bg:'rgba(245,158,11,0.12)' },
]

function ClassCard({ cls, i }: { cls: typeof classes[0], i: number }) {
  return (
    <motion.div
      initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }}
      transition={{ delay:i*0.08 }} viewport={{ once:true }}
      className="flex-shrink-0 w-[300px] sm:w-auto flex items-center gap-4 rounded-2xl p-4 transition-all duration-200 group cursor-pointer hover:-translate-y-0.5"
      style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}
    >
      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cls.color} flex items-center justify-center flex-shrink-0`}
        style={{ boxShadow:`0 8px 24px ${cls.glow}` }}>
        <Video className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="text-xs text-gray-500 px-2 py-0.5 rounded-full" style={{ background:'rgba(255,255,255,0.05)' }}>{cls.tag}</span>
          {cls.status === 'live' ? (
            <span className="live-badge text-[10px] px-2 py-0.5">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full live-dot" />LIVE NOW
            </span>
          ) : (
            <span className="chip text-[10px]">UPCOMING</span>
          )}
        </div>
        <h3 className="text-white font-bold text-sm truncate group-hover:text-violet-400 transition-colors">{cls.title}</h3>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
          <span>by {cls.mentor}</span>
          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{cls.students}</span>
          <span className="hidden sm:flex items-center gap-1"><Clock className="w-3 h-3" />{cls.time}</span>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-700 group-hover:text-violet-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
    </motion.div>
  )
}

export default function LiveClassesSection() {
  return (
    <section className="py-24 px-4 relative overflow-hidden section-alt">
      <div className="absolute inset-0 pointer-events-none"
        style={{ background:'radial-gradient(ellipse 60% 60% at 80% 40%, rgba(239,68,68,0.05), transparent)' }} />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 gap-4">
          <div>
            <motion.div initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }}
              className="inline-flex items-center gap-2 text-xs font-black px-4 py-1.5 rounded-full mb-5"
              style={{ background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.25)', color:'#f87171' }}>
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full live-dot" />LIVE CLASSES
            </motion.div>
            <motion.h2 initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
              className="font-black text-white leading-tight"
              style={{ fontSize:'clamp(2rem,5vw,3.5rem)' }}>
              Learn Live with{' '}
              <span className="gradient-text">Expert Mentors</span>
            </motion.h2>
          </div>
          <Link href="/live-classes" className="flex items-center gap-1.5 text-violet-400 hover:text-white font-bold text-sm whitespace-nowrap transition-colors group">
            View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Class list — mobile: horizontal scroll */}
          <div>
            {/* Desktop: stacked */}
            <div className="hidden sm:flex flex-col gap-3">
              {classes.map((cls, i) => <ClassCard key={i} cls={cls} i={i} />)}
            </div>
            {/* Mobile: horizontal scroll */}
            <div className="sm:hidden scroll-track pb-3">
              {classes.map((cls, i) => <ClassCard key={i} cls={cls} i={i} />)}
            </div>
          </div>

          {/* Highlights grid */}
          <div className="grid grid-cols-2 gap-3">
            {highlights.map((h, i) => (
              <motion.div key={i}
                initial={{ opacity:0, scale:0.93 }} whileInView={{ opacity:1, scale:1 }}
                transition={{ delay:i*0.09 }} viewport={{ once:true }}
                className="rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1"
                style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: h.bg }}>
                  <h.icon className={`w-5 h-5 ${h.color}`} />
                </div>
                <h3 className="font-black text-white text-sm mb-1.5">{h.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{h.desc}</p>
              </motion.div>
            ))}

            {/* CTA card */}
            <motion.div
              initial={{ opacity:0, y:14 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
              className="col-span-2 rounded-2xl p-6 text-center relative overflow-hidden"
              style={{ background:'linear-gradient(135deg,rgba(124,58,237,0.15),rgba(217,70,239,0.08),rgba(79,70,229,0.12))', border:'1px solid rgba(124,58,237,0.25)' }}>
              <Sparkles className="absolute top-3 right-4 w-5 h-5 text-violet-500/20" />
              <p className="text-gray-300 text-sm font-semibold mb-1">
                🎓 Next batch starts <strong className="text-white">Monday</strong>
              </p>
              <p className="text-gray-500 text-xs mb-4">Only 47 seats remaining — filling fast!</p>
              <Link href="/register" className="btn-primary text-sm py-2.5 px-8 inline-flex">
                Reserve Your Seat
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
