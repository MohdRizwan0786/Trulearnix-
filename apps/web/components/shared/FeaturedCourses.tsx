'use client'
import { useQuery } from '@tanstack/react-query'
import { courseAPI } from '@/lib/api'
import Link from 'next/link'
import { Star, Users, Clock, ChevronRight } from 'lucide-react'

function CourseCard({ course }: { course: any }) {
  const price = course.discountPrice || course.price
  const hasDiscount = course.discountPrice && course.discountPrice < course.price

  return (
    <Link href={`/courses/${course.slug}`}
      className="card group cursor-pointer hover:scale-[1.02] transition-all duration-300">
      <div className="relative overflow-hidden rounded-xl mb-4 aspect-video">
        <img src={course.thumbnail || '/placeholder-course.jpg'} alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        <div className="absolute top-2 right-2">
          <span className={`badge ${course.level === 'beginner' ? 'bg-green-500/20 text-green-400' : course.level === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
            {course.level}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs text-primary-400 font-medium">{course.category}</p>
        <h3 className="font-semibold text-white line-clamp-2 group-hover:text-primary-400 transition-colors">{course.title}</h3>
        <p className="text-sm text-gray-400 line-clamp-2">{course.shortDescription}</p>

        <div className="flex items-center gap-1">
          <img src={course.mentor?.avatar || '/avatar-placeholder.jpg'} alt="" className="w-5 h-5 rounded-full" />
          <span className="text-xs text-gray-400">{course.mentor?.name}</span>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            {course.rating.toFixed(1)} ({course.ratingCount})
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" /> {course.enrolledCount}
          </span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-white">₹{price.toLocaleString()}</span>
            {hasDiscount && <span className="text-sm text-gray-500 line-through">₹{course.price.toLocaleString()}</span>}
          </div>
          {hasDiscount && (
            <span className="badge bg-green-500/20 text-green-400">
              {Math.round((1 - course.discountPrice / course.price) * 100)}% off
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

export default function FeaturedCourses() {
  const { data } = useQuery({
    queryKey: ['featured-courses'],
    queryFn: () => courseAPI.getAll({ limit: 6, sort: '-enrolledCount' }).then(r => r.data)
  })

  return (
    <section className="section">
      <div className="flex items-center justify-between mb-12">
        <div>
          <p className="text-primary-400 font-medium mb-2">Learn from the Best</p>
          <h2 className="text-4xl font-bold text-white">Featured Courses</h2>
        </div>
        <Link href="/courses" className="flex items-center gap-1 text-primary-400 hover:text-primary-300 transition-colors">
          View All <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.courses?.map((course: any) => (
          <CourseCard key={course._id} course={course} />
        )) || Array(6).fill(0).map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="aspect-video bg-white/5 rounded-xl mb-4" />
            <div className="space-y-3">
              <div className="h-3 bg-white/5 rounded w-1/4" />
              <div className="h-5 bg-white/5 rounded" />
              <div className="h-4 bg-white/5 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
