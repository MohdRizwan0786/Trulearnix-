'use client'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useState } from 'react'
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const contactInfo = [
  {
    icon: Mail,
    title: 'Official Email',
    value: 'Official@trulearnix.com',
    href: 'mailto:Official@trulearnix.com',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/20',
  },
  {
    icon: Mail,
    title: 'HR / Careers',
    value: 'Hr@trulearnix.com',
    href: 'mailto:Hr@trulearnix.com',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10 border-indigo-500/20',
  },
  {
    icon: Phone,
    title: 'Phone / WhatsApp',
    value: '+91 8979616798',
    href: 'https://wa.me/918979616798',
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
  },
  {
    icon: MapPin,
    title: 'Office Address',
    value: '891/E 22, 2nd Floor, Zakir Nagar, Jamia Nagar, New Delhi – 110025',
    href: 'https://maps.google.com/?q=Zakir+Nagar+New+Delhi+110025',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
  {
    icon: Clock,
    title: 'Support Hours',
    value: 'Mon – Sat, 10 AM – 7 PM IST',
    href: null,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
  },
]

const faqs = [
  { q: 'How do I enroll in a course?', a: 'Browse our courses, select a package that suits you, and complete the payment. You get instant access.' },
  { q: 'Are the classes live or recorded?', a: 'We offer live interactive classes with expert mentors. Recordings are available after each session.' },
  { q: 'What earning paths do you teach?', a: 'Freelancing (Upwork, Fiverr), Digital Jobs, and Affiliate Marketing (Amazon, ClickBank, and more).' },
  { q: 'Is there a refund policy?', a: 'Yes. Refund requests within 7 days of purchase are considered if fewer than 2 classes have been attended.' },
]

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) return
    setSending(true)
    await new Promise(r => setTimeout(r, 1200))
    setSending(false)
    setSent(true)
  }

  return (
    <main className="bg-[#04050a] min-h-screen">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 pt-24 pb-0">
        <Link href="/" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />Back to Home
        </Link>
      </div>

      {/* ── Hero ── */}
      <section className="relative pt-8 pb-16 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-radial from-indigo-600/20 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            We're Here to Help
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Get in{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Touch</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Have a question, want to collaborate, or just want to say hi? We'd love to hear from you.
          </p>
        </div>
      </section>

      {/* ── Contact Cards ── */}
      <section className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {contactInfo.map((c) => {
            const Icon = c.icon
            const inner = (
              <div className={`group h-full p-5 rounded-2xl border ${c.bg} hover:scale-[1.02] transition-all`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${c.bg} border`}>
                  <Icon className={`w-5 h-5 ${c.color}`} />
                </div>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-1">{c.title}</p>
                <p className={`font-semibold text-sm ${c.color} leading-snug`}>{c.value}</p>
              </div>
            )
            return c.href ? (
              <a key={c.title} href={c.href} target="_blank" rel="noreferrer">{inner}</a>
            ) : (
              <div key={c.title}>{inner}</div>
            )
          })}
        </div>
      </section>

      {/* ── Form + FAQ ── */}
      <section className="max-w-5xl mx-auto px-4 py-12 grid lg:grid-cols-2 gap-10">

        {/* Form */}
        <div>
          <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
            <Send className="w-5 h-5 text-violet-400" /> Send Us a Message
          </h2>

          {sent ? (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-3xl bg-green-500/5 border border-green-500/15">
              <CheckCircle className="w-14 h-14 text-green-400 mb-4" />
              <h3 className="text-xl font-black text-white mb-2">Message Sent!</h3>
              <p className="text-gray-400">We'll get back to you within 24 hours.</p>
              <button onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }) }}
                className="mt-6 px-6 py-2.5 rounded-xl bg-white/5 text-gray-300 text-sm hover:bg-white/10 transition-colors">
                Send Another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 font-semibold mb-1.5 block">Your Name *</label>
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Mohd Rizwan"
                    className="w-full bg-dark-800 border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-violet-500/50 transition-colors"
                    required />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-semibold mb-1.5 block">Email Address *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="you@example.com"
                    className="w-full bg-dark-800 border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-violet-500/50 transition-colors"
                    required />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 font-semibold mb-1.5 block">Subject</label>
                <input
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="Course enquiry, Support, Partnership..."
                  className="w-full bg-dark-800 border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-violet-500/50 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-gray-400 font-semibold mb-1.5 block">Message *</label>
                <textarea
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Tell us how we can help you..."
                  rows={5}
                  className="w-full bg-dark-800 border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-violet-500/50 transition-colors resize-none"
                  required />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20">
                {sending ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
                ) : (
                  <><Send className="w-4 h-4" /> Send Message</>
                )}
              </button>
            </form>
          )}
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-2xl font-black text-white mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="p-5 rounded-2xl bg-dark-800 border border-white/5 hover:border-indigo-500/20 transition-colors">
                <p className="text-white font-semibold text-sm mb-2 flex items-start gap-2">
                  <span className="text-indigo-400 font-black flex-shrink-0">Q.</span> {faq.q}
                </p>
                <p className="text-gray-400 text-sm leading-relaxed pl-5">{faq.a}</p>
              </div>
            ))}
          </div>

          {/* WhatsApp CTA */}
          <a href="https://wa.me/918979616798"
            target="_blank" rel="noreferrer"
            className="mt-6 flex items-center gap-4 p-5 rounded-2xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/15 transition-colors group">
            <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0 text-white text-xl group-hover:scale-110 transition-transform">
              💬
            </div>
            <div>
              <p className="text-white font-bold">Chat on WhatsApp</p>
              <p className="text-green-400 text-sm">+91 8979616798 — Quick response guaranteed</p>
            </div>
          </a>
        </div>
      </section>

      <Footer />
    </main>
  )
}
