'use client'
import { motion } from 'framer-motion'
import { UserPlus, Search, PlayCircle, Award, DollarSign } from 'lucide-react'

const steps = [
  { icon: UserPlus, step: '01', title: 'Create Account', desc: 'Sign up free in seconds. No credit card required.' },
  { icon: Search, step: '02', title: 'Explore Courses', desc: 'Browse 500+ courses across tech, design, business, and more.' },
  { icon: PlayCircle, step: '03', title: 'Learn & Practice', desc: 'Join live classes, watch recordings, complete quizzes & assignments.' },
  { icon: Award, step: '04', title: 'Get Certified', desc: 'Pass the course and download your AI-generated certificate.' },
  { icon: DollarSign, step: '05', title: 'Earn Money', desc: 'Refer friends and earn commissions through our affiliate program.' },
]

export default function HowItWorks() {
  return (
    <section className="section">
      <div className="text-center mb-12">
        <p className="text-primary-400 font-medium mb-2">Simple Process</p>
        <h2 className="text-4xl font-bold text-white mb-4">How TruLearnix Works</h2>
        <p className="text-gray-400 max-w-2xl mx-auto">From zero to certified professional in 5 simple steps</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
        {steps.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 }} viewport={{ once: true }}
            className="card text-center relative">
            <div className="text-4xl font-black text-primary-500/20 mb-3">{s.step}</div>
            <div className="w-14 h-14 bg-primary-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <s.icon className="w-7 h-7 text-primary-400" />
            </div>
            <h3 className="font-bold text-white mb-2">{s.title}</h3>
            <p className="text-sm text-gray-400">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
