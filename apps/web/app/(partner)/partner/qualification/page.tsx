'use client'
import { useQuery } from '@tanstack/react-query'
import { partnerAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { useState, useRef, useCallback } from 'react'
import {
  Trophy, Target, CheckCircle2, Lock, Download, Share2,
  Sparkles, TrendingUp, Users, Coins, Star, Crown,
  Zap, X, Gift, Medal
} from 'lucide-react'

// ── Card Color Themes (inline styles to bypass Tailwind purge) ────────────────
const CARD_THEMES = [
  {
    cardStyle: { background: 'linear-gradient(135deg, rgba(91,33,182,0.35) 0%, rgba(76,29,149,0.25) 100%)', borderColor: 'rgba(139,92,246,0.5)' },
    topBarColor: '#a78bfa',
    glowColor: 'rgba(124,58,237,0.25)',
    iconStyle: { background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },
    iconShadow: '0 8px 20px rgba(139,92,246,0.4)',
    barStyle: { background: 'linear-gradient(90deg, #8b5cf6, #6366f1)' },
    btnStyle: { background: 'linear-gradient(90deg, #7c3aed, #6d28d9)', boxShadow: '0 4px 15px rgba(139,92,246,0.3)' },
    numColor: '#c4b5fd',
  },
  {
    cardStyle: { background: 'linear-gradient(135deg, rgba(22,78,99,0.45) 0%, rgba(30,58,138,0.30) 100%)', borderColor: 'rgba(6,182,212,0.5)' },
    topBarColor: '#22d3ee',
    glowColor: 'rgba(6,182,212,0.25)',
    iconStyle: { background: 'linear-gradient(135deg, #06b6d4, #2563eb)' },
    iconShadow: '0 8px 20px rgba(6,182,212,0.4)',
    barStyle: { background: 'linear-gradient(90deg, #06b6d4, #3b82f6)' },
    btnStyle: { background: 'linear-gradient(90deg, #0891b2, #1d4ed8)', boxShadow: '0 4px 15px rgba(6,182,212,0.3)' },
    numColor: '#67e8f9',
  },
  {
    cardStyle: { background: 'linear-gradient(135deg, rgba(120,53,15,0.45) 0%, rgba(154,52,18,0.30) 100%)', borderColor: 'rgba(245,158,11,0.5)' },
    topBarColor: '#fbbf24',
    glowColor: 'rgba(245,158,11,0.25)',
    iconStyle: { background: 'linear-gradient(135deg, #f59e0b, #ea580c)' },
    iconShadow: '0 8px 20px rgba(245,158,11,0.4)',
    barStyle: { background: 'linear-gradient(90deg, #f59e0b, #f97316)' },
    btnStyle: { background: 'linear-gradient(90deg, #d97706, #c2410c)', boxShadow: '0 4px 15px rgba(245,158,11,0.3)' },
    numColor: '#fde68a',
  },
  {
    cardStyle: { background: 'linear-gradient(135deg, rgba(6,78,59,0.45) 0%, rgba(19,78,74,0.30) 100%)', borderColor: 'rgba(16,185,129,0.5)' },
    topBarColor: '#34d399',
    glowColor: 'rgba(16,185,129,0.25)',
    iconStyle: { background: 'linear-gradient(135deg, #10b981, #0d9488)' },
    iconShadow: '0 8px 20px rgba(16,185,129,0.4)',
    barStyle: { background: 'linear-gradient(90deg, #10b981, #14b8a6)' },
    btnStyle: { background: 'linear-gradient(90deg, #059669, #0f766e)', boxShadow: '0 4px 15px rgba(16,185,129,0.3)' },
    numColor: '#6ee7b7',
  },
  {
    cardStyle: { background: 'linear-gradient(135deg, rgba(136,19,55,0.45) 0%, rgba(131,24,67,0.30) 100%)', borderColor: 'rgba(244,63,94,0.5)' },
    topBarColor: '#fb7185',
    glowColor: 'rgba(244,63,94,0.25)',
    iconStyle: { background: 'linear-gradient(135deg, #f43f5e, #ec4899)' },
    iconShadow: '0 8px 20px rgba(244,63,94,0.4)',
    barStyle: { background: 'linear-gradient(90deg, #f43f5e, #ec4899)' },
    btnStyle: { background: 'linear-gradient(90deg, #e11d48, #db2777)', boxShadow: '0 4px 15px rgba(244,63,94,0.3)' },
    numColor: '#fda4af',
  },
  {
    cardStyle: { background: 'linear-gradient(135deg, rgba(12,74,110,0.45) 0%, rgba(49,46,129,0.30) 100%)', borderColor: 'rgba(14,165,233,0.5)' },
    topBarColor: '#38bdf8',
    glowColor: 'rgba(14,165,233,0.25)',
    iconStyle: { background: 'linear-gradient(135deg, #0ea5e9, #4f46e5)' },
    iconShadow: '0 8px 20px rgba(14,165,233,0.4)',
    barStyle: { background: 'linear-gradient(90deg, #0ea5e9, #6366f1)' },
    btnStyle: { background: 'linear-gradient(90deg, #0284c7, #4338ca)', boxShadow: '0 4px 15px rgba(14,165,233,0.3)' },
    numColor: '#7dd3fc',
  },
]

// ── Poster Color Palettes ─────────────────────────────────────────────────────
const POSTER_PALETTES = [
  { // Violet
    bg1: '#0f0520', bg2: '#1a0a3a', bg3: '#050c1f',
    primary: '139,92,246', secondary: '99,102,241',
    brandText: '#c4b5fd', brandLabel: '#a78bfa', codeColor: 'rgba(139,92,246,0.8)',
  },
  { // Cyan/Blue
    bg1: '#020d1f', bg2: '#051a35', bg3: '#020810',
    primary: '6,182,212', secondary: '59,130,246',
    brandText: '#a5f3fc', brandLabel: '#67e8f9', codeColor: 'rgba(6,182,212,0.8)',
  },
  { // Amber/Orange
    bg1: '#1a0800', bg2: '#2d1000', bg3: '#0f0400',
    primary: '245,158,11', secondary: '249,115,22',
    brandText: '#fde68a', brandLabel: '#fbbf24', codeColor: 'rgba(245,158,11,0.8)',
  },
  { // Emerald/Teal
    bg1: '#001a0e', bg2: '#002d1a', bg3: '#000f08',
    primary: '16,185,129', secondary: '20,184,166',
    brandText: '#a7f3d0', brandLabel: '#6ee7b7', codeColor: 'rgba(16,185,129,0.8)',
  },
  { // Rose/Pink
    bg1: '#1a0510', bg2: '#2d0820', bg3: '#0f0208',
    primary: '244,63,94', secondary: '236,72,153',
    brandText: '#fecdd3', brandLabel: '#fda4af', codeColor: 'rgba(244,63,94,0.8)',
  },
  { // Sky/Indigo
    bg1: '#020d1f', bg2: '#050520', bg3: '#01060f',
    primary: '14,165,233', secondary: '99,102,241',
    brandText: '#bae6fd', brandLabel: '#7dd3fc', codeColor: 'rgba(14,165,233,0.8)',
  },
]

// ── Canvas Poster Generator ──────────────────────────────────────────────────
async function generatePoster(opts: {
  userName: string
  avatar?: string
  milestoneTitle: string
  milestoneIcon: string
  reward: string
  gradient: string
  affiliateCode: string
  themeIndex: number
}): Promise<string> {
  const W = 1080, H = 1350
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!

  const pal = POSTER_PALETTES[opts.themeIndex % POSTER_PALETTES.length]
  const p = pal.primary   // e.g. '139,92,246'
  const s = pal.secondary // e.g. '99,102,241'

  // ── Background gradient ──
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, pal.bg1)
  bg.addColorStop(0.45, pal.bg2)
  bg.addColorStop(1, pal.bg3)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // ── Radial glow top ──
  const glow1 = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, 600)
  glow1.addColorStop(0, `rgba(${p},0.35)`)
  glow1.addColorStop(1, `rgba(${p},0)`)
  ctx.fillStyle = glow1
  ctx.fillRect(0, 0, W, H)

  // ── Radial glow bottom ──
  const glow2 = ctx.createRadialGradient(W / 2, H, 0, W / 2, H, 500)
  glow2.addColorStop(0, `rgba(${s},0.25)`)
  glow2.addColorStop(1, `rgba(${s},0)`)
  ctx.fillStyle = glow2
  ctx.fillRect(0, 0, W, H)

  // ── Decorative circles (background) ──
  const drawCircle = (x: number, y: number, r: number, alpha: number) => {
    ctx.save()
    ctx.strokeStyle = `rgba(${p},${alpha})`
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke()
    ctx.restore()
  }
  drawCircle(W / 2, 340, 280, 0.15)
  drawCircle(W / 2, 340, 230, 0.10)
  drawCircle(W / 2, 340, 180, 0.08)

  // ── Star particles ──
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  const stars = [[120,180],[960,150],[80,420],[1000,380],[200,780],[880,820],[150,1100],[920,1050],[540,120],[300,1200],[780,1180]]
  stars.forEach(([sx, sy]) => {
    ctx.beginPath(); ctx.arc(sx, sy, 2, 0, Math.PI * 2); ctx.fill()
  })

  // ── Top branding bar ──
  ctx.fillStyle = `rgba(${p},0.12)`
  ctx.beginPath()
  ctx.roundRect(60, 60, W - 120, 80, 20)
  ctx.fill()
  ctx.strokeStyle = `rgba(${p},0.3)`
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.font = 'bold 36px Arial, sans-serif'
  ctx.fillStyle = pal.brandText
  ctx.textAlign = 'center'
  ctx.fillText('TruLearnix', W / 2, 113)

  // ── "ACHIEVEMENT UNLOCKED" banner ──
  ctx.fillStyle = 'rgba(251,191,36,0.15)'
  ctx.beginPath()
  ctx.roundRect(W / 2 - 220, 170, 440, 60, 30)
  ctx.fill()
  ctx.strokeStyle = 'rgba(251,191,36,0.4)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.font = 'bold 26px Arial, sans-serif'
  ctx.fillStyle = '#fbbf24'
  ctx.letterSpacing = '4px'
  ctx.textAlign = 'center'
  ctx.fillText('✦  ACHIEVEMENT UNLOCKED  ✦', W / 2, 210)

  // ── Profile photo ──
  const photoY = 280, photoR = 120
  ctx.save()
  ctx.beginPath(); ctx.arc(W / 2, photoY, photoR + 8, 0, Math.PI * 2)
  const ringGrad = ctx.createLinearGradient(W/2 - photoR - 8, photoY - photoR - 8, W/2 + photoR + 8, photoY + photoR + 8)
  ringGrad.addColorStop(0, `rgba(${p},1)`)
  ringGrad.addColorStop(0.5, `rgba(${s},0.8)`)
  ringGrad.addColorStop(1, '#fbbf24')
  ctx.fillStyle = ringGrad
  ctx.fill()
  ctx.restore()

  // Try to load avatar
  let photoLoaded = false
  if (opts.avatar) {
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image(); i.crossOrigin = 'anonymous'
        i.onload = () => resolve(i); i.onerror = reject
        i.src = opts.avatar!
      })
      ctx.save()
      ctx.beginPath(); ctx.arc(W / 2, photoY, photoR, 0, Math.PI * 2); ctx.clip()
      ctx.drawImage(img, W / 2 - photoR, photoY - photoR, photoR * 2, photoR * 2)
      ctx.restore()
      photoLoaded = true
    } catch (_) {}
  }
  if (!photoLoaded) {
    ctx.save()
    ctx.beginPath(); ctx.arc(W / 2, photoY, photoR, 0, Math.PI * 2)
    const initGrad = ctx.createLinearGradient(W/2 - photoR, photoY - photoR, W/2 + photoR, photoY + photoR)
    initGrad.addColorStop(0, `rgba(${p},1)`); initGrad.addColorStop(1, `rgba(${s},1)`)
    ctx.fillStyle = initGrad; ctx.fill(); ctx.restore()
    ctx.font = 'bold 96px Arial, sans-serif'
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(opts.userName[0]?.toUpperCase() || '?', W / 2, photoY)
    ctx.textBaseline = 'alphabetic'
  }

  // ── User Name ──
  ctx.font = 'bold 62px Arial, sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.fillText(opts.userName, W / 2, 480)

  // ── "has achieved" text ──
  ctx.font = '32px Arial, sans-serif'
  ctx.fillStyle = `rgba(${p},0.7)`
  ctx.fillText('has achieved', W / 2, 535)

  // ── Milestone Icon + Title ──
  ctx.font = '90px serif'
  ctx.fillText(opts.milestoneIcon, W / 2, 660)

  ctx.font = 'bold 68px Arial, sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.fillText(opts.milestoneTitle, W / 2, 745)

  // ── Divider line ──
  const divGrad = ctx.createLinearGradient(150, 790, W - 150, 790)
  divGrad.addColorStop(0, 'transparent')
  divGrad.addColorStop(0.3, `rgba(${p},0.6)`)
  divGrad.addColorStop(0.7, `rgba(${p},0.6)`)
  divGrad.addColorStop(1, 'transparent')
  ctx.strokeStyle = divGrad; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(150, 790); ctx.lineTo(W - 150, 790); ctx.stroke()

  // ── Reward box ──
  ctx.fillStyle = 'rgba(251,191,36,0.1)'
  ctx.beginPath(); ctx.roundRect(160, 820, W - 320, 110, 20); ctx.fill()
  ctx.strokeStyle = 'rgba(251,191,36,0.3)'; ctx.lineWidth = 1.5; ctx.stroke()

  ctx.font = 'bold 26px Arial, sans-serif'
  ctx.fillStyle = '#fbbf24'
  ctx.textAlign = 'center'
  ctx.fillText('🎁  REWARD', W / 2, 862)

  ctx.font = 'bold 42px Arial, sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.fillText(opts.reward, W / 2, 912)

  // ── Date ──
  ctx.font = '28px Arial, sans-serif'
  ctx.fillStyle = 'rgba(156,163,175,0.8)'
  ctx.textAlign = 'center'
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  ctx.fillText(`Achieved on ${today}`, W / 2, 990)

  // ── Code / reference ──
  ctx.font = 'bold 26px Arial, sans-serif'
  ctx.fillStyle = pal.codeColor
  ctx.fillText(`Affiliate Code: ${opts.affiliateCode}`, W / 2, 1040)

  // ── Bottom branding ──
  ctx.fillStyle = `rgba(${p},0.12)`
  ctx.beginPath(); ctx.roundRect(60, H - 160, W - 120, 100, 20); ctx.fill()
  ctx.strokeStyle = `rgba(${p},0.25)`; ctx.lineWidth = 1.5; ctx.stroke()

  ctx.font = 'bold 34px Arial, sans-serif'
  ctx.fillStyle = pal.brandLabel
  ctx.textAlign = 'center'
  ctx.fillText('TruLearnix Partner Program', W / 2, H - 103)

  ctx.font = '24px Arial, sans-serif'
  ctx.fillStyle = 'rgba(156,163,175,0.7)'
  ctx.fillText('turlearnix.com  ·  Learn. Earn. Grow.', W / 2, H - 68)

  return canvas.toDataURL('image/png')
}

// ── Milestone Card ────────────────────────────────────────────────────────────
function MilestoneCard({ m, summary, onDownload, onShare, index = 0 }: {
  m: any; summary: any; onDownload: () => void; onShare: () => void; index?: number
}) {
  const pct = Math.min(100, (m.current / m.target) * 100)
  const theme = CARD_THEMES[index % CARD_THEMES.length]

  const cardStyle = theme.cardStyle
  const topBarColor = theme.topBarColor
  const glowColor = theme.glowColor
  const iconStyle = theme.iconStyle
  const iconShadow = theme.iconShadow
  const numColor = theme.numColor
  const barStyle = pct > 60 ? { background: 'linear-gradient(90deg, #f59e0b, #eab308)' } : theme.barStyle

  return (
    <div
      className="relative overflow-hidden rounded-2xl border transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl"
      style={{ ...cardStyle, borderWidth: 1, borderStyle: 'solid' }}
    >
      {/* Top glow accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent, ${topBarColor}, transparent)` }}
      />

      {/* Corner glow orb */}
      <div
        className="absolute -top-10 -right-10 w-36 h-36 rounded-full blur-2xl pointer-events-none opacity-70"
        style={{ background: glowColor }}
      />

      <div className="relative p-4 sm:p-5">
        <div className="flex items-start gap-4">
          {/* Icon badge */}
          <div className="relative flex-shrink-0">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ ...iconStyle, boxShadow: iconShadow }}
            >
              {m.icon}
            </div>
            {m.achieved && (
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-green-400 rounded-full flex items-center justify-center shadow-lg" style={{ boxShadow: '0 4px 10px rgba(74,222,128,0.5)' }}>
                <CheckCircle2 className="w-3 h-3 text-green-900" />
              </div>
            )}
            {!m.achieved && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(15,15,25,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Lock className="w-2.5 h-2.5 text-gray-500" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-white font-bold text-base leading-tight">{m.title}</p>
                <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">{m.description}</p>
              </div>
              {m.achieved && (
                <span className="flex-shrink-0 text-[11px] font-bold text-green-400 bg-green-500/15 border border-green-500/25 px-2.5 py-1 rounded-lg whitespace-nowrap">
                  ✓ Achieved
                </span>
              )}
            </div>

            {/* Target + Reward chips */}
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              <span
                className="flex items-center gap-1 text-[11px] bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg"
                style={{ color: numColor }}
              >
                <Target className="w-3 h-3" /> {m.target.toLocaleString()} {m.unit}
              </span>
              <span className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg" style={{ color: '#fcd34d', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
                🎁 {m.reward}
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {!m.achieved ? (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-gray-500">{m.current?.toLocaleString()} / {m.target.toLocaleString()} {m.unit}</span>
              <span className="font-bold" style={{ color: numColor }}>{Math.round(pct)}%</span>
            </div>
            <div className="w-full rounded-full h-2.5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full relative transition-all duration-700"
                style={{ width: `${pct}%`, ...barStyle }}
              >
                {pct > 8 && <div className="absolute right-0 top-0.5 bottom-0.5 w-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.3)' }} />}
              </div>
            </div>
            {m.certificateEnabled && (
              <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Lock className="w-3 h-3 text-gray-600 flex-shrink-0" />
                <span className="text-[11px] text-gray-600">Achieve to unlock your certificate poster</span>
              </div>
            )}
          </div>
        ) : m.certificateEnabled ? (
          <div className="mt-4 space-y-2.5">
            <p className="text-[11px] font-medium flex items-center gap-1.5" style={{ color: 'rgba(74,222,128,0.8)' }}>
              <Sparkles className="w-3 h-3" /> Your achievement poster is ready to download!
            </p>
            <div className="flex gap-2">
              <button onClick={onDownload}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-bold transition-all active:scale-95 hover:opacity-90"
                style={theme.btnStyle}>
                <Download className="w-4 h-4" /> Download Poster
              </button>
              <button onClick={onShare}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-80"
                style={{ color: '#25D366', background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.2)' }}>
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3 text-[11px] text-green-400 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Milestone completed!
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function QualificationPage() {
  const { user } = useAuthStore()
  const { data, isLoading } = useQuery({
    queryKey: ['partner-qualification'],
    queryFn: () => partnerAPI.qualification().then(r => r.data),
  })

  const [posterUrl, setPosterUrl] = useState<string | null>(null)
  const [posterMilestone, setPosterMilestone] = useState<any>(null)
  const [generating, setGenerating] = useState<string | null>(null)

  const milestones: any[] = data?.milestones || []
  const summary = data?.summary || {}
  const partnerUser = data?.user || {}

  const achieved = milestones.filter(m => m.achieved)
  const pending = milestones.filter(m => !m.achieved)
  const nextMilestone = pending[0]

  const handleDownload = useCallback(async (m: any) => {
    setGenerating(m.id || m._id)
    try {
      const themeIndex = milestones.findIndex(ms => (ms.id || ms._id) === (m.id || m._id))
      const url = await generatePoster({
        userName: partnerUser.name || user?.name || 'Partner',
        avatar: partnerUser.avatar || user?.avatar,
        milestoneTitle: m.title,
        milestoneIcon: m.icon,
        reward: m.reward,
        gradient: m.badgeGradient,
        affiliateCode: partnerUser.affiliateCode || user?.affiliateCode || '',
        themeIndex: themeIndex >= 0 ? themeIndex : 0,
      })
      setPosterUrl(url)
      setPosterMilestone(m)
    } catch (e) {
      console.error(e)
    }
    setGenerating(null)
  }, [partnerUser, user])

  const handleShare = useCallback((m: any) => {
    const msg = `🏆 I just achieved *${m.title}* on TruLearnix!\n\n🎁 Reward: ${m.reward}\n\nJoin TruLearnix and grow with us!\n👉 turlearnix.com/register?ref=${partnerUser.affiliateCode || user?.affiliateCode || ''}`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }, [partnerUser, user])

  const downloadPoster = () => {
    if (!posterUrl || !posterMilestone) return
    const a = document.createElement('a')
    a.href = posterUrl
    a.download = `trulearnix-${posterMilestone.title.replace(/\s+/g, '-').toLowerCase()}.png`
    a.click()
  }

  if (isLoading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-44 bg-gradient-to-br from-violet-900/40 to-indigo-900/30 rounded-3xl" />
      <div className="grid grid-cols-3 gap-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-dark-800 rounded-2xl" />)}</div>
      {[...Array(4)].map((_, i) => <div key={i} className="h-36 bg-dark-800 rounded-2xl" />)}
    </div>
  )

  return (
    <div className="space-y-5 pb-12">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 border border-violet-500/30 p-6 sm:p-8">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-12 -right-12 w-56 h-56 bg-violet-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-purple-400/8 rounded-full blur-2xl" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="px-2.5 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center gap-1.5">
              <Trophy className="w-3 h-3 text-violet-300" />
              <span className="text-violet-300 text-[11px] font-bold uppercase tracking-wider">Milestones & Rewards</span>
            </div>
          </div>
          <h1 className="text-white text-2xl sm:text-3xl font-black mb-1">Qualification</h1>
          <p className="text-violet-200/60 text-sm mb-5">Achieve milestones, unlock rewards, download your certificates</p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'L1 Paid Referrals', value: summary.l1Paid ?? 0, icon: Users, color: 'text-violet-300' },
              { label: 'Total Earnings', value: `₹${(summary.totalEarnings ?? 0).toLocaleString()}`, icon: Coins, color: 'text-amber-300' },
              { label: 'Achieved', value: `${achieved.length}/${milestones.length}`, icon: Trophy, color: 'text-green-300' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 border border-white/15 text-center">
                <Icon className={`w-4 h-4 ${color} mx-auto mb-1.5`} />
                <p className={`text-lg font-black ${color}`}>{value}</p>
                <p className="text-white/50 text-[10px] mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Next milestone hint */}
          {nextMilestone && (
            <div className="mt-4 flex items-center gap-3 bg-white/8 border border-white/15 rounded-2xl px-4 py-3">
              <span className="text-2xl">{nextMilestone.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-semibold">Next: {nextMilestone.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-indigo-400 transition-all"
                      style={{ width: `${Math.min(100, (nextMilestone.current / nextMilestone.target) * 100)}%` }} />
                  </div>
                  <span className="text-violet-300 text-[10px] font-bold flex-shrink-0">
                    {nextMilestone.current?.toLocaleString()}/{nextMilestone.target.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Certificate Banner ── */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-900/20 via-orange-900/10 to-yellow-900/10 p-5">
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative flex items-center gap-4">
          {/* Mini poster preview */}
          <div className="w-16 h-20 rounded-xl bg-gradient-to-br from-violet-900 to-indigo-900 border border-violet-500/30 flex-shrink-0 flex flex-col items-center justify-center gap-1 shadow-lg shadow-violet-500/20">
            <span className="text-2xl">{achieved[0]?.icon || milestones[0]?.icon || '🏆'}</span>
            <div className="w-8 h-0.5 bg-violet-400/40 rounded-full" />
            <div className="space-y-0.5">
              <div className="w-7 h-1 bg-white/20 rounded-full" />
              <div className="w-5 h-1 bg-white/10 rounded-full mx-auto" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-amber-300 text-xs font-bold uppercase tracking-wider mb-1">🎨 Achievement Certificate</p>
            <p className="text-white font-bold text-base leading-snug">
              {achieved.length > 0 ? `${achieved.length} certificate${achieved.length > 1 ? 's' : ''} ready to download!` : 'Earn your first certificate'}
            </p>
            <p className="text-gray-400 text-xs mt-0.5">
              {achieved.length > 0 ? 'Beautiful poster with your photo, milestone & TruLearnix branding' : 'Complete a milestone to generate your personalized achievement poster'}
            </p>
          </div>
        </div>
        {achieved.length > 0 ? (
          <div className="mt-4 grid gap-2">
            {achieved.filter(m => m.certificateEnabled).map((m: any) => (
              <button key={m.id || m._id} onClick={() => handleDownload(m)}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600/80 to-indigo-600/80 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-bold transition-all shadow-md shadow-violet-500/20 active:scale-95">
                <span className="text-xl flex-shrink-0">{m.icon}</span>
                <span className="flex-1 text-left">{m.title}</span>
                <Download className="w-4 h-4 flex-shrink-0" />
                <span className="text-[11px] text-violet-200 font-normal flex-shrink-0">Generate Poster</span>
              </button>
            ))}
          </div>
        ) : (
          <button onClick={() => handleDownload({ ...milestones[0], title: 'TruLearnix Partner', icon: '🏆', reward: 'Official Partner', achieved: true, certificateEnabled: true })}
            className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 text-amber-400 border border-amber-500/25 text-sm font-semibold transition-all">
            <Download className="w-4 h-4" /> Preview Sample Certificate
          </button>
        )}
      </div>

      {/* ── Achieved section ── */}
      {achieved.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <h2 className="text-white font-bold">Achieved ({achieved.length})</h2>
            <span className="ml-1 text-[11px] text-gray-500">Tap Download to get your certificate</span>
          </div>
          {achieved.map((m: any, i: number) => (
            <MilestoneCard key={m.id || m._id} m={m} summary={summary} index={i}
              onDownload={() => handleDownload(m)}
              onShare={() => handleShare(m)} />
          ))}
        </div>
      )}

      {/* ── In Progress / Locked ── */}
      {pending.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-violet-400" />
            <h2 className="text-white font-bold">In Progress ({pending.length})</h2>
          </div>
          {pending.map((m: any, i: number) => (
            <MilestoneCard key={m.id || m._id} m={m} summary={summary} index={achieved.length + i}
              onDownload={() => handleDownload(m)}
              onShare={() => handleShare(m)} />
          ))}
        </div>
      )}

      {milestones.length === 0 && (
        <div className="text-center py-16 bg-dark-800/40 rounded-2xl border border-white/8">
          <Trophy className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">No milestones configured</p>
          <p className="text-gray-500 text-sm">Admin will add qualification milestones soon</p>
        </div>
      )}

      {/* ── Poster Preview Modal ── */}
      {posterUrl && posterMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setPosterUrl(null)}>
          <div className="relative w-full max-w-sm" onClick={e => e.stopPropagation()}>
            {/* Close */}
            <button onClick={() => setPosterUrl(null)}
              className="absolute -top-4 -right-4 z-10 w-9 h-9 rounded-full bg-dark-800 border border-white/15 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>

            {/* Image preview */}
            <div className="rounded-2xl overflow-hidden border border-violet-500/30 shadow-2xl shadow-violet-500/20">
              <img src={posterUrl} alt="Achievement Certificate" className="w-full" />
            </div>

            {/* Actions */}
            <div className="mt-3 flex gap-2">
              <button onClick={downloadPoster}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-bold transition-all shadow-lg shadow-violet-500/25">
                <Download className="w-4 h-4" /> Download PNG
              </button>
              <button onClick={() => handleShare(posterMilestone)}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] border border-[#25D366]/25 text-sm font-bold transition-all">
                <Share2 className="w-4 h-4" /> WhatsApp
              </button>
            </div>

            <p className="text-center text-gray-600 text-xs mt-2">
              Long-press the image on mobile to save
            </p>
          </div>
        </div>
      )}

      {/* Generating overlay */}
      {generating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-dark-800 border border-violet-500/30 rounded-2xl p-8 text-center">
            <div className="w-14 h-14 rounded-full border-2 border-violet-500/30 border-t-violet-400 animate-spin mx-auto mb-4" />
            <p className="text-white font-semibold">Generating your certificate...</p>
            <p className="text-gray-500 text-sm mt-1">Creating a stunning poster</p>
          </div>
        </div>
      )}

    </div>
  )
}
