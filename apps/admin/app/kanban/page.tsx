'use client'
import { useState, useEffect, useRef } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { adminAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import {
  Plus, X, Clock, CheckCircle2, Kanban, AlertTriangle, Loader2,
  User, Tag, Calendar, BarChart2, TrendingUp, Flame, Zap,
  ChevronDown, Circle, Filter, RefreshCw, Trash2, Edit3
} from 'lucide-react'

const COLUMNS = [
  { id: 'todo',        label: 'To Do',      color: 'border-slate-500',  bg: 'bg-slate-500/5',  dot: 'bg-gray-400',    badge: 'bg-gray-500/20 text-gray-300' },
  { id: 'in-progress', label: 'In Progress', color: 'border-blue-500',   bg: 'bg-blue-500/5',   dot: 'bg-blue-400',    badge: 'bg-blue-500/20 text-blue-300' },
  { id: 'review',      label: 'In Review',   color: 'border-amber-500',  bg: 'bg-amber-500/5',  dot: 'bg-amber-400',   badge: 'bg-amber-500/20 text-amber-300' },
  { id: 'done',        label: 'Done',        color: 'border-emerald-500',bg: 'bg-emerald-500/5',dot: 'bg-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300' },
]

const PRIORITY_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  low:    { label: 'Low',    color: 'text-gray-400 bg-gray-500/20',    icon: Circle },
  medium: { label: 'Medium', color: 'text-blue-400 bg-blue-500/20',    icon: ChevronDown },
  high:   { label: 'High',   color: 'text-orange-400 bg-orange-500/20',icon: Flame },
  urgent: { label: 'Urgent', color: 'text-red-400 bg-red-500/20',      icon: Zap },
}

const ROLE_COLOR: Record<string, string> = {
  superadmin: 'text-violet-400', admin: 'text-blue-400', manager: 'text-cyan-400',
  mentor: 'text-emerald-400', salesperson: 'text-amber-400',
}

function getInitials(name: string) {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
}

function hashColor(str: string) {
  const colors = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500']
  let h = 0; for (const c of str) h = (h * 31 + c.charCodeAt(0)) % colors.length
  return colors[h]
}

const emptyForm = { title: '', description: '', priority: 'medium', status: 'todo', dueDate: '', assignedTo: '', tags: '' }

export default function KanbanPage() {
  const [tasks, setTasks]         = useState<any[]>([])
  const [team, setTeam]           = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [showNew, setShowNew]     = useState(false)
  const [editTask, setEditTask]   = useState<any>(null)
  const [form, setForm]           = useState<any>(emptyForm)
  const [saving, setSaving]       = useState(false)
  const [dragging, setDragging]   = useState<string | null>(null)
  const [dragOver, setDragOver]   = useState<string | null>(null)
  const [filterAssignee, setFilterAssignee] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const adminRole = typeof window !== 'undefined' ? (localStorage.getItem('adminRole') || '') : ''
  const adminId   = typeof window !== 'undefined' ? (localStorage.getItem('adminId') || '') : ''
  const isAdmin   = ['admin', 'superadmin'].includes(adminRole)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [tasksRes, teamRes] = await Promise.allSettled([adminAPI.tasks(), adminAPI.taskTeam()])
      if (tasksRes.status === 'fulfilled') setTasks(tasksRes.value.data.data || [])
      if (teamRes.status === 'fulfilled') setTeam(teamRes.value.data.data || [])
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  const openCreate = () => { setForm(emptyForm); setShowNew(true); setEditTask(null) }
  const openEdit   = (task: any) => {
    setForm({
      title: task.title, description: task.description || '',
      priority: task.priority, status: task.status,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
      assignedTo: task.assignedTo?._id || '',
      tags: task.tags?.join(', ') || '',
    })
    setEditTask(task); setShowNew(true)
  }

  const saveTask = async () => {
    if (!form.title.trim()) return toast.error('Title required')
    setSaving(true)
    try {
      const payload = {
        ...form,
        tags: form.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
        assignedTo: form.assignedTo || undefined,
        dueDate: form.dueDate || undefined,
      }
      if (editTask) {
        const res = await adminAPI.updateTask(editTask._id, payload)
        setTasks(prev => prev.map(t => t._id === editTask._id ? res.data.data : t))
        toast.success('Task updated')
      } else {
        const res = await adminAPI.createTask(payload)
        setTasks(prev => [res.data.data, ...prev])
        toast.success('Task created')
      }
      setShowNew(false); setEditTask(null); setForm(emptyForm)
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  const moveTask = async (taskId: string, newStatus: string) => {
    if (tasks.find(t => t._id === taskId)?.status === newStatus) return
    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t))
    try { await adminAPI.updateTask(taskId, { status: newStatus }) }
    catch { fetchAll(); toast.error('Failed to move') }
  }

  const deleteTask = async (taskId: string) => {
    if (!confirm('Delete this task?')) return
    setTasks(prev => prev.filter(t => t._id !== taskId))
    try { await adminAPI.deleteTask(taskId); toast.success('Deleted') }
    catch { fetchAll(); toast.error('Failed to delete') }
  }

  const filtered = tasks.filter(t => {
    if (filterAssignee && t.assignedTo?._id !== filterAssignee) return false
    if (filterPriority && t.priority !== filterPriority) return false
    return true
  })

  const getColTasks = (col: string) => filtered.filter(t => t.status === col)

  // Analytics
  const total     = tasks.length
  const done      = tasks.filter(t => t.status === 'done').length
  const inProg    = tasks.filter(t => t.status === 'in-progress').length
  const now       = new Date()
  const overdue   = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done').length
  const urgent    = tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length
  const pct       = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <AdminLayout>
      <div className="space-y-5">

        {/* ── Page Header ── */}
        <div className="page-header">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-700 flex items-center justify-center shadow-lg">
                  <Kanban className="w-5 h-5 text-white" />
                </div>
                Task Board
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                {total} tasks · {done} completed · {overdue > 0 ? <span className="text-red-400">{overdue} overdue</span> : 'no overdue'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchAll} className="p-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl border border-white/10 transition-all">
                <RefreshCw className="w-4 h-4" />
              </button>
              {isAdmin && (
                <button onClick={openCreate} className="btn-primary flex items-center gap-2">
                  <Plus className="w-4 h-4" /> New Task
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="kpi-violet rounded-2xl p-4 border flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
              <Kanban className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Total</p>
              <p className="text-xl font-bold text-white">{total}</p>
            </div>
          </div>
          <div className="kpi-blue rounded-2xl p-4 border flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400">In Progress</p>
              <p className="text-xl font-bold text-blue-400">{inProg}</p>
            </div>
          </div>
          <div className="kpi-emerald rounded-2xl p-4 border flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Completed</p>
              <p className="text-xl font-bold text-emerald-400">{done}</p>
            </div>
          </div>
          <div className="kpi-rose rounded-2xl p-4 border flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Overdue</p>
              <p className="text-xl font-bold text-rose-400">{overdue}</p>
            </div>
          </div>
          <div className="col-span-2 lg:col-span-1 kpi-amber rounded-2xl p-4 border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400">Completion</p>
              <p className="text-sm font-bold text-amber-400">{pct}%</p>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            {urgent > 0 && <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1"><Zap className="w-3 h-3" />{urgent} urgent</p>}
          </div>
        </div>

        {/* ── Filters (admin only) ── */}
        {isAdmin && (team.length > 0 || true) && (
          <div className="flex gap-2 flex-wrap items-center">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mr-1">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </div>
            <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}
              className="bg-slate-800 text-white rounded-xl px-3 py-2 text-xs border border-white/10 outline-none focus:border-violet-500 min-w-36">
              <option value="">All Assignees</option>
              {team.map(m => <option key={m._id} value={m._id}>{m.name} ({m.role})</option>)}
            </select>
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
              className="bg-slate-800 text-white rounded-xl px-3 py-2 text-xs border border-white/10 outline-none focus:border-violet-500">
              <option value="">All Priorities</option>
              {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            {(filterAssignee || filterPriority) && (
              <button onClick={() => { setFilterAssignee(''); setFilterPriority('') }}
                className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 flex items-center gap-1">
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
        )}

        {/* ── Kanban Board ── */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-7 h-7 animate-spin text-violet-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {COLUMNS.map(col => {
              const colTasks = getColTasks(col.id)
              return (
                <div key={col.id}
                  onDragOver={e => { e.preventDefault(); setDragOver(col.id) }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={e => { e.preventDefault(); setDragOver(null); if (dragging) moveTask(dragging, col.id) }}
                  className={`rounded-2xl border-2 transition-all duration-150 ${dragOver === col.id ? col.color + ' ' + col.bg : 'border-white/5 bg-slate-800/30'} min-h-[420px] flex flex-col`}>

                  {/* Column header */}
                  <div className="flex items-center justify-between px-4 pt-4 pb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                      <h3 className="text-white font-bold text-sm">{col.label}</h3>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${col.badge}`}>{colTasks.length}</span>
                  </div>

                  {/* Task cards */}
                  <div className="flex-1 px-3 pb-3 space-y-2.5 overflow-y-auto">
                    {colTasks.map(task => {
                      const pCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium
                      const isOverdue = task.dueDate && new Date(task.dueDate) < now && task.status !== 'done'
                      const assignee = task.assignedTo
                      return (
                        <div key={task._id}
                          draggable
                          onDragStart={() => setDragging(task._id)}
                          onDragEnd={() => { setDragging(null); setDragOver(null) }}
                          className={`bg-slate-800 rounded-xl p-3.5 border cursor-grab active:cursor-grabbing transition-all group
                            ${dragging === task._id ? 'opacity-40 scale-95' : 'hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/5'}
                            ${isOverdue ? 'border-red-500/30' : 'border-white/5'}`}>

                          {/* Card top */}
                          <div className="flex items-start gap-2 mb-2">
                            <p className="text-white text-sm font-semibold leading-snug flex-1">{task.title}</p>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                              {isAdmin && (
                                <button onClick={() => openEdit(task)}
                                  className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-violet-500/20 text-gray-500 hover:text-violet-400 transition-colors">
                                  <Edit3 className="w-3 h-3" />
                                </button>
                              )}
                              <button onClick={() => deleteTask(task._id)}
                                className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {task.description && (
                            <p className="text-gray-500 text-xs mb-2.5 line-clamp-2 leading-relaxed">{task.description}</p>
                          )}

                          {/* Tags */}
                          {task.tags?.length > 0 && (
                            <div className="flex gap-1 flex-wrap mb-2">
                              {task.tags.slice(0, 3).map((tag: string) => (
                                <span key={tag} className="text-[10px] bg-violet-500/15 text-violet-400 px-1.5 py-0.5 rounded-md">{tag}</span>
                              ))}
                            </div>
                          )}

                          {/* Footer */}
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold flex items-center gap-0.5 ${pCfg.color}`}>
                                <pCfg.icon className="w-2.5 h-2.5" />{pCfg.label}
                              </span>
                              {isOverdue && (
                                <span className="text-[10px] text-red-400 bg-red-500/15 px-1.5 py-0.5 rounded-md font-semibold flex items-center gap-0.5">
                                  <AlertTriangle className="w-2.5 h-2.5" />Overdue
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              {task.dueDate && !isOverdue && (
                                <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                                  <Clock className="w-2.5 h-2.5" />
                                  {new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                </span>
                              )}
                              {assignee && (
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 ${hashColor(assignee._id)}`}
                                  title={`${assignee.name} (${assignee.role})`}>
                                  {getInitials(assignee.name)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    {colTasks.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-10 text-gray-600">
                        <div className="w-10 h-10 rounded-xl bg-white/3 flex items-center justify-center mb-2">
                          <Kanban className="w-5 h-5 opacity-30" />
                        </div>
                        <p className="text-xs">No tasks here</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Create / Edit Task Modal ── */}
      {showNew && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
              <h2 className="text-white font-bold flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <Plus className="w-3.5 h-3.5 text-violet-400" />
                </div>
                {editTask ? 'Edit Task' : 'New Task'}
              </h2>
              <button onClick={() => { setShowNew(false); setEditTask(null) }}>
                <X className="w-4 h-4 text-gray-400 hover:text-white" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block font-medium">Task Title *</label>
                <input value={form.title} onChange={e => setForm((p: any) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Call leads from today's list"
                  className="w-full bg-slate-700 text-white rounded-xl px-4 py-2.5 text-sm border border-white/10 outline-none focus:border-violet-500" />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1.5 block font-medium">Description</label>
                <textarea value={form.description} onChange={e => setForm((p: any) => ({ ...p, description: e.target.value }))}
                  placeholder="Optional details..." rows={3}
                  className="w-full bg-slate-700 text-white rounded-xl px-4 py-2.5 text-sm border border-white/10 outline-none focus:border-violet-500 resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block font-medium">Priority</label>
                  <select value={form.priority} onChange={e => setForm((p: any) => ({ ...p, priority: e.target.value }))}
                    className="w-full bg-slate-700 text-white rounded-xl px-3 py-2.5 text-sm border border-white/10 outline-none focus:border-violet-500">
                    {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block font-medium">Column</label>
                  <select value={form.status} onChange={e => setForm((p: any) => ({ ...p, status: e.target.value }))}
                    className="w-full bg-slate-700 text-white rounded-xl px-3 py-2.5 text-sm border border-white/10 outline-none focus:border-violet-500">
                    {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              {isAdmin && (
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block font-medium">Assign To</label>
                  <select value={form.assignedTo} onChange={e => setForm((p: any) => ({ ...p, assignedTo: e.target.value }))}
                    className="w-full bg-slate-700 text-white rounded-xl px-3 py-2.5 text-sm border border-white/10 outline-none focus:border-violet-500">
                    <option value="">— Unassigned —</option>
                    {team.map(m => (
                      <option key={m._id} value={m._id}>
                        {m.name} · {m.role}{m.department ? ` (${m.department})` : ''}
                      </option>
                    ))}
                  </select>
                  {form.assignedTo && (() => {
                    const m = team.find((t: any) => t._id === form.assignedTo)
                    return m ? (
                      <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-violet-500/10 rounded-xl border border-violet-500/20">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${hashColor(m._id)}`}>
                          {getInitials(m.name)}
                        </div>
                        <div>
                          <p className="text-white text-xs font-semibold">{m.name}</p>
                          <p className={`text-[10px] capitalize ${ROLE_COLOR[m.role] || 'text-gray-400'}`}>{m.role}{m.department ? ` · ${m.department}` : ''}</p>
                        </div>
                      </div>
                    ) : null
                  })()}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block font-medium">Due Date</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm((p: any) => ({ ...p, dueDate: e.target.value }))}
                    className="w-full bg-slate-700 text-white rounded-xl px-3 py-2.5 text-sm border border-white/10 outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block font-medium">Tags (comma separated)</label>
                  <input value={form.tags} onChange={e => setForm((p: any) => ({ ...p, tags: e.target.value }))}
                    placeholder="design, backend..."
                    className="w-full bg-slate-700 text-white rounded-xl px-3 py-2.5 text-sm border border-white/10 outline-none focus:border-violet-500" />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/8 flex gap-3">
              <button onClick={() => { setShowNew(false); setEditTask(null) }}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:text-white hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button onClick={saveTask} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editTask ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />)}
                {editTask ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
