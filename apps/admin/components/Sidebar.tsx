'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useRef, useEffect } from 'react'
import Cookies from 'js-cookie'
import type { UserSession } from './AdminLayout'
import {
  LayoutDashboard, BarChart2, Users, Package, DollarSign, Coins,
  ShoppingCart, Contact, BookOpen, Video, FileText, LifeBuoy, PlayCircle,
  Bell, LogOut, ChevronRight, Zap, Kanban, CalendarDays,
  Tag, Target, FolderOpen, AlarmClock, UserCog, Shield,
  Trophy, MousePointerClick, TrendingUp, Layers, PanelTop,
  Briefcase, UserCheck, UserX, GraduationCap, MessageSquare, ShoppingBag, UserPlus,
  ClipboardList, HeartHandshake, CreditCard, ShieldCheck, Award, Megaphone, IndianRupee,
  Calendar, Flag, Radio, Settings, Pencil,
} from 'lucide-react'

// permission key matches what's stored in localStorage adminPermissions
const navItems = [
  { label: 'NOVA AI',         href: '/nova',         icon: Zap,             perm: 'dashboard', highlight: true },
  { label: 'Dashboard',       href: '/dashboard',    icon: LayoutDashboard, perm: 'dashboard' },
  { label: 'Analytics',       href: '/analytics',    icon: BarChart2,       perm: 'analytics' },
  { label: 'Users',           href: '/users',        icon: Users,           perm: 'users' },
  {
    label: 'Learners', icon: GraduationCap, perm: 'learners', children: [
      { label: 'All Learners',  href: '/learners',               icon: Users,      perm: 'learners' },
      { label: 'Purchased',     href: '/learners?tab=purchased', icon: ShoppingBag,perm: 'learners' },
      { label: 'Free / Unpaid', href: '/learners?tab=free',      icon: UserX,      perm: 'learners' },
    ]
  },
  { label: 'Partners',        href: '/partners',         icon: HeartHandshake, perm: 'partners' },
  { label: 'Partner Training',href: '/partner-training', icon: GraduationCap,  perm: 'partner-training' },
  { label: 'Qualifications',  href: '/qualifications',   icon: Trophy,         perm: 'qualifications' },
  { label: 'Sales Team',      href: '/sales-team',   icon: TrendingUp,           perm: 'sales-team' },
  { label: 'Employees',       href: '/employees',    icon: UserPlus,        perm: 'employees' },
  { label: 'Packages',        href: '/packages',     icon: Package,         perm: 'packages' },
  {
    label: 'Finance', icon: DollarSign, perm: 'finance', children: [
      { label: 'Commissions', href: '/finance?tab=commissions', icon: Coins,        perm: 'finance' },
      { label: 'Withdrawals', href: '/withdrawals',              icon: DollarSign,   perm: 'withdrawals' },
      { label: 'Purchases',   href: '/finance?tab=purchases',   icon: ShoppingCart, perm: 'finance' },
      { label: 'EMI / Installments', href: '/emi',              icon: CreditCard,   perm: 'emi' },
    ]
  },
  { label: 'Reports',         href: '/reports',      icon: ClipboardList,   perm: 'reports' },
  { label: 'Marketing',       href: '/marketing',    icon: MessageSquare,   perm: 'marketing' },
  { label: 'CRM',             href: '/crm',          icon: Contact,         perm: 'crm' },
  { label: 'Mentors',         href: '/mentors',      icon: GraduationCap,   perm: 'mentors' },
  { label: 'Attendance',      href: '/attendance',       icon: Calendar,    perm: 'attendance' },
  { label: 'Holidays',        href: '/holidays',         icon: Flag,        perm: 'holidays' },
  { label: 'Mentor Salary',   href: '/mentor-salary',    icon: IndianRupee, perm: 'mentor-salary' },
  { label: 'Employee Salary', href: '/employee-salary',  icon: Briefcase,   perm: 'employee-salary' },
  { label: 'Courses',         href: '/courses',      icon: BookOpen,        perm: 'courses' },
  {
    label: 'Live Classes', icon: Video, perm: 'live-classes', children: [
      { label: 'All Classes',  href: '/live-classes', icon: Video,       perm: 'live-classes' },
      { label: 'Recordings',   href: '/recordings',   icon: PlayCircle,  perm: 'recordings' },
      { label: 'Webinars',     href: '/webinars',     icon: Radio,       perm: 'webinars' },
      { label: 'Air Drawer',   href: '/air-drawer',   icon: Pencil,      perm: 'live-classes' },
    ]
  },
  { label: 'Blog',            href: '/blog',         icon: FileText,        perm: 'blog' },
  { label: 'Announcements',   href: '/announcements',icon: Megaphone,       perm: 'announcements' },
  { label: 'Support',         href: '/support',      icon: LifeBuoy,        perm: 'support' },
  { label: 'Coupons',         href: '/coupons',      icon: Tag,             perm: 'coupons' },
  { label: 'Notifications',   href: '/notifications',icon: Bell,            perm: 'notifications' },
  { label: 'Popups',          href: '/popups',       icon: Layers,          perm: 'popups' },
  { label: 'Website Content', href: '/content',      icon: PanelTop,        perm: 'content' },
  {
    label: 'Operations', icon: Kanban, perm: 'kanban', children: [
      { label: 'Kanban',    href: '/kanban',    icon: Kanban,      perm: 'kanban' },
      { label: 'Calendar',  href: '/calendar',  icon: CalendarDays,perm: 'calendar' },
      { label: 'Reminders', href: '/reminders', icon: AlarmClock,  perm: 'reminders' },
    ]
  },
  {
    label: 'Growth', icon: TrendingUp, perm: 'goals', children: [
      { label: 'Goals & OKR',  href: '/goals',        icon: Target,            perm: 'goals' },
      { label: 'Funnel',       href: '/funnel',       icon: TrendingUp,        perm: 'funnel' },
      { label: 'Ads Tracking', href: '/ads-tracking', icon: MousePointerClick, perm: 'ads-tracking' },
    ]
  },
  {
    label: 'TruLancer', icon: Zap, perm: 'trulance', children: [
      { label: 'Projects',    href: '/trulance/projects',    icon: Briefcase, perm: 'trulance' },
      { label: 'Freelancers', href: '/trulance/freelancers', icon: UserCheck, perm: 'trulance' },
      { label: 'Platform Jobs', href: '/trulance/jobs',     icon: Briefcase,  perm: 'trulance' },
    ]
  },
  { label: 'Study Materials', href: '/materials',    icon: FolderOpen, perm: 'materials' },
  { label: 'Report Cards',    href: '/report-cards', icon: Award,      perm: 'report-cards' },
  { label: 'Achievements',    href: '/achievements', icon: Trophy,     perm: 'achievements' },
  { label: 'KYC Review',      href: '/kyc',           icon: ShieldCheck, perm: 'kyc' },
  { label: 'HR Team',         href: '/hr',            icon: UserCog,    perm: 'hr' },
  { label: 'Security',        href: '/security',     icon: Shield,     perm: 'security' },
  { label: 'Settings',        href: '/settings',     icon: Settings,   perm: 'superadmin' },
]

export default function Sidebar({ session }: { session: UserSession }) {
  const pathname = usePathname()
  const router = useRouter()
  const navRef = useRef<HTMLElement>(null)

  // Restore scroll position on mount / route change
  useEffect(() => {
    const saved = sessionStorage.getItem('sidebar-scroll')
    if (saved && navRef.current) navRef.current.scrollTop = parseInt(saved)
  }, [pathname])

  const handleNavScroll = () => {
    if (navRef.current) sessionStorage.setItem('sidebar-scroll', String(navRef.current.scrollTop))
  }

  const adminName = session.name || 'Admin'
  const adminRole = session.role || 'superadmin'
  const adminDept = session.dept || ''

  // superadmin and admin always get full access
  const isSuperUser = ['superadmin', 'admin'].includes(adminRole)
  const permissions: string[] = isSuperUser ? ['*'] : (session.permissions || [])

  const hasAccess = (perm?: string) => {
    if (!perm) return true
    if (isSuperUser || permissions.includes('*')) return true
    return permissions.includes(perm)
  }

  const logout = () => {
    Cookies.remove('adminToken')
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminToken')
      localStorage.removeItem('adminName')
      localStorage.removeItem('adminRole')
      localStorage.removeItem('adminDept')
      localStorage.removeItem('adminPermissions')
    }
    router.push('/login')
  }

  const isActive = (href: string) => {
    const base = href.split('?')[0]
    return pathname === base || pathname.startsWith(base + '/')
  }

  // Department badge colors
  const deptColors: Record<string, string> = {
    hr: 'text-pink-400', sales: 'text-emerald-400', marketing: 'text-orange-400',
    content: 'text-blue-400', finance: 'text-amber-400', operations: 'text-violet-400',
    support: 'text-cyan-400', tech: 'text-indigo-400', general: 'text-gray-400',
  }
  const deptColor = deptColors[adminDept] || 'text-gray-400'

  return (
    <aside className="w-64 h-screen bg-slate-900 border-r border-white/10 flex flex-col fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <Image src="/logo.png" alt="TruLearnix" width={145} height={36} className="object-contain" style={{ height: 36, width: 'auto' }} priority />
          <span className="text-[10px] text-violet-400 font-medium bg-violet-500/20 px-1.5 py-0.5 rounded-full flex-shrink-0">Admin v2.0</span>
        </div>
      </div>

      {/* Nav */}
      <nav ref={navRef} onScroll={handleNavScroll} className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          if (!hasAccess(item.perm)) return null

          if (item.children) {
            const visibleChildren = item.children.filter(c => hasAccess(c.perm))
            if (!visibleChildren.length) return null
            const anyActive = visibleChildren.some(c => isActive(c.href.split('?')[0])) || (item.href ? isActive(item.href) : false)
            return (
              <div key={item.label}>
                {item.href ? (
                  <Link href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${anyActive ? 'text-violet-400 bg-violet-600/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                ) : (
                  <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium cursor-default ${anyActive ? 'text-violet-400' : 'text-gray-400'}`}>
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                )}
                <div className="ml-4 mt-1 space-y-1 border-l border-white/10 pl-3">
                  {visibleChildren.map(child => {
                    const active = isActive(child.href.split('?')[0])
                    return (
                      <Link key={child.href} href={child.href}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${active ? 'bg-violet-600/20 text-violet-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                        <child.icon className="w-3.5 h-3.5 flex-shrink-0" />
                        {child.label}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          }

          const active = isActive(item.href!)
          if ((item as any).highlight) {
            return (
              <Link key={item.href} href={item.href!}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all mb-1
                  ${active
                    ? 'bg-gradient-to-r from-violet-600/40 to-cyan-600/20 text-white border border-violet-500/50'
                    : 'bg-gradient-to-r from-violet-600/20 to-cyan-600/10 text-violet-300 hover:text-white hover:from-violet-600/30 hover:to-cyan-600/20 border border-violet-500/20'
                  }`}>
                <item.icon className="w-4 h-4 flex-shrink-0 text-cyan-400" />
                <span className="flex-1">{item.label}</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-violet-500/30 text-violet-300 rounded-full">AI</span>
              </Link>
            )
          }
          return (
            <Link key={item.href} href={item.href!}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${active ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User info + logout */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 bg-violet-500/30 rounded-full flex items-center justify-center">
            <span className="text-violet-300 font-bold text-xs">{adminName[0]?.toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{adminName}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-gray-500 text-[10px] capitalize">{adminRole}</span>
              {adminDept && <span className={`text-[10px] font-medium capitalize ${deptColor}`}>· {adminDept}</span>}
            </div>
          </div>
        </div>
        {!isSuperUser && permissions.length > 0 && (
          <div className="mx-3 mb-2 px-2.5 py-1.5 bg-slate-800 rounded-lg border border-white/5">
            <p className="text-gray-500 text-[10px]">{permissions.length} module{permissions.length !== 1 ? 's' : ''} accessible</p>
          </div>
        )}
        <button onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors">
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  )
}
