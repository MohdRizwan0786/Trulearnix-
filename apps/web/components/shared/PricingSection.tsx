'use client'
import Link from 'next/link'
import { Check } from 'lucide-react'

const plans = [
  {
    name: 'Basic', price: 'Free', description: 'Perfect for beginners',
    features: ['Access to free courses', 'Community forum', 'Basic certificates', '5 quiz attempts/month'],
    cta: 'Start Free', href: '/register', highlight: false
  },
  {
    name: 'Pro', price: '₹999/mo', description: 'For serious learners', badge: 'Most Popular',
    features: ['All courses unlimited', 'Live class access', 'Premium certificates', 'Unlimited quizzes', 'Priority support', 'Download recordings', 'Affiliate program access'],
    cta: 'Start Pro', href: '/register?plan=pro', highlight: true
  },
  {
    name: 'Mentor', price: '₹1,999/mo', description: 'For educators & trainers',
    features: ['Everything in Pro', 'Create & sell courses', 'Live class hosting', 'Student analytics', '70% revenue share', 'Dedicated support', 'Custom branding'],
    cta: 'Become Mentor', href: '/register?role=mentor', highlight: false
  }
]

export default function PricingSection() {
  return (
    <section className="section" id="pricing">
      <div className="text-center mb-12">
        <p className="text-primary-400 font-medium mb-2">Flexible Plans</p>
        <h2 className="text-4xl font-bold text-white mb-4">Pricing for Everyone</h2>
        <p className="text-gray-400">Start free, upgrade when you're ready</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan, i) => (
          <div key={i} className={`relative rounded-2xl p-8 ${plan.highlight ? 'bg-gradient-to-b from-primary-500 to-secondary-600 text-white shadow-2xl shadow-primary-500/30 scale-105' : 'card'}`}>
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-xs font-bold px-4 py-1 rounded-full">
                {plan.badge}
              </div>
            )}
            <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
            <p className={`text-sm mb-4 ${plan.highlight ? 'text-primary-100' : 'text-gray-400'}`}>{plan.description}</p>
            <div className="text-3xl font-black mb-6">{plan.price}</div>
            <ul className="space-y-3 mb-8">
              {plan.features.map((f, j) => (
                <li key={j} className={`flex items-center gap-2 text-sm ${plan.highlight ? 'text-white' : 'text-gray-300'}`}>
                  <Check className={`w-4 h-4 flex-shrink-0 ${plan.highlight ? 'text-green-300' : 'text-primary-400'}`} />
                  {f}
                </li>
              ))}
            </ul>
            <Link href={plan.href}
              className={`block text-center py-3 rounded-xl font-semibold transition-all ${plan.highlight ? 'bg-white text-primary-600 hover:bg-primary-50' : 'btn-primary'}`}>
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}
