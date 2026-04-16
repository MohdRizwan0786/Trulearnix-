'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import {
  BookOpen, LayoutDashboard, Video, FileQuestion, Users,
  User, LogOut, Menu, X, Award, ShieldCheck, IndianRupee, Zap, Network, LifeBuoy,
  Kanban, CalendarDays
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { authAPI } from '@/lib/api'

const navItems = [
  { href: '/mentor/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/mentor/courses',      icon: BookOpen,        label: 'My Courses' },
  { href: '/mentor/classes',      icon: Video,           label: 'Live Classes' },
  { href: '/mentor/quizzes',      icon: FileQuestion,    label: 'Quizzes' },
  { href: '/mentor/students',     icon: Users,           label: 'Students' },
  { href: '/mentor/report-cards', icon: Award,           label: 'Report Cards' },
  { href: '/mentor/kanban',       icon: Kanban,          label: 'Kanban' },
  { href: '/mentor/calendar',     icon: CalendarDays,    label: 'Calendar' },
  { href: '/mentor/salary',       icon: IndianRupee,     label: 'Salary' },
  { href: '/mentor/kyc',          icon: ShieldCheck,     label: 'KYC' },
  { href: '/mentor/profile',      icon: User,            label: 'Profile' },
  { href: '/mentor/support',      icon: LifeBuoy,        label: 'Support' },
  { href: '/partner/dashboard',   icon: Network,         label: 'Partner Panel' },
]

const bottomNav = [
  { href: '/mentor/dashboard', icon: LayoutDashboard, label: 'Home'    },
  { href: '/mentor/courses',   icon: BookOpen,        label: 'Courses' },
  { href: '/mentor/classes',   icon: Video,           label: 'Classes' },
  { href: '/mentor/students',  icon: Users,           label: 'Students'},
  { href: '/mentor/salary',    icon: IndianRupee,     label: 'Salary'  },
]

export default function MentorLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuthStore()
  const router   = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login')
    else if (user?.role && user.role !== 'mentor') router.push(`/${user.role}`)
  }, [user])

  useEffect(() => { setSidebarOpen(false) }, [pathname])

  if (!user || user.role !== 'mentor') return null

  const isLiveRoom = /^\/mentor\/(classes|meeting-room)\/[^/]+$/.test(pathname)
  if (isLiveRoom) return <>{children}</>

  const handleLogout = async () => {
    try { await authAPI.logout() } catch {}
    logout()
    router.push('/')
  }

  const initials = user.name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() || 'M'

  return (
    <div className="flex min-h-screen bg-[#0a0a0f]">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed left-0 top-0 h-full w-64 z-40 flex flex-col transition-transform duration-300
        bg-[#0f0f1a] border-r border-white/[0.06]
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>

        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/[0.06] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-sm font-black text-white tracking-tight">TruLearnix</span>
              <p className="text-[10px] text-indigo-400 font-semibold -mt-0.5">Mentor Panel</p>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User card */}
        <div className="px-4 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
              {(user as any).avatar
                ? <img src={(user as any).avatar} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{initials}</span>
                  </div>
              }
            </div>
            <div className="min-w-0">
              <p className="font-bold text-white text-sm truncate">{user.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <p className="text-[11px] text-indigo-300 font-medium">Active Mentor</p>
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const active = pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${active
                    ? 'bg-gradient-to-r from-indigo-500/20 to-violet-500/15 text-white border border-indigo-500/25 shadow-sm'
                    : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.04]'
                  }`}>
                <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-indigo-400' : ''}`} />
                <span>{item.label}</span>
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/[0.06]">
          <button onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3.5 py-2.5 text-sm text-red-400/80 hover:text-red-400 hover:bg-red-500/8 rounded-xl transition-all">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">

        {/* Mobile topbar */}
        <header className="lg:hidden sticky top-0 z-20 bg-[#0f0f1a]/95 backdrop-blur-md border-b border-white/[0.06] px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-gray-400 hover:text-white transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-black text-sm">Mentor Panel</span>
          </div>
          <div className="w-8 h-8 rounded-xl overflow-hidden border border-white/10">
            {(user as any).avatar
              ? <img src={(user as any).avatar} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                  <span className="text-white font-bold text-[10px]">{initials}</span>
                </div>
            }
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6">{children}</main>

        {/* ── Mobile Bottom Nav ── */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-[#0f0f1a]/95 backdrop-blur-xl border-t border-white/[0.08] px-1 py-2 safe-bottom">
          <div className="flex items-center justify-around">
            {bottomNav.map(item => {
              const active = pathname.startsWith(item.href)
              return (
                <Link key={item.href} href={item.href}
                  className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    active
                      ? 'bg-gradient-to-br from-indigo-500/25 to-violet-500/20 border border-indigo-500/30'
                      : 'hover:bg-white/[0.04]'
                  }`}>
                    <item.icon className={`w-5 h-5 transition-colors ${active ? 'text-indigo-400' : 'text-gray-500'}`} />
                  </div>
                  <span className={`text-[10px] font-semibold transition-colors ${active ? 'text-indigo-400' : 'text-gray-600'}`}>
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}
