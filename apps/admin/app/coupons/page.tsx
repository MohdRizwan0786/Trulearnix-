'use client'
import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { adminAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import { Plus, X, Tag, Copy, ToggleLeft, ToggleRight, Trash2, Pencil, Ticket } from 'lucide-react'

interface Coupon {
  _id: string
  code: string
  type: 'percent' | 'flat'
  value: number
  maxUses: number
  usedCount: number
  minOrderValue: number
  expiresAt: string
  isActive: boolean
  applicableTiers: string[]
  description?: string
}

const TIERS = [
  { tier: 'starter', name: 'Starter' },
  { tier: 'pro', name: 'Pro' },
  { tier: 'elite', name: 'Elite' },
  { tier: 'supreme', name: 'Supreme' },
]

const emptyForm = {
  code: '', type: 'percent', value: 10, maxUses: 100,
  minOrderValue: 0, expiresAt: '', applicableTiers: [] as string[], description: '',
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<any>(emptyForm)
  const [saving, setSaving] = useState(false)

  const loadCoupons = async () => {
    try {
      const res = await adminAPI.coupons()
      setCoupons(res.data.data || [])
    } catch { toast.error('Failed to load coupons') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadCoupons() }, [])

  const openCreate = () => {
    setEditId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (c: Coupon) => {
    setEditId(c._id)
    setForm({
      code: c.code,
      type: c.type,
      value: c.value,
      maxUses: c.maxUses,
      minOrderValue: c.minOrderValue,
      expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString().slice(0, 16) : '',
      applicableTiers: c.applicableTiers || [],
      description: (c as any).description || '',
    })
    setShowForm(true)
  }

  const save = async () => {
    if (!form.code || !form.value || !form.expiresAt) return toast.error('Code, value and expiry are required')
    setSaving(true)
    try {
      if (editId) {
        await adminAPI.updateCoupon(editId, form)
        toast.success('Coupon updated!')
      } else {
        await adminAPI.createCoupon(form)
        toast.success('Coupon created!')
      }
      setShowForm(false)
      setForm(emptyForm)
      setEditId(null)
      loadCoupons()
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to save coupon') }
    finally { setSaving(false) }
  }

  const toggle = async (id: string, current: boolean) => {
    try {
      await adminAPI.updateCoupon(id, { isActive: !current })
      setCoupons(prev => prev.map(c => c._id === id ? { ...c, isActive: !current } : c))
      toast.success(current ? 'Coupon deactivated' : 'Coupon activated')
    } catch { toast.error('Failed to update coupon') }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this coupon permanently?')) return
    try {
      await adminAPI.deleteCoupon(id)
      setCoupons(prev => prev.filter(c => c._id !== id))
      toast.success('Coupon deleted')
    } catch { toast.error('Failed to delete coupon') }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('Code copied!')
  }

  const tierToggle = (tier: string) => {
    setForm((p: any) => ({
      ...p,
      applicableTiers: p.applicableTiers.includes(tier)
        ? p.applicableTiers.filter((t: string) => t !== tier)
        : [...p.applicableTiers, tier],
    }))
  }

  const isExpired = (expiresAt: string) => new Date() > new Date(expiresAt)

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="page-header">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-pink-600 flex items-center justify-center shadow-lg">
                  <Tag className="w-5 h-5 text-white" />
                </div>
                Coupon Management
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                {coupons.length} coupon{coupons.length !== 1 ? 's' : ''} — drive conversions with discounts
              </p>
            </div>
            <button onClick={openCreate} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Coupon
            </button>
          </div>
        </div>

        {/* Create / Edit Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-lg border border-white/10 space-y-4 my-auto">
              <div className="flex items-center justify-between">
                <h2 className="text-white font-bold text-lg flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-violet-400" />
                  {editId ? 'Edit Coupon' : 'Create Coupon'}
                </h2>
                <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-gray-400" /></button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-gray-400 mb-1 block">Coupon Code *</label>
                  <input
                    value={form.code}
                    onChange={e => setForm((p: any) => ({ ...p, code: e.target.value.toUpperCase().replace(/\s/g, '') }))}
                    placeholder="e.g. SAVE20"
                    disabled={!!editId}
                    className="w-full bg-slate-700 disabled:opacity-50 text-white rounded-xl px-4 py-2.5 text-sm border border-white/10 outline-none focus:border-violet-500 font-mono uppercase"
                  />
                  {editId && <p className="text-xs text-gray-500 mt-1">Code cannot be changed after creation</p>}
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Discount Type</label>
                  <select value={form.type} onChange={e => setForm((p: any) => ({ ...p, type: e.target.value }))}
                    className="w-full bg-slate-700 text-white rounded-xl px-3 py-2.5 text-sm border border-white/10 outline-none">
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1 block">
                    Value * {form.type === 'percent' ? '(%)' : '(₹)'}
                  </label>
                  <input type="number" min="1" value={form.value}
                    onChange={e => setForm((p: any) => ({ ...p, value: +e.target.value }))}
                    className="w-full bg-slate-700 text-white rounded-xl px-4 py-2.5 text-sm border border-white/10 outline-none" />
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Max Uses</label>
                  <input type="number" min="1" value={form.maxUses}
                    onChange={e => setForm((p: any) => ({ ...p, maxUses: +e.target.value }))}
                    className="w-full bg-slate-700 text-white rounded-xl px-4 py-2.5 text-sm border border-white/10 outline-none" />
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Min Order Value (₹)</label>
                  <input type="number" min="0" value={form.minOrderValue}
                    onChange={e => setForm((p: any) => ({ ...p, minOrderValue: +e.target.value }))}
                    className="w-full bg-slate-700 text-white rounded-xl px-4 py-2.5 text-sm border border-white/10 outline-none" />
                </div>

                <div className="col-span-2">
                  <label className="text-xs text-gray-400 mb-1 block">Expires At *</label>
                  <input type="datetime-local" value={form.expiresAt}
                    onChange={e => setForm((p: any) => ({ ...p, expiresAt: e.target.value }))}
                    className="w-full bg-slate-700 text-white rounded-xl px-4 py-2.5 text-sm border border-white/10 outline-none" />
                </div>

                <div className="col-span-2">
                  <label className="text-xs text-gray-400 mb-1 block">Description (optional)</label>
                  <input value={form.description}
                    onChange={e => setForm((p: any) => ({ ...p, description: e.target.value }))}
                    placeholder="e.g. Independence Day offer"
                    className="w-full bg-slate-700 text-white rounded-xl px-4 py-2.5 text-sm border border-white/10 outline-none" />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-2 block">
                  Applicable Packages{' '}
                  <span className="text-gray-500">(leave empty = all packages &amp; courses)</span>
                </label>
                <div className="flex gap-2 flex-wrap">
                  {TIERS.map(({ tier, name }) => (
                    <button key={tier} type="button" onClick={() => tierToggle(tier)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                        form.applicableTiers.includes(tier)
                          ? 'bg-violet-600 text-white'
                          : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                      }`}>
                      {name}
                    </button>
                  ))}
                </div>
                {form.applicableTiers.length === 0 && (
                  <p className="text-xs text-emerald-400 mt-1.5">✓ Applies to all packages and courses</p>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:bg-white/5 transition-colors">
                  Cancel
                </button>
                <button onClick={save} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 transition-colors">
                  {saving ? 'Saving…' : editId ? 'Save Changes' : 'Create Coupon'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {coupons.map(c => {
              const expired = isExpired(c.expiresAt)
              const full = c.usedCount >= c.maxUses
              const pct = Math.min((c.usedCount / c.maxUses) * 100, 100)

              return (
                <div key={c._id} className={`bg-slate-800 rounded-2xl p-5 border transition-opacity ${
                  (!c.isActive || expired || full)
                    ? 'border-white/5 opacity-60'
                    : 'border-violet-500/30'
                }`}>
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Tag className="w-4 h-4 text-violet-400 shrink-0" />
                      <span className="text-white font-bold font-mono text-lg truncate">{c.code}</span>
                      <button onClick={() => copyCode(c.code)} title="Copy code"
                        className="text-gray-500 hover:text-gray-300 shrink-0">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <button onClick={() => openEdit(c)} title="Edit" className="text-gray-500 hover:text-blue-400">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => toggle(c._id, c.isActive)} title={c.isActive ? 'Deactivate' : 'Activate'}>
                        {c.isActive
                          ? <ToggleRight className="w-5 h-5 text-violet-400" />
                          : <ToggleLeft className="w-5 h-5 text-gray-500" />}
                      </button>
                      <button onClick={() => remove(c._id)} title="Delete" className="text-gray-500 hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Discount value */}
                  <div className="text-2xl font-bold text-violet-400 mb-2">
                    {c.type === 'percent' ? `${c.value}% OFF` : `₹${c.value} OFF`}
                  </div>

                  {/* Description */}
                  {(c as any).description && (
                    <p className="text-xs text-gray-400 mb-2 italic">{(c as any).description}</p>
                  )}

                  {/* Status badges */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {!c.isActive && (
                      <span className="px-2 py-0.5 rounded-full bg-gray-700 text-gray-400 text-xs">Inactive</span>
                    )}
                    {expired && (
                      <span className="px-2 py-0.5 rounded-full bg-red-900/40 text-red-400 text-xs">Expired</span>
                    )}
                    {full && (
                      <span className="px-2 py-0.5 rounded-full bg-orange-900/40 text-orange-400 text-xs">Limit Reached</span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-1 text-xs text-gray-400">
                    <p>Uses: <span className="text-white">{c.usedCount} / {c.maxUses}</span></p>
                    {c.minOrderValue > 0 && (
                      <p>Min order: <span className="text-white">₹{c.minOrderValue}</span></p>
                    )}
                    <p>
                      Expires:{' '}
                      <span className={expired ? 'text-red-400' : 'text-white'}>
                        {new Date(c.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </p>
                    <p>
                      Applies to:{' '}
                      <span className="text-violet-400">
                        {c.applicableTiers.length > 0
                          ? c.applicableTiers.map(t => TIERS.find(p => p.tier === t)?.name || t).join(', ')
                          : 'All packages & courses'}
                      </span>
                    </p>
                  </div>

                  {/* Usage bar */}
                  <div className="mt-3 bg-slate-700 rounded-full h-1.5">
                    <div className="bg-violet-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}

            {coupons.length === 0 && (
              <div className="col-span-3 text-center py-20">
                <Ticket className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">No coupons yet. Create your first discount coupon!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
