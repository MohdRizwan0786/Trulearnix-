'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminAPI } from '@/lib/api'
import AdminLayout from '@/components/AdminLayout'
import { useParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  Users, Clock, Plus, X, Loader2, ArrowLeft, CheckCircle,
  XCircle, ArrowRightLeft, Layers, Calendar, AlertCircle,
  ChevronDown, ChevronRight, Shield, Zap, BarChart2, Play, BookOpen
} from 'lucide-react'

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function daysLeft(closingDate: string) {
  const diff = new Date(closingDate).getTime() - Date.now()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  return days
}

function BatchStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    active: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    closed: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
    full: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  }
  return (
    <span className={`text-xs capitalize px-2.5 py-1 rounded-lg font-bold ${map[status] || 'bg-gray-500/20 text-gray-400'}`}>
      {status}
    </span>
  )
}

function BatchCard({ batch, courseId, onTransfer }: { batch: any; courseId: string; onTransfer: (batch: any) => void }) {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()

  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['batch-students', batch._id],
    queryFn: () => adminAPI.batchStudents(batch._id).then(r => r.data),
    enabled: open
  })

  const closeBatch = useMutation({
    mutationFn: () => adminAPI.closeBatch(batch._id),
    onSuccess: () => {
      toast.success('Batch closed')
      qc.invalidateQueries({ queryKey: ['batches', courseId] })
    },
    onError: () => toast.error('Failed to close batch')
  })

  const reopenBatch = useMutation({
    mutationFn: () => adminAPI.reopenBatch(batch._id, { closingDays: batch.closingDays }),
    onSuccess: () => {
      toast.success('Batch reopened')
      qc.invalidateQueries({ queryKey: ['batches', courseId] })
    },
    onError: () => toast.error('Failed to reopen batch')
  })

  const startBatch = useMutation({
    mutationFn: () => adminAPI.startBatch(batch._id),
    onSuccess: () => {
      toast.success('Batch started!')
      qc.invalidateQueries({ queryKey: ['batches', courseId] })
    },
    onError: () => toast.error('Failed to start batch')
  })

  const markDay = useMutation({
    mutationFn: () => adminAPI.markBatchDay(batch._id),
    onSuccess: (res: any) => {
      const data = res.data
      if (data.autoCreated) {
        toast.success(data.message || 'Batch completed! New batch created.')
      } else {
        toast.success(`Day ${data.batch.daysCompleted} marked!`)
      }
      qc.invalidateQueries({ queryKey: ['batches', courseId] })
    },
    onError: () => toast.error('Failed to mark day')
  })

  const days = batch.closingDate ? daysLeft(batch.closingDate) : null
  const pct = Math.min(100, Math.round((batch.enrolledCount / batch.maxStrength) * 100))
  const daysPct = batch.totalDays > 0 ? Math.min(100, Math.round((batch.daysCompleted / batch.totalDays) * 100)) : 0

  return (
    <div className={`card p-0 overflow-hidden transition-all ${batch.status === 'active' ? 'ring-1 ring-violet-500/30' : batch.status === 'pending' ? 'ring-1 ring-blue-500/30' : ''}`}>
      {/* Batch header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0
              ${batch.status === 'active' ? 'bg-violet-500/20 text-violet-400' : batch.status === 'pending' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-gray-500'}`}>
              #{batch.batchNumber}
            </div>
            <div>
              <h3 className="text-white font-bold">{batch.label || `Batch ${batch.batchNumber}`}</h3>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <BatchStatusBadge status={batch.status} />
                {batch.status === 'active' && days !== null && days > 0 && (
                  <span className="text-xs text-amber-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {days} days left
                  </span>
                )}
                {batch.status === 'active' && days !== null && days <= 0 && (
                  <span className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Expired
                  </span>
                )}
                {batch.status === 'pending' && (
                  <span className="text-xs text-blue-400">Waiting to start</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {batch.status === 'pending' && (
              <button onClick={() => { if (confirm('Start this batch now?')) startBatch.mutate() }}
                disabled={startBatch.isPending}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors border border-emerald-500/20 disabled:opacity-50 font-semibold">
                {startBatch.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                Start Batch
              </button>
            )}
            {batch.status === 'active' && (
              <>
                {batch.totalDays > 0 && (
                  <button onClick={() => markDay.mutate()}
                    disabled={markDay.isPending}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-violet-500/10 text-violet-400 hover:bg-violet-500 hover:text-white transition-colors border border-violet-500/20 disabled:opacity-50 font-semibold">
                    {markDay.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <BookOpen className="w-3 h-3" />}
                    Mark Day
                  </button>
                )}
                <button onClick={() => { if (confirm('Close this batch?')) closeBatch.mutate() }}
                  disabled={closeBatch.isPending}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors border border-red-500/20 disabled:opacity-50">
                  {closeBatch.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Close Batch'}
                </button>
              </>
            )}
            {batch.status === 'closed' && (
              <button onClick={() => reopenBatch.mutate()}
                disabled={reopenBatch.isPending}
                className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors border border-emerald-500/20 disabled:opacity-50">
                {reopenBatch.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Reopen'}
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className={`grid gap-3 mt-4 ${batch.totalDays > 0 ? 'grid-cols-4' : 'grid-cols-3'}`}>
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-white">{batch.enrolledCount}</p>
            <p className="text-gray-500 text-xs mt-0.5">Enrolled</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-white">{batch.maxStrength}</p>
            <p className="text-gray-500 text-xs mt-0.5">Max Capacity</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <p className={`text-2xl font-black ${pct >= 100 ? 'text-red-400' : pct >= 80 ? 'text-amber-400' : 'text-emerald-400'}`}>{pct}%</p>
            <p className="text-gray-500 text-xs mt-0.5">Filled</p>
          </div>
          {batch.totalDays > 0 && (
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <p className={`text-2xl font-black ${daysPct >= 100 ? 'text-emerald-400' : 'text-violet-400'}`}>
                {batch.daysCompleted}/{batch.totalDays}
              </p>
              <p className="text-gray-500 text-xs mt-0.5">Days Done</p>
            </div>
          )}
        </div>

        {/* Seat fill progress bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Seat capacity</span>
            <span>{pct}%</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Course days progress bar */}
        {batch.totalDays > 0 && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Course progress</span>
              <span>{batch.daysCompleted} / {batch.totalDays} days ({daysPct}%)</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${daysPct >= 100 ? 'bg-emerald-500' : 'bg-violet-500'}`}
                style={{ width: `${daysPct}%` }} />
            </div>
          </div>
        )}

        {/* Dates */}
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 flex-wrap">
          {batch.startDate && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Started: {formatDate(batch.startDate)}
            </span>
          )}
          {!batch.startDate && (
            <span className="flex items-center gap-1 text-blue-400/70">
              <Calendar className="w-3 h-3" /> Not started yet
            </span>
          )}
          {batch.closingDate && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> Closes: {formatDate(batch.closingDate)}
            </span>
          )}
        </div>
      </div>

      {/* Students toggle */}
      <div className="border-t border-white/5">
        <button onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-5 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
          <span className="flex items-center gap-2">
            <Users className="w-4 h-4" /> View Students ({batch.enrolledCount})
          </span>
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {open && (
          <div className="border-t border-white/5 divide-y divide-white/5">
            {studentsLoading ? (
              <div className="py-6 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
              </div>
            ) : studentsData?.enrollments?.length === 0 ? (
              <div className="py-6 text-center text-gray-600 text-sm">No students enrolled yet</div>
            ) : studentsData?.enrollments?.map((enr: any) => (
              <div key={enr._id} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  {enr.student?.avatar ? (
                    <img src={enr.student.avatar} alt="" className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-xs">
                      {enr.student?.name?.[0] || '?'}
                    </div>
                  )}
                  <div>
                    <p className="text-white text-sm font-medium">{enr.student?.name || 'Unknown'}</p>
                    <p className="text-gray-500 text-xs">{enr.student?.email}</p>
                  </div>
                </div>
                <button onClick={() => onTransfer({ studentId: enr.student?._id, studentName: enr.student?.name, fromBatchId: batch._id, fromBatchLabel: batch.label || `Batch ${batch.batchNumber}` })}
                  className="flex items-center gap-1 text-xs text-violet-400 hover:text-white hover:bg-violet-500 px-2.5 py-1.5 rounded-lg bg-violet-500/10 transition-colors">
                  <ArrowRightLeft className="w-3 h-3" /> Transfer
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TransferModal({ courseId, batches, transferData, onClose }: {
  courseId: string; batches: any[]; transferData: any; onClose: () => void
}) {
  const [targetBatchId, setTargetBatchId] = useState('')
  const qc = useQueryClient()

  const transfer = useMutation({
    mutationFn: () => adminAPI.transferStudent({
      studentId: transferData.studentId,
      fromBatchId: transferData.fromBatchId,
      toBatchId: targetBatchId,
      courseId
    }),
    onSuccess: () => {
      toast.success(`${transferData.studentName} transferred successfully!`)
      qc.invalidateQueries({ queryKey: ['batches', courseId] })
      qc.invalidateQueries({ queryKey: ['batch-students'] })
      onClose()
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Transfer failed')
  })

  const eligibleBatches = batches.filter(b => b._id !== transferData.fromBatchId && b.status !== 'closed')

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-md space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">Transfer Student</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-white/5 rounded-2xl p-4">
          <p className="text-gray-400 text-xs">Transferring</p>
          <p className="text-white font-bold mt-1">{transferData.studentName}</p>
          <p className="text-gray-500 text-sm mt-0.5">
            From: <span className="text-amber-400">{transferData.fromBatchLabel}</span>
          </p>
        </div>

        <div>
          <label className="label">Transfer to Batch *</label>
          <select value={targetBatchId} onChange={e => setTargetBatchId(e.target.value)} className="input w-full">
            <option value="">Select target batch</option>
            {eligibleBatches.map(b => (
              <option key={b._id} value={b._id}>
                {b.label || `Batch ${b.batchNumber}`} — {b.enrolledCount}/{b.maxStrength} students ({b.status})
              </option>
            ))}
          </select>
          {eligibleBatches.length === 0 && (
            <p className="text-amber-400 text-xs mt-2">No eligible batches available. Create a new batch first.</p>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors text-sm">
            Cancel
          </button>
          <button onClick={() => transfer.mutate()} disabled={!targetBatchId || transfer.isPending}
            className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2">
            {transfer.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightLeft className="w-4 h-4" />}
            Transfer
          </button>
        </div>
      </div>
    </div>
  )
}

function CreateBatchModal({ courseId, courseTotalDays, onClose }: { courseId: string; courseTotalDays: number; onClose: () => void }) {
  const [minStrength, setMinStrength] = useState(5)
  const [maxStrength, setMaxStrength] = useState(50)
  const [closingDays, setClosingDays] = useState(30)
  const [totalDays, setTotalDays] = useState(courseTotalDays || 0)
  const [label, setLabel] = useState('')
  const qc = useQueryClient()

  const create = useMutation({
    mutationFn: () => adminAPI.createBatch({ courseId, minStrength, maxStrength, closingDays, totalDays, label }),
    onSuccess: () => {
      toast.success('Batch created! Start it when ready.')
      qc.invalidateQueries({ queryKey: ['batches', courseId] })
      onClose()
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to create batch')
  })

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-md space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">Create New Batch</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label className="label">Batch Label <span className="text-gray-500 font-normal">(optional)</span></label>
          <input value={label} onChange={e => setLabel(e.target.value)}
            placeholder="e.g. Batch 3 — April 2026" className="input w-full" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label text-xs">Course Duration (days) <span className="text-gray-500 font-normal">0 = no limit</span></label>
            <input type="number" value={totalDays} onChange={e => setTotalDays(Number(e.target.value))}
              className="input w-full" min={0} />
          </div>
          <div>
            <label className="label text-xs">Closing Days <span className="text-gray-500 font-normal">(auto-close by date)</span></label>
            <input type="number" value={closingDays} onChange={e => setClosingDays(Number(e.target.value))}
              className="input w-full" min={1} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label text-xs">Min Students</label>
            <input type="number" value={minStrength} onChange={e => setMinStrength(Number(e.target.value))}
              className="input w-full" min={1} />
          </div>
          <div>
            <label className="label text-xs">Max Students</label>
            <input type="number" value={maxStrength} onChange={e => setMaxStrength(Number(e.target.value))}
              className="input w-full" min={1} />
          </div>
        </div>

        <div className="bg-violet-500/10 rounded-2xl p-4 text-sm text-violet-300 border border-violet-500/20 space-y-1">
          <p>Batch will be created in <strong>Pending</strong> state — start it manually when ready.</p>
          {totalDays > 0 && <p>Auto-closes after <strong>{totalDays} days</strong> of content (Mark Day button).</p>}
          <p>Date-based close: after <strong>{closingDays} days</strong> from start date.</p>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors text-sm">
            Cancel
          </button>
          <button onClick={() => create.mutate()} disabled={create.isPending}
            className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2">
            {create.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create Batch
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BatchManagementPage() {
  const { id: courseId } = useParams<{ id: string }>()
  const router = useRouter()
  const [transferData, setTransferData] = useState<any>(null)
  const [showCreate, setShowCreate] = useState(false)

  const { data: courseData } = useQuery({
    queryKey: ['admin-course', courseId],
    queryFn: () => adminAPI.getCourse(courseId).then(r => r.data)
  })
  const course = courseData?.course

  const { data, isLoading } = useQuery({
    queryKey: ['batches', courseId],
    queryFn: () => adminAPI.batches(courseId).then(r => r.data)
  })
  const batches: any[] = data?.batches || []

  const activeBatch = batches.find(b => b.status === 'active')
  const pendingBatch = batches.find(b => b.status === 'pending')
  const totalEnrolled = batches.reduce((s, b) => s + b.enrolledCount, 0)
  const courseTotalDays = course?.batchSettings?.durationDays || 0

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-violet-400 flex-shrink-0" />
              <h1 className="text-xl font-bold text-white truncate">Batch Management</h1>
            </div>
            {course && (
              <p className="text-gray-400 text-sm mt-0.5 truncate">{course.title}</p>
            )}
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-violet-500/20 flex-shrink-0 text-sm">
            <Plus className="w-4 h-4" /> New Batch
          </button>
        </div>

        {/* Overview stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Batches', value: batches.length, icon: Layers, color: 'text-violet-400', bg: 'bg-violet-500/10' },
            { label: 'Active Batch', value: activeBatch ? `#${activeBatch.batchNumber}` : pendingBatch ? `#${pendingBatch.batchNumber} (pending)` : '—', icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Total Enrolled', value: totalEnrolled, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Closed Batches', value: batches.filter(b => b.status === 'closed').length, icon: Shield, color: 'text-gray-400', bg: 'bg-gray-500/10' },
          ].map(s => (
            <div key={s.label} className="card flex items-center gap-3 p-4">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div>
                <p className="text-gray-500 text-xs">{s.label}</p>
                <p className="text-white font-bold text-lg leading-tight">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Batch flow diagram */}
        {batches.length === 0 && !isLoading && (
          <div className="card text-center py-12 space-y-4">
            <Layers className="w-12 h-12 text-gray-700 mx-auto" />
            <div>
              <p className="text-white font-semibold">No batches yet</p>
              <p className="text-gray-500 text-sm mt-1">Create the first batch to start enrolling students in groups</p>
            </div>
            <button onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-all">
              <Plus className="w-4 h-4" /> Create First Batch
            </button>
          </div>
        )}

        {isLoading && (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="card animate-pulse h-40" />
            ))}
          </div>
        )}

        {/* Batch cards */}
        <div className="space-y-4">
          {batches.map(batch => (
            <BatchCard key={batch._id} batch={batch} courseId={courseId}
              onTransfer={setTransferData} />
          ))}
        </div>
      </div>

      {/* Modals */}
      {showCreate && <CreateBatchModal courseId={courseId} courseTotalDays={courseTotalDays} onClose={() => setShowCreate(false)} />}
      {transferData && (
        <TransferModal
          courseId={courseId}
          batches={batches}
          transferData={transferData}
          onClose={() => setTransferData(null)}
        />
      )}
    </AdminLayout>
  )
}
