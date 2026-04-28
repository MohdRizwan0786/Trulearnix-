'use client'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { adminAPI } from '@/lib/api'
import AdminLayout from '@/components/AdminLayout'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  BookOpen, Clock, CheckCircle, XCircle, Users,
  Plus, Layers, Search, Pencil, Trash2, Pin
} from 'lucide-react'

type Tab = 'all' | 'pending'

const statusColor = (s: string) => {
  const map: Record<string, string> = {
    published: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    draft: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    pending: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    rejected: 'bg-red-500/20 text-red-400 border border-red-500/30',
    archived: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
  }
  return map[s] || 'bg-gray-500/20 text-gray-400'
}

const levelColor = (l: string) => {
  if (l === 'beginner') return 'text-emerald-400'
  if (l === 'intermediate') return 'text-amber-400'
  return 'text-red-400'
}

export default function CoursesPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('all')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [processing, setProcessing] = useState('')

  const { data: allData, isLoading: allLoading } = useQuery({
    queryKey: ['admin-courses', statusFilter],
    queryFn: () => adminAPI.allCourses({ status: statusFilter || undefined, limit: 100 }).then(r => r.data),
    enabled: tab === 'all'
  })

  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ['pending-courses'],
    queryFn: () => adminAPI.pendingCourses().then(r => r.data),
    enabled: tab === 'pending'
  })

  const rawCourses = tab === 'all'
    ? (allData?.courses || allData?.data || [])
    : (pendingData?.courses || pendingData?.data || [])

  const courses = rawCourses.filter((c: any) =>
    !search || c.title?.toLowerCase().includes(search.toLowerCase())
  )

  const loading = tab === 'all' ? allLoading : pendingLoading

  const approve = async (id: string, title: string) => {
    setProcessing(id)
    try {
      await adminAPI.approveCourse(id)
      toast.success(`"${title}" approved`)
      qc.invalidateQueries({ queryKey: ['pending-courses'] })
      qc.invalidateQueries({ queryKey: ['admin-courses'] })
    } catch { toast.error('Failed to approve') } finally { setProcessing('') }
  }

  const reject = async (id: string, title: string) => {
    const reason = prompt(`Reason for rejecting "${title}":`)
    if (!reason) return
    setProcessing(id)
    try {
      await adminAPI.rejectCourse(id, reason)
      toast.success('Course rejected')
      qc.invalidateQueries({ queryKey: ['pending-courses'] })
      qc.invalidateQueries({ queryKey: ['admin-courses'] })
    } catch { toast.error('Failed to reject') } finally { setProcessing('') }
  }

  const deleteCourse = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    setProcessing(id)
    try {
      await adminAPI.deleteCourse(id)
      toast.success(`"${title}" deleted`)
      qc.invalidateQueries({ queryKey: ['admin-courses'] })
    } catch { toast.error('Failed to delete') } finally { setProcessing('') }
  }

  const toggleCompulsory = async (id: string, title: string, current: boolean) => {
    const turningOn = !current
    if (turningOn && !confirm(`Mark "${title}" as compulsory? All paid learners will be auto-enrolled.`)) return
    setProcessing(id)
    try {
      const res = await adminAPI.setCourseCompulsory(id, turningOn)
      toast.success(res.data?.message || (turningOn ? 'Marked compulsory' : 'Removed compulsory'))
      qc.invalidateQueries({ queryKey: ['admin-courses'] })
    } catch { toast.error('Failed to update') } finally { setProcessing('') }
  }

  const publishedCount = rawCourses.filter((c: any) => c.status === 'published').length
  const draftCount = rawCourses.filter((c: any) => c.status === 'draft').length
  const totalEnrolled = rawCourses.reduce((s: number, c: any) => s + (c.enrolledCount || 0), 0)

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* ── Page Header ── */}
        <div className="page-header">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                Course Management
              </h1>
              <p className="text-gray-400 text-sm mt-1">Create, review and manage all learning content</p>
            </div>
            <Link href="/courses/new"
              className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create Course
            </Link>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="kpi-violet">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-white/60 bg-white/10 px-2 py-0.5 rounded-full">Total</span>
            </div>
            <p className="text-2xl font-black text-white">{rawCourses.length}</p>
            <p className="text-white/70 text-xs mt-1">Total Courses</p>
          </div>
          <div className="kpi-emerald">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-white/60 bg-white/10 px-2 py-0.5 rounded-full">Live</span>
            </div>
            <p className="text-2xl font-black text-white">{publishedCount}</p>
            <p className="text-white/70 text-xs mt-1">Published</p>
          </div>
          <div className="kpi-amber">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-white/60 bg-white/10 px-2 py-0.5 rounded-full">WIP</span>
            </div>
            <p className="text-2xl font-black text-white">{draftCount}</p>
            <p className="text-white/70 text-xs mt-1">Drafts</p>
          </div>
          <div className="kpi-blue">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-white/60 bg-white/10 px-2 py-0.5 rounded-full">Learners</span>
            </div>
            <p className="text-2xl font-black text-white">{totalEnrolled >= 1000 ? `${(totalEnrolled/1000).toFixed(1)}K` : totalEnrolled}</p>
            <p className="text-white/70 text-xs mt-1">Total Enrolled</p>
          </div>
        </div>

        {/* ── Tabs + Filters ── */}
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="tab-bar">
            <button onClick={() => setTab('all')} className={tab === 'all' ? 'tab-active' : 'tab-inactive'}>
              All Courses
            </button>
            <button onClick={() => setTab('pending')}
              className={`${tab === 'pending' ? 'tab-active' : 'tab-inactive'} flex items-center gap-2`}>
              <Clock className="w-3.5 h-3.5" /> Pending Approval
              {(pendingData?.courses?.length || 0) > 0 && (
                <span className="bg-amber-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">
                  {pendingData?.courses?.length}
                </span>
              )}
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="search-bar w-52">
              <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search courses..." className="search-input text-sm" />
            </div>
            {tab === 'all' && (
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input w-36 text-sm">
                <option value="">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-slate-700/30">
                  <th className="text-left px-5 py-4 text-gray-400 font-medium">Course</th>
                  <th className="text-left px-5 py-4 text-gray-400 font-medium hidden md:table-cell">Mentor</th>
                  <th className="text-left px-5 py-4 text-gray-400 font-medium">Status</th>
                  <th className="text-left px-5 py-4 text-gray-400 font-medium hidden lg:table-cell">Enrolled</th>
                  <th className="text-left px-5 py-4 text-gray-400 font-medium hidden lg:table-cell">Price</th>
                  <th className="text-left px-5 py-4 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-5 py-4"><div className="h-4 bg-white/5 rounded w-48" /></td>
                      <td className="px-5 py-4 hidden md:table-cell"><div className="h-4 bg-white/5 rounded w-24" /></td>
                      <td className="px-5 py-4"><div className="h-4 bg-white/5 rounded w-16" /></td>
                      <td className="px-5 py-4 hidden lg:table-cell"><div className="h-4 bg-white/5 rounded w-12" /></td>
                      <td className="px-5 py-4 hidden lg:table-cell"><div className="h-4 bg-white/5 rounded w-16" /></td>
                      <td className="px-5 py-4"><div className="h-4 bg-white/5 rounded w-20" /></td>
                    </tr>
                  ))
                ) : courses.map((course: any) => (
                  <tr key={course._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {course.thumbnail ? (
                          <img src={course.thumbnail} alt="" className="w-16 h-10 rounded-lg object-cover flex-shrink-0 ring-1 ring-white/10"
                            onError={e => { (e.target as HTMLImageElement).style.display='none'; (e.target as HTMLImageElement).nextElementSibling?.removeAttribute('style') }} />
                        ) : null}
                        <div className="w-16 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center flex-shrink-0" style={course.thumbnail ? {display:'none'} : {}}>
                          <BookOpen className="w-4 h-4 text-violet-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-medium line-clamp-1 max-w-[220px] flex items-center gap-1.5">
                            {course.isCompulsory && (
                              <span title="Compulsory — auto-enrolled for all paid learners"
                                className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold uppercase tracking-wider flex-shrink-0">
                                <Pin className="w-2.5 h-2.5" /> Required
                              </span>
                            )}
                            <span className="truncate">{course.title}</span>
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[11px] text-gray-500 capitalize">{course.category}</span>
                            {course.level && (
                              <span className={`text-[10px] font-semibold capitalize ${levelColor(course.level)}`}>· {course.level}</span>
                            )}
                            {course.batchSettings?.enabled && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-violet-500/20 text-violet-400 font-semibold">Batches ON</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <p className="text-white text-sm">{course.mentor?.name || '—'}</p>
                      <p className="text-xs text-gray-500">{course.mentor?.email || ''}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs capitalize px-2.5 py-1 rounded-lg font-semibold ${statusColor(course.status)}`}>
                        {course.status || 'draft'}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span className="flex items-center gap-1 text-gray-300 text-xs">
                        <Users className="w-3.5 h-3.5 text-blue-400" />
                        {(course.enrolledCount || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      {course.price === 0 ? (
                        <span className="text-xs font-bold text-emerald-400">Free</span>
                      ) : (
                        <div>
                          <span className="text-white font-semibold text-sm">₹{(course.discountPrice || course.price || 0).toLocaleString()}</span>
                          {course.discountPrice && course.discountPrice < course.price && (
                            <span className="text-gray-600 text-xs line-through ml-1">₹{course.price.toLocaleString()}</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        {tab === 'pending' ? (
                          <>
                            <button onClick={() => approve(course._id, course.title)} disabled={processing === course._id}
                              className="flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                              <CheckCircle className="w-3 h-3" /> Approve
                            </button>
                            <button onClick={() => reject(course._id, course.title)} disabled={processing === course._id}
                              className="flex items-center gap-1 text-xs bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                              <XCircle className="w-3 h-3" /> Reject
                            </button>
                          </>
                        ) : (
                          <>
                            <Link href={`/courses/${course._id}/edit`}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors" title="Edit">
                              <Pencil className="w-3.5 h-3.5" />
                            </Link>
                            <button onClick={() => toggleCompulsory(course._id, course.title, !!course.isCompulsory)}
                              disabled={processing === course._id}
                              title={course.isCompulsory ? 'Remove compulsory' : 'Mark compulsory (auto-enroll all paid learners)'}
                              className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                                course.isCompulsory
                                  ? 'text-amber-300 bg-amber-500/15 hover:bg-amber-500/25'
                                  : 'text-gray-500 hover:text-amber-300 hover:bg-amber-500/10'
                              }`}>
                              <Pin className="w-3.5 h-3.5" />
                            </button>
                            {course.batchSettings?.enabled && (
                              <Link href={`/courses/${course._id}/batches`}
                                className="flex items-center gap-1 text-xs bg-violet-500/20 text-violet-400 hover:bg-violet-500 hover:text-white px-2.5 py-1.5 rounded-lg transition-colors">
                                <Layers className="w-3 h-3" /> Batches
                              </Link>
                            )}
                            <button onClick={() => deleteCourse(course._id, course.title)} disabled={processing === course._id}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && courses.length === 0 && (
              <div className="text-center py-16">
                <BookOpen className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  {tab === 'pending' ? 'No courses pending approval' : search ? 'No courses match your search' : 'No courses found'}
                </p>
                {tab === 'all' && !search && (
                  <Link href="/courses/new" className="inline-flex items-center gap-2 mt-4 text-sm text-violet-400 hover:text-violet-300">
                    <Plus className="w-4 h-4" /> Create your first course
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
