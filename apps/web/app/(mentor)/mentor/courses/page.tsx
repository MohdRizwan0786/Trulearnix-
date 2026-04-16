'use client'
import { useQuery } from '@tanstack/react-query'
import { mentorAPI } from '@/lib/api'
import { BookOpen, Users, Settings, GraduationCap, TrendingUp, Star } from 'lucide-react'
import Link from 'next/link'

const levelConfig: Record<string, { label: string; color: string; bg: string }> = {
  beginner:     { label: 'Beginner',     color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/25' },
  intermediate: { label: 'Intermediate', color: 'text-amber-400',   bg: 'bg-amber-500/15 border-amber-500/25'   },
  advanced:     { label: 'Advanced',     color: 'text-red-400',     bg: 'bg-red-500/15 border-red-500/25'       },
}

export default function MentorCoursesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['mentor-courses'],
    queryFn: () => mentorAPI.courses().then(r => r.data)
  })

  const courses = data?.courses || []

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-1">My Teaching</p>
          <h1 className="text-2xl md:text-3xl font-black text-white">Assigned Courses</h1>
          <p className="text-gray-500 text-sm mt-1">Courses assigned to you by admin</p>
        </div>
        {!isLoading && courses.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span className="text-indigo-300 font-bold text-sm">{courses.length} Course{courses.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="rounded-2xl bg-[#0f0f1a] border border-white/[0.06] overflow-hidden animate-pulse">
              <div className="h-44 bg-white/[0.04]" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-white/[0.04] rounded-lg w-3/4" />
                <div className="h-3 bg-white/[0.03] rounded-lg w-1/2" />
                <div className="h-8 bg-white/[0.03] rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-3xl bg-[#0f0f1a] border border-white/[0.06]">
          <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center mb-5">
            <BookOpen className="w-9 h-9 text-indigo-400/60" />
          </div>
          <p className="text-white font-bold text-lg">No courses assigned yet</p>
          <p className="text-gray-500 text-sm mt-2 text-center max-w-xs">Admin will assign courses to you soon. Check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {courses.map((item: any, i: number) => {
            const course  = item.courseId
            if (!course) return null
            const enrolled= course.enrolledCount || 0
            const max     = item.maxStudents || 100
            const pct     = Math.min(Math.round((enrolled / max) * 100), 100)
            const lvlCfg  = levelConfig[course.level] || { label: course.level, color: 'text-gray-400', bg: 'bg-white/[0.05] border-white/[0.08]' }

            return (
              <div key={i}
                className="group rounded-2xl bg-[#0f0f1a] border border-white/[0.06] hover:border-indigo-500/25 transition-all duration-300 overflow-hidden hover:shadow-xl hover:shadow-indigo-500/5">

                {/* Thumbnail */}
                <div className="relative h-44 overflow-hidden">
                  {course.thumbnail
                    ? <img src={course.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    : <div className="w-full h-full bg-gradient-to-br from-indigo-900/50 via-violet-900/40 to-[#0a0a0f] flex items-center justify-center">
                        <BookOpen className="w-14 h-14 text-indigo-500/30" />
                      </div>
                  }
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f1a] via-transparent to-transparent opacity-70" />

                  {/* Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                    {course.level && (
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border backdrop-blur-sm ${lvlCfg.bg} ${lvlCfg.color}`}>
                        {lvlCfg.label}
                      </span>
                    )}
                    <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10 ml-auto">
                      <Users className="w-3 h-3 text-gray-300" />
                      <span className="text-[11px] text-gray-300 font-semibold">{enrolled}</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-white text-sm leading-snug line-clamp-2 group-hover:text-indigo-300 transition-colors mb-2">
                    {course.title}
                  </h3>
                  {course.description && (
                    <p className="text-gray-500 text-xs line-clamp-2 mb-3 leading-relaxed">{course.description}</p>
                  )}

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1.5">
                      <span>Enrollment Capacity</span>
                      <span className="font-semibold text-gray-400">{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                      <span>{enrolled} enrolled</span>
                      <span>Max {max}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link href={`/mentor/courses/${course._id}`}
                      className="flex items-center justify-center gap-1.5 flex-1 py-2.5 bg-indigo-500/12 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/35 rounded-xl text-indigo-400 text-xs font-bold transition-all">
                      <Settings className="w-3.5 h-3.5" /> Manage
                    </Link>
                    <Link href={`/mentor/students?course=${course._id}`}
                      className="flex items-center justify-center gap-1.5 flex-1 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] rounded-xl text-gray-400 hover:text-white text-xs font-bold transition-all">
                      <GraduationCap className="w-3.5 h-3.5" /> Students
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
