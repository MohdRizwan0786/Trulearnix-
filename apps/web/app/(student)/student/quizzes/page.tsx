'use client'
import { useQuery } from '@tanstack/react-query'
import { quizAPI } from '@/lib/api'
import Link from 'next/link'
import { FileQuestion, Clock, Trophy, CheckCircle, XCircle, ChevronRight, Loader2, BookOpen } from 'lucide-react'

export default function QuizzesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['student-quizzes'],
    queryFn: () => quizAPI.list().then(r => r.data.quizzes),
  })

  const quizzes: any[] = data || []

  return (
    <div className="space-y-5 max-w-3xl pb-8">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <FileQuestion className="w-6 h-6 text-violet-400" /> Quizzes
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Test your knowledge from your enrolled courses</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-9 h-9 animate-spin text-violet-400" />
          <p className="text-gray-500 text-sm">Loading quizzes…</p>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="rounded-3xl py-20 text-center" style={{ background: 'rgba(13,13,20,0.95)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <FileQuestion className="w-7 h-7 text-gray-600" />
          </div>
          <p className="text-white font-bold">No quizzes available</p>
          <p className="text-gray-500 text-sm mt-1">Enroll in courses to access quizzes</p>
          <Link href="/student/courses" className="inline-flex items-center gap-2 mt-4 px-4 py-2.5 rounded-2xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
            <BookOpen className="w-4 h-4" /> Browse Courses
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {quizzes.map((quiz: any) => {
            const result = quiz.result
            const attempted = !!result
            const passed = result?.passed
            const total = quiz.questions?.length || 0

            return (
              <div key={quiz._id} className="rounded-2xl p-4 flex items-center gap-4 transition-all hover:scale-[1.01]"
                style={{ background: 'rgba(13,13,20,0.95)', border: `1px solid ${attempted ? passed ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
                {/* Icon */}
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: attempted ? passed ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' : 'rgba(139,92,246,0.1)' }}>
                  {attempted
                    ? passed
                      ? <Trophy className="w-5 h-5 text-green-400" />
                      : <XCircle className="w-5 h-5 text-red-400" />
                    : <FileQuestion className="w-5 h-5 text-violet-400" />
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-sm">{quiz.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {quiz.course?.title || 'Course'}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileQuestion className="w-3 h-3" />
                      {total} questions
                    </span>
                    {quiz.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {quiz.duration} min
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-violet-400" />
                      Pass: {quiz.passingScore}%
                    </span>
                  </div>
                  {attempted && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${result.score}%`, background: passed ? 'linear-gradient(90deg,#22c55e,#4ade80)' : 'linear-gradient(90deg,#ef4444,#f87171)' }} />
                      </div>
                      <span className={`text-xs font-black ${passed ? 'text-green-400' : 'text-red-400'}`}>
                        {result.score}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Action */}
                <Link href={`/student/quizzes/${quiz._id}`}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0"
                  style={attempted
                    ? { background: 'rgba(255,255,255,0.06)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)' }
                    : { background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff' }}>
                  {attempted ? 'Retry' : 'Start Quiz'}
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
