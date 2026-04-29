'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { courseAPI, certAPI, materialAPI, quizAPI } from '@/lib/api'
import {
  ChevronLeft, CheckCircle, Circle, Play, FileText,
  Award, Loader2, PlayCircle, ClipboardList, Clock,
  BarChart2, Download, FileDown, Upload,
  ExternalLink, Video, File, Image as ImgIcon, Link2,
  AlertCircle, Star, ChevronDown, ChevronUp, BookOpen, Users, Trophy, TrendingUp,
  HelpCircle, CheckSquare, XSquare, ArrowRight, Youtube, ListVideo
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

/* ── YouTube Playlist Player ─────────────────────────────────────────────── */
function PlaylistPlayer({ playlistUrl, courseTitle }: { playlistUrl: string; courseTitle: string }) {
  const playlistId = playlistUrl.match(/[?&]list=([^&]+)/)?.[1] || ''
  const playerElId = 'yt-playlist-player-' + playlistId.slice(-6)
  const playerRef = useRef<any>(null)
  const [videoIds, setVideoIds] = useState<string[]>([])
  const [activeIdx, setActiveIdx] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  const initPlayer = useCallback(() => {
    if (playerRef.current || !playlistId) return
    playerRef.current = new (window as any).YT.Player(playerElId, {
      playerVars: { listType: 'playlist', list: playlistId, rel: 0, modestbranding: 1, autoplay: 0 },
      events: {
        onReady: (e: any) => {
          const ids: string[] = e.target.getPlaylist() || []
          setVideoIds(ids)
        },
        onStateChange: (e: any) => {
          const idx = e.target.getPlaylistIndex?.() ?? 0
          setActiveIdx(idx)
          // auto scroll list item into view
          const el = listRef.current?.children[idx] as HTMLElement | undefined
          el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        },
      },
    })
  }, [playlistId, playerElId])

  useEffect(() => {
    if (!playlistId) return
    if ((window as any).YT?.Player) {
      initPlayer()
    } else {
      const existing = document.getElementById('yt-iframe-api')
      if (!existing) {
        const s = document.createElement('script')
        s.id = 'yt-iframe-api'
        s.src = 'https://www.youtube.com/iframe_api'
        s.async = true
        document.head.appendChild(s)
      }
      ;(window as any).onYouTubeIframeAPIReady = initPlayer
    }
    return () => {
      if (playerRef.current?.destroy) playerRef.current.destroy()
      playerRef.current = null
    }
  }, [playlistId, initPlayer])

  const goTo = (i: number) => {
    playerRef.current?.playVideoAt?.(i)
    setActiveIdx(i)
  }

  if (!playlistId) return (
    <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">Invalid playlist URL</div>
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-white/5 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center">
          <Youtube className="w-4 h-4 text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-white font-bold text-sm">Class Recordings</h2>
          <p className="text-xs text-gray-500 truncate">{courseTitle}</p>
        </div>
        <a href={playlistUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-xl transition-colors border border-red-500/20 flex-shrink-0">
          <ExternalLink className="w-3.5 h-3.5" /> YouTube
        </a>
      </div>

      {/* Player + List */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Video Player */}
        <div className="flex-1 flex flex-col min-w-0 bg-black">
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <div id={playerElId} className="absolute inset-0 w-full h-full" />
          </div>
          {videoIds.length > 0 && (
            <div className="px-4 py-3 bg-dark-900 border-t border-white/5">
              <p className="text-white font-semibold text-sm line-clamp-1">
                Video {activeIdx + 1} of {videoIds.length}
              </p>
            </div>
          )}
        </div>

        {/* Playlist Sidebar */}
        <div className="lg:w-72 flex flex-col border-t lg:border-t-0 lg:border-l border-white/5 bg-dark-900">
          <div className="px-3 py-2.5 border-b border-white/5 flex-shrink-0">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
              <ListVideo className="w-3.5 h-3.5 text-red-400" />
              Playlist — {videoIds.length > 0 ? `${videoIds.length} videos` : 'Loading...'}
            </p>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto">
            {videoIds.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-red-400" />
                <p className="text-xs text-gray-500">Playlist load ho rahi hai...</p>
              </div>
            ) : (
              videoIds.map((vid, i) => (
                <button key={vid} onClick={() => goTo(i)}
                  className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left transition-colors border-b border-white/5 ${
                    activeIdx === i ? 'bg-red-500/15' : 'hover:bg-white/5'
                  }`}>
                  <div className="relative w-20 flex-shrink-0 rounded-lg overflow-hidden">
                    <img
                      src={`https://img.youtube.com/vi/${vid}/mqdefault.jpg`}
                      alt=""
                      className="w-full aspect-video object-cover"
                      loading="lazy"
                    />
                    {activeIdx === i && (
                      <div className="absolute inset-0 bg-red-600/50 flex items-center justify-center">
                        <Play className="w-4 h-4 text-white" fill="white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium leading-snug ${activeIdx === i ? 'text-red-300' : 'text-gray-300'}`}>
                      Class {i + 1}
                    </p>
                    <p className="text-[10px] text-gray-600 mt-0.5">#{i + 1}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const TYPE_ICON: Record<string, any> = { pdf: FileDown, video: Video, doc: FileText, link: Link2, image: ImgIcon }
const TYPE_COLOR: Record<string, string> = {
  pdf: 'text-red-400 bg-red-500/15 border-red-500/20',
  video: 'text-blue-400 bg-blue-500/15 border-blue-500/20',
  doc: 'text-yellow-400 bg-yellow-500/15 border-yellow-500/20',
  link: 'text-green-400 bg-green-500/15 border-green-500/20',
  image: 'text-purple-400 bg-purple-500/15 border-purple-500/20',
}

export default function CoursePlayer({ params }: { params: { id: string } }) {
  const { id } = params
  const [activeLesson, setActiveLesson] = useState<any>(null)
  const [openModule, setOpenModule] = useState<number>(0)
  const [claiming, setClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [requestingRC, setRequestingRC] = useState(false)
  const [rcRequested, setRcRequested] = useState(false)
  const [showPerformance, setShowPerformance] = useState(false)
  const [showRecordings, setShowRecordings] = useState(false)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['course-content', id],
    queryFn: () => courseAPI.getContent(id).then(r => r.data),
  })

  const markMutation = useMutation({
    mutationFn: (lessonId: string) => courseAPI.markLesson(id, lessonId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['course-content', id] }),
  })

  const { data: perfData, isLoading: perfLoading } = useQuery({
    queryKey: ['course-my-performance', id],
    queryFn: () => courseAPI.myPerformance(id).then(r => r.data),
    enabled: showPerformance,
  })

  const course = data?.course
  const modules: any[] = course?.modules || []
  const sessions: any[] = data?.sessions || []
  const materials: any[] = data?.materials || []
  const assignments: any[] = data?.assignments || []
  const quizzes: any[] = data?.quizzes || []
  const completedIds: string[] = data?.completedLessons || []
  const batch = data?.batch
  const totalLessons = modules.reduce((s: number, m: any) => s + (m.lessons?.length || 0), 0)
  const progressPercent = totalLessons > 0 ? Math.round((completedIds.length / totalLessons) * 100) : 0
  // Course is "done" only when the mentor has marked the batch complete (enrollment.completedAt set).
  // A student finishing every lesson on their own no longer unlocks certificate / report card.
  const allDone = !!data?.enrollment?.completedAt

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
      toast.success('Certificate claimed!')
    } catch { toast.error('Failed to claim certificate') }
    finally { setClaiming(false) }
  }

  const requestReportCard = async () => {
    try {
      setRequestingRC(true)
      await courseAPI.requestReportCard(id)
      setRcRequested(true)
      toast.success('Report card requested! Awaiting mentor approval.')
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to request report card')
    } finally { setRequestingRC(false) }
  }

  // Auto-select first lesson
  if (!activeLesson && modules.length > 0 && modules[0]?.lessons?.length > 0) {
    setTimeout(() => setActiveLesson(modules[0].lessons[0]), 0)
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

  // Per-lesson linked content
  const lessonId = activeLesson?._id?.toString()
  const lessonSessions = lessonId ? sessions.filter((s: any) => s.lessonId?.toString() === lessonId) : []
  const lessonMaterials = lessonId ? materials.filter((m: any) => m.lessonId?.toString() === lessonId) : []
  const lessonAssignments = lessonId ? assignments.filter((a: any) => a.lessonId?.toString() === lessonId) : []
  const lessonQuizzes = lessonId ? quizzes.filter((q: any) => q.lesson?.toString() === lessonId) : []

  // Course-level content (not linked to a specific lesson)
  const courseMaterials = materials.filter((m: any) => !m.lessonId)
  const courseAssignments = assignments.filter((a: any) => !a.lessonId)
  const courseQuizzes = quizzes.filter((q: any) => !q.lesson)

  const isCompleted = lessonId ? completedIds.includes(lessonId) : false

  return (
    <div className="flex h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)]">

      {/* ── Sidebar: Module Tree ── */}
      <aside className="w-72 lg:w-80 bg-dark-900 border-r border-white/5 flex-col flex-shrink-0 hidden sm:flex">
        {/* Course header */}
        <div className="p-4 border-b border-white/5">
          <Link href="/student/courses" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white mb-2">
            <ChevronLeft className="w-4 h-4" /> All Courses
          </Link>
          <h2 className="text-white font-bold text-sm leading-snug line-clamp-2">{course.title}</h2>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
            <span className="text-xs text-gray-400 flex-shrink-0">{progressPercent}%</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">{completedIds.length}/{totalLessons} lessons done</p>
        </div>

        {/* Batch badge */}
        {batch && (
          <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-xs text-violet-400">
              Batch {batch.batchNumber}{batch.label ? ` — ${batch.label}` : ''}
            </span>
          </div>
        )}

        {/* My Performance button */}
        <button
          onClick={() => { setShowPerformance(s => !s); setShowRecordings(false) }}
          className={`w-full flex items-center gap-2.5 px-4 py-2.5 border-b border-white/5 transition-colors text-left text-xs font-semibold ${showPerformance ? 'bg-primary-500/10 text-primary-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
          <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" />
          My Performance & Leaderboard
          {showPerformance && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400" />}
        </button>

        {/* Recordings button — only if playlist exists */}
        {course.youtubePlaylistUrl && (
          <button
            onClick={() => { setShowRecordings(s => !s); setShowPerformance(false); setActiveLesson(null) }}
            className={`w-full flex items-center gap-2.5 px-4 py-2.5 border-b border-white/5 transition-colors text-left text-xs font-semibold ${showRecordings ? 'bg-red-500/10 text-red-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <Youtube className="w-3.5 h-3.5 flex-shrink-0" />
            Class Recordings
            <span className="ml-auto text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">Playlist</span>
          </button>
        )}

        {/* Module tree */}
        <div className="flex-1 overflow-y-auto py-2">
          {modules.length === 0 ? (
            <p className="text-gray-600 text-xs text-center py-8">No curriculum yet</p>
          ) : modules.map((mod: any, mi: number) => (
            <div key={mi}>
              <button
                onClick={() => setOpenModule(openModule === mi ? -1 : mi)}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-white/5 transition-colors text-left">
                <div className="w-5 h-5 rounded bg-primary-500/20 text-primary-400 flex items-center justify-center text-[10px] font-black flex-shrink-0">
                  {mi + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-300 truncate">{mod.title || `Module ${mi + 1}`}</p>
                  <p className="text-[10px] text-gray-600">{(mod.lessons || []).length} lessons</p>
                </div>
                {openModule === mi
                  ? <ChevronUp className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                  : <ChevronDown className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />}
              </button>

              {openModule === mi && (
                <div className="pl-3 ml-4 border-l border-white/5">
                  {(mod.lessons || []).map((lesson: any, li: number) => {
                    const done = completedIds.includes(lesson._id?.toString())
                    const active = activeLesson?._id?.toString() === lesson._id?.toString()
                    const lid = lesson._id?.toString()
                    const hasRecording = sessions.some((s: any) => s.lessonId?.toString() === lid && s.recordingUrl)
                    const hasQuiz = quizzes.some((q: any) => q.lesson?.toString() === lid)
                    const hasMaterial = materials.some((m: any) => m.lessonId?.toString() === lid)
                    const hasAssignment = assignments.some((a: any) => a.lessonId?.toString() === lid)
                    return (
                      <button key={li} onClick={() => setActiveLesson(lesson)}
                        className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors mb-0.5 ${
                          active ? 'bg-primary-500/20 border border-primary-500/30' : 'hover:bg-white/5 border border-transparent'
                        }`}>
                        <div className="mt-0.5 flex-shrink-0">
                          {done
                            ? <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                            : active
                              ? <Play className="w-3.5 h-3.5 text-primary-400" />
                              : <Circle className="w-3.5 h-3.5 text-gray-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium leading-snug ${active ? 'text-primary-300' : done ? 'text-gray-300' : 'text-gray-500'}`}>
                            {lesson.title}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-[10px] text-gray-600 capitalize">{lesson.type}</span>
                            {lesson.duration > 0 && <span className="text-[10px] text-gray-600">{lesson.duration}m</span>}
                            {hasRecording && <span className="text-[10px] text-green-500">● Rec</span>}
                            {hasQuiz && <span className="text-[10px] text-violet-400">● Quiz</span>}
                            {hasMaterial && <span className="text-[10px] text-yellow-500">● Notes</span>}
                            {hasAssignment && <span className="text-[10px] text-orange-400">● Task</span>}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ))}

          {/* Course-level resources section */}
          {(courseMaterials.length > 0 || courseAssignments.length > 0 || courseQuizzes.length > 0) && (
            <div className="mt-2 mx-3 p-3 bg-white/3 rounded-xl border border-white/5">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-2">Course Resources</p>
              {courseMaterials.map((m: any) => (
                <button key={m._id} onClick={() => window.open(m.url, '_blank')}
                  className="w-full text-left text-xs text-gray-400 hover:text-white flex items-center gap-1.5 py-1">
                  <FileDown className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                  <span className="truncate">{m.title}</span>
                </button>
              ))}
              {courseAssignments.map((a: any) => (
                <div key={a._id} className="text-xs text-gray-400 flex items-center gap-1.5 py-1">
                  <ClipboardList className="w-3 h-3 text-orange-400 flex-shrink-0" />
                  <span className="truncate">{a.title}</span>
                  {a.mySubmission && <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0 ml-auto" />}
                </div>
              ))}
              {courseQuizzes.map((q: any) => (
                <div key={q._id} className="text-xs text-gray-400 flex items-center gap-1.5 py-1">
                  <HelpCircle className="w-3 h-3 text-violet-400 flex-shrink-0" />
                  <span className="truncate">{q.title}</span>
                  {q.myAttempt && <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0 ml-auto" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="sm:hidden flex items-center gap-2 px-3 py-2 border-b border-white/5 bg-dark-900">
          <Link href="/student/courses" className="flex items-center gap-1 text-xs text-gray-400 hover:text-white">
            <ChevronLeft className="w-4 h-4" /> Back
          </Link>
          <p className="text-xs font-semibold text-white truncate flex-1">{course.title}</p>
          {course.youtubePlaylistUrl && (
            <button onClick={() => { setShowRecordings(s => !s); setShowPerformance(false); setActiveLesson(null) }}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors ${showRecordings ? 'bg-red-500/20 text-red-400' : 'text-gray-400 hover:text-red-400'}`}>
              <Youtube className="w-3.5 h-3.5" /> Rec
            </button>
          )}
          <span className="text-xs text-gray-400">{progressPercent}%</span>
        </div>

        {showRecordings && course.youtubePlaylistUrl ? (
          <PlaylistPlayer playlistUrl={course.youtubePlaylistUrl} courseTitle={course.title} />
        ) : showPerformance ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-3xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">My Performance</h2>
                <p className="text-xs text-gray-500">{course.title}</p>
              </div>
            </div>

            {perfLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary-400" /></div>
            ) : perfData ? (() => {
              const p = perfData.performance
              const lb = perfData.leaderboard || []
              const myRank = perfData.myRank
              return (
                <>
                  {/* Score cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Progress', value: p.progressPercent, color: 'text-blue-400', bg: 'bg-blue-500/10', sub: `${p.completedLessons}/${p.totalLessons} lessons` },
                      { label: 'Attendance', value: p.attendancePct, color: 'text-green-400', bg: 'bg-green-500/10', sub: `${p.sessionsAttended}/${p.totalSessions} sessions` },
                      { label: 'Assignments', value: p.avgAssignmentScore, color: 'text-orange-400', bg: 'bg-orange-500/10', sub: `avg score` },
                      { label: 'Quizzes', value: p.avgQuizScore, color: 'text-purple-400', bg: 'bg-purple-500/10', sub: `${p.quizzesTaken} taken` },
                    ].map(c => (
                      <div key={c.label} className={`rounded-2xl p-4 border border-white/5 ${c.bg}`}>
                        <p className="text-xs text-gray-400 mb-1">{c.label}</p>
                        <p className={`text-2xl font-black ${c.color}`}>{c.value}%</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{c.sub}</p>
                      </div>
                    ))}
                  </div>

                  {/* Composite score */}
                  <div className="card flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500/20 to-violet-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl font-black text-primary-400">{p.compositeScore}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold">Overall Score</p>
                      <p className="text-xs text-gray-500">Progress 35% + Attendance 25% + Assignments 25% + Quizzes 15%</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-primary-500 to-violet-500 rounded-full" style={{ width: `${p.compositeScore}%` }} />
                        </div>
                        <span className="text-xs text-gray-400">#{myRank} in batch</span>
                      </div>
                    </div>
                  </div>

                  {/* Assignment detail */}
                  {p.assignments?.length > 0 && (
                    <div className="card space-y-2">
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2"><ClipboardList className="w-4 h-4 text-orange-400" /> Assignments</h3>
                      {p.assignments.map((a: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 bg-dark-700 rounded-xl px-3 py-2.5">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-300 truncate">{a.title}</p>
                          </div>
                          {a.score !== null ? (
                            <div className="text-right flex-shrink-0">
                              <span className="text-xs font-semibold text-green-400">{a.score}/{a.maxScore}</span>
                              <span className="text-[10px] text-gray-500 ml-1">({Math.round(a.score/a.maxScore*100)}%)</span>
                              {a.feedback && <p className="text-[10px] text-gray-500 italic mt-0.5 max-w-[180px] truncate">"{a.feedback}"</p>}
                            </div>
                          ) : (
                            <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${a.status === 'pending' ? 'bg-yellow-500/15 text-yellow-400' : 'bg-gray-500/15 text-gray-400'}`}>
                              {a.status === 'pending' ? 'Submitted' : a.status === 'reviewed' ? 'Reviewed' : 'Not submitted'}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Leaderboard */}
                  {lb.length > 1 && (
                    <div className="card space-y-3">
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-400" /> Batch Leaderboard</h3>
                      <div className="space-y-2">
                        {lb.slice(0, 10).map((entry: any, i: number) => (
                          <div key={i} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${entry.isMe ? 'bg-primary-500/15 border border-primary-500/25' : 'bg-dark-700'}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${i === 0 ? 'bg-yellow-500/20 text-yellow-400' : i === 1 ? 'bg-gray-400/20 text-gray-300' : i === 2 ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-gray-500'}`}>
                              {i + 1}
                            </div>
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500/40 to-violet-500/40 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-white">{(entry.student?.name || '?')[0].toUpperCase()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-medium truncate ${entry.isMe ? 'text-primary-300' : 'text-gray-300'}`}>
                                {entry.isMe ? 'You' : entry.student?.name || 'Student'}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-primary-500/60 to-violet-500/60 rounded-full" style={{ width: `${entry.compositeScore}%` }} />
                                </div>
                              </div>
                            </div>
                            <span className={`text-sm font-black flex-shrink-0 ${entry.isMe ? 'text-primary-400' : 'text-white'}`}>{entry.compositeScore}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )
            })() : null}
          </div>
        ) : !activeLesson ? (
          <div className="flex-1 flex items-center justify-center text-center text-gray-400">
            <div>
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p>Select a lesson from the sidebar to start learning</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* Video area */}
            {activeLesson.videoUrl ? (
              <div className="bg-black aspect-video max-h-[45vh] sm:max-h-[55vh]">
                {activeLesson.videoUrl.includes('youtube') || activeLesson.videoUrl.includes('youtu.be') ? (
                  <iframe
                    src={activeLesson.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                    className="w-full h-full" allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                ) : (
                  <video src={getRecordingUrl(activeLesson.videoUrl)} controls className="w-full h-full" />
                )}
              </div>
            ) : lessonSessions[0]?.recordingUrl ? (
              <div className="bg-black aspect-video max-h-[45vh] sm:max-h-[55vh]">
                <video src={getRecordingUrl(lessonSessions[0].recordingUrl)} controls className="w-full h-full" />
              </div>
            ) : lessonSessions[0]?.recordingUrl ? (
              <div className="bg-black aspect-video max-h-[45vh] sm:max-h-[55vh]">
                <video src={getRecordingUrl(lessonSessions[0].recordingUrl)} controls className="w-full h-full" />
              </div>
            ) : (
              <div className="bg-gradient-to-br from-dark-800 to-dark-900 py-12 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  {activeLesson.type === 'live'
                    ? <><PlayCircle className="w-12 h-12 mx-auto mb-2 text-gray-600" /><p className="text-sm">Recording will appear here after the live class</p></>
                    : <><FileText className="w-12 h-12 mx-auto mb-2 text-gray-600" /><p className="text-sm">Reading lesson — no video</p></>}
                </div>
              </div>
            )}

            <div className="p-4 sm:p-6 space-y-6 max-w-4xl">
              {/* Lesson header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-white">{activeLesson.title}</h1>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500 flex-wrap">
                    {activeLesson.duration > 0 && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{activeLesson.duration} min</span>}
                    <span className="capitalize bg-white/5 px-2 py-0.5 rounded">{activeLesson.type}</span>
                    {activeLesson.isPreview && <span className="text-green-400 bg-green-500/10 px-2 py-0.5 rounded">Free Preview</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!isCompleted ? (
                    <button onClick={() => markMutation.mutate(activeLesson._id)} disabled={markMutation.isPending}
                      className="btn-primary flex items-center gap-1.5 text-xs sm:text-sm px-3 py-2">
                      {markMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      Mark Lesson Done
                    </button>
                  ) : (
                    <span className="flex items-center gap-1.5 text-sm text-green-400">
                      <CheckCircle className="w-4 h-4" /> Lesson Done
                    </span>
                  )}
                  {allDone && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <button onClick={claimCertificate} disabled={claiming || claimed}
                        className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-dark-900 font-bold text-xs sm:text-sm px-3 py-2 rounded-xl transition-colors">
                        {claiming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Award className="w-3.5 h-3.5" />}
                        {claimed ? 'Claimed!' : 'Get Certificate'}
                      </button>
                      <button onClick={requestReportCard} disabled={requestingRC || rcRequested}
                        className="flex items-center gap-1.5 bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 border border-violet-500/30 font-semibold text-xs sm:text-sm px-3 py-2 rounded-xl transition-colors disabled:opacity-60">
                        {requestingRC ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Award className="w-3.5 h-3.5" />}
                        {rcRequested ? 'Requested!' : 'Request Report Card'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {activeLesson.description && (
                <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">{activeLesson.description}</p>
              )}

              {/* Extra recordings for this lesson */}
              {lessonSessions.length > 1 && (
                <div>
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <PlayCircle className="w-4 h-4 text-primary-400" /> Class Recordings
                  </h3>
                  <div className="space-y-2">
                    {lessonSessions.map((s: any) => (
                      <div key={s._id} className="bg-dark-800 rounded-xl border border-white/5 p-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate">{s.title}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 flex-wrap">
                            {s.batch && <span className="text-violet-400">Batch {s.batch.batchNumber}</span>}
                            {s.scheduledAt && <span>{new Date(s.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
                            <span className={s.wasPresent ? 'text-green-400' : 'text-gray-500'}>{s.wasPresent ? '✓ Attended' : '✗ Missed'}</span>
                          </div>
                          {s.summary && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{s.summary}</p>}
                        </div>
                        {s.recordingUrl && (
                          <a href={getRecordingUrl(s.recordingUrl)} target="_blank" rel="noreferrer"
                            className="flex-shrink-0 flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white px-3 py-1.5 rounded-xl text-xs font-semibold">
                            <PlayCircle className="w-3.5 h-3.5" /> Watch
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Session summary (from first recording) */}
              {lessonSessions[0]?.summary && (
                <div className="bg-dark-800 rounded-xl border border-white/5 p-4">
                  <p className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
                    <BarChart2 className="w-3.5 h-3.5" /> Session Summary
                  </p>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{lessonSessions[0].summary}</p>
                </div>
              )}

              {/* Notes for this lesson */}
              {lessonMaterials.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <FileDown className="w-4 h-4 text-yellow-400" /> Lesson Resources
                  </h3>
                  <div className="space-y-2">
                    {lessonMaterials.map((m: any) => <NoteCard key={m._id} material={m} />)}
                  </div>
                </div>
              )}

              {/* Assignments for this lesson */}
              {lessonAssignments.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-orange-400" /> Assignments
                  </h3>
                  <div className="space-y-3">
                    {lessonAssignments.map((a: any) => (
                      <AssignmentCard key={a._id} assignment={a} courseId={id}
                        onSubmit={() => qc.invalidateQueries({ queryKey: ['course-content', id] })} />
                    ))}
                  </div>
                </div>
              )}

              {/* Quizzes for this lesson */}
              {lessonQuizzes.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-violet-400" /> Quizzes
                  </h3>
                  <div className="space-y-3">
                    {lessonQuizzes.map((q: any) => <QuizCard key={q._id} quiz={q} />)}
                  </div>
                </div>
              )}

              {/* Course-level assignments & quizzes */}
              {(courseAssignments.length > 0 || courseQuizzes.length > 0 || courseMaterials.length > 0) && (
                <div className="border-t border-white/5 pt-6 space-y-6">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Course-Level Resources</p>
                  {courseMaterials.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                        <FileDown className="w-4 h-4 text-yellow-400" /> Notes & Materials
                      </h3>
                      <div className="space-y-2">
                        {courseMaterials.map((m: any) => <NoteCard key={m._id} material={m} />)}
                      </div>
                    </div>
                  )}
                  {courseAssignments.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-orange-400" /> Assignments
                      </h3>
                      <div className="space-y-3">
                        {courseAssignments.map((a: any) => (
                          <AssignmentCard key={a._id} assignment={a} courseId={id}
                            onSubmit={() => qc.invalidateQueries({ queryKey: ['course-content', id] })} />
                        ))}
                      </div>
                    </div>
                  )}
                  {courseQuizzes.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-violet-400" /> Quizzes
                      </h3>
                      <div className="space-y-3">
                        {courseQuizzes.map((q: any) => <QuizCard key={q._id} quiz={q} />)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Note Card ─────────────────────────────────────────────────────────────────
function NoteCard({ material: m }: { material: any }) {
  const Icon = TYPE_ICON[m.type] || File
  const colorClass = TYPE_COLOR[m.type] || 'text-gray-400 bg-gray-500/15 border-gray-500/20'
  const handleDownload = async () => {
    try { await materialAPI.incrementDownload(m._id) } catch {}
    window.open(m.url, '_blank')
  }
  return (
    <div className="bg-dark-800 rounded-2xl border border-white/5 p-4 flex items-start gap-4 hover:border-white/10 transition-colors">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-white font-semibold text-sm">{m.title}</h4>
        {m.description && <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{m.description}</p>}
        <span className="text-xs text-gray-600 uppercase mt-1 block">{m.type}</span>
      </div>
      <button onClick={handleDownload}
        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${colorClass} hover:opacity-80`}>
        {m.type === 'link' ? <><ExternalLink className="w-3.5 h-3.5" /> Open</> : <><Download className="w-3.5 h-3.5" /> Download</>}
      </button>
    </div>
  )
}

// ── Assignment Card ───────────────────────────────────────────────────────────
function AssignmentCard({ assignment: a, courseId, onSubmit }: { assignment: any; courseId: string; onSubmit: () => void }) {
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const isOverdue = a.dueDate && new Date(a.dueDate) < new Date()
  const hasSubmission = !!a.mySubmission

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 20 * 1024 * 1024) return toast.error('File must be under 20MB')
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      await courseAPI.submitAssignment(a._id, fd)
      toast.success('Assignment submitted!')
      onSubmit()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className={`bg-dark-800 rounded-2xl border overflow-hidden ${isOverdue && !hasSubmission ? 'border-red-500/20' : 'border-white/5 hover:border-white/10'}`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm">{a.title}</h3>
            {a.description && <p className="text-sm text-gray-400 mt-1 line-clamp-3">{a.description}</p>}
            {/* Reference files from mentor */}
            {(a.referenceFiles || []).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {a.referenceFiles.map((f: any, i: number) => (
                  <a key={i} href={f.url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20 px-2 py-1 rounded-lg border border-yellow-500/15 transition-colors">
                    <FileDown className="w-3 h-3" />{f.name}
                  </a>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
              {a.dueDate && (
                <span className={`flex items-center gap-1 font-medium px-2 py-0.5 rounded-lg ${isOverdue ? 'text-red-400 bg-red-500/10' : 'text-yellow-400 bg-yellow-500/10'}`}>
                  <AlertCircle className="w-3 h-3" />
                  Due: {new Date(a.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              )}
              <span className="text-gray-500 flex items-center gap-1"><Star className="w-3 h-3" />{a.maxScore} pts</span>
            </div>
          </div>
          <div className="flex-shrink-0">
            {hasSubmission ? (
              <div className="text-right">
                <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-400 px-2.5 py-1 rounded-xl text-xs font-semibold border border-green-500/15">
                  <CheckCircle className="w-3 h-3" /> Submitted
                </span>
                {a.mySubmission?.score != null && (
                  <p className="text-xs text-gray-400 mt-1">{a.mySubmission.score}/{a.maxScore}</p>
                )}
              </div>
            ) : (
              <span className={`text-xs px-2 py-1 rounded-xl ${isOverdue ? 'bg-red-500/10 text-red-400 border border-red-500/15' : 'bg-dark-700 text-gray-400 border border-white/5'}`}>
                {isOverdue ? 'Overdue' : 'Pending'}
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-white/5">
          <input ref={fileRef} type="file" className="hidden"
            accept=".pdf,.doc,.docx,.zip,.jpg,.jpeg,.png"
            onChange={handleFileSelect} />
          {!hasSubmission ? (
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="flex items-center gap-1.5 bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 border border-primary-500/20 px-3 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50">
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {uploading ? 'Uploading...' : 'Submit Assignment'}
            </button>
          ) : a.mySubmission?.feedback ? (
            <div className="bg-dark-700 rounded-xl p-3">
              <p className="text-xs font-semibold text-gray-400 mb-1">Mentor Feedback</p>
              <p className="text-xs text-gray-300">{a.mySubmission.feedback}</p>
            </div>
          ) : (
            <p className="text-xs text-gray-500">Awaiting review by mentor</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Quiz Card ─────────────────────────────────────────────────────────────────
function QuizCard({ quiz: q }: { quiz: any }) {
  const attempted = !!q.myAttempt
  const passed = q.myAttempt?.passed
  return (
    <div className="bg-dark-800 rounded-2xl border border-white/5 p-4 hover:border-violet-500/20 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${attempted ? (passed ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400') : 'bg-violet-500/10 border-violet-500/20 text-violet-400'}`}>
            {attempted ? (passed ? <CheckSquare className="w-5 h-5" /> : <XSquare className="w-5 h-5" />) : <HelpCircle className="w-5 h-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-semibold text-sm">{q.title}</h4>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
              <span className="flex items-center gap-1"><HelpCircle className="w-3 h-3" />{q.questions?.length || 0} questions</span>
              {q.duration > 0 && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{q.duration} min</span>}
              <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" />Pass: {q.passingScore}%</span>
            </div>
            {attempted && (
              <div className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${passed ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {passed ? <CheckCircle className="w-3 h-3" /> : <XSquare className="w-3 h-3" />}
                Score: {q.myAttempt.score}% — {passed ? 'Passed' : 'Failed'}
              </div>
            )}
          </div>
        </div>
        <Link href={`/student/quizzes/${q._id}`}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${attempted ? 'bg-dark-700 text-gray-300 hover:bg-dark-600 border border-white/5' : 'bg-violet-500/15 text-violet-300 hover:bg-violet-500/25 border border-violet-500/20'}`}>
          {attempted ? 'Retry' : 'Start'} <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}
