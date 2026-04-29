'use client'
import { useEffect, useState } from 'react'
import { packageAPI } from './api'

export interface TierInfo {
  tier: string
  name: string
  displayOrder: number
  price?: number
  badge?: string
  features?: string[]
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
          badge: p.badge,
          features: p.features,
        }))
      cached = pkgs
      return pkgs
    })
    .finally(() => { inflight = null })
  return inflight
}

// Hook: returns the admin-managed package map so any UI can resolve
// the official name/price/badge for a tier without hardcoding.
export function usePackages(): {
  pkgs: TierInfo[]
  byTier: Record<string, TierInfo>
  getName: (tier: string | undefined | null) => string
  getPrice: (tier: string | undefined | null) => number | undefined
  loading: boolean
} {
  const [pkgs, setPkgs] = useState<TierInfo[]>(cached || [])
  const [loading, setLoading] = useState(!cached)
  useEffect(() => {
    let alive = true
    fetchTiers().then(p => {
      if (!alive) return
      setPkgs(p)
      setLoading(false)
    }).catch(() => alive && setLoading(false))
    return () => { alive = false }
  }, [])
  const byTier: Record<string, TierInfo> = {}
  pkgs.forEach(p => { byTier[p.tier] = p })
  const getName = (t: string | undefined | null) => (t && byTier[t]?.name) || t || ''
  const getPrice = (t: string | undefined | null) => (t ? byTier[t]?.price : undefined)
  return { pkgs, byTier, getName, getPrice, loading }
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
