'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BookOpen, Video, Award, Wallet, TrendingUp, Bot, Briefcase, Star, FileQuestion, LogOut, Lock, User, FolderGit2, FileText, X, Bell, LifeBuoy } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { authAPI } from '@/lib/api'
import { useRouter } from 'next/navigation'
import Logo from '@/components/ui/Logo'

export default function StudentSidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const isAffiliate = (user as any)?.isAffiliate

  const navItems = [
    { href: '/student/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/student/courses',       icon: BookOpen,        label: 'My Courses' },
    { href: '/student/classes',       icon: Video,           label: 'Live Classes' },
    { href: '/student/ai-coach',      icon: Bot,             label: 'AI Coach' },
    { href: '/student/announcements', icon: Bell,            label: 'Announcements' },
    { href: '/student/jobs',          icon: Briefcase,       label: 'Job Engine' },
    { href: '/student/brand',         icon: Star,            label: 'Personal Brand' },
    { href: '/student/quizzes',       icon: FileQuestion,    label: 'Quizzes' },
    { href: '/student/certificates',  icon: Award,           label: 'Certificates' },
    { href: '/student/wallet',        icon: Wallet,          label: 'Wallet' },
    { href: '/student/assignments',   icon: FileText,        label: 'Assignments' },
    { href: '/student/projects',      icon: FolderGit2,      label: 'Projects' },
    { href: '/student/freelance',     icon: Briefcase,       label: 'Freelance' },
    { href: '/student/support',       icon: LifeBuoy,        label: 'Support' },
    { href: '/student/profile',       icon: User,            label: 'Profile' },
  ]

  const handleLogout = async () => {
    try { await authAPI.logout() } catch {}
    logout()
    router.push('/')
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-dark-800 border-r border-white/5 flex flex-col z-40">
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <Logo size="sm" href="/" />
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 lg:hidden">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0">
            {(user as any)?.avatar
              ? <img src={(user as any).avatar} className="w-full h-full rounded-full object-cover" alt="" />
              : <span className="text-primary-400 font-bold">{user?.name?.[0]}</span>}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-white text-sm truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 capitalize">{(user as any)?.packageTier || 'Free'} Plan</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <Link key={item.href} href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              pathname?.startsWith(item.href) ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' :
              'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {item.label}
          </Link>
        ))}
        {/* Affiliate — gated */}
        <Link href="/student/affiliate"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
            pathname === '/student/affiliate' ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' :
            'text-gray-400 hover:text-white hover:bg-white/5'}`}>
          <TrendingUp className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">Earn & Grow</span>
          {!isAffiliate && <Lock className="w-3 h-3 text-yellow-500" />}
        </Link>
      </nav>
      <div className="p-4 border-t border-white/5">
        <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  )
}
