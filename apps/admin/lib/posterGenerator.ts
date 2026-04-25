// Canvas poster generators (qualification + achievement). Mirrors web/partner
// posters so admins can preview and download the exact same image partners see.

const QUAL_PALETTES = [
  { bg1: '#0f0520', bg2: '#1a0a3a', bg3: '#050c1f', primary: '139,92,246', secondary: '99,102,241', brandText: '#c4b5fd', brandLabel: '#a78bfa', codeColor: 'rgba(139,92,246,0.8)' },
  { bg1: '#020d1f', bg2: '#051a35', bg3: '#020810', primary: '6,182,212',  secondary: '59,130,246',  brandText: '#a5f3fc', brandLabel: '#67e8f9', codeColor: 'rgba(6,182,212,0.8)' },
  { bg1: '#1a0800', bg2: '#2d1000', bg3: '#0f0400', primary: '245,158,11', secondary: '249,115,22',  brandText: '#fde68a', brandLabel: '#fbbf24', codeColor: 'rgba(245,158,11,0.8)' },
  { bg1: '#001a0e', bg2: '#002d1a', bg3: '#000f08', primary: '16,185,129', secondary: '20,184,166',  brandText: '#a7f3d0', brandLabel: '#6ee7b7', codeColor: 'rgba(16,185,129,0.8)' },
  { bg1: '#1a0510', bg2: '#2d0820', bg3: '#0f0208', primary: '244,63,94',  secondary: '236,72,153',  brandText: '#fecdd3', brandLabel: '#fda4af', codeColor: 'rgba(244,63,94,0.8)' },
  { bg1: '#020d1f', bg2: '#050520', bg3: '#01060f', primary: '14,165,233', secondary: '99,102,241',  brandText: '#bae6fd', brandLabel: '#7dd3fc', codeColor: 'rgba(14,165,233,0.8)' },
]

const ACH_PALETTES = [
  { bg1: '#0f0520', bg2: '#1a0a3a', bg3: '#050c1f', p: '139,92,246', s: '99,102,241', label: '#c4b5fd', accent: '#a78bfa' },
  { bg1: '#020d1f', bg2: '#051a35', bg3: '#020810', p: '6,182,212',  s: '59,130,246', label: '#a5f3fc', accent: '#67e8f9' },
  { bg1: '#1a0800', bg2: '#2d1000', bg3: '#0f0400', p: '245,158,11', s: '249,115,22', label: '#fde68a', accent: '#fbbf24' },
  { bg1: '#001a0e', bg2: '#002d1a', bg3: '#000f08', p: '16,185,129', s: '20,184,166', label: '#a7f3d0', accent: '#6ee7b7' },
  { bg1: '#1a0510', bg2: '#2d0820', bg3: '#0f0208', p: '244,63,94',  s: '236,72,153', label: '#fecdd3', accent: '#fda4af' },
  { bg1: '#020d1f', bg2: '#050520', bg3: '#01060f', p: '14,165,233', s: '99,102,241', label: '#bae6fd', accent: '#7dd3fc' },
]

export async function generateQualificationPoster(opts: {
  userName: string
  avatar?: string
  milestoneTitle: string
  milestoneIcon: string
  reward: string
  affiliateCode: string
  themeIndex: number
}): Promise<string> {
  const W = 1080, H = 1350
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!

  const pal = QUAL_PALETTES[opts.themeIndex % QUAL_PALETTES.length]
  const p = pal.primary, s = pal.secondary

  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, pal.bg1); bg.addColorStop(0.45, pal.bg2); bg.addColorStop(1, pal.bg3)
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

  const glow1 = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, 600)
  glow1.addColorStop(0, `rgba(${p},0.35)`); glow1.addColorStop(1, `rgba(${p},0)`)
  ctx.fillStyle = glow1; ctx.fillRect(0, 0, W, H)

  const glow2 = ctx.createRadialGradient(W / 2, H, 0, W / 2, H, 500)
  glow2.addColorStop(0, `rgba(${s},0.25)`); glow2.addColorStop(1, `rgba(${s},0)`)
  ctx.fillStyle = glow2; ctx.fillRect(0, 0, W, H)

  const drawCircle = (x: number, y: number, r: number, a: number) => {
    ctx.save(); ctx.strokeStyle = `rgba(${p},${a})`; ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); ctx.restore()
  }
  drawCircle(W / 2, 340, 280, 0.15); drawCircle(W / 2, 340, 230, 0.10); drawCircle(W / 2, 340, 180, 0.08)

  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  const stars = [[120,180],[960,150],[80,420],[1000,380],[200,780],[880,820],[150,1100],[920,1050],[540,120],[300,1200],[780,1180]]
  stars.forEach(([sx, sy]) => { ctx.beginPath(); ctx.arc(sx, sy, 2, 0, Math.PI * 2); ctx.fill() })

  ctx.fillStyle = `rgba(${p},0.12)`
  ctx.beginPath(); ctx.roundRect(60, 60, W - 120, 80, 20); ctx.fill()
  ctx.strokeStyle = `rgba(${p},0.3)`; ctx.lineWidth = 1.5; ctx.stroke()
  ctx.font = 'bold 36px Arial, sans-serif'; ctx.fillStyle = pal.brandText; ctx.textAlign = 'center'
  ctx.fillText('TruLearnix', W / 2, 113)

  ctx.fillStyle = 'rgba(251,191,36,0.15)'
  ctx.beginPath(); ctx.roundRect(W / 2 - 220, 170, 440, 60, 30); ctx.fill()
  ctx.strokeStyle = 'rgba(251,191,36,0.4)'; ctx.lineWidth = 1.5; ctx.stroke()
  ctx.font = 'bold 26px Arial, sans-serif'; ctx.fillStyle = '#fbbf24'; ctx.textAlign = 'center'
  ctx.fillText('✦  ACHIEVEMENT UNLOCKED  ✦', W / 2, 210)

  const photoY = 280, photoR = 120
  ctx.save()
  ctx.beginPath(); ctx.arc(W / 2, photoY, photoR + 8, 0, Math.PI * 2)
  const ringGrad = ctx.createLinearGradient(W/2 - photoR - 8, photoY - photoR - 8, W/2 + photoR + 8, photoY + photoR + 8)
  ringGrad.addColorStop(0, `rgba(${p},1)`); ringGrad.addColorStop(0.5, `rgba(${s},0.8)`); ringGrad.addColorStop(1, '#fbbf24')
  ctx.fillStyle = ringGrad; ctx.fill(); ctx.restore()

  let photoLoaded = false
  if (opts.avatar) {
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image(); i.crossOrigin = 'anonymous'
        i.onload = () => resolve(i); i.onerror = reject
        i.src = opts.avatar!
      })
      ctx.save(); ctx.beginPath(); ctx.arc(W / 2, photoY, photoR, 0, Math.PI * 2); ctx.clip()
      ctx.drawImage(img, W / 2 - photoR, photoY - photoR, photoR * 2, photoR * 2)
      ctx.restore(); photoLoaded = true
    } catch { /* fall through to initials */ }
  }
  if (!photoLoaded) {
    ctx.save(); ctx.beginPath(); ctx.arc(W / 2, photoY, photoR, 0, Math.PI * 2)
    const initGrad = ctx.createLinearGradient(W/2 - photoR, photoY - photoR, W/2 + photoR, photoY + photoR)
    initGrad.addColorStop(0, `rgba(${p},1)`); initGrad.addColorStop(1, `rgba(${s},1)`)
    ctx.fillStyle = initGrad; ctx.fill(); ctx.restore()
    ctx.font = 'bold 96px Arial, sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(opts.userName[0]?.toUpperCase() || '?', W / 2, photoY); ctx.textBaseline = 'alphabetic'
  }

  ctx.font = 'bold 62px Arial, sans-serif'; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'
  ctx.fillText(opts.userName, W / 2, 480)

  ctx.font = '32px Arial, sans-serif'; ctx.fillStyle = `rgba(${p},0.7)`
  ctx.fillText('has achieved', W / 2, 535)

  ctx.font = '90px serif'; ctx.fillText(opts.milestoneIcon, W / 2, 660)
  ctx.font = 'bold 68px Arial, sans-serif'; ctx.fillStyle = '#ffffff'
  ctx.fillText(opts.milestoneTitle, W / 2, 745)

  const divGrad = ctx.createLinearGradient(150, 790, W - 150, 790)
  divGrad.addColorStop(0, 'transparent'); divGrad.addColorStop(0.3, `rgba(${p},0.6)`)
  divGrad.addColorStop(0.7, `rgba(${p},0.6)`); divGrad.addColorStop(1, 'transparent')
  ctx.strokeStyle = divGrad; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(150, 790); ctx.lineTo(W - 150, 790); ctx.stroke()

  ctx.fillStyle = 'rgba(251,191,36,0.1)'
  ctx.beginPath(); ctx.roundRect(160, 820, W - 320, 110, 20); ctx.fill()
  ctx.strokeStyle = 'rgba(251,191,36,0.3)'; ctx.lineWidth = 1.5; ctx.stroke()
  ctx.font = 'bold 26px Arial, sans-serif'; ctx.fillStyle = '#fbbf24'; ctx.textAlign = 'center'
  ctx.fillText('🎁  REWARD', W / 2, 862)
  ctx.font = 'bold 42px Arial, sans-serif'; ctx.fillStyle = '#ffffff'
  ctx.fillText(opts.reward, W / 2, 912)

  ctx.font = '28px Arial, sans-serif'; ctx.fillStyle = 'rgba(156,163,175,0.8)'; ctx.textAlign = 'center'
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  ctx.fillText(`Achieved on ${today}`, W / 2, 990)

  ctx.font = 'bold 26px Arial, sans-serif'; ctx.fillStyle = pal.codeColor
  ctx.fillText(`Affiliate Code: ${opts.affiliateCode}`, W / 2, 1040)

  ctx.fillStyle = `rgba(${p},0.12)`
  ctx.beginPath(); ctx.roundRect(60, H - 160, W - 120, 100, 20); ctx.fill()
  ctx.strokeStyle = `rgba(${p},0.25)`; ctx.lineWidth = 1.5; ctx.stroke()
  ctx.font = 'bold 34px Arial, sans-serif'; ctx.fillStyle = pal.brandLabel; ctx.textAlign = 'center'
  ctx.fillText('TruLearnix Partner Program', W / 2, H - 103)
  ctx.font = '24px Arial, sans-serif'; ctx.fillStyle = 'rgba(156,163,175,0.7)'
  ctx.fillText('turlearnix.com  ·  Learn. Earn. Grow.', W / 2, H - 68)

  return canvas.toDataURL('image/png')
}

export async function generateAchievementPoster(opts: {
  userName: string
  avatar?: string
  badge: string
  title: string
  description: string
  earnedAt?: Date | string | null
  affiliateCode: string
  themeIndex: number
}): Promise<string> {
  const W = 1080, H = 1080
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!
  const pal = ACH_PALETTES[opts.themeIndex % ACH_PALETTES.length]
  const { p, s } = pal

  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, pal.bg1); bg.addColorStop(0.5, pal.bg2); bg.addColorStop(1, pal.bg3)
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

  const g1 = ctx.createRadialGradient(0, 0, 0, 0, 0, 700)
  g1.addColorStop(0, `rgba(${p},0.3)`); g1.addColorStop(1, 'transparent')
  ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H)

  const g2 = ctx.createRadialGradient(W, H, 0, W, H, 600)
  g2.addColorStop(0, `rgba(${s},0.2)`); g2.addColorStop(1, 'transparent')
  ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H)

  const drawRing = (x: number, y: number, r: number, a: number) => {
    ctx.save(); ctx.strokeStyle = `rgba(${p},${a})`; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); ctx.restore()
  }
  drawRing(W/2, H/2, 460, 0.08); drawRing(W/2, H/2, 400, 0.06); drawRing(W/2, H/2, 340, 0.05)

  const stars = [[80,80],[1000,100],[50,500],[1030,480],[200,950],[880,970],[540,60],[400,1020]]
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  stars.forEach(([x,y]) => { ctx.beginPath(); ctx.arc(x,y,2,0,Math.PI*2); ctx.fill() })

  ctx.fillStyle = `rgba(${p},0.12)`
  ctx.beginPath(); ctx.roundRect(50, 50, W-100, 70, 18); ctx.fill()
  ctx.strokeStyle = `rgba(${p},0.3)`; ctx.lineWidth = 1.5; ctx.stroke()
  ctx.font = 'bold 30px Arial'; ctx.fillStyle = pal.label; ctx.textAlign = 'center'
  ctx.fillText('TruLearnix Partner Network', W/2, 93)

  ctx.fillStyle = 'rgba(251,191,36,0.15)'
  ctx.beginPath(); ctx.roundRect(W/2-200, 148, 400, 52, 26); ctx.fill()
  ctx.strokeStyle = 'rgba(251,191,36,0.4)'; ctx.lineWidth = 1.5; ctx.stroke()
  ctx.font = 'bold 21px Arial'; ctx.fillStyle = '#fbbf24'; ctx.textAlign = 'center'
  ctx.fillText('✦  ACHIEVEMENT UNLOCKED  ✦', W/2, 181)

  const photoX = W/2, photoY = 340, photoR = 120
  const photoGlow = ctx.createRadialGradient(photoX, photoY, 0, photoX, photoY, photoR + 60)
  photoGlow.addColorStop(0, `rgba(${p},0.3)`); photoGlow.addColorStop(1, 'transparent')
  ctx.fillStyle = photoGlow; ctx.beginPath(); ctx.arc(photoX, photoY, photoR+60, 0, Math.PI*2); ctx.fill()

  ctx.save(); ctx.beginPath(); ctx.arc(photoX, photoY, photoR + 8, 0, Math.PI * 2)
  const ringGrad = ctx.createLinearGradient(photoX - photoR, photoY - photoR, photoX + photoR, photoY + photoR)
  ringGrad.addColorStop(0, `rgba(${p},1)`); ringGrad.addColorStop(0.5, `rgba(${s},0.8)`); ringGrad.addColorStop(1, '#fbbf24')
  ctx.fillStyle = ringGrad; ctx.fill(); ctx.restore()

  let photoLoaded = false
  if (opts.avatar) {
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image(); i.crossOrigin = 'anonymous'
        i.onload = () => resolve(i); i.onerror = reject
        i.src = opts.avatar!
      })
      ctx.save(); ctx.beginPath(); ctx.arc(photoX, photoY, photoR, 0, Math.PI * 2); ctx.clip()
      ctx.drawImage(img, photoX - photoR, photoY - photoR, photoR * 2, photoR * 2)
      ctx.restore(); photoLoaded = true
    } catch { /* initials fallback */ }
  }
  if (!photoLoaded) {
    ctx.save(); ctx.beginPath(); ctx.arc(photoX, photoY, photoR, 0, Math.PI * 2)
    const initGrad = ctx.createLinearGradient(photoX - photoR, photoY - photoR, photoX + photoR, photoY + photoR)
    initGrad.addColorStop(0, `rgba(${p},1)`); initGrad.addColorStop(1, `rgba(${s},1)`)
    ctx.fillStyle = initGrad; ctx.fill(); ctx.restore()
    ctx.font = 'bold 90px Arial'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(opts.userName[0]?.toUpperCase() || '?', photoX, photoY); ctx.textBaseline = 'alphabetic'
  }

  const bx = photoX + photoR - 10, by = photoY + photoR - 10, br = 52
  ctx.save(); ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI*2)
  const badgeBg = ctx.createLinearGradient(bx-br, by-br, bx+br, by+br)
  badgeBg.addColorStop(0, `rgba(${p},1)`); badgeBg.addColorStop(1, `rgba(${s},1)`)
  ctx.fillStyle = badgeBg; ctx.fill()
  ctx.strokeStyle = pal.bg1; ctx.lineWidth = 4; ctx.stroke(); ctx.restore()
  ctx.font = '52px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(opts.badge, bx, by); ctx.textBaseline = 'alphabetic'

  ctx.font = 'bold 56px Arial'; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'
  ctx.fillText(opts.userName, W/2, 530)

  ctx.font = '28px Arial'; ctx.fillStyle = `rgba(${p},0.7)`; ctx.textAlign = 'center'
  ctx.fillText('has achieved', W/2, 578)

  ctx.font = 'bold 70px Arial'; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'
  ctx.fillText(opts.title, W/2, 670)

  ctx.font = '26px Arial'; ctx.fillStyle = `rgba(${p},0.75)`
  const words = (opts.description || '').split(' ')
  let line = '', descY = 725
  for (const word of words) {
    const test = line + word + ' '
    if (ctx.measureText(test).width > 820 && line) {
      ctx.fillText(line.trim(), W/2, descY); line = word + ' '; descY += 36
    } else line = test
  }
  if (line.trim()) ctx.fillText(line.trim(), W/2, descY)

  const divY = descY + 50
  const divG = ctx.createLinearGradient(150, divY, W-150, divY)
  divG.addColorStop(0, 'transparent'); divG.addColorStop(0.3, `rgba(${p},0.5)`)
  divG.addColorStop(0.7, `rgba(${p},0.5)`); divG.addColorStop(1, 'transparent')
  ctx.strokeStyle = divG; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(150, divY); ctx.lineTo(W-150, divY); ctx.stroke()

  ctx.font = 'bold 24px Arial'; ctx.fillStyle = `rgba(${p},0.8)`
  ctx.fillText(`Affiliate Code: ${opts.affiliateCode}`, W/2, divY + 50)

  if (opts.earnedAt) {
    ctx.font = '22px Arial'; ctx.fillStyle = 'rgba(156,163,175,0.7)'
    ctx.fillText(new Date(opts.earnedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), W/2, divY + 88)
  }

  ctx.fillStyle = `rgba(${p},0.1)`
  ctx.beginPath(); ctx.roundRect(50, H-95, W-100, 65, 18); ctx.fill()
  ctx.strokeStyle = `rgba(${p},0.25)`; ctx.lineWidth = 1.5; ctx.stroke()
  ctx.font = 'bold 26px Arial'; ctx.fillStyle = pal.accent; ctx.textAlign = 'center'
  ctx.fillText('turlearnix.com  ·  Learn. Earn. Grow.', W/2, H-52)

  return canvas.toDataURL('image/png')
}

export function downloadDataUrl(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
}
