'use client'
import { useEffect, useRef, useState } from 'react'
import { Trophy, Star, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'

interface MilestoneAchiever {
  _id: string
  name: string
  milestone: 50000 | 100000
  achievedAt: string
  avatarUrl?: string
  affiliateCode?: string
}

// ── Canvas Poster Generator ───────────────────────────────────────────────────
function drawPoster(
  canvas: HTMLCanvasElement,
  achiever: MilestoneAchiever,
  idx: number,
) {
  const W = 340, H = 420
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const is1L = achiever.milestone === 100000

  // Palette
  const p = is1L ? '245,158,11' : '139,92,246'   // gold vs violet
  const s = is1L ? '234,88,12'  : '99,102,241'
  const bg1 = is1L ? '#1a0800' : '#0f0520'
  const bg2 = is1L ? '#2d1000' : '#1a0a3a'
  const labelColor = is1L ? '#fde68a' : '#c4b5fd'
  const accentColor = is1L ? '#fbbf24' : '#a78bfa'

  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, W, H)
  bgGrad.addColorStop(0, bg1); bgGrad.addColorStop(1, bg2)
  ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, W, H)

  // Top glow
  const glow = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, 300)
  glow.addColorStop(0, `rgba(${p},0.25)`); glow.addColorStop(1, 'transparent')
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H)

  // Bottom glow
  const glow2 = ctx.createRadialGradient(W / 2, H, 0, W / 2, H, 250)
  glow2.addColorStop(0, `rgba(${s},0.15)`); glow2.addColorStop(1, 'transparent')
  ctx.fillStyle = glow2; ctx.fillRect(0, 0, W, H)

  // Decorative ring
  ctx.save()
  ctx.strokeStyle = `rgba(${p},0.12)`; ctx.lineWidth = 1
  ctx.beginPath(); ctx.arc(W / 2, 160, 130, 0, Math.PI * 2); ctx.stroke()
  ctx.strokeStyle = `rgba(${p},0.07)`; ctx.lineWidth = 1
  ctx.beginPath(); ctx.arc(W / 2, 160, 155, 0, Math.PI * 2); ctx.stroke()
  ctx.restore()

  // ── Header brand strip ──
  ctx.fillStyle = `rgba(${p},0.12)`
  ctx.beginPath(); (ctx as any).roundRect(16, 14, W - 32, 38, 10); ctx.fill()
  ctx.strokeStyle = `rgba(${p},0.3)`; ctx.lineWidth = 1; ctx.stroke()
  ctx.font = 'bold 13px Arial'; ctx.fillStyle = labelColor; ctx.textAlign = 'center'
  ctx.fillText('TruLearnix Partner Network', W / 2, 38)

  // ── ACHIEVEMENT badge ──
  ctx.fillStyle = 'rgba(251,191,36,0.14)'
  ctx.beginPath(); (ctx as any).roundRect(W / 2 - 100, 62, 200, 30, 15); ctx.fill()
  ctx.strokeStyle = 'rgba(251,191,36,0.38)'; ctx.lineWidth = 1; ctx.stroke()
  ctx.font = 'bold 11px Arial'; ctx.fillStyle = '#fbbf24'; ctx.textAlign = 'center'
  ctx.fillText('✦  ACHIEVEMENT UNLOCKED  ✦', W / 2, 82)

  // ── Profile circle ──
  const cx = W / 2, cy = 160, cr = 54
  // Outer glow
  const photoGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr + 40)
  photoGlow.addColorStop(0, `rgba(${p},0.25)`); photoGlow.addColorStop(1, 'transparent')
  ctx.fillStyle = photoGlow; ctx.beginPath(); ctx.arc(cx, cy, cr + 40, 0, Math.PI * 2); ctx.fill()

  // Ring gradient
  const ringGrad = ctx.createLinearGradient(cx - cr, cy - cr, cx + cr, cy + cr)
  ringGrad.addColorStop(0, `rgba(${p},1)`)
  ringGrad.addColorStop(0.5, `rgba(${s},0.8)`)
  ringGrad.addColorStop(1, '#fbbf24')
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, cr + 5, 0, Math.PI * 2)
  ctx.strokeStyle = ringGrad; ctx.lineWidth = 3; ctx.stroke(); ctx.restore()

  // Inner circle fill (for initials fallback)
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.clip()
  const avatarBg = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr)
  avatarBg.addColorStop(0, `rgba(${p},0.4)`); avatarBg.addColorStop(1, `rgba(${s},0.2)`)
  ctx.fillStyle = avatarBg; ctx.fillRect(cx - cr, cy - cr, cr * 2, cr * 2)

  // Initials (always drawn; photo drawn on top if it loads)
  const initials = achiever.name
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() || '')
    .join('')
  ctx.font = `bold ${cr * 0.7}px Arial`; ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(initials, cx, cy)
  ctx.restore()

  // ── Name ──
  ctx.font = 'bold 18px Arial'; ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
  // Truncate long names
  let displayName = achiever.name
  while (ctx.measureText(displayName).width > W - 48 && displayName.length > 4) {
    displayName = displayName.slice(0, -2) + '…'
  }
  ctx.fillText(displayName, W / 2, 240)

  // ── Milestone amount ──
  const amtText = achiever.milestone === 100000 ? '₹1,00,000' : '₹50,000'
  const amtGrad = ctx.createLinearGradient(W / 2 - 80, 0, W / 2 + 80, 0)
  amtGrad.addColorStop(0, accentColor)
  amtGrad.addColorStop(0.5, labelColor)
  amtGrad.addColorStop(1, accentColor)
  ctx.font = 'bold 30px Arial'; ctx.fillStyle = amtGrad
  ctx.textAlign = 'center'; ctx.fillText(amtText, W / 2, 278)

  // Milestone label
  ctx.font = '12px Arial'; ctx.fillStyle = `rgba(${p},0.8)`
  ctx.fillText(is1L ? 'EARNED ₹1 LAKH+' : 'EARNED ₹50,000+', W / 2, 298)

  // ── Divider ──
  const divGrad = ctx.createLinearGradient(40, 0, W - 40, 0)
  divGrad.addColorStop(0, 'transparent')
  divGrad.addColorStop(0.5, `rgba(${p},0.4)`)
  divGrad.addColorStop(1, 'transparent')
  ctx.strokeStyle = divGrad; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(40, 314); ctx.lineTo(W - 40, 314); ctx.stroke()

  // ── Stars ──
  ctx.font = '16px Arial'; ctx.fillStyle = accentColor
  ctx.textAlign = 'center'
  ctx.fillText('★ ★ ★ ★ ★', W / 2, 340)

  // ── Date ──
  const date = new Date(achiever.achievedAt)
  const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  ctx.font = '11px Arial'; ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.fillText(`Achieved on ${dateStr}`, W / 2, 365)

  // ── Affiliate code ──
  if (achiever.affiliateCode) {
    ctx.fillStyle = `rgba(${p},0.12)`
    ctx.beginPath(); (ctx as any).roundRect(W / 2 - 60, 376, 120, 26, 8); ctx.fill()
    ctx.strokeStyle = `rgba(${p},0.25)`; ctx.lineWidth = 1; ctx.stroke()
    ctx.font = 'bold 11px Arial'; ctx.fillStyle = labelColor
    ctx.fillText(achiever.affiliateCode, W / 2, 393)
  }

  // ── Bottom border line ──
  const borderGrad = ctx.createLinearGradient(0, H - 3, W, H - 3)
  borderGrad.addColorStop(0, 'transparent')
  borderGrad.addColorStop(0.5, `rgba(${p},0.6)`)
  borderGrad.addColorStop(1, 'transparent')
  ctx.strokeStyle = borderGrad; ctx.lineWidth = 3
  ctx.beginPath(); ctx.moveTo(0, H - 1.5); ctx.lineTo(W, H - 1.5); ctx.stroke()
}

// ── Single Poster Card ────────────────────────────────────────────────────────
function PosterCard({ achiever, idx }: { achiever: MilestoneAchiever; idx: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    drawPoster(canvas, achiever, idx)

    // If avatar URL exists, load image and redraw over initials
    if (achiever.avatarUrl) {
      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas2 = canvasRef.current
        if (!canvas2) return
        // Redraw the base poster first
        drawPoster(canvas2, achiever, idx)
        const ctx = canvas2.getContext('2d')
        if (!ctx) return
        const cx = 340 / 2, cy = 160, cr = 54
        ctx.save()
        ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.clip()
        ctx.drawImage(img, cx - cr, cy - cr, cr * 2, cr * 2)
        ctx.restore()
      }
      img.onerror = () => {} // keep initials on error
      img.src = achiever.avatarUrl
    }
  }, [achiever, idx])

  const is1L = achiever.milestone === 100000
  return (
    <div
      className="flex-shrink-0 mx-3 rounded-2xl overflow-hidden relative group cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:scale-[1.03]"
      style={{
        width: '170px',
        height: '210px',
        border: `1px solid ${is1L ? 'rgba(245,158,11,0.3)' : 'rgba(139,92,246,0.3)'}`,
        boxShadow: `0 8px 40px ${is1L ? 'rgba(245,158,11,0.12)' : 'rgba(139,92,246,0.12)'}`,
      }}
    >
      {/* Scaled canvas displayed at half size */}
      <canvas
        ref={canvasRef}
        style={{ width: '170px', height: '210px', display: 'block' }}
      />
      {/* Hover overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"
        style={{
          boxShadow: `inset 0 0 0 1.5px ${is1L ? 'rgba(245,158,11,0.7)' : 'rgba(139,92,246,0.7)'}`,
          background: `${is1L ? 'rgba(245,158,11,0.04)' : 'rgba(139,92,246,0.04)'}`,
        }}
      />
      {/* Milestone badge */}
      <div
        className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-black"
        style={{
          background: is1L ? 'rgba(245,158,11,0.2)' : 'rgba(139,92,246,0.2)',
          color: is1L ? '#fbbf24' : '#a78bfa',
          border: `1px solid ${is1L ? 'rgba(245,158,11,0.4)' : 'rgba(139,92,246,0.4)'}`,
        }}
      >
        {is1L ? '1 LAKH' : '50K'}
      </div>
    </div>
  )
}

// ── Main Section ──────────────────────────────────────────────────────────────
export default function EarningMilestonesSection() {
  const [achievers, setAchievers] = useState<MilestoneAchiever[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/affiliate/milestone-achievers`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.milestones?.length) {
          setAchievers(d.milestones)
        }
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  if (!loaded || achievers.length === 0) return null

  // Separate 1L and 50K achievers
  const lakh = achievers.filter(a => a.milestone === 100000)
  const fifty = achievers.filter(a => a.milestone === 50000)
  const combined = [...lakh, ...fifty]
  const loop = [...combined, ...combined] // duplicate for seamless marquee

  return (
    <section
      className="relative py-10 sm:py-14 overflow-hidden"
      style={{ background: '#04050a' }}
    >
      {/* BG orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-40px] left-1/3 w-[350px] h-[350px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-40px] right-1/3 w-[300px] h-[300px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)' }} />
      </div>

      {/* Top divider */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.3), rgba(139,92,246,0.3), transparent)' }} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative z-10 text-center mb-10 px-4"
      >
        <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full"
          style={{ background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-amber-400 text-xs font-black tracking-wide uppercase">Partner Milestones</span>
        </div>
        <h2 className="text-white font-black text-2xl sm:text-3xl md:text-4xl leading-tight">
          Real People,{' '}
          <span style={{ background: 'linear-gradient(90deg,#f59e0b,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Real Earnings
          </span>
        </h2>
        <p className="text-gray-500 text-sm sm:text-base mt-3 max-w-xl mx-auto">
          Our partners have earned ₹50,000 and ₹1,00,000+ from the TruLearnix network.
          You could be next.
        </p>

        {/* Live stats pills */}
        <div className="flex items-center justify-center gap-3 mt-5 flex-wrap">
          {lakh.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{ background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.25)' }}>
              <Star className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-400 text-xs font-black">{lakh.length} Partners crossed ₹1 Lakh</span>
            </div>
          )}
          {fifty.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{ background: 'rgba(139,92,246,0.10)', border: '1px solid rgba(139,92,246,0.25)' }}>
              <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-violet-400 text-xs font-black">{fifty.length} Partners crossed ₹50,000</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Poster marquee */}
      <div className="relative z-10">
        {/* Fade edges */}
        <div className="absolute inset-y-0 left-0 w-24 sm:w-40 z-20 pointer-events-none"
          style={{ background: 'linear-gradient(90deg, #04050a 0%, transparent 100%)' }} />
        <div className="absolute inset-y-0 right-0 w-24 sm:w-40 z-20 pointer-events-none"
          style={{ background: 'linear-gradient(270deg, #04050a 0%, transparent 100%)' }} />

        <div className="overflow-hidden py-3">
          <div className="marquee-fwd flex" style={{ animationDuration: `${Math.max(20, loop.length * 4)}s` }}>
            {loop.map((a, i) => (
              <PosterCard key={`${a._id}-${i}`} achiever={a} idx={i} />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative z-10 text-center mt-8 px-4"
      >
        <a
          href="/courses"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-black text-sm text-white transition-all duration-300 hover:scale-105 hover:shadow-lg"
          style={{
            background: 'linear-gradient(90deg, #f59e0b, #a78bfa)',
            boxShadow: '0 0 24px rgba(245,158,11,0.25)',
          }}
        >
          <Trophy className="w-4 h-4" />
          Start Your Journey Today
        </a>
      </motion.div>

      {/* Bottom divider */}
      <div className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.2), rgba(139,92,246,0.2), transparent)' }} />
    </section>
  )
}
