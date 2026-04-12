'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { courseAPI, mentorAPI } from '@/lib/api'
import {
  Plus, Trash2, Send, Loader2, BookOpen, Video, FileText,
  CheckCircle, Layers, PlayCircle, ClipboardList, Calendar,
  Clock, Users, ChevronRight, BarChart2, ArrowLeft, Eye,
  FileCheck, Download
} from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

const STATUS_COLOR: Record<string, string> = {
  draft: 'bg-gray-500/20 text-gray-400',
  pending: 'bg-yellow-500/20 text-yellow-400',
  approved: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400',
}

const BATCH_COLOR: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  active: 'bg-green-500/20 text-green-400',
  closed: 'bg-gray-500/20 text-gray-400',
  full: 'bg-blue-500/20 text-blue-400',
}

type Tab = 'curriculum' | 'batches' | 'sessions' | 'assignments'

export default function MentorCourseDetail({ params }: { params: { id: string } }) {
  const { id } = params
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('curriculum')

  // ── Curriculum state ───────────────────────────────────────────────────────
  const [addingLesson, setAddingLesson] = useState(false)
  const [lessonForm, setLessonForm] = useState({ title: '', videoUrl: '', content: '', duration: '' })

  // ── Assignment state ───────────────────────────────────────────────────────
  const [addingAssignment, setAddingAssignment] = useState(false)
  const [assignForm, setAssignForm] = useState({ title: '', description: '', dueDate: '', maxScore: '100' })

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: courseData, isLoading: courseLoading } = useQuery({
    queryKey: ['mentor-course-content', id],
    queryFn: () => courseAPI.getContent(id).then(r => r.data),
  })

  const { data: batchesData, isLoading: batchesLoading } = useQuery({
    queryKey: ['mentor-course-batches', id],
    queryFn: () => mentorAPI.courseBatches(id).then(r => r.data.batches),
    enabled: tab === 'batches',
  })

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['mentor-course-sessions', id],
    queryFn: () => mentorAPI.courseSessions(id).then(r => r.data.sessions),
    enabled: tab === 'sessions',
  })

  const { data: assignmentsData, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['mentor-course-assignments', id],
    queryFn: () => mentorAPI.courseAssignments(id).then(r => r.data.assignments),
    enabled: tab === 'assignments',
  })

  // ── Mutations ──────────────────────────────────────────────────────────────
  const submitMutation = useMutation({
    mutationFn: () => courseAPI.submit(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mentor-course-content', id] }); toast.success('Submitted for review!') },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  })

  const addLessonMutation = useMutation({
    mutationFn: (data: any) => mentorAPI.addLesson(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mentor-course-content', id] })
      setLessonForm({ title: '', videoUrl: '', content: '', duration: '' })
      setAddingLesson(false)
      toast.success('Lesson added!')
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to add lesson'),
  })

  const deleteLessonMutation = useMutation({
    mutationFn: (lessonId: string) => mentorAPI.deleteLesson(id, lessonId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mentor-course-content', id] }); toast.success('Lesson removed') },
  })

  const startBatchMutation = useMutation({
    mutationFn: (batchId: string) => mentorAPI.startBatch(batchId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mentor-course-batches', id] }); toast.success('Batch started!') },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  })

  const markDayMutation = useMutation({
    mutationFn: (batchId: string) => mentorAPI.markBatchDay(batchId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mentor-course-batches', id] }); toast.success('Day marked complete!') },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  })

  const createAssignmentMutation = useMutation({
    mutationFn: (data: any) => mentorAPI.createAssignment(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mentor-course-assignments', id] })
      setAssignForm({ title: '', description: '', dueDate: '', maxScore: '100' })
      setAddingAssignment(false)
      toast.success('Assignment created!')
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  })

  const deleteAssignmentMutation = useMutation({
    mutationFn: (assignmentId: string) => mentorAPI.deleteAssignment(assignmentId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mentor-course-assignments', id] }); toast.success('Assignment deleted') },
  })

  // ── Helpers ────────────────────────────────────────────────────────────────
  const handleAddLesson = () => {
    if (!lessonForm.title) return toast.error('Lesson title required')
    addLessonMutation.mutate({ ...lessonForm, duration: Number(lessonForm.duration) || 0 })
  }

  const handleCreateAssignment = () => {
    if (!assignForm.title || !assignForm.description) return toast.error('Title and description required')
    createAssignmentMutation.mutate({ ...assignForm, maxScore: Number(assignForm.maxScore) || 100 })
  }

  const getRecordingUrl = (url: string) => {
    const base = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/api$/, '')
    if (!url) return ''
    if (url.startsWith('http')) return url
    return `${base}${url}`
  }

  const course = courseData?.course
  const lessons: any[] = course?.lessons || []

  if (courseLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-400" /></div>
  if (!course) return <p className="text-gray-400">Course not found or not assigned to you.</p>

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'curriculum', label: 'Curriculum', icon: BookOpen },
    { key: 'batches', label: 'Batches', icon: Layers },
    { key: 'sessions', label: 'Sessions', icon: PlayCircle },
    { key: 'assignments', label: 'Assignments', icon: ClipboardList },
  ]

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href="/mentor/courses" className="mt-1 w-8 h-8 bg-dark-800 rounded-lg flex items-center justify-center border border-white/5 hover:bg-white/5 transition-colors flex-shrink-0">
            <ArrowLeft className="w-4 h-4 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{course.title}</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className={`text-xs px-2 py-1 rounded-full capitalize ${STATUS_COLOR[course.status] || STATUS_COLOR.draft}`}>{course.status}</span>
              <span className="text-xs text-gray-400 flex items-center gap-1"><BookOpen className="w-3 h-3" /> {lessons.length} lessons</span>
              <span className="text-xs text-gray-400 flex items-center gap-1"><Users className="w-3 h-3" /> {course.enrolledCount || 0} students</span>
            </div>
          </div>
        </div>
        {course.status === 'draft' && (
          <button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending || lessons.length === 0}
            className="btn-primary flex items-center gap-2 flex-shrink-0 text-sm">
            {submitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Submit for Review
          </button>
        )}
        {course.status === 'approved' && (
          <span className="flex items-center gap-2 text-sm text-green-400 flex-shrink-0">
            <CheckCircle className="w-4 h-4" /> Published
          </span>
        )}
      </div>

      {course.status === 'rejected' && course.rejectionReason && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-400">
          <p className="font-semibold mb-1">Rejection Reason:</p>
          <p>{course.rejectionReason}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-800 p-1 rounded-xl border border-white/5">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}>
            <t.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── TAB: Curriculum ── */}
      {tab === 'curriculum' && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Lessons ({lessons.length})</h2>
            {course.status !== 'approved' && (
              <button onClick={() => setAddingLesson(!addingLesson)} className="btn-outline flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4" /> Add Lesson
              </button>
            )}
          </div>

          {addingLesson && (
            <div className="bg-dark-700 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-white">New Lesson</h3>
              <input value={lessonForm.title} onChange={e => setLessonForm(f => ({ ...f, title: e.target.value }))}
                className="input text-sm" placeholder="Lesson title *" />
              <input value={lessonForm.videoUrl} onChange={e => setLessonForm(f => ({ ...f, videoUrl: e.target.value }))}
                className="input text-sm" placeholder="Video URL (YouTube or direct)" />
              <textarea value={lessonForm.content} onChange={e => setLessonForm(f => ({ ...f, content: e.target.value }))}
                className="input text-sm min-h-[80px] resize-none" placeholder="Lesson notes / text content (optional)" />
              <input value={lessonForm.duration} onChange={e => setLessonForm(f => ({ ...f, duration: e.target.value }))}
                className="input text-sm" type="number" placeholder="Duration (minutes)" min="0" />
              <div className="flex gap-2">
                <button onClick={handleAddLesson} disabled={addLessonMutation.isPending} className="btn-primary text-sm flex items-center gap-2">
                  {addLessonMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Add
                </button>
                <button onClick={() => setAddingLesson(false)} className="btn-outline text-sm">Cancel</button>
              </div>
            </div>
          )}

          {lessons.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <BookOpen className="w-10 h-10 mx-auto mb-3 text-gray-600" />
              <p className="text-sm">No lessons yet. Add your first lesson to start building.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lessons.map((lesson: any, idx: number) => (
                <div key={lesson._id} className="flex items-center gap-3 p-3 bg-dark-700 rounded-xl">
                  <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    {lesson.videoUrl ? <Video className="w-4 h-4 text-primary-400" /> : <FileText className="w-4 h-4 text-primary-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{idx + 1}. {lesson.title}</p>
                    <p className="text-xs text-gray-500">{lesson.duration ? `${lesson.duration} min` : 'Reading'}</p>
                  </div>
                  {course.status !== 'approved' && (
                    <button onClick={() => deleteLessonMutation.mutate(lesson._id)} disabled={deleteLessonMutation.isPending}
                      className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-500/10 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Course details */}
          <div className="border-t border-white/5 pt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div><p className="text-gray-500">Category</p><p className="text-white capitalize">{course.category}</p></div>
            <div><p className="text-gray-500">Level</p><p className="text-white capitalize">{course.level}</p></div>
            <div><p className="text-gray-500">Price</p><p className="text-white">₹{course.price?.toLocaleString()}</p></div>
            <div><p className="text-gray-500">Language</p><p className="text-white">{course.language}</p></div>
            <div><p className="text-gray-500">Rating</p><p className="text-white">{course.rating?.toFixed(1) || 'N/A'}</p></div>
            <div><p className="text-gray-500">Enrollments</p><p className="text-white">{course.enrolledCount || 0}</p></div>
          </div>
        </div>
      )}

      {/* ── TAB: Batches ── */}
      {tab === 'batches' && (
        <div className="space-y-4">
          {batchesLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary-400" /></div>
          ) : !batchesData?.length ? (
            <div className="card text-center py-12">
              <Layers className="w-10 h-10 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400 text-sm">No batches found for this course.</p>
              <p className="text-gray-500 text-xs mt-1">Batches are created by admin. Contact admin to create batches.</p>
            </div>
          ) : (
            batchesData.map((batch: any) => (
              <div key={batch._id} className="card">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-white font-semibold">Batch {batch.batchNumber}</h3>
                      {batch.label && <span className="text-gray-400 text-sm">— {batch.label}</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${BATCH_COLOR[batch.status] || BATCH_COLOR.pending}`}>{batch.status}</span>
                    </div>
                    {batch.startDate && (
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Started: {new Date(batch.startDate).toLocaleDateString()}
                        {batch.closingDate && ` · Closes: ${new Date(batch.closingDate).toLocaleDateString()}`}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {batch.status === 'pending' && (
                      <button
                        onClick={() => startBatchMutation.mutate(batch._id)}
                        disabled={startBatchMutation.isPending}
                        className="btn-primary text-xs flex items-center gap-1">
                        {startBatchMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                        Start Batch
                      </button>
                    )}
                    {batch.status === 'active' && (
                      <button
                        onClick={() => markDayMutation.mutate(batch._id)}
                        disabled={markDayMutation.isPending}
                        className="btn-outline text-xs flex items-center gap-1">
                        {markDayMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                        Mark Day Done
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div className="bg-dark-700 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-white">{batch.daysCompleted || 0}</p>
                    <p className="text-xs text-gray-500">Days Done</p>
                  </div>
                  <div className="bg-dark-700 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-white">{batch.totalDays || '∞'}</p>
                    <p className="text-xs text-gray-500">Total Days</p>
                  </div>
                  <div className="bg-dark-700 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-white">{batch.enrolledCount || 0}</p>
                    <p className="text-xs text-gray-500">Enrolled</p>
                  </div>
                  <div className="bg-dark-700 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-white">{batch.maxStrength || '∞'}</p>
                    <p className="text-xs text-gray-500">Max Seats</p>
                  </div>
                </div>

                {batch.totalDays > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{Math.round(((batch.daysCompleted || 0) / batch.totalDays) * 100)}%</span>
                    </div>
                    <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, ((batch.daysCompleted || 0) / batch.totalDays) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── TAB: Sessions ── */}
      {tab === 'sessions' && (
        <div className="space-y-4">
          {sessionsLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary-400" /></div>
          ) : !sessionsData?.length ? (
            <div className="card text-center py-12">
              <PlayCircle className="w-10 h-10 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400 text-sm">No class sessions yet.</p>
              <p className="text-gray-500 text-xs mt-1">Ended live classes with recordings will appear here.</p>
            </div>
          ) : (
            sessionsData.map((session: any, idx: number) => (
              <div key={session._id} className="card space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 bg-dark-700 px-2 py-0.5 rounded-full">
                        {session.batch ? `Batch ${session.batch.batchNumber}` : 'General'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {session.scheduledAt ? new Date(session.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                      </span>
                    </div>
                    <h3 className="text-white font-semibold mt-1">{session.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      {session.duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{session.duration} min</span>}
                      <span className={`px-1.5 py-0.5 rounded text-xs ${session.status === 'ended' ? 'bg-gray-500/20 text-gray-400' : 'bg-green-500/20 text-green-400'}`}>
                        {session.status}
                      </span>
                    </div>
                  </div>
                  {session.recordingUrl && (
                    <a
                      href={getRecordingUrl(session.recordingUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-shrink-0 flex items-center gap-1.5 bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                      <PlayCircle className="w-4 h-4" /> Watch
                    </a>
                  )}
                </div>

                {/* Summary */}
                {session.summary && (
                  <div className="bg-dark-700 rounded-xl p-3">
                    <p className="text-xs font-semibold text-gray-400 mb-1 flex items-center gap-1">
                      <BarChart2 className="w-3.5 h-3.5" /> AI Summary
                    </p>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{session.summary}</p>
                  </div>
                )}

                {/* Mentor Notes */}
                {session.mentorNotes && (
                  <div className="bg-dark-700 rounded-xl p-3">
                    <p className="text-xs font-semibold text-gray-400 mb-1 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" /> Mentor Notes
                    </p>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{session.mentorNotes}</p>
                  </div>
                )}

                {/* Attendance */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {(session.attendanceRecords || []).filter((r: any) => r.isPresent).length} attended
                  </span>
                  {session.recordingSize && (
                    <span>{(session.recordingSize / 1024 / 1024).toFixed(1)} MB</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── TAB: Assignments ── */}
      {tab === 'assignments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Assignments</h2>
            <button onClick={() => setAddingAssignment(!addingAssignment)} className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> New Assignment
            </button>
          </div>

          {addingAssignment && (
            <div className="card space-y-3">
              <h3 className="text-sm font-semibold text-white">Create Assignment</h3>
              <input
                value={assignForm.title}
                onChange={e => setAssignForm(f => ({ ...f, title: e.target.value }))}
                className="input text-sm" placeholder="Assignment title *" />
              <textarea
                value={assignForm.description}
                onChange={e => setAssignForm(f => ({ ...f, description: e.target.value }))}
                className="input text-sm min-h-[100px] resize-none"
                placeholder="Detailed instructions for students *" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Due Date (optional)</label>
                  <input
                    type="datetime-local"
                    value={assignForm.dueDate}
                    onChange={e => setAssignForm(f => ({ ...f, dueDate: e.target.value }))}
                    className="input text-sm [color-scheme:dark]" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Max Score</label>
                  <input
                    type="number"
                    value={assignForm.maxScore}
                    onChange={e => setAssignForm(f => ({ ...f, maxScore: e.target.value }))}
                    className="input text-sm" min="1" max="1000" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleCreateAssignment} disabled={createAssignmentMutation.isPending} className="btn-primary text-sm flex items-center gap-2">
                  {createAssignmentMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Create
                </button>
                <button onClick={() => setAddingAssignment(false)} className="btn-outline text-sm">Cancel</button>
              </div>
            </div>
          )}

          {assignmentsLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary-400" /></div>
          ) : !assignmentsData?.length ? (
            <div className="card text-center py-12">
              <ClipboardList className="w-10 h-10 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400 text-sm">No assignments yet.</p>
            </div>
          ) : (
            assignmentsData.map((a: any) => (
              <div key={a._id} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold truncate">{a.title}</h3>
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">{a.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 flex-wrap">
                      {a.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Due: {new Date(a.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      <span className="flex items-center gap-1"><BarChart2 className="w-3 h-3" /> Max: {a.maxScore} pts</span>
                      <span className="flex items-center gap-1"><FileCheck className="w-3 h-3" /> {(a.submissions || []).length} submitted</span>
                    </div>
                  </div>
                  <button
                    onClick={() => { if (confirm('Delete this assignment?')) deleteAssignmentMutation.mutate(a._id) }}
                    disabled={deleteAssignmentMutation.isPending}
                    className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Submissions preview */}
                {(a.submissions || []).length > 0 && (
                  <div className="mt-3 border-t border-white/5 pt-3">
                    <p className="text-xs text-gray-500 mb-2">Recent Submissions</p>
                    <div className="space-y-1.5">
                      {a.submissions.slice(0, 3).map((sub: any) => (
                        <div key={sub._id} className="flex items-center justify-between bg-dark-700 rounded-lg px-3 py-2 text-xs">
                          <span className="text-gray-300">{sub.student?.name || 'Student'}</span>
                          <div className="flex items-center gap-2">
                            {sub.score != null && <span className="text-green-400">{sub.score}/{a.maxScore}</span>}
                            {sub.fileUrl && (
                              <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="text-primary-400 hover:text-primary-300">
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                      {a.submissions.length > 3 && (
                        <p className="text-xs text-gray-500 text-center">+{a.submissions.length - 3} more</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
