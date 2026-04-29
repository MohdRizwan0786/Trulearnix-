'use client'
import { useQuery } from '@tanstack/react-query'
import { mentorAPI } from '@/lib/api'
import { useSearchParams } from 'next/navigation'
import { Users, Search, GraduationCap, Phone, Mail, BookOpen, Star } from 'lucide-react'
import { useState, Suspense } from 'react'
import { format } from 'date-fns'
import { usePackages } from '@/lib/tiers'

const tierConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  free:    { label: 'Free',    color: 'text-gray-400',   bg: 'bg-gray-500/10',   border: 'border-gray-500/20'   },
  starter: { label: 'Starter', color: 'text-blue-400',   bg: 'bg-blue-500/15',   border: 'border-blue-500/25'   },
  pro:     { label: 'Pro',     color: 'text-violet-400', bg: 'bg-violet-500/15', border: 'border-violet-500/25' },
  elite:   { label: 'Elite',   color: 'text-amber-400',  bg: 'bg-amber-500/15',  border: 'border-amber-500/25'  },
  supreme: { label: 'Supreme', color: 'text-pink-400',   bg: 'bg-pink-500/15',   border: 'border-pink-500/25'   },
}

function StudentsContent() {
  const searchParams    = useSearchParams()
  const courseId        = searchParams.get('course') || ''
  const [search, setSearch]               = useState('')
  const [selectedCourse, setSelectedCourse] = useState(courseId)

  const { data: coursesData } = useQuery({
    queryKey: ['mentor-courses'],
    queryFn: () => mentorAPI.courses().then(r => r.data)
  })
  const courses = coursesData?.courses || []

  const { data, isLoading } = useQuery({
    queryKey: ['mentor-students', selectedCourse],
    queryFn: () => mentorAPI.courseStudents(selectedCourse).then(r => r.data),
    enabled: !!selectedCourse,
  })
  const { getName: getPkgName } = usePackages()

  const students = (data?.students || []).filter((e: any) =>
    !search ||
    e.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.user?.email?.toLowerCase().includes(search.toLowerCase())
  )

  const avatarColors = [
    'from-indigo-500 to-violet-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-pink-500 to-rose-600',
    'from-cyan-500 to-blue-600',
  ]

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <p className="text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-1">My Students</p>
        <h1 className="text-2xl md:text-3xl font-black text-white">Students</h1>
        <p className="text-gray-500 text-sm mt-1">Students enrolled in your assigned courses</p>
      </div>

      {/* Course Selector */}
      {courses.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Select Course</p>
          <div className="flex flex-wrap gap-2">
            {courses.map((item: any) => {
              const course = item.courseId
              if (!course) return null
              const isSelected = selectedCourse === course._id
              return (
                <button key={course._id}
                  onClick={() => setSelectedCourse(course._id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all border ${
                    isSelected
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/35 shadow-md shadow-indigo-500/10'
                      : 'bg-white/[0.03] text-gray-400 border-white/[0.07] hover:text-white hover:bg-white/[0.05]'
                  }`}>
                  <BookOpen className="w-3.5 h-3.5" />
                  {course.title}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {!selectedCourse ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-3xl bg-[#0f0f1a] border border-white/[0.06]">
          <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center mb-5">
            <GraduationCap className="w-9 h-9 text-emerald-400/60" />
          </div>
          <p className="text-white font-bold text-lg">Select a course</p>
          <p className="text-gray-500 text-sm mt-2">Choose a course above to view enrolled students</p>
        </div>
      ) : (
        <>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full bg-[#0f0f1a] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-20 bg-[#0f0f1a] rounded-2xl animate-pulse border border-white/[0.04]" />
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-3xl bg-[#0f0f1a] border border-white/[0.06]">
              <Users className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-400 font-semibold">{search ? 'No students match search' : 'No students enrolled yet'}</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Count */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 font-semibold">
                  <span className="text-white font-bold">{students.length}</span> student{students.length !== 1 ? 's' : ''} enrolled
                </p>
              </div>

              {students.map((e: any, i: number) => {
                const tier    = e.user?.packageTier || 'free'
                const tierCfg = tierConfig[tier] || tierConfig.free
                const colorIdx= i % avatarColors.length

                return (
                  <div key={i}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-[#0f0f1a] border border-white/[0.05] hover:border-indigo-500/15 transition-all">

                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {e.user?.avatar
                        ? <img src={e.user.avatar} className="w-11 h-11 rounded-2xl object-cover border border-white/10" />
                        : <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${avatarColors[colorIdx]} flex items-center justify-center shadow-md`}>
                            <span className="text-white font-bold text-sm">{e.user?.name?.[0]?.toUpperCase() || '?'}</span>
                          </div>
                      }
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-white text-sm">{e.user?.name}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tierCfg.bg} ${tierCfg.color} ${tierCfg.border}`}>
                          {getPkgName(tier)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1">
                        {e.user?.email && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />{e.user.email}
                          </span>
                        )}
                        {e.user?.phone && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" />{e.user.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Enrolled date */}
                    {e.createdAt && (
                      <div className="flex-shrink-0 text-right hidden sm:block">
                        <p className="text-[11px] text-gray-600">Joined</p>
                        <p className="text-xs text-gray-400 font-semibold">{format(new Date(e.createdAt), 'MMM d, yyyy')}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function MentorStudentsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <p className="text-gray-500 text-sm">Loading students...</p>
      </div>
    }>
      <StudentsContent />
    </Suspense>
  )
}
