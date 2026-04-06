'use client'
import { useQuery } from '@tanstack/react-query'
import { walletAPI } from '@/lib/api'
import { Wallet, ArrowUpRight, ArrowDownLeft, TrendingUp, Loader2 } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function WalletPage() {
  const [amount, setAmount] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)

  const { data, refetch } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => walletAPI.get().then(r => r.data)
  })

  const handleWithdraw = async () => {
    if (!amount || Number(amount) < 100) return toast.error('Minimum withdrawal ₹100')
    try {
      setWithdrawing(true)
      await walletAPI.withdraw({ amount: Number(amount) })
      toast.success('Withdrawal request submitted!')
      setAmount('')
      refetch()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Withdrawal failed')
    } finally {
      setWithdrawing(false)
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white">Wallet</h1>

      {/* Balance card */}
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Wallet className="w-6 h-6" />
          <span className="text-sm opacity-80">Available Balance</span>
        </div>
        <div className="text-5xl font-black mb-6">₹{data?.balance?.toLocaleString() || 0}</div>
        <div className="flex gap-4">
          <div className="bg-white/10 rounded-xl p-4 flex-1">
            <input value={amount} onChange={e => setAmount(e.target.value)} type="number"
              placeholder="Enter amount (min ₹100)" className="bg-transparent text-white placeholder-white/60 outline-none w-full text-sm" />
          </div>
          <button onClick={handleWithdraw} disabled={withdrawing}
            className="bg-white text-primary-600 font-bold px-6 py-4 rounded-xl hover:bg-primary-50 transition-colors flex items-center gap-2">
            {withdrawing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}
            Withdraw
          </button>
        </div>
      </div>

      {/* Transactions */}
      <div className="card">
        <h2 className="text-lg font-bold text-white mb-4">Transaction History</h2>
        <div className="space-y-3">
          {data?.transactions?.length ? data.transactions.map((tx: any) => (
            <div key={tx._id} className="flex items-center justify-between p-3 bg-dark-700 rounded-xl">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'credit' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {tx.type === 'credit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-medium text-white text-sm">{tx.description}</p>
                  <p className="text-xs text-gray-400">{format(new Date(tx.createdAt), 'dd MMM yyyy, hh:mm a')}</p>
                </div>
              </div>
              <div className={`font-bold ${tx.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toLocaleString()}
              </div>
            </div>
          )) : <p className="text-gray-400 text-sm">No transactions yet.</p>}
        </div>
      </div>
    </div>
  )
}
