'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { BookOpen, Mail, ArrowLeft, Loader2, CheckCircle2, KeyRound, Eye, EyeOff } from 'lucide-react'
import Logo from '@/components/ui/Logo'
import { authAPI } from '@/lib/api'
import toast from 'react-hot-toast'

type Step = 'email' | 'otp' | 'newpass' | 'done'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<Step>('email')
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const autoTriggered = useRef(false)

  const sendOTP = async (targetEmail: string) => {
    setLoading(true)
    try {
      const res = await authAPI.forgotPassword({ email: targetEmail })
      setUserId(res.data.userId)
      const channels = res.data?.deliveredVia
      if (channels?.email && channels?.whatsapp) toast.success('OTP email aur WhatsApp dono par bhej diya!')
      else if (channels?.email) toast.success('OTP aapke email par bhej diya!')
      else if (channels?.whatsapp) toast.success('OTP aapke WhatsApp par bhej diya!')
      else toast.success(res.data?.message || 'OTP sent!')
      setStep('otp')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return toast.error('Email required')
    await sendOTP(email)
  }

  // If redirected from login with ?email=&setup=1, auto-send OTP
  useEffect(() => {
    const qEmail = searchParams.get('email')
    const setup = searchParams.get('setup')
    if (qEmail && setup === '1' && !autoTriggered.current) {
      autoTriggered.current = true
      setEmail(qEmail)
      sendOTP(qEmail)
    }
  }, [searchParams])

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length < 4) return toast.error('Enter the OTP sent to your email')
    setStep('newpass')
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters')
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match')
    setLoading(true)
    try {
      await authAPI.resetPassword({ userId, otp, newPassword })
      setStep('done')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Reset failed. Check your OTP.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#04050a' }}>
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center mb-6">
            <Logo size="lg" href="/" />
          </Link>

          {/* Step indicator */}
          {step !== 'done' && (
            <div className="flex items-center justify-center gap-2 mb-6">
              {(['email','otp','newpass'] as Step[]).map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all"
                    style={{
                      background: step === s ? 'linear-gradient(135deg,#7c3aed,#6366f1)' :
                        (['email','otp','newpass'].indexOf(step) > i) ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.07)',
                      color: step === s || (['email','otp','newpass'].indexOf(step) > i) ? '#fff' : '#6b7280',
                      border: `1px solid ${step === s ? 'rgba(124,58,237,0.6)' : 'rgba(255,255,255,0.08)'}`,
                    }}>
                    {['email','otp','newpass'].indexOf(step) > i ? '✓' : i + 1}
                  </div>
                  {i < 2 && <div className="w-8 h-px" style={{ background: (['email','otp','newpass'].indexOf(step) > i) ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.1)' }} />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── STEP 1: Email ── */}
        {step === 'email' && (
          <div className="rounded-3xl p-6 sm:p-8" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background:'rgba(124,58,237,0.15)' }}>
                <Mail className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white">Forgot Password?</h1>
                <p className="text-gray-500 text-xs">Enter your email — we'll send an OTP</p>
              </div>
            </div>

            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input w-full"
                  required
                />
              </div>

              <button type="submit" disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Sending OTP...</> : <>Send OTP →</>}
              </button>
            </form>

            <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors mt-5">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
            </Link>
          </div>
        )}

        {/* ── STEP 2: OTP ── */}
        {step === 'otp' && (
          <div className="rounded-3xl p-6 sm:p-8" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background:'rgba(124,58,237,0.15)' }}>
                <KeyRound className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white">Enter OTP</h1>
                <p className="text-gray-500 text-xs">Sent to <span className="text-violet-400">{email}</span></p>
              </div>
            </div>

            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5">OTP Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))}
                  placeholder="Enter OTP"
                  className="input w-full text-center tracking-[0.4em] text-xl font-black"
                  maxLength={6}
                  required
                />
              </div>

              <button type="submit" className="btn-primary w-full">
                Verify OTP →
              </button>
            </form>

            <button onClick={async () => {
              try { await authAPI.forgotPassword({ email }); toast.success('OTP resent!') }
              catch { toast.error('Failed to resend') }
            }} className="flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-violet-400 transition-colors mt-4 w-full">
              Didn't receive? Resend OTP
            </button>
          </div>
        )}

        {/* ── STEP 3: New Password ── */}
        {step === 'newpass' && (
          <div className="rounded-3xl p-6 sm:p-8" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background:'rgba(16,185,129,0.15)' }}>
                <KeyRound className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white">New Password</h1>
                <p className="text-gray-500 text-xs">Choose a strong password</p>
              </div>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="input w-full pr-10"
                    required
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5">Confirm Password</label>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="input w-full"
                  required
                />
              </div>

              <button type="submit" disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Resetting...</> : 'Reset Password →'}
              </button>
            </form>
          </div>
        )}

        {/* ── DONE ── */}
        {step === 'done' && (
          <div className="rounded-3xl p-8 text-center" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(16,185,129,0.3)' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background:'rgba(16,185,129,0.15)' }}>
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-xl font-black text-white mb-2">Password Reset!</h2>
            <p className="text-gray-400 text-sm mb-6">Your password has been updated. You can now log in.</p>
            <button onClick={() => router.push('/login')} className="btn-primary w-full">
              Go to Login →
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
