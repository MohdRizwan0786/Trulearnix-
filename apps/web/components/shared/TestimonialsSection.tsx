'use client'
import { Star } from 'lucide-react'
import { motion } from 'framer-motion'

const testimonials = [
  { name: 'Rahul Sharma', role: 'Full Stack Developer', avatar: 'RS', review: 'TruLearnix completely transformed my career. The live classes and mentorship helped me land a job at a top MNC.', rating: 5, course: 'Full Stack Web Development' },
  { name: 'Priya Singh', role: 'Data Scientist', avatar: 'PS', review: 'The certification program is world-class. My certificate helped me get a 40% salary hike!', rating: 5, course: 'Data Science with Python' },
  { name: 'Amit Kumar', role: 'UI/UX Designer', avatar: 'AK', review: 'Best platform for design courses. The mentor support is exceptional. I earned ₹15,000 through the affiliate program too!', rating: 5, course: 'Advanced UI/UX Design' },
  { name: 'Sneha Patel', role: 'Digital Marketer', avatar: 'SP', review: 'The affiliate earning system is amazing. I\'ve earned ₹25,000 while learning. Best investment ever!', rating: 5, course: 'Digital Marketing Mastery' },
  { name: 'Vikash Gupta', role: 'Mobile Developer', avatar: 'VG', review: 'Live classes are interactive and engaging. The quiz system helped me test my knowledge at every step.', rating: 5, course: 'React Native Development' },
  { name: 'Neha Joshi', role: 'Cloud Engineer', avatar: 'NJ', review: 'Got AWS certified through TruLearnix. The structured learning path and auto-generated certificate is a game changer.', rating: 5, course: 'AWS Cloud Mastery' },
]

export default function TestimonialsSection() {
  return (
    <section className="py-20 bg-dark-800/50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-primary-400 font-medium mb-2">Success Stories</p>
          <h2 className="text-4xl font-bold text-white mb-4">What Our Learners Say</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">Join thousands of successful learners who transformed their careers with TruLearnix</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }} viewport={{ once: true }}
              className="card hover:border-primary-500/30">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(t.rating)].map((_, j) => <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
              </div>
              <p className="text-gray-300 text-sm leading-relaxed mb-4">"{t.review}"</p>
              <p className="text-xs text-primary-400 mb-3">{t.course}</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center text-primary-400 font-bold text-sm">{t.avatar}</div>
                <div>
                  <p className="font-semibold text-white text-sm">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
