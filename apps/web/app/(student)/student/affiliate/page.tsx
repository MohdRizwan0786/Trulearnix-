'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { affiliateAPI, packageAPI, userAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { Lock, TrendingUp, Copy, Users, DollarSign, Wallet, ArrowUpRight, Star, Award, ChevronRight, Zap, Link2, CheckCircle2, ExternalLink, Sparkles } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

const TIER_CFG: Record<string, { grad: string; color: string; glow: string }> = {
  starter: { grad: 'linear-gradient(135deg,#1d4ed8,#0891b2)', color: '#60a5fa', glow: 'rgba(59,130,246,0.3)' },
  pro:     { grad: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#a78bfa', glow: 'rgba(139,92,246,0.35)' },
  elite:   { grad: 'linear-gradient(135deg,#d97706,#ea580c)', color: '#fbbf24', glow: 'rgba(245,158,11,0.35)' },
  supreme: { grad: 'linear-gradient(135deg,#e11d48,#9333ea)', color: '#fb7185', glow: 'rgba(236,72,153,0.35)' },
}

export default function AffiliatePage() {
  const { user, updateUser } = useAuthStore()
  const qc = useQueryClient()

  const { data: freshUser } = useQuery({
    queryKey: ['user-me'],
    queryFn: () => userAPI.me().then(r => { updateUser(r.data.user); return r.data.user }),
    staleTime: 0,
  })

  const isAffiliate = (freshUser ?? user as any)?.isAffiliate
  const [withdrawModal, setWithdrawModal] = useState(false)
  const [withdrawAmt, setWithdrawAmt] = useState('')
  const [upiId, setUpiId] = useState('')
  const [tab, setTab] = useState<'l1' | 'l2' | 'l3'>('l1')

  const { data: stats } = useQuery({ queryKey: ['affiliate-stats'], queryFn: () => affiliateAPI.stats().then(r => r.data), enabled: isAffiliate })
  const { data: refs } = useQuery({ queryKey: ['affiliate-refs'], queryFn: () => affiliateAPI.referrals().then(r => r.data), enabled: isAffiliate })
  const { data: commissions } = useQuery({ queryKey: ['affiliate-commissions'], queryFn: () => affiliateAPI.commissions().then(r => r.data), enabled: isAffiliate })
  const { data: pkgs } = useQuery({ queryKey: ['packages'], queryFn: () => packageAPI.getAll().then(r => r.data.packages), staleTime: 10 * 60 * 1000 })

  const withdrawMutation = useMutation({
    mutationFn: (data: any) => affiliateAPI.withdraw(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['affiliate-stats'] }); setWithdrawModal(false); toast.success('Withdrawal requested!') },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error')
  })

  const copy = (text: string) => { navigator.clipboard.writeText(text); toast.success('Copied!') }

  if (!isAffiliate) {
    return (
      <div className="space-y-6 max-w-3xl pb-8">
        <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}`}</style>
        <div>
          <h1 className="text-2xl font-black text-white">Partner Program</h1>
          <p className="text-gray-500 text-sm mt-0.5">Earn income by referring others to TruLearnix</p>
        </div>
        <div className="rounded-3xl p-8 text-center" style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.12),rgba(79,70,229,0.08))', border: '1px solid rgba(139,92,246,0.25)' }}>
          <div className="w-24 h-24 rounded-3xl mx-auto mb-6 flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', animation: 'float 3s ease-in-out infinite' }}>
            <Lock className="w-10 h-10 text-amber-400" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Partner Panel Locked</h2>
          <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">Purchase any package to unlock the Partner Program and start earning income every time someone joins through your link.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto mb-8">
            {(pkgs?.filter((p: any) => p.tier !== 'free' && p.isActive !== false) || [
              { tier: 'starter', name: 'Starter', price: 4999, commissionRate: 10 },
              { tier: 'pro',     name: 'Pro',     price: 9999, commissionRate: 15 },
              { tier: 'elite',   name: 'Elite',   price: 19999, commissionRate: 22 },
              { tier: 'supreme', name: 'Supreme', price: 29999, commissionRate: 30 },
            ]).map((p: any) => {
              const colors: Record<string, string> = { starter: '#60a5fa', pro: '#a78bfa', elite: '#fbbf24', supreme: '#fb7185' }
              const color = colors[p.tier] || '#60a5fa'
              return (
              <div key={p.tier} className="rounded-2xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="font-bold text-white text-sm">{p.name}</p>
                <p className="font-black text-base mt-0.5" style={{ color }}>₹{(p.price || 0).toLocaleString('en-IN')}</p>
                <p className="text-green-400 text-[10px] font-semibold mt-0.5">{p.commissionRate || 0}% income</p>
              </div>
            )})}
          </div>
          <Link href="/packages" className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold text-sm" style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', boxShadow: '0 8px 24px rgba(124,58,237,0.4)' }}>
            <Sparkles className="w-4 h-4" /> Unlock Partner Access
          </Link>
        </div>
      </div>
    )
  }

  const tier = (user as any)?.packageTier || 'starter'
  const tierCfg = TIER_CFG[tier] || TIER_CFG.starter
  const referralLink = stats?.referralLink || `${process.env.NEXT_PUBLIC_WEB_URL || 'https://trulearnix.com'}?ref=${(user as any)?.affiliateCode}`

  return (
    <div className="space-y-5 max-w-4xl pb-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Partner Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Your partner earnings and network</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl text-white text-sm font-bold" style={{ background: tierCfg.grad, boxShadow: `0 4px 20px ${tierCfg.glow}` }}>
          <Award className="w-4 h-4" /> {tier.charAt(0).toUpperCase() + tier.slice(1)} — {stats?.commissionRate || (user as any)?.commissionRate}% Rate
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Wallet,      label: 'Wallet Balance', value: `₹${(stats?.wallet || 0).toLocaleString()}`,          color: '#4ade80',  glow: 'rgba(74,222,128,0.15)'  },
          { icon: DollarSign, label: 'Total Earned',    value: `₹${(stats?.totalEarnings || 0).toLocaleString()}`,   color: '#fbbf24',  glow: 'rgba(251,191,36,0.12)'  },
          { icon: Users,       label: 'Total Partners', value: `${stats?.referrals?.total || 0}`,                     color: '#60a5fa',  glow: 'rgba(96,165,250,0.12)'  },
          { icon: TrendingUp,  label: 'This Month',     value: `₹${(stats?.monthlyEarnings || 0).toLocaleString()}`, color: '#c084fc',  glow: 'rgba(192,132,252,0.12)' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'rgba(13,13,20,0.95)', border: `1px solid ${s.glow.replace('0.12', '0.3')}`, boxShadow: `0 4px 24px ${s.glow}` }}>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: s.glow.replace('0.12', '0.25') }}>
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-gray-500 text-[10px] mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Commission Levels */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { level: 'Level 1', desc: 'Direct referrals',   color: '#4ade80', bg: 'rgba(74,222,128,0.08)',   border: 'rgba(74,222,128,0.2)',  rate: `${stats?.commissionRate || (user as any)?.commissionRate}%`, earned: stats?.commissions?.find((c: any) => c._id === 1)?.total || 0 },
          { level: 'Level 2', desc: "Partner's partners", color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',   border: 'rgba(96,165,250,0.2)',  rate: '5%', earned: stats?.commissions?.find((c: any) => c._id === 2)?.total || 0 },
          { level: 'Level 3', desc: 'L2 network',         color: '#c084fc', bg: 'rgba(192,132,252,0.08)',  border: 'rgba(192,132,252,0.2)', rate: '2%', earned: stats?.commissions?.find((c: any) => c._id === 3)?.total || 0 },
        ].map(l => (
          <div key={l.level} className="rounded-2xl p-4 text-center" style={{ background: l.bg, border: `1px solid ${l.border}` }}>
            <p className="text-2xl font-black" style={{ color: l.color }}>{l.rate}</p>
            <p className="text-white font-bold text-sm mt-0.5">{l.level}</p>
            <p className="text-gray-500 text-[10px]">{l.desc}</p>
            <p className="font-black text-sm mt-2" style={{ color: l.color }}>₹{l.earned.toLocaleString()}</p>
            <p className="text-gray-600 text-[10px]">earned</p>
          </div>
        ))}
      </div>

      {/* Referral Link */}
      <div className="rounded-3xl p-5" style={{ background: 'rgba(13,13,20,0.95)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h2 className="font-bold text-white mb-3 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-indigo-400" /> Your Referral Link
        </h2>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 rounded-xl px-4 py-3 min-w-0" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <ExternalLink className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="text-sm text-gray-300 truncate">{referralLink}</span>
          </div>
          <button onClick={() => copy(referralLink)} className="flex items-center gap-1.5 px-4 py-3 rounded-xl font-bold text-sm text-white transition-all flex-shrink-0" style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
            <Copy className="w-4 h-4" /> Copy
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Referrals */}
        <div className="rounded-3xl overflow-hidden" style={{ background: 'rgba(13,13,20,0.95)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2 p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {(['l1', 'l2', 'l3'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className="px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all"
                style={{ background: tab === t ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)', color: tab === t ? '#a78bfa' : '#6b7280', border: tab === t ? '1px solid rgba(124,58,237,0.4)' : '1px solid transparent' }}>
                {t} ({refs?.[t]?.length || 0})
              </button>
            ))}
          </div>
          <div className="p-3 space-y-1.5 max-h-64 overflow-y-auto">
            {(refs?.[tab] || []).length === 0 ? (
              <div className="text-center py-8 text-gray-600 text-sm">No {tab.toUpperCase()} partners yet</div>
            ) : (refs?.[tab] || []).map((r: any) => (
              <div key={r._id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa' }}>
                  {r.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{r.name}</p>
                  <p className="text-[10px] text-gray-500 capitalize">{r.packageTier} package</p>
                </div>
                {r.isAffiliate && <Star className="w-3.5 h-3.5 text-amber-400" />}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Commissions */}
        <div className="rounded-3xl overflow-hidden" style={{ background: 'rgba(13,13,20,0.95)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2 p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-white text-sm">Recent Income</h3>
          </div>
          <div className="p-3 space-y-1.5 max-h-64 overflow-y-auto">
            {(commissions?.commissions || []).length === 0 ? (
              <div className="text-center py-8 text-gray-600 text-sm">No income yet</div>
            ) : (commissions?.commissions || []).slice(0, 8).map((c: any) => (
              <div key={c._id} className="flex items-center justify-between p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div>
                  <p className="text-sm text-white font-medium">L{c.level} Income</p>
                  <p className="text-[10px] text-gray-500">{c.levelRate}% · {c.buyer?.name}</p>
                </div>
                <span className="text-green-400 font-black text-sm">+₹{c.commissionAmount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Withdraw */}
      <div className="rounded-3xl p-5 flex items-center justify-between gap-4 flex-wrap" style={{ background: 'linear-gradient(135deg,rgba(34,197,94,0.08),rgba(16,185,129,0.05))', border: '1px solid rgba(34,197,94,0.2)' }}>
        <div>
          <p className="font-bold text-white text-sm">Available: <span className="text-green-400 text-lg font-black">₹{(stats?.wallet || 0).toLocaleString()}</span></p>
          <p className="text-gray-500 text-xs mt-0.5">Min ₹500 · Processed in 24–48h via UPI</p>
        </div>
        <button onClick={() => setWithdrawModal(true)} disabled={!stats?.wallet || stats.wallet < 500}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm text-white transition-all disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', boxShadow: '0 4px 20px rgba(22,163,74,0.3)' }}>
          <ArrowUpRight className="w-4 h-4" /> Withdraw
        </button>
      </div>

      {/* Withdraw Modal */}
      {withdrawModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setWithdrawModal(false)}>
          <div className="w-full max-w-md rounded-3xl p-6" style={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
            <h3 className="font-black text-white text-lg mb-5">Request Withdrawal</h3>
            <div className="space-y-3">
              <input type="number" value={withdrawAmt} onChange={e => setWithdrawAmt(e.target.value)} placeholder={`Amount (max ₹${stats?.wallet || 0})`}
                className="w-full rounded-xl px-4 py-3 text-white text-sm focus:outline-none placeholder-gray-600" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
              <input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="UPI ID (e.g. name@upi)"
                className="w-full rounded-xl px-4 py-3 text-white text-sm focus:outline-none placeholder-gray-600" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
              <div className="flex gap-3 pt-2">
                <button onClick={() => withdrawMutation.mutate({ amount: Number(withdrawAmt), method: 'upi', upiId })}
                  disabled={!withdrawAmt || !upiId || withdrawMutation.isPending}
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-white disabled:opacity-40" style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                  {withdrawMutation.isPending ? 'Processing…' : 'Request Withdrawal'}
                </button>
                <button onClick={() => setWithdrawModal(false)} className="flex-1 py-3 rounded-xl font-bold text-sm text-gray-400" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
