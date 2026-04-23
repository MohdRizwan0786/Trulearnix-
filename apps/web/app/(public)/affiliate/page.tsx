import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Zap, Users, TrendingUp, Gift, Share2, Award } from 'lucide-react'

export const metadata = {
  title: 'Earn Money — Affiliate Program | TruLearnix',
  description: 'Join TruLearnix Affiliate Program. Share, refer, and earn commissions on every enrolled student.',
}

export default function AffiliatePage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen" style={{ background: '#04050a', paddingTop: '64px' }}>
        <section className="relative py-16 px-4 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/3 w-[500px] h-[400px] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)' }} />
            <div className="absolute top-0 right-1/3 w-[400px] h-[400px] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)' }} />
          </div>

          <div className="max-w-3xl mx-auto relative text-center">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full"
              style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)' }}>
              <Zap className="w-4 h-4 text-violet-400" />
              <span className="text-violet-300 text-xs font-black uppercase tracking-wide">Partner Program</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
              Refer. Share. <span className="text-violet-400">Earn.</span>
            </h1>
            <p className="text-lg text-white/70 mb-8">
              Join our affiliate program and earn commissions on every student who enrolls through your referral link.
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/login"
                className="px-6 py-3 rounded-xl font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #a855f7)' }}>
                Get Your Referral Link
              </Link>
              <Link href="/contact"
                className="px-6 py-3 rounded-xl font-bold text-white border border-white/20 hover:bg-white/5">
                Talk to Us
              </Link>
            </div>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-4">
            {[
              { icon: Share2, title: 'Share Your Link', desc: 'Get a unique referral link from your dashboard.' },
              { icon: Users, title: 'Refer Students', desc: 'Share with friends, on social media, or your network.' },
              { icon: Gift, title: 'Earn Commission', desc: 'Get paid for every student who enrolls via your link.' },
            ].map((s, i) => (
              <div key={i} className="p-6 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <s.icon className="w-8 h-8 text-violet-400 mb-3" />
                <h3 className="text-white font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-white/60 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="max-w-3xl mx-auto grid grid-cols-3 gap-4 text-center">
            {[
              { val: '50K+', label: 'Students', icon: Users },
              { val: '₹2Cr+', label: 'Paid Out', icon: TrendingUp },
              { val: '4.9★', label: 'Rating', icon: Award },
            ].map((s, i) => (
              <div key={i} className="p-6 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <s.icon className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                <div className="text-2xl font-black text-white">{s.val}</div>
                <div className="text-xs text-white/60 uppercase tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="max-w-2xl mx-auto text-center p-8 rounded-2xl"
            style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(245,158,11,0.08))', border: '1px solid rgba(139,92,246,0.3)' }}>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-3">Ready to start earning?</h2>
            <p className="text-white/70 mb-6">Sign up or log in, and grab your unique referral link in seconds.</p>
            <Link href="/register"
              className="inline-block px-8 py-3 rounded-xl font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #f59e0b)' }}>
              Join Now Free
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
