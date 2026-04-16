'use client'
import { useState, useEffect } from 'react'
import { tasksAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import toast from 'react-hot-toast'
import {
  Plus, X, Loader2, Flame, Zap, Circle, ChevronDown,
  Trash2, Edit3, CheckCircle2, Clock, AlertTriangle, Kanban
} from 'lucide-react'

const COLUMNS = [
  { id: 'todo',        label: 'To Do',       dot: 'bg-gray-400',     badge: 'bg-gray-500/20 text-gray-300',       border: 'border-t-gray-500' },
  { id: 'in-progress', label: 'In Progress',  dot: 'bg-blue-400',     badge: 'bg-blue-500/20 text-blue-300',       border: 'border-t-blue-500' },
  { id: 'review',      label: 'In Review',    dot: 'bg-amber-400',    badge: 'bg-amber-500/20 text-amber-300',     border: 'border-t-amber-500' },
  { id: 'done',        label: 'Done',         dot: 'bg-emerald-400',  badge: 'bg-emerald-500/20 text-emerald-300', border: 'border-t-emerald-500' },
]

const PRIORITY: Record<string, { label: string; color: string; icon: any }> = {
  low:    { label: 'Low',    color: 'text-gray-400 bg-gray-500/20',    icon: Circle },
  medium: { label: 'Medium', color: 'text-blue-400 bg-blue-500/20',    icon: ChevronDown },
  high:   { label: 'High',   color: 'text-orange-400 bg-orange-500/20',icon: Flame },
  urgent: { label: 'Urgent', color: 'text-red-400 bg-red-500/20',      icon: Zap },
}

const empty = { title: '', description: '', priority: 'medium', status: 'todo', dueDate: '', tags: '' }

function initials(name: string) {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
}

export default function KanbanBoard({ accentColor = 'blue' }: { accentColor?: string }) {
  const { user } = useAuthStore()
  const isAdmin = ['admin', 'superadmin'].includes(user?.role || '')
  const [tasks, setTasks]     = useState<any[]>([])
  const [team, setTeam]       = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editTask, setEditTask] = useState<any>(null)
  const [form, setForm]       = useState<any>(empty)
  const [saving, setSaving]   = useState(false)
  const [dragId, setDragId]   = useState<string | null>(null)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [t, tm] = await Promise.allSettled([tasksAPI.list(), tasksAPI.team()])
      if (t.status === 'fulfilled')  setTasks(t.value.data.data || [])
      if (tm.status === 'fulfilled') setTeam(tm.value.data.data || [])
    } finally { setLoading(false) }
  }

  const openCreate = () => { setForm(empty); setEditTask(null); setShowForm(true) }
  const openEdit   = (task: any) => {
    setForm({ title: task.title, description: task.description || '', priority: task.priority,
      status: task.status, dueDate: task.dueDate?.slice(0, 10) || '',
      tags: task.tags?.join(', ') || '', assignedTo: task.assignedTo?._id || '' })
    setEditTask(task); setShowForm(true)
  }

  const save = async () => {
    if (!form.title.trim()) return toast.error('Title required')
    setSaving(true)
    try {
      const payload = { ...form, tags: form.tags ? form.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [] }
      if (editTask) await tasksAPI.update(editTask._id, payload)
      else          await tasksAPI.create(payload)
      toast.success(editTask ? 'Task updated' : 'Task created')
      setShowForm(false); fetchAll()
    } catch { toast.error('Failed to save') } finally { setSaving(false) }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this task?')) return
    try { await tasksAPI.remove(id); fetchAll() } catch { toast.error('Failed') }
  }

  const moveTo = async (id: string, status: string) => {
    try { await tasksAPI.update(id, { status }); fetchAll() } catch {}
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <Kanban className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Kanban Board</h1>
            <p className="text-gray-500 text-xs">{tasks.length} tasks total</p>
          </div>
        </div>
        {isAdmin && (
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all">
            <Plus className="w-4 h-4" /> New Task
          </button>
        )}
      </div>

      {/* Board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id)
          return (
            <div key={col.id}
              onDragOver={e => e.preventDefault()}
              onDrop={() => { if (dragId) moveTo(dragId, col.id); setDragId(null) }}
              className={`rounded-2xl border-t-2 ${col.border} p-3 min-h-[200px]`}
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              {/* Column header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                  <span className="text-white text-sm font-bold">{col.label}</span>
                </div>
                <span className={`text-xs font-black px-2 py-0.5 rounded-full ${col.badge}`}>{colTasks.length}</span>
              </div>

              {/* Cards */}
              <div className="space-y-2">
                {colTasks.map(task => {
                  const p = PRIORITY[task.priority] || PRIORITY.medium
                  const PIcon = p.icon
                  return (
                    <div key={task._id} draggable
                      onDragStart={() => setDragId(task._id)}
                      className="rounded-xl p-3 cursor-grab active:cursor-grabbing group"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-white text-sm font-semibold leading-tight flex-1">{task.title}</p>
                        {isAdmin && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <button onClick={() => openEdit(task)} className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center hover:bg-blue-500/40">
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button onClick={() => remove(task._id)} className="w-6 h-6 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/40">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                      {task.description && <p className="text-gray-500 text-xs mb-2 line-clamp-2">{task.description}</p>}
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${p.color}`}>
                          <PIcon className="w-2.5 h-2.5" />{p.label}
                        </span>
                        {task.assignedTo && (
                          <div className="w-6 h-6 rounded-full bg-indigo-500/30 text-indigo-300 text-[9px] font-bold flex items-center justify-center">
                            {initials(task.assignedTo.name || '')}
                          </div>
                        )}
                      </div>
                      {task.dueDate && (
                        <p className="text-gray-600 text-[10px] mt-1.5 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="fixed inset-0" onClick={() => setShowForm(false)} />
          <div className="relative bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md z-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold">{editTask ? 'Edit Task' : 'New Task'}</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Title *</label>
                <input value={form.title} onChange={e => setForm((f: any) => ({ ...f, title: e.target.value }))}
                  placeholder="Task title"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Description</label>
                <textarea value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))}
                  rows={3} placeholder="Details..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Priority</label>
                  <select value={form.priority} onChange={e => setForm((f: any) => ({ ...f, priority: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500">
                    {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Status</label>
                  <select value={form.status} onChange={e => setForm((f: any) => ({ ...f, status: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500">
                    {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Due Date</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm((f: any) => ({ ...f, dueDate: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Assign To</label>
                  <select value={form.assignedTo} onChange={e => setForm((f: any) => ({ ...f, assignedTo: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500">
                    <option value="">Self</option>
                    {team.map((m: any) => <option key={m._id} value={m._id}>{m.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white text-sm">Cancel</button>
              <button onClick={save} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : 'Save Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
