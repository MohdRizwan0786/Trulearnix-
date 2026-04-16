'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { quizAPI, courseAPI } from '@/lib/api'
import { Plus, Trash2, Loader2, FileQuestion, ChevronDown, ChevronUp, BookOpen, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const emptyQ = () => ({ question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '' })

export default function MentorQuizzes() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate]   = useState(false)
  const [quizForm, setQuizForm]       = useState({ title: '', courseId: '', questions: [emptyQ()] })
  const [expandedQuiz, setExpandedQuiz] = useState<string | null>(null)

  const { data: quizzes, isLoading } = useQuery({
    queryKey: ['mentor-quizzes'],
    queryFn: () => quizAPI.create({ _getAll: true }).catch(() => ({ data: { quizzes: [] } })).then(r => r.data?.quizzes || []),
  })
  const { data: courses } = useQuery({
    queryKey: ['mentor-courses'],
    queryFn: () => courseAPI.myMentorCourses().then(r => r.data.courses),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => quizAPI.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mentor-quizzes'] })
      setShowCreate(false)
      setQuizForm({ title: '', courseId: '', questions: [emptyQ()] })
      toast.success('Quiz created!')
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  })

  const addQ    = () => setQuizForm(f => ({ ...f, questions: [...f.questions, emptyQ()] }))
  const removeQ = (idx: number) => setQuizForm(f => ({ ...f, questions: f.questions.filter((_, i) => i !== idx) }))
  const setQ    = (idx: number, key: string, val: any) => setQuizForm(f => ({
    ...f, questions: f.questions.map((q, i) => i === idx ? { ...q, [key]: val } : q)
  }))
  const setOpt  = (qi: number, oi: number, val: string) => setQuizForm(f => ({
    ...f, questions: f.questions.map((q, i) => i === qi ? { ...q, options: q.options.map((o: string, j: number) => j === oi ? val : o) } : q)
  }))

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-1">Assessment</p>
          <h1 className="text-2xl md:text-3xl font-black text-white">Quizzes</h1>
          <p className="text-gray-500 text-sm mt-1">Create and manage course quizzes</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 hover:opacity-90 active:scale-[0.98] transition-all w-fit">
          <Plus className="w-4 h-4" /> Create Quiz
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="rounded-2xl bg-[#0f0f1a] border border-indigo-500/20 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.05] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center">
              <FileQuestion className="w-4 h-4 text-indigo-400" />
            </div>
            <h2 className="font-bold text-white">New Quiz</h2>
          </div>
          <div className="p-5 space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 font-semibold mb-1.5 uppercase tracking-wider">Quiz Title *</label>
                <input
                  value={quizForm.title}
                  onChange={e => setQuizForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                  placeholder="Module 1 Quiz" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 font-semibold mb-1.5 uppercase tracking-wider">Course</label>
                <select
                  value={quizForm.courseId}
                  onChange={e => setQuizForm(f => ({ ...f, courseId: e.target.value }))}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-colors">
                  <option value="">— Select Course —</option>
                  {courses?.map((c: any) => <option key={c._id} value={c._id}>{c.title}</option>)}
                </select>
              </div>
            </div>

            {/* Questions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-200">
                  Questions <span className="text-indigo-400">({quizForm.questions.length})</span>
                </h3>
                <button
                  onClick={addQ}
                  className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/15 px-3 py-1.5 rounded-lg font-semibold transition-all">
                  <Plus className="w-3.5 h-3.5" /> Add Question
                </button>
              </div>

              <div className="space-y-4">
                {quizForm.questions.map((q, qi) => (
                  <div key={qi} className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                          <span className="text-indigo-400 text-xs font-bold">{qi + 1}</span>
                        </div>
                        <span className="text-xs font-bold text-gray-400">Question {qi + 1}</span>
                      </div>
                      {quizForm.questions.length > 1 && (
                        <button onClick={() => removeQ(qi)}
                          className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <input
                      value={q.question}
                      onChange={e => setQ(qi, 'question', e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500/40 transition-colors"
                      placeholder="Enter your question..." />

                    <div className="space-y-2">
                      <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Options · Click circle to mark correct</p>
                      {q.options.map((opt: string, oi: number) => (
                        <div key={oi} className="flex items-center gap-2.5">
                          <button
                            onClick={() => setQ(qi, 'correctAnswer', oi)}
                            className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all ${
                              q.correctAnswer === oi
                                ? 'border-emerald-400 bg-emerald-400 shadow-md shadow-emerald-400/25'
                                : 'border-gray-600 hover:border-gray-400'
                            }`}>
                            {q.correctAnswer === oi && <div className="w-full h-full rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-white" />
                            </div>}
                          </button>
                          <input
                            value={opt}
                            onChange={e => setOpt(qi, oi, e.target.value)}
                            className={`flex-1 bg-white/[0.03] rounded-xl px-3.5 py-2.5 text-sm placeholder-gray-600 focus:outline-none transition-colors ${
                              q.correctAnswer === oi
                                ? 'border border-emerald-500/25 text-emerald-300 focus:border-emerald-500/40'
                                : 'border border-white/[0.07] text-white focus:border-indigo-500/40'
                            }`}
                            placeholder={`Option ${oi + 1}`} />
                        </div>
                      ))}
                    </div>

                    <input
                      value={q.explanation}
                      onChange={e => setQ(qi, 'explanation', e.target.value)}
                      className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-2.5 text-gray-400 text-xs placeholder-gray-700 focus:outline-none focus:border-indigo-500/30 transition-colors"
                      placeholder="Explanation (optional) — will be shown after answer" />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => createMutation.mutate(quizForm)}
                disabled={createMutation.isPending || !quizForm.title}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98] transition-all">
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileQuestion className="w-4 h-4" />}
                Create Quiz
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="px-5 py-3 rounded-xl bg-white/[0.04] text-gray-400 hover:text-white border border-white/[0.08] font-semibold text-sm transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quizzes List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
          <p className="text-gray-500 text-sm">Loading quizzes...</p>
        </div>
      ) : !quizzes?.length ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-3xl bg-[#0f0f1a] border border-white/[0.06]">
          <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center mb-5">
            <FileQuestion className="w-9 h-9 text-indigo-400/60" />
          </div>
          <p className="text-white font-bold text-lg">No quizzes yet</p>
          <p className="text-gray-500 text-sm mt-2 text-center">Create your first quiz to test students</p>
        </div>
      ) : (
        <div className="space-y-3">
          {quizzes.map((quiz: any) => (
            <div key={quiz._id}
              className="rounded-2xl bg-[#0f0f1a] border border-white/[0.06] hover:border-indigo-500/15 transition-all overflow-hidden">
              <button
                onClick={() => setExpandedQuiz(expandedQuiz === quiz._id ? null : quiz._id)}
                className="w-full flex items-center gap-4 p-4 text-left">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
                  <FileQuestion className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm">{quiz.title}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {quiz.course?.title && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />{quiz.course.title}
                      </span>
                    )}
                    <span className="text-xs text-indigo-400 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded-full">
                      {quiz.questions?.length || 0} Q
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 text-gray-500">
                  {expandedQuiz === quiz._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {expandedQuiz === quiz._id && quiz.questions?.length > 0 && (
                <div className="px-4 pb-4 border-t border-white/[0.04] pt-3 space-y-2.5">
                  {quiz.questions.map((q: any, qi: number) => (
                    <div key={qi} className="bg-white/[0.02] rounded-xl p-3.5 border border-white/[0.04]">
                      <p className="text-sm text-white font-semibold mb-2">{qi + 1}. {q.question}</p>
                      <div className="grid sm:grid-cols-2 gap-1.5">
                        {q.options?.map((opt: string, oi: number) => (
                          <div key={oi} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                            q.correctAnswer === oi
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'text-gray-500'
                          }`}>
                            {q.correctAnswer === oi && <CheckCircle className="w-3 h-3 flex-shrink-0" />}
                            {opt}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
