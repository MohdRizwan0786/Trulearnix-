'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminAPI } from '@/lib/api'
import AdminLayout from '@/components/AdminLayout'
import { Award, CheckCircle, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminReportCardsPage() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('pending_founder')
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [reason, setReason] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-report-cards', statusFilter],
    queryFn: () => adminAPI.reportCards(statusFilter).then(r => r.data),
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminAPI.approveReportCard(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-report-cards'] }); toast.success('Report card approved! Student can now download PDF.') },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminAPI.rejectReportCard(id, { reason }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-report-cards'] }); setRejectId(null); setReason(''); toast.success('Rejected') },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  })

  const reportCards = data?.reportCards || []

  const statusLabels: Record<string, string> = {
    pending_founder: 'Pending Approval',
    approved: 'Approved',
    rejected: 'Rejected',
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Report Cards</h1>
            <p className="text-gray-400 text-sm mt-1">Founder-level report card approvals</p>
          </div>
          <div className="flex gap-2">
            {['pending_founder', 'approved', 'rejected'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all ${statusFilter === s ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white'}`}>
                {statusLabels[s]}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-violet-400" /></div>
        ) : reportCards.length === 0 ? (
          <div className="card text-center py-16">
            <Award className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-white font-semibold">No {statusLabels[statusFilter].toLowerCase()} report cards</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reportCards.map((rc: any) => (
              <div key={rc._id} className="card p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    {rc.student?.avatar ? (
                      <img src={rc.student.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-sm">
                        {rc.student?.name?.[0] || '?'}
                      </div>
                    )}
                    <div>
                      <p className="text-white font-bold">{rc.student?.name}</p>
                      <p className="text-gray-400 text-xs">{rc.student?.email}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{rc.courseName}{rc.batchLabel ? ` · ${rc.batchLabel}` : ''}</p>
                      <p className="text-gray-600 text-xs">ID: {rc.reportCardId}</p>
                    </div>
                  </div>
                  {statusFilter === 'pending_founder' && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => approveMutation.mutate(rc._id)} disabled={approveMutation.isPending}
                        className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 font-semibold transition-colors disabled:opacity-50">
                        {approveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Approve
                      </button>
                      <button onClick={() => setRejectId(rc._id)}
                        className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 font-semibold transition-colors">
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  )}
                  {statusFilter === 'approved' && (
                    <span className="text-xs px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold flex-shrink-0 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Approved
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-5 gap-2 mt-4 text-center">
                  {[
                    { l: 'Progress', v: rc.progressPercent + '%' },
                    { l: 'Attendance', v: rc.attendancePct + '%' },
                    { l: 'Assignments', v: rc.avgAssignmentScore + '%' },
                    { l: 'Quizzes', v: rc.avgQuizScore + '%' },
                    { l: 'Score', v: rc.compositeScore + '/100', highlight: true },
                  ].map(s => (
                    <div key={s.l} className="bg-white/5 rounded-xl p-2">
                      <p className={`font-bold text-sm ${s.highlight ? (rc.compositeScore >= 80 ? 'text-emerald-400' : rc.compositeScore >= 60 ? 'text-amber-400' : 'text-red-400') : 'text-white'}`}>{s.v}</p>
                      <p className="text-gray-500 text-xs">{s.l}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-4 mt-3 text-xs text-gray-600 flex-wrap">
                  {rc.mentorApprovedAt && <span>Mentor approved: {new Date(rc.mentorApprovedAt).toLocaleDateString('en-IN')}</span>}
                  {rc.founderApprovedAt && <span>Founder approved: {new Date(rc.founderApprovedAt).toLocaleDateString('en-IN')}</span>}
                  {rc.rejectionReason && <span className="text-red-400">Rejected: {rc.rejectionReason}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {rejectId && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="card w-full max-w-md space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-lg">Reject Report Card</h3>
                <button onClick={() => { setRejectId(null); setReason('') }} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10"><X className="w-4 h-4" /></button>
              </div>
              <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for rejection..." className="input w-full h-24 resize-none" />
              <div className="flex gap-3">
                <button onClick={() => { setRejectId(null); setReason('') }} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white transition-colors text-sm">Cancel</button>
                <button onClick={() => rejectMutation.mutate({ id: rejectId!, reason })} disabled={rejectMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                  {rejectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Reject
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
