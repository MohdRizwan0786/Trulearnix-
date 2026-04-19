'use client'
import { useState } from 'react'
import { Key, ArrowRight, Loader2 } from 'lucide-react'

export default function EarlyAccessForm() {
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const t = token.trim()
    if (!t) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/validate-early-access?token=${encodeURIComponent(t)}`)
      const data = await res.json()
      if (data.valid) {
        // Redirect with token in query param — middleware will set cookie
        window.location.href = `/?early_access=${encodeURIComponent(t)}`
      } else {
        setError('Invalid access token. Please check and try again.')
        setLoading(false)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="border border-violet-500/20 bg-violet-500/5 rounded-2xl p-5 text-left space-y-3">
      <div className="flex items-center gap-2">
        <Key className="w-4 h-4 text-violet-400" />
        <p className="text-sm font-semibold text-violet-300">Have Early Access?</p>
      </div>
      <p className="text-xs text-gray-500">Enter your access token to preview the platform.</p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={token}
          onChange={e => setToken(e.target.value)}
          placeholder="ea_xxxxxxxxxxxxxxxx"
          className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500"
        />
        <button
          type="submit"
          disabled={loading || !token.trim()}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm rounded-xl transition-colors flex items-center gap-1.5"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
        </button>
      </form>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
