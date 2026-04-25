import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import MentorStats from './MentorStats'
import { Metadata } from 'next'
import Link from 'next/link'
import {
  Star, Users, DollarSign, Globe, BookOpen, Video,
  CheckCircle, ArrowRight, Award, Zap, TrendingUp, Heart, Mail, ArrowLeft
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Become a Mentor | TruLearnix',
  description: 'Share your expertise with thousands of learners. Teach on TruLearnix and earn while making an impact.',
}

const perks = [
  {
    icon: DollarSign,
    title: 'Earn Every Month',
    desc: 'Get paid for every learner you teach. Revenue share model with transparent monthly payouts.',
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
  },
  {
    icon: Globe,
    title: 'Reach 10,000+ Learners',
    desc: 'Your expertise reaches students across India. Build your personal brand and audience.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/20',
  },
  {
    icon: Video,
    title: 'Live & Recorded Classes',
    desc: 'Teach live interactive sessions or create on-demand course content — your choice.',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10 border-indigo-500/20',
  },
  {
    icon: Award,
    title: 'Mentor Badge & Credibility',
    desc: 'Get a verified Mentor badge, profile page, and reviews to boost your professional reputation.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
  {
    icon: Zap,
    title: 'Full Platform Support',
    desc: 'We handle payments, marketing, and tech. You just focus on delivering great content.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
  },
  {
    icon: Heart,
    title: 'Make Real Impact',
    desc: 'Help students land jobs, grow freelancing income, and change their financial lives.',
    color: 'text-fuchsia-400',
    bg: 'bg-fuchsia-500/10 border-fuchsia-500/20',
  },
]

const steps = [
  { number: '01', title: 'Apply Online', desc: 'Fill out our quick mentor application form. Tell us about your expertise and teaching experience.' },
  { number: '02', title: 'Profile Review', desc: 'Our team reviews your application within 2–3 business days and schedules an intro call.' },
  { number: '03', title: 'Demo Session', desc: 'Conduct a short demo class to showcase your teaching style and subject knowledge.' },
  { number: '04', title: 'Start Teaching', desc: 'Get onboarded, set up your profile, schedule your first live class, and start earning.' },
]

const subjects = [
  'Digital Marketing', 'Freelancing (Upwork/Fiverr)', 'Partnership Marketing',
  'Web Development', 'Graphic Design', 'Video Editing',
  'Social Media Marketing', 'Content Writing', 'SEO & SEM',
  'Python / AI', 'E-Commerce', 'YouTube Growth',
]

const statSlots = [
  { key: 'totalStudents', label: 'Active Learners' },
  { key: 'totalCourses', label: 'Courses Live' },
  { key: 'totalMentors', label: 'Expert Mentors' },
  { key: 'avgRating', label: 'Platform Rating' },
]

export default function BecomeMentorPage() {
  return (
    <main className="bg-[#04050a] min-h-screen">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 pt-24 pb-0">
        <Link href="/" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />Back to Home
        </Link>
      </div>

      {/* ── Hero ── */}
      <section className="relative pt-8 pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-radial from-violet-600/20 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-[300px] h-[300px] bg-gradient-radial from-indigo-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm font-medium mb-6">
            <Star className="w-4 h-4 fill-violet-400 text-violet-400" /> Join Our Expert Mentor Network
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-6 leading-[1.05]">
            Turn Your Skills Into{' '}
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
              Income
            </span>
          </h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Share your expertise with thousands of motivated learners. Teach on TruLearnix, earn monthly revenue, and build your personal brand.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="mailto:Hr@trulearnix.com?subject=Mentor Application"
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black text-base hover:opacity-90 transition-opacity shadow-2xl shadow-violet-500/30 flex items-center gap-2">
              Apply to Teach <ArrowRight className="w-5 h-5" />
            </a>
            <Link href="/contact"
              className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-gray-300 font-semibold text-base hover:bg-white/10 transition-colors flex items-center gap-2">
              <Mail className="w-5 h-5" /> Ask a Question
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <MentorStats items={statSlots} />
      </section>

      {/* ── Perks ── */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
            Why Teach on <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">TruLearnix?</span>
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">Everything you need to build a successful teaching career — we handle the rest.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {perks.map((p) => {
            const Icon = p.icon
            return (
              <div key={p.title} className={`p-6 rounded-2xl border ${p.bg} hover:scale-[1.02] transition-transform`}>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${p.bg} border`}>
                  <Icon className={`w-5 h-5 ${p.color}`} />
                </div>
                <h3 className={`font-black text-base mb-2 ${p.color}`}>{p.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{p.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="max-w-4xl mx-auto px-4 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">How It Works</h2>
          <p className="text-gray-500">From application to your first class in as little as 1 week.</p>
        </div>
        <div className="space-y-4">
          {steps.map((step, i) => (
            <div key={step.number} className="flex items-start gap-6 p-6 rounded-2xl bg-dark-800 border border-white/5 hover:border-violet-500/20 transition-colors group">
              <span className="text-5xl font-black text-violet-500/20 group-hover:text-violet-500/40 transition-colors leading-none flex-shrink-0">{step.number}</span>
              <div className="pt-1">
                <h3 className="text-white font-black text-lg mb-1">{step.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden sm:flex items-center ml-auto">
                  <ArrowRight className="w-5 h-5 text-gray-700" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Subjects ── */}
      <section className="max-w-4xl mx-auto px-4 pb-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-white mb-3">We're Looking for Experts In</h2>
          <p className="text-gray-500">High-demand skills that our learners are eager to master.</p>
        </div>
        <div className="flex flex-wrap gap-3 justify-center">
          {subjects.map((s) => (
            <span key={s} className="px-4 py-2 rounded-xl bg-white/5 border border-white/8 text-gray-300 text-sm font-medium hover:border-violet-500/30 hover:text-violet-300 transition-colors">
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* ── Requirements ── */}
      <section className="max-w-4xl mx-auto px-4 pb-20">
        <div className="p-8 rounded-3xl bg-gradient-to-br from-violet-600/10 to-indigo-600/10 border border-violet-500/20">
          <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-violet-400" /> Mentor Requirements
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              'Minimum 2 years of practical experience in your field',
              'Strong communication and teaching ability',
              'Stable internet connection for live classes',
              'Commitment to at least 4 live sessions per month',
              'Ability to create structured course content',
              'Passion for helping learners grow and succeed',
            ].map((req) => (
              <div key={req} className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                <p className="text-gray-300 text-sm">{req}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-4xl mx-auto px-4 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600/20 via-indigo-600/15 to-fuchsia-600/10 border border-violet-500/25 p-10 text-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <TrendingUp className="w-12 h-12 text-violet-400 mx-auto mb-4" />
            <h2 className="text-3xl font-black text-white mb-3">Ready to Start Teaching?</h2>
            <p className="text-gray-400 mb-8 max-w-lg mx-auto">
              Join our growing community of mentors. Apply today and start transforming lives — including your own.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="mailto:Hr@trulearnix.com?subject=Mentor Application — TruLearnix"
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black text-base hover:opacity-90 transition-opacity shadow-2xl shadow-violet-500/30 flex items-center gap-2">
                Send Mentor Application <ArrowRight className="w-5 h-5" />
              </a>
              <a href="https://wa.me/918979616798?text=Hi%2C+I%27m+interested+in+becoming+a+mentor+on+TruLearnix"
                target="_blank" rel="noreferrer"
                className="px-8 py-4 rounded-2xl bg-green-500/15 border border-green-500/20 text-green-300 font-semibold text-base hover:bg-green-500/25 transition-colors flex items-center gap-2">
                Chat on WhatsApp
              </a>
            </div>
            <p className="text-gray-600 text-xs mt-6">Apply by emailing Hr@trulearnix.com · Response within 2–3 business days</p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
