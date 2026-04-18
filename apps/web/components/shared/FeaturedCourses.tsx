'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Star, Users, ArrowRight, BookOpen, Zap, Clock, ShoppingBag, Flame, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { courseAPI } from '@/lib/api'

const categories = ['All', 'Web Dev', 'Data Science', 'Design', 'Mobile Dev', 'Marketing', 'Cloud']

const FALLBACK_COURSES = [
  { _id:'1', slug:'full-stack-web-dev',      title:'Full Stack Web Development Bootcamp',          category:'Web Dev',    level:'intermediate', rating:4.9, reviewCount:2840, enrolledCount:12400, price:4999, discountPrice:999,  emoji:'💻', color:'#7c3aed,#6366f1', glow:'rgba(124,58,237,0.5)',  badge:'🔥 Bestseller', skills:['React','Node.js','MongoDB','Next.js'],       duration:'6 months' },
  { _id:'2', slug:'data-science-python',     title:'Data Science & Machine Learning with Python', category:'Data Science',level:'beginner',     rating:4.8, reviewCount:1920, enrolledCount:8700,  price:3999, discountPrice:799,  emoji:'📊', color:'#2563eb,#06b6d4', glow:'rgba(6,182,212,0.5)',   badge:'⚡ Trending',  skills:['Python','Pandas','ML','Deep Learning'],     duration:'4 months' },
  { _id:'3', slug:'ui-ux-design-masterclass',title:'UI/UX Design Masterclass — Figma to Launch', category:'Design',     level:'beginner',     rating:4.9, reviewCount:1560, enrolledCount:6200,  price:3499, discountPrice:699,  emoji:'🎨', color:'#db2777,#e11d48', glow:'rgba(236,72,153,0.5)',  badge:'🏆 Top Rated', skills:['Figma','Prototyping','User Research','Design Systems'], duration:'3 months' },
  { _id:'4', slug:'react-native-mobile',     title:'React Native — Build iOS & Android Apps',     category:'Mobile Dev', level:'intermediate', rating:4.7, reviewCount:980,  enrolledCount:4100,  price:4499, discountPrice:899,  emoji:'📱', color:'#16a34a,#059669', glow:'rgba(16,185,129,0.5)', badge:null,           skills:['React Native','Expo','Firebase','App Store'], duration:'4 months' },
  { _id:'5', slug:'digital-marketing-pro',   title:'Digital Marketing — SEO, Ads & Social Media', category:'Marketing',  level:'beginner',     rating:4.8, reviewCount:2100, enrolledCount:9800,  price:2999, discountPrice:599,  emoji:'📢', color:'#d97706,#ea580c', glow:'rgba(245,158,11,0.5)', badge:'⚡ Trending',  skills:['SEO','Google Ads','Meta Ads','Analytics'],  duration:'2 months' },
  { _id:'6', slug:'aws-cloud-devops',        title:'AWS Cloud & DevOps — Certification Track',    category:'Cloud',      level:'advanced',     rating:4.9, reviewCount:760,  enrolledCount:3200,  price:5999, discountPrice:1199, emoji:'☁️', color:'#0d9488,#0891b2', glow:'rgba(6,182,212,0.5)',  badge:'🎓 Certified', skills:['AWS','Docker','Kubernetes','CI/CD'],        duration:'5 months' },
]

const LEVEL_CONFIG: Record<string,{ label:string; color:string; bg:string }> = {
  beginner:     { label:'Beginner',     color:'#4ade80', bg:'rgba(74,222,128,0.12)' },
  intermediate: { label:'Intermediate', color:'#fbbf24', bg:'rgba(251,191,36,0.12)' },
  advanced:     { label:'Advanced',     color:'#f87171', bg:'rgba(248,113,113,0.12)' },
}

function CourseCard({ c, i }: { c: any; i: number }) {
  const [hovered, setHovered] = useState(false)
  const discount = c.price && c.discountPrice ? Math.round((1 - c.discountPrice / c.price) * 100) : 0
  const level = LEVEL_CONFIG[c.level] || { label: c.level || 'All Levels', color:'#9ca3af', bg:'rgba(156,163,175,0.12)' }
  const gradColors = c.color || '#7c3aed,#6366f1'
  const glowColor = c.glow || 'rgba(124,58,237,0.5)'
  const enrolledK = c.enrolledCount >= 1000 ? `${(c.enrolledCount/1000).toFixed(1)}K` : c.enrolledCount

  return (
    <motion.div
      initial={{ opacity:0, y:28 }}
      whileInView={{ opacity:1, y:0 }}
      transition={{ delay: i * 0.07, duration: 0.5, ease:[0.23,1,0.32,1] }}
      viewport={{ once:true }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="flex-shrink-0 w-[300px] sm:w-auto flex flex-col rounded-[22px] overflow-hidden"
      style={{
        background:'linear-gradient(180deg,#0e1020 0%,#090c18 100%)',
        border:`1.5px solid ${hovered ? glowColor.replace('0.5','0.7') : 'rgba(255,255,255,0.08)'}`,
        boxShadow: hovered
          ? `0 0 0 1px ${glowColor.replace('0.5','0.2')}, 0 20px 60px rgba(0,0,0,0.5), 0 0 80px ${glowColor.replace('0.5','0.15')}`
          : '0 4px 24px rgba(0,0,0,0.4)',
        transition:'border-color 0.3s ease, box-shadow 0.3s ease',
      }}
    >
      <Link href={`/courses/${c.slug || c._id}`} className="flex flex-col flex-1 overflow-hidden">
      {/* ── HEADER ── */}
      <div className="relative overflow-hidden" style={{ height:'clamp(110px, 18vw, 170px)', background:`linear-gradient(135deg,${gradColors})` }}>

        {/* Thumbnail image (real courses) */}
        {c.thumbnail && (
          <img
            src={c.thumbnail}
            alt={c.title}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        )}

        {/* Dark overlay for readability */}
        {c.thumbnail && (
          <div className="absolute inset-0" style={{ background:'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.5) 100%)' }} />
        )}

        {/* Noise texture overlay (only for fallback/emoji cards) */}
        {!c.thumbnail && (
          <div className="absolute inset-0 opacity-30"
            style={{ backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E\")" }} />
        )}

        {/* Emoji — only for fallback cards without thumbnail */}
        {!c.thumbnail && (
          <>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-32 h-32 rounded-full opacity-40"
                style={{ background:`radial-gradient(circle, rgba(255,255,255,0.35) 0%, transparent 70%)`, filter:'blur(8px)' }} />
            </div>
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20"
              style={{ background:'rgba(255,255,255,0.25)' }} />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full opacity-10"
              style={{ background:'rgba(255,255,255,0.3)' }} />
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={hovered ? { scale:1.15, y:-4 } : { scale:1, y:0 }}
              transition={{ duration:0.4, ease:[0.23,1,0.32,1] }}
            >
              <span style={{ fontSize:'4rem', lineHeight:1, filter:`drop-shadow(0 8px 24px rgba(0,0,0,0.4))` }}>
                {c.emoji || '📚'}
              </span>
            </motion.div>
          </>
        )}

        {/* BADGE — top left */}
        {c.badge && (
          <div className="absolute top-3 left-3 z-10 text-[10px] font-black px-2.5 py-1 rounded-full"
            style={{ background:'rgba(0,0,0,0.45)', color:'#fff', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.15)' }}>
            {c.badge}
          </div>
        )}

        {/* DISCOUNT — top right */}
        {discount > 0 && (
          <div className="absolute top-3 right-3 z-10 flex flex-col items-center justify-center w-11 h-11 rounded-full"
            style={{ background:'rgba(239,68,68,0.9)', boxShadow:'0 4px 16px rgba(239,68,68,0.5)' }}>
            <span className="text-white font-black text-[11px] leading-none">{discount}%</span>
            <span className="text-white/80 text-[8px] leading-none">OFF</span>
          </div>
        )}

        {/* SKILL CHIPS — bottom row */}
        <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5 flex gap-1.5 overflow-x-auto scrollbar-hide"
          style={{ background:'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)' }}>
          {(c.skills || c.tags || []).slice(0,4).map((s: string) => (
            <span key={s} className="flex-shrink-0 text-[9px] font-bold text-white/90 px-2.5 py-0.5 rounded-full"
              style={{ background:'rgba(255,255,255,0.18)', backdropFilter:'blur(6px)', border:'1px solid rgba(255,255,255,0.2)' }}>
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="p-4 flex flex-col flex-1">

        {/* Category + Level row */}
        <div className="flex items-center gap-2 mb-2.5 flex-wrap">
          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full"
            style={{ background:'rgba(124,58,237,0.15)', border:'1px solid rgba(124,58,237,0.25)', color:'#a78bfa' }}>
            {c.category}
          </span>
          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full"
            style={{ background: level.bg, color: level.color }}>
            {level.label}
          </span>
          {c.duration && (
            <span className="ml-auto flex items-center gap-1 text-[10px] text-gray-600">
              <Clock className="w-2.5 h-2.5" />{c.duration}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-black text-white text-sm leading-snug line-clamp-2 mb-3 flex-1"
          style={{ transition:'color 0.2s', color: hovered ? '#e9d5ff' : '#fff' }}>
          {c.title}
        </h3>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs mb-4">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="font-black text-amber-400">{c.rating || c.averageRating || '4.8'}</span>
            <span className="text-gray-600">({(c.reviewCount || c.ratingCount || 0).toLocaleString()})</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <Users className="w-3 h-3" />
            <span>{enrolledK} students</span>
          </div>
        </div>

        {/* Price row */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl font-black text-white">
            ₹{(c.discountPrice || c.price || 0).toLocaleString()}
          </span>
          {c.price && c.discountPrice && c.price !== c.discountPrice && (
            <span className="text-sm text-gray-600 line-through">₹{c.price.toLocaleString()}</span>
          )}
          {discount > 0 && (
            <span className="ml-auto text-[11px] font-black px-2 py-0.5 rounded-full"
              style={{ background:'rgba(74,222,128,0.12)', color:'#4ade80', border:'1px solid rgba(74,222,128,0.2)' }}>
              Save ₹{(c.price - c.discountPrice).toLocaleString()}
            </span>
          )}
        </div>

        {/* Full-width CTA Button */}
        <div
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-black text-sm text-white transition-all duration-300"
          style={{
            background:`linear-gradient(135deg,${gradColors})`,
            boxShadow: hovered ? `0 8px 32px ${glowColor}` : `0 4px 16px ${glowColor.replace('0.5','0.3')}`,
            transform: hovered ? 'scale(1.02)' : 'scale(1)',
          }}>
          <ShoppingBag className="w-4 h-4" />
          Enroll Now
        </div>
      </div>
      </Link>
    </motion.div>
  )
}

export default function FeaturedCourses() {
  const [active, setActive] = useState('All')
  const [courses, setCourses] = useState<any[]>(FALLBACK_COURSES)

  useEffect(() => {
    courseAPI.getAll({ limit:12, status:'published' })
      .then(res => {
        const data = res.data?.courses || res.data?.data || []
        if (data.length > 0) setCourses(data)
      })
      .catch(() => {})
  }, [])

  const filtered = active === 'All' ? courses : courses.filter(c => c.category === active)

  return (
    <section className="py-10 md:py-16 relative">
      <div className="absolute inset-0 pointer-events-none"
        style={{ background:'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(99,102,241,0.05), transparent)' }} />

      <div className="max-w-7xl mx-auto px-4">

        {/* ── HEADER ── */}
        <div className="flex items-end justify-between mb-6 md:mb-10">
          <div>
            <motion.div initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }}
              className="section-label mb-4">
              <BookOpen className="w-3.5 h-3.5" />TOP COURSES
            </motion.div>
            <motion.h2 initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
              className="font-black text-white leading-tight"
              style={{ fontSize:'clamp(2rem,5vw,3.5rem)' }}>
              Learn Top{' '}
              <span className="gradient-text">In-Demand Skills</span>
            </motion.h2>
          </div>
          <Link href="/courses" className="hidden md:flex items-center gap-1.5 text-violet-400 hover:text-white font-bold text-sm transition-colors group">
            View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* ── CATEGORY FILTERS ── */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-7 scrollbar-hide" style={{ scrollbarWidth:'none' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setActive(cat)}
              className="flex-shrink-0 text-xs font-black px-4 py-2 rounded-full transition-all duration-200"
              style={active===cat ? {
                background:'linear-gradient(135deg,#7c3aed,#6366f1)',
                color:'#fff',
                boxShadow:'0 4px 20px rgba(124,58,237,0.45)',
              } : {
                background:'rgba(255,255,255,0.05)',
                border:'1px solid rgba(255,255,255,0.08)',
                color:'#9ca3af',
              }}>
              {cat}
            </button>
          ))}
        </div>

        {/* ── DESKTOP GRID ── */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((c, i) => <CourseCard key={c._id || c.id || i} c={c} i={i} />)}
        </div>

        {/* ── MOBILE SCROLL ── */}
        <div className="sm:hidden scroll-track">
          {filtered.map((c, i) => <CourseCard key={c._id || c.id || i} c={c} i={i} />)}
        </div>

        {/* ── MOBILE CTA ── */}
        <div className="sm:hidden text-center mt-6">
          <Link href="/courses" className="btn-secondary text-sm inline-flex items-center gap-2">
            View All Courses <Zap className="w-4 h-4" />
          </Link>
        </div>

        {/* ── TRUST STRIP ── */}
        <motion.div
          initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
          className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon:TrendingUp, val:'500+',  label:'Expert Courses',    color:'text-violet-400', bg:'rgba(124,58,237,0.12)' },
            { icon:Users,      val:'50K+',  label:'Active Learners',   color:'text-blue-400',   bg:'rgba(59,130,246,0.12)' },
            { icon:Star,       val:'4.9★',  label:'Avg Course Rating', color:'text-amber-400',  bg:'rgba(245,158,11,0.12)' },
            { icon:Flame,      val:'98%',   label:'Completion Rate',   color:'text-green-400',  bg:'rgba(16,185,129,0.12)' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl p-3.5 transition-all hover:-translate-y-0.5"
              style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: s.bg }}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div>
                <p className="text-white font-black text-base leading-none">{s.val}</p>
                <p className="text-gray-600 text-[10px] mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </motion.div>

      </div>
    </section>
  )
}
