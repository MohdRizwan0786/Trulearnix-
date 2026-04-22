'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, BookOpen, Video, Bot, Users, Award,
  FileQuestion, FileText, User, LogOut, X, Menu, Flame,
  Briefcase, Star, FolderGit2, ChevronRight, Zap, Heart,
  Bell, ArrowUpCircle, Globe, HeartHandshake, TrendingUp, Lock,
  ExternalLink, CreditCard, Sparkles, LifeBuoy
} from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { authAPI, userAPI, packageAPI } from '@/lib/api'
import Logo from '@/components/ui/Logo'
import { useQuery } from '@tanstack/react-query'

const MAIN_NAV = [
  { href: '/student/dashboard',     icon: LayoutDashboard, label: 'Dashboard',    bottom: true  },
  { href: '/student/courses',       icon: BookOpen,        label: 'My Courses',   bottom: true  },
  { href: '/student/classes',       icon: Video,           label: 'Live Classes', bottom: false },
  { href: '/student/ai-coach',      icon: Bot,             label: 'AI Coach',     bottom: true  },
  { href: '/student/community',     icon: Users,           label: 'Community',    bottom: false },
  { href: '/student/announcements', icon: Bell,            label: 'Announcements',bottom: true  },
  { href: '/student/favorites',     icon: Heart,           label: 'Favorites',    bottom: false },
]

const TOOLS_NAV = [
  { href: '/student/assignments',   icon: FileText,       label: 'Assignments' },
  { href: '/student/quizzes',       icon: FileQuestion,   label: 'Quizzes'     },
  { href: '/student/certificates',  icon: Award,          label: 'Certificates'},
  { href: '/student/report-cards',  icon: Award,          label: 'Report Cards'},
  { href: '/student/jobs',          icon: Briefcase,      label: 'Job Engine'  },
  { href: '/student/brand',         icon: Star,           label: 'Personal Brand'},
  { href: '/student/projects',      icon: FolderGit2,     label: 'Projects'    },
  { href: '/student/freelance',     icon: Briefcase,      label: 'Freelance'   },
  { href: '/student/emi',           icon: CreditCard,     label: 'My EMI'      },
  { href: '/student/support',       icon: LifeBuoy,       label: 'Support'     },
  { href: '/student/profile',       icon: User,           label: 'Profile'     },
]

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; glow: string }> = {
  free:    { label: 'Free',    color: '#9ca3af', bg: 'rgba(156,163,175,0.12)', glow: 'rgba(156,163,175,0.15)' },
  starter: { label: 'Starter', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  glow: 'rgba(59,130,246,0.2)' },
  pro:     { label: 'Pro',     color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', glow: 'rgba(139,92,246,0.25)' },
  elite:   { label: 'Elite',   color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  glow: 'rgba(245,158,11,0.25)' },
  supreme: { label: 'Supreme', color: '#f472b6', bg: 'rgba(244,114,182,0.12)', glow: 'rgba(236,72,153,0.25)' },
}

function NavLink({ href, icon: Icon, label, badge, active, onClick }: {
  href: string; icon: any; label: string; badge?: number; active: boolean; onClick?: () => void
}) {
  return (
    <Link href={href} onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
        active
          ? 'text-white'
          : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
      }`}
      style={active ? {
        background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.15))',
        border: '1px solid rgba(99,102,241,0.35)',
        boxShadow: '0 4px 15px rgba(99,102,241,0.15)'
      } : {}}>
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full" style={{ background: 'linear-gradient(180deg, #818cf8, #a78bfa)' }} />
      )}
      <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${active ? 'text-indigo-400' : 'group-hover:text-indigo-400'}`} />
      <span className="flex-1 truncate">{label}</span>
      {badge ? (
        <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-black flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          {badge > 9 ? '9+' : badge}
        </span>
      ) : active ? (
        <ChevronRight className="w-3 h-3 text-indigo-400/60 flex-shrink-0" />
      ) : null}
    </Link>
  )
}

function SidebarInner({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  const tier = (user as any)?.packageTier || 'free'
  const tc = TIER_CONFIG[tier] || TIER_CONFIG.free
  const isLocked = tier === 'free' && !(user as any)?.isAffiliate && !((user as any)?.enrollmentCount > 0)
  const { data: pkgs } = useQuery({
    queryKey: ['packages'],
    queryFn: () => packageAPI.getAll().then(r => r.data.packages),
    staleTime: 10 * 60 * 1000,
  })
  const tierDisplayName = pkgs?.find((p: any) => p.tier === tier)?.name || tc.label

  const { data: annData } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => userAPI.announcements().then(r => r.data),
    staleTime: 5 * 60 * 1000,
  })
  const annCount = annData?.announcements?.length || 0

  const isActive = (href: string) => !!pathname?.startsWith(href)

  const handleLogout = async () => {
    try { await authAPI.logout() } catch {}
    logout()
    router.push('/')
  }

  const close = () => onClose?.()
  const streak = (user as any)?.streak || 0
  const xp = (user as any)?.xpPoints || 0

  return (
    <>
      <style>{`
        @keyframes streakPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        .streak-icon { animation: streakPulse 2s ease-in-out infinite; }
      `}</style>
      <div className="flex flex-col h-full overflow-hidden">

        {/* Logo + close */}
        <div className="px-4 py-4 flex items-center justify-between flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <Logo size="sm" href="/" />
          {onClose && (
            <button onClick={close} className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick links */}
        <div className="mx-3 mt-3 flex gap-2 flex-shrink-0">
          <a href="/"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-gray-400 hover:text-white transition-all text-xs font-medium group"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Globe className="w-3.5 h-3.5 group-hover:text-indigo-400 transition-colors" />
            <span>Website</span>
          </a>
          <Link href="/partner/dashboard" onClick={close}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-indigo-400 hover:text-indigo-300 transition-all text-xs font-medium"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Partner</span>
          </Link>
        </div>

        {/* User Card — Premium */}
        <div className="mx-3 mt-3 rounded-2xl p-3.5 flex-shrink-0 relative overflow-hidden" style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))',
          border: '1px solid rgba(99,102,241,0.2)',
          boxShadow: `0 8px 25px ${tc.glow}`
        }}>
          <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl pointer-events-none" style={{ background: tc.glow }} />
          <div className="relative flex items-center gap-3">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-xl overflow-hidden" style={{
                boxShadow: `0 0 0 2px ${tc.color}50, 0 4px 15px ${tc.glow}`
              }}>
                {(user as any)?.avatar
                  ? <img src={(user as any).avatar} className="w-full h-full object-cover" alt="" />
                  : <div className="w-full h-full flex items-center justify-center text-lg font-black text-white"
                      style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                      {user?.name?.[0]?.toUpperCase()}
                    </div>
                }
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2"
                style={{ borderColor: '#0d0d14' }} />
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="font-bold text-white text-sm truncate leading-tight">{user?.name}</p>
              {/* Tier badge */}
              <div className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded-full text-[10px] font-black uppercase tracking-wider"
                style={{ background: tc.bg, color: tc.color, border: `1px solid ${tc.color}30` }}>
                <Sparkles className="w-2.5 h-2.5" />
                {tierDisplayName}
              </div>
            </div>

            <Link href="/student/upgrade" onClick={close}
              className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/10 transition-colors" title="Upgrade plan">
              <ArrowUpCircle className="w-4 h-4 text-indigo-400" />
            </Link>
          </div>

          {/* Streak + XP row */}
          <div className="relative mt-3 flex items-center gap-3">
            <div className="flex items-center gap-1.5 flex-1 rounded-xl py-2 px-2.5"
              style={{ background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.2)' }}>
              <Flame className={`w-3.5 h-3.5 text-orange-400 ${streak > 0 ? 'streak-icon' : ''}`} />
              <span className="text-orange-400 font-black text-sm">{streak}</span>
              <span className="text-orange-400/50 text-[10px]">day</span>
            </div>
            <div className="flex items-center gap-1.5 flex-1 rounded-xl py-2 px-2.5"
              style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-indigo-400 font-black text-sm">{xp}</span>
              <span className="text-indigo-400/50 text-[10px]">XP</span>
            </div>
          </div>
        </div>

        {/* Nav scrollable */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          {isLocked && (
            <Link href="/packages" onClick={close}
              className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl text-amber-300 text-xs font-medium hover:opacity-80 transition-opacity"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <Lock className="w-3 h-3 flex-shrink-0" />
              <span className="flex-1">Purchase to unlock dashboard</span>
            </Link>
          )}

          <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest px-3 py-1.5">Learn</p>
          {MAIN_NAV.map(item => (
            isLocked ? (
              <div key={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 cursor-not-allowed select-none">
                <item.icon className="w-4 h-4 flex-shrink-0 opacity-30" />
                <span className="flex-1 opacity-30">{item.label}</span>
                <Lock className="w-3 h-3 opacity-20 flex-shrink-0" />
              </div>
            ) : (
              <NavLink
                key={item.href}
                {...item}
                badge={item.href === '/student/announcements' && annCount > 0 ? annCount : undefined}
                active={isActive(item.href)}
                onClick={close}
              />
            )
          ))}

          <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest px-3 py-1.5 mt-2">Tools</p>
          {TOOLS_NAV.map(item => {
            const freeAllowed = item.href.startsWith('/student/profile') || item.href.startsWith('/student/upgrade')
            if (isLocked && !freeAllowed) {
              return (
                <div key={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 cursor-not-allowed select-none">
                  <item.icon className="w-4 h-4 flex-shrink-0 opacity-30" />
                  <span className="flex-1 opacity-30">{item.label}</span>
                  <Lock className="w-3 h-3 opacity-20 flex-shrink-0" />
                </div>
              )
            }
            return <NavLink key={item.href} {...item} active={isActive(item.href)} onClick={close} />
          })}

          <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest px-3 py-1.5 mt-2">Earn</p>
          {isLocked ? (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 cursor-not-allowed select-none">
              <TrendingUp className="w-4 h-4 flex-shrink-0 opacity-30" />
              <span className="flex-1 opacity-30">Earn & Grow</span>
              <Lock className="w-3 h-3 opacity-20 flex-shrink-0" />
            </div>
          ) : (
            <Link href="/student/affiliate" onClick={close}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive('/student/affiliate') ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
              style={isActive('/student/affiliate') ? {
                background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.15))',
                border: '1px solid rgba(99,102,241,0.35)'
              } : {}}>
              <TrendingUp className="w-4 h-4 flex-shrink-0 text-green-400" />
              <span className="flex-1">Earn & Grow</span>
              {!(user as any)?.isAffiliate && <Lock className="w-3 h-3 text-amber-400/60 flex-shrink-0" />}
            </Link>
          )}

          {tier === 'free' && (
            <Link href="/student/upgrade" onClick={close}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all mt-2 text-indigo-300 hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.12))',
                border: '1px solid rgba(99,102,241,0.3)',
                boxShadow: '0 4px 15px rgba(99,102,241,0.1)'
              }}>
              <ArrowUpCircle className="w-4 h-4 flex-shrink-0 text-indigo-400" />
              <span className="flex-1">Upgrade Plan</span>
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider"
                style={{ background: 'rgba(99,102,241,0.3)', color: '#a5b4fc' }}>
                PRO
              </span>
            </Link>
          )}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-4 pt-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-red-400/70 hover:text-red-400 hover:bg-red-500/8 rounded-xl transition-all">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  )
}

function BottomNavItem({ href, icon: Icon, label, active, badge }: {
  href: string; icon: any; label: string; active: boolean; badge?: number
}) {
  return (
    <Link href={href}
      className={`flex flex-col items-center gap-0.5 py-2 px-2 rounded-xl transition-all relative ${
        active ? 'text-indigo-400' : 'text-gray-500 hover:text-gray-300'
      }`}>
      {active && (
        <div className="absolute inset-0 rounded-xl" style={{ background: 'rgba(99,102,241,0.12)' }} />
      )}
      <div className="relative z-10">
        <Icon className={`w-5 h-5 ${active ? 'scale-110' : ''} transition-transform`} />
        {badge ? (
          <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 rounded-full text-white text-[9px] font-black flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            {badge > 9 ? '9+' : badge}
          </span>
        ) : null}
      </div>
      <span className="text-[9px] font-bold truncate max-w-[44px] text-center leading-none mt-0.5 relative z-10">{label}</span>
      {active && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-400" />}
    </Link>
  )
}

export default function LearnerSidebar() {
  const { user } = useAuthStore()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => { setMobileOpen(false) }, [pathname])

  const { data: annData } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => userAPI.announcements().then(r => r.data),
    staleTime: 5 * 60 * 1000,
  })
  const annCount = annData?.announcements?.length || 0
  const isActive = (href: string) => !!pathname?.startsWith(href)
  const bottomNav = MAIN_NAV.filter(i => i.bottom)

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 flex-col z-40"
        style={{ background: 'rgba(9,9,16,0.98)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
        <SidebarInner />
      </aside>

      {/* Mobile Top Bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center px-4 gap-3"
        style={{ background: 'rgba(9,9,16,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <button onClick={() => setMobileOpen(true)}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-colors flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.05)' }}>
          <Menu className="w-5 h-5" />
        </button>

        <Logo size="sm" href="/" className="flex-1" />

        <div className="flex items-center gap-2">
          <a href="/" className="hidden xs:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-gray-400 hover:text-white transition-all text-xs font-medium"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Globe className="w-3 h-3" />
            <span className="hidden sm:inline">Website</span>
          </a>
          <Link href="/partner/dashboard"
            className="hidden xs:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-indigo-400 transition-all text-xs font-medium"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <HeartHandshake className="w-3 h-3" />
            <span className="hidden sm:inline">Partner</span>
          </Link>
          <div className="flex items-center gap-1 text-orange-400 text-xs font-bold">
            <Flame className="w-4 h-4" />
            <span>{(user as any)?.streak || 0}</span>
          </div>
          <div className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            {(user as any)?.avatar
              ? <img src={(user as any).avatar} className="w-full h-full object-cover" alt="" />
              : <div className="w-full h-full flex items-center justify-center text-white font-black text-xs">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
            }
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <>
          <div className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={() => setMobileOpen(false)} />
          <aside className="lg:hidden fixed left-0 top-0 h-full w-72 z-50 shadow-2xl shadow-black/60"
            style={{ background: 'rgba(9,9,16,0.99)' }}>
            <SidebarInner onClose={() => setMobileOpen(false)} />
          </aside>
        </>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch justify-around px-1 safe-area-bottom"
        style={{ background: 'rgba(9,9,16,0.97)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        {bottomNav.map(item => (
          <BottomNavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            active={isActive(item.href)}
            badge={item.href === '/student/announcements' ? annCount : undefined}
          />
        ))}
        <button
          onClick={() => setMobileOpen(true)}
          className="flex flex-col items-center gap-0.5 py-2 px-2 text-gray-500 hover:text-gray-300 rounded-xl transition-colors">
          <Menu className="w-5 h-5" />
          <span className="text-[9px] font-bold mt-0.5">More</span>
        </button>
      </nav>
    </>
  )
}
