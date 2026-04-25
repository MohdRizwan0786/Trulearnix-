'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminAPI } from '@/lib/api'
import { Plus, Pencil, Trash2, Trophy, ToggleLeft, ToggleRight, GripVertical, ChevronUp, ChevronDown, X, Save, Target, Calendar, Download, Image as ImageIcon, Share2 } from 'lucide-react'
import { generateQualificationPoster, downloadDataUrl } from '@/lib/posterGenerator'
import PartnerPickerModal, { PickedPartner } from '@/components/PartnerPickerModal'

const METRIC_TYPES = [
  { value: 'l1Paid',        label: 'Paid Referrals (L1)' },
  { value: 'totalEarnings', label: 'Total Earnings (₹)' },
  { value: 'l1Count',       label: 'Total L1 Partners' },
  { value: 'tierUpgrade',   label: 'Tier Upgrade' },
]
const REWARD_TYPES = [
  { value: 'bonus',       label: '💰 Cash Bonus' },
  { value: 'badge',       label: '🏅 Badge' },
  { value: 'certificate', label: '📜 Certificate' },
  { value: 'upgrade',     label: '⬆️ Upgrade' },
  { value: 'trophy',      label: '🏆 Trophy' },
  { value: 'feature',     label: '⭐ Feature' },
]
const GRADIENTS = [
  { value: 'from-sky-500 to-blue-600',      label: '🔵 Sky Blue' },
  { value: 'from-violet-500 to-purple-600', label: '🟣 Violet' },
  { value: 'from-amber-500 to-orange-500',  label: '🟠 Amber' },
  { value: 'from-emerald-500 to-teal-600',  label: '🟢 Emerald' },
  { value: 'from-rose-500 to-pink-600',     label: '🔴 Rose' },
  { value: 'from-yellow-400 to-amber-500',  label: '🟡 Gold' },
  { value: 'from-cyan-500 to-blue-600',     label: '🩵 Cyan' },
  { value: 'from-indigo-500 to-violet-600', label: '💙 Indigo' },
]

const BLANK = {
  title: '', description: '', icon: '🏆', reward: '',
  rewardType: 'badge', target: 1, metricType: 'l1Paid', unit: 'paid referrals',
  order: 0, isActive: true, badgeGradient: 'from-violet-500 to-purple-600', certificateEnabled: true,
  startDate: '', endDate: '',
}

const dateInput = (v: any) => v ? new Date(v).toISOString().slice(0, 10) : ''
const fmtRange = (s: any, e: any) => {
  if (!s && !e) return null
  const f = (d: any) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  if (s && e) return `${f(s)} → ${f(e)}`
  if (s) return `From ${f(s)}`
  return `Until ${f(e)}`
}

export default function QualificationsPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['admin-qualifications'], queryFn: () => adminAPI.qualifications().then(r => r.data) })
  const [modal, setModal] = useState<null | 'add' | 'edit'>(null)
  const [form, setForm] = useState<any>(BLANK)
  const [editId, setEditId] = useState('')

  const create = useMutation({ mutationFn: (d: any) => adminAPI.createQualification(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-qualifications'] }); setModal(null) } })
  const update = useMutation({ mutationFn: ({ id, d }: any) => adminAPI.updateQualification(id, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-qualifications'] }); setModal(null) } })
  const remove = useMutation({ mutationFn: (id: string) => adminAPI.deleteQualification(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-qualifications'] }) })
  const toggle = useMutation({ mutationFn: ({ id, v }: any) => adminAPI.updateQualification(id, { isActive: v }), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-qualifications'] }) })
  const reorder = useMutation({ mutationFn: ({ id, order }: any) => adminAPI.updateQualification(id, { order }), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-qualifications'] }) })

  const items: any[] = data?.qualifications || []

  // Poster download flow
  const [pickerOpen, setPickerOpen] = useState(false)
  const [posterTarget, setPosterTarget] = useState<any>(null)
  const [posterUrl, setPosterUrl] = useState<string | null>(null)
  const [posterPartner, setPosterPartner] = useState<PickedPartner | null>(null)
  const [posterLoading, setPosterLoading] = useState(false)

  const openPoster = (item: any) => { setPosterTarget(item); setPickerOpen(true) }
  const onPickPartner = async (p: PickedPartner) => {
    if (!posterTarget) return
    setPickerOpen(false)
    setPosterLoading(true)
    setPosterPartner(p)
    try {
      const idx = items.findIndex(i => i._id === posterTarget._id)
      const url = await generateQualificationPoster({
        userName: p.name || 'Partner',
        avatar: p.avatar,
        milestoneTitle: posterTarget.title,
        milestoneIcon: posterTarget.icon,
        reward: posterTarget.reward || '',
        affiliateCode: p.affiliateCode || '',
        themeIndex: idx >= 0 ? idx : 0,
      })
      setPosterUrl(url)
    } finally { setPosterLoading(false) }
  }

  const openAdd = () => { setForm({ ...BLANK, order: items.length }); setModal('add') }
  const openEdit = (item: any) => {
    setForm({ ...item, startDate: dateInput(item.startDate), endDate: dateInput(item.endDate) })
    setEditId(item._id); setModal('edit')
  }
  const submit = () => {
    const payload: any = { ...form }
    payload.startDate = form.startDate ? new Date(form.startDate) : null
    payload.endDate = form.endDate ? new Date(form.endDate) : null
    if (modal === 'add') create.mutate(payload)
    else update.mutate({ id: editId, d: payload })
  }
  const moveOrder = (item: any, dir: -1 | 1) => {
    reorder.mutate({ id: item._id, order: item.order + dir })
  }

  const inp = 'w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Qualifications</h1>
          <p className="text-gray-400 text-sm mt-1">Manage partner milestones, rewards & certificates</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Add Milestone
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-slate-800 rounded-xl animate-pulse" />)}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-slate-800/40 rounded-2xl border border-white/8">
          <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">No milestones yet</p>
          <p className="text-gray-500 text-sm mb-4">Add milestones that partners can achieve and earn rewards</p>
          <button onClick={openAdd} className="px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold">Add First Milestone</button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.sort((a, b) => a.order - b.order).map((item, idx) => (
            <div key={item._id} className={`bg-slate-800 rounded-2xl border ${item.isActive ? 'border-white/10' : 'border-white/5 opacity-60'} p-4`}>
              <div className="flex items-center gap-4">
                {/* Order controls */}
                <div className="flex flex-col gap-0.5 flex-shrink-0">
                  <button onClick={() => moveOrder(item, -1)} disabled={idx === 0} className="p-0.5 text-gray-600 hover:text-white disabled:opacity-20 transition-colors">
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => moveOrder(item, 1)} disabled={idx === items.length - 1} className="p-0.5 text-gray-600 hover:text-white disabled:opacity-20 transition-colors">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Badge icon */}
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.badgeGradient} flex items-center justify-center text-xl flex-shrink-0`}>
                  {item.icon}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-semibold">{item.title}</p>
                    {item.certificateEnabled && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/25 font-bold">📜 Certificate</span>
                    )}
                  </div>
                  <p className="text-gray-500 text-xs mt-0.5">{item.description}</p>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded-md">
                      <Target className="w-3 h-3 inline mr-1" />{item.target.toLocaleString()} {item.unit}
                    </span>
                    <span className="text-xs text-violet-400">🎁 {item.reward}</span>
                    {fmtRange(item.startDate, item.endDate) && (
                      <span className="text-[11px] text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-md">
                        <Calendar className="w-3 h-3 inline mr-1" />{fmtRange(item.startDate, item.endDate)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => openPoster(item)} title="Download poster for partner"
                    className="p-2 rounded-lg text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
                    <Download className="w-4 h-4" />
                  </button>
                  <button onClick={() => toggle.mutate({ id: item._id, v: !item.isActive })}
                    className={`transition-colors ${item.isActive ? 'text-green-400 hover:text-green-300' : 'text-gray-600 hover:text-gray-400'}`}>
                    {item.isActive ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                  </button>
                  <button onClick={() => openEdit(item)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => { if (confirm('Delete this milestone?')) remove.mutate(item._id) }}
                    className="p-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Partner picker for poster generation */}
      <PartnerPickerModal
        open={pickerOpen}
        onClose={() => { setPickerOpen(false); setPosterTarget(null) }}
        onPick={onPickPartner}
        title={posterTarget ? `Pick partner for "${posterTarget.title}"` : 'Select Partner'}
      />

      {/* Poster preview / download */}
      {(posterLoading || posterUrl) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => { setPosterUrl(null); setPosterPartner(null); setPosterTarget(null) }}>
          <div className="relative w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <button onClick={() => { setPosterUrl(null); setPosterPartner(null); setPosterTarget(null) }}
              className="absolute -top-4 -right-4 z-10 w-9 h-9 rounded-full bg-slate-800 border border-white/15 flex items-center justify-center text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
            {posterLoading ? (
              <div className="bg-slate-900 border border-violet-500/30 rounded-2xl p-8 text-center">
                <div className="w-12 h-12 rounded-full border-2 border-violet-500/30 border-t-violet-400 animate-spin mx-auto mb-3" />
                <p className="text-white font-semibold">Generating poster…</p>
                <p className="text-gray-500 text-xs mt-1">{posterPartner?.name}</p>
              </div>
            ) : posterUrl ? (
              <>
                <p className="text-white font-bold text-center mb-2 text-sm">{posterTarget?.title} · {posterPartner?.name}</p>
                <div className="rounded-2xl overflow-hidden border border-violet-500/30 shadow-2xl">
                  <img src={posterUrl} alt="Poster preview" className="w-full" />
                </div>
                <button onClick={() => downloadDataUrl(posterUrl, `trulearnix-${(posterTarget?.title || 'poster').replace(/\s+/g, '-').toLowerCase()}-${(posterPartner?.affiliateCode || posterPartner?.name || '').replace(/\s+/g, '-').toLowerCase()}.png`)}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-bold transition-all">
                  <Download className="w-4 h-4" /> Download PNG
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-white font-bold">{modal === 'add' ? 'Add Milestone' : 'Edit Milestone'}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Icon (emoji)</label>
                  <input value={form.icon} onChange={e => setForm((f: any) => ({ ...f, icon: e.target.value }))} className={inp} placeholder="🏆" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Title</label>
                  <input value={form.title} onChange={e => setForm((f: any) => ({ ...f, title: e.target.value }))} className={inp} placeholder="First Sale" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Description</label>
                <input value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} className={inp} placeholder="Describe the milestone..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Metric Type</label>
                  <select value={form.metricType} onChange={e => setForm((f: any) => ({ ...f, metricType: e.target.value }))} className={inp}>
                    {METRIC_TYPES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Target Value</label>
                  <input type="number" value={form.target} onChange={e => setForm((f: any) => ({ ...f, target: Number(e.target.value) }))} className={inp} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Unit Label (shown in progress)</label>
                <input value={form.unit} onChange={e => setForm((f: any) => ({ ...f, unit: e.target.value }))} className={inp} placeholder="paid referrals" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Reward Description</label>
                  <input value={form.reward} onChange={e => setForm((f: any) => ({ ...f, reward: e.target.value }))} className={inp} placeholder="₹500 Bonus" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Reward Type</label>
                  <select value={form.rewardType} onChange={e => setForm((f: any) => ({ ...f, rewardType: e.target.value }))} className={inp}>
                    {REWARD_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Badge Color</label>
                  <select value={form.badgeGradient} onChange={e => setForm((f: any) => ({ ...f, badgeGradient: e.target.value }))} className={inp}>
                    {GRADIENTS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Display Order</label>
                  <input type="number" value={form.order} onChange={e => setForm((f: any) => ({ ...f, order: Number(e.target.value) }))} className={inp} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" /> Active Window <span className="text-gray-600">(optional — leave blank for always-active)</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-gray-500 mb-1">Start date</p>
                    <input type="date" value={form.startDate || ''} onChange={e => setForm((f: any) => ({ ...f, startDate: e.target.value }))} className={inp + ' [color-scheme:dark]'} />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 mb-1">End date</p>
                    <input type="date" value={form.endDate || ''} onChange={e => setForm((f: any) => ({ ...f, endDate: e.target.value }))} className={inp + ' [color-scheme:dark]'} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm((f: any) => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 accent-violet-500" />
                  <span className="text-sm text-gray-300">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.certificateEnabled} onChange={e => setForm((f: any) => ({ ...f, certificateEnabled: e.target.checked }))} className="w-4 h-4 accent-amber-500" />
                  <span className="text-sm text-gray-300">Certificate Enabled</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-white/10">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white text-sm font-medium transition-colors">Cancel</button>
              <button onClick={submit} disabled={create.isPending || update.isPending}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors disabled:opacity-50">
                <Save className="w-4 h-4" />
                {create.isPending || update.isPending ? 'Saving...' : 'Save Milestone'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
