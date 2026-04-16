'use client'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { adminAPI } from '@/lib/api'
import AdminLayout from '@/components/AdminLayout'
import toast from 'react-hot-toast'
import { Search, X, Phone, Mail, Clock, MessageSquare, ChevronRight, Plus, Upload, Facebook, Users, TrendingUp, Zap, Copy, UserCheck } from 'lucide-react'
import { format } from 'date-fns'

const STAGES = ['new', 'contacted', 'interested', 'demo_done', 'negotiating', 'token_collected', 'paid', 'lost']
const STAGE_LABELS: Record<string, string> = {
  new: 'New', contacted: 'Contacted', interested: 'Interested',
  demo_done: 'Demo Done', negotiating: 'Negotiating',
  token_collected: 'Token Collected', paid: 'Paid', lost: 'Lost',
}
const SOURCES = ['meta_ads', 'google_ads', 'organic', 'referral', 'whatsapp', 'website', 'manual', 'other']
const SOURCE_LABELS: Record<string, string> = {
  meta_ads: 'Meta Ads', google_ads: 'Google Ads', organic: 'Organic',
  referral: 'Referral', whatsapp: 'WhatsApp', website: 'Website',
  manual: 'Manual', other: 'Other',
}

const stageColor = (s: string) => {
  const map: Record<string, string> = {
    new: 'bg-blue-500/20 text-blue-400',
    contacted: 'bg-cyan-500/20 text-cyan-400',
    interested: 'bg-violet-500/20 text-violet-400',
    demo_done: 'bg-purple-500/20 text-purple-400',
    negotiating: 'bg-amber-500/20 text-amber-400',
    token_collected: 'bg-orange-500/20 text-orange-400',
    paid: 'bg-green-500/20 text-green-400',
    lost: 'bg-red-500/20 text-red-400',
  }
  return map[s] || 'bg-gray-500/20 text-gray-400'
}

const scoreColor = (score: number) => {
  if (score >= 70) return 'text-red-400 bg-red-500/20'
  if (score >= 40) return 'text-amber-400 bg-amber-500/20'
  return 'text-blue-400 bg-blue-500/20'
}
const scoreLabel = (score: number) => score >= 70 ? 'Hot' : score >= 40 ? 'Warm' : 'Cold'

const META_WEBHOOK_URL = 'https://api.peptly.in/api/crm/webhook/meta'
const META_VERIFY_TOKEN = 'peptly_meta_crm_2024'

export default function CRMPage() {
  const qc = useQueryClient()
  const [stage, setStage] = useState('')
  const [source, setSource] = useState('')
  const [scoreFilter, setScoreFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [detailData, setDetailData] = useState<any>(null)
  const [note, setNote] = useState('')
  const [newStage, setNewStage] = useState('')
  const [assignTo, setAssignTo] = useState('')
  const [updating, setUpdating] = useState(false)
  const [tab, setTab] = useState<'leads' | 'meta' | 'import'>('leads')

  // Create Lead modal
  const [createModal, setCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', phone: '', email: '', source: 'manual', city: '', stage: 'new' })
  const [creating, setCreating] = useState(false)

  // Import modal
  const [importText, setImportText] = useState('')
  const [importSource, setImportSource] = useState('meta_ads')
  const [importing, setImporting] = useState(false)

  const { data: stats } = useQuery({
    queryKey: ['crm-stats'],
    queryFn: () => adminAPI.crmStats().then(r => r.data)
  })

  const { data, refetch } = useQuery({
    queryKey: ['crm-leads', stage, source, scoreFilter, search],
    queryFn: () => adminAPI.leads({
      stage: stage || undefined,
      source: source || undefined,
      score: scoreFilter || undefined,
      search: search || undefined,
      limit: 100
    }).then(r => r.data)
  })

  const { data: salesData } = useQuery({
    queryKey: ['salespersons-list'],
    queryFn: () => adminAPI.salespersons({ limit: 100 }).then(r => r.data)
  })

  const openLead = async (lead: any) => {
    setSelectedLead(lead)
    setNewStage(lead.stage || 'new')
    setAssignTo(lead.assignedTo?._id || '')
    try {
      const res = await adminAPI.getLead(lead._id)
      setDetailData(res.data)
    } catch {
      setDetailData({ lead })
    }
  }

  const updateStage = async () => {
    if (!selectedLead || !newStage) return
    setUpdating(true)
    try {
      await adminAPI.updateLead(selectedLead._id, { stage: newStage })
      toast.success('Stage updated')
      refetch()
      setSelectedLead({ ...selectedLead, stage: newStage })
    } catch { toast.error('Failed') } finally { setUpdating(false) }
  }

  const handleAssign = async () => {
    if (!selectedLead || !assignTo) return
    setUpdating(true)
    try {
      await adminAPI.updateLead(selectedLead._id, { assignedTo: assignTo })
      toast.success('Lead assigned')
      refetch()
      const res = await adminAPI.getLead(selectedLead._id)
      setDetailData(res.data)
    } catch { toast.error('Failed to assign') } finally { setUpdating(false) }
  }

  const addNote = async () => {
    if (!note.trim() || !selectedLead) return
    setUpdating(true)
    try {
      await adminAPI.updateLead(selectedLead._id, { note: note.trim() })
      toast.success('Note added')
      setNote('')
      const res = await adminAPI.getLead(selectedLead._id)
      setDetailData(res.data)
    } catch { toast.error('Failed to add note') } finally { setUpdating(false) }
  }

  const handleCreate = async () => {
    if (!createForm.name || !createForm.phone) return toast.error('Name and phone required')
    setCreating(true)
    try {
      await adminAPI.createLead(createForm)
      toast.success('Lead created')
      setCreateModal(false)
      setCreateForm({ name: '', phone: '', email: '', source: 'manual', city: '', stage: 'new' })
      refetch()
      qc.invalidateQueries({ queryKey: ['crm-stats'] })
    } catch { toast.error('Failed to create lead') } finally { setCreating(false) }
  }

  const handleImport = async () => {
    if (!importText.trim()) return toast.error('Paste lead data first')
    setImporting(true)
    try {
      let leads: any[] = []
      const lines = importText.trim().split('\n')
      // Try to parse each line as "name,phone,email" or "phone" or "name phone"
      leads = lines.map(line => {
        const parts = line.split(',').map(s => s.trim())
        if (parts.length >= 3) return { name: parts[0], phone: parts[1], email: parts[2] }
        if (parts.length === 2) return { name: parts[0], phone: parts[1] }
        if (parts.length === 1) return { phone: parts[0] }
        return null
      }).filter(Boolean)

      if (!leads.length) return toast.error('No valid leads found. Format: name, phone, email (one per line)')
      const result = await adminAPI.importLeads({ leads, source: importSource }).then(r => r.data)
      if (result.success) {
        toast.success(`Imported ${result.created} leads (${result.skipped} duplicates skipped)`)
        setImportText('')
        refetch()
        qc.invalidateQueries({ queryKey: ['crm-stats'] })
      } else {
        toast.error(result.message || 'Import failed')
      }
    } catch (e: any) { toast.error(e.message || 'Import failed') } finally { setImporting(false) }
  }

  const leads = data?.leads || []
  const salespersons = salesData?.salespersons || []
  const conversionRate = parseFloat(String(stats?.conversionRate || 0)) || 0

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* ── Page Header ── */}
        <div className="page-header">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                CRM — Lead Pipeline
              </h1>
              <p className="text-gray-400 text-sm mt-1">Manage leads, track conversions, assign to sales team</p>
            </div>
            <button onClick={() => setCreateModal(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Lead
            </button>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="kpi-violet">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-black text-white">{stats?.totalLeads || stats?.total || leads.length}</p>
            <p className="text-white/70 text-xs mt-1">Total Leads</p>
          </div>
          <div className="kpi-rose">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-white/60 bg-white/10 px-2 py-0.5 rounded-full">🔥 Hot</span>
            </div>
            <p className="text-2xl font-black text-white">{stats?.hotLeads || stats?.hot || 0}</p>
            <p className="text-white/70 text-xs mt-1">Hot Leads</p>
          </div>
          <div className="kpi-emerald">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-black text-white">{conversionRate.toFixed(1)}%</p>
            <p className="text-white/70 text-xs mt-1">Conversion Rate</p>
          </div>
          <div className="kpi-cyan">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-black text-white">{stats?.thisMonth || 0}</p>
            <p className="text-white/70 text-xs mt-1">This Month</p>
          </div>
          <div className="kpi-blue">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Facebook className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-black text-white">{stats?.metaLeads || 0}</p>
            <p className="text-white/70 text-xs mt-1">Meta Ads Leads</p>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="tab-bar w-fit">
          {[
            { key: 'leads', label: 'All Leads', icon: Users },
            { key: 'meta', label: 'Meta Ads Setup', icon: Facebook },
            { key: 'import', label: 'Import Leads', icon: Upload },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key as any)}
              className={`flex items-center gap-2 ${tab === key ? 'tab-active' : 'tab-inactive'}`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* Leads Tab */}
        {tab === 'leads' && (
          <>
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, email..." className="input pl-10" />
              </div>
              <select value={stage} onChange={e => setStage(e.target.value)} className="input w-44">
                <option value="">All Stages</option>
                {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
              </select>
              <select value={source} onChange={e => setSource(e.target.value)} className="input w-40">
                <option value="">All Sources</option>
                {SOURCES.map(s => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
              </select>
              <select value={scoreFilter} onChange={e => setScoreFilter(e.target.value)} className="input w-36">
                <option value="">All Scores</option>
                <option value="hot">Hot (70+)</option>
                <option value="warm">Warm (40-69)</option>
                <option value="cold">Cold (&lt;40)</option>
              </select>
            </div>

            {/* Lead table */}
            <div className="card overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-slate-700/30">
                      <th className="text-left px-5 py-4 text-gray-400 font-medium">Name</th>
                      <th className="text-left px-5 py-4 text-gray-400 font-medium">Phone</th>
                      <th className="text-left px-5 py-4 text-gray-400 font-medium">Stage</th>
                      <th className="text-left px-5 py-4 text-gray-400 font-medium">Score</th>
                      <th className="text-left px-5 py-4 text-gray-400 font-medium">Source</th>
                      <th className="text-left px-5 py-4 text-gray-400 font-medium">Assigned To</th>
                      <th className="text-left px-5 py-4 text-gray-400 font-medium">Last Contact</th>
                      <th className="text-left px-5 py-4 text-gray-400 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {leads.map((lead: any) => {
                      const score = lead.aiScore || 0
                      return (
                        <tr key={lead._id} className="hover:bg-white/[0.02] cursor-pointer transition-colors">
                          <td className="px-5 py-4" onClick={() => openLead(lead)}>
                            <p className="text-white font-medium">{lead.name}</p>
                            <p className="text-xs text-gray-400">{lead.email}</p>
                          </td>
                          <td className="px-5 py-4 text-gray-300 text-xs">{lead.phone || '—'}</td>
                          <td className="px-5 py-4">
                            <span className={`badge ${stageColor(lead.stage)} capitalize text-xs`}>{STAGE_LABELS[lead.stage] || lead.stage || 'New'}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`badge ${scoreColor(score)} text-xs`}>
                              {score} · {scoreLabel(score)}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-gray-400 text-xs">{SOURCE_LABELS[lead.source] || lead.source || '—'}</td>
                          <td className="px-5 py-4 text-gray-300 text-xs">{lead.assignedTo?.name || <span className="text-orange-400">Unassigned</span>}</td>
                          <td className="px-5 py-4 text-gray-400 text-xs">
                            {lead.lastContactedAt ? format(new Date(lead.lastContactedAt), 'dd MMM') : '—'}
                          </td>
                          <td className="px-5 py-4">
                            <button onClick={() => openLead(lead)}
                              className="p-1.5 hover:bg-violet-500/20 text-gray-400 hover:text-violet-400 rounded-lg transition-colors">
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {leads.length === 0 && <div className="text-center py-12 text-gray-500">No leads found</div>}
              </div>
            </div>
          </>
        )}

        {/* Meta Ads Setup Tab */}
        {tab === 'meta' && (
          <div className="space-y-6">
            <div className="card border border-blue-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <Facebook className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold">Meta (Facebook) Lead Ads Integration</h3>
                  <p className="text-xs text-gray-400">Auto-import leads from Facebook/Instagram Lead Generation Ads</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wider">Step 1: Webhook URL</p>
                  <div className="flex items-center gap-2 bg-slate-800 rounded-xl px-4 py-3">
                    <code className="text-green-400 text-sm flex-1 break-all">{META_WEBHOOK_URL}</code>
                    <button onClick={() => { navigator.clipboard.writeText(META_WEBHOOK_URL); toast.success('Copied!') }}
                      className="p-1.5 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0">
                      <Copy className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wider">Step 2: Verify Token</p>
                  <div className="flex items-center gap-2 bg-slate-800 rounded-xl px-4 py-3">
                    <code className="text-amber-400 text-sm flex-1">{META_VERIFY_TOKEN}</code>
                    <button onClick={() => { navigator.clipboard.writeText(META_VERIFY_TOKEN); toast.success('Copied!') }}
                      className="p-1.5 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0">
                      <Copy className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-slate-800/60 rounded-xl space-y-2 text-sm text-gray-300">
                <p className="font-semibold text-white">Setup Instructions:</p>
                <ol className="list-decimal list-inside space-y-1.5 text-gray-400">
                  <li>Go to <strong className="text-gray-200">Meta Business Suite → Lead Ads → CRM Integration</strong></li>
                  <li>Or go to <strong className="text-gray-200">Facebook Developers → Your App → Webhooks → Page → Subscribe to leadgen</strong></li>
                  <li>Paste the Webhook URL and Verify Token above</li>
                  <li>Subscribe to the <strong className="text-gray-200">leadgen</strong> field</li>
                  <li>Leads will auto-appear in CRM and be assigned to your sales team</li>
                </ol>
              </div>
            </div>

            <div className="card border border-violet-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-violet-400" />
                <h3 className="text-white font-semibold">How leads are handled</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-slate-800/60 rounded-xl p-4">
                  <p className="text-violet-400 font-semibold mb-1">Auto Dedup</p>
                  <p className="text-gray-400">Duplicate phone numbers are automatically skipped — no double entries</p>
                </div>
                <div className="bg-slate-800/60 rounded-xl p-4">
                  <p className="text-violet-400 font-semibold mb-1">Round Robin Assignment</p>
                  <p className="text-gray-400">Leads are auto-assigned to sales/managers based on current workload</p>
                </div>
                <div className="bg-slate-800/60 rounded-xl p-4">
                  <p className="text-violet-400 font-semibold mb-1">AI Scoring</p>
                  <p className="text-gray-400">Meta leads start as Warm (50 score). Score updates as sales team interacts</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Import Tab */}
        {tab === 'import' && (
          <div className="card space-y-5">
            <div>
              <h3 className="text-white font-bold mb-1">Bulk Import Leads</h3>
              <p className="text-sm text-gray-400">Paste leads from Excel/CSV. One lead per line.</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2">Format: <code className="text-green-400">Name, Phone, Email</code> (one per line)</p>
              <div className="bg-slate-800/60 rounded-xl p-3 text-xs text-gray-500 mb-3 font-mono">
                Ramesh Kumar, 9876543210, ramesh@email.com<br />
                Priya Sharma, 9123456789, priya@gmail.com<br />
                9012345678 (phone only also works)
              </div>
              <textarea value={importText} onChange={e => setImportText(e.target.value)}
                placeholder="Paste your lead data here..." rows={10}
                className="input w-full font-mono text-sm" />
            </div>
            <div className="flex items-center gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Source</label>
                <select value={importSource} onChange={e => setImportSource(e.target.value)} className="input w-48">
                  {SOURCES.map(s => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
                </select>
              </div>
              <button onClick={handleImport} disabled={importing || !importText.trim()}
                className="btn-primary px-6 py-2.5 flex items-center gap-2 disabled:opacity-50 mt-5">
                <Upload className="w-4 h-4" />
                {importing ? 'Importing...' : 'Import Leads'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lead Detail Side Panel */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-end" onClick={e => e.target === e.currentTarget && setSelectedLead(null)}>
          <div className="w-full max-w-lg bg-slate-900 border-l border-white/10 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedLead.name}</h3>
                  <span className={`badge ${stageColor(selectedLead.stage)} text-xs mt-1`}>{STAGE_LABELS[selectedLead.stage] || selectedLead.stage}</span>
                </div>
                <button onClick={() => setSelectedLead(null)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Contact info */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  {selectedLead.email || '—'}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  {selectedLead.phone || '—'}
                  {selectedLead.phone && (
                    <a href={`https://wa.me/91${selectedLead.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                      className="ml-auto text-xs text-green-400 hover:underline">WhatsApp</a>
                  )}
                </div>
                {selectedLead.lastContactedAt && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    Last contact: {format(new Date(selectedLead.lastContactedAt), 'dd MMM yyyy')}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <TrendingUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  Source: {SOURCE_LABELS[selectedLead.source] || selectedLead.source || '—'}
                </div>
              </div>

              {/* Score */}
              <div className="flex gap-3 mb-6">
                <span className={`badge ${scoreColor(selectedLead.aiScore || 0)}`}>
                  Score: {selectedLead.aiScore || 0} · {scoreLabel(selectedLead.aiScore || 0)}
                </span>
                {selectedLead.city && <span className="badge bg-slate-700 text-gray-300">{selectedLead.city}</span>}
              </div>

              {/* Assign to Salesperson */}
              <div className="card mb-4">
                <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" /> Assign to Sales Team
                </p>
                <div className="flex gap-2">
                  <select value={assignTo} onChange={e => setAssignTo(e.target.value)} className="input flex-1 py-2 text-sm">
                    <option value="">Select salesperson...</option>
                    {salespersons.map((s: any) => (
                      <option key={s._id} value={s._id}>{s.name} ({s.affiliateCode || s.email})</option>
                    ))}
                  </select>
                  <button onClick={handleAssign} disabled={updating || !assignTo}
                    className="btn-primary px-4 py-2 text-sm disabled:opacity-50">
                    Assign
                  </button>
                </div>
                {selectedLead.assignedTo && (
                  <p className="text-xs text-gray-500 mt-2">Currently: <span className="text-gray-300">{selectedLead.assignedTo.name || selectedLead.assignedTo}</span></p>
                )}
              </div>

              {/* Stage update */}
              <div className="card mb-4">
                <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">Update Stage</p>
                <div className="flex gap-2">
                  <select value={newStage} onChange={e => setNewStage(e.target.value)} className="input flex-1 py-2 text-sm">
                    {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                  </select>
                  <button onClick={updateStage} disabled={updating}
                    className="btn-primary px-4 py-2 text-sm disabled:opacity-50">
                    Update
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div className="card mb-4">
                <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Notes
                </p>
                <div className="space-y-3 mb-3 max-h-48 overflow-y-auto">
                  {((detailData?.lead?.notes || detailData?.notes || [])).map((n: any, i: number) => (
                    <div key={i} className="bg-slate-700/40 rounded-xl p-3">
                      <p className="text-white text-sm">{n.text || n.content || n}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {n.by?.name && <span className="text-gray-500 text-xs">{n.by.name}</span>}
                        {n.createdAt && <span className="text-gray-500 text-xs">{format(new Date(n.createdAt), 'dd MMM, hh:mm a')}</span>}
                      </div>
                    </div>
                  ))}
                  {!(detailData?.lead?.notes || detailData?.notes || []).length && (
                    <p className="text-gray-500 text-sm text-center py-2">No notes yet</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <input value={note} onChange={e => setNote(e.target.value)}
                    placeholder="Add a note..." className="input flex-1 py-2 text-sm"
                    onKeyDown={e => e.key === 'Enter' && addNote()} />
                  <button onClick={addNote} disabled={updating || !note.trim()}
                    className="btn-primary px-4 py-2 text-sm disabled:opacity-50">
                    Add
                  </button>
                </div>
              </div>

              {/* Follow-ups */}
              {((detailData?.lead?.followUps || detailData?.followUps || [])).length > 0 && (
                <div className="card">
                  <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">Follow-ups</p>
                  <div className="space-y-2">
                    {(detailData?.lead?.followUps || detailData?.followUps || []).map((fu: any, i: number) => (
                      <div key={i} className={`flex items-center gap-2 text-sm p-2 rounded-lg ${fu.done ? 'bg-green-500/10 opacity-60' : 'bg-slate-700/30'}`}>
                        <Clock className={`w-3.5 h-3.5 flex-shrink-0 ${fu.done ? 'text-green-400' : 'text-amber-400'}`} />
                        <span className="text-gray-300 capitalize">{fu.type || 'follow-up'}</span>
                        {fu.scheduledAt && <span className="text-gray-500 text-xs ml-auto">{format(new Date(fu.scheduledAt), 'dd MMM')}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Lead Modal */}
      {createModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Add Lead</h3>
              <button onClick={() => setCreateModal(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Full Name *</label>
                <input value={createForm.name} onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Ramesh Kumar" className="input w-full" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Phone *</label>
                <input value={createForm.phone} onChange={e => setCreateForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="9876543210" className="input w-full" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Email</label>
                <input value={createForm.email} onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="ramesh@email.com" className="input w-full" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Source</label>
                  <select value={createForm.source} onChange={e => setCreateForm(p => ({ ...p, source: e.target.value }))} className="input w-full">
                    {SOURCES.map(s => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Initial Stage</label>
                  <select value={createForm.stage} onChange={e => setCreateForm(p => ({ ...p, stage: e.target.value }))} className="input w-full">
                    {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">City</label>
                <input value={createForm.city} onChange={e => setCreateForm(p => ({ ...p, city: e.target.value }))}
                  placeholder="Delhi" className="input w-full" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setCreateModal(false)} className="btn-secondary flex-1 py-2.5">Cancel</button>
              <button onClick={handleCreate} disabled={creating}
                className="btn-primary flex-1 py-2.5 disabled:opacity-50">
                {creating ? 'Creating...' : 'Create Lead'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
