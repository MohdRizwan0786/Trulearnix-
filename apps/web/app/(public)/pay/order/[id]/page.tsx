'use client'
import { useEffect, useState, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import {
  CheckCircle, Loader2, AlertCircle, User, Phone,
  CreditCard, Shield, Star, Clock, Zap, XCircle,
  ChevronRight, IndianRupee, Calendar
} from 'lucide-react'
import api from '@/lib/api'

const TIER_COLORS: Record<string, string> = {
  starter: 'from-blue-500 to-blue-600',
  pro: 'from-violet-500 to-violet-600',
  elite: 'from-amber-500 to-amber-600',
  supreme: 'from-rose-500 to-rose-600',
  free: 'from-gray-500 to-gray-600',
}

function fmt(n: number) { return n?.toLocaleString('en-IN') || '0' }

function PayOrderInner() {
  const params = useParams()
  const searchParams = useSearchParams()
  const orderId = params?.id as string

  // URL params from PhonePe redirect
  const merchantOrderId = searchParams.get('merchantOrderId')
  const mode = searchParams.get('mode') // 'remaining' if paying remaining after token
  const redirectPaymentType = searchParams.get('paymentType') || 'full'

  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [order, setOrder] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [payState, setPayState] = useState<'idle' | 'checking' | 'success' | 'failed' | 'token_paid'>('idle')

  // Remaining payment selection
  const [remainMode, setRemainMode] = useState<'choose' | 'paying'>('choose')
  const [remainType, setRemainType] = useState<'full' | 'emi'>('full')

  useEffect(() => {
    if (!orderId) return
    api.get(`/sales/public/order/${orderId}`)
      .then(r => {
        const ord = r.data.order
        setOrder(ord)
        setLoading(false)
        // If already token_paid and no merchantOrderId in URL, show remaining options
        if (ord.status === 'token_paid' && !merchantOrderId) {
          setPayState('token_paid')
        }
      })
      .catch(e => {
        setError(e?.response?.data?.message || 'Order not found')
        setLoading(false)
      })
  }, [orderId])

  // Poll status after PhonePe redirect
  useEffect(() => {
    if (!merchantOrderId || !orderId) return
    setPayState('checking')

    const endpoint = mode === 'remaining'
      ? `/sales/public/order/${orderId}/phonepe-status-remaining?merchantOrderId=${merchantOrderId}&paymentType=${redirectPaymentType}`
      : `/sales/public/order/${orderId}/phonepe-status?merchantOrderId=${merchantOrderId}`

    let attempts = 0
    const interval = setInterval(async () => {
      attempts++
      try {
        const { data } = await api.get(endpoint)
        if (data.state === 'COMPLETED') {
          clearInterval(interval)
          if (data.status === 'token_paid') setPayState('token_paid')
          else setPayState('success')
        } else if (attempts >= 8) {
          clearInterval(interval)
          setPayState('failed')
          setError('Payment not confirmed. Please contact support if money was deducted.')
        }
      } catch {
        if (attempts >= 8) { clearInterval(interval); setPayState('failed') }
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [merchantOrderId, orderId, mode])

  const handlePay = async () => {
    setPaying(true); setError(null)
    try {
      const { data } = await api.post(`/sales/public/order/${orderId}/phonepe`)
      if (data.redirectUrl) window.location.href = data.redirectUrl
      else { setError('Could not initiate payment.'); setPaying(false) }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Payment failed'); setPaying(false)
    }
  }

  const handlePayRemaining = async () => {
    setPaying(true); setError(null)
    try {
      const { data } = await api.post(`/sales/public/order/${orderId}/phonepe-remaining`, {
        paymentType: remainType,
      })
      if (data.redirectUrl) window.location.href = data.redirectUrl
      else { setError('Could not initiate payment.'); setPaying(false) }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Payment failed'); setPaying(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
    </div>
  )

  if (error && !order) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/5 border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-white text-xl font-bold mb-2">Order Not Found</h2>
        <p className="text-gray-400 text-sm">{error}</p>
      </div>
    </div>
  )

  if (payState === 'checking') return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-violet-400 animate-spin mx-auto mb-4" />
        <p className="text-white font-semibold text-lg">Confirming your payment…</p>
        <p className="text-gray-400 text-sm mt-2">Do not close this page</p>
      </div>
    </div>
  )

  if (payState === 'failed') return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-8 text-center">
          <XCircle className="w-14 h-14 text-white mx-auto mb-3" />
          <h1 className="text-white text-2xl font-bold">Payment Failed</h1>
        </div>
        <div className="p-6 text-center">
          <p className="text-gray-600 mb-4 text-sm">{error || 'Payment could not be confirmed.'}</p>
          <button onClick={() => { setPayState('idle'); setError(null) }}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-xl">
            Try Again
          </button>
        </div>
      </div>
    </div>
  )

  if (payState === 'success' || order?.status === 'paid') return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        {order?.status === 'paid' && payState === 'idle' ? (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center">
            <CheckCircle className="w-16 h-16 text-white mx-auto mb-3" />
            <h1 className="text-white text-2xl font-bold">Already Paid</h1>
            <p className="text-green-100 text-sm mt-1">This order has already been completed.</p>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <p className="text-green-100 text-sm font-medium uppercase tracking-widest mb-1">Payment Received</p>
            <h1 className="text-white text-3xl font-black">Thank You!</h1>
            <p className="text-green-100 text-sm mt-2">{order?.customer?.name || 'Your'} payment is confirmed.</p>
          </div>
        )}
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-black text-gray-800">
              ₹{fmt(order?.totalAmount || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{order?.package?.name || order?.packageTier + ' Package'} · 1 Year Access</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-green-800 mb-2">What happens next?</p>
            <ul className="space-y-1.5 text-xs text-green-700">
              <li className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /><span>Your TruLearnix account is now active</span></li>
              <li className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /><span>Login at <strong>peptly.in</strong> with your registered email</span></li>
              <li className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /><span>Welcome email with login details has been sent</span></li>
              <li className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /><span>Contact support if you face any issues</span></li>
            </ul>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1">Order Reference</p>
            <p className="text-xs font-mono text-gray-600 break-all">{orderId}</p>
          </div>
          {order?.salesperson?.name && (
            <p className="text-center text-xs text-gray-400">
              Your Sales Rep: <span className="text-gray-600 font-medium">{order.salesperson.name}</span>
              {order.salesperson.phone && <> · <a href={`tel:${order.salesperson.phone}`} className="text-blue-500">{order.salesperson.phone}</a></>}
            </p>
          )}
        </div>
      </div>
    </div>
  )

  if (order?.status === 'cancelled') return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/5 border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-white text-xl font-bold mb-2">Order Cancelled</h2>
        <p className="text-gray-400 text-sm">Contact your sales representative for help.</p>
      </div>
    </div>
  )

  // ── TOKEN PAID → Show remaining payment options ───────────────────────────
  if (payState === 'token_paid' || order?.status === 'token_paid') {
    const remaining = (order?.totalAmount || 0) - (order?.paidAmount || 0)
    const emiDays: number[] = order?.package?.emiDays?.length ? order.package.emiDays : [0, 15, 30, 45]
    const instAmt = Math.ceil(remaining / emiDays.length)

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-lg w-full space-y-4">
          {/* Header */}
          <div className="text-center">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <p className="text-gray-400 text-xs">TruLearnix · Payment Portal</p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Token paid banner */}
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold">Token Payment Received</p>
                  <p className="text-amber-100 text-sm">₹{fmt(order?.tokenAmount || order?.paidAmount)} paid · ₹{fmt(remaining)} remaining</p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <p className="text-sm font-bold text-gray-800 mb-1">{order?.package?.name || order?.packageTier + ' Package'}</p>
                <p className="text-xs text-gray-500">Total Value: ₹{fmt(order?.totalAmount)} · Remaining: ₹{fmt(remaining)}</p>
              </div>

              {/* Payment type selection */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Pay Remaining As</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setRemainType('full')}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      remainType === 'full'
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-gray-200 hover:border-violet-300'
                    }`}
                  >
                    <IndianRupee className={`w-5 h-5 mb-2 ${remainType === 'full' ? 'text-violet-600' : 'text-gray-400'}`} />
                    <p className={`text-sm font-bold ${remainType === 'full' ? 'text-violet-700' : 'text-gray-700'}`}>Full Payment</p>
                    <p className={`text-xs mt-0.5 ${remainType === 'full' ? 'text-violet-500' : 'text-gray-400'}`}>Pay ₹{fmt(remaining)} now</p>
                  </button>

                  {order?.package?.emiAvailable && (
                    <button
                      onClick={() => setRemainType('emi')}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        remainType === 'emi'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <Calendar className={`w-5 h-5 mb-2 ${remainType === 'emi' ? 'text-blue-600' : 'text-gray-400'}`} />
                      <p className={`text-sm font-bold ${remainType === 'emi' ? 'text-blue-700' : 'text-gray-700'}`}>Installments</p>
                      <p className={`text-xs mt-0.5 ${remainType === 'emi' ? 'text-blue-500' : 'text-gray-400'}`}>₹{fmt(instAmt)} × {emiDays.length}</p>
                    </button>
                  )}
                </div>
              </div>

              {/* EMI day-based schedule */}
              {remainType === 'emi' && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Installment Schedule</p>
                  <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${Math.min(emiDays.length, 4)}, 1fr)` }}>
                    {emiDays.map((d: number, i: number) => (
                      <div key={i} className="rounded-xl border-2 border-blue-200 bg-blue-50 p-2.5 text-center">
                        <p className="text-sm font-bold text-blue-800">₹{fmt(instAmt)}</p>
                        <p className="text-xs text-blue-500 mt-0.5">{d === 0 ? 'Today' : `Day ${d}`}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-amber-600 mt-2 font-medium">Note: Missed installment will suspend access.</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              )}

              <button
                onClick={handlePayRemaining}
                disabled={paying}
                className="w-full bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 disabled:opacity-60 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-500/30"
              >
                {paying
                  ? <><Loader2 className="w-5 h-5 animate-spin" />Redirecting...</>
                  : remainType === 'emi'
                    ? <><CreditCard className="w-5 h-5" />Pay ₹{fmt(instAmt)} (1st EMI) via PhonePe</>
                    : <><CreditCard className="w-5 h-5" />Pay ₹{fmt(remaining)} via PhonePe</>
                }
              </button>

              {order?.salesperson?.name && (
                <p className="text-center text-xs text-gray-400">
                  Rep: <span className="text-gray-600 font-medium">{order.salesperson.name}</span>
                  {order.salesperson.phone && <> · <a href={`tel:${order.salesperson.phone}`} className="text-blue-500">{order.salesperson.phone}</a></>}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Main Payment Page (initial) ───────────────────────────────────────────
  const amountDue = order.paymentType === 'token' ? (order.tokenAmount || order.totalAmount) : order.totalAmount
  const tierColor = TIER_COLORS[order.packageTier] || TIER_COLORS.starter

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-4">
        <div className="text-center mb-2">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-white text-lg font-bold">TruLearnix</span>
          </div>
          <p className="text-gray-400 text-xs">Secure Payment Portal</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className={`bg-gradient-to-r ${tierColor} p-6`}>
            <div className="flex items-start justify-between">
              <div>
                <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full capitalize">{order.packageTier} Plan</span>
                <h2 className="text-white text-xl font-bold mt-2">{order.package?.name || `${order.packageTier} Package`}</h2>
                <p className="text-white/80 text-sm mt-0.5">1 Year Full Access</p>
              </div>
              <div className="text-right">
                {order.paymentType === 'token' && (
                  <p className="text-white/70 text-xs line-through">₹{fmt(order.totalAmount)}</p>
                )}
                <p className="text-white text-2xl font-bold">₹{fmt(amountDue)}</p>
                {order.paymentType === 'token' && <p className="text-white/80 text-xs">Token Amount</p>}
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Customer</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2"><User className="w-4 h-4 text-gray-400" /><span className="text-sm text-gray-800 font-medium">{order.customer?.name}</span></div>
                {order.customer?.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /><span className="text-sm text-gray-700">{order.customer.phone}</span></div>}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Summary</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Package Price</span><span className="text-gray-800">₹{fmt(order.totalAmount)}</span></div>
                {order.paymentType === 'token' && (
                  <>
                    <div className="flex justify-between text-amber-600"><span>Token (Now)</span><span className="font-semibold">₹{fmt(order.tokenAmount)}</span></div>
                    <div className="flex justify-between text-gray-400 text-xs"><span>Remaining later</span><span>₹{fmt(order.totalAmount - (order.tokenAmount || 0))}</span></div>
                  </>
                )}
                <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-base">
                  <span className="text-gray-800">Due Now</span>
                  <span className="text-violet-600">₹{fmt(amountDue)}</span>
                </div>
              </div>
            </div>

            {order.package?.features?.length > 0 && (
              <div className="bg-violet-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-violet-700 mb-2 uppercase tracking-wide">What You Get</p>
                <ul className="space-y-1">
                  {order.package.features.slice(0, 4).map((f: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-violet-800">
                      <CheckCircle className="w-3.5 h-3.5 text-violet-500 flex-shrink-0 mt-0.5" />{f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {order.paymentType === 'token' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-3">
                <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-800">Token Payment</p>
                  <p className="text-xs text-amber-700 mt-0.5">Pay token now to hold your spot. After token payment, you can choose Full or EMI for the remaining amount.</p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}

            <button
              onClick={handlePay}
              disabled={paying}
              className="w-full bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 disabled:opacity-60 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-500/30 text-base"
            >
              {paying
                ? <><Loader2 className="w-5 h-5 animate-spin" />Redirecting to PhonePe...</>
                : <><CreditCard className="w-5 h-5" />Pay ₹{fmt(amountDue)} via PhonePe</>
              }
            </button>

            {order.salesperson?.name && (
              <p className="text-center text-xs text-gray-400">
                Representative: <span className="font-medium text-gray-600">{order.salesperson.name}</span>
                {order.salesperson.phone && <> · <a href={`tel:${order.salesperson.phone}`} className="text-blue-500">{order.salesperson.phone}</a></>}
              </p>
            )}

            <div className="flex items-center justify-center gap-4 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-1 text-gray-400"><Shield className="w-3.5 h-3.5" /><span className="text-xs">Secure · PhonePe</span></div>
              <div className="flex items-center gap-1 text-gray-400"><Star className="w-3.5 h-3.5" /><span className="text-xs">Verified Platform</span></div>
            </div>
          </div>
        </div>

        <p className="text-center text-gray-500 text-xs">© {new Date().getFullYear()} TruLearnix · peptly.in</p>
      </div>
    </div>
  )
}

export default function PayOrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
      </div>
    }>
      <PayOrderInner />
    </Suspense>
  )
}
