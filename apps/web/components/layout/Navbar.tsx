'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Menu, X, BookOpen, LogOut, LayoutDashboard, ChevronRight,
  Zap, Video, Award, Users, Home, DollarSign, Star, TrendingUp,
  GraduationCap, Sparkles, ArrowRight
} from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { authAPI } from '@/lib/api'
import { useRouter } from 'next/navigation'

const navLinks = [
  { href: '/',            label: 'Home',         icon: Home     },
  { href: '/courses',     label: 'Courses',      icon: BookOpen },
  { href: '/live-classes',label: 'Live Classes', icon: Video,   badge: 'LIVE' },
  { href: '/pricing',     label: 'Pricing',      icon: DollarSign },
]

const sidebarExtras = [
  { href: '/about',          label: 'About Us',       icon: Users,         desc: 'Our story & mission'       },
  { href: '/certifications', label: 'Certifications', icon: Award,         desc: 'AI-powered certificates'   },
  { href: '/affiliate',      label: 'Earn Money',     icon: Zap,           desc: 'Affiliate program'         },
  { href: '/mentor',         label: 'Become Mentor',  icon: GraduationCap, desc: 'Teach & earn 70% revenue' },
]

const sidebarStats = [
  { val:'50K+',  label:'Students',    color:'text-violet-400' },
  { val:'4.9★',  label:'Rating',      color:'text-amber-400'  },
  { val:'₹2Cr+', label:'Paid Out',    color:'text-green-400'  },
]

export default function Navbar() {
  const [open, setOpen]       = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user, logout }      = useAuthStore()
  const router                = useRouter()
  const pathname              = usePathname()

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
        scrolled
          ? 'border-b border-white/[0.06]'
          : 'bg-transparent'
      }`}
        style={scrolled ? { background:'rgba(4,5,10,0.92)', backdropFilter:'blur(24px)' } : {}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                style={{ background:'linear-gradient(135deg,#7c3aed,#6366f1)', boxShadow:'0 4px 20px rgba(124,58,237,0.4)' }}>
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-black gradient-text">TruLearnix</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(link => (
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
                  <Link href="/register" className="btn-primary text-sm py-2 px-5">Start Free →</Link>
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
      <div className={`sidebar-panel ${open ? 'open' : ''}`}>

        {/* Sidebar header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
          <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background:'linear-gradient(135deg,#7c3aed,#6366f1)', boxShadow:'0 4px 16px rgba(124,58,237,0.4)' }}>
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-black gradient-text">TruLearnix</span>
          </Link>
          <button onClick={() => setOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white transition-all"
            style={{ background:'rgba(255,255,255,0.06)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

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
          {sidebarStats.map((s, i) => (
            <div key={i} className="text-center py-2.5 rounded-xl" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
              <p className={`font-black text-sm ${s.color}`}>{s.val}</p>
              <p className="text-gray-600 text-[10px]">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Navigation links */}
        <div className="px-4 mt-5 space-y-1">
          <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-3 mb-2">Navigation</p>
          {navLinks.map(link => {
            const Icon = link.icon
            const active = pathname === link.href
            return (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)}
                className={`flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all ${
                  active
                    ? 'text-violet-400'
                    : 'text-gray-300 hover:text-white'
                }`}
                style={active ? { background:'rgba(124,58,237,0.12)', border:'1px solid rgba(124,58,237,0.2)' } : { background:'transparent' }}
                onMouseEnter={e => !active && ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)')}
                onMouseLeave={e => !active && ((e.currentTarget as HTMLElement).style.background = 'transparent')}
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
          {sidebarExtras.map(link => {
            const Icon = link.icon
            return (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-gray-400 hover:text-white transition-all group"
                style={{ background:'transparent' }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
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
        <div className="mx-4 mt-4">
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

        {/* Bottom actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4" style={{ background:'linear-gradient(180deg,transparent,rgba(10,12,24,1) 30%)', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
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

        {/* Bottom spacer for absolute footer */}
        <div className="h-28" />
      </div>
    </>
  )
}
