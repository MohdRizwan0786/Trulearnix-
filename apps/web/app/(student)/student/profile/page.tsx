'use client'
import { useState, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { userAPI, packageAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import {
  Camera, Loader2, Star, Trophy, Zap, Copy, Check, Link2,
  Phone, UserCheck, Crown, Shield, Mail, Calendar, Hash,
  Wallet, TrendingUp, Users, BadgeCheck, ExternalLink,
  Twitter, Linkedin, Instagram, Youtube, Edit3, Save, X
} from 'lucide-react'
import Link from 'next/link'
import Cookies from 'js-cookie'

const TIER_META: Record<string, { label: string; color: string; bg: string; border: string; glow: string }> = {
  free:    { label: 'Free',    color: '#9ca3af', bg: 'rgba(156,163,175,0.1)', border: 'rgba(156,163,175,0.2)', glow: 'rgba(156,163,175,0.15)' },
  starter: { label: 'Starter', color: '#d1d5db', bg: 'rgba(209,213,219,0.1)', border: 'rgba(209,213,219,0.2)', glow: 'rgba(209,213,219,0.15)' },
  pro:     { label: 'Pro',     color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.3)',  glow: 'rgba(59,130,246,0.2)' },
  elite:   { label: 'Elite',   color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)', glow: 'rgba(139,92,246,0.2)' },
  supreme: { label: 'Supreme', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)',  glow: 'rgba(245,158,11,0.2)' },
}

export default function ProfilePage() {
  const { user: authUser, updateUser } = useAuthStore()
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const { data: user, isLoading } = useQuery({
    queryKey: ['user-me'],
    queryFn: () => userAPI.me().then(r => r.data.user),
  })
  const { data: pkgs } = useQuery({
    queryKey: ['packages'],
    queryFn: () => packageAPI.getAll().then(r => r.data.packages),
    staleTime: 10 * 60 * 1000,
  })

  const [form, setForm] = useState({ bio: '', socialLinks: { twitter: '', linkedin: '', instagram: '', youtube: '' } })
  const [initialized, setInitialized] = useState(false)
  if (user && !initialized) {
    setForm({ bio: user.bio || '', socialLinks: { twitter: user.socialLinks?.twitter || '', linkedin: user.socialLinks?.linkedin || '', instagram: user.socialLinks?.instagram || '', youtube: user.socialLinks?.youtube || '' } })
    setInitialized(true)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const res = await userAPI.update(form)
      updateUser(res.data.user)
      qc.invalidateQueries({ queryKey: ['user-me'] })
      setMsg({ type: 'success', text: 'Profile updated!' })
      setEditMode(false)
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
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData,
      })
      const data = await res.json()
      if (data.success) { qc.invalidateQueries({ queryKey: ['user-me'] }); setMsg({ type: 'success', text: 'Photo updated!' }) }
    } catch { setMsg({ type: 'error', text: 'Upload failed' }) }
    finally { setUploading(false); setTimeout(() => setMsg(null), 3000) }
  }

  const copy = (text: string) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  const tierKey = user?.packageTier || 'free'
  const tierMeta = TIER_META[tierKey] || TIER_META.free
  const pkgDisplayName = pkgs?.find((p: any) => p.tier === tierKey)?.name || tierMeta.label
  const tier = { ...tierMeta, label: pkgDisplayName }
  const isPartner = user?.isAffiliate

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
    </div>
  )

  return (
    <div className="space-y-5 pb-12 max-w-2xl">

      {/* ── Toast ── */}
      {msg && (
        <div className={`fixed top-4 right-4 z-50 rounded-xl px-4 py-3 text-sm font-medium shadow-xl flex items-center gap-2 ${msg.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
          {msg.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />} {msg.text}
        </div>
      )}

      {/* ── Hero Card ── */}
      <div className="relative overflow-hidden rounded-3xl" style={{ background: 'linear-gradient(135deg, rgba(91,33,182,0.5) 0%, rgba(49,46,129,0.4) 50%, rgba(12,74,110,0.35) 100%)', border: '1px solid rgba(139,92,246,0.3)' }}>
        {/* BG glows */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(139,92,246,0.2)' }} />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(14,165,233,0.15)' }} />

        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl overflow-hidden" style={{ boxShadow: `0 0 0 3px rgba(139,92,246,0.5), 0 8px 32px rgba(139,92,246,0.3)` }}>
                {user?.avatar
                  ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-4xl font-black text-white" style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>{user?.name?.[0]?.toUpperCase()}</div>
                }
              </div>
              <button onClick={() => fileRef.current?.click()}
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', boxShadow: '0 4px 12px rgba(124,58,237,0.4)' }}>
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Camera className="w-3.5 h-3.5 text-white" />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-white text-2xl font-black leading-tight">{user?.name}</h1>
              <p className="text-sm mt-0.5" style={{ color: 'rgba(196,181,253,0.7)' }}>{user?.email}</p>

              {/* Badges row */}
              <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style={{ background: tier.bg, color: tier.color, border: `1px solid ${tier.border}` }}>
                  <Crown className="w-3 h-3" /> {tier.label} Tier
                </span>
                {isPartner && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}>
                    <BadgeCheck className="w-3 h-3" /> Partner
                  </span>
                )}
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(255,255,255,0.07)', color: '#fbbf24', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Zap className="w-3 h-3" /> {user?.xpPoints || 0} XP
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(255,255,255,0.07)', color: '#60a5fa', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Star className="w-3 h-3" /> Lvl {user?.level || 1}
                </span>
              </div>
            </div>

            {/* Edit toggle */}
            <button onClick={() => setEditMode(e => !e)}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
              style={editMode ? { background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' } : { background: 'rgba(139,92,246,0.15)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.3)' }}>
              {editMode ? <><X className="w-3.5 h-3.5" /> Cancel</> : <><Edit3 className="w-3.5 h-3.5" /> Edit Profile</>}
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—', icon: Calendar, color: '#a78bfa' },
              { label: isPartner ? 'Total Earnings' : 'XP Points', value: isPartner ? `₹${(user?.totalEarnings || 0).toLocaleString()}` : `${user?.xpPoints || 0}`, icon: isPartner ? TrendingUp : Zap, color: '#34d399' },
              { label: isPartner ? 'Wallet' : 'Level', value: isPartner ? `₹${(user?.wallet || 0).toLocaleString()}` : `Level ${user?.level || 1}`, icon: isPartner ? Wallet : Star, color: '#fbbf24' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-2xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Icon className="w-4 h-4 mx-auto mb-1" style={{ color }} />
                <p className="font-bold text-white text-sm">{value}</p>
                <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Account Info (readonly) ── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(15,15,25,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <h2 className="text-white font-bold flex items-center gap-2 text-sm">
            <Shield className="w-4 h-4 text-violet-400" /> Account Details
          </h2>
        </div>
        <div className="p-5 grid grid-cols-2 gap-4">
          {[
            { label: 'Full Name', value: user?.name, icon: Users, note: 'Contact support to change' },
            { label: 'Phone Number', value: user?.phone || 'Not added', icon: Phone, note: 'Contact support to change' },
            { label: 'Email Address', value: user?.email, icon: Mail },
            { label: 'Role', value: user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '—', icon: BadgeCheck },
          ].map(({ label, value, icon: Icon, note }) => (
            <div key={label}>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="w-3 h-3 text-gray-500" />
                <p className="text-[11px] text-gray-500">{label}</p>
              </div>
              <p className="text-white text-sm font-medium">{value}</p>
              {note && <p className="text-[10px] text-gray-600 mt-0.5">{note}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* ── Bio & Social (editable) ── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(15,15,25,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <h2 className="text-white font-bold flex items-center gap-2 text-sm">
            <Edit3 className="w-4 h-4 text-cyan-400" /> Bio & Social Links
          </h2>
          {!editMode && <span className="text-[11px] text-gray-600">Click "Edit Profile" to update</span>}
        </div>
        <div className="p-5 space-y-4">
          {/* Bio */}
          <div>
            <p className="text-[11px] text-gray-500 mb-1.5">Bio</p>
            {editMode
              ? <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} className="input w-full min-h-[80px] resize-none text-sm" placeholder="Tell us about yourself..." />
              : <p className="text-gray-300 text-sm leading-relaxed">{user?.bio || <span className="text-gray-600 italic">No bio added yet</span>}</p>
            }
          </div>

          {/* Social links */}
          <div>
            <p className="text-[11px] text-gray-500 mb-2">Social Links</p>
            {editMode ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {([
                  { key: 'twitter', label: 'Twitter / X', icon: Twitter, color: '#1d9bf0' },
                  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: '#0a66c2' },
                  { key: 'instagram', label: 'Instagram', icon: Instagram, color: '#e1306c' },
                  { key: 'youtube', label: 'YouTube', icon: Youtube, color: '#ff0000' },
                ] as const).map(({ key, label, icon: Icon, color }) => (
                  <div key={key} className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
                    <input value={form.socialLinks[key]} onChange={e => setForm(f => ({ ...f, socialLinks: { ...f.socialLinks, [key]: e.target.value } }))}
                      className="bg-transparent text-sm text-white placeholder-gray-600 outline-none flex-1 min-w-0" placeholder={`${label} URL`} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'twitter', icon: Twitter, color: '#1d9bf0' },
                  { key: 'linkedin', icon: Linkedin, color: '#0a66c2' },
                  { key: 'instagram', icon: Instagram, color: '#e1306c' },
                  { key: 'youtube', icon: Youtube, color: '#ff0000' },
                ].filter(({ key }) => user?.socialLinks?.[key]).map(({ key, icon: Icon, color }) => (
                  <a key={key} href={user.socialLinks[key]} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all hover:opacity-80"
                    style={{ background: 'rgba(255,255,255,0.06)', color: '#e5e7eb', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <Icon className="w-3.5 h-3.5" style={{ color }} />
                    <ExternalLink className="w-3 h-3 opacity-50" />
                  </a>
                ))}
                {!user?.socialLinks?.twitter && !user?.socialLinks?.linkedin && !user?.socialLinks?.instagram && !user?.socialLinks?.youtube && (
                  <p className="text-gray-600 text-sm italic">No social links added</p>
                )}
              </div>
            )}
          </div>

          {editMode && (
            <button onClick={handleSave} disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'linear-gradient(90deg,#7c3aed,#4f46e5)', boxShadow: '0 4px 15px rgba(124,58,237,0.3)' }}>
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
            </button>
          )}
        </div>
      </div>

      {/* ── Partner Code Card (if partner) ── */}
      {isPartner && user?.affiliateCode && (
        <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(91,33,182,0.3) 0%, rgba(49,46,129,0.2) 100%)', border: '1px solid rgba(139,92,246,0.4)' }}>
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-2xl pointer-events-none" style={{ background: 'rgba(139,92,246,0.2)' }} />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-violet-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"><Hash className="w-3 h-3" /> Your Partner Code</p>
              <Link href="/partner/dashboard" className="flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 transition-colors">
                Partner Panel <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <code className="text-2xl font-black tracking-widest" style={{ color: '#c4b5fd' }}>{user.affiliateCode}</code>
              <button onClick={() => copy(user.affiliateCode)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' }}>
                {copied ? <><Check className="w-3.5 h-3.5 text-green-400" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { label: 'Partnership earning', value: `${user?.commissionRate || 0}%`, color: '#34d399' },
                { label: 'Earnings', value: `₹${(user?.totalEarnings || 0).toLocaleString()}`, color: '#fbbf24' },
                { label: 'Wallet', value: `₹${(user?.wallet || 0).toLocaleString()}`, color: '#60a5fa' },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <p className="font-bold text-sm" style={{ color }}>{value}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Manager & Sponsor ── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(15,15,25,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <h2 className="text-white font-bold flex items-center gap-2 text-sm">
            <UserCheck className="w-4 h-4 text-blue-400" /> Manager & Sponsor
          </h2>
        </div>
        <div className="p-5 grid sm:grid-cols-2 gap-4">

          {/* Manager Card */}
          {(() => {
            const mgr = user?.managerInfo || (user?.managerName ? { name: user.managerName, phone: user.managerPhone, avatar: null } : null)
            return (
              <div className="rounded-2xl p-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.15) 0%, rgba(59,130,246,0.08) 100%)', border: '1px solid rgba(14,165,233,0.25)' }}>
                <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-xl pointer-events-none" style={{ background: 'rgba(14,165,233,0.2)' }} />
                <p className="text-[11px] font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: 'rgba(125,211,252,0.7)' }}>
                  <Users className="w-3 h-3" /> Your Manager
                </p>
                {mgr ? (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex-shrink-0 overflow-hidden" style={{ boxShadow: '0 6px 16px rgba(14,165,233,0.35)' }}>
                      {mgr.avatar
                        ? <img src={mgr.avatar} alt="manager" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-lg font-black text-white" style={{ background: 'linear-gradient(135deg,#0ea5e9,#2563eb)' }}>{mgr.name?.[0]?.toUpperCase()}</div>
                      }
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{mgr.name}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: 'rgba(125,211,252,0.6)' }}>Team Manager</p>
                      {mgr.phone && (
                        <a href={`tel:${mgr.phone}`} className="flex items-center gap-1.5 text-xs mt-1 transition-colors hover:opacity-80" style={{ color: '#7dd3fc' }}>
                          <Phone className="w-3 h-3" /> {mgr.phone}
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(14,165,233,0.1)', border: '1px dashed rgba(14,165,233,0.3)' }}>
                      <Users className="w-5 h-5" style={{ color: 'rgba(14,165,233,0.4)' }} />
                    </div>
                    <p className="text-sm" style={{ color: 'rgba(156,163,175,0.5)' }}>No manager assigned yet</p>
                  </div>
                )}
              </div>
            )
          })()}

          {/* Sponsor Card */}
          {(() => {
            const sp = user?.sponsorInfo || null
            return (
              <div className="rounded-2xl p-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(124,58,237,0.08) 100%)', border: '1px solid rgba(139,92,246,0.25)' }}>
                <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-xl pointer-events-none" style={{ background: 'rgba(139,92,246,0.2)' }} />
                <p className="text-[11px] font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: 'rgba(196,181,253,0.7)' }}>
                  <Crown className="w-3 h-3" /> Referred By (Sponsor)
                </p>
                {sp ? (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex-shrink-0 overflow-hidden" style={{ boxShadow: '0 6px 16px rgba(139,92,246,0.35)' }}>
                      {sp.avatar
                        ? <img src={sp.avatar} alt="sponsor" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-lg font-black text-white" style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' }}>{sp.name?.[0]?.toUpperCase()}</div>
                      }
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{sp.name}</p>
                      {sp.affiliateCode && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <code className="text-xs font-mono font-bold" style={{ color: '#c4b5fd' }}>{sp.affiliateCode}</code>
                          <button onClick={() => copy(sp.affiliateCode)} className="transition-colors hover:opacity-70">
                            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-gray-500" />}
                          </button>
                        </div>
                      )}
                      {sp.phone && (
                        <a href={`tel:${sp.phone}`} className="flex items-center gap-1.5 text-xs mt-1 transition-colors hover:opacity-80" style={{ color: '#c4b5fd' }}>
                          <Phone className="w-3 h-3" /> {sp.phone}
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.1)', border: '1px dashed rgba(139,92,246,0.3)' }}>
                      <Crown className="w-5 h-5" style={{ color: 'rgba(139,92,246,0.4)' }} />
                    </div>
                    <p className="text-sm" style={{ color: 'rgba(156,163,175,0.5)' }}>Not referred by anyone</p>
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      </div>

      {/* ── KYC Status ── */}
      {isPartner && (
        <div className="rounded-2xl p-4 flex items-center justify-between" style={{ background: 'rgba(15,15,25,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
              background: user?.kyc?.status === 'verified' ? 'rgba(16,185,129,0.15)' : user?.kyc?.status === 'submitted' ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${user?.kyc?.status === 'verified' ? 'rgba(16,185,129,0.3)' : user?.kyc?.status === 'submitted' ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.1)'}`,
            }}>
              <Shield className="w-4 h-4" style={{ color: user?.kyc?.status === 'verified' ? '#34d399' : user?.kyc?.status === 'submitted' ? '#fbbf24' : '#6b7280' }} />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">KYC Verification</p>
              <p className="text-xs text-gray-500">Identity & bank verification</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-lg font-semibold capitalize" style={{
              background: user?.kyc?.status === 'verified' ? 'rgba(16,185,129,0.15)' : user?.kyc?.status === 'submitted' ? 'rgba(245,158,11,0.15)' : user?.kyc?.status === 'rejected' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)',
              color: user?.kyc?.status === 'verified' ? '#34d399' : user?.kyc?.status === 'submitted' ? '#fbbf24' : user?.kyc?.status === 'rejected' ? '#f87171' : '#6b7280',
              border: `1px solid ${user?.kyc?.status === 'verified' ? 'rgba(16,185,129,0.3)' : user?.kyc?.status === 'submitted' ? 'rgba(245,158,11,0.3)' : user?.kyc?.status === 'rejected' ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)'}`,
            }}>
              {user?.kyc?.status || 'Pending'}
            </span>
            <Link href="/partner/kyc" className="text-xs font-semibold transition-colors hover:opacity-80" style={{ color: '#a78bfa' }}>
              {user?.kyc?.status === 'verified' ? 'View' : 'Complete →'}
            </Link>
          </div>
        </div>
      )}

    </div>
  )
}
