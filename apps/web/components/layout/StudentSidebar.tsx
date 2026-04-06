'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BookOpen, Video, FileQuestion, Award, Wallet, Users, User, LogOut, Bell } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { authAPI } from '@/lib/api'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/student/courses', icon: BookOpen, label: 'My Courses' },
  { href: '/student/classes', icon: Video, label: 'Live Classes' },
  { href: '/student/quizzes', icon: FileQuestion, label: 'Quizzes' },
  { href: '/student/certificates', icon: Award, label: 'Certificates' },
  { href: '/student/wallet', icon: Wallet, label: 'Wallet' },
  { href: '/student/affiliate', icon: Users, label: 'Affiliate' },
  { href: '/student/profile', icon: User, label: 'Profile' },
]

export default function StudentSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const router = useRouter()

  const handleLogout = async () => {
    try { await authAPI.logout() } catch {}
    logout()
    router.push('/')
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-dark-800 border-r border-white/5 flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold gradient-text">TruLearnix</span>
        </Link>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center">
            {user?.avatar ? <img src={user.avatar} className="w-full h-full rounded-full object-cover" alt="" /> :
              <span className="text-primary-400 font-bold">{user?.name[0]}</span>}
          </div>
          <div>
            <p className="font-medium text-white text-sm">{user?.name}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <Link key={item.href} href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              pathname === item.href ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' :
              'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <item.icon className="w-4 h-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/5">
        <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  )
}
