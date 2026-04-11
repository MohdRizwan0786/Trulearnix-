'use client'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminAPI } from '@/lib/api'
import AdminLayout from '@/components/AdminLayout'
import toast from 'react-hot-toast'
import {
  Edit2, X, Plus, Check, Package, DollarSign, Settings, BookOpen,
  ChevronDown, ChevronUp, Percent, Hash, Users, Shield, Zap, Star,
  TrendingUp, IndianRupee, Info
} from 'lucide-react'

const TIER_COLORS: Record<string, string> = {
  starter: 'from-sky-500/20 to-sky-600/10 border-sky-500/30',
  pro: 'from-violet-500/20 to-violet-600/10 border-violet-500/30',
  elite: 'from-amber-500/20 to-amber-600/10 border-amber-500/30',
  supreme: 'from-rose-500/20 to-rose-600/10 border-rose-500/30',
}
const TIER_ACCENT: Record<string, string> = {
  starter: 'text-sky-400',
  pro: 'text-violet-400',
  elite: 'text-amber-400',
  supreme: 'text-rose-400',
}
const TIER_BORDER: Record<string, string> = {
  starter: 'border-sky-500/50',
  pro: 'border-violet-500/50',
  elite: 'border-amber-500/50',
  supreme: 'border-rose-500/50',
}
const TIER_ICON: Record<string, any> = {
  starter: Zap,
  pro: Star,
  elite: TrendingUp,
  supreme: Shield,
}

const TABS = [
  { id: 'packages', label: 'Packages', icon: Package },
  { id: 'commissions', label: 'Commission Rules', icon: Percent },
  { id: 'tax', label: 'Tax Settings', icon: IndianRupee },
  { id: 'referral', label: 'Course Referral', icon: BookOpen },
]

const EARNER_TIERS = ['starter', 'pro', 'elite', 'supreme'] as const

const makePartnerEarnings = (pkgList: any[]) =>
  pkgList.map(p => ({
    earnerTier: p._id,      // use _id as identifier
    earnerName: p.name,     // display name
    type: 'percentage', value: 0,
    l2Type: 'percentage', l2Value: 0,
    l3Type: 'percentage', l3Value: 0,
  }))

const defaultPartnerEarnings = () => EARNER_TIERS.map(t => ({
  earnerTier: t, type: 'percentage', value: 0,
  l2Type: 'percentage', l2Value: 0,
  l3Type: 'percentage', l3Value: 0,
}))

const DEFAULT_FORM = {
  name: '', price: 0, description: '', tier: '',
  displayOrder: 0, badge: '', badgeColor: '#6366f1',
  features: [] as string[],
  emiAvailable: false, emiMonths: 3, emiMonthlyAmount: 0,
  coursesAccess: 'limited', liveClassAccess: false, aiCoachAccess: false,
  jobEngineAccess: false, communityAccess: true, personalBrandAccess: false,
  mentorSupport: false, prioritySupport: false,
  commissionRate: 0, commissionRateType: 'percentage',
  commissionLevel2: 0, commissionLevel2Type: 'percentage',
  commissionLevel3: 0, commissionLevel3Type: 'percentage',
  partnerEarnings: defaultPartnerEarnings(),
  salesTeamCommission: { type: 'percentage', value: 0 },
  managerCommission: { type: 'percentage', value: 0 },
  courseReferralCommission: { type: 'percentage', value: 0 },
  courses: [] as string[],
  isActive: true,
}

export default function PackagesPage() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState('packages')
  const [editPkg, setEditPkg] = useState<any>(null)
  const [isCreate, setIsCreate] = useState(false)
  const [form, setForm] = useState<any>(DEFAULT_FORM)
  const [featuresInput, setFeaturesInput] = useState('')
  const [taxForm, setTaxForm] = useState({ tdsRate: 2, gstRate: 18, minWithdrawalAmount: 500 })

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
        minWithdrawalAmount: taxData.settings.minWithdrawalAmount ?? 500,
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

  const taxMutation = useMutation({
    mutationFn: (data: any) => adminAPI.updatePlatformSettings(data),
    onSuccess: () => {
      toast.success('Tax settings saved')
      qc.invalidateQueries({ queryKey: ['platform-settings'] })
    },
    onError: () => toast.error('Failed to save tax settings'),
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
      emiMonths: pkg.emiMonths || 3,
      emiMonthlyAmount: pkg.emiMonthlyAmount || 0,
      coursesAccess: pkg.coursesAccess || 'limited',
      liveClassAccess: pkg.liveClassAccess || false,
      aiCoachAccess: pkg.aiCoachAccess || false,
      jobEngineAccess: pkg.jobEngineAccess || false,
      communityAccess: pkg.communityAccess !== false,
      personalBrandAccess: pkg.personalBrandAccess || false,
      mentorSupport: pkg.mentorSupport || false,
      prioritySupport: pkg.prioritySupport || false,
      commissionRate: pkg.commissionRate || 0,
      commissionRateType: pkg.commissionRateType || 'percentage',
      commissionLevel2: pkg.commissionLevel2 || 0,
      commissionLevel2Type: pkg.commissionLevel2Type || 'percentage',
      commissionLevel3: pkg.commissionLevel3 || 0,
      commissionLevel3Type: pkg.commissionLevel3Type || 'percentage',
      partnerEarnings: packages
        .filter((p: any) => p._id !== pkg._id)  // exclude self
        .map((p: any) => {
          const existing = (pkg.partnerEarnings || []).find((r: any) => r.earnerTier === p._id || r.earnerTier === p.name)
          return existing
            ? { ...existing, earnerTier: p._id, earnerName: p.name }
            : { earnerTier: p._id, earnerName: p.name, type: 'percentage', value: 0, l2Type: 'percentage', l2Value: 0, l3Type: 'percentage', l3Value: 0 }
        }),
      salesTeamCommission: pkg.salesTeamCommission || { type: 'percentage', value: 0 },
      managerCommission: pkg.managerCommission || { type: 'percentage', value: 0 },
      courseReferralCommission: pkg.courseReferralCommission || { type: 'percentage', value: 0 },
      courses: (pkg.courses || []).map((c: any) => (typeof c === 'object' ? c._id || c : c).toString()),
      isActive: pkg.isActive !== false,
    })
    setFeaturesInput((pkg.features || []).join('\n'))
  }

  const openCreate = () => {
    setEditPkg(null)
    setIsCreate(true)
    setForm({ ...DEFAULT_FORM, partnerEarnings: makePartnerEarnings(packages) })
    setFeaturesInput('')
  }

  const savePackage = () => {
    const features = featuresInput.split('\n').map((f: string) => f.trim()).filter(Boolean)
    const payload = { ...form, features }
    if (isCreate) {
      createPkgMutation.mutate(payload)
    } else if (editPkg) {
      updatePkgMutation.mutate({ id: editPkg._id, data: payload })
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">Packages & Commission</h1>
            <p className="text-gray-400 text-sm mt-1">Manage plans, commissions, and tax settings</p>
          </div>
          {activeTab === 'packages' && (
            <button onClick={openCreate} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Package
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl w-fit">
          {TABS.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
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
            {packages.map((pkg: any) => {
              const tier = (pkg.tier || '').toLowerCase()
              const TierIcon = TIER_ICON[tier] || Package
              const l1Earn = Math.round((pkg.price || 0) * (pkg.commissionRate || 0) / 100)
              return (
                <div key={pkg._id} className={`card bg-gradient-to-br ${TIER_COLORS[tier] || 'from-gray-500/20 to-gray-600/10 border-gray-500/30'} border relative group`}>
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
                        <TierIcon className={`w-4 h-4 ${TIER_ACCENT[tier] || 'text-gray-400'}`} />
                      </div>
                      <div>
                        <span className={`text-xs font-bold uppercase tracking-wider ${TIER_ACCENT[tier] || 'text-gray-400'}`}>{tier}</span>
                        <p className="text-base font-black text-white leading-tight">{pkg.name}</p>
                      </div>
                    </div>
                    <button onClick={() => openEdit(pkg)}
                      className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white opacity-0 group-hover:opacity-100">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className={`text-2xl font-black ${TIER_ACCENT[tier] || 'text-gray-400'} mb-3`}>
                    ₹{(pkg.price || 0).toLocaleString()}
                  </p>

                  <div className="space-y-1.5 mb-3 p-2 bg-black/20 rounded-lg">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Partner L1</span>
                      <span className="text-green-400 font-semibold">{pkg.commissionRate || 0}% (₹{l1Earn})</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Partner L2</span>
                      <span className="text-blue-400 font-semibold">{pkg.commissionLevel2 || 0}%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Partner L3</span>
                      <span className="text-violet-400 font-semibold">{pkg.commissionLevel3 || 0}%</span>
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

                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="text-gray-500">{(pkg.courses || []).length} courses included</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${pkg.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {pkg.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <ul className="space-y-1">
                    {(pkg.features || []).slice(0, 3).map((f: string, i: number) => (
                      <li key={i} className="flex items-center gap-1.5 text-xs text-gray-300">
                        <Check className={`w-3 h-3 flex-shrink-0 ${TIER_ACCENT[tier] || 'text-gray-400'}`} />
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

            {/* Partner Earnings Matrix */}
            <div className="card overflow-x-auto">
              <h2 className="text-base font-bold text-white mb-1">Partner Earnings Matrix</h2>
              <p className="text-gray-400 text-sm mb-4">
                Kisi bhi tier ka partner koi bhi package sell kare — usse kitna milega (L1 direct)
              </p>
              {packages.length > 0 && (
                <table className="w-full text-sm min-w-max">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left pb-3 pr-6 text-gray-400 font-medium">Earner's Tier ↓ / Sells →</th>
                      {packages.map((pkg: any) => (
                        <th key={pkg._id} className={`text-center pb-3 px-4 font-bold ${TIER_ACCENT[pkg.tier] || 'text-gray-400'}`}>
                          {pkg.name}<br/><span className="text-gray-500 font-normal text-xs">₹{(pkg.price||0).toLocaleString()}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {packages.map((earnerPkg: any) => (
                      <tr key={earnerPkg._id} className="hover:bg-white/[0.02]">
                        <td className="py-3 pr-6">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-400" />
                            <span className="font-bold text-white text-sm">{earnerPkg.name}</span>
                            <span className="text-gray-500 text-xs">package wala</span>
                          </div>
                        </td>
                        {packages.map((soldPkg: any) => {
                          if (soldPkg._id === earnerPkg._id) return (
                            <td key={soldPkg._id} className="py-3 px-4 text-center text-gray-700 text-xs">—</td>
                          )
                          const row = (soldPkg.partnerEarnings || []).find(
                            (r: any) => r.earnerTier === earnerPkg._id || r.earnerName === earnerPkg.name
                          )
                          if (!row || !row.value) return (
                            <td key={soldPkg._id} className="py-3 px-4 text-center text-gray-600 text-xs">₹0</td>
                          )
                          const earn = row.type === 'flat' ? row.value : Math.round((soldPkg.price||0) * row.value / 100)
                          const l2Earn = row.l2Type === 'flat' ? row.l2Value : Math.round((soldPkg.price||0) * (row.l2Value||0) / 100)
                          return (
                            <td key={soldPkg._id} className="py-3 px-4 text-center">
                              <div className="font-bold text-sm text-green-400">₹{earn.toLocaleString()}</div>
                              {l2Earn > 0 && <div className="text-xs text-blue-400/70">+₹{l2Earn} L2</div>}
                              <div className="text-gray-600 text-xs">{row.type === 'flat' ? `₹${row.value} flat` : `${row.value}%`}</div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {packages.length === 0 && <p className="text-gray-500 text-sm">No packages configured yet</p>}
            </div>

            <div className="card overflow-x-auto">
              <h2 className="text-base font-bold text-white mb-1">Commission Breakdown Per Package</h2>
              <p className="text-gray-400 text-sm mb-4">Per-package commission rules for partners, sales team, and student managers</p>
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left pb-3 pr-4 text-gray-400 font-medium w-40">Package</th>
                    <th className="text-left pb-3 px-3 text-gray-400 font-medium">Price</th>
                    <th className="text-left pb-3 px-3 text-green-400 font-medium">Partner L1%</th>
                    <th className="text-left pb-3 px-3 text-blue-400 font-medium">Partner L2%</th>
                    <th className="text-left pb-3 px-3 text-violet-400 font-medium">Partner L3%</th>
                    <th className="text-left pb-3 px-3 text-amber-400 font-medium">Sales Team</th>
                    <th className="text-left pb-3 px-3 text-pink-400 font-medium">Mgr Commission</th>
                    <th className="text-left pb-3 px-3 text-gray-400 font-medium">Max L1 Earn</th>
                    <th className="pb-3 px-3 text-gray-400 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {packages.map((pkg: any) => {
                    const tier = (pkg.tier || '').toLowerCase()
                    const maxEarn = pkg.commissionRateType === 'flat'
                      ? (pkg.commissionRate || 0)
                      : Math.round((pkg.price || 0) * (pkg.commissionRate || 0) / 100)
                    const salesVal = pkg.salesTeamCommission?.type === 'flat'
                      ? `₹${pkg.salesTeamCommission?.value || 0}`
                      : `${pkg.salesTeamCommission?.value || 0}%`
                    const mgrVal = pkg.managerCommission?.type === 'flat'
                      ? `₹${pkg.managerCommission?.value || 0}`
                      : `${pkg.managerCommission?.value || 0}%`
                    return (
                      <tr key={pkg._id} className="hover:bg-white/[0.02]">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full bg-current ${TIER_ACCENT[tier] || 'text-gray-400'}`} />
                            <span className={`font-semibold ${TIER_ACCENT[tier] || 'text-gray-300'}`}>{pkg.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-white font-medium">₹{(pkg.price || 0).toLocaleString()}</td>
                        <td className="py-3 px-3 text-green-400 font-semibold">
                          {pkg.commissionRateType === 'flat' ? `₹${pkg.commissionRate || 0}` : `${pkg.commissionRate || 0}%`}
                        </td>
                        <td className="py-3 px-3 text-blue-400 font-semibold">
                          {pkg.commissionLevel2Type === 'flat' ? `₹${pkg.commissionLevel2 || 0}` : `${pkg.commissionLevel2 || 0}%`}
                        </td>
                        <td className="py-3 px-3 text-violet-400 font-semibold">
                          {pkg.commissionLevel3Type === 'flat' ? `₹${pkg.commissionLevel3 || 0}` : `${pkg.commissionLevel3 || 0}%`}
                        </td>
                        <td className="py-3 px-3 text-amber-400 font-semibold">{salesVal}</td>
                        <td className="py-3 px-3 text-pink-400 font-semibold">{mgrVal}</td>
                        <td className="py-3 px-3 text-white font-semibold">₹{maxEarn.toLocaleString()}</td>
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
                const price = pkg.price || 0
                const l1 = pkg.commissionRateType === 'flat' ? (pkg.commissionRate || 0) : Math.round(price * (pkg.commissionRate || 0) / 100)
                const l2 = pkg.commissionLevel2Type === 'flat' ? (pkg.commissionLevel2 || 0) : Math.round(price * (pkg.commissionLevel2 || 0) / 100)
                const l3 = pkg.commissionLevel3Type === 'flat' ? (pkg.commissionLevel3 || 0) : Math.round(price * (pkg.commissionLevel3 || 0) / 100)
                const salesEarn = pkg.salesTeamCommission?.type === 'flat'
                  ? pkg.salesTeamCommission?.value || 0
                  : Math.round(price * (pkg.salesTeamCommission?.value || 0) / 100)
                return (
                  <div key={pkg._id} className={`card bg-gradient-to-br ${TIER_COLORS[tier] || ''} border ${TIER_BORDER[tier] || ''}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className={`w-4 h-4 ${TIER_ACCENT[tier] || 'text-gray-400'}`} />
                      <h3 className="font-bold text-white text-sm">Earning Example — {pkg.name} (₹{price.toLocaleString()})</h3>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between"><span className="text-gray-400">Partner L1 earns</span><span className="text-green-400 font-semibold">₹{l1.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Partner L2 earns</span><span className="text-blue-400 font-semibold">₹{l2.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Partner L3 earns</span><span className="text-violet-400 font-semibold">₹{l3.toLocaleString()}</span></div>
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
                  const cr = pkg.courseReferralCommission || { type: 'percentage', value: 0 }
                  const exampleCoursePrice = 2999
                  const earn = cr.type === 'flat' ? cr.value : Math.round(exampleCoursePrice * cr.value / 100)
                  return (
                    <div key={pkg._id} className={`flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r ${TIER_COLORS[tier] || ''} border ${TIER_BORDER[tier] || 'border-white/10'}`}>
                      <div className="w-28">
                        <span className={`text-xs font-bold uppercase ${TIER_ACCENT[tier] || 'text-gray-400'}`}>{tier}</span>
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
                        <p className={`text-sm font-bold ${TIER_ACCENT[tier] || 'text-gray-400'}`}>₹{earn}</p>
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
                <div>
                  <label className="label">Description</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="input resize-none" placeholder="Short description of the package" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="label">Tier / Level <span className="text-gray-500 font-normal">(optional)</span></label>
                    <input value={form.tier} onChange={e => setForm({ ...form, tier: e.target.value })}
                      className="input" placeholder="e.g. starter, pro, gold, diamond..." />
                    <p className="text-xs text-gray-600 mt-1">Commission styling ke liye use hota hai</p>
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
              <Section title="EMI Settings" icon={DollarSign}>
                <div className="flex items-center gap-3 mb-3">
                  <Toggle checked={form.emiAvailable} onChange={v => setForm({ ...form, emiAvailable: v })} />
                  <span className="text-sm text-gray-300">Enable EMI for this package</span>
                </div>
                {form.emiAvailable && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">EMI Months</label>
                      <input type="number" value={form.emiMonths} onChange={e => setForm({ ...form, emiMonths: Number(e.target.value) })} className="input" />
                    </div>
                    <div>
                      <label className="label">Monthly Amount (₹)</label>
                      <input type="number" value={form.emiMonthlyAmount} onChange={e => setForm({ ...form, emiMonthlyAmount: Number(e.target.value) })} className="input" />
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

              {/* Partner Commission Matrix */}
              <Section title="Partner Commission Matrix" icon={Percent}>
                <p className="text-xs text-gray-400 mb-4">
                  Jis partner ne jo package khareeda hai, agar vo IS package ko sell kare to usse kitna milega
                </p>
                {(!form.partnerEarnings || form.partnerEarnings.length === 0) && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
                    Pehle kuch aur packages bana lo — phir yahan unke hisaab se commission set karo.
                  </div>
                )}
                <div className="space-y-3">
                  {(form.partnerEarnings || []).map((row: any, idx: number) => {
                    const displayName = row.earnerName || row.earnerTier
                    const tierColor = TIER_ACCENT[(row.earnerTier || '').toLowerCase()] || 'text-indigo-400'
                    const updateRow = (patch: any) => {
                      const updated = [...form.partnerEarnings]
                      updated[idx] = { ...updated[idx], ...patch }
                      setForm({ ...form, partnerEarnings: updated })
                    }
                    const l1Earn = row.type === 'flat' ? row.value : Math.round((form.price || 0) * row.value / 100)
                    const l2Earn = row.l2Type === 'flat' ? row.l2Value : Math.round((form.price || 0) * (row.l2Value || 0) / 100)
                    const l3Earn = row.l3Type === 'flat' ? row.l3Value : Math.round((form.price || 0) * (row.l3Value || 0) / 100)
                    return (
                      <div key={row.earnerTier} className="border border-white/10 rounded-xl p-4">
                        {/* Row header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-400" />
                            <span className="text-sm font-bold text-white">{displayName}</span>
                            <span className="text-gray-500 text-xs">package wala partner sell kare →</span>
                          </div>
                          {form.price > 0 && (
                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-green-400">L1: ₹{l1Earn}</span>
                              <span className="text-blue-400">L2: ₹{l2Earn}</span>
                              <span className="text-violet-400">L3: ₹{l3Earn}</span>
                            </div>
                          )}
                        </div>
                        {/* L1 / L2 / L3 inputs */}
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { label: 'L1 (Direct)', typeKey: 'type', valKey: 'value', color: 'text-green-400' },
                            { label: 'L2 Commission', typeKey: 'l2Type', valKey: 'l2Value', color: 'text-blue-400' },
                            { label: 'L3 Commission', typeKey: 'l3Type', valKey: 'l3Value', color: 'text-violet-400' },
                          ].map(({ label, typeKey, valKey, color }) => (
                            <div key={typeKey} className="space-y-1.5">
                              <label className={`text-xs font-semibold ${color}`}>{label}</label>
                              <select
                                value={row[typeKey]}
                                onChange={e => updateRow({ [typeKey]: e.target.value })}
                                className="input text-xs py-1.5"
                              >
                                <option value="percentage">% Percent</option>
                                <option value="flat">₹ Fixed</option>
                              </select>
                              <input
                                type="number" min="0" step="0.1"
                                value={row[valKey]}
                                onChange={e => updateRow({ [valKey]: Number(e.target.value) })}
                                className="input text-xs py-1.5"
                                placeholder={row[typeKey] === 'flat' ? '₹ amount' : '% value'}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-xs text-blue-300">
                    <strong>Example:</strong> Agar Pro tier partner ne Starter ko refer kiya aur us ke referral se kisi ne Elite package buy kiya,
                    to Pro row ke L1 value milegi. L2 unhe milegi jinka referral Pro ne kiya tha.
                  </p>
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
