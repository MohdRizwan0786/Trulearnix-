'use client'
import { useState, Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  User, Mail, Phone, Calendar, MapPin, Globe, Loader2,
  CheckCircle, ChevronRight, Sparkles, Shield, ArrowRight, MessageCircle
} from 'lucide-react'
import { authAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import toast from 'react-hot-toast'

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh',
  'Chandigarh','Puducherry','Other',
]

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().min(10, 'Enter a valid 10-digit phone number').max(15),
  age: z.string().min(1, 'Age is required'),
  country: z.string().min(1, 'Country is required'),
  state: z.string().min(1, 'State is required'),
})

type FormData = z.infer<typeof schema>

function Field({ label, icon: Icon, error, children }: { label: string; icon: any; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none z-10" />
        {children}
      </div>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  )
}

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setAuth } = useAuthStore()
  const ref = searchParams.get('ref') || ''
  const packageId = searchParams.get('packageId') || ''
  const promo = searchParams.get('promo') || ''
  const next = searchParams.get('next') || ''

  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState('')
  const [otp, setOtp] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [country, setCountry] = useState('India')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { country: 'India' }
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const res = await authAPI.register({
        name: data.name,
        email: data.email,
        phone: data.phone,
        age: data.age,
        country: data.country,
        state: data.state,
        role: 'student',
        referralCode: ref || promo,
      })
      setUserId(res.data.tempId)
      setStep('otp')
      if (res.data._devOtp) toast.success(`OTP: ${res.data._devOtp}`, { duration: 60000 })
      else toast.success('OTP sent to your WhatsApp!')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (otp.length < 6) return
    setVerifying(true)
    try {
      const res = await authAPI.verifyOTP({ userId, otp })
      // Auto-login
      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken)
      toast.success('Account verified! Redirecting...')
      // Redirect to checkout if package was selected, else dashboard
      if (next) {
        router.push(next)
      } else if (packageId) {
        const checkoutUrl = `/checkout?type=package&packageId=${packageId}${promo ? `&promo=${promo}` : ''}`
        router.push(checkoutUrl)
      } else {
        router.push('/student/dashboard')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid OTP. Try again.')
    } finally {
      setVerifying(false)
    }
  }

  // OTP Screen
  if (step === 'otp') {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-green-500/30">
              <MessageCircle className="w-7 h-7 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Verify your account</h1>
            <p className="text-gray-400 text-sm mt-2">We sent a 6-digit OTP to your WhatsApp & email</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <input
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && handleVerifyOTP()}
              placeholder="_ _ _ _ _ _"
              className="w-full text-center text-3xl font-bold tracking-[0.5em] bg-white/5 border border-white/10 rounded-xl py-4 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors"
              maxLength={6}
            />
            <button
              onClick={handleVerifyOTP}
              disabled={verifying || otp.length < 6}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white transition-all bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {verifying ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : <>Verify & Continue <ArrowRight className="w-4 h-4" /></>}
            </button>
            <button
              onClick={() => authAPI.resendOTP({ userId }).then(r => { if (r.data._devOtp) toast.success(`OTP: ${r.data._devOtp}`, { duration: 60000 }); else toast.success('OTP resent!') })}
              className="text-sm text-gray-500 hover:text-violet-400 w-full text-center transition-colors"
            >
              Didn't receive? Resend OTP
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Registration Form
  return (
    <div className="min-h-screen bg-[#0a0a14] flex">
      {/* Left panel - desktop only */}
      <div className="hidden lg:flex flex-col justify-center w-5/12 bg-gradient-to-br from-violet-900/40 via-purple-900/30 to-indigo-900/40 px-12 border-r border-white/5">
        <div className="mb-10">
          <Image src="/logo.png" alt="TruLearnix" width={160} height={40} className="object-contain mb-2" priority />
          <p className="text-gray-400 text-sm mt-1">Learn · Earn · Grow</p>
        </div>
        <h2 className="text-3xl font-bold text-white leading-tight mb-4">
          Your path to<br /><span className="text-violet-400">financial freedom</span><br />starts here
        </h2>
        <p className="text-gray-400 leading-relaxed mb-8">
          Join thousands of learners who are building skills and earning income through our partner program.
        </p>
        <div className="space-y-3">
          {[
            { icon: '🎓', text: 'Access 50+ premium courses' },
            { icon: '💰', text: 'Earn up to 30% commission per referral' },
            { icon: '🏆', text: 'Get certified and showcase your skills' },
            { icon: '🚀', text: 'Build your own business from home' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <span className="text-xl">{icon}</span>
              <p className="text-gray-300 text-sm">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-start justify-center px-4 py-8 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile header */}
          <div className="lg:hidden flex justify-center mb-6">
            <Image src="/logo.png" alt="TruLearnix" width={140} height={36} className="object-contain" priority />
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">Create your account</h1>
            <p className="text-gray-400 text-sm mt-1">Fill in your details to get started</p>
          </div>

          {/* Referral banner */}
          {(ref || promo) && (
            <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/25 rounded-xl px-4 py-3 mb-5">
              <Sparkles className="w-4 h-4 text-green-400 flex-shrink-0" />
              <div>
                <p className="text-green-400 text-xs font-semibold">Referral code applied: <span className="font-bold">{ref || promo}</span></p>
                <p className="text-green-400/70 text-xs">You'll get a discount on checkout</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label="Full Name" icon={User} error={errors.name?.message}>
              <input {...register('name')} placeholder="Rahul Kumar" className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors text-sm" />
            </Field>

            <Field label="Email Address" icon={Mail} error={errors.email?.message}>
              <input {...register('email')} type="email" placeholder="you@example.com" className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors text-sm" />
            </Field>

            <Field label="Mobile Number" icon={Phone} error={errors.phone?.message}>
              <input {...register('phone')} type="tel" placeholder="9876543210" className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors text-sm" />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Age" icon={Calendar} error={errors.age?.message}>
                <input {...register('age')} type="number" min="15" max="80" placeholder="25" className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors text-sm" />
              </Field>

              <Field label="Country" icon={Globe} error={errors.country?.message}>
                <select {...register('country')} onChange={e => { setCountry(e.target.value) }} className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500 transition-colors text-sm appearance-none cursor-pointer">
                  <option value="India">India</option>
                  <option value="Other">Other</option>
                </select>
              </Field>
            </div>

            <Field label="State" icon={MapPin} error={errors.state?.message}>
              {country === 'India' ? (
                <select {...register('state')} className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500 transition-colors text-sm appearance-none cursor-pointer">
                  <option value="">Select your state</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <input {...register('state')} placeholder="Enter your state/province" className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors text-sm" />
              )}
            </Field>

            <div className="pt-1">
              <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white transition-all bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : <>Create Account & Get OTP <ChevronRight className="w-4 h-4" /></>}
              </button>
            </div>

            <div className="flex items-center gap-2 py-1">
              <Shield className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
              <p className="text-gray-600 text-xs">Your information is secure and will never be shared</p>
            </div>

            <p className="text-center text-gray-500 text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}
