'use client'
import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import {
  MessageCircle, X, Send, Bot, Phone, Sparkles, Play, Loader2, ArrowUpRight
} from 'lucide-react'

const SUPPORT_PHONE = '918979616798'
const INTRO_VIDEO_ID = '7rkNye-Ennw'
const INTRO_VIDEO_URL = `https://www.youtube.com/embed/${INTRO_VIDEO_ID}`
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.trulearnix.com/api'

const HIDE_ON_PREFIXES = [
  '/login', '/register', '/forgot-password', '/maintenance',
  '/checkout', '/pay/', '/verify/',
  '/student/classes/', // live class room is full-screen
  '/manager/meeting-room/', '/mentor/meeting-room/', '/sales/meeting-room/',
]

// Routes that render a mobile sticky CTA bar at the very bottom — push the
// chat launcher up on small screens so it does not cover the Buy/Enroll button.
const STICKY_BOTTOM_CTA_PREFIXES = ['/courses/', '/packages/']

const QUICK_QUESTIONS = [
  'TruLearnix kaise kaam karta hai?',
  'Mujhe kaunsa package lena chahiye?',
  'Partner banke earning kaise hoti hai?',
  'Mentor ya Salesperson kaise ban sakta hoon?',
  'Withdrawal kaise karein?',
]

type Msg = { role: 'user' | 'assistant'; content: string }

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  // Tries common storage keys used across the app
  return (
    localStorage.getItem('accessToken') ||
    localStorage.getItem('token') ||
    null
  )
}

export default function ChatWidget() {
  const pathname = usePathname() || ''
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'home' | 'chat'>('home')
  const [showVideo, setShowVideo] = useState(false)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([{
    role: 'assistant',
    content: 'Hi! Main TruLearnix ka virtual assistant hoon. Platform, packages, courses, ya support — kuch bhi pucho. 👋',
  }])
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const shouldHide = HIDE_ON_PREFIXES.some(p => pathname.startsWith(p))
  const hasStickyCta = STICKY_BOTTOM_CTA_PREFIXES.some(p => pathname.startsWith(p))

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, busy])

  if (shouldHide) return null

  const ask = async (text: string) => {
    const message = text.trim()
    if (!message || busy) return
    setTab('chat')
    setShowVideo(false)
    const next: Msg[] = [...messages, { role: 'user', content: message }]
    setMessages(next)
    setInput('')
    setBusy(true)
    try {
      const token = getAuthToken()
      const r = await fetch(`${API_URL}/chatbot/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message,
          history: next.slice(-6).filter(m => m.role !== 'assistant' || m.content !== messages[0].content),
        }),
      })
      const data = await r.json()
      const reply = data?.reply || 'Sorry, abhi reply nahi aaya. Kripya WhatsApp pe support se baat karein.'
      setMessages(m => [...m, { role: 'assistant', content: reply }])
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Network issue. WhatsApp support: https://wa.me/' + SUPPORT_PHONE }])
    } finally {
      setBusy(false)
    }
  }

  const openWhatsApp = () => {
    const msg = encodeURIComponent('Hi TruLearnix! Mujhe support chahiye.')
    window.open(`https://wa.me/${SUPPORT_PHONE}?text=${msg}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      {/* Floating launcher */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open chat"
          className={`fixed z-[60] right-5 sm:right-6 group ${hasStickyCta ? 'bottom-24 lg:bottom-6' : 'bottom-5 sm:bottom-6'}`}
        >
          <span className="absolute inset-0 rounded-full animate-ping opacity-50"
            style={{ background: 'rgba(34,197,94,0.5)' }} />
          <span className="relative flex items-center gap-2 px-4 py-3 rounded-full text-white font-bold text-sm shadow-2xl hover:scale-105 transition-transform"
            style={{
              background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
              boxShadow: '0 12px 30px rgba(37,211,102,0.45)',
            }}>
            <MessageCircle className="w-5 h-5" />
            <span className="hidden sm:inline">Chat with us</span>
          </span>
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed z-[60] bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[380px] max-w-md flex flex-col rounded-3xl overflow-hidden shadow-2xl"
          style={{
            background: 'linear-gradient(180deg, #0f0f1c 0%, #0b0b15 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            height: 'min(620px, calc(100vh - 32px))',
            boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
          }}>
          {/* Header */}
          <div className="px-4 py-3.5 flex items-center gap-3 flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
            }}>
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-tight">TruLearnix Assistant</p>
              <p className="text-white/80 text-[11px] flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online · Replies in seconds
              </p>
            </div>
            <button onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex border-b border-white/5 flex-shrink-0">
            {[
              { id: 'home' as const, label: 'Home', icon: Sparkles },
              { id: 'chat' as const, label: 'Chat', icon: MessageCircle },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  tab === t.id ? 'text-indigo-300' : 'text-gray-500 hover:text-gray-300'
                }`}
                style={tab === t.id ? { borderBottom: '2px solid #818cf8' } : { borderBottom: '2px solid transparent' }}>
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>

          {/* Body */}
          {tab === 'home' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <p className="text-white text-base font-bold leading-snug">
                  Welcome to TruLearnix 👋
                </p>
                <p className="text-gray-400 text-xs mt-1.5 leading-relaxed">
                  Naye ho? Ye 90-second intro video dekho — platform turant samajh aa jayega.
                </p>
              </div>

              {/* Intro video */}
              <div className="rounded-2xl overflow-hidden border border-white/10"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                {showVideo ? (
                  <div className="aspect-video">
                    <iframe
                      src={`${INTRO_VIDEO_URL}?autoplay=1&rel=0&modestbranding=1`}
                      title="TruLearnix Intro"
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <button onClick={() => setShowVideo(true)}
                    className="relative w-full aspect-video group">
                    <img
                      src={`https://img.youtube.com/vi/${INTRO_VIDEO_ID}/maxresdefault.jpg`}
                      alt="TruLearnix Intro"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${INTRO_VIDEO_ID}/hqdefault.jpg` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/30 transition-colors">
                      <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}>
                        <Play className="w-6 h-6 text-white ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] text-white">
                      <span className="px-2 py-0.5 rounded bg-black/60 font-bold">Watch Intro</span>
                      <span className="px-2 py-0.5 rounded bg-black/60">~2 min</span>
                    </div>
                  </button>
                )}
              </div>

              {/* Quick actions */}
              <div className="space-y-2">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Quick questions</p>
                {QUICK_QUESTIONS.map(q => (
                  <button key={q} onClick={() => ask(q)}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs text-gray-300 hover:text-white transition-all flex items-center justify-between gap-2 group"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="flex-1 line-clamp-1">{q}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-indigo-400 flex-shrink-0" />
                  </button>
                ))}
              </div>

              {/* WhatsApp button */}
              <button onClick={openWhatsApp}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90"
                style={{
                  background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                  boxShadow: '0 8px 20px rgba(37,211,102,0.3)',
                }}>
                <Phone className="w-4 h-4" />
                Chat on WhatsApp
              </button>
              <p className="text-[10px] text-center text-gray-600">
                Direct human support 9am–9pm IST
              </p>
            </div>
          )}

          {tab === 'chat' && (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                      m.role === 'user' ? 'text-white' : 'text-gray-200'
                    }`}
                      style={m.role === 'user' ? {
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      } : {
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {busy && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl px-3.5 py-2.5 text-sm text-gray-400 flex items-center gap-2"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Thinking…
                    </div>
                  </div>
                )}
              </div>

              {/* Composer */}
              <div className="p-3 border-t border-white/5 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') ask(input) }}
                    placeholder="Apna sawal type karein…"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50"
                  />
                  <button onClick={() => ask(input)} disabled={busy || !input.trim()}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white disabled:opacity-50 transition-all hover:scale-105"
                    style={{
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
                    }}>
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
                <button onClick={openWhatsApp}
                  className="mt-2 w-full text-center text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors flex items-center justify-center gap-1">
                  <Phone className="w-3 h-3" />
                  Talk to a human on WhatsApp
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
