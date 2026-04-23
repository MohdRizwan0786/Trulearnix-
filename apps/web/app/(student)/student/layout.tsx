'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'
import { usePaidTiers } from '@/lib/tiers'
import LearnerSidebar from '@/components/layout/LearnerSidebar'
import { Lock, Zap, Star, ArrowRight, CheckCircle2 } from 'lucide-react'

// Pages free users can still access after login
const FREE_ALLOWED_PREFIXES = [
  '/student/profile',
  '/student/upgrade',
  '/student/support',
]

function PaywallScreen() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-screen p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary-600/20 to-purple-600/20 border border-primary-500/30 flex items-center justify-center mx-auto">
            <Lock className="w-10 h-10 text-primary-400" />
          </div>
          <div className="absolute -top-1 -right-1 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
            <Star className="w-4 h-4 text-white fill-white" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">Unlock Full Access</h1>
          <p className="text-gray-400 leading-relaxed">
            This section is available to enrolled learners only. Purchase a package to unlock your dashboard, courses, live classes, and everything else.
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left space-y-3">
          {[
            'Full dashboard & personalised learning path',
            'Access all courses & live classes',
            'AI coach, assignments & quizzes',
            'Community, certificates & more',
          ].map(b => (
            <div key={b} className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-primary-400 flex-shrink-0" />
              <span className="text-sm text-gray-300">{b}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <Link href="/packages"
            className="flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 text-white font-semibold text-sm hover:from-primary-500 hover:to-purple-500 transition-all shadow-lg shadow-primary-500/25">
            <Zap className="w-4 h-4" />
            View Packages & Enroll
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/student/profile" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            Go to my profile →
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LearnerLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuthStore()
  const { tiers: paidTiers } = usePaidTiers()
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
    if (!isAuthenticated()) { router.push('/login'); return }
    if (user?.role && user.role !== 'student') { router.push(`/${user.role}`); return }
  }, [mounted, user])

  if (!mounted || !user || user.role !== 'student') return null

  // Live class room — full screen, no sidebar/padding
  const isLiveRoom = /^\/student\/classes\/[^/]+$/.test(pathname)
  if (isLiveRoom) return <>{children}</>

  const hasPurchased = paidTiers.includes(user.packageTier || '')
  const isAllowed = FREE_ALLOWED_PREFIXES.some(p => pathname.startsWith(p))

  if (!hasPurchased && !isAllowed) {
    return (
      <div className="flex min-h-screen bg-dark-900">
        <LearnerSidebar />
        <main className="flex-1 lg:ml-64">
          <div className="lg:hidden h-14" />
          <PaywallScreen />
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-dark-900">
      <LearnerSidebar />
      <main className="flex-1 lg:ml-64">
        <div className="lg:hidden h-14" />
        <div className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          {children}
        </div>
      </main>
    </div>
  )
}
