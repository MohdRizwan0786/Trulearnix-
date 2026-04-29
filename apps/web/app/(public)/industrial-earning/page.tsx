import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export const metadata = {
  title: 'Industrial Earning — TruLearnix',
  description: 'Learn about Industrial Earning for special industry partners on TruLearnix.',
}

export default function IndustrialEarningPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen" style={{ background: '#04050a', paddingTop: '64px' }}>

        {/* Hero */}
        <section className="relative py-16 px-4 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/3 w-[500px] h-[400px] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)' }} />
            <div className="absolute top-0 right-1/3 w-[400px] h-[400px] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)' }} />
          </div>

          <div className="max-w-3xl mx-auto relative text-center">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
              <span className="text-amber-400 text-xs font-black uppercase tracking-wide">Special Partner Program</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight mb-5">
              🏭 Industrial +{' '}
              <span style={{ background: 'linear-gradient(135deg,#f59e0b,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                TruLearnix Earning
              </span>
            </h1>
            <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto">
              A special earning recognition for partners who bring prior industry experience and transition to TruLearnix.
            </p>
          </div>
        </section>

        {/* What is it */}
        <section className="px-4 pb-10 max-w-3xl mx-auto space-y-6">

          {/* Card 1 */}
          <div className="rounded-2xl p-6"
            style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🏭</span>
              <h2 className="text-white font-black text-lg">What is Industrial Earning?</h2>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Some partners come to TruLearnix from other platforms, training institutes, or industries where they have already built a strong student base and earned significant income. <strong className="text-white">Industrial Earning</strong> is a recognition of that prior work — it is credited to their TruLearnix profile as a starting balance to acknowledge their past contribution.
            </p>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl p-6"
            style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">⚡</span>
              <h2 className="text-white font-black text-lg">How does it grow?</h2>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Once a partner joins TruLearnix, every new sale they make earns them real Partnership earnings. Their <strong className="text-white">total lifetime earning</strong> shown on the leaderboard and their dashboard is the combined sum of:
            </p>
            <ul className="mt-3 space-y-2">
              {[
                ['🏭', 'Industrial Earning', 'Recognition credit from previous platform (set by admin)'],
                ['⚡', 'TruLearnix Partnership earnings', 'Real Partnership earnings earned from sales on TruLearnix — grows with every referral'],
              ].map(([icon, title, desc]) => (
                <li key={title} className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <span className="text-lg flex-shrink-0">{icon}</span>
                  <div>
                    <p className="text-white font-bold text-sm">{title}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl p-6"
            style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">💳</span>
              <h2 className="text-white font-black text-lg">Can Industrial Earning be withdrawn?</h2>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              <strong className="text-white">No.</strong> Industrial Earning is a display-only recognition credit. It is not added to the wallet and cannot be withdrawn. Only real TruLearnix Partnership earnings are deposited into the wallet and are eligible for withdrawal.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl p-3 text-center"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <p className="text-amber-400 font-black text-xs uppercase tracking-wide mb-1">Industrial Earning</p>
                <p className="text-white text-xs">Display only · Not withdrawable</p>
              </div>
              <div className="rounded-xl p-3 text-center"
                style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
                <p className="text-violet-400 font-black text-xs uppercase tracking-wide mb-1">TruLearnix Earnings</p>
                <p className="text-white text-xs">Withdrawable · Goes to wallet</p>
              </div>
            </div>
          </div>

          {/* Card 4 */}
          <div className="rounded-2xl p-6"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🏆</span>
              <h2 className="text-white font-black text-lg">Leaderboard Position</h2>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              On the public leaderboard, Industrial Partners are ranked by their <strong className="text-white">combined total</strong> — Industrial Earning + TruLearnix Partnership earnings. They are identified with the <span className="text-amber-400 font-bold">🏭 Industrial + TruLearnix</span> badge.
            </p>
          </div>

          {/* CTA */}
          <div className="rounded-2xl p-8 text-center"
            style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.07),rgba(139,92,246,0.06))', border: '1px solid rgba(245,158,11,0.2)' }}>
            <p className="text-white font-black text-lg mb-2">Want to become a partner?</p>
            <p className="text-gray-500 text-sm mb-5">Join TruLearnix and start earning real Partnership earnings today.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/leaderboard"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm text-amber-400 transition-all hover:scale-[1.03]"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
                View Leaderboard
              </Link>
              <Link href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm text-white transition-all hover:scale-[1.03]"
                style={{ background: 'linear-gradient(135deg,#d97706,#7c3aed)', boxShadow: '0 6px 24px rgba(245,158,11,0.3)' }}>
                Join Now
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
