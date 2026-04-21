'use client'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { adminAPI } from '@/lib/api'
import AdminLayout from '@/components/AdminLayout'
import toast from 'react-hot-toast'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
} from 'recharts'
import {
  Users, DollarSign, TrendingUp, Flame, UserCheck, Coins,
  Clock, ArrowUpRight, ArrowDownRight, BookOpen, Video,
  ShoppingCart, RefreshCw, CheckCircle, XCircle,
  GraduationCap, Zap, LifeBuoy, Bell, Package,
  ChevronRight, Activity, Radio, Play, Monitor,
  Calendar, HeadphonesIcon, Award, BarChart2, Layers,
  ArrowRight, CircleDot, CheckSquare as CheckSquareIcon,
} from 'lucide-react'
import Link from 'next/link'
import { format, formatDistanceToNow } from 'date-fns'

// ── Color maps ────────────────────────────────────────────────────────────────
const PKG_COLORS: Record<string, string> = {
  starter: '#3b82f6', pro: '#8b5cf6', elite: '#f59e0b',
  supreme: '#f43f5e', free: '#6b7280',
  'tru starter': '#3b82f6',
  'tru pro-edge': '#8b5cf6',
  'tru booster': '#10b981',
  'tru advance': '#f59e0b',
  'tru premium-infinity': '#f43f5e',
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs shadow-2xl">
      <p className="text-gray-400 mb-1 font-medium">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-bold" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' && p.value > 999
            ? `₹${(p.value / 1000).toFixed(1)}K` : p.value}
        </p>
      ))}
    </div>
  )
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KPICard({ icon: Icon, label, value, sub, change, accent, href }: any) {
  const content = (
    <div className={`relative overflow-hidden rounded-2xl border p-4 cursor-pointer group transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${accent.card}`}>
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity ${accent.glow}`} />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent.icon}`}>
            <Icon className="w-4 h-4" />
          </div>
          {change !== undefined && (
            <span className={`text-[10px] font-bold flex items-center gap-0.5 px-1.5 py-0.5 rounded-full ${change >= 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
              {change >= 0 ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
              {Math.abs(change)}%
            </span>
          )}
        </div>
        <p className="text-xl font-black text-white tracking-tight leading-none">{value}</p>
        <p className="text-[11px] text-gray-400 mt-1.5 font-medium">{label}</p>
        {sub && <p className="text-[10px] text-gray-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
  return href ? <Link href={href}>{content}</Link> : content
}

// ── Live Badge ─────────────────────────────────────────────────────────────────
function LiveDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
    </span>
  )
}

// ── Session Card (live / upcoming) ────────────────────────────────────────────
function SessionCard({ session, type, isLive }: { session: any; type: 'class' | 'webinar'; isLive: boolean }) {
  const href = type === 'class' ? `/live-classes/${session._id}` : `/webinars/${session._id}`
  return (
    <Link href={href} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 transition-all group">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${type === 'class' ? 'bg-violet-500/20' : 'bg-amber-500/20'}`}>
        {type === 'class'
          ? <Video className="w-4 h-4 text-violet-400" />
          : <Radio className="w-4 h-4 text-amber-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs font-semibold truncate">{session.title}</p>
        <p className="text-gray-500 text-[10px] truncate">
          {type === 'class'
            ? (session.mentor?.name || 'Mentor')
            : (session.createdBy?.name || 'Admin')}
        </p>
      </div>
      <div className="flex-shrink-0 text-right">
        {isLive ? (
          <div className="flex items-center gap-1 text-red-400 text-[10px] font-bold">
            <LiveDot /> LIVE
          </div>
        ) : (
          <p className="text-gray-500 text-[10px]">
            {session.scheduledAt ? format(new Date(session.scheduledAt), 'hh:mm a') : '—'}
          </p>
        )}
        <p className="text-gray-600 text-[10px]">{session.duration} min</p>
      </div>
    </Link>
  )
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const qc = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)
  const [period, setPeriod] = useState('30d')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [showCustom, setShowCustom] = useState(false)

  const effectivePeriod = period
  const effectiveFrom = period === 'custom' ? customFrom : undefined
  const effectiveTo = period === 'custom' ? customTo : undefined

  // ── Data queries ──────────────────────────────────────────────────────────
  const { data: dash } = useQuery({ queryKey: ['analytics-dash'], queryFn: () => adminAPI.analyticsDashboard().then(r => r.data) })
  const { data: basicDash } = useQuery({ queryKey: ['basic-dash'], queryFn: () => adminAPI.dashboard().then(r => r.data) })
  const { data: pending, refetch: refetchPending } = useQuery({ queryKey: ['pending-courses'], queryFn: () => adminAPI.pendingCourses().then(r => r.data) })
  const { data: revData } = useQuery({ queryKey: ['rev', effectivePeriod, effectiveFrom, effectiveTo], queryFn: () => adminAPI.analyticsRevenue(effectivePeriod, effectiveFrom, effectiveTo).then(r => r.data), enabled: effectivePeriod !== 'custom' || !!effectiveFrom })
  const { data: userData } = useQuery({ queryKey: ['usr', effectivePeriod, effectiveFrom, effectiveTo], queryFn: () => adminAPI.analyticsUsers(effectivePeriod, effectiveFrom, effectiveTo).then(r => r.data), enabled: effectivePeriod !== 'custom' || !!effectiveFrom })
  const { data: liveClassesData } = useQuery({ queryKey: ['live-classes-now'], queryFn: () => adminAPI.allClasses({ status: 'live', limit: 10 }).then(r => r.data), refetchInterval: 30000 })
  const { data: liveWebinarsData } = useQuery({ queryKey: ['live-webinars-now'], queryFn: () => adminAPI.allWebinars({ status: 'live', limit: 10 }).then(r => r.data), refetchInterval: 30000 })
  const { data: upcomingClassesData } = useQuery({ queryKey: ['upcoming-classes'], queryFn: () => adminAPI.allClasses({ status: 'scheduled', limit: 5 }).then(r => r.data), refetchInterval: 60000 })
  const { data: upcomingWebinarsData } = useQuery({ queryKey: ['upcoming-webinars'], queryFn: () => adminAPI.allWebinars({ status: 'scheduled', limit: 5 }).then(r => r.data), refetchInterval: 60000 })
  const { data: ticketsData } = useQuery({ queryKey: ['open-tickets'], queryFn: () => adminAPI.tickets({ status: 'open', limit: 6 }).then(r => r.data) })
  const { data: crmData } = useQuery({ queryKey: ['crm-stats'], queryFn: () => adminAPI.crmStats().then(r => r.data) })
  const { data: meetingsData } = useQuery({ queryKey: ['meetings-dash'], queryFn: () => adminAPI.meetings().then(r => r.data), refetchInterval: 60000 })
  const { data: tasksData } = useQuery({ queryKey: ['tasks-dash'], queryFn: () => adminAPI.tasks().then(r => r.data), refetchInterval: 60000 })

  // ── Derived data ──────────────────────────────────────────────────────────
  const stats = dash || {}
  const basicStats = basicDash?.stats || {}
  const pkgDist = dash?.packages || []
  const recentPayments = basicDash?.recentPayments || []

  const liveClasses: any[] = liveClassesData?.classes || []
  const liveWebinars: any[] = liveWebinarsData?.webinars || []
  const upcomingClasses: any[] = upcomingClassesData?.classes || []
  const upcomingWebinars: any[] = upcomingWebinarsData?.webinars || []
  const openTickets: any[] = ticketsData?.tickets || []
  const totalLive = liveClasses.length + liveWebinars.length

  const now = new Date()

  // Meetings — upcoming (next 7 days, not ended)
  const allMeetings: any[] = meetingsData?.data || []
  const upcomingMeetings = allMeetings
    .filter(m => m.scheduledAt && m.status !== 'ended' && new Date(m.scheduledAt) >= now)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 5)
  const meetingToday = allMeetings.filter(m => {
    if (!m.scheduledAt) return false
    const d = new Date(m.scheduledAt)
    return !isNaN(d.getTime()) && d.toDateString() === now.toDateString() && m.status !== 'ended'
  })

  // Tasks
  const allTasks: any[] = tasksData?.data || []
  const overdueTasks = allTasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done')
  const tasksByStatus = {
    todo: allTasks.filter(t => t.status === 'todo').length,
    inProgress: allTasks.filter(t => t.status === 'in-progress').length,
    review: allTasks.filter(t => t.status === 'review').length,
    done: allTasks.filter(t => t.status === 'done').length,
  }
  const urgentTasks = allTasks.filter(t => t.priority === 'urgent' && t.status !== 'done').slice(0, 5)

  // CRM funnel data
  const stageOrder = ['new','contacted','interested','demo_done','negotiating','token_collected','paid','lost']
  const stageLabels: Record<string,string> = { new:'New', contacted:'Contacted', interested:'Interested', demo_done:'Demo Done', negotiating:'Negotiating', token_collected:'Token', paid:'Paid', lost:'Lost' }
  const stageColors: Record<string,string> = { new:'#6b7280', contacted:'#3b82f6', interested:'#8b5cf6', demo_done:'#f59e0b', negotiating:'#f97316', token_collected:'#06b6d4', paid:'#10b981', lost:'#ef4444' }
  const byStage: any[] = crmData?.byStage || []
  const totalLeads = crmData?.total || byStage.reduce((s: number, x: any) => s + (x.count || 0), 0) || 1
  const funnelData = stageOrder.map(s => ({
    stage: s, label: stageLabels[s], color: stageColors[s],
    count: byStage.find((x: any) => x._id === s)?.count || 0,
  }))

  const revChart = (revData?.revenue || []).map((d: any) => ({
    date: (d._id || d.date || '').slice(5), revenue: d.total || d.revenue || 0,
  }))
  const userChart = (userData?.growth || []).map((d: any) => ({
    date: (d._id || d.date || '').slice(5), users: d.count || 0,
  }))

  // Monthly trend from basicDash
  const monthlyChart = (basicDash?.monthlyRevenue || []).slice(-6).map((m: any) => ({
    label: `${m._id?.month}/${String(m._id?.year).slice(-2)}`,
    revenue: m.revenue || 0,
    count: m.count || 0,
  }))

  const handleRefresh = async () => {
    setRefreshing(true)
    await qc.invalidateQueries()
    setTimeout(() => setRefreshing(false), 800)
  }

  const approveCourse = async (id: string) => {
    try { await adminAPI.approveCourse(id); toast.success('Course approved'); refetchPending() }
    catch { toast.error('Failed') }
  }
  const rejectCourse = async (id: string) => {
    const reason = prompt('Rejection reason:')
    if (!reason) return
    try { await adminAPI.rejectCourse(id, reason); toast.success('Rejected'); refetchPending() }
    catch { toast.error('Failed') }
  }

  const hour = now.getHours()
  const greeting = hour < 12 ? '🌤 Good Morning' : hour < 17 ? '☀️ Good Afternoon' : '🌙 Good Evening'
  const fmtDate = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const kpiAccents = [
    { card: 'bg-gradient-to-br from-blue-950/60 to-slate-900/60 border-blue-500/20', icon: 'bg-blue-500/20 text-blue-400', glow: 'bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_60%)]' },
    { card: 'bg-gradient-to-br from-emerald-950/60 to-slate-900/60 border-emerald-500/20', icon: 'bg-emerald-500/20 text-emerald-400', glow: 'bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_60%)]' },
    { card: 'bg-gradient-to-br from-violet-950/60 to-slate-900/60 border-violet-500/20', icon: 'bg-violet-500/20 text-violet-400', glow: 'bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.08),transparent_60%)]' },
    { card: 'bg-gradient-to-br from-amber-950/60 to-slate-900/60 border-amber-500/20', icon: 'bg-amber-500/20 text-amber-400', glow: 'bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.08),transparent_60%)]' },
    { card: 'bg-gradient-to-br from-pink-950/60 to-slate-900/60 border-pink-500/20', icon: 'bg-pink-500/20 text-pink-400', glow: 'bg-[radial-gradient(circle_at_top_right,rgba(236,72,153,0.08),transparent_60%)]' },
    { card: 'bg-gradient-to-br from-cyan-950/60 to-slate-900/60 border-cyan-500/20', icon: 'bg-cyan-500/20 text-cyan-400', glow: 'bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.08),transparent_60%)]' },
    { card: 'bg-gradient-to-br from-orange-950/60 to-slate-900/60 border-orange-500/20', icon: 'bg-orange-500/20 text-orange-400', glow: 'bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.08),transparent_60%)]' },
    { card: 'bg-gradient-to-br from-indigo-950/60 to-slate-900/60 border-indigo-500/20', icon: 'bg-indigo-500/20 text-indigo-400', glow: 'bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.08),transparent_60%)]' },
  ]

  return (
    <AdminLayout>
      <div className="space-y-5 pb-10">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl p-6 md:p-8"
          style={{ background: 'linear-gradient(135deg, rgba(109,40,217,0.3) 0%, rgba(79,70,229,0.2) 40%, rgba(6,182,212,0.1) 100%)', border: '1px solid rgba(124,58,237,0.25)' }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 80% 0%, rgba(124,58,237,0.15), transparent 60%)' }} />
          <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #7c3aed, transparent 70%)' }} />

          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-violet-300 text-sm font-semibold">{greeting}</p>
              <h1 className="text-2xl md:text-3xl font-black text-white mt-1 tracking-tight">TruLearnix Command Center</h1>
              <p className="text-gray-400 text-sm mt-1">{fmtDate}</p>
              <div className="flex flex-wrap items-center gap-4 mt-3">
                <div className="flex items-center gap-2 text-xs text-gray-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span><span className="text-white font-bold">{basicStats.totalUsers?.toLocaleString() || '—'}</span> total users</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                  <span><span className="text-white font-bold">{basicStats.totalEnrollments?.toLocaleString() || '—'}</span> enrollments</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span><span className="text-white font-bold">{basicStats.totalCourses || '—'}</span> live courses</span>
                </div>
                {totalLive > 0 && (
                  <div className="flex items-center gap-2 text-xs text-red-300 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-full">
                    <LiveDot />
                    <span className="font-bold">{totalLive} live session{totalLive > 1 ? 's' : ''} now</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex flex-col gap-1.5">
                <div className="flex gap-1 bg-slate-900/60 rounded-xl p-1 border border-white/5">
                  {([['today','Today'],['7d','7 Days'],['30d','30 Days'],['custom','Custom']] as const).map(([v,l]) => (
                    <button key={v} onClick={() => { setPeriod(v); setShowCustom(v === 'custom') }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${period === v ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20' : 'text-gray-500 hover:text-white'}`}>{l}
                    </button>
                  ))}
                </div>
                {showCustom && (
                  <div className="flex items-center gap-1.5 bg-slate-900/60 rounded-xl p-1.5 border border-violet-500/20">
                    <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                      className="bg-transparent text-gray-300 text-xs outline-none [color-scheme:dark] cursor-pointer" />
                    <span className="text-gray-600 text-xs">→</span>
                    <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                      className="bg-transparent text-gray-300 text-xs outline-none [color-scheme:dark] cursor-pointer" />
                  </div>
                )}
              </div>
              <button onClick={handleRefresh}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 hover:text-white transition-all">
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* ── LIVE NOW banner ───────────────────────────────────────────────── */}
        {totalLive > 0 && (
          <div className="rounded-2xl border border-red-500/25 bg-gradient-to-r from-red-950/40 via-red-900/20 to-rose-950/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-red-300 font-bold text-sm">
                <LiveDot />
                {totalLive} Session{totalLive > 1 ? 's' : ''} Live Right Now
              </div>
              <div className="flex gap-2">
                <Link href="/live-classes" className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">Classes <ChevronRight className="w-3 h-3" /></Link>
                <Link href="/webinars" className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1">Webinars <ChevronRight className="w-3 h-3" /></Link>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {liveClasses.map(c => <SessionCard key={c._id} session={c} type="class" isLive />)}
              {liveWebinars.map(w => <SessionCard key={w._id} session={w} type="webinar" isLive />)}
            </div>
          </div>
        )}

        {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
          <KPICard icon={Users} label="Total Users" value={(basicStats.totalUsers || 0).toLocaleString()}
            change={stats.users?.growth} accent={kpiAccents[0]} href="/users" />
          <KPICard icon={DollarSign} label="Revenue / Month" value={`₹${((stats.revenue?.thisMonth || basicStats.totalRevenue || 0) / 1000).toFixed(1)}K`}
            change={stats.revenue?.growth} accent={kpiAccents[1]} href="/finance" />
          <KPICard icon={TrendingUp} label="Total Revenue" value={`₹${((stats.revenue?.total || basicStats.totalRevenue || 0) / 1000).toFixed(0)}K`}
            accent={kpiAccents[2]} href="/analytics" />
          <KPICard icon={GraduationCap} label="Enrollments" value={(basicStats.totalEnrollments || 0).toLocaleString()}
            sub={`${basicStats.totalStudents || 0} students`} accent={kpiAccents[3]} href="/learners" />
          <KPICard icon={BookOpen} label="Courses" value={basicStats.totalCourses || 0}
            sub={`${pending?.courses?.length || 0} pending`} accent={kpiAccents[4]} href="/courses" />
          <KPICard icon={Flame} label="Hot Leads" value={stats.leads?.hot || crmData?.hot || 0}
            sub={`${stats.leads?.total || 0} total`} accent={kpiAccents[5]} href="/crm" />
          <KPICard icon={HeadphonesIcon} label="Open Tickets" value={openTickets.length || 0}
            accent={kpiAccents[6]} href="/support" />
          <KPICard icon={UserCheck} label="Partners" value={stats.affiliates?.total || 0}
            sub={`₹${((stats.commissionsPaid || 0) / 1000).toFixed(1)}K paid`} accent={kpiAccents[7]} href="/learners" />
        </div>

        {/* ── Revenue + Package ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          <div className="lg:col-span-2 rounded-2xl bg-slate-900/60 border border-white/[0.06] p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-violet-400" /> Revenue Trend
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Period total: <span className="text-violet-400 font-bold">
                    ₹{((revChart.reduce((s: number, d: any) => s + d.revenue, 0) || monthlyChart.reduce((s: number, d: any) => s + d.revenue, 0)) / 1000).toFixed(1)}K
                  </span>
                </p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={revChart.length > 0 ? revChart : monthlyChart.map(m => ({ date: m.label, revenue: m.revenue }))}>
                <defs>
                  <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: '#4b5563', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#4b5563', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v > 999 ? (v/1000).toFixed(0)+'K' : v}`} width={45} />
                <Tooltip content={<ChartTip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#8b5cf6" strokeWidth={2} fill="url(#rg)" dot={false} activeDot={{ r: 4, fill: '#8b5cf6' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl bg-slate-900/60 border border-white/[0.06] p-5">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-cyan-400" /> Package Distribution
            </h2>
            {pkgDist.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={pkgDist} cx="50%" cy="50%" innerRadius={42} outerRadius={65} paddingAngle={3} dataKey="count" strokeWidth={0}>
                      {pkgDist.map((p: any, i: number) => (
                        <Cell key={i} fill={PKG_COLORS[p._id?.toLowerCase()] || '#6b7280'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any, name: any) => [val, name]} contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {pkgDist.map((p: any) => {
                    const total = pkgDist.reduce((s: number, x: any) => s + (x.count || 0), 0)
                    const pct = total > 0 ? Math.round((p.count / total) * 100) : 0
                    const color = PKG_COLORS[p._id?.toLowerCase()] || '#6b7280'
                    return (
                      <div key={p._id} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                        <span className="text-gray-400 text-[11px] capitalize flex-1">{p._id || 'Unknown'}</span>
                        <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden max-w-[60px]">
                          <div className="h-1 rounded-full" style={{ width: `${pct}%`, background: color }} />
                        </div>
                        <span className="text-white text-[11px] font-bold w-6 text-right">{p.count}</span>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="h-44 flex flex-col items-center justify-center gap-2">
                <Package className="w-8 h-8 text-gray-700" />
                <p className="text-gray-600 text-xs">No package data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* ── User Growth + Upcoming Sessions ───────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          <div className="lg:col-span-2 rounded-2xl bg-slate-900/60 border border-white/[0.06] p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" /> New User Signups
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  +<span className="text-emerald-400 font-bold">{userChart.reduce((s: number, d: any) => s + d.users, 0)}</span> new users this period
                </p>
              </div>
            </div>
            {userChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={userChart} barSize={Math.max(4, Math.min(12, 300 / (userChart.length || 1)))}>
                  <defs>
                    <linearGradient id="ug" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: '#4b5563', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#4b5563', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTip />} />
                  <Bar dataKey="users" name="New Users" fill="url(#ug)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center">
                <p className="text-gray-700 text-sm">No user data for this period</p>
              </div>
            )}
          </div>

          {/* Upcoming Sessions */}
          <div className="rounded-2xl bg-slate-900/60 border border-white/[0.06] p-5 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" /> Upcoming Sessions
              </h2>
              <Link href="/live-classes" className="text-[10px] text-violet-400 hover:text-violet-300 flex items-center gap-0.5">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex-1 space-y-1.5 overflow-y-auto">
              {[...upcomingClasses.map(c => ({ ...c, _type: 'class' })), ...upcomingWebinars.map(w => ({ ...w, _type: 'webinar' }))]
                .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                .slice(0, 8)
                .map(s => <SessionCard key={s._id} session={s} type={s._type} isLive={false} />)}
              {upcomingClasses.length === 0 && upcomingWebinars.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center py-10 gap-2">
                  <Calendar className="w-8 h-8 text-gray-700" />
                  <p className="text-gray-600 text-xs">No upcoming sessions</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Recent Payments + Pending Approvals ───────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Recent payments */}
          <div className="lg:col-span-2 rounded-2xl bg-slate-900/60 border border-white/[0.06] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-violet-400" /> Recent Payments
              </h2>
              <Link href="/finance" className="text-[10px] text-violet-400 hover:text-violet-300 flex items-center gap-0.5">
                All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2.5">
              {recentPayments.slice(0, 7).map((p: any, i: number) => (
                <div key={p._id || i} className="flex items-center gap-2.5 group">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold">
                    {(p.user?.name || p.name || '?')[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-[11px] font-semibold truncate">{p.user?.name || p.name || 'User'}</p>
                    <p className="text-gray-600 text-[10px] truncate">{p.course?.title || p.description || 'Purchase'}</p>
                  </div>
                  {p.amount && (
                    <span className="text-emerald-400 text-xs font-bold flex-shrink-0">+₹{p.amount}</span>
                  )}
                </div>
              ))}
              {!recentPayments.length && (
                <div className="py-6 text-center">
                  <ShoppingCart className="w-6 h-6 text-gray-700 mx-auto mb-2" />
                  <p className="text-gray-600 text-xs">No payments yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Pending Approvals */}
          <div className="lg:col-span-3 rounded-2xl bg-slate-900/60 border border-white/[0.06] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-400" /> Pending Approvals
                {(pending?.courses?.length || 0) > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full animate-pulse">
                    {pending.courses.length}
                  </span>
                )}
              </h2>
              <Link href="/courses" className="text-[10px] text-violet-400 hover:text-violet-300 flex items-center gap-0.5">
                All Courses <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {!pending?.courses?.length ? (
              <div className="py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="text-white text-sm font-semibold">All caught up!</p>
                <p className="text-gray-600 text-xs mt-1">No pending course approvals</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pending.courses.slice(0, 5).map((course: any) => (
                  <div key={course._id} className="flex items-center gap-3 p-3 bg-white/[0.03] hover:bg-white/[0.06] rounded-xl transition-colors border border-white/[0.04]">
                    {course.thumbnail
                      ? <img src={course.thumbnail} alt="" className="w-12 h-9 rounded-lg object-cover flex-shrink-0" />
                      : <div className="w-12 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-4 h-4 text-violet-400" />
                        </div>
                    }
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-xs truncate">{course.title}</p>
                      <p className="text-[10px] text-gray-500">by {course.mentor?.name || 'Unknown'}</p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button onClick={() => approveCourse(course._id)}
                        className="flex items-center gap-1 text-[10px] bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500 hover:text-white px-2.5 py-1.5 rounded-lg transition-all font-semibold">
                        <CheckCircle className="w-3 h-3" /> Approve
                      </button>
                      <button onClick={() => rejectCourse(course._id)}
                        className="flex items-center gap-1 text-[10px] bg-red-500/15 text-red-400 hover:bg-red-500 hover:text-white px-2.5 py-1.5 rounded-lg transition-all font-semibold">
                        <XCircle className="w-3 h-3" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Support Tickets ───────────────────────────────────────────────── */}
        {openTickets.length > 0 && (
          <div className="rounded-2xl bg-slate-900/60 border border-orange-500/15 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <HeadphonesIcon className="w-4 h-4 text-orange-400" /> Open Support Tickets
                <span className="text-[10px] font-bold px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full">{openTickets.length}</span>
              </h2>
              <Link href="/support" className="text-[10px] text-orange-400 hover:text-orange-300 flex items-center gap-0.5">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {openTickets.slice(0, 6).map((t: any) => (
                <Link key={t._id} href="/support"
                  className="flex items-center gap-3 p-3 bg-white/[0.03] hover:bg-white/[0.06] rounded-xl border border-white/[0.04] transition-colors">
                  <div className="w-7 h-7 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <HeadphonesIcon className="w-3.5 h-3.5 text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">{t.subject || t.title || 'Support Request'}</p>
                    <p className="text-gray-600 text-[10px]">{t.user?.name || t.name || 'User'} · {t.createdAt ? formatDistanceToNow(new Date(t.createdAt), { addSuffix: true }) : ''}</p>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${t.priority === 'high' ? 'bg-red-500/20 text-red-400' : t.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-500/20 text-gray-400'}`}>
                    {t.priority || 'open'}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Sales Team Performance + Meetings + Tasks ────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Sales Funnel */}
          <div className="rounded-2xl bg-slate-900/60 border border-white/[0.06] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> Sales Funnel
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-gray-500">{crmData?.conversionRate || 0}% conv.</span>
                <Link href="/crm" className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5">
                  CRM <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
            <div className="space-y-2">
              {funnelData.map(({ stage, label, color, count }) => {
                const pct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0
                return (
                  <div key={stage} className="flex items-center gap-2 group">
                    <span className="text-[10px] text-gray-500 w-16 flex-shrink-0 text-right">{label}</span>
                    <div className="flex-1 h-5 bg-white/[0.04] rounded-full overflow-hidden relative">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(pct, count > 0 ? 4 : 0)}%`, background: color, opacity: 0.85 }} />
                      {count > 0 && (
                        <span className="absolute inset-y-0 left-2 flex items-center text-[9px] font-bold text-white/70">{count}</span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold w-7 text-right flex-shrink-0" style={{ color }}>{pct}%</span>
                  </div>
                )
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-white font-bold text-sm">{crmData?.hot || 0}</p>
                <p className="text-[10px] text-red-400">Hot Leads</p>
              </div>
              <div>
                <p className="text-white font-bold text-sm">{crmData?.thisMonth || 0}</p>
                <p className="text-[10px] text-blue-400">This Month</p>
              </div>
              <div>
                <p className="text-white font-bold text-sm">{funnelData.find(f => f.stage === 'paid')?.count || 0}</p>
                <p className="text-[10px] text-emerald-400">Converted</p>
              </div>
            </div>
          </div>

          {/* Upcoming Team Meetings */}
          <div className="rounded-2xl bg-slate-900/60 border border-white/[0.06] p-5 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-violet-400" /> Team Meetings
                {meetingToday.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-violet-500/20 text-violet-300 rounded-full animate-pulse">
                    {meetingToday.length} today
                  </span>
                )}
              </h2>
              <Link href="/calendar" className="text-[10px] text-violet-400 hover:text-violet-300 flex items-center gap-0.5">
                Calendar <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {meetingToday.length > 0 && (
              <div className="mb-3 p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
                <p className="text-violet-300 text-[10px] font-bold flex items-center gap-1.5 mb-1.5">
                  <Bell className="w-3 h-3" /> TODAY&apos;S MEETINGS
                </p>
                {meetingToday.map((m: any) => (
                  <div key={m._id} className="flex items-center gap-2 py-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                    <span className="text-white text-[11px] font-medium flex-1 truncate">{m.title}</span>
                    <span className="text-violet-300 text-[10px] flex-shrink-0">{format(new Date(m.scheduledAt), 'hh:mm a')}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex-1 space-y-1.5 overflow-y-auto">
              {upcomingMeetings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <Calendar className="w-8 h-8 text-gray-700" />
                  <p className="text-gray-600 text-xs">No upcoming meetings</p>
                </div>
              ) : upcomingMeetings.map((m: any) => {
                const isToday = new Date(m.scheduledAt).toDateString() === now.toDateString()
                const isTomorrow = new Date(m.scheduledAt).toDateString() === new Date(now.getTime() + 86400000).toDateString()
                const dayLabel = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : format(new Date(m.scheduledAt), 'dd MMM')
                return (
                  <Link key={m._id} href="/calendar"
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04] transition-all group">
                    <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-3.5 h-3.5 text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-[11px] font-semibold truncate">{m.title}</p>
                      <p className="text-gray-500 text-[10px]">{m.createdBy?.name || 'Admin'} · {m.invitees?.length || 0} invitees</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-[10px] font-bold ${isToday ? 'text-violet-400' : 'text-gray-400'}`}>{dayLabel}</p>
                      <p className="text-gray-600 text-[10px]">{format(new Date(m.scheduledAt), 'hh:mm a')}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Tasks Overview */}
          <div className="rounded-2xl bg-slate-900/60 border border-white/[0.06] p-5 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckSquareIcon className="w-4 h-4 text-cyan-400" /> Task Tracker
                {overdueTasks.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full animate-pulse">
                    {overdueTasks.length} overdue
                  </span>
                )}
              </h2>
              <Link href="/kanban" className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5">
                Kanban <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {/* Status bars */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[
                { label: 'To Do',      count: tasksByStatus.todo,       color: 'bg-gray-500',    text: 'text-gray-400' },
                { label: 'In Progress',count: tasksByStatus.inProgress,  color: 'bg-blue-500',    text: 'text-blue-400' },
                { label: 'In Review',  count: tasksByStatus.review,      color: 'bg-amber-500',   text: 'text-amber-400' },
                { label: 'Done',       count: tasksByStatus.done,        color: 'bg-emerald-500', text: 'text-emerald-400' },
              ].map(({ label, count, color, text }) => (
                <div key={label} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
                    <span className="text-gray-500 text-[10px]">{label}</span>
                  </div>
                  <p className={`text-lg font-black ${text}`}>{count}</p>
                </div>
              ))}
            </div>
            {/* Urgent tasks */}
            {urgentTasks.length > 0 ? (
              <div className="flex-1 space-y-1.5 overflow-y-auto">
                <p className="text-[10px] text-red-400 font-bold uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Urgent Tasks
                </p>
                {urgentTasks.map((t: any) => (
                  <Link key={t._id} href="/kanban"
                    className="flex items-center gap-2 p-2 rounded-lg bg-red-500/[0.05] hover:bg-red-500/[0.1] border border-red-500/10 transition-all group">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-[11px] font-medium truncate">{t.title}</p>
                      <p className="text-gray-600 text-[10px]">{t.assignedTo?.name || 'Unassigned'}</p>
                    </div>
                    {t.dueDate && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${new Date(t.dueDate) < now ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-500'}`}>
                        {formatDistanceToNow(new Date(t.dueDate), { addSuffix: true })}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 py-4">
                <CheckCircle className="w-8 h-8 text-emerald-600/50" />
                <p className="text-gray-600 text-xs">No urgent tasks</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Quick Actions ─────────────────────────────────────────────────── */}
        <div className="rounded-2xl bg-slate-900/60 border border-white/[0.06] p-5">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" /> Quick Navigate
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
            {[
              { href: '/users',        icon: Users,        label: 'Users',        c: 'text-blue-400',   b: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/15' },
              { href: '/learners',     icon: GraduationCap,label: 'Learners',     c: 'text-violet-400', b: 'bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/15' },
              { href: '/courses',      icon: BookOpen,     label: 'Courses',      c: 'text-indigo-400', b: 'bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/15' },
              { href: '/live-classes', icon: Video,        label: 'Classes',      c: 'text-emerald-400',b: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/15' },
              { href: '/webinars',     icon: Radio,        label: 'Webinars',     c: 'text-amber-400',  b: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/15' },
              { href: '/recordings',   icon: Monitor,      label: 'Recordings',   c: 'text-cyan-400',   b: 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/15' },
              { href: '/finance',      icon: DollarSign,   label: 'Finance',      c: 'text-green-400',  b: 'bg-green-500/10 hover:bg-green-500/20 border-green-500/15' },
              { href: '/crm',          icon: Flame,        label: 'CRM',          c: 'text-orange-400', b: 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/15' },
              { href: '/analytics',    icon: BarChart2,    label: 'Analytics',    c: 'text-pink-400',   b: 'bg-pink-500/10 hover:bg-pink-500/20 border-pink-500/15' },
              { href: '/support',      icon: HeadphonesIcon,label:'Support',      c: 'text-red-400',    b: 'bg-red-500/10 hover:bg-red-500/20 border-red-500/15' },
              { href: '/packages',     icon: Package,      label: 'Packages',     c: 'text-purple-400', b: 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/15' },
              { href: '/notifications',icon: Bell,         label: 'Notify',       c: 'text-yellow-400', b: 'bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/15' },
              { href: '/marketing',    icon: TrendingUp,   label: 'Marketing',    c: 'text-teal-400',   b: 'bg-teal-500/10 hover:bg-teal-500/20 border-teal-500/15' },
              { href: '/reports',      icon: Layers,       label: 'Reports',      c: 'text-slate-300',  b: 'bg-white/5 hover:bg-white/10 border-white/10' },
              { href: '/achievements', icon: Award,        label: 'Achievements', c: 'text-gold-400',   b: 'bg-yellow-600/10 hover:bg-yellow-600/20 border-yellow-600/15' },
              { href: '/settings',     icon: Zap,          label: 'Settings',     c: 'text-gray-400',   b: 'bg-white/5 hover:bg-white/10 border-white/10' },
            ].map(item => (
              <Link key={item.href} href={item.href}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all group ${item.b}`}>
                <item.icon className={`w-5 h-5 ${item.c} group-hover:scale-110 transition-transform`} />
                <span className="text-[10px] text-gray-400 group-hover:text-white transition-colors font-medium text-center leading-tight">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </AdminLayout>
  )
}
