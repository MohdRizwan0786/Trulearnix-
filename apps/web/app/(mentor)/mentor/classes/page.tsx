'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { classAPI } from '@/lib/api'
import { Video, Plus, Calendar, Clock, Users, Play, Square, X, Radio, Zap } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  scheduled: { label: 'Scheduled', color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/25'   },
  live:      { label: '● LIVE',    color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/30'  },
  ended:     { label: 'Ended',     color: 'text-gray-400',   bg: 'bg-gray-500/10',   border: 'border-gray-500/20'   },
  cancelled: { label: 'Cancelled', color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20'    },
}

export default function MentorClassesPage() {
  const router = useRouter()
  const qc     = useQueryClient()

  const { data: classes, isLoading } = useQuery({
    queryKey: ['mentor-classes'],
    queryFn: () => classAPI.upcoming().then(r => r.data.classes)
  })

  const startMutation = useMutation({
    mutationFn: (id: string) => classAPI.start(id),
    onSuccess: (_, id) => { qc.invalidateQueries({ queryKey: ['mentor-classes'] }); router.push(`/mentor/classes/${id}`) },
    onError: () => toast.error('Could not start class')
  })
  const endMutation = useMutation({
    mutationFn: (id: string) => classAPI.end(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mentor-classes'] }); toast.success('Class ended') },
    onError: () => toast.error('Could not end class')
  })
  const cancelMutation = useMutation({
    mutationFn: (id: string) => classAPI.cancel(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mentor-classes'] }); toast.success('Class cancelled') },
    onError: () => toast.error('Could not cancel class')
  })

  const totalStudents = classes?.reduce((a: number, c: any) => a + (c.attendees?.length || 0), 0) || 0

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-1">Teaching</p>
          <h1 className="text-2xl md:text-3xl font-black text-white">Live Classes</h1>
          <p className="text-gray-500 text-sm mt-1">Schedule and manage your live sessions</p>
        </div>
        <Link href="/mentor/classes/new"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 hover:opacity-90 active:scale-[0.98] transition-all w-fit">
          <Plus className="w-4 h-4" /> Schedule Class
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Classes', value: classes?.length || 0,                                             icon: Video,  from: 'rgba(139,92,246,0.25)', to: 'rgba(109,40,217,0.08)', iconCls: 'text-violet-400',  iconBg: 'bg-violet-500/20'  },
          { label: 'Live Now',      value: classes?.filter((c: any) => c.status === 'live').length || 0,     icon: Radio,  from: 'rgba(16,185,129,0.25)', to: 'rgba(5,150,105,0.08)', iconCls: 'text-green-400',   iconBg: 'bg-green-500/20'   },
          { label: 'Upcoming',      value: classes?.filter((c: any) => c.status === 'scheduled').length || 0,icon: Calendar,from:'rgba(59,130,246,0.25)', to: 'rgba(37,99,235,0.08)', iconCls: 'text-blue-400',    iconBg: 'bg-blue-500/20'    },
          { label: 'Total Joined',  value: totalStudents,                                                     icon: Users,  from: 'rgba(245,158,11,0.25)', to: 'rgba(217,119,6,0.08)', iconCls: 'text-amber-400',   iconBg: 'bg-amber-500/20'   },
        ].map((s, i) => (
          <div key={i} className="relative overflow-hidden rounded-2xl p-4 flex items-center gap-3"
            style={{ background: `linear-gradient(135deg, ${s.from}, ${s.to})`, border: `1px solid ${s.from}50` }}>
            <div className={`w-10 h-10 rounded-xl ${s.iconBg} flex items-center justify-center flex-shrink-0`}>
              <s.icon className={`w-5 h-5 ${s.iconCls}`} />
            </div>
            <div>
              <p className="text-xl font-black text-white tabular-nums">{s.value}</p>
              <p className="text-[11px] text-white/40 font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Classes List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-28 rounded-2xl bg-[#0f0f1a] animate-pulse border border-white/[0.04]" />)}
        </div>
      ) : !classes?.length ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-3xl bg-[#0f0f1a] border border-white/[0.06]">
          <div className="w-20 h-20 rounded-3xl bg-violet-500/10 border border-violet-500/15 flex items-center justify-center mb-5">
            <Video className="w-9 h-9 text-violet-400/60" />
          </div>
          <h3 className="text-white font-bold text-lg mb-1">No classes yet</h3>
          <p className="text-gray-500 text-sm mb-6 text-center max-w-xs">Schedule your first live class and start teaching</p>
          <Link href="/mentor/classes/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 hover:opacity-90 transition-all">
            <Plus className="w-4 h-4" /> Schedule Your First Class
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {classes.map((cls: any) => {
            const isLive = cls.status === 'live'
            const cfg    = statusConfig[cls.status] || statusConfig.scheduled
            return (
              <div key={cls._id}
                className={`rounded-2xl p-4 lg:p-5 transition-all ${
                  isLive
                    ? 'border border-green-500/30 shadow-lg shadow-green-500/8'
                    : 'bg-[#0f0f1a] border border-white/[0.06] hover:border-indigo-500/15'
                }`}
                style={isLive ? { background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.04))' } : {}}>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Icon + Info */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${isLive ? 'bg-green-500/20 shadow-md shadow-green-500/20' : 'bg-indigo-500/12'}`}>
                      {isLive
                        ? <Radio className="w-6 h-6 text-green-400 animate-pulse" />
                        : <Video className="w-6 h-6 text-indigo-400" />
                      }
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-white truncate">{cls.title}</h3>
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                          {cfg.label}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20 font-medium">
                          LiveKit
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate mb-1.5">{cls.course?.title}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(cls.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(cls.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} · {cls.duration}min
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {cls.attendees?.length || 0} joined
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                    {cls.status === 'scheduled' && (
                      <>
                        <button
                          onClick={() => startMutation.mutate(cls._id)}
                          disabled={startMutation.isPending}
                          className="flex items-center gap-1.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all hover:opacity-90 active:scale-[0.97] shadow-md shadow-green-500/20 disabled:opacity-50">
                          <Play className="w-4 h-4" /> Start Class
                        </button>
                        <button
                          onClick={() => cancelMutation.mutate(cls._id)}
                          disabled={cancelMutation.isPending}
                          className="flex items-center gap-1.5 text-sm px-3 py-2.5 rounded-xl bg-white/[0.04] hover:bg-red-500/12 text-gray-400 hover:text-red-400 transition-all border border-white/[0.07]">
                          <X className="w-4 h-4" /> Cancel
                        </button>
                      </>
                    )}
                    {cls.status === 'live' && (
                      <>
                        <Link href={`/mentor/classes/${cls._id}`}
                          className="flex items-center gap-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all hover:opacity-90 active:scale-[0.97] shadow-lg shadow-green-500/30 animate-pulse">
                          <Radio className="w-4 h-4" /> Enter Class
                        </Link>
                        <button
                          onClick={() => endMutation.mutate(cls._id)}
                          disabled={endMutation.isPending}
                          className="flex items-center gap-1.5 text-sm px-3 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 transition-all border border-red-500/25">
                          <Square className="w-4 h-4" /> End
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
