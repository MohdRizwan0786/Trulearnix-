'use client'
import AdminLayout from '@/components/AdminLayout'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminAPI } from '@/lib/api'
import { Trophy, Plus, Pencil, Trash2, X, Save, ToggleLeft, ToggleRight, Sparkles, Calendar, Download } from 'lucide-react'
import { generateAchievementPoster, downloadDataUrl } from '@/lib/posterGenerator'
import PartnerPickerModal, { PickedPartner } from '@/components/PartnerPickerModal'

const TRIGGER_TYPES = [
  { value: 'join',          label: 'On Join (Welcome)',       hint: 'Unlocked when partner joins' },
  { value: 'first_earn',    label: 'First Earning',           hint: 'When partner earns any Partnership earning' },
  { value: 'earn_amount',   label: 'Earning Milestone (₹)',   hint: 'When totalEarnings >= value' },
  { value: 'referrals',     label: 'Total Referrals',         hint: 'When direct referrals >= value' },
  { value: 'paid_referrals',label: 'Paid Referrals',          hint: 'When paid referrals >= value' },
  { value: 'tier',          label: 'Package Upgrade (Pro+)',  hint: 'When partner upgrades to Pro/Elite/Supreme' },
]

const POSTER_THEMES = [
  { value: 0, label: 'Violet / Purple',   preview: 'linear-gradient(135deg,#7c3aed,#4f46e5)' },
  { value: 1, label: 'Cyan / Blue',       preview: 'linear-gradient(135deg,#06b6d4,#2563eb)' },
  { value: 2, label: 'Amber / Orange',    preview: 'linear-gradient(135deg,#f59e0b,#ea580c)' },
  { value: 3, label: 'Emerald / Teal',    preview: 'linear-gradient(135deg,#10b981,#0d9488)' },
  { value: 4, label: 'Rose / Pink',       preview: 'linear-gradient(135deg,#f43f5e,#ec4899)' },
  { value: 5, label: 'Sky / Indigo',      preview: 'linear-gradient(135deg,#0ea5e9,#4f46e5)' },
]

const EMPTY_FORM = { title: '', description: '', badge: '🏆', triggerType: 'join', triggerValue: 0, requirement: '', posterTheme: 0, order: 0, enabled: true, startDate: '', endDate: '' }

const dateInput = (v: any) => v ? new Date(v).toISOString().slice(0, 10) : ''
const fmtRange = (s: any, e: any) => {
  if (!s && !e) return null
  const f = (d: any) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  if (s && e) return `${f(s)} → ${f(e)}`
  if (s) return `From ${f(s)}`
  return `Until ${f(e)}`
}

export default function AchievementsPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<null | 'create' | 'edit'>(null)
  const [form, setForm] = useState<any>(EMPTY_FORM)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const { data, isLoading } = useQuery({ queryKey: ['admin-achievements'], queryFn: () => adminAPI.achievements().then(r => r.data) })
  const achievements: any[] = data?.achievements || []

  const createMut = useMutation({ mutationFn: (d: any) => adminAPI.createAchievement(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-achievements'] }); setModal(null) } })
  const updateMut = useMutation({ mutationFn: ({ id, d }: any) => adminAPI.updateAchievement(id, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-achievements'] }); setModal(null) } })
  const deleteMut = useMutation({ mutationFn: (id: string) => adminAPI.deleteAchievement(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-achievements'] }) })
  const toggleMut = useMutation({ mutationFn: ({ id, enabled }: any) => adminAPI.updateAchievement(id, { enabled }), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-achievements'] }) })

  // Poster download flow
  const [pickerOpen, setPickerOpen] = useState(false)
  const [posterTarget, setPosterTarget] = useState<any>(null)
  const [posterUrl, setPosterUrl] = useState<string | null>(null)
  const [posterPartner, setPosterPartner] = useState<PickedPartner | null>(null)
  const [posterLoading, setPosterLoading] = useState(false)

  const openPoster = (a: any) => { setPosterTarget(a); setPickerOpen(true) }
  const onPickPartner = async (p: PickedPartner) => {
    if (!posterTarget) return
    setPickerOpen(false)
    setPosterLoading(true)
    setPosterPartner(p)
    try {
      const url = await generateAchievementPoster({
        userName: p.name || 'Partner',
        avatar: p.avatar,
        badge: posterTarget.badge,
        title: posterTarget.title,
        description: posterTarget.description || '',
        earnedAt: new Date(),
        affiliateCode: p.affiliateCode || '',
        themeIndex: posterTarget.posterTheme || 0,
      })
      setPosterUrl(url)
    } finally { setPosterLoading(false) }
  }
  const closePoster = () => { setPosterUrl(null); setPosterPartner(null); setPosterTarget(null) }

  const openCreate = () => { setForm(EMPTY_FORM); setEditId(null); setModal('create') }
  const openEdit = (a: any) => { setForm({ title: a.title, description: a.description, badge: a.badge, triggerType: a.triggerType, triggerValue: a.triggerValue, requirement: a.requirement, posterTheme: a.posterTheme, order: a.order, enabled: a.enabled, startDate: dateInput(a.startDate), endDate: dateInput(a.endDate) }); setEditId(a._id); setModal('edit') }
  const save = () => {
    const payload: any = {
      ...form,
      triggerValue: Number(form.triggerValue),
      posterTheme: Number(form.posterTheme),
      order: Number(form.order),
      startDate: form.startDate ? new Date(form.startDate) : null,
      endDate: form.endDate ? new Date(form.endDate) : null,
    }
    if (modal === 'create') createMut.mutate(payload)
    else if (editId) updateMut.mutate({ id: editId, d: payload })
  }

  const needsValue = ['earn_amount','referrals','paid_referrals'].includes(form.triggerType)

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Trophy className="w-6 h-6 text-amber-400" /> Partner Achievements</h1>
            <p className="text-gray-400 text-sm mt-0.5">Manage achievements and poster themes for partners</p>
          </div>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold">
            <Plus className="w-4 h-4" /> New Achievement
          </button>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(6)].map((_,i) => <div key={i} className="h-28 bg-gray-800/50 rounded-2xl animate-pulse" />)}
          </div>
        ) : achievements.length === 0 ? (
          <div className="text-center py-16 bg-gray-800/30 rounded-2xl border border-gray-700/50">
            <Sparkles className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-white font-semibold">No achievements yet</p>
            <p className="text-gray-500 text-sm mt-1">Create your first achievement to get started</p>
            <button onClick={openCreate} className="mt-4 btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create Achievement
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {achievements.map((a: any) => {
              const theme = POSTER_THEMES[a.posterTheme % 6]
              return (
                <div key={a._id} className={`relative rounded-2xl border p-4 transition-all ${a.enabled ? 'bg-gray-800/60 border-gray-700/60' : 'bg-gray-900/40 border-gray-800 opacity-60'}`}>
                  <div className="flex items-start gap-3">
                    {/* Badge preview */}
                    <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl" style={{ background: theme.preview }}>
                      {a.badge}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-bold text-sm">{a.title}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${a.enabled ? 'bg-green-500/15 text-green-400' : 'bg-gray-700 text-gray-500'}`}>
                          {a.enabled ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{a.description}</p>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="text-[11px] text-gray-500 bg-gray-700/50 px-2 py-0.5 rounded-lg">
                          {TRIGGER_TYPES.find(t => t.value === a.triggerType)?.label}
                          {needsValue && a.triggerValue > 0 ? ` ≥ ${a.triggerValue.toLocaleString()}` : ''}
                        </span>
                        <span className="text-[11px] rounded-full px-2 py-0.5 text-white font-semibold" style={{ background: theme.preview }}>
                          {theme.label}
                        </span>
                        {fmtRange(a.startDate, a.endDate) && (
                          <span className="text-[11px] text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1">
                            <Calendar className="w-3 h-3" />{fmtRange(a.startDate, a.endDate)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => openPoster(a)} title="Download poster for partner"
                        className="p-1.5 rounded-lg hover:bg-amber-500/10 text-gray-400 hover:text-amber-400 transition-colors">
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => toggleMut.mutate({ id: a._id, enabled: !a.enabled })}
                        className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 hover:text-white">
                        {a.enabled ? <ToggleRight className="w-4 h-4 text-green-400" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                      <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 hover:text-violet-400">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { if (deleting === a._id) { deleteMut.mutate(a._id); setDeleting(null) } else setDeleting(a._id) }}
                        className={`p-1.5 rounded-lg transition-colors ${deleting === a._id ? 'bg-red-500/20 text-red-400' : 'hover:bg-gray-700 text-gray-500 hover:text-red-400'}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {deleting === a._id && (
                    <div className="mt-2.5 flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                      <span className="flex-1">Click delete again to confirm</span>
                      <button onClick={() => setDeleting(null)} className="text-gray-500 hover:text-white"><X className="w-3 h-3" /></button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <h2 className="text-white font-bold">{modal === 'create' ? 'New Achievement' : 'Edit Achievement'}</h2>
              <button onClick={() => setModal(null)} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Badge + Title */}
              <div className="flex gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Badge</label>
                  <input value={form.badge} onChange={e => setForm((f: any) => ({...f, badge: e.target.value}))}
                    className="input w-16 text-center text-2xl" placeholder="🏆" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-400 mb-1">Title *</label>
                  <input value={form.title} onChange={e => setForm((f: any) => ({...f, title: e.target.value}))}
                    className="input w-full" placeholder="e.g. Lakhpati Partner" />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Description</label>
                <input value={form.description} onChange={e => setForm((f: any) => ({...f, description: e.target.value}))}
                  className="input w-full" placeholder="e.g. Crossed ₹1,00,000 in earnings!" />
              </div>

              {/* Trigger Type */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Trigger (when to unlock)</label>
                <select value={form.triggerType} onChange={e => setForm((f: any) => ({...f, triggerType: e.target.value}))} className="input w-full">
                  {TRIGGER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <p className="text-[11px] text-gray-600 mt-1">{TRIGGER_TYPES.find(t => t.value === form.triggerType)?.hint}</p>
              </div>

              {/* Trigger Value */}
              {needsValue && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    {form.triggerType === 'earn_amount' ? 'Amount (₹)' : 'Count'}
                  </label>
                  <input type="number" value={form.triggerValue} onChange={e => setForm((f: any) => ({...f, triggerValue: e.target.value}))}
                    className="input w-full" placeholder={form.triggerType === 'earn_amount' ? '100000' : '10'} min="1" />
                </div>
              )}

              {/* Requirement text */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Requirement Label (shown on locked card)</label>
                <input value={form.requirement} onChange={e => setForm((f: any) => ({...f, requirement: e.target.value}))}
                  className="input w-full" placeholder="e.g. Earn ₹1 Lakh" />
              </div>

              {/* Poster Theme */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">Poster Color Theme</label>
                <div className="grid grid-cols-3 gap-2">
                  {POSTER_THEMES.map(t => (
                    <button key={t.value} onClick={() => setForm((f: any) => ({...f, posterTheme: t.value}))}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${form.posterTheme === t.value ? 'border-white/30 bg-white/10' : 'border-white/8 hover:border-white/15'}`}>
                      <div className="w-6 h-6 rounded-lg flex-shrink-0" style={{ background: t.preview }} />
                      <span className="text-[11px] text-gray-300 text-left leading-tight">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Window */}
              <div>
                <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" /> Active Window <span className="text-gray-600">(optional)</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-gray-500 mb-1">Start date</p>
                    <input type="date" value={form.startDate || ''} onChange={e => setForm((f: any) => ({...f, startDate: e.target.value}))} className="input w-full [color-scheme:dark]" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 mb-1">End date</p>
                    <input type="date" value={form.endDate || ''} onChange={e => setForm((f: any) => ({...f, endDate: e.target.value}))} className="input w-full [color-scheme:dark]" />
                  </div>
                </div>
              </div>

              {/* Order */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Display Order</label>
                  <input type="number" value={form.order} onChange={e => setForm((f: any) => ({...f, order: e.target.value}))}
                    className="input w-full" min="0" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Status</label>
                  <select value={form.enabled ? 'true' : 'false'} onChange={e => setForm((f: any) => ({...f, enabled: e.target.value === 'true'}))} className="input w-full">
                    <option value="true">Active</option>
                    <option value="false">Disabled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-800 flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-400 hover:bg-gray-700 text-sm font-semibold transition-all">Cancel</button>
              <button onClick={save} disabled={!form.title || createMut.isPending || updateMut.isPending}
                className="flex-1 py-2.5 rounded-xl btn-primary text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                <Save className="w-4 h-4" /> {createMut.isPending || updateMut.isPending ? 'Saving...' : 'Save Achievement'}
              </button>
            </div>
          </div>
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={closePoster}>
          <div className="relative w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <button onClick={closePoster}
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
    </AdminLayout>
  )
}
