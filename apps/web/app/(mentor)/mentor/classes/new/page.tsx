'use client'
import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { classAPI, mentorAPI } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { Video, Calendar, Clock, BookOpen, ArrowLeft, Zap, Layers, GraduationCap } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

export default function ScheduleClassPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '', description: '', courseId: '', batchId: '', lessonId: '',
    scheduledAt: '', duration: '60', platform: 'livekit'
  })

  const { data: coursesData } = useQuery({
    queryKey: ['mentor-assigned-courses'],
    queryFn: () => mentorAPI.courses().then(r => r.data.courses)
  })

  const courses = (coursesData || []).map((c: any) => c.courseId).filter(Boolean)

  const { data: batchesData } = useQuery({
    queryKey: ['mentor-batches', form.courseId],
    queryFn: () => mentorAPI.courseBatches(form.courseId).then(r => r.data.batches),
    enabled: !!form.courseId,
  })

  const { data: courseDetailData } = useQuery({
    queryKey: ['mentor-course-detail', form.courseId],
    queryFn: () => mentorAPI.courseDetail(form.courseId).then(r => r.data.course),
    enabled: !!form.courseId,
  })

  const activeBatches = (batchesData || []).filter((b: any) => b.status === 'active')
  const modules: any[] = courseDetailData?.modules || []

  // Build flat lesson list with module context for display
  const allLessons = modules.flatMap((mod: any, mi: number) =>
    (mod.lessons || []).map((l: any) => ({
      ...l,
      moduleTitle: mod.title || `Module ${mi + 1}`,
      moduleIndex: mi,
    }))
  )

  const mutation = useMutation({
    mutationFn: () => {
      const payload: any = { ...form }
      if (!payload.batchId) delete payload.batchId
      if (!payload.lessonId) delete payload.lessonId
      return classAPI.create(payload)
    },
    onSuccess: () => { toast.success('Class scheduled!'); router.push('/mentor/classes') },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to schedule class')
  })

  const set = (k: string, v: string) => {
    if (k === 'courseId') setForm(f => ({ ...f, courseId: v, batchId: '', lessonId: '' }))
    else setForm(f => ({ ...f, [k]: v }))
  }

  // Auto-fill title from selected lesson
  const handleLessonChange = (lessonId: string) => {
    set('lessonId', lessonId)
    if (lessonId && !form.title) {
      const lesson = allLessons.find((l: any) => l._id === lessonId)
      if (lesson) setForm(f => ({ ...f, lessonId, title: lesson.title }))
    } else {
      setForm(f => ({ ...f, lessonId }))
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/mentor/classes" className="w-9 h-9 bg-dark-800 rounded-xl flex items-center justify-center border border-white/5 hover:bg-white/5 transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Schedule Live Class</h1>
          <p className="text-gray-400 text-sm">Set up a new live session for your students</p>
        </div>
      </div>

      <div className="bg-dark-800 rounded-2xl border border-white/5 p-6 space-y-5">

        {/* Course */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <BookOpen className="w-4 h-4 inline mr-1 text-primary-400" />Course *
          </label>
          <select value={form.courseId} onChange={e => set('courseId', e.target.value)}
            className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary-500/50 focus:outline-none focus:ring-1 focus:ring-primary-500/30 transition">
            <option value="">Select a course</option>
            {courses.map((c: any) => <option key={c._id} value={c._id}>{c.title}</option>)}
          </select>
          {courses.length === 0 && (
            <p className="text-xs text-yellow-500 mt-1">No courses assigned to you yet. Contact admin.</p>
          )}
        </div>

        {/* Batch */}
        {form.courseId && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Layers className="w-4 h-4 inline mr-1 text-purple-400" />Batch
            </label>
            <select value={form.batchId} onChange={e => set('batchId', e.target.value)}
              className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary-500/50 focus:outline-none focus:ring-1 focus:ring-primary-500/30 transition">
              <option value="">No batch (general class)</option>
              {activeBatches.map((b: any) => (
                <option key={b._id} value={b._id}>
                  Batch {b.batchNumber}{b.label ? ` — ${b.label}` : ''} ({b.enrolledCount || 0} students)
                </option>
              ))}
            </select>
            {activeBatches.length === 0 && batchesData && (
              <p className="text-xs text-gray-500 mt-1">No active batches for this course.</p>
            )}
          </div>
        )}

        {/* Curriculum Lesson */}
        {form.courseId && allLessons.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <GraduationCap className="w-4 h-4 inline mr-1 text-green-400" />Link to Curriculum Lesson
              <span className="text-gray-500 text-xs ml-2">(recording auto-saves here)</span>
            </label>
            <select value={form.lessonId} onChange={e => handleLessonChange(e.target.value)}
              className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary-500/50 focus:outline-none focus:ring-1 focus:ring-primary-500/30 transition">
              <option value="">No lesson link</option>
              {modules.map((mod: any, mi: number) => (
                <optgroup key={mi} label={`📦 ${mod.title || `Module ${mi + 1}`}`}>
                  {(mod.lessons || []).map((l: any) => (
                    <option key={l._id} value={l._id}>
                      {l.title}{l.videoUrl ? ' ✓ (has recording)' : ''}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              After class ends, the recording will be saved to this lesson automatically.
            </p>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Class Title *</label>
          <input type="text" value={form.title} onChange={e => set('title', e.target.value)}
            placeholder="e.g. Introduction to React Hooks"
            className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-primary-500/50 focus:outline-none focus:ring-1 focus:ring-primary-500/30 transition" />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)}
            placeholder="What will students learn in this session?"
            rows={3}
            className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-primary-500/50 focus:outline-none focus:ring-1 focus:ring-primary-500/30 transition resize-none" />
        </div>

        {/* Date + Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1 text-blue-400" />Date & Time *
            </label>
            <input type="datetime-local" value={form.scheduledAt} onChange={e => set('scheduledAt', e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary-500/50 focus:outline-none focus:ring-1 focus:ring-primary-500/30 transition [color-scheme:dark]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Clock className="w-4 h-4 inline mr-1 text-green-400" />Duration (minutes)
            </label>
            <select value={form.duration} onChange={e => set('duration', e.target.value)}
              className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary-500/50 focus:outline-none focus:ring-1 focus:ring-primary-500/30 transition">
              {['30', '45', '60', '90', '120'].map(d => <option key={d} value={d}>{d} minutes</option>)}
            </select>
          </div>
        </div>
      </div>

      <button onClick={() => mutation.mutate()}
        disabled={mutation.isPending || !form.title || !form.courseId || !form.scheduledAt}
        className="w-full flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors">
        <Zap className="w-5 h-5" />
        {mutation.isPending ? 'Scheduling...' : 'Schedule Class'}
      </button>
    </div>
  )
}
