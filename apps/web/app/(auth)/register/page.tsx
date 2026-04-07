'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { BookOpen, Eye, EyeOff, Loader2, Gift, Zap } from 'lucide-react'
import Logo from '@/components/ui/Logo'
import { authAPI } from '@/lib/api'
import toast from 'react-hot-toast'

const schema = z.object({
  name: z.string().min(2, 'Name too short'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Invalid phone').optional().or(z.literal('')),
  password: z.string().min(6, 'Min 6 characters'),
  confirmPassword: z.string(),
  role: z.enum(['student', 'mentor']),
}).refine(d => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [otp, setOtp] = useState('')
  const [verifying, setVerifying] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref') || ''
  const packageParam = searchParams.get('package') || ''

  const PACKAGE_INFO: Record<string, { name: string; price: string; commission: string; color: string }> = {
    starter: { name: 'Starter', price: '₹4,999', commission: '10%', color: 'border-gray-500/50 bg-gray-500/10' },
    pro: { name: 'Pro', price: '₹9,999', commission: '15%', color: 'border-blue-500/50 bg-blue-500/10' },
    elite: { name: 'Elite', price: '₹19,999', commission: '22%', color: 'border-violet-500/50 bg-violet-500/10' },
    supreme: { name: 'Supreme', price: '₹29,999', commission: '30%', color: 'border-yellow-500/50 bg-yellow-500/10' },
  }

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: searchParams.get('role') === 'mentor' ? 'mentor' : 'student' }
  })

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true)
      const res = await authAPI.register({ ...data, referralCode: ref })
      setUserId(res.data.userId)
      toast.success('OTP sent to your email!')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    try {
      setVerifying(true)
      await authAPI.verifyOTP({ userId, otp })
      toast.success('Email verified! Please login.')
      router.push('/login')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid OTP')
    } finally {
      setVerifying(false)
    }
  }

  if (userId) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📧</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Check your email</h1>
            <p className="text-gray-400 mt-2">We sent a 6-digit OTP to your email</p>
          </div>
          <div className="card space-y-4">
            <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="Enter 6-digit OTP"
              className="input text-center text-2xl tracking-widest" maxLength={6} />
            <button onClick={handleVerifyOTP} disabled={verifying || otp.length < 6} className="btn-primary w-full flex items-center justify-center gap-2">
              {verifying ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : 'Verify Email'}
            </button>
            <button onClick={() => authAPI.resendOTP({ userId }).then(() => toast.success('OTP resent!'))}
              className="text-sm text-primary-400 w-full text-center hover:text-primary-300">
              Resend OTP
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center">
            <Logo size="lg" href="/" />
          </Link>
          <h1 className="text-2xl font-bold text-white mt-4">Create your account</h1>
          <p className="text-gray-400 mt-1">Start your learning journey today</p>
        </div>

        {packageParam && PACKAGE_INFO[packageParam] && (
          <div className={`rounded-xl border p-4 mb-4 flex items-center gap-3 ${PACKAGE_INFO[packageParam].color}`}>
            <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">You're signing up for <span className="text-primary-400">{PACKAGE_INFO[packageParam].name} Package</span></p>
              <p className="text-gray-400 text-xs">{PACKAGE_INFO[packageParam].price} • Earn {PACKAGE_INFO[packageParam].commission} L1 income share • Unlock Earn Panel</p>
            </div>
          </div>
        )}

        {ref && !packageParam && (
          <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 mb-4 flex items-center gap-3">
            <Gift className="w-5 h-5 text-green-400 flex-shrink-0" />
            <p className="text-green-400 text-sm font-medium">Invite code <span className="font-bold">{ref}</span> applied — your sponsor earns when you upgrade!</p>
          </div>
        )}

        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
              <input {...register('name')} placeholder="Your full name" className="input" />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input {...register('email')} type="email" placeholder="you@example.com" className="input" />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Phone (optional)</label>
              <input {...register('phone')} placeholder="+91 98765 43210" className="input" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">I want to</label>
              <select {...register('role')} className="input">
                <option value="student">Learn (Student)</option>
                <option value="mentor">Teach & Earn (Mentor)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <div className="relative">
                <input {...register('password')} type={showPw ? 'text' : 'password'} placeholder="Min 6 characters" className="input pr-10" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Confirm Password</label>
              <input {...register('confirmPassword')} type="password" placeholder="Repeat password" className="input" />
              {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            {ref && <input type="hidden" value={ref} />}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-primary-400 hover:text-primary-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
