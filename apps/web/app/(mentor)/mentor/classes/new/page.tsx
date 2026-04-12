'use client'
import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { classAPI, mentorAPI } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { Video, Calendar, Clock, BookOpen, Monitor, ArrowLeft, Zap, Layers } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

export default function ScheduleClassPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '', description: '', courseId: '', batchId: '',
    scheduledAt: '', duration: '60', platform: 'agora'
  })

  const { data: coursesData } = useQuery({
    queryKey: ['mentor-assigned-courses'],
    queryFn: () => mentorAPI.courses().then(r => r.data.courses)
  })

  // Extract actual course objects from assignedCourses array
  const courses = (coursesData || []).map((c: any) => c.courseId).filter(Boolean)

  const { data: batchesData } = useQuery({
    queryKey: ['mentor-batches', form.courseId],
    queryFn: () => mentorAPI.courseBatches(form.courseId).then(r => r.data.batches),
    enabled: !!form.courseId,
  })

  const activeBatches = (batchesData || []).filter((b: any) => b.status === 'active')

  const mutation = useMutation({
    mutationFn: () => {
      const payload: any = { ...form }
      if (!payload.batchId) delete payload.batchId
      return classAPI.create(payload)
    },
    onSuccess: () => { toast.success('Class scheduled!'); router.push('/mentor/classes') },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to schedule class')
  })

  const set = (k: string, v: string) => {
    if (k === 'courseId') setForm(f => ({ ...f, courseId: v, batchId: '' }))
    else setForm(f => ({ ...f, [k]: v }))
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

      {/* Form */}
      <div className="bg-dark-800 rounded-2xl border border-white/5 p-6 space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Class Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="e.g. Introduction to React Hooks"
            className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-primary-500/50 focus:outline-none focus:ring-1 focus:ring-primary-500/30 transition"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="What will students learn in this session?"
            rows={3}
            className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-primary-500/50 focus:outline-none focus:ring-1 focus:ring-primary-500/30 transition resize-none"
          />
        </div>

        {/* Course */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <BookOpen className="w-4 h-4 inline mr-1 text-primary-400" />Course *
          </label>
          <select
            value={form.courseId}
            onChange={e => set('courseId', e.target.value)}
            className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary-500/50 focus:outline-none focus:ring-1 focus:ring-primary-500/30 transition">
            <option value="">Select a course</option>
            {courses.map((c: any) => (
              <option key={c._id} value={c._id}>{c.title}</option>
            ))}
          </select>
          {courses.length === 0 && (
            <p className="text-xs text-yellow-500 mt-1">No courses assigned to you yet. Contact admin.</p>
          )}
        </div>

        {/* Batch (shown only when course selected and active batches exist) */}
        {form.courseId && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Layers className="w-4 h-4 inline mr-1 text-purple-400" />Batch
            </label>
            <select
              value={form.batchId}
              onChange={e => set('batchId', e.target.value)}
              className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary-500/50 focus:outline-none focus:ring-1 focus:ring-primary-500/30 transition">
              <option value="">No batch (general class)</option>
              {activeBatches.map((b: any) => (
                <option key={b._id} value={b._id}>
                  Batch {b.batchNumber}{b.label ? ` — ${b.label}` : ''} (Day {b.daysCompleted || 0}/{b.totalDays || '?'})
                </option>
              ))}
            </select>
            {activeBatches.length === 0 && batchesData && (
              <p className="text-xs text-gray-500 mt-1">No active batches. Start a batch from Course Management.</p>
            )}
          </div>
        )}

        {/* Date + Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1 text-blue-400" />Date & Time *
            </label>
            <input
              type="datetime-local"
              value={form.scheduledAt}
              onChange={e => set('scheduledAt', e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary-500/50 focus:outline-none focus:ring-1 focus:ring-primary-500/30 transition [color-scheme:dark]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Clock className="w-4 h-4 inline mr-1 text-green-400" />Duration (minutes)
            </label>
            <select
              value={form.duration}
              onChange={e => set('duration', e.target.value)}
              className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary-500/50 focus:outline-none focus:ring-1 focus:ring-primary-500/30 transition">
              {['30', '45', '60', '90', '120'].map(d => (
                <option key={d} value={d}>{d} minutes</option>
              ))}
            </select>
          </div>
        </div>

        {/* Platform */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">Platform</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'agora', icon: Monitor, label: 'Agora (Default)', desc: 'Built-in HD video class' },
              { value: 'zoom', icon: Video, label: 'Zoom', desc: 'External Zoom meeting' },
            ].map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => set('platform', p.value)}
                className={`p-4 rounded-xl border text-left transition-all ${form.platform === p.value ? 'border-primary-500/50 bg-primary-500/10' : 'border-white/10 bg-dark-700 hover:border-white/20'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <p.icon className={`w-4 h-4 ${form.platform === p.value ? 'text-primary-400' : 'text-gray-400'}`} />
                  <span className={`font-semibold text-sm ${form.platform === p.value ? 'text-primary-400' : 'text-white'}`}>{p.label}</span>
                </div>
                <p className="text-xs text-gray-500">{p.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending || !form.title || !form.courseId || !form.scheduledAt}
        className="w-full flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors">
        <Zap className="w-5 h-5" />
        {mutation.isPending ? 'Scheduling...' : 'Schedule Class'}
      </button>
    </div>
  )
}
