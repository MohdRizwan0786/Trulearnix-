'use client'
import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { adminAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import { Plus, X, Target, TrendingUp, AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'

const STATUS_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
  'on-track': { color: 'text-green-400 bg-green-500/20', icon: TrendingUp, label: 'On Track' },
  'at-risk': { color: 'text-yellow-400 bg-yellow-500/20', icon: AlertTriangle, label: 'At Risk' },
  'behind': { color: 'text-red-400 bg-red-500/20', icon: AlertTriangle, label: 'Behind' },
  'completed': { color: 'text-blue-400 bg-blue-500/20', icon: CheckCircle, label: 'Completed' },
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '', description: '', type: 'company', quarter: 'Q2', year: 2026, status: 'on-track',
    keyResults: [{ title: '', target: 100, current: 0, unit: '%' }]
  })

  useEffect(() => { fetchGoals() }, [])

  const fetchGoals = async () => {
    try {
      const res = await adminAPI.goals()
      setGoals(res.data.data || [])
    } catch { toast.error('Failed to load goals') }
    finally { setLoading(false) }
  }

  const addKR = () => setForm(p => ({ ...p, keyResults: [...p.keyResults, { title: '', target: 100, current: 0, unit: '%' }] }))
  const removeKR = (i: number) => setForm(p => ({ ...p, keyResults: p.keyResults.filter((_, idx) => idx !== i) }))
  const updateKR = (i: number, field: string, val: any) => setForm(p => ({
    ...p, keyResults: p.keyResults.map((kr, idx) => idx === i ? { ...kr, [field]: val } : kr)
  }))

  const save = async () => {
    if (!form.title) return toast.error('Title required')
    try {
      await adminAPI.createGoal(form)
      toast.success('Goal created!')
      setShowForm(false)
      fetchGoals()
    } catch { toast.error('Failed to create goal') }
  }

  const updateKRProgress = async (goalId: string, krIdx: number, current: number) => {
    try {
      await adminAPI.updateGoalKR(goalId, krIdx, { current })
      fetchGoals()
    } catch { toast.error('Failed to update') }
  }

  const deleteGoal = async (id: string) => {
    if (!confirm('Delete this goal?')) return
    try {
      await adminAPI.deleteGoal(id)
      setGoals(p => p.filter(g => g._id !== id))
      toast.success('Deleted')
    } catch { toast.error('Failed') }
  }

  const summary = {
    total: goals.length,
    onTrack: goals.filter(g => g.status === 'on-track').length,
    atRisk: goals.filter(g => g.status === 'at-risk').length,
    completed: goals.filter(g => g.status === 'completed').length,
    avgProgress: goals.length ? Math.round(goals.reduce((a, g) => a + g.progress, 0) / goals.length) : 0,
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* ── Page Header ── */}
        <div className="page-header">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg">
                  <Target className="w-5 h-5 text-white" />
                </div>
                Goals & OKR
              </h1>
              <p className="text-gray-400 text-sm mt-1">Objectives & Key Results tracking</p>
            </div>
            <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Goal
            </button>
          </div>
        </div>

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="kpi-violet">
            <p className="text-2xl font-black text-white">{summary.total}</p>
            <p className="text-white/70 text-xs mt-1">Total Goals</p>
          </div>
          <div className="kpi-emerald">
            <p className="text-2xl font-black text-white">{summary.onTrack}</p>
            <p className="text-white/70 text-xs mt-1">On Track</p>
          </div>
          <div className="kpi-amber">
            <p className="text-2xl font-black text-white">{summary.atRisk}</p>
            <p className="text-white/70 text-xs mt-1">At Risk</p>
          </div>
          <div className="kpi-cyan">
            <p className="text-2xl font-black text-white">{summary.avgProgress}%</p>
            <p className="text-white/70 text-xs mt-1">Avg Progress</p>
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-lg border border-white/10 space-y-4 my-4">
              <div className="flex items-center justify-between">
                <h2 className="text-white font-bold">New Goal (OKR)</h2>
                <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-gray-400" /></button>
              </div>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Objective title" className="w-full bg-slate-700 text-white rounded-xl px-4 py-2.5 text-sm border border-white/10 outline-none focus:border-violet-500" />
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Description" rows={2} className="w-full bg-slate-700 text-white rounded-xl px-4 py-2.5 text-sm border border-white/10 outline-none resize-none" />
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Type</label>
                  <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                    className="w-full bg-slate-700 text-white rounded-xl px-3 py-2 text-sm border border-white/10 outline-none">
                    <option value="company">Company</option>
                    <option value="team">Team</option>
                    <option value="personal">Personal</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Quarter</label>
                  <select value={form.quarter} onChange={e => setForm(p => ({ ...p, quarter: e.target.value }))}
                    className="w-full bg-slate-700 text-white rounded-xl px-3 py-2 text-sm border border-white/10 outline-none">
                    {['Q1', 'Q2', 'Q3', 'Q4'].map(q => <option key={q} value={q}>{q}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Year</label>
                  <input type="number" value={form.year} onChange={e => setForm(p => ({ ...p, year: +e.target.value }))}
                    className="w-full bg-slate-700 text-white rounded-xl px-3 py-2 text-sm border border-white/10 outline-none" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-gray-400">Key Results</label>
                  <button onClick={addKR} className="text-xs text-violet-400 flex items-center gap-1"><Plus className="w-3 h-3" /> Add KR</button>
                </div>
                {form.keyResults.map((kr, i) => (
                  <div key={i} className="bg-slate-700 rounded-xl p-3 mb-2 space-y-2">
                    <div className="flex gap-2">
                      <input value={kr.title} onChange={e => updateKR(i, 'title', e.target.value)}
                        placeholder="Key result description" className="flex-1 bg-slate-600 text-white rounded-lg px-3 py-1.5 text-xs border border-white/10 outline-none" />
                      {form.keyResults.length > 1 && <button onClick={() => removeKR(i)}><X className="w-3.5 h-3.5 text-gray-500" /></button>}
                    </div>
                    <div className="flex gap-2">
                      <input type="number" value={kr.target} onChange={e => updateKR(i, 'target', +e.target.value)}
                        placeholder="Target" className="w-24 bg-slate-600 text-white rounded-lg px-3 py-1.5 text-xs border border-white/10 outline-none" />
                      <input value={kr.unit} onChange={e => updateKR(i, 'unit', e.target.value)}
                        placeholder="Unit" className="w-20 bg-slate-600 text-white rounded-lg px-3 py-1.5 text-xs border border-white/10 outline-none" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm">Cancel</button>
                <button onClick={save} className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700">Create Goal</button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            {goals.map(goal => {
              const cfg = STATUS_CONFIG[goal.status] || STATUS_CONFIG['on-track']
              const isExpanded = expanded === goal._id
              return (
                <div key={goal._id} className="bg-slate-800 rounded-2xl border border-white/5 overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <Target className="w-4 h-4 text-violet-400 flex-shrink-0" />
                          <h3 className="text-white font-semibold">{goal.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                          <span className="text-xs text-gray-500 capitalize">{goal.type} • {goal.quarter} {goal.year}</span>
                        </div>
                        {goal.description && <p className="text-gray-400 text-sm ml-7">{goal.description}</p>}
                        <div className="mt-3 ml-7">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-400">Overall Progress</span>
                            <span className="text-white font-medium">{goal.progress}%</span>
                          </div>
                          <div className="bg-slate-700 rounded-full h-2">
                            <div className="bg-violet-500 h-2 rounded-full transition-all" style={{ width: `${goal.progress}%` }} />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button onClick={() => setExpanded(isExpanded ? null : goal._id)} className="text-gray-400 hover:text-white">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button onClick={() => deleteGoal(goal._id)} className="text-gray-500 hover:text-red-400">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="border-t border-white/5 p-5 space-y-3">
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Key Results</p>
                      {goal.keyResults?.map((kr: any, i: number) => (
                        <div key={i} className="bg-slate-700/50 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-white text-sm">{kr.title}</p>
                            <span className="text-xs text-gray-400">{kr.current}/{kr.target} {kr.unit}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-slate-600 rounded-full h-1.5">
                              <div className="bg-violet-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (kr.current / kr.target) * 100)}%` }} />
                            </div>
                            <input type="number" defaultValue={kr.current}
                              onBlur={e => updateKRProgress(goal._id, i, +e.target.value)}
                              className="w-16 bg-slate-600 text-white rounded-lg px-2 py-1 text-xs border border-white/10 outline-none text-center" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
            {goals.length === 0 && <div className="text-center py-16 text-gray-500">No goals yet. Set your first OKR!</div>}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
