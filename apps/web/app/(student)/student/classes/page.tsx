'use client'
import { useQuery } from '@tanstack/react-query'
import { classAPI } from '@/lib/api'
import { Video, Calendar, Clock, Radio, Play, BookOpen, PlayCircle, Users, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function StudentClassesPage() {
  const { data: classes, isLoading } = useQuery({
    queryKey: ['student-classes'],
    queryFn: () => classAPI.upcoming().then(r => r.data.classes)
  })
  const { data: recordings, isLoading: recLoading } = useQuery({
    queryKey: ['student-recordings'],
    queryFn: () => classAPI.myRecordings().then(r => r.data.classes)
  })

  const liveClasses = classes?.filter((c: any) => c.status === 'live') || []
  const upcomingClasses = classes?.filter((c: any) => c.status === 'scheduled') || []

  return (
    <>
      <style>{`
        @keyframes liveRing {
          0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.6); }
          70% { box-shadow: 0 0 0 12px rgba(34,197,94,0); }
          100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
        }
        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .live-badge { animation: livePulse 1.5s infinite; }
        .live-card { animation: liveRing 2s infinite; }
      `}</style>

      <div className="space-y-6 max-w-4xl pb-8">

        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl p-6" style={{
          background: 'linear-gradient(135deg, rgba(6,182,212,0.18) 0%, rgba(99,102,241,0.12) 100%)',
          border: '1px solid rgba(6,182,212,0.2)'
        }}>
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(6,182,212,0.25)' }} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(6,182,212,0.2)' }}>
                <Video className="w-4 h-4 text-cyan-400" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">Live Classes</h1>
            </div>
            <p className="text-gray-400 text-sm">From your mentor — join live or watch recordings</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl h-28 animate-pulse" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }} />
            ))}
          </div>
        ) : !classes?.length && !recordings?.length ? (
          <div className="rounded-3xl text-center py-20 px-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>
              <Video className="w-10 h-10 text-cyan-400/50" />
            </div>
            <h3 className="text-white font-black text-xl mb-2">No classes yet</h3>
            <p className="text-gray-400 text-sm mb-6">Enroll in courses to join live sessions with mentors</p>
            <Link href="/courses" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-bold hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 8px 25px rgba(99,102,241,0.3)' }}>
              Browse Courses <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
            {/* LIVE NOW */}
            {liveClasses.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="live-badge flex items-center gap-2 px-3 py-1.5 rounded-xl font-black text-sm text-green-300"
                    style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
                    <span className="w-2.5 h-2.5 bg-green-400 rounded-full" />
                    LIVE NOW
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full text-green-300"
                    style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)' }}>
                    {liveClasses.length} class{liveClasses.length > 1 ? 'es' : ''}
                  </span>
                </div>
                <div className="space-y-3">
                  {liveClasses.map((cls: any) => <LiveClassCard key={cls._id} cls={cls} />)}
                </div>
              </div>
            )}

            {/* Upcoming */}
            {upcomingClasses.length > 0 && (
              <div>
                <h2 className="text-white font-black text-lg mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-400" /> Upcoming Classes
                </h2>
                <div className="space-y-3">
                  {upcomingClasses.map((cls: any) => <UpcomingClassCard key={cls._id} cls={cls} />)}
                </div>
              </div>
            )}

            {/* Recordings */}
            {(recordings?.length > 0 || recLoading) && (
              <div>
                <h2 className="text-white font-black text-lg mb-4 flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 text-violet-400" /> Recorded Classes
                </h2>
                {recLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map(i => (
                      <div key={i} className="rounded-2xl h-24 animate-pulse" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recordings.map((cls: any) => <RecordingCard key={cls._id} cls={cls} />)}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

function LiveClassCard({ cls }: { cls: any }) {
  return (
    <div className="live-card rounded-2xl p-5 relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, rgba(34,197,94,0.12), rgba(16,185,129,0.08))',
      border: '1px solid rgba(34,197,94,0.3)'
    }}>
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl pointer-events-none" style={{ background: 'rgba(34,197,94,0.2)' }} />
      <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.25)' }}>
            <Radio className="w-6 h-6 text-green-400 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-black text-white text-base">{cls.title}</h3>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-green-300" style={{ background: 'rgba(34,197,94,0.2)' }}>
                LIVE
              </span>
            </div>
            <div className="flex items-center gap-1.5 mb-1">
              <BookOpen className="w-3 h-3 text-gray-500" />
              <p className="text-sm text-gray-400 truncate">{cls.course?.title}</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
              <span className="flex items-center gap-1"><Users className="w-3 h-3 text-green-400/60" />Mentor: {cls.mentor?.name}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{cls.duration}min</span>
            </div>
          </div>
        </div>
        <Link href={`/student/classes/${cls._id}`}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-black text-white text-sm flex-shrink-0 hover:opacity-90 transition-all"
          style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 8px 25px rgba(34,197,94,0.35)' }}>
          <Play className="w-4 h-4" /> Join Now
        </Link>
      </div>
    </div>
  )
}

function UpcomingClassCard({ cls }: { cls: any }) {
  return (
    <div className="rounded-2xl p-4 sm:p-5 transition-all hover:scale-[1.01]" style={{
      background: 'rgba(13,13,20,0.95)',
      border: '1px solid rgba(255,255,255,0.06)'
    }}
    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.3)'}
    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <Video className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-white truncate">{cls.title}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <BookOpen className="w-3 h-3 text-gray-500" />
              <p className="text-sm text-gray-400 truncate">{cls.course?.title}</p>
            </div>
            <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(cls.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(cls.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} • {cls.duration}min
              </span>
              <span className="flex items-center gap-1 text-indigo-400/60">
                <Users className="w-3 h-3" />{cls.mentor?.name}
              </span>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-xs text-gray-500 mb-1">Starts in</p>
          <p className="text-sm font-black text-white">{getTimeUntil(cls.scheduledAt)}</p>
        </div>
      </div>
    </div>
  )
}

function RecordingCard({ cls }: { cls: any }) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'
  const recordingUrl = cls.recordingUrl?.startsWith('http') ? cls.recordingUrl : `${apiBase}${cls.recordingUrl}`

  return (
    <div className="rounded-2xl p-4 sm:p-5 transition-all hover:scale-[1.01]" style={{
      background: 'rgba(13,13,20,0.95)',
      border: '1px solid rgba(255,255,255,0.06)'
    }}
    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.3)'}
    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <PlayCircle className="w-6 h-6 text-violet-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-white truncate">{cls.title}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <BookOpen className="w-3 h-3 text-gray-500" />
              <p className="text-sm text-gray-400 truncate">{cls.course?.title}</p>
            </div>
            <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(cls.endedAt || cls.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              <span>{cls.duration}min</span>
              <span className="text-violet-400/60">Mentor: {cls.mentor?.name}</span>
            </div>
          </div>
        </div>
        <a href={recordingUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white text-sm flex-shrink-0 hover:opacity-90 transition-all"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', boxShadow: '0 4px 15px rgba(124,58,237,0.3)' }}>
          <Play className="w-4 h-4" /> Watch
        </a>
      </div>
    </div>
  )
}

function getTimeUntil(date: string) {
  const diff = new Date(date).getTime() - Date.now()
  if (diff <= 0) return 'Starting soon'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}
