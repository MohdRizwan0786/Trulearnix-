'use client'
import { useState, useEffect } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

const DEFAULT: any = {
  heroBadge: 'Est. September 2025 · New Delhi, India',
  headingLine1: 'Turning Vision',
  headingLine2: 'into Excellence.',
  heroDesc: "India's most practical digital skills platform. We don't just teach — we transform learners into earners.",
  heroStats: [
    { n: '—', l: 'Learners' },
    { n: '—', l: 'Courses' },
    { n: '—', l: 'Mentors' },
    { n: '3', l: 'Earning Paths' },
  ],
  storyBadge: 'Our Story',
  storyHeading: 'More than a platform —',
  storySubheading: 'a career ecosystem.',
  storyDesc: "TruLearnix was built with one belief: watching videos alone doesn't create careers. That's why every course is live, interactive, and mentor-guided — so you practice, build, and earn.",
  storyFeatures: [
    { icon: '🎯', title: 'Live Classes', desc: 'Real-time learning with expert mentors' },
    { icon: '💸', title: 'Earn Fast', desc: 'From beginner to earner in months' },
    { icon: '🌍', title: 'For Everyone', desc: 'Students, women, professionals' },
    { icon: '🤲', title: 'Halal Income', desc: 'Ethical earning, always' },
  ],
  missionHeading: 'Our Mission',
  missionText: 'To provide high-quality digital skills education to every learner — empowering them to start freelancing careers, secure digital jobs, or generate income through Partnership marketing, in a practical, efficient, and result-oriented way.',
  visionHeading: 'Our Vision',
  visionText: 'A global digital hub where millions become financially independent — regardless of background, gender, or education.',
  values: [
    { icon: '⚡', title: 'Fast-Track Earning' },
    { icon: '👩', title: 'Women Empowerment' },
    { icon: '🏆', title: 'Community First' },
  ],
  foundersBadge: 'The Visionaries',
  foundersHeading: 'Meet the Founders',
  founders: [
    {
      name: 'Mohd Rizwan',
      role: 'Founder & CEO',
      subtitle: 'Founder · TruLearnix & RB Digi Solutions',
      quote: "My goal is simple — take someone with zero knowledge and turn them into a confident digital earner. That's the TruLearnix promise.",
      bio: 'B.Tech (CS) from Jamia Millia Islamia & GGSIP University. 5+ years of corporate IT sales experience combined with deep expertise as a Meta Ads Specialist — helping businesses grow on Facebook & Instagram. Founded TruLearnix to democratize digital earning for all.',
      skills: ['Meta Ads Expert', 'IT Sales', 'B.Tech CSE', 'Digital Marketing', 'Entrepreneur'],
      expValue: '5+', expLabel: 'Years in IT',
      expertiseValue: 'Meta Ads', expertiseLabel: 'Expert',
      photoUrl: '/founder-rizwan.jpg',
    },
    {
      name: 'Ashfana Razaksab Kolhar',
      role: 'Co-Founder & Managing Director',
      subtitle: 'Educator · Mentor · Women Empowerment Advocate',
      quote: 'Every woman deserves the tools to build her own financial freedom. TruLearnix is that bridge.',
      bio: 'M.Sc. Physics from Karnataka University. 2-3 years mentoring learners across online platforms, with 4 years of high-performance sales experience alongside top entrepreneurs. Ashfana champions practical education and financial independence — especially for women.',
      skills: ['M.Sc. Physics', 'Online Mentor', 'Fashion Design', 'Sales Expert', "Women's Advocate"],
      expValue: '3+', expLabel: 'Yrs Mentoring',
      expertiseValue: 'M.Sc.', expertiseLabel: 'Physics',
      photoUrl: '/founder-ashfana.jpg',
    },
  ],
  pathsBadge: 'What We Teach',
  pathsHeading: '3 Paths to Digital Income',
  paths: [
    { emoji: '💼', title: 'Freelancing', sub: 'Global client base', desc: 'Master Upwork, Fiverr & Freelancer. Build a profile that attracts clients worldwide and earns in dollars.' },
    { emoji: '📱', title: 'Digital Jobs', sub: 'Career placement', desc: 'Land roles in digital marketing, social media management, graphic design & more at top companies.' },
    { emoji: '💸', title: 'Partnership Marketing', sub: 'Passive income', desc: 'Amazon Associates, ClickBank & more. Build systems that earn while you sleep.' },
  ],
  ctaBadge: 'Start Today',
  ctaHeading: 'Your Digital Career\nStarts Here.',
  ctaDesc: 'Join 10,000+ learners already building their future with TruLearnix.',
  ctaBtn1Text: 'Explore Courses →',
  ctaBtn1Href: '/courses',
  ctaBtn2Text: 'Contact Us',
  ctaBtn2Href: '/contact',
}

const VALUE_COLORS = [
  { color: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.2)' },
  { color: 'rgba(244,114,182,0.12)', border: 'rgba(244,114,182,0.2)' },
  { color: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.2)' },
  { color: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.2)' },
  { color: 'rgba(217,70,239,0.12)', border: 'rgba(217,70,239,0.2)' },
]

export default function AboutPage() {
  const [d, setD] = useState(DEFAULT)

  useEffect(() => {
    let cmsHeroStats = false
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/site-content/about`)
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          if (Array.isArray(res.data.heroStats) && res.data.heroStats.length) cmsHeroStats = true
          setD((prev: any) => ({ ...prev, ...res.data }))
        }
      })
      .catch(() => {})
      .finally(() => {
        if (cmsHeroStats) return
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/stats`)
          .then(r => r.json())
          .then(res => {
            if (!res.success) return
            const s = res.stats
            const fmt = (n: number) => n >= 100000 ? `${Math.floor(n / 100000)}L+` : n >= 1000 ? `${Math.floor(n / 1000)}K+` : `${n}+`
            setD((prev: any) => ({
              ...prev,
              heroStats: [
                { n: fmt(s.totalStudents || 0), l: 'Learners' },
                { n: fmt(s.totalCourses || 0),  l: 'Courses' },
                { n: fmt(s.totalMentors || 0),  l: 'Mentors' },
                { n: '3', l: 'Earning Paths' },
              ],
            }))
          })
          .catch(() => {})
      })
  }, [])

  return (
    <main className="bg-[#03040a] min-h-screen overflow-x-hidden">
      <Navbar />

      {/* ══ HERO ══ */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-20 pb-16 overflow-hidden">
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] rounded-full opacity-20 blur-[120px]"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full opacity-15 blur-[100px]"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] opacity-10 blur-[80px]"
          style={{ background: 'radial-gradient(ellipse, #d946ef, transparent)' }} />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        <div className="relative max-w-6xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border mb-8 text-sm font-semibold"
            style={{ background: 'rgba(124,58,237,0.12)', borderColor: 'rgba(124,58,237,0.3)', color: '#c4b5fd' }}>
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            {d.heroBadge}
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black text-white leading-[0.9] tracking-tight mb-8">
            {d.headingLine1}{' '}
            <br />
            <span style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {d.headingLine2}
            </span>
          </h1>

          <p className="text-gray-400 text-xl max-w-2xl mx-auto leading-relaxed mb-12">{d.heroDesc}</p>

          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12">
            {d.heroStats.map((s: any) => (
              <div key={s.l} className="text-center">
                <p className="text-3xl sm:text-4xl font-black text-white">{s.n}</p>
                <p className="text-gray-500 text-sm mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #03040a)' }} />
      </section>

      {/* ══ OUR STORY ══ */}
      <section className="py-20 max-w-6xl mx-auto px-4">
        <div className="grid lg:grid-cols-5 gap-10 lg:gap-16 items-center">
          <div className="lg:col-span-3">
            <p className="text-violet-400 text-sm font-bold uppercase tracking-widest mb-4">{d.storyBadge}</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-6">
              {d.storyHeading}<br />
              <span style={{ background: 'linear-gradient(135deg, #a78bfa, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {d.storySubheading}
              </span>
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed">{d.storyDesc}</p>
          </div>
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            {d.storyFeatures.map((c: any) => (
              <div key={c.title} className="p-5 rounded-2xl border"
                style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <span className="text-2xl block mb-2">{c.icon}</span>
                <p className="text-white font-bold text-sm">{c.title}</p>
                <p className="text-gray-500 text-xs mt-1 leading-snug">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ MISSION / VISION / VALUES ══ */}
      <section className="py-16 max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Mission */}
          <div className="sm:col-span-2 relative rounded-3xl p-8 overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(124,58,237,0.08))', border: '1px solid rgba(99,102,241,0.2)' }}>
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-30"
              style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
            <div className="relative">
              <span className="text-4xl mb-4 block">🎯</span>
              <h3 className="text-2xl font-black text-white mb-3">{d.missionHeading}</h3>
              <p className="text-gray-400 leading-relaxed">{d.missionText}</p>
            </div>
          </div>

          {/* Vision */}
          <div className="relative rounded-3xl p-8 overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(217,70,239,0.12), rgba(244,114,182,0.06))', border: '1px solid rgba(217,70,239,0.2)' }}>
            <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-30"
              style={{ background: 'radial-gradient(circle, #d946ef, transparent)' }} />
            <div className="relative">
              <span className="text-4xl mb-4 block">🌍</span>
              <h3 className="text-xl font-black text-white mb-3">{d.visionHeading}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{d.visionText}</p>
            </div>
          </div>

          {/* Values */}
          {d.values.map((v: any, i: number) => {
            const c = VALUE_COLORS[i % VALUE_COLORS.length]
            return (
              <div key={v.title} className="rounded-3xl p-6"
                style={{ background: c.color, border: `1px solid ${c.border}` }}>
                <span className="text-3xl block mb-3">{v.icon}</span>
                <p className="text-white font-bold">{v.title}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ══ FOUNDERS ══ */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(99,102,241,0.05), transparent)' }} />

        <div className="relative max-w-6xl mx-auto px-4">
          <div className="text-center mb-20">
            <p className="text-fuchsia-400 text-sm font-bold uppercase tracking-[0.3em] mb-4">{d.foundersBadge}</p>
            <h2 className="text-5xl sm:text-6xl font-black text-white leading-tight">
              {d.foundersHeading.replace('Founders', '').trim()}{' '}
              <span style={{ background: 'linear-gradient(135deg, #f0abfc, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Founders
              </span>
            </h2>
          </div>

          {d.founders.map((f: any, idx: number) => {
            const isEven = idx % 2 === 0
            const accentColor = isEven ? '#7c3aed' : '#d946ef'
            const accentLight = isEven ? '#c4b5fd' : '#f0abfc'
            const borderColor = isEven ? 'rgba(124,58,237,0.25)' : 'rgba(217,70,239,0.25)'
            const shadowColor = isEven ? 'rgba(99,102,241,0.25)' : 'rgba(217,70,239,0.2)'
            const bgContent = isEven ? 'linear-gradient(135deg, #080a14, #0a0d1c)' : 'linear-gradient(135deg, #0d0814, #0f0a1a)'

            return (
              <div key={idx} className={`group mb-16 grid lg:grid-cols-2 gap-0 rounded-[2.5rem] overflow-hidden relative`}
                style={{ boxShadow: `0 0 0 1px ${borderColor}, 0 40px 80px -20px ${shadowColor}` }}>

                <div className="absolute inset-0 rounded-[2.5rem] pointer-events-none z-10"
                  style={{ boxShadow: `inset 0 0 0 1px ${borderColor.replace('0.25', '0.2')}` }} />

                {/* Photo — left for even, right for odd */}
                {isEven && (
                  <div className="relative h-[500px] lg:h-auto overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #0d0a1f, #0a0d20)' }}>
                    {f.photoUrl && <img src={f.photoUrl} alt={f.name} className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-[1200ms] ease-out" />}
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, transparent 50%, rgba(8,10,20,0.95)), linear-gradient(to top, rgba(8,10,20,0.6) 0%, transparent 40%)' }} />
                    <div className="lg:hidden absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(8,10,20,1) 10%, rgba(8,10,20,0.3) 60%, transparent)' }} />
                    <div className="absolute top-6 left-6 px-4 py-2.5 rounded-2xl backdrop-blur-xl" style={{ background: 'rgba(10,10,30,0.75)', border: `1px solid ${borderColor}` }}>
                      <p className="text-2xl font-black text-white leading-none">{f.expValue}</p>
                      <p className="text-xs font-semibold" style={{ color: accentLight }}>{f.expLabel}</p>
                    </div>
                    <div className="absolute top-6 right-6 px-4 py-2.5 rounded-2xl backdrop-blur-xl" style={{ background: 'rgba(10,10,30,0.75)', border: `1px solid ${borderColor.replace('0.25', '0.35')}` }}>
                      <p className="font-black text-sm" style={{ color: accentLight }}>{f.expertiseValue}</p>
                      <p className="text-gray-400 text-xs">{f.expertiseLabel}</p>
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="relative p-8 sm:p-12 flex flex-col justify-center" style={{ background: bgContent }}>
                  <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
                    style={{ background: `radial-gradient(circle, ${accentColor}, transparent)` }} />
                  <div className="relative">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-bold"
                      style={{ background: `${accentColor}33`, border: `1px solid ${accentColor}59`, color: accentLight }}>
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accentLight }} />
                      {f.role}
                    </div>
                    <h3 className="text-3xl sm:text-4xl font-black text-white mb-1 leading-tight">{f.name}</h3>
                    <p className="font-semibold mb-6" style={{ color: accentLight }}>{f.subtitle}</p>
                    <div className="mb-6 pl-4" style={{ borderLeft: `2px solid ${accentColor}` }}>
                      <p className="text-gray-300 italic text-sm leading-relaxed">"{f.quote}"</p>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed mb-6">{f.bio}</p>
                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(f.skills) ? f.skills : []).map((t: string) => (
                        <span key={t} className="px-3 py-1 rounded-xl text-xs font-semibold"
                          style={{ background: `${accentColor}26`, border: `1px solid ${accentColor}40`, color: accentLight }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Photo — right for odd */}
                {!isEven && (
                  <div className="relative h-[500px] lg:h-auto overflow-hidden order-1 lg:order-2"
                    style={{ background: 'linear-gradient(135deg, #150d1f, #1a0d20)' }}>
                    {f.photoUrl && <img src={f.photoUrl} alt={f.name} className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-[1200ms] ease-out" />}
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to left, transparent 50%, rgba(15,8,20,0.95)), linear-gradient(to top, rgba(15,8,20,0.6) 0%, transparent 40%)' }} />
                    <div className="lg:hidden absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(15,8,20,1) 10%, rgba(15,8,20,0.3) 60%, transparent)' }} />
                    <div className="absolute top-6 right-6 px-4 py-2.5 rounded-2xl backdrop-blur-xl" style={{ background: 'rgba(15,8,25,0.75)', border: `1px solid ${borderColor}` }}>
                      <p className="text-2xl font-black text-white leading-none">{f.expValue}</p>
                      <p className="text-xs font-semibold" style={{ color: accentLight }}>{f.expLabel}</p>
                    </div>
                    <div className="absolute top-6 left-6 px-4 py-2.5 rounded-2xl backdrop-blur-xl" style={{ background: 'rgba(15,8,25,0.75)', border: `1px solid ${borderColor.replace('0.25', '0.35')}` }}>
                      <p className="font-black text-sm" style={{ color: accentLight }}>{f.expertiseValue}</p>
                      <p className="text-gray-400 text-xs">{f.expertiseLabel}</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ══ EARNING PATHS ══ */}
      <section className="py-20 max-w-6xl mx-auto px-4">
        <div className="text-center mb-14">
          <p className="text-amber-400 text-sm font-bold uppercase tracking-widest mb-3">{d.pathsBadge}</p>
          <h2 className="text-4xl sm:text-5xl font-black text-white">{d.pathsHeading}</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          {d.paths.map((p: any, i: number) => {
            const colors = [
              { color: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.25)', tag: '#a5b4fc' },
              { color: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', tag: '#6ee7b7' },
              { color: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', tag: '#fcd34d' },
            ]
            const c = colors[i % colors.length]
            return (
              <div key={p.title} className="group relative rounded-3xl p-8 overflow-hidden transition-transform duration-300 hover:-translate-y-2"
                style={{ background: c.color, border: `1px solid ${c.border}` }}>
                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl opacity-30" style={{ background: c.border }} />
                <span className="text-5xl block mb-5">{p.emoji}</span>
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: c.tag }}>{p.sub}</p>
                <h3 className="text-xl font-black text-white mb-3">{p.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{p.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section className="py-20 max-w-5xl mx-auto px-4">
        <div className="relative rounded-[2.5rem] overflow-hidden text-center p-12 sm:p-20"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(124,58,237,0.15) 50%, rgba(217,70,239,0.1) 100%)', border: '1px solid rgba(124,58,237,0.25)' }}>
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 80% at 50% 50%, rgba(99,102,241,0.1), transparent)' }} />
          <div className="relative">
            <p className="text-violet-300 font-bold text-sm uppercase tracking-widest mb-4">{d.ctaBadge}</p>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 leading-tight" style={{ whiteSpace: 'pre-line' }}>
              {d.ctaHeading}
            </h2>
            <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">{d.ctaDesc}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href={d.ctaBtn1Href}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-white font-black text-base transition-all hover:opacity-90 hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)', boxShadow: '0 0 40px rgba(124,58,237,0.4), 0 8px 24px rgba(0,0,0,0.3)' }}>
                {d.ctaBtn1Text}
              </a>
              <a href={d.ctaBtn2Href}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-white font-black text-base transition-all hover:bg-white/10"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
                {d.ctaBtn2Text}
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
