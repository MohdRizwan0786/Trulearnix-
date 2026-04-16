'use client'
import { useQuery } from '@tanstack/react-query'
import { announcementAPI } from '@/lib/api'
import { Megaphone, ExternalLink, Calendar, Bell, BookOpen, Users, Pin, ChevronRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

const ACCENT = [
  { border: 'rgba(99,102,241,0.3)',  glow: 'rgba(99,102,241,0.07)', icon: 'rgba(99,102,241,0.18)', iconColor: '#818cf8' },
  { border: 'rgba(6,182,212,0.3)',   glow: 'rgba(6,182,212,0.07)',  icon: 'rgba(6,182,212,0.15)',  iconColor: '#22d3ee' },
  { border: 'rgba(139,92,246,0.3)',  glow: 'rgba(139,92,246,0.07)', icon: 'rgba(139,92,246,0.15)', iconColor: '#c084fc' },
  { border: 'rgba(245,158,11,0.3)',  glow: 'rgba(245,158,11,0.07)', icon: 'rgba(245,158,11,0.15)', iconColor: '#fbbf24' },
]
const IMPORTANT = { border: 'rgba(244,63,94,0.35)', glow: 'rgba(244,63,94,0.07)', icon: 'rgba(244,63,94,0.18)', iconColor: '#f87171' }
const PINNED    = { border: 'rgba(251,191,36,0.4)',  glow: 'rgba(251,191,36,0.07)', icon: 'rgba(251,191,36,0.2)', iconColor: '#fbbf24' }

function TargetBadge({ a }: { a: any }) {
  if (a.targetType === 'course' && a.targetCourse) {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-semibold bg-green-500/15 text-green-400 border border-green-500/20">
        <BookOpen className="w-2.5 h-2.5" /> {a.targetCourse.title || 'Course'}
      </span>
    )
  }
  if (a.targetType === 'batch' && a.targetBatch) {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20">
        <Users className="w-2.5 h-2.5" /> {a.targetBatch.name || 'Batch'}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-semibold bg-violet-500/15 text-violet-400 border border-violet-500/20">
      <Bell className="w-2.5 h-2.5" /> All Students
    </span>
  )
}

function AnnouncementCard({ a, index }: { a: any; index: number }) {
  const isNew = new Date(a.createdAt) > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  const ac = a.pinned ? PINNED : a.priority > 5 ? IMPORTANT : ACCENT[index % ACCENT.length]
  const poster = a.postedBy || {}
  const fromLabel = poster.role === 'mentor' ? `Mentor · ${poster.name || ''}` : 'From Admin'

  return (
    <div className="rounded-2xl overflow-hidden transition-all hover:scale-[1.005]" style={{
      background: 'rgba(13,13,20,0.95)',
      border: `1px solid ${ac.border}`,
      boxShadow: `0 4px 24px ${ac.glow}`,
    }}>
      {/* Top bar */}
      <div className="px-5 py-2.5 flex items-center gap-2 border-b flex-wrap" style={{ borderColor: ac.border, background: ac.glow }}>
        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: ac.iconColor }} />
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: ac.iconColor }}>{fromLabel}</span>
        {a.pinned && <Pin className="w-3 h-3 text-amber-400 ml-1" />}
        <div className="ml-auto flex items-center gap-2">
          <TargetBadge a={a} />
          {isNew && (
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider bg-violet-500/20 text-violet-300 border border-violet-500/30">NEW</span>
          )}
          {a.priority > 5 && !a.pinned && (
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/30">IMPORTANT</span>
          )}
        </div>
      </div>

      {a.image && (
        <div className="relative aspect-[16/5] overflow-hidden">
          <img src={a.image} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(13,13,20,0.85), transparent)' }} />
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: ac.icon, border: `1px solid ${ac.border}` }}>
            <Megaphone className="w-4 h-4" style={{ color: ac.iconColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white leading-tight">{a.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="w-3 h-3 text-gray-600 flex-shrink-0" />
              <span className="text-[11px] text-gray-500">{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</span>
            </div>
          </div>
        </div>

        <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">{a.content}</p>

        {a.link && (
          <a href={a.link} target="_blank" rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:opacity-90"
            style={{ background: ac.icon, color: ac.iconColor, border: `1px solid ${ac.border}` }}>
            {a.linkText || 'Learn More'} <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  )
}

export default function AnnouncementsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-announcements'],
    queryFn: () => announcementAPI.my().then(r => r.data),
    staleTime: 60000,
  })

  const announcements: any[] = data?.announcements || []
  const pinned = announcements.filter(a => a.pinned)
  const rest = announcements.filter(a => !a.pinned)

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.3),rgba(139,92,246,0.3))', border: '1px solid rgba(99,102,241,0.3)' }}>
              <Bell className="w-5 h-5 text-violet-400" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Announcements</h1>
          </div>
          <p className="text-gray-500 text-sm ml-1">Updates from your courses, batches and admin</p>
        </div>
        <Link href="/student/support"
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl text-violet-400 border border-violet-500/30 hover:bg-violet-500/10 transition-colors">
          Raise a Ticket <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-36 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-20 rounded-2xl" style={{ background: 'rgba(13,13,20,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <Bell className="w-7 h-7 text-violet-400 opacity-40" />
          </div>
          <p className="text-gray-400 font-semibold">No announcements yet</p>
          <p className="text-gray-600 text-sm mt-1">Check back later for updates from admin and your mentors</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pinned.length > 0 && (
            <>
              <p className="text-[10px] text-amber-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                <Pin className="w-3 h-3" /> Pinned
              </p>
              {pinned.map((a, i) => <AnnouncementCard key={a._id} a={a} index={i} />)}
              {rest.length > 0 && <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest pt-2">Recent</p>}
            </>
          )}
          {rest.map((a, i) => <AnnouncementCard key={a._id} a={a} index={i} />)}
        </div>
      )}
    </div>
  )
}
