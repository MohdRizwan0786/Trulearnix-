'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminAPI } from '@/lib/api'
import {
  Send, Trash2, Bot, Zap, TrendingUp, Users, IndianRupee,
  Video, MessageSquare, Phone, Settings, ChevronDown, ChevronUp,
  Loader2, Check, AlertCircle, Bell, Activity, Wifi, Power,
  RefreshCw, Calendar, ClipboardList, BarChart2, PhoneCall,
  UserCheck, UserX, Star, CheckSquare, Clock, ChevronRight,
  FileText, Eye, X, GraduationCap, Award, Briefcase,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) => `₹${(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

function renderMarkdown(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>')
}

// ── Pulse cards ───────────────────────────────────────────────────────────────

function PulseCard({ label, value, sub, icon: Icon, color }: { label: string; value: string; sub?: string; icon: any; color: string }) {
  return (
    <div className={`relative overflow-hidden rounded-xl border p-4 ${color}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium opacity-70 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
        </div>
        <div className="opacity-20">
          <Icon className="w-8 h-8" />
        </div>
      </div>
    </div>
  )
}

// ── Automation Toggle ─────────────────────────────────────────────────────────

function AutoToggle({ label, desc, enabled, onChange }: { label: string; desc: string; enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div className="flex-1 mr-4">
        <p className="text-sm font-medium text-gray-200">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-violet-600' : 'bg-gray-700'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  )
}

// ── Chat message ──────────────────────────────────────────────────────────────

function ChatBubble({ role, content, ts }: { role: 'user' | 'assistant'; content: string; ts?: string }) {
  const isNova = role === 'assistant'
  return (
    <div className={`flex gap-3 ${isNova ? '' : 'flex-row-reverse'}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold
        ${isNova ? 'bg-gradient-to-br from-violet-600 to-cyan-500' : 'bg-gray-700'}`}>
        {isNova ? <Bot className="w-4 h-4 text-white" /> : 'A'}
      </div>
      {/* Bubble */}
      <div className={`max-w-[80%] ${isNova ? '' : 'items-end flex flex-col'}`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed
          ${isNova
            ? 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-sm'
            : 'bg-violet-600/30 border border-violet-500/30 text-white rounded-tr-sm'
          }`}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
        />
        {ts && <p className="text-xs text-gray-600 mt-1 px-1">{formatDistanceToNow(new Date(ts), { addSuffix: true })}</p>}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

export default function NovaPage() {
  const qc = useQueryClient()
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [input, setInput] = useState('')
  const [showConfig, setShowConfig] = useState(false)
  const [showBroadcast, setShowBroadcast] = useState(false)
  const [broadcastMsg, setBroadcastMsg] = useState('')
  const [broadcastPhone, setBroadcastPhone] = useState('')
  const [configDraft, setConfigDraft] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'chat' | 'log' | 'team'>('chat')
  const [selectedEmp, setSelectedEmp] = useState<any>(null)
  const [reportDate, setReportDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [manualReportText, setManualReportText] = useState('')

  // ── Queries ──

  const { data: pulseData, refetch: refetchPulse } = useQuery({
    queryKey: ['nova-pulse'],
    queryFn: () => adminAPI.novaPulse().then(r => r.data.pulse),
    refetchInterval: 30000,
  })

  const { data: historyData } = useQuery({
    queryKey: ['nova-history'],
    queryFn: () => adminAPI.novaHistory().then(r => r.data.history),
  })

  const { data: teamReportData, refetch: refetchTeam } = useQuery({
    queryKey: ['nova-team-reports', reportDate],
    queryFn: () => adminAPI.novaEmployeeReports(reportDate).then(r => r.data),
    refetchInterval: 30000,
  })

  const { data: empDetailData } = useQuery({
    queryKey: ['nova-emp-detail', selectedEmp?._id],
    queryFn: () => selectedEmp ? adminAPI.novaEmployeeReportById(selectedEmp._id).then(r => r.data) : null,
    enabled: !!selectedEmp,
  })

  const { data: logData, refetch: refetchLog } = useQuery({
    queryKey: ['nova-log'],
    queryFn: () => adminAPI.novaActionLog().then(r => r.data.log),
    refetchInterval: 15000,
  })

  const { data: configData } = useQuery({
    queryKey: ['nova-config'],
    queryFn: () => adminAPI.novaConfig().then(r => r.data.config),
    onSuccess: (d: any) => { if (!configDraft) setConfigDraft(d) },
  } as any)

  // Set configDraft when config loads
  useEffect(() => {
    if (configData && !configDraft) setConfigDraft(configData)
  }, [configData])

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [historyData])

  // ── Mutations ──

  const chatMutation = useMutation({
    mutationFn: (msg: string) => adminAPI.novaChat(msg).then(r => r.data.reply),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nova-history'] })
      qc.invalidateQueries({ queryKey: ['nova-log'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'NOVA error'),
  })

  const clearMutation = useMutation({
    mutationFn: () => adminAPI.novaClearHistory(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nova-history'] }); toast.success('Chat cleared') },
  })

  const configMutation = useMutation({
    mutationFn: (data: any) => adminAPI.updateNovaConfig(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nova-config'] }); toast.success('Settings saved') },
  })

  const reportMutation = useMutation({
    mutationFn: (period: string) => adminAPI.novaFounderReport(period),
    onSuccess: () => { toast.success('Report sent to founder via WhatsApp!'); qc.invalidateQueries({ queryKey: ['nova-log'] }) },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  })

  const waMutation = useMutation({
    mutationFn: ({ phone, msg }: { phone: string; msg: string }) => adminAPI.novaSendWhatsApp(phone, msg),
    onSuccess: () => { toast.success('WhatsApp sent!'); setBroadcastMsg(''); setBroadcastPhone('') },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  })

  const morningMutation = useMutation({
    mutationFn: () => adminAPI.novaSendMorningBriefings(),
    onSuccess: (r) => { toast.success(`Briefings sent: ${r.data.sent}/${r.data.total}`); refetchTeam() },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  })

  const eodMutation = useMutation({
    mutationFn: () => adminAPI.novaRequestEodReports(),
    onSuccess: (r) => { toast.success(`EOD reminders sent: ${r.data.sent}`); refetchTeam() },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  })

  const teamReportMutation = useMutation({
    mutationFn: () => adminAPI.novaSendTeamReport(),
    onSuccess: () => { toast.success('Team report sent to founder!'); qc.invalidateQueries({ queryKey: ['nova-log'] }) },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  })

  const manualReportMutation = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) => adminAPI.novaManualReport(id, text),
    onSuccess: () => { toast.success('Report saved!'); setManualReportText(''); qc.invalidateQueries({ queryKey: ['nova-team-reports', reportDate] }); qc.invalidateQueries({ queryKey: ['nova-emp-detail', selectedEmp?._id] }) },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  })

  // ── Handlers ──

  const sendMessage = useCallback(async () => {
    const msg = input.trim()
    if (!msg || chatMutation.isPending) return
    setInput('')
    await chatMutation.mutateAsync(msg)
  }, [input, chatMutation])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const setCfg = (key: string, val: any) => setConfigDraft((d: any) => ({ ...d, [key]: val }))
  const setNestedCfg = (parent: string, key: string, val: any) => setConfigDraft((d: any) => ({ ...d, [parent]: { ...(d?.[parent] || {}), [key]: val } }))

  const pulse = pulseData
  const history: any[] = historyData || []
  const log: any[] = logData || []
  const cfg = configDraft || {}

  const QUICK_PROMPTS = [
    "What are today's sales?",
    "Give me a platform overview",
    "Who are the top performers this month?",
    "Show pending tasks",
    "Are there any upcoming classes?",
    "Show me webinars status",
    "Partners overview",
    "Mentors overview",
    "Learners tier breakdown",
    "Sales team performance this month",
    "Finance overview",
    "Pending withdrawals",
    "KYC status",
    "TruLance stats",
    "Generate founder report",
    "Show CRM pipeline",
  ]

  const metaConfigured = typeof window !== 'undefined'

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* NOVA Logo */}
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-gray-900 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white tracking-wide">N O V A</h1>
              <span className="text-xs px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded-full border border-violet-500/30 font-medium">AI</span>
            </div>
            <p className="text-xs text-gray-400">Neural Operations & Virtual Administrator • TruLearnix Co-pilot</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { refetchPulse(); refetchLog() }} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowConfig(!showConfig)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${showConfig ? 'bg-violet-600/30 text-violet-300 border border-violet-500/30' : 'bg-white/5 hover:bg-white/10 text-gray-400'}`}>
            <Settings className="w-4 h-4" /> Settings
          </button>
        </div>
      </div>

      {/* ── Pulse Metrics ── */}
      <div className="overflow-x-auto pb-1">
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2 min-w-max xl:min-w-0">
          <PulseCard label="Today Revenue" value={fmt(pulse?.today?.revenue || 0)} sub={`${pulse?.today?.sales || 0} sales`} icon={IndianRupee} color="bg-emerald-500/10 border-emerald-500/20 text-emerald-300" />
          <PulseCard label="Month Revenue" value={fmt(pulse?.month?.revenue || 0)} sub={`${pulse?.month?.sales || 0} sales`} icon={TrendingUp} color="bg-blue-500/10 border-blue-500/20 text-blue-300" />
          <PulseCard label="Learners" value={String(pulse?.today?.newLearners || 0)} sub={`+today / ${pulse?.totalLearners || 0} total`} icon={Users} color="bg-violet-500/10 border-violet-500/20 text-violet-300" />
          <PulseCard label="Partners" value={String(pulse?.totalPartners || 0)} sub={`${pulse?.pendingCommissions?.count || 0} pending earning`} icon={UserCheck} color="bg-cyan-500/10 border-cyan-500/20 text-cyan-300" />
          <PulseCard label="Live Now" value={String((pulse?.liveClasses || 0) + (pulse?.liveWebinars || 0))} sub={`${pulse?.liveClasses || 0} class · ${pulse?.liveWebinars || 0} webinar`} icon={Video} color={(pulse?.liveClasses > 0 || pulse?.liveWebinars > 0) ? "bg-red-500/10 border-red-500/30 text-red-300 animate-pulse" : "bg-gray-500/10 border-gray-500/20 text-gray-400"} />
          <PulseCard label="Hot Leads" value={String(pulse?.hotLeads || 0)} sub="CRM pipeline" icon={Activity} color={pulse?.hotLeads > 0 ? "bg-orange-500/10 border-orange-500/20 text-orange-300" : "bg-gray-500/10 border-gray-500/20 text-gray-400"} />
          <PulseCard label="Pending" value={String((pulse?.pendingWithdrawals || 0) + (pulse?.pendingKyc || 0) + (pulse?.openTickets || 0))} sub={`${pulse?.pendingWithdrawals || 0} wd · ${pulse?.pendingKyc || 0} kyc · ${pulse?.openTickets || 0} tickets`} icon={MessageSquare} color={(pulse?.pendingWithdrawals > 0 || pulse?.pendingKyc > 0) ? "bg-amber-500/10 border-amber-500/20 text-amber-300" : "bg-gray-500/10 border-gray-500/20 text-gray-400"} />
          <PulseCard label="Team Reports" value={`${pulse?.employeeReports?.submitted || 0}/${pulse?.employeeReports?.total || 0}`} sub="submitted today" icon={UserCheck} color={pulse?.employeeReports?.submitted === pulse?.employeeReports?.total && pulse?.employeeReports?.total > 0 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" : "bg-amber-500/10 border-amber-500/20 text-amber-300"} />
        </div>
      </div>

      {/* ── Config Panel ── */}
      {showConfig && configDraft && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><Settings className="w-5 h-5 text-violet-400" /> NOVA Configuration</h2>
            <button onClick={() => configMutation.mutate(configDraft)} disabled={configMutation.isPending}
              className="flex items-center gap-2 text-sm bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg">
              {configMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save Settings
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Founder Info */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Founder / WhatsApp</h3>
              <div>
                <label className="text-xs text-gray-400">Founder Name</label>
                <input value={cfg.founderName || ''} onChange={e => setCfg('founderName', e.target.value)} className="input mt-1" placeholder="Your Name" />
              </div>
              <div>
                <label className="text-xs text-gray-400">WhatsApp Phone (with country code)</label>
                <input value={cfg.founderPhone || ''} onChange={e => setCfg('founderPhone', e.target.value)} className="input mt-1" placeholder="917XXXXXXXXX" />
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-300">
                <p className="font-medium mb-1">Meta WhatsApp Setup Required</p>
                <p>Add to API .env:</p>
                <code className="text-xs font-mono block mt-1 opacity-80">META_PHONE_NUMBER_ID=<br/>META_WHATSAPP_TOKEN=<br/>META_WA_VERIFY_TOKEN=nova_verify</code>
              </div>
            </div>

            {/* Automation */}
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">Automations</h3>
              <AutoToggle label="Morning Briefing" desc={`Daily at ${cfg.morningBriefing?.time || '09:00'} — sends platform summary to founder`}
                enabled={cfg.morningBriefing?.enabled || false}
                onChange={v => setNestedCfg('morningBriefing', 'enabled', v)} />
              <div className={cfg.morningBriefing?.enabled ? 'pl-4 pb-2' : 'hidden'}>
                <input type="time" value={cfg.morningBriefing?.time || '09:00'} onChange={e => setNestedCfg('morningBriefing', 'time', e.target.value)} className="input py-1 text-sm w-32" />
              </div>

              <AutoToggle label="EOD Reminder to Team" desc="Reminds employees to submit daily report via WhatsApp"
                enabled={cfg.eodReminder?.enabled || false}
                onChange={v => setNestedCfg('eodReminder', 'enabled', v)} />

              <AutoToggle label="Weekly Founder Report" desc={`Every ${DAYS[cfg.weeklyReport?.day ?? 0]} — comprehensive weekly report`}
                enabled={cfg.weeklyReport?.enabled || false}
                onChange={v => setNestedCfg('weeklyReport', 'enabled', v)} />

              <AutoToggle label="New Sale Alert" desc="WhatsApp alert to founder on every new purchase"
                enabled={cfg.newSaleAlert || false}
                onChange={v => setCfg('newSaleAlert', v)} />

              <AutoToggle label="New Learner Alert" desc="Alert when a new student registers"
                enabled={cfg.newLearnerAlert || false}
                onChange={v => setCfg('newLearnerAlert', v)} />

              <AutoToggle label="Auto Onboarding Message" desc="Welcome WhatsApp to new learners on signup"
                enabled={cfg.autoOnboarding || false}
                onChange={v => setCfg('autoOnboarding', v)} />
            </div>
          </div>
        </div>
      )}

      {/* ── Main 2-col layout ── */}
      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">

        {/* ── Left: Chat ── */}
        <div className="flex-1 flex flex-col min-h-0 card p-0 overflow-hidden">
          {/* Chat header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex gap-1 flex-wrap">
              <button onClick={() => setActiveTab('chat')} className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'chat' ? 'bg-violet-600/30 text-violet-300' : 'text-gray-400 hover:text-gray-200'}`}>
                <Bot className="w-4 h-4 inline mr-1.5" />Chat
              </button>
              <button onClick={() => setActiveTab('team')} className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'team' ? 'bg-emerald-600/30 text-emerald-300' : 'text-gray-400 hover:text-gray-200'}`}>
                <Users className="w-4 h-4 inline mr-1.5" />Team Reports
                {teamReportData?.summary && <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${teamReportData.summary.submitted < teamReportData.summary.total ? 'bg-amber-500/30 text-amber-300' : 'bg-emerald-500/30 text-emerald-300'}`}>{teamReportData.summary.submitted}/{teamReportData.summary.total}</span>}
              </button>
              <button onClick={() => setActiveTab('log')} className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'log' ? 'bg-violet-600/30 text-violet-300' : 'text-gray-400 hover:text-gray-200'}`}>
                <Activity className="w-4 h-4 inline mr-1.5" />Log
              </button>
            </div>
            {activeTab === 'chat' && (
              <button onClick={() => clearMutation.mutate()} disabled={clearMutation.isPending} className="text-xs text-gray-500 hover:text-red-400 flex items-center gap-1">
                <Trash2 className="w-3 h-3" /> Clear
              </button>
            )}
          </div>

          {activeTab === 'chat' ? (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ minHeight: 300, maxHeight: 480 }}>
                {history.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/30">
                      <Bot className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-white font-bold text-lg">Hello! I'm NOVA</h3>
                    <p className="text-gray-400 text-sm mt-1 max-w-xs">Your AI-powered platform co-pilot. Ask me anything about your platform — sales, users, tasks, classes, or ask me to send reports.</p>
                    <div className="grid grid-cols-2 gap-2 mt-4 w-full max-w-sm">
                      {QUICK_PROMPTS.slice(0, 4).map(p => (
                        <button key={p} onClick={() => { setInput(p); inputRef.current?.focus() }}
                          className="text-xs text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-violet-500/20 text-gray-300 hover:text-violet-300 border border-white/10 hover:border-violet-500/30 transition-all">
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {history.map((msg: any, i: number) => (
                  <ChatBubble key={i} role={msg.role} content={msg.content} ts={msg.ts} />
                ))}
                {chatMutation.isPending && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                      <span className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                      <span className="text-xs text-gray-400">NOVA is thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick prompts */}
              <div className="px-4 py-2 border-t border-white/5 flex gap-2 overflow-x-auto">
                {QUICK_PROMPTS.map(p => (
                  <button key={p} onClick={() => { setInput(p); inputRef.current?.focus() }}
                    className="text-xs whitespace-nowrap px-3 py-1.5 rounded-full bg-white/5 hover:bg-violet-500/20 text-gray-400 hover:text-violet-300 border border-white/10 hover:border-violet-500/30 transition-all flex-shrink-0">
                    {p}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-white/10">
                <div className="flex gap-3 items-center">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask NOVA anything about your platform..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:bg-white/8 transition-all"
                    disabled={chatMutation.isPending}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || chatMutation.isPending}
                    className="w-11 h-11 bg-gradient-to-br from-violet-600 to-cyan-500 rounded-xl flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-violet-500/30 transition-all flex-shrink-0"
                  >
                    {chatMutation.isPending ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Send className="w-5 h-5 text-white" />}
                  </button>
                </div>
              </div>
            </>
          ) : activeTab === 'team' ? (
            /* Team Reports */
            <div className="flex-1 overflow-y-auto" style={{ minHeight: 300, maxHeight: 540 }}>
              {selectedEmp ? (
                /* Employee Detail */
                <div className="p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setSelectedEmp(null)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
                    <div className="w-9 h-9 rounded-full bg-violet-500/20 flex items-center justify-center font-bold text-violet-300">{selectedEmp.name[0]}</div>
                    <div>
                      <p className="font-semibold text-white">{selectedEmp.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{selectedEmp.department || selectedEmp.role}</p>
                    </div>
                  </div>

                  {/* Tasks */}
                  {empDetailData && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
                          <p className="text-lg font-bold text-amber-300">{empDetailData.tasks?.pending?.length || 0}</p>
                          <p className="text-xs text-gray-400">Todo</p>
                        </div>
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2">
                          <p className="text-lg font-bold text-blue-300">{empDetailData.tasks?.inProgress?.length || 0}</p>
                          <p className="text-xs text-gray-400">In Progress</p>
                        </div>
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2">
                          <p className="text-lg font-bold text-emerald-300">{empDetailData.tasks?.done?.length || 0}</p>
                          <p className="text-xs text-gray-400">Done Today</p>
                        </div>
                      </div>

                      {/* Performance */}
                      <div className="bg-white/5 rounded-xl p-3 space-y-1">
                        <p className="text-xs font-semibold text-gray-400 uppercase">This Week</p>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">Reports submitted</span>
                          <span className="text-white font-medium">{empDetailData.performance?.reportedDays}/7 days</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">Avg performance</span>
                          <span className="text-amber-300 font-medium">⭐ {empDetailData.performance?.avgScore}/10</span>
                        </div>
                        {empDetailData.performance?.weeklyCommission > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Partnership earning</span>
                            <span className="text-emerald-300 font-medium">₹{(empDetailData.performance?.weeklyCommission || 0).toLocaleString('en-IN')}</span>
                          </div>
                        )}
                      </div>

                      {/* Active tasks list */}
                      {[...(empDetailData.tasks?.pending || []), ...(empDetailData.tasks?.inProgress || [])].length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Active Tasks</p>
                          <div className="space-y-1.5">
                            {[...(empDetailData.tasks?.pending || []), ...(empDetailData.tasks?.inProgress || [])].slice(0, 5).map((t: any) => (
                              <div key={t._id} className="flex items-center gap-2 text-sm py-1.5 px-3 bg-white/5 rounded-lg">
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${t.priority === 'urgent' ? 'bg-red-400' : t.priority === 'high' ? 'bg-orange-400' : t.priority === 'medium' ? 'bg-amber-400' : 'bg-gray-500'}`} />
                                <span className="text-gray-200 flex-1 truncate">{t.title}</span>
                                <span className="text-xs text-gray-500 capitalize">{t.status}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Report history */}
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Recent Reports</p>
                        <div className="space-y-2">
                          {(empDetailData.reports || []).slice(0, 7).map((r: any) => (
                            <div key={r._id} className={`rounded-lg p-3 border ${r.status === 'submitted' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/5 border-white/10'}`}>
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs font-medium text-gray-400">{format(new Date(r.date), 'EEE, dd MMM')}</p>
                                <div className="flex items-center gap-2">
                                  {r.performanceScore && <span className="text-xs text-amber-300">⭐{r.performanceScore}/10</span>}
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === 'submitted' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-700 text-gray-400'}`}>{r.status}</span>
                                </div>
                              </div>
                              {r.aiSummary && <p className="text-xs text-gray-300 leading-relaxed">{r.aiSummary}</p>}
                              {!r.aiSummary && r.reportText && <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{r.reportText}</p>}
                              {r.status === 'pending' && <p className="text-xs text-gray-600 italic">Not submitted</p>}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Manual report entry */}
                      <div className="border-t border-white/10 pt-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Add Manual Report</p>
                        <textarea value={manualReportText} onChange={e => setManualReportText(e.target.value)} className="input text-sm resize-none w-full" rows={3} placeholder="Enter report on behalf of employee..." />
                        <button onClick={() => manualReportMutation.mutate({ id: selectedEmp._id, text: manualReportText })}
                          disabled={manualReportMutation.isPending || !manualReportText.trim()}
                          className="mt-2 btn-primary text-sm w-full flex items-center justify-center gap-2">
                          {manualReportMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          Save Report
                        </button>
                      </div>
                    </div>
                  )}
                  {!empDetailData && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-violet-400" /></div>}
                </div>
              ) : (
                /* Team Overview */
                <div className="p-4 space-y-3">
                  {/* Date picker + summary */}
                  <div className="flex items-center gap-3">
                    <input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} className="input py-1.5 text-sm flex-1" />
                    {teamReportData?.summary && (
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-emerald-400 font-semibold">{teamReportData.summary.submitted} submitted</span>
                        <span className="text-amber-400">{teamReportData.summary.pending} pending</span>
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  {teamReportData?.summary && teamReportData.summary.total > 0 && (
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full transition-all"
                        style={{ width: `${(teamReportData.summary.submitted / teamReportData.summary.total) * 100}%` }} />
                    </div>
                  )}

                  {/* Employee cards */}
                  <div className="space-y-2">
                    {(teamReportData?.merged || []).map((item: any) => {
                      const { employee: emp, report } = item
                      const submitted = report?.status === 'submitted'
                      return (
                        <div key={emp._id}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:bg-white/5
                            ${submitted ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/10 bg-white/3'}`}
                          onClick={() => setSelectedEmp(emp)}>
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0
                            ${submitted ? 'bg-emerald-500/20 text-emerald-300' : 'bg-gray-700 text-gray-400'}`}>
                            {emp.name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-white truncate">{emp.name}</p>
                              <span className="text-xs text-gray-500 capitalize flex-shrink-0">{emp.department || emp.role}</span>
                            </div>
                            {submitted && report?.aiSummary && (
                              <p className="text-xs text-gray-400 truncate mt-0.5">{report.aiSummary}</p>
                            )}
                            {!submitted && <p className="text-xs text-amber-500/70 mt-0.5">Report pending</p>}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {submitted && report?.performanceScore && (
                              <span className="text-xs text-amber-300">⭐{report.performanceScore}</span>
                            )}
                            {submitted
                              ? <UserCheck className="w-4 h-4 text-emerald-400" />
                              : <UserX className="w-4 h-4 text-gray-500" />
                            }
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                          </div>
                        </div>
                      )
                    })}
                    {(!teamReportData?.merged || teamReportData.merged.length === 0) && (
                      <div className="text-center py-8 text-gray-500">No employees found</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Action Log */
            <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ minHeight: 300, maxHeight: 520 }}>
              {log.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No actions logged yet</div>
              ) : log.map((entry: any, i: number) => (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-white/5">
                  <div className="w-2 h-2 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium">{entry.action}</p>
                    <p className="text-xs text-gray-400 truncate">{entry.detail}</p>
                  </div>
                  <p className="text-xs text-gray-600 flex-shrink-0">{entry.ts ? formatDistanceToNow(new Date(entry.ts), { addSuffix: true }) : ''}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: Controls ── */}
        <div className="lg:w-72 flex-shrink-0 space-y-4">

          {/* Quick Actions */}
          <div className="card space-y-3">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Quick Actions</h3>

            <button onClick={() => reportMutation.mutate('daily')} disabled={reportMutation.isPending}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-sm font-medium transition-colors">
              {reportMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart2 className="w-4 h-4" />}
              Send Daily Report to Founder
            </button>

            <button onClick={() => reportMutation.mutate('weekly')} disabled={reportMutation.isPending}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 text-sm font-medium transition-colors">
              <Calendar className="w-4 h-4" />
              Send Weekly Report
            </button>

            <button onClick={() => { setActiveTab('team'); morningMutation.mutate() }} disabled={morningMutation.isPending}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 text-sm font-medium transition-colors">
              {morningMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
              Send Morning Briefings
            </button>

            <button onClick={() => { setActiveTab('team'); eodMutation.mutate() }} disabled={eodMutation.isPending}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-sm font-medium transition-colors">
              {eodMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardList className="w-4 h-4" />}
              Request EOD Reports
            </button>

            <button onClick={() => teamReportMutation.mutate()} disabled={teamReportMutation.isPending}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 border border-teal-500/30 text-teal-300 text-sm font-medium transition-colors">
              {teamReportMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
              Send Team Report to Founder
            </button>

            <button onClick={() => setShowBroadcast(!showBroadcast)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-sm font-medium transition-colors">
              <PhoneCall className="w-4 h-4" />
              WhatsApp Message
              {showBroadcast ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
            </button>

            {showBroadcast && (
              <div className="space-y-2 pt-1">
                <input value={broadcastPhone} onChange={e => setBroadcastPhone(e.target.value)} className="input text-sm" placeholder="Phone (917XXXXXXXXX)" />
                <textarea value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} className="input text-sm resize-none" rows={3} placeholder="Message..." />
                <button onClick={() => waMutation.mutate({ phone: broadcastPhone, msg: broadcastMsg })}
                  disabled={waMutation.isPending || !broadcastPhone || !broadcastMsg}
                  className="w-full btn-primary text-sm flex items-center justify-center gap-2">
                  {waMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send WhatsApp
                </button>
              </div>
            )}
          </div>

          {/* Automation Status */}
          <div className="card space-y-2">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Automation Status</h3>
            {[
              { label: 'Morning Briefing', active: (configData as any)?.morningBriefing?.enabled, detail: (configData as any)?.morningBriefing?.time },
              { label: 'EOD Reminder', active: (configData as any)?.eodReminder?.enabled, detail: (configData as any)?.eodReminder?.time },
              { label: 'Weekly Report', active: (configData as any)?.weeklyReport?.enabled, detail: DAYS[(configData as any)?.weeklyReport?.day ?? 0] },
              { label: 'New Sale Alert', active: (configData as any)?.newSaleAlert, detail: 'Real-time' },
              { label: 'Auto Onboarding', active: (configData as any)?.autoOnboarding, detail: 'On signup' },
            ].map(a => (
              <div key={a.label} className="flex items-center justify-between py-1.5">
                <div>
                  <p className="text-sm text-gray-300">{a.label}</p>
                  {a.detail && <p className="text-xs text-gray-600">{a.detail}</p>}
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${a.active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-gray-700/50 text-gray-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${a.active ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                  {a.active ? 'ON' : 'OFF'}
                </div>
              </div>
            ))}
            <p className="text-xs text-gray-600 pt-1">Click Settings to configure automations</p>
          </div>

          {/* NOVA Info */}
          <div className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-900/20 to-cyan-900/20 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-violet-400" />
              <p className="text-sm font-semibold text-violet-300">NOVA Capabilities</p>
            </div>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Real-time platform intelligence</li>
              <li>• AI-powered insights (GPT-4o)</li>
              <li>• WhatsApp automation (Meta API)</li>
              <li>• Scheduled founder reports</li>
              <li>• Team task & performance tracking</li>
              <li>• CRM & support monitoring</li>
            </ul>
            <p className="text-xs text-gray-600 pt-1">
              {process.env.NEXT_PUBLIC_AI_ENABLED === 'true' ? '🟢 Full AI Mode' : '🟡 Add OPENAI_API_KEY for full AI'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
