'use client'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { adminAPI } from '@/lib/api'
import AdminLayout from '@/components/AdminLayout'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, X, Eye, Star, FileText } from 'lucide-react'
import { format } from 'date-fns'

const STATUS_OPTIONS = ['draft', 'published', 'archived']
const CATEGORIES = ['general', 'tech', 'tutorial', 'news', 'finance', 'motivation']

const statusColor = (s: string) => {
  const map: Record<string, string> = {
    published: 'bg-green-500/20 text-green-400',
    draft: 'bg-yellow-500/20 text-yellow-400',
    archived: 'bg-gray-500/20 text-gray-400',
  }
  return map[s] || 'bg-gray-500/20 text-gray-400'
}

const emptyForm = {
  title: '', excerpt: '', content: '', category: 'general',
  tags: '', status: 'draft', featured: false,
  seoTitle: '', seoDescription: '', seoKeywords: ''
}

export default function BlogPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [editId, setEditId] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState('')

  const { data, refetch } = useQuery({
    queryKey: ['admin-blogs'],
    queryFn: () => adminAPI.allBlogs({ limit: 50 }).then(r => r.data)
  })

  const blogs = data?.blogs || data?.data || []

  const openCreate = () => {
    setForm({ ...emptyForm })
    setEditId('')
    setModal('create')
  }

  const openEdit = (blog: any) => {
    setForm({
      title: blog.title || '',
      excerpt: blog.excerpt || '',
      content: blog.content || '',
      category: blog.category || 'general',
      tags: Array.isArray(blog.tags) ? blog.tags.join(', ') : (blog.tags || ''),
      status: blog.status || 'draft',
      featured: !!blog.featured,
      seoTitle: blog.seo?.title || blog.seoTitle || '',
      seoDescription: blog.seo?.description || blog.seoDescription || '',
      seoKeywords: blog.seo?.keywords || blog.seoKeywords || '',
    })
    setEditId(blog._id)
    setModal('edit')
  }

  const save = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        tags: form.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
        seo: { title: form.seoTitle, description: form.seoDescription, keywords: form.seoKeywords }
      }
      if (modal === 'edit') {
        await adminAPI.updateBlog(editId, payload)
        toast.success('Blog updated')
      } else {
        await adminAPI.createBlog(payload)
        toast.success('Blog created')
      }
      setModal(null)
      refetch()
    } catch { toast.error('Failed to save') } finally { setSaving(false) }
  }

  const deleteBlog = async (id: string) => {
    try {
      await adminAPI.deleteBlog(id)
      toast.success('Blog deleted')
      setConfirmDelete('')
      refetch()
    } catch { toast.error('Failed to delete') }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* ── Page Header ── */}
        <div className="page-header">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-700 flex items-center justify-center shadow-lg">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                Blog CMS
              </h1>
              <p className="text-gray-400 text-sm mt-1">{blogs.length} articles published</p>
            </div>
            <button onClick={openCreate} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Article
            </button>
          </div>
        </div>

        {/* Blog list */}
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-slate-700/30">
                  <th className="text-left px-5 py-4 text-gray-400 font-medium">Title</th>
                  <th className="text-left px-5 py-4 text-gray-400 font-medium">Category</th>
                  <th className="text-left px-5 py-4 text-gray-400 font-medium">Status</th>
                  <th className="text-left px-5 py-4 text-gray-400 font-medium">Views</th>
                  <th className="text-left px-5 py-4 text-gray-400 font-medium">Date</th>
                  <th className="text-left px-5 py-4 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {blogs.map((blog: any) => (
                  <tr key={blog._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {blog.featured && <Star className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                        <div>
                          <p className="text-white font-medium line-clamp-1 max-w-[300px]">{blog.title}</p>
                          {blog.excerpt && <p className="text-xs text-gray-500 line-clamp-1 max-w-[300px]">{blog.excerpt}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-300 capitalize text-xs">{blog.category || '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`badge ${statusColor(blog.status)} capitalize`}>{blog.status || 'draft'}</span>
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-xs flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {(blog.views || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-xs">
                      {blog.createdAt ? format(new Date(blog.createdAt), 'dd MMM yyyy') : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(blog)}
                          className="p-1.5 hover:bg-violet-500/20 text-gray-400 hover:text-violet-400 rounded-lg transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setConfirmDelete(blog._id)}
                          className="p-1.5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {blogs.length === 0 && <div className="text-center py-12 text-gray-500">No blog posts yet</div>}
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="card w-full max-w-2xl my-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">{modal === 'edit' ? 'Edit Article' : 'New Article'}</h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Title *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input" placeholder="Article title..." />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Excerpt</label>
                <textarea value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })}
                  rows={2} className="input resize-none" placeholder="Short description..." />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Content</label>
                <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                  rows={8} className="input resize-none" placeholder="Article content..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input">
                    {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input">
                    {STATUS_OPTIONS.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Tags (comma separated)</label>
                <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} className="input" placeholder="react, nextjs, tutorial" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="featured" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })}
                  className="w-4 h-4 accent-violet-500 cursor-pointer" />
                <label htmlFor="featured" className="text-sm text-gray-300 cursor-pointer">Featured article</label>
              </div>

              {/* SEO */}
              <div className="border-t border-white/10 pt-4">
                <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">SEO</p>
                <div className="space-y-3">
                  <input value={form.seoTitle} onChange={e => setForm({ ...form, seoTitle: e.target.value })}
                    className="input" placeholder="SEO Title" />
                  <input value={form.seoDescription} onChange={e => setForm({ ...form, seoDescription: e.target.value })}
                    className="input" placeholder="SEO Description" />
                  <input value={form.seoKeywords} onChange={e => setForm({ ...form, seoKeywords: e.target.value })}
                    className="input" placeholder="SEO Keywords (comma separated)" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={save} disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
                {saving ? 'Saving...' : modal === 'edit' ? 'Update Article' : 'Publish Article'}
              </button>
              <button onClick={() => setModal(null)} className="btn bg-slate-700 hover:bg-slate-600 text-white">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-sm text-center">
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Delete Article?</h3>
            <p className="text-gray-400 text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => deleteBlog(confirmDelete)} className="btn-danger flex-1">Delete</button>
              <button onClick={() => setConfirmDelete('')} className="btn bg-slate-700 hover:bg-slate-600 text-white flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
