'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Play, Star, Users, Award, BookOpen } from 'lucide-react'

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-dark-900">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-20 pb-16 text-center">
        {/* Badge */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/30 rounded-full px-4 py-2 text-sm text-primary-400 mb-6">
          <Star className="w-4 h-4 fill-current" />
          India's #1 EdTech Platform
        </motion.div>

        {/* Headline */}
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
          Learn, Earn & Grow<br />
          <span className="gradient-text">with TruLearnix</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="text-xl text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed">
          Join 50,000+ learners. Access live classes, self-paced courses, earn certificates,
          and build a career. Start learning & earning today.
        </motion.p>

        {/* CTAs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link href="/register" className="btn-primary text-lg px-8 py-4 w-full sm:w-auto">
            Start Learning & Earning →
          </Link>
          <button className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors group">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-primary-500/20 transition-colors">
              <Play className="w-5 h-5 ml-1" />
            </div>
            Watch Demo
          </button>
        </motion.div>

        {/* Stats row */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
          {[
            { icon: Users, value: '50K+', label: 'Active Learners' },
            { icon: BookOpen, value: '500+', label: 'Expert Courses' },
            { icon: Award, value: '20K+', label: 'Certificates Issued' },
            { icon: Star, value: '4.9/5', label: 'Average Rating' },
          ].map((stat, i) => (
            <div key={i} className="card text-center">
              <stat.icon className="w-6 h-6 text-primary-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
