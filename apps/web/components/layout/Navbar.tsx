'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Menu, X, BookOpen, LogOut, LayoutDashboard, ChevronRight,
  Zap, Video, Award, Users, Home, DollarSign, Star,
  GraduationCap, ArrowRight, Bot, Wallet, FileText,
  BadgeCheck, TrendingUp, Briefcase, Shield
} from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { authAPI } from '@/lib/api'
import { useRouter } from 'next/navigation'
import Logo from '@/components/ui/Logo'

/* ── nav groups shown in the sidebar drawer ── */
const mainLinks = [
  { href: '/',             label: 'Home',          icon: Home,         color: 'text-violet-400',  bg: 'rgba(124,58,237,0.15)' },
  { href: '/courses',      label: 'Courses',       icon: BookOpen,     color: 'text-blue-400',    bg: 'rgba(59,130,246,0.15)' },
  { href: '/live-classes', label: 'Live Classes',  icon: Video,        color: 'text-red-400',     bg: 'rgba(239,68,68,0.15)',  badge: 'LIVE' },
  { href: '/packages',     label: 'Packages',      icon: BadgeCheck,   color: 'text-amber-400',   bg: 'rgba(245,158,11,0.15)' },
  { href: '/pricing',      label: 'Pricing',       icon: DollarSign,   color: 'text-green-400',   bg: 'rgba(16,185,129,0.15)' },
]

const exploreLinks = [
  { href: '/certifications', label: 'Certifications',  icon: Award,         color: 'text-yellow-400', bg: 'rgba(245,158,11,0.12)', desc: 'AI-verified certificates' },
  { href: '/affiliate',      label: 'Earn Program',    icon: TrendingUp,    color: 'text-green-400',  bg: 'rgba(16,185,129,0.12)', desc: 'Help others learn & earn' },
  { href: '/mentor',         label: 'Become Mentor',   icon: GraduationCap, color: 'text-violet-400', bg: 'rgba(124,58,237,0.12)', desc: 'Teach & earn 70% revenue' },
  { href: '/about',          label: 'About Us',        icon: Users,         color: 'text-cyan-400',   bg: 'rgba(6,182,212,0.12)',  desc: 'Our story & mission' },
]

/* ── desktop top nav ── */
const desktopLinks = [
  { href: '/',             label: 'Home'         },
  { href: '/courses',      label: 'Courses'      },
  { href: '/live-classes', label: 'Live Classes', badge: 'LIVE' },
  { href: '/pricing',      label: 'Pricing'      },
]

/* ── mobile bottom tab bar ── */
const bottomTabs = [
  { href: '/',             label: 'Home',    icon: Home  },
  { href: '/courses',      label: 'Courses', icon: BookOpen },
  { href: '/live-classes', label: 'Live',    icon: Video, badge: true },
  { href: '/packages',     label: 'Earn',    icon: TrendingUp },
]

export default function Navbar() {
  const [open, setOpen]         = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user, logout }        = useAuthStore()
  const router                  = useRouter()
  const pathname                = usePathname()

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const close = () => setOpen(false)

  const handleLogout = async () => {
    try { await authAPI.logout() } catch {}
    logout(); close(); router.push('/')
  }

  const dashboardPath = user?.role === 'admin' ? '/admin' : user?.role === 'mentor' ? '/mentor' : '/student/dashboard'

  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname?.startsWith(href)

  return (
    <>
      {/* ──────── Desktop / Mobile Top Bar ──────── */}
      <nav className={`fixed top-0 w-full z-30 transition-all duration-300 ${scrolled ? 'border-b border-white/[0.06]' : ''}`}
        style={{ background: scrolled ? 'rgba(4,5,10,0.96)' : 'rgba(4,5,10,0.8)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">

            {/* Logo */}
            <Logo size="md" href="/" />

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-0.5">
              {desktopLinks.map(link => (
                <Link key={link.href} href={link.href}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive(link.href)
                      ? 'text-violet-400 bg-violet-500/10 border border-violet-500/15'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}>
                  {link.label}
                  {link.badge && (
                    <span className="live-badge text-[10px] px-2 py-0.5">
                      <span className="w-1.5 h-1.5 bg-red-400 rounded-full live-dot" />LIVE
                    </span>
                  )}
                </Link>
              ))}
            </div>

            {/* Desktop right actions */}
            <div className="hidden md:flex items-center gap-2">
              {user ? (
                <>
                  <Link href={dashboardPath}
                    className="flex items-center gap-2 text-sm text-gray-300 hover:text-white px-3 py-2 rounded-xl hover:bg-white/5 transition-all">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-xs"
                      style={{ background: 'linear-gradient(135deg,#7c3aed,#6366f1)' }}>{user.name[0]}</div>
                    {user.name.split(' ')[0]}
                  </Link>
                  <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 transition-colors p-2">
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-2">Login</Link>
                  <Link href="/register" className="btn-primary text-sm py-2 px-5">Start Free →</Link>
                </>
              )}
            </div>

            {/* Mobile: show user avatar + hamburger */}
            <div className="md:hidden flex items-center gap-2">
              {user && (
                <Link href={dashboardPath}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#6366f1)' }}>
                  {user.name[0]}
                </Link>
              )}
              <button onClick={() => setOpen(true)}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-300"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Menu className="w-4.5 h-4.5 w-[18px] h-[18px]" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ──────── Mobile Bottom Tab Bar ──────── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around px-2 pb-safe"
        style={{
          background: 'rgba(6,7,14,0.97)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(24px)',
          paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
          paddingTop: '8px',
        }}>
        {bottomTabs.map(tab => {
          const active = isActive(tab.href)
          return (
            <Link key={tab.href} href={tab.href}
              className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all min-w-[56px]"
              style={{ color: active ? '#a78bfa' : '#6b7280' }}>
              <div className="relative">
                <tab.icon className="w-5 h-5" />
                {tab.badge && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </div>
              <span className="text-[10px] font-bold">{tab.label}</span>
            </Link>
          )
        })}
        {/* Menu tab */}
        <button onClick={() => setOpen(true)}
          className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all min-w-[56px]"
          style={{ color: open ? '#a78bfa' : '#6b7280' }}>
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-bold">Menu</span>
        </button>
      </div>

      {/* ──────── Sidebar Overlay ──────── */}
      <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={close} />

      {/* ──────── Mobile Sidebar Drawer ──────── */}
      <div className={`sidebar-panel ${open ? 'open' : ''}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <Logo size="sm" href="/" />
          <button onClick={close}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400"
            style={{ background: 'rgba(255,255,255,0.06)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ WebkitOverflowScrolling: 'touch' } as any}>

          {/* Auth section */}
          <div className="px-4 pt-4 pb-3">
            {user ? (
              <div className="flex items-center gap-3 p-3 rounded-2xl"
                style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.15),rgba(79,70,229,0.10))', border: '1px solid rgba(124,58,237,0.2)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#6366f1)' }}>
                  {user.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm truncate">{user.name}</p>
                  <p className="text-violet-400 text-xs capitalize">{user.role} · {(user as any)?.packageTier || 'Free'} Plan</p>
                </div>
                <Link href={dashboardPath} onClick={close}>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/register" onClick={close}
                  className="text-center text-sm font-black py-2.5 rounded-xl text-white"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#6366f1)' }}>
                  Sign Up Free
                </Link>
                <Link href="/login" onClick={close}
                  className="text-center text-sm font-semibold py-2.5 rounded-xl text-gray-300"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  Login
                </Link>
              </div>
            )}
          </div>

          {/* Stats strip */}
          <div className="mx-4 mb-4 grid grid-cols-3 gap-2">
            {[
              { val: '50K+', label: 'Students',   color: 'text-violet-400' },
              { val: '4.9★', label: 'Rating',     color: 'text-amber-400'  },
              { val: '500+', label: 'Courses',    color: 'text-cyan-400'   },
            ].map((s, i) => (
              <div key={i} className="text-center py-2 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className={`font-black text-xs ${s.color}`}>{s.val}</p>
                <p className="text-gray-600 text-[9px] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Main Nav */}
          <div className="px-3 mb-3">
            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest px-2 mb-1.5">Main Menu</p>
            {mainLinks.map(link => {
              const active = isActive(link.href)
              return (
                <Link key={link.href} href={link.href} onClick={close}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl mb-1 transition-all"
                  style={active
                    ? { background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }
                    : { background: 'transparent' }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: active ? link.bg : 'rgba(255,255,255,0.05)' }}>
                      <link.icon className={`w-3.5 h-3.5 ${active ? link.color : 'text-gray-500'}`} />
                    </div>
                    <span className={`text-sm font-semibold ${active ? 'text-violet-400' : 'text-gray-300'}`}>
                      {link.label}
                    </span>
                    {link.badge && (
                      <span className="live-badge text-[9px] px-1.5 py-0.5">
                        <span className="w-1 h-1 bg-red-400 rounded-full live-dot" />LIVE
                      </span>
                    )}
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 ${active ? 'text-violet-400' : 'text-gray-700'}`} />
                </Link>
              )
            })}
          </div>

          {/* Explore section */}
          <div className="px-3 mb-3">
            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest px-2 mb-1.5">Explore</p>
            {exploreLinks.map(link => (
              <Link key={link.href} href={link.href} onClick={close}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-1 text-gray-400 hover:text-white transition-all group"
                style={{ background: 'transparent' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: link.bg }}>
                  <link.icon className={`w-3.5 h-3.5 ${link.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-300 group-hover:text-white">{link.label}</p>
                  <p className="text-[10px] text-gray-600 truncate">{link.desc}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-700 flex-shrink-0" />
              </Link>
            ))}
          </div>

          {/* Logged-in: quick links */}
          {user && (
            <div className="px-3 mb-3">
              <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest px-2 mb-1.5">My Account</p>
              {[
                { href: dashboardPath,     icon: LayoutDashboard, label: 'Dashboard' },
                { href: '/student/affiliate', icon: TrendingUp,   label: 'Earn & Grow' },
                { href: '/student/wallet', icon: Wallet,          label: 'Wallet'     },
                { href: '/student/profile',icon: Shield,          label: 'Profile'    },
              ].map(item => (
                <Link key={item.href} href={item.href} onClick={close}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-1 text-gray-400 hover:text-white transition-all group"
                  style={{ background: 'transparent' }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <item.icon className="w-3.5 h-3.5 text-gray-500 group-hover:text-violet-400 transition-colors" />
                  </div>
                  <span className="text-sm font-semibold">{item.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-700 ml-auto flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}

          {/* Live now promo strip */}
          <div className="mx-3 mb-4 px-3 py-3 rounded-xl flex items-center gap-3"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
            <span className="w-2 h-2 bg-red-400 rounded-full live-dot flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-bold">Full Stack Dev — Batch 12</p>
              <p className="text-gray-500 text-[10px]">247 students live now</p>
            </div>
            <Link href="/live-classes" onClick={close}
              className="text-[10px] font-black text-red-400 flex-shrink-0 flex items-center gap-1">
              Join <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

        </div>{/* end scrollable */}

        {/* Bottom actions — fixed inside drawer */}
        <div className="flex-shrink-0 px-4 py-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(6,7,14,0.95)' }}>
          {user ? (
            <div className="flex gap-2">
              <Link href={dashboardPath} onClick={close}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm text-violet-400"
                style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
                <LayoutDashboard className="w-4 h-4" />Dashboard
              </Link>
              <button onClick={handleLogout}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-red-400 font-bold text-sm"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link href="/register" onClick={close}
              className="btn-primary w-full py-3 text-sm font-black justify-center">
              Start Learning Free <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

      </div>
    </>
  )
}
