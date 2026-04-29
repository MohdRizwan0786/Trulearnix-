'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { salesAPI } from '@/lib/api'
import { ShoppingBag, Loader2, Plus, ChevronRight, IndianRupee, TrendingUp, Clock } from 'lucide-react'
import Link from 'next/link'

const STATUS_META: Record<string, { label: string; dot: string; cls: string; bar: string }> = {
  pending:    { label: 'Pending',    dot: 'bg-slate-400',  cls: 'bg-slate-500/15 text-slate-300 border-slate-500/25',  bar: 'bg-slate-500' },
  token_paid: { label: 'Token Paid', dot: 'bg-blue-400',   cls: 'bg-blue-500/15 text-blue-300 border-blue-500/25',     bar: 'bg-blue-500' },
  partial:    { label: 'Partial',    dot: 'bg-amber-400',  cls: 'bg-amber-500/15 text-amber-300 border-amber-500/25',   bar: 'bg-amber-500' },
  paid:       { label: 'Paid',       dot: 'bg-green-400',  cls: 'bg-green-500/15 text-green-300 border-green-500/25',   bar: 'bg-green-500' },
  cancelled:  { label: 'Cancelled',  dot: 'bg-red-400',    cls: 'bg-red-500/15 text-red-300 border-red-500/25',         bar: 'bg-red-500' },
}

const FILTERS = [
  { key: '',           label: 'All' },
  { key: 'pending',    label: 'Pending' },
  { key: 'token_paid', label: 'Token' },
  { key: 'partial',    label: 'Partial' },
  { key: 'paid',       label: 'Paid' },
  { key: 'cancelled',  label: 'Cancelled' },
]

export default function SalesOrdersPage() {
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['sales-orders', status, page],
    queryFn: () => salesAPI.orders({ status, page, limit: 20 }).then(r => r.data),
  })

  const orders: any[] = data?.orders || []
  const totalPages = data?.pages || 1

  // Summary counts
  const totalOrders = data?.totalOrders || orders.length
  const paidOrders = data?.paidOrders || orders.filter((o: any) => o.status === 'paid').length
  const pendingOrders = data?.pendingOrders || orders.filter((o: any) => o.status === 'pending').length

  return (
    <div className="space-y-5 max-w-4xl pb-8">

      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-3xl p-5 sm:p-6"
        style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.35) 0%, rgba(37,99,235,0.25) 100%)', border: '1px solid rgba(99,102,241,0.3)' }}>
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(99,102,241,0.2)' }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-black text-white">Orders</h1>
            <p className="text-indigo-200/60 text-sm mt-1">Manage all your sales orders</p>
          </div>
          <Link href="/sales/orders/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#4f46e5,#2563eb)', boxShadow: '0 4px 20px rgba(79,70,229,0.4)' }}>
            <Plus className="w-4 h-4" /> New Order
          </Link>
        </div>
      </div>

      {/* ── Status Filter Tabs ── */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTERS.map(f => {
          const meta = STATUS_META[f.key]
          const isActive = status === f.key
          return (
            <button key={f.key} onClick={() => { setStatus(f.key); setPage(1) }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                isActive
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-dark-800 border-white/8 text-gray-400 hover:text-white hover:border-white/20'
              }`}>
              {meta && <div className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />}
              {f.label}
            </button>
          )
        })}
      </div>

      {/* ── Orders List ── */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-20 bg-dark-800 rounded-2xl border border-white/5 animate-pulse" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-dark-800 rounded-3xl border border-white/5">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4">
            <ShoppingBag className="w-8 h-8 text-indigo-500/40" />
          </div>
          <p className="text-white font-semibold mb-1">No orders {status ? `with status "${STATUS_META[status]?.label}"` : 'yet'}</p>
          <p className="text-gray-600 text-sm mb-5">{status ? 'Try a different filter' : 'Create your first order to get started'}</p>
          {!status && (
            <Link href="/sales/orders/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold"
              style={{ background: 'linear-gradient(135deg,#4f46e5,#2563eb)' }}>
              <Plus className="w-4 h-4" /> Create Order
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {orders.map((order: any) => {
            const meta = STATUS_META[order.status] || STATUS_META.pending
            const isPaid = order.status === 'paid'
            const progress = order.totalAmount > 0 ? Math.round(((order.paidAmount || 0) / order.totalAmount) * 100) : 0
            return (
              <Link key={order._id} href={`/sales/orders/${order._id}`}
                className={`relative overflow-hidden flex flex-col sm:flex-row sm:items-center gap-3 p-4 sm:p-5 rounded-2xl border transition-all hover:border-indigo-500/25 group ${
                  isPaid ? 'bg-green-500/5 border-green-500/15' : 'bg-dark-800 border-white/5'
                }`}>
                {/* Status bar (left) */}
                <div className={`hidden sm:block absolute left-0 top-0 bottom-0 w-0.5 ${meta.bar} opacity-70 rounded-l-2xl`} />

                <div className="flex items-center gap-3 sm:pl-3 flex-1 min-w-0">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-black flex-shrink-0 ${
                    isPaid ? 'bg-green-500/20 text-green-300 border border-green-500/20' : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/15'
                  }`}>
                    {order.customer?.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">{order.customer?.name}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${meta.cls}`}>{meta.label}</span>
                      {order.paymentType && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-gray-500 capitalize">{order.paymentType}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <p className="text-xs text-gray-500 truncate max-w-[160px]">{order.package?.name || 'N/A'}</p>
                      <span className="text-gray-700">·</span>
                      <p className="text-xs text-gray-600">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 sm:text-right sm:min-w-[140px]">
                  <div>
                    <p className="text-base font-black text-white">₹{(order.totalAmount || 0).toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Paid ₹{(order.paidAmount || 0).toLocaleString()}
                      {order.commissionAmount > 0 && <span className="text-green-400 ml-1">· Earning ₹{(order.commissionAmount||0).toLocaleString()}</span>}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
                </div>

                {/* Progress bar for partial/token */}
                {progress > 0 && progress < 100 && (
                  <div className="sm:hidden w-full mt-1">
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-[10px] text-gray-600 mt-1">{progress}% paid</p>
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 rounded-xl bg-dark-800 border border-white/10 text-sm text-gray-400 hover:text-white disabled:opacity-40 transition-colors">
            ← Prev
          </button>
          <span className="px-4 py-2 rounded-xl bg-dark-800 border border-white/8 text-sm text-gray-400">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-4 py-2 rounded-xl bg-dark-800 border border-white/10 text-sm text-gray-400 hover:text-white disabled:opacity-40 transition-colors">
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
