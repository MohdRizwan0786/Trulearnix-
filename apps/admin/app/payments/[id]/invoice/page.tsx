'use client'
import { useEffect, useState } from 'react'
import { adminAPI } from '@/lib/api'

const COMPANY = {
  name: 'TRULEARNIX DIGITAL SKILLS LLP',
  llpNo: 'ACR-4252',
  pan: 'AAYFT7302G',
  tan: 'DELT25894B',
  address: '891/E 22, Second Floor, F/S Zakir Nagar,\nJamia Nagar, New Delhi – 110025, Delhi, India',
  email: 'official@trulearnix.com',
  phone: '+91 8979616798',
  website: 'trulearnix.com',
}

function fmt(n: number) {
  return '₹' + (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function numToWords(n: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  if (n === 0) return 'Zero'
  if (n < 20) return ones[n]
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '')
  if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + numToWords(n % 100) : '')
  if (n < 100000) return numToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + numToWords(n % 1000) : '')
  if (n < 10000000) return numToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + numToWords(n % 100000) : '')
  return numToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + numToWords(n % 10000000) : '')
}

function amountInWords(amount: number): string {
  const rupees = Math.floor(amount)
  const paise = Math.round((amount - rupees) * 100)
  let result = numToWords(rupees) + ' Rupees'
  if (paise > 0) result += ' and ' + numToWords(paise) + ' Paise'
  return result + ' Only'
}

export default function PaymentInvoicePage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    adminAPI.paymentInvoice(params.id)
      .then((r: any) => { if (r.data?.success) setData(r.data); else setError('Invoice not found') })
      .catch(() => setError('Failed to load invoice'))
      .finally(() => setLoading(false))
  }, [params.id])

  if (loading) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading invoice...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <p className="text-red-500">{error}</p>
    </div>
  )

  const { payment, settings } = data
  const user = payment.user || {}
  const course = payment.course || {}
  const gstNumber = settings?.gstNumber || ''
  const invoiceDate = new Date(payment.createdAt)
  const invoiceNo = `TRL-OLD-${payment._id.toString().slice(-8).toUpperCase()}`
  const gateway = payment._migratedGateway || payment.paymentMethod || 'razorpay'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: #f3f4f6; }
        .page { width: 210mm; min-height: 297mm; margin: 0 auto; background: white; }
        @media print {
          body { background: white; }
          .no-print { display: none !important; }
          .page { margin: 0; box-shadow: none; }
          @page { size: A4; margin: 0; }
        }
      `}</style>

      <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => window.print()}
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white',
            border: 'none', borderRadius: '12px', padding: '10px 20px',
            fontSize: '14px', fontWeight: '600', cursor: 'pointer',
            fontFamily: 'Inter, sans-serif', boxShadow: '0 4px 15px rgba(124,58,237,0.4)',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}
        >
          ⬇ Download / Print PDF
        </button>
        <button
          onClick={() => window.close()}
          style={{
            background: '#374151', color: '#9ca3af', border: 'none',
            borderRadius: '12px', padding: '10px 16px', fontSize: '14px',
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
          }}
        >
          ✕ Close
        </button>
      </div>

      <div className="no-print" style={{ height: '60px' }} />

      <div className="page" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)', fontFamily: 'Inter, sans-serif' }}>

        {/* HEADER */}
        <div style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)',
          padding: '36px 40px 28px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(139,92,246,0.15)' }} />
          <div style={{ position: 'absolute', bottom: '-60px', left: '30%', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(109,40,217,0.12)' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '14px',
                  background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px', fontWeight: '900', color: 'white',
                  boxShadow: '0 4px 15px rgba(124,58,237,0.5)',
                }}>T</div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: 'white', letterSpacing: '-0.5px' }}>TruLearnix</div>
                  <div style={{ fontSize: '10px', color: '#a78bfa', fontWeight: '500', marginTop: '1px' }}>Digital Skills Platform</div>
                </div>
              </div>
              <div style={{ fontSize: '10px', color: '#c4b5fd', lineHeight: '1.6' }}>
                <div style={{ fontWeight: '600', color: '#e9d5ff', marginBottom: '2px' }}>{COMPANY.name}</div>
                <div>LLP No: {COMPANY.llpNo} &nbsp;|&nbsp; PAN: {COMPANY.pan}</div>
                <div>{COMPANY.address.split('\n').join(', ')}</div>
                <div>{COMPANY.email} &nbsp;|&nbsp; {COMPANY.phone}</div>
                {gstNumber && <div style={{ color: '#f0abfc', fontWeight: '600' }}>GSTIN: {gstNumber}</div>}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '24px', fontWeight: '900', color: 'white', letterSpacing: '-1px', lineHeight: '1' }}>
                PAYMENT RECEIPT
              </div>
              <div style={{
                display: 'inline-block', marginTop: '6px', marginBottom: '8px',
                padding: '3px 10px', borderRadius: '20px',
                background: 'rgba(16,185,129,0.2)', color: '#34d399',
                fontSize: '10px', fontWeight: '700', letterSpacing: '0.5px',
                border: '1px solid rgba(52,211,153,0.4)',
              }}>
                PAID IN FULL
              </div>
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 16px', backdropFilter: 'blur(10px)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px' }}>
                    <span style={{ fontSize: '10px', color: '#a78bfa', fontWeight: '500' }}>RECEIPT NO.</span>
                    <span style={{ fontSize: '11px', color: 'white', fontWeight: '700', fontFamily: 'monospace' }}>{invoiceNo}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px' }}>
                    <span style={{ fontSize: '10px', color: '#a78bfa', fontWeight: '500' }}>DATE</span>
                    <span style={{ fontSize: '11px', color: 'white', fontWeight: '600' }}>
                      {invoiceDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  {payment.razorpayPaymentId && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px' }}>
                      <span style={{ fontSize: '10px', color: '#a78bfa', fontWeight: '500' }}>PAYMENT ID</span>
                      <span style={{ fontSize: '10px', color: '#d8b4fe', fontFamily: 'monospace' }}>{payment.razorpayPaymentId}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px' }}>
                    <span style={{ fontSize: '10px', color: '#a78bfa', fontWeight: '500' }}>STATUS</span>
                    <span style={{
                      fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '6px',
                      background: 'rgba(16,185,129,0.25)', color: '#34d399',
                    }}>PAID</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BILL TO + PAYMENT DETAILS */}
        <div style={{ padding: '24px 40px', display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1, background: '#f8f7ff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
              Bill To
            </div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>{user.name || '—'}</div>
            {user.email && <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>{user.email}</div>}
            {user.phone && <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>{user.phone}</div>}
            {(user.state || user.country) && (
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                {[user.state, user.country || 'India'].filter(Boolean).join(', ')}
              </div>
            )}
          </div>

          <div style={{ flex: 1, background: '#f8f7ff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
              Payment Details
            </div>
            <div style={{ fontSize: '12px', color: '#374151', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Gateway</span>
                <span style={{ fontWeight: '600', textTransform: 'capitalize' }}>{gateway}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Type</span>
                <span style={{ fontWeight: '600', color: '#10b981' }}>Course Purchase</span>
              </div>
              {payment.razorpayOrderId && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Order ID</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>{payment.razorpayOrderId}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ITEMS TABLE */}
        <div style={{ padding: '0 40px 24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', borderRadius: '12px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '10px', fontWeight: '700', color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: '0.8px', width: '40px' }}>#</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '10px', fontWeight: '700', color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Description</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '10px', fontWeight: '700', color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: '0.8px', width: '60px' }}>Qty</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '10px', fontWeight: '700', color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: '0.8px', width: '120px' }}>Unit Price</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '10px', fontWeight: '700', color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: '0.8px', width: '120px' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ background: '#fafafa', borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '16px', fontSize: '12px', color: '#6b7280' }}>1</td>
                <td style={{ padding: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>
                    {course.title || 'Online Course'} — Digital Learning Program
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                    TruLearnix Platform Access &nbsp;|&nbsp; Lifetime Access
                  </div>
                </td>
                <td style={{ padding: '16px', textAlign: 'center', fontSize: '13px', color: '#374151' }}>1</td>
                <td style={{ padding: '16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#374151' }}>{fmt(payment.amount)}</td>
                <td style={{ padding: '16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#374151' }}>{fmt(payment.amount)}</td>
              </tr>
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <div style={{ width: '300px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: '13px' }}>
                <span style={{ color: '#6b7280' }}>Subtotal</span>
                <span style={{ fontWeight: '600', color: '#374151' }}>{fmt(payment.amount)}</span>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between', padding: '12px 16px', marginTop: '4px',
                background: 'linear-gradient(135deg, #1e1b4b, #4c1d95)', borderRadius: '10px',
              }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#e9d5ff' }}>TOTAL</span>
                <span style={{ fontSize: '18px', fontWeight: '900', color: 'white' }}>{fmt(payment.amount)}</span>
              </div>
            </div>
          </div>

          {/* Amount in words */}
          <div style={{
            marginTop: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0',
            borderRadius: '8px', padding: '10px 14px',
          }}>
            <span style={{ fontSize: '11px', color: '#15803d', fontWeight: '600' }}>Amount in Words: </span>
            <span style={{ fontSize: '11px', color: '#166534', fontStyle: 'italic' }}>
              {amountInWords(payment.amount)}
            </span>
          </div>
        </div>

        {/* FOOTER */}
        <div style={{
          margin: '0 40px 40px',
          background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
          borderRadius: '16px', padding: '20px 24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        }}>
          <div>
            <div style={{ fontSize: '11px', color: '#a78bfa', marginBottom: '6px', fontWeight: '600' }}>Terms & Conditions</div>
            <div style={{ fontSize: '10px', color: '#7c6fbf', lineHeight: '1.6', maxWidth: '340px' }}>
              • This is a computer-generated receipt and does not require a physical signature.<br />
              • All sales are final. Refunds subject to TruLearnix refund policy.<br />
              • For support: {COMPANY.email} | {COMPANY.phone}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', color: '#a78bfa', marginBottom: '6px' }}>For TRULEARNIX DIGITAL SKILLS LLP</div>
            <div style={{ height: '32px', borderBottom: '1px solid rgba(167,139,250,0.4)', width: '120px', marginLeft: 'auto' }} />
            <div style={{ fontSize: '10px', color: '#7c6fbf', marginTop: '4px' }}>Authorised Signatory</div>
          </div>
        </div>

        {/* Page footer */}
        <div style={{
          borderTop: '2px solid #f3f4f6', padding: '12px 40px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ fontSize: '9px', color: '#9ca3af' }}>
            {COMPANY.name} &nbsp;·&nbsp; LLP No: {COMPANY.llpNo} &nbsp;·&nbsp; PAN: {COMPANY.pan}
            {gstNumber && ` · GSTIN: ${gstNumber}`}
          </div>
          <div style={{ fontSize: '9px', color: '#9ca3af' }}>
            Receipt: {invoiceNo} &nbsp;·&nbsp; {invoiceDate.toLocaleDateString('en-IN')}
          </div>
        </div>
      </div>
      <div style={{ height: '40px' }} />
    </>
  )
}
