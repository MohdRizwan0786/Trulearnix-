import { useState, useEffect } from 'react'
import { adminAPI } from './api'

export interface AdminPackage {
  _id: string
  tier: string
  name: string
  price: number
  displayOrder: number
  isActive?: boolean
}

// Module-level cache — fetched once per browser session, reused across all admin pages
let _cache: AdminPackage[] | null = null
let _promise: Promise<AdminPackage[]> | null = null

function fetchPackages(): Promise<AdminPackage[]> {
  if (_cache) return Promise.resolve(_cache)
  if (!_promise) {
    _promise = adminAPI.packages()
      .then(res => {
        const pkgs: AdminPackage[] = (res.data.packages || [])
          .sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0))
        _cache = pkgs
        return pkgs
      })
      .catch(() => { _promise = null; return [] })
  }
  return _promise
}

export function clearPackagesCache() {
  _cache = null
  _promise = null
}

export function usePackages({ includeFree = false } = {}) {
  const [packages, setPackages] = useState<AdminPackage[]>(() => {
    const cached = _cache || []
    return includeFree ? cached : cached.filter(p => p.tier !== 'free')
  })
  const [loading, setLoading] = useState(!_cache)

  useEffect(() => {
    if (_cache) {
      setPackages(includeFree ? _cache : _cache.filter(p => p.tier !== 'free'))
      setLoading(false)
      return
    }
    fetchPackages().then(pkgs => {
      setPackages(includeFree ? pkgs : pkgs.filter(p => p.tier !== 'free'))
      setLoading(false)
    })
  }, [includeFree])

  return { packages, loading }
}

// ── Color palette shared across admin pages ─────────────────────────────────
// Colors assigned by displayOrder (position in admin packages page) so when
// admin reorders or renames packages, the palette follows automatically.
const PALETTE = [
  { bg: 'bg-sky-500/20',     text: 'text-sky-400',     chip: 'bg-sky-500/20 text-sky-400',         hex: '#0ea5e9', chartBg: 'bg-sky-500' },
  { bg: 'bg-violet-500/20',  text: 'text-violet-400',  chip: 'bg-violet-500/20 text-violet-400',   hex: '#8b5cf6', chartBg: 'bg-violet-500' },
  { bg: 'bg-fuchsia-500/20', text: 'text-fuchsia-400', chip: 'bg-fuchsia-500/20 text-fuchsia-400', hex: '#d946ef', chartBg: 'bg-fuchsia-500' },
  { bg: 'bg-amber-500/20',   text: 'text-amber-400',   chip: 'bg-amber-500/20 text-amber-400',     hex: '#f59e0b', chartBg: 'bg-amber-500' },
  { bg: 'bg-rose-500/20',    text: 'text-rose-400',    chip: 'bg-rose-500/20 text-rose-400',       hex: '#f43f5e', chartBg: 'bg-rose-500' },
  { bg: 'bg-emerald-500/20', text: 'text-emerald-400', chip: 'bg-emerald-500/20 text-emerald-400', hex: '#10b981', chartBg: 'bg-emerald-500' },
  { bg: 'bg-cyan-500/20',    text: 'text-cyan-400',    chip: 'bg-cyan-500/20 text-cyan-400',       hex: '#06b6d4', chartBg: 'bg-cyan-500' },
  { bg: 'bg-pink-500/20',    text: 'text-pink-400',    chip: 'bg-pink-500/20 text-pink-400',       hex: '#ec4899', chartBg: 'bg-pink-500' },
]
const FREE_STYLE = { bg: 'bg-gray-500/20', text: 'text-gray-400', chip: 'bg-gray-500/20 text-gray-400', hex: '#6b7280', chartBg: 'bg-gray-500' }

export type TierStyle = typeof PALETTE[number]

/**
 * Map a tier slug (e.g. "starter", "pro", "supreme") to a style. The style is
 * derived from the package's `displayOrder` when available, so admin-driven
 * reordering propagates automatically.
 */
export function tierStyle(tierSlug: string | undefined | null, packages: AdminPackage[] = _cache || []): TierStyle {
  if (!tierSlug) return FREE_STYLE
  const slug = tierSlug.toLowerCase()
  if (slug === 'free') return FREE_STYLE
  const pkg = packages.find(p => p.tier?.toLowerCase() === slug)
  const idx = pkg ? (pkg.displayOrder ?? packages.indexOf(pkg)) : 0
  return PALETTE[idx % PALETTE.length]
}

/** Resolve display name from a tier slug (falls back to capitalised slug). */
export function tierName(tierSlug: string | undefined | null, packages: AdminPackage[] = _cache || []): string {
  if (!tierSlug) return '—'
  const slug = tierSlug.toLowerCase()
  if (slug === 'free') return 'Free'
  const pkg = packages.find(p => p.tier?.toLowerCase() === slug)
  return pkg?.name || (tierSlug.charAt(0).toUpperCase() + tierSlug.slice(1))
}

/** Live list of tier slugs sorted by displayOrder — for dropdowns etc. */
export function tierSlugs(packages: AdminPackage[] = _cache || []): string[] {
  return packages.filter(p => p.tier && p.tier !== 'free').map(p => p.tier.toLowerCase())
}
