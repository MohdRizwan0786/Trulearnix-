'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { phonepeAPI } from '@/lib/api'
import Link from 'next/link'

function PhonePeStatusInner() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const orderId = searchParams.get('orderId') || ''
  const type = searchParams.get('type') || 'package'
  const tier = searchParams.get('tier') || ''
  const courseId = searchParams.get('courseId') || ''

  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'pending'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!orderId) { setStatus('failed'); setMessage('Invalid order ID'); return }

    let attempts = 0
    const maxAttempts = 6
    const interval = setInterval(async () => {
      attempts++
      try {
        const { data } = await phonepeAPI.getStatus(orderId, { type, tier, courseId })
        if (data.success && data.state === 'COMPLETED') {
          clearInterval(interval)
          setMessage(data.message || 'Payment successful!')
          setStatus('success')
        } else if (attempts >= maxAttempts) {
          clearInterval(interval)
          setStatus(data.state === 'PENDING' ? 'pending' : 'failed')
          setMessage(data.message || 'Payment could not be confirmed')
        }
      } catch {
        if (attempts >= maxAttempts) {
          clearInterval(interval)
          setStatus('failed')
          setMessage('Status check failed. Contact support.')
        }
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [orderId, type, tier, courseId])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6"
        style={{ background: 'radial-gradient(ellipse at center, #0d0d1a 0%, #050508 100%)' }}>
        <Loader2 className="w-12 h-12 animate-spin text-purple-400" />
        <p className="text-white/60 text-sm">Confirming your payment…</p>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'radial-gradient(ellipse at center, #0d0d1a 0%, #050508 100%)' }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'linear-gradient(135deg,#059669,#10b981)', boxShadow: '0 0 60px rgba(16,185,129,0.5)' }}
          >
            <CheckCircle2 className="w-12 h-12 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-2">Payment Successful!</h2>
          <p className="text-white/60 mb-8">{message}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/student/dashboard"
              className="px-6 py-3 rounded-xl font-semibold text-white text-sm"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#6366f1)', boxShadow: '0 8px 32px rgba(124,58,237,0.5)' }}>
              Go to Dashboard
            </Link>
            {type === 'course' && courseId && (
              <Link href={`/courses/${courseId}`}
                className="px-6 py-3 rounded-xl font-semibold text-white/80 text-sm bg-white/5 border border-white/10">
                Start Learning
              </Link>
            )}
          </div>
        </motion.div>
      </div>
    )
  }

  if (status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'radial-gradient(ellipse at center, #0d0d1a 0%, #050508 100%)' }}>
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-amber-500/20">
            <Loader2 className="w-10 h-10 text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Payment Pending</h2>
          <p className="text-white/60 mb-6">Your payment is being processed. We'll update your account once confirmed.</p>
          <Link href="/student/dashboard" className="px-6 py-3 rounded-xl font-semibold text-white text-sm bg-white/10 border border-white/10">
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'radial-gradient(ellipse at center, #0d0d1a 0%, #050508 100%)' }}>
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-red-500/20">
          <XCircle className="w-10 h-10 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Payment Failed</h2>
        <p className="text-white/60 mb-6">{message || 'Something went wrong. Please try again.'}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => router.back()}
            className="px-6 py-3 rounded-xl font-semibold text-white text-sm bg-white/10 border border-white/10">
            Try Again
          </button>
          <Link href="/student/dashboard" className="px-6 py-3 rounded-xl font-semibold text-white/60 text-sm">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function PhonePeStatusPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'radial-gradient(ellipse at center, #0d0d1a 0%, #050508 100%)' }}>
        <Loader2 className="w-10 h-10 animate-spin text-white/40" />
      </div>
    }>
      <PhonePeStatusInner />
    </Suspense>
  )
}
