'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { LogOut, Menu, X, Plus, Zap } from 'lucide-react'

export default function Navbar() {
  const pathname = usePathname()
  const { user, logout, _hasHydrated } = useAuthStore()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const links = [
    { href: '/projects', label: 'Browse Projects' },
    { href: '/freelancers', label: 'Find Talent' },
  ]

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-[#060d17]/95 backdrop-blur-xl border-b border-white/10 shadow-2xl' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0d9488,#0891b2)' }}>
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-black text-white text-[15px] tracking-tight">TruLancer</span>
              <span className="text-[9px] text-teal-400 font-bold uppercase tracking-widest">by TruLearnix</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-7">
            {links.map(l => (
              <Link key={l.href} href={l.href}
                className={`text-sm font-semibold transition-colors ${pathname === l.href ? 'text-teal-400' : 'text-gray-400 hover:text-white'}`}>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {_hasHydrated && user ? (
              <>
                <Link href="/post-project" className="btn-primary text-sm py-2 px-4">
                  <Plus className="w-3.5 h-3.5" /> Post Project
                </Link>
                <Link href="/dashboard" className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs" style={{ background: 'linear-gradient(135deg,#0d9488,#0891b2)' }}>
                    <span className="text-white">{user.name?.[0]}</span>
                  </div>
                  <span className="text-sm text-gray-300 font-medium">{user.name?.split(' ')[0]}</span>
                </Link>
                <button onClick={logout} className="p-2 text-gray-600 hover:text-red-400 transition-colors rounded-xl hover:bg-red-500/10">
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-secondary text-sm py-2 px-4">Login</Link>
                <Link href="/post-project" className="btn-primary text-sm py-2 px-4">
                  <Plus className="w-3.5 h-3.5" /> Post Project
                </Link>
              </>
            )}
          </div>

          <button className="md:hidden p-2 text-gray-400 hover:text-white" onClick={() => setOpen(!open)}>
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-[#0a1628] border-t border-white/10 px-4 py-4 space-y-1">
          {links.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors font-medium">
              {l.label}
            </Link>
          ))}
          <div className="pt-3 mt-2 border-t border-white/10 space-y-2">
            {_hasHydrated && user ? (
              <>
                <Link href="/dashboard" onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-xl font-medium">
                  Dashboard
                </Link>
                <Link href="/post-project" onClick={() => setOpen(false)} className="btn-primary w-full text-sm py-2.5 text-center block">
                  Post a Project
                </Link>
                <button onClick={() => { logout(); setOpen(false); }} className="w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-left font-medium">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="btn-secondary w-full text-sm py-2.5 text-center block">Login</Link>
                <Link href="/register" onClick={() => setOpen(false)} className="btn-primary w-full text-sm py-2.5 text-center block">Create Account</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
