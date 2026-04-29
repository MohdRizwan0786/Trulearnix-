'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { courseAPI } from '@/lib/api'
import { Loader2, BookOpen } from 'lucide-react'

export default function NewCourse() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '', description: '', category: 'digital_marketing', level: 'beginner',
    price: '', thumbnail: '', language: 'Hindi',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.description) return setError('Title and description are required')
    try {
      setLoading(true)
      const res = await courseAPI.create({ ...form, price: Number(form.price) || 0 })
      router.push(`/mentor/courses/${res.data.course._id}`)
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to create course')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Create New Course</h1>
        <p className="text-gray-400 mt-1">Fill in the details to get started</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">{error}</div>}

        <div>
          <label className="block text-sm text-gray-400 mb-1">Course Title *</label>
          <input value={form.title} onChange={e => set('title', e.target.value)} className="input" placeholder="e.g. Complete Digital Marketing Masterclass" />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Description *</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)}
            className="input min-h-[120px] resize-none" placeholder="What will students learn?" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Category</label>
            <select value={form.category} onChange={e => set('category', e.target.value)} className="input">
              <option value="digital_marketing">Digital Marketing</option>
              <option value="affiliate">Partnership Marketing</option>
              <option value="trading">Trading</option>
              <option value="others">Others</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Level</label>
            <select value={form.level} onChange={e => set('level', e.target.value)} className="input">
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Price (₹)</label>
            <input value={form.price} onChange={e => set('price', e.target.value)} type="number" className="input" placeholder="0 for free" min="0" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Language</label>
            <select value={form.language} onChange={e => set('language', e.target.value)} className="input">
              <option value="Hindi">Hindi</option>
              <option value="English">English</option>
              <option value="Hinglish">Hinglish</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Thumbnail URL</label>
          <input value={form.thumbnail} onChange={e => set('thumbnail', e.target.value)} className="input" placeholder="https://example.com/image.jpg" />
          {form.thumbnail && <img src={form.thumbnail} alt="thumbnail preview" className="mt-2 h-24 rounded-xl object-cover" />}
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
            Create Course
          </button>
          <button type="button" onClick={() => router.back()} className="btn-outline">Cancel</button>
        </div>
      </form>
    </div>
  )
}
