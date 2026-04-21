'use client'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { courseAPI, userAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Search, Star, Users, Heart, Package, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const categories = ['All', 'Web Development', 'Data Science', 'Mobile Dev', 'UI/UX Design', 'Digital Marketing', 'Cloud & DevOps', 'Cybersecurity', 'AI/ML']
const levels = ['All', 'beginner', 'intermediate', 'advanced']

function FavoriteBtn({ courseId }: { courseId: string }) {
  const { isAuthenticated } = useAuthStore()
  const qc = useQueryClient()
  const { data: favData } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => userAPI.favorites().then(r => r.data.favorites),
    enabled: isAuthenticated(),
    staleTime: 60000,
  })
  const isFav = (favData || []).some((c: any) => c._id === courseId)
  const toggleMut = useMutation({
    mutationFn: () => userAPI.toggleFavorite(courseId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
  })
  if (!isAuthenticated()) return null
  return (
    <button
      onClick={e => { e.preventDefault(); toggleMut.mutate() }}
      disabled={toggleMut.isPending}
      className={`absolute top-2 left-2 w-8 h-8 rounded-xl backdrop-blur-sm flex items-center justify-center transition-all hover:scale-110 z-10 ${
        isFav ? 'bg-rose-500/90' : 'bg-black/50 hover:bg-rose-500/70'
      }`}
      title={isFav ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart className={`w-4 h-4 ${isFav ? 'text-white fill-white' : 'text-white'}`} />
    </button>
  )
}

export default function CoursesPage() {
  const searchParams = useSearchParams()
  const typeParam = searchParams.get('type') // 'package' | 'course' | null
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [level, setLevel] = useState('All')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['courses', search, category, level, page, typeParam],
    queryFn: () => courseAPI.getAll({
      search: search || undefined,
      category: category !== 'All' ? category : undefined,
      level: level !== 'All' ? level : undefined,
      type: typeParam || undefined,
      page, limit: 12
    }).then(r => r.data),
    placeholderData: (prev: any) => prev
  })

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 pt-24 pb-0">
        <Link href="/" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />Back to Home
        </Link>
      </div>
      <div className="pt-4 min-h-screen">
        {/* Header */}
        <div className="bg-dark-800/50 py-16 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-white mb-4">
              {typeParam === 'package' ? 'Course Packages' : 'Explore Courses'}
            </h1>
            <p className="text-gray-400 mb-8">
              {typeParam === 'package'
                ? 'Bundle packages — multiple skills in one. Best value for serious learners.'
                : '500+ expert-led courses to accelerate your career'}
            </p>
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search courses, skills, instructors..."
                className="input pl-12 pr-4 py-4 text-lg w-full" />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-8">
            <div className="flex gap-2 flex-wrap">
              {categories.map(c => (
                <button key={c} onClick={() => setCategory(c)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${category === c ? 'bg-primary-500 text-white' : 'bg-dark-800 text-gray-400 hover:text-white border border-white/10'}`}>
                  {c}
                </button>
              ))}
            </div>
            <select value={level} onChange={e => setLevel(e.target.value)}
              className="input py-2 px-4 w-auto capitalize">
              {levels.map(l => <option key={l} value={l} className="capitalize">{l === 'All' ? 'All Levels' : l}</option>)}
            </select>
          </div>

          {/* Results count */}
          <p className="text-gray-400 text-sm mb-6">
            {isLoading ? 'Loading...' : `${data?.pagination?.total || 0} courses found`}
          </p>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {isLoading ? Array(8).fill(0).map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="aspect-video bg-white/5 rounded-xl mb-4" />
                <div className="space-y-2">
                  <div className="h-4 bg-white/5 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded" />
                  <div className="h-6 bg-white/5 rounded w-1/3 mt-4" />
                </div>
              </div>
            )) : data?.courses?.map((course: any) => (
              <Link key={course._id} href={`/courses/${course.slug}`}
                className="card group hover:scale-[1.02] transition-all cursor-pointer">
                <div className="relative aspect-video overflow-hidden rounded-xl mb-3">
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <FavoriteBtn courseId={course._id} />
                  <span className={`absolute top-2 right-2 badge text-xs ${course.level === 'beginner' ? 'bg-green-500/80 text-white' : course.level === 'intermediate' ? 'bg-yellow-500/80 text-white' : 'bg-red-500/80 text-white'}`}>
                    {course.level}
                  </span>
                </div>
                <p className="text-xs text-primary-400 mb-1">{course.category}</p>
                <h3 className="font-semibold text-white text-sm line-clamp-2 mb-2 group-hover:text-primary-400">{course.title}</h3>
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  {course.rating.toFixed(1)} • <Users className="w-3 h-3" /> {course.enrolledCount}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-white">₹{(course.discountPrice || course.price).toLocaleString()}</span>
                  {course.discountPrice && <span className="text-xs text-gray-500 line-through">₹{course.price.toLocaleString()}</span>}
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {data?.pagination && data.pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {Array.from({ length: data.pagination.pages }).map((_, i) => (
                <button key={i} onClick={() => setPage(i + 1)}
                  className={`w-10 h-10 rounded-xl font-medium transition-colors ${page === i + 1 ? 'bg-primary-500 text-white' : 'bg-dark-800 text-gray-400 hover:text-white border border-white/10'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}
