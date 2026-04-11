'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { adminAPI } from '@/lib/api'
import AdminLayout from '@/components/AdminLayout'
import toast from 'react-hot-toast'
import axios from 'axios'
import Cookies from 'js-cookie'
import {
  BookOpen, Image, DollarSign, Layers, Settings, Check,
  Plus, Trash2, ChevronDown, ChevronUp, Upload, X, Loader2,
  Users, Clock, Award, Star, Globe, BarChart2, Tag, FileText,
  Target, HelpCircle, Zap, ArrowLeft, ArrowRight, Eye, EyeOff
} from 'lucide-react'

const STEPS = [
  { id: 1, label: 'Basic Info', icon: BookOpen, desc: 'Title, description & media' },
  { id: 2, label: 'Pricing', icon: DollarSign, desc: 'Price, discount & category' },
  { id: 3, label: 'Curriculum', icon: Layers, desc: 'Modules & lessons' },
  { id: 4, label: 'Details', icon: FileText, desc: 'Requirements & outcomes' },
  { id: 5, label: 'Batches', icon: Users, desc: 'Batch size & scheduling' },
]

const CATEGORIES = ['Business', 'Marketing', 'Sales', 'Development', 'Design', 'Data Science', 'Finance', 'Personal Development', 'Communication', 'Leadership', 'Other']
const LANGUAGES = ['Hindi', 'English', 'Hinglish', 'Tamil', 'Telugu', 'Marathi', 'Kannada', 'Bengali', 'Gujarati', 'Other']

type LessonType = 'video' | 'document' | 'quiz' | 'live'

interface Lesson {
  title: string; type: LessonType; videoUrl: string; duration: number; isPreview: boolean; description: string;
}
interface Module {
  title: string; description: string; lessons: Lesson[];
}

const emptyLesson = (): Lesson => ({ title: '', type: 'video', videoUrl: '', duration: 0, isPreview: false, description: '' })
const emptyModule = (): Module => ({ title: '', description: '', lessons: [emptyLesson()] })

function UploadButton({ onUrl, accept, label }: { onUrl: (url: string) => void; accept: string; label: string }) {
  const ref = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      const isVideo = file.type.startsWith('video/')
      fd.append(isVideo ? 'video' : 'image', file)
      const endpoint = `${process.env.NEXT_PUBLIC_API_URL || 'https://api.peptly.in/api'}/upload/${isVideo ? 'video' : 'image'}`
      const token = Cookies.get('adminToken') || localStorage.getItem('adminToken')
      const res = await axios.post(endpoint, fd, { headers: { Authorization: `Bearer ${token}` } })
      onUrl(res.data.url)
      toast.success('Uploaded!')
    } catch { toast.error('Upload failed') } finally { setUploading(false) }
    e.target.value = ''
  }

  return (
    <>
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={upload} />
      <button type="button" onClick={() => ref.current?.click()} disabled={uploading}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white transition-all text-sm disabled:opacity-50">
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        {uploading ? 'Uploading...' : label}
      </button>
    </>
  )
}

function TagInput({ label, values, onChange, placeholder }: { label: string; values: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [inp, setInp] = useState('')
  const add = () => {
    const v = inp.trim()
    if (v && !values.includes(v)) { onChange([...values, v]); setInp('') }
  }
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {values.map((v, i) => (
          <span key={i} className="flex items-center gap-1 bg-violet-500/20 text-violet-300 px-3 py-1 rounded-xl text-sm">
            {v}
            <button type="button" onClick={() => onChange(values.filter((_, j) => j !== i))} className="hover:text-red-400">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={inp} onChange={e => setInp(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={placeholder || 'Type and press Enter'}
          className="input flex-1 text-sm" />
        <button type="button" onClick={add} className="btn-secondary text-sm px-4">Add</button>
      </div>
    </div>
  )
}

function FaqInput({ faqs, onChange }: { faqs: { question: string; answer: string }[]; onChange: (f: any[]) => void }) {
  const add = () => onChange([...faqs, { question: '', answer: '' }])
  const remove = (i: number) => onChange(faqs.filter((_, j) => j !== i))
  const set = (i: number, field: 'question' | 'answer', val: string) => {
    const next = [...faqs]; next[i] = { ...next[i], [field]: val }; onChange(next)
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="label mb-0">FAQs</label>
        <button type="button" onClick={add} className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300">
          <Plus className="w-3.5 h-3.5" /> Add FAQ
        </button>
      </div>
      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <div key={i} className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <input value={faq.question} onChange={e => set(i, 'question', e.target.value)}
                placeholder="Question" className="input flex-1 text-sm" />
              <button type="button" onClick={() => remove(i)} className="p-2 text-gray-500 hover:text-red-400">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <textarea value={faq.answer} onChange={e => set(i, 'answer', e.target.value)}
              placeholder="Answer" rows={2} className="input w-full text-sm resize-none" />
          </div>
        ))}
        {faqs.length === 0 && (
          <p className="text-gray-600 text-sm text-center py-4">No FAQs added yet</p>
        )}
      </div>
    </div>
  )
}

function CurriculumBuilder({ modules, onChange }: { modules: Module[]; onChange: (m: Module[]) => void }) {
  const [openMod, setOpenMod] = useState<number>(0)

  const addModule = () => {
    onChange([...modules, emptyModule()])
    setOpenMod(modules.length)
  }
  const removeModule = (i: number) => onChange(modules.filter((_, j) => j !== i))
  const updateModule = (i: number, field: keyof Module, val: any) => {
    const next = [...modules]; next[i] = { ...next[i], [field]: val }; onChange(next)
  }
  const addLesson = (mi: number) => {
    const next = [...modules]
    next[mi] = { ...next[mi], lessons: [...next[mi].lessons, emptyLesson()] }
    onChange(next)
  }
  const removeLesson = (mi: number, li: number) => {
    const next = [...modules]
    next[mi] = { ...next[mi], lessons: next[mi].lessons.filter((_, j) => j !== li) }
    onChange(next)
  }
  const updateLesson = (mi: number, li: number, field: keyof Lesson, val: any) => {
    const next = [...modules]
    next[mi].lessons[li] = { ...next[mi].lessons[li], [field]: val }
    onChange(next)
  }

  return (
    <div className="space-y-3">
      {modules.map((mod, mi) => (
        <div key={mi} className="rounded-2xl border border-white/10 overflow-hidden bg-slate-800/30">
          {/* Module header */}
          <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors"
            onClick={() => setOpenMod(openMod === mi ? -1 : mi)}>
            <div className="w-7 h-7 rounded-lg bg-violet-500/30 text-violet-300 flex items-center justify-center text-xs font-black flex-shrink-0">
              {mi + 1}
            </div>
            <input
              value={mod.title}
              onChange={e => { e.stopPropagation(); updateModule(mi, 'title', e.target.value) }}
              onClick={e => e.stopPropagation()}
              placeholder={`Module ${mi + 1} title`}
              className="bg-transparent text-white font-semibold text-sm flex-1 outline-none placeholder-gray-600"
            />
            <span className="text-gray-500 text-xs">{mod.lessons.length} lessons</span>
            <button type="button" onClick={e => { e.stopPropagation(); removeModule(mi) }}
              className="p-1 text-gray-600 hover:text-red-400 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
            {openMod === mi ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
          </div>

          {/* Lessons */}
          {openMod === mi && (
            <div className="border-t border-white/5 px-4 pb-4 pt-3 space-y-2">
              {mod.lessons.map((lesson, li) => (
                <div key={li} className="bg-white/5 rounded-xl p-3 border border-white/5 space-y-2">
                  <div className="flex items-center gap-2">
                    <input value={lesson.title} onChange={e => updateLesson(mi, li, 'title', e.target.value)}
                      placeholder={`Lesson ${li + 1} title`} className="input flex-1 text-sm" />
                    <select value={lesson.type} onChange={e => updateLesson(mi, li, 'type', e.target.value as LessonType)}
                      className="input w-28 text-xs">
                      <option value="video">Video</option>
                      <option value="document">Document</option>
                      <option value="quiz">Quiz</option>
                      <option value="live">Live</option>
                    </select>
                    <button type="button" onClick={() => removeLesson(mi, li)}
                      className="p-1.5 text-gray-600 hover:text-red-400 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <input value={lesson.videoUrl} onChange={e => updateLesson(mi, li, 'videoUrl', e.target.value)}
                      placeholder="Video/file URL" className="input flex-1 text-xs min-w-[150px]" />
                    <input type="number" value={lesson.duration || ''} onChange={e => updateLesson(mi, li, 'duration', Number(e.target.value))}
                      placeholder="Mins" className="input w-20 text-xs" min={0} />
                    <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer select-none">
                      <input type="checkbox" checked={lesson.isPreview} onChange={e => updateLesson(mi, li, 'isPreview', e.target.checked)}
                        className="rounded" />
                      Free preview
                    </label>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => addLesson(mi)}
                className="flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300 mt-2">
                <Plus className="w-4 h-4" /> Add Lesson
              </button>
            </div>
          )}
        </div>
      ))}
      <button type="button" onClick={addModule}
        className="w-full border-2 border-dashed border-white/10 rounded-2xl py-4 text-gray-400 hover:border-violet-500/50 hover:text-violet-400 transition-all text-sm flex items-center justify-center gap-2">
        <Plus className="w-4 h-4" /> Add Module
      </button>
    </div>
  )
}

export default function CreateCoursePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  // Step 1 — Basic Info
  const [title, setTitle] = useState('')
  const [shortDesc, setShortDesc] = useState('')
  const [description, setDescription] = useState('')
  const [thumbnail, setThumbnail] = useState('')
  const [previewVideo, setPreviewVideo] = useState('')

  // Step 2 — Pricing & Meta
  const [category, setCategory] = useState('')
  const [level, setLevel] = useState('beginner')
  const [language, setLanguage] = useState('Hindi')
  const [duration, setDuration] = useState('')
  const [price, setPrice] = useState('')
  const [discountPrice, setDiscountPrice] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [status, setStatus] = useState('published')
  const [certificate, setCertificate] = useState(true)
  const [passingScore, setPassingScore] = useState(70)

  // Step 3 — Curriculum
  const [modules, setModules] = useState<Module[]>([emptyModule()])

  // Step 4 — Details
  const [requirements, setRequirements] = useState<string[]>([])
  const [outcomes, setOutcomes] = useState<string[]>([])
  const [highlights, setHighlights] = useState<string[]>([])
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([])

  // Step 5 — Batch Settings
  const [batchEnabled, setBatchEnabled] = useState(false)
  const [minStrength, setMinStrength] = useState(5)
  const [maxStrength, setMaxStrength] = useState(50)
  const [closingDays, setClosingDays] = useState(30)
  const [durationDays, setDurationDays] = useState(0)

  const { data: mentorData } = useQuery({
    queryKey: ['mentors-list'],
    queryFn: () => adminAPI.mentors({ limit: 100, status: 'approved' }).then(r => r.data)
  })
  const [mentorId, setMentorId] = useState('')
  const mentors = mentorData?.mentors || mentorData?.users || []

  const validate = () => {
    if (step === 1) {
      if (!title.trim()) { toast.error('Course title is required'); return false }
      if (!shortDesc.trim()) { toast.error('Short description is required'); return false }
      if (!description.trim()) { toast.error('Full description is required'); return false }
      if (!thumbnail) { toast.error('Thumbnail is required'); return false }
    }
    if (step === 2) {
      if (!category) { toast.error('Category is required'); return false }
      if (price === '') { toast.error('Price is required'); return false }
      if (!mentorId) { toast.error('Please select a mentor/instructor'); return false }
    }
    return true
  }

  const next = () => { if (validate()) setStep(s => Math.min(5, s + 1)) }
  const prev = () => setStep(s => Math.max(1, s - 1))

  const submit = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const processedModules = modules.map((mod, mi) => ({
        title: mod.title || `Module ${mi + 1}`,
        description: mod.description,
        order: mi + 1,
        lessons: mod.lessons.map((l, li) => ({
          title: l.title || `Lesson ${li + 1}`,
          type: l.type,
          videoUrl: l.videoUrl,
          duration: l.duration || 0,
          order: li + 1,
          isPreview: l.isPreview,
          description: l.description,
        }))
      }))

      await adminAPI.createCourse({
        title: title.trim(),
        shortDescription: shortDesc.trim(),
        description: description.trim(),
        thumbnail, previewVideo,
        mentor: mentorId,
        category, level, language, duration,
        price: Number(price),
        discountPrice: discountPrice ? Number(discountPrice) : undefined,
        tags, status, certificate, passingScore,
        modules: processedModules,
        requirements, outcomes, highlights, faqs,
        batchSettings: {
          enabled: batchEnabled,
          minStrength, maxStrength, closingDays, durationDays,
        }
      })
      toast.success('Course created successfully!')
      router.push('/courses')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to create course')
    } finally { setSaving(false) }
  }

  const totalLessons = modules.reduce((s, m) => s + m.lessons.length, 0)

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Create New Course</h1>
            <p className="text-gray-400 text-sm mt-0.5">Fill in the details to publish a new course</p>
          </div>
        </div>

        {/* Step Progress */}
        <div className="card p-4">
          <div className="flex items-center gap-0">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center flex-1">
                <button type="button" onClick={() => step > s.id && setStep(s.id)}
                  className={`flex flex-col items-center gap-1 flex-1 transition-all ${step > s.id ? 'cursor-pointer' : 'cursor-default'}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all font-bold text-sm
                    ${step === s.id ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30 scale-110'
                      : step > s.id ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-white/5 text-gray-600 border border-white/10'}`}>
                    {step > s.id ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-[10px] font-semibold hidden sm:block ${step === s.id ? 'text-violet-400' : step > s.id ? 'text-emerald-400' : 'text-gray-600'}`}>
                    {s.label}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 w-full mx-1 rounded-full transition-all ${step > s.id ? 'bg-emerald-500/40' : 'bg-white/5'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="card space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-white/10">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
              {(() => { const S = STEPS[step - 1]; return <S.icon className="w-5 h-5 text-violet-400" /> })()}
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">{STEPS[step - 1].label}</h2>
              <p className="text-gray-400 text-sm">{STEPS[step - 1].desc}</p>
            </div>
          </div>

          {/* ── STEP 1: Basic Info ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="label">Course Title *</label>
                <input value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Advanced Sales Psychology Masterclass"
                  className="input w-full text-base font-medium" maxLength={120} />
                <p className="text-gray-600 text-xs mt-1">{title.length}/120 characters</p>
              </div>

              <div>
                <label className="label">Short Description * <span className="text-gray-500 font-normal">(shown on course card)</span></label>
                <input value={shortDesc} onChange={e => setShortDesc(e.target.value)}
                  placeholder="One-liner that hooks the learner" className="input w-full" maxLength={200} />
                <p className="text-gray-600 text-xs mt-1">{shortDesc.length}/200 characters</p>
              </div>

              <div>
                <label className="label">Full Description *</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Detailed description — what will students learn, who is it for, why this course..."
                  rows={5} className="input w-full resize-none leading-relaxed" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="label">Course Thumbnail *</label>
                  {thumbnail ? (
                    <div className="relative rounded-2xl overflow-hidden ring-1 ring-white/10">
                      <img src={thumbnail} alt="thumbnail" className="w-full h-40 object-cover" />
                      <button type="button" onClick={() => setThumbnail('')}
                        className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-white/10 rounded-2xl h-40 flex flex-col items-center justify-center gap-3 bg-white/[0.02] hover:border-violet-500/40 transition-colors">
                      <Image className="w-8 h-8 text-gray-700" />
                      <p className="text-gray-500 text-sm">Upload course thumbnail</p>
                      <UploadButton onUrl={setThumbnail} accept="image/*" label="Choose Image" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="label">Preview Video <span className="text-gray-500 font-normal">(optional)</span></label>
                  {previewVideo ? (
                    <div className="relative rounded-2xl overflow-hidden bg-black ring-1 ring-white/10">
                      <video src={previewVideo} className="w-full h-40 object-cover" controls />
                      <button type="button" onClick={() => setPreviewVideo('')}
                        className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-white/10 rounded-2xl h-40 flex flex-col items-center justify-center gap-3 bg-white/[0.02] hover:border-violet-500/40 transition-colors">
                      <Eye className="w-8 h-8 text-gray-700" />
                      <p className="text-gray-500 text-sm">Upload preview clip</p>
                      <UploadButton onUrl={setPreviewVideo} accept="video/*" label="Choose Video" />
                    </div>
                  )}
                  <div className="mt-2">
                    <input value={previewVideo} onChange={e => setPreviewVideo(e.target.value)}
                      placeholder="Or paste video URL" className="input w-full text-xs" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Pricing & Meta ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="label">Category *</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="input w-full">
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Level</label>
                  <select value={level} onChange={e => setLevel(e.target.value)} className="input w-full">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="label">Language</label>
                  <select value={language} onChange={e => setLanguage(e.target.value)} className="input w-full">
                    {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Course Duration</label>
                  <input value={duration} onChange={e => setDuration(e.target.value)}
                    placeholder="e.g. 8 weeks, 3 months, 40 hours" className="input w-full" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="label">Original Price (₹) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">₹</span>
                    <input type="number" value={price} onChange={e => setPrice(e.target.value)}
                      placeholder="0 for free" className="input w-full pl-8" min={0} />
                  </div>
                </div>
                <div>
                  <label className="label">Discounted Price (₹) <span className="text-gray-500 font-normal">optional</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">₹</span>
                    <input type="number" value={discountPrice} onChange={e => setDiscountPrice(e.target.value)}
                      placeholder="Leave blank if no discount" className="input w-full pl-8" min={0} />
                  </div>
                  {discountPrice && price && Number(discountPrice) < Number(price) && (
                    <p className="text-emerald-400 text-xs mt-1 font-semibold">
                      {Math.round((1 - Number(discountPrice) / Number(price)) * 100)}% off
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="label">Instructor / Mentor *</label>
                <select value={mentorId} onChange={e => setMentorId(e.target.value)} className="input w-full">
                  <option value="">Select instructor</option>
                  {mentors.map((m: any) => (
                    <option key={m._id} value={m._id}>{m.name} — {m.email}</option>
                  ))}
                </select>
              </div>

              <TagInput label="Tags" values={tags} onChange={setTags} placeholder="e.g. Sales, Psychology, NLP" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="label">Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value)} className="input w-full">
                    <option value="published">Published (Live)</option>
                    <option value="draft">Draft (Hidden)</option>
                  </select>
                </div>
                <div>
                  <label className="label">Certificate</label>
                  <div className="flex items-center gap-3 mt-2">
                    {[{ v: true, l: 'Yes' }, { v: false, l: 'No' }].map(opt => (
                      <label key={String(opt.v)} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" checked={certificate === opt.v} onChange={() => setCertificate(opt.v)}
                          className="accent-violet-500" />
                        <span className="text-gray-300 text-sm">{opt.l}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {certificate && (
                  <div>
                    <label className="label">Passing Score (%)</label>
                    <input type="number" value={passingScore} onChange={e => setPassingScore(Number(e.target.value))}
                      className="input w-full" min={0} max={100} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 3: Curriculum ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold">{modules.length} Modules · {totalLessons} Lessons</p>
                  <p className="text-gray-500 text-xs mt-0.5">Click a module to expand and edit its lessons</p>
                </div>
              </div>
              <CurriculumBuilder modules={modules} onChange={setModules} />
            </div>
          )}

          {/* ── STEP 4: Details ── */}
          {step === 4 && (
            <div className="space-y-6">
              <TagInput label="What students will learn (Outcomes) *"
                values={outcomes} onChange={setOutcomes}
                placeholder="e.g. Close 3x more deals" />

              <TagInput label="Requirements / Prerequisites"
                values={requirements} onChange={setRequirements}
                placeholder="e.g. Basic sales experience" />

              <TagInput label="Course Highlights (shown on landing page)"
                values={highlights} onChange={setHighlights}
                placeholder="e.g. Live Q&A sessions every week" />

              <FaqInput faqs={faqs} onChange={setFaqs} />
            </div>
          )}

          {/* ── STEP 5: Batch Settings ── */}
          {step === 5 && (
            <div className="space-y-6">
              {/* Toggle */}
              <div className="flex items-start justify-between gap-4 p-5 rounded-2xl bg-violet-500/10 border border-violet-500/20">
                <div>
                  <p className="text-white font-bold">Enable Batch System</p>
                  <p className="text-gray-400 text-sm mt-1 max-w-md">
                    Batches group students together. Each batch auto-closes after a set duration or when full — then a new batch starts automatically.
                  </p>
                </div>
                <button type="button" onClick={() => setBatchEnabled(!batchEnabled)}
                  className={`relative w-12 h-6 rounded-full transition-all flex-shrink-0 mt-1 ${batchEnabled ? 'bg-violet-600' : 'bg-white/10'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${batchEnabled ? 'translate-x-6' : ''}`} />
                </button>
              </div>

              {batchEnabled && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <label className="label flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-400" /> Min Batch Strength
                      </label>
                      <input type="number" value={minStrength} onChange={e => setMinStrength(Number(e.target.value))}
                        className="input w-full" min={1} max={maxStrength} />
                      <p className="text-gray-600 text-xs mt-1">Minimum students to start a batch</p>
                    </div>
                    <div>
                      <label className="label flex items-center gap-2">
                        <Users className="w-4 h-4 text-violet-400" /> Max Batch Strength
                      </label>
                      <input type="number" value={maxStrength} onChange={e => setMaxStrength(Number(e.target.value))}
                        className="input w-full" min={minStrength} />
                      <p className="text-gray-600 text-xs mt-1">Batch closes when this limit is hit</p>
                    </div>
                    <div>
                      <label className="label flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400" /> Date Auto-Close (Days)
                      </label>
                      <input type="number" value={closingDays} onChange={e => setClosingDays(Number(e.target.value))}
                        className="input w-full" min={1} />
                      <p className="text-gray-600 text-xs mt-1">Batch closes after this many calendar days from start</p>
                    </div>
                  </div>

                  {/* Course duration */}
                  <div>
                    <label className="label flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-violet-400" /> Course Duration (Days)
                    </label>
                    <input type="number" value={durationDays} onChange={e => setDurationDays(Number(e.target.value))}
                      className="input w-full" min={0} placeholder="0 = no content-based limit" />
                    <p className="text-gray-600 text-xs mt-1">When admin marks this many days complete, batch auto-closes and next batch is created (0 = disabled)</p>
                  </div>

                  {/* Visual summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { label: 'Batch Start', value: 'Manual — admin clicks Start', icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                      { label: 'Closes when', value: durationDays > 0 ? `${durationDays} days done OR ${closingDays} date days` : `${maxStrength} students OR ${closingDays} days`, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                      { label: 'New batch', value: 'Auto-created (Pending)', icon: Plus, color: 'text-violet-400', bg: 'bg-violet-500/10' },
                    ].map(item => (
                      <div key={item.label} className={`flex items-center gap-3 p-4 rounded-2xl ${item.bg} border border-white/5`}>
                        <item.icon className={`w-5 h-5 ${item.color} flex-shrink-0`} />
                        <div>
                          <p className="text-gray-400 text-xs">{item.label}</p>
                          <p className={`${item.color} font-semibold text-sm`}>{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-sm text-blue-300">
                    <strong>How it works:</strong> New batches start as <strong>Pending</strong>. Admin clicks <strong>Start Batch</strong> to activate. Each day, admin marks progress with <strong>Mark Day</strong>. When all {durationDays > 0 ? durationDays : '—'} days are done, batch auto-closes and a new Pending batch is created.
                  </div>
                </div>
              )}

              {!batchEnabled && (
                <div className="text-center py-8 text-gray-600">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>Batch system is disabled. All enrollments will be open without batch grouping.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button type="button" onClick={prev} disabled={step === 1}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-all disabled:opacity-30">
            <ArrowLeft className="w-4 h-4" /> Previous
          </button>

          <div className="flex items-center gap-2">
            {STEPS.map((s) => (
              <div key={s.id} className={`w-2 h-2 rounded-full transition-all ${step === s.id ? 'w-6 bg-violet-500' : step > s.id ? 'bg-emerald-500' : 'bg-white/10'}`} />
            ))}
          </div>

          {step < 5 ? (
            <button type="button" onClick={next}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-all shadow-lg shadow-violet-500/20">
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button type="button" onClick={submit} disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? 'Creating...' : 'Create Course'}
            </button>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
