'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { authAPI } from '@/lib/api'
import Link from 'next/link'
import {
  LayoutDashboard, Users, Trophy, LogOut, Menu, X, UserCog,
  Bell, ChevronRight, CalendarCheck, Kanban, CalendarDays, ArrowDownToLine
} from 'lucide-react'

const navItems = [
  { href: '/manager/dashboard',       icon: LayoutDashboard,  label: 'Dashboard' },
  { href: '/manager/partners',        icon: Users,            label: 'My Partners' },
  { href: '/manager/emi-commissions', icon: CalendarCheck,    label: 'EMI Partnership earnings' },
  { href: '/manager/withdraw',        icon: ArrowDownToLine,  label: 'Withdraw' },
  { href: '/manager/kanban',          icon: Kanban,           label: 'Kanban' },
  { href: '/manager/calendar',        icon: CalendarDays,     label: 'Calendar' },
  { href: '/manager/leaderboard',     icon: Trophy,           label: 'Leaderboard' },
]

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuthStore()
  const router   = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login')
    else if (user?.role && !['manager', 'admin', 'superadmin'].includes(user.role)) router.push('/')
  }, [user])

  useEffect(() => { setOpen(false) }, [pathname])

  if (!user || !['manager', 'admin', 'superadmin'].includes(user.role)) return null

  if (/^\/manager\/meeting-room\/[^/]+$/.test(pathname)) return <>{children}</>

  const handleLogout = async () => {
    try { await authAPI.logout() } catch {}
    logout(); router.push('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <UserCog className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Manager Panel</p>
            <p className="text-gray-500 text-xs truncate max-w-[120px]">{user.name}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const active = pathname === item.href || (item.href !== '/manager/dashboard' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                active
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}>
              <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-emerald-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
              {item.label}
              {active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-emerald-500/60" />}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/5">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/5 transition-all">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden sm:flex w-56 bg-dark-800 border-r border-white/5 flex-col flex-shrink-0 fixed h-full z-10">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {open && (
        <div className="sm:hidden fixed inset-0 z-40 flex">
          <div className="w-56 bg-dark-800 border-r border-white/5 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <UserCog className="w-4 h-4 text-white" />
                </div>
                <p className="text-white font-bold text-sm">Manager</p>
              </div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <SidebarContent />
          </div>
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
        </div>
      )}

      {/* Main */}
      <div className="flex-1 sm:ml-56 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <div className="sm:hidden flex items-center justify-between px-4 py-3 bg-dark-800 border-b border-white/5">
          <button onClick={() => setOpen(true)} className="p-2 text-gray-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-white">Manager Panel</span>
          <div className="w-9" />
        </div>

        <main className="flex-1 p-4 sm:p-6 pb-20 sm:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-30 flex items-stretch justify-around h-16 bg-dark-800 border-t border-white/5">
        {[
          { href: '/manager/dashboard',   icon: LayoutDashboard, label: 'Home' },
          { href: '/manager/partners',    icon: Users,           label: 'Partners' },
          { href: '/manager/leaderboard', icon: Trophy,          label: 'Board' },
          { href: '/manager/kanban',      icon: Kanban,          label: 'Kanban' },
        ].map(item => {
          const active = pathname === item.href || (item.href !== '/manager/dashboard' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center gap-0.5 flex-1">
              <item.icon className={`w-5 h-5 ${active ? 'text-emerald-400' : 'text-gray-600'}`} />
              <span className={`text-[9px] font-bold ${active ? 'text-emerald-400' : 'text-gray-600'}`}>{item.label}</span>
            </Link>
          )
        })}
        <button onClick={() => setOpen(true)} className="flex flex-col items-center justify-center gap-0.5 flex-1 text-gray-600">
          <Menu className="w-5 h-5" />
          <span className="text-[9px] font-bold">More</span>
        </button>
      </nav>
    </div>
  )
}
