'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { authAPI } from '@/lib/api'
import Link from 'next/link'
import {
  LayoutDashboard, Users, ShoppingBag, Link2, IndianRupee,
  LogOut, Menu, X, Briefcase, ChevronRight, CalendarCheck,
  ShieldCheck, ArrowDownToLine, Trophy, Zap, LifeBuoy,
  Kanban, CalendarDays
} from 'lucide-react'

const navItems = [
  { href: '/sales/dashboard',      icon: LayoutDashboard,  label: 'Dashboard',       group: 'main' },
  { href: '/sales/leads',          icon: Users,            label: 'My Leads',         group: 'main' },
  { href: '/sales/orders',         icon: ShoppingBag,      label: 'Orders',           group: 'main' },
  { href: '/sales/emi',            icon: CalendarCheck,    label: 'EMI Commissions',  group: 'main' },
  { href: '/sales/kanban',         icon: Kanban,           label: 'Kanban',           group: 'tools' },
  { href: '/sales/calendar',       icon: CalendarDays,     label: 'Calendar',         group: 'tools' },
  { href: '/sales/link-generator', icon: Link2,            label: 'Link Generator',   group: 'tools' },
  { href: '/sales/earnings',       icon: IndianRupee,      label: 'Earnings',         group: 'finance' },
  { href: '/sales/achievements',   icon: Trophy,           label: 'Achievements',     group: 'finance' },
  { href: '/sales/withdraw',       icon: ArrowDownToLine,  label: 'Withdraw',         group: 'finance' },
  { href: '/sales/kyc',            icon: ShieldCheck,      label: 'KYC',              group: 'finance' },
  { href: '/sales/support',        icon: LifeBuoy,         label: 'Support',          group: 'finance' },
]

export default function SalesLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuthStore()
  const router   = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login')
    else if (user?.role && !['salesperson', 'admin', 'superadmin'].includes(user.role)) router.push('/')
  }, [user])

  useEffect(() => { setOpen(false) }, [pathname])

  if (!user || !['salesperson', 'admin', 'superadmin'].includes(user.role)) return null

  if (/^\/sales\/meeting-room\/[^/]+$/.test(pathname)) return <>{children}</>

  const handleLogout = async () => {
    try { await authAPI.logout() } catch {}
    logout(); router.push('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-4 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#2563eb,#4f46e5)' }}>
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-white font-black text-sm leading-tight">Sales Panel</p>
              <Zap className="w-3 h-3 text-blue-400" />
            </div>
            <p className="text-gray-500 text-xs truncate">{user.name}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {/* Main group */}
        <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest px-3 pt-1 pb-2">Main</p>
        {navItems.filter(i => i.group === 'main').map(item => {
          const active = pathname === item.href || (item.href !== '/sales/dashboard' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group relative ${
                active
                  ? 'text-white'
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
              style={active ? { background: 'linear-gradient(135deg,rgba(37,99,235,0.2),rgba(79,70,229,0.15))', border: '1px solid rgba(59,130,246,0.2)' } : {}}>
              {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-blue-400" />}
              <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-blue-400' : 'text-gray-600 group-hover:text-gray-300'}`} />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-3 h-3 text-blue-500/50" />}
            </Link>
          )
        })}

        {/* Tools group */}
        <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest px-3 pt-3 pb-2">Tools</p>
        {navItems.filter(i => i.group === 'tools').map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group relative ${
                active ? 'text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
              style={active ? { background: 'linear-gradient(135deg,rgba(37,99,235,0.2),rgba(79,70,229,0.15))', border: '1px solid rgba(59,130,246,0.2)' } : {}}>
              {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-blue-400" />}
              <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-blue-400' : 'text-gray-600 group-hover:text-gray-300'}`} />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-3 h-3 text-blue-500/50" />}
            </Link>
          )
        })}

        {/* Finance group */}
        <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest px-3 pt-3 pb-2">Finance</p>
        {navItems.filter(i => i.group === 'finance').map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group relative ${
                active ? 'text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
              style={active ? { background: 'linear-gradient(135deg,rgba(37,99,235,0.2),rgba(79,70,229,0.15))', border: '1px solid rgba(59,130,246,0.2)' } : {}}>
              {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-blue-400" />}
              <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-blue-400' : 'text-gray-600 group-hover:text-gray-300'}`} />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-3 h-3 text-blue-500/50" />}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4 pt-2 border-t border-white/5">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-all font-semibold">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex" style={{ background: '#0a0a0f' }}>
      {/* Desktop Sidebar */}
      <aside className="hidden sm:flex w-56 flex-col flex-shrink-0 fixed h-full z-10"
        style={{ background: 'rgba(12,12,20,0.95)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {open && (
        <div className="sm:hidden fixed inset-0 z-40 flex">
          <div className="w-64 flex flex-col shadow-2xl"
            style={{ background: 'rgba(10,10,18,0.98)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#2563eb,#4f46e5)' }}>
                  <Briefcase className="w-4 h-4 text-white" />
                </div>
                <p className="text-white font-black text-sm">Sales Panel</p>
              </div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <nav className="px-3 py-3 space-y-0.5">
                {navItems.map(item => {
                  const active = pathname === item.href || (item.href !== '/sales/dashboard' && pathname.startsWith(item.href))
                  return (
                    <Link key={item.href} href={item.href}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all ${
                        active ? 'text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'
                      }`}
                      style={active ? { background: 'linear-gradient(135deg,rgba(37,99,235,0.2),rgba(79,70,229,0.15))', border: '1px solid rgba(59,130,246,0.2)' } : {}}>
                      <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-blue-400' : 'text-gray-600'}`} />
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
            </div>
            <div className="px-3 pb-4 pt-2 border-t border-white/5">
              <button onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-all font-semibold">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
          <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 sm:ml-56 flex flex-col min-h-screen">
        {/* Mobile Top Bar */}
        <div className="sm:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3"
          style={{ background: 'rgba(10,10,18,0.95)', borderBottom: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
          <button onClick={() => setOpen(true)}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#2563eb,#4f46e5)' }}>
              <Briefcase className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-black text-white">Sales Panel</span>
          </div>
          <div className="w-9" />
        </div>

        <main className="flex-1 p-4 sm:p-6 pb-20 sm:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-30 flex items-stretch justify-around h-16"
        style={{ background: 'rgba(10,10,18,0.97)', borderTop: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)' }}>
        {[
          { href: '/sales/dashboard', icon: LayoutDashboard, label: 'Home' },
          { href: '/sales/leads',     icon: Users,           label: 'Leads' },
          { href: '/sales/orders',    icon: ShoppingBag,     label: 'Orders' },
          { href: '/sales/earnings',  icon: IndianRupee,     label: 'Earnings' },
          { href: '/sales/kanban',    icon: Kanban,          label: 'Kanban' },
        ].map(item => {
          const active = pathname === item.href || (item.href !== '/sales/dashboard' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center gap-0.5 flex-1">
              <item.icon className={`w-5 h-5 ${active ? 'text-blue-400' : 'text-gray-600'}`} />
              <span className={`text-[9px] font-bold ${active ? 'text-blue-400' : 'text-gray-600'}`}>{item.label}</span>
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
