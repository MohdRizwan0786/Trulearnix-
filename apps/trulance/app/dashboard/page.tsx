'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { useQuery } from '@tanstack/react-query'
import { freelanceAPI } from '@/lib/api'
import Link from 'next/link'
import { Briefcase, Plus, ExternalLink, Clock, Users, ArrowRight, Zap } from 'lucide-react'

export default function DashboardPage() {
  const { user, _hasHydrated, logout } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!_hasHydrated) return
    if (!user) router.push('/login?redirect=/dashboard')
  }, [_hasHydrated, user, router])

  const { data: myJobsData } = useQuery({
    queryKey: ['my-jobs'],
    queryFn: () => freelanceAPI.myProjects().then(r => r.data.data),
    enabled: !!user,
  })

  if (!_hasHydrated || !user) return (
    <div className="min-h-screen pt-20 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const myJobs: any[] = myJobsData || []
  const openJobs = myJobs.filter(j => j.status === 'open')
  const totalApplicants = myJobs.reduce((acc, j) => acc + (j.applicants?.length || 0), 0)

  return (
    <div className="min-h-screen pt-20 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="py-8">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="w-14 h-14 rounded-full flex items-center justify-center font-black text-xl flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#0d9488,#0891b2)' }}>
              <span className="text-white">{user.name?.[0]}</span>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-black text-white">Welcome, {user.name?.split(' ')[0]}!</h1>
              <p className="text-gray-500 text-sm">{user.email}</p>
            </div>
            <Link href="/post-project" className="btn-primary text-sm py-2.5 px-5">
              <Plus className="w-4 h-4" /> Post Project
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Projects Posted', value: myJobs.length, icon: Briefcase },
            { label: 'Open Projects', value: openJobs.length, icon: Zap },
            { label: 'Total Applicants', value: totalApplicants, icon: Users },
            { label: 'In Progress', value: myJobs.filter(j => j.status === 'in-progress').length, icon: Clock },
          ].map(s => (
            <div key={s.label} className="card text-center">
              <s.icon className="w-5 h-5 text-teal-400 mx-auto mb-2" />
              <p className="text-2xl font-black text-white">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Projects */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-white">My Projects</h2>
              <Link href="/post-project" className="text-teal-400 text-xs hover:underline flex items-center gap-1">
                <Plus className="w-3 h-3" /> New
              </Link>
            </div>
            {myJobs.length === 0 ? (
              <div className="card text-center py-12 text-gray-600">
                <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No projects posted yet</p>
                <Link href="/post-project" className="btn-primary mt-4 text-sm py-2 px-4 inline-flex">Post First Project</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {myJobs.map(job => (
                  <div key={job._id} className="card">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-sm truncate">{job.title}</h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{job.applicants?.length || 0} applicants</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.duration}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`badge text-xs ${job.status === 'open' ? 'bg-green-500/15 text-green-400' : job.status === 'in-progress' ? 'bg-blue-500/15 text-blue-400' : 'bg-gray-500/15 text-gray-400'}`}>
                          {job.status}
                        </span>
                        <Link href={`/projects/${job._id}`}>
                          <ExternalLink className="w-3.5 h-3.5 text-gray-600 hover:text-teal-400 transition-colors" />
                        </Link>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                      <span className="text-teal-400 font-bold text-sm">₹{job.budget?.toLocaleString()}</span>
                      <span className="text-xs text-gray-600 capitalize">{job.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h2 className="font-bold text-white mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {[
                { href: '/projects', label: 'Browse Available Projects', desc: 'Find work and start earning', icon: Briefcase },
                { href: '/freelancers', label: 'View Freelancers', desc: 'See the talent pool', icon: Users },
                { href: '/post-project', label: 'Post a New Project', desc: 'Hire someone today', icon: Plus },
              ].map(l => (
                <Link key={l.href} href={l.href}>
                  <div className="card cursor-pointer hover:border-teal-500/30 flex items-center gap-4 transition-all">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(13,148,136,0.1)', border: '1px solid rgba(13,148,136,0.2)' }}>
                      <l.icon className="w-4 h-4 text-teal-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white text-sm">{l.label}</p>
                      <p className="text-xs text-gray-600">{l.desc}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-600" />
                  </div>
                </Link>
              ))}

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white text-sm">Back to TruLearnix</p>
                    <p className="text-xs text-gray-600">Continue learning and earning</p>
                  </div>
                  <a href="https://peptly.in/student/dashboard" className="btn-secondary text-xs py-1.5 px-3">Visit</a>
                </div>
              </div>

              <button onClick={logout}
                className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors font-medium">
                Logout from TruLancer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
