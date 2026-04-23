'use client'
import { useState, useRef, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import AdminLayout from '@/components/AdminLayout'
import { adminAPI } from '@/lib/api'
import { usePackages } from '@/lib/usePackages'
import toast from 'react-hot-toast'
import {
  MessageSquare, Mail, Send, Plus, Trash2, X, Loader2,
  ChevronRight, Search, Bot, Zap, LayoutTemplate,
  Users, CheckCircle2, XCircle, Clock, Eye,
  Smartphone, AtSign, Target, ToggleLeft, ToggleRight,
  ArrowRight, Copy, RefreshCw, Filter, MoreVertical,
  TrendingUp, Inbox, Settings2
} from 'lucide-react'
import { format } from 'date-fns'

type Tab = 'overview' | 'email' | 'whatsapp' | 'chats' | 'templates' | 'chatbot'

// ── helpers ──────────────────────────────────────────────────────────────────
const statusBadge: Record<string, string> = {
  draft: 'text-gray-400 bg-gray-500/20',
  sending: 'text-blue-400 bg-blue-500/20 animate-pulse',
  sent: 'text-green-400 bg-green-500/20',
  failed: 'text-red-400 bg-red-500/20',
  scheduled: 'text-amber-400 bg-amber-500/20',
}
const catBadge: Record<string, string> = {
  promotional: 'text-pink-400 bg-pink-500/20',
  welcome: 'text-green-400 bg-green-500/20',
  followup: 'text-blue-400 bg-blue-500/20',
  reminder: 'text-amber-400 bg-amber-500/20',
  announcement: 'text-violet-400 bg-violet-500/20',
  custom: 'text-gray-400 bg-gray-500/20',
}

const ROLES = ['student', 'mentor', 'manager', 'admin']
const CATS = ['promotional', 'welcome', 'followup', 'reminder', 'announcement', 'custom']

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <div className={`rounded-2xl border p-5 bg-gradient-to-br ${color}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-white/80" />
        </div>
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-xs text-white/60 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-white/40 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function MarketingPage() {
  const { packages: tierPackages } = usePackages({ includeFree: true })
  const [tab, setTab] = useState<Tab>('overview')
  const qc = useQueryClient()

  // campaign form state
  const [showCampaignModal, setShowCampaignModal] = useState(false)
  const [campaignType, setCampaignType] = useState<'email' | 'whatsapp'>('email')
  const [campaignForm, setCampaignForm] = useState({ name: '', subject: '', body: '', roles: [] as string[], tiers: [] as string[], customEmails: '', customPhones: '' })
  const [savingCampaign, setSavingCampaign] = useState(false)
  const [sendingId, setSendingId] = useState('')
  const [deletingId, setDeletingId] = useState('')

  // template form state
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [tplForm, setTplForm] = useState({ name: '', type: 'email' as 'email' | 'whatsapp', category: 'custom', subject: '', body: '', previewText: '' })
  const [savingTpl, setSavingTpl] = useState(false)
  const [editingTpl, setEditingTpl] = useState<any>(null)

  // chat state
  const [selectedChat, setSelectedChat] = useState<any>(null)
  const [chatSearch, setChatSearch] = useState('')
  const [chatMsg, setChatMsg] = useState('')
  const [sendingChat, setSendingChat] = useState(false)
  const [newChatPhone, setNewChatPhone] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  // chatbot state
  const [showBotModal, setShowBotModal] = useState(false)
  const [botForm, setBotForm] = useState({ name: '', trigger: '', steps: [{ order: 1, message: '', delaySeconds: 0 }] })
  const [savingBot, setSavingBot] = useState(false)

  // single send
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [singleEmail, setSingleEmail] = useState({ to: '', subject: '', body: '' })
  const [sendingSingle, setSendingSingle] = useState(false)

  // queries
  const { data: overview } = useQuery({ queryKey: ['mkt-overview'], queryFn: () => adminAPI.marketingOverview().then(r => r.data) })
  const { data: campaigns, isLoading: loadCamp } = useQuery({ queryKey: ['mkt-campaigns', campaignType], queryFn: () => adminAPI.getCampaigns({ type: tab === 'email' ? 'email' : tab === 'whatsapp' ? 'whatsapp' : undefined }).then(r => r.data), enabled: tab === 'email' || tab === 'whatsapp' || tab === 'overview' })
  const { data: templates, isLoading: loadTpl } = useQuery({ queryKey: ['mkt-templates'], queryFn: () => adminAPI.getTemplates().then(r => r.data), enabled: tab === 'templates' || tab === 'email' || tab === 'whatsapp' })
  const { data: chats, isLoading: loadChats } = useQuery({ queryKey: ['mkt-chats', chatSearch], queryFn: () => adminAPI.getChats({ search: chatSearch || undefined }).then(r => r.data), enabled: tab === 'chats' })
  const { data: chatDetail, refetch: refetchChat } = useQuery({ queryKey: ['mkt-chat', selectedChat?.contactPhone], queryFn: () => adminAPI.getChat(selectedChat.contactPhone).then(r => r.data.chat), enabled: !!selectedChat })
  const { data: botFlows, isLoading: loadBot } = useQuery({ queryKey: ['mkt-chatbot'], queryFn: () => adminAPI.getChatbotFlows().then(r => r.data), enabled: tab === 'chatbot' })

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatDetail])

  // ── Actions ────────────────────────────────────────────────────────────────
  const saveCampaign = async () => {
    if (!campaignForm.name || !campaignForm.body) return toast.error('Name and body required')
    setSavingCampaign(true)
    try {
      const targetFilter: any = {}
      if (campaignForm.roles.length) targetFilter.roles = campaignForm.roles
      if (campaignForm.tiers.length) targetFilter.packageTiers = campaignForm.tiers
      if (campaignForm.customEmails.trim()) targetFilter.customEmails = campaignForm.customEmails.split(',').map(e => e.trim()).filter(Boolean)
      if (campaignForm.customPhones.trim()) targetFilter.customPhones = campaignForm.customPhones.split(',').map(p => p.trim()).filter(Boolean)
      await adminAPI.createCampaign({ name: campaignForm.name, type: campaignType, subject: campaignForm.subject, body: campaignForm.body, targetFilter })
      toast.success('Campaign created')
      setShowCampaignModal(false)
      setCampaignForm({ name: '', subject: '', body: '', roles: [], tiers: [], customEmails: '', customPhones: '' })
      qc.invalidateQueries({ queryKey: ['mkt-campaigns'] })
      qc.invalidateQueries({ queryKey: ['mkt-overview'] })
    } catch { toast.error('Failed') } finally { setSavingCampaign(false) }
  }

  const sendCampaign = async (id: string) => {
    if (!confirm('Send this campaign now? This will message all targeted users.')) return
    setSendingId(id)
    try {
      const res = await adminAPI.sendCampaign(id)
      toast.success(res.data.message || 'Campaign sent!')
      qc.invalidateQueries({ queryKey: ['mkt-campaigns'] })
      qc.invalidateQueries({ queryKey: ['mkt-overview'] })
    } catch (e: any) { toast.error(e.response?.data?.message || 'Send failed') } finally { setSendingId('') }
  }

  const deleteCampaign = async (id: string) => {
    if (!confirm('Delete campaign?')) return
    setDeletingId(id)
    try { await adminAPI.deleteCampaign(id); toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['mkt-campaigns'] }) }
    catch { toast.error('Failed') } finally { setDeletingId('') }
  }

  const saveTemplate = async () => {
    if (!tplForm.name || !tplForm.body) return toast.error('Name and body required')
    setSavingTpl(true)
    try {
      if (editingTpl) { await adminAPI.updateTemplate(editingTpl._id, tplForm); toast.success('Updated') }
      else { await adminAPI.createTemplate(tplForm); toast.success('Template created') }
      setShowTemplateModal(false); setEditingTpl(null)
      setTplForm({ name: '', type: 'email', category: 'custom', subject: '', body: '', previewText: '' })
      qc.invalidateQueries({ queryKey: ['mkt-templates'] })
    } catch { toast.error('Failed') } finally { setSavingTpl(false) }
  }

  const deleteTemplate = async (id: string) => {
    if (!confirm('Delete template?')) return
    try { await adminAPI.deleteTemplate(id); toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['mkt-templates'] }) }
    catch { toast.error('Failed') }
  }

  const openEditTpl = (tpl: any) => {
    setEditingTpl(tpl)
    setTplForm({ name: tpl.name, type: tpl.type, category: tpl.category, subject: tpl.subject || '', body: tpl.body, previewText: tpl.previewText || '' })
    setShowTemplateModal(true)
  }

  const sendChatMsg = async () => {
    if (!chatMsg.trim() || !selectedChat) return
    setSendingChat(true)
    try {
      await adminAPI.sendWhatsApp(selectedChat.contactPhone, chatMsg)
      setChatMsg('')
      refetchChat()
      qc.invalidateQueries({ queryKey: ['mkt-chats'] })
    } catch { toast.error('Send failed — check WhatsApp API config') } finally { setSendingChat(false) }
  }

  const sendSingleEmail = async () => {
    if (!singleEmail.to || !singleEmail.subject || !singleEmail.body) return toast.error('All fields required')
    setSendingSingle(true)
    try { await adminAPI.sendSingleEmail(singleEmail); toast.success('Email sent!'); setShowEmailModal(false); setSingleEmail({ to: '', subject: '', body: '' }) }
    catch { toast.error('Failed to send') } finally { setSendingSingle(false) }
  }

  const saveBot = async () => {
    if (!botForm.name || !botForm.trigger) return toast.error('Name and trigger required')
    setSavingBot(true)
    try {
      await adminAPI.createChatbotFlow(botForm)
      toast.success('Flow created'); setShowBotModal(false)
      setBotForm({ name: '', trigger: '', steps: [{ order: 1, message: '', delaySeconds: 0 }] })
      qc.invalidateQueries({ queryKey: ['mkt-chatbot'] })
    } catch { toast.error('Failed') } finally { setSavingBot(false) }
  }

  const toggleBot = async (id: string) => {
    try { await adminAPI.toggleChatbotFlow(id); qc.invalidateQueries({ queryKey: ['mkt-chatbot'] }) }
    catch { toast.error('Failed') }
  }

  const stats = overview?.stats || {}
  const recentCampaigns = overview?.recentCampaigns || []

  const TABS: { id: Tab; label: string; icon: any; color: string }[] = [
    { id: 'overview', label: 'Overview', icon: TrendingUp, color: 'text-violet-400' },
    { id: 'email', label: 'Email', icon: Mail, color: 'text-blue-400' },
    { id: 'whatsapp', label: 'WhatsApp', icon: Smartphone, color: 'text-green-400' },
    { id: 'chats', label: 'Chats', icon: Inbox, color: 'text-amber-400' },
    { id: 'templates', label: 'Templates', icon: LayoutTemplate, color: 'text-pink-400' },
    { id: 'chatbot', label: 'Chatbot', icon: Bot, color: 'text-cyan-400' },
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* ── Page Header ── */}
        <div className="page-header">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-pink-600 flex items-center justify-center shadow-lg">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                Marketing Hub
              </h1>
              <p className="text-gray-400 text-sm mt-1">WhatsApp, Email, Templates, Chatbot — all in one place</p>
            </div>
          <div className="flex gap-2">
            {tab === 'email' && (
              <>
                <button onClick={() => setShowEmailModal(true)} className="btn-secondary flex items-center gap-1.5 text-sm px-3 py-2">
                  <AtSign className="w-4 h-4" /> Quick Send
                </button>
                <button onClick={() => { setCampaignType('email'); setShowCampaignModal(true) }} className="btn-primary flex items-center gap-1.5 text-sm">
                  <Plus className="w-4 h-4" /> New Campaign
                </button>
              </>
            )}
            {tab === 'whatsapp' && (
              <button onClick={() => { setCampaignType('whatsapp'); setShowCampaignModal(true) }} className="btn-primary flex items-center gap-1.5 text-sm">
                <Plus className="w-4 h-4" /> New Campaign
              </button>
            )}
            {tab === 'templates' && (
              <button onClick={() => setShowTemplateModal(true)} className="btn-primary flex items-center gap-1.5 text-sm">
                <Plus className="w-4 h-4" /> New Template
              </button>
            )}
            {tab === 'chatbot' && (
              <button onClick={() => setShowBotModal(true)} className="btn-primary flex items-center gap-1.5 text-sm">
                <Plus className="w-4 h-4" /> New Flow
              </button>
            )}
          </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="tab-bar w-fit">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 ${tab === t.id ? 'tab-active' : 'tab-inactive'}`}>
              <t.icon className={`w-4 h-4 ${tab === t.id ? 'text-white' : t.color}`} />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ────────────────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={Mail} label="Emails Sent" value={(stats.emailSent || 0).toLocaleString()} sub={`${stats.emailFailed || 0} failed`} color="from-blue-500/20 to-blue-600/5 border-blue-500/20" />
              <StatCard icon={Smartphone} label="WhatsApp Sent" value={(stats.waSent || 0).toLocaleString()} sub={`${stats.waFailed || 0} failed`} color="from-green-500/20 to-green-600/5 border-green-500/20" />
              <StatCard icon={Inbox} label="Total Chats" value={stats.totalChats || 0} color="from-amber-500/20 to-amber-600/5 border-amber-500/20" />
              <StatCard icon={LayoutTemplate} label="Active Templates" value={stats.totalTemplates || 0} color="from-pink-500/20 to-pink-600/5 border-pink-500/20" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={Send} label="Total Campaigns" value={stats.totalCampaigns || 0} color="from-violet-500/20 to-violet-600/5 border-violet-500/20" />
              <StatCard icon={CheckCircle2} label="Sent Campaigns" value={stats.sentCampaigns || 0} color="from-emerald-500/20 to-emerald-600/5 border-emerald-500/20" />
              <StatCard icon={Bot} label="Active Chatbot Flows" value={stats.chatbotFlows || 0} color="from-cyan-500/20 to-cyan-600/5 border-cyan-500/20" />
              <StatCard icon={Target} label="Total Targeted" value={(stats.emailSent + stats.waSent || 0).toLocaleString()} sub="across all campaigns" color="from-rose-500/20 to-rose-600/5 border-rose-500/20" />
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'New Email Campaign', desc: 'Send bulk emails to users', icon: Mail, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', action: () => { setCampaignType('email'); setShowCampaignModal(true); setTab('email') } },
                { label: 'New WhatsApp Blast', desc: 'Reach users on WhatsApp', icon: Smartphone, color: 'text-green-400 bg-green-500/10 border-green-500/20', action: () => { setCampaignType('whatsapp'); setShowCampaignModal(true); setTab('whatsapp') } },
                { label: 'View Chats', desc: 'See all WhatsApp conversations', icon: Inbox, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', action: () => setTab('chats') },
              ].map((a, i) => (
                <button key={i} onClick={a.action} className={`rounded-2xl border p-5 text-left hover:scale-[1.02] transition-all group ${a.color}`}>
                  <a.icon className="w-7 h-7 mb-3" />
                  <p className="font-bold text-white text-sm">{a.label}</p>
                  <p className="text-xs mt-0.5 opacity-70">{a.desc}</p>
                  <div className="flex items-center gap-1 text-xs mt-3 opacity-60 group-hover:opacity-100 transition-opacity">
                    Get started <ArrowRight className="w-3 h-3" />
                  </div>
                </button>
              ))}
            </div>

            {/* Recent campaigns */}
            {recentCampaigns.length > 0 && (
              <div className="rounded-2xl border border-white/10 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10">
                  <h3 className="font-bold text-white text-sm">Recent Campaigns</h3>
                </div>
                <div className="divide-y divide-white/5">
                  {recentCampaigns.map((c: any, i: number) => (
                    <div key={i} className="px-5 py-3 flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${c.type === 'email' ? 'bg-blue-500/20' : 'bg-green-500/20'}`}>
                        {c.type === 'email' ? <Mail className="w-4 h-4 text-blue-400" /> : <Smartphone className="w-4 h-4 text-green-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{c.name}</p>
                        <p className="text-gray-500 text-xs">{c.sentAt ? format(new Date(c.sentAt), 'dd MMM yyyy') : '—'}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-white text-sm font-semibold">{c.sentCount?.toLocaleString()}</p>
                        <p className="text-gray-500 text-xs">sent</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── EMAIL / WHATSAPP CAMPAIGNS ────────────────────────────────────── */}
        {(tab === 'email' || tab === 'whatsapp') && (
          <div className="space-y-4">
            {loadCamp ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />)}</div>
            ) : (campaigns?.campaigns || []).filter((c: any) => c.type === (tab === 'email' ? 'email' : 'whatsapp')).length === 0 ? (
              <div className="rounded-2xl border border-white/10 p-16 text-center">
                {tab === 'email' ? <Mail className="w-12 h-12 text-gray-700 mx-auto mb-3" /> : <Smartphone className="w-12 h-12 text-gray-700 mx-auto mb-3" />}
                <p className="text-white font-semibold">No {tab === 'email' ? 'email' : 'WhatsApp'} campaigns yet</p>
                <p className="text-gray-500 text-sm mt-1">Create your first campaign to start reaching users</p>
                <button onClick={() => { setCampaignType(tab === 'email' ? 'email' : 'whatsapp'); setShowCampaignModal(true) }} className="btn-primary mt-4 text-sm">
                  <Plus className="w-4 h-4 inline mr-1" /> Create Campaign
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {(campaigns?.campaigns || []).filter((c: any) => c.type === (tab === 'email' ? 'email' : 'whatsapp')).map((c: any) => (
                  <div key={c._id} className="rounded-2xl border border-white/10 bg-white/3 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.type === 'email' ? 'bg-blue-500/20' : 'bg-green-500/20'}`}>
                      {c.type === 'email' ? <Mail className="w-5 h-5 text-blue-400" /> : <Smartphone className="w-5 h-5 text-green-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="font-bold text-white">{c.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[c.status]}`}>{c.status}</span>
                      </div>
                      {c.subject && <p className="text-gray-400 text-xs mb-1">Subject: {c.subject}</p>}
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {c.totalTargeted} targeted</span>
                        <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-400" /> {c.sentCount} sent</span>
                        {c.failedCount > 0 && <span className="flex items-center gap-1"><XCircle className="w-3 h-3 text-red-400" /> {c.failedCount} failed</span>}
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {format(new Date(c.createdAt), 'dd MMM yyyy')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {c.status === 'draft' && (
                        <button onClick={() => sendCampaign(c._id)} disabled={sendingId === c._id}
                          className="flex items-center gap-1.5 px-3 py-2 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl text-xs font-medium hover:bg-green-500/20 transition-all">
                          {sendingId === c._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          Send Now
                        </button>
                      )}
                      <button onClick={() => deleteCampaign(c._id)} disabled={deletingId === c._id}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
                        {deletingId === c._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── CHATS ─────────────────────────────────────────────────────────── */}
        {tab === 'chats' && (
          <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ height: 'calc(100vh - 220px)' }}>
            <div className="flex h-full">
              {/* Chat list */}
              <div className="w-full sm:w-80 border-r border-white/10 flex flex-col flex-shrink-0">
                <div className="p-3 border-b border-white/10">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                    <input value={chatSearch} onChange={e => setChatSearch(e.target.value)}
                      placeholder="Search chats..." className="input pl-8 text-sm py-2 w-full" />
                  </div>
                </div>
                {/* New chat */}
                <div className="p-3 border-b border-white/10 flex gap-2">
                  <input value={newChatPhone} onChange={e => setNewChatPhone(e.target.value)}
                    placeholder="Enter phone..." className="input text-xs py-1.5 flex-1" />
                  <button onClick={() => { if (newChatPhone) { setSelectedChat({ contactPhone: newChatPhone, contactName: newChatPhone }); setNewChatPhone('') } }}
                    className="px-2.5 py-1.5 bg-green-500/20 border border-green-500/30 text-green-400 rounded-xl text-xs">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {loadChats ? (
                    <div className="p-3 space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />)}</div>
                  ) : (chats?.chats || []).length === 0 ? (
                    <div className="p-8 text-center">
                      <Inbox className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                      <p className="text-gray-400 text-xs">No chats yet</p>
                    </div>
                  ) : (
                    (chats?.chats || []).map((chat: any) => (
                      <button key={chat._id} onClick={() => setSelectedChat(chat)}
                        className={`w-full p-3 text-left hover:bg-white/5 transition-all flex items-center gap-3 border-b border-white/5 ${selectedChat?.contactPhone === chat.contactPhone ? 'bg-violet-500/10 border-l-2 border-l-violet-500' : ''}`}>
                        <div className="w-9 h-9 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-green-400 font-bold text-sm">{(chat.contactName || chat.contactPhone)?.[0]?.toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{chat.contactName || chat.contactPhone}</p>
                          <p className="text-gray-500 text-xs truncate">{chat.lastMessageText || '—'}</p>
                        </div>
                        <div className="flex-shrink-0">
                          {chat.lastMessageDirection === 'inbound' && (
                            <span className="w-2 h-2 rounded-full bg-green-400 block" />
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Chat window */}
              {selectedChat ? (
                <div className="flex-1 flex flex-col min-w-0">
                  {/* Chat header */}
                  <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3 bg-white/3">
                    <div className="w-9 h-9 rounded-full bg-green-500/20 flex items-center justify-center">
                      <span className="text-green-400 font-bold text-sm">{(selectedChat.contactName || selectedChat.contactPhone)?.[0]?.toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{selectedChat.contactName || selectedChat.contactPhone}</p>
                      <p className="text-gray-500 text-xs">{selectedChat.contactPhone}</p>
                    </div>
                    <button onClick={() => refetchChat()} className="ml-auto text-gray-500 hover:text-white p-1.5 rounded-lg hover:bg-white/5">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {(chatDetail?.messages || []).length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <Smartphone className="w-12 h-12 text-gray-700 mx-auto mb-2" />
                          <p className="text-gray-400 text-sm">No messages yet</p>
                          <p className="text-gray-600 text-xs">Send a message below</p>
                        </div>
                      </div>
                    ) : (
                      (chatDetail?.messages || []).map((msg: any, i: number) => (
                        <div key={i} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${msg.direction === 'outbound' ? 'bg-green-500/20 text-white rounded-br-sm' : 'bg-white/10 text-white rounded-bl-sm'}`}>
                            <p className="text-sm leading-relaxed">{msg.text}</p>
                            <p className="text-xs mt-1 opacity-50 text-right">{format(new Date(msg.timestamp), 'HH:mm')}</p>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  {/* Input */}
                  <div className="p-3 border-t border-white/10 flex gap-2">
                    {/* Quick templates */}
                    <div className="flex-1 relative">
                      <textarea value={chatMsg} onChange={e => setChatMsg(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMsg() } }}
                        placeholder="Type a message... (Enter to send)" rows={2}
                        className="input w-full resize-none text-sm py-2 pr-10" />
                    </div>
                    <button onClick={sendChatMsg} disabled={sendingChat || !chatMsg.trim()}
                      className="px-4 bg-green-600 hover:bg-green-500 text-white rounded-xl transition-all flex-shrink-0 disabled:opacity-40">
                      {sendingChat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 text-gray-800 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium">Select a chat to view</p>
                    <p className="text-gray-600 text-sm">or enter a phone number above to start new</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TEMPLATES ─────────────────────────────────────────────────────── */}
        {tab === 'templates' && (
          <div className="space-y-4">
            {/* Filter */}
            <div className="flex flex-wrap gap-2">
              {['all', 'email', 'whatsapp'].map(f => (
                <button key={f} className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 border border-white/10 text-gray-400 hover:text-white capitalize">
                  {f}
                </button>
              ))}
            </div>
            {loadTpl ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1,2,3].map(i => <div key={i} className="h-48 bg-white/5 rounded-2xl animate-pulse" />)}
              </div>
            ) : (templates?.templates || []).length === 0 ? (
              <div className="rounded-2xl border border-white/10 p-16 text-center">
                <LayoutTemplate className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-white font-semibold">No templates yet</p>
                <button onClick={() => setShowTemplateModal(true)} className="btn-primary mt-4 text-sm"><Plus className="w-4 h-4 inline mr-1" /> Create Template</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(templates?.templates || []).map((tpl: any) => (
                  <div key={tpl._id} className="rounded-2xl border border-white/10 bg-white/3 p-5 flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-white text-sm">{tpl.name}</p>
                        <div className="flex gap-1.5 mt-1.5 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tpl.type === 'email' ? 'text-blue-400 bg-blue-500/20' : 'text-green-400 bg-green-500/20'}`}>{tpl.type}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catBadge[tpl.category]}`}>{tpl.category}</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openEditTpl(tpl)} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg">
                          <Settings2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteTemplate(tpl._id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {tpl.subject && <p className="text-xs text-gray-400 mb-2">📧 {tpl.subject}</p>}
                    <p className="text-gray-500 text-xs line-clamp-3 flex-1">{tpl.body}</p>
                    {tpl.variables?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {tpl.variables.map((v: string, i: number) => (
                          <span key={i} className="text-xs bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded-md font-mono">{v}</span>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                      <span className="text-xs text-gray-600">Used {tpl.usageCount || 0} times</span>
                      <button onClick={() => { const type = tpl.type as 'email' | 'whatsapp'; setCampaignType(type); setCampaignForm(p => ({ ...p, body: tpl.body, subject: tpl.subject || '' })); setShowCampaignModal(true); setTab(type) }}
                        className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
                        Use <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── CHATBOT ───────────────────────────────────────────────────────── */}
        {tab === 'chatbot' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 flex items-start gap-3">
              <Bot className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white text-sm font-semibold">WhatsApp Chatbot Flows</p>
                <p className="text-gray-400 text-xs mt-0.5">Define keyword triggers and auto-reply sequences. When a user sends a matching keyword via WhatsApp, the bot responds automatically.</p>
              </div>
            </div>
            {loadBot ? (
              <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />)}</div>
            ) : (botFlows?.flows || []).length === 0 ? (
              <div className="rounded-2xl border border-white/10 p-16 text-center">
                <Bot className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-white font-semibold">No chatbot flows yet</p>
                <p className="text-gray-500 text-sm mt-1">Create a flow to automate WhatsApp replies</p>
                <button onClick={() => setShowBotModal(true)} className="btn-primary mt-4 text-sm"><Plus className="w-4 h-4 inline mr-1" /> Create Flow</button>
              </div>
            ) : (
              <div className="space-y-3">
                {(botFlows?.flows || []).map((flow: any) => (
                  <div key={flow._id} className="rounded-2xl border border-white/10 bg-white/3 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-white">{flow.name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${flow.isActive ? 'text-green-400 bg-green-500/20' : 'text-gray-400 bg-gray-500/20'}`}>
                            {flow.isActive ? 'Active' : 'Paused'}
                          </span>
                        </div>
                        <p className="text-xs text-cyan-400 mb-2 font-mono">Trigger: "{flow.trigger}"</p>
                        <div className="flex flex-wrap gap-2">
                          {(flow.steps || []).slice(0, 3).map((step: any, i: number) => (
                            <div key={i} className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1 flex items-center gap-1.5">
                              <span className="w-4 h-4 rounded-full bg-violet-500/30 text-violet-400 flex items-center justify-center text-[10px] font-bold">{step.order}</span>
                              <span className="text-gray-400 truncate max-w-[120px]">{step.message}</span>
                            </div>
                          ))}
                          {(flow.steps || []).length > 3 && <span className="text-xs text-gray-500">+{flow.steps.length - 3} more</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => toggleBot(flow._id)} className={`p-2 rounded-xl transition-all ${flow.isActive ? 'text-green-400 bg-green-500/10 hover:bg-green-500/20' : 'text-gray-500 bg-white/5 hover:bg-white/10'}`}>
                          {flow.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                        </button>
                        <button onClick={() => { if (confirm('Delete this flow?')) adminAPI.deleteChatbotFlow(flow._id).then(() => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['mkt-chatbot'] }) }) }}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── CAMPAIGN MODAL ────────────────────────────────────────────────────── */}
      {showCampaignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70" onClick={() => setShowCampaignModal(false)} />
          <div className="relative bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-2xl z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-white flex items-center gap-2">
                {campaignType === 'email' ? <Mail className="w-5 h-5 text-blue-400" /> : <Smartphone className="w-5 h-5 text-green-400" />}
                New {campaignType === 'email' ? 'Email' : 'WhatsApp'} Campaign
              </h2>
              <button onClick={() => setShowCampaignModal(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Campaign Name *</label>
                <input value={campaignForm.name} onChange={e => setCampaignForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. April Sale Blast" className="input w-full" />
              </div>
              {campaignType === 'email' && (
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Subject Line *</label>
                  <input value={campaignForm.subject} onChange={e => setCampaignForm(p => ({ ...p, subject: e.target.value }))} placeholder="e.g. 🔥 Special offer inside..." className="input w-full" />
                </div>
              )}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Message Body * <span className="text-violet-400">(use {'{'}{'{'} name {'}'}{'}'}  for personalization)</span></label>
                <textarea value={campaignForm.body} onChange={e => setCampaignForm(p => ({ ...p, body: e.target.value }))}
                  placeholder={campaignType === 'email' ? 'Hi {{name}},\n\nWe have an exciting offer...' : 'Hi {{name}}! 🎉\n\nCheck out our new courses...'}
                  rows={6} className="input w-full resize-none font-mono text-sm" />
              </div>
              {/* Targeting */}
              <div className="rounded-xl border border-white/10 p-4 space-y-3">
                <p className="text-sm font-semibold text-white flex items-center gap-2"><Target className="w-4 h-4 text-violet-400" /> Target Audience</p>
                <div>
                  <p className="text-xs text-gray-400 mb-2">By Role (leave empty = all users)</p>
                  <div className="flex flex-wrap gap-2">
                    {ROLES.map(r => (
                      <button key={r} onClick={() => setCampaignForm(p => ({ ...p, roles: p.roles.includes(r) ? p.roles.filter(x => x !== r) : [...p.roles, r] }))}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all capitalize ${campaignForm.roles.includes(r) ? 'bg-violet-600 text-white' : 'bg-white/5 text-gray-400 border border-white/10'}`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-2">By Package Tier</p>
                  <div className="flex flex-wrap gap-2">
                    {tierPackages.map(p => (
                      <button key={p.tier} onClick={() => setCampaignForm(prev => ({ ...prev, tiers: prev.tiers.includes(p.tier) ? prev.tiers.filter(x => x !== p.tier) : [...prev.tiers, p.tier] }))}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all capitalize ${campaignForm.tiers.includes(p.tier) ? 'bg-violet-600 text-white' : 'bg-white/5 text-gray-400 border border-white/10'}`}>
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
                {campaignType === 'email' ? (
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Custom Emails (comma-separated, overrides role/tier filter)</label>
                    <input value={campaignForm.customEmails} onChange={e => setCampaignForm(p => ({ ...p, customEmails: e.target.value }))} placeholder="a@x.com, b@y.com" className="input w-full text-sm" />
                  </div>
                ) : (
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Custom Phone Numbers (comma-separated)</label>
                    <input value={campaignForm.customPhones} onChange={e => setCampaignForm(p => ({ ...p, customPhones: e.target.value }))} placeholder="9876543210, 9123456789" className="input w-full text-sm" />
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowCampaignModal(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white text-sm">Cancel</button>
                <button onClick={saveCampaign} disabled={savingCampaign} className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm">
                  {savingCampaign ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create (send manually after)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TEMPLATE MODAL ────────────────────────────────────────────────────── */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70" onClick={() => { setShowTemplateModal(false); setEditingTpl(null) }} />
          <div className="relative bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-xl z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-white">{editingTpl ? 'Edit Template' : 'New Template'}</h2>
              <button onClick={() => { setShowTemplateModal(false); setEditingTpl(null) }} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-gray-400 mb-1 block">Template Name *</label>
                  <input value={tplForm.name} onChange={e => setTplForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Welcome Message" className="input w-full" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Type *</label>
                  <select value={tplForm.type} onChange={e => setTplForm(p => ({ ...p, type: e.target.value as any }))} className="input w-full">
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Category</label>
                  <select value={tplForm.category} onChange={e => setTplForm(p => ({ ...p, category: e.target.value }))} className="input w-full capitalize">
                    {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              {tplForm.type === 'email' && (
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Email Subject</label>
                  <input value={tplForm.subject} onChange={e => setTplForm(p => ({ ...p, subject: e.target.value }))} placeholder="Subject line..." className="input w-full" />
                </div>
              )}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Body * <span className="text-violet-400 font-mono">{'{'}{'{'} name {'}'}{'}'}  {'{'}{'{'} email {'}'}{'}'}  supported</span></label>
                <textarea value={tplForm.body} onChange={e => setTplForm(p => ({ ...p, body: e.target.value }))}
                  rows={6} placeholder="Template content..." className="input w-full resize-none font-mono text-sm" />
              </div>
              {tplForm.type === 'email' && (
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Preview Text</label>
                  <input value={tplForm.previewText} onChange={e => setTplForm(p => ({ ...p, previewText: e.target.value }))} placeholder="Short preview shown in inbox..." className="input w-full" />
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => { setShowTemplateModal(false); setEditingTpl(null) }} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white text-sm">Cancel</button>
                <button onClick={saveTemplate} disabled={savingTpl} className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm">
                  {savingTpl ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {editingTpl ? 'Update' : 'Create'} Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SINGLE EMAIL MODAL ─────────────────────────────────────────────────── */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70" onClick={() => setShowEmailModal(false)} />
          <div className="relative bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg z-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-white flex items-center gap-2"><AtSign className="w-5 h-5 text-blue-400" /> Quick Email Send</h2>
              <button onClick={() => setShowEmailModal(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">To *</label>
                <input value={singleEmail.to} onChange={e => setSingleEmail(p => ({ ...p, to: e.target.value }))} placeholder="recipient@email.com" className="input w-full" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Subject *</label>
                <input value={singleEmail.subject} onChange={e => setSingleEmail(p => ({ ...p, subject: e.target.value }))} placeholder="Email subject..." className="input w-full" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Body *</label>
                <textarea value={singleEmail.body} onChange={e => setSingleEmail(p => ({ ...p, body: e.target.value }))} rows={5} placeholder="Email content..." className="input w-full resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowEmailModal(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm">Cancel</button>
                <button onClick={sendSingleEmail} disabled={sendingSingle} className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm">
                  {sendingSingle ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CHATBOT MODAL ──────────────────────────────────────────────────────── */}
      {showBotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70" onClick={() => setShowBotModal(false)} />
          <div className="relative bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-xl z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-white flex items-center gap-2"><Bot className="w-5 h-5 text-cyan-400" /> New Chatbot Flow</h2>
              <button onClick={() => setShowBotModal(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Flow Name *</label>
                  <input value={botForm.name} onChange={e => setBotForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Course Inquiry" className="input w-full" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Trigger Keyword *</label>
                  <input value={botForm.trigger} onChange={e => setBotForm(p => ({ ...p, trigger: e.target.value }))} placeholder="e.g. hi, courses, price" className="input w-full font-mono" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-white">Reply Steps</p>
                  <button onClick={() => setBotForm(p => ({ ...p, steps: [...p.steps, { order: p.steps.length + 1, message: '', delaySeconds: 0 }] }))}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"><Plus className="w-3 h-3" /> Add Step</button>
                </div>
                <div className="space-y-3">
                  {botForm.steps.map((step, i) => (
                    <div key={i} className="rounded-xl bg-white/5 border border-white/10 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">{step.order}</span>
                        <p className="text-xs text-gray-400">Step {step.order}</p>
                        {botForm.steps.length > 1 && (
                          <button onClick={() => setBotForm(p => ({ ...p, steps: p.steps.filter((_, j) => j !== i).map((s, j) => ({ ...s, order: j + 1 })) }))}
                            className="ml-auto text-red-400 hover:bg-red-500/10 rounded-lg p-1"><X className="w-3 h-3" /></button>
                        )}
                      </div>
                      <textarea value={step.message} onChange={e => setBotForm(p => ({ ...p, steps: p.steps.map((s, j) => j === i ? { ...s, message: e.target.value } : s) }))}
                        placeholder="Bot reply message..." rows={2} className="input w-full resize-none text-sm mb-2" />
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-500">Delay (sec):</label>
                        <input type="number" value={step.delaySeconds} onChange={e => setBotForm(p => ({ ...p, steps: p.steps.map((s, j) => j === i ? { ...s, delaySeconds: Number(e.target.value) } : s) }))}
                          className="input w-20 text-xs py-1" min={0} max={60} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowBotModal(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm">Cancel</button>
                <button onClick={saveBot} disabled={savingBot} className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm">
                  {savingBot ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                  Create Flow
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
