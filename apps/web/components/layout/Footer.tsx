'use client'
import Link from 'next/link'
import { BookOpen, Mail, Phone, MapPin, Youtube, Instagram, Twitter, Linkedin } from 'lucide-react'
import Logo from '@/components/ui/Logo'

const platformLinks = ['Courses', 'Live Classes', 'Certifications', 'Earn Program', 'Become Mentor', 'Pricing']
const companyLinks  = ['About Us', 'Careers', 'Blog', 'Press Kit', 'Privacy Policy', 'Terms of Service']

export default function Footer() {
  return (
    <footer style={{ background: 'rgba(8,11,20,0.9)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>

      {/* Newsletter strip */}
      <div className="py-8 md:py-10 px-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-white font-black text-xl mb-1">Free learning resources weekly</h3>
            <p className="text-gray-500 text-sm">Courses, tips & skill-building resources delivered to your inbox</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <input type="email" placeholder="Enter your email" className="input flex-1 md:max-w-xs" />
            <button className="btn-primary px-4 sm:px-6 whitespace-nowrap text-sm flex-shrink-0">Subscribe</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10 md:py-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-8 md:gap-10 mb-12">

          {/* Brand */}
          <div className="col-span-2 sm:col-span-4 md:col-span-2">
            <div className="mb-5">
              <Logo size="lg" href="/" />
            </div>
            <p className="text-gray-500 text-sm leading-relaxed mb-6 max-w-xs">
              India's premium EdTech platform for live learning, career growth, and income generation through our Earn Program.
            </p>
            <div className="flex gap-2.5">
              {[
                { Icon: Youtube,   href: '#' },
                { Icon: Instagram, href: '#' },
                { Icon: Twitter,   href: '#' },
                { Icon: Linkedin,  href: '#' },
              ].map(({ Icon, href }, i) => (
                <a key={i} href={href}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:text-violet-400 hover:bg-violet-500/15 hover:border-violet-500/30 transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div className="col-span-1">
            <h4 className="font-black text-white mb-4 text-sm uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2.5">
              {platformLinks.map(l => (
                <li key={l}>
                  <Link href="#" className="text-sm text-gray-500 hover:text-white transition-colors">{l}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="col-span-1">
            <h4 className="font-black text-white mb-4 text-sm uppercase tracking-wider">Company</h4>
            <ul className="space-y-2.5">
              {companyLinks.map(l => (
                <li key={l}>
                  <Link href="#" className="text-sm text-gray-500 hover:text-white transition-colors">{l}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-2 sm:col-span-4 md:col-span-1">
            <h4 className="font-black text-white mb-4 text-sm uppercase tracking-wider">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2.5 text-sm text-gray-500">
                <Mail className="w-4 h-4 text-violet-400 flex-shrink-0" />hello@trulearnix.com
              </li>
              <li className="flex items-center gap-2.5 text-sm text-gray-500">
                <Phone className="w-4 h-4 text-violet-400 flex-shrink-0" />+91 98765 43210
              </li>
              <li className="flex items-center gap-2.5 text-sm text-gray-500">
                <MapPin className="w-4 h-4 text-violet-400 flex-shrink-0" />Bengaluru, India
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-600"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p>© {new Date().getFullYear()} TruLearnix. All rights reserved. Made with ❤️ in India</p>
          <div className="flex gap-5">
            <Link href="#" className="hover:text-gray-400 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-gray-400 transition-colors">Terms</Link>
            <Link href="#" className="hover:text-gray-400 transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
