'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userAPI } from '@/lib/api'
import { Heart, BookOpen, Star, Clock, ArrowRight, Search } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

function FavoriteCard({ course }: { course: any }) {
  const qc = useQueryClient()
  const [removing, setRemoving] = useState(false)
  const removeMutation = useMutation({
    mutationFn: () => userAPI.toggleFavorite(course._id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites'] })
  })

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault()
    setRemoving(true)
    await removeMutation.mutateAsync()
  }

  return (
    <div className="group rounded-2xl overflow-hidden flex flex-col transition-all hover:-translate-y-1" style={{
      background: 'rgba(13,13,20,0.95)',
      border: '1px solid rgba(255,255,255,0.06)'
    }}
    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(244,63,94,0.3)'}
    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'}>

      <div className="relative aspect-video overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
        {course.thumbnail
          ? <img src={course.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(244,63,94,0.15), rgba(239,68,68,0.08))' }}>
              <BookOpen className="w-8 h-8 text-rose-600" />
            </div>
        }

        {/* Remove heart button */}
        <button
          onClick={handleRemove}
          disabled={removeMutation.isPending}
          className={`absolute top-2.5 right-2.5 w-9 h-9 rounded-xl backdrop-blur-sm flex items-center justify-center transition-all disabled:opacity-50 ${
            removing ? 'scale-75' : 'opacity-0 group-hover:opacity-100 hover:scale-110'
          }`}
          style={{ background: 'rgba(244,63,94,0.9)', boxShadow: '0 4px 15px rgba(244,63,94,0.4)' }}>
          <Heart className="w-4 h-4 text-white fill-white" />
        </button>

        {course.rating > 0 && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded-lg"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span className="text-xs text-white font-bold">{course.rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-white text-sm line-clamp-2 flex-1 group-hover:text-rose-300 transition-colors">
          {course.title}
        </h3>
        <div className="flex items-center gap-3 mt-2.5 text-xs text-gray-500">
          <span className="flex items-center gap-1 capitalize"><Clock className="w-3 h-3" />{course.level || 'Beginner'}</span>
          {course.enrolledCount > 0 && (
            <span>{course.enrolledCount.toLocaleString('en-IN')} enrolled</span>
          )}
        </div>
        <div className="mt-3">
          <Link
            href={`/courses/${course.slug || course._id}`}
            className="block w-full py-2 rounded-xl text-center text-xs font-bold transition-all hover:opacity-90"
            style={{ background: 'rgba(244,63,94,0.12)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.2)' }}>
            View Course
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function FavoritesPage() {
  const [search, setSearch] = useState('')
  const { data, isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => userAPI.favorites().then(r => r.data.favorites)
  })

  const filtered = (data || []).filter((c: any) =>
    !search || c.title?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <style>{`
        @keyframes heartBeat {
          0%, 100% { transform: scale(1); }
          15% { transform: scale(1.3); }
          30% { transform: scale(1); }
          45% { transform: scale(1.2); }
          60% { transform: scale(1); }
        }
        .heartbeat { animation: heartBeat 1.5s ease-in-out infinite; }
      `}</style>

      <div className="space-y-6 max-w-5xl pb-8">

        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl p-6" style={{
          background: 'linear-gradient(135deg, rgba(244,63,94,0.15), rgba(239,68,68,0.08))',
          border: '1px solid rgba(244,63,94,0.25)'
        }}>
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(244,63,94,0.2)' }} />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{
                background: 'linear-gradient(135deg, rgba(244,63,94,0.25), rgba(239,68,68,0.15))',
                border: '1px solid rgba(244,63,94,0.3)',
                boxShadow: '0 8px 25px rgba(244,63,94,0.2)'
              }}>
                <Heart className="w-7 h-7 text-rose-400 fill-rose-400 heartbeat" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white">Favorites</h1>
                <p className="text-gray-400 text-sm mt-0.5">
                  {data?.length || 0} saved course{(data?.length || 0) !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="relative max-w-xs w-full sm:w-auto">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search favorites..."
                className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                onFocus={e => e.target.style.borderColor = 'rgba(244,63,94,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl h-64 animate-pulse" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl text-center py-20 px-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.15)' }}>
              <Heart className="w-10 h-10 text-rose-400/40" />
            </div>
            <p className="text-white font-black text-xl">
              {search ? 'No matches found' : 'No favorites yet'}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              {search ? 'Try a different search.' : 'Browse courses and tap the heart to save them here.'}
            </p>
            {!search && (
              <Link href="/courses" className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-all"
                style={{ background: 'linear-gradient(135deg, rgba(244,63,94,0.4), rgba(239,68,68,0.3))', border: '1px solid rgba(244,63,94,0.3)' }}>
                Browse Courses <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((course: any) => (
              <FavoriteCard key={course._id} course={course} />
            ))}
          </div>
        )}

        {!isLoading && (data?.length || 0) > 0 && (
          <p className="text-xs text-gray-600 text-center">
            Hover on a card and click the heart button to remove from favorites
          </p>
        )}
      </div>
    </>
  )
}
