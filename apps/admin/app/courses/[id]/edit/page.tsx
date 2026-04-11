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
  ChevronDown, ChevronUp, Image, Eye, Users, Clock, BookOpen,
  DollarSign, FileText, Layers, Settings, Zap
} from 'lucide-react'

const CATEGORIES = ['Business', 'Marketing', 'Sales', 'Development', 'Design', 'Data Science', 'Finance', 'Personal Development', 'Communication', 'Leadership', 'Other']
const LANGUAGES = ['Hindi', 'English', 'Hinglish', 'Tamil', 'Telugu', 'Marathi', 'Kannada', 'Bengali', 'Gujarati', 'Other']

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

export default function EditCoursePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'pricing' | 'details' | 'batch'>('basic')

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
      })
    }
  }, [data])

  const set = (key: string, val: any) => setForm((f: any) => ({ ...f, [key]: val }))

  const save = async () => {
    if (!form.title?.trim()) { toast.error('Title is required'); return }
    setSaving(true)
    try {
      await adminAPI.updateCourse(id, {
        title: form.title, shortDescription: form.shortDescription, description: form.description,
        thumbnail: form.thumbnail, previewVideo: form.previewVideo,
        mentor: form.mentor, category: form.category, level: form.level, language: form.language,
        duration: form.duration, price: Number(form.price),
        discountPrice: form.discountPrice ? Number(form.discountPrice) : undefined,
        tags: form.tags, status: form.status, certificate: form.certificate, passingScore: form.passingScore,
        requirements: form.requirements, outcomes: form.outcomes, highlights: form.highlights, faqs: form.faqs,
        batchSettings: {
          enabled: form.batchEnabled,
          minStrength: form.minStrength,
          maxStrength: form.maxStrength,
          closingDays: form.closingDays,
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
    { id: 'details', label: 'Details', icon: FileText },
    { id: 'batch', label: 'Batches', icon: Users },
  ] as const

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
            {data?.course?.batchSettings?.enabled && (
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
        <div className="flex gap-1 bg-slate-800/50 border border-white/10 rounded-2xl p-1 w-fit">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === t.id ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'}`}>
              <t.icon className="w-4 h-4" /> {t.label}
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
                      <UploadButton onUrl={url => set('thumbnail', url)} accept="image/*" label="Upload" />
                    </div>
                  )}
                </div>
                <div>
                  <label className="label">Status</label>
                  <select value={form.status} onChange={e => set('status', e.target.value)} className="input w-full">
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <label className="label mt-4">Instructor</label>
                  <select value={form.mentor} onChange={e => set('mentor', e.target.value)} className="input w-full">
                    <option value="">Select instructor</option>
                    {mentors.map((m: any) => <option key={m._id} value={m._id}>{m.name}</option>)}
                  </select>
                </div>
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
              <TagInput label="Tags" values={form.tags} onChange={v => set('tags', v)} />
            </div>
          )}

          {/* Details */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              <TagInput label="Outcomes (What students will learn)" values={form.outcomes} onChange={v => set('outcomes', v)} placeholder="e.g. Close 3x more deals" />
              <TagInput label="Requirements" values={form.requirements} onChange={v => set('requirements', v)} placeholder="e.g. Basic sales experience" />
              <TagInput label="Highlights" values={form.highlights} onChange={v => set('highlights', v)} placeholder="e.g. Live Q&A sessions" />
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
                <div className="grid grid-cols-3 gap-4">
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
