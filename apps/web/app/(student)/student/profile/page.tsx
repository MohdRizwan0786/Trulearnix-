'use client'
import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { Camera, Save, Loader2, Star, Trophy, Zap, Copy, Check } from 'lucide-react'
import Cookies from 'js-cookie'

const TIER_COLORS: Record<string, string> = {
  free: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  starter: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  pro: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  elite: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  supreme: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
}

export default function ProfilePage() {
  const { user: authUser, updateUser } = useAuthStore()
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const { data: user, isLoading } = useQuery({
    queryKey: ['user-me'],
    queryFn: () => userAPI.me().then(r => r.data.user),
  })

  const [form, setForm] = useState({
    name: '', phone: '', bio: '',
    socialLinks: { twitter: '', linkedin: '', instagram: '', youtube: '' },
  })

  const [initialized, setInitialized] = useState(false)
  if (user && !initialized) {
    setForm({
      name: user.name || '',
      phone: user.phone || '',
      bio: user.bio || '',
      socialLinks: {
        twitter: user.socialLinks?.twitter || '',
        linkedin: user.socialLinks?.linkedin || '',
        instagram: user.socialLinks?.instagram || '',
        youtube: user.socialLinks?.youtube || '',
      },
    })
    setInitialized(true)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const res = await userAPI.update(form)
      updateUser(res.data.user)
      qc.invalidateQueries({ queryKey: ['user-me'] })
      setMsg({ type: 'success', text: 'Profile updated successfully!' })
    } catch (e: any) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'Update failed' })
    } finally {
      setSaving(false)
      setTimeout(() => setMsg(null), 3000)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploading(true)
      const token = Cookies.get('accessToken') || localStorage.getItem('accessToken')
      const formData = new FormData()
      formData.append('avatar', file)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json()
      if (data.success) {
        qc.invalidateQueries({ queryKey: ['user-me'] })
        setMsg({ type: 'success', text: 'Avatar updated!' })
      }
    } catch {
      setMsg({ type: 'error', text: 'Avatar upload failed' })
    } finally {
      setUploading(false)
      setTimeout(() => setMsg(null), 3000)
    }
  }

  const copyAffiliateCode = () => {
    if (user?.affiliateCode) {
      navigator.clipboard.writeText(user.affiliateCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
    </div>
  )

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-white">My Profile</h1>
        <p className="text-gray-400 mt-1">Manage your account information</p>
      </div>

      {msg && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium ${msg.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
          {msg.text}
        </div>
      )}

      {/* Avatar + Stats */}
      <div className="card flex flex-col sm:flex-row items-center gap-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-primary-500/20 flex items-center justify-center overflow-hidden">
            {user?.avatar
              ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
              : <span className="text-4xl font-bold text-primary-400">{user?.name?.[0]?.toUpperCase()}</span>
            }
          </div>
          <button onClick={() => fileRef.current?.click()}
            className="absolute bottom-0 right-0 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Camera className="w-4 h-4 text-white" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
        </div>

        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-xl font-bold text-white">{user?.name}</h2>
          <p className="text-gray-400 text-sm">{user?.email}</p>
          <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border capitalize ${TIER_COLORS[user?.packageTier || 'free']}`}>
              {user?.packageTier || 'Free'} Tier
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-gray-300 border border-white/10 flex items-center gap-1">
              <Zap className="w-3 h-3 text-yellow-400" /> {user?.xpPoints || 0} XP
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-gray-300 border border-white/10 flex items-center gap-1">
              <Star className="w-3 h-3 text-blue-400" /> Level {user?.level || 1}
            </span>
          </div>
        </div>

        {user?.badges && user.badges.length > 0 && (
          <div className="flex gap-2">
            {user.badges.slice(0, 3).map((badge: string) => (
              <div key={badge} className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center" title={badge}>
                <Trophy className="w-5 h-5 text-yellow-400" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Affiliate Code */}
      {user?.isAffiliate && user?.affiliateCode && (
        <div className="card border border-primary-500/30 bg-primary-500/5">
          <p className="text-xs text-gray-400 mb-1">Your Invite Code</p>
          <div className="flex items-center gap-3">
            <code className="text-primary-400 font-bold text-lg">{user.affiliateCode}</code>
            <button onClick={copyAffiliateCode} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-white/5 px-3 py-1.5 rounded-lg">
              {copied ? <><Check className="w-3.5 h-3.5 text-green-400" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
            </button>
          </div>
        </div>
      )}

      {/* Edit Form */}
      <div className="card space-y-5">
        <h3 className="text-lg font-bold text-white">Personal Information</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Full Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="input" placeholder="Your full name" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Phone</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="input" placeholder="+91 98765 43210" />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Bio</label>
          <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            className="input min-h-[100px] resize-none" placeholder="Tell us about yourself..." />
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-300 mb-3">Social Links</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(['twitter', 'linkedin', 'instagram', 'youtube'] as const).map(platform => (
              <div key={platform}>
                <label className="block text-xs text-gray-500 mb-1 capitalize">{platform}</label>
                <input
                  value={form.socialLinks[platform]}
                  onChange={e => setForm(f => ({ ...f, socialLinks: { ...f.socialLinks, [platform]: e.target.value } }))}
                  className="input text-sm" placeholder={`${platform}.com/yourhandle`} />
              </div>
            ))}
          </div>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="btn-primary flex items-center gap-2">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
        </button>
      </div>

      {/* Account Info (readonly) */}
      <div className="card space-y-3">
        <h3 className="text-lg font-bold text-white">Account Info</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Email</p>
            <p className="text-white">{user?.email}</p>
          </div>
          <div>
            <p className="text-gray-500">Role</p>
            <p className="text-white capitalize">{user?.role}</p>
          </div>
          <div>
            <p className="text-gray-500">Member Since</p>
            <p className="text-white">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : '—'}</p>
          </div>
          <div>
            <p className="text-gray-500">Login Count</p>
            <p className="text-white">{user?.loginCount || 0} times</p>
          </div>
        </div>
      </div>
    </div>
  )
}
