'use client'
import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminAPI } from '@/lib/api'
import { usePackages, tierStyle, tierName } from '@/lib/usePackages'
import {
  FileText, Download, FileSpreadsheet, Filter, Calendar,
  TrendingUp, Users, IndianRupee, Percent, Award, Building2,
  BookOpen, Video, ChevronRight, Loader2, AlertCircle, CheckCircle2, XCircle, BarChart2,
  Search, X,
} from 'lucide-react'
import { format } from 'date-fns'

// ── helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
const pct = (a: number, b: number) => b ? ((a / b) * 100).toFixed(1) + '%' : '0%'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// Quick date presets
function getPreset(preset: string): { from: string; to: string } {
  const now = new Date()
  const pad = (d: Date) => d.toISOString().split('T')[0]
  if (preset === 'today') return { from: pad(now), to: pad(now) }
  if (preset === 'week') {
    const start = new Date(now); start.setDate(now.getDate() - 7)
    return { from: pad(start), to: pad(now) }
  }
  if (preset === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    return { from: pad(start), to: pad(now) }
  }
  if (preset === 'last_month') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const end = new Date(now.getFullYear(), now.getMonth(), 0)
    return { from: pad(start), to: pad(end) }
  }
  if (preset === 'quarter') {
    const start = new Date(now); start.setDate(now.getDate() - 90)
    return { from: pad(start), to: pad(now) }
  }
  return { from: '', to: '' }
}

// Download CSV
function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (v: any) => {
    const s = String(v ?? '')
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [headers, ...rows].map(r => r.map(escape).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// Download PDF using jspdf + autotable
async function downloadPDF(title: string, subtitle: string, headers: string[], rows: (string | number)[][], summary?: { label: string; value: string }[]) {
  const { default: jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default
  const doc = new jsPDF({ orientation: 'landscape' })

  doc.setFillColor(99, 102, 241)
  doc.rect(0, 0, 297, 22, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('TruLearnix — ' + title, 14, 10)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(subtitle + '   |   Generated: ' + format(new Date(), 'dd MMM yyyy, hh:mm a'), 14, 17)

  let startY = 28
  if (summary?.length) {
    summary.forEach((s, i) => {
      const x = 14 + i * 68
      doc.setFillColor(243, 244, 246)
      doc.roundedRect(x, startY, 62, 14, 2, 2, 'F')
      doc.setTextColor(107, 114, 128)
      doc.setFontSize(7)
      doc.text(s.label, x + 4, startY + 5)
      doc.setTextColor(17, 24, 39)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text(s.value, x + 4, startY + 11)
      doc.setFont('helvetica', 'normal')
    })
    startY = 48
  }

  autoTable(doc, {
    startY,
    head: [headers],
    body: rows.map(r => r.map(String)),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    margin: { left: 14, right: 14 },
  })

  doc.save(`${title.replace(/\s+/g, '-').toLowerCase()}-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
}

// ── Report definitions ────────────────────────────────────────────────────────

const REPORTS = [
  { id: 'gst',         icon: Percent,      label: 'GST Report',         desc: 'Monthly GST collected, input credit & net payable', color: 'text-emerald-400', bg: 'bg-emerald-500/10', hasDateRange: false, hasYear: true },
  { id: 'tds',         icon: FileText,      label: 'TDS Report',         desc: 'TDS deducted (2%) on partner commissions', color: 'text-amber-400',   bg: 'bg-amber-500/10',  hasDateRange: false, hasYear: true },
  { id: 'commission',  icon: IndianRupee,   label: 'Commission Report',  desc: 'Partner commissions by earner & status', color: 'text-violet-400',  bg: 'bg-violet-500/10', hasDateRange: true,  hasYear: false },
  { id: 'sales',       icon: TrendingUp,    label: 'Sales Report',       desc: 'Package sales, gross/net revenue, GST', color: 'text-blue-400',    bg: 'bg-blue-500/10',   hasDateRange: true,  hasYear: false },
  { id: 'pnl',         icon: Award,         label: 'P&L Report',         desc: 'Monthly profit & loss with all expense heads', color: 'text-cyan-400',    bg: 'bg-cyan-500/10',   hasDateRange: false, hasYear: true },
  { id: 'performance', icon: BookOpen,      label: 'Performance Report', desc: 'Mentor commissions, course enrollments, class attendance', color: 'text-pink-400',    bg: 'bg-pink-500/10',   hasDateRange: true,  hasYear: false },
  { id: 'team',        icon: Building2,     label: 'Team Report',        desc: 'Employee roster by department & permissions', color: 'text-orange-400',  bg: 'bg-orange-500/10', hasDateRange: false, hasYear: false },
  { id: 'learners',    icon: Users,         label: 'Learner Report',     desc: 'All learners with package tier & activity', color: 'text-teal-400',    bg: 'bg-teal-500/10',   hasDateRange: true,  hasYear: false },
]

// ── Sub-components ────────────────────────────────────────────────────────────

function StatBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-xl font-bold text-white mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  )
}

// Quick date preset buttons
function PresetButtons({ onSelect }: { onSelect: (from: string, to: string) => void }) {
  const presets = [
    { label: 'Today', key: 'today' },
    { label: 'Last 7d', key: 'week' },
    { label: 'This Month', key: 'month' },
    { label: 'Last Month', key: 'last_month' },
    { label: 'Last 90d', key: 'quarter' },
  ]
  return (
    <div className="flex flex-wrap gap-1.5">
      {presets.map(p => (
        <button key={p.key} onClick={() => { const r = getPreset(p.key); onSelect(r.from, r.to) }}
          className="px-2.5 py-1 text-xs rounded-md bg-white/5 hover:bg-violet-500/20 text-gray-400 hover:text-violet-300 border border-white/10 hover:border-violet-500/30 transition-colors">
          {p.label}
        </button>
      ))}
    </div>
  )
}

// Filter chip (pill toggle)
function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1 text-xs rounded-full border transition-colors font-medium ${active ? 'bg-violet-500/30 border-violet-500/50 text-violet-300' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}>
      {label}
    </button>
  )
}

// ── Individual Report Panels ──────────────────────────────────────────────────

function GSTReport({ year, month }: { year: number; month: number }) {
  const { data, isLoading } = useQuery({ queryKey: ['rpt-gst', year], queryFn: () => adminAPI.financeGst(year).then(r => r.data) })
  if (isLoading) return <Loader />
  if (!data) return null
  const { gstReport, totals } = data

  const filtered = month > 0 ? gstReport.filter((_: any, i: number) => i === month - 1) : gstReport

  const headers = ['Month', 'Net Sales (₹)', 'GST Collected (₹)', 'Input Credit (₹)', 'Net GST Payable (₹)', 'Invoices']
  const rows = filtered.map((r: any) => [r.month, r.netSales.toFixed(0), r.gstCollected.toFixed(0), r.inputCredit.toFixed(0), r.netGstPayable.toFixed(0), r.count])
  const summary = [
    { label: 'Total GST Collected', value: fmt(totals.gstCollected) },
    { label: 'Input Credit', value: fmt(totals.inputCredit) },
    { label: 'Net GST Payable', value: fmt(totals.netGstPayable) },
    { label: 'Net Sales', value: fmt(totals.netSales) },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {summary.map(s => <StatBox key={s.label} label={s.label} value={s.value} />)}
      </div>
      <DownloadBar
        onPDF={() => downloadPDF(`GST Report ${year}`, `Financial Year ${year}`, headers, rows, summary)}
        onCSV={() => downloadCSV(`gst-report-${year}.csv`, headers, rows)}
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-white/10 text-gray-400 text-xs uppercase">
            {headers.map(h => <th key={h} className="py-2 px-3 text-left font-medium">{h}</th>)}
          </tr></thead>
          <tbody>
            {filtered.map((r: any) => (
              <tr key={r.month} className="border-b border-white/5 hover:bg-white/5">
                <td className="py-2 px-3 font-medium text-white">{r.month}</td>
                <td className="py-2 px-3 text-gray-300">{fmt(r.netSales)}</td>
                <td className="py-2 px-3 text-emerald-400">{fmt(r.gstCollected)}</td>
                <td className="py-2 px-3 text-blue-400">{fmt(r.inputCredit)}</td>
                <td className="py-2 px-3 text-amber-400 font-semibold">{fmt(r.netGstPayable)}</td>
                <td className="py-2 px-3 text-gray-400">{r.count}</td>
              </tr>
            ))}
            {month === 0 && (
              <tr className="bg-white/5 font-semibold">
                <td className="py-2 px-3 text-white">TOTAL</td>
                <td className="py-2 px-3 text-gray-200">{fmt(totals.netSales)}</td>
                <td className="py-2 px-3 text-emerald-300">{fmt(totals.gstCollected)}</td>
                <td className="py-2 px-3 text-blue-300">{fmt(totals.inputCredit)}</td>
                <td className="py-2 px-3 text-amber-300">{fmt(totals.netGstPayable)}</td>
                <td className="py-2 px-3 text-gray-400">—</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TDSReport({ year, month, search }: { year: number; month: number; search: string }) {
  const { data, isLoading } = useQuery({ queryKey: ['rpt-tds', year], queryFn: () => adminAPI.financeTds(year).then(r => r.data) })
  if (isLoading) return <Loader />
  if (!data) return null
  const { tdsData, summary } = data

  const filtered = tdsData.filter((r: any) => {
    const matchSearch = !search || r.user?.name?.toLowerCase().includes(search.toLowerCase()) || r.user?.email?.toLowerCase().includes(search.toLowerCase())
    return matchSearch
  })

  const headers = ['Name', 'Email', 'Phone', 'Package', 'Total Commission (₹)', 'TDS @ 2% (₹)', 'Net Payable (₹)', 'Transactions']
  const rows = filtered.map((r: any) => [r.user?.name, r.user?.email, r.user?.phone || '—', r.user?.packageTier, r.totalCommission.toFixed(0), r.tdsAmount.toFixed(0), r.netPayable.toFixed(0), r.count])
  const summaryBoxes = [
    { label: 'Total Commission', value: fmt(summary.totalCommission) },
    { label: 'Total TDS (2%)', value: fmt(summary.totalTds) },
    { label: 'Net Payable', value: fmt(summary.netPayable) },
    { label: 'Partners', value: String(filtered.length) },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {summaryBoxes.map(s => <StatBox key={s.label} label={s.label} value={s.value} />)}
      </div>
      <DownloadBar
        onPDF={() => downloadPDF(`TDS Report ${year}`, `FY ${year} — TDS on Partner Commissions`, headers, rows, summaryBoxes)}
        onCSV={() => downloadCSV(`tds-report-${year}.csv`, headers, rows)}
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-white/10 text-gray-400 text-xs uppercase">
            {headers.map(h => <th key={h} className="py-2 px-3 text-left font-medium">{h}</th>)}
          </tr></thead>
          <tbody>
            {filtered.map((r: any, i: number) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                <td className="py-2 px-3 font-medium text-white">{r.user?.name}</td>
                <td className="py-2 px-3 text-gray-400">{r.user?.email}</td>
                <td className="py-2 px-3 text-gray-400">{r.user?.phone || '—'}</td>
                <td className="py-2 px-3"><TierBadge tier={r.user?.packageTier} /></td>
                <td className="py-2 px-3 text-white font-semibold">{fmt(r.totalCommission)}</td>
                <td className="py-2 px-3 text-red-400">{fmt(r.tdsAmount)}</td>
                <td className="py-2 px-3 text-emerald-400 font-semibold">{fmt(r.netPayable)}</td>
                <td className="py-2 px-3 text-gray-400">{r.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <Empty text="No TDS data found" />}
      </div>
    </div>
  )
}

function CommissionReport({ from, to, status, search }: { from: string; to: string; status: string; search: string }) {
  const { data, isLoading } = useQuery({ queryKey: ['rpt-comm', from, to, status, search], queryFn: () => adminAPI.reportCommission({ from, to, status: status || undefined, search: search || undefined }).then(r => r.data) })
  if (isLoading) return <Loader />
  if (!data) return null
  const { rows, summary } = data

  const headers = ['Date', 'Name', 'Email', 'Package', 'Commission (₹)', 'TDS (₹)', 'Net (₹)', 'Status']
  const csvRows = rows.map((r: any) => [format(new Date(r.createdAt), 'dd/MM/yyyy'), r.earnerName, r.earnerEmail, r.packageTier, r.commissionAmount.toFixed(0), r.tds.toFixed(0), r.net.toFixed(0), r.status])
  const summaryBoxes = [
    { label: 'Total Commission', value: fmt(summary.totalCommission) },
    { label: 'TDS Deducted', value: fmt(summary.totalTds) },
    { label: 'Net Payable', value: fmt(summary.totalNet) },
    { label: 'Transactions', value: String(summary.count) },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {summaryBoxes.map(s => <StatBox key={s.label} label={s.label} value={s.value} />)}
      </div>
      <DownloadBar
        onPDF={() => downloadPDF('Commission Report', from && to ? `${from} to ${to}` : 'All time', headers, csvRows, summaryBoxes)}
        onCSV={() => downloadCSV('commission-report.csv', headers, csvRows)}
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-white/10 text-gray-400 text-xs uppercase">
            {headers.map(h => <th key={h} className="py-2 px-3 text-left font-medium">{h}</th>)}
          </tr></thead>
          <tbody>
            {rows.map((r: any, i: number) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                <td className="py-2 px-3 text-gray-400">{format(new Date(r.createdAt), 'dd MMM yyyy')}</td>
                <td className="py-2 px-3 font-medium text-white">{r.earnerName}</td>
                <td className="py-2 px-3 text-gray-400 text-xs">{r.earnerEmail}</td>
                <td className="py-2 px-3"><TierBadge tier={r.packageTier} /></td>
                <td className="py-2 px-3 text-violet-300 font-semibold">{fmt(r.commissionAmount)}</td>
                <td className="py-2 px-3 text-red-400">{fmt(r.tds)}</td>
                <td className="py-2 px-3 text-emerald-400">{fmt(r.net)}</td>
                <td className="py-2 px-3"><StatusBadge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <Empty text="No commissions in this period" />}
      </div>
    </div>
  )
}

function SalesReport({ from, to, tier }: { from: string; to: string; tier: string }) {
  const { data, isLoading } = useQuery({ queryKey: ['rpt-sales', from, to, tier], queryFn: () => adminAPI.reportSales({ from, to, tier: tier || undefined }).then(r => r.data) })
  if (isLoading) return <Loader />
  if (!data) return null
  const { rows, byTier, summary } = data

  const headers = ['Date', 'Name', 'Email', 'Phone', 'Package', 'Gross (₹)', 'Net (₹)', 'GST (₹)']
  const csvRows = rows.map((r: any) => [format(new Date(r.createdAt), 'dd/MM/yyyy'), r.user?.name, r.user?.email, r.user?.phone || '—', r.packageTier, r.totalAmount, r.amount, r.gstAmount])
  const summaryBoxes = [
    { label: 'Gross Revenue', value: fmt(summary.gross) },
    { label: 'Net Revenue', value: fmt(summary.net) },
    { label: 'GST Collected', value: fmt(summary.gst) },
    { label: 'Sales Count', value: String(summary.count) },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {summaryBoxes.map(s => <StatBox key={s.label} label={s.label} value={s.value} />)}
      </div>
      <div className="flex flex-wrap gap-2">
        {byTier.map((t: any) => (
          <div key={t._id} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm">
            <span className="text-gray-400 capitalize">{t._id}</span>
            <span className="text-white font-semibold ml-2">{t.count} sales</span>
            <span className="text-emerald-400 ml-2">{fmt(t.gross)}</span>
          </div>
        ))}
      </div>
      <DownloadBar
        onPDF={() => downloadPDF('Sales Report', from && to ? `${from} to ${to}` : 'All time', headers, csvRows, summaryBoxes)}
        onCSV={() => downloadCSV('sales-report.csv', headers, csvRows)}
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-white/10 text-gray-400 text-xs uppercase">
            {headers.map(h => <th key={h} className="py-2 px-3 text-left font-medium">{h}</th>)}
          </tr></thead>
          <tbody>
            {rows.map((r: any, i: number) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                <td className="py-2 px-3 text-gray-400">{format(new Date(r.createdAt), 'dd MMM yyyy')}</td>
                <td className="py-2 px-3 font-medium text-white">{r.user?.name}</td>
                <td className="py-2 px-3 text-gray-400 text-xs">{r.user?.email}</td>
                <td className="py-2 px-3 text-gray-400">{r.user?.phone || '—'}</td>
                <td className="py-2 px-3"><TierBadge tier={r.packageTier} /></td>
                <td className="py-2 px-3 text-white font-semibold">{fmt(r.totalAmount)}</td>
                <td className="py-2 px-3 text-emerald-400">{fmt(r.amount)}</td>
                <td className="py-2 px-3 text-amber-400">{fmt(r.gstAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <Empty text="No sales in this period" />}
      </div>
    </div>
  )
}

function PnLReport({ year, monthFrom, monthTo }: { year: number; monthFrom: number; monthTo: number }) {
  const { data, isLoading } = useQuery({ queryKey: ['rpt-pnl', year], queryFn: () => adminAPI.financePnl(year).then(r => r.data) })
  if (isLoading) return <Loader />
  if (!data) return null
  const { months: pnlMonths, totals } = data

  const filtered = (pnlMonths || []).filter((_: any, i: number) => {
    const m = i + 1
    return m >= (monthFrom || 1) && m <= (monthTo || 12)
  })

  const headers = ['Month', 'Gross Revenue', 'Net Revenue', 'GST Collected', 'Commissions', 'Expenses', 'TDS', 'Gross Profit', 'Net Profit']
  const rows = filtered.map((r: any) => [r.month, fmt(r.grossRevenue), fmt(r.netRevenue), fmt(r.gstCollected), fmt(r.commissions), fmt(r.expenses), fmt(r.tds), fmt(r.grossProfit), fmt(r.netProfit)])

  const filteredTotals = filtered.reduce((acc: any, r: any) => ({
    grossRevenue: acc.grossRevenue + r.grossRevenue,
    netRevenue: acc.netRevenue + r.netRevenue,
    gstCollected: acc.gstCollected + r.gstCollected,
    commissions: acc.commissions + r.commissions,
    expenses: acc.expenses + r.expenses,
    tds: acc.tds + r.tds,
    grossProfit: acc.grossProfit + r.grossProfit,
    netProfit: acc.netProfit + r.netProfit,
  }), { grossRevenue: 0, netRevenue: 0, gstCollected: 0, commissions: 0, expenses: 0, tds: 0, grossProfit: 0, netProfit: 0 })

  const summaryBoxes = [
    { label: 'Gross Revenue', value: fmt(filteredTotals.grossRevenue) },
    { label: 'Net Revenue', value: fmt(filteredTotals.netRevenue) },
    { label: 'Total Expenses', value: fmt(filteredTotals.expenses) },
    { label: 'Net Profit', value: fmt(filteredTotals.netProfit) },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {summaryBoxes.map(s => <StatBox key={s.label} label={s.label} value={s.value} />)}
      </div>
      <DownloadBar
        onPDF={() => downloadPDF(`P&L Report ${year}`, `Financial Year ${year}`, headers, rows, summaryBoxes)}
        onCSV={() => downloadCSV(`pnl-report-${year}.csv`, headers, rows)}
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-white/10 text-gray-400 text-xs uppercase">
            {headers.map(h => <th key={h} className="py-2 px-3 text-left font-medium whitespace-nowrap">{h}</th>)}
          </tr></thead>
          <tbody>
            {filtered.map((r: any) => (
              <tr key={r.month} className="border-b border-white/5 hover:bg-white/5">
                <td className="py-2 px-3 font-medium text-white">{r.month}</td>
                <td className="py-2 px-3 text-gray-300">{fmt(r.grossRevenue)}</td>
                <td className="py-2 px-3 text-blue-400">{fmt(r.netRevenue)}</td>
                <td className="py-2 px-3 text-amber-400">{fmt(r.gstCollected)}</td>
                <td className="py-2 px-3 text-violet-400">{fmt(r.commissions)}</td>
                <td className="py-2 px-3 text-red-400">{fmt(r.expenses)}</td>
                <td className="py-2 px-3 text-orange-400">{fmt(r.tds)}</td>
                <td className="py-2 px-3 text-cyan-400">{fmt(r.grossProfit)}</td>
                <td className={`py-2 px-3 font-bold ${r.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt(r.netProfit)}</td>
              </tr>
            ))}
            <tr className="bg-white/5 font-semibold">
              <td className="py-2 px-3 text-white">TOTAL</td>
              <td className="py-2 px-3 text-gray-200">{fmt(filteredTotals.grossRevenue)}</td>
              <td className="py-2 px-3 text-blue-300">{fmt(filteredTotals.netRevenue)}</td>
              <td className="py-2 px-3 text-amber-300">{fmt(filteredTotals.gstCollected)}</td>
              <td className="py-2 px-3 text-violet-300">{fmt(filteredTotals.commissions)}</td>
              <td className="py-2 px-3 text-red-300">{fmt(filteredTotals.expenses)}</td>
              <td className="py-2 px-3 text-orange-300">{fmt(filteredTotals.tds)}</td>
              <td className="py-2 px-3 text-cyan-300">{fmt(filteredTotals.grossProfit)}</td>
              <td className={`py-2 px-3 font-bold ${filteredTotals.netProfit >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>{fmt(filteredTotals.netProfit)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PerformanceReport({ from, to }: { from: string; to: string }) {
  const { data, isLoading } = useQuery({ queryKey: ['rpt-perf', from, to], queryFn: () => adminAPI.reportPerformance({ from, to }).then(r => r.data) })
  if (isLoading) return <Loader />
  if (!data) return null
  const { mentorStats, courseStats, classStats } = data

  const mentorHeaders = ['Name', 'Email', 'Package', 'Total Commission (₹)', 'Referrals']
  const mentorRows = mentorStats.map((r: any) => [r.name, r.email, r.packageTier, r.totalCommission.toFixed(0), r.referrals])

  const courseHeaders = ['Course', 'Mentor', 'Enrollments', 'Price (₹)', 'Status']
  const courseRows = courseStats.map((r: any) => [r.title, r.mentorName || '—', r.enrollmentCount, r.price || 0, r.status])

  const classHeaders = ['Mentor', 'Email', 'Classes Held', 'Total Students', 'Avg Attendance']
  const classRows = classStats.map((r: any) => [r.name, r.email, r.classesHeld, r.totalStudents, r.avgAttendance])

  return (
    <div className="space-y-6">
      <DownloadBar
        label="Download Full Report"
        onPDF={() => downloadPDF('Performance Report', from && to ? `${from} to ${to}` : 'All time', mentorHeaders, mentorRows)}
        onCSV={() => {
          downloadCSV('performance-mentors.csv', mentorHeaders, mentorRows)
          setTimeout(() => downloadCSV('performance-courses.csv', courseHeaders, courseRows), 500)
          setTimeout(() => downloadCSV('performance-classes.csv', classHeaders, classRows), 1000)
        }}
      />

      <Section title="Top Partners / Mentors by Commission">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-white/10 text-gray-400 text-xs uppercase">
            {mentorHeaders.map(h => <th key={h} className="py-2 px-3 text-left font-medium">{h}</th>)}
          </tr></thead>
          <tbody>
            {mentorStats.map((r: any, i: number) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                <td className="py-2 px-3 font-medium text-white">{r.name}</td>
                <td className="py-2 px-3 text-gray-400 text-xs">{r.email}</td>
                <td className="py-2 px-3"><TierBadge tier={r.packageTier} /></td>
                <td className="py-2 px-3 text-violet-300 font-semibold">{fmt(r.totalCommission)}</td>
                <td className="py-2 px-3 text-gray-300">{r.referrals}</td>
              </tr>
            ))}
            {mentorStats.length === 0 && <EmptyRow cols={5} />}
          </tbody>
        </table>
      </Section>

      <Section title="Course Enrollment Rankings">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-white/10 text-gray-400 text-xs uppercase">
            {courseHeaders.map(h => <th key={h} className="py-2 px-3 text-left font-medium">{h}</th>)}
          </tr></thead>
          <tbody>
            {courseStats.map((r: any, i: number) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                <td className="py-2 px-3 font-medium text-white max-w-xs truncate">{r.title}</td>
                <td className="py-2 px-3 text-gray-400">{r.mentorName || '—'}</td>
                <td className="py-2 px-3 text-blue-400 font-semibold">{r.enrollmentCount}</td>
                <td className="py-2 px-3 text-gray-300">{fmt(r.price || 0)}</td>
                <td className="py-2 px-3"><StatusBadge status={r.status} /></td>
              </tr>
            ))}
            {courseStats.length === 0 && <EmptyRow cols={5} />}
          </tbody>
        </table>
      </Section>

      <Section title="Live Class Activity by Mentor">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-white/10 text-gray-400 text-xs uppercase">
            {classHeaders.map(h => <th key={h} className="py-2 px-3 text-left font-medium">{h}</th>)}
          </tr></thead>
          <tbody>
            {classStats.map((r: any, i: number) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                <td className="py-2 px-3 font-medium text-white">{r.name}</td>
                <td className="py-2 px-3 text-gray-400 text-xs">{r.email}</td>
                <td className="py-2 px-3 text-cyan-400 font-semibold">{r.classesHeld}</td>
                <td className="py-2 px-3 text-blue-400">{r.totalStudents}</td>
                <td className="py-2 px-3 text-gray-300">{r.avgAttendance}</td>
              </tr>
            ))}
            {classStats.length === 0 && <EmptyRow cols={5} />}
          </tbody>
        </table>
      </Section>
    </div>
  )
}

const DEPT_COLORS: Record<string, string> = {
  hr: 'bg-purple-500/20 text-purple-300', sales: 'bg-blue-500/20 text-blue-300',
  marketing: 'bg-pink-500/20 text-pink-300', content: 'bg-yellow-500/20 text-yellow-300',
  finance: 'bg-emerald-500/20 text-emerald-300', operations: 'bg-orange-500/20 text-orange-300',
  support: 'bg-cyan-500/20 text-cyan-300', tech: 'bg-violet-500/20 text-violet-300',
  general: 'bg-gray-500/20 text-gray-300',
}

function TeamReport({ dept, role, status }: { dept: string; role: string; status: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['rpt-team', dept, role, status],
    queryFn: () => adminAPI.reportTeam({ dept: dept || undefined, role: role || undefined, status: status || undefined }).then(r => r.data)
  })
  if (isLoading) return <Loader />
  if (!data) return null
  const { employees, byDept, total } = data

  const headers = ['Employee ID', 'Name', 'Email', 'Phone', 'Role', 'Department', 'Joining Date', 'Modules Access', 'Status']
  const rows = employees.map((e: any) => [e.employeeId || '—', e.name, e.email, e.phone || '—', e.role, e.department || '—', e.joiningDate ? format(new Date(e.joiningDate), 'dd/MM/yyyy') : '—', (e.permissions || []).length, e.isActive ? 'Active' : 'Inactive'])
  const summaryBoxes = [
    { label: 'Showing', value: String(employees.length) },
    { label: 'Departments', value: String(byDept.length) },
    { label: 'Active', value: String(employees.filter((e: any) => e.isActive).length) },
    { label: 'Inactive', value: String(employees.filter((e: any) => !e.isActive).length) },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {summaryBoxes.map(s => <StatBox key={s.label} label={s.label} value={s.value} />)}
      </div>
      <div className="flex flex-wrap gap-2">
        {byDept.map((d: any) => (
          <div key={d._id} className={`px-3 py-1.5 rounded-lg text-sm ${DEPT_COLORS[d._id] || DEPT_COLORS.general}`}>
            <span className="capitalize font-medium">{d._id || 'Unknown'}</span>
            <span className="ml-2 opacity-70">{d.count} members</span>
          </div>
        ))}
      </div>
      <DownloadBar
        onPDF={() => downloadPDF('Team Report', `Snapshot — ${format(new Date(), 'dd MMM yyyy')}`, headers, rows, summaryBoxes)}
        onCSV={() => downloadCSV('team-report.csv', headers, rows)}
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-white/10 text-gray-400 text-xs uppercase">
            {headers.map(h => <th key={h} className="py-2 px-3 text-left font-medium whitespace-nowrap">{h}</th>)}
          </tr></thead>
          <tbody>
            {employees.map((e: any) => (
              <tr key={e._id} className="border-b border-white/5 hover:bg-white/5">
                <td className="py-2 px-3 text-gray-400 font-mono text-xs">{e.employeeId || '—'}</td>
                <td className="py-2 px-3 font-medium text-white">{e.name}</td>
                <td className="py-2 px-3 text-gray-400 text-xs">{e.email}</td>
                <td className="py-2 px-3 text-gray-400">{e.phone || '—'}</td>
                <td className="py-2 px-3 text-blue-400 capitalize">{e.role}</td>
                <td className="py-2 px-3">
                  <span className={`px-2 py-0.5 rounded text-xs capitalize ${DEPT_COLORS[e.department] || DEPT_COLORS.general}`}>{e.department || '—'}</span>
                </td>
                <td className="py-2 px-3 text-gray-400">{e.joiningDate ? format(new Date(e.joiningDate), 'dd MMM yyyy') : '—'}</td>
                <td className="py-2 px-3 text-violet-400">{(e.permissions || []).length} modules</td>
                <td className="py-2 px-3">{e.isActive ? <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/>Active</span> : <span className="text-red-400 flex items-center gap-1"><XCircle className="w-3 h-3"/>Inactive</span>}</td>
              </tr>
            ))}
            {employees.length === 0 && <EmptyRow cols={9} />}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function LearnerReport({ from, to, tier, status, search }: { from: string; to: string; tier: string; status: string; search: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['rpt-learners', from, to, tier, status, search],
    queryFn: () => adminAPI.reportLearners({ from, to, tier: tier || undefined, status: status || undefined, search: search || undefined }).then(r => r.data)
  })
  if (isLoading) return <Loader />
  if (!data) return null
  const { learners, byTier, summary } = data

  const headers = ['Name', 'Email', 'Phone', 'Package', 'XP', 'Level', 'Joined', 'Status']
  const rows = learners.map((l: any) => [l.name, l.email, l.phone || '—', l.packageTier || 'free', l.xp || 0, l.level || 1, format(new Date(l.createdAt), 'dd/MM/yyyy'), l.isActive ? 'Active' : 'Inactive'])
  const summaryBoxes = [
    { label: 'Total Learners', value: String(summary.total) },
    { label: 'Purchased', value: String(summary.purchased) },
    { label: 'Free / Unpaid', value: String(summary.free) },
    { label: 'Conversion Rate', value: pct(summary.purchased, summary.total) },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {summaryBoxes.map(s => <StatBox key={s.label} label={s.label} value={s.value} />)}
      </div>
      <div className="flex flex-wrap gap-2">
        {byTier.map((t: any) => (
          <div key={t._id} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm">
            <TierBadge tier={t._id || 'free'} />
            <span className="text-gray-300 ml-2">{t.count} learners</span>
          </div>
        ))}
      </div>
      <DownloadBar
        onPDF={() => downloadPDF('Learner Report', from && to ? `${from} to ${to}` : 'All time', headers, rows, summaryBoxes)}
        onCSV={() => downloadCSV('learner-report.csv', headers, rows)}
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-white/10 text-gray-400 text-xs uppercase">
            {headers.map(h => <th key={h} className="py-2 px-3 text-left font-medium">{h}</th>)}
          </tr></thead>
          <tbody>
            {learners.map((l: any, i: number) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                <td className="py-2 px-3 font-medium text-white">{l.name}</td>
                <td className="py-2 px-3 text-gray-400 text-xs">{l.email}</td>
                <td className="py-2 px-3 text-gray-400">{l.phone || '—'}</td>
                <td className="py-2 px-3"><TierBadge tier={l.packageTier || 'free'} /></td>
                <td className="py-2 px-3 text-amber-400">{l.xp || 0} XP</td>
                <td className="py-2 px-3 text-blue-400">Lv.{l.level || 1}</td>
                <td className="py-2 px-3 text-gray-400">{format(new Date(l.createdAt), 'dd MMM yyyy')}</td>
                <td className="py-2 px-3">{l.isActive ? <span className="text-emerald-400">Active</span> : <span className="text-red-400">Inactive</span>}</td>
              </tr>
            ))}
            {learners.length === 0 && <EmptyRow cols={8} />}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Shared mini-components ────────────────────────────────────────────────────

function Loader() {
  return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary-400" /></div>
}
function Empty({ text }: { text: string }) {
  return <div className="text-center py-12 text-gray-500">{text}</div>
}
function EmptyRow({ cols }: { cols: number }) {
  return <tr><td colSpan={cols} className="text-center py-8 text-gray-500">No data found</td></tr>
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">{title}</h3>
      <div className="overflow-x-auto">{children}</div>
    </div>
  )
}
function DownloadBar({ onPDF, onCSV, label = 'Download' }: { onPDF: () => void; onCSV: () => void; label?: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-xs text-gray-500 flex-1">{label}</span>
      <button onClick={onPDF} className="flex items-center gap-2 text-sm bg-red-500/10 text-red-400 hover:bg-red-500/20 px-4 py-2 rounded-lg font-medium transition-colors">
        <FileText className="w-4 h-4" /> PDF
      </button>
      <button onClick={onCSV} className="flex items-center gap-2 text-sm bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 px-4 py-2 rounded-lg font-medium transition-colors">
        <FileSpreadsheet className="w-4 h-4" /> CSV
      </button>
    </div>
  )
}

function TierBadge({ tier }: { tier: string }) {
  const { packages } = usePackages()
  return <span className={`px-2 py-0.5 rounded text-xs capitalize font-medium ${tierStyle(tier, packages).chip}`}>{tierName(tier, packages)}</span>
}
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = { paid: 'text-emerald-400', approved: 'text-blue-400', pending: 'text-amber-400', rejected: 'text-red-400', published: 'text-emerald-400', draft: 'text-gray-400' }
  return <span className={`capitalize text-xs font-medium ${map[status] || 'text-gray-400'}`}>{status}</span>
}

// ── Filter Panels (per-report) ────────────────────────────────────────────────

function FilterPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white/3 border border-white/10 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs text-gray-400 font-medium uppercase tracking-wide">
        <Filter className="w-3.5 h-3.5" /> Filters
      </div>
      <div className="flex flex-wrap gap-3 items-end">
        {children}
      </div>
    </div>
  )
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-gray-500">{label}</label>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { packages: tierPackages } = usePackages({ includeFree: true })
  const currentYear = new Date().getFullYear()
  const [active, setActive] = useState('gst')

  // Shared filters
  const [year, setYear] = useState(currentYear)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  // GST/TDS: month filter
  const [gstMonth, setGstMonth] = useState(0)     // 0 = all
  const [tdsMonth, setTdsMonth] = useState(0)
  const [tdsSearch, setTdsSearch] = useState('')

  // Commission
  const [commStatus, setCommStatus] = useState('')
  const [commSearch, setCommSearch] = useState('')

  // Sales
  const [salesTier, setSalesTier] = useState('')

  // P&L: month range
  const [pnlMonthFrom, setPnlMonthFrom] = useState(1)
  const [pnlMonthTo, setPnlMonthTo] = useState(12)

  // Team
  const [teamDept, setTeamDept] = useState('')
  const [teamRole, setTeamRole] = useState('')
  const [teamStatus, setTeamStatus] = useState('')

  // Learners
  const [learnerTier, setLearnerTier] = useState('')
  const [learnerStatus, setLearnerStatus] = useState('')
  const [learnerSearch, setLearnerSearch] = useState('')

  const report = REPORTS.find(r => r.id === active)!
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)
  const tiers = tierPackages.map((p: any) => p.tier).filter(Boolean)
  const depts = ['hr', 'sales', 'marketing', 'content', 'finance', 'operations', 'support', 'tech', 'general']
  const roles = ['admin', 'manager', 'employee', 'salesperson', 'department_head', 'team_lead']

  const applyPreset = (f: string, t: string) => { setFrom(f); setTo(t) }

  // ── Render per-report filter panel
  const renderFilters = () => {
    if (active === 'gst') return (
      <FilterPanel>
        <FilterGroup label="Year">
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="input py-1.5 text-sm">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </FilterGroup>
        <FilterGroup label="Month">
          <select value={gstMonth} onChange={e => setGstMonth(Number(e.target.value))} className="input py-1.5 text-sm">
            <option value={0}>All Months</option>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </FilterGroup>
      </FilterPanel>
    )

    if (active === 'tds') return (
      <FilterPanel>
        <FilterGroup label="Year">
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="input py-1.5 text-sm">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </FilterGroup>
        <FilterGroup label="Month">
          <select value={tdsMonth} onChange={e => setTdsMonth(Number(e.target.value))} className="input py-1.5 text-sm">
            <option value={0}>All Months</option>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </FilterGroup>
        <FilterGroup label="Search Partner">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input value={tdsSearch} onChange={e => setTdsSearch(e.target.value)} placeholder="Name or email…"
              className="input py-1.5 text-sm pl-8 w-48" />
          </div>
        </FilterGroup>
      </FilterPanel>
    )

    if (active === 'commission') return (
      <FilterPanel>
        <FilterGroup label="Date Range">
          <div className="space-y-2">
            <PresetButtons onSelect={applyPreset} />
            <div className="flex items-center gap-2">
              <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input py-1.5 text-sm" />
              <span className="text-gray-500 text-sm">to</span>
              <input type="date" value={to} onChange={e => setTo(e.target.value)} className="input py-1.5 text-sm" />
              {(from || to) && <button onClick={() => { setFrom(''); setTo('') }} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>}
            </div>
          </div>
        </FilterGroup>
        <FilterGroup label="Status">
          {['', 'pending', 'approved', 'paid', 'rejected'].map(s => (
            <FilterChip key={s} label={s || 'All'} active={commStatus === s} onClick={() => setCommStatus(s)} />
          ))}
        </FilterGroup>
        <FilterGroup label="Search Partner">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input value={commSearch} onChange={e => setCommSearch(e.target.value)} placeholder="Name or email…"
              className="input py-1.5 text-sm pl-8 w-48" />
          </div>
        </FilterGroup>
      </FilterPanel>
    )

    if (active === 'sales') return (
      <FilterPanel>
        <FilterGroup label="Date Range">
          <div className="space-y-2">
            <PresetButtons onSelect={applyPreset} />
            <div className="flex items-center gap-2">
              <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input py-1.5 text-sm" />
              <span className="text-gray-500 text-sm">to</span>
              <input type="date" value={to} onChange={e => setTo(e.target.value)} className="input py-1.5 text-sm" />
              {(from || to) && <button onClick={() => { setFrom(''); setTo('') }} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>}
            </div>
          </div>
        </FilterGroup>
        <FilterGroup label="Package Tier">
          {['', ...tiers].map(t => (
            <FilterChip key={t} label={t ? (tierPackages.find(p => p.tier === t)?.name || t) : 'All'} active={salesTier === t} onClick={() => setSalesTier(t)} />
          ))}
        </FilterGroup>
      </FilterPanel>
    )

    if (active === 'pnl') return (
      <FilterPanel>
        <FilterGroup label="Year">
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="input py-1.5 text-sm">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </FilterGroup>
        <FilterGroup label="From Month">
          <select value={pnlMonthFrom} onChange={e => setPnlMonthFrom(Number(e.target.value))} className="input py-1.5 text-sm">
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </FilterGroup>
        <FilterGroup label="To Month">
          <select value={pnlMonthTo} onChange={e => setPnlMonthTo(Number(e.target.value))} className="input py-1.5 text-sm">
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </FilterGroup>
      </FilterPanel>
    )

    if (active === 'performance') return (
      <FilterPanel>
        <FilterGroup label="Date Range">
          <div className="space-y-2">
            <PresetButtons onSelect={applyPreset} />
            <div className="flex items-center gap-2">
              <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input py-1.5 text-sm" />
              <span className="text-gray-500 text-sm">to</span>
              <input type="date" value={to} onChange={e => setTo(e.target.value)} className="input py-1.5 text-sm" />
              {(from || to) && <button onClick={() => { setFrom(''); setTo('') }} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>}
            </div>
          </div>
        </FilterGroup>
      </FilterPanel>
    )

    if (active === 'team') return (
      <FilterPanel>
        <FilterGroup label="Department">
          <select value={teamDept} onChange={e => setTeamDept(e.target.value)} className="input py-1.5 text-sm capitalize">
            <option value="">All Depts</option>
            {depts.map(d => <option key={d} value={d} className="capitalize">{d}</option>)}
          </select>
        </FilterGroup>
        <FilterGroup label="Role">
          <select value={teamRole} onChange={e => setTeamRole(e.target.value)} className="input py-1.5 text-sm">
            <option value="">All Roles</option>
            {roles.map(r => <option key={r} value={r} className="capitalize">{r.replace('_', ' ')}</option>)}
          </select>
        </FilterGroup>
        <FilterGroup label="Status">
          {[['', 'All'], ['active', 'Active'], ['inactive', 'Inactive']].map(([val, label]) => (
            <FilterChip key={val} label={label} active={teamStatus === val} onClick={() => setTeamStatus(val)} />
          ))}
        </FilterGroup>
      </FilterPanel>
    )

    if (active === 'learners') return (
      <FilterPanel>
        <FilterGroup label="Date Range">
          <div className="space-y-2">
            <PresetButtons onSelect={applyPreset} />
            <div className="flex items-center gap-2">
              <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input py-1.5 text-sm" />
              <span className="text-gray-500 text-sm">to</span>
              <input type="date" value={to} onChange={e => setTo(e.target.value)} className="input py-1.5 text-sm" />
              {(from || to) && <button onClick={() => { setFrom(''); setTo('') }} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>}
            </div>
          </div>
        </FilterGroup>
        <FilterGroup label="Package Tier">
          {['', ...tiers].map(t => (
            <FilterChip key={t} label={t ? (tierPackages.find(p => p.tier === t)?.name || t) : 'All'} active={learnerTier === t} onClick={() => setLearnerTier(t)} />
          ))}
        </FilterGroup>
        <FilterGroup label="Status">
          {[['', 'All'], ['active', 'Active'], ['inactive', 'Inactive']].map(([val, label]) => (
            <FilterChip key={val} label={label} active={learnerStatus === val} onClick={() => setLearnerStatus(val)} />
          ))}
        </FilterGroup>
        <FilterGroup label="Search">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input value={learnerSearch} onChange={e => setLearnerSearch(e.target.value)} placeholder="Name, email or phone…"
              className="input py-1.5 text-sm pl-8 w-52" />
          </div>
        </FilterGroup>
      </FilterPanel>
    )

    return null
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="page-header">
        <h1 className="text-2xl font-black text-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-lg">
            <BarChart2 className="w-5 h-5 text-white" />
          </div>
          Business Reports
        </h1>
        <p className="text-gray-400 text-sm mt-1">Generate, preview and download reports in PDF & CSV</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="card p-2 space-y-1">
            {REPORTS.map(r => (
              <button key={r.id} onClick={() => setActive(r.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${active === r.id ? 'bg-primary-500/20 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${active === r.id ? 'bg-primary-500/30' : r.bg}`}>
                  <r.icon className={`w-4 h-4 ${active === r.id ? 'text-primary-400' : r.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{r.label}</p>
                </div>
                {active === r.id && <ChevronRight className="w-4 h-4 ml-auto flex-shrink-0 text-primary-400" />}
              </button>
            ))}
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Report header */}
          <div className="card">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${report.bg}`}>
                <report.icon className={`w-5 h-5 ${report.color}`} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{report.label}</h2>
                <p className="text-sm text-gray-400">{report.desc}</p>
              </div>
            </div>
          </div>

          {/* Per-report filters */}
          {renderFilters()}

          {/* Report data */}
          <div className="card">
            {active === 'gst'         && <GSTReport year={year} month={gstMonth} />}
            {active === 'tds'         && <TDSReport year={year} month={tdsMonth} search={tdsSearch} />}
            {active === 'commission'  && <CommissionReport from={from} to={to} status={commStatus} search={commSearch} />}
            {active === 'sales'       && <SalesReport from={from} to={to} tier={salesTier} />}
            {active === 'pnl'         && <PnLReport year={year} monthFrom={pnlMonthFrom} monthTo={pnlMonthTo} />}
            {active === 'performance' && <PerformanceReport from={from} to={to} />}
            {active === 'team'        && <TeamReport dept={teamDept} role={teamRole} status={teamStatus} />}
            {active === 'learners'    && <LearnerReport from={from} to={to} tier={learnerTier} status={learnerStatus} search={learnerSearch} />}
          </div>
        </div>
      </div>
    </div>
  )
}
