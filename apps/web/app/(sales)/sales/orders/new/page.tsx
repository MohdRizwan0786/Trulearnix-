'use client'
import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { salesAPI } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import {
  User, Package, CreditCard, CheckCircle, ArrowRight, ArrowLeft,
  Loader2, IndianRupee, Printer, Copy, Check, ShoppingBag, Sparkles
} from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

const STEPS = [
  { id: 1, label: 'Customer', icon: User },
  { id: 2, label: 'Package',  icon: Package },
  { id: 3, label: 'Payment',  icon: CreditCard },
  { id: 4, label: 'Confirm',  icon: CheckCircle },
]

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 mb-8">
      {STEPS.map((step, i) => (
        <div key={step.id} className="flex items-center gap-1 sm:gap-2">
          <div className="flex flex-col items-center gap-1">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all border ${
              current === step.id
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/30'
                : current > step.id
                  ? 'bg-green-600/20 border-green-500/30 text-green-400'
                  : 'bg-dark-700 border-white/8 text-gray-600'
            }`}>
              {current > step.id ? <CheckCircle className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
            </div>
            <span className={`text-[10px] font-bold hidden sm:block ${
              current === step.id ? 'text-blue-300' : current > step.id ? 'text-green-400' : 'text-gray-700'
            }`}>{step.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-6 sm:w-10 h-0.5 mb-4 rounded-full ${current > step.id ? 'bg-green-500/50' : 'bg-white/8'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${copied ? 'bg-green-600 text-white' : 'bg-white/8 hover:bg-white/15 text-gray-300'}`}>
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

const inputCls = 'w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/60 transition-colors'
const labelCls = 'block text-xs text-gray-500 mb-1.5 font-semibold uppercase tracking-wide'

export default function NewOrderPage() {
  const { user } = useAuthStore()
  const [step, setStep] = useState(1)
  const [createdOrder, setCreatedOrder] = useState<any>(null)
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '', state: '', city: '' })
  const [selectedPackage, setSelectedPackage] = useState<any>(null)
  const [paymentType, setPaymentType] = useState<'full' | 'emi' | 'token'>('full')
  const [tokenAmount, setTokenAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [emiEnabled, setEmiEnabled] = useState(false)

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
    fetch(`${apiBase}/public/maintenance`).then(r => r.json()).then(d => setEmiEnabled(!!d.emiEnabled)).catch(() => {})
  }, [])

  const { data: packagesData } = useQuery({
    queryKey: ['sales-packages'],
    queryFn: () => salesAPI.packages().then(r => r.data.packages),
  })

  const packages: any[] = packagesData || []
  const mutation = useMutation({
    mutationFn: (data: any) => salesAPI.createOrder(data),
    onSuccess: (res) => { setCreatedOrder(res.data.order); setStep(5); toast.success('Order created!') },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to create order'),
  })

  const totalAmount = paymentType === 'token' ? Number(tokenAmount) || 0 : (selectedPackage?.price || 0)

  const handleCreateOrder = () => {
    if (!customer.name || !customer.phone) return toast.error('Name and phone required')
    if (!selectedPackage) return toast.error('Please select a package')
    if (paymentType === 'token' && !tokenAmount) return toast.error('Enter token amount')
    mutation.mutate({ customer, packageId: selectedPackage._id, paymentType, tokenAmount: paymentType === 'token' ? Number(tokenAmount) : undefined, notes })
  }

  const handlePrintSlip = () => {
    if (!createdOrder) return
    const html = `<!DOCTYPE html><html><head><title>Order Slip</title>
    <style>body{font-family:Arial,sans-serif;max-width:600px;margin:40px auto;padding:20px;color:#333}
    .header{text-align:center;border-bottom:2px solid #4f46e5;padding-bottom:20px;margin-bottom:20px}
    .logo{font-size:24px;font-weight:bold;color:#4f46e5}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px}
    .label{font-size:12px;color:#666}.value{font-size:15px;font-weight:600;margin-top:2px}
    .total{background:#f0f0ff;padding:20px;border-radius:8px;text-align:center}
    .amount{font-size:32px;font-weight:bold;color:#4f46e5}
    .footer{text-align:center;margin-top:30px;font-size:12px;color:#999}
    </style></head><body>
    <div class="header"><div class="logo">TruLearnix</div><div style="margin-top:6px">Order Slip / Payment Receipt</div>
    <div style="margin-top:4px;font-size:12px;color:#666">Order ID: ${createdOrder._id}</div></div>
    <div class="grid">
      <div><div class="label">Customer</div><div class="value">${createdOrder.customer?.name}</div></div>
      <div><div class="label">Phone</div><div class="value">${createdOrder.customer?.phone}</div></div>
      <div><div class="label">Package</div><div class="value">${selectedPackage?.name}</div></div>
      <div><div class="label">Payment Type</div><div class="value" style="text-transform:capitalize">${paymentType}</div></div>
      <div><div class="label">Sales Executive</div><div class="value">${user?.name}</div></div>
      <div><div class="label">Date</div><div class="value">${new Date().toLocaleDateString('en-IN')}</div></div>
    </div>
    <div class="total"><div style="font-size:13px;color:#666;margin-bottom:4px">${paymentType === 'token' ? 'Token Amount' : 'Total Amount'}</div>
    <div class="amount">₹${totalAmount.toLocaleString('en-IN')}</div>
    ${paymentType === 'token' ? `<div style="font-size:13px;color:#666;margin-top:4px">Full Package: ₹${selectedPackage?.price?.toLocaleString('en-IN')}</div>` : ''}
    </div>
    <div class="footer">TruLearnix — Skill Up. Earn Up. | support@trulearnix.com</div>
    </body></html>`
    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close(); w.print() }
  }

  // ── Success Screen ──
  if (step === 5 && createdOrder) {
    return (
      <div className="max-w-lg mx-auto space-y-5 pb-8">
        <div className="relative overflow-hidden rounded-3xl p-8 text-center"
          style={{ background: 'linear-gradient(135deg,rgba(16,185,129,0.2) 0%,rgba(5,150,105,0.1) 100%)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(16,185,129,0.2)' }} />
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-black text-white">Order Created!</h2>
            <p className="text-green-200/60 text-sm mt-1">Order has been submitted successfully</p>
          </div>
        </div>

        <div className="bg-dark-800 rounded-2xl border border-white/5 p-5 space-y-3">
          {[
            { label: 'Order ID', value: <span className="font-mono text-xs">{createdOrder._id?.slice(-8).toUpperCase()}</span> },
            { label: 'Customer', value: createdOrder.customer?.name },
            { label: 'Package', value: selectedPackage?.name },
            { label: 'Amount', value: <span className="font-black text-lg">₹{totalAmount.toLocaleString()}</span> },
            { label: 'Status', value: <span className="text-amber-300 capitalize">{createdOrder.status?.replace('_', ' ')}</span> },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <span className="text-gray-500 text-sm">{item.label}</span>
              <span className="text-white text-sm font-semibold">{item.value}</span>
            </div>
          ))}
        </div>

        <div className="space-y-2.5">
          <button onClick={handlePrintSlip}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all border border-white/10">
            <Printer className="w-4 h-4" /> Download / Print Slip
          </button>
          <Link href={`/sales/orders/${createdOrder._id}`}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-white font-bold transition-all text-center"
            style={{ background: 'linear-gradient(135deg,#2563eb,#4f46e5)' }}>
            <ShoppingBag className="w-4 h-4" /> View Order & Mark Payment
          </Link>
          <Link href="/sales/orders/new"
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-dark-700 hover:bg-dark-600 text-gray-300 font-bold transition-all border border-white/10 text-center">
            Create Another Order
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl pb-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/sales/orders"
          className="w-9 h-9 rounded-xl bg-dark-800 border border-white/8 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/20 transition-all flex-shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-white">New Order</h1>
          <p className="text-gray-500 text-sm">Create a sales order for a customer</p>
        </div>
      </div>

      <StepIndicator current={step} />

      {/* ── Step 1: Customer ── */}
      {step === 1 && (
        <div className="bg-dark-800 rounded-2xl border border-white/5 p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center">
              <User className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-white font-bold">Customer Details</h2>
              <p className="text-gray-600 text-xs">Fill in the customer's information</p>
            </div>
          </div>

          <div>
            <label className={labelCls}>Full Name <span className="text-red-400 normal-case">*</span></label>
            <input type="text" value={customer.name} onChange={e => setCustomer(c => ({ ...c, name: e.target.value }))}
              placeholder="Customer full name" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Phone <span className="text-red-400 normal-case">*</span></label>
            <input type="tel" value={customer.phone} onChange={e => setCustomer(c => ({ ...c, phone: e.target.value }))}
              placeholder="10-digit phone number" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input type="email" value={customer.email} onChange={e => setCustomer(c => ({ ...c, email: e.target.value }))}
              placeholder="customer@email.com" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>State</label>
              <input type="text" value={customer.state} onChange={e => setCustomer(c => ({ ...c, state: e.target.value }))}
                placeholder="e.g. Maharashtra" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>City</label>
              <input type="text" value={customer.city} onChange={e => setCustomer(c => ({ ...c, city: e.target.value }))}
                placeholder="e.g. Mumbai" className={inputCls} />
            </div>
          </div>

          <button onClick={() => {
            if (!customer.name.trim()) return toast.error('Name is required')
            if (!customer.phone.trim()) return toast.error('Phone is required')
            setStep(2)
          }} className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-white font-bold transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#2563eb,#4f46e5)', boxShadow: '0 4px 16px rgba(37,99,235,0.3)' }}>
            Next: Select Package <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Step 2: Package ── */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-dark-800 rounded-2xl border border-white/5 p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center">
                <Package className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-white font-bold">Select Package</h2>
                <p className="text-gray-600 text-xs">Choose the right plan for the customer</p>
              </div>
            </div>

            {packages.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">No active packages found</div>
            ) : (
              <div className="space-y-2.5">
                {packages.map((pkg: any) => {
                  const commAmt = pkg.salesTeamCommission?.type === 'percentage'
                    ? (pkg.price * (pkg.salesTeamCommission?.value || 0)) / 100
                    : (pkg.salesTeamCommission?.value || 0)
                  const isSelected = selectedPackage?._id === pkg._id
                  return (
                    <button key={pkg._id} onClick={() => setSelectedPackage(pkg)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all ${
                        isSelected ? 'border-blue-500/40 bg-blue-500/10' : 'border-white/6 bg-dark-700/50 hover:border-white/15 hover:bg-dark-700'
                      }`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-white font-bold">{pkg.name}</p>
                            {pkg.badge && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">{pkg.badge}</span>}
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500 capitalize">{pkg.tier}</span>
                          </div>
                          {pkg.features?.slice(0, 2).map((f: string) => (
                            <p key={f} className="text-xs text-gray-600 mt-1">• {f}</p>
                          ))}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-white font-black text-lg">₹{pkg.price?.toLocaleString()}</p>
                          {commAmt > 0 && <p className="text-xs text-green-400 mt-0.5 font-semibold">+₹{commAmt.toFixed(0)} comm.</p>}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="mt-2 flex items-center gap-1 text-blue-400">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span className="text-xs font-semibold">Selected</span>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-dark-700 text-gray-300 font-bold border border-white/10 hover:bg-dark-600 transition-all">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={() => { if (!selectedPackage) return toast.error('Select a package'); setStep(3) }}
              className="flex-[2] flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-bold transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#2563eb,#4f46e5)' }}>
              Next: Payment <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Payment ── */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-dark-800 rounded-2xl border border-white/5 p-5 sm:p-6 space-y-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <h2 className="text-white font-bold">Payment Details</h2>
                <p className="text-gray-600 text-xs">Choose how the customer will pay</p>
              </div>
            </div>

            {/* Payment Type */}
            <div>
              <label className={labelCls}>Payment Type</label>
              <div className="grid grid-cols-3 gap-2">
                {(['full', 'emi', 'token'] as const).filter(pt => pt !== 'emi' || emiEnabled).map(pt => (
                  <button key={pt} onClick={() => setPaymentType(pt)}
                    className={`px-3 py-3 rounded-xl text-sm font-bold transition-all border ${
                      paymentType === pt
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-dark-700 border-white/8 text-gray-500 hover:border-white/20 hover:text-gray-300'
                    }`}>
                    {pt === 'full' ? '💳 Full' : pt === 'emi' ? '📅 EMI' : '🪙 Token'}
                  </button>
                ))}
              </div>
            </div>

            {paymentType === 'token' && (
              <div>
                <label className={labelCls}>Token Amount (₹) <span className="text-red-400 normal-case">*</span></label>
                <input type="number" value={tokenAmount} onChange={e => setTokenAmount(e.target.value)}
                  placeholder="e.g. 1000" className={inputCls} />
                <p className="text-xs text-gray-600 mt-1.5">Remaining: ₹{Math.max(0, (selectedPackage?.price || 0) - Number(tokenAmount)).toLocaleString()} due later</p>
              </div>
            )}

            {paymentType === 'emi' && selectedPackage?.emiAvailable && (
              <div>
                <label className={labelCls}>Installment Schedule</label>
                {(() => {
                  const days: number[] = selectedPackage?.emiDays?.length ? selectedPackage.emiDays : [0, 15, 30, 45]
                  const instAmt = Math.ceil((selectedPackage?.price || 0) / days.length)
                  return (
                    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(days.length, 4)}, 1fr)` }}>
                      {days.map((d: number, i: number) => (
                        <div key={i} className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3 text-center">
                          <p className="text-blue-300 text-sm font-black">₹{instAmt.toLocaleString()}</p>
                          <p className="text-gray-500 text-xs mt-0.5">{d === 0 ? 'Today' : `Day ${d}`}</p>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Partner code info */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-500/5 border border-blue-500/15">
              <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <p className="text-xs text-gray-400">Your partner code <span className="text-blue-300 font-mono font-bold">{user?.affiliateCode}</span> will be applied automatically.</p>
            </div>

            {/* Notes */}
            <div>
              <label className={labelCls}>Notes (optional)</label>
              <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Any notes about this order..." className={`${inputCls} resize-none`} />
            </div>

            {/* Summary */}
            <div className="rounded-xl bg-dark-700/60 border border-white/5 p-4 space-y-2">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3">Order Summary</p>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Package</span>
                <span className="text-white font-medium">{selectedPackage?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Package Price</span>
                <span className="text-white font-medium">₹{(selectedPackage?.price || 0).toLocaleString()}</span>
              </div>
              {paymentType === 'token' && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Token to Collect</span>
                  <span className="text-blue-300 font-bold">₹{Number(tokenAmount || 0).toLocaleString()}</span>
                </div>
              )}
              {selectedPackage?.salesTeamCommission?.value > 0 && (
                <div className="flex justify-between text-sm pt-2 border-t border-white/5">
                  <span className="text-green-400">Your Partnership earning</span>
                  <span className="text-green-400 font-black">
                    +₹{(selectedPackage.salesTeamCommission.type === 'percentage'
                      ? ((selectedPackage.price * selectedPackage.salesTeamCommission.value) / 100)
                      : selectedPackage.salesTeamCommission.value
                    ).toFixed(0)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-dark-700 text-gray-300 font-bold border border-white/10 hover:bg-dark-600 transition-all">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={() => setStep(4)} className="flex-[2] flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-bold transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#2563eb,#4f46e5)' }}>
              Review Order <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Confirm ── */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="bg-dark-800 rounded-2xl border border-white/5 p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-green-500/15 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <h2 className="text-white font-bold">Order Summary</h2>
                <p className="text-gray-600 text-xs">Review before confirming</p>
              </div>
            </div>

            <div className="space-y-0 divide-y divide-white/5">
              {[
                { label: 'Customer', value: <div><p className="text-white font-semibold">{customer.name}</p><p className="text-gray-500 text-xs">{customer.phone}</p></div> },
                customer.email && { label: 'Email', value: customer.email },
                (customer.city || customer.state) && { label: 'Location', value: [customer.city, customer.state].filter(Boolean).join(', ') },
                { label: 'Package', value: <span className="font-semibold">{selectedPackage?.name}</span> },
                { label: 'Payment Type', value: <span className="capitalize font-semibold">{paymentType}</span> },
                { label: 'Amount Due Now', value: <span className="text-xl font-black">₹{totalAmount.toLocaleString()}</span> },
              ].filter(Boolean).map((item: any) => (
                <div key={item.label} className="flex items-start justify-between gap-3 py-3">
                  <span className="text-gray-500 text-sm flex-shrink-0">{item.label}</span>
                  <span className="text-white text-sm text-right">{item.value}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-600 mt-4 pt-4 border-t border-white/5">After creating the order, you can mark payment manually or generate a payment link for the customer.</p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(3)} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-dark-700 text-gray-300 font-bold border border-white/10 hover:bg-dark-600 transition-all">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={handleCreateOrder} disabled={mutation.isPending}
              className="flex-[2] flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-bold transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#059669,#047857)', boxShadow: '0 4px 16px rgba(5,150,105,0.3)' }}>
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Create Order
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
