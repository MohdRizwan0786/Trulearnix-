'use client'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { adminAPI } from '@/lib/api'
import { usePackages } from '@/lib/usePackages'
import AdminLayout from '@/components/AdminLayout'
import toast from 'react-hot-toast'
import {
  GraduationCap, Search, CheckCircle, XCircle, BookOpen,
  Users, ExternalLink, Loader2, Award, X, ChevronDown, Plus,
  Eye, EyeOff, Clock, UserCheck, UserX, Calendar, KeyRound,
} from 'lucide-react'
import { format } from 'date-fns'


const STATUS_TABS = [
  { value: 'all',      label: 'All' },
  { value: 'pending',  label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

const statusConfig: Record<string, { label: string; cls: string }> = {
  pending:  { label: 'Pending',  cls: 'badge bg-amber-500/20 text-amber-400 border border-amber-500/30' },
  approved: { label: 'Approved', cls: 'badge bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
  rejected: { label: 'Rejected', cls: 'badge bg-rose-500/20 text-rose-400 border border-rose-500/30' },
}

const tierConfig: Record<string, { cls: string; gradient: string }> = {
  free:    { cls: 'badge bg-gray-500/20 text-gray-400',      gradient: 'from-gray-500 to-slate-500' },
  basic:   { cls: 'badge bg-teal-500/20 text-teal-400',      gradient: 'from-teal-500 to-cyan-600' },
  starter: { cls: 'badge bg-sky-500/20 text-sky-400',        gradient: 'from-sky-500 to-cyan-500' },
  pro:     { cls: 'badge bg-violet-500/20 text-violet-400',  gradient: 'from-violet-500 to-purple-600' },
  proedge: { cls: 'badge bg-fuchsia-500/20 text-fuchsia-400', gradient: 'from-fuchsia-500 to-pink-600' },
  elite:   { cls: 'badge bg-amber-500/20 text-amber-400',    gradient: 'from-amber-500 to-orange-500' },
  supreme: { cls: 'badge bg-rose-500/20 text-rose-400',      gradient: 'from-rose-500 to-pink-600' },
}

/* Pick a gradient for avatar initials based on name */
const avatarGradients = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-600',
  'from-indigo-500 to-blue-600',
]
const nameGradient = (name: string) =>
  avatarGradients[(name?.charCodeAt(0) ?? 0) % avatarGradients.length]

export default function MentorsPage() {
  const { packages: tierPackages } = usePackages()
  const [status, setStatus]             = useState('all')
  const [search, setSearch]             = useState('')
  const [page, setPage]                 = useState(1)
  const [actionId, setActionId]         = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [rejectModal, setRejectModal]   = useState<string | null>(null)
  const [assignModal, setAssignModal]   = useState<string | null>(null)
  const [selectedCourse, setSelectedCourse] = useState('')
  const [maxStudents, setMaxStudents]   = useState('')
  const [createModal, setCreateModal]   = useState(false)
  const [showPass, setShowPass]         = useState(false)
  const [creating, setCreating]         = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', expertise: '', bio: '' })
  const [resetModal, setResetModal]     = useState<any>(null)
  const [newPassword, setNewPassword]   = useState('')
  const [resetting, setResetting]       = useState(false)
  const qc = useQueryClient()

  /* ── API: fetch mentors ── */
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-mentors', status, search, page],
    queryFn: () =>
      adminAPI.mentors({ status: status !== 'all' ? status : undefined, search: search || undefined, page, limit: 20 }).then(r => r.data),
    placeholderData: (prev: any) => prev,
  })

  /* ── API: fetch all courses for assignment ── */
  const { data: coursesData } = useQuery({
    queryKey: ['admin-courses-all'],
    queryFn: () => adminAPI.allCourses({ limit: 200 }).then(r => r.data),
  })

  /* ── API: fetch KPI counts (all statuses) ── */
  const { data: kpiData } = useQuery({
    queryKey: ['admin-mentors-kpi'],
    queryFn: async () => {
      const [all, pending, approved, rejected] = await Promise.all([
        adminAPI.mentors({ limit: 1 }).then(r => r.data.total ?? 0),
        adminAPI.mentors({ status: 'pending',  limit: 1 }).then(r => r.data.total ?? 0),
        adminAPI.mentors({ status: 'approved', limit: 1 }).then(r => r.data.total ?? 0),
        adminAPI.mentors({ status: 'rejected', limit: 1 }).then(r => r.data.total ?? 0),
      ])
      return { all, pending, approved, rejected }
    },
    staleTime: 30_000,
  })

  /* ── Actions ── */
  const approveMentor = async (id: string, name: string) => {
    if (!confirm(`Approve ${name} as a mentor?`)) return
    setActionId(id)
    try {
      await adminAPI.approveMentor(id)
      toast.success(`${name} approved as mentor`)
      refetch()
      qc.invalidateQueries({ queryKey: ['admin-mentors-kpi'] })
    } catch { toast.error('Approval failed') } finally { setActionId('') }
  }

  const rejectMentor = async () => {
    if (!rejectModal) return
    setActionId(rejectModal)
    try {
      await adminAPI.rejectMentor(rejectModal, rejectReason)
      toast.success('Mentor rejected')
      setRejectModal(null)
      setRejectReason('')
      refetch()
      qc.invalidateQueries({ queryKey: ['admin-mentors-kpi'] })
    } catch { toast.error('Rejection failed') } finally { setActionId('') }
  }

  const assignCourse = async () => {
    if (!assignModal || !selectedCourse) { toast.error('Please select a course'); return }
    setActionId(assignModal)
    try {
      await adminAPI.assignCourse(assignModal, selectedCourse, maxStudents ? Number(maxStudents) : undefined)
      toast.success('Course assigned successfully')
      setAssignModal(null)
      setSelectedCourse('')
      setMaxStudents('')
      refetch()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Assignment failed')
    } finally { setActionId('') }
  }

  const unassignCourse = async (mentorId: string, courseId: string, courseTitle: string) => {
    if (!confirm(`Remove "${courseTitle}" from this mentor?`)) return
    try {
      await adminAPI.unassignCourse(mentorId, courseId)
      toast.success('Course removed')
      refetch()
    } catch { toast.error('Failed to remove course') }
  }

  const createMentor = async () => {
    if (!form.name || !form.email || !form.password) { toast.error('Name, email and password required'); return }
    setCreating(true)
    try {
      await adminAPI.createMentor(form)
      toast.success(`Mentor "${form.name}" created successfully!`)
      setCreateModal(false)
      setForm({ name: '', email: '', password: '', phone: '', expertise: '', bio: '' })
      refetch()
      setStatus('approved')
      qc.invalidateQueries({ queryKey: ['admin-mentors-kpi'] })
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to create mentor')
    } finally { setCreating(false) }
  }

  const resetPassword = async () => {
    if (!resetModal || !newPassword || newPassword.length < 6) return toast.error('Min 6 characters required')
    setResetting(true)
    try {
      await adminAPI.resetUserPassword(resetModal._id, newPassword)
      toast.success(`Password reset for ${resetModal.name}`)
      setResetModal(null); setNewPassword('')
    } catch { toast.error('Failed to reset password') } finally { setResetting(false) }
  }

  const givePackage = async (id: string, name: string, packageTier: string) => {
    if (!confirm(`Give ${packageTier} package to ${name}?`)) return
    try {
      await adminAPI.giveMentorPackage(id, packageTier)
      toast.success(`${packageTier} package given to ${name}`)
      refetch()
    } catch { toast.error('Failed to give package') }
  }

  const mentors = data?.mentors || []
  const total   = data?.total   || 0
  const pages   = data?.pages   || 1

  return (
    <AdminLayout>
      <div className="space-y-8">

        {/* ── Page Header ── */}
        <div className="page-header flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2.5 rounded-xl bg-white/10">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Mentor Management</h1>
            </div>
            <p className="text-white/70 text-sm mt-1 ml-0.5">
              {kpiData?.pending
                ? <span><span className="font-semibold text-amber-300">{kpiData.pending}</span> application{kpiData.pending !== 1 ? 's' : ''} awaiting review</span>
                : 'Review applications, assign courses and manage mentor tiers'}
            </p>
          </div>
          <button
            onClick={() => setCreateModal(true)}
            className="btn-primary flex items-center gap-2 flex-shrink-0">
            <Plus className="w-4 h-4" /> Create Mentor
          </button>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="kpi-violet">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium opacity-80">Total Mentors</span>
              <div className="p-2 rounded-lg bg-white/10">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-bold">{kpiData?.all ?? '—'}</p>
            <p className="text-xs opacity-70 mt-1">All time registered</p>
          </div>

          <div className="kpi-amber">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium opacity-80">Pending Approval</span>
              <div className="p-2 rounded-lg bg-white/10">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-bold">{kpiData?.pending ?? '—'}</p>
            <p className="text-xs opacity-70 mt-1">Awaiting your review</p>
          </div>

          <div className="kpi-emerald">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium opacity-80">Approved</span>
              <div className="p-2 rounded-lg bg-white/10">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-bold">{kpiData?.approved ?? '—'}</p>
            <p className="text-xs opacity-70 mt-1">Active mentors</p>
          </div>

          <div className="kpi-rose">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium opacity-80">Rejected</span>
              <div className="p-2 rounded-lg bg-white/10">
                <UserX className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-bold">{kpiData?.rejected ?? '—'}</p>
            <p className="text-xs opacity-70 mt-1">Declined applications</p>
          </div>
        </div>

        {/* ── Filters: tabs + search ── */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="tab-bar">
            {STATUS_TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => { setStatus(tab.value); setPage(1) }}
                className={status === tab.value ? 'tab-active' : 'tab-inactive'}>
                {tab.label}
                {tab.value === 'pending' && kpiData?.pending ? (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white leading-none">
                    {kpiData.pending}
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          <div className="search-bar flex-1 min-w-[220px] max-w-sm">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by name or email..."
              className="search-input"
            />
          </div>
        </div>

        {/* ── Loading ── */}
        {isLoading && (
          <div className="flex items-center justify-center py-24 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading mentors...
          </div>
        )}

        {/* ── Empty state ── */}
        {!isLoading && mentors.length === 0 && (
          <div className="card text-center py-20">
            <GraduationCap className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400 font-medium">No {status !== 'all' ? status : ''} mentors found</p>
            <p className="text-gray-600 text-sm mt-1">
              {search ? 'Try a different search term.' : 'Check back later or create a new mentor.'}
            </p>
          </div>
        )}

        {/* ── Mentor Cards Grid ── */}
        {!isLoading && mentors.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {mentors.map((mentor: any) => {
              const sc = statusConfig[mentor.mentorStatus] ?? { label: mentor.mentorStatus, cls: 'badge bg-gray-500/20 text-gray-400' }
              const tc = tierConfig[mentor.packageTier] ?? tierConfig.free
              const initials = (mentor.name || 'M').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
              const joinDate = mentor.mentorApplication?.appliedAt || mentor.createdAt

              return (
                <div key={mentor._id} className="card card-hover flex flex-col gap-5">
                  {/* Top row: avatar + identity + badges */}
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className={`avatar-lg flex-shrink-0 bg-gradient-to-br ${nameGradient(mentor.name)} flex items-center justify-center`}>
                      {mentor.avatar
                        ? <img src={mentor.avatar} className="w-full h-full object-cover rounded-full" alt="" />
                        : <span className="text-white font-bold text-lg">{initials}</span>}
                    </div>

                    {/* Name + contact */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="font-semibold text-white truncate">{mentor.name}</p>
                        <span className={sc.cls}>{sc.label}</span>
                        {mentor.packageTier && mentor.packageTier !== 'free' && (
                          <span className={tc.cls + ' capitalize'}>
                            <Award className="w-3 h-3 mr-1 inline" />{mentor.packageTier}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm truncate">{mentor.email}</p>
                      {mentor.phone && (
                        <p className="text-gray-500 text-xs mt-0.5">{mentor.phone}</p>
                      )}
                      {joinDate && (
                        <p className="text-gray-600 text-xs mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Joined {format(new Date(joinDate), 'dd MMM yyyy')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Performance Stats */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-700/40 rounded-xl p-2.5 text-center">
                      <p className="text-lg font-bold text-white">{mentor._perf?.courseCount || 0}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Courses</p>
                    </div>
                    <div className="bg-slate-700/40 rounded-xl p-2.5 text-center">
                      <p className="text-lg font-bold text-emerald-400">{mentor._perf?.totalStudents || 0}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Students</p>
                    </div>
                    <div className="bg-slate-700/40 rounded-xl p-2.5 text-center">
                      <p className="text-lg font-bold text-yellow-400">{(mentor._perf?.avgRating || 0) > 0 ? mentor._perf.avgRating : '—'}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Avg Rating</p>
                    </div>
                  </div>

                  {/* Expertise tags */}
                  {mentor.mentorApplication?.expertise?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {mentor.mentorApplication.expertise.map((ex: string) => (
                        <span key={ex} className="badge bg-violet-500/10 text-violet-300 border border-violet-500/20 text-[11px]">
                          {ex}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Experience / Bio */}
                  {mentor.mentorApplication?.experience && (
                    <p className="text-sm text-gray-300 leading-relaxed">
                      <span className="text-gray-500 text-xs uppercase tracking-wide mr-1.5">Exp:</span>
                      {mentor.mentorApplication.experience}
                    </p>
                  )}
                  {mentor.mentorApplication?.bio && (
                    <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">
                      {mentor.mentorApplication.bio}
                    </p>
                  )}

                  {/* Links */}
                  {(mentor.mentorApplication?.linkedin || mentor.mentorApplication?.portfolio) && (
                    <div className="flex gap-4">
                      {mentor.mentorApplication.linkedin && (
                        <a href={mentor.mentorApplication.linkedin} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                          <ExternalLink className="w-3 h-3" /> LinkedIn
                        </a>
                      )}
                      {mentor.mentorApplication.portfolio && (
                        <a href={mentor.mentorApplication.portfolio} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                          <ExternalLink className="w-3 h-3" /> Portfolio
                        </a>
                      )}
                    </div>
                  )}

                  {/* Rejection reason */}
                  {mentor.mentorApplication?.rejectionReason && (
                    <div className="px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                      <p className="text-xs text-rose-400">
                        <span className="font-semibold">Rejection reason: </span>
                        {mentor.mentorApplication.rejectionReason}
                      </p>
                    </div>
                  )}

                  {/* Assigned courses */}
                  {mentor.assignedCourses?.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2 flex items-center gap-1 uppercase tracking-wide">
                        <BookOpen className="w-3 h-3" /> Assigned Courses
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {mentor.assignedCourses.map((ac: any) => {
                          const courseTitle = ac.courseId?.title || ac.courseId || 'Course'
                          const courseId    = ac.courseId?._id  || ac.courseId
                          return (
                            <span key={courseId}
                              className="inline-flex items-center gap-1 text-xs bg-slate-700 text-gray-300 px-2.5 py-1 rounded-full border border-white/5">
                              {courseTitle}
                              {ac.maxStudents && <span className="text-gray-500">({ac.maxStudents} max)</span>}
                              <button
                                onClick={() => unassignCourse(mentor._id, courseId, courseTitle)}
                                className="ml-0.5 text-gray-500 hover:text-rose-400 transition-colors">
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="border-t border-white/5" />

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2">
                    {/* Pending: Approve + Reject */}
                    {mentor.mentorStatus === 'pending' && (
                      <>
                        <button
                          disabled={actionId === mentor._id}
                          onClick={() => approveMentor(mentor._id, mentor.name)}
                          className="btn-success flex items-center gap-1.5 text-xs">
                          {actionId === mentor._id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <CheckCircle className="w-3.5 h-3.5" />}
                          Approve
                        </button>
                        <button
                          disabled={actionId === mentor._id}
                          onClick={() => { setRejectModal(mentor._id); setRejectReason('') }}
                          className="btn-danger flex items-center gap-1.5 text-xs">
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </>
                    )}

                    {/* Approved: Assign Course + Give Package */}
                    {mentor.mentorStatus === 'approved' && (
                      <>
                        <button
                          onClick={() => { setAssignModal(mentor._id); setSelectedCourse(''); setMaxStudents('') }}
                          className="btn-secondary flex items-center gap-1.5 text-xs">
                          <BookOpen className="w-3.5 h-3.5" /> Assign Course
                        </button>

                        <div className="relative group">
                          <button className="btn-secondary flex items-center gap-1.5 text-xs">
                            <Award className="w-3.5 h-3.5" /> Give Package
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          <div className="absolute left-0 top-full mt-1 bg-slate-800 border border-white/10 rounded-xl shadow-xl z-10 min-w-[130px] py-1 hidden group-hover:block">
                            {tierPackages.map(pkg => (
                              <button
                                key={pkg.tier}
                                onClick={() => givePackage(mentor._id, mentor.name, pkg.tier)}
                                className={`w-full text-left px-3 py-2 text-xs capitalize hover:bg-white/5 transition-colors ${tierConfig[pkg.tier]?.cls ?? ''}`}>
                                {pkg.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => { setResetModal(mentor); setNewPassword('') }}
                          className="btn-secondary flex items-center gap-1.5 text-xs">
                          <KeyRound className="w-3.5 h-3.5" /> Reset Password
                        </button>

                        <span className="flex items-center gap-1 text-xs text-gray-500 ml-1">
                          <Users className="w-3.5 h-3.5" />
                          {mentor.assignedCourses?.length || 0} course{mentor.assignedCourses?.length !== 1 ? 's' : ''}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Pagination ── */}
        {pages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary text-sm disabled:opacity-40">
              Previous
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(pages, 7) }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${
                    page === i + 1
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-700/60 text-gray-400 hover:text-white hover:bg-slate-700'
                  }`}>
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPage(p => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="btn-secondary text-sm disabled:opacity-40">
              Next
            </button>
          </div>
        )}
      </div>

      {/* ════════════════ Reject Modal ════════════════ */}
      {rejectModal && (
        <div className="modal-overlay">
          <div className="modal-box max-w-md">
            <div className="modal-header">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-rose-400" /> Reject Application
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Reason will be shown to the mentor</p>
              </div>
              <button
                onClick={() => { setRejectModal(null); setRejectReason('') }}
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="modal-body">
              <label className="label block mb-1.5">Rejection reason <span className="text-gray-500">(optional)</span></label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="e.g. Insufficient experience, incomplete portfolio..."
                rows={3}
                className="input resize-none"
              />
            </div>
            <div className="modal-footer">
              <button
                onClick={() => { setRejectModal(null); setRejectReason('') }}
                className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                disabled={actionId === rejectModal}
                onClick={rejectMentor}
                className="btn-danger flex-1 flex items-center justify-center gap-2">
                {actionId === rejectModal && <Loader2 className="w-4 h-4 animate-spin" />}
                Reject Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ Assign Course Modal ════════════════ */}
      {assignModal && (
        <div className="modal-overlay">
          <div className="modal-box max-w-md">
            <div className="modal-header">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-400" /> Assign Course
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Link a course to this mentor</p>
              </div>
              <button
                onClick={() => { setAssignModal(null); setSelectedCourse(''); setMaxStudents('') }}
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="modal-body space-y-4">
              <div>
                <label className="label block mb-1.5">Select Course</label>
                <select
                  value={selectedCourse}
                  onChange={e => setSelectedCourse(e.target.value)}
                  className="input">
                  <option value="">-- Choose a course --</option>
                  {coursesData?.courses?.map((c: any) => (
                    <option key={c._id} value={c._id} className="bg-slate-800">
                      {c.title}{c.status !== 'published' ? ` (${c.status})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label block mb-1.5">Max Students <span className="text-gray-500">(optional)</span></label>
                <input
                  type="number"
                  value={maxStudents}
                  onChange={e => setMaxStudents(e.target.value)}
                  placeholder="Leave blank for unlimited"
                  className="input"
                  min={1}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => { setAssignModal(null); setSelectedCourse(''); setMaxStudents('') }}
                className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                disabled={!selectedCourse || actionId === assignModal}
                onClick={assignCourse}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
                {actionId === assignModal && <Loader2 className="w-4 h-4 animate-spin" />}
                <BookOpen className="w-4 h-4" /> Assign Course
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ Reset Password Modal ════════════════ */}
      {resetModal && (
        <div className="modal-overlay">
          <div className="modal-box max-w-sm">
            <div className="modal-header">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" /> Reset Password
              </h3>
              <button onClick={() => setResetModal(null)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="modal-body space-y-3">
              <p className="text-sm text-gray-400">Set new admin panel password for <span className="text-white font-semibold">{resetModal.name}</span></p>
              <p className="text-xs text-amber-400 bg-amber-500/10 px-3 py-2 rounded-xl border border-amber-500/20">
                Login URL: <span className="font-mono">admin.trulearnix.com</span> · Email: <span className="font-mono">{resetModal.email}</span>
              </p>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                placeholder="New password (min 6 chars)"
                className="w-full bg-slate-700 text-white rounded-xl px-4 py-2.5 text-sm border border-white/10 outline-none focus:border-violet-500" />
            </div>
            <div className="modal-footer">
              <button onClick={() => setResetModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={resetPassword} disabled={resetting || newPassword.length < 6}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
                {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ Create Mentor Modal ════════════════ */}
      {createModal && (
        <div className="modal-overlay">
          <div className="modal-box max-w-lg">
            <div className="modal-header">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-violet-400" /> Create New Mentor
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Account will be auto-approved and ready to login</p>
              </div>
              <button
                onClick={() => setCreateModal(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="modal-body space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label block mb-1.5">Full Name *</label>
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Rahul Sharma"
                    className="input" />
                </div>
                <div>
                  <label className="label block mb-1.5">Phone</label>
                  <input
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+91 9876543210"
                    className="input" />
                </div>
              </div>
              <div>
                <label className="label block mb-1.5">Email Address *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="mentor@example.com"
                  className="input" />
              </div>
              <div>
                <label className="label block mb-1.5">Password *</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Min. 8 characters"
                    className="input pr-10" />
                  <button
                    type="button"
                    onClick={() => setShowPass(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label block mb-1.5">Expertise <span className="text-gray-500">(comma separated)</span></label>
                <input
                  value={form.expertise}
                  onChange={e => setForm(f => ({ ...f, expertise: e.target.value }))}
                  placeholder="e.g. Web Development, Python, Data Science"
                  className="input" />
              </div>
              <div>
                <label className="label block mb-1.5">Bio <span className="text-gray-500">(optional)</span></label>
                <textarea
                  value={form.bio}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  placeholder="Short description about the mentor..."
                  rows={3}
                  className="input resize-none" />
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setCreateModal(false)}
                className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={createMentor}
                disabled={creating || !form.name || !form.email || !form.password}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
                {creating ? 'Creating...' : 'Create Mentor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
