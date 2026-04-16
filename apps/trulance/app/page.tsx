'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { trulanceAPI } from '@/lib/api'
import {
  ArrowRight, Star, Shield, Zap, Users, Briefcase, TrendingUp,
  Code, Palette, Megaphone, Database, Video, FileText
} from 'lucide-react'

const STATS = [
  { label: 'Active Freelancers', value: '500+', icon: Users },
  { label: 'Projects Posted', value: '200+', icon: Briefcase },
  { label: 'Skills Covered', value: '50+', icon: Star },
  { label: 'Success Rate', value: '94%', icon: TrendingUp },
]

const CATEGORIES = [
  { icon: Code, label: 'Development', color: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/30', text: 'text-blue-400' },
  { icon: Palette, label: 'Design', color: 'from-pink-500/20 to-rose-500/20', border: 'border-pink-500/30', text: 'text-pink-400' },
  { icon: Megaphone, label: 'Marketing', color: 'from-orange-500/20 to-amber-500/20', border: 'border-orange-500/30', text: 'text-orange-400' },
  { icon: FileText, label: 'Content', color: 'from-green-500/20 to-emerald-500/20', border: 'border-green-500/30', text: 'text-green-400' },
  { icon: Database, label: 'Data', color: 'from-violet-500/20 to-purple-500/20', border: 'border-violet-500/30', text: 'text-violet-400' },
  { icon: Video, label: 'Video', color: 'from-teal-500/20 to-cyan-500/20', border: 'border-teal-500/30', text: 'text-teal-400' },
]

const WHY = [
  { icon: Shield, title: 'Verified Talent', desc: 'Every freelancer has completed real TruLearnix courses and earned certificates — no fake profiles.' },
  { icon: Zap, title: 'Fast & Reliable', desc: 'Our talent pool is actively learning. Get quality work delivered on time, every time.' },
  { icon: Star, title: 'Skill-First Matching', desc: 'Find freelancers by the exact skills you need, filtered by course level and expertise.' },
]

const TIER_COLORS: Record<string, string> = {
  free: 'text-gray-400', starter: 'text-blue-400', pro: 'text-violet-400',
  elite: 'text-orange-400', supreme: 'text-teal-400',
}

function FreelancerCard({ user }: { user: any }) {
  return (
    <Link href={`/freelancers/${user._id}`}>
      <div className="card cursor-pointer hover:border-teal-500/40 transition-all duration-200 hover:-translate-y-1 h-full">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-full flex items-center justify-center font-black text-base flex-shrink-0 overflow-hidden"
            style={{ background: 'linear-gradient(135deg,#0d9488,#0891b2)' }}>
            {user.avatar
              ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              : <span className="text-white">{user.name?.[0]}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-white text-sm">{user.name}</p>
              {user.packageTier && user.packageTier !== 'free' && (
                <span className={`text-[10px] font-black uppercase ${TIER_COLORS[user.packageTier]}`}>
                  {user.packageTier}
                </span>
              )}
            </div>
            <p className="text-gray-400 text-xs line-clamp-1 mt-0.5">{user.bio || 'TruLearnix Professional'}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {(user.expertise || []).slice(0, 3).map((s: string) => (
                <span key={s} className="badge bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[10px]">{s}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

function ProjectCard({ job }: { job: any }) {
  const LEVEL_COLORS: Record<string, string> = {
    beginner: 'bg-green-500/15 text-green-400',
    intermediate: 'bg-blue-500/15 text-blue-400',
    expert: 'bg-purple-500/15 text-purple-400',
  }
  return (
    <Link href={`/projects/${job._id}`}>
      <div className="card cursor-pointer hover:border-teal-500/40 transition-all duration-200 hover:-translate-y-1 h-full flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-white text-sm leading-snug line-clamp-2 flex-1">{job.title}</h3>
          <span className={`badge flex-shrink-0 capitalize ${LEVEL_COLORS[job.experienceLevel] || ''}`}>
            {job.experienceLevel}
          </span>
        </div>
        <p className="text-gray-400 text-xs line-clamp-2 flex-1 mb-3">{job.description}</p>
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <span className="text-teal-400 font-black text-sm">₹{job.budget?.toLocaleString()}</span>
          <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{job.category}</span>
        </div>
      </div>
    </Link>
  )
}

export default function Home() {
  const { data: flRes } = useQuery({
    queryKey: ['home-freelancers'],
    queryFn: () => trulanceAPI.getFreelancers({ limit: 6 }).then(r => r.data),
  })
  const { data: prRes } = useQuery({
    queryKey: ['home-projects'],
    queryFn: () => trulanceAPI.getProjects({ limit: 6 }).then(r => r.data),
  })

  const freelancers: any[] = flRes?.data || []
  const projects: any[] = prRes?.data || []

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative pt-28 pb-24 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(13,148,136,0.06) 0%, transparent 65%)' }} />
          <div className="absolute top-16 right-10 w-80 h-80 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(8,145,178,0.05) 0%, transparent 70%)' }} />
        </div>
        <div className="max-w-5xl mx-auto text-center relative">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold text-teal-400 mb-6"
              style={{ background: 'rgba(13,148,136,0.1)', border: '1px solid rgba(13,148,136,0.25)' }}>
              <Zap className="w-3 h-3" /> India's Skill-First Freelance Marketplace
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-white mb-6 leading-[1.05]">
              Hire Verified<br />
              <span className="gradient-text">Digital Talent</span>
            </h1>
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Work with students who are actively learning, certified, and hungry to prove their skills.
              Post a project or showcase your talent — all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/post-project" className="btn-primary text-base py-3.5 px-8">
                Post a Project <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/freelancers" className="btn-secondary text-base py-3.5 px-8">
                Browse Talent
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-10 px-4 border-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }} viewport={{ once: true }} className="text-center">
              <div className="text-3xl md:text-4xl font-black gradient-text mb-1">{s.value}</div>
              <div className="text-xs text-gray-500 font-medium">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">Browse by Category</h2>
            <p className="text-gray-500">Find the right talent for every type of project</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {CATEGORIES.map((c, i) => (
              <motion.div key={c.label} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }} viewport={{ once: true }}>
                <Link href={`/freelancers?skill=${c.label}`}>
                  <div className={`rounded-2xl p-4 border ${c.border} bg-gradient-to-br ${c.color} text-center hover:scale-105 transition-transform cursor-pointer`}>
                    <c.icon className={`w-6 h-6 mx-auto mb-2 ${c.text}`} />
                    <p className={`text-xs font-bold ${c.text}`}>{c.label}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Freelancers */}
      {freelancers.length > 0 && (
        <section className="py-16 px-4" style={{ background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="max-w-5xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black text-white">Top Freelancers</h2>
                <p className="text-gray-500 text-sm mt-1">Verified talent ready to work</p>
              </div>
              <Link href="/freelancers" className="text-teal-400 text-sm font-bold hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {freelancers.map((u: any) => <FreelancerCard key={u._id} user={u} />)}
            </div>
          </div>
        </section>
      )}

      {/* Featured Projects */}
      {projects.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black text-white">Latest Projects</h2>
                <p className="text-gray-500 text-sm mt-1">New opportunities posted daily</p>
              </div>
              <Link href="/projects" className="text-teal-400 text-sm font-bold hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {projects.map((job: any) => <ProjectCard key={job._id} job={job} />)}
            </div>
          </div>
        </section>
      )}

      {/* Why TruLancer */}
      <section className="py-16 px-4" style={{ background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">Why TruLancer?</h2>
            <p className="text-gray-500">Built for real learning, real work</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {WHY.map((w, i) => (
              <motion.div key={w.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                className="card text-center">
                <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{ background: 'rgba(13,148,136,0.1)', border: '1px solid rgba(13,148,136,0.2)' }}>
                  <w.icon className="w-5 h-5 text-teal-400" />
                </div>
                <h3 className="font-bold text-white mb-2">{w.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{w.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#0d9488,#0891b2)', boxShadow: '0 0 40px rgba(13,148,136,0.3)' }}>
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Ready to get started?</h2>
            <p className="text-gray-400 mb-8 text-lg">Join hundreds of students building real careers through real projects.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="btn-primary text-base py-3.5 px-8">
                Join as Freelancer <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/post-project" className="btn-secondary text-base py-3.5 px-8">Post a Project</Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }} className="py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0d9488,#0891b2)' }}>
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="font-black text-white">TruLancer</span>
            <span className="text-gray-600 text-xs">by TruLearnix</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-gray-500">
            <Link href="/projects" className="hover:text-teal-400 transition-colors">Projects</Link>
            <Link href="/freelancers" className="hover:text-teal-400 transition-colors">Freelancers</Link>
            <a href="https://peptly.in" className="hover:text-teal-400 transition-colors">TruLearnix</a>
          </div>
          <p className="text-xs text-gray-700">© 2025 TruLancer. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
