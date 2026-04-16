'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { courseAPI } from '@/lib/api'
import { Award, Download, Loader2, Clock, TrendingUp, BarChart2, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  pending_mentor:  { label: 'Awaiting Mentor',  color: '#fbbf24', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.25)',  icon: Clock      },
  pending_founder: { label: 'Awaiting Founder', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.25)',  icon: Clock      },
  approved:        { label: 'Approved',         color: '#4ade80', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.25)',   icon: CheckCircle},
  rejected:        { label: 'Rejected',         color: '#f87171', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.25)',   icon: AlertCircle},
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function drawBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, value: number, color: string) {
  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  ctx.beginPath();(ctx as any).roundRect(x, y, w, h, h / 2);ctx.fill()
  const fw = Math.max(0, Math.min(w, (value / 100) * w))
  if (fw > 0) { ctx.fillStyle = color; ctx.beginPath();(ctx as any).roundRect(x, y, fw, h, h / 2);ctx.fill() }
}

async function generateReportCard(rc: any): Promise<HTMLCanvasElement> {
  const SCALE = 3
  const W = 794, H = 1123
  const canvas = document.createElement('canvas')
  canvas.width = W * SCALE; canvas.height = H * SCALE
  const ctx = canvas.getContext('2d')!
  ctx.scale(SCALE, SCALE)

  ctx.fillStyle = '#0f0f1a'; ctx.fillRect(0, 0, W, H)

  const topGrad = ctx.createLinearGradient(0, 0, W, 0)
  topGrad.addColorStop(0, '#7c3aed'); topGrad.addColorStop(0.5, '#4f46e5'); topGrad.addColorStop(1, '#0ea5e9')
  ctx.fillStyle = topGrad; ctx.fillRect(0, 0, W, 8)

  let logoImg: HTMLImageElement | null = null
  try { logoImg = await loadImage('/logo.png') } catch(_) {}
  if (logoImg) {
    const lH = 44, lW = lH * (logoImg.width / logoImg.height)
    ctx.drawImage(logoImg, 40, 24, lW, lH)
  } else {
    ctx.font = 'bold 22px Arial'; ctx.fillStyle = '#7c3aed'; ctx.textAlign = 'left'; ctx.fillText('TruLearnix', 40, 58)
  }

  ctx.font = 'bold 26px Arial'; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.fillText('ACADEMIC REPORT CARD', W/2, 60)
  ctx.font = '12px Arial'; ctx.fillStyle = 'rgba(167,139,250,0.8)'; ctx.fillText('TRULEARNIX DIGITAL SKILLS LLP', W/2, 80)

  ctx.fillStyle = 'rgba(124,58,237,0.2)'; ctx.strokeStyle = 'rgba(124,58,237,0.5)'; ctx.lineWidth = 1
  ctx.beginPath();(ctx as any).roundRect(W - 200, 20, 160, 28, 14);ctx.fill();ctx.stroke()
  ctx.font = 'bold 10px Arial'; ctx.fillStyle = '#a78bfa'; ctx.textAlign = 'center'; ctx.fillText(rc.reportCardId, W - 120, 38)
  ctx.font = '9px Arial'; ctx.fillStyle = '#6b7280'
  ctx.fillText('Issued: ' + new Date(rc.founderApprovedAt || rc.updatedAt).toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' }), W - 120, 54)

  ctx.strokeStyle = 'rgba(124,58,237,0.3)'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(32, 112); ctx.lineTo(W - 32, 112); ctx.stroke()

  const siY = 138
  ctx.fillStyle = 'rgba(124,58,237,0.15)'; ctx.strokeStyle = 'rgba(124,58,237,0.4)'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.arc(78, siY + 32, 30, 0, Math.PI*2); ctx.fill(); ctx.stroke()
  ctx.font = 'bold 22px Arial'; ctx.fillStyle = '#a78bfa'; ctx.textAlign = 'center'; ctx.fillText((rc.studentName||'?')[0].toUpperCase(), 78, siY + 40)

  ctx.textAlign = 'left'
  ctx.font = 'bold 20px Arial'; ctx.fillStyle = '#ffffff'; ctx.fillText(rc.studentName, 124, siY + 20)
  ctx.font = '13px Arial'; ctx.fillStyle = '#9ca3af'
  ctx.fillText('Course: ' + rc.courseName, 124, siY + 40)
  if (rc.batchLabel) ctx.fillText('Batch: ' + rc.batchLabel, 124, siY + 56)
  if (rc.mentorName) ctx.fillText('Mentor: ' + rc.mentorName, 124, siY + (rc.batchLabel ? 72 : 56))

  const scoreColor = rc.compositeScore >= 80 ? '#10b981' : rc.compositeScore >= 60 ? '#f59e0b' : '#ef4444'
  const grade = rc.compositeScore >= 90 ? 'A+' : rc.compositeScore >= 80 ? 'A' : rc.compositeScore >= 70 ? 'B+' : rc.compositeScore >= 60 ? 'B' : rc.compositeScore >= 50 ? 'C' : 'D'
  ctx.fillStyle = 'rgba(255,255,255,0.03)'; ctx.strokeStyle = scoreColor + '40'; ctx.lineWidth = 2
  ctx.beginPath();(ctx as any).roundRect(W - 155, siY - 8, 120, 90, 16);ctx.fill();ctx.stroke()
  ctx.font = 'bold 42px Arial'; ctx.fillStyle = scoreColor; ctx.textAlign = 'center'; ctx.fillText(grade, W - 95, siY + 46)
  ctx.font = 'bold 13px Arial'; ctx.fillStyle = '#9ca3af'; ctx.fillText(rc.compositeScore + ' / 100', W - 95, siY + 68)
  ctx.font = '10px Arial'; ctx.fillStyle = '#6b7280'; ctx.fillText('Overall Score', W - 95, siY + 82)

  const pmY = siY + 112
  ctx.font = 'bold 14px Arial'; ctx.fillStyle = '#a78bfa'; ctx.textAlign = 'left'; ctx.fillText('PERFORMANCE BREAKDOWN', 40, pmY)
  ctx.strokeStyle = 'rgba(124,58,237,0.3)'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(40, pmY + 8); ctx.lineTo(W - 40, pmY + 8); ctx.stroke()

  const metrics = [
    { label: 'Course Progress', value: rc.progressPercent, sub: `${rc.completedLessons}/${rc.totalLessons} lessons completed`, color: '#4f46e5' },
    { label: 'Class Attendance', value: rc.attendancePct, sub: `${rc.sessionsAttended}/${rc.totalSessions} sessions attended`, color: '#0ea5e9' },
    { label: 'Assignments', value: rc.totalAssignments > 0 ? Math.round(rc.assignmentsSubmitted/rc.totalAssignments*100) : 0, sub: `${rc.assignmentsSubmitted}/${rc.totalAssignments} submitted · Avg score ${rc.avgAssignmentScore}%`, color: '#10b981' },
    { label: 'Quizzes', value: rc.totalQuizzes > 0 ? Math.round(rc.quizzesTaken/rc.totalQuizzes*100) : 0, sub: `${rc.quizzesTaken}/${rc.totalQuizzes} attempted · Avg score ${rc.avgQuizScore}%`, color: '#f59e0b' },
  ]

  metrics.forEach((m, i) => {
    const mY = pmY + 26 + i * 66
    ctx.fillStyle = 'rgba(255,255,255,0.03)'; ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1
    ctx.beginPath();(ctx as any).roundRect(40, mY, W - 80, 56, 10);ctx.fill();ctx.stroke()
    ctx.font = 'bold 13px Arial'; ctx.fillStyle = '#e5e7eb'; ctx.textAlign = 'left'; ctx.fillText(m.label, 58, mY + 19)
    ctx.font = '11px Arial'; ctx.fillStyle = '#6b7280'; ctx.fillText(m.sub, 58, mY + 34)
    ctx.font = 'bold 20px Arial'; ctx.fillStyle = m.color; ctx.textAlign = 'right'; ctx.fillText(m.value + '%', W - 58, mY + 23)
    drawBar(ctx, 58, mY + 42, W - 116, 7, m.value, m.color)
  })

  const fY = pmY + 26 + 4 * 66 + 8
  ctx.font = '10px Arial'; ctx.fillStyle = '#4b5563'; ctx.textAlign = 'center'
  ctx.fillText('Overall Score = Progress (35%) + Attendance (25%) + Assignments (25%) + Quizzes (15%)', W/2, fY)

  const apY = fY + 26
  ctx.font = 'bold 14px Arial'; ctx.fillStyle = '#a78bfa'; ctx.textAlign = 'left'; ctx.fillText('VERIFICATION & APPROVAL', 40, apY)
  ctx.strokeStyle = 'rgba(124,58,237,0.3)'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(40, apY + 8); ctx.lineTo(W - 40, apY + 8); ctx.stroke()

  ctx.fillStyle = '#dcfce7'; ctx.strokeStyle = '#86efac'; ctx.lineWidth = 1
  ctx.beginPath();(ctx as any).roundRect(40, apY + 18, 200, 26, 13);ctx.fill();ctx.stroke()
  ctx.font = 'bold 10px Arial'; ctx.fillStyle = '#15803d'; ctx.textAlign = 'left'; ctx.fillText('✓ Mentor Approved', 56, apY + 35)
  if (rc.mentorApprovedAt) { ctx.font = '9px Arial'; ctx.fillStyle = '#4b5563'; ctx.textAlign = 'right'; ctx.fillText(new Date(rc.mentorApprovedAt).toLocaleDateString('en-IN'), 236, apY + 35) }

  ctx.fillStyle = '#ede9fe'; ctx.strokeStyle = '#c4b5fd'; ctx.lineWidth = 1
  ctx.beginPath();(ctx as any).roundRect(252, apY + 18, 200, 26, 13);ctx.fill();ctx.stroke()
  ctx.font = 'bold 10px Arial'; ctx.fillStyle = '#7c3aed'; ctx.textAlign = 'left'; ctx.fillText('✓ Founder Approved', 268, apY + 35)
  if (rc.founderApprovedAt) { ctx.font = '9px Arial'; ctx.fillStyle = '#4b5563'; ctx.textAlign = 'right'; ctx.fillText(new Date(rc.founderApprovedAt).toLocaleDateString('en-IN'), 448, apY + 35) }

  const sigY = apY + 62
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(32, sigY); ctx.lineTo(W - 32, sigY); ctx.stroke()

  ctx.font = '9px Arial'; ctx.fillStyle = '#9ca3af'; ctx.textAlign = 'left'; ctx.fillText('Student:', 40, sigY + 18)
  ctx.font = 'bold 13px Arial'; ctx.fillStyle = '#e5e7eb'; ctx.fillText(rc.studentName, 40, sigY + 35)
  ctx.font = '9px Arial'; ctx.fillStyle = '#6b7280'; ctx.fillText('Report Card ID: ' + rc.reportCardId, 40, sigY + 50)

  const sigRX = W / 2 + 40
  ctx.fillStyle = '#dcfce7'; ctx.strokeStyle = '#86efac'; ctx.lineWidth = 1
  ctx.beginPath();(ctx as any).roundRect(sigRX, sigY + 8, 190, 22, 11);ctx.fill();ctx.stroke()
  ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  ctx.beginPath(); ctx.moveTo(sigRX+10,sigY+20); ctx.lineTo(sigRX+14,sigY+24); ctx.lineTo(sigRX+22,sigY+15); ctx.stroke()
  ctx.lineCap = 'butt'; ctx.lineJoin = 'miter'
  ctx.font = 'bold 10px Arial'; ctx.fillStyle = '#15803d'; ctx.textAlign = 'left'; ctx.fillText('DIGITALLY SIGNED', sigRX + 28, sigY + 23)

  const companyLineY = sigY + 34 + 140
  let sigImg: HTMLImageElement | null = null
  try { sigImg = await loadImage('/signature.png') } catch(_) {}
  if (sigImg) {
    const sigW = 210, sigH = 140, scale = Math.min(sigW/sigImg.width, sigH/sigImg.height)
    ctx.drawImage(sigImg, sigRX, companyLineY - sigImg.height*scale, sigImg.width*scale, sigImg.height*scale)
  }
  ctx.font = 'bold 10px Arial'; ctx.fillStyle = '#e5e7eb'; ctx.textAlign = 'left'; ctx.fillText('For TRULEARNIX DIGITAL SKILLS LLP', sigRX, companyLineY)
  ctx.font = 'bold 12px Arial'; ctx.fillStyle = '#a78bfa'; ctx.fillText('Ashfana Kolhar', sigRX, companyLineY + 16)
  ctx.font = '9.5px Arial'; ctx.fillStyle = '#9ca3af'; ctx.fillText('Authorized Signatory (Founder)', sigRX, companyLineY + 30)
  ctx.font = '9px Arial'; ctx.fillStyle = '#6b7280'
  ctx.fillText('Signed: ' + new Date(rc.founderApprovedAt || rc.updatedAt).toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}), sigRX, companyLineY + 42)

  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(W/2+10, sigY+4); ctx.lineTo(W/2+10, companyLineY+44); ctx.stroke()

  const ftY = H - 58
  const footGrad = ctx.createLinearGradient(0, ftY, W, ftY+58)
  footGrad.addColorStop(0, '#1e1b4b'); footGrad.addColorStop(1, '#312e81')
  ctx.fillStyle = footGrad; ctx.fillRect(0, ftY, W, 58)
  ctx.font = '9.5px Arial'; ctx.fillStyle = 'rgba(196,181,253,0.9)'; ctx.textAlign = 'center'
  ctx.fillText('This is a digitally signed computer-generated document. No physical signature required.', W/2, ftY+18)
  ctx.fillText('Official@trulearnix.com  ·  +91 89796 16798', W/2, ftY+33)
  ctx.font = 'bold 9.5px Arial'; ctx.fillStyle = 'rgba(167,139,250,0.8)'; ctx.fillText('www.trulearnix.com', W/2, ftY+48)

  return canvas
}

async function downloadReportCard(rc: any) {
  const canvas = await generateReportCard(rc)
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  pdf.addImage(canvas.toDataURL('image/jpeg', 0.98), 'JPEG', 0, 0, 210, 297)
  pdf.save(`Report-Card-${rc.reportCardId}.pdf`)
}

export default function ReportCardsPage() {
  const [downloading, setDownloading] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['my-report-cards'],
    queryFn: () => courseAPI.myReportCards().then(r => r.data),
  })

  const handleDownload = async (rc: any) => {
    setDownloading(rc._id)
    try { await downloadReportCard(rc) }
    catch(e) { toast.error('Failed to generate PDF') }
    finally { setDownloading(null) }
  }

  const reportCards = data?.reportCards || []

  return (
    <>
      <style>{`
        @keyframes reportShimmer {
          0% { opacity: 0.3; }
          50% { opacity: 1; }
          100% { opacity: 0.3; }
        }
      `}</style>

      <div className="space-y-6 max-w-4xl pb-8">

        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl p-6" style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.18), rgba(99,102,241,0.12))',
          border: '1px solid rgba(139,92,246,0.25)'
        }}>
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(139,92,246,0.25)' }} />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(99,102,241,0.2))',
              border: '1px solid rgba(139,92,246,0.4)',
              boxShadow: '0 8px 25px rgba(139,92,246,0.25)'
            }}>
              <Award className="w-7 h-7 text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">Report Cards</h1>
              <p className="text-gray-400 text-sm mt-0.5">Mentor-approved performance reports</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
          </div>
        ) : reportCards.length === 0 ? (
          <div className="rounded-3xl text-center py-20 px-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <Award className="w-10 h-10 text-violet-400/40" />
            </div>
            <p className="text-white font-black text-xl mb-2">No report cards yet</p>
            <p className="text-gray-400 text-sm">Complete a course and request your report card from the course page.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reportCards.map((rc: any) => {
              const st = STATUS_MAP[rc.status] || STATUS_MAP.pending_mentor
              const StatusIcon = st.icon
              const scoreColor = rc.compositeScore >= 80 ? '#4ade80' : rc.compositeScore >= 60 ? '#fbbf24' : '#f87171'
              const grade = rc.compositeScore >= 90 ? 'A+' : rc.compositeScore >= 80 ? 'A' : rc.compositeScore >= 70 ? 'B+' : rc.compositeScore >= 60 ? 'B' : rc.compositeScore >= 50 ? 'C' : 'D'

              return (
                <div key={rc._id} className="rounded-2xl overflow-hidden transition-all hover:scale-[1.005]" style={{
                  background: 'rgba(13,13,20,0.95)',
                  border: '1px solid rgba(255,255,255,0.07)'
                }}>
                  {/* Top bar */}
                  <div className="px-5 py-3 flex items-center justify-between" style={{
                    background: `linear-gradient(135deg, ${st.bg}, rgba(0,0,0,0))`,
                    borderBottom: `1px solid ${st.border}`
                  }}>
                    <div className="flex items-center gap-2">
                      <StatusIcon className="w-4 h-4" style={{ color: st.color }} />
                      <span className="text-xs font-black uppercase tracking-wider" style={{ color: st.color }}>{st.label}</span>
                    </div>
                    <span className="text-xs text-gray-500">ID: {rc.reportCardId}</span>
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-black text-lg">{rc.courseName}</h3>
                        {rc.batchLabel && <p className="text-gray-500 text-xs mt-0.5">Batch: {rc.batchLabel}</p>}
                        <p className="text-gray-600 text-xs mt-1">Requested: {new Date(rc.requestedAt).toLocaleDateString('en-IN')}</p>

                        {/* Metric bars */}
                        <div className="grid grid-cols-2 gap-3 mt-4">
                          {[
                            { label: 'Progress', value: rc.progressPercent, color: '#818cf8' },
                            { label: 'Attendance', value: rc.attendancePct, color: '#22d3ee' },
                          ].map(m => (
                            <div key={m.label}>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-500">{m.label}</span>
                                <span className="font-bold" style={{ color: m.color }}>{m.value}%</span>
                              </div>
                              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                <div className="h-full rounded-full" style={{ width: `${m.value}%`, background: m.color }} />
                              </div>
                            </div>
                          ))}
                        </div>

                        {rc.rejectionReason && (
                          <p className="text-red-400 text-xs mt-3 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Rejected: {rc.rejectionReason}
                          </p>
                        )}
                      </div>

                      {/* Score Badge */}
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center" style={{
                          background: `${scoreColor}18`,
                          border: `2px solid ${scoreColor}40`,
                          boxShadow: `0 8px 25px ${scoreColor}15`
                        }}>
                          <span className="text-3xl font-black" style={{ color: scoreColor }}>{grade}</span>
                          <span className="text-[10px] font-bold" style={{ color: scoreColor }}>{rc.compositeScore}/100</span>
                        </div>

                        {rc.status === 'approved' ? (
                          <button onClick={() => handleDownload(rc)} disabled={downloading === rc._id}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                            style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}>
                            {downloading === rc._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            PDF
                          </button>
                        ) : rc.status !== 'rejected' ? (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>{rc.status === 'pending_mentor' ? 'Mentor review' : 'Founder review'}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
