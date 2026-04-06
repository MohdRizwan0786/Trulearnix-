'use client'
import { useQuery } from '@tanstack/react-query'
import { adminAPI } from '@/lib/api'
import { Users, BookOpen, DollarSign, TrendingUp, UserCheck, Clock, AlertCircle } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { format } from 'date-fns'

function StatCard({ icon: Icon, label, value, change, color }: any) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        {change && <span className={`text-xs font-medium ${change > 0 ? 'text-green-400' : 'text-red-400'}`}>
          {change > 0 ? '+' : ''}{change}%
        </span>}
      </div>
      <p className="text-3xl font-black text-white mb-1">{value}</p>
      <p className="text-sm text-gray-400">{label}</p>
    </div>
  )
}

export default function AdminDashboard() {
  const { data } = useQuery({ queryKey: ['admin-dashboard'], queryFn: () => adminAPI.dashboard().then(r => r.data) })
  const { data: pendingCourses } = useQuery({ queryKey: ['pending-courses'], queryFn: () => adminAPI.pendingCourses().then(r => r.data) })

  const chartData = data?.monthlyRevenue?.map((m: any) => ({
    month: `${m._id.month}/${m._id.year}`,
    revenue: m.revenue,
    orders: m.count
  })) || []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Platform overview and key metrics</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={Users} label="Total Users" value={data?.stats?.totalUsers?.toLocaleString() || 0} color="bg-blue-500/20 text-blue-400" />
        <StatCard icon={UserCheck} label="Students" value={data?.stats?.totalStudents?.toLocaleString() || 0} color="bg-green-500/20 text-green-400" />
        <StatCard icon={Users} label="Mentors" value={data?.stats?.totalMentors || 0} color="bg-purple-500/20 text-purple-400" />
        <StatCard icon={BookOpen} label="Published Courses" value={data?.stats?.totalCourses || 0} color="bg-yellow-500/20 text-yellow-400" />
        <StatCard icon={TrendingUp} label="Enrollments" value={data?.stats?.totalEnrollments?.toLocaleString() || 0} color="bg-orange-500/20 text-orange-400" />
        <StatCard icon={DollarSign} label="Total Revenue" value={`₹${((data?.stats?.totalRevenue || 0) / 1000).toFixed(1)}K`} color="bg-pink-500/20 text-pink-400" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-bold text-white mb-6">Monthly Revenue</h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="text-lg font-bold text-white mb-6">Monthly Orders</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
              <Bar dataKey="orders" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pending courses */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-400" />
            Pending Course Approvals ({pendingCourses?.courses?.length || 0})
          </h2>
          <a href="/courses" className="text-sm text-violet-400 hover:text-violet-300">View All</a>
        </div>
        <div className="space-y-3">
          {pendingCourses?.courses?.slice(0, 5).map((course: any) => (
            <div key={course._id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl">
              <div className="flex items-center gap-3">
                <img src={course.thumbnail} alt="" className="w-12 h-8 rounded-lg object-cover" />
                <div>
                  <p className="font-medium text-white text-sm">{course.title}</p>
                  <p className="text-xs text-gray-400">by {course.mentor?.name}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => adminAPI.approveCourse(course._id).then(() => window.location.reload())}
                  className="text-xs bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white px-3 py-1.5 rounded-lg transition-colors">
                  Approve
                </button>
                <button onClick={() => {
                  const reason = prompt('Rejection reason:')
                  if (reason) adminAPI.rejectCourse(course._id, reason).then(() => window.location.reload())
                }} className="text-xs bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg transition-colors">
                  Reject
                </button>
              </div>
            </div>
          )) || <p className="text-gray-400 text-sm">No pending courses.</p>}
        </div>
      </div>

      {/* Recent payments */}
      <div className="card">
        <h2 className="text-lg font-bold text-white mb-4">Recent Payments</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-gray-400">
                <th className="text-left pb-3">Student</th>
                <th className="text-left pb-3">Course</th>
                <th className="text-left pb-3">Amount</th>
                <th className="text-left pb-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data?.recentPayments?.map((p: any) => (
                <tr key={p._id}>
                  <td className="py-3 text-white">{p.user?.name}</td>
                  <td className="py-3 text-gray-300 max-w-[200px] truncate">{p.course?.title}</td>
                  <td className="py-3 text-green-400 font-medium">₹{p.amount}</td>
                  <td className="py-3 text-gray-400">{format(new Date(p.createdAt), 'dd MMM, hh:mm a')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
