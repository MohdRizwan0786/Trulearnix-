'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { adminAPI } from '@/lib/api'
import AdminLayout from '@/components/AdminLayout'
import toast from 'react-hot-toast'
import axios from 'axios'
import Cookies from 'js-cookie'
import {
  ArrowLeft, Check, Loader2, Upload, X, Plus, Trash2,
  ChevronDown, ChevronUp, Image, Users, BookOpen,
  DollarSign, FileText, Layers, Award, Youtube, PlaySquare, ExternalLink
} from 'lucide-react'

const CATEGORIES = ['Business', 'Marketing', 'Sales', 'Development', 'Design', 'Data Science', 'Finance', 'Personal Development', 'Communication', 'Leadership', 'Other']
const LANGUAGES = ['Hindi', 'English', 'Hinglish', 'Tamil', 'Telugu', 'Marathi', 'Kannada', 'Bengali', 'Gujarati', 'Other']

type LessonType = 'video' | 'document' | 'quiz' | 'live'
interface Lesson { title: string; type: LessonType; videoUrl: string; duration: number; isPreview: boolean; description: string }
interface Module { title: string; description: string; lessons: Lesson[] }

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
      const endpoint = `${process.env.NEXT_PUBLIC_API_URL || 'https://api.trulearnix.com/api'}/upload/${isVideo ? 'video' : 'image'}`
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
  const add = () => { const v = inp.trim(); if (v && !values.includes(v)) { onChange([...values, v]); setInp('') } }
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {values.map((v, i) => (
          <span key={i} className="flex items-center gap-1 bg-violet-500/20 text-violet-300 px-3 py-1 rounded-xl text-sm">
            {v}
            <button type="button" onClick={() => onChange(values.filter((_, j) => j !== i))} className="hover:text-red-400"><X className="w-3 h-3" /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={inp} onChange={e => setInp(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={placeholder || 'Type and press Enter'} className="input flex-1 text-sm" />
        <button type="button" onClick={add} className="btn-secondary text-sm px-4">Add</button>
      </div>
    </div>
  )
}

function FaqInput({ faqs, onChange }: { faqs: { question: string; answer: string }[]; onChange: (f: any[]) => void }) {
  const add = () => onChange([...faqs, { question: '', answer: '' }])
  const remove = (i: number) => onChange(faqs.filter((_, j) => j !== i))
  const setField = (i: number, field: 'question' | 'answer', val: string) => {
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
              <input value={faq.question} onChange={e => setField(i, 'question', e.target.value)}
                placeholder="Question" className="input flex-1 text-sm" />
              <button type="button" onClick={() => remove(i)} className="p-2 text-gray-500 hover:text-red-400">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <textarea value={faq.answer} onChange={e => setField(i, 'answer', e.target.value)}
              placeholder="Answer" rows={2} className="input w-full text-sm resize-none" />
          </div>
        ))}
        {faqs.length === 0 && <p className="text-gray-600 text-sm text-center py-4">No FAQs added yet</p>}
      </div>
    </div>
  )
}

function CurriculumBuilder({ modules, onChange }: { modules: Module[]; onChange: (m: Module[]) => void }) {
  const [openMod, setOpenMod] = useState<number>(0)

  const addModule = () => { onChange([...modules, emptyModule()]); setOpenMod(modules.length) }
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

export default function EditCoursePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'pricing' | 'curriculum' | 'details' | 'batch' | 'recordings'>('basic')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-course', id],
    queryFn: () => adminAPI.getCourse(id).then(r => r.data)
  })
  const { data: mentorData } = useQuery({
    queryKey: ['mentors-list'],
    queryFn: () => adminAPI.mentors({ limit: 100, status: 'approved' }).then(r => r.data)
  })
  const mentors = mentorData?.mentors || mentorData?.users || []

  const [form, setForm] = useState<any>(null)
  const [modules, setModules] = useState<Module[]>([emptyModule()])

  useEffect(() => {
    if (data?.course) {
      const c = data.course
      setForm({
        title: c.title || '',
        shortDescription: c.shortDescription || '',
        description: c.description || '',
        thumbnail: c.thumbnail || '',
        previewVideo: c.previewVideo || '',
        mentor: c.mentor?._id || c.mentor || '',
        category: c.category || '',
        level: c.level || 'beginner',
        language: c.language || 'Hindi',
        duration: c.duration || '',
        price: c.price ?? '',
        discountPrice: c.discountPrice ?? '',
        salesRefDiscountPercent: c.salesRefDiscountPercent ?? 0,
        tags: c.tags || [],
        status: c.status || 'draft',
        certificate: c.certificate !== false,
        passingScore: c.passingScore || 70,
        requirements: c.requirements || [],
        outcomes: c.outcomes || [],
        highlights: c.highlights || [],
        faqs: c.faqs || [],
        batchEnabled: c.batchSettings?.enabled || false,
        minStrength: c.batchSettings?.minStrength || 5,
        maxStrength: c.batchSettings?.maxStrength || 50,
        closingDays: c.batchSettings?.closingDays || 30,
        durationDays: c.batchSettings?.durationDays || 0,
        youtubePlaylistUrl: c.youtubePlaylistUrl || '',
      })
      // Load curriculum modules
      if (c.modules && c.modules.length > 0) {
        setModules(c.modules.map((m: any) => ({
          title: m.title || '',
          description: m.description || '',
          lessons: (m.lessons || []).map((l: any) => ({
            title: l.title || '',
            type: l.type || 'video',
            videoUrl: l.videoUrl || '',
            duration: l.duration || 0,
            isPreview: l.isPreview || false,
            description: l.description || '',
          }))
        })))
      }
    }
  }, [data])

  const set = (key: string, val: any) => setForm((f: any) => ({ ...f, [key]: val }))

  const save = async () => {
    if (!form.title?.trim()) { toast.error('Title is required'); return }
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

      await adminAPI.updateCourse(id, {
        title: form.title, shortDescription: form.shortDescription, description: form.description,
        thumbnail: form.thumbnail, previewVideo: form.previewVideo,
        mentor: form.mentor, category: form.category, level: form.level, language: form.language,
        duration: form.duration, price: Number(form.price),
        discountPrice: form.discountPrice ? Number(form.discountPrice) : undefined,
        salesRefDiscountPercent: Number(form.salesRefDiscountPercent) || 0,
        tags: form.tags, status: form.status, certificate: form.certificate, passingScore: form.passingScore,
        requirements: form.requirements, outcomes: form.outcomes, highlights: form.highlights, faqs: form.faqs,
        modules: processedModules,
        youtubePlaylistUrl: form.youtubePlaylistUrl || undefined,
        batchSettings: {
          enabled: form.batchEnabled,
          minStrength: form.minStrength,
          maxStrength: form.maxStrength,
          closingDays: form.closingDays,
          durationDays: form.durationDays,
        }
      })
      toast.success('Course updated!')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to save')
    } finally { setSaving(false) }
  }

  if (isLoading || !form) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
        </div>
      </AdminLayout>
    )
  }

  const tabs = [
    { id: 'basic', label: 'Basic', icon: BookOpen },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'curriculum', label: 'Curriculum', icon: Layers },
    { id: 'details', label: 'Details', icon: FileText },
    { id: 'batch', label: 'Batches', icon: Users },
    { id: 'recordings', label: 'Recordings', icon: Youtube },
  ] as const

  function getPlaylistId(url: string) {
    if (!url) return null
    const m = url.match(/[?&]list=([^&]+)/)
    return m ? m[1] : null
  }

  const totalLessons = modules.reduce((s, m) => s + m.lessons.length, 0)

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Edit Course</h1>
              <p className="text-gray-500 text-sm truncate max-w-xs">{data?.course?.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {form.batchEnabled && (
              <button onClick={() => router.push(`/courses/${id}/batches`)}
                className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-violet-500/20 text-violet-400 hover:bg-violet-500 hover:text-white transition-colors border border-violet-500/30">
                <Layers className="w-4 h-4" /> Manage Batches
              </button>
            )}
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50 text-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-800/50 border border-white/10 rounded-2xl p-1 w-fit flex-wrap">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === t.id ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'}`}>
              <t.icon className="w-4 h-4" /> {t.label}
              {t.id === 'curriculum' && <span className="text-xs opacity-60">({modules.length}M · {totalLessons}L)</span>}
            </button>
          ))}
        </div>

        <div className="card space-y-5">
          {/* Basic */}
          {activeTab === 'basic' && (
            <div className="space-y-5">
              <div>
                <label className="label">Course Title</label>
                <input value={form.title} onChange={e => set('title', e.target.value)} className="input w-full font-medium" />
              </div>
              <div>
                <label className="label">Short Description</label>
                <input value={form.shortDescription} onChange={e => set('shortDescription', e.target.value)} className="input w-full" maxLength={200} />
              </div>
              <div>
                <label className="label">Full Description</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={5} className="input w-full resize-none" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="label">Thumbnail</label>
                  {form.thumbnail ? (
                    <div className="relative rounded-2xl overflow-hidden ring-1 ring-white/10">
                      <img src={form.thumbnail} alt="" className="w-full h-36 object-cover" />
                      <button type="button" onClick={() => set('thumbnail', '')}
                        className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-white/10 rounded-2xl h-36 flex flex-col items-center justify-center gap-3 bg-white/[0.02]">
                      <Image className="w-6 h-6 text-gray-700" />
                      <UploadButton onUrl={url => set('thumbnail', url)} accept="image/*" label="Upload Thumbnail" />
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="label">Status</label>
                    <select value={form.status} onChange={e => set('status', e.target.value)} className="input w-full">
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Instructor</label>
                    <select value={form.mentor} onChange={e => set('mentor', e.target.value)} className="input w-full">
                      <option value="">Select instructor</option>
                      {mentors.map((m: any) => <option key={m._id} value={m._id}>{m.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <label className="label">Preview Video URL</label>
                <div className="flex gap-2">
                  <input value={form.previewVideo} onChange={e => set('previewVideo', e.target.value)}
                    placeholder="https://..." className="input flex-1 text-sm" />
                  <UploadButton onUrl={url => set('previewVideo', url)} accept="video/*" label="Upload" />
                </div>
                {form.previewVideo && (
                  <button type="button" onClick={() => set('previewVideo', '')}
                    className="mt-1 text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                    <X className="w-3 h-3" /> Remove preview video
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Pricing */}
          {activeTab === 'pricing' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Category</label>
                  <select value={form.category} onChange={e => set('category', e.target.value)} className="input w-full">
                    <option value="">Select</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Level</label>
                  <select value={form.level} onChange={e => set('level', e.target.value)} className="input w-full">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="label">Language</label>
                  <select value={form.language} onChange={e => set('language', e.target.value)} className="input w-full">
                    {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Duration</label>
                  <input value={form.duration} onChange={e => set('duration', e.target.value)}
                    placeholder="e.g. 8 weeks" className="input w-full" />
                </div>
                <div>
                  <label className="label">Price (₹)</label>
                  <input type="number" value={form.price} onChange={e => set('price', e.target.value)} className="input w-full" min={0} />
                </div>
                <div>
                  <label className="label">Discounted Price (₹)</label>
                  <input type="number" value={form.discountPrice} onChange={e => set('discountPrice', e.target.value)} className="input w-full" min={0} />
                </div>
              </div>
              <div>
                <label className="label">Sales Referral Discount %</label>
                <p className="text-xs text-gray-500 mb-1">Discount applied when sales team shares course referral link</p>
                <input type="number" value={form.salesRefDiscountPercent} onChange={e => set('salesRefDiscountPercent', e.target.value)}
                  className="input w-full" min={0} max={100} placeholder="e.g. 50 for 50% off" />
              </div>
              <TagInput label="Tags" values={form.tags} onChange={v => set('tags', v)} />
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-yellow-400" />
                  <div>
                    <p className="text-white text-sm font-semibold">Certificate of Completion</p>
                    <p className="text-gray-500 text-xs">Issue certificates to students who complete the course</p>
                  </div>
                </div>
                <button type="button" onClick={() => set('certificate', !form.certificate)}
                  className={`relative w-12 h-6 rounded-full transition-all flex-shrink-0 ${form.certificate ? 'bg-violet-600' : 'bg-white/10'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.certificate ? 'translate-x-6' : ''}`} />
                </button>
              </div>
              {form.certificate && (
                <div>
                  <label className="label">Passing Score (%)</label>
                  <input type="number" value={form.passingScore} onChange={e => set('passingScore', Number(e.target.value))}
                    className="input w-32" min={1} max={100} />
                </div>
              )}
            </div>
          )}

          {/* Curriculum */}
          {activeTab === 'curriculum' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold">Course Curriculum</p>
                  <p className="text-gray-500 text-sm">{modules.length} modules · {totalLessons} lessons</p>
                </div>
              </div>
              <CurriculumBuilder modules={modules} onChange={setModules} />
            </div>
          )}

          {/* Details */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              <TagInput label="What students will learn (Outcomes)" values={form.outcomes} onChange={v => set('outcomes', v)} placeholder="e.g. Close 3x more deals" />
              <TagInput label="Requirements" values={form.requirements} onChange={v => set('requirements', v)} placeholder="e.g. Basic sales experience" />
              <TagInput label="Highlights" values={form.highlights} onChange={v => set('highlights', v)} placeholder="e.g. Live Q&A sessions" />
              <FaqInput faqs={form.faqs} onChange={v => set('faqs', v)} />
            </div>
          )}

          {/* Batch */}
          {activeTab === 'batch' && (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4 p-5 rounded-2xl bg-violet-500/10 border border-violet-500/20">
                <div>
                  <p className="text-white font-bold">Batch System</p>
                  <p className="text-gray-400 text-sm mt-1">Group students into batches with auto-closing and auto-creation.</p>
                </div>
                <button type="button" onClick={() => set('batchEnabled', !form.batchEnabled)}
                  className={`relative w-12 h-6 rounded-full transition-all flex-shrink-0 mt-1 ${form.batchEnabled ? 'bg-violet-600' : 'bg-white/10'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.batchEnabled ? 'translate-x-6' : ''}`} />
                </button>
              </div>

              {form.batchEnabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label text-xs">Min Students</label>
                    <input type="number" value={form.minStrength} onChange={e => set('minStrength', Number(e.target.value))} className="input w-full" min={1} />
                  </div>
                  <div>
                    <label className="label text-xs">Max Students</label>
                    <input type="number" value={form.maxStrength} onChange={e => set('maxStrength', Number(e.target.value))} className="input w-full" min={1} />
                  </div>
                  <div>
                    <label className="label text-xs">Closing Days</label>
                    <input type="number" value={form.closingDays} onChange={e => set('closingDays', Number(e.target.value))} className="input w-full" min={1} />
                  </div>
                  <div>
                    <label className="label text-xs">Batch Duration (days)</label>
                    <input type="number" value={form.durationDays} onChange={e => set('durationDays', Number(e.target.value))} className="input w-full" min={0} placeholder="0 = unlimited" />
                  </div>
                </div>
              )}

              {form.batchEnabled && data?.course?.batchSettings?.enabled && (
                <button onClick={() => router.push(`/courses/${id}/batches`)}
                  className="w-full py-3 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/20 transition-colors text-sm font-semibold flex items-center justify-center gap-2">
                  <Layers className="w-4 h-4" /> View & Manage Batches
                </button>
              )}
            </div>
          )}

          {/* Recordings */}
          {activeTab === 'recordings' && (
            <div className="space-y-6">
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                <Youtube className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-semibold text-sm">YouTube Playlist — Class Recordings</p>
                  <p className="text-gray-400 text-xs mt-1">Yahan YouTube playlist ka link daalo. Learner ke panel par saari recordings dikhegi aur woh seedha wahan se dekh sakenge.</p>
                </div>
              </div>

              <div>
                <label className="label">YouTube Playlist URL</label>
                <div className="flex gap-2">
                  <input
                    value={form.youtubePlaylistUrl}
                    onChange={e => set('youtubePlaylistUrl', e.target.value)}
                    placeholder="https://www.youtube.com/playlist?list=PLxxxxxx"
                    className="input flex-1 text-sm"
                  />
                  {form.youtubePlaylistUrl && (
                    <button type="button" onClick={() => set('youtubePlaylistUrl', '')}
                      className="px-3 py-2 rounded-xl bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors text-sm flex items-center gap-1.5">
                      <X className="w-4 h-4" /> Remove
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1.5">YouTube playlist URL paste karo — e.g. https://www.youtube.com/playlist?list=PLxxxxxx</p>
              </div>

              {form.youtubePlaylistUrl && getPlaylistId(form.youtubePlaylistUrl) ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">Preview</p>
                    <a href={form.youtubePlaylistUrl} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300">
                      <ExternalLink className="w-3.5 h-3.5" /> YouTube par kholo
                    </a>
                  </div>
                  <div className="rounded-2xl overflow-hidden border border-white/10 bg-black" style={{ paddingBottom: '56.25%', position: 'relative' }}>
                    <iframe
                      src={`https://www.youtube.com/embed/videoseries?list=${getPlaylistId(form.youtubePlaylistUrl)}&rel=0`}
                      className="absolute inset-0 w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-center">Learner ko bilkul aise hi dikhega — playlist ke saare videos player mein accessible rahenge</p>
                </div>
              ) : form.youtubePlaylistUrl ? (
                <div className="flex items-center gap-2 p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
                  <PlaySquare className="w-4 h-4 flex-shrink-0" />
                  Valid YouTube playlist URL daalo (list= parameter hona chahiye)
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}
