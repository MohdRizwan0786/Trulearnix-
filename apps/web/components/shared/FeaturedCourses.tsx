'use client'
import { useQuery } from '@tanstack/react-query'
import { courseAPI } from '@/lib/api'
import Link from 'next/link'
import { Star, Users, ChevronRight, BookOpen } from 'lucide-react'
import { motion } from 'framer-motion'

function CourseCard({ course, i }: { course: any; i: number }) {
  const price = course.discountPrice || course.price
  const hasDiscount = course.discountPrice && course.discountPrice < course.price
  const discountPct = hasDiscount ? Math.round((1 - course.discountPrice / course.price) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.08 }}
      viewport={{ once: true }}
    >
      <Link href={`/courses/${course.slug}`}
        className="flex flex-col h-full rounded-2xl overflow-hidden group transition-all duration-300 hover:-translate-y-1"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden">
          <img
            src={course.thumbnail || '/placeholder-course.jpg'}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {/* Level badge */}
          <span className={`absolute top-3 left-3 text-xs font-black px-2.5 py-1 rounded-full ${
            course.level === 'beginner'     ? 'bg-green-500/85 text-white' :
            course.level === 'intermediate' ? 'bg-amber-500/85 text-white' :
                                              'bg-red-500/85 text-white'
          }`}>
            {course.level}
          </span>

          {/* Rating */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1 text-white text-xs rounded-full px-2.5 py-1"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="font-black">{course.rating?.toFixed(1)}</span>
            <span className="text-gray-300">({course.ratingCount})</span>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col flex-1">
          <p className="text-xs text-violet-400 font-bold mb-1.5">{course.category}</p>
          <h3 className="font-black text-white text-sm line-clamp-2 mb-2 group-hover:text-violet-400 transition-colors leading-snug flex-1">
            {course.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
            <Users className="w-3 h-3" />
            <span>{course.enrolledCount} students</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-white">₹{price?.toLocaleString()}</span>
              {hasDiscount && <span className="text-xs text-gray-600 line-through">₹{course.price?.toLocaleString()}</span>}
            </div>
            {hasDiscount && (
              <span className="text-xs font-black text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-0.5 rounded-full">
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
    <div className="rounded-2xl overflow-hidden animate-pulse"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="aspect-video" style={{ background: 'rgba(255,255,255,0.06)' }} />
      <div className="p-5 space-y-3">
        <div className="h-2.5 rounded-full w-1/3" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="h-4 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="h-4 rounded-full w-3/4" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="h-5 rounded-full w-1/2 mt-2" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>
    </div>
  )
}

export default function FeaturedCourses() {
  const { data, isLoading } = useQuery({
    queryKey: ['featured-courses'],
    queryFn: () => courseAPI.getAll({ limit: 6, sort: '-enrolledCount' }).then(r => r.data)
  })

  return (
    <section className="py-24 px-4 relative">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-14">
          <div>
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="section-label mb-5">
              <BookOpen className="w-3.5 h-3.5" />
              TOP COURSES
            </motion.div>
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight">
              Learn from{' '}
              <span className="gradient-text">the Best</span>
            </motion.h2>
          </div>
          <Link href="/courses"
            className="hidden md:flex items-center gap-1.5 text-violet-400 hover:text-white font-bold text-sm transition-colors group">
            View All
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading
            ? Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)
            : data?.courses?.map((course: any, i: number) => (
                <CourseCard key={course._id} course={course} i={i} />
              ))
          }
        </div>

        {/* Mobile CTA */}
        <div className="text-center mt-8 md:hidden">
          <Link href="/courses" className="btn-secondary text-sm inline-flex items-center gap-2">
            View All Courses <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
