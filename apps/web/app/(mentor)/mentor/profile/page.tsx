'use client'
import { useState, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { userAPI } from '@/lib/api'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import {
  Save, Loader2, Camera, User, Mail, Phone, BookOpen,
  Twitter, Linkedin, Youtube, GraduationCap, Tag, Globe
} from 'lucide-react'
import toast from 'react-hot-toast'

function AvatarUpload({ value, name, onChange }: { value?: string; name?: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const initials = name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'M'

  const handleFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) return toast.error('Max 5MB allowed')
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      onChange(res.data.url)
      toast.success('Photo updated!')
    } catch { toast.error('Upload failed') }
    finally { setUploading(false) }
  }

  return (
    <div className="flex flex-col items-center">
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      <div
        className="relative w-24 h-24 rounded-3xl overflow-hidden cursor-pointer group border-2 border-indigo-500/30 shadow-xl shadow-indigo-500/10"
        onClick={() => !uploading && inputRef.current?.click()}>
        {value
          ? <img src={value} alt="Avatar" className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <span className="text-white font-black text-2xl">{initials}</span>
            </div>
        }
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {uploading
            ? <Loader2 className="w-6 h-6 text-white animate-spin" />
            : <Camera className="w-6 h-6 text-white" />
          }
        </div>
      </div>
      <p className="text-xs text-gray-600 mt-2">Tap to change photo</p>
    </div>
  )
}

function FormField({ label, icon: Icon, value, onChange, placeholder, type = 'text', textarea }: any) {
  return (
    <div>
      <label className="block text-xs text-gray-400 font-semibold mb-1.5 uppercase tracking-wider">{label}</label>
      <div className="relative">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <Icon className="w-4 h-4 text-gray-600" />
          </div>
        )}
        {textarea
          ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={4}
              className={`w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none ${Icon ? 'pl-10' : ''}`} />
          : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
              className={`w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors ${Icon ? 'pl-10' : ''}`} />
        }
      </div>
    </div>
  )
}

export default function MentorProfile() {
  const { updateUser } = useAuthStore()
  const qc             = useQueryClient()
  const [saving, setSaving]           = useState(false)
  const [form, setForm]               = useState({
    name: '', phone: '', bio: '', expertise: '', avatar: '',
    socialLinks: { twitter: '', linkedin: '', youtube: '' }
  })
  const [initialized, setInitialized] = useState(false)

  const { data: user, isLoading } = useQuery({
    queryKey: ['user-me'],
    queryFn: () => userAPI.me().then(r => r.data.user),
  })

  if (user && !initialized) {
    setForm({
      name: user.name || '', phone: user.phone || '', bio: user.bio || '',
      expertise: Array.isArray(user.expertise) ? user.expertise.join(', ') : (user.expertise || ''),
      avatar: user.avatar || '',
      socialLinks: { twitter: user.socialLinks?.twitter || '', linkedin: user.socialLinks?.linkedin || '', youtube: user.socialLinks?.youtube || '' },
    })
    setInitialized(true)
  }

  const f = (key: string) => (val: string) => setForm(p => ({ ...p, [key]: val }))
  const fSocial = (key: string) => (val: string) => setForm(p => ({ ...p, socialLinks: { ...p.socialLinks, [key]: val } }))

  const handleSave = async () => {
    try {
      setSaving(true)
      const res = await userAPI.update({
        ...form,
        expertise: form.expertise.split(',').map((s: string) => s.trim()).filter(Boolean)
      })
      updateUser(res.data.user)
      qc.invalidateQueries({ queryKey: ['user-me'] })
      toast.success('Profile updated!')
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
      <p className="text-gray-500 text-sm">Loading profile...</p>
    </div>
  )

  return (
    <div className="space-y-5 max-w-2xl">

      {/* Header */}
      <div>
        <p className="text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-1">Settings</p>
        <h1 className="text-2xl md:text-3xl font-black text-white">Mentor Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Update your public mentor information</p>
      </div>

      {/* Profile Card */}
      <div className="relative overflow-hidden rounded-3xl p-6"
        style={{
          background: 'linear-gradient(135deg, rgba(79,70,229,0.18) 0%, rgba(109,40,217,0.12) 50%, rgba(167,40,200,0.06) 100%)',
          border: '1px solid rgba(99,102,241,0.20)'
        }}>
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }} />
        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <AvatarUpload value={form.avatar} name={form.name} onChange={f('avatar')} />
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-black text-white">{user?.name}</h2>
            <div className="flex items-center gap-2 mt-1 justify-center sm:justify-start">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-400 font-semibold">Active Mentor</span>
            </div>
            <p className="text-gray-400 text-sm mt-1 flex items-center gap-1.5 justify-center sm:justify-start">
              <Mail className="w-3.5 h-3.5" /> {user?.email}
            </p>
            {user?.phone && (
              <p className="text-gray-500 text-sm mt-0.5 flex items-center gap-1.5 justify-center sm:justify-start">
                <Phone className="w-3.5 h-3.5" /> {user.phone}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <div className="rounded-2xl bg-[#0f0f1a] border border-white/[0.06] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.05] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center">
            <User className="w-4 h-4 text-indigo-400" />
          </div>
          <h3 className="font-bold text-white">Personal Information</h3>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Full Name"    icon={User}  value={form.name}  onChange={f('name')}  placeholder="Your full name" />
            <FormField label="Phone Number" icon={Phone} value={form.phone} onChange={f('phone')} placeholder="+91 9876543210" type="tel" />
          </div>
          <FormField label="Bio (Public)" value={form.bio} onChange={f('bio')}
            placeholder="Tell students about yourself, your experience, and teaching style..." textarea />
        </div>
      </div>

      {/* Expertise */}
      <div className="rounded-2xl bg-[#0f0f1a] border border-white/[0.06] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.05] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-violet-400" />
          </div>
          <h3 className="font-bold text-white">Expertise</h3>
        </div>
        <div className="p-5">
          <FormField label="Skills & Expertise (comma-separated)" icon={Tag} value={form.expertise}
            onChange={f('expertise')} placeholder="Digital Marketing, SEO, Social Media, Content Writing..." />
          {form.expertise && (
            <div className="flex flex-wrap gap-2 mt-3">
              {form.expertise.split(',').map(s => s.trim()).filter(Boolean).map((tag, i) => (
                <span key={i} className="text-xs px-3 py-1 rounded-full bg-violet-500/12 border border-violet-500/20 text-violet-300 font-medium">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Social Links */}
      <div className="rounded-2xl bg-[#0f0f1a] border border-white/[0.06] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.05] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 flex items-center justify-center">
            <Globe className="w-4 h-4 text-cyan-400" />
          </div>
          <h3 className="font-bold text-white">Social Links</h3>
        </div>
        <div className="p-5 space-y-4">
          <FormField label="Twitter / X"  icon={Twitter}  value={form.socialLinks.twitter}  onChange={fSocial('twitter')}  placeholder="twitter.com/yourhandle"  />
          <FormField label="LinkedIn"     icon={Linkedin} value={form.socialLinks.linkedin} onChange={fSocial('linkedin')} placeholder="linkedin.com/in/yourprofile" />
          <FormField label="YouTube"      icon={Youtube}  value={form.socialLinks.youtube}  onChange={fSocial('youtube')}  placeholder="youtube.com/@yourchannel" />
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black text-base shadow-xl shadow-indigo-500/25 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed">
        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  )
}
