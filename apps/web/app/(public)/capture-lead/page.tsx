'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import { CheckCircle2, Loader2, User, Phone, Mail, Sparkles, BookOpen, Award, TrendingUp, ArrowRight, Shield } from 'lucide-react'

function CaptureLeadForm() {
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref') || ''

  const [form, setForm] = useState({ name: '', phone: '', email: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return setError('Please enter your name')
    if (!form.phone.trim()) return setError('Please enter your mobile number')
    if (form.phone.trim().length < 10) return setError('Enter a valid 10-digit mobile number')
    setError('')
    setLoading(true)
    try {
      await api.post('/partner/crm/lead', {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        affiliateCode: ref,
        source: 'capture_link',
      })
      setSubmitted(true)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center px-4">
        <div className="relative w-full max-w-md">
          {/* Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-pink-600/20 rounded-3xl blur-3xl" />
          <div className="relative bg-[#13131f] border border-white/10 rounded-3xl p-8 sm:p-10 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-green-500/30">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-white text-2xl font-black mb-2">You're In! 🎉</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              We've received your details. Our team will get in touch with you shortly to help you get started.
            </p>
            <div className="mt-6 flex items-center justify-center gap-2 text-violet-400 text-xs font-medium">
              <Shield className="w-3.5 h-3.5" /> Your information is safe with us
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a14] flex flex-col">
      {/* Top bar */}
      <div className="w-full px-4 py-4 flex items-center justify-center border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-white font-bold text-base">TruLearnix</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-5">

          {/* Hero card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800 p-6 text-center">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-pink-500/20 blur-xl" />
            </div>
            <div className="relative">
              <div className="inline-flex items-center gap-1.5 bg-white/15 border border-white/20 text-white text-[11px] font-semibold px-3 py-1.5 rounded-full mb-3">
                <Sparkles className="w-3 h-3" /> India's #1 EdTech Platform
              </div>
              <h1 className="text-white text-2xl font-black leading-tight">
                Learn. Grow.<br />Earn with TruLearnix
              </h1>
              <p className="text-white/70 text-sm mt-2 leading-relaxed">
                Join thousands of learners building real skills and earning through our partner network.
              </p>
            </div>
          </div>

          {/* Benefits row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: BookOpen, label: 'Live Courses',   color: 'text-violet-400', bg: 'bg-violet-500/10' },
              { icon: Award,    label: 'Certificates',   color: 'text-amber-400',  bg: 'bg-amber-500/10'  },
              { icon: TrendingUp,label: 'Earn Income',   color: 'text-green-400',  bg: 'bg-green-500/10'  },
            ].map(({ icon: Icon, label, color, bg }) => (
              <div key={label} className={`${bg} border border-white/5 rounded-xl p-3 text-center`}>
                <Icon className={`w-5 h-5 ${color} mx-auto mb-1.5`} />
                <p className="text-white/80 text-[11px] font-semibold">{label}</p>
              </div>
            ))}
          </div>

          {/* Form card */}
          <div className="relative overflow-hidden bg-[#13131f] border border-white/10 rounded-2xl p-5 sm:p-6">
            <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
            <h2 className="text-white font-black text-lg mb-1">Get a Free Callback</h2>
            <p className="text-gray-500 text-xs mb-5">Fill in your details — we'll reach out within 24 hours</p>

            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              {/* Name */}
              <div>
                <label className="text-gray-400 text-xs font-medium mb-1.5 block">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Your full name"
                    autoComplete="off"
                    data-form-type="other"
                    data-lpignore="true"
                    name="tlx_lead_name"
                    className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 text-sm transition-colors"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="text-gray-400 text-xs font-medium mb-1.5 block">Mobile Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                    placeholder="10-digit mobile number"
                    inputMode="numeric"
                    autoComplete="off"
                    data-form-type="other"
                    data-lpignore="true"
                    name="tlx_lead_phone"
                    className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 text-sm transition-colors"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-gray-400 text-xs font-medium mb-1.5 block">Email <span className="text-gray-600">(optional)</span></label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="your@email.com"
                    type="email"
                    autoComplete="new-password"
                    data-form-type="other"
                    data-lpignore="true"
                    name="tlx_lead_email"
                    className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 text-sm transition-colors"
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 active:scale-[0.98] text-white font-bold text-sm transition-all shadow-lg shadow-violet-500/25 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                  : <><span>Get Free Callback</span><ArrowRight className="w-4 h-4" /></>
                }
              </button>
            </form>

            <p className="text-center text-gray-600 text-[10px] mt-4 flex items-center justify-center gap-1">
              <Shield className="w-3 h-3" /> Your data is 100% safe and secure
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CaptureLeadPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    }>
      <CaptureLeadForm />
    </Suspense>
  )
}
