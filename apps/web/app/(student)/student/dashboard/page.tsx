'use client'
import { useQuery } from '@tanstack/react-query'
import { userAPI, classAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { BookOpen, Video, Award, Wallet, TrendingUp, Clock, Play, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-sm text-gray-400">{label}</p>
      </div>
    </div>
  )
}

export default function StudentDashboard() {
  const { user } = useAuthStore()
  const { data: enrollments } = useQuery({ queryKey: ['enrolled'], queryFn: () => userAPI.enrolledCourses().then(r => r.data.enrollments) })
  const { data: classesData } = useQuery({ queryKey: ['upcoming-classes'], queryFn: () => classAPI.upcoming().then(r => r.data.classes) })
  const { data: userData } = useQuery({ queryKey: ['user-me'], queryFn: () => userAPI.me().then(r => r.data.user) })

  const completed = enrollments?.filter((e: any) => e.progressPercent === 100)?.length || 0
  const inProgress = enrollments?.filter((e: any) => e.progressPercent > 0 && e.progressPercent < 100)?.length || 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
        <p className="text-gray-400 mt-1">Continue your learning journey</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="Enrolled Courses" value={enrollments?.length || 0} color="bg-blue-500/20 text-blue-400" />
        <StatCard icon={TrendingUp} label="In Progress" value={inProgress} color="bg-yellow-500/20 text-yellow-400" />
        <StatCard icon={Award} label="Completed" value={completed} color="bg-green-500/20 text-green-400" />
        <StatCard icon={Wallet} label="Wallet Balance" value={`₹${userData?.wallet || 0}`} color="bg-purple-500/20 text-purple-400" />
      </div>

      {/* Upcoming Classes */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Upcoming Live Classes</h2>
          <Link href="/student/classes" className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="space-y-3">
          {classesData?.slice(0, 3).map((cls: any) => (
            <div key={cls._id} className="flex items-center justify-between p-3 bg-dark-700 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center">
                  <Video className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <p className="font-medium text-white text-sm">{cls.title}</p>
                  <p className="text-xs text-gray-400">{cls.course?.title} • {format(new Date(cls.scheduledAt), 'dd MMM, hh:mm a')}</p>
                </div>
              </div>
              <Link href={`/student/classes`} className="btn-primary text-xs py-2 px-4">Join</Link>
            </div>
          )) || <p className="text-gray-400 text-sm">No upcoming classes scheduled.</p>}
        </div>
      </div>

      {/* Continue Learning */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Continue Learning</h2>
          <Link href="/student/courses" className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
            All Courses <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {enrollments?.filter((e: any) => e.progressPercent < 100).slice(0, 4).map((e: any) => (
            <Link key={e._id} href={`/student/courses/${e.course._id}`}
              className="flex items-center gap-3 p-3 bg-dark-700 rounded-xl hover:bg-dark-600 transition-colors">
              <img src={e.course?.thumbnail || '/placeholder.jpg'} alt="" className="w-12 h-12 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm truncate">{e.course?.title}</p>
                <div className="mt-1">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                    <span>Progress</span><span>{e.progressPercent}%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full" style={{ width: `${e.progressPercent}%` }} />
                  </div>
                </div>
              </div>
              <Play className="w-4 h-4 text-primary-400 flex-shrink-0" />
            </Link>
          )) || <p className="text-gray-400 text-sm col-span-2">No courses in progress. <Link href="/courses" className="text-primary-400">Browse courses →</Link></p>}
        </div>
      </div>
    </div>
  )
}
