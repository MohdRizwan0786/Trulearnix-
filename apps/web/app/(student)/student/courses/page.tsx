'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userAPI, packageAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import {
  BookOpen, Play, CheckCircle, Clock, ChevronRight,
  Sparkles, Lock, ArrowRight, Search, Users, BarChart2,
  GraduationCap, Flame, Star, Filter, Layers, Pin, Info
} from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

type Tab = 'enrolled' | 'available'
type FilterType = 'all' | 'inprogress' | 'completed'

export default function LearnerCoursesPage() {
  const { user } = useAuthStore()
  const [tab, setTab] = useState<Tab>('enrolled')
  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')
  const qc = useQueryClient()

  const { data: enrolledData, isLoading: loadingEnrolled } = useQuery({
    queryKey: ['enrolled-courses'],
    queryFn: () => userAPI.enrolledCourses().then(r => r.data.enrollments)
  })
  const { data: availableData, isLoading: loadingAvail } = useQuery({
    queryKey: ['available-courses'],
    queryFn: () => userAPI.availableCourses().then(r => r.data)
  })

  const enrollMutation = useMutation({
    mutationFn: (courseId: string) => userAPI.enrollFree(courseId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enrolled-courses'] })
      qc.invalidateQueries({ queryKey: ['available-courses'] })
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Enroll nahi ho paya'
      toast.error(msg)
    },
  })

  const enrollStatus = availableData?.enrollStatus || { cap: 2, activeCount: 0, remainingSlots: 2, canEnroll: true }
  const tier = availableData?.packageTier || 'free'
  const { data: pkgs } = useQuery({ queryKey: ['packages'], queryFn: () => packageAPI.getAll().then(r => r.data.packages), staleTime: 10 * 60 * 1000 })
  const tierDisplayName = pkgs?.find((p: any) => p.tier === tier)?.name || tier
  // Available tab is only for users on a paid package — affiliate status alone
  // does NOT grant package access.
  const isPaid = tier !== 'free'
  const available: any[] = availableData?.courses || []

  const filtered = (enrolledData || []).filter((e: any) => {
    const matchFilter = filter === 'all' ? true : filter === 'inprogress' ? (e.progressPercent > 0 && e.progressPercent < 100) : e.progressPercent === 100
    const matchSearch = !search || e.course?.title?.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const filteredAvail = available.filter(c => !search || c.title?.toLowerCase().includes(search.toLowerCase()))
  const completedCount = (enrolledData || []).filter((e: any) => e.progressPercent === 100).length
  const inProgressCount = (enrolledData || []).filter((e: any) => e.progressPercent > 0 && e.progressPercent < 100).length

  return (
    <>
      <style>{`
        @keyframes cardGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
          50% { box-shadow: 0 0 20px 2px rgba(99,102,241,0.1); }
        }
        .course-card:hover { animation: cardGlow 2s ease-in-out; }
      `}</style>

      <div className="space-y-6 max-w-5xl pb-8">

        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8" style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.12) 100%)',
          border: '1px solid rgba(99,102,241,0.2)'
        }}>
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(139,92,246,0.2)' }} />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">My Learning</h1>
              <p className="text-gray-400 text-sm mt-1">Track progress, keep growing</p>
            </div>
            <Link href="/courses"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-all self-start sm:self-auto"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 8px 25px rgba(99,102,241,0.3)' }}>
              <BookOpen className="w-4 h-4" /> Browse More Courses
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: BookOpen, label: 'Enrolled', value: enrolledData?.length || 0, color: '#818cf8', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.2)' },
            { icon: Flame, label: 'In Progress', value: inProgressCount, color: '#fb923c', bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.2)' },
            { icon: GraduationCap, label: 'Completed', value: completedCount, color: '#4ade80', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.2)' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4 text-center transition-all hover:scale-[1.02]"
              style={{ background: s.bg, border: `1px solid ${s.border}` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2.5"
                style={{ background: `${s.color}20` }}>
                <s.icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <p className="text-2xl font-black text-white">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs + Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex rounded-2xl p-1 self-start" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <button onClick={() => setTab('enrolled')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'enrolled' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
              style={tab === 'enrolled' ? { background: 'linear-gradient(135deg, rgba(99,102,241,0.4), rgba(139,92,246,0.3))', boxShadow: '0 4px 15px rgba(99,102,241,0.2)' } : {}}>
              My Courses
              <span className="ml-1.5 text-xs opacity-60">{enrolledData?.length || 0}</span>
            </button>
            {isPaid && (
              <button onClick={() => setTab('available')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 ${tab === 'available' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                style={tab === 'available' ? { background: 'linear-gradient(135deg, rgba(99,102,241,0.4), rgba(139,92,246,0.3))', boxShadow: '0 4px 15px rgba(99,102,241,0.2)' } : {}}>
                <Sparkles className="w-3.5 h-3.5" />
                Available
                {available.length > 0 && (
                  <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full font-black" style={{ background: 'rgba(99,102,241,0.3)', color: '#a5b4fc' }}>{available.length}</span>
                )}
              </button>
            )}
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search courses..."
              className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
          </div>
        </div>

        {/* Enrolled Tab */}
        {tab === 'enrolled' && (
          <>
            <div className="flex gap-2 flex-wrap">
              {([
                { key: 'all', label: 'All', icon: Filter },
                { key: 'inprogress', label: 'In Progress', icon: Flame },
                { key: 'completed', label: 'Completed', icon: CheckCircle },
              ] as const).map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    filter === f.key
                      ? 'text-white border-indigo-500/40'
                      : 'text-gray-400 border-white/8 hover:text-white hover:border-white/15'
                  }`}
                  style={filter === f.key ? { background: 'rgba(99,102,241,0.2)' } : { background: 'rgba(255,255,255,0.04)' }}>
                  <f.icon className="w-3 h-3" />
                  {f.label}
                </button>
              ))}
            </div>

            {loadingEnrolled ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={<BookOpen className="w-12 h-12 text-gray-700 mx-auto mb-4" />}
                title="No courses found"
                desc={search ? 'Try a different search term.' : 'Enroll in a course to start learning.'}
                action={<Link href="/courses" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-all"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  Browse Courses <ArrowRight className="w-4 h-4" />
                </Link>}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((e: any) => <EnrolledCard key={e._id} enrollment={e} />)}
              </div>
            )}
          </>
        )}

        {/* Available Tab */}
        {tab === 'available' && (
          <>
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl" style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))',
                border: '1px solid rgba(99,102,241,0.2)'
              }}>
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="text-sm text-indigo-300 font-bold">{tierDisplayName} Plan</span>
                <span className="text-xs text-gray-400">— Enroll for free</span>
              </div>
              <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm ${
                enrollStatus.canEnroll
                  ? 'text-emerald-300'
                  : 'text-amber-300'
              }`} style={{
                background: enrollStatus.canEnroll ? 'rgba(16,185,129,0.10)' : 'rgba(245,158,11,0.10)',
                border: `1px solid ${enrollStatus.canEnroll ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.30)'}`
              }}>
                {enrollStatus.canEnroll ? <Sparkles className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                <span className="font-bold">
                  {enrollStatus.activeCount}/{enrollStatus.cap} active courses
                </span>
                <span className="text-xs opacity-80">
                  {enrollStatus.canEnroll
                    ? `${enrollStatus.remainingSlots} slot${enrollStatus.remainingSlots === 1 ? '' : 's'} left`
                    : 'Slots full'}
                </span>
              </div>
            </div>

            {!enrollStatus.canEnroll && (
              <div className="rounded-xl px-4 py-3 text-xs flex gap-3" style={{
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.20)',
                color: '#fcd34d'
              }}>
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  Aap ek saath sirf {enrollStatus.cap} non-compulsory courses mein enroll ho sakte hain.
                  Pehle koi ek course poora karein, fir agla course unlock hoga.
                  Compulsory courses hamesha free aur automatically enroll hote hain — woh is limit mein nahi aate.
                </span>
              </div>
            )}

            {loadingAvail ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : filteredAvail.length === 0 ? (
              <EmptyState
                icon={<CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />}
                title="All caught up!"
                desc="You've enrolled in all available courses."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAvail.map((course: any) => (
                  <AvailableCard
                    key={course._id}
                    course={course}
                    locked={!enrollStatus.canEnroll && !course.isCompulsory}
                    onEnroll={() => enrollMutation.mutateAsync(course._id)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {!isPaid && (
          <div className="rounded-2xl p-5 relative overflow-hidden" style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.08))',
            border: '1px solid rgba(99,102,241,0.25)'
          }}>
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-2xl pointer-events-none" style={{ background: 'rgba(139,92,246,0.2)' }} />
            <div className="relative flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)' }}>
                <Lock className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="font-black text-white">Unlock Package Courses</h3>
                <p className="text-sm text-gray-400 mt-1">Upgrade your plan to enroll in all courses included in your package at no extra cost.</p>
                <Link href="/packages"
                  className="inline-flex items-center gap-2 mt-3 px-5 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-all"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 8px 25px rgba(99,102,241,0.3)' }}>
                  View Plans <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="aspect-video" style={{ background: 'rgba(255,255,255,0.06)' }} />
      <div className="p-4 space-y-3">
        <div className="h-4 rounded w-3/4" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <div className="h-3 rounded w-1/2" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>
    </div>
  )
}

function EmptyState({ icon, title, desc, action }: { icon: React.ReactNode; title: string; desc: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl text-center py-16 px-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      {icon}
      <p className="text-gray-300 font-bold mb-1">{title}</p>
      <p className="text-gray-500 text-sm mb-4">{desc}</p>
      {action}
    </div>
  )
}

function EnrolledCard({ enrollment: e }: { enrollment: any }) {
  const done = e.progressPercent === 100
  const lessonCount = e.course?.lessons?.length || 0

  return (
    <Link href={`/student/courses/${e.course?._id}`}
      className="course-card group rounded-2xl overflow-hidden flex flex-col transition-all hover:-translate-y-1"
      style={{ background: 'rgba(13,13,20,0.95)', border: '1px solid rgba(255,255,255,0.06)' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.35)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'}>

      <div className="relative aspect-video overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
        {e.course?.thumbnail
          ? <img src={e.course.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))' }}>
              <BookOpen className="w-10 h-10 text-indigo-600" />
            </div>
        }
        {done ? (
          <div className="absolute inset-0 flex items-center justify-center backdrop-blur-[2px]" style={{ background: 'rgba(16,185,129,0.4)' }}>
            <div className="text-center">
              <CheckCircle className="w-10 h-10 text-green-300 mx-auto" />
              <p className="text-green-200 text-xs font-bold mt-1">Completed!</p>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-xl"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 8px 25px rgba(99,102,241,0.5)' }}>
              <Play className="w-5 h-5 text-white ml-0.5" />
            </div>
          </div>
        )}
        {e.course?.category && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg text-xs text-gray-300 font-medium"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
            {e.course.category}
          </div>
        )}
        {(e.course?.isCompulsory || e.source === 'compulsory') && !done && (
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg text-[10px] font-black text-white flex items-center gap-1"
            style={{ background: 'rgba(245,158,11,0.9)' }}
            title="Compulsory course — included with your plan">
            <Pin className="w-2.5 h-2.5" /> Required
          </div>
        )}
        <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-lg text-xs font-black ${
          done ? 'text-white' : e.progressPercent > 0 ? 'text-white' : 'text-gray-300'
        }`} style={{
          background: done ? 'rgba(34,197,94,0.9)' : e.progressPercent > 0 ? 'rgba(99,102,241,0.9)' : 'rgba(0,0,0,0.6)'
        }}>
          {e.progressPercent || 0}%
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-white text-sm line-clamp-2 group-hover:text-indigo-300 transition-colors flex-1 leading-snug">
          {e.course?.title}
        </h3>
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
          {lessonCount > 0 && <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{lessonCount} lessons</span>}
          {e.course?.level && <span className="capitalize flex items-center gap-1"><BarChart2 className="w-3 h-3" />{e.course.level}</span>}
        </div>
        {e.batch && (
          <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg w-fit"
            style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <Layers className="w-3 h-3 text-violet-400 flex-shrink-0" />
            <span className="text-xs font-semibold text-violet-300">{e.batch.label || `Batch ${e.batch.batchNumber}`}</span>
          </div>
        )}
        <div className="mt-3 space-y-1.5">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full transition-all" style={{
              width: `${e.progressPercent || 0}%`,
              background: done ? '#22c55e' : 'linear-gradient(90deg, #6366f1, #8b5cf6)'
            }} />
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold flex items-center gap-1 ${done ? 'text-green-400' : 'text-indigo-400'}`}>
              {done ? <><CheckCircle className="w-3 h-3" /> Completed</> : e.progressPercent > 0 ? <><Play className="w-3 h-3" /> Continue</> : 'Start Learning'}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-indigo-400 transition-colors" />
          </div>
        </div>
      </div>
    </Link>
  )
}

function AvailableCard({ course, onEnroll, locked }: { course: any; onEnroll: () => Promise<any>; locked?: boolean }) {
  const [done, setDone] = useState(false)
  const [enrolling, setEnrolling] = useState(false)

  const handle = async () => {
    setEnrolling(true)
    try { await onEnroll(); setDone(true) } catch {}
    setEnrolling(false)
  }

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col transition-all hover:-translate-y-1"
      style={{ background: 'rgba(13,13,20,0.95)', border: '1px solid rgba(255,255,255,0.06)', opacity: locked ? 0.7 : 1 }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.35)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'}>
      <div className="relative aspect-video overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
        {course.thumbnail
          ? <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(99,102,241,0.15))' }}>
              <BookOpen className="w-10 h-10 text-violet-600" />
            </div>
        }
        {course.category && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg text-xs text-gray-300"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
            {course.category}
          </div>
        )}
        {course.isCompulsory ? (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-lg text-xs font-black text-white flex items-center gap-1"
            style={{ background: 'rgba(245,158,11,0.95)' }}>
            <Pin className="w-3 h-3" /> Required
          </div>
        ) : (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-lg text-xs font-black text-white"
            style={{ background: 'rgba(139,92,246,0.9)' }}>
            Free Enroll
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-white text-sm line-clamp-2 flex-1 leading-snug">{course.title}</h3>
        <div className="flex items-center gap-3 mt-2 mb-4 text-xs text-gray-500">
          <span className="capitalize flex items-center gap-1"><BarChart2 className="w-3 h-3" />{course.level || 'Beginner'}</span>
          {course.lessons?.length > 0 && <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{course.lessons.length} lessons</span>}
        </div>

        {done ? (
          <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border"
            style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80', borderColor: 'rgba(34,197,94,0.25)' }}>
            <CheckCircle className="w-4 h-4" /> Enrolled! Open Course
          </div>
        ) : locked ? (
          <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border"
            style={{ background: 'rgba(245,158,11,0.08)', color: '#fcd34d', borderColor: 'rgba(245,158,11,0.25)' }}
            title="Complete one of your active courses to unlock a new slot.">
            <Lock className="w-4 h-4" /> Slots full
          </div>
        ) : (
          <button onClick={handle} disabled={enrolling}
            className="w-full py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 15px rgba(99,102,241,0.25)' }}>
            {enrolling
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enrolling...</>
              : <><Sparkles className="w-4 h-4" /> Enroll for Free</>}
          </button>
        )}
      </div>
    </div>
  )
}
