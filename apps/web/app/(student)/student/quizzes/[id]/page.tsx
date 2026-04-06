'use client'
import { useQuery } from '@tanstack/react-query'
import { quizAPI } from '@/lib/api'
import { useState, useEffect } from 'react'
import { Clock, CheckCircle, XCircle, Trophy, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'

export default function QuizPage({ params }: { params: { id: string } }) {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { data: quiz } = useQuery({
    queryKey: ['quiz', params.id],
    queryFn: () => quizAPI.get(params.id).then(r => r.data.quiz)
  })

  useEffect(() => {
    if (quiz?.duration) {
      setTimeLeft(quiz.duration * 60)
    }
  }, [quiz])

  useEffect(() => {
    if (timeLeft === null || submitted) return
    if (timeLeft === 0) { handleSubmit(); return }
    const timer = setTimeout(() => setTimeLeft(t => (t ?? 1) - 1), 1000)
    return () => clearTimeout(timer)
  }, [timeLeft, submitted])

  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      const res = await quizAPI.submit(params.id, answers)
      setResult(res.data)
      setSubmitted(true)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (!quiz) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" /></div>

  if (submitted && result) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Result */}
        <div className={`card text-center ${result.passed ? 'border-green-500/50' : 'border-red-500/50'}`}>
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${result.passed ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            {result.passed ? <Trophy className="w-10 h-10 text-green-400" /> : <XCircle className="w-10 h-10 text-red-400" />}
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{result.passed ? 'Congratulations! 🎉' : 'Better Luck Next Time'}</h2>
          <p className="text-gray-400 mb-6">{result.passed ? 'You passed the quiz!' : `You need ${result.passingScore}% to pass`}</p>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-dark-700 rounded-xl p-4">
              <p className="text-2xl font-bold text-white">{result.score}%</p>
              <p className="text-xs text-gray-400">Your Score</p>
            </div>
            <div className="bg-dark-700 rounded-xl p-4">
              <p className="text-2xl font-bold text-white">{result.earned}/{result.totalMarks}</p>
              <p className="text-xs text-gray-400">Marks</p>
            </div>
            <div className="bg-dark-700 rounded-xl p-4">
              <p className={`text-2xl font-bold ${result.passed ? 'text-green-400' : 'text-red-400'}`}>{result.passed ? 'PASS' : 'FAIL'}</p>
              <p className="text-xs text-gray-400">Result</p>
            </div>
          </div>
        </div>

        {/* Detailed results */}
        <div className="card">
          <h3 className="font-bold text-white mb-4">Question Review</h3>
          <div className="space-y-4">
            {quiz.questions.map((q: any, i: number) => {
              const r = result.results[i]
              return (
                <div key={q._id} className={`p-4 rounded-xl border ${r?.correct ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                  <div className="flex items-start gap-2 mb-3">
                    {r?.correct ? <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />}
                    <p className="text-white font-medium">{q.question}</p>
                  </div>
                  <div className="space-y-2 ml-7">
                    {q.options.map((opt: string, j: number) => (
                      <div key={j} className={`text-sm px-3 py-2 rounded-lg ${j === r?.correctOption ? 'bg-green-500/20 text-green-300' : j === answers[q._id] && !r?.correct ? 'bg-red-500/20 text-red-300' : 'text-gray-400'}`}>
                        {opt}
                      </div>
                    ))}
                  </div>
                  {r?.explanation && <p className="text-xs text-gray-400 ml-7 mt-2 italic">{r.explanation}</p>}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const answered = Object.keys(answers).length
  const total = quiz.questions?.length || 0

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{quiz.title}</h1>
            <p className="text-gray-400 text-sm mt-1">{total} questions • {quiz.passingScore}% to pass</p>
          </div>
          <div className="text-right">
            {timeLeft !== null && (
              <div className={`flex items-center gap-2 text-lg font-bold ${timeLeft < 60 ? 'text-red-400' : 'text-white'}`}>
                <Clock className="w-5 h-5" />
                {formatTime(timeLeft)}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1">{answered}/{total} answered</p>
          </div>
        </div>
        {/* Progress */}
        <div className="mt-4 h-2 bg-dark-700 rounded-full overflow-hidden">
          <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${(answered / total) * 100}%` }} />
        </div>
      </div>

      {/* Questions */}
      {quiz.questions?.map((q: any, i: number) => (
        <div key={q._id} className={`card ${answers[q._id] !== undefined ? 'border-primary-500/30' : ''}`}>
          <p className="font-medium text-white mb-4">
            <span className="text-primary-400 mr-2">Q{i + 1}.</span>
            {q.question}
          </p>
          <div className="space-y-2">
            {q.options.map((opt: string, j: number) => (
              <button key={j} onClick={() => setAnswers(prev => ({ ...prev, [q._id]: j }))}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all ${answers[q._id] === j ? 'bg-primary-500/20 border border-primary-500/50 text-primary-300' : 'bg-dark-700 border border-white/5 text-gray-300 hover:border-white/20 hover:text-white'}`}>
                <span className="font-medium mr-2">{String.fromCharCode(65 + j)}.</span>
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Submit */}
      <div className="flex items-center justify-between">
        <p className="text-gray-400 text-sm">{answered} of {total} questions answered</p>
        <button onClick={handleSubmit} disabled={submitting || answered === 0}
          className="btn-primary px-8 py-3 disabled:opacity-50">
          {submitting ? 'Submitting...' : 'Submit Quiz'}
        </button>
      </div>
    </div>
  )
}
