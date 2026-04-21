'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Mail, Phone, MapPin, Youtube, Instagram, Twitter, Linkedin } from 'lucide-react'
import Logo from '@/components/ui/Logo'

const DEFAULT_PLATFORM_LINKS = [
  { label: 'Courses', href: '/courses' },
  { label: 'Live Classes', href: '/live-classes' },
  { label: 'Certifications', href: '/courses' },
  { label: 'Earn Program', href: '/packages' },
  { label: 'Become Mentor', href: '/become-mentor' },
  { label: 'Pricing', href: '/packages' },
]
const DEFAULT_COMPANY_LINKS = [
  { label: 'About Us', href: '/about' },
  { label: 'Careers', href: '/contact' },
  { label: 'Blog', href: '/about' },
  { label: 'Press Kit', href: '/contact' },
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Terms of Service', href: '/terms' },
]

export default function Footer() {
  const [brandTagline, setBrandTagline]           = useState("India's premium EdTech platform for live learning, career growth, and income generation through our Earn Program.")
  const [newsletterHeading, setNewsletterHeading] = useState('Free learning resources weekly')
  const [newsletterSubtext, setNewsletterSubtext] = useState('Courses, tips & skill-building resources delivered to your inbox')
  const [platformLinks, setPlatformLinks]         = useState(DEFAULT_PLATFORM_LINKS)
  const [companyLinks, setCompanyLinks]           = useState(DEFAULT_COMPANY_LINKS)
  const [social, setSocial]                       = useState({ youtube: '#', instagram: '#', twitter: '#', linkedin: '#' })
  const [contact, setContact]                     = useState({
    email: 'Official@trulearnix.com',
    phone: '+91 8979616798',
    address: 'Zakir Nagar, Jamia Nagar,\nNew Delhi – 110025',
  })
  const [copyright, setCopyright]                 = useState(`© ${new Date().getFullYear()} TruLearnix. All rights reserved. Made with ❤️ in India`)

  useEffect(() => {
    fetch(process.env.NEXT_PUBLIC_API_URL + '/site-content/footer')
      .then(r => r.json())
      .then(res => {
        const d = res.data
        if (!d) return
        if (d.brandTagline)       setBrandTagline(d.brandTagline)
        if (d.newsletterHeading)  setNewsletterHeading(d.newsletterHeading)
        if (d.newsletterSubtext)  setNewsletterSubtext(d.newsletterSubtext)
        if (d.platformLinks?.length) setPlatformLinks(d.platformLinks)
        if (d.companyLinks?.length)  setCompanyLinks(d.companyLinks)
        if (d.social)             setSocial(s => ({ ...s, ...d.social }))
        if (d.contact)            setContact(c => ({ ...c, ...d.contact }))
        if (d.copyright)          setCopyright(d.copyright)
      })
      .catch(() => {})
  }, [])

  const socialLinks = [
    { Icon: Youtube,   href: social.youtube  },
    { Icon: Instagram, href: social.instagram },
    { Icon: Twitter,   href: social.twitter  },
    { Icon: Linkedin,  href: social.linkedin  },
  ]

  return (
    <footer style={{ background: 'rgba(8,11,20,0.9)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>

      {/* Newsletter strip */}
      <div className="py-8 md:py-10 px-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-white font-black text-xl mb-1">{newsletterHeading}</h3>
            <p className="text-gray-500 text-sm">{newsletterSubtext}</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <input type="email" placeholder="Enter your email" className="input flex-1 md:max-w-xs" />
            <button className="btn-primary px-4 sm:px-6 whitespace-nowrap text-sm flex-shrink-0">Subscribe</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-6 md:gap-10 mb-8">

          {/* Brand */}
          <div className="col-span-2 sm:col-span-4 md:col-span-2">
            <div className="mb-5">
              <Logo size="lg" href="/" />
            </div>
            <p className="text-gray-500 text-sm leading-relaxed mb-6 max-w-xs">
              {brandTagline}
            </p>
            <div className="flex gap-2.5">
              {socialLinks.map(({ Icon, href }, i) => (
                <a key={i} href={href} target="_blank" rel="noreferrer"
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
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-gray-500 hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="col-span-1">
            <h4 className="font-black text-white mb-4 text-sm uppercase tracking-wider">Company</h4>
            <ul className="space-y-2.5">
              {companyLinks.map(l => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-gray-500 hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-2 sm:col-span-4 md:col-span-1">
            <h4 className="font-black text-white mb-4 text-sm uppercase tracking-wider">Contact</h4>
            <ul className="space-y-3">
              <li>
                <a href={`mailto:${contact.email}`} className="flex items-center gap-2.5 text-sm text-gray-500 hover:text-white transition-colors">
                  <Mail className="w-4 h-4 text-violet-400 flex-shrink-0" />{contact.email}
                </a>
              </li>
              <li>
                <a href={`https://wa.me/${contact.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 text-sm text-gray-500 hover:text-white transition-colors">
                  <Phone className="w-4 h-4 text-violet-400 flex-shrink-0" />{contact.phone}
                </a>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-gray-500">
                <MapPin className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                <span style={{ whiteSpace: 'pre-line' }}>{contact.address}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-600"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p>{copyright}</p>
          <div className="flex gap-5">
            <Link href="/legal" className="hover:text-gray-400 transition-colors">Legal Docs</Link>
            <Link href="/privacy-policy" className="hover:text-gray-400 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-400 transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-gray-400 transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
