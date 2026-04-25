'use client'
import { useQuery } from '@tanstack/react-query'
import { mentorAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import {
  BookOpen, Users, Wallet, ChevronRight, Video, TrendingUp,
  ExternalLink, GraduationCap, ArrowUpRight, Star, Clock,
  Zap, Target, Award, CheckCircle, Play, Plus,
  Sparkles, IndianRupee, Radio, Bell
} from 'lucide-react'
import Link from 'next/link'

function StatCard({ icon: Icon, label, value, sub, from, to, iconBg, iconColor }: any) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 group hover:scale-[1.02] transition-all duration-300 cursor-default`}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})`, border: `1px solid ${from}40` }}>
      {/* Glow orb */}
      <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-30"
        style={{ background: from }} />
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-4`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <p className="text-2xl font-black text-white tabular-nums">{value}</p>
      <p className="text-xs text-white/50 mt-0.5 font-medium">{label}</p>
      {sub && <p className="text-[10px] text-white/30 mt-1">{sub}</p>}
    </div>
  )
}

function QuickLink({ href, icon: Icon, label, color, bg }: any) {
  return (
    <Link href={href}
      className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-white/[0.04] transition-all group">
      <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <span className="text-sm text-gray-400 group-hover:text-white transition-colors flex-1">{label}</span>
      <ChevronRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 transition-colors" />
    </Link>
  )
}

export default function MentorDashboard() {
  const { user } = useAuthStore()
  const { data, isLoading } = useQuery({
    queryKey: ['mentor-dashboard'],
    queryFn: () => mentorAPI.dashboard().then(r => r.data)
  })

  const stats            = data?.stats            || {}
  const assignedCourses  = data?.assignedCourses  || []
  const recentEnrollments= data?.recentEnrollments|| []

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'
  const emoji    = hour < 12 ? '☀️' : hour < 17 ? '🌤️' : '🌙'


  return (
    <div className="space-y-5 pb-2">

      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden rounded-3xl p-6 md:p-8"
        style={{
          background: 'linear-gradient(135deg, rgba(79,70,229,0.20) 0%, rgba(109,40,217,0.14) 50%, rgba(167,40,200,0.08) 100%)',
          border: '1px solid rgba(99,102,241,0.20)'
        }}>
        {/* BG pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '28px 28px'
        }} />
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-10"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/25 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs text-indigo-300 font-semibold">{greeting} {emoji}</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-black text-white">{user?.name?.split(' ')[0]}</h1>
            <p className="text-gray-400 text-sm mt-1.5 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-indigo-400" />
              Welcome back to your Mentor Dashboard
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            {(user as any)?.isAffiliate && (
              <Link href="/partner/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-amber-400 text-sm font-semibold hover:bg-amber-500/20 transition-all">
                <TrendingUp className="w-4 h-4" /> Partner <ExternalLink className="w-3 h-3" />
              </Link>
            )}
            <Link href="/mentor/classes/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 rounded-xl text-indigo-300 text-sm font-semibold transition-all">
              <Video className="w-4 h-4" /> New Class
            </Link>
            <Link href="/mentor/courses/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/8 hover:bg-white/12 border border-white/10 rounded-xl text-white text-sm font-semibold transition-all">
              <Plus className="w-4 h-4" /> New Course
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={BookOpen} label="Assigned Courses" value={isLoading ? '—' : stats.totalCourses || 0}
          sub="Active courses" from="rgba(59,130,246,0.25)" to="rgba(37,99,235,0.08)"
          iconBg="bg-blue-500/20" iconColor="text-blue-400" />
        <StatCard icon={Users} label="Total Students" value={isLoading ? '—' : stats.totalStudents || 0}
          sub="Enrolled learners" from="rgba(16,185,129,0.25)" to="rgba(5,150,105,0.08)"
          iconBg="bg-emerald-500/20" iconColor="text-emerald-400" />
        <StatCard icon={IndianRupee} label="Monthly Earnings" value={isLoading ? '—' : `₹${(stats.monthlyEarnings || 0).toLocaleString()}`}
          sub="This month" from="rgba(139,92,246,0.25)" to="rgba(109,40,217,0.08)"
          iconBg="bg-violet-500/20" iconColor="text-violet-400" />
        <StatCard icon={Wallet} label="Wallet Balance" value={isLoading ? '—' : `₹${(stats.wallet || 0).toLocaleString()}`}
          sub="Available to withdraw" from="rgba(245,158,11,0.25)" to="rgba(217,119,6,0.08)"
          iconBg="bg-amber-500/20" iconColor="text-amber-400" />
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Left 2/3 */}
        <div className="lg:col-span-2 space-y-4">

          {/* Assigned Courses */}
          <div className="rounded-2xl bg-[#0f0f1a] border border-white/[0.06] p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                </div>
                <h2 className="font-bold text-white">Assigned Courses</h2>
              </div>
              <Link href="/mentor/courses"
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold bg-indigo-500/10 px-3 py-1.5 rounded-lg transition-colors">
                View All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-16 bg-white/[0.03] rounded-xl animate-pulse" />)}
              </div>
            ) : assignedCourses.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-3 border border-white/[0.05]">
                  <BookOpen className="w-7 h-7 text-gray-600" />
                </div>
                <p className="text-gray-400 text-sm font-semibold">No courses assigned yet</p>
                <p className="text-gray-600 text-xs mt-1">Admin will assign courses to you</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {assignedCourses.slice(0, 5).map((item: any, i: number) => {
                  const course = item.courseId
                  if (!course) return null
                  const enrolled = course.enrolledCount || 0
                  const max      = item.maxStudents || 100
                  const pct      = Math.min(Math.round((enrolled / max) * 100), 100)
                  return (
                    <Link key={i} href="/mentor/courses"
                      className="flex items-center gap-3.5 p-3.5 bg-white/[0.02] hover:bg-white/[0.04] rounded-xl transition-all group border border-transparent hover:border-indigo-500/15">
                      {course.thumbnail
                        ? <img src={course.thumbnail} className="w-14 h-10 rounded-xl object-cover flex-shrink-0 shadow-md" />
                        : <div className="w-14 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-400/60" />
                          </div>
                      }
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm truncate group-hover:text-indigo-300 transition-colors">{course.title}</p>
                        <div className="flex items-center gap-2.5 mt-1.5">
                          <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[10px] text-gray-500 flex-shrink-0">{enrolled}/{max}</span>
                        </div>
                      </div>
                      <Play className="w-3.5 h-3.5 text-gray-600 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right 1/3 */}
        <div className="space-y-4">

          {/* Recent Students */}
          <div className="rounded-2xl bg-[#0f0f1a] border border-white/[0.06] p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <h2 className="font-bold text-white">Recent Students</h2>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-12 bg-white/[0.03] rounded-xl animate-pulse" />)}
              </div>
            ) : recentEnrollments.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-10 h-10 text-gray-700 mx-auto mb-2" />
                <p className="text-gray-500 text-xs font-medium">No students yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentEnrollments.map((e: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.03] transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500/25 to-green-600/15 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
                      <span className="text-emerald-400 text-xs font-bold">{e.user?.name?.[0]?.toUpperCase() || '?'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-semibold truncate">{e.user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{e.course?.title}</p>
                    </div>
                    <CheckCircle className="w-4 h-4 text-emerald-500/40 flex-shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Access */}
          <div className="rounded-2xl bg-[#0f0f1a] border border-white/[0.06] p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/15 flex items-center justify-center">
                <Zap className="w-4 h-4 text-cyan-400" />
              </div>
              <h2 className="font-bold text-white text-sm">Quick Access</h2>
            </div>
            <div className="space-y-0.5">
              <QuickLink href="/mentor/courses"   icon={BookOpen}   label="My Courses"    color="text-blue-400"   bg="bg-blue-500/15"   />
              <QuickLink href="/mentor/students"  icon={Users}      label="My Students"   color="text-emerald-400" bg="bg-emerald-500/15"/>
              <QuickLink href="/mentor/classes"   icon={Video}      label="Live Classes"  color="text-violet-400" bg="bg-violet-500/15" />
              <QuickLink href="/mentor/salary"     icon={IndianRupee} label="Salary"       color="text-amber-400"  bg="bg-amber-500/15"  />
              <QuickLink href="/mentor/profile"   icon={Award}      label="My Profile"    color="text-pink-400"   bg="bg-pink-500/15"   />
            </div>
          </div>

          {/* Earn CTA */}
          {!(user as any)?.isAffiliate && (
            <div className="rounded-2xl p-5 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, rgba(109,40,217,0.20), rgba(79,70,229,0.12))', border: '1px solid rgba(109,40,217,0.25)' }}>
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-20"
                style={{ background: '#8b5cf6' }} />
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center mb-3">
                  <Target className="w-5 h-5 text-violet-400" />
                </div>
                <h3 className="font-bold text-white text-sm">Unlock Earn Program</h3>
                <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">Get a package and earn Partnership earnings on top of your teaching income.</p>
                <Link href="/student/upgrade"
                  className="inline-flex items-center gap-1.5 mt-3 text-xs text-violet-300 hover:text-violet-200 font-bold">
                  View Packages <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
