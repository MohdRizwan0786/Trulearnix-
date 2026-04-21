'use client'
import { useState, useEffect } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { FileText, Download, Eye, Shield, X, ChevronRight, Scale, Lock, RefreshCw, Cookie, FileCheck, AlertCircle } from 'lucide-react'

const CATEGORY_ICONS: Record<string, any> = {
  'Privacy Policy': Lock,
  'Terms & Conditions': Scale,
  'Refund Policy': RefreshCw,
  'Cookie Policy': Cookie,
  'Disclaimer': AlertCircle,
  'User Agreement': FileCheck,
  'Default': FileText,
}

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  'Privacy Policy':    { bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.25)',  text: '#a5b4fc', glow: '#6366f1' },
  'Terms & Conditions':{ bg: 'rgba(124,58,237,0.12)',  border: 'rgba(124,58,237,0.25)',  text: '#c4b5fd', glow: '#7c3aed' },
  'Refund Policy':     { bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.25)',  text: '#6ee7b7', glow: '#10b981' },
  'Cookie Policy':     { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.25)',  text: '#fcd34d', glow: '#f59e0b' },
  'Disclaimer':        { bg: 'rgba(239,68,68,0.10)',   border: 'rgba(239,68,68,0.22)',   text: '#fca5a5', glow: '#ef4444' },
  'User Agreement':    { bg: 'rgba(217,70,239,0.12)',  border: 'rgba(217,70,239,0.25)',  text: '#f0abfc', glow: '#d946ef' },
  'Default':           { bg: 'rgba(99,102,241,0.10)',  border: 'rgba(99,102,241,0.20)',  text: '#a5b4fc', glow: '#6366f1' },
}

const DEFAULT_DOCS = [
  { title: 'Privacy Policy',     category: 'Privacy Policy',     desc: 'How we collect, use, and protect your personal information.', fileUrl: '', visible: true },
  { title: 'Terms & Conditions', category: 'Terms & Conditions', desc: 'Rules and guidelines for using the TruLearnix platform.',      fileUrl: '', visible: true },
  { title: 'Refund Policy',      category: 'Refund Policy',      desc: 'Our refund and cancellation terms for all purchases.',          fileUrl: '', visible: true },
]

export default function LegalPage() {
  const [docs, setDocs]       = useState(DEFAULT_DOCS)
  const [heading, setHeading] = useState('Legal & Compliance')
  const [subheading, setSubheading] = useState('All our policies, terms, and legal documents — transparent and accessible.')
  const [active, setActive]   = useState<any>(null)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/site-content/legal`)
      .then(r => r.json())
      .then(res => {
        if (!res.success || !res.data) return
        if (res.data.heading)    setHeading(res.data.heading)
        if (res.data.subheading) setSubheading(res.data.subheading)
        if (res.data.docs?.length) setDocs(res.data.docs.filter((d: any) => d.visible !== false))
      })
      .catch(() => {})
  }, [])

  return (
    <main className="bg-[#03040a] min-h-screen overflow-x-hidden">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative pt-28 pb-16 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[400px] rounded-full opacity-15 blur-[120px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] rounded-full opacity-10 blur-[100px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />

        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border mb-6 text-sm font-semibold"
            style={{ background: 'rgba(99,102,241,0.1)', borderColor: 'rgba(99,102,241,0.3)', color: '#a5b4fc' }}>
            <Shield className="w-3.5 h-3.5" />
            Transparency First
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-5">
            {heading.split('&').map((part, i) => i === 0
              ? <span key={i}>{part}<span style={{ background: 'linear-gradient(135deg,#a78bfa,#6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>&</span></span>
              : <span key={i}>{part}</span>
            )}
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">{subheading}</p>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #03040a)' }} />
      </section>

      {/* ── Documents Grid ── */}
      <section className="max-w-6xl mx-auto px-4 pb-24">
        {docs.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500">No documents available yet.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {docs.map((doc, i) => {
              const color = CATEGORY_COLORS[doc.category] || CATEGORY_COLORS['Default']
              const Icon  = CATEGORY_ICONS[doc.category]  || CATEGORY_ICONS['Default']
              return (
                <div key={i}
                  className="group relative rounded-3xl p-6 sm:p-7 flex flex-col gap-4 cursor-pointer transition-all duration-300 hover:-translate-y-1"
                  style={{ background: color.bg, border: `1px solid ${color.border}`, boxShadow: `0 0 0 0 ${color.glow}00` }}
                  onClick={() => doc.fileUrl && setActive(doc)}
                >
                  {/* glow on hover */}
                  <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ boxShadow: `0 8px 40px -8px ${color.glow}40` }} />

                  {/* icon */}
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color.glow}22`, border: `1px solid ${color.border}` }}>
                    <Icon className="w-5 h-5" style={{ color: color.text }} />
                  </div>

                  {/* content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-white font-black text-base leading-snug">{doc.title}</h3>
                      <ChevronRight className="w-4 h-4 flex-shrink-0 mt-0.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" style={{ color: color.text }} />
                    </div>
                    <span className="inline-block text-[10px] font-black px-2.5 py-0.5 rounded-full mb-3"
                      style={{ background: `${color.glow}22`, color: color.text, border: `1px solid ${color.border}` }}>
                      {doc.category}
                    </span>
                    <p className="text-gray-500 text-sm leading-relaxed">{doc.desc}</p>
                  </div>

                  {/* actions */}
                  <div className="flex items-center gap-2 pt-2" style={{ borderTop: `1px solid ${color.border}` }}>
                    {doc.fileUrl ? (
                      <>
                        <button
                          onClick={e => { e.stopPropagation(); setActive(doc) }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                          style={{ background: `${color.glow}22`, color: color.text }}>
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                        <a
                          href={doc.fileUrl} download target="_blank" rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                          style={{ background: `${color.glow}22`, color: color.text }}>
                          <Download className="w-3.5 h-3.5" /> Download
                        </a>
                      </>
                    ) : (
                      <span className="text-xs text-gray-600 italic">Coming soon</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Info strip */}
        <div className="mt-12 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <Shield className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <p className="text-white font-bold text-sm mb-1">Questions about our policies?</p>
            <p className="text-gray-500 text-sm">Reach out to us at{' '}
              <a href="mailto:official@trulearnix.com" className="text-indigo-400 hover:underline">official@trulearnix.com</a>
              {' '}— we respond within 24 hours.
            </p>
          </div>
        </div>
      </section>

      {/* ── PDF Viewer Modal ── */}
      {active && (
        <div className="fixed inset-0 z-50 flex flex-col"
          style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)' }}>

          {/* modal header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 flex-shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(8,10,20,0.9)' }}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: (CATEGORY_COLORS[active.category] || CATEGORY_COLORS['Default']).bg,
                         border: `1px solid ${(CATEGORY_COLORS[active.category] || CATEGORY_COLORS['Default']).border}` }}>
                {(() => { const I = CATEGORY_ICONS[active.category] || FileText; return <I className="w-4 h-4" style={{ color: (CATEGORY_COLORS[active.category] || CATEGORY_COLORS['Default']).text }} /> })()}
              </div>
              <div className="min-w-0">
                <p className="text-white font-black text-sm truncate">{active.title}</p>
                <p className="text-gray-500 text-xs">{active.category}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
              <a href={active.fileUrl} download target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-80"
                style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)' }}>
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download</span>
              </a>
              <button onClick={() => setActive(null)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* PDF iframe */}
          <div className="flex-1 overflow-hidden">
            <iframe
              src={`${active.fileUrl}#toolbar=1&navpanes=0`}
              className="w-full h-full"
              title={active.title}
            />
          </div>
        </div>
      )}

      <Footer />
    </main>
  )
}
