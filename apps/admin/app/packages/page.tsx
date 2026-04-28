'use client'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminAPI } from '@/lib/api'
import { tierStyle } from '@/lib/usePackages'
import AdminLayout from '@/components/AdminLayout'
import toast from 'react-hot-toast'
import {
  Edit2, X, Plus, Check, Package, DollarSign, Settings, BookOpen,
  ChevronDown, ChevronUp, Percent, Hash, Users, Shield, Zap, Star,
  TrendingUp, IndianRupee, Info, Video, Link, Calendar, Trash2, CheckCircle2,
  MessageCircle, Send
} from 'lucide-react'

const TIER_ICONS = [Zap, Star, TrendingUp, Shield, Package, BookOpen]

const TABS = [
  { id: 'packages', label: 'Packages', icon: Package },
  { id: 'commissions', label: 'Partnership earning Rules', icon: Percent },
  { id: 'tax', label: 'Tax Settings', icon: IndianRupee },
  { id: 'referral', label: 'Course Referral', icon: BookOpen },
  { id: 'resources', label: 'Partner Resources', icon: Link },
]

const makePartnerEarnings = (pkgList: any[]) =>
  pkgList.map(p => ({
    earnerTier: p._id,      // use _id as identifier
    earnerName: p.name,     // display name
    type: 'percentage', value: 0,
    l2Type: 'percentage', l2Value: 0,
    l3Type: 'percentage', l3Value: 0,
  }))

const defaultPartnerEarnings = () => [] as any[]

const DEFAULT_FORM = {
  name: '', price: 0, description: '', tier: '',
  displayOrder: 0, badge: '', badgeColor: '#6366f1',
  features: [] as string[],
  emiAvailable: false, emiDays: [] as number[], emiMonthlyAmount: 0,
  coursesAccess: 'limited', liveClassAccess: false, aiCoachAccess: false,
  jobEngineAccess: false, communityAccess: true, personalBrandAccess: false,
  mentorSupport: false, prioritySupport: false,
  promoDiscountPercent: 0,
  commissionRate: 0, commissionRateType: 'percentage',
  commissionLevel2: 0, commissionLevel2Type: 'percentage',
  commissionLevel3: 0, commissionLevel3Type: 'percentage',
  partnerEarnings: defaultPartnerEarnings(),
  salesTeamCommission: { type: 'percentage', value: 0 },
  managerCommission: { type: 'percentage', value: 0 },
  courseReferralCommission: { type: 'percentage', value: 0 },
  courses: [] as string[],
  isActive: true,
  statCourses: 500,
  statMembers: 10000,
  journeySteps: [
    { title: 'Secure checkout in 60 seconds', desc: 'Pay safely with Razorpay. Cards, UPI, EMI — all options available.' },
    { title: 'Instant plan activation', desc: 'Your account is upgraded immediately. No wait time.' },
    { title: 'Enroll in 500+ courses free', desc: 'Browse the full catalog and self-enroll in anything you want.' },
    { title: 'Start earning as a partner', desc: 'Get your unique link and start earning income by helping others join.' },
  ] as { title: string; desc: string }[],
  testimonials: [] as { name: string; role: string; avatar: string; text: string; rating: number; earning: string }[],
  faqs: [] as { q: string; a: string }[],
  communityLinks: {
    telegramUrl: '',
    telegramLabel: '',
    whatsappUrl: '',
    whatsappLabel: '',
    note: '',
  } as { telegramUrl: string; telegramLabel: string; whatsappUrl: string; whatsappLabel: string; note: string },
}

function MatrixEditor({ packages, onSave }: { packages: any[], onSave: (soldPkgId: string, earnings: any[]) => void }) {
  const [editing, setEditing] = useState<{ soldPkgId: string, earnerPkgId: string } | null>(null)
  const [editVal, setEditVal] = useState('')

  const getValue = (soldPkg: any, earnerPkgId: string) => {
    const row = (soldPkg.partnerEarnings || []).find((r: any) => r.earnerTier === earnerPkgId)
    return row?.value || 0
  }

  const handleSave = (soldPkg: any, earnerPkg: any) => {
    const newVal = Math.max(0, Number(editVal) || 0)
    const existing = soldPkg.partnerEarnings || []
    const updated = existing.find((r: any) => r.earnerTier === earnerPkg._id)
      ? existing.map((r: any) => r.earnerTier === earnerPkg._id ? { ...r, value: newVal, type: 'flat' } : r)
      : [...existing, { earnerTier: earnerPkg._id, earnerName: earnerPkg.name, value: newVal, type: 'flat' }]
    onSave(soldPkg._id, updated)
    setEditing(null)
  }

  return (
    <table className="w-full text-sm min-w-max">
      <thead>
        <tr className="border-b border-white/10">
          <th className="text-left pb-3 pr-6 text-gray-400 font-medium">Earner ↓ / Sells →</th>
          {packages.map((pkg: any) => (
            <th key={pkg._id} className={`text-center pb-3 px-3 font-bold ${tierStyle(pkg.tier, packages).text}`}>
              {pkg.name}<br/><span className="text-gray-500 font-normal text-xs">₹{(pkg.price||0).toLocaleString()}</span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-white/5">
        {packages.map((earnerPkg: any) => (
          <tr key={earnerPkg._id} className="hover:bg-white/[0.02]">
            <td className="py-2 pr-6">
              <span className={`font-bold text-sm ${tierStyle(earnerPkg.tier, packages).text}`}>{earnerPkg.name}</span>
              <span className="text-gray-500 text-xs ml-1">partner</span>
            </td>
            {packages.map((soldPkg: any) => {
              const isEditing = editing?.soldPkgId === soldPkg._id && editing?.earnerPkgId === earnerPkg._id
              const val = getValue(soldPkg, earnerPkg._id)
              return (
                <td key={soldPkg._id} className="py-2 px-3 text-center">
                  {isEditing ? (
                    <div className="flex items-center gap-1 justify-center">
                      <span className="text-gray-400 text-xs">₹</span>
                      <input
                        autoFocus
                        type="number" min="0" step="1"
                        value={editVal}
                        onChange={e => setEditVal(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSave(soldPkg, earnerPkg); if (e.key === 'Escape') setEditing(null) }}
                        className="w-20 bg-white/10 border border-indigo-500 rounded px-1 py-0.5 text-white text-xs text-center focus:outline-none"
                      />
                      <button onClick={() => handleSave(soldPkg, earnerPkg)} className="text-green-400 hover:text-green-300 text-xs font-bold">✓</button>
                      <button onClick={() => setEditing(null)} className="text-gray-500 hover:text-gray-300 text-xs">✕</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditing({ soldPkgId: soldPkg._id, earnerPkgId: earnerPkg._id }); setEditVal(String(val)) }}
                      className={`font-semibold text-sm px-2 py-0.5 rounded hover:bg-white/10 transition-colors ${val > 0 ? 'text-green-400' : 'text-gray-600 hover:text-gray-400'}`}
                    >
                      {val > 0 ? `₹${Math.round(val).toLocaleString()}` : '₹0'}
                    </button>
                  )}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default function PackagesPage() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState('packages')
  const [editPkg, setEditPkg] = useState<any>(null)
  const [isCreate, setIsCreate] = useState(false)
  const [form, setForm] = useState<any>(DEFAULT_FORM)
  const [featuresInput, setFeaturesInput] = useState('')
  const [taxForm, setTaxForm] = useState({ tdsRate: 2, gstRate: 18, gstNumber: '', minWithdrawalAmount: 500 })
  const [resourceForm, setResourceForm] = useState({ webinarLink: '', webinarTitle: '', webinarDate: '', presentationVideoLink: '' })
  const [myEarnings, setMyEarnings] = useState<any[]>([])
  const [allPkgL2L3, setAllPkgL2L3] = useState<any[]>([])

  const { data: pkgData } = useQuery({
    queryKey: ['admin-packages'],
    queryFn: () => adminAPI.packages().then(r => r.data)
  })

  const { data: coursesData } = useQuery({
    queryKey: ['admin-courses-all'],
    queryFn: () => adminAPI.allCourses({ limit: 200 }).then(r => r.data)
  })

  const { data: taxData } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: () => adminAPI.platformSettings().then(r => r.data)
  })

  useEffect(() => {
    if (taxData?.settings) {
      setTaxForm({
        tdsRate: taxData.settings.tdsRate ?? 2,
        gstRate: taxData.settings.gstRate ?? 18,
        gstNumber: taxData.settings.gstNumber || '',
        minWithdrawalAmount: taxData.settings.minWithdrawalAmount ?? 500,
      })
      setResourceForm({
        webinarLink: taxData.settings.webinarLink || '',
        webinarTitle: taxData.settings.webinarTitle || '',
        webinarDate: taxData.settings.webinarDate || '',
        presentationVideoLink: taxData.settings.presentationVideoLink || '',
      })
    }
  }, [taxData])

  const packages = pkgData?.packages || pkgData || []
  const allCourses = coursesData?.courses || []

  const updatePkgMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminAPI.updatePackage(id, data),
    onSuccess: () => {
      toast.success('Package updated successfully')
      qc.invalidateQueries({ queryKey: ['admin-packages'] })
      setEditPkg(null)
    },
    onError: () => toast.error('Failed to update package'),
  })

  const createPkgMutation = useMutation({
    mutationFn: (data: any) => adminAPI.createPackage(data),
    onSuccess: () => {
      toast.success('Package created successfully')
      qc.invalidateQueries({ queryKey: ['admin-packages'] })
      setIsCreate(false)
    },
    onError: () => toast.error('Failed to create package'),
  })

  const deletePkgMutation = useMutation({
    mutationFn: (id: string) => adminAPI.deletePackage(id),
    onSuccess: () => {
      toast.success('Package deleted')
      qc.invalidateQueries({ queryKey: ['admin-packages'] })
    },
    onError: () => toast.error('Failed to delete package'),
  })

  const handleDelete = (pkg: any) => {
    if (!confirm(`Delete "${pkg.name}"? This cannot be undone.`)) return
    deletePkgMutation.mutate(pkg._id)
  }

  const taxMutation = useMutation({
    mutationFn: (data: any) => adminAPI.updatePlatformSettings(data),
    onSuccess: () => {
      toast.success('Tax settings saved')
      qc.invalidateQueries({ queryKey: ['platform-settings'] })
    },
    onError: () => toast.error('Failed to save tax settings'),
  })

  const resourceMutation = useMutation({
    mutationFn: (data: any) => adminAPI.updatePlatformSettings(data),
    onSuccess: () => {
      toast.success('Partner resources saved')
      qc.invalidateQueries({ queryKey: ['platform-settings'] })
    },
    onError: () => toast.error('Failed to save partner resources'),
  })

  const openEdit = (pkg: any) => {
    setIsCreate(false)
    setEditPkg(pkg)
    setForm({
      name: pkg.name || '',
      price: pkg.price || 0,
      description: pkg.description || '',
      tier: pkg.tier || '',
      displayOrder: pkg.displayOrder || 0,
      badge: pkg.badge || '',
      badgeColor: pkg.badgeColor || '#6366f1',
      features: pkg.features || [],
      emiAvailable: pkg.emiAvailable || false,
      emiDays: Array.isArray(pkg.emiDays) ? pkg.emiDays : [],
      emiMonthlyAmount: pkg.emiMonthlyAmount || 0,
      coursesAccess: pkg.coursesAccess || 'limited',
      liveClassAccess: pkg.liveClassAccess || false,
      aiCoachAccess: pkg.aiCoachAccess || false,
      jobEngineAccess: pkg.jobEngineAccess || false,
      communityAccess: pkg.communityAccess !== false,
      personalBrandAccess: pkg.personalBrandAccess || false,
      mentorSupport: pkg.mentorSupport || false,
      prioritySupport: pkg.prioritySupport || false,
      promoDiscountPercent: pkg.promoDiscountPercent || 0,
      commissionRate: pkg.commissionRate || 0,
      commissionRateType: pkg.commissionRateType || 'percentage',
      commissionLevel2: pkg.commissionLevel2 || 0,
      commissionLevel2Type: pkg.commissionLevel2Type || 'percentage',
      commissionLevel3: pkg.commissionLevel3 || 0,
      commissionLevel3Type: pkg.commissionLevel3Type || 'percentage',
      partnerEarnings: packages
        .map((p: any) => {
          const existing = (pkg.partnerEarnings || []).find((r: any) => r.earnerTier === p._id || r.earnerTier === p.name || r.earnerTier === p.tier)
          return existing
            ? { ...existing, earnerTier: p._id, earnerName: p.name }
            : { earnerTier: p._id, earnerName: p.name, type: 'percentage', value: 0, l2Type: 'percentage', l2Value: 0, l3Type: 'percentage', l3Value: 0 }
        }),
      salesTeamCommission: pkg.salesTeamCommission || { type: 'percentage', value: 0 },
      managerCommission: pkg.managerCommission || { type: 'percentage', value: 0 },
      courseReferralCommission: pkg.courseReferralCommission || { type: 'percentage', value: 0 },
      courses: (pkg.courses || []).map((c: any) => (typeof c === 'object' ? c._id || c : c).toString()),
      isActive: pkg.isActive !== false,
      statCourses: pkg.statCourses ?? 500,
      statMembers: pkg.statMembers ?? 10000,
      journeySteps: pkg.journeySteps?.length > 0 ? pkg.journeySteps : [
        { title: 'Secure checkout in 60 seconds', desc: 'Pay safely with Razorpay. Cards, UPI, EMI — all options available.' },
        { title: 'Instant plan activation', desc: 'Your account is upgraded immediately. No wait time.' },
        { title: 'Enroll in 500+ courses free', desc: 'Browse the full catalog and self-enroll in anything you want.' },
        { title: 'Start earning as a partner', desc: 'Get your unique link and start earning income by helping others join.' },
      ],
      testimonials: pkg.testimonials || [],
      faqs: pkg.faqs || [],
      communityLinks: {
        telegramUrl: pkg.communityLinks?.telegramUrl || '',
        telegramLabel: pkg.communityLinks?.telegramLabel || '',
        whatsappUrl: pkg.communityLinks?.whatsappUrl || '',
        whatsappLabel: pkg.communityLinks?.whatsappLabel || '',
        note: pkg.communityLinks?.note || '',
      },
    })
    setFeaturesInput((pkg.features || []).join('\n'))
    // Load "my earnings" — what this package's tier partner earns when selling each other package
    const earnings = packages.map((soldPkg: any) => {
      const entry = (soldPkg.partnerEarnings || []).find(
        (r: any) => r.earnerTier?.toString() === pkg._id?.toString() || r.earnerTier === pkg.tier
      )
      return {
        soldPkgId: soldPkg._id,
        soldPkgName: soldPkg.name,
        soldPkgTier: (soldPkg.tier || '').toLowerCase(),
        soldPkgPrice: soldPkg.price,
        type: entry?.type || 'flat',
        value: entry?.value || 0,
      }
    })
    setMyEarnings(earnings)
    const l2l3 = packages.map((soldPkg: any) => ({
      pkgId: soldPkg._id,
      pkgName: soldPkg.name,
      pkgTier: (soldPkg.tier || '').toLowerCase(),
      pkgPrice: soldPkg.price,
      l2Type: soldPkg.commissionLevel2Type || 'flat',
      l2Value: soldPkg.commissionLevel2 || 0,
      l3Type: soldPkg.commissionLevel3Type || 'flat',
      l3Value: soldPkg.commissionLevel3 || 0,
    }))
    setAllPkgL2L3(l2l3)
  }

  const openCreate = () => {
    setEditPkg(null)
    setIsCreate(true)
    setForm({ ...DEFAULT_FORM, partnerEarnings: makePartnerEarnings(packages) })
    setFeaturesInput('')
    setAllPkgL2L3(packages.map((pkg: any) => ({
      pkgId: pkg._id, pkgName: pkg.name, pkgTier: (pkg.tier || '').toLowerCase(),
      pkgPrice: pkg.price, l2Type: 'flat', l2Value: 0, l3Type: 'flat', l3Value: 0,
    })))
  }

  const saveMyEarnings = async (pkg: any) => {
    for (const entry of myEarnings) {
      await adminAPI.updatePackageEarner(entry.soldPkgId, {
        earnerTierId: pkg._id,
        earnerTierName: pkg.name,
        type: entry.type,
        value: entry.value,
      })
    }
    qc.invalidateQueries({ queryKey: ['admin-packages'] })
  }

  const saveAllL2L3 = async () => {
    for (const entry of allPkgL2L3) {
      await adminAPI.updatePackage(entry.pkgId, {
        commissionLevel2: entry.l2Value,
        commissionLevel2Type: entry.l2Type,
        commissionLevel3: entry.l3Value,
        commissionLevel3Type: entry.l3Type,
      })
    }
    qc.invalidateQueries({ queryKey: ['admin-packages'] })
  }

  const savePackage = () => {
    const features = featuresInput.split('\n').map((f: string) => f.trim()).filter(Boolean)
    const payload = { ...form, features }
    if (isCreate) {
      createPkgMutation.mutate(payload)
    } else if (editPkg) {
      updatePkgMutation.mutate({ id: editPkg._id, data: payload }, {
        onSuccess: () => {
          saveMyEarnings(editPkg)
          saveAllL2L3()
        },
      })
    }
  }

  const updateInlineCommission = (pkg: any, field: string, value: any) => {
    updatePkgMutation.mutate({ id: pkg._id, data: { [field]: value } })
  }

  const saving = updatePkgMutation.isPending || createPkgMutation.isPending
  const modalOpen = !!editPkg || isCreate

  // Computed tax examples
  const examplePkg = packages.find((p: any) => p.tier === 'pro') || packages[0]
  const examplePrice = examplePkg?.price || 9999
  const gstAmt = Math.round(examplePrice * taxForm.gstRate / 100)
  const gstTotal = examplePrice + gstAmt
  const exampleWithdrawal = 5000
  const tdsAmt = Math.round(exampleWithdrawal * taxForm.tdsRate / 100)
  const netWithdrawal = exampleWithdrawal - tdsAmt

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* ── Page Header ── */}
        <div className="page-header">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg">
                  <Package className="w-5 h-5 text-white" />
                </div>
                Packages & Partnership earning
              </h1>
              <p className="text-gray-400 text-sm mt-1">Manage plans, Partnership earnings, and tax settings</p>
            </div>
            {activeTab === 'packages' && (
              <button onClick={openCreate} className="btn-primary flex items-center gap-2">
                <Plus className="w-4 h-4" /> Create Package
              </button>
            )}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="tab-bar w-fit">
          {TABS.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 ${activeTab === tab.id ? 'tab-active' : 'tab-inactive'}`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* ── PACKAGES TAB ── */}
        {activeTab === 'packages' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {packages.map((pkg: any, pkgIdx: number) => {
              const tier = (pkg.tier || '').toLowerCase()
              const style = tierStyle(tier, packages)
              const TierIcon = TIER_ICONS[pkgIdx % TIER_ICONS.length]
              const l2Label = pkg.commissionLevel2Type === 'flat'
                ? `₹${(pkg.commissionLevel2 || 0).toLocaleString()}`
                : `${pkg.commissionLevel2 || 0}%`
              const l3Label = pkg.commissionLevel3Type === 'flat'
                ? `₹${(pkg.commissionLevel3 || 0).toLocaleString()}`
                : `${pkg.commissionLevel3 || 0}%`
              return (
                <div key={pkg._id} className={`card border relative group`} style={{ background: `linear-gradient(135deg, ${style.hex}22, ${style.hex}08)`, borderColor: `${style.hex}55` }}>
                  {pkg.badge && (
                    <div className="absolute -top-2.5 left-4">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: pkg.badgeColor || '#6366f1' }}>
                        {pkg.badge}
                      </span>
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg bg-white/5`}>
                        <TierIcon className={`w-4 h-4 ${style.text}`} />
                      </div>
                      <div>
                        <span className={`text-xs font-bold uppercase tracking-wider ${style.text}`}>{tier}</span>
                        <p className="text-base font-black text-white leading-tight">{pkg.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                      <button onClick={() => openEdit(pkg)}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(pkg)}
                        className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors text-gray-400 hover:text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className={`text-2xl font-black ${style.text} mb-3`}>
                    ₹{(pkg.price || 0).toLocaleString()}
                  </p>

                  <div className="space-y-1.5 mb-3 p-2 bg-black/20 rounded-lg">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Promo Discount</span>
                      <span className={`font-semibold ${(pkg.promoDiscountPercent || 0) > 0 ? 'text-emerald-400' : 'text-gray-600'}`}>
                        {pkg.promoDiscountPercent || 0}% off
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Partner L1</span>
                      <span className="text-green-400 font-semibold">Per tier →</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Partner L2</span>
                      <span className="text-blue-400 font-semibold">{l2Label}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Partner L3</span>
                      <span className="text-violet-400 font-semibold">{l3Label}</span>
                    </div>
                    {pkg.salesTeamCommission?.value > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Sales Team</span>
                        <span className="text-amber-400 font-semibold">
                          {pkg.salesTeamCommission.type === 'flat' ? `₹${pkg.salesTeamCommission.value}` : `${pkg.salesTeamCommission.value}%`}
                        </span>
                      </div>
                    )}
                  </div>

                  {(pkg.courses || []).length > 0 && (
                    <div className="mb-3 p-2 bg-black/20 rounded-lg space-y-1.5">
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Included Courses</p>
                      {(pkg.courses || []).map((c: any) => (
                        <div key={c._id} className="flex items-center gap-2">
                          {c.thumbnail
                            ? <img src={c.thumbnail} className="w-6 h-6 rounded object-cover flex-shrink-0" alt="" />
                            : <div className="w-6 h-6 rounded bg-violet-500/20 flex items-center justify-center flex-shrink-0"><BookOpen className="w-3 h-3 text-violet-400" /></div>
                          }
                          <span className="text-xs text-gray-300 truncate flex-1">{c.title}</span>
                          <span className={`text-[10px] px-1 rounded ${c.status === 'published' ? 'text-emerald-400' : 'text-amber-400'}`}>{c.status}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="text-gray-500">{(pkg.courses || []).length} courses included</span>
                    <button
                      onClick={() => updatePkgMutation.mutate({ id: pkg._id, data: { isActive: !pkg.isActive } })}
                      title={pkg.isActive ? 'Click to hide from website' : 'Click to show on website'}
                      className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all ${
                        pkg.isActive
                          ? 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30'
                          : 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-green-500/20 hover:text-green-400 hover:border-green-500/30'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${pkg.isActive ? 'bg-green-400' : 'bg-red-400'}`} />
                      {pkg.isActive ? 'Visible' : 'Hidden'}
                    </button>
                  </div>

                  <ul className="space-y-1">
                    {(pkg.features || []).slice(0, 3).map((f: string, i: number) => (
                      <li key={i} className="flex items-center gap-1.5 text-xs text-gray-300">
                        <Check className={`w-3 h-3 flex-shrink-0 ${style.text}`} />
                        {f}
                      </li>
                    ))}
                    {(pkg.features?.length || 0) > 3 && (
                      <li className="text-xs text-gray-500">+{pkg.features.length - 3} more features</li>
                    )}
                  </ul>

                  <button onClick={() => openEdit(pkg)}
                    className="w-full mt-4 py-1.5 text-xs font-medium text-gray-400 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-all">
                    Edit Package
                  </button>
                </div>
              )
            })}
            {packages.length === 0 && (
              <div className="col-span-4 text-center py-12 text-gray-500">No packages found</div>
            )}
          </div>
        )}

        {/* ── COMMISSION RULES TAB ── */}
        {activeTab === 'commissions' && (
          <div className="space-y-6">

            {/* Partner Earnings Matrix — inline editable */}
            <div className="card overflow-x-auto">
              <h2 className="text-base font-bold text-white mb-1">Partner Earnings Matrix</h2>
              <p className="text-gray-400 text-sm mb-1">
                How much a partner earns (flat ₹) when they sell any package, based on their own package tier.
              </p>
              <p className="text-xs text-blue-300 mb-4 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
                <strong>Edit directly:</strong> Click any cell, type the flat ₹ amount, press Enter or click Save. Each cell = what that earner tier gets when they help sell that column's package.
              </p>
              {packages.length > 0 && (
                <MatrixEditor packages={packages} onSave={(soldPkgId, updatedEarnings) => {
                  updatePkgMutation.mutate({ id: soldPkgId, data: { partnerEarnings: updatedEarnings } })
                }} />
              )}
              {packages.length === 0 && <p className="text-gray-500 text-sm">No packages configured yet</p>}
            </div>

            <div className="card overflow-x-auto">
              <h2 className="text-base font-bold text-white mb-1">Sales Team & Manager Partnership earning Per Package</h2>
              <p className="text-gray-400 text-sm mb-4">Set L1 partner Partnership earnings in the matrix above. Configure Sales Team and Manager Partnership earnings here.</p>
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left pb-3 pr-4 text-gray-400 font-medium w-40">Package</th>
                    <th className="text-left pb-3 px-3 text-gray-400 font-medium">Price</th>
                    <th className="text-left pb-3 px-3 text-amber-400 font-medium">Sales Team</th>
                    <th className="text-left pb-3 px-3 text-pink-400 font-medium">Mgr Partnership earning</th>
                    <th className="text-left pb-3 px-3 text-blue-400 font-medium">L2</th>
                    <th className="text-left pb-3 px-3 text-violet-400 font-medium">L3</th>
                    <th className="pb-3 px-3 text-gray-400 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {packages.map((pkg: any) => {
                    const tier = (pkg.tier || '').toLowerCase()
                    const style = tierStyle(tier, packages)
                    const salesVal = pkg.salesTeamCommission?.type === 'flat'
                      ? `₹${pkg.salesTeamCommission?.value || 0}`
                      : `${pkg.salesTeamCommission?.value || 0}%`
                    const mgrVal = pkg.managerCommission?.type === 'flat'
                      ? `₹${pkg.managerCommission?.value || 0}`
                      : `${pkg.managerCommission?.value || 0}%`
                    const l2Val = pkg.commissionLevel2Type === 'flat'
                      ? `₹${pkg.commissionLevel2 || 0}`
                      : `${pkg.commissionLevel2 || 0}%`
                    const l3Val = pkg.commissionLevel3Type === 'flat'
                      ? `₹${pkg.commissionLevel3 || 0}`
                      : `${pkg.commissionLevel3 || 0}%`
                    return (
                      <tr key={pkg._id} className="hover:bg-white/[0.02]">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full bg-current ${style.text}`} />
                            <span className={`font-semibold ${style.text}`}>{pkg.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-white font-medium">₹{(pkg.price || 0).toLocaleString()}</td>
                        <td className="py-3 px-3 text-amber-400 font-semibold">{salesVal}</td>
                        <td className="py-3 px-3 text-pink-400 font-semibold">{mgrVal}</td>
                        <td className="py-3 px-3 text-blue-400 font-semibold">{l2Val}</td>
                        <td className="py-3 px-3 text-violet-400 font-semibold">{l3Val}</td>
                        <td className="py-3 px-3">
                          <button onClick={() => openEdit(pkg)}
                            className="text-xs px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors">
                            Edit
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Earning example cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {packages.slice(0, 2).map((pkg: any) => {
                const tier = (pkg.tier || '').toLowerCase()
                const style = tierStyle(tier, packages)
                const price = pkg.price || 0
                const l1 = pkg.commissionRateType === 'flat' ? (pkg.commissionRate || 0) : Math.round(price * (pkg.commissionRate || 0) / 100)
                const salesEarn = pkg.salesTeamCommission?.type === 'flat'
                  ? pkg.salesTeamCommission?.value || 0
                  : Math.round(price * (pkg.salesTeamCommission?.value || 0) / 100)
                return (
                  <div key={pkg._id} className={`card border`} style={{ background: `linear-gradient(135deg, ${style.hex}22, ${style.hex}08)`, borderColor: `${style.hex}55` }}>
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className={`w-4 h-4 ${style.text}`} />
                      <h3 className="font-bold text-white text-sm">Earning Example — {pkg.name} (₹{price.toLocaleString()})</h3>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between"><span className="text-gray-400">Partner earns</span><span className="text-green-400 font-semibold">₹{l1.toLocaleString()}</span></div>
                      <div className="flex justify-between border-t border-white/10 pt-1.5"><span className="text-gray-400">Sales Team earns</span><span className="text-amber-400 font-semibold">₹{salesEarn.toLocaleString()}</span></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── TAX SETTINGS TAB ── */}
        {activeTab === 'tax' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base font-bold text-white">Global Tax Configuration</h2>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">GST Registration Number (GSTIN) — shown on invoices</label>
                <input
                  type="text"
                  value={taxForm.gstNumber}
                  onChange={e => setTaxForm({ ...taxForm, gstNumber: e.target.value.toUpperCase() })}
                  className="input font-mono tracking-widest"
                  placeholder="e.g. 07AAYFT7302G1ZN"
                  maxLength={15}
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">GST Rate (%) — added at checkout on top of package price</label>
                <div className="relative">
                  <input
                    type="number" step="0.1" min="0" max="100"
                    value={taxForm.gstRate}
                    onChange={e => setTaxForm({ ...taxForm, gstRate: Number(e.target.value) })}
                    className="input pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">TDS Rate (%) — deducted at withdrawal time</label>
                <div className="relative">
                  <input
                    type="number" step="0.1" min="0" max="100"
                    value={taxForm.tdsRate}
                    onChange={e => setTaxForm({ ...taxForm, tdsRate: Number(e.target.value) })}
                    className="input pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Minimum Withdrawal Amount (₹)</label>
                <div className="relative">
                  <input
                    type="number" min="0"
                    value={taxForm.minWithdrawalAmount}
                    onChange={e => setTaxForm({ ...taxForm, minWithdrawalAmount: Number(e.target.value) })}
                    className="input pl-7"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                </div>
              </div>

              <button
                onClick={() => taxMutation.mutate(taxForm)}
                disabled={taxMutation.isPending}
                className="btn-primary w-full disabled:opacity-50"
              >
                {taxMutation.isPending ? 'Saving...' : 'Save Tax Settings'}
              </button>
            </div>

            {/* Live examples */}
            <div className="space-y-4">
              <div className="card bg-gradient-to-br from-green-500/10 to-emerald-600/10 border border-green-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <IndianRupee className="w-4 h-4 text-green-400" />
                  <h3 className="font-bold text-white text-sm">Checkout Example</h3>
                </div>
                <p className="text-xs text-gray-400 mb-3">
                  When a student buys {examplePkg?.name || 'Pro'} package (₹{examplePrice.toLocaleString()}):
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Base Price</span>
                    <span className="text-white font-medium">₹{examplePrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">GST ({taxForm.gstRate}%)</span>
                    <span className="text-amber-400 font-medium">+ ₹{gstAmt.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-2">
                    <span className="text-white font-bold">Total Payable</span>
                    <span className="text-green-400 font-bold">₹{gstTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="card bg-gradient-to-br from-orange-500/10 to-red-600/10 border border-orange-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-orange-400" />
                  <h3 className="font-bold text-white text-sm">Withdrawal Example</h3>
                </div>
                <p className="text-xs text-gray-400 mb-3">
                  When a partner withdraws ₹{exampleWithdrawal.toLocaleString()}:
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Gross Amount</span>
                    <span className="text-white font-medium">₹{exampleWithdrawal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">TDS ({taxForm.tdsRate}%)</span>
                    <span className="text-red-400 font-medium">- ₹{tdsAmt.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-2">
                    <span className="text-white font-bold">Net Payout</span>
                    <span className="text-green-400 font-bold">₹{netWithdrawal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="card bg-slate-800/50 border border-white/5">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-gray-400 space-y-1">
                    <p><span className="text-white font-medium">GST</span> is added at checkout on top of the package price and collected from the buyer.</p>
                    <p><span className="text-white font-medium">TDS</span> is deducted from partner withdrawal amounts as per Indian tax regulations.</p>
                    <p>Changes take effect immediately for all new transactions.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── COURSE REFERRAL TAB ── */}
        {activeTab === 'referral' && (
          <div className="space-y-4">
            <div className="card">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base font-bold text-white">Course Referral Commission</h2>
              </div>
              <p className="text-gray-400 text-sm mb-5">Commission earned by partners when they refer individual courses (not package purchases)</p>

              <div className="space-y-3">
                {packages.map((pkg: any) => {
                  const tier = (pkg.tier || '').toLowerCase()
                  const style = tierStyle(tier, packages)
                  const cr = pkg.courseReferralCommission || { type: 'percentage', value: 0 }
                  const exampleCoursePrice = 2999
                  const earn = cr.type === 'flat' ? cr.value : Math.round(exampleCoursePrice * cr.value / 100)
                  return (
                    <div key={pkg._id} className={`flex items-center gap-4 p-4 rounded-xl border`} style={{ background: `linear-gradient(to right, ${style.hex}22, ${style.hex}08)`, borderColor: `${style.hex}55` }}>
                      <div className="w-28">
                        <span className={`text-xs font-bold uppercase ${style.text}`}>{tier}</span>
                        <p className="text-sm font-semibold text-white">{pkg.name}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <select
                          value={cr.type}
                          onChange={e => updateInlineCommission(pkg, 'courseReferralCommission', { ...cr, type: e.target.value })}
                          className="input text-xs py-1.5 w-32"
                        >
                          <option value="percentage">Percentage (%)</option>
                          <option value="flat">Flat (₹)</option>
                        </select>
                        <input
                          type="number" min="0"
                          value={cr.value}
                          onChange={e => updateInlineCommission(pkg, 'courseReferralCommission', { ...cr, value: Number(e.target.value) })}
                          className="input text-xs py-1.5 w-24"
                          placeholder="Value"
                        />
                        <span className="text-xs text-gray-400">
                          {cr.type === 'flat' ? `₹${cr.value}` : `${cr.value}%`} per course sale
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">On ₹{exampleCoursePrice} course</p>
                        <p className={`text-sm font-bold ${style.text}`}>₹{earn}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="card bg-slate-800/50 border border-white/5">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-400">
                  Course referral commissions apply when a partner refers a student who buys an individual course —
                  not when they buy a full package. Higher tier partners earn more per referral.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── PARTNER RESOURCES TAB ── */}
        {activeTab === 'resources' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Webinar Settings */}
            <div className="card space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-violet-400" />
                <h2 className="text-base font-bold text-white">Upcoming Webinar</h2>
              </div>
              <p className="text-xs text-gray-400 -mt-3">This webinar info is shown to all partners on their Link Generator page.</p>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Webinar Title</label>
                <input
                  type="text"
                  value={resourceForm.webinarTitle}
                  onChange={e => setResourceForm({ ...resourceForm, webinarTitle: e.target.value })}
                  className="input"
                  placeholder="e.g. Digital Marketing Masterclass"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Webinar Date</label>
                <input
                  type="text"
                  value={resourceForm.webinarDate}
                  onChange={e => setResourceForm({ ...resourceForm, webinarDate: e.target.value })}
                  className="input"
                  placeholder="e.g. 15 April 2026, 7:00 PM IST"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Webinar Join Link</label>
                <input
                  type="url"
                  value={resourceForm.webinarLink}
                  onChange={e => setResourceForm({ ...resourceForm, webinarLink: e.target.value })}
                  className="input"
                  placeholder="https://zoom.us/j/..."
                />
              </div>

              <div className="border-t border-white/10 pt-4">
                <label className="block text-xs text-gray-400 mb-1.5">Presentation / Sales Video Link</label>
                <input
                  type="url"
                  value={resourceForm.presentationVideoLink}
                  onChange={e => setResourceForm({ ...resourceForm, presentationVideoLink: e.target.value })}
                  className="input"
                  placeholder="https://youtube.com/watch?v=..."
                />
                <p className="text-xs text-gray-500 mt-1">Partners can share this video with prospects. Leave blank to hide.</p>
              </div>

              <button
                onClick={() => resourceMutation.mutate(resourceForm)}
                disabled={resourceMutation.isPending}
                className="btn-primary w-full disabled:opacity-50"
              >
                {resourceMutation.isPending ? 'Saving...' : 'Save Partner Resources'}
              </button>
            </div>

            {/* Preview */}
            <div className="space-y-4">
              <div className="card bg-gradient-to-br from-violet-500/10 to-purple-600/10 border border-violet-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Video className="w-4 h-4 text-violet-400" />
                  <h3 className="font-bold text-white text-sm">Preview — What Partners See</h3>
                </div>
                {resourceForm.webinarTitle || resourceForm.webinarLink ? (
                  <div className="space-y-2 text-sm">
                    <p className="text-white font-medium">{resourceForm.webinarTitle || 'Untitled Webinar'}</p>
                    {resourceForm.webinarDate && <p className="text-violet-300 text-xs">{resourceForm.webinarDate}</p>}
                    {resourceForm.webinarLink && (
                      <a href={resourceForm.webinarLink} target="_blank" rel="noreferrer"
                        className="inline-block text-xs text-violet-400 underline break-all">
                        {resourceForm.webinarLink}
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-xs">Fill in the webinar details on the left to preview.</p>
                )}
              </div>

              {resourceForm.presentationVideoLink && (
                <div className="card bg-gradient-to-br from-blue-500/10 to-cyan-600/10 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Video className="w-4 h-4 text-blue-400" />
                    <h3 className="font-bold text-white text-sm">Presentation Video</h3>
                  </div>
                  <a href={resourceForm.presentationVideoLink} target="_blank" rel="noreferrer"
                    className="text-xs text-blue-400 underline break-all">
                    {resourceForm.presentationVideoLink}
                  </a>
                </div>
              )}

              <div className="card bg-slate-800/50 border border-white/5">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-gray-400 space-y-1">
                    <p>Partners see this webinar info on their <span className="text-white">Link Generator</span> page.</p>
                    <p>They can share the webinar link and presentation video with their audience.</p>
                    <p>Leave fields blank to hide them from partners.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── EDIT / CREATE MODAL ── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-3xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-slate-900 z-10 pb-4 border-b border-white/10">
              <div>
                <h3 className="text-lg font-bold text-white">{isCreate ? 'Create New Package' : `Edit ${editPkg?.name}`}</h3>
                <p className="text-xs text-gray-400 mt-0.5">Fill in all details for the package</p>
              </div>
              <button onClick={() => { setEditPkg(null); setIsCreate(false) }} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <Section title="Basic Information" icon={Package}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Package Name</label>
                    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" placeholder="e.g. Pro Partner" />
                  </div>
                  <div>
                    <label className="label">Price (₹)</label>
                    <input type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} className="input" />
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <label className="label text-emerald-300">Promo Code Discount % <span className="text-gray-500 font-normal text-xs">(applied when a partner's promo code is used)</span></label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number" min={0} max={100}
                      value={form.promoDiscountPercent}
                      onChange={e => setForm({ ...form, promoDiscountPercent: Number(e.target.value) })}
                      className="input w-28"
                      placeholder="0"
                    />
                    <span className="text-emerald-400 font-bold">%</span>
                    {form.promoDiscountPercent > 0 && form.price > 0 && (
                      <span className="text-sm text-gray-400">
                        = ₹{Math.round(form.price * form.promoDiscountPercent / 100)} off on ₹{form.price.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">0% = no discount, partner earns commission only. 10% = buyer gets 10% off when a promo code is applied.</p>
                </div>
                <div>
                  <label className="label">Description</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="input resize-none" placeholder="Short description of the package" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="label">Tier / Level <span className="text-gray-500 font-normal">(optional)</span></label>
                    <input value={form.tier} onChange={e => setForm({ ...form, tier: e.target.value })}
                      className="input" placeholder="e.g. starter, pro, gold, diamond..." />
                    <p className="text-xs text-gray-600 mt-1">Used for commission styling and tier identification</p>
                  </div>
                  <div>
                    <label className="label">Display Order</label>
                    <input type="number" value={form.displayOrder} onChange={e => setForm({ ...form, displayOrder: Number(e.target.value) })} className="input" />
                  </div>
                  <div>
                    <label className="label">Active</label>
                    <select value={form.isActive ? 'true' : 'false'} onChange={e => setForm({ ...form, isActive: e.target.value === 'true' })} className="input">
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Badge Text (optional)</label>
                    <input value={form.badge} onChange={e => setForm({ ...form, badge: e.target.value })} className="input" placeholder="e.g. Most Popular" />
                  </div>
                  <div>
                    <label className="label">Badge Color</label>
                    <div className="flex gap-2">
                      <input type="color" value={form.badgeColor} onChange={e => setForm({ ...form, badgeColor: e.target.value })} className="w-10 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer" />
                      <input value={form.badgeColor} onChange={e => setForm({ ...form, badgeColor: e.target.value })} className="input flex-1" placeholder="#6366f1" />
                    </div>
                  </div>
                </div>
              </Section>

              {/* Features */}
              <Section title="Features" icon={Check}>
                <div>
                  <label className="label">Features (one per line)</label>
                  <textarea
                    value={featuresInput}
                    onChange={e => setFeaturesInput(e.target.value)}
                    rows={5}
                    className="input resize-none font-mono text-xs"
                    placeholder="Access to all courses&#10;Live classes included&#10;AI Coach access&#10;..."
                  />
                  <p className="text-xs text-gray-500 mt-1">{featuresInput.split('\n').filter(l => l.trim()).length} features</p>
                </div>
              </Section>

              {/* EMI Settings */}
              <Section title="EMI / Installments" icon={DollarSign}>
                <div className="flex items-center gap-3 mb-3">
                  <Toggle checked={form.emiAvailable} onChange={v => setForm({ ...form, emiAvailable: v })} />
                  <span className="text-sm text-gray-300">Enable installment payments for this package</span>
                </div>
                {form.emiAvailable && (
                  <div className="space-y-3">
                    <div>
                      <label className="label">Installment Schedule (Days from Purchase)</label>
                      <p className="text-xs text-gray-500 mb-2">Add day offsets for each installment. e.g. 0 = today, 15 = after 15 days</p>
                      {/* Live preview */}
                      {(form.emiDays as number[]).length > 0 && (
                        <div className="grid gap-1.5 mb-3" style={{ gridTemplateColumns: `repeat(${Math.min((form.emiDays as number[]).length, 4)}, 1fr)` }}>
                          {(form.emiDays as number[]).map((d, i) => (
                            <div key={i} className="rounded-lg bg-violet-500/10 border border-violet-500/20 p-2 text-center text-xs">
                              <p className="text-violet-300 font-bold">Inst. {i + 1}</p>
                              <p className="text-gray-400 mt-0.5">{d === 0 ? 'Today' : `+${d} Days`}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 mb-2">
                        {(form.emiDays as number[]).map((d, i) => (
                          <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/20 border border-violet-500/30 text-violet-300 text-sm font-semibold">
                            {d === 0 ? 'Day 0 (Today)' : `Day ${d}`}
                            <button type="button" onClick={() => setForm({ ...form, emiDays: (form.emiDays as number[]).filter((_, idx) => idx !== i) })} className="text-violet-400 hover:text-red-400">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                        {(form.emiDays as number[]).length === 0 && (
                          <span className="text-xs text-gray-500 italic">No installments configured</span>
                        )}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {[0, 7, 15, 30, 45, 60, 90].filter(d => !(form.emiDays as number[]).includes(d)).map(d => (
                          <button key={d} type="button"
                            onClick={() => setForm({ ...form, emiDays: [...(form.emiDays as number[]), d].sort((a, b) => a - b) })}
                            className="px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 text-xs hover:border-violet-500/50 hover:text-violet-300 transition-all">
                            +Day {d}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="label">Display Amount per Installment (₹)</label>
                      <input type="number" value={form.emiMonthlyAmount} onChange={e => setForm({ ...form, emiMonthlyAmount: Number(e.target.value) })} className="input" placeholder="e.g. 2500" />
                    </div>
                  </div>
                )}
              </Section>

              {/* Access Toggles */}
              <Section title="Access & Features" icon={Shield}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Courses Access</label>
                    <select value={form.coursesAccess} onChange={e => setForm({ ...form, coursesAccess: e.target.value })} className="input">
                      <option value="limited">Limited</option>
                      <option value="full">Full Access</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {[
                    { key: 'liveClassAccess', label: 'Live Classes' },
                    { key: 'aiCoachAccess', label: 'AI Coach' },
                    { key: 'jobEngineAccess', label: 'Job Engine' },
                    { key: 'communityAccess', label: 'Community' },
                    { key: 'personalBrandAccess', label: 'Personal Brand' },
                    { key: 'mentorSupport', label: 'Mentor Support' },
                    { key: 'prioritySupport', label: 'Priority Support' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <Toggle checked={!!form[key]} onChange={v => setForm({ ...form, [key]: v })} />
                      <span className="text-sm text-gray-300">{label}</span>
                    </label>
                  ))}
                </div>
              </Section>

              {/* Community Join Links */}
              <Section title="Community Join Links" icon={Users}>
                <p className="text-xs text-gray-400 mb-3">
                  Telegram aur WhatsApp group join links — yeh links is package ke students ko Community page par dikhenge.
                  Khaali chhodne par button hide ho jayega.
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="label flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-sky-400" /> Telegram URL
                    </label>
                    <input
                      type="url"
                      value={form.communityLinks?.telegramUrl || ''}
                      onChange={e => setForm({ ...form, communityLinks: { ...form.communityLinks, telegramUrl: e.target.value } })}
                      placeholder="https://t.me/your-group-invite"
                      className="input"
                    />
                    <input
                      type="text"
                      value={form.communityLinks?.telegramLabel || ''}
                      onChange={e => setForm({ ...form, communityLinks: { ...form.communityLinks, telegramLabel: e.target.value } })}
                      placeholder="Button label (optional, e.g. Join Pro Telegram)"
                      className="input mt-2"
                    />
                  </div>
                  <div>
                    <label className="label flex items-center gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp URL
                    </label>
                    <input
                      type="url"
                      value={form.communityLinks?.whatsappUrl || ''}
                      onChange={e => setForm({ ...form, communityLinks: { ...form.communityLinks, whatsappUrl: e.target.value } })}
                      placeholder="https://chat.whatsapp.com/your-invite"
                      className="input"
                    />
                    <input
                      type="text"
                      value={form.communityLinks?.whatsappLabel || ''}
                      onChange={e => setForm({ ...form, communityLinks: { ...form.communityLinks, whatsappLabel: e.target.value } })}
                      placeholder="Button label (optional, e.g. Join Pro WhatsApp)"
                      className="input mt-2"
                    />
                  </div>
                  <div>
                    <label className="label">Note (optional)</label>
                    <textarea
                      value={form.communityLinks?.note || ''}
                      onChange={e => setForm({ ...form, communityLinks: { ...form.communityLinks, note: e.target.value } })}
                      placeholder="Short note shown above the join buttons (rules, welcome message, etc.)"
                      rows={2}
                      className="input"
                    />
                  </div>
                </div>
              </Section>

              {/* Partner Commission — L1 per tier + L2/L3 */}
              <Section title="Partner Commission" icon={Percent}>

                {/* L1 — my earnings per sold package */}
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-green-400 uppercase tracking-wider">L1 — Direct Referrer</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    How much does a <strong className="text-white">{editPkg?.name || 'this tier'}</strong> partner earn when they sell each package?
                  </p>
                  {myEarnings.length === 0 ? (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
                      Create packages first — tiers will appear here.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {myEarnings.map((row: any, idx: number) => {
                        const accentColor = tierStyle(row.soldPkgTier, packages).text
                        const earn = row.type === 'percentage'
                          ? Math.round((row.soldPkgPrice || 0) * (row.value || 0) / 100)
                          : (row.value || 0)
                        const updateRow = (patch: any) => {
                          const updated = [...myEarnings]
                          updated[idx] = { ...updated[idx], ...patch }
                          setMyEarnings(updated)
                        }
                        return (
                          <div key={row.soldPkgId} className="grid grid-cols-3 gap-3 items-center border border-white/10 rounded-xl p-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full bg-current ${accentColor}`} />
                                <span className={`text-sm font-bold ${accentColor}`}>{row.soldPkgName}</span>
                              </div>
                              <span className="text-xs text-gray-500 ml-4">₹{(row.soldPkgPrice || 0).toLocaleString()}</span>
                            </div>
                            <select
                              value={row.type || 'flat'}
                              onChange={e => updateRow({ type: e.target.value })}
                              className="input text-xs py-1.5"
                            >
                              <option value="percentage">% Percentage</option>
                              <option value="flat">₹ Flat</option>
                            </select>
                            <div className="flex items-center gap-2">
                              <input
                                type="number" min="0" step={row.type === 'percentage' ? '0.1' : '1'}
                                value={row.value || 0}
                                onChange={e => updateRow({ value: Number(e.target.value) })}
                                className="input text-xs py-1.5"
                              />
                              {(row.value || 0) > 0 && (
                                <span className="text-green-400 text-xs font-semibold whitespace-nowrap">= ₹{earn.toLocaleString()}</span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* L2 & L3 — per sold package grid */}
                <div className="border-t border-white/10 pt-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">L2 & L3 — Per Sold Package</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">When each package is sold, how much does L2 (sponsor of referrer) and L3 (sponsor of L2) earn?</p>
                  {allPkgL2L3.length === 0 ? (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
                      Save packages first — tiers will appear here.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {allPkgL2L3.map((row: any, idx: number) => {
                        const accentColor = tierStyle(row.pkgTier, packages).text
                        const l2Earn = row.l2Type === 'flat' ? (row.l2Value || 0) : Math.round((row.pkgPrice || 0) * (row.l2Value || 0) / 100)
                        const l3Earn = row.l3Type === 'flat' ? (row.l3Value || 0) : Math.round((row.pkgPrice || 0) * (row.l3Value || 0) / 100)
                        const updateRow = (patch: any) => {
                          const updated = [...allPkgL2L3]
                          updated[idx] = { ...updated[idx], ...patch }
                          setAllPkgL2L3(updated)
                        }
                        return (
                          <div key={row.pkgId} className="border border-white/10 rounded-xl p-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full bg-current ${accentColor}`} />
                              <span className={`text-sm font-bold ${accentColor}`}>{row.pkgName}</span>
                              <span className="text-xs text-gray-500">₹{(row.pkgPrice || 0).toLocaleString()}</span>
                            </div>
                            {/* L2 */}
                            <div className="grid grid-cols-3 gap-2 items-center">
                              <span className="text-xs text-blue-400 font-medium">L2</span>
                              <select value={row.l2Type} onChange={e => updateRow({ l2Type: e.target.value })} className="input text-xs py-1.5">
                                <option value="percentage">% Percentage</option>
                                <option value="flat">₹ Flat</option>
                              </select>
                              <div className="flex items-center gap-2">
                                <input type="number" min="0" step={row.l2Type === 'percentage' ? '0.1' : '1'}
                                  value={row.l2Value || 0}
                                  onChange={e => updateRow({ l2Value: Number(e.target.value) })}
                                  className="input text-xs py-1.5" />
                                {(row.l2Value || 0) > 0 && <span className="text-blue-400 text-xs font-semibold whitespace-nowrap">= ₹{l2Earn.toLocaleString()}</span>}
                              </div>
                            </div>
                            {/* L3 */}
                            <div className="grid grid-cols-3 gap-2 items-center">
                              <span className="text-xs text-violet-400 font-medium">L3</span>
                              <select value={row.l3Type} onChange={e => updateRow({ l3Type: e.target.value })} className="input text-xs py-1.5">
                                <option value="percentage">% Percentage</option>
                                <option value="flat">₹ Flat</option>
                              </select>
                              <div className="flex items-center gap-2">
                                <input type="number" min="0" step={row.l3Type === 'percentage' ? '0.1' : '1'}
                                  value={row.l3Value || 0}
                                  onChange={e => updateRow({ l3Value: Number(e.target.value) })}
                                  className="input text-xs py-1.5" />
                                {(row.l3Value || 0) > 0 && <span className="text-violet-400 text-xs font-semibold whitespace-nowrap">= ₹{l3Earn.toLocaleString()}</span>}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </Section>

              {/* Sales Team Commission */}
              <Section title="Sales Team Commission" icon={Users}>
                <p className="text-xs text-gray-400 mb-3">Fixed amount or % for Sales Team member who helps close this package</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Commission Type</label>
                    <select
                      value={form.salesTeamCommission?.type || 'percentage'}
                      onChange={e => setForm({ ...form, salesTeamCommission: { ...form.salesTeamCommission, type: e.target.value } })}
                      className="input"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat Amount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Value ({form.salesTeamCommission?.type === 'flat' ? '₹' : '%'})</label>
                    <input
                      type="number" step="0.1" min="0"
                      value={form.salesTeamCommission?.value || 0}
                      onChange={e => setForm({ ...form, salesTeamCommission: { ...form.salesTeamCommission, value: Number(e.target.value) } })}
                      className="input"
                    />
                  </div>
                </div>
                {form.price > 0 && (form.salesTeamCommission?.value || 0) > 0 && (
                  <p className="text-xs text-amber-400 mt-2">
                    Sales team earns: ₹{form.salesTeamCommission?.type === 'flat'
                      ? form.salesTeamCommission?.value
                      : Math.round(form.price * (form.salesTeamCommission?.value || 0) / 100)} per sale
                  </p>
                )}
              </Section>

              {/* Manager Commission */}
              <Section title="Student Manager Commission" icon={Users}>
                <p className="text-xs text-gray-400 mb-3">Commission for the Student Manager when their assigned student makes a purchase</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Commission Type</label>
                    <select
                      value={form.managerCommission?.type || 'percentage'}
                      onChange={e => setForm({ ...form, managerCommission: { ...form.managerCommission, type: e.target.value } })}
                      className="input"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat Amount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Value ({form.managerCommission?.type === 'flat' ? '₹' : '%'})</label>
                    <input
                      type="number" step="0.1" min="0"
                      value={form.managerCommission?.value || 0}
                      onChange={e => setForm({ ...form, managerCommission: { ...form.managerCommission, value: Number(e.target.value) } })}
                      className="input"
                    />
                  </div>
                </div>
              </Section>

              {/* Course Referral Commission */}
              <Section title="Course Referral Commission" icon={BookOpen}>
                <p className="text-xs text-gray-400 mb-3">Commission for partners when referring individual course purchases (not package)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Commission Type</label>
                    <select
                      value={form.courseReferralCommission?.type || 'percentage'}
                      onChange={e => setForm({ ...form, courseReferralCommission: { ...form.courseReferralCommission, type: e.target.value } })}
                      className="input"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat Amount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Value ({form.courseReferralCommission?.type === 'flat' ? '₹' : '%'})</label>
                    <input
                      type="number" step="0.1" min="0"
                      value={form.courseReferralCommission?.value || 0}
                      onChange={e => setForm({ ...form, courseReferralCommission: { ...form.courseReferralCommission, value: Number(e.target.value) } })}
                      className="input"
                    />
                  </div>
                </div>
              </Section>

              {/* Page Stats */}
              <Section title="Page Stats" icon={TrendingUp}>
                <p className="text-xs text-gray-400 mb-3">Numbers shown in the stats row on the package detail page</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Courses Count</label>
                    <input type="number" min="0" value={form.statCourses ?? 500} onChange={e => setForm({ ...form, statCourses: Number(e.target.value) })} className="input" placeholder="500" />
                    <p className="text-[10px] text-gray-500 mt-1">Shown as "500+ Courses Access"</p>
                  </div>
                  <div>
                    <label className="label">Members Count</label>
                    <input type="number" min="0" value={form.statMembers ?? 10000} onChange={e => setForm({ ...form, statMembers: Number(e.target.value) })} className="input" placeholder="10000" />
                    <p className="text-[10px] text-gray-500 mt-1">Shown as "10,000+ Active Members"</p>
                  </div>
                </div>
              </Section>

              {/* Journey Steps */}
              <Section title="Journey Steps" icon={CheckCircle2}>
                <p className="text-xs text-gray-400 mb-3">4 steps shown in "What happens after you join?" section</p>
                <div className="space-y-3">
                  {(form.journeySteps || []).map((step: any, i: number) => (
                    <div key={i} className="p-3 bg-white/[0.03] rounded-lg border border-white/10 space-y-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-indigo-400">Step {i + 1}</span>
                        <button type="button" onClick={() => setForm({ ...form, journeySteps: (form.journeySteps || []).filter((_: any, j: number) => j !== i) })}
                          className="text-gray-600 hover:text-red-400 text-xs transition-colors">✕ Remove</button>
                      </div>
                      <input type="text" placeholder="Title" value={step.title}
                        onChange={e => { const s = [...(form.journeySteps || [])]; s[i] = { ...s[i], title: e.target.value }; setForm({ ...form, journeySteps: s }) }}
                        className="input text-sm" />
                      <textarea placeholder="Description" value={step.desc} rows={2}
                        onChange={e => { const s = [...(form.journeySteps || [])]; s[i] = { ...s[i], desc: e.target.value }; setForm({ ...form, journeySteps: s }) }}
                        className="input text-sm resize-none" />
                    </div>
                  ))}
                  {(form.journeySteps || []).length < 4 && (
                    <button type="button" onClick={() => setForm({ ...form, journeySteps: [...(form.journeySteps || []), { title: '', desc: '' }] })}
                      className="w-full py-2 text-xs text-indigo-400 border border-dashed border-indigo-500/30 rounded-lg hover:bg-indigo-500/5 transition-colors">
                      + Add Step
                    </button>
                  )}
                </div>
              </Section>

              {/* Testimonials */}
              <Section title="Testimonials" icon={Star}>
                <p className="text-xs text-gray-400 mb-3">Member success stories shown on the package page</p>
                <div className="space-y-3">
                  {(form.testimonials || []).map((t: any, i: number) => (
                    <div key={i} className="p-3 bg-white/[0.03] rounded-lg border border-white/10 space-y-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-indigo-400">Testimonial {i + 1}</span>
                        <button type="button" onClick={() => setForm({ ...form, testimonials: (form.testimonials || []).filter((_: any, j: number) => j !== i) })}
                          className="text-gray-600 hover:text-red-400 text-xs transition-colors">✕ Remove</button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="Name (e.g. Rahul M.)" value={t.name}
                          onChange={e => { const s = [...(form.testimonials || [])]; s[i] = { ...s[i], name: e.target.value }; setForm({ ...form, testimonials: s }) }}
                          className="input text-sm" />
                        <input type="text" placeholder="Role (e.g. Pro Member)" value={t.role}
                          onChange={e => { const s = [...(form.testimonials || [])]; s[i] = { ...s[i], role: e.target.value }; setForm({ ...form, testimonials: s }) }}
                          className="input text-sm" />
                        <input type="text" placeholder="Avatar initial (e.g. R)" value={t.avatar}
                          onChange={e => { const s = [...(form.testimonials || [])]; s[i] = { ...s[i], avatar: e.target.value }; setForm({ ...form, testimonials: s }) }}
                          className="input text-sm" />
                        <input type="text" placeholder="Earning (e.g. ₹18K/mo)" value={t.earning}
                          onChange={e => { const s = [...(form.testimonials || [])]; s[i] = { ...s[i], earning: e.target.value }; setForm({ ...form, testimonials: s }) }}
                          className="input text-sm" />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-400">Rating:</label>
                        {[1,2,3,4,5].map(n => (
                          <button key={n} type="button" onClick={() => { const s = [...(form.testimonials || [])]; s[i] = { ...s[i], rating: n }; setForm({ ...form, testimonials: s }) }}
                            className={`text-lg transition-colors ${n <= (t.rating || 5) ? 'text-yellow-400' : 'text-gray-600'}`}>★</button>
                        ))}
                      </div>
                      <textarea placeholder="Testimonial text..." value={t.text} rows={3}
                        onChange={e => { const s = [...(form.testimonials || [])]; s[i] = { ...s[i], text: e.target.value }; setForm({ ...form, testimonials: s }) }}
                        className="input text-sm resize-none" />
                    </div>
                  ))}
                  <button type="button" onClick={() => setForm({ ...form, testimonials: [...(form.testimonials || []), { name: '', role: '', avatar: '', text: '', rating: 5, earning: '' }] })}
                    className="w-full py-2 text-xs text-indigo-400 border border-dashed border-indigo-500/30 rounded-lg hover:bg-indigo-500/5 transition-colors">
                    + Add Testimonial
                  </button>
                </div>
              </Section>

              {/* FAQs */}
              <Section title="FAQs" icon={Info}>
                <p className="text-xs text-gray-400 mb-3">Questions & answers shown on the package page</p>
                <div className="space-y-3">
                  {(form.faqs || []).map((f: any, i: number) => (
                    <div key={i} className="p-3 bg-white/[0.03] rounded-lg border border-white/10 space-y-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-indigo-400">FAQ {i + 1}</span>
                        <button type="button" onClick={() => setForm({ ...form, faqs: (form.faqs || []).filter((_: any, j: number) => j !== i) })}
                          className="text-gray-600 hover:text-red-400 text-xs transition-colors">✕ Remove</button>
                      </div>
                      <input type="text" placeholder="Question" value={f.q}
                        onChange={e => { const s = [...(form.faqs || [])]; s[i] = { ...s[i], q: e.target.value }; setForm({ ...form, faqs: s }) }}
                        className="input text-sm" />
                      <textarea placeholder="Answer" value={f.a} rows={3}
                        onChange={e => { const s = [...(form.faqs || [])]; s[i] = { ...s[i], a: e.target.value }; setForm({ ...form, faqs: s }) }}
                        className="input text-sm resize-none" />
                    </div>
                  ))}
                  <button type="button" onClick={() => setForm({ ...form, faqs: [...(form.faqs || []), { q: '', a: '' }] })}
                    className="w-full py-2 text-xs text-indigo-400 border border-dashed border-indigo-500/30 rounded-lg hover:bg-indigo-500/5 transition-colors">
                    + Add FAQ
                  </button>
                </div>
              </Section>

              {/* Courses Selection */}
              <Section title="Included Courses" icon={BookOpen}>
                <p className="text-xs text-gray-400 mb-3">Select which courses are included in this package</p>
                <div className="max-h-48 overflow-y-auto space-y-1.5 border border-white/10 rounded-lg p-2">
                  {allCourses.length === 0 && <p className="text-xs text-gray-500 text-center py-4">No courses available</p>}
                  {allCourses.map((course: any) => {
                    const selected = (form.courses || []).includes(course._id)
                    return (
                      <label key={course._id} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${selected ? 'bg-indigo-500/20 border border-indigo-500/30' : 'hover:bg-white/5'}`}>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={e => {
                            const ids = form.courses || []
                            setForm({
                              ...form,
                              courses: e.target.checked ? [...ids, course._id] : ids.filter((id: string) => id !== course._id)
                            })
                          }}
                          className="w-3.5 h-3.5 rounded accent-indigo-500"
                        />
                        <span className="text-sm text-gray-300 flex-1 truncate">{course.title}</span>
                        {course.price && <span className="text-xs text-gray-500">₹{course.price}</span>}
                      </label>
                    )
                  })}
                </div>
                {(form.courses || []).length > 0 && (
                  <p className="text-xs text-indigo-400 mt-1">{form.courses.length} course(s) selected</p>
                )}
              </Section>
            </div>

            <div className="flex gap-3 mt-6 sticky bottom-0 bg-slate-900 pt-4 border-t border-white/10">
              <button onClick={savePackage} disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
                {saving ? 'Saving...' : isCreate ? 'Create Package' : 'Save Changes'}
              </button>
              <button onClick={() => { setEditPkg(null); setIsCreate(false) }} className="btn bg-slate-700 hover:bg-slate-600 text-white px-6">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

// Helper components
function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-white/[0.03] border-b border-white/10">
        <Icon className="w-4 h-4 text-indigo-400" />
        <h4 className="text-sm font-semibold text-white">{title}</h4>
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-indigo-500' : 'bg-slate-600'}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}
