'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { walletAPI } from '@/lib/api'
import { Wallet, ArrowUpRight, ArrowDownLeft, TrendingUp, Clock, Coins, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

const CAT_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  affiliate_commission: { color: 'text-green-400', bg: 'bg-green-500/15', label: 'Commission' },
  course_sale:         { color: 'text-blue-400',  bg: 'bg-blue-500/15',  label: 'Course Sale' },
  withdrawal:          { color: 'text-red-400',   bg: 'bg-red-500/15',   label: 'Withdrawal' },
  refund:              { color: 'text-yellow-400',bg: 'bg-yellow-500/15',label: 'Refund' },
  bonus:               { color: 'text-purple-400',bg: 'bg-purple-500/15',label: 'Bonus' },
}

export default function WalletPage() {
  const [page, setPage] = useState(1)
  const { data: walletData } = useQuery({ queryKey: ['wallet'], queryFn: () => walletAPI.get().then(r => r.data) })
  const { data: txData } = useQuery({ queryKey: ['transactions', page], queryFn: () => walletAPI.transactions({ page, limit: 15 }).then(r => r.data) })

  const balance = walletData?.wallet || 0
  const totalEarned = walletData?.totalEarnings || 0
  const totalWithdrawn = walletData?.totalWithdrawn || 0

  return (
    <div className="space-y-5 max-w-3xl pb-8">
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
      `}</style>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">My Wallet</h1>
        <p className="text-gray-500 text-sm mt-0.5">Earnings, commissions & transaction history</p>
      </div>

      {/* Balance Hero */}
      <div className="relative overflow-hidden rounded-3xl p-6" style={{
        background: 'linear-gradient(135deg, #1e1040 0%, #130d28 50%, #0a0d1e 100%)',
        border: '1px solid rgba(139,92,246,0.3)',
        boxShadow: '0 16px 64px rgba(139,92,246,0.15)',
      }}>
        {/* Decorative blobs */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #8b5cf6, transparent 70%)' }} />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #6366f1, transparent 70%)' }} />

        <div className="relative">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)' }}>
              <Wallet className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <p className="text-violet-300 text-xs font-medium uppercase tracking-widest">Available Balance</p>
            </div>
          </div>
          <p className="text-5xl font-black text-white mt-3 mb-1">₹{balance.toLocaleString()}</p>
          <p className="text-violet-400/60 text-xs">Min. withdrawal ₹500 · Processed in 24–48h</p>

          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="rounded-2xl p-3.5" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                <span className="text-green-300 text-[10px] font-semibold uppercase tracking-wider">Total Earned</span>
              </div>
              <p className="text-green-400 font-black text-xl">₹{totalEarned.toLocaleString()}</p>
            </div>
            <div className="rounded-2xl p-3.5" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <ArrowUpRight className="w-3.5 h-3.5 text-red-400" />
                <span className="text-red-300 text-[10px] font-semibold uppercase tracking-wider">Total Withdrawn</span>
              </div>
              <p className="text-red-400 font-black text-xl">₹{totalWithdrawn.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="rounded-3xl overflow-hidden" style={{ background: 'rgba(13,13,20,0.95)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)' }}>
              <Coins className="w-4 h-4 text-indigo-400" />
            </div>
            <h2 className="font-bold text-white">Transaction History</h2>
          </div>
          <span className="text-gray-500 text-xs">{txData?.total || 0} transactions</span>
        </div>

        <div className="p-3 space-y-1.5">
          {(txData?.transactions || []).length === 0 ? (
            <div className="text-center py-14">
              <div className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <Wallet className="w-7 h-7 text-gray-600" />
              </div>
              <p className="text-gray-500 font-medium">No transactions yet</p>
              <p className="text-gray-600 text-sm mt-1">Your earnings will appear here</p>
            </div>
          ) : (
            (txData?.transactions || []).map((tx: any) => {
              const isCredit = tx.type === 'credit'
              const cat = CAT_CONFIG[tx.category] || { color: 'text-gray-400', bg: 'bg-white/5', label: tx.category }
              return (
                <div key={tx._id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/[0.03] transition-colors group">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${isCredit ? 'bg-green-500/15' : 'bg-red-500/10'}`}>
                    {isCredit
                      ? <ArrowDownLeft className="w-4 h-4 text-green-400" />
                      : <ArrowUpRight className="w-4 h-4 text-red-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{tx.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${cat.bg} ${cat.color}`}>{cat.label}</span>
                      <span className="text-[10px] text-gray-600 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {format(new Date(tx.createdAt), 'dd MMM, h:mm a')}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 flex items-center gap-2">
                    <p className={`font-bold text-sm ${isCredit ? 'text-green-400' : 'text-red-400'}`}>
                      {isCredit ? '+' : '-'}₹{tx.amount.toLocaleString()}
                    </p>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      tx.status === 'completed' ? 'bg-green-400' :
                      tx.status === 'pending' ? 'bg-yellow-400' : 'bg-red-400'
                    }`} />
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Pagination */}
        {txData?.pages > 1 && (
          <div className="flex items-center justify-between p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-gray-400 hover:text-white disabled:opacity-30 transition-colors" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </button>
            <div className="flex gap-1">
              {Array.from({ length: txData.pages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${page === p ? 'bg-violet-600 text-white' : 'text-gray-500 hover:text-white'}`}
                  style={page !== p ? { background: 'rgba(255,255,255,0.04)' } : {}}>
                  {p}
                </button>
              ))}
            </div>
            <button onClick={() => setPage(p => Math.min(txData.pages, p + 1))} disabled={page === txData?.pages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-gray-400 hover:text-white disabled:opacity-30 transition-colors" style={{ background: 'rgba(255,255,255,0.05)' }}>
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
