'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminAPI } from '@/lib/api'
import AdminLayout from '@/components/AdminLayout'
import { CalendarDays, Plus, Trash2, Loader2, Flag, Building2, RefreshCw, X } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

const NATIONAL_HOLIDAYS = [
  { name: 'Republic Day',         date: '01-26', type: 'national' },
  { name: 'Holi',                 date: '03-25', type: 'national' },
  { name: 'Good Friday',          date: '04-18', type: 'national' },
  { name: 'Eid ul-Fitr',         date: '04-21', type: 'national' },
  { name: 'Ambedkar Jayanti',     date: '04-14', type: 'national' },
  { name: 'Eid ul-Adha',         date: '06-28', type: 'national' },
  { name: 'Independence Day',     date: '08-15', type: 'national' },
  { name: 'Gandhi Jayanti',       date: '10-02', type: 'national' },
  { name: 'Dussehra',             date: '10-13', type: 'national' },
  { name: 'Diwali',               date: '10-20', type: 'national' },
  { name: 'Christmas',            date: '12-25', type: 'national' },
]

export default function HolidaysPage() {
  const qc = useQueryClient()
  const [year, setYear] = useState(new Date().getFullYear())
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', date: '', type: 'company', recurring: false })

  const { data, isLoading } = useQuery({
    queryKey: ['holidays', year],
    queryFn: () => adminAPI.holidays({ year }).then(r => r.data),
  })

  const createMut = useMutation({
    mutationFn: (data: any) => adminAPI.createHoliday(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['holidays'] })
      toast.success('Holiday added!')
      setForm({ name: '', date: '', type: 'company', recurring: false })
      setShowForm(false)
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminAPI.deleteHoliday(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['holidays'] })
      toast.success('Holiday removed')
    },
  })

  const addBulkNational = async () => {
    let added = 0
    for (const h of NATIONAL_HOLIDAYS) {
      try {
        const [mm, dd] = h.date.split('-')
        await adminAPI.createHoliday({
          name: h.name,
          date: `${year}-${mm}-${dd}`,
          type: 'national',
          recurring: true,
        })
        added++
      } catch {}
    }
    qc.invalidateQueries({ queryKey: ['holidays'] })
    toast.success(`${added} national holidays added!`)
  }

  const holidays = data?.holidays || []
  const national = holidays.filter((h: any) => h.type === 'national')
  const company  = holidays.filter((h: any) => h.type === 'company')

  const TYPE_CFG = {
    national: { label: 'National', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: Flag },
    company:  { label: 'Company',  color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   icon: Building2 },
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-orange-400" /> Holiday Calendar
            </h1>
            <p className="text-gray-500 text-sm mt-1">National & company holidays — these days won't deduct from salary</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Year picker */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
              <button onClick={() => setYear(y => y - 1)} className="text-gray-400 hover:text-white px-1">−</button>
              <span className="text-white font-bold min-w-[48px] text-center">{year}</span>
              <button onClick={() => setYear(y => y + 1)} className="text-gray-400 hover:text-white px-1">+</button>
            </div>
            <button onClick={addBulkNational}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 rounded-xl text-sm font-semibold transition-colors">
              <RefreshCw className="w-4 h-4" /> Add National Holidays
            </button>
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold transition-colors">
              <Plus className="w-4 h-4" /> Add Holiday
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Holidays', value: holidays.length, color: 'text-violet-400', bg: 'bg-violet-500/10' },
            { label: 'National',       value: national.length, color: 'text-orange-400', bg: 'bg-orange-500/10' },
            { label: 'Company',        value: company.length,  color: 'text-blue-400',   bg: 'bg-blue-500/10' },
            { label: 'Recurring',      value: holidays.filter((h: any) => h.recurring).length, color: 'text-green-400', bg: 'bg-green-500/10' },
          ].map(s => (
            <div key={s.label} className={clsx('rounded-2xl border border-white/10 p-4', s.bg)}>
              <p className={clsx('text-2xl font-black', s.color)}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Holidays by month */}
        {isLoading ? (
          <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin text-violet-400 mx-auto" /></div>
        ) : holidays.length === 0 ? (
          <div className="text-center py-16 bg-white/3 border border-white/10 rounded-2xl">
            <CalendarDays className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No holidays added for {year}</p>
            <button onClick={addBulkNational}
              className="mt-4 px-4 py-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-xl text-sm font-semibold">
              Auto-add National Holidays
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {Array.from({ length: 12 }, (_, i) => i + 1)
              .filter(m => holidays.some((h: any) => {
                const d = new Date(h.date)
                if (h.recurring) { d.setFullYear(year) }
                return d.getMonth() + 1 === m
              }))
              .map(m => {
                const monthHols = holidays.filter((h: any) => {
                  const d = new Date(h.date)
                  if (h.recurring) { d.setFullYear(year) }
                  return d.getMonth() + 1 === m
                }).sort((a: any, b: any) => new Date(a.date).getDate() - new Date(b.date).getDate())

                return (
                  <div key={m} className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-white/10 bg-white/2">
                      <h3 className="text-sm font-bold text-white">{MONTHS[m]} {year}</h3>
                    </div>
                    <div className="divide-y divide-white/5">
                      {monthHols.map((h: any) => {
                        const cfg = TYPE_CFG[h.type as keyof typeof TYPE_CFG]
                        const Icon = cfg.icon
                        const d = new Date(h.date)
                        if (h.recurring) d.setFullYear(year)
                        const dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()]
                        return (
                          <div key={h._id} className="flex items-center justify-between px-5 py-3 hover:bg-white/3 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', cfg.bg, cfg.border, 'border')}>
                                <Icon className={clsx('w-4 h-4', cfg.color)} />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-white">{h.name}</p>
                                <p className="text-xs text-gray-500">
                                  {dayName}, {d.getDate()} {MONTHS[d.getMonth() + 1]} {year}
                                  {h.recurring && <span className="ml-2 text-green-400">● Recurring yearly</span>}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full border', cfg.bg, cfg.color, cfg.border)}>
                                {cfg.label}
                              </span>
                              <button onClick={() => deleteMut.mutate(h._id)}
                                disabled={deleteMut.isPending}
                                className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
          </div>
        )}

        {/* Add Holiday Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[#0d1929] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-black text-white">Add Holiday</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5 font-medium">Holiday Name</label>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Diwali, Company Anniversary" className="input w-full" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5 font-medium">Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                    className="input w-full" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5 font-medium">Type</label>
                  <div className="flex gap-3">
                    {[{ value: 'national', label: 'National Holiday', icon: Flag }, { value: 'company', label: 'Company Holiday', icon: Building2 }].map(t => (
                      <button key={t.value} onClick={() => setForm(p => ({ ...p, type: t.value }))}
                        className={clsx('flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all',
                          form.type === t.value
                            ? 'bg-violet-600 border-violet-500 text-white'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white')}>
                        <t.icon className="w-4 h-4" />
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/3 rounded-xl">
                  <input type="checkbox" id="recurring" checked={form.recurring}
                    onChange={e => setForm(p => ({ ...p, recurring: e.target.checked }))}
                    className="w-4 h-4 accent-violet-500" />
                  <label htmlFor="recurring" className="text-sm text-gray-300 cursor-pointer">
                    Recurring yearly (repeat every year)
                  </label>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-sm font-semibold hover:text-white transition-colors">
                  Cancel
                </button>
                <button onClick={() => createMut.mutate(form)} disabled={createMut.isPending || !form.name || !form.date}
                  className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2">
                  {createMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Add Holiday
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
