'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { BookOpen, LayoutDashboard, Video, FileQuestion, Users, Wallet, User, LogOut, BarChart2 } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { authAPI } from '@/lib/api'

const navItems = [
  { href: '/mentor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/mentor/courses', icon: BookOpen, label: 'My Courses' },
  { href: '/mentor/classes', icon: Video, label: 'Live Classes' },
  { href: '/mentor/quizzes', icon: FileQuestion, label: 'Quizzes' },
  { href: '/mentor/students', icon: Users, label: 'Students' },
  { href: '/mentor/earnings', icon: Wallet, label: 'Earnings' },
  { href: '/mentor/profile', icon: User, label: 'Profile' },
]

export default function MentorLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login')
    else if (user?.role !== 'mentor') router.push(`/${user?.role}`)
  }, [user])

  if (!user || user.role !== 'mentor') return null

  const handleLogout = async () => {
    try { await authAPI.logout() } catch {}
    logout()
    router.push('/')
  }

  return (
    <div className="flex min-h-screen bg-dark-900">
      <aside className="fixed left-0 top-0 h-full w-64 bg-dark-800 border-r border-white/5 flex flex-col z-40">
        <div className="p-6 border-b border-white/5">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold gradient-text">Mentor Panel</span>
          </Link>
        </div>
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center">
              <span className="text-primary-400 font-bold">{user.name[0]}</span>
            </div>
            <div>
              <p className="font-medium text-white text-sm">{user.name}</p>
              <p className="text-xs text-primary-400">Mentor</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${pathname === item.href ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              <item.icon className="w-4 h-4" />{item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-xl">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 ml-64 p-8">{children}</main>
    </div>
  )
}
