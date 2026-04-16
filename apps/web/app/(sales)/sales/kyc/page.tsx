'use client'
import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salesAPI } from '@/lib/api'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import {
  ShieldCheck, ShieldAlert, Clock, CheckCircle, XCircle,
  CreditCard, Fingerprint, Building2, Save, Camera, Upload,
  Loader2, User, Check, AlertTriangle, Sparkles, Lock
} from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_CFG = {
  pending:   { icon: Clock,       label: 'Not Submitted',  color: 'text-gray-400',  bg: 'bg-gray-500/10',  border: 'border-gray-500/20',  desc: 'Submit your KYC documents to enable withdrawals' },
  submitted: { icon: Clock,       label: 'Under Review',   color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/25', desc: 'Your documents are being verified (1-3 business days)' },
  verified:  { icon: ShieldCheck, label: 'KYC Verified ✓', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/25', desc: 'Identity verified — you can now withdraw your earnings' },
  rejected:  { icon: XCircle,     label: 'KYC Rejected',   color: 'text-red-400',   bg: 'bg-red-500/10',   border: 'border-red-500/25',   desc: 'Documents rejected. Please re-upload and resubmit.' },
} as const

function PhotoUpload({ label, value, onChange, accept = 'image/*', disabled }: { label: string; value?: string; onChange: (url: string) => void; accept?: string; disabled?: boolean }) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const handleFile = async (file: File) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) return toast.error('File too large. Max 5MB.')
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      onChange(res.data.url)
      toast.success('Photo uploaded!')
    } catch { toast.error('Upload failed. Try again.') }
    finally { setUploading(false) }
  }
  return (
    <div>
      <label className="text-dark-300 text-xs font-medium mb-1.5 block">{label}</label>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-dark-600 group">
          <img src={value} alt={label} className="w-full h-32 object-cover" />
          {!disabled && (
            <button onClick={() => inputRef.current?.click()} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 text-white text-xs font-semibold transition-opacity">
              <Camera className="w-4 h-4" /> Change Photo
            </button>
          )}
        </div>
      ) : (
        <button onClick={() => !disabled && inputRef.current?.click()} disabled={disabled || uploading}
          className={`w-full h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all ${disabled ? 'border-dark-700 cursor-not-allowed' : 'border-dark-600 hover:border-blue-500/60 hover:bg-blue-500/5 cursor-pointer active:scale-[0.98]'}`}>
          {uploading
            ? <><Loader2 className="w-5 h-5 text-blue-400 animate-spin" /><span className="text-dark-400 text-xs">Uploading...</span></>
            : <><Upload className="w-5 h-5 text-dark-500" /><span className="text-dark-400 text-xs font-medium">Click to upload</span><span className="text-dark-600 text-[10px]">JPG, PNG · Max 5MB</span></>
          }
        </button>
      )}
    </div>
  )
}

function ProfilePhotoUpload({ value, onChange, disabled }: { value?: string; onChange: (url: string) => void; disabled?: boolean }) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const handleFile = async (file: File) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) return toast.error('File too large. Max 5MB.')
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      onChange(res.data.url)
      toast.success('Profile photo updated!')
    } catch { toast.error('Upload failed') }
    finally { setUploading(false) }
  }
  return (
    <div className="flex flex-col items-center gap-2">
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      <div className="relative">
        <div className={`w-20 h-20 rounded-2xl overflow-hidden border-2 border-dark-600 ${uploading ? 'opacity-60' : ''}`}>
          {value ? <img src={value} alt="Profile" className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center"><User className="w-8 h-8 text-white/70" /></div>}
        </div>
        {!disabled && (
          <button onClick={() => inputRef.current?.click()} disabled={uploading}
            className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 border-2 border-dark-900 flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all">
            {uploading ? <Loader2 className="w-3 h-3 text-white animate-spin" /> : <Camera className="w-3 h-3 text-white" />}
          </button>
        )}
      </div>
      {!disabled && <p className="text-dark-500 text-[10px]">Tap to change photo</p>}
    </div>
  )
}

function Field({ label, value, onChange, placeholder, disabled, upper, numeric, maxLen, mono }:
  { label: string; value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean; upper?: boolean; numeric?: boolean; maxLen?: number; mono?: boolean }) {
  return (
    <div>
      <label className="text-dark-300 text-xs font-medium mb-1.5 block">{label}</label>
      <input value={value}
        onChange={e => {
          let v = e.target.value
          if (numeric) v = v.replace(/\D/g, '')
          if (upper) v = v.toUpperCase()
          if (maxLen) v = v.slice(0, maxLen)
          onChange(v)
        }}
        placeholder={placeholder} disabled={disabled}
        className={`w-full bg-dark-700 border border-dark-600 rounded-xl px-4 py-2.5 text-white placeholder-dark-600 focus:outline-none focus:border-blue-500 text-sm disabled:opacity-50 transition-colors ${upper || mono ? 'tracking-widest font-mono' : ''}`} />
    </div>
  )
}

export default function SalesKYCPage() {
  const { user, updateUser } = useAuthStore()
  const qc = useQueryClient()
  const [form, setForm] = useState({
    avatar: '', pan: '', panName: '', panPhoto: '',
    aadhar: '', aadharName: '', aadharPhoto: '',
    bankAccount: '', bankIfsc: '', bankName: '', bankHolderName: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['sales-kyc'],
    queryFn: () => salesAPI.kyc().then(r => r.data),
  })

  const kyc = data?.kyc
  const status = (kyc?.status || 'pending') as keyof typeof STATUS_CFG
  const statusInfo = STATUS_CFG[status]
  const StatusIcon = statusInfo.icon
  const canEdit = status === 'pending' || status === 'rejected'

  useEffect(() => {
    if (data) {
      setForm({
        avatar: data.user?.avatar || (user as any)?.avatar || '',
        pan: kyc?.pan || '', panName: kyc?.panName || '', panPhoto: kyc?.panPhoto || '',
        aadhar: kyc?.aadhar || '', aadharName: kyc?.aadharName || '', aadharPhoto: kyc?.aadharPhoto || '',
        bankAccount: kyc?.bankAccount || '', bankIfsc: kyc?.bankIfsc || '',
        bankName: kyc?.bankName || '', bankHolderName: kyc?.bankHolderName || '',
      })
    }
  }, [data])

  const f = (key: string) => (val: string) => setForm(prev => ({ ...prev, [key]: val }))

  const submit = useMutation({
    mutationFn: () => salesAPI.submitKyc(form),
    onSuccess: () => {
      toast.success('KYC submitted successfully!')
      if (form.avatar) updateUser({ avatar: form.avatar } as any)
      qc.invalidateQueries({ queryKey: ['sales-kyc'] })
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Submission failed'),
  })

  const canSubmit = form.pan && form.panName && form.aadhar && form.bankAccount && form.bankIfsc && form.bankName && form.bankHolderName

  if (isLoading) return (
    <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-dark-800 rounded-2xl animate-pulse" />)}</div>
  )

  return (
    <div className="space-y-5 pb-8">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0a1535] via-[#0f2060] to-[#0a1535] border border-blue-500/20 p-5 sm:p-6">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-4 right-8 w-24 h-24 rounded-full bg-blue-500/15 blur-2xl" />
          <div className="absolute bottom-0 left-4 w-20 h-16 rounded-full bg-indigo-500/10 blur-xl" />
        </div>
        <div className="relative flex items-center gap-4">
          <ProfilePhotoUpload value={form.avatar} onChange={f('avatar')} disabled={!canEdit} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-blue-200 text-[11px] font-semibold bg-blue-400/15 border border-blue-400/20 px-2.5 py-1 rounded-full">KYC Verification</span>
            </div>
            <h1 className="text-white text-xl sm:text-2xl font-black">Identity Verification</h1>
            <p className="text-blue-300/60 text-xs sm:text-sm mt-1">Complete KYC to unlock withdrawals</p>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`flex items-start gap-3 rounded-2xl border p-4 ${statusInfo.bg} ${statusInfo.border}`}>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${statusInfo.bg} border ${statusInfo.border}`}>
          <StatusIcon className={`w-4.5 h-4.5 ${statusInfo.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-sm ${statusInfo.color}`}>{statusInfo.label}</p>
          <p className="text-dark-400 text-xs mt-0.5">{statusInfo.desc}</p>
          {kyc?.rejectionReason && (
            <div className="mt-2 flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-red-300 text-xs">{kyc.rejectionReason}</p>
            </div>
          )}
        </div>
        {status === 'verified' && <Sparkles className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />}
      </div>

      {/* Steps */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'PAN Card',     done: !!(form.pan && form.panName),          icon: CreditCard  },
          { label: 'Aadhaar',      done: !!(form.aadhar && form.aadharName),    icon: Fingerprint },
          { label: 'Bank Details', done: !!(form.bankAccount && form.bankIfsc), icon: Building2   },
        ].map(({ label, done, icon: Icon }) => (
          <div key={label} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${done ? 'bg-green-500/8 border-green-500/20' : 'bg-dark-800 border-dark-700'}`}>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${done ? 'bg-green-500/20' : 'bg-dark-700'}`}>
              {done ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Icon className="w-3.5 h-3.5 text-dark-500" />}
            </div>
            <p className={`text-[10px] font-semibold text-center ${done ? 'text-green-400' : 'text-dark-500'}`}>{label}</p>
          </div>
        ))}
      </div>

      {/* PAN */}
      <div className="bg-dark-800 rounded-2xl border border-dark-700 overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-dark-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center"><CreditCard className="w-3.5 h-3.5 text-blue-400" /></div>
            <h3 className="text-white font-bold text-sm">PAN Card</h3>
          </div>
          {kyc?.panVerified && <span className="flex items-center gap-1 text-[11px] bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-semibold"><CheckCircle className="w-2.5 h-2.5" /> Verified</span>}
        </div>
        <div className="p-4 sm:p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="PAN Number *" value={form.pan} onChange={f('pan')} placeholder="ABCDE1234F" disabled={!canEdit} upper maxLen={10} mono />
            <Field label="Name on PAN *" value={form.panName} onChange={f('panName')} placeholder="Full name as on PAN" disabled={!canEdit} />
          </div>
          <PhotoUpload label="PAN Card Photo" value={form.panPhoto} onChange={f('panPhoto')} disabled={!canEdit} />
        </div>
      </div>

      {/* Aadhaar */}
      <div className="bg-dark-800 rounded-2xl border border-dark-700 overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-dark-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/15 flex items-center justify-center"><Fingerprint className="w-3.5 h-3.5 text-indigo-400" /></div>
            <h3 className="text-white font-bold text-sm">Aadhaar Card</h3>
          </div>
          {kyc?.aadharVerified && <span className="flex items-center gap-1 text-[11px] bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-semibold"><CheckCircle className="w-2.5 h-2.5" /> Verified</span>}
        </div>
        <div className="p-4 sm:p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Aadhaar Number *" value={form.aadhar} onChange={f('aadhar')} placeholder="XXXXXXXXXXXX" disabled={!canEdit} numeric maxLen={12} mono />
            <Field label="Name on Aadhaar *" value={form.aadharName} onChange={f('aadharName')} placeholder="Full name as on Aadhaar" disabled={!canEdit} />
          </div>
          <PhotoUpload label="Aadhaar Card Photo" value={form.aadharPhoto} onChange={f('aadharPhoto')} disabled={!canEdit} />
        </div>
      </div>

      {/* Bank */}
      <div className="bg-dark-800 rounded-2xl border border-dark-700 overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-dark-700 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center"><Building2 className="w-3.5 h-3.5 text-emerald-400" /></div>
          <h3 className="text-white font-bold text-sm">Bank Account</h3>
        </div>
        <div className="p-4 sm:p-5 grid sm:grid-cols-2 gap-3">
          <Field label="Account Holder Name *" value={form.bankHolderName} onChange={f('bankHolderName')} placeholder="Name as on bank account" disabled={!canEdit} />
          <Field label="Account Number *" value={form.bankAccount} onChange={f('bankAccount')} placeholder="Account number" disabled={!canEdit} numeric />
          <Field label="IFSC Code *" value={form.bankIfsc} onChange={f('bankIfsc')} placeholder="SBIN0001234" disabled={!canEdit} upper maxLen={11} mono />
          <Field label="Bank Name *" value={form.bankName} onChange={f('bankName')} placeholder="State Bank of India" disabled={!canEdit} />
        </div>
      </div>

      {canEdit && (
        <button onClick={() => submit.mutate()} disabled={!canSubmit || submit.isPending}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-base hover:opacity-90 active:scale-[0.98] transition-all shadow-xl shadow-blue-500/25 disabled:opacity-40 disabled:cursor-not-allowed">
          {submit.isPending ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</> : <><ShieldCheck className="w-5 h-5" /> Submit KYC for Verification</>}
        </button>
      )}

      {status === 'verified' && (
        <div className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 font-bold text-sm">
          <ShieldCheck className="w-5 h-5" /> Your KYC is fully verified
        </div>
      )}
      {status === 'submitted' && (
        <div className="flex items-center gap-3 py-4 px-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <Clock className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-amber-300 font-semibold text-sm">Documents submitted</p>
            <p className="text-dark-400 text-xs mt-0.5">Our HR team will verify within 1-3 business days</p>
          </div>
        </div>
      )}
    </div>
  )
}
