'use client'
import { useQuery } from '@tanstack/react-query'
import api, { courseAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import {
  Star, Users, Clock, Award, CheckCircle, Play, Lock,
  ShoppingCart, Loader2, BookOpen, Zap, Globe, BarChart2,
  ChevronDown, ChevronUp, Shield, Tv, Download, Infinity as InfinityIcon,
  ArrowRight, BadgeCheck, Flame
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

declare global { interface Window { Razorpay: any } }

const CATEGORY_GRAD: Record<string, string> = {
  Development:   'linear-gradient(135deg,#0f2044,#1d4ed8,#312e81)',
  Marketing:     'linear-gradient(135deg,#2d0f44,#7c3aed,#4f46e5)',
  Design:        'linear-gradient(135deg,#44100f,#d97706,#b45309)',
  'Data Science':'linear-gradient(135deg,#042f2e,#0d9488,#0891b2)',
  Business:      'linear-gradient(135deg,#1e1b4b,#6366f1,#8b5cf6)',
  default:       'linear-gradient(135deg,#0f1a2e,#1e3a5f,#312e81)',
}

const LEVEL_BADGE: Record<string, { label: string; color: string }> = {
  beginner:     { label: 'Beginner',     color: 'rgba(74,222,128,0.15)' },
  intermediate: { label: 'Intermediate', color: 'rgba(251,191,36,0.15)' },
  advanced:     { label: 'Advanced',     color: 'rgba(239,68,68,0.15)'  },
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`} />
      ))}
    </span>
  )
}

function ModuleAccordion({ mod, idx }: { mod: any; idx: number }) {
  const [open, setOpen] = useState(idx === 0)
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/5 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white"
            style={{ background: 'rgba(124,58,237,0.3)' }}>{idx + 1}</div>
          <span className="font-bold text-white text-sm">{mod.title}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 hidden sm:block">{mod.lessons?.length || 0} lessons</span>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>
      {open && (
        <div className="divide-y" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.04)' }}>
          {mod.lessons?.map((lesson: any, j: number) => (
            <div key={j} className="flex items-center gap-3 px-5 py-3 text-sm">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${lesson.isPreview ? 'bg-violet-500/20' : 'bg-white/5'}`}>
                {lesson.isPreview
                  ? <Play className="w-3.5 h-3.5 text-violet-400" />
                  : <Lock className="w-3.5 h-3.5 text-gray-600" />}
              </div>
              <span className={`flex-1 ${lesson.isPreview ? 'text-gray-200' : 'text-gray-500'}`}>{lesson.title}</span>
              {lesson.isPreview && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa' }}>Preview</span>}
              {lesson.duration && <span className="text-xs text-gray-600 ml-auto">{lesson.duration}m</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CourseDetailPage({ params }: { params: { slug: string } }) {
  const [enrolling, setEnrolling] = useState(false)
  const { user, isAuthenticated, updateUser } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const refCode = searchParams.get('ref') || ''

  // Store ref code in localStorage so it persists through registration
  useEffect(() => {
    if (refCode) localStorage.setItem('affiliateRef', refCode)
  }, [refCode])

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', params.slug],
    queryFn: () => courseAPI.getBySlug(params.slug).then(r => r.data.course)
  })

  const handleEnroll = async () => {
    const affiliate = refCode || (typeof window !== 'undefined' ? localStorage.getItem('affiliateRef') || '' : '')
    if (!isAuthenticated()) {
      const baseP = course?.discountPrice || course?.price || 0
      if (baseP > 0) {
        // Paid course → direct to checkout (guest form is shown there)
        return router.push(`/checkout?type=course&id=${course._id}${affiliate ? `&promo=${affiliate}` : ''}`)
      } else {
        // Free course → login first then enroll
        return router.push(`/login?redirect=${encodeURIComponent(`/courses/${params.slug}${affiliate ? `?ref=${affiliate}` : ''}`)}`)
      }
    }
    const price = course.discountPrice || course.price
    if (price === 0) {
      try {
        setEnrolling(true)
        toast.success('Enrolled successfully!')
        router.push(`/student/courses/${course._id}`)
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Something went wrong')
        setEnrolling(false)
      }
      return
    }
    // Paid course → redirect to checkout (PhonePe)
    router.push(`/checkout?type=course&id=${course._id}${affiliate ? `&promo=${affiliate}` : ''}`)
  }

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#04050a' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
        <p className="text-gray-500 text-sm">Loading course...</p>
      </div>
    </div>
  )

  if (!course) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#04050a' }}>
      <div className="text-center">
        <p className="text-white text-xl font-bold mb-2">Course not found</p>
        <button onClick={() => router.push('/courses')} className="btn-primary mt-4">Browse Courses</button>
      </div>
    </div>
  )

  const totalLessons = course.modules?.reduce((s: number, m: any) => s + (m.lessons?.length || 0), 0) || 0
  const totalDuration = course.modules?.reduce((s: number, m: any) =>
    s + (m.lessons?.reduce((ls: number, l: any) => ls + (l.duration || 0), 0) || 0), 0) || 0
  const heroGrad = CATEGORY_GRAD[course.category] || CATEGORY_GRAD.default
  const discount = course.discountPrice && course.price
    ? Math.round((1 - course.discountPrice / course.price) * 100) : 0

  // Sales referral discount
  const salesDiscPct = refCode && course.salesRefDiscountPercent > 0 ? course.salesRefDiscountPercent : 0
  const basePrice = course.discountPrice || course.price || 0
  const refPrice = salesDiscPct > 0 ? Math.round(basePrice * (1 - salesDiscPct / 100)) : basePrice
  const price = salesDiscPct > 0 ? refPrice : basePrice

  const EnrollButton = ({ full = true }: { full?: boolean }) => (
    <button onClick={handleEnroll} disabled={enrolling}
      className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-white text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 ${full ? 'w-full' : ''}`}
      style={{ background: 'linear-gradient(135deg,#7c3aed,#6366f1)', boxShadow: '0 8px 32px rgba(124,58,237,0.45)' }}>
      {enrolling
        ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
        : price === 0
          ? <><Zap className="w-4 h-4" /> Enroll Free Now</>
          : <><ShoppingCart className="w-4 h-4" /> Enroll Now — ₹{price.toLocaleString()}</>}
    </button>
  )

  return (
    <div style={{ background: '#04050a' }} className="min-h-screen">
      <Navbar />

      {/* ── HERO ── */}
      <div className="pt-16 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: heroGrad, opacity: 0.9 }} />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 70% 50%,rgba(0,0,0,0) 0%,rgba(0,0,0,0.6) 70%)' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-16 grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">

          {/* Left info */}
          <div className="lg:col-span-2">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-white/60 text-xs mb-4">
              <span className="hover:text-white cursor-pointer" onClick={() => router.push('/courses')}>Courses</span>
              <span>/</span>
              <span className="text-white/90">{course.category}</span>
            </div>

            {/* Category + level badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-xs px-3 py-1 rounded-full font-bold text-white"
                style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
                {course.category}
              </span>
              {course.level && (
                <span className="text-xs px-3 py-1 rounded-full font-bold text-white"
                  style={{ background: LEVEL_BADGE[course.level]?.color || 'rgba(255,255,255,0.1)' }}>
                  {LEVEL_BADGE[course.level]?.label || course.level}
                </span>
              )}
              {course.isBestseller && (
                <span className="flex items-center gap-1 text-xs px-3 py-1 rounded-full font-black"
                  style={{ background: 'rgba(251,191,36,0.2)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}>
                  <Flame className="w-3 h-3" /> Bestseller
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight mb-4">
              {course.title}
            </h1>
            <p className="text-white/75 text-base leading-relaxed mb-6 max-w-2xl">
              {course.shortDescription || course.description?.slice(0, 150)}
            </p>

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/70 mb-6">
              {course.rating > 0 && (
                <span className="flex items-center gap-1.5">
                  <Stars rating={course.rating} />
                  <span className="text-yellow-400 font-bold">{Number(course.rating).toFixed(1)}</span>
                  <span className="text-white/50">({course.ratingCount || 0})</span>
                </span>
              )}
              <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {(course.enrolledCount || 0).toLocaleString()} students</span>
              {totalDuration > 0 && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {Math.round(totalDuration / 60)}h content</span>}
              {course.language && <span className="flex items-center gap-1.5"><Globe className="w-4 h-4" /> {course.language}</span>}
            </div>

            {/* Instructor */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-black text-base flex-shrink-0 overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.2)' }}>
                {course.mentor?.avatar
                  ? <img src={course.mentor.avatar} className="w-full h-full object-cover" alt="" />
                  : course.mentor?.name?.[0] || 'M'}
              </div>
              <div>
                <p className="text-white font-bold text-sm">{course.mentor?.name || 'Expert Instructor'}</p>
                <p className="text-white/50 text-xs">Course Instructor</p>
              </div>
            </div>
          </div>

          {/* ── Enroll Card (desktop sticky) ── */}
          <div className="hidden lg:block">
            <div className="sticky top-24 rounded-3xl overflow-hidden"
              style={{ background: 'rgba(10,10,20,0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
              {course.thumbnail && (
                <div className="relative">
                  <img src={course.thumbnail} alt={course.title} className="w-full aspect-video object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.3)' }}>
                    <div className="w-14 h-14 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                      style={{ background: 'rgba(124,58,237,0.9)', boxShadow: '0 8px 32px rgba(124,58,237,0.5)' }}>
                      <Play className="w-6 h-6 text-white ml-0.5" />
                    </div>
                  </div>
                </div>
              )}
              <div className="p-6">
                {/* Sales Referral Discount Banner */}
                {salesDiscPct > 0 && (
                  <div className="mb-4 px-4 py-3 rounded-xl text-sm font-bold text-green-300 flex items-center gap-2"
                    style={{ background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.25)' }}>
                    🎉 {salesDiscPct}% Special Discount Applied!
                  </div>
                )}
                {/* Price */}
                <div className="flex items-baseline gap-3 mb-5">
                  <span className="text-4xl font-black text-white">
                    {price === 0 ? 'Free' : `₹${price.toLocaleString()}`}
                  </span>
                  {salesDiscPct > 0 ? (
                    <>
                      <span className="text-gray-500 line-through text-lg">₹{basePrice.toLocaleString()}</span>
                      <span className="text-xs font-black px-2 py-1 rounded-lg" style={{ background: 'rgba(74,222,128,0.15)', color: '#4ade80' }}>
                        {salesDiscPct}% OFF
                      </span>
                    </>
                  ) : course.discountPrice && course.price > course.discountPrice ? (
                    <>
                      <span className="text-gray-500 line-through text-lg">₹{course.price.toLocaleString()}</span>
                      <span className="text-xs font-black px-2 py-1 rounded-lg" style={{ background: 'rgba(74,222,128,0.15)', color: '#4ade80' }}>
                        {discount}% OFF
                      </span>
                    </>
                  ) : null}
                </div>

                <EnrollButton />

                <p className="text-center text-xs text-gray-500 mt-3 flex items-center justify-center gap-1">
                  <Shield className="w-3 h-3" /> 30-Day Money-Back Guarantee
                </p>

                {/* Includes */}
                <div className="mt-5 space-y-2.5">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">This course includes</p>
                  {[
                    totalLessons > 0 && { icon: BookOpen,  text: `${totalLessons} lessons` },
                    totalDuration > 0 && { icon: Clock,    text: `${Math.round(totalDuration / 60)}h of video content` },
                    { icon: Tv,       text: 'Access on all devices' },
                    { icon: Download, text: 'Downloadable resources' },
                    { icon: InfinityIcon, text: 'Full lifetime access' },
                    course.certificate && { icon: Award, text: 'Certificate of completion' },
                  ].filter(Boolean).map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-2.5 text-sm text-gray-300">
                      <item.icon className="w-4 h-4 text-violet-400 flex-shrink-0" />
                      {item.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">

          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">

            {/* Quick stats chips */}
            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: BookOpen,  val: `${totalLessons}`, label: 'Lessons'  },
                { icon: Clock,     val: `${Math.round(totalDuration / 60)}h`, label: 'Duration' },
                { icon: Users,     val: `${(course.enrolledCount||0).toLocaleString()}`, label: 'Students'  },
                { icon: BarChart2, val: course.level || 'All',    label: 'Level'    },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl p-4 text-center"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <s.icon className="w-5 h-5 text-violet-400 mx-auto mb-1.5" />
                  <p className="text-white font-black text-lg leading-none">{s.val}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
                </div>
              ))}
            </motion.div>

            {/* What you'll learn */}
            {course.outcomes?.length > 0 && (
              <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}
                className="rounded-3xl p-6 sm:p-8"
                style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)' }}>
                <h2 className="text-xl font-black text-white mb-5 flex items-center gap-2">
                  <BadgeCheck className="w-5 h-5 text-violet-400" /> What You'll Learn
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {course.outcomes.map((o: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 text-sm text-gray-300">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      {o}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Description */}
            {course.description && (
              <div>
                <h2 className="text-xl font-black text-white mb-4">About This Course</h2>
                <p className="text-gray-400 leading-relaxed text-sm whitespace-pre-line">{course.description}</p>
              </div>
            )}

            {/* Curriculum */}
            {course.modules?.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-black text-white">Course Curriculum</h2>
                  <span className="text-xs text-gray-500">{course.modules.length} modules • {totalLessons} lessons</span>
                </div>
                <div className="space-y-3">
                  {course.modules.map((mod: any, i: number) => (
                    <ModuleAccordion key={i} mod={mod} idx={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Instructor */}
            {course.mentor && (
              <div className="rounded-3xl p-6 sm:p-8"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <h2 className="text-xl font-black text-white mb-5">Your Instructor</h2>
                <div className="flex items-start gap-5">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white flex-shrink-0 overflow-hidden"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#6366f1)' }}>
                    {course.mentor.avatar
                      ? <img src={course.mentor.avatar} className="w-full h-full object-cover" alt="" />
                      : course.mentor.name?.[0]}
                  </div>
                  <div>
                    <p className="text-white font-black text-lg">{course.mentor.name}</p>
                    <p className="text-violet-400 text-sm mb-3">{course.mentor.title || 'Expert Instructor'}</p>
                    {course.mentor.bio && <p className="text-gray-400 text-sm leading-relaxed">{course.mentor.bio}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Reviews */}
            {course.reviews?.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-black text-white">Student Reviews</h2>
                  <div className="flex items-center gap-2">
                    <Stars rating={course.rating} />
                    <span className="text-yellow-400 font-black">{Number(course.rating || 0).toFixed(1)}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  {course.reviews.slice(0, 5).map((r: any, i: number) => (
                    <div key={i} className="rounded-2xl p-5"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-sm"
                          style={{ background: 'rgba(124,58,237,0.3)' }}>
                          {r.user?.name?.[0] || 'S'}
                        </div>
                        <div>
                          <p className="text-white text-sm font-bold">{r.user?.name || 'Student'}</p>
                          <Stars rating={r.rating} />
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm leading-relaxed">{r.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar — only desktop (already shown in hero) */}
          <div className="hidden lg:block" />
        </div>
      </div>

      {/* ── MOBILE Sticky CTA ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 p-4"
        style={{ background: 'rgba(4,5,10,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-white font-black text-lg leading-none">
              {price === 0 ? 'Free' : `₹${price.toLocaleString()}`}
            </p>
            {salesDiscPct > 0 ? (
              <p className="text-gray-500 text-xs line-through">₹{basePrice.toLocaleString()}</p>
            ) : course.discountPrice && course.price > course.discountPrice ? (
              <p className="text-gray-500 text-xs line-through">₹{course.price.toLocaleString()}</p>
            ) : null}
          </div>
          <button onClick={handleEnroll} disabled={enrolling}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black text-white text-sm transition-all active:scale-[0.97]"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#6366f1)', boxShadow: '0 6px 24px rgba(124,58,237,0.45)' }}>
            {enrolling
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Wait...</>
              : <><ArrowRight className="w-4 h-4" /> {price === 0 ? 'Enroll Free' : 'Enroll Now'}</>}
          </button>
        </div>
      </div>

      {/* Bottom padding for mobile CTA */}
      <div className="lg:hidden h-24" />

      <Footer />
    </div>
  )
}
