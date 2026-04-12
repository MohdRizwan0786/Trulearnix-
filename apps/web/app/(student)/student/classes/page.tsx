'use client'
import { useQuery } from '@tanstack/react-query'
import { classAPI } from '@/lib/api'
import { Video, Calendar, Clock, Radio, Play, BookOpen, PlayCircle } from 'lucide-react'
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

  const statusStyle: Record<string, string> = {
    scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    live: 'bg-green-500/20 text-green-400 border-green-500/30',
    ended: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  }

  const liveClasses = classes?.filter((c: any) => c.status === 'live') || []
  const upcomingClasses = classes?.filter((c: any) => c.status === 'scheduled') || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Live Classes</h1>
        <p className="text-gray-400 mt-1 text-sm">Join live sessions from your enrolled courses</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="bg-dark-800 rounded-2xl h-28 animate-pulse border border-white/5" />)}
        </div>
      ) : !classes?.length && !recordings?.length ? (
        <div className="bg-dark-800 rounded-2xl p-12 border border-white/5 text-center">
          <div className="w-16 h-16 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8 text-primary-400" />
          </div>
          <h3 className="text-white font-bold text-lg mb-2">No upcoming classes</h3>
          <p className="text-gray-400 text-sm mb-6">Enroll in courses to join live sessions with mentors</p>
          <Link href="/courses" className="btn-primary text-sm px-6 py-2.5">Browse Courses</Link>
        </div>
      ) : (
        <>
          {/* Live Now */}
          {liveClasses.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse-live" />
                <h2 className="text-white font-bold">Live Now</h2>
                <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full border border-green-500/30">{liveClasses.length}</span>
              </div>
              <div className="space-y-3">
                {liveClasses.map((cls: any) => (
                  <ClassCard key={cls._id} cls={cls} statusStyle={statusStyle} isLive />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming */}
          {upcomingClasses.length > 0 && (
            <div>
              <h2 className="text-white font-bold mb-3">Upcoming Classes</h2>
              <div className="space-y-3">
                {upcomingClasses.map((cls: any) => (
                  <ClassCard key={cls._id} cls={cls} statusStyle={statusStyle} />
                ))}
              </div>
            </div>
          )}

          {/* Recordings */}
          {(recordings?.length > 0 || recLoading) && (
            <div>
              <h2 className="text-white font-bold mb-3 flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-primary-400" />
                Recorded Classes
              </h2>
              {recLoading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => <div key={i} className="bg-dark-800 rounded-2xl h-24 animate-pulse border border-white/5" />)}
                </div>
              ) : (
                <div className="space-y-3">
                  {recordings.map((cls: any) => (
                    <RecordingCard key={cls._id} cls={cls} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ClassCard({ cls, statusStyle, isLive }: { cls: any; statusStyle: Record<string, string>; isLive?: boolean }) {
  return (
    <div className={`bg-dark-800 rounded-2xl p-4 lg:p-5 border transition-all ${isLive ? 'border-green-500/30 shadow-lg shadow-green-500/5' : 'border-white/5 hover:border-white/10'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Left */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isLive ? 'bg-green-500/20' : 'bg-primary-500/10'}`}>
            {isLive
              ? <Radio className="w-6 h-6 text-green-400 animate-pulse" />
              : <Video className="w-6 h-6 text-primary-400" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-white truncate">{cls.title}</h3>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusStyle[cls.status]}`}>
                {cls.status === 'live' ? '● LIVE' : cls.status}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${cls.platform === 'zoom' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                {cls.platform === 'zoom' ? 'Zoom' : 'WebRTC'}
              </span>
            </div>
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
              <span className="flex items-center gap-1 text-gray-500">
                Mentor: {cls.mentor?.name}
              </span>
            </div>
          </div>
        </div>

        {/* Action */}
        <div className="flex-shrink-0">
          {cls.status === 'live' && (
            <Link href={`/student/classes/${cls._id}`}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm">
              <Play className="w-4 h-4" /> Join Now
            </Link>
          )}
          {cls.status === 'scheduled' && (
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Starts in</p>
              <p className="text-sm font-bold text-white">
                {getTimeUntil(cls.scheduledAt)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function RecordingCard({ cls }: { cls: any }) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'
  const recordingUrl = cls.recordingUrl?.startsWith('http') ? cls.recordingUrl : `${apiBase}${cls.recordingUrl}`
  return (
    <div className="bg-dark-800 rounded-2xl p-4 lg:p-5 border border-white/5 hover:border-primary-500/20 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <PlayCircle className="w-6 h-6 text-primary-400" />
          </div>
          <div className="min-w-0">
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
              <span>Mentor: {cls.mentor?.name}</span>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0">
          <a href={recordingUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm">
            <Play className="w-4 h-4" /> Watch
          </a>
        </div>
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
