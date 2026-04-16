'use client'
import { useQuery } from '@tanstack/react-query'
import { partnerAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { useState, useCallback } from 'react'
import { Trophy, Download, Share2, Lock, Star, Sparkles, X, CheckCircle2, Crown, Zap, Users, Coins } from 'lucide-react'

// ── Poster Color Palettes ─────────────────────────────────────────────────────
const POSTER_PALETTES = [
  { bg1: '#0f0520', bg2: '#1a0a3a', bg3: '#050c1f', p: '139,92,246', s: '99,102,241', label: '#c4b5fd', accent: '#a78bfa' },
  { bg1: '#020d1f', bg2: '#051a35', bg3: '#020810', p: '6,182,212',  s: '59,130,246',  label: '#a5f3fc', accent: '#67e8f9' },
  { bg1: '#1a0800', bg2: '#2d1000', bg3: '#0f0400', p: '245,158,11', s: '249,115,22',  label: '#fde68a', accent: '#fbbf24' },
  { bg1: '#001a0e', bg2: '#002d1a', bg3: '#000f08', p: '16,185,129', s: '20,184,166',  label: '#a7f3d0', accent: '#6ee7b7' },
  { bg1: '#1a0510', bg2: '#2d0820', bg3: '#0f0208', p: '244,63,94',  s: '236,72,153',  label: '#fecdd3', accent: '#fda4af' },
  { bg1: '#020d1f', bg2: '#050520', bg3: '#01060f', p: '14,165,233', s: '99,102,241',  label: '#bae6fd', accent: '#7dd3fc' },
]

// ── Card Themes (inline styles) ───────────────────────────────────────────────
const CARD_THEMES = [
  { bg: 'rgba(91,33,182,0.3)', border: 'rgba(139,92,246,0.5)', glow: 'rgba(124,58,237,0.3)', icon: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', btn: 'linear-gradient(90deg,#7c3aed,#6d28d9)', num: '#c4b5fd', shadow: 'rgba(139,92,246,0.4)' },
  { bg: 'rgba(22,78,99,0.35)',  border: 'rgba(6,182,212,0.5)',  glow: 'rgba(6,182,212,0.25)',  icon: 'linear-gradient(135deg,#06b6d4,#2563eb)', btn: 'linear-gradient(90deg,#0891b2,#1d4ed8)', num: '#67e8f9', shadow: 'rgba(6,182,212,0.4)' },
  { bg: 'rgba(120,53,15,0.35)', border: 'rgba(245,158,11,0.5)', glow: 'rgba(245,158,11,0.25)', icon: 'linear-gradient(135deg,#f59e0b,#ea580c)', btn: 'linear-gradient(90deg,#d97706,#c2410c)', num: '#fde68a', shadow: 'rgba(245,158,11,0.4)' },
  { bg: 'rgba(6,78,59,0.35)',   border: 'rgba(16,185,129,0.5)', glow: 'rgba(16,185,129,0.25)', icon: 'linear-gradient(135deg,#10b981,#0d9488)', btn: 'linear-gradient(90deg,#059669,#0f766e)', num: '#6ee7b7', shadow: 'rgba(16,185,129,0.4)' },
  { bg: 'rgba(136,19,55,0.35)', border: 'rgba(244,63,94,0.5)',  glow: 'rgba(244,63,94,0.25)',  icon: 'linear-gradient(135deg,#f43f5e,#ec4899)', btn: 'linear-gradient(90deg,#e11d48,#db2777)', num: '#fda4af', shadow: 'rgba(244,63,94,0.4)' },
  { bg: 'rgba(12,74,110,0.35)', border: 'rgba(14,165,233,0.5)', glow: 'rgba(14,165,233,0.25)', icon: 'linear-gradient(135deg,#0ea5e9,#4f46e5)', btn: 'linear-gradient(90deg,#0284c7,#4338ca)', num: '#7dd3fc', shadow: 'rgba(14,165,233,0.4)' },
]

// ── Canvas Poster Generator ───────────────────────────────────────────────────
async function generateAchievementPoster(opts: {
  userName: string
  avatar?: string
  badge: string
  title: string
  description: string
  earnedAt: Date | null
  affiliateCode: string
  themeIndex: number
}): Promise<string> {
  const W = 1080, H = 1080
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!
  const pal = POSTER_PALETTES[opts.themeIndex % POSTER_PALETTES.length]
  const { p, s } = pal

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, pal.bg1); bg.addColorStop(0.5, pal.bg2); bg.addColorStop(1, pal.bg3)
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

  // Glow top-left
  const g1 = ctx.createRadialGradient(0, 0, 0, 0, 0, 700)
  g1.addColorStop(0, `rgba(${p},0.3)`); g1.addColorStop(1, 'transparent')
  ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H)

  // Glow bottom-right
  const g2 = ctx.createRadialGradient(W, H, 0, W, H, 600)
  g2.addColorStop(0, `rgba(${s},0.2)`); g2.addColorStop(1, 'transparent')
  ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H)

  // Decorative rings
  const drawRing = (x: number, y: number, r: number, a: number) => {
    ctx.save(); ctx.strokeStyle = `rgba(${p},${a})`; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); ctx.restore()
  }
  drawRing(W/2, H/2, 460, 0.08)
  drawRing(W/2, H/2, 400, 0.06)
  drawRing(W/2, H/2, 340, 0.05)

  // Stars
  const stars = [[80,80],[1000,100],[50,500],[1030,480],[200,950],[880,970],[540,60],[400,1020]]
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  stars.forEach(([x,y]) => { ctx.beginPath(); ctx.arc(x,y,2,0,Math.PI*2); ctx.fill() })

  // ── Top branding bar ──
  ctx.fillStyle = `rgba(${p},0.12)`
  ctx.beginPath(); ctx.roundRect(50, 50, W-100, 70, 18); ctx.fill()
  ctx.strokeStyle = `rgba(${p},0.3)`; ctx.lineWidth = 1.5; ctx.stroke()
  ctx.font = 'bold 30px Arial'; ctx.fillStyle = pal.label; ctx.textAlign = 'center'
  ctx.fillText('TruLearnix Partner Network', W/2, 93)

  // ── "ACHIEVEMENT UNLOCKED" banner ──
  ctx.fillStyle = 'rgba(251,191,36,0.15)'
  ctx.beginPath(); ctx.roundRect(W/2-200, 148, 400, 52, 26); ctx.fill()
  ctx.strokeStyle = 'rgba(251,191,36,0.4)'; ctx.lineWidth = 1.5; ctx.stroke()
  ctx.font = 'bold 21px Arial'; ctx.fillStyle = '#fbbf24'; ctx.textAlign = 'center'
  ctx.fillText('✦  ACHIEVEMENT UNLOCKED  ✦', W/2, 181)

  // ── Profile photo ──
  const photoX = W/2, photoY = 340, photoR = 120
  // Outer glow
  const photoGlow = ctx.createRadialGradient(photoX, photoY, 0, photoX, photoY, photoR + 60)
  photoGlow.addColorStop(0, `rgba(${p},0.3)`); photoGlow.addColorStop(1, 'transparent')
  ctx.fillStyle = photoGlow; ctx.beginPath(); ctx.arc(photoX, photoY, photoR+60, 0, Math.PI*2); ctx.fill()

  // Gradient ring around photo
  ctx.save()
  ctx.beginPath(); ctx.arc(photoX, photoY, photoR + 8, 0, Math.PI * 2)
  const ringGrad = ctx.createLinearGradient(photoX - photoR, photoY - photoR, photoX + photoR, photoY + photoR)
  ringGrad.addColorStop(0, `rgba(${p},1)`); ringGrad.addColorStop(0.5, `rgba(${s},0.8)`); ringGrad.addColorStop(1, '#fbbf24')
  ctx.fillStyle = ringGrad; ctx.fill(); ctx.restore()

  // Load avatar
  let photoLoaded = false
  if (opts.avatar) {
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image(); i.crossOrigin = 'anonymous'
        i.onload = () => resolve(i); i.onerror = reject
        i.src = opts.avatar!
      })
      ctx.save()
      ctx.beginPath(); ctx.arc(photoX, photoY, photoR, 0, Math.PI * 2); ctx.clip()
      ctx.drawImage(img, photoX - photoR, photoY - photoR, photoR * 2, photoR * 2)
      ctx.restore()
      photoLoaded = true
    } catch (_) {}
  }
  if (!photoLoaded) {
    // Initials fallback
    ctx.save()
    ctx.beginPath(); ctx.arc(photoX, photoY, photoR, 0, Math.PI * 2)
    const initGrad = ctx.createLinearGradient(photoX - photoR, photoY - photoR, photoX + photoR, photoY + photoR)
    initGrad.addColorStop(0, `rgba(${p},1)`); initGrad.addColorStop(1, `rgba(${s},1)`)
    ctx.fillStyle = initGrad; ctx.fill(); ctx.restore()
    ctx.font = 'bold 90px Arial'; ctx.fillStyle = '#fff'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(opts.userName[0]?.toUpperCase() || '?', photoX, photoY)
    ctx.textBaseline = 'alphabetic'
  }

  // ── Badge emoji overlay (bottom-right of photo) ──
  const bx = photoX + photoR - 10, by = photoY + photoR - 10, br = 52
  ctx.save()
  ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI*2)
  const badgeBg = ctx.createLinearGradient(bx-br, by-br, bx+br, by+br)
  badgeBg.addColorStop(0, `rgba(${p},1)`); badgeBg.addColorStop(1, `rgba(${s},1)`)
  ctx.fillStyle = badgeBg; ctx.fill()
  ctx.strokeStyle = pal.bg1; ctx.lineWidth = 4; ctx.stroke()
  ctx.restore()
  ctx.font = '52px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(opts.badge, bx, by)
  ctx.textBaseline = 'alphabetic'

  // ── User name ──
  ctx.font = 'bold 56px Arial'; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'
  ctx.fillText(opts.userName, W/2, 530)

  // ── "has achieved" ──
  ctx.font = '28px Arial'; ctx.fillStyle = `rgba(${p},0.7)`; ctx.textAlign = 'center'
  ctx.fillText('has achieved', W/2, 578)

  // ── Achievement title ──
  ctx.font = 'bold 70px Arial'; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'
  ctx.fillText(opts.title, W/2, 670)

  // ── Description ──
  ctx.font = '26px Arial'; ctx.fillStyle = `rgba(${p},0.75)`
  const words = opts.description.split(' ')
  let line = '', descY = 725
  for (const word of words) {
    const test = line + word + ' '
    if (ctx.measureText(test).width > 820 && line) {
      ctx.fillText(line.trim(), W/2, descY); line = word + ' '; descY += 36
    } else line = test
  }
  if (line.trim()) ctx.fillText(line.trim(), W/2, descY)

  // ── Divider ──
  const divY = descY + 50
  const divG = ctx.createLinearGradient(150, divY, W-150, divY)
  divG.addColorStop(0, 'transparent'); divG.addColorStop(0.3, `rgba(${p},0.5)`)
  divG.addColorStop(0.7, `rgba(${p},0.5)`); divG.addColorStop(1, 'transparent')
  ctx.strokeStyle = divG; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(150, divY); ctx.lineTo(W-150, divY); ctx.stroke()

  // ── Affiliate code + date ──
  ctx.font = 'bold 24px Arial'; ctx.fillStyle = `rgba(${p},0.8)`;
  ctx.fillText(`Affiliate Code: ${opts.affiliateCode}`, W/2, divY + 50)

  if (opts.earnedAt) {
    ctx.font = '22px Arial'; ctx.fillStyle = 'rgba(156,163,175,0.7)'
    ctx.fillText(new Date(opts.earnedAt).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}), W/2, divY + 88)
  }

  // ── Bottom bar ──
  ctx.fillStyle = `rgba(${p},0.1)`
  ctx.beginPath(); ctx.roundRect(50, H-95, W-100, 65, 18); ctx.fill()
  ctx.strokeStyle = `rgba(${p},0.25)`; ctx.lineWidth = 1.5; ctx.stroke()
  ctx.font = 'bold 26px Arial'; ctx.fillStyle = pal.accent; ctx.textAlign = 'center'
  ctx.fillText('turlearnix.com  ·  Learn. Earn. Grow.', W/2, H-52)

  return canvas.toDataURL('image/png')
}

// ── Achievement Card ──────────────────────────────────────────────────────────
function AchievementCard({ a, index, onDownload }: { a: any; index: number; onDownload: () => void }) {
  const t = CARD_THEMES[index % CARD_THEMES.length]
  return (
    <div
      className="relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer group"
      style={{ background: a.earned ? t.bg : 'rgba(15,15,25,0.6)', borderColor: a.earned ? t.border : 'rgba(255,255,255,0.08)', borderWidth: 1, borderStyle: 'solid' }}
      onClick={a.earned ? onDownload : undefined}
    >
      {/* Top accent line */}
      {a.earned && (
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg,transparent,rgba(${POSTER_PALETTES[index%6].p},0.8),transparent)` }} />
      )}
      {/* Glow orb */}
      {a.earned && (
        <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl pointer-events-none" style={{ background: t.glow }} />
      )}

      <div className="p-4 sm:p-5">
        {/* Badge */}
        <div className="relative w-fit mx-auto mb-3">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto"
            style={a.earned ? { background: t.icon, boxShadow: `0 8px 24px ${t.shadow}` } : { background: 'rgba(255,255,255,0.05)', filter: 'grayscale(1)' }}
          >
            {a.badge}
          </div>
          {a.earned && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-3 h-3 text-green-900" />
            </div>
          )}
          {!a.earned && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(15,15,25,0.9)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Lock className="w-2.5 h-2.5 text-gray-600" />
            </div>
          )}
        </div>

        {/* Title + desc */}
        <p className={`font-bold text-sm text-center leading-tight ${a.earned ? 'text-white' : 'text-gray-600'}`}>{a.title}</p>
        <p className={`text-[11px] text-center mt-1 leading-relaxed line-clamp-2 ${a.earned ? 'text-gray-400' : 'text-gray-700'}`}>{a.description}</p>

        {/* Requirement / date */}
        {!a.earned ? (
          <div className="mt-2.5 flex items-center justify-center gap-1 text-[10px] text-gray-700">
            <Lock className="w-2.5 h-2.5" /> {a.requirement}
          </div>
        ) : (
          <div className="mt-2.5 space-y-2">
            {a.earnedAt && (
              <p className="text-[10px] text-center" style={{ color: `rgba(${POSTER_PALETTES[index%6].p},0.7)` }}>
                {new Date(a.earnedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            )}
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: `rgba(${POSTER_PALETTES[index%6].p},1)` }}>
              <Download className="w-3 h-3" /> Download Poster
            </div>
          </div>
        )}
      </div>

      {/* Earned shimmer overlay on hover */}
      {a.earned && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl" style={{ background: `linear-gradient(135deg, rgba(${POSTER_PALETTES[index%6].p},0.08), transparent)` }} />
      )}
    </div>
  )
}

// ── Poster Modal ──────────────────────────────────────────────────────────────
function PosterModal({ posterUrl, title, onClose, onDownload, onShare }: {
  posterUrl: string; title: string; onClose: () => void; onDownload: () => void; onShare: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-4 -right-4 z-10 w-9 h-9 rounded-full bg-dark-800 border border-white/15 flex items-center justify-center text-gray-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
        <p className="text-white font-bold text-center mb-3">{title}</p>
        <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
          <img src={posterUrl} alt="Achievement Poster" className="w-full" />
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={onDownload} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95" style={{ background: 'linear-gradient(90deg,#7c3aed,#4f46e5)', boxShadow: '0 4px 15px rgba(124,58,237,0.3)' }}>
            <Download className="w-4 h-4" /> Download PNG
          </button>
          <button onClick={onShare} className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-80" style={{ color: '#25D366', background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.25)' }}>
            <Share2 className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-gray-600 text-xs mt-2">Long-press on mobile to save</p>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AchievementsPage() {
  const { user } = useAuthStore()
  const { data, isLoading } = useQuery({
    queryKey: ['partner-achievements'],
    queryFn: () => partnerAPI.achievements().then(r => r.data),
  })

  const [posterUrl, setPosterUrl] = useState<string | null>(null)
  const [posterAch, setPosterAch] = useState<any>(null)
  const [generating, setGenerating] = useState<string | null>(null)

  const achievements: any[] = data?.achievements || []
  const partnerUser = data?.user || {}
  const earned = achievements.filter(a => a.earned)
  const locked = achievements.filter(a => !a.earned)
  const pct = achievements.length > 0 ? Math.round((earned.length / achievements.length) * 100) : 0

  const handleDownload = useCallback(async (a: any, index: number) => {
    setGenerating(a._id)
    try {
      const url = await generateAchievementPoster({
        userName: partnerUser.name || user?.name || 'Partner',
        avatar: partnerUser.avatar || user?.avatar,
        badge: a.badge,
        title: a.title,
        description: a.description,
        earnedAt: a.earnedAt,
        affiliateCode: partnerUser.affiliateCode || (user as any)?.affiliateCode || '',
        themeIndex: index,
      })
      setPosterUrl(url)
      setPosterAch({ ...a, _index: index })
    } catch (e) { console.error(e) }
    setGenerating(null)
  }, [partnerUser, user])

  const downloadPoster = () => {
    if (!posterUrl || !posterAch) return
    const a = document.createElement('a')
    a.href = posterUrl
    a.download = `trulearnix-${posterAch.title.replace(/\s+/g,'-').toLowerCase()}.png`
    a.click()
  }

  const sharePoster = useCallback(() => {
    if (!posterAch) return
    const msg = `🏆 I just unlocked *${posterAch.title}* on TruLearnix!\n\n${posterAch.description}\n\nJoin me on TruLearnix!\n👉 turlearnix.com/register?ref=${partnerUser.affiliateCode || (user as any)?.affiliateCode || ''}`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }, [posterAch, partnerUser, user])

  if (isLoading) return (
    <div className="space-y-5 animate-pulse">
      <div className="h-40 rounded-3xl" style={{ background: 'rgba(91,33,182,0.2)' }} />
      <div className="grid grid-cols-3 gap-3">
        {[...Array(9)].map((_,i) => <div key={i} className="h-36 rounded-2xl bg-dark-800" />)}
      </div>
    </div>
  )

  return (
    <div className="space-y-5 pb-12">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8" style={{ background: 'linear-gradient(135deg, rgba(91,33,182,0.5) 0%, rgba(49,46,129,0.4) 50%, rgba(12,74,110,0.4) 100%)', border: '1px solid rgba(139,92,246,0.3)' }}>
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(139,92,246,0.2)' }} />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(14,165,233,0.15)' }} />

        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="px-3 py-1 rounded-full flex items-center gap-1.5" style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)' }}>
              <Trophy className="w-3 h-3 text-violet-300" />
              <span className="text-violet-300 text-[11px] font-bold uppercase tracking-wider">Partner Achievements</span>
            </div>
          </div>
          <h1 className="text-white text-2xl sm:text-3xl font-black mb-1">Your Achievements</h1>
          <p className="text-sm mb-5" style={{ color: 'rgba(196,181,253,0.6)' }}>Unlock badges, download posters, share your journey</p>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Unlocked', value: `${earned.length}/${achievements.length}`, icon: Trophy, color: 'text-amber-300' },
              { label: 'Total Earnings', value: `₹${((partnerUser.totalEarnings||0)).toLocaleString()}`, icon: Coins, color: 'text-green-300' },
              { label: 'Progress', value: `${pct}%`, icon: Zap, color: 'text-violet-300' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-2xl p-3.5 text-center" style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
                <p className={`text-base font-black ${color}`}>{value}</p>
                <p className="text-white/50 text-[10px] mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex justify-between text-[11px] text-white/50 mb-2">
              <span>{earned.length} achievements unlocked</span>
              <span className="font-bold text-violet-300">{pct}%</span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#8b5cf6,#06b6d4)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Earned ── */}
      {earned.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" />
            <h2 className="text-white font-bold">Unlocked ({earned.length})</h2>
            <span className="text-[11px] text-gray-500 ml-1">Tap any card to generate poster</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {earned.map((a: any) => {
              const idx = achievements.findIndex(x => x._id === a._id)
              return (
                <AchievementCard key={a._id} a={a} index={idx}
                  onDownload={() => handleDownload(a, idx)} />
              )
            })}
          </div>
        </div>
      )}

      {/* ── Locked ── */}
      {locked.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-gray-600" />
            <h2 className="text-white font-bold">Locked ({locked.length})</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {locked.map((a: any) => {
              const idx = achievements.findIndex(x => x._id === a._id)
              return <AchievementCard key={a._id} a={a} index={idx} onDownload={() => {}} />
            })}
          </div>
        </div>
      )}

      {achievements.length === 0 && (
        <div className="text-center py-16 rounded-2xl" style={{ background: 'rgba(15,15,25,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Trophy className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">No achievements yet</p>
          <p className="text-gray-500 text-sm">Admin will configure achievements soon</p>
        </div>
      )}

      {/* Poster modal */}
      {posterUrl && posterAch && (
        <PosterModal
          posterUrl={posterUrl}
          title={posterAch.title}
          onClose={() => setPosterUrl(null)}
          onDownload={downloadPoster}
          onShare={sharePoster}
        />
      )}

      {/* Generating overlay */}
      {generating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(15,15,30,0.95)', border: '1px solid rgba(139,92,246,0.3)' }}>
            <div className="w-14 h-14 rounded-full border-2 border-violet-400 border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-white font-semibold">Creating your poster...</p>
            <p className="text-gray-500 text-sm mt-1">Generating achievement certificate</p>
          </div>
        </div>
      )}
    </div>
  )
}
