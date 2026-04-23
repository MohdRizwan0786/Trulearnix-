'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  Menu, X, BookOpen, LogOut, LayoutDashboard, ChevronRight,
  Zap, Video, Award, Users, Home, Package, Star, TrendingUp,
  GraduationCap, Sparkles, ArrowRight
} from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { authAPI } from '@/lib/api'
import { useRouter } from 'next/navigation'
import NotificationBell from '@/components/ui/NotificationBell'

const DEFAULT_NAV_LINKS = [
  { href: '/',             label: 'Home',         icon: Home     },
  { href: '/courses',      label: 'Courses',      icon: BookOpen },
  { href: '/live-classes', label: 'Live Classes',  icon: Video,   badge: 'LIVE' },
  { href: '/packages',     label: 'Packages',      icon: Package },
]

const DEFAULT_SIDEBAR_EXTRAS = [
  { href: '/about',          label: 'About Us',       icon: Users,         desc: 'Our story & mission'       },
  { href: '/certifications', label: 'Certifications', icon: Award,         desc: 'AI-powered certificates'   },
  { href: '/affiliate',      label: 'Earn Money',     icon: Zap,           desc: 'Partner Program'           },
  { href: '/mentor',         label: 'Become Mentor',  icon: GraduationCap, desc: 'Teach & earn 70% revenue' },
]

const DEFAULT_SIDEBAR_STATS = [
  { val: '50K+', label: 'Students',  color: 'text-violet-400' },
  { val: '4.9★', label: 'Rating',   color: 'text-amber-400'  },
  { val: '₹2Cr+', label: 'Paid Out', color: 'text-green-400'  },
]

const ICON_MAP: Record<string, any> = {
  Home, BookOpen, Video, Package, Users, Award, Zap, GraduationCap,
  Star, TrendingUp, Sparkles,
}

function resolveIcon(iconName?: string) {
  if (!iconName) return null
  return ICON_MAP[iconName] || null
}

export default function Navbar() {
  const [open, setOpen]       = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user, logout }      = useAuthStore()
  const router                = useRouter()
  const pathname              = usePathname()

  // CMS state
  const [logoUrl, setLogoUrl]               = useState('')
  const [navLinks, setNavLinks]             = useState(DEFAULT_NAV_LINKS as any[])
  const [ctaText, setCtaText]               = useState('Start Free →')
  const [sidebarStats, setSidebarStats]     = useState(DEFAULT_SIDEBAR_STATS as any[])
  const [sidebarExtras, setSidebarExtras]   = useState(DEFAULT_SIDEBAR_EXTRAS as any[])

  useEffect(() => {
    let cmsStatsUsed = false

    fetch(process.env.NEXT_PUBLIC_API_URL + '/site-content/navbar')
      .then(r => r.json())
      .then(res => {
        const d = res.data
        if (!d) return
        if (d.logoUrl)       setLogoUrl(d.logoUrl)
        if (d.ctaText)       setCtaText(d.ctaText)
        if (d.navLinks?.length) {
          setNavLinks(d.navLinks.map((l: any) => {
            const match = DEFAULT_NAV_LINKS.find(n => n.href === l.href)
            return { ...l, icon: match?.icon || Home, badge: match?.badge }
          }))
        }
        if (d.sidebarStats?.length) {
          cmsStatsUsed = true
          setSidebarStats(d.sidebarStats.map((s: any, i: number) => ({
            ...s,
            color: DEFAULT_SIDEBAR_STATS[i]?.color || 'text-violet-400',
          })))
        }
        if (d.sidebarExtras?.length) {
          setSidebarExtras(d.sidebarExtras.map((e: any) => {
            const match = DEFAULT_SIDEBAR_EXTRAS.find(x => x.href === e.href)
            return { ...e, icon: match?.icon || Users }
          }))
        }
      })
      .catch(() => {})
      .finally(() => {
        if (cmsStatsUsed) return
        fetch(process.env.NEXT_PUBLIC_API_URL + '/public/stats')
          .then(r => r.json())
          .then(d => {
            if (!d.success) return
            const s = d.stats
            const fmtCount = (n: number) => n >= 100000 ? `${Math.floor(n / 100000)}L+` : n >= 1000 ? `${Math.floor(n / 1000)}K+` : `${n}+`
            const fmtMoney = (n: number) => n >= 10000000 ? `₹${(n / 10000000).toFixed(1)}Cr+` : n >= 100000 ? `₹${Math.floor(n / 100000)}L+` : n >= 1000 ? `₹${Math.floor(n / 1000)}K+` : `₹${n}`
            setSidebarStats([
              { val: fmtCount(s.totalStudents || 0), label: 'Students', color: 'text-violet-400' },
              { val: s.avgRating > 0 ? `${s.avgRating.toFixed(1)}★` : '—', label: 'Rating', color: 'text-amber-400' },
              { val: fmtMoney(s.totalPayout || 0), label: 'Paid Out', color: 'text-green-400' },
            ])
          })
          .catch(() => {})
      })
  }, [])

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleLogout = async () => {
    try { await authAPI.logout() } catch {}
    logout(); setOpen(false); router.push('/')
  }

  const dashboardPath = user?.role === 'admin' ? '/admin' : user?.role === 'mentor' ? '/mentor' : '/student'

  return (
    <>
      {/* ── Desktop / Mobile Top Bar ── */}
      <nav className={`fixed top-0 w-full z-30 transition-all duration-300 ${
        scrolled ? 'border-b border-white/[0.06]' : ''
      }`}
        style={{ background: scrolled ? 'rgba(4,5,10,0.94)' : 'rgba(4,5,10,0.75)', backdropFilter:'blur(20px)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center group">
              {logoUrl
                ? <img src={logoUrl} alt="TruLearnix" style={{ height: 44, width: 'auto', objectFit: 'contain' }} />
                : <Image src="/logo.png" alt="TruLearnix" width={177} height={44} className="object-contain" style={{ height: 44, width: 'auto' }} priority />
              }
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link: any) => (
                <Link key={link.href} href={link.href}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    pathname === link.href
                      ? 'text-violet-400 bg-violet-500/10 border border-violet-500/15'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}>
                  {link.label}
                  {link.badge && (
                    <span className="live-badge text-[10px] px-2 py-0.5">
                      <span className="w-1.5 h-1.5 bg-red-400 rounded-full live-dot" />{link.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>

            {/* Desktop actions */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <NotificationBell />
                  <Link href={dashboardPath} className="flex items-center gap-2 text-sm text-gray-300 hover:text-white px-3 py-2 rounded-xl hover:bg-white/5 transition-all">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-xs"
                      style={{ background:'linear-gradient(135deg,#7c3aed,#6366f1)' }}>{user.name[0]}</div>
                    {user.name.split(' ')[0]}
                  </Link>
                  <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 transition-colors p-2">
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-2">Login</Link>
                  <Link href="/register" className="btn-primary text-sm py-2 px-5">{ctaText}</Link>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button onClick={() => setOpen(true)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl text-gray-300 hover:text-white transition-all"
              style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)' }}>
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile overlay ── */}
      <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />

      {/* ── Mobile Sidebar ── */}
      <div className={`sidebar-panel ${open ? 'open' : ''}`} style={{ display:'flex', flexDirection:'column' }}>

        {/* Sidebar header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
          <Link href="/" onClick={() => setOpen(false)} className="flex items-center">
            {logoUrl
              ? <img src={logoUrl} alt="TruLearnix" style={{ height: 36, width: 'auto', objectFit: 'contain' }} />
              : <Image src="/logo.png" alt="TruLearnix" width={145} height={36} className="object-contain" style={{ height: 36, width: 'auto' }} />
            }
          </Link>
          <button onClick={() => setOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white transition-all"
            style={{ background:'rgba(255,255,255,0.06)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content area */}
        <div style={{ flex: 1, overflowY: 'auto', overscrollBehavior: 'contain' }} className="scrollbar-hide">

        {/* User card OR guest greeting */}
        {user ? (
          <div className="mx-4 mt-4 p-4 rounded-2xl" style={{ background:'linear-gradient(135deg,rgba(124,58,237,0.15),rgba(79,70,229,0.10))', border:'1px solid rgba(124,58,237,0.2)' }}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-black text-base"
                style={{ background:'linear-gradient(135deg,#7c3aed,#6366f1)', boxShadow:'0 4px 16px rgba(124,58,237,0.4)' }}>
                {user.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate">{user.name}</p>
                <p className="text-violet-400 text-xs capitalize font-semibold">{user.role} Account</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </div>
          </div>
        ) : (
          <div className="mx-4 mt-4 p-4 rounded-2xl" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-bold text-white">Start Learning Today</span>
            </div>
            <div className="flex gap-2">
              <Link href="/register" onClick={() => setOpen(false)}
                className="flex-1 text-center text-xs font-black py-2.5 px-3 rounded-xl text-white transition-all"
                style={{ background:'linear-gradient(135deg,#7c3aed,#6366f1)', boxShadow:'0 4px 20px rgba(124,58,237,0.4)' }}>
                Sign Up Free
              </Link>
              <Link href="/login" onClick={() => setOpen(false)}
                className="flex-1 text-center text-xs font-semibold py-2.5 px-3 rounded-xl text-gray-300 transition-all"
                style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)' }}>
                Login
              </Link>
            </div>
          </div>
        )}

        {/* Quick stats */}
        <div className="mx-4 mt-3 grid grid-cols-3 gap-2">
          {sidebarStats.map((s: any, i: number) => (
            <div key={i} className="text-center py-2.5 rounded-xl" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
              <p className={`font-black text-sm ${s.color || 'text-violet-400'}`}>{s.val}</p>
              <p className="text-gray-600 text-[10px]">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Navigation links */}
        <div className="px-4 mt-5 space-y-1">
          <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-3 mb-2">Navigation</p>
          {navLinks.map((link: any) => {
            const Icon = link.icon || Home
            const active = pathname === link.href
            return (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)}
                className={`flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all ${
                  active ? 'text-violet-400' : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
                style={active ? { background:'rgba(124,58,237,0.12)', border:'1px solid rgba(124,58,237,0.2)' } : { background:'transparent' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: active ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)' }}>
                    <Icon className={`w-4 h-4 ${active ? 'text-violet-400' : 'text-gray-500'}`} />
                  </div>
                  <span className="font-semibold text-sm">{link.label}</span>
                  {link.badge && (
                    <span className="live-badge text-[10px] px-2 py-0.5">
                      <span className="w-1.5 h-1.5 bg-red-400 rounded-full live-dot" />LIVE
                    </span>
                  )}
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform ${active ? 'text-violet-400' : 'text-gray-700'}`} />
              </Link>
            )
          })}
        </div>

        {/* More links */}
        <div className="px-4 mt-4 space-y-1">
          <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-3 mb-2">Explore More</p>
          {sidebarExtras.map((link: any) => {
            const Icon = link.icon || Users
            return (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 transition-all group"
                style={{ background:'transparent' }}
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background:'rgba(255,255,255,0.05)' }}>
                  <Icon className="w-4 h-4 text-gray-500 group-hover:text-violet-400 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{link.label}</p>
                  <p className="text-xs text-gray-600 truncate">{link.desc}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-700 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all" />
              </Link>
            )
          })}
        </div>

        {/* Live class promo */}
        <div className="mx-4 mt-4 mb-4">
          <div className="rounded-2xl p-4 relative overflow-hidden"
            style={{ background:'linear-gradient(135deg,rgba(239,68,68,0.12),rgba(124,58,237,0.10))', border:'1px solid rgba(239,68,68,0.2)' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 bg-red-400 rounded-full live-dot flex-shrink-0" />
              <span className="text-red-400 text-xs font-black">LIVE NOW</span>
            </div>
            <p className="text-white font-bold text-sm mb-1">Full Stack Dev Batch 12</p>
            <p className="text-gray-500 text-xs mb-3">247 students watching right now</p>
            <Link href="/live-classes" onClick={() => setOpen(false)}
              className="flex items-center gap-1.5 text-xs font-black text-violet-400 hover:text-violet-300 transition-colors">
              Join Now <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        </div>{/* end scrollable area */}

        {/* Bottom actions — always visible */}
        <div className="mx-4 mb-6 mt-2" style={{ flexShrink: 0 }}>
          <div className="pt-4" style={{ borderTop:'1px solid rgba(255,255,255,0.07)' }}>
            {user ? (
              <div className="space-y-2">
                <Link href={dashboardPath} onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm text-violet-400 transition-all"
                  style={{ background:'rgba(124,58,237,0.1)', border:'1px solid rgba(124,58,237,0.2)' }}>
                  <LayoutDashboard className="w-4 h-4" />My Dashboard
                </Link>
                <button onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-red-400 font-bold text-sm transition-all hover:bg-red-500/10">
                  <LogOut className="w-4 h-4" />Logout
                </button>
              </div>
            ) : (
              <Link href="/register" onClick={() => setOpen(false)}
                className="btn-primary w-full py-3.5 text-sm font-black justify-center">
                Start Learning Free <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
