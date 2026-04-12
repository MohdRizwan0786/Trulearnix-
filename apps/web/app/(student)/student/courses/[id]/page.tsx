'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { courseAPI, certAPI } from '@/lib/api'
import {
  ChevronLeft, ChevronRight, CheckCircle, Circle, Play, FileText,
  Award, Loader2, PlayCircle, ClipboardList, BookOpen, Clock,
  Calendar, BarChart2, Download
} from 'lucide-react'
import Link from 'next/link'

type Tab = 'lessons' | 'sessions' | 'assignments'

export default function CoursePlayer({ params }: { params: { id: string } }) {
  const { id } = params
  const [activeLessonIdx, setActiveLessonIdx] = useState(0)
  const [claiming, setClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [tab, setTab] = useState<Tab>('lessons')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['course-content', id],
    queryFn: () => courseAPI.getContent(id).then(r => r.data),
  })

  const { data: sessionsData } = useQuery({
    queryKey: ['student-course-sessions', id],
    queryFn: () => courseAPI.sessions(id).then(r => r.data.sessions),
    enabled: tab === 'sessions',
  })

  const { data: assignmentsData } = useQuery({
    queryKey: ['student-course-assignments', id],
    queryFn: () => courseAPI.courseAssignments(id).then(r => r.data.assignments),
    enabled: tab === 'assignments',
  })

  const markMutation = useMutation({
    mutationFn: (lessonId: string) => courseAPI.markLesson(id, lessonId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['course-content', id] }),
  })

  const course = data?.course
  const lessons: any[] = course?.lessons || []
  const activeLesson = lessons[activeLessonIdx]
  const completedIds: string[] = data?.completedLessons || []
  const progressPercent = lessons.length > 0 ? Math.round((completedIds.length / lessons.length) * 100) : 0
  const allDone = lessons.length > 0 && completedIds.length >= lessons.length

  const getRecordingUrl = (url: string) => {
    const base = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/api$/, '')
    if (!url) return ''
    if (url.startsWith('http')) return url
    return `${base}${url}`
  }

  const claimCertificate = async () => {
    try {
      setClaiming(true)
      await certAPI.claim(id)
      setClaimed(true)
    } catch {}
    finally { setClaiming(false) }
  }

  if (isLoading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
    </div>
  )

  if (!course) return (
    <div className="text-center py-20">
      <p className="text-gray-400">Course not found or you are not enrolled.</p>
      <Link href="/student/courses" className="btn-primary mt-4 inline-block">Back to Courses</Link>
    </div>
  )

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'lessons', label: 'Lessons', icon: BookOpen },
    { key: 'sessions', label: 'Live Sessions', icon: PlayCircle },
    { key: 'assignments', label: 'Assignments', icon: ClipboardList },
  ]

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Top Tab Bar */}
      <div className="flex items-center gap-1 px-4 pt-3 pb-0 border-b border-white/5 bg-dark-900 flex-shrink-0">
        <Link href="/student/courses" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white mr-4 flex-shrink-0">
          <ChevronLeft className="w-4 h-4" /> Back
        </Link>
        <p className="text-sm font-semibold text-white truncate max-w-xs mr-4 hidden sm:block">{course.title}</p>
        <div className="flex gap-0.5 flex-shrink-0">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-all ${
                tab === t.key
                  ? 'border-primary-500 text-primary-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}>
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-gray-500">{progressPercent}%</span>
          <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      {/* ── TAB: Lessons (video player) ── */}
      {tab === 'lessons' && (
        <div className="flex flex-1 overflow-hidden">
          {/* Lesson Sidebar */}
          <aside className="w-64 bg-dark-800 border-r border-white/5 flex flex-col overflow-hidden flex-shrink-0">
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {lessons.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-xs px-2">
                  No lessons added yet.
                </div>
              ) : lessons.map((lesson: any, idx: number) => {
                const done = completedIds.includes(lesson._id)
                const active = idx === activeLessonIdx
                return (
                  <button key={lesson._id} onClick={() => setActiveLessonIdx(idx)}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors ${active ? 'bg-primary-500/20 border border-primary-500/30' : 'hover:bg-white/5'}`}>
                    <div className="mt-0.5 flex-shrink-0">
                      {done ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Circle className="w-4 h-4 text-gray-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${active ? 'text-primary-400' : done ? 'text-gray-300' : 'text-gray-400'}`}>
                        {idx + 1}. {lesson.title}
                      </p>
                      {lesson.duration > 0 && (
                        <p className="text-[10px] text-gray-500 mt-0.5">{lesson.duration} min</p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeLesson ? (
              <>
                <div className="flex-1 overflow-y-auto">
                  {activeLesson.videoUrl ? (
                    <div className="bg-black aspect-video w-full max-h-[50vh]">
                      {activeLesson.videoUrl.includes('youtube.com') || activeLesson.videoUrl.includes('youtu.be') ? (
                        <iframe
                          src={activeLesson.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                          className="w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                      ) : (
                        <video src={activeLesson.videoUrl} controls className="w-full h-full" />
                      )}
                    </div>
                  ) : (
                    <div className="p-8 flex items-center justify-center bg-dark-800 min-h-48">
                      <div className="text-center text-gray-400">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                        <p className="text-sm">Reading lesson</p>
                      </div>
                    </div>
                  )}
                  <div className="p-6">
                    <h1 className="text-xl font-bold text-white mb-4">{activeLesson.title}</h1>
                    {activeLesson.content && (
                      <div className="prose prose-invert prose-sm max-w-none text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {activeLesson.content}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Controls */}
                <div className="p-4 border-t border-white/5 bg-dark-800 flex items-center justify-between gap-4">
                  <button onClick={() => setActiveLessonIdx(i => Math.max(0, i - 1))} disabled={activeLessonIdx === 0}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white disabled:opacity-30">
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>

                  <div className="flex items-center gap-3">
                    {!completedIds.includes(activeLesson._id) ? (
                      <button onClick={() => markMutation.mutate(activeLesson._id)} disabled={markMutation.isPending}
                        className="btn-primary flex items-center gap-2 text-sm">
                        {markMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        Mark Complete
                      </button>
                    ) : (
                      <span className="flex items-center gap-2 text-sm text-green-400">
                        <CheckCircle className="w-4 h-4" /> Completed
                      </span>
                    )}
                    {allDone && (
                      <button onClick={claimCertificate} disabled={claiming || claimed}
                        className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-dark-900 font-bold text-sm px-4 py-2 rounded-xl">
                        {claiming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                        {claimed ? 'Certificate Claimed!' : 'Claim Certificate'}
                      </button>
                    )}
                  </div>

                  <button onClick={() => setActiveLessonIdx(i => Math.min(lessons.length - 1, i + 1))} disabled={activeLessonIdx === lessons.length - 1}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white disabled:opacity-30">
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Play className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <p>Select a lesson to start learning</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: Sessions (recordings) ── */}
      {tab === 'sessions' && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {!sessionsData ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary-400" /></div>
            ) : sessionsData.length === 0 ? (
              <div className="text-center py-16">
                <PlayCircle className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                <p className="text-gray-400">No recorded sessions yet.</p>
                <p className="text-gray-500 text-sm mt-1">Completed live classes will appear here with recordings and summaries.</p>
              </div>
            ) : sessionsData.map((session: any) => (
              <div key={session._id} className="bg-dark-800 rounded-2xl border border-white/5 p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    {session.batch && (
                      <span className="text-xs text-gray-500 bg-dark-700 px-2 py-0.5 rounded-full">
                        Batch {session.batch.batchNumber}
                      </span>
                    )}
                    <h3 className="text-white font-semibold mt-1">{session.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                      {session.scheduledAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(session.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                      {session.duration && (
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{session.duration} min</span>
                      )}
                      <span className={`px-1.5 py-0.5 rounded ${session.wasPresent ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {session.wasPresent ? 'Attended' : 'Missed'}
                      </span>
                    </div>
                  </div>
                  {session.recordingUrl && (
                    <a
                      href={getRecordingUrl(session.recordingUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-shrink-0 flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                      <PlayCircle className="w-4 h-4" /> Watch
                    </a>
                  )}
                </div>

                {session.summary && (
                  <div className="bg-dark-700 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1">
                      <BarChart2 className="w-3.5 h-3.5" /> Session Summary
                    </p>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{session.summary}</p>
                  </div>
                )}

                {session.mentorNotes && (
                  <div className="bg-dark-700 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" /> Mentor Notes
                    </p>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{session.mentorNotes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: Assignments ── */}
      {tab === 'assignments' && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {!assignmentsData ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary-400" /></div>
            ) : assignmentsData.length === 0 ? (
              <div className="text-center py-16">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                <p className="text-gray-400">No assignments yet.</p>
                <p className="text-gray-500 text-sm mt-1">Your mentor will publish assignments here.</p>
              </div>
            ) : assignmentsData.map((a: any) => (
              <div key={a._id} className="bg-dark-800 rounded-2xl border border-white/5 p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold">{a.title}</h3>
                    <p className="text-sm text-gray-400 mt-1 leading-relaxed">{a.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 flex-wrap">
                      {a.dueDate && (
                        <span className={`flex items-center gap-1 ${new Date(a.dueDate) < new Date() ? 'text-red-400' : 'text-yellow-400'}`}>
                          <Calendar className="w-3 h-3" />
                          Due: {new Date(a.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <BarChart2 className="w-3 h-3" /> Max: {a.maxScore} pts
                      </span>
                    </div>
                  </div>
                  {a.mySubmission ? (
                    <div className="flex-shrink-0 text-right">
                      <span className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-400 px-3 py-1.5 rounded-xl text-sm font-medium">
                        <CheckCircle className="w-4 h-4" /> Submitted
                      </span>
                      {a.mySubmission.score != null && (
                        <p className="text-xs text-gray-400 mt-1">{a.mySubmission.score}/{a.maxScore} pts</p>
                      )}
                    </div>
                  ) : (
                    <span className="flex-shrink-0 text-xs text-gray-500 bg-dark-700 px-3 py-1.5 rounded-xl">
                      Not submitted
                    </span>
                  )}
                </div>

                {a.mySubmission?.feedback && (
                  <div className="bg-dark-700 rounded-xl p-3">
                    <p className="text-xs font-semibold text-gray-400 mb-1">Mentor Feedback</p>
                    <p className="text-sm text-gray-300">{a.mySubmission.feedback}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
