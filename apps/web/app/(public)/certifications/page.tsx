'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Award, CheckCircle, Shield, Star, Zap, ArrowRight, FileText, Globe, TrendingUp, Users } from 'lucide-react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

const CERTS = [
  {
    icon: '💻',
    title: 'Full Stack Web Development',
    desc: 'React, Node.js, MongoDB — production-ready skills',
    color: 'from-violet-600 to-indigo-600',
    glow: 'rgba(124,58,237,0.3)',
    skills: ['React & Next.js', 'Node.js & Express', 'MongoDB', 'REST APIs'],
  },
  {
    icon: '📊',
    title: 'Data Science & Python',
    desc: 'Machine learning, analysis, and visualisation',
    color: 'from-blue-600 to-cyan-600',
    glow: 'rgba(6,182,212,0.25)',
    skills: ['Python', 'Pandas & NumPy', 'Machine Learning', 'Data Visualisation'],
  },
  {
    icon: '🎨',
    title: 'UI/UX Design',
    desc: 'Figma, user research, and design systems',
    color: 'from-pink-600 to-rose-600',
    glow: 'rgba(236,72,153,0.25)',
    skills: ['Figma', 'User Research', 'Wireframing', 'Design Systems'],
  },
  {
    icon: '📱',
    title: 'Digital Marketing',
    desc: 'SEO, paid ads, social media, and content',
    color: 'from-amber-500 to-orange-500',
    glow: 'rgba(245,158,11,0.3)',
    skills: ['SEO & SEM', 'Meta Ads', 'Content Strategy', 'Analytics'],
  },
  {
    icon: '🤖',
    title: 'AI & Automation',
    desc: 'Prompt engineering, AI tools, and workflows',
    color: 'from-green-500 to-emerald-600',
    glow: 'rgba(16,185,129,0.3)',
    skills: ['ChatGPT & Claude', 'AI Automation', 'Prompt Engineering', 'No-Code Tools'],
  },
  {
    icon: '🚀',
    title: 'Partner & Affiliate Marketing',
    desc: 'Build an income stream through referrals',
    color: 'from-fuchsia-600 to-purple-600',
    glow: 'rgba(217,70,239,0.25)',
    skills: ['Affiliate Strategy', 'Funnel Building', 'Email Marketing', 'Performance Tracking'],
  },
]

const FEATURES = [
  { icon: Shield,    title: 'Verified & Blockchain-Backed', desc: 'Every certificate is tamper-proof and verifiable with a unique ID.' },
  { icon: Globe,     title: 'Globally Recognised',         desc: 'Accepted by employers and clients across India and internationally.' },
  { icon: Zap,       title: 'AI-Powered Assessment',       desc: 'Smart proctored exams ensure your certificate reflects real skill.' },
  { icon: TrendingUp,title: 'Career-Boosting',             desc: 'Add to LinkedIn, portfolio, and resumes to stand out.' },
]

export default function CertificationsPage() {
  const [hovered, setHovered] = useState<number | null>(null)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/stats`)
      .then(r => r.json())
      .then(d => { if (d.success) setStats(d.stats) })
      .catch(() => {})
  }, [])

  const fmtCount = (n: number) => n >= 100000 ? `${Math.floor(n / 100000)}L+` : n >= 1000 ? `${Math.floor(n / 1000)}K+` : `${n}+`
  const certStats = [
    { val: stats ? fmtCount(stats.totalCertificates || 0) : '—', label: 'Certificates Issued', icon: Award },
    { val: stats && stats.avgRating > 0 ? `${stats.avgRating.toFixed(1)}★` : '—', label: 'Avg Learner Rating', icon: Star },
    { val: stats ? fmtCount(stats.totalCourses || 0) : '—', label: 'Certified Courses', icon: Users },
  ]

  return (
    <>
      <Navbar />
      <main className="min-h-screen" style={{ background: 'linear-gradient(135deg,#0a0b1a 0%,#0d0f25 50%,#0a0b1a 100%)' }}>

        {/* Hero */}
        <section className="pt-24 pb-14 px-4 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(124,58,237,0.12), transparent)' }} />
          <div className="max-w-4xl mx-auto text-center relative">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 text-xs font-black px-4 py-1.5 rounded-full mb-5"
              style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa' }}>
              <Award className="w-3.5 h-3.5" /> AI-POWERED CERTIFICATIONS
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-4">
              Certificates That{' '}
              <span className="gradient-text">Actually Matter</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
              className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto mb-8">
              Earn industry-recognised, blockchain-verified certificates after completing courses and passing AI-proctored assessments.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/courses" className="btn-primary inline-flex items-center gap-2 text-sm py-3 px-8">
                Browse Courses <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/packages" className="inline-flex items-center gap-2 text-sm py-3 px-8 rounded-xl font-bold text-white transition-all hover:scale-105"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
                View Packages
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section className="py-10 px-4">
          <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }} viewport={{ once: true }}
                className="rounded-2xl p-5 text-center"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'rgba(124,58,237,0.15)' }}>
                  <f.icon className="w-5 h-5 text-violet-400" />
                </div>
                <h3 className="text-white font-bold text-sm mb-1">{f.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Certificate cards */}
        <section className="py-10 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3">
                Available Certifications
              </motion.h2>
              <p className="text-gray-500 text-sm">Complete a course and pass the assessment to earn your certificate.</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {CERTS.map((cert, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }} viewport={{ once: true }}
                  onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
                  className="rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1"
                  style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${hovered === i ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.07)'}`, boxShadow: hovered === i ? `0 8px 32px ${cert.glow}` : 'none' }}>
                  <div className={`h-1.5 bg-gradient-to-r ${cert.color}`} />
                  <div className="p-5">
                    <div className="text-3xl mb-3">{cert.icon}</div>
                    <h3 className="text-white font-black text-base mb-1">{cert.title}</h3>
                    <p className="text-gray-500 text-xs mb-4">{cert.desc}</p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {cert.skills.map((s, si) => (
                        <span key={si} className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af' }}>
                          {s}
                        </span>
                      ))}
                    </div>
                    <Link href="/courses"
                      className={`w-full flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 rounded-xl text-white transition-all bg-gradient-to-r ${cert.color} hover:opacity-90`}>
                      Earn This Certificate <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Sample certificate preview */}
        <section className="py-14 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="rounded-3xl p-8 sm:p-12 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.12),rgba(217,70,239,0.08),rgba(79,70,229,0.10))', border: '1px solid rgba(124,58,237,0.25)' }}>
              <div className="absolute top-4 right-6 opacity-10">
                <Award className="w-24 h-24 text-violet-400" />
              </div>
              <FileText className="w-10 h-10 text-violet-400 mx-auto mb-4" />
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
                Your Name on a Certificate That Opens Doors
              </h2>
              <p className="text-gray-400 text-sm mb-6 max-w-lg mx-auto">
                Every TruLearnix certificate includes a unique verification ID, your name, course details, and a QR code employers and clients can scan instantly.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/register" className="btn-primary inline-flex items-center gap-2 text-sm py-3 px-8">
                  Start Learning Free <Zap className="w-4 h-4" />
                </Link>
              </div>
              <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-gray-500">
                {['Blockchain Verified', 'Lifetime Valid', 'LinkedIn Ready', 'Employer Accepted'].map(t => (
                  <span key={t} className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-green-400" />{t}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Stats */}
        <section className="pb-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center">
              {certStats.map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }} viewport={{ once: true }}>
                  <div className="text-2xl sm:text-3xl font-black text-white mb-1">{s.val}</div>
                  <div className="text-gray-500 text-xs sm:text-sm">{s.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
