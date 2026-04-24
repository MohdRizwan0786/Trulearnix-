'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { salesAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { Link2, Copy, Check, ExternalLink, Gift, ShoppingBag, ChevronDown, Share2, Loader2, Info, Sparkles, BookOpen } from 'lucide-react'

function CopyBtn({ text, size = 'sm' }: { text: string; size?: 'sm' | 'md' }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className={`flex items-center gap-1.5 rounded-xl font-bold transition-all flex-shrink-0 ${
        copied ? 'bg-green-600 text-white' : 'bg-white/8 hover:bg-white/15 text-gray-300 hover:text-white'
      } ${size === 'md' ? 'px-4 py-2.5 text-sm' : 'px-3 py-2 text-xs'}`}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

function WaBtn({ msg }: { msg: string }) {
  return (
    <a href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-green-500/15 hover:bg-green-500/25 text-green-400 border border-green-500/20 transition-all flex-shrink-0">
      <Share2 className="w-3.5 h-3.5" /> WhatsApp
    </a>
  )
}

function LinkBox({ url, waMsg, label }: { url: string; waMsg: string; label?: string }) {
  return (
    <div className="space-y-2.5">
      {label && <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">{label}</p>}
      <div className="flex items-center gap-2.5 bg-dark-900/80 rounded-xl px-4 py-3 border border-white/8">
        <Link2 className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
        <span className="flex-1 text-xs text-gray-300 font-mono break-all leading-relaxed">{url}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <CopyBtn text={url} />
        <WaBtn msg={waMsg} />
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all">
          <ExternalLink className="w-3.5 h-3.5" /> Preview
        </a>
      </div>
    </div>
  )
}

export default function SalesLinkGeneratorPage() {
  const { user } = useAuthStore()
  const { data, isLoading } = useQuery({
    queryKey: ['sales-link'],
    queryFn: () => salesAPI.myLink().then(r => r.data),
  })
  const [selectedPkgId, setSelectedPkgId] = useState('')

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-60 gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      <p className="text-gray-500 text-sm">Loading your links...</p>
    </div>
  )

  const code = data?.affiliateCode || user?.affiliateCode || ''
  const webUrl = process.env.NEXT_PUBLIC_WEB_URL || 'https://trulearnix.com'
  const packageLinks: any[] = data?.packageLinks || []
  const selectedPkg = packageLinks.find(p => p.id === selectedPkgId) || packageLinks[0]
  const pkgUrl = selectedPkg ? selectedPkg.checkoutUrl : ''

  return (
    <div className="space-y-5 max-w-2xl pb-10">

      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-3xl p-5 sm:p-6"
        style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.3) 0%, rgba(99,102,241,0.25) 100%)', border: '1px solid rgba(59,130,246,0.25)' }}>
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(59,130,246,0.15)' }} />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-blue-300" />
            <span className="text-blue-300 text-xs font-bold uppercase tracking-wider">Link Generator</span>
          </div>
          <h1 className="text-2xl font-black text-white">Your Partner Links</h1>
          <p className="text-blue-200/50 text-sm mt-1">Share links with promo code pre-applied</p>
        </div>
      </div>

      {/* ── Partner Code Card ── */}
      <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6"
        style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.4) 0%, rgba(37,99,235,0.3) 50%, rgba(6,182,212,0.2) 100%)', border: '1px solid rgba(99,102,241,0.35)' }}>
        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(99,102,241,0.3)', border: '1px solid rgba(99,102,241,0.4)' }}>
              <Gift className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <p className="text-indigo-200/70 text-xs font-bold uppercase tracking-widest mb-1">Your Partner Code</p>
              <p className="text-3xl sm:text-4xl font-black text-white font-mono tracking-widest">{code}</p>
            </div>
          </div>
          <CopyBtn text={code} size="md" />
        </div>
        <div className="relative mt-4 pt-4 border-t border-white/10 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <p className="text-white/50 text-xs">Share this code — buyers get discount, you earn commission</p>
        </div>
      </div>

      {/* ── Important Note ── */}
      <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-amber-500/8 border border-amber-500/20">
        <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-amber-200/70 text-xs leading-relaxed">
          Company-assigned leads will <strong className="text-amber-300">not</strong> earn extra commission through your referral link. Use the <strong className="text-amber-300">New Order</strong> form to register those customers directly.
        </p>
      </div>

      {/* ── Package Links ── */}
      {packageLinks.length > 0 && (
        <div className="bg-dark-800 rounded-2xl border border-white/5 p-5 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#2563eb,#4f46e5)' }}>
              <ShoppingBag className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold">Package Checkout Link</h2>
              <p className="text-gray-500 text-xs mt-0.5">Your code is pre-applied — buyer gets discount instantly</p>
            </div>
          </div>

          {/* Package Selector */}
          <div className="relative">
            <select
              value={selectedPkgId || (packageLinks[0]?.id ?? '')}
              onChange={e => setSelectedPkgId(e.target.value)}
              className="w-full appearance-none bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 pr-10 cursor-pointer"
            >
              {packageLinks.map(pkg => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name} — ₹{pkg.price?.toLocaleString()}
                  {pkg.promoDiscountPercent > 0 ? ` (${pkg.promoDiscountPercent}% off with code)` : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {pkgUrl && (
            <>
              <div className="h-px bg-white/5" />
              <LinkBox url={pkgUrl} label="Direct checkout link" waMsg={`Join ${selectedPkg?.name || 'TruLearnix'} on TruLearnix!\n\nDirect checkout link:\n${pkgUrl}\n\nUse code ${code} for discount — already applied in the link!`} />
            </>
          )}

          <div className="h-px bg-white/5" />
          <LinkBox
            url={`${webUrl}/register?ref=${code}`}
            label="Registration link (for new users)"
            waMsg={`Join TruLearnix — India's fastest growing skill platform!\n\nLearn Digital Marketing, Earn while you learn\n\nRegister now: ${webUrl}/register?ref=${code}\n\nUse code ${code} at checkout for discount!`}
          />
        </div>
      )}

      {/* ── Course Referral Links ── */}
      {data?.courseLinks?.length > 0 && (
        <div className="rounded-2xl overflow-hidden border border-indigo-500/20" style={{ background: 'rgba(99,102,241,0.05)' }}>
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/8">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <div>
              <p className="font-bold text-white text-sm">Course Referral Links</p>
              <p className="text-xs text-gray-500">Buyer gets discount — you earn commission on every enrollment</p>
            </div>
          </div>
          <div className="divide-y divide-white/5">
            {data.courseLinks.map((c: any) => {
              const waMsg = `🎓 Enroll in *${c.title}* at ${c.discountPercent}% OFF!\n\n💰 Price: ₹${c.basePrice} → ₹${c.refPrice} only\n\n👉 ${c.refUrl}`
              return (
                <div key={c.id} className="px-5 py-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{c.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500 line-through">₹{c.basePrice}</span>
                        <span className="text-xs font-bold text-green-400">₹{c.refPrice}</span>
                        <span className="text-[10px] bg-green-500/15 text-green-400 border border-green-500/20 px-1.5 py-0.5 rounded-full font-bold">{c.discountPercent}% OFF</span>
                      </div>
                    </div>
                  </div>
                  <LinkBox url={c.refUrl} waMsg={waMsg} />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Sales Tips ── */}
      <div className="bg-dark-800 rounded-2xl border border-white/5 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <h2 className="text-white font-bold">Sales Tips</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-2.5">
          {[
            { icon: '🎯', tip: 'Use the New Order form for company-assigned leads — do not share partner links for those' },
            { icon: '📱', tip: 'Share the checkout link on WhatsApp — code is auto-applied, no extra steps for buyer' },
            { icon: '💬', tip: 'Follow up within 24 hours of sharing the link for best conversion rate' },
            { icon: '📋', tip: 'Create a sales order first, then generate a payment link for the customer' },
            { icon: '💰', tip: 'Higher tier packages earn you more commission — push for Elite or Supreme' },
            { icon: '📊', tip: 'Track all your leads in the My Leads section and update stages regularly' },
          ].map(({ icon, tip }) => (
            <div key={tip} className="flex items-start gap-3 p-3.5 bg-white/[0.03] rounded-xl border border-white/5 hover:border-white/10 transition-colors">
              <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
              <p className="text-gray-400 text-xs leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
