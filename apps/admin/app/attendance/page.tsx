'use client'
import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { adminAPI } from '@/lib/api'
import AdminLayout from '@/components/AdminLayout'
import {
  Calendar, ChevronLeft, ChevronRight, Users, UserCheck, UserX,
  Clock, Save, Loader2, Sun, TrendingUp, Award, AlertTriangle,
  BarChart2, Zap,
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

const STATUS_CFG = {
  present:   { label: 'Present',  short: 'P',  ring: 'ring-green-500/40',  bg: 'bg-green-500/15 border-green-500/25',  text: 'text-green-400',  dot: 'bg-green-400' },
  absent:    { label: 'Absent',   short: 'A',  ring: 'ring-red-500/40',    bg: 'bg-red-500/15 border-red-500/25',      text: 'text-red-400',    dot: 'bg-red-400' },
  'half-day':{ label: 'Half Day', short: 'H',  ring: 'ring-amber-500/40',  bg: 'bg-amber-500/15 border-amber-500/25',  text: 'text-amber-400',  dot: 'bg-amber-400' },
  leave:     { label: 'Leave',    short: 'L',  ring: 'ring-blue-500/40',   bg: 'bg-blue-500/15 border-blue-500/25',    text: 'text-blue-400',   dot: 'bg-blue-400' },
  holiday:   { label: 'Holiday',  short: 'HO', ring: 'ring-purple-500/40', bg: 'bg-purple-500/15 border-purple-500/25',text: 'text-purple-400', dot: 'bg-purple-400' },
}

function getDaysInMonth(year: number, month: number) { return new Date(year, month, 0).getDate() }
function isSunday(year: number, month: number, day: number) { return new Date(year, month - 1, day).getDay() === 0 }
function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function CircleProgress({ pct, size = 44 }: { pct: number; size?: number }) {
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  const color = pct >= 90 ? '#4ade80' : pct >= 75 ? '#fbbf24' : '#f87171'
  return (
    <svg width={size} height={size} className="flex-shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={3} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={3}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x={size / 2} y={size / 2 + 4} textAnchor="middle" fontSize={10} fontWeight="700" fill={color}>{pct}%</text>
    </svg>
  )
}

export default function AttendancePage() {
  const qc = useQueryClient()
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [year, setYear] = useState(today.getFullYear())
  const [userType, setUserType] = useState<'employee' | 'mentor'>('employee')
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [pendingChanges, setPendingChanges] = useState<Record<string, { status: string; leaveType?: string }>>({})
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const days = getDaysInMonth(year, month)

  const { data: summaryData, isLoading } = useQuery({
    queryKey: ['attendance-summary', month, year, userType],
    queryFn: () => adminAPI.attendanceSummary({ month, year, userType }).then(r => r.data),
  })

  const { data: detailData } = useQuery({
    queryKey: ['attendance-detail', selectedUser, month, year],
    queryFn: () => adminAPI.attendance({ userId: selectedUser, month, year }).then(r => r.data),
    enabled: !!selectedUser,
  })

  const { data: hData } = useQuery({
    queryKey: ['holidays', year],
    queryFn: () => adminAPI.holidays({ year }).then(r => r.data),
  })

  const holidaySet = useMemo(() => {
    const s = new Set<string>()
    for (const h of (hData?.holidays || [])) {
      const d = new Date(h.date)
      s.add(dateKey(year, month, d.getDate()))
    }
    return s
  }, [hData, month, year])

  const recordMap = useMemo(() => {
    const m: Record<string, any> = {}
    for (const r of (detailData?.records || [])) {
      const d = new Date(r.date)
      m[dateKey(d.getFullYear(), d.getMonth() + 1, d.getDate())] = r
    }
    return m
  }, [detailData])

  const summary: any[] = summaryData?.summary || []

  const filtered = useMemo(() =>
    summary.filter(s => !search || s.user.name?.toLowerCase().includes(search.toLowerCase())),
    [summary, search])

  // Analytics derived from summary
  const analytics = useMemo(() => {
    if (!summary.length) return { avgPct: 0, perfect: 0, lowPct: 0, totalPresent: 0, totalAbsent: 0, totalLeave: 0 }
    const avg = summary.reduce((a, s) => {
      const pct = s.workingDays > 0 ? (s.present + s.halfDay * 0.5) / s.workingDays * 100 : 0
      return a + pct
    }, 0) / summary.length
    return {
      avgPct: Math.round(avg),
      perfect: summary.filter(s => s.workingDays > 0 && s.absent === 0 && s.halfDay === 0).length,
      lowPct: summary.filter(s => {
        const pct = s.workingDays > 0 ? (s.present + s.halfDay * 0.5) / s.workingDays * 100 : 0
        return pct < 75 && s.workingDays > 0
      }).length,
      totalPresent: summary.reduce((a, s) => a + s.present, 0),
      totalAbsent: summary.reduce((a, s) => a + s.absent, 0),
      totalLeave: summary.reduce((a, s) => a + s.paidLeave, 0),
    }
  }, [summary])

  const navMonth = (dir: number) => {
    let m = month + dir, y = year
    if (m < 1) { m = 12; y-- }
    if (m > 12) { m = 1; y++ }
    setMonth(m); setYear(y)
    setPendingChanges({})
  }

  const setStatus = (day: number, status: string, leaveType?: string) => {
    const key = dateKey(year, month, day)
    setPendingChanges(prev => ({ ...prev, [key]: { status, leaveType } }))
  }

  const saveChanges = async () => {
    if (!selectedUser || !Object.keys(pendingChanges).length) return
    setSaving(true)
    try {
      const entries = Object.entries(pendingChanges).map(([dateStr, val]) => ({
        userId: selectedUser, userType, date: dateStr, status: val.status, leaveType: val.leaveType,
      }))
      await adminAPI.bulkMarkAttendance({ entries, date: entries[0].date })
      for (const e of entries.slice(1)) await adminAPI.markAttendance(e)
      qc.invalidateQueries({ queryKey: ['attendance-summary', month, year, userType] })
      qc.invalidateQueries({ queryKey: ['attendance-detail', selectedUser, month, year] })
      setPendingChanges({})
      toast.success('Attendance saved!')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Save failed')
    } finally { setSaving(false) }
  }

  const selectedSummary = summary.find(s => s.user._id === selectedUser)

  const kpiCards = [
    {
      icon: Users, label: 'Team Size', value: summary.length,
      sub: userType === 'employee' ? 'Employees' : 'Mentors',
      color: 'from-violet-600/20 to-violet-600/5', border: 'border-violet-500/20', text: 'text-violet-400',
    },
    {
      icon: TrendingUp, label: 'Avg Attendance', value: `${analytics.avgPct}%`,
      sub: MONTHS[month],
      color: analytics.avgPct >= 90 ? 'from-green-600/20 to-green-600/5' : analytics.avgPct >= 75 ? 'from-amber-600/20 to-amber-600/5' : 'from-red-600/20 to-red-600/5',
      border: analytics.avgPct >= 90 ? 'border-green-500/20' : analytics.avgPct >= 75 ? 'border-amber-500/20' : 'border-red-500/20',
      text: analytics.avgPct >= 90 ? 'text-green-400' : analytics.avgPct >= 75 ? 'text-amber-400' : 'text-red-400',
    },
    {
      icon: Award, label: 'Perfect Attendance', value: analytics.perfect,
      sub: '0 absent this month',
      color: 'from-emerald-600/20 to-emerald-600/5', border: 'border-emerald-500/20', text: 'text-emerald-400',
    },
    {
      icon: UserCheck, label: 'Total Present Days', value: analytics.totalPresent,
      sub: 'Across all staff',
      color: 'from-blue-600/20 to-blue-600/5', border: 'border-blue-500/20', text: 'text-blue-400',
    },
    {
      icon: UserX, label: 'Total Absent Days', value: analytics.totalAbsent,
      sub: 'Across all staff',
      color: 'from-red-600/20 to-red-600/5', border: 'border-red-500/20', text: 'text-red-400',
    },
    {
      icon: AlertTriangle, label: 'Low Attendance', value: analytics.lowPct,
      sub: 'Below 75%',
      color: 'from-orange-600/20 to-orange-600/5', border: 'border-orange-500/20', text: 'text-orange-400',
    },
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Calendar className="w-6 h-6 text-violet-400" /> Attendance Management
            </h1>
            <p className="text-gray-500 text-sm mt-1">Track daily attendance for employees & mentors</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navMonth(-1)} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-white border border-white/10 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-white font-bold min-w-[140px] text-center bg-slate-800 border border-white/10 px-4 py-2 rounded-xl">
              {MONTHS[month]} {year}
            </span>
            <button onClick={() => navMonth(1)} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-white border border-white/10 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {kpiCards.map(card => (
            <div key={card.label} className={`rounded-2xl border bg-gradient-to-br p-4 ${card.color} ${card.border} flex flex-col gap-2`}>
              <div className="flex items-center justify-between">
                <card.icon className={`w-4 h-4 ${card.text}`} />
              </div>
              <div className={`text-2xl font-black ${card.text}`}>{card.value}</div>
              <div>
                <p className="text-white text-xs font-semibold">{card.label}</p>
                <p className="text-gray-500 text-[10px]">{card.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bar chart: team attendance distribution */}
        {summary.length > 0 && (
          <div className="bg-slate-800 rounded-2xl border border-white/5 p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="w-4 h-4 text-violet-400" />
              <h3 className="text-white font-semibold text-sm">Team Attendance — {MONTHS[month]} {year}</h3>
              <span className="ml-auto text-gray-500 text-xs">{summary.length} members</span>
            </div>
            <div className="flex items-end gap-1.5 h-24 overflow-x-auto pb-2">
              {summary.map((s: any) => {
                const pct = s.workingDays > 0 ? Math.round((s.present + s.halfDay * 0.5) / s.workingDays * 100) : 0
                const color = pct >= 90 ? 'bg-green-500' : pct >= 75 ? 'bg-amber-500' : 'bg-red-500'
                return (
                  <div key={s.user._id} className="flex flex-col items-center gap-1 flex-shrink-0" style={{ minWidth: 28 }}>
                    <span className="text-[9px] text-gray-500">{pct}%</span>
                    <div className={`w-5 rounded-t-md ${color} opacity-80 hover:opacity-100 transition-opacity`}
                      style={{ height: `${Math.max(4, pct * 0.6)}px` }}
                      title={`${s.user.name}: ${pct}%`} />
                    <span className="text-[9px] text-gray-600 truncate max-w-[28px]">{s.user.name?.split(' ')[0]}</span>
                  </div>
                )
              })}
            </div>
            {/* Legend */}
            <div className="flex items-center gap-4 mt-3 text-[10px] text-gray-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500" /> ≥90% Excellent</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-500" /> 75–89% Good</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500" /> &lt;75% Low</span>
            </div>
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex bg-slate-800 rounded-xl p-1 border border-white/10">
            {(['employee', 'mentor'] as const).map(t => (
              <button key={t} onClick={() => { setUserType(t); setSelectedUser(null); setSearch('') }}
                className={clsx('px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all',
                  userType === t ? 'bg-violet-600 text-white shadow' : 'text-gray-400 hover:text-white')}>
                {t === 'employee' ? '👤 Employees' : '🎓 Mentors'}
              </button>
            ))}
          </div>
          {/* legend */}
          <div className="flex items-center gap-3 ml-auto flex-wrap">
            {Object.entries(STATUS_CFG).map(([k, v]) => (
              <div key={k} className="flex items-center gap-1.5">
                <span className={clsx('w-2.5 h-2.5 rounded-full', v.dot)} />
                <span className="text-xs text-gray-400">{v.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: User list */}
          <div className="lg:col-span-1 bg-slate-800 rounded-2xl border border-white/5 overflow-hidden">
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-violet-400" />
                  {userType === 'employee' ? 'Employees' : 'Mentors'}
                  <span className="text-gray-500 font-normal">({filtered.length})</span>
                </p>
              </div>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name..."
                className="w-full bg-slate-700/50 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-violet-500 placeholder-gray-600" />
            </div>
            <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-violet-400 mx-auto" /></div>
              ) : filtered.length === 0 ? (
                <div className="p-8 text-center text-gray-600 text-sm">No {userType}s found</div>
              ) : filtered.map((s: any) => {
                const uid = s.user._id
                const isSelected = selectedUser === uid
                const pct = s.workingDays > 0 ? Math.round((s.present + s.halfDay * 0.5) / s.workingDays * 100) : 0
                return (
                  <button key={uid} onClick={() => { setSelectedUser(uid); setPendingChanges({}) }}
                    className={clsx('w-full text-left p-4 hover:bg-white/5 transition-all', isSelected && 'bg-violet-500/10 border-l-4 border-violet-500')}>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <CircleProgress pct={pct} size={44} />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="text-[10px] font-black text-transparent">{pct}%</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{s.user.name}</p>
                        <p className="text-[10px] text-gray-500 capitalize">{s.user.department || s.user.role}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-green-400 font-medium">{s.present}P</span>
                          <span className="text-[10px] text-red-400 font-medium">{s.absent}A</span>
                          <span className="text-[10px] text-amber-400 font-medium">{s.halfDay}H</span>
                          <span className="text-[10px] text-blue-400 font-medium">{s.paidLeave}L</span>
                        </div>
                      </div>
                    </div>
                    {/* stacked bar */}
                    <div className="flex gap-0.5 mt-2.5 rounded-full overflow-hidden h-1.5">
                      {s.workingDays > 0 && [
                        { v: s.present,   color: 'bg-green-500' },
                        { v: s.halfDay,   color: 'bg-amber-500' },
                        { v: s.paidLeave, color: 'bg-blue-500' },
                        { v: s.absent,    color: 'bg-red-500' },
                      ].map((b, i) => (
                        b.v > 0 && <div key={i} className={`h-full ${b.color}`}
                          style={{ width: `${(b.v / s.workingDays) * 100}%` }} />
                      ))}
                      <div className="flex-1 bg-white/5" />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right: Calendar */}
          <div className="lg:col-span-2">
            {!selectedUser ? (
              <div className="bg-slate-800 border border-white/5 rounded-2xl p-12 text-center h-full flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-violet-400/50" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-medium">Select a team member</p>
                  <p className="text-gray-600 text-xs mt-1">Click any name on the left to mark attendance</p>
                </div>
              </div>
            ) : (
              <div className="bg-slate-800 border border-white/5 rounded-2xl overflow-hidden">
                {/* User header */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between gap-3 flex-wrap">
                  {selectedSummary && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 text-white"
                        style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                        {selectedSummary.user.name?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{selectedSummary.user.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {[
                            { v: selectedSummary.present, label: 'Present', color: 'text-green-400 bg-green-500/10' },
                            { v: selectedSummary.absent, label: 'Absent', color: 'text-red-400 bg-red-500/10' },
                            { v: selectedSummary.halfDay, label: 'Half', color: 'text-amber-400 bg-amber-500/10' },
                            { v: selectedSummary.paidLeave, label: 'Leave', color: 'text-blue-400 bg-blue-500/10' },
                            { v: selectedSummary.holidayDays, label: 'Holiday', color: 'text-purple-400 bg-purple-500/10' },
                          ].map(b => (
                            <span key={b.label} className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg ${b.color}`}>{b.v} {b.label}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {Object.keys(pendingChanges).length > 0 && (
                      <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                        {Object.keys(pendingChanges).length} unsaved
                      </span>
                    )}
                    <button onClick={saveChanges} disabled={saving || !Object.keys(pendingChanges).length}
                      className={clsx('flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all',
                        Object.keys(pendingChanges).length ? 'bg-violet-600 hover:bg-violet-700 text-white' : 'bg-white/5 text-gray-600 cursor-not-allowed')}>
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save
                    </button>
                  </div>
                </div>

                {/* Calendar grid */}
                <div className="p-4">
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                      <div key={d} className={clsx('text-center text-[11px] font-bold py-2 rounded-lg', d === 'Sun' ? 'text-red-400 bg-red-500/5' : 'text-gray-500')}>
                        {d}
                      </div>
                    ))}
                  </div>
                  {(() => {
                    const firstDay = new Date(year, month - 1, 1).getDay()
                    const cells = []
                    for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} />)

                    for (let d = 1; d <= days; d++) {
                      const key = dateKey(year, month, d)
                      const isSun = isSunday(year, month, d)
                      const isHol = holidaySet.has(key)
                      const pending = pendingChanges[key]
                      const saved = recordMap[key]
                      const status = pending?.status || saved?.status
                      const isFuture = new Date(year, month - 1, d) > today
                      const isToday = d === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear()

                      const cfg = status ? STATUS_CFG[status as keyof typeof STATUS_CFG] : null
                      let cellBg = 'bg-slate-700/40 border-white/5'
                      if (isToday) cellBg = 'bg-violet-500/10 border-violet-500/30'
                      else if (isSun || isHol) cellBg = 'bg-purple-500/8 border-purple-500/15'
                      else if (cfg) cellBg = cfg.bg

                      cells.push(
                        <div key={d} className={clsx('border rounded-xl p-1.5 min-h-[70px] flex flex-col transition-all', cellBg,
                          isFuture && !isToday ? 'opacity-35' : '',
                          isToday ? 'ring-1 ring-violet-500/50' : '')}>
                          <div className="flex items-center justify-between mb-1">
                            <span className={clsx('text-xs font-bold', isSun ? 'text-red-400' : isToday ? 'text-violet-300' : 'text-gray-300')}>{d}</span>
                            {isToday && <span className="text-[8px] text-violet-400 font-bold">TODAY</span>}
                            {(isSun || isHol) && !isToday && <Sun className="w-2.5 h-2.5 text-purple-400" />}
                          </div>

                          {isSun ? (
                            <span className="text-[9px] text-purple-400 font-medium">Sunday</span>
                          ) : isHol ? (
                            <span className="text-[9px] text-purple-400 font-medium">Holiday</span>
                          ) : !isFuture ? (
                            <select value={status || ''} onChange={e => {
                              const v = e.target.value
                              setStatus(d, v, v === 'leave' ? 'casual' : undefined)
                            }}
                              className="text-[10px] bg-transparent border-none outline-none w-full cursor-pointer text-gray-300 mt-auto leading-tight">
                              <option value="">—</option>
                              <option value="present">Present</option>
                              <option value="absent">Absent</option>
                              <option value="half-day">Half Day</option>
                              <option value="leave">Leave</option>
                            </select>
                          ) : null}

                          {status === 'leave' && !isSun && !isHol && (
                            <select value={pending?.leaveType || saved?.leaveType || 'casual'}
                              onChange={e => setStatus(d, 'leave', e.target.value)}
                              className="text-[9px] bg-transparent border-none outline-none w-full cursor-pointer text-blue-300 mt-0.5">
                              <option value="casual">Casual</option>
                              <option value="sick">Sick</option>
                              <option value="earned">Earned</option>
                              <option value="unpaid">Unpaid</option>
                            </select>
                          )}

                          {status && !isSun && !isHol && cfg && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', cfg.dot)} />
                              <span className={clsx('text-[9px] font-bold', cfg.text)}>{cfg.short}{pending ? ' •' : ''}</span>
                            </div>
                          )}
                        </div>
                      )
                    }
                    return <div className="grid grid-cols-7 gap-1">{cells}</div>
                  })()}
                </div>

                {/* Quick mark */}
                <div className="px-4 pb-4 flex flex-wrap gap-2 items-center border-t border-white/5 pt-4">
                  <span className="text-xs text-gray-500">Quick mark:</span>
                  {(['present', 'absent'] as const).map(s => (
                    <button key={s} onClick={() => {
                      const changes: Record<string, any> = {}
                      for (let d = 1; d <= days; d++) {
                        const key = dateKey(year, month, d)
                        if (!isSunday(year, month, d) && !holidaySet.has(key) && new Date(year, month - 1, d) <= today) {
                          changes[key] = { status: s }
                        }
                      }
                      setPendingChanges(prev => ({ ...prev, ...changes }))
                    }}
                      className={clsx('text-xs px-3 py-1.5 rounded-xl border font-semibold transition-colors',
                        s === 'present' ? 'border-green-500/40 text-green-400 hover:bg-green-500/10' : 'border-red-500/40 text-red-400 hover:bg-red-500/10')}>
                      All {s === 'present' ? 'Present' : 'Absent'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Monthly Summary Table */}
        {summary.length > 0 && (
          <div className="bg-slate-800 border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-violet-400" />
                Monthly Summary — {MONTHS[month]} {year}
              </h2>
              <span className="text-gray-500 text-xs">{summary.length} records</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-slate-700/30">
                    {['Name', 'Dept', 'Working', 'Present', 'Absent', 'Half Day', 'Paid Leave', 'Unpaid', 'Holidays', 'Payable', 'Attendance'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {summary.map((s: any) => {
                    const pct = s.workingDays > 0 ? Math.round((s.present + s.halfDay * 0.5) / s.workingDays * 100) : 0
                    return (
                      <tr key={s.user._id}
                        onClick={() => { setSelectedUser(s.user._id); setPendingChanges({}); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                        className="hover:bg-white/3 transition-colors cursor-pointer">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white flex-shrink-0"
                              style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                              {s.user.name?.[0]}
                            </div>
                            <span className="text-white font-medium text-xs">{s.user.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs capitalize">{s.user.department || s.user.role}</td>
                        <td className="px-4 py-3 text-gray-300 font-medium text-xs">{s.workingDays}</td>
                        <td className="px-4 py-3 text-green-400 font-bold text-xs">{s.present}</td>
                        <td className="px-4 py-3 text-red-400 font-bold text-xs">{s.absent}</td>
                        <td className="px-4 py-3 text-amber-400 font-medium text-xs">{s.halfDay}</td>
                        <td className="px-4 py-3 text-blue-400 font-medium text-xs">{s.paidLeave}</td>
                        <td className="px-4 py-3 text-gray-500 font-medium text-xs">{s.unpaid}</td>
                        <td className="px-4 py-3 text-purple-400 font-medium text-xs">{s.holidayDays}</td>
                        <td className="px-4 py-3 text-violet-400 font-bold text-xs">{s.payable.toFixed(1)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-600 rounded-full overflow-hidden min-w-[40px]">
                              <div className={clsx('h-full rounded-full', pct >= 90 ? 'bg-green-500' : pct >= 75 ? 'bg-amber-500' : 'bg-red-500')}
                                style={{ width: `${pct}%` }} />
                            </div>
                            <span className={clsx('text-xs font-bold whitespace-nowrap',
                              pct >= 90 ? 'text-green-400' : pct >= 75 ? 'text-amber-400' : 'text-red-400')}>
                              {pct}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
