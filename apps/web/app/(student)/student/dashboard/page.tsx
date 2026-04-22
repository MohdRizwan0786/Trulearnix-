'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userAPI, classAPI, packageAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import {
  BookOpen, Video, Award, Timer, Play, ChevronRight,
  Flame, Zap, Pause, RotateCcw, CheckCircle,
  TrendingUp, Lock, ArrowRight, Sparkles, Target,
  Megaphone, Heart, Bell, ArrowUpCircle, Coffee,
  Star, BarChart2, Users, Clock, Rocket, Crown
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

const FOCUS_MINS = 25
const BREAK_MINS = 5

function FocusTimer() {
  const [mode, setMode] = useState<'focus' | 'break'>('focus')
  const [seconds, setSeconds] = useState(FOCUS_MINS * 60)
  const [running, setRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setSessions(Number(localStorage.getItem('focusSessions') || '0'))
  }, [])

  const totalSecs = mode === 'focus' ? FOCUS_MINS * 60 : BREAK_MINS * 60
  const pct = ((totalSecs - seconds) / totalSecs) * 100
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0')
  const secs = (seconds % 60).toString().padStart(2, '0')
  const circumference = 2 * Math.PI * 54

  const reset = useCallback(() => {
    setRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
    setSeconds(mode === 'focus' ? FOCUS_MINS * 60 : BREAK_MINS * 60)
  }, [mode])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current!)
            setRunning(false)
            if (mode === 'focus') {
              setSessions(prev => { const next = prev + 1; localStorage.setItem('focusSessions', String(next)); return next })
              setMode('break')
              return BREAK_MINS * 60
            } else {
              setMode('focus')
              return FOCUS_MINS * 60
            }
          }
          return s - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, mode])

  const strokeColor = mode === 'focus'
    ? 'url(#focusGrad)'
    : '#34d399'

  return (
    <>
      <style>{`
        @keyframes timerPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.3); }
          50% { box-shadow: 0 0 0 12px rgba(99,102,241,0); }
        }
        .timer-running { animation: timerPulse 2s infinite; }
      `}</style>
      <div className="rounded-2xl overflow-hidden" style={{
        background: 'linear-gradient(135deg, rgba(79,70,229,0.18) 0%, rgba(139,92,246,0.12) 100%)',
        border: '1px solid rgba(99,102,241,0.3)'
      }}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Timer className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <span className="text-sm font-bold text-white">Pomodoro Timer</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => { setMode('focus'); reset() }}
                className={`text-[10px] px-2 py-1 rounded-lg font-bold transition-all ${mode === 'focus' ? 'bg-indigo-500/30 text-indigo-300' : 'text-gray-500 hover:text-gray-300'}`}>
                Focus
              </button>
              <button onClick={() => { setMode('break'); reset() }}
                className={`text-[10px] px-2 py-1 rounded-lg font-bold transition-all ${mode === 'break' ? 'bg-green-500/30 text-green-300' : 'text-gray-500 hover:text-gray-300'}`}>
                Break
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className={`relative w-28 h-28 flex-shrink-0 ${running ? 'timer-running' : ''} rounded-full`}>
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <defs>
                  <linearGradient id="focusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#a78bfa" />
                  </linearGradient>
                </defs>
                <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(99,102,241,0.1)" strokeWidth="8" />
                <circle
                  cx="60" cy="60" r="54" fill="none"
                  stroke={strokeColor}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - (pct / 100) * circumference}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-white tabular-nums">{mins}:{secs}</span>
                <span className="text-[9px] text-gray-400 uppercase tracking-wider">{mode}</span>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <button onClick={reset} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all">
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setRunning(r => !r)}
                  className={`flex-1 h-9 rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs transition-all ${running
                    ? 'bg-white/10 text-white'
                    : 'text-white shadow-lg shadow-indigo-500/25'}`}
                  style={!running ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' } : {}}>
                  {running ? <><Pause className="w-3.5 h-3.5" /> Pause</> : <><Play className="w-3.5 h-3.5 ml-0.5" /> Start</>}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.2)' }}>
                  <p className="text-lg font-black text-orange-400">{sessions}</p>
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider">sessions</p>
                </div>
                <div className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <p className="text-lg font-black text-indigo-400">{sessions * FOCUS_MINS}m</p>
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider">focused</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default function LearnerDashboard() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [focusSessions, setFocusSessions] = useState(0)

  useEffect(() => {
    setFocusSessions(Number(localStorage.getItem('focusSessions') || '0'))
  }, [])

  const { data: enrollments } = useQuery({
    queryKey: ['enrolled'],
    queryFn: () => userAPI.enrolledCourses().then(r => r.data.enrollments)
  })
  const { data: classesData } = useQuery({
    queryKey: ['upcoming-classes'],
    queryFn: () => classAPI.upcoming().then(r => r.data.classes)
  })
  const { data: availableData } = useQuery({
    queryKey: ['available-courses'],
    queryFn: () => userAPI.availableCourses().then(r => r.data)
  })
  const { data: annData } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => userAPI.announcements().then(r => r.data),
    staleTime: 5 * 60 * 1000,
  })
  const { data: favData } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => userAPI.favorites().then(r => r.data.favorites),
    staleTime: 5 * 60 * 1000,
  })
  const { data: pkgs } = useQuery({
    queryKey: ['packages'],
    queryFn: () => packageAPI.getAll().then(r => r.data.packages),
    staleTime: 10 * 60 * 1000,
  })

  const enrollMutation = useMutation({
    mutationFn: (courseId: string) => userAPI.enrollFree(courseId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enrolled'] })
      qc.invalidateQueries({ queryKey: ['available-courses'] })
    }
  })

  const completed = enrollments?.filter((e: any) => e.progressPercent === 100)?.length || 0
  const inProgress = enrollments?.filter((e: any) => e.progressPercent > 0 && e.progressPercent < 100) || []
  const tier = (user as any)?.packageTier || 'free'
  const enrollmentsLoaded = enrollments !== undefined
  const isPaid = tier !== 'free' || !!(user as any)?.isAffiliate || !!user?.enrollmentCount
    || !enrollmentsLoaded
    || (enrollments && enrollments.length > 0)
  const available = availableData?.courses || []
  const announcements = annData?.announcements || []
  const favorites = favData || []

  const liveClasses = classesData?.filter((c: any) => c.status === 'live') || []
  const upcomingClasses = classesData?.filter((c: any) => c.status === 'scheduled') || []

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const greetingEmoji = hour < 12 ? '☀️' : hour < 17 ? '⚡' : '🌙'

  const pkgName = (t: string) => pkgs?.find((p: any) => p.tier === t)?.name || t
  const tierConfig: Record<string, { label: string; color: string; bg: string; glow: string }> = {
    free:    { label: pkgName('free'),    color: 'text-gray-400',   bg: 'bg-gray-500/10 border-gray-500/20',     glow: 'rgba(156,163,175,0.3)' },
    starter: { label: pkgName('starter'), color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20',     glow: 'rgba(59,130,246,0.3)' },
    pro:     { label: pkgName('pro'),     color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20', glow: 'rgba(139,92,246,0.3)' },
    elite:   { label: pkgName('elite'),   color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20',   glow: 'rgba(245,158,11,0.3)' },
    supreme: { label: pkgName('supreme'), color: 'text-rose-400',   bg: 'bg-rose-500/10 border-rose-500/20',     glow: 'rgba(244,63,94,0.3)' },
  }
  const tc = tierConfig[tier] || tierConfig.free

  return (
    <>
      <style>{`
        @keyframes blobFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(20px, -20px) scale(1.05); }
          66% { transform: translate(-15px, 15px) scale(0.95); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes liveGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
          50% { box-shadow: 0 0 0 8px rgba(34,197,94,0); }
        }
        .blob-1 { animation: blobFloat 8s ease-in-out infinite; }
        .blob-2 { animation: blobFloat 10s ease-in-out infinite 2s; }
        .blob-3 { animation: blobFloat 12s ease-in-out infinite 4s; }
        .live-dot { animation: liveGlow 1.5s infinite; }
      `}</style>

      <div className="space-y-5 max-w-6xl pb-6">

        {/* ── EPIC Hero Banner ── */}
        <div className="relative overflow-hidden rounded-3xl" style={{
          background: 'linear-gradient(135deg, rgba(79,70,229,0.25) 0%, rgba(139,92,246,0.15) 50%, rgba(217,70,239,0.08) 100%)',
          border: '1px solid rgba(99,102,241,0.25)',
          minHeight: '140px'
        }}>
          {/* Animated blobs */}
          <div className="blob-1 absolute -top-10 -left-10 w-40 h-40 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(99,102,241,0.25)' }} />
          <div className="blob-2 absolute top-0 right-20 w-32 h-32 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(139,92,246,0.2)' }} />
          <div className="blob-3 absolute -bottom-8 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(217,70,239,0.12)' }} />

          <div className="relative p-5 sm:p-7">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-indigo-300/80 text-sm font-medium flex items-center gap-1.5">
                  <span>{greetingEmoji}</span> {greeting}
                </p>
                <h1 className="text-3xl sm:text-4xl font-black text-white mt-1 leading-tight">
                  {user?.name?.split(' ')[0]}!
                </h1>
                <p className="text-gray-400 text-sm mt-1.5">Ready to build something great today?</p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Streak */}
                {((user as any)?.streak || 0) > 0 && (
                  <div className="relative flex items-center gap-2 px-4 py-3 rounded-2xl" style={{
                    background: 'rgba(251,146,60,0.12)',
                    border: '1px solid rgba(251,146,60,0.25)',
                    boxShadow: '0 4px 20px rgba(251,146,60,0.1)'
                  }}>
                    <Flame className="w-5 h-5 text-orange-400" />
                    <div>
                      <p className="text-orange-400 font-black text-xl leading-none">{(user as any).streak}</p>
                      <p className="text-[10px] text-orange-400/60 uppercase tracking-wider">day streak</p>
                    </div>
                  </div>
                )}

                {/* XP */}
                <div className="relative flex items-center gap-2 px-4 py-3 rounded-2xl" style={{
                  background: 'rgba(99,102,241,0.15)',
                  border: '1px solid rgba(99,102,241,0.3)',
                  boxShadow: '0 4px 20px rgba(99,102,241,0.1)'
                }}>
                  <Zap className="w-5 h-5 text-indigo-400" />
                  <div>
                    <p className="text-indigo-400 font-black text-xl leading-none">{(user as any)?.xpPoints || 0}</p>
                    <p className="text-[10px] text-indigo-400/60 uppercase tracking-wider">XP points</p>
                  </div>
                </div>

                {/* Tier Badge */}
                <div className={`px-4 py-3 rounded-2xl border ${tc.bg}`} style={{ boxShadow: `0 4px 20px ${tc.glow}` }}>
                  <p className={`font-black text-sm capitalize ${tc.color}`}>{tc.label}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">plan</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Announcements Banner (From Admin) ── */}
        {announcements.length > 0 && (
          <div className="relative overflow-hidden rounded-2xl px-5 py-3.5 flex items-center gap-4" style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))',
            border: '1px solid rgba(99,102,241,0.25)'
          }}>
            <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <Bell className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-indigo-400/70 uppercase tracking-wider">From Admin</span>
              <p className="text-white text-sm font-semibold truncate">{announcements[0].title}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded-full font-bold">{announcements.length}</span>
              <Link href="/student/announcements" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}

        {/* ── Live Now Banner ── */}
        {liveClasses.length > 0 && (
          <div className="relative overflow-hidden rounded-2xl p-4 sm:p-5" style={{
            background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.08))',
            border: '1px solid rgba(34,197,94,0.3)'
          }}>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="live-dot w-3 h-3 bg-green-400 rounded-full flex-shrink-0" />
                <div>
                  <span className="text-xs font-black text-green-400 uppercase tracking-widest">Live Now</span>
                  <p className="text-white font-bold mt-0.5">{liveClasses[0].title}</p>
                  <p className="text-green-300/60 text-xs">with {liveClasses[0].mentor?.name}</p>
                </div>
              </div>
              <Link href={`/student/classes/${liveClasses[0]._id}`}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 4px 20px rgba(34,197,94,0.3)' }}>
                <Play className="w-4 h-4" /> Join Now
              </Link>
            </div>
          </div>
        )}

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: BookOpen,   label: 'Enrolled',    value: enrollments?.length || 0,     color: '#818cf8', from: 'rgba(99,102,241,0.15)', to: 'rgba(99,102,241,0.05)',    border: 'rgba(99,102,241,0.2)' },
            { icon: TrendingUp, label: 'In Progress',  value: inProgress.length,            color: '#a78bfa', from: 'rgba(139,92,246,0.15)', to: 'rgba(139,92,246,0.05)',   border: 'rgba(139,92,246,0.2)' },
            { icon: Award,      label: 'Completed',    value: completed,                    color: '#4ade80', from: 'rgba(34,197,94,0.15)',  to: 'rgba(34,197,94,0.05)',    border: 'rgba(34,197,94,0.2)'  },
            { icon: Timer,      label: 'Focus Today',  value: `${focusSessions * FOCUS_MINS}m`, color: '#fb923c', from: 'rgba(251,146,60,0.15)', to: 'rgba(251,146,60,0.05)', border: 'rgba(251,146,60,0.2)' },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl p-4 flex items-center gap-3 hover:scale-[1.02] transition-all cursor-default"
              style={{ background: `linear-gradient(135deg, ${s.from}, ${s.to})`, border: `1px solid ${s.border}` }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${s.color}20` }}>
                <s.icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-2xl font-black text-white leading-none">{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Left — 2/3 */}
          <div className="lg:col-span-2 space-y-5">

            {/* Available to Enroll */}
            {isPaid && available.length > 0 && (
              <section className="rounded-2xl overflow-hidden" style={{
                background: 'rgba(13,13,20,0.95)',
                border: '1px solid rgba(255,255,255,0.06)'
              }}>
                <div className="flex items-center justify-between p-5 border-b border-white/5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">Available to Enroll</h2>
                      <p className="text-xs text-gray-500">Included in your {tc.label} plan</p>
                    </div>
                  </div>
                  <Link href="/student/courses" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium bg-indigo-500/10 px-3 py-1.5 rounded-lg">
                    View all <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="p-4 space-y-2">
                  {available.slice(0, 4).map((course: any) => (
                    <div key={course._id} className="flex items-center gap-3 p-3 rounded-xl transition-all group cursor-pointer hover:scale-[1.01]"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="w-12 h-12 rounded-xl flex-shrink-0 overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))' }}>
                        {course.thumbnail
                          ? <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
                          : <BookOpen className="w-5 h-5 text-indigo-400 m-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">{course.title}</p>
                        <p className="text-xs text-gray-500 capitalize">{course.level || 'Beginner'}</p>
                      </div>
                      <button
                        onClick={() => enrollMutation.mutate(course._id)}
                        disabled={enrollMutation.isPending}
                        className="flex-shrink-0 px-4 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-90 disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}>
                        Enroll
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Free user CTA */}
            {!isPaid && (
              <div className="rounded-2xl p-6 relative overflow-hidden" style={{
                background: 'linear-gradient(135deg, rgba(79,70,229,0.18) 0%, rgba(139,92,246,0.1) 100%)',
                border: '1px solid rgba(99,102,241,0.3)'
              }}>
                <div className="absolute top-0 right-0 w-48 h-48 opacity-10" style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />
                <div className="relative flex items-start gap-5">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.2))', border: '1px solid rgba(99,102,241,0.4)' }}>
                    <Lock className="w-7 h-7 text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-white text-xl">Unlock Your Full Potential</h3>
                    <p className="text-sm text-gray-400 mt-1.5">Get instant access to all courses, live classes, AI coach, certificates and more.</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {['All Courses', 'Live Classes', 'AI Coach', 'Certificates'].map(f => (
                        <span key={f} className="flex items-center gap-1 text-xs text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                          <CheckCircle className="w-3 h-3" /> {f}
                        </span>
                      ))}
                    </div>
                    <Link href="/packages" className="inline-flex items-center gap-2 mt-4 px-6 py-3 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 8px 25px rgba(99,102,241,0.35)' }}>
                      View Plans <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Continue Learning */}
            <section className="rounded-2xl overflow-hidden" style={{
              background: 'rgba(13,13,20,0.95)',
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center">
                    <Target className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Continue Learning</h2>
                    <p className="text-xs text-gray-500">{inProgress.length} course{inProgress.length !== 1 ? 's' : ''} in progress</p>
                  </div>
                </div>
                <Link href="/student/courses" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium bg-indigo-500/10 px-3 py-1.5 rounded-lg">
                  All <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              {inProgress.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/4 flex items-center justify-center mx-auto mb-3">
                    <BookOpen className="w-7 h-7 text-gray-600" />
                  </div>
                  <p className="text-gray-500 text-sm">No courses in progress.</p>
                  <Link href="/courses" className="text-indigo-400 text-sm mt-2 inline-block hover:text-indigo-300 font-medium">
                    Browse courses →
                  </Link>
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {inProgress.slice(0, 3).map((e: any) => (
                    <Link key={e._id} href={`/student/courses/${e.course?._id}`}
                      className="flex items-center gap-3 p-3.5 rounded-xl transition-all group hover:scale-[1.01]"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        {e.course?.thumbnail
                          ? <img src={e.course.thumbnail} alt="" className="w-full h-full object-cover" />
                          : <BookOpen className="w-5 h-5 text-gray-600 m-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm truncate group-hover:text-indigo-300 transition-colors">{e.course?.title}</p>
                        <div className="mt-2">
                          <div className="flex justify-between text-[10px] mb-1">
                            <span className="text-gray-500">Progress</span>
                            <span className="text-indigo-400 font-bold">{e.progressPercent}%</span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                            <div className="h-full rounded-full transition-all" style={{
                              width: `${e.progressPercent}%`,
                              background: 'linear-gradient(90deg, #6366f1, #8b5cf6)'
                            }} />
                          </div>
                        </div>
                      </div>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110"
                        style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)' }}>
                        <Play className="w-4 h-4 text-indigo-400 ml-0.5" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Upcoming Live Classes */}
            <section className="rounded-2xl overflow-hidden" style={{
              background: 'rgba(13,13,20,0.95)',
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/15 flex items-center justify-center">
                    <Video className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Upcoming Live Classes</h2>
                    <p className="text-xs text-gray-500">From your mentor</p>
                  </div>
                </div>
                <Link href="/student/classes" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium bg-indigo-500/10 px-3 py-1.5 rounded-lg">
                  All <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              {upcomingClasses.length > 0 ? (
                <div className="p-4 space-y-2">
                  {upcomingClasses.slice(0, 3).map((cls: any) => (
                    <div key={cls._id} className="flex items-center gap-3 p-3.5 rounded-xl transition-all"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.2)' }}>
                        <Video className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{cls.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{cls.scheduledAt ? format(new Date(cls.scheduledAt), 'dd MMM, h:mm a') : 'Scheduled'}</span>
                          {cls.mentor?.name && <span className="text-cyan-400/60">· {cls.mentor.name}</span>}
                        </div>
                      </div>
                      <Link href="/student/classes"
                        className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-90"
                        style={{ background: 'rgba(6,182,212,0.15)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.2)' }}>
                        Remind
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Video className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No upcoming live classes.</p>
                </div>
              )}
            </section>
          </div>

          {/* Right — 1/3 */}
          <div className="space-y-4">
            <FocusTimer />

            {/* Quick Actions Grid */}
            <div className="rounded-2xl overflow-hidden" style={{
              background: 'rgba(13,13,20,0.95)',
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              <div className="px-4 pt-4 pb-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" /> Quick Access
                </h3>
              </div>
              <div className="px-2 pb-3 space-y-0.5">
                {[
                  { href: '/student/courses',      icon: BookOpen,      label: 'My Courses',    sub: `${enrollments?.length || 0} enrolled`,  color: '#818cf8', bg: 'rgba(99,102,241,0.1)' },
                  { href: '/student/favorites',    icon: Heart,         label: 'Favorites',     sub: `${favorites.length} saved`,              color: '#f87171', bg: 'rgba(239,68,68,0.08)' },
                  { href: '/student/certificates', icon: Award,         label: 'Certificates',  sub: `${completed} earned`,                   color: '#fbbf24', bg: 'rgba(245,158,11,0.1)' },
                  { href: '/student/ai-coach',     icon: Sparkles,      label: 'AI Coach',      sub: 'Ask anything',                           color: '#c084fc', bg: 'rgba(192,132,252,0.08)' },
                  { href: '/student/community',    icon: Users,         label: 'Community',     sub: 'Connect & grow',                         color: '#34d399', bg: 'rgba(52,211,153,0.08)' },
                  { href: '/student/upgrade',      icon: ArrowUpCircle, label: 'Upgrade Plan',  sub: 'Unlock more',                            color: '#60a5fa', bg: 'rgba(96,165,250,0.08)' },
                ].map(item => (
                  <Link key={item.href} href={item.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all group">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                      style={{ background: item.bg }}>
                      <item.icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-300 group-hover:text-white transition-colors font-medium">{item.label}</p>
                      <p className="text-[10px] text-gray-600">{item.sub}</p>
                    </div>
                    <ChevronRight className="w-3 h-3 text-gray-700 group-hover:text-gray-400 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Milestone Card */}
            {completed > 0 && (
              <div className="rounded-2xl p-5 text-center relative overflow-hidden" style={{
                background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.08))',
                border: '1px solid rgba(34,197,94,0.25)',
                boxShadow: '0 8px 30px rgba(34,197,94,0.1)'
              }}>
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl" style={{ background: 'rgba(34,197,94,0.2)' }} />
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.3)' }}>
                    <Award className="w-7 h-7 text-green-400" />
                  </div>
                  <p className="text-4xl font-black text-white">{completed}</p>
                  <p className="text-sm text-green-300 font-bold mt-1">Course{completed > 1 ? 's' : ''} Completed</p>
                  <Link href="/student/certificates"
                    className="inline-flex items-center gap-1 mt-3 text-xs text-green-400 hover:text-green-300 font-semibold bg-green-500/10 px-3 py-1.5 rounded-lg">
                    View certificates <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
