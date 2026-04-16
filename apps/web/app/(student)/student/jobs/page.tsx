'use client'
import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { jobsAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import {
  Briefcase, Search, ExternalLink, Zap, DollarSign, Star,
  TrendingUp, Copy, X, Loader2, Sparkles, Globe, ChevronRight,
  Clock, Users, RefreshCw, BookmarkPlus
} from 'lucide-react'

const PLATFORM_CFG: Record<string, { color: string; bg: string; border: string; logo: string }> = {
  Upwork:     { color: '#14a800', bg: 'rgba(20,168,0,0.1)',     border: 'rgba(20,168,0,0.3)',     logo: '🔵' },
  Freelancer: { color: '#29b2fe', bg: 'rgba(41,178,254,0.1)',   border: 'rgba(41,178,254,0.3)',   logo: '🔷' },
  Fiverr:     { color: '#1dbf73', bg: 'rgba(29,191,115,0.1)',   border: 'rgba(29,191,115,0.3)',   logo: '🟢' },
  LinkedIn:   { color: '#0a66c2', bg: 'rgba(10,102,194,0.1)',   border: 'rgba(10,102,194,0.3)',   logo: '🔗' },
  Guru:       { color: '#ff8c00', bg: 'rgba(255,140,0,0.1)',    border: 'rgba(255,140,0,0.3)',    logo: '🟠' },
  Internal:   { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.3)', logo: '⭐' },
}

const PLATFORMS = ['All', 'Upwork', 'Freelancer', 'Fiverr', 'LinkedIn', 'Guru', 'Internal']

function timeAgo(isoStr: string) {
  try {
    const diff = Date.now() - new Date(isoStr).getTime()
    const h = Math.floor(diff / 3600000)
    if (h < 1) return 'Just now'
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  } catch { return 'Recently' }
}

export default function JobEnginePage() {
  const [platform, setPlatform] = useState('All')
  const [search, setSearch] = useState('')
  const [proposalJob, setProposalJob] = useState<any>(null)
  const [proposal, setProposal] = useState('')
  const [saved, setSaved] = useState<Set<string>>(new Set())

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['jobs-feed'],
    queryFn: () => jobsAPI.feed().then(r => r.data),
    staleTime: 5 * 60 * 1000,
  })

  const proposalMut = useMutation({
    mutationFn: (job: any) => jobsAPI.proposal({
      jobTitle: job.title,
      jobDescription: job.description,
      platform: job.platform,
      skills: job.skills,
      budget: job.budget,
    }).then(r => r.data.proposal),
    onSuccess: (text) => setProposal(text),
    onError: () => toast.error('Failed to generate proposal'),
  })

  const openProposal = (job: any) => {
    setProposalJob(job)
    setProposal('')
    proposalMut.mutate(job)
  }

  const jobs: any[] = (data?.jobs || []).filter((j: any) => {
    const matchPlatform = platform === 'All' || j.platform === platform
    const matchSearch = !search || j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.skills?.some((s: string) => s.toLowerCase().includes(search.toLowerCase()))
    return matchPlatform && matchSearch
  })

  const skills: string[] = data?.skills || []
  const platformLinks = data?.platformLinks || {}

  const toggleSave = (id: string) => {
    setSaved(prev => {
      const next = new Set(Array.from(prev))
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
    toast.success(saved.has(id) ? 'Removed from saved' : 'Job saved!')
  }

  return (
    <div className="space-y-5 max-w-5xl pb-8">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-violet-400" /> Job Engine
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Live jobs from Upwork, Freelancer, Fiverr & more — matched to your skills
          </p>
        </div>
        <button onClick={() => refetch()} disabled={isFetching}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold text-white transition-all disabled:opacity-60"
          style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)' }}>
          <RefreshCw className={`w-4 h-4 text-violet-400 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Skill Match Banner */}
      {skills.length > 0 && (
        <div className="rounded-2xl p-3.5 flex items-center gap-3"
          style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
          <Sparkles className="w-4 h-4 text-violet-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-sm text-white font-semibold">Matched to your skills: </span>
            <span className="text-sm text-gray-400">{skills.slice(0, 5).join(' · ')}{skills.length > 5 ? ` +${skills.length - 5} more` : ''}</span>
          </div>
          <a href="/student/brand" className="text-xs text-violet-400 font-semibold hover:underline flex-shrink-0">
            Edit Skills →
          </a>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Live Jobs', value: data?.total || 0, color: '#a78bfa', icon: Briefcase },
          { label: 'Platforms', value: 6, color: '#4ade80', icon: Globe },
          { label: 'Your Skills', value: skills.length, color: '#fbbf24', icon: Star },
          { label: 'AI Proposals', value: 'Free', color: '#60a5fa', icon: Zap },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-3.5 text-center" style={{ background: 'rgba(13,13,20,0.95)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="w-8 h-8 rounded-xl mx-auto mb-1.5 flex items-center justify-center" style={{ background: `${s.color}18` }}>
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
            </div>
            <p className="font-black text-lg" style={{ color: s.color }}>{s.value}</p>
            <p className="text-gray-500 text-[10px]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Platform filter + Search */}
      <div className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          {PLATFORMS.map(p => {
            const pc = PLATFORM_CFG[p]
            return (
              <button key={p} onClick={() => setPlatform(p)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                style={platform === p
                  ? { background: pc ? pc.bg : 'rgba(124,58,237,0.2)', color: pc ? pc.color : '#a78bfa', border: `1px solid ${pc ? pc.border : 'rgba(124,58,237,0.4)'}` }
                  : { background: 'rgba(255,255,255,0.04)', color: '#6b7280', border: '1px solid rgba(255,255,255,0.06)' }}>
                {pc?.logo && <span className="mr-1">{pc.logo}</span>}{p}
              </button>
            )
          })}
        </div>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs or skills…"
            className="w-full rounded-2xl pl-10 pr-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Job List */}
        <div className="lg:col-span-2 space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-9 h-9 animate-spin text-violet-400" />
              <p className="text-gray-500 text-sm">Finding best-matched jobs…</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="rounded-3xl py-16 text-center" style={{ background: 'rgba(13,13,20,0.95)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Briefcase className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-white font-bold">No jobs found</p>
              <p className="text-gray-500 text-sm mt-1">Try a different platform or search term</p>
            </div>
          ) : jobs.map((job: any) => {
            const pc = PLATFORM_CFG[job.platform] || PLATFORM_CFG.Internal
            const isSaved = saved.has(job.id)
            return (
              <div key={job.id} className="rounded-2xl p-4 transition-all hover:scale-[1.005]"
                style={{ background: 'rgba(13,13,20,0.95)', border: `1px solid ${job.hot ? pc.border : 'rgba(255,255,255,0.06)'}` }}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: pc.bg }}>
                    {pc.logo}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <h3 className="font-bold text-white text-sm">{job.title}</h3>
                          {job.hot && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                              style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                              🔥 Hot
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2.5 text-xs text-gray-500 flex-wrap mt-1">
                          <span className="px-2 py-0.5 rounded-full font-semibold" style={{ background: pc.bg, color: pc.color, border: `1px solid ${pc.border}` }}>
                            {job.platform}
                          </span>
                          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-green-400" />{job.budgetINR || job.budget}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(job.posted)}</span>
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{job.proposals} bids</span>
                          <span>{job.type}</span>
                        </div>
                      </div>
                      <button onClick={() => toggleSave(job.id)}
                        className="p-1.5 rounded-lg flex-shrink-0 transition-colors"
                        style={{ background: isSaved ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.05)' }}>
                        <BookmarkPlus className={`w-3.5 h-3.5 ${isSaved ? 'text-violet-400' : 'text-gray-500'}`} />
                      </button>
                    </div>

                    {job.description && (
                      <p className="text-gray-500 text-xs mt-2 line-clamp-2">{job.description}</p>
                    )}

                    {job.skills?.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-2">
                        {job.skills.map((s: string) => (
                          <span key={s} className="text-[10px] px-2 py-0.5 rounded-lg font-medium text-gray-400"
                            style={{ background: 'rgba(255,255,255,0.05)' }}>{s}</span>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      {/* AI Proposal */}
                      <button onClick={() => openProposal(job)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all"
                        style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.3),rgba(245,158,11,0.15))', border: '1px solid rgba(245,158,11,0.3)' }}>
                        <Zap className="w-3 h-3 text-amber-400" /> AI Proposal
                      </button>

                      {/* Apply on Platform */}
                      {job.applyUrl ? (
                        <a href={job.applyUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all"
                          style={{ background: pc.bg, border: `1px solid ${pc.border}`, color: pc.color }}>
                          <ExternalLink className="w-3 h-3" /> Apply on {job.platform}
                        </a>
                      ) : (
                        <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
                          style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80' }}>
                          ⭐ Internal Job
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Platform Quick Links */}
          <div className="rounded-2xl p-4" style={{ background: 'rgba(13,13,20,0.95)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-violet-400" /> Browse Platforms
            </h3>
            <p className="text-gray-500 text-xs mb-3">Search your skills directly on each platform</p>
            <div className="space-y-2">
              {Object.entries(platformLinks).map(([key, link]: [string, any]) => {
                const name = key.charAt(0).toUpperCase() + key.slice(1)
                const pc = PLATFORM_CFG[name] || PLATFORM_CFG.Upwork
                return (
                  <a key={key} href={link.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-xl group transition-all hover:scale-[1.02]"
                    style={{ background: pc.bg, border: `1px solid ${pc.border}` }}>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{pc.logo}</span>
                      <span className="text-xs font-bold" style={{ color: pc.color }}>{name}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" style={{ color: pc.color }} />
                  </a>
                )
              })}
            </div>
          </div>

          {/* Tips */}
          <div className="rounded-2xl p-4" style={{ background: 'rgba(13,13,20,0.95)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" /> Pro Tips
            </h3>
            <ul className="space-y-2">
              {[
                'AI proposals get 3x higher response rates',
                'Apply within 2h of posting for best results',
                'Add more skills in Brand Profile for better matches',
                'Internal jobs have no platform fees',
                'Fiverr: set up your gig first to get inbound orders',
              ].map(tip => (
                <li key={tip} className="flex items-start gap-2 text-xs text-gray-400">
                  <span className="text-green-400 flex-shrink-0 mt-0.5">✓</span> {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Earnings Tracker */}
          <div className="rounded-2xl p-4" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <h3 className="font-bold text-white text-sm mb-1 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" /> Earnings Tracker
            </h3>
            <p className="text-gray-500 text-xs mb-3">Log freelance earnings to track progress</p>
            <EarningsLogger />
          </div>
        </div>
      </div>

      {/* AI Proposal Modal */}
      {proposalJob && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setProposalJob(null)}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6"
            style={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-black text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" /> AI Proposal
              </h3>
              <button onClick={() => setProposalJob(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-500 hover:text-white"
                style={{ background: 'rgba(255,255,255,0.06)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              For: <span className="text-violet-400 font-semibold">{proposalJob.title}</span>
              {' '}·{' '}
              <span style={{ color: PLATFORM_CFG[proposalJob.platform]?.color || '#a78bfa' }}>{proposalJob.platform}</span>
            </p>

            {proposalMut.isPending ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
                <p className="text-gray-400 text-sm">Generating your winning proposal…</p>
              </div>
            ) : (
              <>
                <textarea value={proposal} onChange={e => setProposal(e.target.value)} rows={12}
                  className="w-full rounded-2xl p-4 text-white text-sm resize-none focus:outline-none leading-relaxed"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                <div className="flex gap-3 mt-4 flex-wrap">
                  <button onClick={() => { navigator.clipboard.writeText(proposal); toast.success('Proposal copied!') }}
                    className="flex-1 py-3 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                    <Copy className="w-4 h-4" /> Copy Proposal
                  </button>
                  {proposalJob.applyUrl && (
                    <a href={proposalJob.applyUrl} target="_blank" rel="noopener noreferrer"
                      className="flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                      style={{ background: PLATFORM_CFG[proposalJob.platform]?.bg, color: PLATFORM_CFG[proposalJob.platform]?.color, border: `1px solid ${PLATFORM_CFG[proposalJob.platform]?.border}` }}>
                      <ExternalLink className="w-4 h-4" /> Apply on {proposalJob.platform}
                    </a>
                  )}
                  <button onClick={() => proposalMut.mutate(proposalJob)}
                    className="px-4 py-3 rounded-2xl font-bold text-sm text-gray-400 flex items-center gap-2"
                    style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function EarningsLogger() {
  const [amount, setAmount] = useState('')
  const log = () => {
    if (!amount || isNaN(Number(amount))) return toast.error('Enter a valid amount')
    toast.success(`₹${Number(amount).toLocaleString()} logged!`)
    setAmount('')
  }
  return (
    <div className="flex gap-2">
      <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="₹ Amount" type="number"
        className="flex-1 rounded-xl px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }} />
      <button onClick={log}
        className="px-3 py-2 rounded-xl text-sm font-bold text-green-400"
        style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.25)' }}>
        Log
      </button>
    </div>
  )
}
