'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminAPI } from '@/lib/api'
import AdminLayout from '@/components/AdminLayout'
import {
  IndianRupee, Plus, X, CheckCircle, Clock, Banknote,
  Loader2, Trash2, Filter, ShieldCheck, AlertCircle,
  User, CreditCard, Building2, Printer, BadgeCheck,
  Calendar, Calculator,
} from 'lucide-react'
import toast from 'react-hot-toast'

const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  pending:  { label: 'Pending',  color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20',  icon: Clock       },
  approved: { label: 'Approved', color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   icon: CheckCircle },
  paid:     { label: 'Paid',     color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20',  icon: Banknote    },
}

const CUR_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 4 }, (_, i) => CUR_YEAR - i)

const COMPANY = {
  name: 'TruLearnix Private Limited',
  llp: 'ACR-4252',
  pan: 'AAYFT7302G',
  tan: 'DELT25894B',
  address: 'Zakir Nagar, New Delhi – 110025',
}

// ─── Salary Slip Print ─────────────────────────────────────────────────────────
function printSlip(s: any) {
  const emp = s.employee as any
  const html = `
    <html><head><title>Salary Slip ${s.slipNo}</title>
    <style>
      body { font-family: Arial, sans-serif; color: #111; padding: 40px; max-width: 700px; margin: auto; }
      h1 { font-size: 20px; margin: 0; } h2 { font-size: 15px; font-weight: normal; margin: 4px 0 0; color: #555; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #7c3aed; padding-bottom: 16px; margin-bottom: 16px; }
      .badge { background: #7c3aed; color: white; padding: 4px 10px; border-radius: 4px; font-size: 12px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
      th, td { padding: 8px 12px; text-align: left; border: 1px solid #ddd; font-size: 13px; }
      th { background: #f3f0ff; color: #4c1d95; font-weight: 600; }
      .total-row td { font-weight: bold; background: #f0fdf4; }
      .tds-row td { background: #fff7ed; }
      .footer { margin-top: 24px; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 12px; }
      @media print { body { padding: 20px; } }
    </style></head><body>
    <div class="header">
      <div>
        <h1>${COMPANY.name}</h1>
        <h2>${COMPANY.address}</h2>
        <p style="font-size:12px;color:#888;margin:6px 0 0">PAN: ${COMPANY.pan} | TAN: ${COMPANY.tan} | LLP: ${COMPANY.llp}</p>
      </div>
      <div style="text-align:right">
        <span class="badge">SALARY SLIP</span>
        <p style="font-size:12px;margin:6px 0 0;color:#555">Slip No: <strong>${s.slipNo}</strong></p>
        <p style="font-size:12px;color:#555">${MONTHS[s.month]} ${s.year}</p>
      </div>
    </div>
    <table>
      <tr><th colspan="2">Employee Details</th></tr>
      <tr><td>Name</td><td><strong>${emp?.name || '—'}</strong></td></tr>
      <tr><td>Employee ID</td><td>${emp?.employeeId || '—'}</td></tr>
      <tr><td>Department</td><td>${s.department || emp?.department || '—'}</td></tr>
      <tr><td>Designation</td><td>${s.designation || emp?.role || '—'}</td></tr>
      <tr><td>Pay Period</td><td>${MONTHS[s.month]} ${s.year}</td></tr>
      <tr><td>Email</td><td>${emp?.email || '—'}</td></tr>
    </table>
    ${s.workingDays > 0 ? `
    <table>
      <tr><th colspan="4">Attendance Summary — ${MONTHS[s.month]} ${s.year}</th></tr>
      <tr><td>Working Days</td><td>${s.workingDays}</td><td>Present</td><td style="color:#16a34a">${s.presentDays}</td></tr>
      <tr><td>Absent</td><td style="color:#dc2626">${s.absentDays}</td><td>Half Days</td><td style="color:#d97706">${s.halfDays}</td></tr>
      <tr><td>Paid Leave</td><td style="color:#2563eb">${s.leaveDays}</td><td>Holidays</td><td style="color:#7c3aed">${s.holidayDays}</td></tr>
      <tr style="background:#f5f3ff"><td><strong>Payable Days</strong></td><td colspan="3"><strong>${s.payableDays?.toFixed(1)}</strong> days @ ₹${s.perDayAmount?.toLocaleString('en-IN')}/day</td></tr>
    </table>` : ''}
    <table>
      <tr><th>Earnings</th><th>Amount (₹)</th><th>Deductions</th><th>Amount (₹)</th></tr>
      <tr>
        <td>CTC / Gross Salary</td><td>₹${s.grossAmount?.toLocaleString('en-IN')}</td>
        <td>Absent Deduction</td><td class="tds-row">₹${s.workingDays > 0 ? (s.grossAmount - s.earnedAmount)?.toLocaleString('en-IN') : '0'}</td>
      </tr>
      <tr>
        <td>Earned (Attendance)</td><td>₹${(s.earnedAmount || s.grossAmount)?.toLocaleString('en-IN')}</td>
        <td>TDS @ ${s.tdsRate || 0}%</td><td class="tds-row">₹${s.tds?.toLocaleString('en-IN')}</td>
      </tr>
      <tr class="total-row">
        <td>Gross Earned</td><td>₹${(s.earnedAmount || s.grossAmount)?.toLocaleString('en-IN')}</td>
        <td>Total Deductions</td><td>₹${((s.grossAmount - (s.earnedAmount||s.grossAmount)) + s.tds)?.toLocaleString('en-IN')}</td>
      </tr>
    </table>
    <table>
      <tr><th colspan="2" style="background:#dcfce7;color:#166534">Net Payable Amount</th></tr>
      <tr><td style="font-size:18px;font-weight:bold;color:#166534" colspan="2">₹${s.netAmount?.toLocaleString('en-IN')}</td></tr>
    </table>
    <table>
      <tr><th colspan="2">Bank Payment Details</th></tr>
      <tr><td>Account Holder</td><td>${s.bankHolderName || '—'}</td></tr>
      <tr><td>Bank Name</td><td>${s.bankName || '—'}</td></tr>
      <tr><td>Account Number</td><td>${s.bankAccount || '—'}</td></tr>
      <tr><td>IFSC Code</td><td>${s.bankIfsc || '—'}</td></tr>
      <tr><td>Payment Status</td><td><strong style="color:${s.status === 'paid' ? 'green' : 'orange'}">${s.status?.toUpperCase()}</strong>${s.paidAt ? ' on ' + new Date(s.paidAt).toLocaleDateString('en-IN') : ''}</td></tr>
      ${s.razorpayPayoutId ? `<tr><td>Razorpay Payout ID</td><td>${s.razorpayPayoutId}</td></tr>` : ''}
    </table>
    <div class="footer">
      <p>This is a computer-generated salary slip. No signature required.</p>
      <p>Generated on ${new Date().toLocaleString('en-IN')} | TruLearnix Platform</p>
      ${s.remarks ? `<p>Remarks: ${s.remarks}</p>` : ''}
    </div>
    </body></html>
  `
  const w = window.open('', '_blank')
  if (w) { w.document.write(html); w.document.close(); w.print() }
}

// ─── Create Salary Modal ────────────────────────────────────────────────────────
function CreateSalaryModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    employeeId: '', month: String(new Date().getMonth() + 1),
    year: String(CUR_YEAR), grossAmount: '', tdsRate: '10', remarks: '',
  })

  const { data: empData } = useQuery({
    queryKey: ['employees-for-salary'],
    queryFn: () => adminAPI.employeesForSalary().then(r => r.data),
  })
  const employees: any[] = empData?.employees || []

  const gross = Number(form.grossAmount) || 0
  const selectedEmp = employees.find(e => e._id === form.employeeId)
  const kycVerified = selectedEmp?.kyc?.status === 'verified'

  // Attendance-based calculation
  const { data: calcData, isFetching: calcLoading } = useQuery({
    queryKey: ['salary-calc', form.employeeId, form.month, form.year, form.grossAmount, form.tdsRate],
    queryFn: () => adminAPI.calculateSalary({
      userId: form.employeeId, userType: 'employee',
      month: form.month, year: form.year,
      gross: form.grossAmount, tdsRate: form.tdsRate,
    }).then(r => r.data),
    enabled: !!(form.employeeId && form.grossAmount && Number(form.grossAmount) > 0),
  })

  const calc = calcData
  const displayNet = calc ? calc.net : (gross - Math.round(gross * Number(form.tdsRate) / 100))
  const displayTds = calc ? calc.tds : Math.round(gross * Number(form.tdsRate) / 100)
  const noAttendance = calc && calc.present === 0 && calc.absent === 0 && calc.halfDay === 0 && calc.paidLeave === 0

  const create = useMutation({
    mutationFn: () => adminAPI.createEmployeeSalary({
      employeeId: form.employeeId, month: Number(form.month), year: Number(form.year),
      grossAmount: gross, tdsRate: Number(form.tdsRate), remarks: form.remarks,
      // attendance fields
      ...(calc && !noAttendance ? {
        workingDays: calc.workingDays, presentDays: calc.present, absentDays: calc.absent,
        halfDays: calc.halfDay, leaveDays: calc.paidLeave, unpaidLeaveDays: calc.unpaid,
        holidayDays: calc.holidayDays, payableDays: calc.payable,
        perDayAmount: calc.perDay, earnedAmount: calc.earned,
      } : {}),
    }),
    onSuccess: () => {
      toast.success('Salary record created!')
      qc.invalidateQueries({ queryKey: ['admin-employee-salaries'] })
      onClose()
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to create'),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-white font-bold flex items-center gap-2">
            <Plus className="w-4 h-4 text-violet-400" /> Create Salary Record
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-gray-400 text-xs font-medium mb-1.5 block">Employee *</label>
            <select value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))} className="input w-full">
              <option value="">Select employee...</option>
              {employees.map((e: any) => (
                <option key={e._id} value={e._id}>
                  {e.name} ({e.employeeId || e.role}) {e.kyc?.status === 'verified' ? '✓' : '⚠ KYC Pending'}
                </option>
              ))}
            </select>
            {form.employeeId && !kycVerified && (
              <p className="text-amber-400 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> KYC not verified — add bank details in KYC tab before paying
              </p>
            )}
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
              <label className="text-gray-400 text-xs font-medium mb-1.5 block">Monthly CTC (₹) *</label>
              <input type="number" value={form.grossAmount} onChange={e => setForm(f => ({ ...f, grossAmount: e.target.value }))}
                placeholder="e.g. 35000" className="input w-full" />
            </div>
            <div>
              <label className="text-gray-400 text-xs font-medium mb-1.5 block">TDS Rate (%)</label>
              <input type="number" value={form.tdsRate} onChange={e => setForm(f => ({ ...f, tdsRate: e.target.value }))}
                min={0} max={30} className="input w-full" />
            </div>
          </div>

          {gross > 0 && (
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
                      { l: 'Holidays', v: calc.holidayDays, c: 'text-purple-400' },
                      { l: 'Present', v: calc.present, c: 'text-green-400' },
                      { l: 'Absent', v: calc.absent, c: 'text-red-400' },
                      { l: 'Half Day', v: calc.halfDay, c: 'text-amber-400' },
                      { l: 'Paid Leave', v: calc.paidLeave, c: 'text-blue-400' },
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
                  No attendance marked — full gross will be used. Mark attendance first for accurate salary.
                </div>
              )}

              <div className="border-t border-white/10 pt-2 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Monthly CTC</span>
                  <span className="text-white font-medium">₹{gross.toLocaleString('en-IN')}</span>
                </div>
                {calc && !noAttendance && calc.earned !== gross && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Earned (attendance)</span>
                    <span className="text-white font-medium">₹{calc.earned.toLocaleString('en-IN')}</span>
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

          <button onClick={() => create.mutate()} disabled={!form.employeeId || !form.grossAmount || create.isPending}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-sm disabled:opacity-40 hover:opacity-90 flex items-center justify-center gap-2 transition-all">
            {create.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><Plus className="w-4 h-4" /> Create Salary Record</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── KYC Edit Modal ─────────────────────────────────────────────────────────────
function KycModal({ emp, onClose }: { emp: any; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    pan: emp.kyc?.pan || '',
    panName: emp.kyc?.panName || '',
    aadhar: emp.kyc?.aadhar || '',
    aadharName: emp.kyc?.aadharName || '',
    bankAccount: emp.kyc?.bankAccount || '',
    bankIfsc: emp.kyc?.bankIfsc || '',
    bankName: emp.kyc?.bankName || '',
    bankHolderName: emp.kyc?.bankHolderName || '',
  })
  const [saving, setSaving] = useState(false)

  const save = async (verify = false) => {
    setSaving(true)
    try {
      await adminAPI.updateEmployeeKyc(emp._id, { ...form, status: verify ? 'verified' : 'submitted' })
      toast.success(verify ? 'KYC verified!' : 'KYC details saved')
      qc.invalidateQueries({ queryKey: ['employees-for-salary'] })
      qc.invalidateQueries({ queryKey: ['admin-employee-salaries'] })
      onClose()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-white font-bold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-green-400" /> KYC — {emp.name}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-5">
          {/* PAN */}
          <div>
            <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" /> PAN Card
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">PAN Number</label>
                <input value={form.pan} onChange={e => setForm(p => ({ ...p, pan: e.target.value.toUpperCase() }))}
                  placeholder="ABCDE1234F" maxLength={10} className="input w-full uppercase" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Name on PAN</label>
                <input value={form.panName} onChange={e => setForm(p => ({ ...p, panName: e.target.value }))}
                  placeholder="As on PAN card" className="input w-full" />
              </div>
            </div>
          </div>

          {/* Aadhaar */}
          <div>
            <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Aadhaar Card
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Aadhaar Number</label>
                <input value={form.aadhar} onChange={e => setForm(p => ({ ...p, aadhar: e.target.value }))}
                  placeholder="1234 5678 9012" maxLength={14} className="input w-full" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Name on Aadhaar</label>
                <input value={form.aadharName} onChange={e => setForm(p => ({ ...p, aadharName: e.target.value }))}
                  placeholder="As on Aadhaar" className="input w-full" />
              </div>
            </div>
          </div>

          {/* Bank */}
          <div>
            <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> Bank Account
            </p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Account Number *</label>
                  <input value={form.bankAccount} onChange={e => setForm(p => ({ ...p, bankAccount: e.target.value }))}
                    placeholder="Account number" className="input w-full" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">IFSC Code *</label>
                  <input value={form.bankIfsc} onChange={e => setForm(p => ({ ...p, bankIfsc: e.target.value.toUpperCase() }))}
                    placeholder="SBIN0001234" className="input w-full uppercase" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Bank Name</label>
                  <input value={form.bankName} onChange={e => setForm(p => ({ ...p, bankName: e.target.value }))}
                    placeholder="State Bank of India" className="input w-full" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Account Holder Name *</label>
                  <input value={form.bankHolderName} onChange={e => setForm(p => ({ ...p, bankHolderName: e.target.value }))}
                    placeholder="As in bank records" className="input w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-white/10 flex gap-3">
          <button onClick={() => save(false)} disabled={saving}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-white text-sm font-medium hover:bg-white/5 disabled:opacity-50 transition-colors">
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button onClick={() => save(true)} disabled={saving || !form.bankAccount || !form.bankIfsc || !form.bankHolderName}
            className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2 transition-colors">
            <BadgeCheck className="w-4 h-4" /> Verify KYC
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function EmployeeSalaryPage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [tab, setTab] = useState<'salaries' | 'kyc'>('salaries')
  const [kycEmp, setKycEmp] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-employee-salaries', filterStatus, filterYear],
    queryFn: () => adminAPI.employeeSalaries({
      ...(filterStatus ? { status: filterStatus } : {}),
      ...(filterYear ? { year: filterYear } : {}),
    }).then(r => r.data),
  })

  const { data: empData } = useQuery({
    queryKey: ['employees-for-salary'],
    queryFn: () => adminAPI.employeesForSalary().then(r => r.data),
  })

  const salaries: any[] = data?.salaries || []
  const employees: any[] = empData?.employees || []

  const approve = useMutation({
    mutationFn: (id: string) => adminAPI.approveEmployeeSalary(id),
    onSuccess: () => { toast.success('Salary approved!'); qc.invalidateQueries({ queryKey: ['admin-employee-salaries'] }) },
    onError: () => toast.error('Failed to approve'),
  })

  const markPaid = useMutation({
    mutationFn: (id: string) => adminAPI.markEmployeeSalaryPaid(id),
    onSuccess: (res) => {
      const s = res.data?.salary
      toast.success(s?.razorpayPayoutId ? `Paid via Razorpay: ${s.razorpayPayoutId}` : 'Marked as paid!')
      qc.invalidateQueries({ queryKey: ['admin-employee-salaries'] })
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to process payment'),
  })

  const deleteSalary = useMutation({
    mutationFn: (id: string) => adminAPI.deleteEmployeeSalary(id),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['admin-employee-salaries'] }) },
    onError: () => toast.error('Failed to delete'),
  })

  const totalPaid = salaries.filter(s => s.status === 'paid').reduce((sum: number, s: any) => sum + (s.netAmount || 0), 0)
  const totalTds = salaries.filter(s => s.status === 'paid').reduce((sum: number, s: any) => sum + (s.tds || 0), 0)
  const pending = salaries.filter(s => s.status === 'pending').length
  const approved = salaries.filter(s => s.status === 'approved').length

  const kycPending = employees.filter(e => e.kyc?.status !== 'verified').length

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        {/* ── Page Header ── */}
        <div className="page-header">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-700 flex items-center justify-center shadow-lg">
                  <IndianRupee className="w-5 h-5 text-white" />
                </div>
                Employee Salary
              </h1>
              <p className="text-gray-400 text-sm mt-1">KYC, TDS deduction, Razorpay payroll & salary slips</p>
            </div>
            <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Salary Record
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="card text-center border border-amber-500/20">
            <p className="text-2xl font-black text-amber-400">{pending}</p>
            <p className="text-xs text-gray-400 mt-1">Pending</p>
          </div>
          <div className="card text-center border border-blue-500/20">
            <p className="text-2xl font-black text-blue-400">{approved}</p>
            <p className="text-xs text-gray-400 mt-1">Approved</p>
          </div>
          <div className="card text-center border border-green-500/20">
            <p className="text-lg font-black text-green-400">
              ₹{totalPaid >= 100000 ? `${(totalPaid / 100000).toFixed(1)}L` : totalPaid >= 1000 ? `${(totalPaid / 1000).toFixed(1)}k` : totalPaid}
            </p>
            <p className="text-xs text-gray-400 mt-1">Total Paid</p>
          </div>
          <div className="card text-center border border-red-500/20">
            <p className="text-lg font-black text-red-400">
              ₹{totalTds >= 1000 ? `${(totalTds / 1000).toFixed(1)}k` : totalTds}
            </p>
            <p className="text-xs text-gray-400 mt-1">TDS Deducted</p>
          </div>
          <div className={`card text-center border ${kycPending > 0 ? 'border-orange-500/30' : 'border-green-500/20'} cursor-pointer`} onClick={() => setTab('kyc')}>
            <p className={`text-2xl font-black ${kycPending > 0 ? 'text-orange-400' : 'text-green-400'}`}>{kycPending}</p>
            <p className="text-xs text-gray-400 mt-1">KYC Pending</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-800/60 rounded-xl p-1 w-fit">
          <button onClick={() => setTab('salaries')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'salaries' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            <IndianRupee className="w-4 h-4" /> Salary Records
          </button>
          <button onClick={() => setTab('kyc')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'kyc' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            <ShieldCheck className="w-4 h-4" /> KYC Management
            {kycPending > 0 && <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-bold">{kycPending}</span>}
          </button>
        </div>

        {/* ── Salary Records Tab ── */}
        {tab === 'salaries' && (
          <>
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
              <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-slate-800 animate-pulse" />)}</div>
            ) : salaries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 rounded-2xl bg-slate-800 border border-white/10 text-center">
                <IndianRupee className="w-10 h-10 text-gray-600 mb-3" />
                <p className="text-gray-300 font-semibold">No salary records</p>
                <p className="text-gray-500 text-sm mt-1">Create a salary record to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {salaries.map((s: any) => {
                  const cfg = STATUS_CFG[s.status] || STATUS_CFG.pending
                  const StatusIcon = cfg.icon
                  const emp = s.employee as any
                  const kycOk = emp?.kyc?.status === 'verified'
                  return (
                    <div key={s._id} className="card">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-violet-400 font-black text-sm">{emp?.name?.[0]?.toUpperCase() || '?'}</span>
                          </div>
                          <div>
                            <p className="text-white font-bold text-sm">{emp?.name || '—'}</p>
                            <p className="text-gray-400 text-xs">{emp?.email} · {emp?.department || emp?.role}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {kycOk
                                ? <span className="text-[10px] text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5"><BadgeCheck className="w-2.5 h-2.5" /> KYC Verified</span>
                                : <span className="text-[10px] text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5"><AlertCircle className="w-2.5 h-2.5" /> KYC Pending</span>
                              }
                              <span className="text-[10px] text-gray-500">{MONTHS[s.month]} {s.year}</span>
                              <span className="text-[10px] text-gray-600">{s.slipNo}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <p className="text-white font-black text-xl">₹{(s.netAmount || 0).toLocaleString('en-IN')}</p>
                          <p className="text-gray-500 text-xs">CTC: ₹{(s.grossAmount || 0).toLocaleString('en-IN')} · TDS: ₹{(s.tds || 0).toLocaleString('en-IN')}</p>
                          {s.workingDays > 0 && (
                            <p className="text-violet-400 text-[10px] mt-0.5">
                              {s.payableDays?.toFixed(1)}/{s.workingDays}d · P:{s.presentDays} A:{s.absentDays} H:{s.halfDays} Hol:{s.holidayDays}
                            </p>
                          )}
                          {s.razorpayPayoutId && (
                            <p className="text-green-400 text-[10px] mt-0.5">Razorpay: {s.razorpayPayoutId}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10 flex-wrap gap-2">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                          <StatusIcon className="w-3 h-3" /> {cfg.label}
                        </span>

                        <div className="flex items-center gap-2 flex-wrap">
                          <button onClick={() => printSlip(s)}
                            className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg transition-all">
                            <Printer className="w-3 h-3" /> Salary Slip
                          </button>
                          {s.status === 'pending' && (
                            <button onClick={() => approve.mutate(s._id)} disabled={approve.isPending}
                              className="flex items-center gap-1.5 text-xs font-bold text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50">
                              {approve.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                              Approve
                            </button>
                          )}
                          {s.status === 'approved' && (
                            <button onClick={() => markPaid.mutate(s._id)} disabled={markPaid.isPending}
                              className="flex items-center gap-1.5 text-xs font-bold text-green-300 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50">
                              {markPaid.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Banknote className="w-3 h-3" />}
                              {kycOk && s.bankAccount ? 'Pay via Razorpay' : 'Mark Paid'}
                            </button>
                          )}
                          {s.status === 'pending' && (
                            <button onClick={() => { if (confirm('Delete this salary record?')) deleteSalary.mutate(s._id) }}
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
          </>
        )}

        {/* ── KYC Management Tab ── */}
        {tab === 'kyc' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-400">Fill bank details + PAN + Aadhaar for each employee. Salary can only be paid after KYC is verified.</p>
            {employees.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No employees found</div>
            ) : (
              employees.map((emp: any) => {
                const kyc = emp.kyc || {}
                const kycVerified = kyc.status === 'verified'
                const kycSubmitted = kyc.status === 'submitted'
                const hasBankDetails = kyc.bankAccount && kyc.bankIfsc && kyc.bankHolderName
                return (
                  <div key={emp._id} className="card">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center flex-shrink-0">
                          <span className="text-gray-300 font-black text-sm">{emp.name?.[0]?.toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-white font-semibold text-sm">{emp.name}</p>
                          <p className="text-gray-400 text-xs">{emp.email} · {emp.employeeId || emp.role}</p>
                          <p className="text-gray-500 text-xs capitalize">{emp.department || emp.role}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right text-xs space-y-1">
                          <div className="flex items-center gap-1.5">
                            {kyc.pan
                              ? <span className="text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> PAN: {kyc.pan}</span>
                              : <span className="text-orange-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> PAN Missing</span>
                            }
                          </div>
                          <div className="flex items-center gap-1.5">
                            {kyc.aadhar
                              ? <span className="text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Aadhaar: {kyc.aadhar?.slice(-4).padStart(kyc.aadhar.length, '*')}</span>
                              : <span className="text-orange-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Aadhaar Missing</span>
                            }
                          </div>
                          <div className="flex items-center gap-1.5">
                            {hasBankDetails
                              ? <span className="text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Bank: {kyc.bankAccount?.slice(-4).padStart(kyc.bankAccount.length, '*')}</span>
                              : <span className="text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Bank Missing</span>
                            }
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                            kycVerified ? 'text-green-400 bg-green-500/10 border-green-500/20' :
                            kycSubmitted ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' :
                            'text-orange-400 bg-orange-500/10 border-orange-500/20'
                          }`}>
                            {kycVerified ? '✓ KYC Verified' : kycSubmitted ? '⏳ Submitted' : '⚠ Pending'}
                          </span>
                          <button onClick={() => setKycEmp(emp)}
                            className="text-xs font-bold text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 px-3 py-1.5 rounded-lg transition-all">
                            {kycVerified ? 'Edit KYC' : 'Add KYC'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {showCreate && <CreateSalaryModal onClose={() => setShowCreate(false)} />}
      {kycEmp && <KycModal emp={kycEmp} onClose={() => setKycEmp(null)} />}
    </AdminLayout>
  )
}
