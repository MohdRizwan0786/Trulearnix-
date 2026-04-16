'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Cookies from 'js-cookie'
import Sidebar from './Sidebar'
import { Bell, Menu, X } from 'lucide-react'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/analytics': 'Analytics',
  '/users': 'Users',
  '/packages': 'Packages',
  '/finance': 'Finance Dashboard',
  '/crm': 'CRM',
  '/mentors': 'Mentor Management',
  '/courses': 'Courses',
  '/live-classes': 'Live Classes',
  '/blog': 'Blog',
  '/support': 'Support',
  '/notifications': 'Notifications',
  '/content': 'Website Content',
}

export interface UserSession {
  name: string
  role: string
  dept: string
  permissions: string[]
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checked, setChecked] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [session, setSession] = useState<UserSession | null>(null)

  useEffect(() => {
    const token = Cookies.get('adminToken') || (typeof localStorage !== 'undefined' ? localStorage.getItem('adminToken') : null)
    if (!token) {
      if (pathname !== '/login') router.replace('/login')
      return
    }
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.peptly.in/api'}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.user) {
          const s: UserSession = {
            name: d.user.name || '',
            role: d.user.role || '',
            dept: d.user.department || '',
            permissions: d.user.permissions || [],
          }
          // Keep localStorage in sync for other components
          localStorage.setItem('adminName', s.name)
          localStorage.setItem('adminRole', s.role)
          localStorage.setItem('adminDept', s.dept)
          localStorage.setItem('adminPermissions', JSON.stringify(s.permissions))
          setSession(s)
        }
        setChecked(true)
      })
      .catch(() => {
        // Fallback to localStorage if API fails
        const s: UserSession = {
          name: localStorage.getItem('adminName') || '',
          role: localStorage.getItem('adminRole') || '',
          dept: localStorage.getItem('adminDept') || '',
          permissions: JSON.parse(localStorage.getItem('adminPermissions') || '[]'),
        }
        setSession(s)
        setChecked(true)
      })
  }, [router, pathname])

  if (!checked || !session) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const title = pageTitles[pathname] || Object.entries(pageTitles).find(([k]) => pathname.startsWith(k))?.[1] || 'Admin'

  return (
    <div className="min-h-screen bg-slate-900">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <div className={`fixed inset-y-0 left-0 z-40 transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <Sidebar session={session} />
      </div>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 text-gray-400" onClick={() => setSidebarOpen(v => !v)}>
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h2 className="text-lg font-bold text-white">{title}</h2>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-violet-500 rounded-full" />
            </button>
            <div className="w-8 h-8 bg-violet-500/30 rounded-full flex items-center justify-center">
              <span className="text-violet-300 font-bold text-xs">{session.name[0]?.toUpperCase() || 'A'}</span>
            </div>
          </div>
        </header>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
