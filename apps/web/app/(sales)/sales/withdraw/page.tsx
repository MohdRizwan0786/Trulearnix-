'use client'
import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salesAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import {
  Wallet, ArrowDownToLine, ShieldCheck, Clock,
  CheckCircle, XCircle, AlertTriangle, Loader2, IndianRupee,
  Building2, Lock, ChevronRight, RefreshCw, Info, Download, X,
  FileText, BadgeCheck
} from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image(); img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img); img.onerror = reject; img.src = src
  })
}

const COMPANY = {
  name: 'TRULEARNIX DIGITAL SKILLS LLP', shortName: 'TruLearnix',
  llpId: 'ACR-4252', pan: 'AAYFT7302G', tan: 'DELT25894B', udyam: 'UDYAM-DL-09-0040067',
  address: '891/E 22, Second Floor, F/S Zakir Nagar, Jamia Nagar,\nNew Delhi – 110025, Delhi, India',
  email: 'Official@trulearnix.com', hrEmail: 'Hr@trulearnix.com',
  phone: '+91 89796 16798', website: 'www.trulearnix.com',
}

async function generateEarningSlip(opts: {
  salesName: string; salesPan: string; salesBankAccount: string;
  salesBankIfsc: string; salesBankHolder: string; amount: number;
  tdsAmount: number; tdsRate: number; netAmount: number; gatewayFee?: number;
  createdAt: string; processedAt?: string; razorpayPayoutId?: string; withdrawalId: string;
}): Promise<HTMLCanvasElement> {
  const W = 794, H = 1123, SCALE = 3
  const canvas = document.createElement('canvas')
  canvas.width = W * SCALE; canvas.height = H * SCALE
  const ctx = canvas.getContext('2d')!
  ctx.scale(SCALE, SCALE)

  let logoImg: HTMLImageElement | null = null
  try { logoImg = await loadImage('/trulearnix-logo.png') } catch (_) {}

  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = 'rgba(0,0,0,0.025)'; ctx.lineWidth = 1
  for (let y = 0; y < H; y += 18) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }

  const headerGrad = ctx.createLinearGradient(0, 0, W, 110)
  headerGrad.addColorStop(0, '#1e3a8a'); headerGrad.addColorStop(0.5, '#1d4ed8'); headerGrad.addColorStop(1, '#1e40af')
  ctx.fillStyle = headerGrad; ctx.fillRect(0, 0, W, 110)
  ctx.save(); ctx.globalAlpha = 0.12; ctx.fillStyle = '#ffffff'
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
    const lg = ctx.createRadialGradient(55, 55, 5, 55, 55, 36)
    lg.addColorStop(0, 'rgba(255,255,255,0.35)'); lg.addColorStop(1, 'rgba(255,255,255,0.08)')
    ctx.fillStyle = lg; ctx.fillRect(19, 19, 72, 72)
    ctx.font = 'bold 26px Arial'; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText('TL', 55, 55)
  }
  ctx.restore()
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.arc(55, 55, 36, 0, Math.PI * 2); ctx.stroke()

  ctx.font = 'bold 20px Arial'; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'
  ctx.fillText('TruLearnix', 105, 48)
  ctx.font = '11px Arial'; ctx.fillStyle = 'rgba(191,219,254,0.85)'
  ctx.fillText('TRULEARNIX DIGITAL SKILLS LLP', 105, 67)
  ctx.fillText('Empowering Sales Team | Sell. Earn. Grow.', 105, 84)

  ctx.textAlign = 'right'; ctx.font = 'bold 18px Arial'; ctx.fillStyle = '#ffffff'
  ctx.fillText('SALES EARNING SLIP', W - 28, 43)
  const slipNo = `SLIP-${opts.withdrawalId.slice(-8).toUpperCase()}`
  ctx.font = '11px Arial'; ctx.fillStyle = 'rgba(191,219,254,0.8)'
  ctx.fillText(`Slip No: ${slipNo}`, W - 28, 62)
  const issueDate = opts.processedAt
    ? new Date(opts.processedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date(opts.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  ctx.fillText(`Date: ${issueDate}`, W - 28, 79)
  ctx.fillText(`Period: ${new Date(opts.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`, W - 28, 96)

  ctx.fillStyle = '#eff6ff'; ctx.fillRect(0, 110, W, 88)
  ctx.strokeStyle = '#bfdbfe'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(0, 110); ctx.lineTo(W, 110); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(0, 198); ctx.lineTo(W, 198); ctx.stroke()
  ctx.textAlign = 'left'; ctx.font = 'bold 13px Arial'; ctx.fillStyle = '#1e3a8a'
  ctx.fillText(COMPANY.name, 28, 133)
  ctx.font = '11px Arial'; ctx.fillStyle = '#4b5563'
  const addrLines = COMPANY.address.split('\n')
  ctx.fillText(addrLines[0], 28, 151); if (addrLines[1]) ctx.fillText(addrLines[1], 28, 167)
  ctx.font = '10.5px Arial'; ctx.fillStyle = '#1d4ed8'
  ctx.fillText(`LLP ID: ${COMPANY.llpId}  |  PAN: ${COMPANY.pan}  |  TAN: ${COMPANY.tan}  |  UDYAM: ${COMPANY.udyam}`, 28, 185)

  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 198, W, 160)
  ctx.fillStyle = '#dbeafe'; ctx.fillRect(0, 198, W / 2 - 1, 24)
  ctx.font = 'bold 11px Arial'; ctx.fillStyle = '#1e3a8a'; ctx.textAlign = 'left'
  ctx.fillText('SALES PERSON DETAILS', 28, 214)
  ctx.fillStyle = '#dbeafe'; ctx.fillRect(W / 2 + 1, 198, W / 2 - 1, 24)
  ctx.fillText('SLIP INFORMATION', W / 2 + 20, 214)
  ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(W / 2, 198); ctx.lineTo(W / 2, 358); ctx.stroke()
  ctx.lineWidth = 0.5
  ctx.beginPath(); ctx.moveTo(0, 222); ctx.lineTo(W, 222); ctx.stroke()

  const salesRows = [
    { label: 'Sales Person', value: opts.salesName || '—' },
    { label: 'PAN Number', value: opts.salesPan || '—' },
    { label: 'Bank A/c Holder', value: opts.salesBankHolder || '—' },
    { label: 'Bank Account', value: opts.salesBankAccount ? `****${opts.salesBankAccount.slice(-4)}` : '—' },
    { label: 'IFSC Code', value: opts.salesBankIfsc || '—' },
    { label: 'Earning Period', value: new Date(opts.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) },
  ]
  salesRows.forEach(({ label, value }, i) => {
    const y = 238 + i * 20
    ctx.font = '10px Arial'; ctx.fillStyle = '#6b7280'; ctx.textAlign = 'left'
    ctx.fillText(label + ':', 28, y)
    ctx.font = 'bold 10.5px Arial'; ctx.fillStyle = '#111827'; ctx.fillText(value, 160, y)
  })

  const slipRows = [
    { label: 'Slip Number', value: slipNo },
    { label: 'Issue Date', value: issueDate },
    { label: 'Earning Period', value: new Date(opts.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) },
    { label: 'Payment Date', value: opts.processedAt ? new Date(opts.processedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Pending' },
    { label: 'Payment Mode', value: 'Bank Transfer (NEFT/IMPS)' },
    { label: 'Status', value: opts.processedAt ? 'PAID' : 'APPROVED' },
  ]
  slipRows.forEach(({ label, value }, i) => {
    const y = 238 + i * 20, x = W / 2 + 20
    ctx.font = '10px Arial'; ctx.fillStyle = '#6b7280'; ctx.textAlign = 'left'
    ctx.fillText(label + ':', x, y)
    ctx.font = 'bold 10.5px Arial'; ctx.fillStyle = label === 'Status' ? '#065f46' : '#111827'
    ctx.fillText(value, x + 118, y)
  })

  const tableY = 368
  ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(0, tableY - 10); ctx.lineTo(W, tableY - 10); ctx.stroke()
  ctx.fillStyle = '#1e3a8a'; ctx.fillRect(0, tableY, W, 32)
  ctx.font = 'bold 12px Arial'; ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'left'; ctx.fillText('PARTICULARS', 28, tableY + 20)
  ctx.textAlign = 'right'; ctx.fillText('AMOUNT (₹)', W - 28, tableY + 20)

  ctx.fillStyle = '#f9fafb'; ctx.fillRect(0, tableY + 32, W, 28)
  ctx.font = 'bold 10.5px Arial'; ctx.fillStyle = '#1e3a8a'; ctx.textAlign = 'left'
  ctx.fillText('EARNINGS', 28, tableY + 50)
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, tableY + 60, W, 28)
  ctx.font = '11px Arial'; ctx.fillStyle = '#111827'; ctx.textAlign = 'left'
  ctx.fillText('Gross Sales Partnership earning', 28, tableY + 78)
  ctx.textAlign = 'right'; ctx.font = 'bold 11px Arial'
  ctx.fillText(`₹ ${opts.amount.toLocaleString('en-IN')}`, W - 28, tableY + 78)

  ctx.fillStyle = '#f0fdf4'; ctx.fillRect(0, tableY + 88, W, 28)
  ctx.font = 'bold 11px Arial'; ctx.fillStyle = '#065f46'
  ctx.textAlign = 'left'; ctx.fillText('Total Gross Earnings', 28, tableY + 106)
  ctx.textAlign = 'right'; ctx.fillText(`₹ ${opts.amount.toLocaleString('en-IN')}`, W - 28, tableY + 106)

  ctx.fillStyle = '#fef2f2'; ctx.fillRect(0, tableY + 116, W, 28)
  ctx.font = 'bold 10.5px Arial'; ctx.fillStyle = '#991b1b'; ctx.textAlign = 'left'
  ctx.fillText('DEDUCTIONS', 28, tableY + 134)
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, tableY + 144, W, 28)
  ctx.font = '11px Arial'; ctx.fillStyle = '#374151'; ctx.textAlign = 'left'
  ctx.fillText(`TDS @ ${opts.tdsRate}% (u/s 194H — Partnership earning)`, 28, tableY + 162)
  ctx.textAlign = 'right'; ctx.fillStyle = '#dc2626'; ctx.font = 'bold 11px Arial'
  ctx.fillText(`- ₹ ${opts.tdsAmount.toLocaleString('en-IN')}`, W - 28, tableY + 162)
  ctx.fillStyle = '#fff8f8'; ctx.fillRect(0, tableY + 172, W, 28)
  ctx.font = '11px Arial'; ctx.fillStyle = '#374151'; ctx.textAlign = 'left'
  ctx.fillText('Gateway Fee (IMPS ₹4.40 + 18% GST)', 28, tableY + 190)
  ctx.textAlign = 'right'; ctx.fillStyle = '#dc2626'; ctx.font = 'bold 11px Arial'
  ctx.fillText(`- ₹ ${(opts.gatewayFee || 5.19).toFixed(2)}`, W - 28, tableY + 190)
  const totalDeductions = opts.tdsAmount + (opts.gatewayFee || 5.19)
  ctx.fillStyle = '#fff1f2'; ctx.fillRect(0, tableY + 200, W, 28)
  ctx.font = 'bold 11px Arial'; ctx.fillStyle = '#dc2626'; ctx.textAlign = 'left'
  ctx.fillText('Total Deductions', 28, tableY + 218)
  ctx.textAlign = 'right'; ctx.fillText(`- ₹ ${totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, W - 28, tableY + 218)

  const netY = tableY + 228
  const netGrad = ctx.createLinearGradient(0, netY, W, netY + 44)
  netGrad.addColorStop(0, '#1e3a8a'); netGrad.addColorStop(1, '#1e40af')
  ctx.fillStyle = netGrad; ctx.fillRect(0, netY, W, 44)
  ctx.font = 'bold 14px Arial'; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left'
  ctx.fillText('NET AMOUNT PAYABLE', 28, netY + 28)
  ctx.textAlign = 'right'; ctx.font = 'bold 18px Arial'; ctx.fillStyle = '#bae6fd'
  ctx.fillText(`₹ ${opts.netAmount.toLocaleString('en-IN')}`, W - 28, netY + 29)

  const payY = netY + 60
  ctx.fillStyle = '#eff6ff'; ctx.strokeStyle = '#93c5fd'; ctx.lineWidth = 1
  ctx.beginPath(); (ctx as any).roundRect(24, payY, W - 48, opts.razorpayPayoutId ? 90 : 70, 10); ctx.fill(); ctx.stroke()
  ctx.font = 'bold 11.5px Arial'; ctx.fillStyle = '#1e3a8a'; ctx.textAlign = 'left'
  ctx.fillText('PAYMENT DETAILS', 42, payY + 22)
  ctx.strokeStyle = '#bfdbfe'; ctx.lineWidth = 0.5
  ctx.beginPath(); ctx.moveTo(42, payY + 30); ctx.lineTo(W - 42, payY + 30); ctx.stroke()

  const payDetails = [
    ...(opts.razorpayPayoutId ? [{ label: 'Transaction ID / UTR', value: opts.razorpayPayoutId }] : [{ label: 'Transaction ID / UTR', value: 'Pending — will update on transfer' }]),
    { label: 'Account Credited', value: opts.salesBankAccount ? `****${opts.salesBankAccount.slice(-4)} (${opts.salesBankHolder || opts.salesName})` : '—' },
    { label: 'Payment Mode', value: 'Bank Transfer (NEFT / IMPS)' },
  ]
  payDetails.forEach(({ label, value }, i) => {
    const y = payY + 48 + i * 18, isTxn = label.startsWith('Transaction')
    ctx.font = isTxn ? 'bold 10px Arial' : '10px Arial'
    ctx.fillStyle = isTxn ? '#1e3a8a' : '#6b7280'; ctx.textAlign = 'left'
    ctx.fillText(label + ':', 42, y)
    ctx.font = 'bold 10.5px Arial'
    ctx.fillStyle = isTxn ? (opts.razorpayPayoutId ? '#065f46' : '#9ca3af') : '#111827'
    ctx.fillText(value, 200, y)
  })

  const tdsNoteY = payY + (opts.razorpayPayoutId ? 108 : 88)
  ctx.font = '9.5px Arial'; ctx.fillStyle = '#6b7280'; ctx.textAlign = 'left'
  ctx.fillText('* TDS deducted under Section 194H (Partnership earning) of the Income Tax Act, 1961. Form 16A will be provided at year-end.', 24, tdsNoteY)

  const sigY = tdsNoteY + 38
  ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(24, sigY); ctx.lineTo(W - 24, sigY); ctx.stroke()
  const sigSignedAt = opts.processedAt
    ? new Date(opts.processedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  ctx.font = '9px Arial'; ctx.fillStyle = '#9ca3af'; ctx.textAlign = 'left'
  ctx.fillText('Acknowledged by:', 28, sigY + 18)
  ctx.font = 'bold 11px Arial'; ctx.fillStyle = '#374151'
  ctx.fillText(opts.salesName || '—', 28, sigY + 36)
  ctx.font = '9.5px Arial'; ctx.fillStyle = '#6b7280'
  ctx.fillText('Role: Sales Person', 28, sigY + 51)
  ctx.fillText('PAN: ' + (opts.salesPan || '—'), 28, sigY + 64)

  const sigRX = W / 2 + 20
  ctx.fillStyle = '#dcfce7'; ctx.strokeStyle = '#86efac'; ctx.lineWidth = 1
  ctx.beginPath(); (ctx as any).roundRect(sigRX, sigY + 8, 190, 22, 11); ctx.fill(); ctx.stroke()
  ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  ctx.beginPath(); ctx.moveTo(sigRX + 10, sigY + 20); ctx.lineTo(sigRX + 14, sigY + 24); ctx.lineTo(sigRX + 22, sigY + 15); ctx.stroke()
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
  ctx.font = 'bold 10px Arial'; ctx.fillStyle = '#1e3a8a'; ctx.textAlign = 'left'
  ctx.fillText('For TRULEARNIX DIGITAL SKILLS LLP', sigRX, companyLineY)
  ctx.font = 'bold 11px Arial'; ctx.fillStyle = '#374151'
  ctx.fillText('Ashfana Kolhar', sigRX, companyLineY + 15)
  ctx.font = '9.5px Arial'; ctx.fillStyle = '#6b7280'
  ctx.fillText('Authorized Signatory', sigRX, companyLineY + 28)
  ctx.font = '9px Arial'; ctx.fillStyle = '#9ca3af'
  ctx.fillText('Signed on: ' + sigSignedAt, sigRX, companyLineY + 40)
  ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 0.5
  ctx.beginPath(); ctx.moveTo(W / 2, sigY + 4); ctx.lineTo(W / 2, companyLineY + 42); ctx.stroke()

  const footerY = H - 58
  const footerGrad = ctx.createLinearGradient(0, footerY, W, footerY + 58)
  footerGrad.addColorStop(0, '#1e3a8a'); footerGrad.addColorStop(1, '#1e40af')
  ctx.fillStyle = footerGrad; ctx.fillRect(0, footerY, W, 58)
  ctx.font = '9.5px Arial'; ctx.fillStyle = 'rgba(191,219,254,0.9)'; ctx.textAlign = 'center'
  ctx.fillText('This is a digitally signed computer-generated document. No physical signature required.', W / 2, footerY + 18)
  ctx.fillText(`${COMPANY.email}  ·  ${COMPANY.hrEmail}  ·  ${COMPANY.phone}`, W / 2, footerY + 33)
  ctx.font = 'bold 9.5px Arial'; ctx.fillStyle = 'rgba(147,197,253,0.8)'
  ctx.fillText(COMPANY.website, W / 2, footerY + 48)

  return canvas
}

async function downloadSlipAsPDF(canvas: HTMLCanvasElement, slipNo: string) {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  pdf.addImage(canvas.toDataURL('image/jpeg', 0.98), 'JPEG', 0, 0, 210, 297)
  pdf.save(`${slipNo}.pdf`)
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  pending:    { label: 'Pending HR Review',        color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/25', icon: Clock       },
  processing: { label: 'HR Approved · Processing', color: 'text-blue-400',  bg: 'bg-blue-500/10',  border: 'border-blue-500/25',  icon: RefreshCw   },
  completed:  { label: 'Transferred',              color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/25', icon: CheckCircle },
  rejected:   { label: 'Rejected',                 color: 'text-red-400',   bg: 'bg-red-500/10',   border: 'border-red-500/25',   icon: XCircle     },
}

function SlipModal({ slipUrl, slipCanvas, onClose, slipNo }: { slipUrl: string; slipCanvas: HTMLCanvasElement | null; onClose: () => void; slipNo: string }) {
  const [downloading, setDownloading] = useState(false)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-4 -right-4 z-10 w-9 h-9 rounded-full bg-dark-800 border border-white/15 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
        <p className="text-white font-bold text-center mb-2 text-sm">{slipNo}</p>
        <div className="rounded-2xl overflow-hidden border border-blue-500/30 shadow-2xl max-h-[65vh] overflow-y-auto">
          <img src={slipUrl} alt="Sales Earning Slip" className="w-full" />
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={async () => { setDownloading(true); try { await downloadSlipAsPDF(slipCanvas!, slipNo) } catch(e){} setDownloading(false) }} disabled={downloading}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-60">
            {downloading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Download className="w-4 h-4" /> Download PDF</>}
          </button>
          <button onClick={() => { const a = document.createElement('a'); a.href = slipUrl; a.download = `${slipNo}.png`; a.click() }}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-dark-700 text-gray-300 border border-white/10 text-sm font-bold hover:bg-dark-600">
            <FileText className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-gray-600 text-xs mt-2">PDF downloads directly • PNG: long-press on mobile</p>
      </div>
    </div>
  )
}

export default function SalesWithdrawPage() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const [amount, setAmount] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [generatingSlip, setGeneratingSlip] = useState<string | null>(null)
  const [slipUrl, setSlipUrl] = useState<string | null>(null)
  const [slipCanvas, setSlipCanvas] = useState<HTMLCanvasElement | null>(null)
  const [slipNo, setSlipNo] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['sales-withdrawals'],
    queryFn: () => salesAPI.withdrawHistory().then(r => r.data),
    staleTime: 30_000,
  })

  const wallet: number = data?.wallet ?? (user?.wallet || 0)
  const kycStatus: string = data?.kycStatus ?? ((user as any)?.kyc?.status || 'pending')
  const history: any[] = data?.withdrawals || []
  const kycVerified = kycStatus === 'verified'
  const hasPending = history.some((w: any) => w.hrStatus === 'pending')

  const amt = Number(amount)
  const tdsRate = 2, tdsAmount = Math.round(amt * tdsRate / 100)
  const gatewayFee = 4.40
  const gatewayFeeGst = Math.round(gatewayFee * 0.18 * 100) / 100
  const totalGatewayFee = Math.round((gatewayFee + gatewayFeeGst) * 100) / 100
  const netAmount = amt - tdsAmount - totalGatewayFee
  const canSubmit = kycVerified && !hasPending && amt >= 500 && amt <= wallet

  const withdraw = useMutation({
    mutationFn: () => salesAPI.requestWithdraw({ amount: amt }),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Withdrawal request submitted!')
      setAmount(''); setShowConfirm(false)
      qc.invalidateQueries({ queryKey: ['sales-withdrawals'] })
    },
    onError: (e: any) => { toast.error(e?.response?.data?.message || 'Request failed'); setShowConfirm(false) },
  })

  const handleDownloadSlip = useCallback(async (w: any) => {
    setGeneratingSlip(w._id)
    try {
      const cv = await generateEarningSlip({
        salesName: data?.partnerName || user?.name || '',
        salesPan: data?.partnerPan || '',
        salesBankAccount: data?.partnerBankAccount || '',
        salesBankIfsc: data?.partnerBankIfsc || '',
        salesBankHolder: data?.partnerBankHolder || user?.name || '',
        amount: w.amount, tdsAmount: w.tdsAmount || 0, tdsRate: w.tdsRate || 2,
        gatewayFee: w.gatewayFee || 5.19,
        netAmount: w.netAmount || w.amount, createdAt: w.createdAt,
        processedAt: w.processedAt, razorpayPayoutId: w.razorpayPayoutId, withdrawalId: w._id,
      })
      const no = `SLIP-${w._id.slice(-8).toUpperCase()}`
      setSlipNo(no); setSlipCanvas(cv); setSlipUrl(cv.toDataURL('image/png'))
    } catch (e) { toast.error('Failed to generate slip') }
    setGeneratingSlip(null)
  }, [data, user])

  if (isLoading && !user) return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-dark-800 rounded-2xl animate-pulse" />)}</div>

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="text-white text-2xl font-bold">Withdraw Earnings</h1>
        <p className="text-dark-400 text-sm mt-0.5">Transfer your wallet balance to your bank account</p>
      </div>

      {/* Wallet Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 border border-blue-500/20 p-5">
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
        <div className="relative">
          <p className="text-blue-200 text-xs uppercase tracking-widest font-medium mb-1">Available Balance</p>
          <p className="text-white text-4xl font-black tracking-tight">₹{wallet.toLocaleString()}</p>
          <p className="text-blue-300 text-xs mt-2">Total withdrawn: <span className="text-white font-semibold">₹{(data?.totalWithdrawn || 0).toLocaleString()}</span></p>
        </div>
        <Wallet className="absolute bottom-4 right-4 w-12 h-12 text-white/10" />
      </div>

      {/* KYC Gate */}
      {!kycVerified && (
        <div className={`flex items-start gap-3 rounded-2xl border p-4 ${kycStatus === 'submitted' ? 'bg-amber-500/10 border-amber-500/25' : 'bg-red-500/10 border-red-500/25'}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${kycStatus === 'submitted' ? 'bg-amber-500/20' : 'bg-red-500/20'}`}>
            {kycStatus === 'submitted' ? <Clock className="w-5 h-5 text-amber-400" /> : <Lock className="w-5 h-5 text-red-400" />}
          </div>
          <div className="flex-1">
            <p className={`font-bold text-sm ${kycStatus === 'submitted' ? 'text-amber-300' : 'text-red-300'}`}>
              {kycStatus === 'submitted' ? 'KYC Under Review' : 'KYC Required to Withdraw'}
            </p>
            <p className="text-dark-400 text-xs mt-0.5">
              {kycStatus === 'submitted' ? 'Your KYC is under review. Withdrawals will be enabled once verified (1-3 business days).' : kycStatus === 'rejected' ? 'Your KYC was rejected. Please re-submit your documents.' : 'Complete your KYC verification to unlock withdrawals.'}
            </p>
            <Link href="/sales/kyc" className={`mt-2 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${kycStatus === 'submitted' ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30' : 'bg-red-500/20 text-red-300 hover:bg-red-500/30'}`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              {kycStatus === 'submitted' ? 'View KYC Status' : 'Complete KYC'} <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {kycVerified && hasPending && (
        <div className="flex items-start gap-3 rounded-2xl border bg-amber-500/10 border-amber-500/25 p-4">
          <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-300 font-semibold text-sm">Withdrawal Request Pending</p>
            <p className="text-dark-400 text-xs mt-0.5">You have a pending withdrawal. A new request can be submitted once HR processes the current one.</p>
          </div>
        </div>
      )}

      {/* Form */}
      {kycVerified && !hasPending && (
        <div className="bg-dark-800 rounded-2xl border border-dark-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-dark-700 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center"><ArrowDownToLine className="w-3.5 h-3.5 text-blue-400" /></div>
            <h3 className="text-white font-bold text-sm">New Withdrawal Request</h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
              <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-blue-300 text-xs">Requests are reviewed by HR within 3-5 business days. A Sales Earning Slip will be generated automatically after approval.</p>
            </div>
            <div>
              <label className="text-dark-300 text-xs font-medium mb-1.5 block">Amount to Withdraw *</label>
              <div className="relative">
                <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Minimum ₹500" min={500} max={wallet}
                  className="w-full bg-dark-700 border border-dark-600 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-dark-600 focus:outline-none focus:border-blue-500 text-sm transition-colors" />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-dark-500 text-xs">Min: ₹500</p>
                <button onClick={() => setAmount(String(wallet))} className="text-blue-400 text-xs hover:text-blue-300 font-medium">Max: ₹{wallet.toLocaleString()}</button>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[500, 1000, 2000, 5000].filter(v => v <= wallet).map(v => (
                <button key={v} onClick={() => setAmount(String(v))}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all font-medium ${amount === String(v) ? 'bg-blue-600 border-blue-500 text-white' : 'bg-dark-700 border-dark-600 text-dark-300 hover:border-blue-500/50 hover:text-white'}`}>
                  ₹{v.toLocaleString()}
                </button>
              ))}
            </div>
            {amt >= 500 && (
              <div className="bg-dark-700/60 rounded-xl p-4 space-y-2 border border-dark-600">
                <div className="flex justify-between text-sm"><span className="text-dark-400">Withdrawal Amount</span><span className="text-white font-medium">₹{amt.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm"><span className="text-dark-400">TDS @ {tdsRate}% (Sec 194H)</span><span className="text-red-400">- ₹{tdsAmount.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm"><span className="text-dark-400">Gateway Fee (IMPS ₹4.40 + GST)</span><span className="text-red-400">- ₹{totalGatewayFee.toFixed(2)}</span></div>
                <div className="border-t border-dark-600 pt-2 flex justify-between text-sm font-bold"><span className="text-dark-300">You Receive</span><span className="text-green-400">₹{netAmount.toLocaleString()}</span></div>
              </div>
            )}
            <div className="flex items-center gap-2 bg-green-500/8 border border-green-500/20 rounded-xl p-3">
              <Building2 className="w-4 h-4 text-green-400 flex-shrink-0" />
              <p className="text-green-300 text-xs">Amount will be transferred to your KYC-verified bank account ending in <span className="font-mono font-bold">****{String(data?.bankAccount || '').slice(-4) || '—'}</span></p>
            </div>
            <button onClick={() => setShowConfirm(true)} disabled={!canSubmit || withdraw.isPending}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed">
              <ArrowDownToLine className="w-4 h-4" /> Request Withdrawal
            </button>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-dark-800 border border-dark-700 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center mx-auto mb-3"><ArrowDownToLine className="w-7 h-7 text-blue-400" /></div>
              <h3 className="text-white text-lg font-bold">Confirm Withdrawal</h3>
              <p className="text-dark-400 text-sm mt-1">You are requesting a withdrawal of</p>
              <p className="text-blue-300 text-3xl font-black mt-2">₹{amt.toLocaleString()}</p>
              <p className="text-dark-500 text-xs mt-1">After TDS + Gateway Fee: <span className="text-green-400 font-semibold">₹{netAmount.toLocaleString()}</span></p>
            </div>
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-amber-300 text-xs">This amount will be deducted from your wallet and sent for HR approval.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} disabled={withdraw.isPending} className="flex-1 py-3 rounded-xl bg-dark-700 text-dark-300 font-semibold text-sm hover:bg-dark-600 transition-colors">Cancel</button>
              <button onClick={() => withdraw.mutate()} disabled={withdraw.isPending}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2">
                {withdraw.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      <div className="bg-dark-800 rounded-2xl border border-dark-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2"><Clock className="w-4 h-4 text-blue-400" /> Withdrawal History</h3>
          {history.length > 0 && <span className="text-dark-500 text-xs">{history.length} requests</span>}
        </div>
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ArrowDownToLine className="w-8 h-8 text-dark-600 mb-2" />
            <p className="text-dark-400 text-sm">No withdrawal requests yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((w: any) => {
              const cfg = STATUS_CFG[w.status] || STATUS_CFG.pending
              const StatusIcon = cfg.icon
              const canDownloadSlip = w.status === 'completed' || w.status === 'processing'
              return (
                <div key={w._id} className={`rounded-xl border p-4 ${cfg.bg} ${cfg.border}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg} border ${cfg.border}`}>
                        <StatusIcon className={`w-4 h-4 ${cfg.color}`} />
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">₹{(w.amount || 0).toLocaleString()}</p>
                        {w.tdsAmount > 0 && <p className="text-dark-400 text-xs">After TDS: <span className="text-green-400 font-semibold">₹{(w.netAmount || 0).toLocaleString()}</span></p>}
                        <p className="text-dark-500 text-xs mt-0.5">{new Date(w.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ${cfg.bg} ${cfg.color} ${cfg.border}`}>{cfg.label}</span>
                  </div>
                  {w.razorpayPayoutId && (
                    <div className="mt-3 flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                      <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                      <p className="text-green-300 text-xs">Txn ID: <span className="font-mono font-bold">{w.razorpayPayoutId}</span></p>
                    </div>
                  )}
                  {(w.hrRejectionReason || w.rejectionReason) && (
                    <div className="mt-3 flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                      <p className="text-red-300 text-xs">{w.hrRejectionReason || w.rejectionReason}</p>
                    </div>
                  )}
                  {canDownloadSlip && (
                    <div className="mt-3 flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
                      <BadgeCheck className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                      <p className="text-blue-300 text-xs flex-1">Sales Earning Slip ready</p>
                      <button onClick={() => handleDownloadSlip(w)} disabled={generatingSlip === w._id}
                        className="flex items-center gap-1.5 text-xs font-bold text-blue-300 hover:text-blue-200 bg-blue-500/15 hover:bg-blue-500/25 px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-50">
                        {generatingSlip === w._id ? <><Loader2 className="w-3 h-3 animate-spin" /> Generating...</> : <><FileText className="w-3 h-3" /> Download Slip</>}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Policy */}
      <div className="bg-dark-800 rounded-2xl border border-dark-700 p-5 space-y-3">
        <h3 className="text-white font-semibold text-sm flex items-center gap-2"><Info className="w-4 h-4 text-blue-400" /> Withdrawal Policy</h3>
        {[
          { icon: ShieldCheck,   text: 'KYC must be verified before any withdrawal' },
          { icon: Building2,     text: 'Transfers happen to your KYC-linked bank account only' },
          { icon: Clock,         text: 'Processing time: 3-5 business days after HR approval' },
          { icon: IndianRupee,   text: 'Minimum withdrawal: ₹500 | 2% TDS deducted (Sec 194H)' },
          { icon: FileText,      text: 'Sales Earning Slip auto-generated after HR approval' },
          { icon: AlertTriangle, text: 'Only 1 pending request allowed at a time' },
        ].map(({ icon: Icon, text }, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <Icon className="w-3.5 h-3.5 text-dark-500 flex-shrink-0 mt-0.5" />
            <p className="text-dark-400 text-xs">{text}</p>
          </div>
        ))}
      </div>

      {slipUrl && <SlipModal slipUrl={slipUrl} slipCanvas={slipCanvas} slipNo={slipNo} onClose={() => { setSlipUrl(null); setSlipCanvas(null) }} />}
      {generatingSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-dark-800 border border-blue-500/30 rounded-2xl p-8 text-center">
            <div className="w-14 h-14 rounded-full border-2 border-blue-500/30 border-t-blue-400 animate-spin mx-auto mb-4" />
            <p className="text-white font-semibold">Generating Earning Slip...</p>
          </div>
        </div>
      )}
    </div>
  )
}
