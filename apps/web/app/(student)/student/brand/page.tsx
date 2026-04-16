'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Star, Copy, Linkedin, Globe, Sparkles, CheckCircle, Zap, Link2, ExternalLink, Plus, X, Pencil, Save, Loader2, RefreshCw, Upload, Camera } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { jobsAPI, userAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'

const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }

export default function PersonalBrandPage() {
  const { user, updateUser } = useAuthStore()
  const qc = useQueryClient()

  const [linkedinSummary, setLinkedinSummary] = useState('')
  const [generatingSummary, setGeneratingSummary] = useState(false)
  const [extraSkills, setExtraSkills] = useState('')
  const [newSkill, setNewSkill] = useState('')
  const [editingBio, setEditingBio] = useState(false)
  const [bio, setBio] = useState((user as any)?.bio || '')
  const [editingLinkedin, setEditingLinkedin] = useState(false)
  const [linkedinUrl, setLinkedinUrl] = useState((user as any)?.socialLinks?.linkedin || '')
  const [editingHeadline, setEditingHeadline] = useState(false)
  const [headline, setHeadline] = useState((user as any)?.headline || '')

  // Fetch full brand profile (completeness + real data)
  const { data: brandData, refetch: refetchBrand } = useQuery({
    queryKey: ['brand-profile'],
    queryFn: () => jobsAPI.brandProfile().then(r => r.data),
    staleTime: 60000,
  })

  const profile = brandData?.profile
  const completeness = brandData?.completeness || {}
  const certCount = brandData?.certCount || 0

  const skills: string[] = profile?.expertise || (user as any)?.expertise || []
  const portfolioSlug = (profile?.name || user?.name || 'user').toLowerCase().replace(/\s+/g, '-')
  const portfolioUrl = `peptly.in/portfolio/${portfolioSlug}`

  // Completeness items
  const items = [
    { label: 'Profile Photo', done: completeness.avatar, href: '/student/profile', tip: 'Upload a photo' },
    { label: 'LinkedIn Link', done: completeness.linkedin, action: () => setEditingLinkedin(true), tip: 'Add LinkedIn URL' },
    { label: 'Skills Added', done: completeness.skills, action: () => document.getElementById('skill-input')?.focus(), tip: 'Add your skills' },
    { label: 'Portfolio Published', done: completeness.portfolio, href: '/student/courses', tip: 'Enroll in a course' },
    { label: 'First Certificate', done: completeness.certificate, href: '/student/certificates', tip: `${certCount} earned` },
  ]
  const doneCount = items.filter(i => i.done).length
  const pct = Math.round((doneCount / items.length) * 100)
  const circumference = 2 * Math.PI * 54

  // Update profile mutation
  const updateMut = useMutation({
    mutationFn: (data: any) => userAPI.update(data),
    onSuccess: (res) => {
      if (res.data?.user) updateUser(res.data.user)
      qc.invalidateQueries({ queryKey: ['brand-profile'] })
      toast.success('Saved!')
    },
    onError: () => toast.error('Failed to save'),
  })

  // Add skill
  const addSkill = () => {
    const s = newSkill.trim()
    if (!s) return
    if (skills.includes(s)) { setNewSkill(''); return }
    const updated = [...skills, s]
    updateMut.mutate({ expertise: updated })
    setNewSkill('')
  }

  // Remove skill
  const removeSkill = (skill: string) => {
    updateMut.mutate({ expertise: skills.filter(s => s !== skill) })
  }

  // Save LinkedIn
  const saveLinkedin = () => {
    updateMut.mutate({ socialLinks: { ...(profile?.socialLinks || {}), linkedin: linkedinUrl } })
    setEditingLinkedin(false)
  }

  // Save bio
  const saveBio = () => {
    updateMut.mutate({ bio })
    setEditingBio(false)
  }

  // Generate LinkedIn summary via AI
  const generateLinkedIn = async () => {
    setGeneratingSummary(true)
    try {
      const res = await jobsAPI.linkedinSummary({ extraSkills })
      setLinkedinSummary(res.data.summary)
    } catch {
      toast.error('Generation failed. Try again.')
    } finally {
      setGeneratingSummary(false)
    }
  }

  return (
    <div className="space-y-5 max-w-4xl pb-8">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Star className="w-6 h-6 text-amber-400" /> Personal Brand Builder
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Build your professional identity and attract opportunities</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main */}
        <div className="lg:col-span-2 space-y-4">

          {/* Profile Completeness */}
          <div className="rounded-3xl p-5" style={{ background: 'rgba(13,13,20,0.95)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-white">Profile Completeness</h2>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-violet-400">{pct}%</span>
                <button onClick={() => refetchBrand()} className="p-1.5 rounded-lg text-gray-500 hover:text-white transition-colors" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-6">
              {/* Ring */}
              <div className="relative w-28 h-28 flex-shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                  <circle cx="60" cy="60" r="54" fill="none" stroke="url(#brandGrad)" strokeWidth="8"
                    strokeLinecap="round" strokeDasharray={circumference}
                    strokeDashoffset={circumference - (pct / 100) * circumference}
                    className="transition-all duration-700" />
                  <defs>
                    <linearGradient id="brandGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#7c3aed" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-white">{pct}%</span>
                  <span className="text-[10px] text-gray-500">complete</span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                {items.map(item => (
                  <div key={item.label} className="flex items-center gap-2.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${item.done ? 'bg-green-500/20' : 'bg-white/5'}`}>
                      <CheckCircle className={`w-3 h-3 ${item.done ? 'text-green-400' : 'text-gray-600'}`} />
                    </div>
                    <span className={`text-sm flex-1 ${item.done ? 'text-white' : 'text-gray-500'}`}>{item.label}</span>
                    {item.done
                      ? <span className="text-[10px] text-green-400 font-semibold">{item.label === 'First Certificate' && certCount > 1 ? `${certCount} earned` : '✓ Done'}</span>
                      : item.href
                        ? <Link href={item.href} className="text-[10px] font-semibold text-violet-400 hover:underline">{item.tip} →</Link>
                        : <button onClick={item.action} className="text-[10px] font-semibold text-violet-400 hover:underline">{item.tip} →</button>
                    }
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="rounded-3xl p-5" style={{ background: 'rgba(13,13,20,0.95)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-white text-sm flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" /> About Me
              </h2>
              {!editingBio
                ? <button onClick={() => { setBio((profile?.bio || (user as any)?.bio || '')); setEditingBio(true) }}
                    className="flex items-center gap-1.5 text-xs text-violet-400 font-semibold hover:underline">
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                : <button onClick={saveBio} disabled={updateMut.isPending}
                    className="flex items-center gap-1.5 text-xs font-bold text-white px-3 py-1.5 rounded-lg"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                    {updateMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                  </button>
              }
            </div>
            {editingBio
              ? <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Write a short bio about yourself…"
                  className="w-full rounded-xl px-4 py-2.5 text-white text-sm resize-none focus:outline-none"
                  style={inputStyle} />
              : <p className="text-gray-400 text-sm leading-relaxed">{profile?.bio || (user as any)?.bio || <span className="text-gray-600 italic">No bio yet. Click Edit to add one.</span>}</p>
            }
          </div>

          {/* Skills Manager */}
          <div className="rounded-3xl p-5" style={{ background: 'rgba(13,13,20,0.95)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <h2 className="font-bold text-white mb-1 flex items-center gap-2">
              <Zap className="w-4 h-4 text-violet-400" /> Skills & Expertise
            </h2>
            <p className="text-gray-500 text-xs mb-4">These skills are used to match you with jobs and generate AI content</p>

            {/* Current skills */}
            <div className="flex flex-wrap gap-2 mb-4 min-h-[32px]">
              {skills.length === 0
                ? <span className="text-gray-600 text-xs italic">No skills added yet</span>
                : skills.map(skill => (
                  <div key={skill} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold group"
                    style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' }}>
                    {skill}
                    <button onClick={() => removeSkill(skill)} className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))
              }
            </div>

            {/* Add skill */}
            <div className="flex gap-2">
              <input id="skill-input" value={newSkill} onChange={e => setNewSkill(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSkill()}
                placeholder="Add a skill (e.g. SEO, Figma, Python)…"
                className="flex-1 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none"
                style={inputStyle} />
              <button onClick={addSkill} disabled={updateMut.isPending}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white whitespace-nowrap"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                {updateMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Add
              </button>
            </div>

            {/* Suggested quick-adds */}
            {skills.length === 0 && (
              <div className="mt-3">
                <p className="text-[10px] text-gray-600 mb-2">Quick add:</p>
                <div className="flex flex-wrap gap-1.5">
                  {['SEO', 'Digital Marketing', 'Content Writing', 'Social Media', 'Facebook Ads', 'Google Ads', 'Canva', 'Email Marketing', 'Copywriting', 'WordPress'].map(s => (
                    <button key={s} onClick={() => {
                      if (skills.includes(s)) return
                      updateMut.mutate({ expertise: [...skills, s] })
                    }}
                      className="text-[10px] px-2 py-1 rounded-lg font-medium text-gray-500 hover:text-violet-400 transition-colors"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      + {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* LinkedIn URL */}
          <div className="rounded-3xl p-5" style={{ background: 'rgba(13,13,20,0.95)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <h2 className="font-bold text-white mb-1 flex items-center gap-2">
              <Linkedin className="w-4 h-4 text-blue-400" /> LinkedIn Profile
            </h2>
            <p className="text-gray-500 text-xs mb-3">Link your LinkedIn to complete your brand profile</p>

            {editingLinkedin ? (
              <div className="flex gap-2">
                <input value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/your-profile"
                  className="flex-1 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none"
                  style={inputStyle} />
                <button onClick={saveLinkedin} disabled={updateMut.isPending}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg,#1d4ed8,#0891b2)' }}>
                  {updateMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => setEditingLinkedin(false)} className="px-3 py-2.5 rounded-xl text-gray-500 hover:text-white" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Linkedin className="w-4 h-4 text-blue-400 flex-shrink-0" />
                {(profile?.socialLinks?.linkedin || linkedinUrl)
                  ? <>
                      <a href={profile?.socialLinks?.linkedin || linkedinUrl} target="_blank" rel="noopener noreferrer"
                        className="text-sm text-blue-400 flex-1 truncate hover:underline">
                        {(profile?.socialLinks?.linkedin || linkedinUrl).replace('https://www.', '').replace('https://', '')}
                      </a>
                      <button onClick={() => { setLinkedinUrl(profile?.socialLinks?.linkedin || ''); setEditingLinkedin(true) }}
                        className="p-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <Pencil className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                      <a href={profile?.socialLinks?.linkedin || linkedinUrl} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded-lg" style={{ background: 'rgba(59,130,246,0.1)' }}>
                        <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                      </a>
                    </>
                  : <>
                      <span className="text-sm text-gray-600 flex-1 italic">Not linked yet</span>
                      <button onClick={() => setEditingLinkedin(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                        style={{ background: 'linear-gradient(135deg,#1d4ed8,#0891b2)' }}>
                        <Plus className="w-3 h-3" /> Add LinkedIn
                      </button>
                    </>
                }
              </div>
            )}
          </div>

          {/* LinkedIn AI Summary Generator */}
          <div className="rounded-3xl p-5" style={{ background: 'rgba(13,13,20,0.95)', border: '1px solid rgba(59,130,246,0.15)' }}>
            <h2 className="font-bold text-white mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" /> AI LinkedIn Summary Generator
            </h2>
            <p className="text-gray-500 text-xs mb-4">AI writes a professional LinkedIn About section based on your skills & bio</p>
            <div className="flex gap-2 mb-4">
              <input value={extraSkills} onChange={e => setExtraSkills(e.target.value)}
                placeholder="Add extra context or skills (optional)…"
                className="flex-1 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none"
                style={inputStyle} />
              <button onClick={generateLinkedIn} disabled={generatingSummary}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white whitespace-nowrap disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#1d4ed8,#0891b2)' }}>
                {generatingSummary
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</>
                  : <><Sparkles className="w-3.5 h-3.5" /> Generate</>}
              </button>
            </div>
            {linkedinSummary && (
              <div className="relative">
                <textarea value={linkedinSummary} onChange={e => setLinkedinSummary(e.target.value)} rows={12}
                  className="w-full rounded-2xl p-4 text-white text-sm resize-none focus:outline-none leading-relaxed"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
                <div className="absolute top-3 right-3 flex gap-1.5">
                  <button onClick={() => generateLinkedIn()} title="Regenerate"
                    className="p-2 rounded-xl transition-colors" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                  <button onClick={() => { navigator.clipboard.writeText(linkedinSummary); toast.success('Copied to clipboard!') }}
                    className="p-2 rounded-xl transition-colors" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <Copy className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </div>
                {(profile?.socialLinks?.linkedin || linkedinUrl) && (
                  <a href={profile?.socialLinks?.linkedin || linkedinUrl} target="_blank" rel="noopener noreferrer"
                    className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg,#1d4ed8,#0891b2)' }}>
                    <Linkedin className="w-4 h-4" /> Open LinkedIn to Paste
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Portfolio URL */}
          <div className="rounded-3xl p-5" style={{ background: 'rgba(13,13,20,0.95)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <h2 className="font-bold text-white mb-1 flex items-center gap-2">
              <Globe className="w-4 h-4 text-green-400" /> Portfolio Page
            </h2>
            <p className="text-gray-500 text-xs mb-3">Your public portfolio — auto-updates as you complete courses & earn certificates</p>
            <div className="flex items-center gap-2 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Link2 className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span className="text-sm text-gray-300 flex-1 truncate">{portfolioUrl}</span>
              <button onClick={() => { navigator.clipboard.writeText(`https://${portfolioUrl}`); toast.success('URL copied!') }}
                className="p-1.5 rounded-lg transition-colors" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <Copy className="w-3.5 h-3.5 text-gray-400" />
              </button>
              <Link href={`/portfolio/${portfolioSlug}`}
                className="p-1.5 rounded-lg transition-colors" style={{ background: 'rgba(34,197,94,0.1)' }}>
                <ExternalLink className="w-3.5 h-3.5 text-green-400" />
              </Link>
            </div>
            {certCount > 0 && (
              <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> {certCount} certificate{certCount > 1 ? 's' : ''} showcased on your portfolio
              </p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Profile Card Preview */}
          <div className="rounded-3xl p-5 text-center" style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.15),rgba(79,70,229,0.08))', border: '1px solid rgba(139,92,246,0.25)' }}>
            <div className="relative w-20 h-20 mx-auto mb-3">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black text-white overflow-hidden"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#ec4899)' }}>
                {(profile?.avatar || (user as any)?.avatar)
                  ? <img src={profile?.avatar || (user as any).avatar} className="w-full h-full object-cover" alt="" />
                  : (profile?.name || user?.name)?.[0]?.toUpperCase()
                }
              </div>
              <Link href="/student/profile"
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', border: '2px solid #0d0d14' }}>
                <Camera className="w-3.5 h-3.5 text-white" />
              </Link>
            </div>
            <p className="font-black text-white">{profile?.name || user?.name}</p>
            <p className="text-gray-500 text-xs mt-0.5">{skills[0] || 'Add skills to show expertise'}</p>
            {(profile?.socialLinks?.linkedin || linkedinUrl) && (
              <a href={profile?.socialLinks?.linkedin || linkedinUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-xs text-blue-400 hover:underline">
                <Linkedin className="w-3 h-3" /> LinkedIn
              </a>
            )}
            <div className="flex justify-center gap-1 mt-3 flex-wrap">
              {skills.slice(0, 3).map(s => (
                <span key={s} className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' }}>
                  {s}
                </span>
              ))}
              {skills.length > 3 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold text-gray-500" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  +{skills.length - 3}
                </span>
              )}
            </div>
            <div className="mt-3 text-center">
              <p className="text-3xl font-black text-violet-400">{pct}%</p>
              <p className="text-[10px] text-gray-500">brand complete</p>
            </div>
          </div>

          {/* Skill Cards (all real skills) */}
          <div className="rounded-3xl p-4" style={{ background: 'rgba(13,13,20,0.95)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 className="font-bold text-white text-sm mb-1 flex items-center gap-2">
              <Zap className="w-4 h-4 text-violet-400" /> Skill Badges
            </h3>
            <p className="text-gray-500 text-xs mb-3">Share your expertise on social media</p>
            {skills.length === 0 ? (
              <p className="text-gray-600 text-xs italic text-center py-4">Add skills to generate badges</p>
            ) : (
              <div className="space-y-2">
                {skills.slice(0, 6).map(skill => (
                  <div key={skill} className="flex items-center justify-between p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.15)' }}>
                        <Zap className="w-3 h-3 text-violet-400" />
                      </div>
                      <span className="text-sm text-white">{skill}</span>
                    </div>
                    <button onClick={() => {
                      const text = `I'm skilled in ${skill}! 🚀 Currently learning & growing on TruLearnix. #${skill.replace(/\s+/g,'')} #Learning #Growth`
                      navigator.clipboard.writeText(text)
                      toast.success('Post text copied!')
                    }} className="text-xs font-semibold text-violet-400 hover:underline">Share</button>
                  </div>
                ))}
                {skills.length > 6 && (
                  <p className="text-[10px] text-gray-600 text-center">+{skills.length - 6} more skills</p>
                )}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="rounded-3xl p-4" style={{ background: 'rgba(13,13,20,0.95)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 className="font-bold text-white text-sm mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: 'Find Jobs with Your Skills', href: '/student/jobs', color: '#a78bfa' },
                { label: 'View Certificates', href: '/student/certificates', color: '#4ade80' },
                { label: 'Update Full Profile', href: '/student/profile', color: '#60a5fa' },
                { label: 'Freelance Opportunities', href: '/student/freelance', color: '#fbbf24' },
              ].map(a => (
                <Link key={a.href} href={a.href}
                  className="flex items-center justify-between p-2.5 rounded-xl group transition-all hover:scale-[1.02]"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="text-xs font-semibold" style={{ color: a.color }}>{a.label}</span>
                  <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" style={{ color: a.color }} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
