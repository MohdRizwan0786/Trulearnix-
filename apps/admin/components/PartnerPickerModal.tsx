'use client'
import { useEffect, useState } from 'react'
import { adminAPI } from '@/lib/api'
import { Search, X, User } from 'lucide-react'

export interface PickedPartner {
  _id: string
  name: string
  email?: string
  affiliateCode?: string
  avatar?: string
  packageTier?: string
}

export interface QualificationFilter {
  _id: string
  title: string
  metricType: 'l1Paid' | 'totalEarnings' | 'l1Count' | 'tierUpgrade'
  target: number
  unit?: string
}

export interface AchievementFilter {
  _id: string
  title: string
  triggerType: 'join' | 'first_earn' | 'earn_amount' | 'referrals' | 'paid_referrals' | 'tier'
  triggerValue: number
}

const fmtMetric = (qual: QualificationFilter | undefined, value: number) => {
  if (!qual) return ''
  if (qual.metricType === 'totalEarnings') return `₹${(value || 0).toLocaleString('en-IN')}`
  if (qual.metricType === 'l1Count' || qual.metricType === 'l1Paid') {
    const unit = qual.unit || (qual.metricType === 'l1Paid' ? 'paid' : 'partners')
    return `${value} ${unit}`
  }
  return ''
}

const fmtAchievementMetric = (ach: AchievementFilter | undefined, value: number) => {
  if (!ach) return ''
  switch (ach.triggerType) {
    case 'first_earn':
    case 'earn_amount':  return `₹${(value || 0).toLocaleString('en-IN')}`
    case 'referrals':    return `${value} partners`
    case 'paid_referrals': return `${value} paid`
    default: return ''
  }
}

export default function PartnerPickerModal({ open, onClose, onPick, title = 'Select Partner', qualification, achievement }: {
  open: boolean
  onClose: () => void
  onPick: (partner: PickedPartner) => void
  title?: string
  qualification?: QualificationFilter
  achievement?: AchievementFilter
}) {
  const [search, setSearch] = useState('')
  const [partners, setPartners] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => {
      setLoading(true)
      const fetcher = achievement
        ? adminAPI.eligiblePartnersForAchievement(achievement._id, { search, limit: 30 })
        : qualification
          ? adminAPI.qualifiedPartners(qualification._id, { search, limit: 30 })
          : adminAPI.partners({ search, limit: 30 })
      fetcher
        .then(r => setPartners(r.data?.partners || []))
        .catch(() => setPartners([]))
        .finally(() => setLoading(false))
    }, 250)
    return () => clearTimeout(t)
  }, [open, search, qualification?._id, achievement?._id])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-white font-bold text-sm">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-4 border-b border-white/10">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email or Partnership code"
              className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {loading ? (
            [...Array(5)].map((_, i) => <div key={i} className="h-14 bg-slate-800/50 rounded-xl animate-pulse" />)
          ) : partners.length === 0 ? (
            <div className="text-center py-10">
              <User className="w-8 h-8 text-gray-700 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No partners found</p>
            </div>
          ) : (
            partners.map((p: any) => (
              <button key={p._id} onClick={() => onPick(p)}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.04] border border-transparent hover:border-violet-500/30 transition-all text-left">
                {p.avatar ? (
                  <img src={p.avatar} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {p.name?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{p.name}</p>
                  <p className="text-gray-500 text-[11px] truncate">{p.email}{p.affiliateCode ? ` · ${p.affiliateCode}` : ''}</p>
                </div>
                {achievement ? (
                  <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                    {fmtAchievementMetric(achievement, p._metric || 0) && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-semibold">
                        {fmtAchievementMetric(achievement, p._metric || 0)}
                      </span>
                    )}
                    {p.packageTier && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-300 capitalize">
                        {p.packageTier}
                      </span>
                    )}
                  </div>
                ) : qualification ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-semibold flex-shrink-0">
                    {fmtMetric(qualification, p._metric || 0)}
                  </span>
                ) : p.packageTier && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 capitalize flex-shrink-0">
                    {p.packageTier}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
