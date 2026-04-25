'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { partnerAPI } from '@/lib/api'
import {
  GraduationCap, CheckCircle2, Calendar, Video, ExternalLink,
  Clock, Lock, Play, FileText, BookOpen, Zap, Tag, ChevronDown,
  ChevronUp, Trophy, Target, Flame, Download, Star, ArrowRight,
  Radio, HelpCircle, Sparkles, Award, TrendingUp, BarChart3,
  ChevronRight, Circle
} from 'lucide-react'
import toast from 'react-hot-toast'

/* ─────────── Type config ─────────── */
const TYPE_CFG: Record<string, { label: string; icon: any; color: string; bg: string; border: string; glow: string }> = {
  video:    { label: 'Video',    icon: Play,       color: 'text-blue-400',   bg: 'bg-blue-500/15',   border: 'border-blue-500/30',   glow: 'shadow-blue-500/20'   },
  pdf:      { label: 'PDF',      icon: FileText,   color: 'text-red-400',    bg: 'bg-red-500/15',    border: 'border-red-500/30',    glow: 'shadow-red-500/20'    },
  resource: { label: 'Resource', icon: BookOpen,   color: 'text-green-400',  bg: 'bg-green-500/15',  border: 'border-green-500/30',  glow: 'shadow-green-500/20'  },
  live:     { label: 'Live',     icon: Radio,      color: 'text-amber-400',  bg: 'bg-amber-500/15',  border: 'border-amber-500/30',  glow: 'shadow-amber-500/20'  },
  quiz:     { label: 'Quiz',     icon: HelpCircle, color: 'text-purple-400', bg: 'bg-purple-500/15', border: 'border-purple-500/30', glow: 'shadow-purple-500/20' },
}
const getType = (t: string) => TYPE_CFG[t] || TYPE_CFG.video

/* ─────────── YouTube / embed helpers ─────────── */
function getYoutubeId(url: string) {
  if (!url) return null
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&\s?]+)/)
  return m ? m[1] : null
}
function getEmbedUrl(url: string) {
  if (!url) return null
  const ytId = getYoutubeId(url)
  if (ytId) return `https://www.youtube.com/embed/${ytId}?rel=0&showinfo=0&autoplay=1`
  if (url.includes('drive.google.com')) {
    const m = url.match(/\/d\/([^/]+)/)
    if (m) return `https://drive.google.com/file/d/${m[1]}/preview`
  }
  if (url.includes('loom.com')) return url.replace('/share/', '/embed/')
  return null
}

/* ─────────── Video Player ─────────── */
function VideoPlayer({ url }: { url: string }) {
  const embedUrl = getEmbedUrl(url)
  if (!embedUrl) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl bg-violet-600/15 border border-violet-500/25 text-violet-300 text-sm font-semibold hover:bg-violet-600/25 transition-all active:scale-[0.98]">
        <ExternalLink className="w-4 h-4" />
        Open Content
      </a>
    )
  }
  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-black shadow-xl shadow-black/50" style={{ paddingBottom: '56.25%' }}>
      <iframe
        src={embedUrl}
        className="absolute inset-0 w-full h-full"
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      />
    </div>
  )
}

/* ─────────── Progress Ring ─────────── */
function ProgressRing({ pct, completed, total }: { pct: number; completed: number; total: number }) {
  const r = 38
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ

  return (
    <div className="relative w-24 h-24 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
        {/* Track */}
        <circle cx="44" cy="44" r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="7" fill="none" />
        {/* Progress */}
        <circle
          cx="44" cy="44" r={r}
          stroke="url(#ringGrad)"
          strokeWidth="7"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)' }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={pct === 100 ? '#34d399' : '#8b5cf6'} />
            <stop offset="100%" stopColor={pct === 100 ? '#10b981' : '#a855f7'} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-lg font-black leading-none ${pct === 100 ? 'text-green-300' : 'text-white'}`}>{pct}%</span>
        <span className="text-dark-400 text-[9px] font-semibold mt-0.5">{completed}/{total}</span>
      </div>
    </div>
  )
}

/* ─────────── Skeleton ─────────── */
function TrainingSkeleton() {
  return (
    <div className="space-y-4">
      {/* Hero skeleton */}
      <div className="h-52 bg-dark-800 rounded-3xl animate-pulse border border-dark-700" />
      {/* Progress bar */}
      <div className="h-2.5 bg-dark-800 rounded-full animate-pulse" />
      {/* Module skeletons */}
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-dark-800 animate-pulse flex-shrink-0" />
          <div className="flex-1 h-20 bg-dark-800 rounded-2xl animate-pulse border border-dark-700" />
        </div>
      ))}
    </div>
  )
}

/* ─────────── Module Card ─────────── */
function ModuleCard({
  mod, idx, total, onComplete, locked
}: {
  mod: any; idx: number; total: number; onComplete: (id: string) => void; locked: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const tc = getType(mod.type)
  const Icon = tc.icon
  const isLast = idx === total - 1

  return (
    <div className="relative flex gap-3 sm:gap-4">
      {/* Timeline column */}
      <div className="flex flex-col items-center flex-shrink-0 pt-1">
        {/* Node button */}
        <button
          onClick={() => !locked && setExpanded(e => !e)}
          disabled={locked}
          className={`relative z-10 w-11 h-11 rounded-full flex items-center justify-center font-black text-sm transition-all flex-shrink-0 ring-4 ring-offset-2 ring-offset-dark-900
            ${locked
              ? 'bg-dark-700 border-2 border-dark-600 text-dark-500 ring-transparent cursor-not-allowed'
              : mod.completed
                ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg shadow-green-500/40 ring-green-500/20'
                : expanded
                  ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/40 ring-violet-500/30'
                  : 'bg-gradient-to-br from-violet-600/60 to-purple-700/60 text-white/80 shadow-md shadow-violet-500/20 ring-transparent hover:ring-violet-500/20'
            }`}
        >
          {locked
            ? <Lock className="w-4 h-4" />
            : mod.completed
              ? <CheckCircle2 className="w-5 h-5" />
              : <span className="text-sm font-black">{mod.day || idx + 1}</span>
          }
        </button>
        {/* Connector line */}
        {!isLast && (
          <div className={`w-0.5 flex-1 mt-1 min-h-[16px] rounded-full transition-colors
            ${mod.completed ? 'bg-gradient-to-b from-green-500/60 to-violet-600/40' : 'bg-dark-700'}`}
          />
        )}
      </div>

      {/* Card */}
      <div className={`flex-1 mb-4 rounded-2xl border overflow-hidden transition-all duration-300
        ${locked
          ? 'bg-dark-800/40 border-dark-700/50 opacity-60'
          : mod.completed
            ? 'bg-green-500/5 border-green-500/20 hover:border-green-500/30'
            : expanded
              ? 'bg-dark-800 border-violet-500/40 shadow-xl shadow-violet-500/10'
              : 'bg-dark-800 border-dark-700 hover:border-dark-600 hover:shadow-lg hover:shadow-black/20'
        }`}
      >
        {/* Card header */}
        <button
          className="w-full text-left p-4"
          onClick={() => !locked && setExpanded(e => !e)}
          disabled={locked}
        >
          <div className="flex items-start gap-3">
            {/* Type icon / thumbnail */}
            {mod.thumbnailUrl ? (
              <img src={mod.thumbnailUrl} alt="" className="w-14 h-10 rounded-xl object-cover flex-shrink-0 border border-dark-600" />
            ) : (
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${tc.bg} border ${tc.border} shadow-md ${tc.glow}`}>
                <Icon className={`w-5 h-5 ${tc.color}`} />
              </div>
            )}

            <div className="flex-1 min-w-0">
              {/* Day + Title */}
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                {mod.day && (
                  <span className="text-[10px] font-black text-dark-400 uppercase tracking-widest bg-dark-700 px-1.5 py-0.5 rounded-md">
                    Day {mod.day}
                  </span>
                )}
              </div>
              <h3 className={`font-bold text-sm leading-snug ${locked ? 'text-dark-500' : mod.completed ? 'text-green-300' : 'text-white'}`}>
                {mod.title}
              </h3>

              {/* Badges row */}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${tc.bg} ${tc.border} ${tc.color}`}>
                  <Icon className="w-2.5 h-2.5" />
                  {tc.label}
                </span>
                {mod.duration && (
                  <span className="flex items-center gap-1 text-dark-400 text-[11px]">
                    <Clock className="w-2.5 h-2.5" />
                    {mod.duration}
                  </span>
                )}
                {mod.completed && (
                  <span className="flex items-center gap-1 text-green-400 text-[11px] font-bold">
                    <CheckCircle2 className="w-3 h-3" />
                    Completed
                  </span>
                )}
                {locked && (
                  <span className="flex items-center gap-1 text-dark-500 text-[11px]">
                    <Lock className="w-2.5 h-2.5" />
                    Complete previous
                  </span>
                )}
              </div>
            </div>

            {/* Chevron */}
            {!locked && (
              <div className="flex-shrink-0">
                {expanded
                  ? <ChevronUp className="w-4 h-4 text-dark-400" />
                  : <ChevronDown className="w-4 h-4 text-dark-500" />
                }
              </div>
            )}
          </div>
        </button>

        {/* Expanded content */}
        {expanded && !locked && (
          <div className="px-4 pb-4 space-y-4 border-t border-dark-700">
            {/* Description */}
            {mod.description && (
              <p className="text-dark-300 text-sm leading-relaxed pt-3">{mod.description}</p>
            )}

            {/* Tags */}
            {mod.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {mod.tags.map((t: string) => (
                  <span key={t} className="text-[10px] bg-dark-700 text-dark-300 border border-dark-600 px-2.5 py-0.5 rounded-full">
                    {t}
                  </span>
                ))}
              </div>
            )}

            {/* Video embed */}
            {mod.videoUrl && <VideoPlayer url={mod.videoUrl} />}

            {/* Resources */}
            {mod.resources?.length > 0 && (
              <div className="space-y-2">
                <p className="text-dark-400 text-[11px] font-bold uppercase tracking-widest">Resources</p>
                {mod.resources.map((r: any, i: number) => (
                  <a
                    key={i}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-dark-700/80 hover:bg-dark-700 border border-dark-600 text-white text-xs font-medium transition-all group hover:border-violet-500/30 active:scale-[0.98]"
                  >
                    <Download className="w-3.5 h-3.5 text-dark-400 group-hover:text-violet-400 transition-colors flex-shrink-0" />
                    <span className="flex-1 truncate">{r.label}</span>
                    <ExternalLink className="w-3 h-3 text-dark-500 flex-shrink-0" />
                  </a>
                ))}
              </div>
            )}

            {/* Mark complete button */}
            {!mod.completed && (
              <button
                onClick={() => onComplete(mod._id)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-green-500/25"
              >
                <CheckCircle2 className="w-4.5 h-4.5" />
                Mark as Complete
              </button>
            )}

            {mod.completed && (
              <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-semibold">
                <Trophy className="w-4 h-4" />
                Module Completed!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─────────── Expandable Tip Card ─────────── */
const TIPS = [
  { title: 'Complete training to unlock bonus Partnership earnings', detail: 'Partners who complete 100% of the training program earn higher Partnership earning rates. Stay consistent and finish every module.', icon: Award, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  { title: 'Follow up within 24 hours for best conversion', detail: 'Leads go cold quickly. The moment you capture a lead, reach out within 24 hours via WhatsApp for the highest conversion rates.', icon: Flame, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  { title: 'Share your partner link everywhere', detail: 'Use your capture link on WhatsApp status, Instagram stories, LinkedIn posts, and Facebook groups to maximize lead flow.', icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  { title: 'Track every lead in CRM consistently', detail: 'Update lead stages after every interaction. Properly tracked leads convert 3x better because you never miss a follow-up.', icon: Target, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
  { title: 'Use the Link Generator for targeted pages', detail: 'Generate links for specific courses to send interested leads directly to the most relevant product page — boosting conversions.', icon: Sparkles, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
]

function TipCard({ tip }: { tip: typeof TIPS[0] }) {
  const [open, setOpen] = useState(false)
  const Icon = tip.icon
  return (
    <div className={`rounded-xl border transition-all ${tip.bg} ${tip.border} overflow-hidden`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <div className={`w-7 h-7 rounded-lg ${tip.bg} border ${tip.border} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-3.5 h-3.5 ${tip.color}`} />
        </div>
        <p className={`flex-1 text-xs font-semibold ${tip.color}`}>{tip.title}</p>
        <ChevronDown className={`w-3.5 h-3.5 text-dark-500 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-3">
          <p className="text-dark-300 text-xs leading-relaxed border-t border-white/5 pt-2.5">{tip.detail}</p>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════ */
export default function TrainingPage() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['partner-training'],
    queryFn: () => partnerAPI.training().then(r => r.data),
  })

  const completeMut = useMutation({
    mutationFn: (id: string) => partnerAPI.completeTraining(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partner-training'] })
      toast.success('Module completed! Keep it up!')
    },
    onError: () => toast.error('Failed to mark complete'),
  })

  const modules: any[] = data?.training || []
  const webinars: any[] = data?.webinars || []
  const totalModules = data?.totalModules || modules.length
  const completedCount = modules.filter(m => m.completed).length
  const pct = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0
  const nextModule = modules.find(m => !m.completed)

  if (isLoading) return (
    <div className="pb-24 sm:pb-8">
      <TrainingSkeleton />
    </div>
  )

  return (
    <div className="space-y-6 pb-24 sm:pb-8">

      {/* ══════════ HERO ══════════ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#120428] via-[#1e0545] to-[#0a1240] border border-violet-500/25 p-5 sm:p-7">
        {/* BG effects */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full bg-violet-600/20 blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-indigo-600/15 blur-3xl" />
          <div className="absolute top-1/3 right-1/3 w-20 h-20 rounded-full bg-purple-500/10 blur-2xl" />
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'linear-gradient(rgba(139,92,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="relative">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 bg-violet-500/15 border border-violet-400/25 px-3 py-1 rounded-full mb-3">
            <Flame className="w-3 h-3 text-violet-300" />
            <span className="text-violet-200 text-[11px] font-bold tracking-wide uppercase">Partner Training Program</span>
          </div>

          <div className="flex items-start justify-between gap-5">
            <div className="flex-1 min-w-0">
              <h1 className="text-white text-2xl sm:text-3xl font-black tracking-tight">
                Training
                <span className="ml-2 text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-300">Center</span>
              </h1>
              <p className="text-violet-300/60 text-sm mt-1">Master skills to grow your partner business</p>

              {/* Stats chips */}
              <div className="mt-4 flex flex-wrap gap-2">
                <div className="flex items-center gap-1.5 bg-white/8 border border-white/10 rounded-xl px-3 py-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-white/80 text-xs font-semibold">{totalModules} modules</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/8 border border-white/10 rounded-xl px-3 py-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-white/80 text-xs font-semibold">{completedCount} done</span>
                </div>
                {nextModule && pct < 100 && (
                  <div className="flex items-center gap-1.5 bg-violet-500/15 border border-violet-500/25 rounded-xl px-3 py-1.5">
                    <Target className="w-3.5 h-3.5 text-violet-400" />
                    <span className="text-violet-300 text-xs font-semibold">
                      Next: {nextModule.day ? `Day ${nextModule.day}` : nextModule.title?.slice(0, 18)}
                    </span>
                  </div>
                )}
                {pct === 100 && (
                  <div className="flex items-center gap-1.5 bg-green-500/15 border border-green-500/25 rounded-xl px-3 py-1.5">
                    <Trophy className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-green-300 text-xs font-bold">Certified Partner!</span>
                  </div>
                )}
              </div>
            </div>

            {/* Progress ring */}
            {totalModules > 0 && (
              <ProgressRing pct={pct} completed={completedCount} total={totalModules} />
            )}
          </div>
        </div>
      </div>

      {/* ══════════ GLOBAL PROGRESS BAR ══════════ */}
      {totalModules > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-dark-400 font-medium">Overall Progress</span>
            <span className={`font-bold ${pct === 100 ? 'text-green-400' : 'text-violet-300'}`}>{completedCount} / {totalModules} modules</span>
          </div>
          <div className="w-full h-2.5 bg-dark-700 rounded-full overflow-hidden border border-dark-600">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${pct === 100 ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-violet-500 to-purple-500'}`}
              style={{ width: `${pct || 1}%` }}
            />
          </div>
        </div>
      )}

      {/* ══════════ NO MODULES EMPTY STATE ══════════ */}
      {modules.length === 0 && (
        <div className="relative overflow-hidden bg-dark-800 border border-dark-700 rounded-3xl py-16 text-center px-6">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-violet-500/5 to-transparent" />
          <div className="pointer-events-none absolute inset-0"
            style={{ backgroundImage: 'radial-gradient(circle at center, rgba(139,92,246,0.07) 0%, transparent 65%)' }} />
          <div className="relative">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/30 animate-pulse" />
              <div className="w-full h-full rounded-3xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <GraduationCap className="w-9 h-9 text-violet-500/50" />
              </div>
            </div>
            <p className="text-white font-bold text-base">Training coming soon!</p>
            <p className="text-dark-500 text-sm mt-1.5 max-w-xs mx-auto leading-relaxed">
              Your training modules are being prepared by the admin team. Check back shortly.
            </p>
          </div>
        </div>
      )}

      {/* ══════════ TRAINING MODULES TIMELINE ══════════ */}
      {modules.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-md shadow-violet-500/30">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-base">Training Modules</h2>
                <p className="text-dark-500 text-xs">{totalModules} modules total</p>
              </div>
            </div>
            {pct > 0 && pct < 100 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
                <Flame className="w-3 h-3 text-violet-400" />
                <span className="text-violet-300 text-xs font-bold">{pct}% done</span>
              </div>
            )}
          </div>

          <div>
            {modules.map((mod, i) => {
              // A module is locked if it's not the first, not completed, and the previous one isn't completed
              const prevCompleted = i === 0 || modules[i - 1]?.completed
              const locked = !mod.completed && !prevCompleted && i > 0

              return (
                <ModuleCard
                  key={mod._id}
                  mod={mod}
                  idx={i}
                  total={modules.length}
                  onComplete={(id) => completeMut.mutate(id)}
                  locked={locked}
                />
              )
            })}
          </div>

          {/* Completion celebration */}
          {pct === 100 && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500/15 via-emerald-500/10 to-transparent border border-green-500/25 p-5 text-center mt-2">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-3 shadow-xl shadow-green-500/30">
                  <Trophy className="w-7 h-7 text-white" />
                </div>
                <p className="text-green-300 font-black text-lg">Training Complete!</p>
                <p className="text-dark-400 text-sm mt-1">You are now a certified TruLearnix partner</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════ WEBINARS ══════════ */}
      {webinars.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-md shadow-blue-500/30">
                <Video className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-base">Upcoming Webinars</h2>
                <p className="text-dark-500 text-xs">Live sessions for partners</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-blue-300 text-[11px] font-bold">Live Soon</span>
            </div>
          </div>

          <div className="space-y-3">
            {webinars.map((w: any) => (
              <div
                key={w._id}
                className="relative overflow-hidden bg-dark-800 rounded-2xl border border-dark-700 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200 p-4"
              >
                {/* Left accent bar */}
                <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-blue-400 via-cyan-400 to-blue-500 rounded-l-2xl" />
                {/* BG glow */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-blue-500/3 to-transparent" />

                <div className="flex items-start gap-3.5 pl-3 relative">
                  <div className="w-11 h-11 rounded-2xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/10">
                    <Video className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm">{w.title}</p>
                    {(w.description || w.message) && (
                      <p className="text-dark-400 text-xs mt-1 line-clamp-2 leading-relaxed">{w.description || w.message}</p>
                    )}
                    <div className="flex items-center justify-between gap-3 mt-2.5 flex-wrap">
                      {w.startDate && (
                        <span className="flex items-center gap-1.5 text-xs text-dark-400">
                          <Calendar className="w-3 h-3 text-blue-400/60" />
                          {new Date(w.startDate).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      )}
                      {w.ctaUrl && (
                        <a
                          href={w.ctaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-bold hover:bg-blue-600/30 active:scale-95 transition-all"
                        >
                          Join Now
                          <ArrowRight className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════ PARTNER SUCCESS TIPS ══════════ */}
      <div className="relative overflow-hidden bg-dark-800 rounded-3xl border border-dark-700 p-5">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/4 to-transparent" />
        <div className="relative">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/30">
              <Star className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Partner Success Tips</h3>
              <p className="text-dark-500 text-xs">Best practices to grow faster</p>
            </div>
          </div>
          <div className="space-y-2">
            {TIPS.map((tip, i) => (
              <TipCard key={i} tip={tip} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
