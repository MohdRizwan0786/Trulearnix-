'use client'
import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { mentorAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import {
  IndianRupee, Download, Clock, CheckCircle, XCircle,
  Loader2, FileText, X, Building2, BadgeCheck, AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

const COMPANY = {
  name: 'TRULEARNIX DIGITAL SKILLS LLP',
  llpId: 'ACR-4252',
  pan: 'AAYFT7302G',
  tan: 'DELT25894B',
  udyam: 'UDYAM-DL-09-0040067',
  address: '891/E 22, Second Floor, F/S Zakir Nagar, Jamia Nagar,\nNew Delhi – 110025, Delhi, India',
  email: 'Official@trulearnix.com',
  hrEmail: 'Hr@trulearnix.com',
  phone: '+91 89796 16798',
  website: 'www.trulearnix.com',
}

const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

async function generateSalarySlip(opts: {
  mentorName: string
  mentorPan: string
  mentorBankAccount: string
  mentorBankIfsc: string
  mentorBankHolder: string
  amount: number
  tds: number
  netAmount: number
  month: number
  year: number
  slipNo: string
  paidAt?: string
  approvedAt?: string
}): Promise<HTMLCanvasElement> {
  const W = 794, H = 1123
  const SCALE = 3
  const canvas = document.createElement('canvas')
  canvas.width = W * SCALE; canvas.height = H * SCALE
  const ctx = canvas.getContext('2d')!
  ctx.scale(SCALE, SCALE)

  let logoImg: HTMLImageElement | null = null
  try { logoImg = await loadImage('/trulearnix-logo.png') } catch (_) {}

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)

  ctx.strokeStyle = 'rgba(0,0,0,0.025)'
  ctx.lineWidth = 1
  for (let y = 0; y < H; y += 18) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
  }

  // Header
  const headerGrad = ctx.createLinearGradient(0, 0, W, 110)
  headerGrad.addColorStop(0, '#4c1d95')
  headerGrad.addColorStop(0.5, '#5b21b6')
  headerGrad.addColorStop(1, '#4338ca')
  ctx.fillStyle = headerGrad
  ctx.fillRect(0, 0, W, 110)

  ctx.save()
  ctx.globalAlpha = 0.12
  ctx.fillStyle = '#ffffff'
  ctx.beginPath(); ctx.arc(W - 60, 20, 80, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(W - 30, 85, 50, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(40, -20, 70, 0, Math.PI * 2); ctx.fill()
  ctx.restore()

  ctx.save()
  ctx.beginPath(); ctx.arc(55, 55, 36, 0, Math.PI * 2); ctx.clip()
  if (logoImg) {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(19, 19, 72, 72)
    const s = Math.min(72 / logoImg.width, 72 / logoImg.height)
    const lw = logoImg.width * s, lh = logoImg.height * s
    ctx.drawImage(logoImg, 19 + (72 - lw) / 2, 19 + (72 - lh) / 2, lw, lh)
  } else {
    const logoGrad = ctx.createRadialGradient(55, 55, 5, 55, 55, 36)
    logoGrad.addColorStop(0, 'rgba(255,255,255,0.35)')
    logoGrad.addColorStop(1, 'rgba(255,255,255,0.08)')
    ctx.fillStyle = logoGrad; ctx.fillRect(19, 19, 72, 72)
    ctx.font = 'bold 26px Arial'; ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText('TL', 55, 55)
  }
  ctx.restore()
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.arc(55, 55, 36, 0, Math.PI * 2); ctx.stroke()

  ctx.font = 'bold 20px Arial'
  ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'
  ctx.fillText('TruLearnix', 105, 48)
  ctx.font = '11px Arial'; ctx.fillStyle = 'rgba(221,214,254,0.85)'
  ctx.fillText('TRULEARNIX DIGITAL SKILLS LLP', 105, 67)
  ctx.fillText('Empowering Mentors | Teach. Inspire. Grow.', 105, 84)

  ctx.textAlign = 'right'
  ctx.font = 'bold 18px Arial'; ctx.fillStyle = '#ffffff'
  ctx.fillText('SALARY SLIP', W - 28, 43)
  ctx.font = '11px Arial'; ctx.fillStyle = 'rgba(221,214,254,0.8)'
  ctx.fillText(`Slip No: ${opts.slipNo}`, W - 28, 62)
  const issueDate = opts.paidAt
    ? new Date(opts.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  ctx.fillText(`Date: ${issueDate}`, W - 28, 79)
  ctx.fillText(`Salary Month: ${MONTHS[opts.month]} ${opts.year}`, W - 28, 96)

  // Company info
  ctx.fillStyle = '#f5f3ff'; ctx.fillRect(0, 110, W, 88)
  ctx.strokeStyle = '#ddd6fe'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(0, 110); ctx.lineTo(W, 110); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(0, 198); ctx.lineTo(W, 198); ctx.stroke()
  ctx.textAlign = 'left'; ctx.font = 'bold 13px Arial'; ctx.fillStyle = '#4c1d95'
  ctx.fillText(COMPANY.name, 28, 133)
  ctx.font = '11px Arial'; ctx.fillStyle = '#4b5563'
  const addrLines = COMPANY.address.split('\n')
  ctx.fillText(addrLines[0], 28, 151)
  if (addrLines[1]) ctx.fillText(addrLines[1], 28, 167)
  ctx.font = '10.5px Arial'; ctx.fillStyle = '#6d28d9'
  ctx.fillText(`LLP ID: ${COMPANY.llpId}  |  PAN: ${COMPANY.pan}  |  TAN: ${COMPANY.tan}  |  UDYAM: ${COMPANY.udyam}`, 28, 185)

  // Two columns
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 198, W, 160)
  ctx.fillStyle = '#ede9fe'; ctx.fillRect(0, 198, W / 2 - 1, 24)
  ctx.font = 'bold 11px Arial'; ctx.fillStyle = '#5b21b6'; ctx.textAlign = 'left'
  ctx.fillText('MENTOR DETAILS', 28, 214)
  ctx.fillStyle = '#ede9fe'; ctx.fillRect(W / 2 + 1, 198, W / 2 - 1, 24)
  ctx.fillText('SLIP INFORMATION', W / 2 + 20, 214)
  ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(W / 2, 198); ctx.lineTo(W / 2, 358); ctx.stroke()
  ctx.lineWidth = 0.5
  ctx.beginPath(); ctx.moveTo(0, 222); ctx.lineTo(W, 222); ctx.stroke()

  const mentorRows = [
    { label: 'Mentor Name', value: opts.mentorName || '—' },
    { label: 'PAN Number', value: opts.mentorPan || '—' },
    { label: 'Bank A/c Holder', value: opts.mentorBankHolder || '—' },
    { label: 'Bank Account', value: opts.mentorBankAccount ? `****${opts.mentorBankAccount.slice(-4)}` : '—' },
    { label: 'IFSC Code', value: opts.mentorBankIfsc || '—' },
    { label: 'Salary Month', value: `${MONTHS[opts.month]} ${opts.year}` },
  ]
  mentorRows.forEach(({ label, value }, i) => {
    const y = 238 + i * 20
    ctx.font = '10px Arial'; ctx.fillStyle = '#6b7280'; ctx.textAlign = 'left'
    ctx.fillText(label + ':', 28, y)
    ctx.font = 'bold 10.5px Arial'; ctx.fillStyle = '#111827'
    ctx.fillText(value, 145, y)
  })

  const slipRows = [
    { label: 'Slip Number', value: opts.slipNo },
    { label: 'Issue Date', value: issueDate },
    { label: 'Salary Period', value: `${MONTHS[opts.month]} ${opts.year}` },
    { label: 'Payment Date', value: opts.paidAt
        ? new Date(opts.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'Pending' },
    { label: 'Payment Mode', value: 'Bank Transfer (NEFT/IMPS)' },
    { label: 'Status', value: opts.paidAt ? 'PAID' : 'APPROVED' },
  ]
  slipRows.forEach(({ label, value }, i) => {
    const y = 238 + i * 20
    const x = W / 2 + 20
    ctx.font = '10px Arial'; ctx.fillStyle = '#6b7280'; ctx.textAlign = 'left'
    ctx.fillText(label + ':', x, y)
    ctx.font = 'bold 10.5px Arial'
    ctx.fillStyle = label === 'Status' ? '#065f46' : '#111827'
    ctx.fillText(value, x + 118, y)
  })

  // Salary table
  const tableY = 368
  ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(0, tableY - 10); ctx.lineTo(W, tableY - 10); ctx.stroke()

  ctx.fillStyle = '#1e1b4b'; ctx.fillRect(0, tableY, W, 32)
  ctx.font = 'bold 12px Arial'; ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'left'; ctx.fillText('PARTICULARS', 28, tableY + 20)
  ctx.textAlign = 'right'; ctx.fillText('AMOUNT (₹)', W - 28, tableY + 20)

  ctx.fillStyle = '#f9fafb'; ctx.fillRect(0, tableY + 32, W, 28)
  ctx.font = 'bold 10.5px Arial'; ctx.fillStyle = '#4c1d95'
  ctx.textAlign = 'left'; ctx.fillText('EARNINGS', 28, tableY + 50)

  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, tableY + 60, W, 28)
  ctx.font = '11px Arial'; ctx.fillStyle = '#111827'
  ctx.textAlign = 'left'; ctx.fillText('Gross Monthly Salary', 28, tableY + 78)
  ctx.textAlign = 'right'; ctx.font = 'bold 11px Arial'
  ctx.fillText(`₹ ${opts.amount.toLocaleString('en-IN')}`, W - 28, tableY + 78)

  ctx.fillStyle = '#f0fdf4'; ctx.fillRect(0, tableY + 88, W, 28)
  ctx.font = 'bold 11px Arial'; ctx.fillStyle = '#065f46'
  ctx.textAlign = 'left'; ctx.fillText('Total Gross Earnings', 28, tableY + 106)
  ctx.textAlign = 'right'; ctx.fillText(`₹ ${opts.amount.toLocaleString('en-IN')}`, W - 28, tableY + 106)

  ctx.fillStyle = '#fef2f2'; ctx.fillRect(0, tableY + 116, W, 28)
  ctx.font = 'bold 10.5px Arial'; ctx.fillStyle = '#991b1b'
  ctx.textAlign = 'left'; ctx.fillText('DEDUCTIONS', 28, tableY + 134)

  const tdsRate = opts.amount > 0 ? Math.round((opts.tds / opts.amount) * 100) : 10
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, tableY + 144, W, 28)
  ctx.font = '11px Arial'; ctx.fillStyle = '#374151'
  ctx.textAlign = 'left'
  ctx.fillText(`TDS @ ${tdsRate}% (u/s 192 — Salary)`, 28, tableY + 162)
  ctx.textAlign = 'right'; ctx.fillStyle = '#dc2626'; ctx.font = 'bold 11px Arial'
  ctx.fillText(`- ₹ ${opts.tds.toLocaleString('en-IN')}`, W - 28, tableY + 162)

  ctx.fillStyle = '#fff1f2'; ctx.fillRect(0, tableY + 172, W, 28)
  ctx.font = 'bold 11px Arial'; ctx.fillStyle = '#dc2626'
  ctx.textAlign = 'left'; ctx.fillText('Total Deductions', 28, tableY + 190)
  ctx.textAlign = 'right'; ctx.fillText(`- ₹ ${opts.tds.toLocaleString('en-IN')}`, W - 28, tableY + 190)

  const netY = tableY + 200
  const netGrad = ctx.createLinearGradient(0, netY, W, netY + 44)
  netGrad.addColorStop(0, '#1e1b4b'); netGrad.addColorStop(1, '#312e81')
  ctx.fillStyle = netGrad; ctx.fillRect(0, netY, W, 44)
  ctx.font = 'bold 14px Arial'; ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'left'; ctx.fillText('NET SALARY PAYABLE', 28, netY + 28)
  ctx.textAlign = 'right'; ctx.font = 'bold 18px Arial'; ctx.fillStyle = '#a5f3fc'
  ctx.fillText(`₹ ${opts.netAmount.toLocaleString('en-IN')}`, W - 28, netY + 29)

  // Payment details
  const payY = netY + 60
  ctx.fillStyle = '#f5f3ff'; ctx.strokeStyle = '#c4b5fd'; ctx.lineWidth = 1
  ctx.beginPath()
  ;(ctx as any).roundRect(24, payY, W - 48, 70, 10)
  ctx.fill(); ctx.stroke()
  ctx.font = 'bold 11.5px Arial'; ctx.fillStyle = '#4c1d95'; ctx.textAlign = 'left'
  ctx.fillText('PAYMENT DETAILS', 42, payY + 22)
  ctx.strokeStyle = '#ddd6fe'; ctx.lineWidth = 0.5
  ctx.beginPath(); ctx.moveTo(42, payY + 30); ctx.lineTo(W - 42, payY + 30); ctx.stroke()

  const payDetails = [
    { label: 'Account Credited', value: opts.mentorBankAccount ? `****${opts.mentorBankAccount.slice(-4)} (${opts.mentorBankHolder || opts.mentorName})` : '—' },
    { label: 'Payment Mode', value: 'Bank Transfer (NEFT / IMPS)' },
  ]
  payDetails.forEach(({ label, value }, i) => {
    const y = payY + 48 + i * 18
    ctx.font = '10px Arial'; ctx.fillStyle = '#6b7280'; ctx.textAlign = 'left'
    ctx.fillText(label + ':', 42, y)
    ctx.font = 'bold 10.5px Arial'; ctx.fillStyle = '#111827'
    ctx.fillText(value, 200, y)
  })

  // TDS note
  const tdsNoteY = payY + 88
  ctx.font = '9.5px Arial'; ctx.fillStyle = '#6b7280'; ctx.textAlign = 'left'
  ctx.fillText('* TDS deducted under Section 192 (Salary) of the Income Tax Act, 1961. Form 16 will be provided at year-end.', 24, tdsNoteY)

  // Signature section
  const sigY = tdsNoteY + 38
  ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(24, sigY); ctx.lineTo(W - 24, sigY); ctx.stroke()

  const sigSignedAt = opts.paidAt
    ? new Date(opts.paidAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  ctx.font = '9px Arial'; ctx.fillStyle = '#9ca3af'; ctx.textAlign = 'left'
  ctx.fillText('Acknowledged by:', 28, sigY + 18)
  ctx.font = 'bold 11px Arial'; ctx.fillStyle = '#374151'
  ctx.fillText(opts.mentorName || '—', 28, sigY + 36)
  ctx.font = '9.5px Arial'; ctx.fillStyle = '#6b7280'
  ctx.fillText('Role: Mentor', 28, sigY + 51)
  ctx.fillText('PAN: ' + (opts.mentorPan || '—'), 28, sigY + 64)

  const sigRX = W / 2 + 20
  ctx.fillStyle = '#dcfce7'; ctx.strokeStyle = '#86efac'; ctx.lineWidth = 1
  ctx.beginPath()
  ;(ctx as any).roundRect(sigRX, sigY + 8, 190, 22, 11)
  ctx.fill(); ctx.stroke()
  ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(sigRX + 10, sigY + 20); ctx.lineTo(sigRX + 14, sigY + 24); ctx.lineTo(sigRX + 22, sigY + 15)
  ctx.stroke()
  ctx.lineCap = 'butt'; ctx.lineJoin = 'miter'
  ctx.font = 'bold 10px Arial'; ctx.fillStyle = '#15803d'; ctx.textAlign = 'left'
  ctx.fillText('DIGITALLY SIGNED', sigRX + 28, sigY + 23)

  const companyLineY = sigY + 34 + 140
  let sigImg: HTMLImageElement | null = null
  try { sigImg = await loadImage('/signature.png') } catch (_) {}
  if (sigImg) {
    const sigW = 210, sigH = 140
    const scale = Math.min(sigW / sigImg.width, sigH / sigImg.height)
    const dw = sigImg.width * scale, dh = sigImg.height * scale
    ctx.drawImage(sigImg, sigRX, companyLineY - dh, dw, dh)
  }

  ctx.font = 'bold 10px Arial'; ctx.fillStyle = '#1e1b4b'; ctx.textAlign = 'left'
  ctx.fillText('For TRULEARNIX DIGITAL SKILLS LLP', sigRX, companyLineY)
  ctx.font = 'bold 11px Arial'; ctx.fillStyle = '#374151'
  ctx.fillText('Ashfana Kolhar', sigRX, companyLineY + 15)
  ctx.font = '9.5px Arial'; ctx.fillStyle = '#6b7280'
  ctx.fillText('Authorized Signatory', sigRX, companyLineY + 28)
  ctx.font = '9px Arial'; ctx.fillStyle = '#9ca3af'
  ctx.fillText('Signed on: ' + sigSignedAt, sigRX, companyLineY + 40)

  ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 0.5
  ctx.beginPath(); ctx.moveTo(W / 2, sigY + 4); ctx.lineTo(W / 2, companyLineY + 42); ctx.stroke()

  // Footer
  const footerY = H - 58
  const footerGrad = ctx.createLinearGradient(0, footerY, W, footerY + 58)
  footerGrad.addColorStop(0, '#1e1b4b'); footerGrad.addColorStop(1, '#312e81')
  ctx.fillStyle = footerGrad; ctx.fillRect(0, footerY, W, 58)
  ctx.font = '9.5px Arial'; ctx.fillStyle = 'rgba(196,181,253,0.9)'; ctx.textAlign = 'center'
  ctx.fillText('This is a digitally signed computer-generated document. No physical signature required.', W / 2, footerY + 18)
  ctx.fillText(`${COMPANY.email}  ·  ${COMPANY.hrEmail}  ·  ${COMPANY.phone}`, W / 2, footerY + 33)
  ctx.font = 'bold 9.5px Arial'; ctx.fillStyle = 'rgba(167,139,250,0.8)'
  ctx.fillText(COMPANY.website, W / 2, footerY + 48)

  return canvas
}

async function downloadSlipAsPDF(canvas: HTMLCanvasElement, slipNo: string) {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const imgData = canvas.toDataURL('image/jpeg', 0.98)
  pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297)
  pdf.save(`${slipNo}.pdf`)
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  pending:  { label: 'Pending',  color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/25',  icon: Clock       },
  approved: { label: 'Approved', color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/25',   icon: CheckCircle },
  paid:     { label: 'Paid',     color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/25',  icon: CheckCircle },
}

function SlipModal({ slipUrl, slipCanvas, onClose, slipNo }: {
  slipUrl: string; slipCanvas: HTMLCanvasElement | null; onClose: () => void; slipNo: string
}) {
  const [downloading, setDownloading] = useState(false)
  const handlePDF = async () => {
    if (!slipCanvas) return
    setDownloading(true)
    try { await downloadSlipAsPDF(slipCanvas, slipNo) }
    catch (e) { console.error(e) }
    setDownloading(false)
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <button onClick={onClose}
          className="absolute -top-4 -right-4 z-10 w-9 h-9 rounded-full bg-dark-800 border border-white/15 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
        <p className="text-white font-bold text-center mb-2 text-sm">{slipNo}</p>
        <div className="rounded-2xl overflow-hidden border border-violet-500/30 shadow-2xl shadow-violet-500/20 max-h-[65vh] overflow-y-auto">
          <img src={slipUrl} alt="Salary Slip" className="w-full" />
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={handlePDF} disabled={downloading}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95 shadow-lg shadow-violet-500/25 disabled:opacity-60">
            {downloading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating PDF...</> : <><Download className="w-4 h-4" /> Download PDF</>}
          </button>
          <button onClick={() => { const a = document.createElement('a'); a.href = slipUrl; a.download = `${slipNo}.png`; a.click() }}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-dark-700 text-gray-300 border border-white/10 text-sm font-bold transition-all hover:bg-dark-600"
            title="Download PNG">
            <FileText className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-gray-600 text-xs mt-2">PDF downloads directly • PNG: long-press on mobile</p>
      </div>
    </div>
  )
}

export default function MentorSalaryPage() {
  const { user } = useAuthStore()
  const [generatingSlip, setGeneratingSlip] = useState<string | null>(null)
  const [slipUrl, setSlipUrl] = useState<string | null>(null)
  const [slipCanvas, setSlipCanvas] = useState<HTMLCanvasElement | null>(null)
  const [slipNo, setSlipNo] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['mentor-salaries'],
    queryFn: () => mentorAPI.salaries().then(r => r.data),
  })

  const salaries: any[] = data?.salaries || []
  const kyc = (user as any)?.kyc

  const handleDownloadSlip = useCallback(async (s: any) => {
    setGeneratingSlip(s._id)
    try {
      const cv = await generateSalarySlip({
        mentorName: user?.name || '',
        mentorPan: kyc?.pan || '',
        mentorBankAccount: kyc?.bankAccount || s.bankAccount || '',
        mentorBankIfsc: kyc?.bankIfsc || s.bankIfsc || '',
        mentorBankHolder: kyc?.bankHolderName || s.bankHolderName || user?.name || '',
        amount: s.amount,
        tds: s.tds || 0,
        netAmount: s.netAmount,
        month: s.month,
        year: s.year,
        slipNo: s.slipNo,
        paidAt: s.paidAt,
        approvedAt: s.approvedAt,
      })
      setSlipNo(s.slipNo)
      setSlipCanvas(cv)
      setSlipUrl(cv.toDataURL('image/png'))
    } catch (e) { console.error(e); toast.error('Failed to generate slip') }
    setGeneratingSlip(null)
  }, [user, kyc])

  if (isLoading) return (
    <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-dark-800 rounded-2xl animate-pulse" />)}</div>
  )

  const totalPaid = salaries.filter(s => s.status === 'paid').reduce((sum: number, s: any) => sum + (s.netAmount || 0), 0)
  const pendingCount = salaries.filter(s => s.status !== 'paid').length

  return (
    <div className="space-y-5 pb-8">

      {/* Header */}
      <div>
        <h1 className="text-white text-2xl font-bold flex items-center gap-2">
          <IndianRupee className="w-6 h-6 text-violet-400" /> Salary
        </h1>
        <p className="text-dark-400 text-sm mt-0.5">Your monthly salary slips from TruLearnix</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4 bg-gradient-to-br from-violet-600 to-purple-700 border border-violet-500/20">
          <p className="text-violet-200 text-xs uppercase tracking-wide font-medium mb-1">Total Received</p>
          <p className="text-white text-2xl font-black">₹{totalPaid.toLocaleString()}</p>
          <p className="text-violet-300 text-xs mt-1">{salaries.filter(s => s.status === 'paid').length} salaries paid</p>
        </div>
        <div className="rounded-2xl p-4 bg-dark-800 border border-amber-500/20">
          <p className="text-dark-400 text-xs uppercase tracking-wide font-medium mb-1">Pending</p>
          <p className="text-amber-400 text-2xl font-black">{pendingCount}</p>
          <p className="text-dark-500 text-xs mt-1">awaiting payment</p>
        </div>
      </div>

      {/* KYC notice */}
      {(!kyc || kyc.status !== 'verified') && (
        <div className="flex items-start gap-3 rounded-2xl border bg-amber-500/10 border-amber-500/25 p-4">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-300 font-semibold text-sm">KYC not verified</p>
            <p className="text-dark-400 text-xs mt-0.5">Complete KYC to receive salary payments directly to your bank account.</p>
          </div>
        </div>
      )}

      {/* Salary list */}
      {salaries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-2xl bg-dark-800 border border-dark-700 text-center">
          <IndianRupee className="w-10 h-10 text-dark-600 mb-3" />
          <p className="text-dark-300 font-semibold">No salary records yet</p>
          <p className="text-dark-500 text-sm mt-1">Your salary slips will appear here once issued by admin</p>
        </div>
      ) : (
        <div className="space-y-3">
          {salaries.map((s: any) => {
            const cfg = STATUS_CFG[s.status] || STATUS_CFG.pending
            const StatusIcon = cfg.icon
            const canDownload = s.status === 'approved' || s.status === 'paid'
            return (
              <div key={s._id} className={`rounded-2xl border p-4 ${cfg.bg} ${cfg.border}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg} border ${cfg.border}`}>
                      <StatusIcon className={`w-5 h-5 ${cfg.color}`} />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{MONTHS[s.month]} {s.year}</p>
                      <p className="text-dark-400 text-xs">
                        Gross: ₹{(s.amount || 0).toLocaleString()} · TDS: ₹{(s.tds || 0).toLocaleString()}
                      </p>
                      <p className="text-dark-500 text-xs">Slip: {s.slipNo}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-green-400 font-black text-lg">₹{(s.netAmount || 0).toLocaleString()}</p>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                      {cfg.label}
                    </span>
                  </div>
                </div>

                {s.remarks && (
                  <p className="mt-3 text-dark-400 text-xs bg-dark-700/60 rounded-lg px-3 py-2">{s.remarks}</p>
                )}

                {canDownload && (
                  <div className="mt-3 flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-lg px-3 py-2">
                    <BadgeCheck className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                    <p className="text-violet-300 text-xs flex-1">Salary Slip ready</p>
                    <button
                      onClick={() => handleDownloadSlip(s)}
                      disabled={generatingSlip === s._id}
                      className="flex items-center gap-1.5 text-xs font-bold text-violet-300 hover:text-violet-200 bg-violet-500/15 hover:bg-violet-500/25 px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-50">
                      {generatingSlip === s._id
                        ? <><Loader2 className="w-3 h-3 animate-spin" /> Generating...</>
                        : <><FileText className="w-3 h-3" /> Download Slip</>
                      }
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {slipUrl && slipCanvas && (
        <SlipModal
          slipUrl={slipUrl}
          slipCanvas={slipCanvas}
          slipNo={slipNo}
          onClose={() => { setSlipUrl(null); setSlipCanvas(null) }}
        />
      )}
    </div>
  )
}
