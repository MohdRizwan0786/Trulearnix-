'use client'
import { useEffect, useState } from 'react'
import { packageAPI } from './api'

export interface TierInfo {
  tier: string
  name: string
  displayOrder: number
  price?: number
}

// Module-level cache so all callers share one fetch per session
let cached: TierInfo[] | null = null
let inflight: Promise<TierInfo[]> | null = null

export async function fetchTiers(): Promise<TierInfo[]> {
  if (cached) return cached
  if (inflight) return inflight
  inflight = packageAPI.getAll()
    .then(res => {
      const pkgs: TierInfo[] = (res.data?.packages || res.data?.data || [])
        .filter((p: any) => p.tier && p.isActive !== false)
        .sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0))
        .map((p: any) => ({
          tier: String(p.tier),
          name: String(p.name || p.tier),
          displayOrder: Number(p.displayOrder || 0),
          price: p.price,
        }))
      cached = pkgs
      return pkgs
    })
    .finally(() => { inflight = null })
  return inflight
}

// Returns paid tiers (excludes 'free') in displayOrder.
export function usePaidTiers(): { tiers: string[]; loading: boolean } {
  const [tiers, setTiers] = useState<string[]>(cached?.map(t => t.tier).filter(t => t !== 'free') || [])
  const [loading, setLoading] = useState(!cached)
  useEffect(() => {
    let alive = true
    fetchTiers().then(pkgs => {
      if (!alive) return
      setTiers(pkgs.map(p => p.tier).filter(t => t !== 'free'))
      setLoading(false)
    }).catch(() => alive && setLoading(false))
    return () => { alive = false }
  }, [])
  return { tiers, loading }
}

// Returns all tiers (including 'free' prepended) in displayOrder.
export function useAllTiers(): { tiers: string[]; loading: boolean } {
  const { tiers, loading } = usePaidTiers()
  return { tiers: ['free', ...tiers], loading }
}
