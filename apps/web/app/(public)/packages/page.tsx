'use client'
import { useQuery } from '@tanstack/react-query'
import { packageAPI } from '@/lib/api'
import { Check, Star, Zap, Shield, Award } from 'lucide-react'
import Link from 'next/link'

const TIERS = [
  { tier: 'starter', name: 'Starter', price: 4999, rate: 10, color: 'border-blue-500/30 hover:border-blue-500', accent: 'text-blue-400', badge: '' },
  { tier: 'pro', name: 'Pro', price: 9999, rate: 15, color: 'border-violet-500/30 hover:border-violet-500', accent: 'text-violet-400', badge: 'Popular' },
  { tier: 'elite', name: 'Elite', price: 19999, rate: 22, color: 'border-orange-500/30 hover:border-orange-500', accent: 'text-orange-400', badge: '' },
  { tier: 'supreme', name: 'Supreme', price: 29999, rate: 30, color: 'border-yellow-500/30 hover:border-yellow-500', accent: 'text-yellow-400', badge: 'Best Value' },
]

const FEATURES: Record<string, string[]> = {
  starter: ['All course access', 'Live classes (basic)', 'Community access', 'Certificate generation', 'Earn Panel (10% income share)', 'Email support'],
  pro: ['Everything in Starter', 'AI Coach access', 'Job Engine', '15% income share', 'Priority support', 'Personal brand builder'],
  elite: ['Everything in Pro', '22% income share', 'Mentor 1:1 sessions', 'Advanced analytics', 'Early access to new courses', 'WhatsApp support'],
  supreme: ['Everything in Elite', '30% Max income share', 'Done-For-You earning system', 'Dedicated success manager', 'Exclusive mastermind group', 'Lifetime updates'],
}

const SALE_TIERS = ['starter', 'pro', 'elite', 'supreme']
const SALE_PRICES = { starter: 4999, pro: 9999, elite: 19999, supreme: 29999 }
const SALE_RATES = { starter: 10, pro: 15, elite: 22, supreme: 30 }

export default function PackagesPage() {
  const { data: pkgData } = useQuery({ queryKey: ['packages-public'], queryFn: () => packageAPI.getAll().then(r => r.data) })

  return (
    <div className="min-h-screen bg-dark-900 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-xs font-bold text-primary-400 tracking-widest uppercase bg-primary-500/10 px-4 py-1.5 rounded-full border border-primary-500/20">Pricing Plans</span>
          <h1 className="text-4xl md:text-5xl font-black text-white mt-4 mb-3">Choose Your Plan</h1>
          <p className="text-gray-400 max-w-xl mx-auto">Your package tier determines your income share rate. Higher tier = more earnings when you help others learn.</p>
        </div>

        {/* Package Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {TIERS.map(t => (
            <div key={t.tier} className={`relative card border ${t.color} transition-all flex flex-col ${t.badge ? 'ring-2 ring-violet-500/50' : ''}`}>
              {t.badge && <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 bg-primary-500 text-white rounded-full">{t.badge}</div>}
              <div className="mb-4">
                <h3 className="font-bold text-white text-lg">{t.name}</h3>
                <div className="flex items-end gap-1 mt-2">
                  <span className="text-3xl font-black text-white">₹{t.price.toLocaleString()}</span>
                  <span className="text-xs text-gray-400 mb-1">one-time</span>
                </div>
                <div className={`inline-flex items-center gap-1 text-sm font-bold ${t.accent} mt-1`}>
                  <Zap className="w-3.5 h-3.5" />{t.rate}% Income Rate
                </div>
              </div>
              <ul className="space-y-2 flex-1 mb-6">
                {FEATURES[t.tier].map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                    <Check className={`w-4 h-4 ${t.accent} flex-shrink-0 mt-0.5`} />{f}
                  </li>
                ))}
              </ul>
              <Link href={`/register?package=${t.tier}`} className={`w-full text-center py-3 rounded-2xl font-bold text-sm transition-all ${
                t.badge ? 'btn-primary' : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'}`}>
                Get Started
              </Link>
              <p className="text-xs text-gray-500 text-center mt-2">GST extra • No recurring fee</p>
            </div>
          ))}
        </div>

        {/* Commission Matrix */}
        <div className="card mb-16">
          <h2 className="text-2xl font-bold text-white mb-2 text-center">Income Matrix</h2>
          <p className="text-gray-400 text-center text-sm mb-6">Your tier % × price = your income (Level 1)</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-gray-400">Your Tier</th>
                  <th className="text-center py-3 px-4 text-gray-400">Your Rate</th>
                  <th className="text-center py-3 px-4 text-blue-400">Starter sold</th>
                  <th className="text-center py-3 px-4 text-violet-400">Pro sold</th>
                  <th className="text-center py-3 px-4 text-orange-400">Elite sold</th>
                  <th className="text-center py-3 px-4 text-yellow-400">Supreme sold</th>
                </tr>
              </thead>
              <tbody>
                {SALE_TIERS.map(myTier => {
                  const myRate = SALE_RATES[myTier as keyof typeof SALE_RATES]
                  return (
                    <tr key={myTier} className="border-b border-white/5 hover:bg-white/2">
                      <td className="py-3 px-4 font-semibold text-white capitalize">{myTier}</td>
                      <td className="py-3 px-4 text-center text-green-400 font-bold">{myRate}%</td>
                      {SALE_TIERS.map(saleTier => (
                        <td key={saleTier} className="py-3 px-4 text-center text-white">
                          ₹{Math.round(SALE_PRICES[saleTier as keyof typeof SALE_PRICES] * myRate / 100).toLocaleString()}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-4 bg-primary-500/10 rounded-xl border border-primary-500/20">
            <p className="text-sm text-primary-300">
              <span className="font-bold">MLM Levels:</span> Level 1 = your tier % | Level 2 = 5% fixed | Level 3 = 2% fixed
            </p>
          </div>
        </div>

        {/* FAQs */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: 'How is income calculated?', a: 'Your income rate is determined by YOUR OWN package tier — not the package you help sell. If you hold Supreme (30%) and someone buys a Starter (₹4,999) through your link, you earn ₹1,500.' },
              { q: 'When do I get Earn access?', a: 'Immediately after payment is confirmed. Your Earn Panel is auto-unlocked, a personal invite link is assigned, and a welcome message is sent. No manual step required.' },
              { q: 'What are the earn levels?', a: 'Level 1 = people you invite directly (your tier %). Level 2 = their invites (5% fixed). Level 3 = L2 invites (2% fixed). All 3 levels are credited to your wallet automatically.' },
              { q: 'When is income paid out?', a: 'Income is credited to your wallet in real-time on every sale. You can withdraw anytime (minimum ₹500) via UPI or bank transfer — processed within 24-48 hours.' },
              { q: 'Is GST applicable?', a: 'Yes, 18% GST is applicable on all package purchases as per Indian tax law. A GST invoice will be emailed to you after payment.' },
            ].map(faq => (
              <div key={faq.q} className="card">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white mb-1">{faq.q}</p>
                    <p className="text-sm text-gray-400">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-500 text-sm">Have questions? <Link href="/" className="text-primary-400 hover:underline">Contact us</Link></p>
        </div>
      </div>
    </div>
  )
}
