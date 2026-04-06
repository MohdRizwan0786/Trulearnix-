'use client'
import { motion } from 'framer-motion'
import { Video, Users, Clock, ChevronRight, Mic, MonitorPlay, Calendar, Sparkles } from 'lucide-react'
import Link from 'next/link'

const classes = [
  { title: 'Full Stack Web Dev — Batch 12',  mentor: 'Aryan Kapoor', students: 247, time: 'Today, 7:00 PM',     status: 'live',     tag: 'Web Dev',      color: 'from-violet-600 to-indigo-600' },
  { title: 'Data Science with Python',        mentor: 'Priya Mehta',  students: 183, time: 'Today, 9:00 PM',     status: 'upcoming', tag: 'Data Science', color: 'from-blue-600 to-cyan-600'    },
  { title: 'UI/UX Design Masterclass',        mentor: 'Sakshi Jain',  students: 95,  time: 'Tomorrow, 6:30 PM', status: 'upcoming', tag: 'Design',       color: 'from-pink-600 to-rose-600'    },
  { title: 'React Native — Mobile Apps',      mentor: 'Vikram Singh', students: 142, time: 'Tomorrow, 8:00 PM', status: 'upcoming', tag: 'Mobile Dev',   color: 'from-green-600 to-emerald-600'},
]

const highlights = [
  { icon: Mic,         title: 'Ask Questions Live',   desc: 'Real-time Q&A with expert mentors during every session' },
  { icon: MonitorPlay, title: 'Watch Recordings',     desc: 'Missed a class? All sessions are recorded and available 24/7' },
  { icon: Users,       title: 'Batch Learning',       desc: 'Learn with peers in structured cohort-based batches' },
  { icon: Calendar,    title: 'Flexible Schedule',    desc: 'Morning, evening & weekend batches for working professionals' },
]

export default function LiveClassesSection() {
  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.05) 0%, transparent 70%)' }} />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-14 gap-4">
          <div>
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold px-4 py-1.5 rounded-full mb-5">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full live-dot" />
              LIVE CLASSES
            </motion.div>
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight">
              Learn Live with{' '}
              <span className="gradient-text">Expert Mentors</span>
            </motion.h2>
          </div>
          <Link href="/live-classes"
            className="flex items-center gap-1.5 text-violet-400 hover:text-white font-semibold text-sm whitespace-nowrap transition-colors group">
            View All Classes
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Class list */}
          <div className="space-y-3">
            {classes.map((cls, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.09 }} viewport={{ once: true }}
                className="flex items-center gap-4 rounded-2xl p-4 hover:scale-[1.01] transition-all duration-200 group cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${cls.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                  <Video className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-xs text-gray-500 px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.05)' }}>{cls.tag}</span>
                    {cls.status === 'live' ? (
                      <span className="flex items-center gap-1 bg-red-500/20 border border-red-500/25 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full live-dot inline-block" />LIVE NOW
                      </span>
                    ) : (
                      <span className="text-[10px] bg-violet-500/10 text-violet-400 border border-violet-500/20 font-bold px-2 py-0.5 rounded-full">
                        UPCOMING
                      </span>
                    )}
                  </div>
                  <h3 className="text-white font-bold text-sm truncate group-hover:text-violet-400 transition-colors">{cls.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>by {cls.mentor}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{cls.students}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{cls.time}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-violet-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
              </motion.div>
            ))}
          </div>

          {/* Highlights grid */}
          <div className="grid grid-cols-2 gap-3">
            {highlights.map((h, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, scale: 0.94 }} whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.09 }} viewport={{ once: true }}
                className="card-glow p-5">
                <div className="w-10 h-10 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center mb-3">
                  <h.icon className="w-5 h-5 text-violet-400" />
                </div>
                <h3 className="font-bold text-white text-sm mb-1.5">{h.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{h.desc}</p>
              </motion.div>
            ))}

            {/* CTA card spanning full width */}
            <motion.div
              initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="col-span-2 rounded-2xl p-6 text-center relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(79,70,229,0.10))', border: '1px solid rgba(124,58,237,0.2)' }}>
              {/* Background sparkle */}
              <Sparkles className="absolute top-3 right-4 w-5 h-5 text-violet-500/20" />
              <p className="text-gray-300 text-sm mb-1">
                🎓 Next batch starts <strong className="text-white">Monday</strong>
              </p>
              <p className="text-gray-500 text-xs mb-4">Limited seats available — 47 spots left</p>
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
