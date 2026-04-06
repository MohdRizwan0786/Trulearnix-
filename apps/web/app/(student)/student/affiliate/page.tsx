'use client'
import { useQuery } from '@tanstack/react-query'
import { affiliateAPI } from '@/lib/api'
import { Link2, Copy, Users, DollarSign, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AffiliatePage() {
  const { data } = useQuery({ queryKey: ['affiliate'], queryFn: () => affiliateAPI.stats().then(r => r.data) })
  const { data: referralsData } = useQuery({ queryKey: ['referrals'], queryFn: () => affiliateAPI.referrals().then(r => r.data) })

  const copyLink = () => {
    navigator.clipboard.writeText(data?.referralLink || '')
    toast.success('Referral link copied!')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Affiliate Program</h1>
        <p className="text-gray-400 mt-1">Earn 10% commission for every course purchase through your link</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Users, label: 'Total Referrals', value: data?.totalReferrals || 0, color: 'bg-blue-500/20 text-blue-400' },
          { icon: DollarSign, label: 'Total Earned', value: `₹${data?.totalEarnings || 0}`, color: 'bg-green-500/20 text-green-400' },
          { icon: TrendingUp, label: 'Conversions', value: data?.totalTransactions || 0, color: 'bg-purple-500/20 text-purple-400' },
        ].map((s, i) => (
          <div key={i} className="card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.color}`}>
              <s.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-sm text-gray-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Referral link */}
      <div className="card">
        <h2 className="text-lg font-bold text-white mb-4">Your Referral Link</h2>
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 bg-dark-700 border border-white/10 rounded-xl p-3">
            <Link2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-300 truncate">{data?.referralLink || 'Loading...'}</span>
          </div>
          <button onClick={copyLink} className="btn-primary py-3 px-4 flex items-center gap-2">
            <Copy className="w-4 h-4" /> Copy
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-3">Share this link on social media. You earn 10% of every purchase made through your link.</p>
      </div>

      {/* Referrals list */}
      <div className="card">
        <h2 className="text-lg font-bold text-white mb-4">Your Referrals ({referralsData?.referrals?.length || 0})</h2>
        <div className="space-y-2">
          {referralsData?.referrals?.length ? referralsData.referrals.map((r: any) => (
            <div key={r._id} className="flex items-center justify-between p-3 bg-dark-700 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-500/20 rounded-full flex items-center justify-center text-primary-400 font-bold text-xs">
                  {r.name[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{r.name}</p>
                  <p className="text-xs text-gray-400">{r.email}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</p>
            </div>
          )) : <p className="text-gray-400 text-sm">No referrals yet. Share your link to start earning!</p>}
        </div>
      </div>
    </div>
  )
}
