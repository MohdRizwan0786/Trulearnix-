'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { courseAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import toast from 'react-hot-toast'
import { FileText, Clock, CheckCircle, XCircle, Upload, BookOpen, AlertCircle, Calendar, Users } from 'lucide-react'
import Link from 'next/link'

const STATUS_CONFIG: Record<string, { color: string; icon: any; label: string; bg: string; border: string }> = {
  pending:        { color: '#fbbf24', icon: Clock,         label: 'Submitted',     bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.25)'  },
  reviewed:       { color: '#4ade80', icon: CheckCircle,   label: 'Reviewed',      bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.25)'   },
  overdue:        { color: '#f87171', icon: XCircle,       label: 'Overdue',       bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.25)'   },
  'not-submitted':{ color: '#9ca3af', icon: AlertCircle,   label: 'Not Submitted', bg: 'rgba(156,163,175,0.08)', border: 'rgba(156,163,175,0.15)' },
}

export default function AssignmentsPage() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'pending' | 'submitted' | 'all'>('all')

  const { data: enrollments = [], isLoading: loadingEnrollments } = useQuery({
    queryKey: ['enrollments'],
    queryFn: () => courseAPI.enrolled().then(r => r.data.data || []),
  })

  const courseIds: string[] = enrollments.map((e: any) => e.course?._id || e.course).filter(Boolean)

  const { data: assignments = [], isLoading: loadingAssignments } = useQuery({
    queryKey: ['assignments', courseIds],
    enabled: courseIds.length > 0,
    queryFn: async () => {
      const results = await Promise.all(
        courseIds.map((id: string) =>
          courseAPI.assignments(id)
            .then(r => (r.data.assignments || []).map((a: any) => ({ ...a, courseName: enrollments.find((e: any) => (e.course?._id || e.course) === id)?.course?.title || 'Unknown Course' })))
            .catch(() => [])
        )
      )
      return results.flat()
    },
  })

  const getMySubmission = (a: any) => a.submissions?.find((s: any) => s.student === (user as any)?._id || s.student?._id === (user as any)?._id)

  const getStatus = (a: any): string => {
    const sub = getMySubmission(a)
    if (sub) return sub.status
    if (a.dueDate && new Date(a.dueDate) < new Date()) return 'overdue'
    return 'not-submitted'
  }

  const filtered = assignments.filter(a => {
    const status = getStatus(a)
    if (activeTab === 'pending') return status === 'not-submitted'
    if (activeTab === 'submitted') return status === 'pending' || status === 'reviewed'
    return true
  })

  const stats = {
    total: assignments.length,
    submitted: assignments.filter(a => getMySubmission(a)).length,
    reviewed: assignments.filter(a => getMySubmission(a)?.status === 'reviewed').length,
    pending: assignments.filter(a => !getMySubmission(a) && (a.dueDate ? new Date(a.dueDate) >= new Date() : true)).length,
  }

  if (loadingEnrollments || loadingAssignments) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="rounded-2xl h-28 animate-pulse" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="rounded-2xl h-20 animate-pulse" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }} />)}
        </div>
      </div>
    )
  }

  if (courseIds.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <BookOpen className="w-10 h-10 text-indigo-400/50" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">No Enrolled Courses</h2>
        <p className="text-gray-400 mb-6">Enroll in courses to see assignments from your mentor</p>
        <Link href="/courses" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-bold hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 8px 25px rgba(99,102,241,0.3)' }}>
          Browse Courses
        </Link>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes dueGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.3); }
          50% { box-shadow: 0 0 12px 3px rgba(239,68,68,0.1); }
        }
        .overdue-card { animation: dueGlow 2s infinite; }
      `}</style>

      <div className="space-y-6 max-w-4xl pb-8">

        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl p-6" style={{
          background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(251,146,60,0.08))',
          border: '1px solid rgba(245,158,11,0.2)'
        }}>
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(245,158,11,0.2)' }} />
          <div className="relative">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.2)' }}>
                <FileText className="w-4 h-4 text-amber-400" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">Assignments</h1>
            </div>
            <p className="text-gray-400 text-sm">From your mentor — track and submit your work</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.25)' }}>
                From Mentor
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: stats.total, color: '#e5e7eb', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.1)' },
            { label: 'Pending', value: stats.pending, color: '#fbbf24', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
            { label: 'Submitted', value: stats.submitted, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.2)' },
            { label: 'Reviewed', value: stats.reviewed, color: '#4ade80', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4 text-center" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{s.label}</p>
              <p className="text-3xl font-black" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl self-start w-fit" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {([['all', 'All'], ['pending', 'Pending'], ['submitted', 'Submitted']] as const).map(([t, label]) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === t ? 'text-white' : 'text-gray-400 hover:text-white'}`}
              style={activeTab === t ? { background: 'linear-gradient(135deg, rgba(99,102,241,0.4), rgba(139,92,246,0.3))' } : {}}>
              {label}
            </button>
          ))}
        </div>

        {/* Assignments */}
        <div className="space-y-3">
          {filtered.map((a: any) => {
            const sub = getMySubmission(a)
            const status = getStatus(a)
            const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['not-submitted']
            const isOverdue = status === 'overdue'
            const Icon = cfg.icon

            return (
              <div key={a._id} className={`rounded-2xl p-5 transition-all hover:scale-[1.005] ${isOverdue ? 'overdue-card' : ''}`}
                style={{ background: 'rgba(13,13,20,0.95)', border: `1px solid ${isOverdue ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.07)'}` }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                      <FileText className="w-5 h-5" style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <h3 className="text-white font-black">{a.title}</h3>
                        <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full"
                          style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                          <Icon className="w-3 h-3" /> {cfg.label}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-2.5 line-clamp-2">{a.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-indigo-400/60" />{a.courseName}
                        </span>
                        {a.dueDate && (
                          <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-400 font-semibold' : ''}`}>
                            <Calendar className="w-3 h-3" />Due: {new Date(a.dueDate).toLocaleDateString()}
                          </span>
                        )}
                        <span className="text-gray-600">Max: {a.maxScore} pts</span>
                      </div>

                      {/* Submission info */}
                      {sub && (
                        <div className="mt-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-gray-400">Submitted: {new Date(sub.submittedAt).toLocaleDateString()}</p>
                              {sub.fileName && <p className="text-xs mt-0.5 font-medium" style={{ color: '#818cf8' }}>{sub.fileName}</p>}
                            </div>
                            {sub.score !== undefined && (
                              <div className="text-right">
                                <p className="font-black text-lg" style={{
                                  color: sub.score >= a.maxScore * 0.8 ? '#4ade80' : sub.score >= a.maxScore * 0.6 ? '#fbbf24' : '#f87171'
                                }}>{sub.score}/{a.maxScore}</p>
                                <p className="text-[10px] text-gray-500">Score</p>
                              </div>
                            )}
                          </div>
                          {sub.feedback && (
                            <div className="mt-2 pt-2 border-t border-white/5">
                              <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Mentor Feedback</p>
                              <p className="text-sm text-gray-300">{sub.feedback}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {!sub && !isOverdue && (
                    <Link href={`/student/courses?assignment=${a._id}`}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90 flex-shrink-0"
                      style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' }}>
                      <Upload className="w-3.5 h-3.5" /> Submit
                    </Link>
                  )}
                </div>
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div className="rounded-2xl text-center py-16" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-20 text-gray-400" />
              <p className="text-gray-500">No assignments {activeTab !== 'all' ? `in ${activeTab}` : ''} yet</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
