'use client'
import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Sparkles, User, BookOpen, Target, Brain, Zap, ChevronDown } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'

const suggestions = [
  'What course should I take next?',
  'Generate my weekly study plan',
  'Help me with digital marketing basics',
  'How can I earn more from the Earn Program?',
  'Review my progress and suggest improvements',
]

interface Msg { role: 'user' | 'ai'; content: string; ts: Date }

export default function AICoachPage() {
  const { user } = useAuthStore()
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'ai', content: `Hello ${user?.name?.split(' ')[0]}! I'm your personal AI Coach, powered by GPT-4o. I'm here to guide you through your learning journey — from course recommendations to career advice. What would you like to explore today?`, ts: new Date() }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = async (text = input) => {
    if (!text.trim() || loading) return
    const userMsg: Msg = { role: 'user', content: text, ts: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const { data } = await api.post('/users/ai-coach', { message: text })
      setMessages(prev => [...prev, { role: 'ai', content: data.reply || 'Got it! This feature is being implemented — will be available soon.', ts: new Date() }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: 'AI Coach is being configured. GPT-4o powered personalized guidance coming soon! For now, ask your question in the community.',
        ts: new Date()
      }])
    } finally { setLoading(false) }
  }

  return (
    <>
      <style>{`
        @keyframes messageIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dotBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        .msg-in { animation: messageIn 0.3s ease-out; }
        .dot-1 { animation: dotBounce 1s infinite 0ms; }
        .dot-2 { animation: dotBounce 1s infinite 150ms; }
        .dot-3 { animation: dotBounce 1s infinite 300ms; }
        @keyframes aiGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(139,92,246,0.3); }
          50% { box-shadow: 0 0 20px 4px rgba(139,92,246,0.1); }
        }
        .ai-bubble { animation: aiGlow 3s infinite; }
      `}</style>

      <div className="flex flex-col h-[calc(100vh-8rem)]">

        {/* Header */}
        <div className="flex-shrink-0 mb-4 rounded-2xl p-4 relative overflow-hidden" style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.18), rgba(99,102,241,0.12))',
          border: '1px solid rgba(139,92,246,0.3)'
        }}>
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl pointer-events-none" style={{ background: 'rgba(139,92,246,0.25)' }} />
          <div className="relative flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', boxShadow: '0 8px 25px rgba(124,58,237,0.4)' }}>
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2" style={{ borderColor: '#0d0d14' }} />
              </div>
              <div>
                <h1 className="text-xl font-black text-white flex items-center gap-2">
                  AI Coach <Sparkles className="w-4 h-4 text-yellow-400" />
                </h1>
                <p className="text-xs text-gray-400">Powered by GPT-4o • Personal RAG Mentor</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                { icon: BookOpen, label: 'Courses', color: '#818cf8' },
                { icon: Target, label: 'Goals', color: '#4ade80' },
                { icon: Brain, label: 'Study Plan', color: '#fbbf24' }
              ].map(({ icon: Icon, label, color }) => (
                <button key={label} onClick={() => sendMessage(`Help me with ${label.toLowerCase()}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105"
                  style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}>
                  <Icon className="w-3 h-3" />{label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
          {messages.map((msg, i) => (
            <div key={i} className={`msg-in flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                msg.role === 'ai'
                  ? 'text-violet-300'
                  : 'text-indigo-300'
              }`} style={{
                background: msg.role === 'ai'
                  ? 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(109,40,217,0.2))'
                  : 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(79,70,229,0.15))',
                border: `1px solid ${msg.role === 'ai' ? 'rgba(124,58,237,0.3)' : 'rgba(99,102,241,0.25)'}`
              }}>
                {msg.role === 'ai' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              {/* Bubble */}
              <div className={`max-w-[82%] ${msg.role === 'ai' ? 'ai-bubble' : ''}`}>
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'ai'
                    ? 'rounded-tl-none text-gray-200'
                    : 'rounded-tr-none text-white'
                }`} style={{
                  background: msg.role === 'ai'
                    ? 'rgba(30,20,50,0.9)'
                    : 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(79,70,229,0.2))',
                  border: msg.role === 'ai'
                    ? '1px solid rgba(139,92,246,0.2)'
                    : '1px solid rgba(99,102,241,0.3)'
                }}>
                  {msg.content}
                </div>
                <p className={`text-[10px] text-gray-600 mt-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                  {msg.ts.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-violet-300"
                style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(109,40,217,0.2))', border: '1px solid rgba(124,58,237,0.3)' }}>
                <Bot className="w-4 h-4" />
              </div>
              <div className="rounded-2xl rounded-tl-none px-5 py-4 flex gap-2 items-center"
                style={{ background: 'rgba(30,20,50,0.9)', border: '1px solid rgba(139,92,246,0.2)' }}>
                <span className="dot-1 w-2 h-2 rounded-full" style={{ background: '#a78bfa' }} />
                <span className="dot-2 w-2 h-2 rounded-full" style={{ background: '#a78bfa' }} />
                <span className="dot-3 w-2 h-2 rounded-full" style={{ background: '#a78bfa' }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {messages.length === 1 && (
          <div className="flex-shrink-0 mt-3 mb-2">
            <p className="text-xs text-gray-600 mb-2 flex items-center gap-1.5">
              <Zap className="w-3 h-3" /> Quick suggestions
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map(s => (
                <button key={s} onClick={() => sendMessage(s)}
                  className="text-xs px-3 py-2 rounded-xl transition-all hover:scale-[1.02] text-left"
                  style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.18)', color: '#c4b5fd' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.15)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.08)'}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="flex-shrink-0 flex gap-3 mt-3">
          <div className="flex-1 flex items-center gap-3 rounded-2xl px-4"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            onFocus={e => e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)'}
            onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask anything — courses, career, study plan..."
              className="flex-1 bg-transparent py-3.5 text-white placeholder-gray-500 focus:outline-none text-sm"
            />
          </div>
          <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
            className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:scale-105 disabled:opacity-40 disabled:scale-100"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', boxShadow: '0 4px 15px rgba(124,58,237,0.4)' }}>
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </>
  )
}
