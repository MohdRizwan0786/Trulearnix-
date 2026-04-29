'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'
import PartnerSidebar from '@/components/layout/PartnerSidebar'
import api from '@/lib/api'
import { Lock, CreditCard, Loader2, Zap, ArrowRight, CheckCircle2, Star } from 'lucide-react'

const FREE_ALLOWED_PREFIXES = [
  '/partner/support',
  '/partner/kyc',
]

function PartnerPaywallScreen() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-screen p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-600/20 to-purple-600/20 border border-violet-500/30 flex items-center justify-center mx-auto">
            <Lock className="w-10 h-10 text-violet-400" />
          </div>
          <div className="absolute -top-1 -right-1 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
            <Star className="w-4 h-4 text-white fill-white" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">Unlock Partner Panel</h1>
          <p className="text-gray-400 leading-relaxed">
            The partner panel is available to enrolled members only. Purchase a package or course to unlock referral earnings, Partnership earnings, and more.
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left space-y-3">
          {[
            'Earn Partnership earnings on every referral',
            'Track your team & downline',
            'Access partner training & resources',
            'Withdraw earnings to your bank',
          ].map(b => (
            <div key={b} className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-violet-400 flex-shrink-0" />
              <span className="text-sm text-gray-300">{b}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <Link href="/packages"
            className="flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold text-sm hover:from-violet-500 hover:to-purple-500 transition-all shadow-lg shadow-violet-500/25">
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

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, updateUser } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [suspended, setSuspended] = useState(false)
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [overduePaymentLink, setOverduePaymentLink] = useState<string | null>(null)
  const [checkingEmi, setCheckingEmi] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
    if (!isAuthenticated()) router.push('/login')
    else if (user && user.role !== 'student' && user.role !== 'admin' && user.role !== 'superadmin' && user.role !== 'salesperson' && user.role !== 'mentor') {
      router.push('/student/dashboard')
    }

    if (user) {
      api.get('/users/me').then(r => {
        if (r.data?.user) updateUser(r.data.user)
        setHasAccess(r.data?.hasAccess === true)
        if (r.data?.user?.packageSuspended === true) {
          setSuspended(true)
          setCheckingEmi(true)
          api.get('/checkout/emi').then(emiRes => {
            const installments: any[] = emiRes.data?.installments || []
            const overdue = installments.find((i: any) => i.status === 'overdue' || i.status === 'pending')
            if (overdue?.paymentLink) {
              setOverduePaymentLink(overdue.paymentLink)
            } else if (overdue?._id) {
              setOverduePaymentLink(`${window.location.origin}/pay/emi/${overdue._id}`)
            }
          }).catch(() => {}).finally(() => setCheckingEmi(false))
        }
      }).catch(() => { setHasAccess(false) })
    }
  }, [mounted, user])

  if (!mounted || !user || hasAccess === null) return null

  if (suspended) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-dark-800 rounded-2xl border border-red-500/20 p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-red-400" />
          </div>
          <div>
            <h2 className="text-white text-xl font-bold mb-2">Partner Access Suspended</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Your partner panel access has been suspended due to an unpaid EMI installment. Please complete the payment to restore access.
            </p>
          </div>
          {checkingEmi ? (
            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading payment details...
            </div>
          ) : overduePaymentLink ? (
            <a
              href={overduePaymentLink}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold transition-colors"
            >
              <CreditCard className="w-5 h-5" />
              Pay Now to Restore Access
            </a>
          ) : (
            <p className="text-gray-500 text-sm">Please contact support to resolve your payment.</p>
          )}
        </div>
      </div>
    )
  }

  const isAllowed = FREE_ALLOWED_PREFIXES.some(p => pathname.startsWith(p))

  if (!hasAccess && !isAllowed) {
    return (
      <div className="flex min-h-screen bg-dark-900">
        <PartnerSidebar />
        <main className="flex-1 lg:ml-72">
          <div className="lg:hidden h-14" />
          <PartnerPaywallScreen />
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-dark-900">
      <PartnerSidebar />
      <main className="flex-1 lg:ml-72">
        <div className="lg:hidden h-14" />
        <div className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          {children}
        </div>
      </main>
    </div>
  )
}
