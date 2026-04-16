'use client'
import { useEffect, useState } from 'react'
import { Star, Quote } from 'lucide-react'
import { motion } from 'framer-motion'

const GRADIENT_COLORS = [
  'from-violet-500 to-indigo-500',
  'from-pink-500 to-rose-500',
  'from-blue-500 to-cyan-500',
  'from-green-500 to-emerald-500',
  'from-amber-500 to-orange-500',
  'from-teal-500 to-cyan-500',
  'from-purple-500 to-violet-500',
  'from-red-500 to-pink-500',
]

const DEFAULT_TESTIMONIALS = [
  { name: 'Rahul Sharma', role: 'Full Stack Dev @ TCS', avatar: 'RS', review: 'TruLearnix live classes changed everything. Got placed at TCS within 2 months of completing the course!', rating: 5, earned: '', color: 'from-violet-500 to-indigo-500', avatarUrl: '', videoUrl: '' },
  { name: 'Priya Singh', role: 'Data Scientist', avatar: 'PS', review: 'The AI certificate is literally accepted everywhere. 40% salary hike after completing Data Science course.', rating: 5, earned: '40% hike', color: 'from-pink-500 to-rose-500', avatarUrl: '', videoUrl: '' },
  { name: 'Amit Kumar', role: 'UI/UX Designer', avatar: 'AK', review: "Best platform for design. And the Earn Program is insane — I made ₹15,000 just by helping 5 friends join!", rating: 5, earned: '₹15K earned', color: 'from-blue-500 to-cyan-500', avatarUrl: '', videoUrl: '' },
  { name: 'Sneha Patel', role: 'Digital Marketer', avatar: 'SP', review: 'Live classes with actual Q&A sessions make all the difference. Not just recorded videos like others.', rating: 5, earned: '₹25K earned', color: 'from-green-500 to-emerald-500', avatarUrl: '', videoUrl: '' },
  { name: 'Vikash Gupta', role: 'React Native Dev', avatar: 'VG', review: 'The mock interviews and live projects helped me build an actual portfolio. Now working remotely!', rating: 5, earned: '', color: 'from-amber-500 to-orange-500', avatarUrl: '', videoUrl: '' },
  { name: 'Neha Joshi', role: 'Cloud Engineer @ AWS', avatar: 'NJ', review: 'Got AWS certified through TruLearnix. The structured path and hands-on labs are world-class.', rating: 5, earned: 'Got certified', color: 'from-teal-500 to-cyan-500', avatarUrl: '', videoUrl: '' },
  { name: 'Rohan Verma', role: 'Freelancer', avatar: 'RV', review: 'From ₹0 to ₹50K/month freelancing after completing the Web Dev bootcamp. Life-changing platform!', rating: 5, earned: '₹50K/month', color: 'from-purple-500 to-violet-500', avatarUrl: '', videoUrl: '' },
  { name: 'Divya Nair', role: 'Product Manager', avatar: 'DN', review: 'The mentorship sessions are incredibly personalized. My mentor actually knows my name and progress!', rating: 5, earned: '', color: 'from-red-500 to-pink-500', avatarUrl: '', videoUrl: '' },
]

type Testimonial = typeof DEFAULT_TESTIMONIALS[0] & { quote?: string }

function TestCard({ t }: { t: Testimonial }) {
  return (
    <div className="flex-shrink-0 w-[320px] mx-3 rounded-2xl p-5 relative"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <Quote className="absolute top-4 right-4 w-5 h-5 text-violet-500/25" />

      <div className="flex items-center gap-1 mb-3">
        {[...Array(t.rating || 5)].map((_, j) => (
          <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
        ))}
        {t.earned && (
          <span className="ml-auto text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-0.5 rounded-full">
            {t.earned}
          </span>
        )}
      </div>

      <p className="text-gray-300 text-sm leading-relaxed mb-4">&ldquo;{t.review || t.quote}&rdquo;</p>

      <div className="flex items-center gap-3">
        {t.avatarUrl
          ? <img src={t.avatarUrl} alt={t.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
          : <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color || 'from-violet-500 to-indigo-500'} flex items-center justify-center text-white font-black text-xs flex-shrink-0`}>
              {t.avatar || t.name?.[0] || '?'}
            </div>
        }
        <div>
          <p className="font-bold text-white text-sm">{t.name}</p>
          <p className="text-xs text-gray-500">{t.role}</p>
        </div>
      </div>
    </div>
  )
}

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState(DEFAULT_TESTIMONIALS as Testimonial[])

  useEffect(() => {
    fetch(process.env.NEXT_PUBLIC_API_URL + '/site-content/testimonials')
      .then(r => r.json())
      .then(res => {
        const items = res.data?.items
        if (!items?.length) return
        setTestimonials(items.map((t: any, i: number) => ({
          ...t,
          review: t.quote || t.review || '',
          avatar: t.name?.[0] || '?',
          rating: 5,
          earned: t.result || t.earned || '',
          color: GRADIENT_COLORS[i % GRADIENT_COLORS.length],
        })))
      })
      .catch(() => {})
  }, [])

  const doubled = [...testimonials, ...testimonials]

  return (
    <section className="py-10 md:py-16 relative" style={{ overflow:'hidden', maxWidth:'100vw' }}>
      <div className="absolute inset-x-0 top-1/2 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.2), transparent)' }} />

      <div className="max-w-7xl mx-auto px-4 mb-10 md:mb-14 text-center">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="section-label mb-5">
          <Star className="w-3.5 h-3.5" />
          SUCCESS STORIES
        </motion.div>
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
          Real Students,{' '}
          <span className="gradient-text">Real Results</span>
        </motion.h2>
        <p className="text-gray-400 max-w-xl mx-auto">
          Join thousands who transformed their careers and income with TruLearnix
        </p>
      </div>

      {/* Row 1 — forward scroll */}
      <div className="relative mb-4 overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(90deg, #050709, transparent)' }} />
        <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(-90deg, #050709, transparent)' }} />
        <div className="flex marquee-fwd">
          {doubled.map((t, i) => <TestCard key={i} t={t} />)}
        </div>
      </div>

      {/* Row 2 — reverse scroll */}
      <div className="relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(90deg, #050709, transparent)' }} />
        <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(-90deg, #050709, transparent)' }} />
        <div className="flex marquee-rev">
          {[...doubled].reverse().map((t, i) => <TestCard key={i} t={t} />)}
        </div>
      </div>

      {/* Bottom trust stats */}
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="max-w-2xl mx-auto mt-14 px-4">
        <div className="rounded-2xl p-5 sm:p-6 grid grid-cols-3 sm:flex sm:flex-row items-center justify-around gap-4 sm:gap-6 text-center"
          style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}>
          {[
            { val: '50,000+', label: 'Happy Students' },
            { val: '4.9/5', label: 'Average Rating' },
            { val: '98%', label: 'Would Recommend' },
          ].map((s, i) => (
            <div key={i}>
              <p className="text-2xl font-black gradient-text">{s.val}</p>
              <p className="text-gray-500 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
