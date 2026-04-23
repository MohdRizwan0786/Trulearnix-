'use client'
import { usePlatformStats, formatStat } from '@/components/shared/PlatformStatsCards'

type Stat = { key: string; label: string; fallback?: string; money?: boolean }

export default function MentorStats({ items }: { items: Stat[] }) {
  const stats = usePlatformStats()

  const renderVal = (s: Stat): string => {
    if (!stats) return '—'
    const n = (stats as any)[s.key]
    if (typeof n !== 'number') return s.fallback ?? '—'
    return formatStat(s.key as any, n)
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {items.map(s => (
        <div key={s.label} className="p-5 rounded-2xl bg-white/3 border border-white/5 text-center">
          <p className="text-3xl font-black text-white mb-1">{renderVal(s)}</p>
          <p className="text-gray-500 text-sm">{s.label}</p>
        </div>
      ))}
    </div>
  )
}
