'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, BookOpen, Bell, ChevronDown, LogOut, User, LayoutDashboard } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { authAPI } from '@/lib/api'
import { useRouter } from 'next/navigation'

const navLinks = [
  { href: '/courses', label: 'Courses' },
  { href: '/about', label: 'About' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    try { await authAPI.logout() } catch {}
    logout()
    router.push('/')
  }

  const dashboardPath = user?.role === 'admin' ? '/admin' : user?.role === 'mentor' ? '/mentor' : '/student'

  return (
    <nav className="fixed top-0 w-full z-50 bg-dark-900/95 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">TruLearnix</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href}
                className={`text-sm font-medium transition-colors ${pathname === link.href ? 'text-primary-500' : 'text-gray-300 hover:text-white'}`}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="relative">
                <button onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors">
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                    {user.avatar ? <img src={user.avatar} className="w-full h-full rounded-full object-cover" alt="" /> : user.name[0]}
                  </div>
                  <span>{user.name.split(' ')[0]}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-dark-800 border border-white/10 rounded-xl shadow-xl py-1 z-50">
                    <Link href={dashboardPath} onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5">
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                    <Link href={`${dashboardPath}/profile`} onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5">
                      <User className="w-4 h-4" /> Profile
                    </Link>
                    <hr className="border-white/10 my-1" />
                    <button onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-white/5">
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="text-sm text-gray-300 hover:text-white transition-colors">Login</Link>
                <Link href="/register" className="btn-primary text-sm py-2 px-4">Start Free</Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setOpen(!open)} className="md:hidden text-gray-300 hover:text-white">
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-dark-800 border-t border-white/10 px-4 py-4 space-y-3">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)}
              className="block text-gray-300 hover:text-white py-2">{link.label}</Link>
          ))}
          {user ? (
            <>
              <Link href={dashboardPath} onClick={() => setOpen(false)} className="block text-gray-300 hover:text-white py-2">Dashboard</Link>
              <button onClick={handleLogout} className="block text-red-400 py-2">Logout</button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setOpen(false)} className="block text-gray-300 py-2">Login</Link>
              <Link href="/register" onClick={() => setOpen(false)} className="btn-primary block text-center py-2">Start Free</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
