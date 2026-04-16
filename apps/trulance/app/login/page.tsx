'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import api, { authAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import toast from 'react-hot-toast'
import { Zap, Eye, EyeOff, MessageCircle } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [unverifiedUserId, setUnverifiedUserId] = useState<string | null>(null)
  const [otp, setOtp] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authAPI.login(form)
      const { user, accessToken, refreshToken } = res.data
      setAuth(user, accessToken, refreshToken)
      toast.success(`Welcome back, ${user.name?.split(' ')[0]}!`)
      const redirect = searchParams.get('redirect')
      router.push(redirect ? decodeURIComponent(redirect) : '/dashboard')
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Login failed'
      if (msg === 'Please verify your account first') {
        // Fetch userId for this email to allow OTP resend
        try {
          const r = await api.post('/auth/resend-otp-email', { email: form.email })
          setUnverifiedUserId(r.data.userId)
          toast('Account not verified. OTP resent to your WhatsApp!', { icon: '📱' })
          if (r.data._devOtp) toast(`Dev OTP: ${r.data._devOtp}`, { duration: 60000, icon: '🔑' })
        } catch {
          toast.error('Account not verified. Please contact support or register again.')
        }
      } else {
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setOtpLoading(true)
    try {
      const res = await api.post('/auth/verify-otp', { userId: unverifiedUserId, otp })
      const { user, accessToken, refreshToken } = res.data
      setAuth(user, accessToken, refreshToken)
      toast.success(`Welcome, ${user.name?.split(' ')[0]}!`)
      const redirect = searchParams.get('redirect')
      router.push(redirect ? decodeURIComponent(redirect) : '/dashboard')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Invalid OTP')
    } finally {
      setOtpLoading(false)
    }
  }

  const resendOtp = async () => {
    try {
      const r = await api.post('/auth/resend-otp', { userId: unverifiedUserId })
      toast.success('OTP resent!')
      if (r.data._devOtp) toast(`Dev OTP: ${r.data._devOtp}`, { duration: 60000, icon: '🔑' })
    } catch {
      toast.error('Could not resend OTP')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#0d9488,#0891b2)', boxShadow: '0 8px 32px rgba(13,148,136,0.35)' }}>
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">
            {unverifiedUserId ? 'Verify Your Account' : 'Welcome to TruLancer'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {unverifiedUserId ? 'Enter the OTP sent to your WhatsApp' : 'Use your TruLearnix account credentials'}
          </p>
        </div>
        <div className="card">
          {!unverifiedUserId ? (
            <>
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5 font-medium">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="you@example.com" className="input" required />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5 font-medium">Password</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} value={form.password}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      placeholder="••••••••" className="input pr-10" required />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3 font-bold text-sm">
                  {loading ? 'Logging in...' : 'Login to TruLancer'}
                </button>
              </form>
              <p className="text-center text-sm text-gray-500 mt-5">
                No account?{' '}
                <Link href="/register" className="text-teal-400 hover:underline font-semibold">Create one free</Link>
              </p>
              <p className="text-center text-xs text-gray-700 mt-2">
                Same as <a href="https://peptly.in" className="text-teal-400 hover:underline">peptly.in</a> credentials
              </p>
            </>
          ) : (
            <form onSubmit={verifyOtp} className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 mb-2">
                <MessageCircle className="w-4 h-4 text-teal-400 flex-shrink-0" />
                <p className="text-xs text-teal-300">OTP sent to your WhatsApp number</p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5 font-medium">Enter OTP</label>
                <input value={otp} onChange={e => setOtp(e.target.value)}
                  placeholder="123456" className="input text-center text-xl tracking-widest font-bold"
                  maxLength={6} required />
              </div>
              <button type="submit" disabled={otpLoading} className="btn-primary w-full py-3 font-bold text-sm">
                {otpLoading ? 'Verifying...' : 'Verify & Login'}
              </button>
              <div className="flex items-center justify-between pt-1">
                <button type="button" onClick={() => setUnverifiedUserId(null)}
                  className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
                  ← Back to login
                </button>
                <button type="button" onClick={resendOtp}
                  className="text-xs text-teal-400 hover:underline">
                  Resend OTP
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <Suspense fallback={null}><LoginForm /></Suspense>
}
