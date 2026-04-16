import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us | TruLearnix',
  description: 'Learn about TruLearnix — our mission, vision, and the team behind India\'s leading digital skills platform.',
}

export default function AboutPage() {
  return (
    <main className="bg-[#03040a] min-h-screen overflow-x-hidden">
      <Navbar />

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-20 pb-16 overflow-hidden">
        {/* animated bg orbs */}
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] rounded-full opacity-20 blur-[120px]"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full opacity-15 blur-[100px]"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] opacity-10 blur-[80px]"
          style={{ background: 'radial-gradient(ellipse, #d946ef, transparent)' }} />

        {/* grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        <div className="relative max-w-6xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border mb-8 text-sm font-semibold"
            style={{ background: 'rgba(124,58,237,0.12)', borderColor: 'rgba(124,58,237,0.3)', color: '#c4b5fd' }}>
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            Est. September 2025 · New Delhi, India
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black text-white leading-[0.9] tracking-tight mb-8">
            Turning{' '}
            <span className="relative inline-block">
              <span style={{ background: 'linear-gradient(135deg, #a78bfa, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Vision
              </span>
            </span>
            <br />into{' '}
            <span style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Excellence.
            </span>
          </h1>

          <p className="text-gray-400 text-xl max-w-2xl mx-auto leading-relaxed mb-12">
            India's most practical digital skills platform. We don't just teach — we transform learners into earners.
          </p>

          {/* stat row */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12">
            {[
              { n: '10K+', l: 'Learners' },
              { n: '50+', l: 'Courses' },
              { n: '95%', l: 'Success Rate' },
              { n: '3', l: 'Earning Paths' },
            ].map(s => (
              <div key={s.l} className="text-center">
                <p className="text-3xl sm:text-4xl font-black text-white">{s.n}</p>
                <p className="text-gray-500 text-sm mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #03040a)' }} />
      </section>

      {/* ══════════════════════════════════════════
          ABOUT STRIP
      ══════════════════════════════════════════ */}
      <section className="py-20 max-w-6xl mx-auto px-4">
        <div className="grid lg:grid-cols-5 gap-10 lg:gap-16 items-center">
          <div className="lg:col-span-3">
            <p className="text-violet-400 text-sm font-bold uppercase tracking-widest mb-4">Our Story</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-6">
              More than a platform —<br />
              <span style={{ background: 'linear-gradient(135deg, #a78bfa, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                a career ecosystem.
              </span>
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed">
              TruLearnix was built with one belief: <span className="text-white font-semibold">watching videos alone doesn't create careers.</span>{' '}
              That's why every course is live, interactive, and mentor-guided — so you practice, build, and earn.
            </p>
          </div>
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            {[
              { icon: '🎯', t: 'Live Classes', d: 'Real-time learning with expert mentors' },
              { icon: '💸', t: 'Earn Fast', d: 'From beginner to earner in months' },
              { icon: '🌍', t: 'For Everyone', d: 'Students, women, professionals' },
              { icon: '🤲', t: 'Halal Income', d: 'Ethical earning, always' },
            ].map(c => (
              <div key={c.t} className="p-5 rounded-2xl border"
                style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <span className="text-2xl block mb-2">{c.icon}</span>
                <p className="text-white font-bold text-sm">{c.t}</p>
                <p className="text-gray-500 text-xs mt-1 leading-snug">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          MISSION / VISION BENTO
      ══════════════════════════════════════════ */}
      <section className="py-16 max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Mission - large */}
          <div className="sm:col-span-2 relative rounded-3xl p-8 overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(124,58,237,0.08))', border: '1px solid rgba(99,102,241,0.2)' }}>
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-30"
              style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
            <div className="relative">
              <span className="text-4xl mb-4 block">🎯</span>
              <h3 className="text-2xl font-black text-white mb-3">Our Mission</h3>
              <p className="text-gray-400 leading-relaxed">
                To provide high-quality digital skills education to every learner — empowering them to start
                freelancing careers, secure digital jobs, or generate income through affiliate marketing,
                in a practical, efficient, and result-oriented way.
              </p>
            </div>
          </div>

          {/* Vision */}
          <div className="relative rounded-3xl p-8 overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(217,70,239,0.12), rgba(244,114,182,0.06))', border: '1px solid rgba(217,70,239,0.2)' }}>
            <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-30"
              style={{ background: 'radial-gradient(circle, #d946ef, transparent)' }} />
            <div className="relative">
              <span className="text-4xl mb-4 block">🌍</span>
              <h3 className="text-xl font-black text-white mb-3">Our Vision</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                A global digital hub where millions become financially independent — regardless of background, gender, or education.
              </p>
            </div>
          </div>

          {/* Values cards */}
          {[
            { icon: '⚡', title: 'Fast-Track Earning', color: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.2)' },
            { icon: '👩', title: 'Women Empowerment', color: 'rgba(244,114,182,0.12)', border: 'rgba(244,114,182,0.2)' },
            { icon: '🏆', title: 'Community First', color: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.2)' },
          ].map(v => (
            <div key={v.title} className="rounded-3xl p-6"
              style={{ background: v.color, border: `1px solid ${v.border}` }}>
              <span className="text-3xl block mb-3">{v.icon}</span>
              <p className="text-white font-bold">{v.title}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOUNDERS — WORLD CLASS
      ══════════════════════════════════════════ */}
      <section className="py-24 relative overflow-hidden">
        {/* section bg */}
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(99,102,241,0.05), transparent)' }} />

        <div className="relative max-w-6xl mx-auto px-4">
          <div className="text-center mb-20">
            <p className="text-fuchsia-400 text-sm font-bold uppercase tracking-[0.3em] mb-4">The Visionaries</p>
            <h2 className="text-5xl sm:text-6xl font-black text-white leading-tight">
              Meet the{' '}
              <span style={{ background: 'linear-gradient(135deg, #f0abfc, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Founders
              </span>
            </h2>
          </div>

          {/* ── RIZWAN CARD ── */}
          <div className="group mb-16 grid lg:grid-cols-2 gap-0 rounded-[2.5rem] overflow-hidden relative"
            style={{ boxShadow: '0 0 0 1px rgba(124,58,237,0.25), 0 40px 80px -20px rgba(99,102,241,0.25)' }}>

            {/* animated border gradient */}
            <div className="absolute inset-0 rounded-[2.5rem] pointer-events-none z-10"
              style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3), transparent 40%, transparent 60%, rgba(99,102,241,0.2))', boxShadow: 'inset 0 0 0 1px rgba(124,58,237,0.2)' }} />

            {/* photo side */}
            <div className="relative h-[500px] lg:h-auto overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #0d0a1f, #0a0d20)' }}>
              <img src="/founder-rizwan.jpg" alt="Mohd Rizwan"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-[1200ms] ease-out" />
              {/* overlay */}
              <div className="absolute inset-0"
                style={{ background: 'linear-gradient(to right, transparent 50%, rgba(8,10,20,0.95)), linear-gradient(to top, rgba(8,10,20,0.6) 0%, transparent 40%)' }} />
              {/* mobile bottom overlay */}
              <div className="lg:hidden absolute inset-0"
                style={{ background: 'linear-gradient(to top, rgba(8,10,20,1) 10%, rgba(8,10,20,0.3) 60%, transparent)' }} />

              {/* floating experience badge */}
              <div className="absolute top-6 left-6 px-4 py-2.5 rounded-2xl backdrop-blur-xl"
                style={{ background: 'rgba(10,10,30,0.75)', border: '1px solid rgba(124,58,237,0.35)' }}>
                <p className="text-2xl font-black text-white leading-none">5+</p>
                <p className="text-violet-300 text-xs font-semibold">Years in IT</p>
              </div>

              {/* floating meta badge */}
              <div className="absolute top-6 right-6 px-4 py-2.5 rounded-2xl backdrop-blur-xl"
                style={{ background: 'rgba(10,10,30,0.75)', border: '1px solid rgba(99,102,241,0.35)' }}>
                <p className="text-indigo-300 font-black text-sm">Meta Ads</p>
                <p className="text-gray-400 text-xs">Expert</p>
              </div>
            </div>

            {/* content side */}
            <div className="relative p-8 sm:p-12 flex flex-col justify-center"
              style={{ background: 'linear-gradient(135deg, #080a14, #0a0d1c)' }}>
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
                style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />

              <div className="relative">
                {/* role pill */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-bold"
                  style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.35)', color: '#c4b5fd' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                  Founder & CEO
                </div>

                <h3 className="text-3xl sm:text-4xl font-black text-white mb-1 leading-tight">Mohd Rizwan</h3>
                <p className="text-violet-400 font-semibold mb-6">Founder · TruLearnix & RB Digi Solutions</p>

                {/* quote */}
                <div className="mb-6 pl-4 border-l-2 border-violet-500">
                  <p className="text-gray-300 italic text-sm leading-relaxed">
                    "My goal is simple — take someone with zero knowledge and turn them into a confident digital earner. That's the TruLearnix promise."
                  </p>
                </div>

                <p className="text-gray-400 text-sm leading-relaxed mb-6">
                  B.Tech (CS) from <span className="text-white font-medium">Jamia Millia Islamia</span> & GGSIP University.
                  5+ years of corporate IT sales experience combined with deep expertise as a{' '}
                  <span className="text-violet-300 font-medium">Meta Ads Specialist</span> — helping businesses grow on
                  Facebook & Instagram. Founded TruLearnix to democratize digital earning for all.
                </p>

                {/* skills */}
                <div className="flex flex-wrap gap-2">
                  {['Meta Ads Expert', 'IT Sales', 'B.Tech CSE', 'Digital Marketing', 'Entrepreneur'].map(t => (
                    <span key={t} className="px-3 py-1 rounded-xl text-xs font-semibold"
                      style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)', color: '#c4b5fd' }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── ASHFANA CARD ── */}
          <div className="group grid lg:grid-cols-2 gap-0 rounded-[2.5rem] overflow-hidden relative"
            style={{ boxShadow: '0 0 0 1px rgba(217,70,239,0.25), 0 40px 80px -20px rgba(217,70,239,0.2)' }}>

            <div className="absolute inset-0 rounded-[2.5rem] pointer-events-none z-10"
              style={{ background: 'linear-gradient(135deg, rgba(217,70,239,0.3), transparent 40%, transparent 60%, rgba(244,114,182,0.2))', boxShadow: 'inset 0 0 0 1px rgba(217,70,239,0.2)' }} />

            {/* content side — left on desktop */}
            <div className="relative p-8 sm:p-12 flex flex-col justify-center order-2 lg:order-1"
              style={{ background: 'linear-gradient(135deg, #0d0814, #0f0a1a)' }}>
              <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
                style={{ background: 'radial-gradient(circle, #d946ef, transparent)' }} />

              <div className="relative">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-bold"
                  style={{ background: 'rgba(217,70,239,0.2)', border: '1px solid rgba(217,70,239,0.35)', color: '#f0abfc' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-pulse" />
                  Co-Founder & Managing Director
                </div>

                <h3 className="text-3xl sm:text-4xl font-black text-white mb-1 leading-tight">Ashfana Razaksab<br />Kolhar</h3>
                <p className="text-fuchsia-400 font-semibold mb-6">Educator · Mentor · Women Empowerment Advocate</p>

                <div className="mb-6 pl-4 border-l-2 border-fuchsia-500">
                  <p className="text-gray-300 italic text-sm leading-relaxed">
                    "Every woman deserves the tools to build her own financial freedom. TruLearnix is that bridge."
                  </p>
                </div>

                <p className="text-gray-400 text-sm leading-relaxed mb-6">
                  M.Sc. Physics from <span className="text-white font-medium">Karnataka University</span>.
                  2-3 years mentoring learners across online platforms, with 4 years of high-performance sales experience
                  alongside top entrepreneurs. Ashfana champions{' '}
                  <span className="text-fuchsia-300 font-medium">practical education and financial independence</span>{' '}
                  — especially for women.
                </p>

                <div className="flex flex-wrap gap-2">
                  {['M.Sc. Physics', 'Online Mentor', 'Fashion Design', 'Sales Expert', 'Women\'s Advocate'].map(t => (
                    <span key={t} className="px-3 py-1 rounded-xl text-xs font-semibold"
                      style={{ background: 'rgba(217,70,239,0.15)', border: '1px solid rgba(217,70,239,0.25)', color: '#f0abfc' }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* photo side — right on desktop */}
            <div className="relative h-[500px] lg:h-auto overflow-hidden order-1 lg:order-2"
              style={{ background: 'linear-gradient(135deg, #150d1f, #1a0d20)' }}>
              <img src="/founder-ashfana.jpg" alt="Ashfana Razaksab Kolhar"
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-[1200ms] ease-out" />
              <div className="absolute inset-0"
                style={{ background: 'linear-gradient(to left, transparent 50%, rgba(15,8,20,0.95)), linear-gradient(to top, rgba(15,8,20,0.6) 0%, transparent 40%)' }} />
              <div className="lg:hidden absolute inset-0"
                style={{ background: 'linear-gradient(to top, rgba(15,8,20,1) 10%, rgba(15,8,20,0.3) 60%, transparent)' }} />

              <div className="absolute top-6 right-6 px-4 py-2.5 rounded-2xl backdrop-blur-xl"
                style={{ background: 'rgba(15,8,25,0.75)', border: '1px solid rgba(217,70,239,0.35)' }}>
                <p className="text-2xl font-black text-white leading-none">3+</p>
                <p className="text-fuchsia-300 text-xs font-semibold">Yrs Mentoring</p>
              </div>

              <div className="absolute top-6 left-6 px-4 py-2.5 rounded-2xl backdrop-blur-xl"
                style={{ background: 'rgba(15,8,25,0.75)', border: '1px solid rgba(244,114,182,0.35)' }}>
                <p className="text-pink-300 font-black text-sm">M.Sc.</p>
                <p className="text-gray-400 text-xs">Physics</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          EARNING PATHS
      ══════════════════════════════════════════ */}
      <section className="py-20 max-w-6xl mx-auto px-4">
        <div className="text-center mb-14">
          <p className="text-amber-400 text-sm font-bold uppercase tracking-widest mb-3">What We Teach</p>
          <h2 className="text-4xl sm:text-5xl font-black text-white">3 Paths to Digital Income</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            {
              emoji: '💼',
              title: 'Freelancing',
              sub: 'Global client base',
              desc: 'Master Upwork, Fiverr & Freelancer. Build a profile that attracts clients worldwide and earns in dollars.',
              color: 'rgba(99,102,241,0.15)',
              border: 'rgba(99,102,241,0.25)',
              tag: 'text-indigo-300',
            },
            {
              emoji: '📱',
              title: 'Digital Jobs',
              sub: 'Career placement',
              desc: 'Land roles in digital marketing, social media management, graphic design & more at top companies.',
              color: 'rgba(16,185,129,0.12)',
              border: 'rgba(16,185,129,0.25)',
              tag: 'text-emerald-300',
            },
            {
              emoji: '💸',
              title: 'Affiliate Marketing',
              sub: 'Passive income',
              desc: 'Amazon Associates, ClickBank & more. Build systems that earn while you sleep.',
              color: 'rgba(245,158,11,0.12)',
              border: 'rgba(245,158,11,0.25)',
              tag: 'text-amber-300',
            },
          ].map(p => (
            <div key={p.title} className="group relative rounded-3xl p-8 overflow-hidden transition-transform duration-300 hover:-translate-y-2"
              style={{ background: p.color, border: `1px solid ${p.border}` }}>
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl opacity-30"
                style={{ background: p.border }} />
              <span className="text-5xl block mb-5">{p.emoji}</span>
              <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${p.tag}`}>{p.sub}</p>
              <h3 className="text-xl font-black text-white mb-3">{p.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA
      ══════════════════════════════════════════ */}
      <section className="py-20 max-w-5xl mx-auto px-4">
        <div className="relative rounded-[2.5rem] overflow-hidden text-center p-12 sm:p-20"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(124,58,237,0.15) 50%, rgba(217,70,239,0.1) 100%)', border: '1px solid rgba(124,58,237,0.25)' }}>
          <div className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse 60% 80% at 50% 50%, rgba(99,102,241,0.1), transparent)' }} />
          <div className="relative">
            <p className="text-violet-300 font-bold text-sm uppercase tracking-widest mb-4">Start Today</p>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 leading-tight">
              Your Digital Career<br />Starts Here.
            </h2>
            <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
              Join 10,000+ learners already building their future with TruLearnix.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/courses"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-white font-black text-base transition-all hover:opacity-90 hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)', boxShadow: '0 0 40px rgba(124,58,237,0.4), 0 8px 24px rgba(0,0,0,0.3)' }}>
                Explore Courses →
              </a>
              <a href="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-white font-black text-base transition-all hover:bg-white/10"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
