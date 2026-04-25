'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { packageAPI } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import {
  LayoutDashboard, TrendingUp, Trophy, Network, Users,
  GraduationCap, ShieldCheck, Link2, UserCheck, Star,
  Award, ChevronRight, LogOut, Menu, X, Globe, BookOpen,
  Flame, Coins, Bell, ChevronDown, CreditCard, ArrowDownToLine, LifeBuoy
} from 'lucide-react'

const navItems = [
  { href: '/partner/dashboard',      icon: LayoutDashboard, label: 'Dashboard',        desc: 'Overview & Stats' },
  { href: '/partner/earnings',       icon: TrendingUp,      label: 'Earnings',          desc: 'Income & Analytics' },
  { href: '/partner/emi',            icon: CreditCard,      label: 'EMI Partnership earnings',   desc: 'Installment Earnings' },
  { href: '/partner/withdraw',       icon: ArrowDownToLine, label: 'Withdraw',           desc: 'Request Payout' },
  { href: '/partner/leaderboard',    icon: Trophy,          label: 'Leaderboard',        desc: 'Top Performers' },
  { href: '/partner/m-type',         icon: Network,         label: 'M-Type Tree',        desc: 'Your Network' },
  { href: '/partner/crm',            icon: Users,           label: 'CRM',                desc: 'Lead Management' },
  { href: '/partner/training',       icon: GraduationCap,   label: 'Training',           desc: '10-Day Program' },
  { href: '/partner/kyc',            icon: ShieldCheck,     label: 'KYC',                desc: 'Verification' },
  { href: '/partner/link-generator', icon: Link2,           label: 'Link Generator',     desc: 'Partner Links' },
  { href: '/partner/referrals',      icon: UserCheck,       label: 'Referrals',          desc: 'Your Network' },
  { href: '/partner/qualification',  icon: Star,            label: 'Qualification',      desc: 'Milestones' },
  { href: '/partner/achievements',   icon: Award,           label: 'Achievements',       desc: 'Badges & Posters' },
  { href: '/partner/support',        icon: LifeBuoy,        label: 'Support',            desc: 'Raise a Ticket' },
]

const mobileNav = [
  { href: '/partner/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/partner/earnings', icon: TrendingUp, label: 'Earnings' },
  { href: '/partner/leaderboard', icon: Trophy, label: 'Board' },
  { href: '/partner/referrals', icon: UserCheck, label: 'Referrals' },
  { href: '/partner/crm', icon: Users, label: 'CRM' },
]

export default function PartnerSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setDrawerOpen(false) }, [pathname])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setDrawerOpen(false)
      }
    }
    if (drawerOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [drawerOpen])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const { data: pkgs } = useQuery({
    queryKey: ['packages'],
    queryFn: () => packageAPI.getAll().then(r => r.data.packages),
    staleTime: 10 * 60 * 1000,
  })
  const tierKey = user?.packageTier || 'free'
  const tierDisplayName = pkgs?.find((p: any) => p.tier === tierKey)?.name || tierKey

  const tierColors: Record<string, string> = {
    free: 'from-gray-500 to-gray-600',
    starter: 'from-blue-500 to-blue-600',
    pro: 'from-purple-500 to-purple-600',
    elite: 'from-amber-500 to-orange-500',
    supreme: 'from-rose-500 to-pink-600',
  }
  const tierGrad = tierColors[tierKey]

  const kycStatus = user?.kyc?.status
  const kycBadge = kycStatus === 'verified' ? '✓' : kycStatus === 'submitted' ? '⏳' : kycStatus === 'rejected' ? '✗' : '!'

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-72 bg-dark-900 border-r border-dark-700 z-40 overflow-y-auto">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-dark-700">
          <Image src="/logo.png" alt="TruLearnix" width={145} height={36} className="object-contain" style={{ height: 36, width: 'auto' }} priority />
          <p className="text-violet-400 text-xs mt-1.5">Partner Panel</p>
        </div>

        {/* Quick links */}
        <div className="px-4 py-3 border-b border-dark-700 flex gap-2">
          <Link href="https://trulearnix.com" target="_blank" className="flex items-center gap-1.5 text-xs text-dark-300 hover:text-white bg-dark-800 hover:bg-dark-700 px-3 py-1.5 rounded-lg transition-all">
            <Globe className="w-3.5 h-3.5" /> Website
          </Link>
          <Link href="/student/dashboard" className="flex items-center gap-1.5 text-xs text-dark-300 hover:text-white bg-dark-800 hover:bg-dark-700 px-3 py-1.5 rounded-lg transition-all">
            <BookOpen className="w-3.5 h-3.5" /> Learn
          </Link>
        </div>

        {/* User Card */}
        <div className="mx-4 my-4 rounded-xl bg-dark-800 border border-dark-700 overflow-hidden">
          <div className={`h-1.5 w-full bg-gradient-to-r ${tierGrad}`} />
          <div className="p-3 flex items-center gap-3">
            <div className="relative">
              {user?.avatar
                ? <img src={user.avatar} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-dark-600" />
                : <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${tierGrad} flex items-center justify-center text-white font-bold text-sm`}>{user?.name?.[0]?.toUpperCase()}</div>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${tierGrad} text-white font-medium`}>{tierDisplayName}</span>
                <span className="text-dark-400 text-xs flex items-center gap-0.5"><Flame className="w-3 h-3 text-orange-400" />{user?.streak || 0}</span>
              </div>
            </div>
          </div>
          <div className="px-3 pb-3 flex gap-2 text-xs text-dark-400">
            <span className="flex items-center gap-1"><Coins className="w-3 h-3 text-yellow-400" />₹{(user?.wallet || 0).toLocaleString()}</span>
            <span className="text-dark-600">•</span>
            <span>Code: <span className="text-violet-400 font-mono">{user?.affiliateCode || '—'}</span></span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-0.5">
          {navItems.map(({ href, icon: Icon, label, desc }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            const isKyc = href === '/partner/kyc'
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${active ? 'bg-gradient-to-r from-violet-600/20 to-purple-600/10 border border-violet-500/30 text-white' : 'text-dark-300 hover:text-white hover:bg-dark-800'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${active ? 'bg-violet-600 shadow-lg shadow-violet-900/50' : 'bg-dark-700 group-hover:bg-dark-600'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${active ? 'text-white' : ''}`}>{label}</p>
                  <p className="text-xs text-dark-500 truncate">{desc}</p>
                </div>
                {isKyc && (
                  <span className={`text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold ${kycStatus === 'verified' ? 'bg-green-600 text-white' : kycStatus === 'submitted' ? 'bg-yellow-600 text-white' : kycStatus === 'rejected' ? 'bg-red-600 text-white' : 'bg-dark-600 text-dark-300'}`}>{kycBadge}</span>
                )}
                {active && <ChevronRight className="w-3 h-3 text-violet-400 flex-shrink-0" />}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-dark-700 mt-2">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-dark-300 hover:text-red-400 hover:bg-red-900/20 transition-all group">
            <div className="w-8 h-8 rounded-lg bg-dark-700 group-hover:bg-red-900/30 flex items-center justify-center">
              <LogOut className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile Top Bar ── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-dark-900 border-b border-dark-700 flex items-center px-4 gap-3">
        <button onClick={() => setDrawerOpen(true)} className="w-9 h-9 rounded-lg bg-dark-800 flex items-center justify-center text-white">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center flex-1">
          <Image src="/logo.png" alt="TruLearnix" width={145} height={36} className="object-contain" style={{ height: 36, width: 'auto' }} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-dark-400 flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-orange-400" />{user?.streak || 0}</span>
          {user?.avatar
            ? <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
            : <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${tierGrad} flex items-center justify-center text-white text-xs font-bold`}>{user?.name?.[0]?.toUpperCase()}</div>
          }
        </div>
      </header>

      {/* ── Mobile Drawer ── */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div ref={drawerRef} className="relative w-80 max-w-[85vw] bg-dark-900 h-full flex flex-col overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-dark-700">
              <div className="flex items-center">
                <Image src="/logo.png" alt="TruLearnix" width={145} height={36} className="object-contain" style={{ height: 36, width: 'auto' }} />
              </div>
              <button onClick={() => setDrawerOpen(false)} className="w-8 h-8 rounded-lg bg-dark-800 flex items-center justify-center text-dark-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* User */}
            <div className="mx-4 my-3 rounded-xl bg-dark-800 border border-dark-700 overflow-hidden">
              <div className={`h-1 w-full bg-gradient-to-r ${tierGrad}`} />
              <div className="p-3 flex items-center gap-3">
                {user?.avatar
                  ? <img src={user.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                  : <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${tierGrad} flex items-center justify-center text-white font-bold`}>{user?.name?.[0]?.toUpperCase()}</div>
                }
                <div>
                  <p className="text-white font-semibold text-sm">{user?.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${tierGrad} text-white font-medium`}>{tierDisplayName}</span>
                </div>
              </div>
            </div>

            {/* Quick links */}
            <div className="px-4 mb-3 flex gap-2">
              <Link href="https://trulearnix.com" target="_blank" onClick={() => setDrawerOpen(false)} className="flex items-center gap-1 text-xs text-dark-300 hover:text-white bg-dark-800 px-3 py-2 rounded-lg flex-1 justify-center">
                <Globe className="w-3.5 h-3.5" /> Website
              </Link>
              <Link href="/student/dashboard" onClick={() => setDrawerOpen(false)} className="flex items-center gap-1 text-xs text-dark-300 hover:text-white bg-dark-800 px-3 py-2 rounded-lg flex-1 justify-center">
                <BookOpen className="w-3.5 h-3.5" /> Learn
              </Link>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 space-y-0.5">
              {navItems.map(({ href, icon: Icon, label, desc }) => {
                const active = pathname === href || pathname.startsWith(href + '/')
                return (
                  <Link key={href} href={href} onClick={() => setDrawerOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${active ? 'bg-violet-600/20 border border-violet-500/30 text-white' : 'text-dark-300'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${active ? 'bg-violet-600' : 'bg-dark-700'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-dark-500">{desc}</p>
                    </div>
                  </Link>
                )
              })}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-dark-700">
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-dark-300 hover:text-red-400 hover:bg-red-900/20 transition-all">
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile Bottom Nav ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-dark-900 border-t border-dark-700">
        <div className="flex items-center justify-around h-16">
          {mobileNav.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link key={href} href={href} className="flex flex-col items-center gap-1 px-2 py-1">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${active ? 'bg-violet-600 shadow-lg shadow-violet-900/50' : 'bg-transparent'}`}>
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-dark-400'}`} />
                </div>
                <span className={`text-[10px] ${active ? 'text-violet-400 font-semibold' : 'text-dark-500'}`}>{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
