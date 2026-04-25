'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { managerAPI } from '@/lib/api'
import {
  ChevronLeft, Loader2, IndianRupee, Users, Target, Trophy,
  Send, Trash2, Plus, CheckCircle, Clock, AlertCircle,
  MessageSquare, Flag, Lightbulb, Bell, Star, X, TrendingUp,
  Wallet, BarChart2, Award, Calendar, ChevronDown, ChevronUp,
  Phone, MessageCircle
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

const TIER_COLOR: Record<string, string> = {
  free: 'bg-gray-500/20 text-gray-400', starter: 'bg-blue-500/20 text-blue-400',
  pro: 'bg-indigo-500/20 text-indigo-400', elite: 'bg-violet-500/20 text-violet-400',
  supreme: 'bg-yellow-500/20 text-yellow-400',
}
const TIP_CAT: Record<string, { label: string; color: string; icon: any }> = {
  tip:        { label: 'Tip',        color: 'bg-blue-500/15 text-blue-300 border-blue-500/20',       icon: Lightbulb },
  feedback:   { label: 'Feedback',   color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/20',  icon: MessageSquare },
  motivation: { label: 'Motivation', color: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/20',  icon: Star },
  warning:    { label: 'Warning',    color: 'bg-red-500/15 text-red-300 border-red-500/20',            icon: AlertCircle },
  update:     { label: 'Update',     color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20', icon: Bell },
}
const GOAL_STATUS: Record<string, string> = {
  active: 'bg-blue-500/15 text-blue-400', completed: 'bg-green-500/15 text-green-400',
  missed: 'bg-red-500/15 text-red-400',   cancelled: 'bg-gray-500/15 text-gray-400',
}

type TabType = 'overview' | 'tips' | 'goals' | 'referrals'

export default function PartnerDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const qc = useQueryClient()
  const [tab, setTab] = useState<TabType>('overview')

  // Tip form
  const [tipMsg, setTipMsg]     = useState('')
  const [tipCat, setTipCat]     = useState('tip')
  const [showTipForm, setShowTipForm] = useState(false)

  // Goal form
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [goalForm, setGoalForm] = useState({ title: '', description: '', targetValue: '', metric: 'referrals', unit: 'referrals', dueDate: '', reward: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['manager-partner-detail', id],
    queryFn:  () => managerAPI.partnerDetail(id).then(r => r.data),
  })

  const sendTipMutation = useMutation({
    mutationFn: () => managerAPI.sendTip(id, { message: tipMsg, category: tipCat }),
    onSuccess: () => {
      toast.success('Tip sent!')
      setTipMsg(''); setShowTipForm(false)
      qc.invalidateQueries({ queryKey: ['manager-partner-detail', id] })
    },
    onError: () => toast.error('Failed to send tip'),
  })

  const deleteTipMutation = useMutation({
    mutationFn: (tipId: string) => managerAPI.deleteTip(tipId),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['manager-partner-detail', id] }) },
  })

  const createGoalMutation = useMutation({
    mutationFn: () => managerAPI.createGoal(id, { ...goalForm, targetValue: Number(goalForm.targetValue) }),
    onSuccess: () => {
      toast.success('Goal created!')
      setGoalForm({ title: '', description: '', targetValue: '', metric: 'referrals', unit: 'referrals', dueDate: '', reward: '' })
      setShowGoalForm(false)
      qc.invalidateQueries({ queryKey: ['manager-partner-detail', id] })
    },
    onError: () => toast.error('Failed to create goal'),
  })

  const deleteGoalMutation = useMutation({
    mutationFn: (goalId: string) => managerAPI.deleteGoal(goalId),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['manager-partner-detail', id] }) },
  })

  const updateGoalMutation = useMutation({
    mutationFn: ({ goalId, status }: { goalId: string; status: string }) => managerAPI.updateGoal(goalId, { status }),
    onSuccess: () => { toast.success('Updated'); qc.invalidateQueries({ queryKey: ['manager-partner-detail', id] }) },
  })

  if (isLoading) return <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div>
  if (!data?.partner) return (
    <div className="text-center py-16">
      <p className="text-gray-400">Partner not found or not assigned to you.</p>
      <Link href="/manager/partners" className="text-emerald-400 hover:underline mt-2 inline-block">Go Back</Link>
    </div>
  )

  const p        = data.partner
  const tips     = data.tips || []
  const goals    = data.goals || []
  const referrals = data.l1 || []

  const tabs: { key: TabType; label: string; icon: any; count?: number }[] = [
    { key: 'overview',  label: 'Overview',   icon: BarChart2,      },
    { key: 'tips',      label: 'Tips',        icon: Lightbulb,     count: tips.length },
    { key: 'goals',     label: 'Goals',       icon: Target,        count: goals.length },
    { key: 'referrals', label: 'Referrals',   icon: Users,         count: data.l1Total },
  ]

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Back */}
      <Link href="/manager/partners" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
        <ChevronLeft className="w-4 h-4" /> My Partners
      </Link>

      {/* Partner Hero Card */}
      <div className="bg-gradient-to-br from-dark-800 to-dark-900 rounded-2xl border border-white/5 p-5 sm:p-6">
        <div className="flex items-start gap-4 flex-wrap">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center text-2xl font-bold text-emerald-400 flex-shrink-0">
            {p.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-white">{p.name}</h1>
              <span className={`text-xs px-2.5 py-1 rounded-xl capitalize font-semibold ${TIER_COLOR[p.packageTier] || TIER_COLOR.free}`}>
                {p.packageTier}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-lg ${p.isActive ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                {p.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-gray-400 text-sm mt-1">{p.email} {p.phone ? `· ${p.phone}` : ''}</p>
            <div className="flex items-center gap-2 mt-2">
              {p.phone && (
                <>
                  <a href={`tel:${p.phone}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-medium transition-colors">
                    <Phone className="w-3.5 h-3.5" /> Call
                  </a>
                  <a href={`https://wa.me/${p.phone?.replace(/[^0-9]/g,'').replace(/^0/,'91')}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-medium transition-colors">
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </a>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 px-2.5 py-1 rounded-lg font-mono font-semibold">
                {p.affiliateCode}
              </span>
              <span className="text-xs text-gray-500">Joined {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          {[
            { label: 'Total Earnings', value: `₹${(p.totalEarnings || 0).toLocaleString()}`, icon: IndianRupee, color: 'text-yellow-400' },
            { label: 'Wallet Balance', value: `₹${(p.wallet || 0).toLocaleString()}`,        icon: Wallet,      color: 'text-blue-400' },
            { label: 'L1 Referrals',  value: data.l1Total || 0,                              icon: Users,       color: 'text-violet-400' },
            { label: 'Paid Referrals',value: data.l1Paid  || 0,                              icon: CheckCircle, color: 'text-green-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-dark-700 rounded-xl p-3 text-center">
              <stat.icon className={`w-4 h-4 mx-auto mb-1 ${stat.color}`} />
              <p className="text-base sm:text-lg font-bold text-white">{stat.value}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* KYC status */}
        {p.kyc?.status && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs text-gray-500">KYC:</span>
            <span className={`text-xs px-2 py-0.5 rounded capitalize font-medium ${
              p.kyc.status === 'verified' ? 'text-green-400 bg-green-500/10' :
              p.kyc.status === 'submitted' ? 'text-yellow-400 bg-yellow-500/10' :
              p.kyc.status === 'rejected' ? 'text-red-400 bg-red-500/10' : 'text-gray-400 bg-gray-500/10'
            }`}>{p.kyc.status}</span>
          </div>
        )}
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-dark-800 p-1 rounded-xl border border-white/5 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
              tab === t.key ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
            {t.count != null && t.count > 0 && (
              <span className={`text-[10px] px-1.5 rounded-full ${tab === t.key ? 'bg-emerald-500/25 text-emerald-300' : 'bg-white/10 text-gray-400'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB: Overview ── */}
      {tab === 'overview' && (
        <div className="space-y-4">
          {/* Commission info */}
          <div className="bg-dark-800 rounded-2xl border border-white/5 p-5">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-400" /> Partner Performance</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-gray-500">Partnership earning Rate</p><p className="text-white font-bold mt-0.5">{p.commissionRate || 0}%</p></div>
              <div><p className="text-gray-500">Package Tier</p><p className="text-white font-bold mt-0.5 capitalize">{p.packageTier}</p></div>
              <div><p className="text-gray-500">Paid Referrals</p><p className="text-white font-bold mt-0.5">{data.l1Paid} / {data.l1Total}</p></div>
              <div><p className="text-gray-500">Active Goals</p><p className="text-white font-bold mt-0.5">{goals.filter((g: any) => g.status === 'active').length}</p></div>
            </div>
          </div>

          {/* Recent commissions */}
          {data.commissions?.length > 0 && (
            <div className="bg-dark-800 rounded-2xl border border-white/5 p-5">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Award className="w-4 h-4 text-yellow-400" /> Recent Partnership earnings</h3>
              <div className="space-y-2">
                {data.commissions.slice(0, 5).map((c: any) => (
                  <div key={c._id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div>
                      <p className="text-sm text-white font-medium">{c.buyer?.name || 'User'}</p>
                      <p className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                    </div>
                    <span className="text-sm font-bold text-green-400">+₹{(c.amount || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => { setTab('tips'); setShowTipForm(true) }}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-500/15 text-blue-300 border border-blue-500/20 text-sm font-semibold hover:bg-blue-500/25 transition-colors">
              <Lightbulb className="w-4 h-4" /> Send Tip
            </button>
            <button onClick={() => { setTab('goals'); setShowGoalForm(true) }}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500/15 text-orange-300 border border-orange-500/20 text-sm font-semibold hover:bg-orange-500/25 transition-colors">
              <Target className="w-4 h-4" /> Set Goal
            </button>
          </div>
        </div>
      )}

      {/* ── TAB: Tips ── */}
      {tab === 'tips' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-lg">Tips & Messages</h2>
            <button onClick={() => setShowTipForm(o => !o)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/15 text-blue-300 text-sm font-semibold hover:bg-blue-500/25 border border-blue-500/20 transition-colors">
              <Plus className="w-4 h-4" /> Send Tip
            </button>
          </div>

          {/* Tip Form */}
          {showTipForm && (
            <div className="bg-dark-800 rounded-2xl border border-blue-500/20 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">New Message to {p.name?.split(' ')[0]}</h3>
                <button onClick={() => setShowTipForm(false)}><X className="w-4 h-4 text-gray-400" /></button>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block uppercase tracking-wide">Category</label>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(TIP_CAT).map(([key, val]) => (
                    <button key={key} onClick={() => setTipCat(key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${tipCat === key ? val.color + ' border-current' : 'bg-dark-700 text-gray-400 border-white/8 hover:text-white'}`}>
                      <val.icon className="w-3 h-3" /> {val.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block uppercase tracking-wide">Message</label>
                <textarea value={tipMsg} onChange={e => setTipMsg(e.target.value)} rows={4}
                  placeholder={
                    tipCat === 'tip' ? 'Share a useful tip with your partner...' :
                    tipCat === 'feedback' ? 'Give constructive feedback...' :
                    tipCat === 'motivation' ? 'Motivate your partner!' :
                    tipCat === 'warning' ? 'Flag an important concern...' :
                    'Share an important update...'
                  }
                  className="w-full bg-dark-700 border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/40 resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowTipForm(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:text-white">Cancel</button>
                <button onClick={() => sendTipMutation.mutate()} disabled={!tipMsg.trim() || sendTipMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                  {sendTipMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send
                </button>
              </div>
            </div>
          )}

          {/* Tips list */}
          {tips.length === 0 ? (
            <div className="text-center py-16 bg-dark-800 rounded-2xl border border-white/5">
              <Lightbulb className="w-12 h-12 mx-auto mb-3 text-gray-700" />
              <p className="text-gray-400 font-medium">No tips sent yet</p>
              <p className="text-gray-500 text-sm mt-1">Send tips, feedback or motivational messages to your partner</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tips.map((tip: any) => {
                const cat = TIP_CAT[tip.category] || TIP_CAT.tip
                return (
                  <div key={tip._id} className={`bg-dark-800 rounded-2xl border p-4 ${cat.color.split(' ').filter(c => c.startsWith('border')).join(' ') || 'border-white/5'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${cat.color}`}>
                          <cat.icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded font-semibold ${cat.color}`}>{cat.label}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(tip.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{tip.message}</p>
                        </div>
                      </div>
                      <button onClick={() => { if (confirm('Delete this tip?')) deleteTipMutation.mutate(tip._id) }}
                        className="flex-shrink-0 text-gray-600 hover:text-red-400 p-1 rounded-lg hover:bg-red-500/10 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Goals ── */}
      {tab === 'goals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-lg">Partner Goals</h2>
            <button onClick={() => setShowGoalForm(o => !o)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/15 text-orange-300 text-sm font-semibold hover:bg-orange-500/25 border border-orange-500/20 transition-colors">
              <Plus className="w-4 h-4" /> New Goal
            </button>
          </div>

          {/* Goal form */}
          {showGoalForm && (
            <div className="bg-dark-800 rounded-2xl border border-orange-500/20 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">Create Goal for {p.name?.split(' ')[0]}</h3>
                <button onClick={() => setShowGoalForm(false)}><X className="w-4 h-4 text-gray-400" /></button>
              </div>

              <input value={goalForm.title} onChange={e => setGoalForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Goal title * (e.g. Get 10 Paid Referrals)"
                className="w-full bg-dark-700 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/40" />

              <textarea value={goalForm.description} onChange={e => setGoalForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Description / instructions (optional)" rows={2}
                className="w-full bg-dark-700 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none resize-none" />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Metric</label>
                  <select value={goalForm.metric} onChange={e => setGoalForm(f => ({ ...f, metric: e.target.value, unit: e.target.value }))}
                    className="w-full bg-dark-700 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
                    <option value="referrals">Referrals</option>
                    <option value="earnings">Earnings (₹)</option>
                    <option value="leads">Leads</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Target Value *</label>
                  <input type="number" value={goalForm.targetValue} onChange={e => setGoalForm(f => ({ ...f, targetValue: e.target.value }))}
                    placeholder={goalForm.metric === 'earnings' ? '5000' : '10'}
                    className="w-full bg-dark-700 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Due Date (optional)</label>
                  <input type="date" value={goalForm.dueDate} onChange={e => setGoalForm(f => ({ ...f, dueDate: e.target.value }))}
                    className="w-full bg-dark-700 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none [color-scheme:dark]" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Reward (optional)</label>
                  <input value={goalForm.reward} onChange={e => setGoalForm(f => ({ ...f, reward: e.target.value }))}
                    placeholder="₹500 bonus / Badge"
                    className="w-full bg-dark-700 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none" />
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowGoalForm(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:text-white">Cancel</button>
                <button onClick={() => createGoalMutation.mutate()}
                  disabled={!goalForm.title || !goalForm.targetValue || createGoalMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                  {createGoalMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
                  Create Goal
                </button>
              </div>
            </div>
          )}

          {/* Goals list */}
          {goals.length === 0 ? (
            <div className="text-center py-16 bg-dark-800 rounded-2xl border border-white/5">
              <Target className="w-12 h-12 mx-auto mb-3 text-gray-700" />
              <p className="text-gray-400 font-medium">No goals set yet</p>
              <p className="text-gray-500 text-sm mt-1">Set goals to track partner's progress</p>
            </div>
          ) : (
            <div className="space-y-3">
              {goals.map((goal: any) => {
                const pct = goal.targetValue > 0 ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100)) : 0
                const isOverdue = goal.dueDate && new Date(goal.dueDate) < new Date() && goal.status === 'active'
                return (
                  <div key={goal._id} className={`bg-dark-800 rounded-2xl border p-5 space-y-3 ${isOverdue ? 'border-red-500/20' : 'border-white/5'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded capitalize font-semibold ${GOAL_STATUS[goal.status] || GOAL_STATUS.active}`}>
                            {goal.status}
                          </span>
                          <span className="text-xs text-gray-500 capitalize">{goal.metric}</span>
                          {isOverdue && <span className="text-xs text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">Overdue</span>}
                        </div>
                        <h3 className="text-white font-semibold">{goal.title}</h3>
                        {goal.description && <p className="text-gray-400 text-sm mt-0.5">{goal.description}</p>}
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 flex-wrap">
                          {goal.dueDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Due: {new Date(goal.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                          {goal.reward && <span className="flex items-center gap-1 text-yellow-400"><Award className="w-3 h-3" />{goal.reward}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {goal.status === 'active' && (
                          <>
                            <button onClick={() => updateGoalMutation.mutate({ goalId: goal._id, status: 'completed' })}
                              className="text-green-400 hover:bg-green-500/10 p-1.5 rounded-lg transition-colors" title="Mark completed">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => updateGoalMutation.mutate({ goalId: goal._id, status: 'missed' })}
                              className="text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors" title="Mark missed">
                              <AlertCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button onClick={() => { if (confirm('Delete goal?')) deleteGoalMutation.mutate(goal._id) }}
                          className="text-gray-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                        <span>{goal.currentValue} / {goal.targetValue} {goal.unit}</span>
                        <span className={`font-semibold ${pct >= 100 ? 'text-green-400' : pct > 50 ? 'text-blue-400' : 'text-gray-400'}`}>{pct}%</span>
                      </div>
                      <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${
                          goal.status === 'completed' ? 'bg-green-500' :
                          pct > 70 ? 'bg-blue-500' : 'bg-gradient-to-r from-orange-500 to-amber-500'
                        }`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Referrals ── */}
      {tab === 'referrals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-lg">L1 Referrals</h2>
            <span className="text-xs text-gray-500 bg-dark-800 px-3 py-1.5 rounded-xl border border-white/5">
              {data.l1Total} total · {data.l1Paid} paid
            </span>
          </div>

          {referrals.length === 0 ? (
            <div className="text-center py-16 bg-dark-800 rounded-2xl border border-white/5">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-700" />
              <p className="text-gray-400">No referrals yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {referrals.map((ref: any) => (
                <div key={ref._id} className="bg-dark-800 rounded-2xl border border-white/5 p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center text-sm font-bold text-violet-400 flex-shrink-0">
                    {ref.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{ref.name}</p>
                    <p className="text-xs text-gray-500">{ref.email}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded capitalize font-medium ${TIER_COLOR[ref.packageTier] || TIER_COLOR.free}`}>
                      {ref.packageTier}
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(ref.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
              {data.l1Total > referrals.length && (
                <p className="text-center text-xs text-gray-500 py-2">Showing first 20 referrals</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
