'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminAPI } from '@/lib/api'
import AdminLayout from '@/components/AdminLayout'
import {
  IndianRupee, Plus, X, CheckCircle, Clock, Banknote,
  Loader2, Trash2, Filter, AlertCircle, Calendar, Calculator,
} from 'lucide-react'
import toast from 'react-hot-toast'

const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  pending:  { label: 'Pending',  color: 'text-amber-400', bg: 'bg-amber-500/10',  border: 'border-amber-500/20',  icon: Clock },
  approved: { label: 'Approved', color: 'text-blue-400',  bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   icon: CheckCircle },
  paid:     { label: 'Paid',     color: 'text-green-400', bg: 'bg-green-500/10',  border: 'border-green-500/20',  icon: Banknote },
}

const CUR_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 4 }, (_, i) => CUR_YEAR - i)

function CreateSalaryModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    mentorId: '', month: String(new Date().getMonth() + 1), year: String(CUR_YEAR),
    amount: '', tdsRate: '10', remarks: '',
  })

  const { data: mentorsData } = useQuery({
    queryKey: ['admin-mentors-list'],
    queryFn: () => adminAPI.mentorsList().then(r => r.data),
  })
  const mentors: any[] = mentorsData?.mentors || []

  const amt = Number(form.amount) || 0

  const { data: calcData, isFetching: calcLoading } = useQuery({
    queryKey: ['mentor-salary-calc', form.mentorId, form.month, form.year, form.amount, form.tdsRate],
    queryFn: () => adminAPI.calculateSalary({
      userId: form.mentorId, userType: 'mentor',
      month: form.month, year: form.year,
      gross: form.amount, tdsRate: form.tdsRate,
    }).then(r => r.data),
    enabled: !!(form.mentorId && form.amount && amt > 0),
  })

  const calc = calcData
  const noAttendance = calc && calc.present === 0 && calc.absent === 0 && calc.halfDay === 0 && calc.paidLeave === 0
  const displayNet = calc ? calc.net : (amt - Math.round(amt * Number(form.tdsRate) / 100))
  const displayTds = calc ? calc.tds : Math.round(amt * Number(form.tdsRate) / 100)

  const create = useMutation({
    mutationFn: () => adminAPI.createMentorSalary({
      mentorId: form.mentorId, month: Number(form.month), year: Number(form.year),
      amount: amt, tdsRate: Number(form.tdsRate), remarks: form.remarks,
      ...(calc && !noAttendance ? {
        workingDays: calc.workingDays, presentDays: calc.present, absentDays: calc.absent,
        halfDays: calc.halfDay, leaveDays: calc.paidLeave, unpaidLeaveDays: calc.unpaid,
        holidayDays: calc.holidayDays, payableDays: calc.payable,
        perDayAmount: calc.perDay, earnedAmount: calc.earned,
      } : {}),
    }),
    onSuccess: () => {
      toast.success('Salary record created!')
      qc.invalidateQueries({ queryKey: ['admin-mentor-salaries'] })
      onClose()
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to create'),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-white font-bold flex items-center gap-2">
            <Plus className="w-4 h-4 text-violet-400" /> Create Mentor Salary
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-gray-400 text-xs font-medium mb-1.5 block">Mentor *</label>
            <select value={form.mentorId} onChange={e => setForm(f => ({ ...f, mentorId: e.target.value }))} className="input w-full">
              <option value="">Select mentor...</option>
              {mentors.map((m: any) => <option key={m._id} value={m._id}>{m.name} ({m.email})</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-xs font-medium mb-1.5 block">Month *</label>
              <select value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))} className="input w-full">
                {MONTHS.slice(1).map((m, i) => <option key={i + 1} value={String(i + 1)}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-xs font-medium mb-1.5 block">Year *</label>
              <select value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} className="input w-full">
                {YEARS.map(y => <option key={y} value={String(y)}>{y}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-xs font-medium mb-1.5 block">Monthly Amount (₹) *</label>
              <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="e.g. 25000" className="input w-full" />
            </div>
            <div>
              <label className="text-gray-400 text-xs font-medium mb-1.5 block">TDS Rate (%)</label>
              <input type="number" value={form.tdsRate} onChange={e => setForm(f => ({ ...f, tdsRate: e.target.value }))}
                min={0} max={30} className="input w-full" />
            </div>
          </div>

          {amt > 0 && (
            <div className="bg-slate-800/60 rounded-xl p-3 border border-white/10 space-y-2">
              {calcLoading && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Loader2 className="w-3 h-3 animate-spin" /> Fetching attendance...
                </div>
              )}

              {calc && !noAttendance && (
                <>
                  <p className="text-xs font-semibold text-violet-400 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" /> Attendance — {MONTHS[Number(form.month)]} {form.year}
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {[
                      { l: 'Working Days', v: calc.workingDays, c: 'text-gray-300' },
                      { l: 'Holidays',     v: calc.holidayDays, c: 'text-purple-400' },
                      { l: 'Present',      v: calc.present,     c: 'text-green-400' },
                      { l: 'Absent',       v: calc.absent,      c: 'text-red-400' },
                      { l: 'Half Day',     v: calc.halfDay,     c: 'text-amber-400' },
                      { l: 'Paid Leave',   v: calc.paidLeave,   c: 'text-blue-400' },
                    ].map(x => (
                      <div key={x.l} className="bg-white/5 rounded-lg p-2 text-center">
                        <p className={`font-bold ${x.c}`}>{x.v}</p>
                        <p className="text-gray-600 text-[10px]">{x.l}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-2 flex justify-between text-xs">
                    <span className="text-violet-300">Payable Days</span>
                    <span className="text-violet-300 font-bold">{calc.payable.toFixed(1)} days × ₹{calc.perDay.toLocaleString('en-IN')}/day</span>
                  </div>
                </>
              )}

              {noAttendance && (
                <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 rounded-lg p-2">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  No attendance marked — full amount will be used.
                </div>
              )}

              <div className="border-t border-white/10 pt-2 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Monthly Amount</span>
                  <span className="text-white font-medium">₹{amt.toLocaleString('en-IN')}</span>
                </div>
                {calc && !noAttendance && calc.earned !== amt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Earned</span>
                    <span className="text-white">₹{calc.earned.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">TDS @ {form.tdsRate}%</span>
                  <span className="text-red-400">- ₹{displayTds.toLocaleString('en-IN')}</span>
                </div>
                <div className="border-t border-white/10 pt-1.5 flex justify-between font-bold">
                  <span className="text-white flex items-center gap-1"><Calculator className="w-3.5 h-3.5 text-violet-400" /> Net Payable</span>
                  <span className="text-green-400 text-lg">₹{displayNet.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="text-gray-400 text-xs font-medium mb-1.5 block">Remarks (optional)</label>
            <input value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
              placeholder="e.g. April 2025 salary" className="input w-full" />
          </div>

          <button onClick={() => create.mutate()} disabled={!form.mentorId || !form.amount || create.isPending}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-sm disabled:opacity-40 hover:opacity-90 flex items-center justify-center gap-2 transition-all">
            {create.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><Plus className="w-4 h-4" /> Create Salary Record</>}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MentorSalaryPage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterYear, setFilterYear] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-mentor-salaries', filterStatus, filterYear],
    queryFn: () => adminAPI.mentorSalaries({
      ...(filterStatus ? { status: filterStatus } : {}),
      ...(filterYear ? { year: filterYear } : {}),
    }).then(r => r.data),
  })

  const salaries: any[] = data?.salaries || []

  const approve = useMutation({
    mutationFn: (id: string) => adminAPI.approveMentorSalary(id),
    onSuccess: () => { toast.success('Salary approved!'); qc.invalidateQueries({ queryKey: ['admin-mentor-salaries'] }) },
    onError: () => toast.error('Failed to approve'),
  })
  const markPaid = useMutation({
    mutationFn: (id: string) => adminAPI.markMentorSalaryPaid(id),
    onSuccess: () => { toast.success('Marked as paid!'); qc.invalidateQueries({ queryKey: ['admin-mentor-salaries'] }) },
    onError: () => toast.error('Failed to update'),
  })
  const deleteSalary = useMutation({
    mutationFn: (id: string) => adminAPI.deleteMentorSalary(id),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['admin-mentor-salaries'] }) },
    onError: () => toast.error('Failed to delete'),
  })

  const totalPaid = salaries.filter(s => s.status === 'paid').reduce((sum: number, s: any) => sum + (s.netAmount || 0), 0)
  const pending  = salaries.filter(s => s.status === 'pending').length
  const approved = salaries.filter(s => s.status === 'approved').length

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* ── Page Header ── */}
        <div className="page-header">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg">
                  <IndianRupee className="w-5 h-5 text-white" />
                </div>
                Mentor Salary
              </h1>
              <p className="text-gray-400 text-sm mt-1">Attendance-based salary calculation, TDS deduction & payment</p>
            </div>
            <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Salary Record
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Pending',    value: pending,  color: 'text-amber-400',  border: 'border-amber-500/20',  Icon: Clock },
            { label: 'Approved',   value: approved, color: 'text-blue-400',   border: 'border-blue-500/20',   Icon: CheckCircle },
            { label: 'Total Paid', value: `₹${totalPaid >= 1000 ? `${(totalPaid/1000).toFixed(1)}k` : totalPaid}`, color: 'text-green-400', border: 'border-green-500/20', Icon: Banknote },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl p-4 bg-white/3 border ${s.border} flex items-center gap-3`}>
              <s.Icon className={`w-6 h-6 flex-shrink-0 ${s.color}`} />
              <div>
                <p className={`text-xl font-black text-white`}>{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 flex-wrap items-center">
          <Filter className="w-4 h-4 text-gray-400" />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input w-40">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
          </select>
          <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="input w-32">
            <option value="">All Years</option>
            {YEARS.map(y => <option key={y} value={String(y)}>{y}</option>)}
          </select>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />)}</div>
        ) : salaries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-2xl bg-white/3 border border-white/10 text-center">
            <IndianRupee className="w-10 h-10 text-gray-600 mb-3" />
            <p className="text-gray-300 font-semibold">No salary records</p>
            <p className="text-gray-500 text-sm mt-1">Create a salary record to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {salaries.map((s: any) => {
              const cfg = STATUS_CFG[s.status] || STATUS_CFG.pending
              const StatusIcon = cfg.icon
              const mentor = s.mentor as any
              const kycVerified = mentor?.kyc?.status === 'verified'
              return (
                <div key={s._id} className="card">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-violet-400 font-black text-sm">{mentor?.name?.[0]?.toUpperCase() || '?'}</span>
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">{mentor?.name || '—'}</p>
                        <p className="text-gray-400 text-xs">{mentor?.email}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {kycVerified
                            ? <span className="text-[10px] text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded font-semibold">KYC ✓</span>
                            : <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5"><AlertCircle className="w-2.5 h-2.5" /> KYC Pending</span>
                          }
                          <span className="text-[10px] text-gray-500">{MONTHS[s.month]} {s.year}</span>
                          <span className="text-[10px] text-gray-700">{s.slipNo}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-white font-black text-lg">₹{(s.netAmount || 0).toLocaleString('en-IN')}</p>
                      <p className="text-gray-500 text-xs">Gross: ₹{(s.amount || 0).toLocaleString('en-IN')} · TDS: ₹{(s.tds || 0).toLocaleString('en-IN')}</p>
                      {s.workingDays > 0 && (
                        <p className="text-violet-400 text-[10px] mt-0.5">
                          {s.payableDays?.toFixed(1)}/{s.workingDays}d · P:{s.presentDays} A:{s.absentDays} Hol:{s.holidayDays}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10 flex-wrap gap-2">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                      <StatusIcon className="w-3 h-3" /> {cfg.label}
                    </span>
                    <div className="flex items-center gap-2">
                      {s.status === 'pending' && (
                        <button onClick={() => approve.mutate(s._id)} disabled={approve.isPending}
                          className="flex items-center gap-1.5 text-xs font-bold text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50">
                          {approve.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />} Approve
                        </button>
                      )}
                      {s.status === 'approved' && (
                        <button onClick={() => markPaid.mutate(s._id)} disabled={markPaid.isPending}
                          className="flex items-center gap-1.5 text-xs font-bold text-green-300 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50">
                          {markPaid.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Banknote className="w-3 h-3" />} Mark Paid
                        </button>
                      )}
                      {s.status === 'pending' && (
                        <button onClick={() => { if (confirm('Delete?')) deleteSalary.mutate(s._id) }}
                          className="flex items-center gap-1.5 text-xs font-bold text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-3 py-1.5 rounded-lg transition-all">
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      )}
                      {s.status === 'paid' && s.paidAt && (
                        <span className="text-xs text-green-400">
                          Paid {new Date(s.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                  {s.remarks && <p className="mt-2 text-gray-500 text-xs italic">{s.remarks}</p>}
                </div>
              )
            })}
          </div>
        )}

        {showCreate && <CreateSalaryModal onClose={() => setShowCreate(false)} />}
      </div>
    </AdminLayout>
  )
}
