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
