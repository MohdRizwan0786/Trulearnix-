'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mentorAPI } from '@/lib/api'
import { Award, CheckCircle, X, Loader2, Users, Clock, TrendingUp, Star } from 'lucide-react'
import toast from 'react-hot-toast'

function ScoreBadge({ label, value, highlight, composite }: { label: string; value: string; highlight?: boolean; composite?: number }) {
  const color = highlight
    ? (composite || 0) >= 80 ? 'text-emerald-400 bg-emerald-500/12 border-emerald-500/25'
      : (composite || 0) >= 60 ? 'text-amber-400 bg-amber-500/12 border-amber-500/25'
      : 'text-red-400 bg-red-500/12 border-red-500/25'
    : 'text-gray-300 bg-white/[0.04] border-white/[0.08]'

  return (
    <div className={`flex flex-col items-center justify-center p-3 rounded-xl border ${color}`}>
      <p className={`font-black text-base ${highlight ? '' : 'text-white'}`}>{value}</p>
      <p className="text-[10px] text-gray-500 font-semibold mt-0.5">{label}</p>
    </div>
  )
}

export default function MentorReportCardsPage() {
  const qc = useQueryClient()
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [reason, setReason]     = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['mentor-report-cards'],
    queryFn: () => mentorAPI.reportCards().then(r => r.data),
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => mentorAPI.approveReportCard(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mentor-report-cards'] }); toast.success('Approved! Sent to founder.') },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => mentorAPI.rejectReportCard(id, { reason }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mentor-report-cards'] }); setRejectId(null); setReason(''); toast.success('Rejected') },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  })

  const reportCards = data?.reportCards || []

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-1">Approvals</p>
          <h1 className="text-2xl md:text-3xl font-black text-white">Report Cards</h1>
          <p className="text-gray-500 text-sm mt-1">Students waiting for your approval</p>
        </div>
        {!isLoading && reportCards.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-amber-300 font-bold text-sm">{reportCards.length} Pending</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-44 rounded-2xl bg-[#0f0f1a] animate-pulse border border-white/[0.04]" />)}
        </div>
      ) : reportCards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-3xl bg-[#0f0f1a] border border-white/[0.06]">
          <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center mb-5">
            <Award className="w-9 h-9 text-indigo-400/60" />
          </div>
          <p className="text-white font-bold text-lg">No pending approvals</p>
          <p className="text-gray-500 text-sm mt-2 text-center">Student report card requests will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reportCards.map((rc: any) => (
            <div key={rc._id}
              className="rounded-2xl bg-[#0f0f1a] border border-white/[0.06] hover:border-amber-500/15 transition-all p-5">

              {/* Student Info + Actions */}
              <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
                <div className="flex items-center gap-4">
                  {rc.student?.avatar
                    ? <img src={rc.student.avatar} className="w-12 h-12 rounded-2xl object-cover border border-white/10 flex-shrink-0" />
                    : <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/25 to-violet-500/20 flex items-center justify-center flex-shrink-0 border border-indigo-500/20">
                        <span className="text-white font-bold text-lg">{rc.student?.name?.[0] || '?'}</span>
                      </div>
                  }
                  <div>
                    <p className="text-white font-bold text-base">{rc.student?.name}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{rc.student?.email}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {rc.courseName && (
                        <span className="text-[11px] text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full font-medium">
                          {rc.courseName}
                        </span>
                      )}
                      {rc.batchLabel && (
                        <span className="text-[11px] text-gray-500">{rc.batchLabel}</span>
                      )}
                    </div>
                    <p className="text-gray-600 text-[11px] mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Requested: {new Date(rc.requestedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2.5 flex-shrink-0">
                  <button
                    onClick={() => approveMutation.mutate(rc._id)}
                    disabled={approveMutation.isPending}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500/12 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-400 text-sm font-bold transition-all disabled:opacity-50">
                    {approveMutation.isPending
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <CheckCircle className="w-3.5 h-3.5" />
                    }
                    Approve
                  </button>
                  <button
                    onClick={() => setRejectId(rc._id)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/18 border border-red-500/20 text-red-400 text-sm font-bold transition-all">
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>

              {/* Scores */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <ScoreBadge label="Progress"   value={rc.progressPercent + '%'} />
                <ScoreBadge label="Attendance" value={rc.attendancePct + '%'} />
                <ScoreBadge label="Avg Score"  value={rc.avgAssignmentScore + '%'} />
                <ScoreBadge label="Overall"    value={rc.compositeScore + '/100'} highlight composite={rc.compositeScore} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#0f0f1a] border border-white/[0.08] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center">
                  <X className="w-4 h-4 text-red-400" />
                </div>
                <h3 className="text-white font-bold">Reject Report Card</h3>
              </div>
              <button
                onClick={() => { setRejectId(null); setReason('') }}
                className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-gray-400 font-semibold mb-1.5 uppercase tracking-wider">Reason for Rejection</label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Explain why this is being rejected (will be shown to the student)..."
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-red-500/40 transition-colors resize-none h-24"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setRejectId(null); setReason('') }}
                  className="flex-1 py-3 rounded-xl bg-white/[0.04] text-gray-400 hover:text-white border border-white/[0.08] font-semibold text-sm transition-all">
                  Cancel
                </button>
                <button
                  onClick={() => rejectMutation.mutate({ id: rejectId!, reason })}
                  disabled={rejectMutation.isPending}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 hover:opacity-90 active:scale-[0.98] transition-all">
                  {rejectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
