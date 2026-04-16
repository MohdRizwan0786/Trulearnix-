'use client'
import { useQuery } from '@tanstack/react-query'
import { salesAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import {
  IndianRupee, TrendingUp, Flame, Users, CheckCircle,
  ShoppingBag, ArrowRight, Clock, BadgeCheck, Sparkles,
  Target, Zap, ChevronRight
} from 'lucide-react'
import Link from 'next/link'

const STAGE_DOT: Record<string, string> = {
  new: 'bg-slate-400', contacted: 'bg-blue-400', interested: 'bg-amber-400',
  demo_done: 'bg-purple-400', negotiating: 'bg-orange-400', paid: 'bg-green-400', lost: 'bg-red-400',
}
const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending:    { label: 'Pending',    cls: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
  token_paid: { label: 'Token Paid', cls: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  partial:    { label: 'Partial',    cls: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  paid:       { label: 'Paid',       cls: 'bg-green-500/20 text-green-300 border-green-500/30' },
  cancelled:  { label: 'Cancelled',  cls: 'bg-red-500/20 text-red-300 border-red-500/30' },
}

function SkeletonCard() {
  return <div className="rounded-2xl bg-dark-800 border border-white/5 h-28 animate-pulse" />
}

export default function SalesDashboard() {
  const { user } = useAuthStore()

  const { data: statsData, isLoading } = useQuery({
    queryKey: ['sales-stats'],
    queryFn: () => salesAPI.stats().then(r => r.data.stats),
  })
  const { data: leadsData } = useQuery({
    queryKey: ['sales-leads-recent'],
    queryFn: () => salesAPI.leads({ limit: 5 }).then(r => r.data.leads),
  })
  const { data: ordersData } = useQuery({
    queryKey: ['sales-orders-recent'],
    queryFn: () => salesAPI.orders({ limit: 5 }).then(r => r.data.orders),
  })

  const s = statsData
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const statCards = [
    {
      label: 'My Earnings', value: `₹${(s?.myEarnings || 0).toLocaleString()}`,
      icon: IndianRupee, gradient: 'from-blue-600/30 via-blue-500/10 to-transparent',
      border: 'border-blue-500/20', iconBg: 'bg-blue-500/20', iconC: 'text-blue-300',
      glow: 'shadow-blue-500/10',
    },
    {
      label: 'Wallet Balance', value: `₹${(s?.myWallet || 0).toLocaleString()}`,
      icon: Flame, gradient: 'from-indigo-600/30 via-indigo-500/10 to-transparent',
      border: 'border-indigo-500/20', iconBg: 'bg-indigo-500/20', iconC: 'text-indigo-300',
      glow: 'shadow-indigo-500/10',
    },
    {
      label: 'This Month', value: `₹${(s?.thisMonthEarnings || 0).toLocaleString()}`,
      icon: TrendingUp, gradient: 'from-violet-600/30 via-violet-500/10 to-transparent',
      border: 'border-violet-500/20', iconBg: 'bg-violet-500/20', iconC: 'text-violet-300',
      glow: 'shadow-violet-500/10',
    },
    {
      label: 'Total Leads', value: s?.totalLeads || 0,
      icon: Users, gradient: 'from-sky-600/30 via-sky-500/10 to-transparent',
      border: 'border-sky-500/20', iconBg: 'bg-sky-500/20', iconC: 'text-sky-300',
      glow: 'shadow-sky-500/10',
    },
    {
      label: 'Converted', value: s?.convertedLeads || 0,
      icon: BadgeCheck, gradient: 'from-emerald-600/30 via-emerald-500/10 to-transparent',
      border: 'border-emerald-500/20', iconBg: 'bg-emerald-500/20', iconC: 'text-emerald-300',
      glow: 'shadow-emerald-500/10',
    },
    {
      label: 'Pending Orders', value: s?.pendingOrders || 0,
      icon: ShoppingBag, gradient: 'from-orange-600/30 via-orange-500/10 to-transparent',
      border: 'border-orange-500/20', iconBg: 'bg-orange-500/20', iconC: 'text-orange-300',
      glow: 'shadow-orange-500/10',
    },
  ]

  const convRate = s?.totalLeads > 0 ? Math.round(((s?.convertedLeads || 0) / s.totalLeads) * 100) : 0

  return (
    <div className="space-y-5 max-w-5xl pb-8">

      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden rounded-3xl p-5 sm:p-7"
        style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.35) 0%, rgba(79,70,229,0.3) 50%, rgba(6,182,212,0.2) 100%)', border: '1px solid rgba(59,130,246,0.25)' }}>
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(59,130,246,0.2)' }} />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(79,70,229,0.15)' }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-blue-300" />
              <span className="text-blue-300 text-xs font-semibold uppercase tracking-wider">{greeting}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">{user?.name?.split(' ')[0]} 👋</h1>
            <p className="text-blue-200/60 text-sm mt-1">Here's your sales performance overview</p>
            {convRate > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs text-emerald-300 font-semibold">{convRate}% conversion rate</span>
              </div>
            )}
          </div>
          <Link href="/sales/orders/new"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#2563eb,#4f46e5)', boxShadow: '0 4px 20px rgba(37,99,235,0.4)' }}>
            <ShoppingBag className="w-4 h-4" /> New Order
          </Link>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {statCards.map(card => (
            <div key={card.label}
              className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 border ${card.border} bg-gradient-to-br ${card.gradient} shadow-xl ${card.glow}`}>
              <div className="absolute inset-0 rounded-2xl" style={{ background: 'rgba(0,0,0,0.15)' }} />
              <div className="relative">
                <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center mb-3`}>
                  <card.icon className={`w-5 h-5 ${card.iconC}`} />
                </div>
                <p className="text-2xl font-black text-white leading-none">{card.value}</p>
                <p className="text-xs text-white/50 mt-1.5 font-medium">{card.label}</p>
              </div>
              {/* Decorative glow */}
              <div className={`absolute -bottom-4 -right-4 w-20 h-20 rounded-full blur-2xl ${card.iconBg} opacity-50 pointer-events-none`} />
            </div>
          ))}
        </div>
      )}

      {/* ── Quick Links ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { href: '/sales/leads',   icon: Users,      label: 'Leads',   color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/15' },
          { href: '/sales/orders',  icon: ShoppingBag, label: 'Orders',  color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/15' },
          { href: '/sales/earnings',icon: IndianRupee, label: 'Earnings',color: 'text-emerald-400',bg: 'bg-emerald-500/10 border-emerald-500/15' },
          { href: '/sales/emi',     icon: Zap,         label: 'EMI',     color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/15' },
        ].map(q => (
          <Link key={q.href} href={q.href}
            className={`flex items-center gap-2.5 px-3.5 py-3 rounded-2xl border ${q.bg} transition-all hover:scale-[1.02] active:scale-95`}>
            <q.icon className={`w-4 h-4 ${q.color} flex-shrink-0`} />
            <span className="text-sm text-white font-semibold">{q.label}</span>
            <ChevronRight className="w-3.5 h-3.5 text-white/30 ml-auto" />
          </Link>
        ))}
      </div>

      {/* ── Bottom Panels ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recent Leads */}
        <div className="bg-dark-800 rounded-2xl border border-white/5 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <h2 className="text-white font-bold text-sm">Recent Leads</h2>
            </div>
            <Link href="/sales/leads" className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {!leadsData?.length ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-5">
              <Users className="w-8 h-8 text-gray-700 mb-2" />
              <p className="text-gray-500 text-sm">No leads assigned yet</p>
            </div>
          ) : (
            <div className="divide-y divide-white/4">
              {leadsData.map((lead: any) => (
                <div key={lead._id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.025] transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center text-sm font-black text-blue-300 flex-shrink-0 border border-blue-500/15">
                    {lead.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{lead.name}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{lead.phone}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STAGE_DOT[lead.stage] || 'bg-gray-500'}`} />
                    <span className="text-xs text-gray-400 capitalize">{lead.stage?.replace('_', ' ')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-dark-800 rounded-2xl border border-white/5 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <ShoppingBag className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <h2 className="text-white font-bold text-sm">Recent Orders</h2>
            </div>
            <Link href="/sales/orders" className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {!ordersData?.length ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-5">
              <ShoppingBag className="w-8 h-8 text-gray-700 mb-2" />
              <p className="text-gray-500 text-sm">No orders yet</p>
              <Link href="/sales/orders/new" className="mt-3 text-xs text-blue-400 hover:text-blue-300 font-medium">Create first order →</Link>
            </div>
          ) : (
            <div className="divide-y divide-white/4">
              {ordersData.map((order: any) => {
                const sm = STATUS_META[order.status] || STATUS_META.pending
                return (
                  <Link key={order._id} href={`/sales/orders/${order._id}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.025] transition-colors group">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center text-sm font-black text-indigo-300 flex-shrink-0 border border-indigo-500/15">
                      {order.customer?.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate group-hover:text-blue-300 transition-colors">{order.customer?.name}</p>
                      <p className="text-xs text-gray-600 mt-0.5 truncate">{order.package?.name}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-white">₹{(order.totalAmount || 0).toLocaleString()}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md border font-semibold ${sm.cls}`}>{sm.label}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
