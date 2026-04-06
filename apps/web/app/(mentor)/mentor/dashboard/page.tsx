'use client'
import { useQuery } from '@tanstack/react-query'
import { courseAPI, classAPI, walletAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { BookOpen, Users, DollarSign, Video, Plus, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default function MentorDashboard() {
  const { user } = useAuthStore()
  const { data: courses } = useQuery({ queryKey: ['mentor-courses'], queryFn: () => courseAPI.myMentorCourses().then(r => r.data.courses) })
  const { data: classes } = useQuery({ queryKey: ['mentor-classes'], queryFn: () => classAPI.upcoming().then(r => r.data.classes) })
  const { data: wallet } = useQuery({ queryKey: ['mentor-wallet'], queryFn: () => walletAPI.get().then(r => r.data) })

  const totalStudents = courses?.reduce((sum: number, c: any) => sum + c.enrolledCount, 0) || 0
  const publishedCourses = courses?.filter((c: any) => c.status === 'published')?.length || 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Welcome, {user?.name?.split(' ')[0]}! 👨‍🏫</h1>
        <p className="text-gray-400 mt-1">Manage your courses and track performance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: BookOpen, label: 'Published Courses', value: publishedCourses, color: 'bg-blue-500/20 text-blue-400' },
          { icon: Users, label: 'Total Students', value: totalStudents, color: 'bg-green-500/20 text-green-400' },
          { icon: Video, label: 'Upcoming Classes', value: classes?.length || 0, color: 'bg-purple-500/20 text-purple-400' },
          { icon: DollarSign, label: 'Wallet Balance', value: `₹${wallet?.balance || 0}`, color: 'bg-yellow-500/20 text-yellow-400' },
        ].map((s, i) => (
          <div key={i} className="card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.color}`}>
              <s.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-sm text-gray-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/mentor/courses/new"
          className="card flex items-center gap-4 hover:border-primary-500/50 cursor-pointer group">
          <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center group-hover:bg-primary-500/30">
            <Plus className="w-6 h-6 text-primary-400" />
          </div>
          <div>
            <p className="font-bold text-white">Create New Course</p>
            <p className="text-sm text-gray-400">Build and publish a new course</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
        </Link>
        <Link href="/mentor/classes/new"
          className="card flex items-center gap-4 hover:border-primary-500/50 cursor-pointer group">
          <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center group-hover:bg-green-500/30">
            <Video className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <p className="font-bold text-white">Schedule Live Class</p>
            <p className="text-sm text-gray-400">Set up a live session for students</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
        </Link>
      </div>

      {/* My courses */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">My Courses</h2>
          <Link href="/mentor/courses" className="text-sm text-primary-400">View All</Link>
        </div>
        <div className="space-y-3">
          {courses?.slice(0, 5).map((c: any) => (
            <div key={c._id} className="flex items-center justify-between p-3 bg-dark-700 rounded-xl">
              <div className="flex items-center gap-3">
                <img src={c.thumbnail} alt="" className="w-12 h-8 rounded-lg object-cover" />
                <div>
                  <p className="font-medium text-white text-sm">{c.title}</p>
                  <p className="text-xs text-gray-400">{c.enrolledCount} students • ₹{c.discountPrice || c.price}</p>
                </div>
              </div>
              <span className={`badge text-xs ${c.status === 'published' ? 'bg-green-500/20 text-green-400' : c.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : c.status === 'draft' ? 'bg-gray-500/20 text-gray-400' : 'bg-red-500/20 text-red-400'}`}>
                {c.status}
              </span>
            </div>
          )) || <p className="text-gray-400 text-sm">No courses yet. <Link href="/mentor/courses/new" className="text-primary-400">Create one →</Link></p>}
        </div>
      </div>
    </div>
  )
}
