'use client'
import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { adminAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import { Plus, X, Tag, Copy, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'

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
}

const empty = { code: '', type: 'percent', value: 10, maxUses: 100, minOrderValue: 0, expiresAt: '', applicableTiers: [] as string[] }

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<any>(empty)

  useEffect(() => { fetch() }, [])

  const fetch = async () => {
    try {
      const res = await adminAPI.coupons()
      setCoupons(res.data.data || [])
    } catch { toast.error('Failed to load coupons') }
    finally { setLoading(false) }
  }

  const save = async () => {
    if (!form.code || !form.value || !form.expiresAt) return toast.error('Fill all required fields')
    try {
      await adminAPI.createCoupon(form)
      toast.success('Coupon created!')
      setShowForm(false)
      setForm(empty)
      fetch()
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed') }
  }

  const toggle = async (id: string, current: boolean) => {
    try {
      await adminAPI.updateCoupon(id, { isActive: !current })
      setCoupons(prev => prev.map(c => c._id === id ? { ...c, isActive: !current } : c))
    } catch { toast.error('Failed') }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this coupon?')) return
    try {
      await adminAPI.deleteCoupon(id)
      setCoupons(prev => prev.filter(c => c._id !== id))
      toast.success('Deleted')
    } catch { toast.error('Failed') }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('Copied!')
  }

  const tierToggle = (tier: string) => {
    setForm((p: any) => ({
      ...p,
      applicableTiers: p.applicableTiers.includes(tier)
        ? p.applicableTiers.filter((t: string) => t !== tier)
        : [...p.applicableTiers, tier]
    }))
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* ── Page Header ── */}
        <div className="page-header">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-pink-600 flex items-center justify-center shadow-lg">
                  <Tag className="w-5 h-5 text-white" />
                </div>
                Coupon Management
              </h1>
              <p className="text-gray-400 text-sm mt-1">{coupons.length} coupons — drive conversions with discounts</p>
            </div>
            <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Coupon
            </button>
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-lg border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-white font-bold">Create Coupon</h2>
                <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-gray-400" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-gray-400 mb-1 block">Coupon Code *</label>
                  <input value={form.code} onChange={e => setForm((p: any) => ({ ...p, code: e.target.value.toUpperCase() }))}
                    placeholder="SAVE20" className="w-full bg-slate-700 text-white rounded-xl px-4 py-2.5 text-sm border border-white/10 outline-none focus:border-violet-500 font-mono uppercase" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Type</label>
                  <select value={form.type} onChange={e => setForm((p: any) => ({ ...p, type: e.target.value }))}
                    className="w-full bg-slate-700 text-white rounded-xl px-3 py-2.5 text-sm border border-white/10 outline-none">
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Flat (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Value *</label>
                  <input type="number" value={form.value} onChange={e => setForm((p: any) => ({ ...p, value: +e.target.value }))}
                    className="w-full bg-slate-700 text-white rounded-xl px-4 py-2.5 text-sm border border-white/10 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Max Uses</label>
                  <input type="number" value={form.maxUses} onChange={e => setForm((p: any) => ({ ...p, maxUses: +e.target.value }))}
                    className="w-full bg-slate-700 text-white rounded-xl px-4 py-2.5 text-sm border border-white/10 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Min Order (₹)</label>
                  <input type="number" value={form.minOrderValue} onChange={e => setForm((p: any) => ({ ...p, minOrderValue: +e.target.value }))}
                    className="w-full bg-slate-700 text-white rounded-xl px-4 py-2.5 text-sm border border-white/10 outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-400 mb-1 block">Expires At *</label>
                  <input type="datetime-local" value={form.expiresAt} onChange={e => setForm((p: any) => ({ ...p, expiresAt: e.target.value }))}
                    className="w-full bg-slate-700 text-white rounded-xl px-4 py-2.5 text-sm border border-white/10 outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-2 block">Applicable Tiers (leave empty for all)</label>
                <div className="flex gap-2 flex-wrap">
                  {['starter', 'pro', 'elite', 'supreme'].map(tier => (
                    <button key={tier} onClick={() => tierToggle(tier)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${form.applicableTiers.includes(tier) ? 'bg-violet-600 text-white' : 'bg-slate-700 text-gray-400 hover:bg-slate-600'}`}>
                      {tier}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm">Cancel</button>
                <button onClick={save} className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700">Create Coupon</button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {coupons.map(c => (
              <div key={c._id} className={`bg-slate-800 rounded-2xl p-5 border ${c.isActive ? 'border-violet-500/30' : 'border-white/5 opacity-60'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-violet-400" />
                    <span className="text-white font-bold font-mono text-lg">{c.code}</span>
                    <button onClick={() => copyCode(c.code)} className="text-gray-500 hover:text-gray-300">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggle(c._id, c.isActive)}>{c.isActive ? <ToggleRight className="w-5 h-5 text-violet-400" /> : <ToggleLeft className="w-5 h-5 text-gray-500" />}</button>
                    <button onClick={() => remove(c._id)}><Trash2 className="w-4 h-4 text-gray-500 hover:text-red-400" /></button>
                  </div>
                </div>
                <div className="text-2xl font-bold text-violet-400 mb-1">
                  {c.type === 'percent' ? `${c.value}% OFF` : `₹${c.value} OFF`}
                </div>
                <div className="space-y-1 text-xs text-gray-400">
                  <p>Uses: <span className="text-white">{c.usedCount}/{c.maxUses}</span></p>
                  {c.minOrderValue > 0 && <p>Min order: <span className="text-white">₹{c.minOrderValue}</span></p>}
                  <p>Expires: <span className="text-white">{new Date(c.expiresAt).toLocaleDateString()}</span></p>
                  {c.applicableTiers.length > 0 && <p>Tiers: <span className="text-violet-400 capitalize">{c.applicableTiers.join(', ')}</span></p>}
                </div>
                <div className="mt-3 bg-slate-700 rounded-full h-1.5">
                  <div className="bg-violet-500 h-1.5 rounded-full" style={{ width: `${(c.usedCount / c.maxUses) * 100}%` }} />
                </div>
              </div>
            ))}
            {coupons.length === 0 && (
              <div className="col-span-3 text-center py-16 text-gray-500">No coupons yet. Create your first coupon!</div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
