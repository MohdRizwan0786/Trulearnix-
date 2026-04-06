'use client'
import { useQuery } from '@tanstack/react-query'
import { courseAPI, paymentAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Star, Users, Clock, Award, CheckCircle, Play, Lock, ShoppingCart, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

declare global { interface Window { Razorpay: any } }

export default function CourseDetailPage({ params }: { params: { slug: string } }) {
  const [enrolling, setEnrolling] = useState(false)
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()

  const { data } = useQuery({
    queryKey: ['course', params.slug],
    queryFn: () => courseAPI.getBySlug(params.slug).then(r => r.data.course)
  })

  const course = data

  const handleEnroll = async () => {
    if (!isAuthenticated()) return router.push('/register')

    try {
      setEnrolling(true)

      // Check if free
      const price = course.discountPrice || course.price
      if (price === 0) {
        // Free course direct enroll via API
        toast.success('Enrolled successfully!')
        router.push(`/student/courses/${course._id}`)
        return
      }

      const orderRes = await paymentAPI.createOrder({ courseId: course._id })
      const { orderId, amount, currency, keyId } = orderRes.data

      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      document.body.appendChild(script)

      script.onload = () => {
        const rzp = new window.Razorpay({
          key: keyId,
          amount,
          currency,
          order_id: orderId,
          name: 'TruLearnix',
          description: course.title,
          prefill: { name: user?.name, email: user?.email },
          theme: { color: '#6366f1' },
          handler: async (response: any) => {
            try {
              await paymentAPI.verify({
                razorpayOrderId: orderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
              })
              toast.success('Enrolled successfully! 🎉')
              router.push(`/student/courses/${course._id}`)
            } catch {
              toast.error('Payment verification failed')
            }
          },
          modal: { ondismiss: () => setEnrolling(false) }
        })
        rzp.open()
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Something went wrong')
      setEnrolling(false)
    }
  }

  if (!course) return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
    </div>
  )

  const totalLessons = course.modules?.reduce((s: number, m: any) => s + m.lessons.length, 0) || 0
  const totalDuration = course.modules?.reduce((s: number, m: any) => s + m.lessons.reduce((ls: number, l: any) => ls + (l.duration || 0), 0), 0) || 0

  return (
    <div>
      <Navbar />
      <div className="pt-20">
        {/* Hero */}
        <div className="bg-dark-800/50 py-12 px-4">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <p className="text-primary-400 text-sm font-medium mb-2">{course.category}</p>
              <h1 className="text-4xl font-bold text-white mb-4">{course.title}</h1>
              <p className="text-gray-300 text-lg mb-6">{course.shortDescription}</p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-6">
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  {course.rating.toFixed(1)} ({course.ratingCount} reviews)
                </span>
                <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {course.enrolledCount} students</span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {Math.round(totalDuration / 60)}h total</span>
                <span className="capitalize badge bg-dark-700 text-gray-300">{course.level}</span>
                <span className="badge bg-dark-700 text-gray-300">{course.language}</span>
              </div>

              <div className="flex items-center gap-3">
                <img src={course.mentor?.avatar || '/avatar.jpg'} alt="" className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <p className="text-white font-medium">{course.mentor?.name}</p>
                  <p className="text-gray-400 text-sm">Instructor</p>
                </div>
              </div>
            </div>

            {/* Enroll Card */}
            <div className="card sticky top-24 self-start">
              <img src={course.thumbnail} alt="" className="w-full aspect-video object-cover rounded-xl mb-4" />
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl font-black text-white">₹{(course.discountPrice || course.price).toLocaleString()}</span>
                {course.discountPrice && <span className="text-gray-500 line-through">₹{course.price.toLocaleString()}</span>}
                {course.discountPrice && <span className="badge bg-green-500/20 text-green-400">{Math.round((1 - course.discountPrice / course.price) * 100)}% off</span>}
              </div>

              <button onClick={handleEnroll} disabled={enrolling}
                className="btn-primary w-full flex items-center justify-center gap-2 mb-3">
                {enrolling ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : <><ShoppingCart className="w-4 h-4" /> Enroll Now</>}
              </button>

              <div className="text-xs text-gray-400 text-center mb-4">30-Day Money-Back Guarantee</div>

              <div className="space-y-2 text-sm">
                {[
                  `${totalLessons} lessons`,
                  `${Math.round(totalDuration / 60)}h of content`,
                  'Live class access',
                  course.certificate && 'Certificate of completion',
                  'Lifetime access',
                ].filter(Boolean).map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 py-12 lg:pr-[calc(33%+2rem)]">
          {/* What you'll learn */}
          {course.outcomes?.length > 0 && (
            <div className="card mb-8">
              <h2 className="text-xl font-bold text-white mb-4">What You'll Learn</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {course.outcomes.map((o: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    {o}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Curriculum */}
          <div className="card mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Course Curriculum</h2>
            <div className="space-y-3">
              {course.modules?.map((mod: any, i: number) => (
                <div key={i} className="border border-white/10 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-dark-700">
                    <h3 className="font-semibold text-white">{mod.title}</h3>
                    <span className="text-xs text-gray-400">{mod.lessons.length} lessons</span>
                  </div>
                  <div className="divide-y divide-white/5">
                    {mod.lessons.map((lesson: any, j: number) => (
                      <div key={j} className="flex items-center gap-3 px-4 py-3 text-sm">
                        {lesson.isPreview ? <Play className="w-4 h-4 text-primary-400" /> : <Lock className="w-4 h-4 text-gray-500" />}
                        <span className={lesson.isPreview ? 'text-gray-300' : 'text-gray-500'}>{lesson.title}</span>
                        {lesson.duration && <span className="ml-auto text-xs text-gray-500">{lesson.duration}min</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews */}
          {course.reviews?.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-bold text-white mb-4">Student Reviews</h2>
              <div className="space-y-4">
                {course.reviews.slice(0, 5).map((r: any, i: number) => (
                  <div key={i} className="p-4 bg-dark-700 rounded-xl">
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(r.rating)].map((_, j) => <Star key={j} className="w-3 h-3 fill-yellow-400 text-yellow-400" />)}
                    </div>
                    <p className="text-sm text-gray-300">{r.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}
