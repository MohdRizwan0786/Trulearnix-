'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { affiliateAPI, packageAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { Lock, TrendingUp, Copy, Users, DollarSign, Wallet, ArrowUpRight, Star, Award, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

const TIER_COLORS: Record<string, string> = {
  starter: 'from-blue-500 to-blue-700',
  pro: 'from-violet-500 to-violet-700',
  elite: 'from-orange-500 to-orange-700',
  supreme: 'from-yellow-500 to-yellow-700',
}

export default function AffiliatePage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const isAffiliate = (user as any)?.isAffiliate
  const [withdrawModal, setWithdrawModal] = useState(false)
  const [withdrawAmt, setWithdrawAmt] = useState('')
  const [upiId, setUpiId] = useState('')
  const [tab, setTab] = useState<'l1' | 'l2' | 'l3'>('l1')

  const { data: stats } = useQuery({ queryKey: ['affiliate-stats'], queryFn: () => affiliateAPI.stats().then(r => r.data), enabled: isAffiliate })
  const { data: refs } = useQuery({ queryKey: ['affiliate-refs'], queryFn: () => affiliateAPI.referrals().then(r => r.data), enabled: isAffiliate })
  const { data: commissions } = useQuery({ queryKey: ['affiliate-commissions'], queryFn: () => affiliateAPI.commissions().then(r => r.data), enabled: isAffiliate })

  const withdrawMutation = useMutation({
    mutationFn: (data: any) => affiliateAPI.withdraw(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['affiliate-stats'] }); setWithdrawModal(false); toast.success('Withdrawal requested!') },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error')
  })

  const copy = (text: string) => { navigator.clipboard.writeText(text); toast.success('Copied!') }

  // Locked screen
  if (!isAffiliate) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Earn Program</h1>
          <p className="text-gray-400 mt-1">Help others learn skills — earn income every month</p>
        </div>
        <div className="card text-center py-16 border border-yellow-500/20">
          <Lock className="w-16 h-16 text-yellow-500/50 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Earn Panel Locked</h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">Purchase any package to unlock the Earn Program and start earning income every time someone joins through your link.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-8">
            {[{tier:'Starter',price:'₹4,999',rate:'10%'},{tier:'Pro',price:'₹9,999',rate:'15%'},{tier:'Elite',price:'₹19,999',rate:'22%'},{tier:'Supreme',price:'₹29,999',rate:'30%'}].map(p => (
              <div key={p.tier} className="bg-dark-700 rounded-xl p-4 border border-white/10">
                <p className="font-bold text-white text-sm">{p.tier}</p>
                <p className="text-primary-400 font-black text-lg">{p.price}</p>
                <p className="text-xs text-green-400">{p.rate} income share</p>
              </div>
            ))}
          </div>
          <Link href="/packages" className="btn-primary">Unlock Earn Access →</Link>
        </div>
      </div>
    )
  }

  const tier = (user as any)?.packageTier || 'starter'
  const referralLink = stats?.referralLink || `https://peptly.in?ref=${(user as any)?.affiliateCode}`

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Earn Dashboard</h1>
          <p className="text-gray-400 mt-1">Your earning hub</p>
        </div>
        <div className={`px-4 py-2 rounded-xl bg-gradient-to-r ${TIER_COLORS[tier]} text-white text-sm font-bold flex items-center gap-2`}>
          <Award className="w-4 h-4" /> {tier.charAt(0).toUpperCase() + tier.slice(1)} — {stats?.commissionRate || (user as any)?.commissionRate}% Income Rate
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Wallet, label: 'Wallet Balance', value: `₹${(stats?.wallet || 0).toLocaleString()}`, color: 'text-green-400', bg: 'bg-green-500/20' },
          { icon: DollarSign, label: 'Total Earned', value: `₹${(stats?.totalEarnings || 0).toLocaleString()}`, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
          { icon: Users, label: 'Total Invites', value: stats?.referrals?.total || 0, color: 'text-blue-400', bg: 'bg-blue-500/20' },
          { icon: TrendingUp, label: 'This Month', value: `₹${(stats?.monthlyEarnings || 0).toLocaleString()}`, color: 'text-purple-400', bg: 'bg-purple-500/20' },
        ].map(s => (
          <div key={s.label} className="card flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Commission Levels */}
      <div className="grid grid-cols-3 gap-4">
        {[{level: 'Level 1', rate: `${stats?.commissionRate || (user as any)?.commissionRate}%`, desc: 'Direct invites', color: 'text-green-400', earned: stats?.commissions?.find((c:any)=>c._id===1)?.total || 0},
          {level: 'Level 2', rate: '5%', desc: "Invite's invites", color: 'text-blue-400', earned: stats?.commissions?.find((c:any)=>c._id===2)?.total || 0},
          {level: 'Level 3', rate: '2%', desc: "L2's invites", color: 'text-purple-400', earned: stats?.commissions?.find((c:any)=>c._id===3)?.total || 0}].map(l => (
          <div key={l.level} className="card text-center">
            <p className={`text-lg font-black ${l.color}`}>{l.rate}</p>
            <p className="text-white text-sm font-semibold">{l.level}</p>
            <p className="text-xs text-gray-500 mb-2">{l.desc}</p>
            <p className="text-sm text-white font-bold">₹{l.earned.toLocaleString()}</p>
            <p className="text-xs text-gray-500">earned</p>
          </div>
        ))}
      </div>

      {/* Referral link */}
      <div className="card">
        <h2 className="font-bold text-white mb-3">Your Invite Link</h2>
        <div className="flex gap-3">
          <div className="flex-1 flex items-center gap-2 bg-dark-700 border border-white/10 rounded-xl px-4 py-3">
            <TrendingUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-300 truncate">{referralLink}</span>
          </div>
          <button onClick={() => copy(referralLink)} className="btn-primary py-3 px-5 flex items-center gap-2">
            <Copy className="w-4 h-4" /> Copy
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Referrals */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            {(['l1','l2','l3'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all uppercase ${tab === t ? 'bg-primary-500/20 text-primary-400' : 'text-gray-400 hover:text-white'}`}>
                {t} ({refs?.[t]?.length || 0})
              </button>
            ))}
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {(refs?.[tab] || []).length === 0 ? <p className="text-gray-500 text-sm text-center py-4">No {tab.toUpperCase()} invites yet</p> :
              (refs?.[tab] || []).map((r: any) => (
                <div key={r._id} className="flex items-center gap-3 p-2.5 bg-dark-700 rounded-xl">
                  <div className="w-8 h-8 bg-primary-500/20 rounded-full flex items-center justify-center text-primary-400 font-bold text-xs">{r.name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{r.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{r.packageTier} package</p>
                  </div>
                  {r.isAffiliate && <Star className="w-3 h-3 text-yellow-400" />}
                </div>
              ))}
          </div>
        </div>

        {/* Recent Commissions */}
        <div className="card">
          <h3 className="font-semibold text-white mb-4">Recent Income</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {(commissions?.commissions || []).length === 0 ? <p className="text-gray-500 text-sm text-center py-4">No income yet</p> :
              (commissions?.commissions || []).slice(0, 8).map((c: any) => (
                <div key={c._id} className="flex items-center justify-between p-2.5 bg-dark-700 rounded-xl">
                  <div>
                    <p className="text-sm text-white">L{c.level} Income</p>
                    <p className="text-xs text-gray-400">{c.levelRate}% • {c.buyer?.name}</p>
                  </div>
                  <span className="text-green-400 font-bold text-sm">+₹{c.commissionAmount}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Withdraw */}
      <div className="card flex items-center justify-between">
        <div>
          <p className="font-bold text-white">Available Balance: <span className="text-green-400">₹{(stats?.wallet || 0).toLocaleString()}</span></p>
          <p className="text-xs text-gray-400">Minimum withdrawal: ₹500 • Processed within 24-48 hours</p>
        </div>
        <button onClick={() => setWithdrawModal(true)} disabled={!stats?.wallet || stats.wallet < 500} className="btn-primary flex items-center gap-2">
          <ArrowUpRight className="w-4 h-4" /> Withdraw
        </button>
      </div>

      {/* Withdraw Modal */}
      {withdrawModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setWithdrawModal(false)}>
          <div className="card w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-white mb-4">Request Withdrawal</h3>
            <div className="space-y-3">
              <input type="number" value={withdrawAmt} onChange={e => setWithdrawAmt(e.target.value)} placeholder={`Amount (max ₹${stats?.wallet || 0})`}
                className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary-500 placeholder-gray-500" />
              <input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="UPI ID (e.g. name@upi)"
                className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary-500 placeholder-gray-500" />
              <div className="flex gap-3 mt-4">
                <button onClick={() => withdrawMutation.mutate({ amount: Number(withdrawAmt), method: 'upi', upiId })}
                  disabled={!withdrawAmt || !upiId || withdrawMutation.isPending}
                  className="btn-primary flex-1">
                  {withdrawMutation.isPending ? 'Processing...' : 'Request Withdrawal'}
                </button>
                <button onClick={() => setWithdrawModal(false)} className="btn-outline flex-1">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
