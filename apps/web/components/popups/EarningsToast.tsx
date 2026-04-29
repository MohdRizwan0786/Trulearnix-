'use client'
import { useEffect, useState } from 'react'
import { Trophy, X, TrendingUp } from 'lucide-react'

interface Props {
  popup: any
  milestone: any
  onClose: () => void
}

export default function EarningsToast({ popup, milestone, onClose }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    if (popup.triggerDelay) {
      const t = setTimeout(() => {
        setVisible(false)
        setTimeout(onClose, 400)
      }, 8000)
      return () => clearTimeout(t)
    }
  }, [])

  const close = () => {
    setVisible(false)
    setTimeout(onClose, 400)
  }

  const user = milestone || { name: 'A member', totalEarnings: 50000 }
  const earnings = user.totalEarnings?.toLocaleString('en-IN')

  return (
    <div className={`fixed bottom-6 left-6 z-[9999] transition-all duration-400 ${visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
      <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/40 backdrop-blur-xl rounded-2xl p-4 w-80 shadow-2xl shadow-yellow-500/10">
        {/* Close */}
        <button onClick={close} className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>

        {/* Icon + badge */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Trophy className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <p className="text-xs text-yellow-400 font-semibold uppercase tracking-wide">Milestone Unlocked!</p>
            <p className="text-white font-bold text-sm leading-tight">{popup.title || `${user.name} hit ₹${earnings}!`}</p>
          </div>
        </div>

        {/* Real data row */}
        <div className="bg-black/30 rounded-xl p-3 flex items-center gap-3 mb-3">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-9 h-9 bg-yellow-500/30 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-yellow-300 font-bold text-sm">{user.name?.[0]?.toUpperCase()}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">{user.name}</p>
            {user.city && <p className="text-slate-400 text-xs">{user.city}</p>}
          </div>
          <div className="text-right flex-shrink-0">
            <div className="flex items-center gap-1 text-yellow-400">
              <TrendingUp className="w-3 h-3" />
              <span className="font-bold text-sm">₹{earnings}</span>
            </div>
            {user.packageTier && (
              <span className="text-xs text-slate-400 capitalize">{user.packageTier}</span>
            )}
          </div>
        </div>

        {/* Description */}
        {popup.description && (
          <p className="text-slate-400 text-xs mb-3">{popup.description}</p>
        )}

        {/* CTA */}
        {popup.ctaText && (
          <a href={popup.ctaLink || '#'} onClick={close}
            className="block w-full text-center bg-yellow-500 hover:bg-yellow-400 text-black font-semibold text-sm py-2 rounded-xl transition-colors">
            {popup.ctaText}
          </a>
        )}

        {/* Progress bar auto-dismiss */}
        <div className="mt-3 h-0.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-yellow-400/60 rounded-full animate-[shrink_8s_linear_forwards]" style={{ width: '100%' }} />
        </div>
      </div>
    </div>
  )
}
