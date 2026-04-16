'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { courseAPI, mentorAPI, materialAPI } from '@/lib/api'
import {
  Plus, Trash2, Send, Loader2, BookOpen, Video, FileText,
  CheckCircle, Layers, PlayCircle, ClipboardList, Calendar,
  Clock, Users, ChevronRight, BarChart2, ArrowLeft, Eye,
  FileCheck, Download, FileDown, Link2, X, ChevronDown, ChevronUp,
  GraduationCap, Mic, Trophy
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

type Tab = 'curriculum' | 'batches' | 'sessions' | 'assignments' | 'notes' | 'quizzes'

function ScoreBar({ value, color = 'bg-primary-500' }: { value: number; color?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-7 text-right">{value}%</span>
    </div>
  )
}

function MentorBatchCard({ batch, isOpen, subTab, onToggle, onSubTab, onStartBatch, onMarkDay, startPending, markPending, mentorAPI }: any) {
  const { data: perfData, isLoading: perfLoading } = useQuery({
    queryKey: ['mentor-batch-perf', batch._id],
    queryFn: () => mentorAPI.batchPerformance(batch._id).then((r: any) => r.data),
    enabled: isOpen && subTab === 'leaderboard',
  })

  return (
    <div className="rounded-2xl border border-white/10 overflow-hidden bg-dark-800">
      {/* Batch header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
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
              <button onClick={onStartBatch} disabled={startPending}
                className="btn-primary text-xs flex items-center gap-1">
                {startPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null} Start Batch
              </button>
            )}
            {batch.status === 'active' && (
              <button onClick={onMarkDay} disabled={markPending}
                className="btn-outline text-xs flex items-center gap-1">
                {markPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />} Mark Day Done
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
          {[
            { v: batch.daysCompleted || 0, l: 'Days Done' },
            { v: batch.totalDays || '∞', l: 'Total Days' },
            { v: batch.enrolledCount || 0, l: 'Enrolled' },
            { v: batch.maxStrength || '∞', l: 'Max Seats' },
          ].map(s => (
            <div key={s.l} className="bg-dark-700 rounded-xl p-2 text-center">
              <p className="text-lg font-bold text-white">{s.v}</p>
              <p className="text-xs text-gray-500">{s.l}</p>
            </div>
          ))}
        </div>
        {batch.totalDays > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Batch Progress</span>
              <span>{Math.round(((batch.daysCompleted || 0) / batch.totalDays) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
              <div className="h-full bg-primary-500 rounded-full" style={{ width: `${Math.min(100, ((batch.daysCompleted || 0) / batch.totalDays) * 100)}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Students / Leaderboard toggle */}
      <div className="border-t border-white/5">
        <button onClick={onToggle}
          className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
          <span className="flex items-center gap-2"><Users className="w-4 h-4" /> Students & Performance ({batch.enrolledCount})</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {isOpen && (
          <>
            <div className="flex border-t border-white/5">
              <button onClick={() => onSubTab('students')}
                className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${subTab === 'students' ? 'bg-white/5 text-white border-b-2 border-primary-500' : 'text-gray-500 hover:text-white'}`}>
                <Users className="w-3.5 h-3.5" /> Students
              </button>
              <button onClick={() => onSubTab('leaderboard')}
                className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${subTab === 'leaderboard' ? 'bg-white/5 text-white border-b-2 border-yellow-500' : 'text-gray-500 hover:text-white'}`}>
                <Trophy className="w-3.5 h-3.5" /> Leaderboard
              </button>
            </div>

            {subTab === 'students' && (
              <div className="px-4 py-3 text-xs text-gray-500 text-center border-t border-white/5">
                Switch to Leaderboard to see detailed student performance.
              </div>
            )}

            {subTab === 'leaderboard' && (
              <div className="border-t border-white/5">
                {perfLoading ? (
                  <div className="py-6 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-yellow-400" /></div>
                ) : !perfData?.performance?.length ? (
                  <div className="py-6 text-center text-gray-600 text-sm">No performance data yet</div>
                ) : (
                  <>
                    <div className="divide-y divide-white/5">
                      {perfData.performance.map((p: any, i: number) => (
                        <div key={i} className={`px-4 py-3 ${i === 0 ? 'bg-yellow-500/5' : ''}`}>
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-6 text-center flex-shrink-0">
                              {i === 0 ? <Trophy className="w-4 h-4 text-yellow-400 mx-auto" />
                                : <span className={`text-sm font-bold ${i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-gray-600'}`}>{i + 1}</span>}
                            </div>
                            {p.student?.avatar
                              ? <img src={p.student.avatar} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                              : <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold text-xs flex-shrink-0">{p.student?.name?.[0] || '?'}</div>}
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-semibold truncate">{p.student?.name}</p>
                              <p className="text-gray-500 text-xs truncate">{p.student?.email}</p>
                            </div>
                            <div className="flex-shrink-0 text-right">
                              <span className={`text-lg font-black ${p.compositeScore >= 80 ? 'text-green-400' : p.compositeScore >= 50 ? 'text-yellow-400' : 'text-gray-400'}`}>
                                {p.compositeScore}
                              </span>
                              <p className="text-xs text-gray-600">score</p>
                            </div>
                          </div>
                          <div className="ml-9 space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-600 w-20">Progress</span>
                              <ScoreBar value={p.progressPercent} color="bg-blue-500" />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-600 w-20">Attendance</span>
                              <ScoreBar value={p.attendancePct} color="bg-green-500" />
                            </div>
                            {p.totalAssignments > 0 && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-600 w-20">Assignments</span>
                                <div className="flex-1">
                                  <ScoreBar value={p.avgAssignmentScore} color="bg-violet-500" />
                                </div>
                                <span className="text-xs text-gray-600 flex-shrink-0">{p.assignmentsSubmitted}/{p.totalAssignments}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-2 text-xs text-gray-600 border-t border-white/5">
                      Score = Progress 40% · Attendance 30% · Assignments 30%
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function MentorCourseDetail({ params }: { params: { id: string } }) {
  const { id } = params
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('curriculum')
  const [selectedBatch, setSelectedBatch] = useState('')

  // ── Curriculum state ───────────────────────────────────────────────────────
  const [addingLesson, setAddingLesson] = useState(false)
  const [lessonForm, setLessonForm] = useState({ title: '', videoUrl: '', content: '', duration: '' })
  const [addingModule, setAddingModule] = useState(false)
  const [moduleForm, setModuleForm] = useState({ title: '', description: '', batchId: '' })
  const [editingModule, setEditingModule] = useState<string | null>(null)
  const [editModuleForm, setEditModuleForm] = useState({ title: '', description: '', batchId: '' })
  const [addingLessonToModule, setAddingLessonToModule] = useState<string | null>(null) // moduleId
  const [newLessonForm, setNewLessonForm] = useState({ title: '', type: 'video', videoUrl: '', duration: '', isPreview: false })
  const [editingLesson, setEditingLesson] = useState<{ moduleId: string; lessonId: string } | null>(null)
  const [editLessonForm, setEditLessonForm] = useState({ title: '', type: 'video', videoUrl: '', duration: '', isPreview: false })

  // ── Assignment state ───────────────────────────────────────────────────────
  const [addingAssignment, setAddingAssignment] = useState(false)
  const [assignForm, setAssignForm] = useState({ title: '', description: '', dueDate: '', maxScore: '100', lessonId: '', batchId: '' })
  const [assignRefFiles, setAssignRefFiles] = useState<{ url: string; name: string; type: string }[]>([])
  const [assignRefUploading, setAssignRefUploading] = useState(false)

  // ── Notes state ────────────────────────────────────────────────────────────
  const [addingNote, setAddingNote] = useState(false)
  const [noteForm, setNoteForm] = useState({ title: '', url: '', description: '', type: 'pdf', lessonId: '', batchId: '' })
  const [noteUploadMode, setNoteUploadMode] = useState<'file' | 'link'>('file')
  const [noteUploading, setNoteUploading] = useState(false)

  // ── Assignment review state ────────────────────────────────────────────────
  const [reviewingSubmission, setReviewingSubmission] = useState<{ assignmentId: string; studentId: string; maxScore: number } | null>(null)
  const [reviewForm, setReviewForm] = useState({ score: '', feedback: '' })

  // ── Quiz state ─────────────────────────────────────────────────────────────
  const [addingQuiz, setAddingQuiz] = useState(false)
  const [quizForm, setQuizForm] = useState({ title: '', duration: '30', passingScore: '70', lessonId: '', batchId: '', questions: [] as { question: string; options: string[]; correctOption: number; marks: number }[] })
  const [addingQuestion, setAddingQuestion] = useState(false)
  const [qForm, setQForm] = useState({ question: '', options: ['','','',''], correctOption: 0, marks: 1 })

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: courseData, isLoading: courseLoading } = useQuery({
    queryKey: ['mentor-course-content', id],
    queryFn: () => mentorAPI.courseDetail(id).then(r => r.data),
  })

  const { data: batchesData, isLoading: batchesLoading } = useQuery({
    queryKey: ['mentor-course-batches', id],
    queryFn: () => mentorAPI.courseBatches(id).then(r => r.data.batches),
    enabled: true,
  })

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['mentor-course-sessions', id],
    queryFn: () => mentorAPI.courseSessions(id).then(r => r.data.sessions),
    enabled: tab === 'sessions',
  })

  const { data: assignmentsData, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['mentor-course-assignments', id, selectedBatch],
    queryFn: () => mentorAPI.courseAssignments(id, selectedBatch).then(r => r.data.assignments),
    enabled: tab === 'assignments',
  })

  const { data: notesData, isLoading: notesLoading } = useQuery({
    queryKey: ['mentor-course-notes', id, selectedBatch],
    queryFn: () => materialAPI.courseMaterials(id, undefined, selectedBatch).then(r => r.data.data),
    enabled: tab === 'notes',
  })

  const { data: quizzesData, isLoading: quizzesLoading } = useQuery({
    queryKey: ['mentor-course-quizzes', id, selectedBatch],
    queryFn: () => mentorAPI.courseQuizzes(id, selectedBatch).then(r => r.data.quizzes),
    enabled: tab === 'quizzes',
  })

  const addNoteMutation = useMutation({
    mutationFn: (data: any) => materialAPI.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mentor-course-notes', id] })
      setNoteForm({ title: '', url: '', description: '', type: 'pdf', lessonId: '', batchId: '' })
      setNoteUploadMode('file')
      setAddingNote(false)
      toast.success('Note added!')
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  })

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => materialAPI.delete(noteId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mentor-course-notes', id] }); toast.success('Deleted') },
  })

  const createQuizMutation = useMutation({
    mutationFn: (data: any) => mentorAPI.createCourseQuiz(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mentor-course-quizzes', id] })
      setAddingQuiz(false)
      setQuizForm({ title: '', duration: '30', passingScore: '70', lessonId: '', batchId: '', questions: [] })
      toast.success('Quiz created!')
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  })

  const deleteQuizMutation = useMutation({
    mutationFn: (quizId: string) => mentorAPI.deleteQuiz(quizId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mentor-course-quizzes', id] }); toast.success('Quiz deleted') },
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

  const addModuleMutation = useMutation({
    mutationFn: (data: any) => mentorAPI.addModule(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mentor-course-content', id] }); setAddingModule(false); setModuleForm({ title: '', description: '', batchId: '' }); toast.success('Module added!') },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  })
  const editModuleMutation = useMutation({
    mutationFn: ({ moduleId, data }: any) => mentorAPI.editModule(id, moduleId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mentor-course-content', id] }); setEditingModule(null); toast.success('Module updated!') },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  })
  const deleteModuleMutation = useMutation({
    mutationFn: (moduleId: string) => mentorAPI.deleteModule(id, moduleId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mentor-course-content', id] }); toast.success('Module deleted') },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  })
  const addLessonToModuleMutation = useMutation({
    mutationFn: ({ moduleId, data }: any) => mentorAPI.addLessonToModule(id, moduleId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mentor-course-content', id] }); setAddingLessonToModule(null); setNewLessonForm({ title: '', type: 'video', videoUrl: '', duration: '', isPreview: false }); toast.success('Lesson added!') },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  })
  const editLessonMutation = useMutation({
    mutationFn: ({ moduleId, lessonId, data }: any) => mentorAPI.editLesson(id, moduleId, lessonId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mentor-course-content', id] }); setEditingLesson(null); toast.success('Lesson updated!') },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  })
  const deleteLessonFromModuleMutation = useMutation({
    mutationFn: ({ moduleId, lessonId }: any) => mentorAPI.deleteLessonFromModule(id, moduleId, lessonId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mentor-course-content', id] }); toast.success('Lesson deleted') },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
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
      setAssignForm({ title: '', description: '', dueDate: '', maxScore: '100', lessonId: '', batchId: '' })
      setAssignRefFiles([])
      setAddingAssignment(false)
      toast.success('Assignment created!')
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  })

  const deleteAssignmentMutation = useMutation({
    mutationFn: (assignmentId: string) => mentorAPI.deleteAssignment(assignmentId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mentor-course-assignments', id] }); toast.success('Assignment deleted') },
  })

  const reviewAssignmentMutation = useMutation({
    mutationFn: ({ assignmentId, studentId, data }: { assignmentId: string; studentId: string; data: any }) =>
      mentorAPI.reviewAssignment(assignmentId, studentId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mentor-course-assignments', id] })
      setReviewingSubmission(null)
      setReviewForm({ score: '', feedback: '' })
      toast.success('Review saved!')
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  })

  // ── Helpers ────────────────────────────────────────────────────────────────
  const handleAddLesson = () => {
    if (!lessonForm.title) return toast.error('Lesson title required')
    addLessonMutation.mutate({ ...lessonForm, duration: Number(lessonForm.duration) || 0 })
  }

  const handleCreateAssignment = () => {
    if (!assignForm.title || !assignForm.description) return toast.error('Title and description required')
    createAssignmentMutation.mutate({ ...assignForm, maxScore: Number(assignForm.maxScore) || 100, lessonId: assignForm.lessonId || undefined, batchId: assignForm.batchId || undefined, referenceFiles: assignRefFiles })
  }

  const getRecordingUrl = (url: string) => {
    const base = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/api$/, '')
    if (!url) return ''
    if (url.startsWith('http')) return url
    return `${base}${url}`
  }

  const [openModule, setOpenModule] = useState<number>(0)
  const [openBatchPerf, setOpenBatchPerf] = useState<string | null>(null)
  const [batchPerfTab, setBatchPerfTab] = useState<Record<string, 'students' | 'leaderboard'>>({})
  const course = courseData?.course
  const modules: any[] = course?.modules || []
  const totalLessons = modules.reduce((s: number, m: any) => s + (m.lessons?.length || 0), 0)

  if (courseLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-400" /></div>
  if (!course) return <p className="text-gray-400">Course not found or not assigned to you.</p>

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'curriculum', label: 'Curriculum', icon: BookOpen },
    { key: 'batches', label: 'Batches', icon: Layers },
    { key: 'sessions', label: 'Sessions', icon: PlayCircle },
    { key: 'assignments', label: 'Assignments', icon: ClipboardList },
    { key: 'notes', label: 'Notes', icon: FileDown },
    { key: 'quizzes', label: 'Quizzes', icon: GraduationCap },
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
              <span className="text-xs text-gray-400 flex items-center gap-1"><BookOpen className="w-3 h-3" /> {totalLessons} lessons</span>
              <span className="text-xs text-gray-400 flex items-center gap-1"><Users className="w-3 h-3" /> {course.enrolledCount || 0} students</span>
            </div>
          </div>
        </div>
        {course.status === 'draft' && (
          <button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending || totalLessons === 0}
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

      {/* Batch filter - shown for sessions/assignments/notes/quizzes tabs */}
      {['sessions','assignments','notes','quizzes'].includes(tab) && batchesData?.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setSelectedBatch('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${!selectedBatch ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'bg-white/5 text-gray-400 border border-white/10'}`}>
            All Batches
          </button>
          {batchesData.map((b: any) => (
            <button key={b._id} onClick={() => setSelectedBatch(b._id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${selectedBatch === b._id ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'bg-white/5 text-gray-400 border border-white/10'}`}>
              Batch {b.batchNumber}{b.label ? ` — ${b.label}` : ''}
            </button>
          ))}
        </div>
      )}

      {/* ── TAB: Curriculum ── */}
      {tab === 'curriculum' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Curriculum</h2>
              <p className="text-gray-500 text-sm">{modules.length} modules · {totalLessons} lessons</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setAddingModule(v => !v)} className="btn-primary flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4" /> Add Module
              </button>
              <Link href={`/mentor/classes/new?courseId=${id}`} className="btn-outline flex items-center gap-2 text-sm">
                <Mic className="w-4 h-4" /> Schedule Class
              </Link>
            </div>
          </div>

          {/* Add module form */}
          {addingModule && (
            <div className="card space-y-3">
              <h3 className="text-sm font-semibold text-white">New Module</h3>
              <input value={moduleForm.title} onChange={e => setModuleForm(f => ({ ...f, title: e.target.value }))} className="input text-sm w-full" placeholder="Module title *" />
              <input value={moduleForm.description} onChange={e => setModuleForm(f => ({ ...f, description: e.target.value }))} className="input text-sm w-full" placeholder="Description (optional)" />
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Batch (optional — only that batch sees this module)</label>
                <select value={moduleForm.batchId} onChange={e => setModuleForm(f => ({ ...f, batchId: e.target.value }))} className="input text-sm w-full">
                  <option value="">All Batches (course-wide)</option>
                  {(batchesData || []).map((b: any) => (
                    <option key={b._id} value={b._id}>Batch {b.batchNumber}{b.label ? ` — ${b.label}` : ''}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { if (!moduleForm.title) return toast.error('Title required'); addModuleMutation.mutate({ ...moduleForm, batchId: moduleForm.batchId || undefined }) }} disabled={addModuleMutation.isPending} className="btn-primary text-sm flex items-center gap-1.5">
                  {addModuleMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Add
                </button>
                <button onClick={() => setAddingModule(false)} className="btn-outline text-sm">Cancel</button>
              </div>
            </div>
          )}

          {modules.length === 0 ? (
            <div className="card text-center py-12">
              <BookOpen className="w-10 h-10 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400 text-sm">No curriculum yet. Add a module to get started.</p>
            </div>
          ) : (
            modules.map((mod: any, mi: number) => (
              <div key={mod._id || mi} className="rounded-2xl border border-white/10 overflow-hidden bg-dark-800">
                {/* Module header */}
                {editingModule === mod._id ? (
                  <div className="px-4 py-3 space-y-2 bg-dark-700">
                    <input value={editModuleForm.title} onChange={e => setEditModuleForm(f => ({ ...f, title: e.target.value }))} className="input text-sm w-full" placeholder="Module title" />
                    <input value={editModuleForm.description} onChange={e => setEditModuleForm(f => ({ ...f, description: e.target.value }))} className="input text-sm w-full" placeholder="Description (optional)" />
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Batch</label>
                      <select value={editModuleForm.batchId} onChange={e => setEditModuleForm(f => ({ ...f, batchId: e.target.value }))} className="input text-sm w-full">
                        <option value="">All Batches (course-wide)</option>
                        {(batchesData || []).map((b: any) => (
                          <option key={b._id} value={b._id}>Batch {b.batchNumber}{b.label ? ` — ${b.label}` : ''}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => editModuleMutation.mutate({ moduleId: mod._id, data: { ...editModuleForm, batchId: editModuleForm.batchId || undefined } })} disabled={editModuleMutation.isPending} className="btn-primary text-xs flex items-center gap-1">
                        {editModuleMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />} Save
                      </button>
                      <button onClick={() => setEditingModule(null)} className="btn-outline text-xs">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <button onClick={() => setOpenModule(openModule === mi ? -1 : mi)} className="flex items-center gap-3 flex-1 text-left min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-primary-500/20 text-primary-400 flex items-center justify-center text-xs font-black flex-shrink-0">{mi + 1}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{mod.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {mod.description && <p className="text-gray-500 text-xs truncate">{mod.description}</p>}
                          {mod.batch && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 flex-shrink-0">
                              {(batchesData || []).find((b: any) => b._id === (mod.batch?._id || mod.batch)?.toString?.() || b._id === mod.batch?.toString())
                                ? `Batch ${(batchesData || []).find((b: any) => b._id === (mod.batch?._id || mod.batch)?.toString?.() || b._id === mod.batch?.toString())?.batchNumber}`
                                : 'Batch'}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-gray-500 text-xs flex-shrink-0">{(mod.lessons || []).length} lessons</span>
                      {openModule === mi ? <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />}
                    </button>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => { setEditingModule(mod._id); setEditModuleForm({ title: mod.title, description: mod.description || '', batchId: mod.batch?._id?.toString() || mod.batch?.toString() || '' }) }}
                        className="p-1.5 text-gray-500 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { if (confirm('Delete this module and all its lessons?')) deleteModuleMutation.mutate(mod._id) }}
                        disabled={deleteModuleMutation.isPending}
                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {openModule === mi && (
                  <div className="border-t border-white/5">
                    {(mod.lessons || []).length === 0 ? (
                      <p className="text-gray-600 text-xs text-center py-4">No lessons yet</p>
                    ) : (mod.lessons || []).map((lesson: any, li: number) => (
                      <div key={lesson._id || li}>
                        {editingLesson?.moduleId === mod._id && editingLesson?.lessonId === lesson._id ? (
                          <div className="px-4 py-3 bg-dark-700 space-y-2 border-b border-white/5">
                            <input value={editLessonForm.title} onChange={e => setEditLessonForm(f => ({ ...f, title: e.target.value }))} className="input text-sm w-full" placeholder="Lesson title" />
                            <div className="grid grid-cols-2 gap-2">
                              <select value={editLessonForm.type} onChange={e => setEditLessonForm(f => ({ ...f, type: e.target.value }))} className="input text-sm">
                                <option value="video">Video</option>
                                <option value="live">Live Class</option>
                                <option value="document">Document</option>
                                <option value="quiz">Quiz</option>
                              </select>
                              <input type="number" value={editLessonForm.duration} onChange={e => setEditLessonForm(f => ({ ...f, duration: e.target.value }))} className="input text-sm" placeholder="Duration (min)" />
                            </div>
                            <input value={editLessonForm.videoUrl} onChange={e => setEditLessonForm(f => ({ ...f, videoUrl: e.target.value }))} className="input text-sm w-full" placeholder="Video URL (optional)" />
                            <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                              <input type="checkbox" checked={editLessonForm.isPreview} onChange={e => setEditLessonForm(f => ({ ...f, isPreview: e.target.checked }))} className="rounded" />
                              Free preview
                            </label>
                            <div className="flex gap-2">
                              <button onClick={() => editLessonMutation.mutate({ moduleId: mod._id, lessonId: lesson._id, data: { ...editLessonForm, duration: Number(editLessonForm.duration) || 0 } })} disabled={editLessonMutation.isPending} className="btn-primary text-xs flex items-center gap-1">
                                {editLessonMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />} Save
                              </button>
                              <button onClick={() => setEditingLesson(null)} className="btn-outline text-xs">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] border-b border-white/5 last:border-0">
                            <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                              {lesson.type === 'live' ? <Mic className="w-3 h-3 text-violet-400" />
                                : lesson.type === 'video' ? <Video className="w-3 h-3 text-blue-400" />
                                : lesson.type === 'quiz' ? <GraduationCap className="w-3 h-3 text-yellow-400" />
                                : <FileText className="w-3 h-3 text-gray-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white truncate">{lesson.title}</p>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-600">
                                <span className="capitalize">{lesson.type}</span>
                                {lesson.duration > 0 && <span>{lesson.duration} min</span>}
                                {lesson.isPreview && <span className="text-green-500">Free preview</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {lesson.type === 'live' && !lesson.videoUrl && (
                                <Link href={`/mentor/classes/new?courseId=${id}&lessonId=${lesson._id}`}
                                  className="text-xs text-primary-400 bg-primary-500/10 px-2 py-1 rounded-lg flex items-center gap-1">
                                  <Mic className="w-3 h-3" /> Schedule
                                </Link>
                              )}
                              {lesson.videoUrl && (
                                <a href={lesson.videoUrl} target="_blank" rel="noreferrer" className="text-green-400 p-1 hover:bg-green-500/10 rounded">
                                  <PlayCircle className="w-3.5 h-3.5" />
                                </a>
                              )}
                              <button onClick={() => { setEditingLesson({ moduleId: mod._id, lessonId: lesson._id }); setEditLessonForm({ title: lesson.title, type: lesson.type, videoUrl: lesson.videoUrl || '', duration: String(lesson.duration || ''), isPreview: lesson.isPreview || false }) }}
                                className="p-1.5 text-gray-500 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors">
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => { if (confirm('Delete this lesson?')) deleteLessonFromModuleMutation.mutate({ moduleId: mod._id, lessonId: lesson._id }) }}
                                disabled={deleteLessonFromModuleMutation.isPending}
                                className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Add lesson form */}
                    {addingLessonToModule === mod._id ? (
                      <div className="px-4 py-3 bg-dark-700 space-y-2 border-t border-white/5">
                        <p className="text-xs font-semibold text-gray-300">Add Lesson</p>
                        <input value={newLessonForm.title} onChange={e => setNewLessonForm(f => ({ ...f, title: e.target.value }))} className="input text-sm w-full" placeholder="Lesson title *" />
                        <div className="grid grid-cols-2 gap-2">
                          <select value={newLessonForm.type} onChange={e => setNewLessonForm(f => ({ ...f, type: e.target.value }))} className="input text-sm">
                            <option value="video">Video</option>
                            <option value="live">Live Class</option>
                            <option value="document">Document</option>
                            <option value="quiz">Quiz</option>
                          </select>
                          <input type="number" value={newLessonForm.duration} onChange={e => setNewLessonForm(f => ({ ...f, duration: e.target.value }))} className="input text-sm" placeholder="Duration (min)" />
                        </div>
                        <input value={newLessonForm.videoUrl} onChange={e => setNewLessonForm(f => ({ ...f, videoUrl: e.target.value }))} className="input text-sm w-full" placeholder="Video URL (optional)" />
                        <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                          <input type="checkbox" checked={newLessonForm.isPreview} onChange={e => setNewLessonForm(f => ({ ...f, isPreview: e.target.checked }))} className="rounded" />
                          Free preview
                        </label>
                        <div className="flex gap-2">
                          <button onClick={() => {
                            if (!newLessonForm.title) return toast.error('Lesson title required')
                            addLessonToModuleMutation.mutate({ moduleId: mod._id, data: { ...newLessonForm, duration: Number(newLessonForm.duration) || 0 } })
                          }} disabled={addLessonToModuleMutation.isPending} className="btn-primary text-xs flex items-center gap-1">
                            {addLessonToModuleMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Add Lesson
                          </button>
                          <button onClick={() => setAddingLessonToModule(null)} className="btn-outline text-xs">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setAddingLessonToModule(mod._id)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 text-xs text-gray-500 hover:text-primary-400 hover:bg-primary-500/5 transition-colors border-t border-white/5">
                        <Plus className="w-3.5 h-3.5" /> Add Lesson
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}

          {/* Course quick stats */}
          <div className="card grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div><p className="text-gray-500 text-xs">Category</p><p className="text-white capitalize">{course.category}</p></div>
            <div><p className="text-gray-500 text-xs">Level</p><p className="text-white capitalize">{course.level}</p></div>
            <div><p className="text-gray-500 text-xs">Language</p><p className="text-white">{course.language}</p></div>
            <div><p className="text-gray-500 text-xs">Enrolled</p><p className="text-white">{course.enrolledCount || 0}</p></div>
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
            batchesData.map((batch: any) => {
              const isOpen = openBatchPerf === batch._id
              const subTab = batchPerfTab[batch._id] || 'students'
              return (
                <MentorBatchCard
                  key={batch._id}
                  batch={batch}
                  isOpen={isOpen}
                  subTab={subTab}
                  onToggle={() => setOpenBatchPerf(isOpen ? null : batch._id)}
                  onSubTab={(t) => setBatchPerfTab(prev => ({ ...prev, [batch._id]: t }))}
                  onStartBatch={() => startBatchMutation.mutate(batch._id)}
                  onMarkDay={() => markDayMutation.mutate(batch._id)}
                  startPending={startBatchMutation.isPending}
                  markPending={markDayMutation.isPending}
                  mentorAPI={mentorAPI}
                />
              )
            })
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
            (selectedBatch ? sessionsData.filter((s: any) => s.batch?._id === selectedBatch) : sessionsData).map((session: any, idx: number) => (
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
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Link to Lesson (optional — student sees it in that lesson)</label>
                <select value={assignForm.lessonId} onChange={e => setAssignForm(f => ({ ...f, lessonId: e.target.value }))} className="input text-sm w-full">
                  <option value="">No specific lesson (course-level)</option>
                  {modules.map((mod: any, mi: number) => (
                    <optgroup key={mi} label={mod.title || `Module ${mi + 1}`}>
                      {(mod.lessons || []).map((l: any) => <option key={l._id} value={l._id}>{l.title}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Batch (optional — assign only to this batch)</label>
                <select value={assignForm.batchId} onChange={e => setAssignForm(f => ({ ...f, batchId: e.target.value }))} className="input text-sm w-full">
                  <option value="">All Batches</option>
                  {(batchesData || []).map((b: any) => (
                    <option key={b._id} value={b._id}>Batch {b.batchNumber}{b.label ? ` — ${b.label}` : ''}</option>
                  ))}
                </select>
              </div>
              {/* Reference files upload */}
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Reference Files (optional — students can download these)</label>
                <label className={`flex items-center gap-3 border border-dashed rounded-xl px-4 py-3 cursor-pointer transition-colors ${assignRefUploading ? 'border-primary-500/50 bg-primary-500/5' : 'border-white/10 hover:border-primary-500/40 hover:bg-primary-500/5'}`}>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.zip"
                    className="hidden"
                    disabled={assignRefUploading}
                    onChange={async e => {
                      const files = Array.from(e.target.files || [])
                      if (!files.length) return
                      setAssignRefUploading(true)
                      try {
                        const uploaded = await Promise.all(files.map(async file => {
                          const kind = file.type.startsWith('image/') ? 'image' : 'document'
                          const res = await materialAPI.uploadFile(file, kind)
                          return { url: res.data.url, name: file.name, type: kind }
                        }))
                        setAssignRefFiles(f => [...f, ...uploaded])
                        toast.success(`${uploaded.length} file${uploaded.length > 1 ? 's' : ''} uploaded`)
                      } catch (err: any) {
                        toast.error(err.response?.data?.message || 'Upload failed')
                      } finally {
                        setAssignRefUploading(false)
                        e.target.value = ''
                      }
                    }}
                  />
                  {assignRefUploading
                    ? <><Loader2 className="w-4 h-4 animate-spin text-primary-400" /><span className="text-xs text-primary-400">Uploading...</span></>
                    : <><FileDown className="w-4 h-4 text-gray-500" /><span className="text-xs text-gray-400">Click to attach PDF, Word, Image, etc. (multiple allowed)</span></>
                  }
                </label>
                {assignRefFiles.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {assignRefFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 bg-dark-700 rounded-lg px-3 py-2 text-xs">
                        <FileText className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" />
                        <span className="flex-1 truncate text-gray-300">{f.name}</span>
                        <button onClick={() => setAssignRefFiles(fs => fs.filter((_, j) => j !== i))} className="text-gray-600 hover:text-red-400">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button onClick={handleCreateAssignment} disabled={createAssignmentMutation.isPending || assignRefUploading} className="btn-primary text-sm flex items-center gap-2">
                  {createAssignmentMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Create
                </button>
                <button onClick={() => { setAddingAssignment(false); setAssignRefFiles([]) }} className="btn-outline text-sm">Cancel</button>
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
                    {/* Reference files */}
                    {(a.referenceFiles || []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {a.referenceFiles.map((f: any, i: number) => (
                          <a key={i} href={f.url} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1 text-[11px] text-primary-400 bg-primary-500/10 hover:bg-primary-500/20 px-2 py-1 rounded-lg border border-primary-500/15 transition-colors">
                            <FileDown className="w-3 h-3" />{f.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => { if (confirm('Delete this assignment?')) deleteAssignmentMutation.mutate(a._id) }}
                    disabled={deleteAssignmentMutation.isPending}
                    className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Submissions */}
                {(a.submissions || []).length > 0 && (
                  <div className="mt-3 border-t border-white/5 pt-3 space-y-1.5">
                    <p className="text-xs text-gray-500 mb-2">{a.submissions.length} Submission{a.submissions.length !== 1 ? 's' : ''}</p>
                    {a.submissions.map((sub: any) => (
                      <div key={sub._id} className="bg-dark-700 rounded-xl px-3 py-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-primary-400 text-xs font-bold">{(sub.student?.name || 'S')[0].toUpperCase()}</span>
                            </div>
                            <span className="text-gray-300 text-xs truncate">{sub.student?.name || 'Student'}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${sub.status === 'reviewed' ? 'bg-green-500/15 text-green-400' : 'bg-yellow-500/15 text-yellow-400'}`}>
                              {sub.status === 'reviewed' ? 'Reviewed' : 'Pending'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {sub.score != null && <span className="text-green-400 text-xs font-semibold">{sub.score}/{a.maxScore}</span>}
                            {sub.fileUrl && (
                              <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="text-primary-400 hover:text-primary-300 p-1 hover:bg-primary-500/10 rounded">
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              onClick={() => {
                                setReviewingSubmission({ assignmentId: a._id, studentId: sub.student?._id?.toString() || sub.student?.toString(), maxScore: a.maxScore })
                                setReviewForm({ score: sub.score?.toString() || '', feedback: sub.feedback || '' })
                              }}
                              className="text-xs text-primary-400 hover:text-white px-2 py-1 bg-primary-500/10 hover:bg-primary-500/20 rounded-lg transition-colors">
                              {sub.status === 'reviewed' ? 'Edit' : 'Review'}
                            </button>
                          </div>
                        </div>
                        {sub.feedback && <p className="text-xs text-gray-500 mt-1.5 italic">"{sub.feedback}"</p>}

                        {/* Inline review form */}
                        {reviewingSubmission?.assignmentId === a._id && reviewingSubmission?.studentId === sub.student?._id && (
                          <div className="mt-2.5 pt-2.5 border-t border-white/10 space-y-2">
                            <div className="flex items-center gap-3">
                              <label className="text-xs text-gray-400 flex-shrink-0">Score (max {a.maxScore}):</label>
                              <input
                                type="number" min={0} max={a.maxScore}
                                value={reviewForm.score}
                                onChange={e => setReviewForm(f => ({ ...f, score: e.target.value }))}
                                className="input text-sm py-1.5 w-24"
                                placeholder="0" />
                            </div>
                            <textarea
                              value={reviewForm.feedback}
                              onChange={e => setReviewForm(f => ({ ...f, feedback: e.target.value }))}
                              className="input text-xs resize-none w-full" rows={2}
                              placeholder="Feedback for student (optional)" />
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  const s = Number(reviewForm.score)
                                  if (isNaN(s) || s < 0 || s > a.maxScore) return toast.error(`Score must be 0–${a.maxScore}`)
                                  reviewAssignmentMutation.mutate({ assignmentId: a._id, studentId: sub.student?._id, data: { score: s, feedback: reviewForm.feedback } })
                                }}
                                disabled={reviewAssignmentMutation.isPending}
                                className="btn-primary text-xs flex items-center gap-1.5">
                                {reviewAssignmentMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                Save Review
                              </button>
                              <button onClick={() => { setReviewingSubmission(null); setReviewForm({ score: '', feedback: '' }) }} className="btn-outline text-xs">Cancel</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── TAB: Notes ── */}
      {tab === 'notes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Batch Notes & Resources</h2>
            <button onClick={() => setAddingNote(!addingNote)} className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Add Note
            </button>
          </div>

          {addingNote && (
            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Add Study Material</h3>
                <button onClick={() => setAddingNote(false)}><X className="w-4 h-4 text-gray-400" /></button>
              </div>

              {/* Upload mode toggle */}
              <div className="flex gap-1 bg-dark-700 rounded-lg p-1">
                <button
                  onClick={() => setNoteUploadMode('file')}
                  className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${noteUploadMode === 'file' ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-white'}`}>
                  Upload File
                </button>
                <button
                  onClick={() => setNoteUploadMode('link')}
                  className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${noteUploadMode === 'link' ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-white'}`}>
                  Paste Link
                </button>
              </div>

              {noteUploadMode === 'file' ? (
                <label className={`relative flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-6 cursor-pointer transition-colors ${noteUploading ? 'border-primary-500/50 bg-primary-500/5' : noteForm.url ? 'border-green-500/50 bg-green-500/5' : 'border-white/10 hover:border-primary-500/50 hover:bg-primary-500/5'}`}>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.gif"
                    className="hidden"
                    disabled={noteUploading}
                    onChange={async e => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setNoteUploading(true)
                      try {
                        const kind = file.type.startsWith('image/') ? 'image' : 'document'
                        const detectedType = file.type.startsWith('image/') ? 'image' : file.type === 'application/pdf' ? 'pdf' : 'doc'
                        const res = await materialAPI.uploadFile(file, kind)
                        const url = res.data.url
                        const autoTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
                        setNoteForm(f => ({ ...f, url, type: detectedType, title: f.title || autoTitle }))
                        toast.success('File uploaded!')
                      } catch (err: any) {
                        toast.error(err.response?.data?.message || 'Upload failed')
                      } finally {
                        setNoteUploading(false)
                      }
                      e.target.value = ''
                    }}
                  />
                  {noteUploading ? (
                    <>
                      <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
                      <p className="text-xs text-primary-400">Uploading...</p>
                    </>
                  ) : noteForm.url ? (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-green-400" />
                      </div>
                      <p className="text-xs text-green-400 font-medium">File uploaded successfully</p>
                      <p className="text-xs text-gray-500">Click to replace</p>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                        <FileDown className="w-5 h-5 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-300 font-medium">Click to upload file</p>
                      <p className="text-xs text-gray-500">PDF, Word, Excel, PowerPoint, Images</p>
                    </>
                  )}
                </label>
              ) : (
                <input
                  value={noteForm.url}
                  onChange={e => setNoteForm(f => ({ ...f, url: e.target.value }))}
                  className="input text-sm" placeholder="URL / Link * (Google Drive, PDF link, etc.)" />
              )}

              <input
                value={noteForm.title}
                onChange={e => setNoteForm(f => ({ ...f, title: e.target.value }))}
                className="input text-sm" placeholder="Title * (e.g. Python Variables Notes)" />
              <textarea
                value={noteForm.description}
                onChange={e => setNoteForm(f => ({ ...f, description: e.target.value }))}
                className="input text-sm resize-none" rows={2}
                placeholder="Brief description (optional)" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Type</label>
                  <select value={noteForm.type} onChange={e => setNoteForm(f => ({ ...f, type: e.target.value }))}
                    className="input text-sm">
                    <option value="pdf">PDF</option>
                    <option value="doc">Word / Excel / PPT</option>
                    <option value="video">Video</option>
                    <option value="link">Link</option>
                    <option value="image">Image</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Batch (optional)</label>
                  <select value={noteForm.batchId} onChange={e => setNoteForm(f => ({ ...f, batchId: e.target.value }))} className="input text-sm">
                    <option value="">All Batches</option>
                    {(batchesData || []).map((b: any) => (
                      <option key={b._id} value={b._id}>Batch {b.batchNumber}{b.label ? ` — ${b.label}` : ''}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-400 mb-1 block">Link to Lesson (optional)</label>
                  <select value={noteForm.lessonId} onChange={e => setNoteForm(f => ({ ...f, lessonId: e.target.value }))} className="input text-sm w-full">
                    <option value="">Course-level</option>
                    {modules.map((mod: any, mi: number) => (
                      <optgroup key={mi} label={mod.title || `Module ${mi + 1}`}>
                        {(mod.lessons || []).map((l: any) => <option key={l._id} value={l._id}>{l.title}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (!noteForm.title || !noteForm.url) return toast.error('Title and file/URL required')
                    addNoteMutation.mutate({ ...noteForm, courseId: id, lessonId: noteForm.lessonId || undefined, batchId: noteForm.batchId || undefined, isPublic: false })
                  }}
                  disabled={addNoteMutation.isPending || noteUploading}
                  className="btn-primary text-sm flex items-center gap-2">
                  {addNoteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Add
                </button>
                <button onClick={() => setAddingNote(false)} className="btn-outline text-sm">Cancel</button>
              </div>
            </div>
          )}

          {notesLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary-400" /></div>
          ) : !notesData?.length ? (
            <div className="card text-center py-12">
              <FileDown className="w-10 h-10 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400 text-sm">No notes uploaded yet.</p>
              <p className="text-gray-500 text-xs mt-1">Add PDF notes, links or documents that students can download.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notesData.map((m: any) => {
                const typeColor: Record<string, string> = {
                  pdf: 'text-red-400 bg-red-500/15', video: 'text-blue-400 bg-blue-500/15',
                  doc: 'text-yellow-400 bg-yellow-500/15', link: 'text-green-400 bg-green-500/15',
                  image: 'text-purple-400 bg-purple-500/15',
                }
                return (
                  <div key={m._id} className="card flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${typeColor[m.type] || 'text-gray-400 bg-gray-500/15'}`}>
                      <FileDown className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-sm">{m.title}</h3>
                      {m.description && <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{m.description}</p>}
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                        <span className="uppercase font-medium">{m.type}</span>
                        <span className="flex items-center gap-0.5"><Download className="w-3 h-3" />{m.downloadCount} downloads</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <a href={m.url} target="_blank" rel="noreferrer"
                        className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-primary-500/10">
                        <Link2 className="w-3.5 h-3.5" /> Open
                      </a>
                      <button onClick={() => { if (confirm('Delete this note?')) deleteNoteMutation.mutate(m._id) }}
                        className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="bg-dark-700 rounded-xl p-4 text-xs text-gray-500 flex items-start gap-2">
            <FileText className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-600" />
            <p>Upload your PDF notes to Google Drive or any hosting, then paste the shareable link here. Enrolled students will be able to view and download these materials from their course page.</p>
          </div>
        </div>
      )}

      {/* ── TAB: Quizzes ── */}
      {tab === 'quizzes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Quizzes</h2>
            <button onClick={() => setAddingQuiz(!addingQuiz)} className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> {addingQuiz ? 'Cancel' : 'New Quiz'}
            </button>
          </div>

          {addingQuiz && (
            <div className="card space-y-4">
              <h3 className="text-white font-semibold">Create Quiz</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="label">Quiz Title *</label>
                  <input value={quizForm.title} onChange={e => setQuizForm(f => ({...f, title: e.target.value}))} placeholder="e.g. Module 1 Assessment" className="input w-full" />
                </div>
                <div>
                  <label className="label">Duration (minutes)</label>
                  <input type="number" value={quizForm.duration} onChange={e => setQuizForm(f => ({...f, duration: e.target.value}))} className="input w-full" />
                </div>
                <div>
                  <label className="label">Passing Score (%)</label>
                  <input type="number" value={quizForm.passingScore} onChange={e => setQuizForm(f => ({...f, passingScore: e.target.value}))} className="input w-full" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Link to Lesson (optional)</label>
                  <select value={quizForm.lessonId} onChange={e => setQuizForm(f => ({...f, lessonId: e.target.value}))} className="input w-full">
                    <option value="">— Not linked to a lesson —</option>
                    {modules.map((mod: any, mi: number) => (
                      <optgroup key={mi} label={`Module ${mi+1}: ${mod.title}`}>
                        {(mod.lessons || []).map((l: any) => (
                          <option key={l._id} value={l._id}>{l.title}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Batch (optional — visible only to this batch)</label>
                  <select value={quizForm.batchId} onChange={e => setQuizForm(f => ({...f, batchId: e.target.value}))} className="input w-full">
                    <option value="">All Batches</option>
                    {(batchesData || []).map((b: any) => (
                      <option key={b._id} value={b._id}>Batch {b.batchNumber}{b.label ? ` — ${b.label}` : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Questions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-white">{quizForm.questions.length} Question{quizForm.questions.length !== 1 ? 's' : ''}</p>
                  <button onClick={() => setAddingQuestion(!addingQuestion)} className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add Question
                  </button>
                </div>

                {addingQuestion && (
                  <div className="bg-dark-700 rounded-xl p-4 space-y-3 mb-3">
                    <input value={qForm.question} onChange={e => setQForm(f => ({...f, question: e.target.value}))} placeholder="Question text *" className="input w-full text-sm" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {qForm.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <input type="radio" checked={qForm.correctOption === oi} onChange={() => setQForm(f => ({...f, correctOption: oi}))} className="flex-shrink-0" />
                          <input value={opt} onChange={e => { const o = [...qForm.options]; o[oi] = e.target.value; setQForm(f => ({...f, options: o})) }} placeholder={`Option ${oi+1}`} className="input flex-1 text-sm py-2" />
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-xs text-gray-400">Marks:</label>
                      <input type="number" value={qForm.marks} onChange={e => setQForm(f => ({...f, marks: Number(e.target.value)}))} className="input w-20 text-sm py-1.5" min={1} />
                      <span className="text-xs text-gray-500">✓ = correct option (radio)</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => {
                        if (!qForm.question || qForm.options.some(o => !o)) return toast.error('Fill all fields')
                        setQuizForm(f => ({...f, questions: [...f.questions, { ...qForm }]}))
                        setQForm({ question: '', options: ['','','',''], correctOption: 0, marks: 1 })
                        setAddingQuestion(false)
                        toast.success('Question added')
                      }} className="btn-primary text-xs">Add Question</button>
                      <button onClick={() => setAddingQuestion(false)} className="btn-outline text-xs">Cancel</button>
                    </div>
                  </div>
                )}

                {quizForm.questions.map((q, qi) => (
                  <div key={qi} className="bg-dark-700 rounded-xl p-3 mb-2 flex items-start gap-3">
                    <span className="text-primary-400 font-bold text-xs mt-0.5">{qi+1}.</span>
                    <div className="flex-1">
                      <p className="text-white text-sm">{q.question}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {q.options.map((o, oi) => (
                          <span key={oi} className={`text-xs px-2 py-0.5 rounded-full ${oi === q.correctOption ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-400'}`}>{o}</span>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => setQuizForm(f => ({...f, questions: f.questions.filter((_,i) => i !== qi)}))}
                      className="text-gray-600 hover:text-red-400 p-1"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => {
                  if (!quizForm.title) return toast.error('Quiz title required')
                  if (quizForm.questions.length === 0) return toast.error('Add at least one question')
                  createQuizMutation.mutate({
                    title: quizForm.title,
                    duration: Number(quizForm.duration),
                    passingScore: Number(quizForm.passingScore),
                    lessonId: quizForm.lessonId || undefined,
                    batchId: quizForm.batchId || undefined,
                    questions: quizForm.questions,
                    isPublished: true,
                  })
                }} disabled={createQuizMutation.isPending} className="btn-primary flex items-center gap-2">
                  {createQuizMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create Quiz
                </button>
                <button onClick={() => { setAddingQuiz(false); setQuizForm({ title: '', duration: '30', passingScore: '70', lessonId: '', batchId: '', questions: [] }) }} className="btn-outline">Cancel</button>
              </div>
            </div>
          )}

          {quizzesLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary-400" /></div>
          ) : !quizzesData?.length ? (
            <div className="card text-center py-12">
              <GraduationCap className="w-10 h-10 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400 text-sm">No quizzes yet. Create one above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {quizzesData.map((quiz: any) => (
                <div key={quiz._id} className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-white font-semibold">{quiz.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${quiz.isPublished ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                          {quiz.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{quiz.duration} min</span>
                        <span>{quiz.questions?.length || 0} questions</span>
                        <span>{quiz.totalMarks} marks</span>
                        <span>Pass: {quiz.passingScore}%</span>
                      </div>
                    </div>
                    <button onClick={() => { if (confirm('Delete this quiz?')) deleteQuizMutation.mutate(quiz._id) }}
                      className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
