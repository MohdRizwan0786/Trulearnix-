'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salesAPI } from '@/lib/api'
import { useParams } from 'next/navigation'
import {
  ArrowLeft, Loader2, CheckCircle, Link2, Copy, Check,
  Printer, User, Package, IndianRupee, Calendar, AlertCircle, Zap
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

const STATUS_META: Record<string, { label: string; cls: string; border: string }> = {
  pending:    { label: 'Pending',    cls: 'bg-slate-500/15 text-slate-300', border: 'border-slate-500/25' },
  token_paid: { label: 'Token Paid', cls: 'bg-blue-500/15 text-blue-300',   border: 'border-blue-500/25' },
  partial:    { label: 'Partial',    cls: 'bg-amber-500/15 text-amber-300', border: 'border-amber-500/25' },
  paid:       { label: 'Paid',       cls: 'bg-green-500/15 text-green-300', border: 'border-green-500/25' },
  cancelled:  { label: 'Cancelled',  cls: 'bg-red-500/15 text-red-300',     border: 'border-red-500/25' },
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${copied ? 'bg-green-600 text-white' : 'bg-white/8 hover:bg-white/15 text-gray-300'}`}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

function InfoRow({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-white/5 last:border-0">
      <p className="text-xs text-gray-500 font-medium flex-shrink-0">{label}</p>
      <p className={`text-sm font-semibold text-right ${accent ? 'text-green-300' : 'text-white'}`}>{value}</p>
    </div>
  )
}

function PrintSlip({ order }: { order: any }) {
  const handlePrint = () => {
    const html = `<!DOCTYPE html><html><head><title>Order Slip - ${order._id}</title>
    <style>body{font-family:Arial,sans-serif;max-width:600px;margin:40px auto;padding:20px;color:#333}
    .header{text-align:center;border-bottom:2px solid #4f46e5;padding-bottom:20px;margin-bottom:20px}
    .logo{font-size:24px;font-weight:bold;color:#4f46e5}.title{font-size:18px;margin-top:8px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}
    .label{font-size:12px;color:#666;text-transform:uppercase}.value{font-size:15px;font-weight:600;margin-top:2px}
    .total{background:#f0f0ff;padding:16px;border-radius:8px;text-align:center;margin:20px 0}
    .amount{font-size:28px;font-weight:bold;color:#4f46e5}
    .footer{text-align:center;margin-top:24px;font-size:12px;color:#999;border-top:1px solid #eee;padding-top:16px}
    </style></head><body>
    <div class="header"><div class="logo">TruLearnix</div><div class="title">Payment Receipt / Order Slip</div>
    <div style="margin-top:8px;font-size:12px;color:#666">Order ID: ${order._id}</div></div>
    <div class="grid">
      <div><div class="label">Customer</div><div class="value">${order.customer?.name || 'N/A'}</div></div>
      <div><div class="label">Phone</div><div class="value">${order.customer?.phone || 'N/A'}</div></div>
      <div><div class="label">Package</div><div class="value">${order.package?.name || 'N/A'}</div></div>
      <div><div class="label">Payment Type</div><div class="value" style="text-transform:capitalize">${order.paymentType || 'full'}</div></div>
      <div><div class="label">Sales Executive</div><div class="value">${order.salesperson?.name || 'N/A'}</div></div>
      <div><div class="label">Date</div><div class="value">${new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div></div>
    </div>
    <div class="total"><div style="font-size:13px;color:#666;margin-bottom:4px">Total Amount</div>
    <div class="amount">₹${(order.totalAmount || 0).toLocaleString('en-IN')}</div>
    <div style="font-size:13px;color:#666;margin-top:4px">Paid: ₹${(order.paidAmount || 0).toLocaleString('en-IN')}</div></div>
    <div class="footer">TruLearnix — Skill Up. Earn Up. | support@trulearnix.com</div>
    </body></html>`
    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close(); w.print() }
  }
  return (
    <button onClick={handlePrint}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-semibold transition-all border border-white/10">
      <Printer className="w-4 h-4" /> Print Slip
    </button>
  )
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const [paidAmount, setPaidAmount] = useState('')

  const { data: orderData, isLoading } = useQuery({
    queryKey: ['sales-order', id],
    queryFn: () => salesAPI.getOrder(id).then(r => r.data),
    enabled: !!id,
  })

  const verifyMutation = useMutation({
    mutationFn: (data: any) => salesAPI.verifyPayment(id, data),
    onSuccess: () => {
      toast.success('Payment verified!')
      qc.invalidateQueries({ queryKey: ['sales-order', id] })
      qc.invalidateQueries({ queryKey: ['sales-orders'] })
      qc.invalidateQueries({ queryKey: ['sales-stats'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to verify'),
  })

  const linkMutation = useMutation({
    mutationFn: () => salesAPI.generatePaymentLink(id),
    onSuccess: (res) => {
      toast.success('Payment link generated & copied!')
      navigator.clipboard.writeText(res.data.paymentLink)
      qc.invalidateQueries({ queryKey: ['sales-order', id] })
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to generate link'),
  })

  const order = orderData?.order
  const installments: any[] = orderData?.installments || []

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      <p className="text-gray-500 text-sm">Loading order...</p>
    </div>
  )

  if (!order) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <AlertCircle className="w-10 h-10 text-gray-700 mb-3" />
      <p className="text-gray-400 font-medium">Order not found</p>
      <Link href="/sales/orders" className="text-blue-400 text-sm mt-2 hover:text-blue-300">← Back to orders</Link>
    </div>
  )

  const sm = STATUS_META[order.status] || STATUS_META.pending
  const progress = order.totalAmount > 0 ? Math.round(((order.paidAmount || 0) / order.totalAmount) * 100) : 0

  return (
    <div className="space-y-4 max-w-2xl pb-8">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <Link href="/sales/orders"
          className="w-9 h-9 rounded-xl bg-dark-800 border border-white/8 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/20 transition-all flex-shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-black text-white">Order Details</h1>
          <p className="text-xs text-gray-600 font-mono truncate">{order._id}</p>
        </div>
        <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${sm.cls} ${sm.border}`}>{sm.label}</span>
      </div>

      {/* ── Payment Progress ── */}
      {progress > 0 && progress < 100 && (
        <div className="bg-dark-800 rounded-2xl border border-white/5 px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 font-medium">Payment Progress</p>
            <p className="text-xs font-bold text-white">{progress}%</p>
          </div>
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-600">₹{(order.paidAmount||0).toLocaleString()} paid</p>
            <p className="text-xs text-gray-600">₹{((order.totalAmount||0)-(order.paidAmount||0)).toLocaleString()} pending</p>
          </div>
        </div>
      )}

      {/* ── Action Buttons ── */}
      <div className="flex gap-2 flex-wrap">
        <PrintSlip order={order} />
        <button onClick={() => linkMutation.mutate()} disabled={linkMutation.isPending}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 text-sm font-semibold transition-all border border-indigo-500/20">
          {linkMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
          Generate Link
        </button>
      </div>

      {/* ── Payment Link ── */}
      {order.paymentLink && (
        <div className="bg-dark-800 rounded-2xl border border-blue-500/15 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="w-4 h-4 text-blue-400" />
            <p className="text-sm font-bold text-white">Payment Link</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex-1 text-xs font-mono text-gray-300 bg-dark-900/50 px-3 py-2 rounded-xl border border-white/5 truncate">{order.paymentLink}</span>
            <CopyBtn text={order.paymentLink} />
          </div>
          {order.paymentLinkExpiry && (
            <p className="text-[11px] text-gray-600 mt-2">Expires: {new Date(order.paymentLinkExpiry).toLocaleDateString('en-IN')}</p>
          )}
        </div>
      )}

      {/* ── Details Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        {/* Customer */}
        <div className="bg-dark-800 rounded-2xl border border-white/5 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <h2 className="text-white font-bold text-sm">Customer</h2>
          </div>
          <InfoRow label="Name" value={order.customer?.name} />
          <InfoRow label="Phone" value={order.customer?.phone} />
          <InfoRow label="Email" value={order.customer?.email || 'N/A'} />
          <InfoRow label="Location" value={[order.customer?.city, order.customer?.state].filter(Boolean).join(', ') || 'N/A'} />
        </div>

        {/* Package */}
        <div className="bg-dark-800 rounded-2xl border border-white/5 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/15 flex items-center justify-center">
              <Package className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <h2 className="text-white font-bold text-sm">Package</h2>
          </div>
          <InfoRow label="Package" value={order.package?.name || 'N/A'} />
          <InfoRow label="Tier" value={<span className="capitalize">{order.packageTier || 'N/A'}</span>} />
          <InfoRow label="Payment Type" value={<span className="capitalize">{order.paymentType}</span>} />
          <InfoRow label="Promo Code" value={<span className="font-mono">{order.promoCode || 'None'}</span>} />
        </div>
      </div>

      {/* ── Payment ── */}
      <div className="bg-dark-800 rounded-2xl border border-white/5 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <h2 className="text-white font-bold text-sm">Payment</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: `₹${(order.totalAmount||0).toLocaleString()}`, cls: 'text-white text-xl font-black' },
            { label: 'Paid', value: `₹${(order.paidAmount||0).toLocaleString()}`, cls: 'text-white text-xl font-black' },
            { label: 'Partnership earning', value: `₹${(order.commissionAmount||0).toLocaleString()}`, cls: `text-lg font-black ${order.commissionPaid ? 'text-green-300' : 'text-gray-300'}` },
            { label: 'Date', value: new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), cls: 'text-white text-sm font-medium' },
          ].map(item => (
            <div key={item.label}>
              <p className="text-xs text-gray-500 mb-1">{item.label}</p>
              <p className={item.cls}>{item.value}</p>
              {item.label === 'Partnership earning' && (
                <p className="text-[10px] mt-0.5 text-gray-600">{order.commissionPaid ? '(credited)' : order.paymentType === 'emi' ? '(per installment)' : '(pending)'}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── EMI Installments ── */}
      {order.paymentType === 'emi' && installments.length > 0 && (
        <div className="bg-dark-800 rounded-2xl border border-white/5 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <h2 className="text-white font-bold text-sm">EMI Installments</h2>
          </div>
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(installments.length, 4)}, 1fr)` }}>
            {installments.map((inst: any) => (
              <div key={inst._id} className={`rounded-xl p-3 border text-center ${
                inst.status === 'paid' ? 'bg-green-500/10 border-green-500/20' :
                inst.status === 'overdue' ? 'bg-red-500/10 border-red-500/20' :
                'bg-white/3 border-white/8'
              }`}>
                <p className="text-[10px] text-gray-600 font-medium">#{inst.installmentNumber}</p>
                <p className={`text-sm font-black mt-0.5 ${inst.status === 'paid' ? 'text-green-300' : 'text-white'}`}>₹{(inst.amount||0).toLocaleString()}</p>
                <span className={`text-[10px] font-bold mt-1 block ${inst.status === 'paid' ? 'text-green-400' : inst.status === 'overdue' ? 'text-red-400' : 'text-amber-400'}`}>
                  {inst.status === 'paid' ? '✓ Paid' : inst.status === 'overdue' ? '! Overdue' : '○ Pending'}
                </span>
                <p className="text-[10px] text-gray-600 mt-1">
                  {inst.status === 'paid' && inst.paidAt
                    ? new Date(inst.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                    : `Due ${new Date(inst.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Verify Payment ── */}
      {order.status !== 'paid' && order.status !== 'cancelled' && (
        <div className="bg-dark-800 rounded-2xl border border-green-500/15 p-5"
          style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.05) 0%, rgba(0,0,0,0) 100%)' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-green-500/15 flex items-center justify-center">
              <CheckCircle className="w-3.5 h-3.5 text-green-400" />
            </div>
            <h2 className="text-white font-bold text-sm">Verify Payment</h2>
          </div>
          <div className="flex gap-3">
            <input
              type="number"
              value={paidAmount}
              onChange={e => setPaidAmount(e.target.value)}
              placeholder={`Amount (default: ₹${order.totalAmount?.toLocaleString()})`}
              className="flex-1 bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-green-500/60 min-w-0"
            />
            <button
              onClick={() => verifyMutation.mutate({ paidAmount: paidAmount ? Number(paidAmount) : order.totalAmount, paymentMethod: 'manual' })}
              disabled={verifyMutation.isPending}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition-all disabled:opacity-50 flex-shrink-0">
              {verifyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Confirm
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2">This will activate the customer's package and credit your Partnership earning.</p>
        </div>
      )}

      {/* ── Notes ── */}
      {order.notes && (
        <div className="bg-dark-800 rounded-2xl border border-white/5 p-5">
          <h2 className="text-white font-bold text-sm mb-2">Notes</h2>
          <p className="text-gray-400 text-sm leading-relaxed">{order.notes}</p>
        </div>
      )}
    </div>
  )
}
