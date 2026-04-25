'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { adminAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import {
  Layout, BarChart2, MessageSquare, Footprints, Image as ImageIcon,
  Settings, Plus, Trash2, Save, Upload, Copy, Check, Video,
  Edit3, X, ChevronUp, ChevronDown, Loader2, Link2, FileVideo,
  PlayCircle, Globe, PanelTop, Navigation, FootprintsIcon, Info,
  MousePointer, Phone, Users, Star, Megaphone, Trophy, FileText, Eye, EyeOff
} from 'lucide-react'

const TABS = [
  { id: 'navbar',       label: 'Navbar',        icon: Navigation    },
  { id: 'footer',       label: 'Footer',        icon: FootprintsIcon },
  { id: 'hero',         label: 'Hero Section',  icon: Layout        },
  { id: 'stats',        label: 'Stats',         icon: BarChart2     },
  { id: 'testimonials', label: 'Testimonials',  icon: MessageSquare },
  { id: 'steps',        label: 'How It Works',  icon: Footprints    },
  { id: 'about',        label: 'About',         icon: Info          },
  { id: 'cta',          label: 'CTA Section',   icon: MousePointer  },
  { id: 'contact',      label: 'Contact',       icon: Phone         },
  { id: 'mentor',       label: 'Become Mentor', icon: Users         },
  { id: 'wall',         label: 'Wall of Love',  icon: Star          },
  { id: 'achievements', label: 'Achievements',  icon: Trophy        },
  { id: 'movement',     label: 'Our Movement',  icon: Megaphone     },
  { id: 'legal',        label: 'Legal Docs',    icon: FileText      },
  { id: 'media',        label: 'Media Library', icon: ImageIcon     },
  { id: 'settings',     label: 'Site Settings', icon: Settings      },
]

// ── Defaults ──────────────────────────────────────────────────────────────────
const DEFAULT_NAVBAR = {
  logoUrl: '',
  navLinks: [
    { label: 'Home', href: '/' },
    { label: 'Courses', href: '/courses' },
    { label: 'Live Classes', href: '/live-classes' },
    { label: 'Packages', href: '/packages' },
  ],
  ctaText: 'Start Free →',
  sidebarStats: [
    { val: '50K+', label: 'Students' },
    { val: '4.9★', label: 'Rating' },
    { val: '₹2Cr+', label: 'Paid Out' },
  ],
  sidebarExtras: [
    { label: 'About Us', href: '/about', desc: 'Our story & mission' },
    { label: 'Certifications', href: '/certifications', desc: 'AI-powered certificates' },
    { label: 'Earn Money', href: '/affiliate', desc: 'Partner Program' },
    { label: 'Become Mentor', href: '/mentor', desc: 'Teach & earn 70% revenue' },
  ],
}

const DEFAULT_FOOTER = {
  brandTagline: "India's premium EdTech platform for live learning, career growth, and income generation through our Earn Program.",
  newsletterHeading: 'Free learning resources weekly',
  newsletterSubtext: 'Courses, tips & skill-building resources delivered to your inbox',
  platformLinks: [
    { label: 'Courses', href: '/courses' },
    { label: 'Live Classes', href: '/live-classes' },
    { label: 'Certifications', href: '/courses' },
    { label: 'Earn Program', href: '/packages' },
    { label: 'Become Mentor', href: '/become-mentor' },
    { label: 'Pricing', href: '/packages' },
  ],
  companyLinks: [
    { label: 'About Us', href: '/about' },
    { label: 'Careers', href: '/contact' },
    { label: 'Blog', href: '/about' },
    { label: 'Press Kit', href: '/contact' },
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
  social: { youtube: '#', instagram: '#', twitter: '#', linkedin: '#' },
  contact: {
    email: 'Official@trulearnix.com',
    phone: '+91 8979616798',
    address: 'Zakir Nagar, Jamia Nagar, New Delhi – 110025',
  },
  copyright: '© 2025 TruLearnix. All rights reserved. Made with ❤️ in India',
}

const DEFAULT_HERO = {
  badgeText: 'LIVE LEARNING PLATFORM',
  headline: "India's #1 Live Learning + Earning Platform",
  subheadline: 'Live classes, AI certificates & a built-in earn program — all in one.',
  heroBannerImage: '',
  features: ['Live Interactive Classes Daily', 'AI-Generated Certificates', 'Earn While You Learn & Grow', '500+ Expert-Led Courses'],
  ticker: ['🔥 New Batch Starting Monday', '⚡ 247 Students Joined Today', '🏆 50,000+ Learners Trust Us', '💰 ₹2Cr+ Income Paid to Students', '🎓 20,000+ Certificates Issued', '🌟 4.9/5 Platform Rating'],
  heroStats: [
    { value: '50K+', label: 'Active Learners' },
    { value: '500+', label: 'Expert Courses' },
    { value: '20K+', label: 'Certificates Issued' },
    { value: '₹2Cr+', label: 'Partner Earnings' },
  ],
  heroVideoUrl: '',
  liveClassTitle: 'Full Stack Dev — Batch 12',
  liveClassMentor: 'Mentor Aryan Kapoor',
  liveClassSession: 'React Hooks Deep Dive - Session 8 / 24',
  liveClassViewers: '247 watching',
  chatMessages: [
    { u: 'Rahul', m: 'Finally understood useEffect! 🔥' },
    { u: 'Priya', m: 'Can you explain useCallback too?' },
    { u: 'Amit', m: 'Getting certificate after this?' },
  ],
}

const DEFAULT_STATS = [
  { value: '50,000+', label: 'Active Students' },
  { value: '1,200+', label: 'Live Sessions Done' },
  { value: '500+', label: 'Expert Courses' },
  { value: '20,000+', label: 'Certificates Issued' },
  { value: '₹2Cr+', label: 'Partner Earnings' },
  { value: '4.9/5', label: 'Platform Rating' },
  { value: '50+', label: 'Cities Covered' },
  { value: '98%', label: 'Completion Rate' },
]

const DEFAULT_TESTIMONIALS = [
  { name: 'Priya Mehta', role: 'Full Stack Dev @ Infosys', result: 'Got placed in 6 weeks', quote: 'I went from zero to getting a job at Infosys in just 6 weeks. The live classes felt like real college!', avatarUrl: '', videoUrl: '' },
  { name: 'Rahul Singh', role: 'Skill Partner, Self-Employed', result: '₹1.2L last month', quote: 'I earn more through skill partnerships than my old 9-to-5 job. This platform is absolutely insane!', avatarUrl: '', videoUrl: '' },
  { name: 'Ananya Verma', role: 'Data Scientist @ Amazon', result: '40% salary hike', quote: 'The AI certificate is legit — Amazon HR specifically asked about TruLearnix. That was my moment!', avatarUrl: '', videoUrl: '' },
]

const DEFAULT_STEPS = [
  { title: 'Create Account', desc: 'Sign up free in 30 seconds. No credit card needed.' },
  { title: 'Choose Course', desc: 'Browse 500+ expert-curated courses across tech, design & business.' },
  { title: 'Join Live Class', desc: 'Attend live interactive sessions with real mentors. Ask questions, get instant answers.' },
  { title: 'Get Certified', desc: 'Complete quizzes & assignments. Download your AI-generated certificate instantly.' },
  { title: 'Earn Money', desc: 'Help others learn skills — earn income on every successful enrollment.' },
]

const DEFAULT_ABOUT = {
  // Hero
  heroBadge: 'Est. September 2025 · New Delhi, India',
  headingLine1: 'Turning Vision',
  headingLine2: 'into Excellence.',
  heroDesc: "India's most practical digital skills platform. We don't just teach — we transform learners into earners.",
  heroStats: [
    { n: '10K+', l: 'Learners' },
    { n: '50+', l: 'Courses' },
    { n: '95%', l: 'Success Rate' },
    { n: '3', l: 'Earning Paths' },
  ],
  // Our Story
  storyBadge: 'Our Story',
  storyHeading: 'More than a platform —',
  storySubheading: 'a career ecosystem.',
  storyDesc: "TruLearnix was built with one belief: watching videos alone doesn't create careers. That's why every course is live, interactive, and mentor-guided — so you practice, build, and earn.",
  storyFeatures: [
    { icon: '🎯', title: 'Live Classes', desc: 'Real-time learning with expert mentors' },
    { icon: '💸', title: 'Earn Fast', desc: 'From beginner to earner in months' },
    { icon: '🌍', title: 'For Everyone', desc: 'Students, women, professionals' },
    { icon: '🤲', title: 'Halal Income', desc: 'Ethical earning, always' },
  ],
  // Mission & Vision
  missionHeading: 'Our Mission',
  missionText: 'To provide high-quality digital skills education to every learner — empowering them to start freelancing careers, secure digital jobs, or generate income through Partnership marketing, in a practical, efficient, and result-oriented way.',
  visionHeading: 'Our Vision',
  visionText: 'A global digital hub where millions become financially independent — regardless of background, gender, or education.',
  // Values
  values: [
    { icon: '⚡', title: 'Fast-Track Earning' },
    { icon: '👩', title: 'Women Empowerment' },
    { icon: '🏆', title: 'Community First' },
  ],
  // Founders
  foundersBadge: 'The Visionaries',
  foundersHeading: 'Meet the Founders',
  founders: [
    {
      name: 'Mohd Rizwan',
      role: 'Founder & CEO',
      subtitle: 'Founder · TruLearnix & RB Digi Solutions',
      quote: 'My goal is simple — take someone with zero knowledge and turn them into a confident digital earner. That\'s the TruLearnix promise.',
      bio: 'B.Tech (CS) from Jamia Millia Islamia & GGSIP University. 5+ years of corporate IT sales experience combined with deep expertise as a Meta Ads Specialist — helping businesses grow on Facebook & Instagram. Founded TruLearnix to democratize digital earning for all.',
      skills: ['Meta Ads Expert', 'IT Sales', 'B.Tech CSE', 'Digital Marketing', 'Entrepreneur'],
      expValue: '5+',
      expLabel: 'Years in IT',
      expertiseValue: 'Meta Ads',
      expertiseLabel: 'Expert',
      photoUrl: '/founder-rizwan.jpg',
    },
    {
      name: 'Ashfana Razaksab Kolhar',
      role: 'Co-Founder & Managing Director',
      subtitle: 'Educator · Mentor · Women Empowerment Advocate',
      quote: 'Every woman deserves the tools to build her own financial freedom. TruLearnix is that bridge.',
      bio: 'M.Sc. Physics from Karnataka University. 2-3 years mentoring learners across online platforms, with 4 years of high-performance sales experience alongside top entrepreneurs. Ashfana champions practical education and financial independence — especially for women.',
      skills: ['M.Sc. Physics', 'Online Mentor', 'Fashion Design', 'Sales Expert', "Women's Advocate"],
      expValue: '3+',
      expLabel: 'Yrs Mentoring',
      expertiseValue: 'M.Sc.',
      expertiseLabel: 'Physics',
      photoUrl: '/founder-ashfana.jpg',
    },
  ],
  // Earning Paths
  pathsBadge: 'What We Teach',
  pathsHeading: '3 Paths to Digital Income',
  paths: [
    { emoji: '💼', title: 'Freelancing', sub: 'Global client base', desc: 'Master Upwork, Fiverr & Freelancer. Build a profile that attracts clients worldwide and earns in dollars.' },
    { emoji: '📱', title: 'Digital Jobs', sub: 'Career placement', desc: 'Land roles in digital marketing, social media management, graphic design & more at top companies.' },
    { emoji: '💸', title: 'Partnership Marketing', sub: 'Passive income', desc: 'Amazon Associates, ClickBank & more. Build systems that earn while you sleep.' },
  ],
  // CTA
  ctaBadge: 'Start Today',
  ctaHeading: 'Your Digital Career\nStarts Here.',
  ctaDesc: 'Join 10,000+ learners already building their future with TruLearnix.',
  ctaBtn1Text: 'Explore Courses →',
  ctaBtn1Href: '/courses',
  ctaBtn2Text: 'Contact Us',
  ctaBtn2Href: '/contact',
}

const DEFAULT_CTA = {
  promoBannerText: '🎉 Limited Offer — First month FREE with code LEARN2024',
  promoCode: 'LEARN2024',
  headline: 'Ready to Transform Your Career?',
  subheadline: 'Join 50,000+ learners. Start with free courses, attend live classes, earn certificates, and grow your income — all in one platform.',
  featurePills: [{ label: 'Live Classes' }, { label: 'AI Certificate' }, { label: 'Earn & Grow' }],
  primaryCTAText: 'Start Learning Free',
  primaryCTAHref: '/register',
  secondaryCTAText: 'Browse Courses',
  secondaryCTAHref: '/courses',
}

const DEFAULT_CONTACT = {
  heading: 'Get in Touch',
  subheading: "Have questions? We'd love to hear from you. Send us a message and we'll respond within 24 hours.",
  address: 'Zakir Nagar, Jamia Nagar, New Delhi – 110025',
  email: 'Official@trulearnix.com',
  phone: '+91 8979616798',
  mapEmbedUrl: '',
  formHeading: 'Send us a Message',
}

const DEFAULT_LEGAL = {
  heading: 'Legal & Compliance',
  subheading: 'All our policies, terms, and legal documents — transparent and accessible.',
  docs: [
    { title: 'Privacy Policy',     category: 'Privacy Policy',     desc: 'How we collect, use, and protect your personal information.', fileUrl: '', visible: true },
    { title: 'Terms & Conditions', category: 'Terms & Conditions', desc: 'Rules and guidelines for using the TruLearnix platform.',      fileUrl: '', visible: true },
    { title: 'Refund Policy',      category: 'Refund Policy',      desc: 'Our refund and cancellation terms for all purchases.',          fileUrl: '', visible: true },
  ],
}

const LEGAL_CATEGORIES = ['Privacy Policy', 'Terms & Conditions', 'Refund Policy', 'Cookie Policy', 'Disclaimer', 'User Agreement', 'Other']

const DEFAULT_MENTOR = {
  heroBadge: 'Join Our Expert Network',
  heading: 'Become a Mentor & Earn 70% Revenue',
  subheading: 'Share your expertise, build your personal brand, and earn industry-leading revenue sharing on every student you teach.',
  heroImage: '',
  revenueShare: '70',
  benefits: [
    { title: 'Industry-Leading Revenue Share', desc: 'Earn 70% on every course enrollment — the highest in the industry.' },
    { title: 'Your Own Branded Profile', desc: 'Get a dedicated mentor page with your bio, courses, and student reviews.' },
    { title: 'Live Class Infrastructure', desc: 'Full HD streaming, interactive tools, attendance tracking — all handled by us.' },
  ],
  requirements: ['5+ years of industry experience', 'Passion for teaching and mentoring', 'Ability to conduct 2+ live classes per week', 'Strong communication skills'],
  ctaText: 'Apply to Become a Mentor',
}

const DEFAULT_SETTINGS = {
  platformName: 'TruLearnix',
  tagline: "India's #1 Live Learning + Earning Platform",
  logoUrl: '',
  faviconUrl: '',
  contactEmail: 'support@trulearnix.com',
  whatsapp: '',
  instagram: '',
  youtube: '',
  twitter: '',
  linkedin: '',
  footerCopyright: '© 2025 TruLearnix. All rights reserved.',
}

// ── Helper Components ─────────────────────────────────────────────────────────

function UploadBtn({ accept, label, onUploaded, currentUrl, type = 'image' }: {
  accept: string
  label: string
  onUploaded: (url: string) => void
  currentUrl?: string
  type?: 'image' | 'video' | 'document'
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await adminAPI.uploadFile(fd)
      onUploaded(res.data.url)
      toast.success('Uploaded!')
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
      >
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        {uploading ? 'Uploading...' : label}
      </button>
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={accept}
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      {currentUrl && type === 'image' && (
        <div className="relative w-full max-w-xs h-32 rounded-xl overflow-hidden border border-white/10">
          <img src={currentUrl} alt="preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onUploaded('')}
            className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-red-500/80"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      {currentUrl && type === 'video' && (
        <div className="relative w-full max-w-xs rounded-xl overflow-hidden border border-white/10">
          <video src={currentUrl} controls className="w-full rounded-xl" />
          <button
            type="button"
            onClick={() => onUploaded('')}
            className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-red-500/80"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      {currentUrl && type === 'document' && (
        <a href={currentUrl} target="_blank" rel="noreferrer" className="text-xs text-violet-400 hover:underline">
          View uploaded file
        </a>
      )}
    </div>
  )
}

function ListEditor({ items, onChange, placeholder = 'Enter item...' }: {
  items: string[]
  onChange: (v: string[]) => void
  placeholder?: string
}) {
  const add = () => onChange([...items, ''])
  const update = (i: number, v: string) => { const a = [...items]; a[i] = v; onChange(a) }
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i))
  const move = (i: number, dir: -1 | 1) => {
    const a = [...items]; const j = i + dir
    if (j < 0 || j >= a.length) return
    ;[a[i], a[j]] = [a[j], a[i]]; onChange(a)
  }
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex flex-col gap-0.5">
            <button type="button" onClick={() => move(i, -1)} className="p-0.5 text-gray-600 hover:text-white"><ChevronUp className="w-3 h-3" /></button>
            <button type="button" onClick={() => move(i, 1)} className="p-0.5 text-gray-600 hover:text-white"><ChevronDown className="w-3 h-3" /></button>
          </div>
          <input value={it} onChange={e => update(i, e.target.value)} placeholder={placeholder}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500/50 flex-1" />
          <button type="button" onClick={() => remove(i)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      ))}
      <button type="button" onClick={add}
        className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 py-1.5 px-3 border border-dashed border-violet-500/40 rounded-xl w-full justify-center hover:border-violet-400 transition-colors">
        <Plus className="w-3.5 h-3.5" /> Add Item
      </button>
    </div>
  )
}

function ObjectListEditor({ items, fields, onChange }: {
  items: Record<string, string>[]
  fields: { key: string; label: string; placeholder?: string }[]
  onChange: (v: Record<string, string>[]) => void
}) {
  const add = () => {
    const empty: Record<string, string> = {}
    fields.forEach(f => { empty[f.key] = '' })
    onChange([...items, empty])
  }
  const update = (i: number, k: string, v: string) => {
    const a = [...items]; a[i] = { ...a[i], [k]: v }; onChange(a)
  }
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i))
  const move = (i: number, dir: -1 | 1) => {
    const a = [...items]; const j = i + dir
    if (j < 0 || j >= a.length) return
    ;[a[i], a[j]] = [a[j], a[i]]; onChange(a)
  }
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex gap-1">
              <button type="button" onClick={() => move(i, -1)} className="p-0.5 text-gray-600 hover:text-white"><ChevronUp className="w-3 h-3" /></button>
              <button type="button" onClick={() => move(i, 1)} className="p-0.5 text-gray-600 hover:text-white"><ChevronDown className="w-3 h-3" /></button>
            </div>
            <button type="button" onClick={() => remove(i)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {fields.map(f => (
              <div key={f.key}>
                <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
                <input
                  value={item[f.key] || ''}
                  onChange={e => update(i, f.key, e.target.value)}
                  placeholder={f.placeholder || f.label}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500/50"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
      <button type="button" onClick={add}
        className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 py-1.5 px-3 border border-dashed border-violet-500/40 rounded-xl w-full justify-center hover:border-violet-400 transition-colors">
        <Plus className="w-3.5 h-3.5" /> Add Item
      </button>
    </div>
  )
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button type="button" onClick={copy} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500/50"
const labelCls = "block text-sm font-semibold text-gray-300 mb-1.5"
const cardCls = "bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4"

function Spinner() {
  return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-violet-400" /></div>
}

function SaveBtn({ onClick, saving, label = 'Save' }: { onClick: () => void; saving: boolean; label?: string }) {
  return (
    <button onClick={onClick} disabled={saving}
      className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all w-full justify-center disabled:opacity-50">
      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
      {saving ? 'Saving...' : label}
    </button>
  )
}

// ── Tab: Navbar ────────────────────────────────────────────────────────────────
function NavbarTab() {
  const [data, setData] = useState(DEFAULT_NAVBAR)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.getSiteContent('navbar').then(r => {
      if (r.data.data) setData(d => ({ ...d, ...r.data.data }))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try { await adminAPI.saveSiteContent('navbar', data); toast.success('Navbar saved!') }
    catch { toast.error('Save failed') }
    finally { setSaving(false) }
  }

  const set = (key: string, val: any) => setData(d => ({ ...d, [key]: val }))

  if (loading) return <Spinner />

  return (
    <div className="space-y-6">
      <div className={cardCls}>
        <h3 className="font-bold text-white text-sm border-b border-white/10 pb-3">Logo</h3>
        <label className={labelCls}>Logo Image</label>
        <UploadBtn
          accept="image/*"
          label="Upload Logo"
          currentUrl={data.logoUrl}
          type="image"
          onUploaded={url => set('logoUrl', url)}
        />
      </div>

      <div className={cardCls}>
        <h3 className="font-bold text-white text-sm border-b border-white/10 pb-3">CTA Button</h3>
        <label className={labelCls}>CTA Button Text</label>
        <input value={data.ctaText} onChange={e => set('ctaText', e.target.value)} className={inputCls} placeholder="Start Free →" />
      </div>

      <div className={cardCls}>
        <h3 className="font-bold text-white text-sm border-b border-white/10 pb-3">Nav Links</h3>
        <ObjectListEditor
          items={data.navLinks as any}
          fields={[
            { key: 'label', label: 'Label', placeholder: 'Home' },
            { key: 'href', label: 'Link', placeholder: '/page' },
          ]}
          onChange={v => set('navLinks', v)}
        />
      </div>

      <div className={cardCls}>
        <h3 className="font-bold text-white text-sm border-b border-white/10 pb-3">Sidebar Stats</h3>
        <ObjectListEditor
          items={data.sidebarStats as any}
          fields={[
            { key: 'val', label: 'Value', placeholder: '50K+' },
            { key: 'label', label: 'Label', placeholder: 'Students' },
          ]}
          onChange={v => set('sidebarStats', v)}
        />
      </div>

      <div className={cardCls}>
        <h3 className="font-bold text-white text-sm border-b border-white/10 pb-3">Sidebar Extras</h3>
        <ObjectListEditor
          items={data.sidebarExtras as any}
          fields={[
            { key: 'label', label: 'Label', placeholder: 'About Us' },
            { key: 'href', label: 'Link', placeholder: '/about' },
            { key: 'desc', label: 'Description', placeholder: 'Our story & mission' },
          ]}
          onChange={v => set('sidebarExtras', v)}
        />
      </div>

      <SaveBtn onClick={save} saving={saving} label="Save Navbar" />
    </div>
  )
}

// ── Tab: Footer ────────────────────────────────────────────────────────────────
function FooterTab() {
  const [data, setData] = useState(DEFAULT_FOOTER)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.getSiteContent('footer').then(r => {
      if (r.data.data) setData(d => ({ ...d, ...r.data.data }))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try { await adminAPI.saveSiteContent('footer', data); toast.success('Footer saved!') }
    catch { toast.error('Save failed') }
    finally { setSaving(false) }
  }

  const set = (key: string, val: any) => setData(d => ({ ...d, [key]: val }))
  const setSocial = (k: string, v: string) => setData(d => ({ ...d, social: { ...d.social, [k]: v } }))
  const setContact = (k: string, v: string) => setData(d => ({ ...d, contact: { ...d.contact, [k]: v } }))

  if (loading) return <Spinner />

  return (
    <div className="space-y-6">
      <div className={cardCls}>
        <h3 className="font-bold text-white text-sm border-b border-white/10 pb-3">Brand</h3>
        <label className={labelCls}>Brand Tagline</label>
        <textarea value={data.brandTagline} onChange={e => set('brandTagline', e.target.value)} rows={3} className={`${inputCls} resize-none`} />
      </div>

      <div className={cardCls}>
        <h3 className="font-bold text-white text-sm border-b border-white/10 pb-3">Newsletter Strip</h3>
        <label className={labelCls}>Heading</label>
        <input value={data.newsletterHeading} onChange={e => set('newsletterHeading', e.target.value)} className={inputCls} />
        <label className={labelCls}>Subtext</label>
        <input value={data.newsletterSubtext} onChange={e => set('newsletterSubtext', e.target.value)} className={inputCls} />
      </div>

      <div className={cardCls}>
        <h3 className="font-bold text-white text-sm border-b border-white/10 pb-3">Platform Links</h3>
        <ObjectListEditor
          items={data.platformLinks as any}
          fields={[
            { key: 'label', label: 'Label', placeholder: 'Courses' },
            { key: 'href', label: 'Link', placeholder: '/courses' },
          ]}
          onChange={v => set('platformLinks', v)}
        />
      </div>

      <div className={cardCls}>
        <h3 className="font-bold text-white text-sm border-b border-white/10 pb-3">Company Links</h3>
        <ObjectListEditor
          items={data.companyLinks as any}
          fields={[
            { key: 'label', label: 'Label', placeholder: 'About Us' },
            { key: 'href', label: 'Link', placeholder: '/about' },
          ]}
          onChange={v => set('companyLinks', v)}
        />
      </div>

      <div className={cardCls}>
        <h3 className="font-bold text-white text-sm border-b border-white/10 pb-3">Social Links (external URLs)</h3>
        {(['youtube', 'instagram', 'twitter', 'linkedin'] as const).map(k => (
          <div key={k}>
            <label className={labelCls}>{k.charAt(0).toUpperCase() + k.slice(1)} URL</label>
            <input value={data.social[k]} onChange={e => setSocial(k, e.target.value)} className={inputCls} placeholder={`https://${k}.com/...`} />
          </div>
        ))}
      </div>

      <div className={cardCls}>
        <h3 className="font-bold text-white text-sm border-b border-white/10 pb-3">Contact Info</h3>
        <label className={labelCls}>Email</label>
        <input value={data.contact.email} onChange={e => setContact('email', e.target.value)} className={inputCls} />
        <label className={labelCls}>Phone</label>
        <input value={data.contact.phone} onChange={e => setContact('phone', e.target.value)} className={inputCls} />
        <label className={labelCls}>Address</label>
        <textarea value={data.contact.address} onChange={e => setContact('address', e.target.value)} rows={2} className={`${inputCls} resize-none`} />
      </div>

      <div className={cardCls}>
        <h3 className="font-bold text-white text-sm border-b border-white/10 pb-3">Copyright</h3>
        <label className={labelCls}>Copyright Text</label>
        <input value={data.copyright} onChange={e => set('copyright', e.target.value)} className={inputCls} />
      </div>

      <SaveBtn onClick={save} saving={saving} label="Save Footer" />
    </div>
  )
}

// ── Tab: Hero ─────────────────────────────────────────────────────────────────
function HeroTab() {
  const [data, setData] = useState(DEFAULT_HERO)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.getSiteContent('hero').then(r => {
      if (r.data.data) setData(d => ({ ...d, ...r.data.data }))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try { await adminAPI.saveSiteContent('hero', data); toast.success('Hero section saved!') }
    catch { toast.error('Save failed') }
    finally { setSaving(false) }
  }

  const set = (key: string, val: any) => setData(d => ({ ...d, [key]: val }))
  const setStat = (i: number, k: 'value' | 'label', v: string) => {
    const a = [...data.heroStats]; a[i] = { ...a[i], [k]: v }; setData(d => ({ ...d, heroStats: a }))
  }
  const setChat = (i: number, k: 'u' | 'm', v: string) => {
    const a = [...data.chatMessages]; a[i] = { ...a[i], [k]: v }; setData(d => ({ ...d, chatMessages: a }))
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-6">
      <div className={cardCls}>
        <h3 className="font-bold text-white text-sm border-b border-white/10 pb-3">Headlines & Badge</h3>
        <label className={labelCls}>Badge Text</label>
        <input value={data.badgeText} onChange={e => set('badgeText', e.target.value)} className={inputCls} />
        <label className={labelCls}>Main Headline</label>
        <input value={data.headline} onChange={e => set('headline', e.target.value)} className={inputCls} />
        <label className={labelCls}>Subheadline</label>
        <textarea value={data.subheadline} onChange={e => set('subheadline', e.target.value)} rows={2} className={`${inputCls} resize-none`} />
        <label className={labelCls}>Hero Banner Image (optional)</label>
        <UploadBtn
          accept="image/*"
          label="Upload Banner Image"
          currentUrl={data.heroBannerImage}
          type="image"
          onUploaded={url => set('heroBannerImage', url)}
        />
        <label className={labelCls}>Hero Live Demo Video (shown in homepage card)</label>
        <UploadBtn
          accept="video/*"
          label="Upload Hero Video (.mp4)"
          currentUrl={(data as any).heroVideoUrl}
          type="video"
          onUploaded={url => set('heroVideoUrl', url)}
        />
      </div>

      <div className={cardCls}>
        <h3 className="font-bold text-white text-sm border-b border-white/10 pb-3">Feature Bullets</h3>
        <ListEditor items={data.features} onChange={v => set('features', v)} placeholder="Feature text..." />
      </div>

      <div className={cardCls}>
        <h3 className="font-bold text-white text-sm border-b border-white/10 pb-3">Ticker Strip Items</h3>
        <ListEditor items={data.ticker} onChange={v => set('ticker', v)} placeholder="🔥 Ticker message..." />
      </div>

      <div className={cardCls}>
        <h3 className="font-bold text-white text-sm border-b border-white/10 pb-3">Stats Grid (4 items)</h3>
        <div className="grid grid-cols-2 gap-3">
          {data.heroStats.map((s, i) => (
            <div key={i} className="p-3 bg-slate-700/40 rounded-xl space-y-2">
              <input value={s.value} onChange={e => setStat(i, 'value', e.target.value)} placeholder="50K+" className={inputCls} />
              <input value={s.label} onChange={e => setStat(i, 'label', e.target.value)} placeholder="Active Learners" className={inputCls} />
            </div>
          ))}
        </div>
      </div>

      <div className={cardCls}>
        <h3 className="font-bold text-white text-sm border-b border-white/10 pb-3">Live Class Card</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            ['liveClassTitle', 'Class Title'],
            ['liveClassMentor', 'Mentor Name'],
            ['liveClassSession', 'Session Info'],
            ['liveClassViewers', 'Viewers Text'],
          ].map(([k, l]) => (
            <div key={k}>
              <label className={labelCls}>{l}</label>
              <input value={(data as any)[k]} onChange={e => set(k, e.target.value)} className={inputCls} />
            </div>
          ))}
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-300 mb-3">Chat Messages (3)</h4>
          <div className="space-y-2">
            {data.chatMessages.map((c, i) => (
              <div key={i} className="flex gap-2">
                <input value={c.u} onChange={e => setChat(i, 'u', e.target.value)} placeholder="Name" className={`${inputCls} w-28`} />
                <input value={c.m} onChange={e => setChat(i, 'm', e.target.value)} placeholder="Message..." className={`${inputCls} flex-1`} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <SaveBtn onClick={save} saving={saving} label="Save Hero Section" />
    </div>
  )
}

// ── Tab: Stats ────────────────────────────────────────────────────────────────
function StatsTab() {
  const [stats, setStats] = useState(DEFAULT_STATS)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.getSiteContent('stats').then(r => {
      if (r.data.data?.stats) setStats(r.data.data.stats)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const update = (i: number, k: 'value' | 'label', v: string) => {
    const a = [...stats]; a[i] = { ...a[i], [k]: v }; setStats(a)
  }
  const add = () => setStats(s => [...s, { value: '', label: '' }])
  const remove = (i: number) => setStats(s => s.filter((_, idx) => idx !== i))

  const save = async () => {
    setSaving(true)
    try { await adminAPI.saveSiteContent('stats', { stats }); toast.success('Stats saved!') }
    catch { toast.error('Save failed') }
    finally { setSaving(false) }
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-6">
      <div className={cardCls}>
        <h3 className="font-bold text-white text-sm border-b border-white/10 pb-3">Platform Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((s, i) => (
            <div key={i} className="p-3 bg-slate-700/40 rounded-xl space-y-2">
              <input value={s.value} onChange={e => update(i, 'value', e.target.value)} placeholder="50,000+" className={inputCls} />
              <input value={s.label} onChange={e => update(i, 'label', e.target.value)} placeholder="Active Students" className={inputCls} />
              <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1">
                <Trash2 className="w-3 h-3" /> Remove
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={add}
          className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 py-1.5 px-3 border border-dashed border-violet-500/40 rounded-xl w-full justify-center hover:border-violet-400 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add Stat
        </button>
      </div>
      <SaveBtn onClick={save} saving={saving} label="Save Stats" />
    </div>
  )
}

// ── Tab: Testimonials ─────────────────────────────────────────────────────────
function TestimonialsTab() {
  const [items, setItems] = useState(DEFAULT_TESTIMONIALS)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<number | null>(null)
  const [editData, setEditData] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    adminAPI.getSiteContent('testimonials').then(r => {
      if (r.data.data?.items) setItems(r.data.data.items)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try { await adminAPI.saveSiteContent('testimonials', { items }); toast.success('Testimonials saved!') }
    catch { toast.error('Save failed') }
    finally { setSaving(false) }
  }

  const openEdit = (i: number) => {
    setEditing(i)
    setEditData(i === -1 ? { name: '', role: '', result: '', quote: '', avatarUrl: '', videoUrl: '' } : { ...items[i] })
  }
  const saveEdit = () => {
    if (editing === -1) setItems(a => [...a, editData])
    else { const a = [...items]; a[editing!] = editData; setItems(a) }
    setEditing(null); setEditData(null)
  }
  const del = (i: number) => { if (!confirm('Delete testimonial?')) return; setItems(a => a.filter((_, idx) => idx !== i)) }

  const uploadFile = async (file: File, field: 'avatarUrl' | 'videoUrl') => {
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const r = await adminAPI.uploadFile(fd)
      setEditData((d: any) => ({ ...d, [field]: r.data.url }))
      toast.success('Uploaded!')
    } catch { toast.error('Upload failed') }
    finally { setUploading(false) }
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-4">
      {editing !== null && editData && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white">{editing === -1 ? 'Add Testimonial' : 'Edit Testimonial'}</h3>
              <button type="button" onClick={() => { setEditing(null); setEditData(null) }} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Name *</label>
                <input value={editData.name} onChange={e => setEditData((d: any) => ({ ...d, name: e.target.value }))} className={inputCls} placeholder="Rahul Singh" />
              </div>
              <div>
                <label className={labelCls}>Result Badge</label>
                <input value={editData.result} onChange={e => setEditData((d: any) => ({ ...d, result: e.target.value }))} className={inputCls} placeholder="₹1.2L last month" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Role / Company</label>
              <input value={editData.role} onChange={e => setEditData((d: any) => ({ ...d, role: e.target.value }))} className={inputCls} placeholder="Full Stack Dev @ Infosys" />
            </div>
            <div>
              <label className={labelCls}>Quote *</label>
              <textarea value={editData.quote} onChange={e => setEditData((d: any) => ({ ...d, quote: e.target.value }))} rows={3} className={`${inputCls} resize-none`} />
            </div>

            <div>
              <label className={labelCls}>Avatar Photo</label>
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-50">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Upload Avatar
              </button>
              <input ref={fileRef} type="file" hidden accept="image/*" onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0], 'avatarUrl')} />
              {editData.avatarUrl && <img src={editData.avatarUrl} className="mt-2 w-14 h-14 rounded-full object-cover border border-white/20" />}
            </div>

            <div>
              <label className={labelCls}>Testimonial Video</label>
              <button type="button" onClick={() => videoRef.current?.click()} disabled={uploading}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-50">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileVideo className="w-4 h-4" />}
                Upload Video
              </button>
              <input ref={videoRef} type="file" hidden accept="video/*" onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0], 'videoUrl')} />
              {editData.videoUrl && (
                <video src={editData.videoUrl} controls className="mt-2 w-full rounded-xl max-h-32" />
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={saveEdit} disabled={!editData.name || !editData.quote}
                className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50">
                <Check className="w-4 h-4" /> {editing === -1 ? 'Add' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => { setEditing(null); setEditData(null) }}
                className="px-4 py-2.5 text-sm text-gray-400 bg-slate-700/50 rounded-xl hover:bg-slate-700">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-gray-400 text-sm">{items.length} testimonials</p>
        <button type="button" onClick={() => openEdit(-1)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl font-bold text-sm">
          <Plus className="w-4 h-4" /> Add Testimonial
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((t, i) => (
          <div key={i} className={cardCls}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {t.avatarUrl
                  ? <img src={t.avatarUrl} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  : <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-sm flex-shrink-0">{t.name[0]}</div>
                }
                <div>
                  <p className="text-white font-semibold text-sm">{t.name}</p>
                  <p className="text-gray-500 text-xs">{t.role}</p>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button type="button" onClick={() => openEdit(i)} className="p-1.5 text-gray-500 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg"><Edit3 className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={() => del(i)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            {t.result && <span className="text-xs px-2 py-0.5 bg-green-500/15 text-green-400 rounded-full border border-green-500/20">{t.result}</span>}
            <p className="text-gray-400 text-xs line-clamp-2">"{t.quote}"</p>
            {t.videoUrl && (
              <div className="flex items-center gap-1.5 text-xs text-blue-400">
                <PlayCircle className="w-3.5 h-3.5" /> Video uploaded
              </div>
            )}
          </div>
        ))}
      </div>

      <SaveBtn onClick={save} saving={saving} label="Save All Testimonials" />
    </div>
  )
}

// ── Tab: Steps ────────────────────────────────────────────────────────────────
function StepsTab() {
  const [steps, setSteps] = useState(DEFAULT_STEPS)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.getSiteContent('steps').then(r => {
      if (r.data.data?.steps) setSteps(r.data.data.steps)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const update = (i: number, k: 'title' | 'desc', v: string) => {
    const a = [...steps]; a[i] = { ...a[i], [k]: v }; setSteps(a)
  }
  const add = () => setSteps(s => [...s, { title: '', desc: '' }])
  const remove = (i: number) => setSteps(s => s.filter((_, idx) => idx !== i))
  const move = (i: number, dir: -1 | 1) => {
    const a = [...steps]; const j = i + dir
    if (j < 0 || j >= a.length) return
    ;[a[i], a[j]] = [a[j], a[i]]; setSteps(a)
  }

  const save = async () => {
    setSaving(true)
    try { await adminAPI.saveSiteContent('steps', { steps }); toast.success('Steps saved!') }
    catch { toast.error('Save failed') }
    finally { setSaving(false) }
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-4">
      <div className={cardCls}>
        <h3 className="font-bold text-white text-sm border-b border-white/10 pb-3">How It Works Steps</h3>
        <div className="space-y-4">
          {steps.map((s, i) => (
            <div key={i} className="p-4 bg-slate-700/40 rounded-xl space-y-3">
              <div className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-0.5">
                    <button type="button" onClick={() => move(i, -1)} className="p-0.5 text-gray-600 hover:text-white"><ChevronUp className="w-3 h-3" /></button>
                    <button type="button" onClick={() => move(i, 1)} className="p-0.5 text-gray-600 hover:text-white"><ChevronDown className="w-3 h-3" /></button>
                  </div>
                  <span className="w-7 h-7 bg-violet-500/20 text-violet-400 rounded-lg flex items-center justify-center text-xs font-black">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <button type="button" onClick={() => remove(i)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <input value={s.title} onChange={e => update(i, 'title', e.target.value)} placeholder="Step title" className={inputCls} />
              <textarea value={s.desc} onChange={e => update(i, 'desc', e.target.value)} rows={2} placeholder="Step description..." className={`${inputCls} resize-none`} />
            </div>
          ))}
        </div>
        <button type="button" onClick={add}
          className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 py-1.5 px-3 border border-dashed border-violet-500/40 rounded-xl w-full justify-center hover:border-violet-400 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add Step
        </button>
      </div>
      <SaveBtn onClick={save} saving={saving} label="Save Steps" />
    </div>
  )
}

// ── Team Member Card (sub-component so hooks work correctly) ──────────────────
function TeamMemberCard({ index, member, onUpdate, onRemove }: {
  index: number
  member: { name: string; role: string; bio: string; avatarUrl: string }
  onUpdate: (k: string, v: string) => void
  onRemove: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const r = await adminAPI.uploadFile(fd)
      onUpdate('avatarUrl', r.data.url)
      toast.success('Avatar uploaded!')
    } catch { toast.error('Upload failed') }
    finally { setUploading(false) }
  }

  return (
    <div className="p-4 bg-slate-700/40 rounded-xl space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-white text-sm font-semibold">Member {index + 1}</p>
        <button type="button" onClick={onRemove} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Name</label>
          <input value={member.name} onChange={e => onUpdate('name', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Role</label>
          <input value={member.role} onChange={e => onUpdate('role', e.target.value)} className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Bio</label>
        <textarea value={member.bio} onChange={e => onUpdate('bio', e.target.value)} rows={2} className={`${inputCls} resize-none`} />
      </div>
      <div>
        <label className={labelCls}>Avatar Photo</label>
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-50">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? 'Uploading...' : 'Upload Avatar'}
        </button>
        <input ref={fileRef} type="file" hidden accept="image/*" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])} />
        {member.avatarUrl && <img src={member.avatarUrl} className="mt-2 w-14 h-14 rounded-full object-cover border border-white/20" />}
      </div>
    </div>
  )
}

// ── Tab: About ────────────────────────────────────────────────────────────────
function AboutTab() {
  const [data, setData] = useState(DEFAULT_ABOUT)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.getSiteContent('about').then(r => {
      if (r.data.data) setData(d => ({ ...d, ...r.data.data }))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try { await adminAPI.saveSiteContent('about', data); toast.success('About page saved!') }
    catch { toast.error('Save failed') }
    finally { setSaving(false) }
  }

  const set = (key: string, val: any) => setData(d => ({ ...d, [key]: val }))

  const updateHeroStat = (i: number, k: 'n' | 'l', v: string) => {
    const a = [...data.heroStats]; a[i] = { ...a[i], [k]: v }; set('heroStats', a)
  }
  const addHeroStat = () => set('heroStats', [...data.heroStats, { n: '', l: '' }])
  const removeHeroStat = (i: number) => set('heroStats', data.heroStats.filter((_: any, idx: number) => idx !== i))

  const updateStoryFeature = (i: number, k: string, v: string) => {
    const a = [...data.storyFeatures]; a[i] = { ...a[i], [k]: v }; set('storyFeatures', a)
  }
  const addStoryFeature = () => set('storyFeatures', [...data.storyFeatures, { icon: '⭐', title: '', desc: '' }])
  const removeStoryFeature = (i: number) => set('storyFeatures', data.storyFeatures.filter((_: any, idx: number) => idx !== i))

  const updateValue = (i: number, k: string, v: string) => {
    const a = [...data.values]; a[i] = { ...a[i], [k]: v }; set('values', a)
  }
  const addValue = () => set('values', [...data.values, { icon: '⭐', title: '' }])
  const removeValue = (i: number) => set('values', data.values.filter((_: any, idx: number) => idx !== i))

  const updateFounder = (i: number, k: string, v: any) => {
    const a = [...data.founders]; a[i] = { ...a[i], [k]: v }; set('founders', a)
  }
  const updateFounderSkills = (i: number, raw: string) => {
    updateFounder(i, 'skills', raw.split(',').map((s: string) => s.trim()).filter(Boolean))
  }

  const updatePath = (i: number, k: string, v: string) => {
    const a = [...data.paths]; a[i] = { ...a[i], [k]: v }; set('paths', a)
  }
  const addPath = () => set('paths', [...data.paths, { emoji: '⭐', title: '', sub: '', desc: '' }])
  const removePath = (i: number) => set('paths', data.paths.filter((_: any, idx: number) => idx !== i))

  const uploadPhoto = async (i: number, file: File) => {
    try {
      const fd = new FormData(); fd.append('file', file)
      const r = await adminAPI.uploadFile(fd)
      updateFounder(i, 'photoUrl', r.data.url)
      toast.success('Photo uploaded!')
    } catch { toast.error('Upload failed') }
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-6">

      {/* ── Hero ── */}
      <div className={cardCls}>
        <h3 className="font-bold text-white text-sm border-b border-white/10 pb-3">Hero Section</h3>
        <label className={labelCls}>Badge Text</label>
        <input value={data.heroBadge} onChange={e => set('heroBadge', e.target.value)} className={inputCls} />
        <label className={labelCls}>Heading Line 1</label>
        <input value={data.headingLine1} onChange={e => set('headingLine1', e.target.value)} className={inputCls} />
        <label className={labelCls}>Heading Line 2 (gradient)</label>
        <input value={data.headingLine2} onChange={e => set('headingLine2', e.target.value)} className={inputCls} />
        <label className={labelCls}>Hero Description</label>
        <textarea value={data.heroDesc} onChange={e => set('heroDesc', e.target.value)} rows={3} className={`${inputCls} resize-none`} />
      </div>

      {/* ── Hero Stats ── */}
      <div className={cardCls}>
        <h3 className="font-bold text-white text-sm border-b border-white/10 pb-3">Hero Stats</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {data.heroStats.map((s: any, i: number) => (
            <div key={i} className="p-3 bg-slate-700/40 rounded-xl space-y-2 relative">
              <button type="button" onClick={() => removeHeroStat(i)} className="absolute top-2 right-2 p-1 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-3 h-3" /></button>
              <input value={s.n} onChange={e => updateHeroStat(i, 'n', e.target.value)} placeholder="10K+" className={inputCls} />
              <input value={s.l} onChange={e => updateHeroStat(i, 'l', e.target.value)} placeholder="Learners" className={inputCls} />
            </div>
          ))}
        </div>
        <button type="button" onClick={addHeroStat} className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 py-1.5 px-3 border border-dashed border-violet-500/40 rounded-xl w-full justify-center hover:border-violet-400 transition-colors mt-2">
          <Plus className="w-3.5 h-3.5" /> Add Stat
        </button>
      </div>

      {/* ── Our Story ── */}
      <div className={cardCls}>
        <h3 className="font-bold text-white text-sm border-b border-white/10 pb-3">Our Story Section</h3>
        <label className={labelCls}>Badge Text</label>
        <input value={data.storyBadge} onChange={e => set('storyBadge', e.target.value)} className={inputCls} />
        <label className={labelCls}>Heading Line 1</label>
        <input value={data.storyHeading} onChange={e => set('storyHeading', e.target.value)} className={inputCls} />
        <label className={labelCls}>Heading Line 2 (gradient)</label>
        <input value={data.storySubheading} onChange={e => set('storySubheading', e.target.value)} className={inputCls} />
        <label className={labelCls}>Description</label>
        <textarea value={data.storyDesc} onChange={e => set('storyDesc', e.target.value)} rows={3} className={`${inputCls} resize-none`} />
        <h4 className="font-semibold text-gray-300 text-xs pt-2">Feature Cards (2×2 Grid)</h4>
        <div className="grid grid-cols-2 gap-3">
          {data.storyFeatures.map((f: any, i: number) => (
            <div key={i} className="p-3 bg-slate-700/40 rounded-xl space-y-2 relative">
              <button type="button" onClick={() => removeStoryFeature(i)} className="absolute top-2 right-2 p-1 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-3 h-3" /></button>
              <input value={f.icon} onChange={e => updateStoryFeature(i, 'icon', e.target.value)} placeholder="🎯" className={inputCls} />
              <input value={f.title} onChange={e => updateStoryFeature(i, 'title', e.target.value)} placeholder="Title" className={inputCls} />
              <input value={f.desc} onChange={e => updateStoryFeature(i, 'desc', e.target.value)} placeholder="Description" className={inputCls} />
            </div>
          ))}
        </div>
        <button type="button" onClick={addStoryFeature} className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 py-1.5 px-3 border border-dashed border-violet-500/40 rounded-xl w-full justify-center hover:border-violet-400 transition-colors mt-2">
          <Plus className="w-3.5 h-3.5" /> Add Feature Card
        </button>
      </div>

      {/* ── Mission & Vision ── */}
      <div className={cardCls}>
        <h3 className="font-bold text-white text-sm border-b border-white/10 pb-3">Mission & Vision</h3>
        <label className={labelCls}>Mission Heading</label>
        <input value={data.missionHeading} onChange={e => set('missionHeading', e.target.value)} className={inputCls} />
        <label className={labelCls}>Mission Text</label>
        <textarea value={data.missionText} onChange={e => set('missionText', e.target.value)} rows={3} className={`${inputCls} resize-none`} />
        <label className={labelCls}>Vision Heading</label>
        <input value={data.visionHeading} onChange={e => set('visionHeading', e.target.value)} className={inputCls} />
        <label className={labelCls}>Vision Text</label>
        <textarea value={data.visionText} onChange={e => set('visionText', e.target.value)} rows={2} className={`${inputCls} resize-none`} />
      </div>

      {/* ── Values ── */}
      <div className={cardCls}>
        <h3 className="font-bold text-white text-sm border-b border-white/10 pb-3">Values Cards</h3>
        <div className="grid grid-cols-3 gap-3">
          {data.values.map((v: any, i: number) => (
            <div key={i} className="p-3 bg-slate-700/40 rounded-xl space-y-2 relative">
              <button type="button" onClick={() => removeValue(i)} className="absolute top-2 right-2 p-1 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-3 h-3" /></button>
              <input value={v.icon} onChange={e => updateValue(i, 'icon', e.target.value)} placeholder="⭐" className={inputCls} />
              <input value={v.title} onChange={e => updateValue(i, 'title', e.target.value)} placeholder="Title" className={inputCls} />
            </div>
          ))}
        </div>
        <button type="button" onClick={addValue} className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 py-1.5 px-3 border border-dashed border-violet-500/40 rounded-xl w-full justify-center hover:border-violet-400 transition-colors mt-2">
          <Plus className="w-3.5 h-3.5" /> Add Value
        </button>
      </div>

      {/* ── Founders ── */}
      <div className={cardCls}>
        <h3 className="font-bold text-white text-sm border-b border-white/10 pb-3">Founders Section</h3>
        <label className={labelCls}>Section Badge</label>
        <input value={data.foundersBadge} onChange={e => set('foundersBadge', e.target.value)} className={inputCls} />
        <label className={labelCls}>Section Heading</label>
        <input value={data.foundersHeading} onChange={e => set('foundersHeading', e.target.value)} className={inputCls} />
        <div className="space-y-6 mt-4">
          {data.founders.map((f: any, i: number) => (
            <div key={i} className="p-5 bg-slate-700/40 rounded-2xl space-y-3 border border-white/10">
              <p className="text-white font-bold text-sm">Founder {i + 1}</p>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Name</label><input value={f.name} onChange={e => updateFounder(i, 'name', e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>Role (pill)</label><input value={f.role} onChange={e => updateFounder(i, 'role', e.target.value)} className={inputCls} /></div>
              </div>
              <div><label className={labelCls}>Subtitle</label><input value={f.subtitle} onChange={e => updateFounder(i, 'subtitle', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Quote</label><textarea value={f.quote} onChange={e => updateFounder(i, 'quote', e.target.value)} rows={2} className={`${inputCls} resize-none`} /></div>
              <div><label className={labelCls}>Bio</label><textarea value={f.bio} onChange={e => updateFounder(i, 'bio', e.target.value)} rows={3} className={`${inputCls} resize-none`} /></div>
              <div><label className={labelCls}>Skills (comma separated)</label><input value={Array.isArray(f.skills) ? f.skills.join(', ') : f.skills} onChange={e => updateFounderSkills(i, e.target.value)} placeholder="Meta Ads, IT Sales, B.Tech CSE" className={inputCls} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Badge 1 Value</label><input value={f.expValue} onChange={e => updateFounder(i, 'expValue', e.target.value)} placeholder="5+" className={inputCls} /></div>
                <div><label className={labelCls}>Badge 1 Label</label><input value={f.expLabel} onChange={e => updateFounder(i, 'expLabel', e.target.value)} placeholder="Years in IT" className={inputCls} /></div>
                <div><label className={labelCls}>Badge 2 Value</label><input value={f.expertiseValue} onChange={e => updateFounder(i, 'expertiseValue', e.target.value)} placeholder="Meta Ads" className={inputCls} /></div>
                <div><label className={labelCls}>Badge 2 Label</label><input value={f.expertiseLabel} onChange={e => updateFounder(i, 'expertiseLabel', e.target.value)} placeholder="Expert" className={inputCls} /></div>
              </div>
              <div>
                <label className={labelCls}>Photo</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all">
                    <Upload className="w-4 h-4" /> Upload Photo
                    <input type="file" hidden accept="image/*" onChange={e => e.target.files?.[0] && uploadPhoto(i, e.target.files[0])} />
                  </label>
                  <input value={f.photoUrl} onChange={e => updateFounder(i, 'photoUrl', e.target.value)} placeholder="/founder-rizwan.jpg or URL" className={`${inputCls} flex-1`} />
                </div>
                {f.photoUrl && <img src={f.photoUrl} className="mt-2 w-20 h-20 rounded-xl object-cover border border-white/20" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Earning Paths ── */}
      <div className={cardCls}>
        <h3 className="font-bold text-white text-sm border-b border-white/10 pb-3">Earning Paths Section</h3>
        <label className={labelCls}>Badge Text</label>
        <input value={data.pathsBadge} onChange={e => set('pathsBadge', e.target.value)} className={inputCls} />
        <label className={labelCls}>Section Heading</label>
        <input value={data.pathsHeading} onChange={e => set('pathsHeading', e.target.value)} className={inputCls} />
        <div className="grid sm:grid-cols-3 gap-3 mt-2">
          {data.paths.map((p: any, i: number) => (
            <div key={i} className="p-3 bg-slate-700/40 rounded-xl space-y-2 relative">
              <button type="button" onClick={() => removePath(i)} className="absolute top-2 right-2 p-1 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-3 h-3" /></button>
              <input value={p.emoji} onChange={e => updatePath(i, 'emoji', e.target.value)} placeholder="💼" className={inputCls} />
              <input value={p.title} onChange={e => updatePath(i, 'title', e.target.value)} placeholder="Title" className={inputCls} />
              <input value={p.sub} onChange={e => updatePath(i, 'sub', e.target.value)} placeholder="Sub label" className={inputCls} />
              <textarea value={p.desc} onChange={e => updatePath(i, 'desc', e.target.value)} rows={2} placeholder="Description" className={`${inputCls} resize-none`} />
            </div>
          ))}
        </div>
        <button type="button" onClick={addPath} className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 py-1.5 px-3 border border-dashed border-violet-500/40 rounded-xl w-full justify-center hover:border-violet-400 transition-colors mt-2">
          <Plus className="w-3.5 h-3.5" /> Add Path
        </button>
      </div>

      {/* ── CTA ── */}
      <div className={cardCls}>
        <h3 className="font-bold text-white text-sm border-b border-white/10 pb-3">CTA Section</h3>
        <label className={labelCls}>Badge Text</label>
        <input value={data.ctaBadge} onChange={e => set('ctaBadge', e.target.value)} className={inputCls} />
        <label className={labelCls}>Heading</label>
        <textarea value={data.ctaHeading} onChange={e => set('ctaHeading', e.target.value)} rows={2} className={`${inputCls} resize-none`} />
        <label className={labelCls}>Description</label>
        <textarea value={data.ctaDesc} onChange={e => set('ctaDesc', e.target.value)} rows={2} className={`${inputCls} resize-none`} />
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>Button 1 Text</label><input value={data.ctaBtn1Text} onChange={e => set('ctaBtn1Text', e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Button 1 Link</label><input value={data.ctaBtn1Href} onChange={e => set('ctaBtn1Href', e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Button 2 Text</label><input value={data.ctaBtn2Text} onChange={e => set('ctaBtn2Text', e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Button 2 Link</label><input value={data.ctaBtn2Href} onChange={e => set('ctaBtn2Href', e.target.value)} className={inputCls} /></div>
        </div>
      </div>

      <SaveBtn onClick={save} saving={saving} label="Save About Page" />
    </div>
  )
}

// ── Tab: CTA ──────────────────────────────────────────────────────────────────
function CTATab() {
  const [data, setData] = useState(DEFAULT_CTA)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.getSiteContent('cta').then(r => {
      if (r.data.data) setData(d => ({ ...d, ...r.data.data }))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try { await adminAPI.saveSiteContent('cta', data); toast.success('CTA section saved!') }
    catch { toast.error('Save failed') }
    finally { setSaving(false) }
  }

  const set = (key: string, val: any) => setData(d => ({ ...d, [key]: val }))

  if (loading) return <Spinner />

  return (
    <div className="space-y-6">
      <div className={cardCls}>
        <h3 className="font-bold text-white text-sm border-b border-white/10 pb-3">Promo Banner</h3>
        <label className={labelCls}>Promo Banner Text</label>
        <input value={data.promoBannerText} onChange={e => set('promoBannerText', e.target.value)} className={inputCls} />
        <label className={labelCls}>Promo Code</label>
        <input value={data.promoCode} onChange={e => set('promoCode', e.target.value)} className={inputCls} />
      </div>

      <div className={cardCls}>
        <h3 className="font-bold text-white text-sm border-b border-white/10 pb-3">Headlines</h3>
        <label className={labelCls}>Main Headline</label>
        <input value={data.headline} onChange={e => set('headline', e.target.value)} className={inputCls} />
        <label className={labelCls}>Subheadline</label>
        <textarea value={data.subheadline} onChange={e => set('subheadline', e.target.value)} rows={3} className={`${inputCls} resize-none`} />
      </div>

      <div className={cardCls}>
        <h3 className="font-bold text-white text-sm border-b border-white/10 pb-3">Feature Pills</h3>
        <ListEditor
          items={data.featurePills.map(p => p.label)}
          onChange={v => set('featurePills', v.map(label => ({ label })))}
          placeholder="Feature label..."
        />
      </div>

      <div className={cardCls}>
        <h3 className="font-bold text-white text-sm border-b border-white/10 pb-3">CTA Buttons</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Primary Button Text</label>
            <input value={data.primaryCTAText} onChange={e => set('primaryCTAText', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Primary Button Link</label>
            <input value={data.primaryCTAHref} onChange={e => set('primaryCTAHref', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Secondary Button Text</label>
            <input value={data.secondaryCTAText} onChange={e => set('secondaryCTAText', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Secondary Button Link</label>
            <input value={data.secondaryCTAHref} onChange={e => set('secondaryCTAHref', e.target.value)} className={inputCls} />
          </div>
        </div>
      </div>

      <SaveBtn onClick={save} saving={saving} label="Save CTA Section" />
    </div>
  )
}

// ── Tab: Contact ──────────────────────────────────────────────────────────────
function ContactTab() {
  const [data, setData] = useState(DEFAULT_CONTACT)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.getSiteContent('contact').then(r => {
      if (r.data.data) setData(d => ({ ...d, ...r.data.data }))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try { await adminAPI.saveSiteContent('contact', data); toast.success('Contact page saved!') }
    catch { toast.error('Save failed') }
    finally { setSaving(false) }
  }

  const set = (key: string, val: string) => setData(d => ({ ...d, [key]: val }))

  if (loading) return <Spinner />

  return (
    <div className="space-y-6">
      <div className={cardCls}>
        <h3 className="font-bold text-white text-sm border-b border-white/10 pb-3">Page Header</h3>
        <label className={labelCls}>Page Heading</label>
        <input value={data.heading} onChange={e => set('heading', e.target.value)} className={inputCls} />
        <label className={labelCls}>Subheading</label>
        <textarea value={data.subheading} onChange={e => set('subheading', e.target.value)} rows={2} className={`${inputCls} resize-none`} />
        <label className={labelCls}>Form Heading</label>
        <input value={data.formHeading} onChange={e => set('formHeading', e.target.value)} className={inputCls} />
      </div>

      <div className={cardCls}>
        <h3 className="font-bold text-white text-sm border-b border-white/10 pb-3">Contact Details</h3>
        <label className={labelCls}>Office Address</label>
        <textarea value={data.address} onChange={e => set('address', e.target.value)} rows={2} className={`${inputCls} resize-none`} />
        <label className={labelCls}>Email</label>
        <input value={data.email} onChange={e => set('email', e.target.value)} className={inputCls} type="email" />
        <label className={labelCls}>Phone / WhatsApp</label>
        <input value={data.phone} onChange={e => set('phone', e.target.value)} className={inputCls} />
        <label className={labelCls}>Map Embed URL (Google Maps iframe src)</label>
        <input value={data.mapEmbedUrl} onChange={e => set('mapEmbedUrl', e.target.value)} className={inputCls} placeholder="https://www.google.com/maps/embed?pb=..." />
      </div>

      <SaveBtn onClick={save} saving={saving} label="Save Contact Page" />
    </div>
  )
}

// ── Tab: Mentor ───────────────────────────────────────────────────────────────
function MentorTab() {
  const [data, setData] = useState(DEFAULT_MENTOR)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.getSiteContent('mentor').then(r => {
      if (r.data.data) setData(d => ({ ...d, ...r.data.data }))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try { await adminAPI.saveSiteContent('mentor', data); toast.success('Mentor page saved!') }
    catch { toast.error('Save failed') }
    finally { setSaving(false) }
  }

  const set = (key: string, val: any) => setData(d => ({ ...d, [key]: val }))

  const updateBenefit = (i: number, k: 'title' | 'desc', v: string) => {
    const a = [...data.benefits]; a[i] = { ...a[i], [k]: v }; set('benefits', a)
  }
  const addBenefit = () => set('benefits', [...data.benefits, { title: '', desc: '' }])
  const removeBenefit = (i: number) => set('benefits', data.benefits.filter((_, idx) => idx !== i))

  if (loading) return <Spinner />

  return (
    <div className="space-y-6">
      <div className={cardCls}>
        <h3 className="font-bold text-white text-sm border-b border-white/10 pb-3">Hero</h3>
        <label className={labelCls}>Badge Text</label>
        <input value={data.heroBadge} onChange={e => set('heroBadge', e.target.value)} className={inputCls} />
        <label className={labelCls}>Main Heading</label>
        <input value={data.heading} onChange={e => set('heading', e.target.value)} className={inputCls} />
        <label className={labelCls}>Subheading</label>
        <textarea value={data.subheading} onChange={e => set('subheading', e.target.value)} rows={2} className={`${inputCls} resize-none`} />
        <label className={labelCls}>Revenue Share %</label>
        <input value={data.revenueShare} onChange={e => set('revenueShare', e.target.value)} className={inputCls} placeholder="70" />
        <label className={labelCls}>Hero Image</label>
        <UploadBtn
          accept="image/*"
          label="Upload Hero Image"
          currentUrl={data.heroImage}
          type="image"
          onUploaded={url => set('heroImage', url)}
        />
      </div>

      <div className={cardCls}>
        <h3 className="font-bold text-white text-sm border-b border-white/10 pb-3">Benefits</h3>
        <div className="space-y-3">
          {data.benefits.map((b, i) => (
            <div key={i} className="p-3 bg-slate-700/40 rounded-xl space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Benefit {i + 1}</span>
                <button type="button" onClick={() => removeBenefit(i)} className="p-1 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-3 h-3" /></button>
              </div>
              <input value={b.title} onChange={e => updateBenefit(i, 'title', e.target.value)} placeholder="Title" className={inputCls} />
              <textarea value={b.desc} onChange={e => updateBenefit(i, 'desc', e.target.value)} rows={2} placeholder="Description..." className={`${inputCls} resize-none`} />
            </div>
          ))}
        </div>
        <button type="button" onClick={addBenefit}
          className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 py-1.5 px-3 border border-dashed border-violet-500/40 rounded-xl w-full justify-center hover:border-violet-400 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add Benefit
        </button>
      </div>

      <div className={cardCls}>
        <h3 className="font-bold text-white text-sm border-b border-white/10 pb-3">Requirements</h3>
        <ListEditor items={data.requirements} onChange={v => set('requirements', v)} placeholder="Requirement..." />
      </div>

      <div className={cardCls}>
        <h3 className="font-bold text-white text-sm border-b border-white/10 pb-3">CTA</h3>
        <label className={labelCls}>CTA Button Text</label>
        <input value={data.ctaText} onChange={e => set('ctaText', e.target.value)} className={inputCls} />
      </div>

      <SaveBtn onClick={save} saving={saving} label="Save Mentor Page" />
    </div>
  )
}

// ── Tab: Media Library ────────────────────────────────────────────────────────
function MediaTab() {
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'image' | 'video' | 'document'>('all')
  const dropRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    try {
      const r = await adminAPI.listMedia(filter === 'all' ? undefined : filter)
      setFiles(r.data.files || [])
    } catch {}
    finally { setLoading(false) }
  }, [filter])

  useEffect(() => { load() }, [load])

  const handleUpload = async (fileList: FileList) => {
    setUploading(true)
    let uploaded = 0
    for (const file of Array.from(fileList)) {
      try {
        const fd = new FormData(); fd.append('file', file)
        await adminAPI.uploadFile(fd)
        uploaded++
      } catch {}
    }
    if (uploaded) { toast.success(`${uploaded} file(s) uploaded!`); load() }
    else toast.error('Upload failed')
    setUploading(false)
  }

  const del = async (id: string) => {
    if (!confirm('Delete this file permanently?')) return
    try {
      await adminAPI.deleteMedia(id)
      setFiles(f => f.filter(x => x._id !== id))
      toast.success('File deleted')
    } catch { toast.error('Delete failed') }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files.length) handleUpload(e.dataTransfer.files)
  }

  const fmtSize = (b: number) => b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)}MB` : `${(b / 1024).toFixed(0)}KB`

  const displayed = filter === 'all' ? files : files.filter(f => f.type === filter)

  return (
    <div className="space-y-5">
      <div
        ref={dropRef}
        onDrop={onDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => !uploading && inputRef.current?.click()}
        className="border-2 border-dashed border-violet-500/40 rounded-2xl p-8 text-center cursor-pointer hover:border-violet-500/70 hover:bg-violet-500/5 transition-all"
      >
        {uploading
          ? <div className="flex items-center justify-center gap-3"><Loader2 className="w-6 h-6 animate-spin text-violet-400" /><span className="text-violet-400 font-semibold">Uploading...</span></div>
          : <>
              <Upload className="w-8 h-8 text-violet-400 mx-auto mb-3" />
              <p className="text-white font-semibold mb-1">Drop files here or click to upload</p>
              <p className="text-gray-500 text-sm">Images · Videos · PDF · ZIP · Up to 500MB</p>
            </>
        }
        <input ref={inputRef} type="file" multiple accept="image/*,video/*,.pdf,.zip" className="hidden"
          onChange={e => e.target.files && handleUpload(e.target.files)} />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {(['all', 'image', 'video', 'document'] as const).map(t => (
          <button key={t} type="button" onClick={() => setFilter(t)}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${filter === t ? 'bg-violet-600 text-white' : 'bg-slate-700/50 text-gray-400 hover:text-white'}`}>
            {t === 'all' ? `All (${files.length})` : `${t.charAt(0).toUpperCase() + t.slice(1)}s`}
          </button>
        ))}
        <button type="button" onClick={load} className="ml-auto text-xs text-gray-500 hover:text-white px-3 py-1.5 rounded-xl hover:bg-white/5">Refresh</button>
      </div>

      {loading
        ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-violet-400" /></div>
        : displayed.length === 0
          ? <div className="text-center py-16 text-gray-600">No files uploaded yet</div>
          : <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {displayed.map((f) => (
                <div key={f._id} className="group relative rounded-xl overflow-hidden bg-slate-800 border border-white/[0.08] hover:border-violet-500/40 transition-all">
                  <div className="aspect-square bg-slate-700/50 relative">
                    {f.type === 'image'
                      ? <img src={f.url} alt={f.originalName} className="w-full h-full object-cover" loading="lazy" />
                      : f.type === 'video'
                        ? <div className="w-full h-full flex items-center justify-center"><FileVideo className="w-10 h-10 text-blue-400" /></div>
                        : <div className="w-full h-full flex items-center justify-center"><Globe className="w-10 h-10 text-gray-400" /></div>
                    }
                  </div>
                  <div className="p-2">
                    <p className="text-white text-[10px] truncate font-medium">{f.originalName || f.filename}</p>
                    <p className="text-gray-600 text-[9px]">{f.size ? fmtSize(f.size) : ''}</p>
                  </div>
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                    <CopyBtn text={f.url} />
                    <button type="button" onClick={() => del(f._id)} className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/40 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <a href={f.url} target="_blank" rel="noreferrer" className="p-1.5 bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition-colors">
                      <Link2 className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
      }
    </div>
  )
}

// ── Tab: Wall of Love ─────────────────────────────────────────────────────────
const DEFAULT_WALL_VIDEOS = [
  { name: 'Priya Mehta',  role: 'Full Stack Dev',  company: 'Infosys',      result: 'Got placed in 6 weeks',   quote: 'I went from zero to getting a job at Infosys in just 6 weeks!', duration: '1:42', avatarUrl: '', videoUrl: '' },
  { name: 'Rahul Singh',  role: 'Skill Partner',   company: 'Self-Employed', result: '₹1.2L last month',       quote: 'I earn more through skill partnerships than my old 9-to-5 job!', duration: '0:58', avatarUrl: '', videoUrl: '' },
  { name: 'Ananya Verma', role: 'Data Scientist',  company: 'Amazon',        result: '40% salary hike',         quote: 'The AI certificate is legit — Amazon HR specifically asked about TruLearnix!', duration: '1:15', avatarUrl: '', videoUrl: '' },
  { name: 'Karan Patel',  role: 'Freelancer',      company: 'Toptal',        result: '₹50K/month freelancing',  quote: 'Live classes gave me confidence to charge premium rates to international clients!', duration: '2:03', avatarUrl: '', videoUrl: '' },
]

function WallVideoCard({ v, i, onChange, onDelete }: { v: any; i: number; onChange: (v: any) => void; onDelete: () => void }) {
  const set = (k: string, val: string) => onChange({ ...v, [k]: val })
  return (
    <div className="bg-[#0d0f1c] border border-white/10 rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-violet-400 font-bold text-sm">Video #{i + 1}</span>
        <button type="button" onClick={onDelete} className="text-red-400 hover:text-red-300 transition-colors"><Trash2 className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Name</label>
          <input value={v.name} onChange={e => set('name', e.target.value)} placeholder="Student name" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Role</label>
          <input value={v.role} onChange={e => set('role', e.target.value)} placeholder="e.g. Full Stack Dev" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Company</label>
          <input value={v.company} onChange={e => set('company', e.target.value)} placeholder="e.g. Infosys" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Result Badge</label>
          <input value={v.result} onChange={e => set('result', e.target.value)} placeholder="e.g. Got placed in 6 weeks" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Duration (shown on slider)</label>
          <input value={v.duration || ''} onChange={e => set('duration', e.target.value)} placeholder="e.g. 1:42" className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Quote</label>
        <textarea value={v.quote} onChange={e => set('quote', e.target.value)} rows={2} placeholder="Their testimonial quote..." className={inputCls + ' resize-none'} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Photo (shown on slider)</label>
          <UploadBtn accept="image/*" label="Upload Photo" currentUrl={v.avatarUrl} type="image" onUploaded={url => set('avatarUrl', url)} />
        </div>
        <div>
          <label className={labelCls}>Video (plays on click)</label>
          <UploadBtn accept="video/*" label="Upload Video" currentUrl={v.videoUrl} type="video" onUploaded={url => set('videoUrl', url)} />
        </div>
      </div>
    </div>
  )
}

// ── Tab: Achievements ──────────────────────────────────────────────────────────
const ICON_OPTIONS = ['Trophy', 'Star', 'Shield', 'Zap', 'Award', 'TrendingUp', 'Globe', 'Cpu']
const COLOR_OPTIONS = ['amber', 'violet', 'blue', 'green', 'cyan', 'pink', 'orange', 'indigo', 'fuchsia']

function AchievementsTab() {
  const [heading, setHeading] = useState('')
  const [subheading, setSubheading] = useState('')
  const [awards, setAwards] = useState<any[]>([])
  const [photos, setPhotos] = useState<any[]>([])
  const [videos, setVideos] = useState<any[]>([])
  const [stats, setStats] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.getSiteContent('achievements').then(r => {
      if (r.data.data) {
        const d = r.data.data
        if (d.heading) setHeading(d.heading)
        if (d.subheading) setSubheading(d.subheading)
        if (d.awards?.length) setAwards(d.awards)
        if (d.photos?.length) setPhotos(d.photos)
        if (d.videos?.length) setVideos(d.videos)
        if (d.stats?.length) setStats(d.stats)
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try { await adminAPI.saveSiteContent('achievements', { heading, subheading, awards, photos, videos, stats }); toast.success('Achievements saved!') }
    catch { toast.error('Save failed') }
    finally { setSaving(false) }
  }

  const updateAward = (i: number, v: any) => setAwards(a => a.map((x, idx) => idx === i ? v : x))
  const addAward = () => setAwards(a => [...a, { icon: 'Trophy', color: 'amber', title: '', org: '', year: new Date().getFullYear().toString() }])
  const deleteAward = (i: number) => setAwards(a => a.filter((_, idx) => idx !== i))

  const updatePhoto = (i: number, v: any) => setPhotos(p => p.map((x, idx) => idx === i ? v : x))
  const addPhoto = () => setPhotos(p => [...p, { src: '', caption: '', sub: '' }])
  const deletePhoto = (i: number) => setPhotos(p => p.filter((_, idx) => idx !== i))

  const updateVideo = (i: number, v: any) => setVideos(vs => vs.map((x, idx) => idx === i ? v : x))
  const addVideo = () => setVideos(vs => [...vs, { src: '', caption: '', sub: '' }])
  const deleteVideo = (i: number) => setVideos(vs => vs.filter((_, idx) => idx !== i))

  const updateStat = (i: number, v: any) => setStats(s => s.map((x, idx) => idx === i ? v : x))
  const addStat = () => setStats(s => [...s, { val: '', label: '', color: 'amber' }])
  const deleteStat = (i: number) => setStats(s => s.filter((_, idx) => idx !== i))

  if (loading) return <Spinner />

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className={cardCls}>
        <h3 className="font-bold text-white text-sm border-b border-white/10 pb-3">Section Heading</h3>
        <label className={labelCls}>Main Heading</label>
        <input value={heading} onChange={e => setHeading(e.target.value)} placeholder="Recognised by India's Best" className={inputCls} />
        <label className={labelCls}>Subheading</label>
        <input value={subheading} onChange={e => setSubheading(e.target.value)} placeholder="Trusted by top organisations..." className={inputCls} />
      </div>

      {/* Awards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-sm">Awards ({awards.length})</h3>
          <button type="button" onClick={addAward}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all">
            <Plus className="w-4 h-4" /> Add Award
          </button>
        </div>
        {awards.map((a, i) => (
          <div key={i} className={cardCls + ' space-y-3'}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-white text-xs font-bold">Award #{i + 1}</span>
              <button type="button" onClick={() => deleteAward(i)} className="text-red-400 hover:text-red-300 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Icon</label>
                <select value={a.icon} onChange={e => updateAward(i, { ...a, icon: e.target.value })} className={inputCls}>
                  {ICON_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Color</label>
                <select value={a.color} onChange={e => updateAward(i, { ...a, color: e.target.value })} className={inputCls}>
                  {COLOR_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>
            <label className={labelCls}>Award Title</label>
            <input value={a.title} onChange={e => updateAward(i, { ...a, title: e.target.value })} placeholder="Best EdTech Startup" className={inputCls} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Organisation</label>
                <input value={a.org} onChange={e => updateAward(i, { ...a, org: e.target.value })} placeholder="Inc42 Awards" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Year</label>
                <input value={a.year} onChange={e => updateAward(i, { ...a, year: e.target.value })} placeholder="2024" className={inputCls} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Photos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-sm">Moment Photos ({photos.length})</h3>
          <button type="button" onClick={addPhoto}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all">
            <Plus className="w-4 h-4" /> Add Photo
          </button>
        </div>
        {photos.map((p, i) => (
          <div key={i} className={cardCls + ' space-y-3'}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-white text-xs font-bold">Photo #{i + 1}</span>
              <button type="button" onClick={() => deletePhoto(i)} className="text-red-400 hover:text-red-300 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <label className={labelCls}>Image</label>
            <UploadBtn
              accept="image/*"
              label="Upload Image"
              onUploaded={url => updatePhoto(i, { ...p, src: url })}
              currentUrl={p.src}
              type="image"
            />
            <label className={labelCls}>Caption</label>
            <input value={p.caption} onChange={e => updatePhoto(i, { ...p, caption: e.target.value })} placeholder="Award Night 2024" className={inputCls} />
            <label className={labelCls}>Sub-caption</label>
            <input value={p.sub} onChange={e => updatePhoto(i, { ...p, sub: e.target.value })} placeholder="Inc42 Summit, Bangalore" className={inputCls} />
          </div>
        ))}
      </div>

      {/* Videos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-sm">Moment Videos ({videos.length})</h3>
          <button type="button" onClick={addVideo}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all">
            <Plus className="w-4 h-4" /> Add Video
          </button>
        </div>
        {videos.map((v, i) => (
          <div key={i} className={cardCls + ' space-y-3'}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-white text-xs font-bold">Video #{i + 1}</span>
              <button type="button" onClick={() => deleteVideo(i)} className="text-red-400 hover:text-red-300 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <label className={labelCls}>Video</label>
            <UploadBtn
              accept="video/*"
              label="Upload Video"
              onUploaded={url => updateVideo(i, { ...v, src: url })}
              currentUrl={v.src}
              type="video"
            />
            <label className={labelCls}>Caption</label>
            <input value={v.caption} onChange={e => updateVideo(i, { ...v, caption: e.target.value })} placeholder="Award Night 2024" className={inputCls} />
            <label className={labelCls}>Sub-caption</label>
            <input value={v.sub} onChange={e => updateVideo(i, { ...v, sub: e.target.value })} placeholder="Inc42 Summit, Bangalore" className={inputCls} />
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-sm">Bottom Stats ({stats.length})</h3>
          <button type="button" onClick={addStat}
            className="flex items-center gap-2 bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all">
            <Plus className="w-4 h-4" /> Add Stat
          </button>
        </div>
        {stats.map((s, i) => (
          <div key={i} className={cardCls + ' space-y-3'}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-white text-xs font-bold">Stat #{i + 1}</span>
              <button type="button" onClick={() => deleteStat(i)} className="text-red-400 hover:text-red-300 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Value</label>
                <input value={s.val} onChange={e => updateStat(i, { ...s, val: e.target.value })} placeholder="12+" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Label</label>
                <input value={s.label} onChange={e => updateStat(i, { ...s, label: e.target.value })} placeholder="Awards Won" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Color</label>
                <select value={s.color} onChange={e => updateStat(i, { ...s, color: e.target.value })} className={inputCls}>
                  {COLOR_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      <SaveBtn onClick={save} saving={saving} label="Save Achievements" />
    </div>
  )
}

function WallTab() {
  const [heading, setHeading] = useState('Wall of Love')
  const [subheading, setSubheading] = useState('Real students. Real results. Watch their stories.')
  const [videos, setVideos] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.getSiteContent('wall').then(r => {
      if (r.data.data) {
        const d = r.data.data
        if (d.heading) setHeading(d.heading)
        if (d.subheading) setSubheading(d.subheading)
        if (d.videos?.length) setVideos(d.videos)
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try { await adminAPI.saveSiteContent('wall', { heading, subheading, videos }); toast.success('Wall of Love saved!') }
    catch { toast.error('Save failed') }
    finally { setSaving(false) }
  }

  const updateVideo = (i: number, v: any) => setVideos(vs => vs.map((x, idx) => idx === i ? v : x))
  const addVideo = () => setVideos(vs => [...vs, { name: '', role: '', company: '', result: '', quote: '', duration: '', avatarUrl: '', videoUrl: '' }])
  const deleteVideo = (i: number) => setVideos(vs => vs.filter((_, idx) => idx !== i))

  if (loading) return <Spinner />

  return (
    <div className="space-y-6">
      <div className={cardCls}>
        <h3 className="font-bold text-white text-sm border-b border-white/10 pb-3">Section Heading</h3>
        <label className={labelCls}>Main Heading</label>
        <input value={heading} onChange={e => setHeading(e.target.value)} placeholder="Wall of Love" className={inputCls} />
        <label className={labelCls}>Subheading</label>
        <input value={subheading} onChange={e => setSubheading(e.target.value)} placeholder="Real students. Real results." className={inputCls} />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-sm">Video Testimonials ({videos.length})</h3>
          <button type="button" onClick={addVideo}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all">
            <Plus className="w-4 h-4" /> Add Video
          </button>
        </div>
        {videos.map((v, i) => (
          <WallVideoCard key={i} v={v} i={i} onChange={nv => updateVideo(i, nv)} onDelete={() => deleteVideo(i)} />
        ))}
      </div>
      <SaveBtn onClick={save} saving={saving} label="Save Wall of Love" />
    </div>
  )
}

// ── Tab: Our Movement ──────────────────────────────────────────────────────────
function MovementTab() {
  const [heading, setHeading] = useState('Join Our Movement')
  const [subheading, setSubheading] = useState('Learn skills, earn income, and grow a community around you.')
  const [sectionHeading, setSectionHeading] = useState('How Earning Works')
  const [steps, setSteps] = useState([
    { num: '01', title: 'Join & Learn',     desc: 'Enroll in any plan. Start your learning journey.' },
    { num: '02', title: 'Share Your Link',  desc: 'Get your personal partner link. Share it with friends, family, and on social media.' },
    { num: '03', title: 'Earn Every Month', desc: 'Help others learn skills — earn 10–25% income on every successful enrollment, every month.' },
  ])
  const [leaderboardHeading, setLeaderboardHeading] = useState('Top Earners This Month')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.getSiteContent('movement').then(r => {
      if (r.data.data) {
        const d = r.data.data
        if (d.heading) setHeading(d.heading)
        if (d.subheading) setSubheading(d.subheading)
        if (d.sectionHeading) setSectionHeading(d.sectionHeading)
        if (d.steps?.length) setSteps(d.steps)
        if (d.leaderboardHeading) setLeaderboardHeading(d.leaderboardHeading)
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try { await adminAPI.saveSiteContent('movement', { heading, subheading, sectionHeading, steps, leaderboardHeading }); toast.success('Our Movement saved!') }
    catch { toast.error('Save failed') }
    finally { setSaving(false) }
  }

  const updateStep = (i: number, k: string, val: string) =>
    setSteps(ss => ss.map((s, idx) => idx === i ? { ...s, [k]: val } : s))

  if (loading) return <Spinner />

  return (
    <div className="space-y-6">
      <div className={cardCls}>
        <h3 className="font-bold text-white text-sm border-b border-white/10 pb-3">Section Headings</h3>
        <label className={labelCls}>Main Heading</label>
        <input value={heading} onChange={e => setHeading(e.target.value)} placeholder="Join Our Movement" className={inputCls} />
        <label className={labelCls}>Subheading</label>
        <input value={subheading} onChange={e => setSubheading(e.target.value)} placeholder="Learn skills, earn income..." className={inputCls} />
        <label className={labelCls}>How It Works Section Heading</label>
        <input value={sectionHeading} onChange={e => setSectionHeading(e.target.value)} placeholder="How Earning Works" className={inputCls} />
        <label className={labelCls}>Leaderboard Heading</label>
        <input value={leaderboardHeading} onChange={e => setLeaderboardHeading(e.target.value)} placeholder="Top Earners This Month" className={inputCls} />
      </div>

      <div className={cardCls}>
        <h3 className="font-bold text-white text-sm border-b border-white/10 pb-3">Earn Steps (3 steps)</h3>
        <div className="space-y-4">
          {steps.map((s, i) => (
            <div key={i} className="bg-[#0d0f1c] border border-white/10 rounded-xl p-4 space-y-2">
              <span className="text-violet-400 font-black text-xs">Step {s.num}</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Title</label>
                  <input value={s.title} onChange={e => updateStep(i, 'title', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Step Number</label>
                  <input value={s.num} onChange={e => updateStep(i, 'num', e.target.value)} className={inputCls} />
                </div>
              </div>
              <label className={labelCls}>Description</label>
              <textarea value={s.desc} onChange={e => updateStep(i, 'desc', e.target.value)} rows={2} className={inputCls + ' resize-none'} />
            </div>
          ))}
        </div>
      </div>

      <SaveBtn onClick={save} saving={saving} label="Save Our Movement" />
    </div>
  )
}

// ── Tab: Legal Docs ───────────────────────────────────────────────────────────
function LegalTab() {
  const [data, setData] = useState(DEFAULT_LEGAL)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<number | null>(null)

  useEffect(() => {
    adminAPI.getSiteContent('legal').then(r => {
      if (r.data.data) setData(d => ({ ...d, ...r.data.data }))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try { await adminAPI.saveSiteContent('legal', data); toast.success('Legal docs saved!') }
    catch { toast.error('Save failed') }
    finally { setSaving(false) }
  }

  const set = (key: string, val: any) => setData(d => ({ ...d, [key]: val }))

  const updateDoc = (i: number, k: string, v: any) => {
    const a = [...data.docs]; a[i] = { ...a[i], [k]: v }; set('docs', a)
  }
  const addDoc = () => set('docs', [...data.docs, { title: '', category: 'Other', desc: '', fileUrl: '', visible: true }])
  const removeDoc = (i: number) => set('docs', data.docs.filter((_: any, idx: number) => idx !== i))

  const uploadPDF = async (i: number, file: File) => {
    setUploading(i)
    try {
      const fd = new FormData(); fd.append('file', file)
      const r = await adminAPI.uploadFile(fd)
      updateDoc(i, 'fileUrl', r.data.url)
      toast.success('PDF uploaded!')
    } catch { toast.error('Upload failed') }
    finally { setUploading(null) }
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className={cardCls}>
        <h3 className="font-bold text-white text-sm border-b border-white/10 pb-3">Page Header</h3>
        <label className={labelCls}>Heading</label>
        <input value={data.heading} onChange={e => set('heading', e.target.value)} className={inputCls} />
        <label className={labelCls}>Subheading</label>
        <textarea value={data.subheading} onChange={e => set('subheading', e.target.value)} rows={2} className={`${inputCls} resize-none`} />
      </div>

      {/* Documents */}
      <div className={cardCls}>
        <h3 className="font-bold text-white text-sm border-b border-white/10 pb-3">Legal Documents</h3>
        <div className="space-y-5 mt-1">
          {data.docs.map((doc: any, i: number) => (
            <div key={i} className="p-5 bg-slate-700/40 rounded-2xl space-y-3 border border-white/10">
              <div className="flex items-center justify-between">
                <p className="text-white font-bold text-sm">Document {i + 1}</p>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => updateDoc(i, 'visible', !doc.visible)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${doc.visible ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-gray-500 bg-white/5 border border-white/10'}`}>
                    {doc.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    {doc.visible ? 'Visible' : 'Hidden'}
                  </button>
                  <button type="button" onClick={() => removeDoc(i)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Title</label>
                  <input value={doc.title} onChange={e => updateDoc(i, 'title', e.target.value)} placeholder="Privacy Policy" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Category</label>
                  <select value={doc.category} onChange={e => updateDoc(i, 'category', e.target.value)}
                    className={`${inputCls} cursor-pointer`}>
                    {LEGAL_CATEGORIES.map(c => <option key={c} value={c} className="bg-slate-800">{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>Description</label>
                <textarea value={doc.desc} onChange={e => updateDoc(i, 'desc', e.target.value)} rows={2} placeholder="Brief description of this document..." className={`${inputCls} resize-none`} />
              </div>

              <div>
                <label className={labelCls}>PDF File</label>
                <div className="flex items-center gap-3 flex-wrap">
                  <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all ${uploading === i ? 'opacity-50 pointer-events-none' : 'bg-white/10 hover:bg-white/15 border border-white/20 text-white'}`}>
                    {uploading === i ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Upload className="w-4 h-4" />}
                    {uploading === i ? 'Uploading...' : 'Upload PDF'}
                    <input type="file" hidden accept="application/pdf" onChange={e => e.target.files?.[0] && uploadPDF(i, e.target.files[0])} />
                  </label>
                  {doc.fileUrl && (
                    <a href={doc.fileUrl} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:opacity-80 transition-all">
                      <FileText className="w-3.5 h-3.5" /> View PDF
                    </a>
                  )}
                </div>
                {doc.fileUrl && (
                  <p className="text-gray-600 text-[10px] mt-1.5 truncate">{doc.fileUrl}</p>
                )}
                {!doc.fileUrl && (
                  <p className="text-gray-600 text-xs mt-1.5 italic">No file uploaded yet — document will show "Coming soon"</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <button type="button" onClick={addDoc}
          className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 py-1.5 px-3 border border-dashed border-violet-500/40 rounded-xl w-full justify-center hover:border-violet-400 transition-colors mt-4">
          <Plus className="w-3.5 h-3.5" /> Add Document
        </button>
      </div>

      <SaveBtn onClick={save} saving={saving} label="Save Legal Docs" />
    </div>
  )
}

// ── Tab: Settings ─────────────────────────────────────────────────────────────
function SettingsTab() {
  const [data, setData] = useState(DEFAULT_SETTINGS)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.getSiteContent('settings').then(r => {
      if (r.data.data) setData(d => ({ ...d, ...r.data.data }))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const set = (k: string, v: string) => setData(d => ({ ...d, [k]: v }))

  const save = async () => {
    setSaving(true)
    try { await adminAPI.saveSiteContent('settings', data); toast.success('Settings saved!') }
    catch { toast.error('Save failed') }
    finally { setSaving(false) }
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-6">
      <div className={cardCls}>
        <h3 className="font-bold text-white text-sm border-b border-white/10 pb-3">General</h3>
        {[
          ['platformName', 'Platform Name', 'TruLearnix'],
          ['tagline', 'Tagline', "India's #1 Live Learning + Earning Platform"],
          ['contactEmail', 'Contact Email', 'support@trulearnix.com'],
          ['whatsapp', 'WhatsApp Number', '+91 98765 43210'],
          ['footerCopyright', 'Footer Copyright', '© 2025 TruLearnix'],
        ].map(([k, l, ph]) => (
          <div key={k}>
            <label className={labelCls}>{l}</label>
            <input value={(data as any)[k]} onChange={e => set(k, e.target.value)} placeholder={ph} className={inputCls} />
          </div>
        ))}
      </div>

      <div className={cardCls}>
        <h3 className="font-bold text-white text-sm border-b border-white/10 pb-3">Logo & Favicon</h3>
        <label className={labelCls}>Logo</label>
        <UploadBtn
          accept="image/*"
          label="Upload Logo"
          currentUrl={data.logoUrl}
          type="image"
          onUploaded={url => set('logoUrl', url)}
        />
        <label className={labelCls}>Favicon</label>
        <UploadBtn
          accept="image/*,.ico"
          label="Upload Favicon"
          currentUrl={data.faviconUrl}
          type="image"
          onUploaded={url => set('faviconUrl', url)}
        />
      </div>

      <div className={cardCls}>
        <h3 className="font-bold text-white text-sm border-b border-white/10 pb-3">Social Links</h3>
        {[
          ['instagram', 'Instagram URL'],
          ['youtube', 'YouTube URL'],
          ['twitter', 'Twitter / X URL'],
          ['linkedin', 'LinkedIn URL'],
        ].map(([k, l]) => (
          <div key={k}>
            <label className={labelCls}>{l}</label>
            <input value={(data as any)[k]} onChange={e => set(k, e.target.value)} placeholder={`https://${k}.com/...`} className={inputCls} />
          </div>
        ))}
      </div>

      <SaveBtn onClick={save} saving={saving} label="Save Settings" />
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ContentPage() {
  const [tab, setTab] = useState('navbar')

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-500/20 rounded-xl flex items-center justify-center">
            <PanelTop className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="font-bold text-white">Website Content Manager</h1>
            <p className="text-xs text-gray-400">Edit all content, images and videos shown on trulearnix.com</p>
          </div>
        </div>

        <div className="overflow-x-auto pb-1">
          <div className="flex gap-1 min-w-max">
            {TABS.map(t => {
              const Icon = t.icon
              return (
                <button key={t.id} type="button" onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                    tab === t.id
                      ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}>
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>

        {tab === 'navbar'       && <NavbarTab />}
        {tab === 'footer'       && <FooterTab />}
        {tab === 'hero'         && <HeroTab />}
        {tab === 'stats'        && <StatsTab />}
        {tab === 'testimonials' && <TestimonialsTab />}
        {tab === 'steps'        && <StepsTab />}
        {tab === 'about'        && <AboutTab />}
        {tab === 'cta'          && <CTATab />}
        {tab === 'contact'      && <ContactTab />}
        {tab === 'mentor'       && <MentorTab />}
        {tab === 'wall'         && <WallTab />}
        {tab === 'achievements' && <AchievementsTab />}
        {tab === 'movement'     && <MovementTab />}
        {tab === 'legal'        && <LegalTab />}
        {tab === 'media'        && <MediaTab />}
        {tab === 'settings'     && <SettingsTab />}
      </div>
    </AdminLayout>
  )
}
