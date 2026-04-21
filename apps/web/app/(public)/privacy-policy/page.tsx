import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Metadata } from 'next'
import { Shield, Lock, Eye, Database, UserCheck, Bell, Globe, Mail, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy | TruLearnix',
  description: 'Learn how TruLearnix collects, uses, and protects your personal information.',
}

const sections = [
  {
    icon: Database,
    title: 'Information We Collect',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/20',
    items: [
      { title: 'Personal Information', desc: 'Name, email address, phone number, and profile photo when you register or update your account.' },
      { title: 'Payment Information', desc: 'We process payments securely via Razorpay. We do not store your card details on our servers.' },
      { title: 'Usage Data', desc: 'Pages visited, courses accessed, time spent, and interaction data to improve your learning experience.' },
      { title: 'Device Information', desc: 'IP address, browser type, operating system, and device identifiers for security and analytics.' },
    ]
  },
  {
    icon: Eye,
    title: 'How We Use Your Information',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10 border-indigo-500/20',
    items: [
      { title: 'Service Delivery', desc: 'To provide access to courses, live classes, assignments, quizzes, and certificates.' },
      { title: 'Communication', desc: 'Course updates, announcements, support responses, and important account notifications.' },
      { title: 'Personalization', desc: 'Recommend relevant courses and content based on your learning history and preferences.' },
      { title: 'Analytics & Improvement', desc: 'Analyze platform usage to improve content quality and user experience.' },
    ]
  },
  {
    icon: Lock,
    title: 'Data Security',
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
    items: [
      { title: 'Encryption', desc: 'All data transmitted between you and our servers is encrypted using SSL/TLS protocols.' },
      { title: 'Secure Storage', desc: 'Your data is stored on secure servers with restricted access and regular security audits.' },
      { title: 'Payment Security', desc: 'Payment processing is handled by Razorpay, which is PCI-DSS compliant.' },
      { title: 'Access Control', desc: 'Strict internal access controls ensure only authorized personnel handle your data.' },
    ]
  },
  {
    icon: UserCheck,
    title: 'Your Rights',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    items: [
      { title: 'Access', desc: 'You can request a copy of the personal information we hold about you at any time.' },
      { title: 'Correction', desc: 'You may update or correct your personal information through your account settings.' },
      { title: 'Deletion', desc: 'You may request deletion of your account and associated data by contacting us.' },
      { title: 'Opt-Out', desc: 'You can unsubscribe from marketing emails at any time using the unsubscribe link.' },
    ]
  },
  {
    icon: Globe,
    title: 'Cookies & Tracking',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
    items: [
      { title: 'Essential Cookies', desc: 'Required for platform functionality including authentication and session management.' },
      { title: 'Analytics Cookies', desc: 'Help us understand how learners use the platform to improve the experience.' },
      { title: 'Preference Cookies', desc: 'Remember your settings and preferences for a personalized experience.' },
      { title: 'Managing Cookies', desc: 'You can control cookies through your browser settings. Disabling some may affect functionality.' },
    ]
  },
  {
    icon: Bell,
    title: 'Third-Party Services',
    color: 'text-fuchsia-400',
    bg: 'bg-fuchsia-500/10 border-fuchsia-500/20',
    items: [
      { title: 'Razorpay', desc: 'Payment processing. Subject to Razorpay\'s own privacy policy.' },
      { title: 'AWS S3', desc: 'Secure file and media storage for course content and user uploads.' },
      { title: 'Google Analytics', desc: 'Website analytics to understand traffic and usage patterns.' },
      { title: 'Email Services', desc: 'Transactional emails for account verification, OTPs, and notifications.' },
    ]
  },
]

export default function PrivacyPolicyPage() {
  return (
    <main className="bg-[#04050a] min-h-screen">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-0">
        <Link href="/" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />Back to Home
        </Link>
      </div>

      {/* ── Hero ── */}
      <section className="relative pt-8 pb-16 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-radial from-violet-600/15 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm font-medium mb-6">
            <Shield className="w-4 h-4" /> Your Privacy Matters
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Privacy{' '}
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Policy</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-6">
            We are committed to protecting your personal information and being transparent about how we use it.
          </p>
          <div className="inline-flex items-center gap-2 text-sm text-gray-500">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
            Last updated: April 14, 2026
            <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
            Effective: April 14, 2026
          </div>
        </div>
      </section>

      {/* ── Intro Banner ── */}
      <section className="max-w-4xl mx-auto px-4 pb-8">
        <div className="p-6 rounded-2xl bg-gradient-to-r from-violet-600/10 to-indigo-600/10 border border-violet-500/15">
          <p className="text-gray-300 text-sm leading-relaxed">
            This Privacy Policy explains how <span className="text-white font-semibold">TruLearnix Digital Skills LLP</span> ("TruLearnix", "we", "our", or "us")
            collects, uses, stores, and protects your personal information when you use our platform at{' '}
            <span className="text-violet-300">trulearnix.com</span>. By using our services, you agree to the terms of this policy.
          </p>
        </div>
      </section>

      {/* ── Sections ── */}
      <section className="max-w-4xl mx-auto px-4 pb-16 space-y-8">
        {sections.map((section, i) => {
          const Icon = section.icon
          return (
            <div key={i} className="rounded-3xl bg-dark-800 border border-white/5 overflow-hidden">
              <div className={`flex items-center gap-3 px-6 py-5 border-b border-white/5`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${section.bg}`}>
                  <Icon className={`w-5 h-5 ${section.color}`} />
                </div>
                <h2 className="text-lg font-black text-white">{section.title}</h2>
              </div>
              <div className="p-6 grid sm:grid-cols-2 gap-4">
                {section.items.map((item, j) => (
                  <div key={j} className="p-4 rounded-2xl bg-white/3 border border-white/5">
                    <p className={`text-sm font-bold mb-1.5 ${section.color}`}>{item.title}</p>
                    <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {/* Data Retention */}
        <div className="rounded-3xl bg-dark-800 border border-white/5 p-6">
          <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
            <span className="text-orange-400">🗓️</span> Data Retention
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            We retain your personal data for as long as your account is active or as needed to provide services.
            If you delete your account, we will delete or anonymize your personal data within <span className="text-white">30 days</span>,
            except where required to retain it for legal, regulatory, or legitimate business purposes (such as transaction records).
          </p>
        </div>

        {/* Children's Privacy */}
        <div className="rounded-3xl bg-dark-800 border border-white/5 p-6">
          <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
            <span className="text-pink-400">👶</span> Children's Privacy
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Our platform is not directed to children under 13 years of age. We do not knowingly collect personal
            information from children under 13. If you believe a child has provided us with personal information,
            please contact us immediately and we will delete it.
          </p>
        </div>

        {/* Changes */}
        <div className="rounded-3xl bg-dark-800 border border-white/5 p-6">
          <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
            <span className="text-blue-400">📝</span> Changes to This Policy
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            We may update this Privacy Policy from time to time. We will notify you of significant changes by posting
            a notice on our platform or sending you an email. Continued use of our services after changes constitutes
            acceptance of the updated policy.
          </p>
        </div>

        {/* Contact */}
        <div className="rounded-3xl bg-gradient-to-br from-violet-600/15 to-indigo-600/10 border border-violet-500/20 p-8 text-center">
          <Mail className="w-10 h-10 text-violet-400 mx-auto mb-4" />
          <h2 className="text-xl font-black text-white mb-2">Privacy Concerns?</h2>
          <p className="text-gray-400 text-sm mb-5">
            For any privacy-related questions, data requests, or concerns, contact our team:
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="mailto:Official@trulearnix.com"
              className="px-6 py-3 rounded-xl bg-violet-500/15 text-violet-300 border border-violet-500/20 text-sm font-semibold hover:bg-violet-500/25 transition-colors">
              Official@trulearnix.com
            </a>
            <span className="text-gray-600 hidden sm:block">or</span>
            <a href="https://wa.me/918979616798"
              className="px-6 py-3 rounded-xl bg-green-500/15 text-green-300 border border-green-500/20 text-sm font-semibold hover:bg-green-500/25 transition-colors">
              WhatsApp: +91 8979616798
            </a>
          </div>
          <p className="text-gray-600 text-xs mt-4">
            TRULEARNIX DIGITAL SKILLS LLP · LLP No. ACR-4252 · 891/E 22, Zakir Nagar, New Delhi – 110025
          </p>
        </div>
      </section>

      <Footer />
    </main>
  )
}
