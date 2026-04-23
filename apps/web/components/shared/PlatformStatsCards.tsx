'use client'
import { useEffect, useState } from 'react'
import { Users, TrendingUp, Award, BookOpen, GraduationCap, Trophy, Star } from 'lucide-react'

export type StatKey =
  | 'totalStudents'
  | 'totalMentors'
  | 'totalCourses'
  | 'totalCertificates'
  | 'totalEnrollments'
  | 'totalPayout'
  | 'avgRating'

export type StatIconName = 'users' | 'money' | 'award' | 'book' | 'grad' | 'trophy' | 'star'

const ICONS: Record<StatIconName, any> = {
  users: Users,
  money: TrendingUp,
  award: Award,
  book: BookOpen,
  grad: GraduationCap,
  trophy: Trophy,
  star: Star,
}

function formatCount(n: number): string {
  if (n >= 100000) return `${Math.floor(n / 100000)}L+`
  if (n >= 1000) return `${Math.floor(n / 1000)}K+`
  return `${n}+`
}

function formatMoney(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr+`
  if (n >= 100000) return `₹${Math.floor(n / 100000)}L+`
  if (n >= 1000) return `₹${Math.floor(n / 1000)}K+`
  return `₹${n}`
}

function formatRating(n: number): string {
  return n > 0 ? `${n.toFixed(1)}★` : '—'
}

export function formatStat(key: StatKey, value: number): string {
  if (key === 'totalPayout') return formatMoney(value)
  if (key === 'avgRating') return formatRating(value)
  return formatCount(value)
}

export function usePlatformStats() {
  const [stats, setStats] = useState<Record<string, number> | null>(null)
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/stats`)
      .then(r => r.json())
      .then(d => { if (d.success) setStats(d.stats) })
      .catch(() => {})
  }, [])
  return stats
}

export default function PlatformStatsCards({
  items,
  className,
}: {
  items: { key: StatKey; label: string; icon: StatIconName }[]
  className?: string
}) {
  const stats = usePlatformStats()

  return (
    <div className={className ?? 'max-w-3xl mx-auto grid grid-cols-3 gap-4 text-center'}>
      {items.map((s, i) => {
        const val = stats ? formatStat(s.key, stats[s.key] ?? 0) : '—'
        const Icon = ICONS[s.icon]
        return (
          <div key={i} className="p-6 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Icon className="w-6 h-6 text-amber-400 mx-auto mb-2" />
            <div className="text-2xl font-black text-white">{val}</div>
            <div className="text-xs text-white/60 uppercase tracking-wide">{s.label}</div>
          </div>
        )
      })}
    </div>
  )
}
