'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import PartnerSidebar from '@/components/layout/PartnerSidebar'
import api from '@/lib/api'
import { Lock, CreditCard, Loader2 } from 'lucide-react'

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, updateUser } = useAuthStore()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [suspended, setSuspended] = useState(false)
  const [overduePaymentLink, setOverduePaymentLink] = useState<string | null>(null)
  const [checkingEmi, setCheckingEmi] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
    if (!isAuthenticated()) router.push('/login')
    else if (user && user.role !== 'student' && user.role !== 'admin' && user.role !== 'superadmin' && user.role !== 'salesperson' && user.role !== 'mentor') {
      router.push('/student/dashboard')
    }

    // Check suspension status
    if (user) {
      api.get('/users/me').then(r => {
        if (r.data?.user) updateUser(r.data.user)
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
      }).catch(() => {})
    }
  }, [mounted, user])

  if (!mounted || !user) return null

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
