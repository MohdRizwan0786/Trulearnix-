'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { adminAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import Image from 'next/image'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return toast.error('Please fill all fields')
    setLoading(true)
    try {
      const res = await adminAPI.login({ email, password })
      const { accessToken, token, user } = res.data
      const authToken = accessToken || token
      if (!authToken) {
        toast.error('Login failed: no token received')
        return
      }
      const allowedRoles = ['superadmin', 'admin', 'manager', 'department_head', 'team_lead', 'employee', 'mentor', 'salesperson']
      if (!allowedRoles.includes(user?.role)) {
        toast.error('Access denied. Admin privileges required.')
        return
      }
      Cookies.set('adminToken', authToken, { expires: 7 })
      localStorage.setItem('adminToken', authToken)
      localStorage.setItem('adminName', user?.name || 'Admin')
      localStorage.setItem('adminRole', user?.role || 'admin')
      localStorage.setItem('adminDept', user?.department || '')
      localStorage.setItem('adminPermissions', JSON.stringify(user?.permissions || []))
      toast.success(`Welcome back, ${user?.name}!`)
      const isLimitedRole = ['mentor', 'salesperson', 'employee', 'team_lead', 'department_head'].includes(user?.role)
      router.push(isLimitedRole ? '/kanban' : '/dashboard')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image src="/logo.png" alt="TruLearnix" width={180} height={45} className="object-contain" priority />
          </div>
          <p className="text-gray-400 mt-1 text-sm">Sign in to manage your platform</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@trulearnix.com"
                className="input pl-10"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="input pl-10 pr-10"
                autoComplete="current-password"
                required
              />
              <button type="button" onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in...</>
            ) : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-gray-600 text-xs mt-6">
          TruLearnix Admin Panel &mdash; Authorized access only
        </p>
      </div>
    </div>
  )
}
