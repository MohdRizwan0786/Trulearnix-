import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Metadata } from 'next'
import { FileText, Users, CreditCard, BookOpen, AlertTriangle, Scale, RefreshCw, Mail } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terms of Service | TruLearnix',
  description: 'Read TruLearnix\'s Terms of Service — your rights, responsibilities, and our commitments.',
}

const termsSections = [
  {
    icon: Users,
    number: '01',
    title: 'Eligibility & Account',
    color: 'text-violet-400',
    accent: 'border-l-violet-500',
    points: [
      'You must be at least 13 years of age to use TruLearnix.',
      'You are responsible for maintaining the confidentiality of your account credentials.',
      'You agree to provide accurate, current, and complete information during registration.',
      'One account per individual. Sharing account credentials is strictly prohibited.',
      'TruLearnix reserves the right to suspend or terminate accounts that violate these terms.',
    ]
  },
  {
    icon: BookOpen,
    number: '02',
    title: 'Course Access & Content',
    color: 'text-indigo-400',
    accent: 'border-l-indigo-500',
    points: [
      'Upon enrollment, you receive a non-transferable, non-exclusive license to access course content.',
      'Course access is granted for the duration specified at the time of purchase.',
      'You may not share, resell, or redistribute course content in any form.',
      'Live class recordings are provided for personal review only and may not be recorded or shared.',
      'Course content may be updated or improved without prior notice.',
    ]
  },
  {
    icon: CreditCard,
    number: '03',
    title: 'Payments & Refunds',
    color: 'text-green-400',
    accent: 'border-l-green-500',
    points: [
      'All prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes.',
      'Payments are processed securely via Razorpay. TruLearnix does not store payment card details.',
      'Refund requests must be submitted within 7 days of purchase.',
      'Refunds are eligible if fewer than 2 live classes have been attended.',
      'Approved refunds are processed within 5–10 business days to the original payment method.',
      'EMI plans are subject to the terms of the respective financial institution.',
    ]
  },
  {
    icon: AlertTriangle,
    number: '04',
    title: 'Prohibited Conduct',
    color: 'text-red-400',
    accent: 'border-l-red-500',
    points: [
      'You may not use the platform for any unlawful or unauthorized purpose.',
      'Harassment, bullying, or abusive behavior toward other learners or mentors is strictly prohibited.',
      'Attempting to hack, reverse engineer, or disrupt platform services is forbidden.',
      'Posting or sharing spam, malware, or any harmful content is not allowed.',
      'Academic dishonesty including plagiarism in assignments is grounds for account suspension.',
      'Creating fake reviews or misrepresenting TruLearnix is strictly prohibited.',
    ]
  },
  {
    icon: FileText,
    number: '05',
    title: 'Intellectual Property',
    color: 'text-amber-400',
    accent: 'border-l-amber-500',
    points: [
      'All content on TruLearnix — videos, slides, materials, and code — is our intellectual property.',
      'You retain ownership of any original content you submit (assignments, projects).',
      'By submitting content, you grant TruLearnix a license to use it for educational purposes.',
      'TruLearnix trademarks, logos, and brand elements may not be used without written permission.',
      'Downloading or screen-recording premium course content is strictly prohibited.',
    ]
  },
  {
    icon: Scale,
    number: '06',
    title: 'Limitation of Liability',
    color: 'text-cyan-400',
    accent: 'border-l-cyan-500',
    points: [
      'TruLearnix is not liable for indirect, incidental, or consequential damages of any kind.',
      'We do not guarantee specific income, employment, or career outcomes from our courses.',
      'Platform availability is provided on an "as-is" basis without uptime guarantees.',
      'We are not responsible for third-party websites or services linked from our platform.',
      'Our total liability shall not exceed the amount paid for the specific service in dispute.',
    ]
  },
  {
    icon: RefreshCw,
    number: '07',
    title: 'Modifications & Termination',
    color: 'text-fuchsia-400',
    accent: 'border-l-fuchsia-500',
    points: [
      'TruLearnix reserves the right to modify these terms at any time with reasonable notice.',
      'Continued use after changes constitutes acceptance of the updated terms.',
      'We may suspend or terminate your account for violations without prior notice.',
      'Upon termination, your right to access paid content ceases immediately.',
      'Sections relating to IP, liability, and dispute resolution survive termination.',
    ]
  },
]

export default function TermsPage() {
  return (
    <main className="bg-[#04050a] min-h-screen">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative pt-28 pb-16 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-radial from-indigo-600/15 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-6">
            <FileText className="w-4 h-4" /> Legal Agreement
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Terms of{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Service</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-6">
            Please read these terms carefully before using TruLearnix. They govern your use of our platform and services.
          </p>
          <div className="inline-flex items-center gap-2 text-sm text-gray-500">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
            Last updated: April 14, 2026
            <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
            Effective: April 14, 2026
          </div>
        </div>
      </section>

      {/* ── Intro ── */}
      <section className="max-w-4xl mx-auto px-4 pb-8">
        <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-600/10 to-violet-600/10 border border-indigo-500/15">
          <p className="text-gray-300 text-sm leading-relaxed">
            These Terms of Service ("Terms") constitute a legally binding agreement between you ("User") and{' '}
            <span className="text-white font-semibold">TRULEARNIX DIGITAL SKILLS LLP</span> (LLP No. ACR-4252),
            registered at 891/E 22, Zakir Nagar, Jamia Nagar, New Delhi – 110025, India.
            By accessing or using our platform at <span className="text-indigo-300">peptly.in</span>, you agree to be
            bound by these Terms and our Privacy Policy.
          </p>
        </div>
      </section>

      {/* ── Quick Navigation ── */}
      <section className="max-w-4xl mx-auto px-4 pb-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {termsSections.slice(0, 4).map((s) => {
            const Icon = s.icon
            return (
              <a key={s.number} href={`#section-${s.number}`}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-dark-800 border border-white/5 hover:border-white/15 transition-colors group">
                <Icon className={`w-4 h-4 ${s.color} flex-shrink-0`} />
                <span className="text-gray-400 group-hover:text-white text-xs font-medium leading-tight transition-colors">{s.title}</span>
              </a>
            )
          })}
        </div>
      </section>

      {/* ── Sections ── */}
      <section className="max-w-4xl mx-auto px-4 pb-16 space-y-6">
        {termsSections.map((section) => {
          const Icon = section.icon
          return (
            <div id={`section-${section.number}`} key={section.number}
              className="rounded-3xl bg-dark-800 border border-white/5 overflow-hidden">
              <div className="flex items-center gap-4 px-6 py-5 border-b border-white/5">
                <span className={`text-4xl font-black ${section.color} opacity-20`}>{section.number}</span>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 border border-white/10`}>
                    <Icon className={`w-4 h-4 ${section.color}`} />
                  </div>
                  <h2 className="text-lg font-black text-white">{section.title}</h2>
                </div>
              </div>
              <ul className="p-6 space-y-3">
                {section.points.map((point, j) => (
                  <li key={j} className={`flex items-start gap-3 pl-4 border-l-2 ${section.accent}`}>
                    <p className="text-gray-400 text-sm leading-relaxed">{point}</p>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}

        {/* Governing Law */}
        <div className="rounded-3xl bg-dark-800 border border-white/5 p-6">
          <h2 className="text-lg font-black text-white mb-3 flex items-center gap-2">
            <span>⚖️</span> Governing Law & Jurisdiction
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            These Terms shall be governed by and construed in accordance with the laws of India.
            Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts
            in <span className="text-white">New Delhi, India</span>. TruLearnix is registered as a Limited Liability Partnership
            under the Limited Liability Partnership Act, 2008.
          </p>
        </div>

        {/* Contact */}
        <div className="rounded-3xl bg-gradient-to-br from-indigo-600/15 to-violet-600/10 border border-indigo-500/20 p-8 text-center">
          <Mail className="w-10 h-10 text-indigo-400 mx-auto mb-4" />
          <h2 className="text-xl font-black text-white mb-2">Questions About These Terms?</h2>
          <p className="text-gray-400 text-sm mb-5">
            If you have any questions or concerns about these Terms of Service, please reach out to us.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="mailto:Official@trulearnix.com"
              className="px-6 py-3 rounded-xl bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 text-sm font-semibold hover:bg-indigo-500/25 transition-colors">
              Official@trulearnix.com
            </a>
            <span className="text-gray-600 hidden sm:block">or</span>
            <a href="https://wa.me/918979616798"
              className="px-6 py-3 rounded-xl bg-green-500/15 text-green-300 border border-green-500/20 text-sm font-semibold hover:bg-green-500/25 transition-colors">
              WhatsApp: +91 8979616798
            </a>
          </div>
          <p className="text-gray-600 text-xs mt-4">
            TRULEARNIX DIGITAL SKILLS LLP · LLP No. ACR-4252 · PAN: AAYFT7302G · New Delhi – 110025
          </p>
        </div>
      </section>

      <Footer />
    </main>
  )
}
