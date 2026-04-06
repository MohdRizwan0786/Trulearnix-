'use client'
import { motion } from 'framer-motion'
import { Users, BookOpen, Award, TrendingUp, Star, Globe } from 'lucide-react'

const stats = [
  { icon: Users, value: '50,000+', label: 'Active Students', color: 'text-blue-400' },
  { icon: BookOpen, value: '500+', label: 'Expert Courses', color: 'text-green-400' },
  { icon: Award, value: '20,000+', label: 'Certificates Issued', color: 'text-yellow-400' },
  { icon: TrendingUp, value: '₹2Cr+', label: 'Earned by Affiliates', color: 'text-purple-400' },
  { icon: Star, value: '4.9/5', label: 'Platform Rating', color: 'text-orange-400' },
  { icon: Globe, value: '50+', label: 'Cities Covered', color: 'text-pink-400' },
]

export default function StatsSection() {
  return (
    <section className="py-16 bg-dark-800/30">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }} viewport={{ once: true }}
              className="text-center">
              <s.icon className={`w-8 h-8 ${s.color} mx-auto mb-2`} />
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-sm text-gray-400">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
