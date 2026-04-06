'use client'
import { useQuery } from '@tanstack/react-query'
import { courseAPI } from '@/lib/api'
import Link from 'next/link'
import { Star, Users, ChevronRight, BookOpen, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

function CourseCard({ course, i }: { course: any; i: number }) {
  const price = course.discountPrice || course.price
  const hasDiscount = course.discountPrice && course.discountPrice < course.price
  const discountPct = hasDiscount ? Math.round((1 - course.discountPrice / course.price) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.07 }}
      viewport={{ once: true }}
      className="flex-shrink-0 w-[280px] sm:w-auto"
    >
      <Link href={`/courses/${course.slug}`}
        className="flex flex-col h-full rounded-2xl overflow-hidden group transition-all duration-300 hover:-translate-y-1"
        style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Thumbnail */}
        <div className="relative overflow-hidden" style={{ aspectRatio:'16/9' }}>
          <img src={course.thumbnail || '/placeholder-course.jpg'} alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <span className={`absolute top-3 left-3 text-xs font-black px-2.5 py-1 rounded-full ${
            course.level === 'beginner' ? 'bg-green-500/85 text-white' :
            course.level === 'intermediate' ? 'bg-amber-500/85 text-white' : 'bg-red-500/85 text-white'
          }`}>
            {course.level}
          </span>
          <div className="absolute bottom-3 left-3 flex items-center gap-1 text-white text-xs rounded-full px-2.5 py-1"
            style={{ background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)' }}>
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="font-black">{course.rating?.toFixed(1)}</span>
            <span className="text-gray-300">({course.ratingCount})</span>
          </div>
        </div>

        <div className="p-5 flex flex-col flex-1">
          <p className="text-xs font-black mb-1.5" style={{ color:'#a78bfa' }}>{course.category}</p>
          <h3 className="font-black text-white text-sm line-clamp-2 mb-2 leading-snug flex-1 group-hover:text-violet-400 transition-colors">
            {course.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
            <Users className="w-3 h-3" />{course.enrolledCount} students
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-white">₹{price?.toLocaleString()}</span>
              {hasDiscount && <span className="text-xs text-gray-600 line-through">₹{course.price?.toLocaleString()}</span>}
            </div>
            {hasDiscount && (
              <span className="text-xs font-black text-green-400 px-2.5 py-0.5 rounded-full"
                style={{ background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.2)' }}>
                {discountPct}% off
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-[280px] sm:w-auto rounded-2xl overflow-hidden animate-pulse"
      style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ aspectRatio:'16/9', background:'rgba(255,255,255,0.06)' }} />
      <div className="p-5 space-y-3">
        <div className="h-2.5 rounded-full w-1/3" style={{ background:'rgba(255,255,255,0.06)' }} />
        <div className="h-4 rounded-full"       style={{ background:'rgba(255,255,255,0.06)' }} />
        <div className="h-4 rounded-full w-3/4" style={{ background:'rgba(255,255,255,0.06)' }} />
        <div className="h-5 rounded-full w-1/2" style={{ background:'rgba(255,255,255,0.06)' }} />
      </div>
    </div>
  )
}

export default function FeaturedCourses() {
  const { data, isLoading } = useQuery({
    queryKey: ['featured-courses'],
    queryFn: () => courseAPI.getAll({ limit:6, sort:'-enrolledCount' }).then(r => r.data)
  })

  const items = isLoading
    ? Array(6).fill(0).map((_,i) => <SkeletonCard key={i} />)
    : data?.courses?.map((c:any, i:number) => <CourseCard key={c._id} course={c} i={i} />)

  return (
    <section className="py-24 relative">
      {/* Section bg accent */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background:'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(99,102,241,0.04), transparent)' }} />

      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <motion.div initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }}
              className="section-label mb-5">
              <BookOpen className="w-3.5 h-3.5" />TOP COURSES
            </motion.div>
            <motion.h2 initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
              className="font-black text-white leading-tight"
              style={{ fontSize:'clamp(2rem,5vw,3.5rem)' }}>
              Learn from{' '}
              <span className="gradient-text">the Best</span>
            </motion.h2>
          </div>
          <Link href="/courses" className="hidden md:flex items-center gap-1.5 text-violet-400 hover:text-white font-bold text-sm transition-colors group">
            View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Desktop grid */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items}
        </div>

        {/* Mobile horizontal scroll */}
        <div className="sm:hidden scroll-track">
          {items}
        </div>

        {/* Mobile CTA */}
        <div className="sm:hidden text-center mt-6">
          <Link href="/courses" className="btn-secondary text-sm inline-flex items-center gap-2">
            View All Courses <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
